/**
 * Is TopDeck.gg's 2HG data usable yet?
 *
 * TopDeck is the only public source that could give us *observed* team pairings
 * — two decklists and one shared result — which is the data asset this whole
 * product is built on. The API supports it. The events, as of 2026-08, do not:
 * organisers either record teams and skip decklists, or collect decklists and
 * record no teams. The intersection has been empty every time we've looked.
 *
 * So this is a probe, not an ingest. Run it every few months; the day the last
 * line prints a non-zero number, the ingest becomes worth writing.
 *
 *   node --experimental-strip-types --env-file=.env.local \
 *     scripts/topdeck-2hg-probe.ts
 *
 * Attribution: TopDeck.gg require a visible credit and link from anything that
 * uses their API. Nothing user-facing does yet, so the footer stays as it is —
 * see README. Wire the credit in the same commit as the first real ingest.
 */

export {}; // top-level await needs this file to be a module

const API = "https://topdeck.gg/api/v2/tournaments";
const KEY = process.env.TOPDECK_API_KEY;

/** Deliberately loose — organisers spell it every possible way. */
const IS_2HG = /two[\s-]?head|twin[\s-]?head|\b2hg\b|\bthg\b/i;

/** "Josh G + Sam Ahola", "Sam and Steven", "Team 9 (Jackson/Alejandro)". */
const PAIR_NAME = /\s(?:\/|\+|&|and)\s|\(.+\/.+\)/i;

/** The bulk endpoint 502s on windows much wider than a month. */
const WINDOW_DAYS = 30;
const DAYS_BACK = 400;

type Standing = {
  name?: string;
  decklist?: string | null;
  players?: { name?: string }[];
};

type Tournament = {
  TID: string;
  tournamentName: string;
  startDate?: number;
  standings?: Standing[];
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Bulk search is one of TopDeck's "heavier" endpoints and rate-limits well
 * below the documented 100/min — a handful of windows in a row is enough to
 * trip it. It tells us how long to wait, so wait exactly that long.
 */
async function search(body: Record<string, unknown>): Promise<Tournament[]> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: KEY as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) return res.json();

    const text = await res.text();
    if (res.status === 429 && attempt < 5) {
      const wait =
        (JSON.parse(text).retryAfterSeconds as number | undefined) ?? 30;
      process.stderr.write(`  rate limited, waiting ${wait}s\n`);
      await sleep((wait + 1) * 1000);
      continue;
    }
    throw new Error(`${res.status} ${text}`);
  }
}

if (!KEY) {
  console.error("TOPDECK_API_KEY is not set. Pass --env-file=.env.local");
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const span = WINDOW_DAYS * 86_400;
const found = new Map<string, Tournament>();

for (let i = 0; i < Math.ceil(DAYS_BACK / WINDOW_DAYS); i++) {
  const end = now - i * span;
  const page = await search({
    game: "Magic: The Gathering",
    format: "EDH",
    start: end - span,
    end,
    columns: ["name"],
  });
  for (const t of page) {
    if (IS_2HG.test(t.tournamentName ?? "")) found.set(t.TID, t);
  }
  process.stderr.write(`window ${i + 1}: ${found.size} 2HG events so far\n`);
}

if (found.size === 0) {
  console.log("No 2HG-named EDH events in the window.");
  process.exit(0);
}

// Re-fetch the matches with the fields that actually decide this.
const full = await search({
  TID: [...found.keys()],
  columns: ["name", "id", "decklist", "wins", "losses", "draws", "winRate"],
});

let pairsWithDecks = 0;
const rows = full
  .sort((a, b) => (a.startDate ?? 0) - (b.startDate ?? 0))
  .map((t) => {
    const st = t.standings ?? [];
    // A row is a team either because the API modelled it (players[]) or
    // because the organiser typed both names into one field.
    const isTeam = (s: Standing) =>
      (s.players?.length ?? 0) > 1 || PAIR_NAME.test(s.name ?? "");
    const both = st.filter((s) => s.decklist && isTeam(s)).length;
    pairsWithDecks += both;
    return {
      date: t.startDate
        ? new Date(t.startDate * 1000).toISOString().slice(0, 10)
        : "?",
      entrants: st.length,
      decklists: st.filter((s) => s.decklist).length,
      teams: st.filter(isTeam).length,
      usable: both,
      event: t.tournamentName.slice(0, 44),
    };
  });

console.table(rows);
console.log(
  `\n${found.size} 2HG events in ${DAYS_BACK} days.` +
    `\nStanding rows with BOTH a partner and a decklist: ${pairsWithDecks}`,
);
console.log(
  pairsWithDecks === 0
    ? "\nStill unusable. Don't write the ingest, don't add the footer credit."
    : "\nUsable rows exist — time to build the ingest and credit TopDeck.gg.",
);
