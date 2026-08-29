"use client";

import { useMemo, useState } from "react";
import { canBeCommander, type ScryfallCard } from "@/lib/scryfall";
import { parseDecklist } from "@/lib/decklist";
import { useTeam, type ImportMode } from "@/lib/team-store";
import { FORMATS, type DeckSlot } from "@/lib/team";

type ImportResult = {
  cardCount: number;
  distinct: number;
  commanders: string[];
  notFound: string[];
};

/**
 * A resolved list waiting on one answer before it lands in the team.
 *
 * Moxfield's text export doesn't mark the commander, so most pasted Commander
 * decks arrive without one. Importing 100 cards and silently dropping the card
 * the deck is built around is worse than asking.
 */
type Pending = {
  mode: ImportMode;
  deckName: string;
  entries: { name: string; quantity: number }[];
  cards: ScryfallCard[];
  /** Cards in the list that could legally head it, in the order pasted. */
  candidates: ScryfallCard[];
  /** Our best guess — exports put the commander above the mainboard. */
  suggested: string[];
  notFound: string[];
};

/**
 * A deck link is the obvious thing to paste, so people will. We can't follow
 * one: Moxfield's deck API answers server-side requests with a 403, and every
 * other site would need its own adapter. Recognising the link and showing the
 * export path beats a wall of "no card matched".
 */
const DECK_URL =
  /^https?:\/\/(www\.)?(moxfield\.com|archidekt\.com|deckstats\.net|tappedout\.net|mtggoldfish\.com|manabox\.app)\//i;

const PLACEHOLDER = `1 Atraxa, Praetors' Voice (2XM) 197 *CMDR*
1 Sol Ring
1 Arcane Signet
1x Cultivate
36 Forest`;

/** Where the list comes from, in the order people actually use these sites. */
const SOURCES = [
  ["Moxfield", "More → Export → Copy to clipboard"],
  ["Archidekt", "Deck menu → Export → Text"],
  ["MTG Arena", "Deck view → ⋯ → Export to clipboard"],
] as const;

/**
 * Paste a whole decklist into one slot.
 *
 * Lives inside the builder rather than on a page of its own: importing a list
 * is a step in building a deck, not a destination. The target slot is fixed by
 * whoever opened it, so there's no "which deck?" question to ask.
 */
export function DeckImporter({
  slot,
  onDone,
}: {
  slot: DeckSlot;
  onDone: () => void;
}) {
  const { team, importDeck } = useTeam();
  const rules = FORMATS[team.format];
  const deck = team[slot];

  const [text, setText] = useState("");
  const [mode, setMode] = useState<ImportMode>("replace");
  const [deckName, setDeckName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Parsing is local and cheap, so the preview updates as they paste. Only
  // resolution costs a round trip.
  const parsed = useMemo(() => parseDecklist(text), [text]);

  // Commander has no sideboard, so those sections are previewed but not imported.
  const importable = parsed.entries.filter(
    (e) => e.section === "main" || e.section === "commander",
  );
  const setAside = parsed.entries.length - importable.length;
  const cardCount = importable.reduce((n, e) => n + e.quantity, 0);

  // A lone URL, not a list.
  const pastedLink = !/\s/.test(text.trim()) && DECK_URL.test(text.trim());

  /** Land a resolved list in the team once its commanders are settled. */
  function commit(p: Pending, commanders: string[]) {
    importDeck(
      slot,
      {
        name: p.deckName || undefined,
        entries: p.entries,
        commanders,
        cards: p.cards,
      },
      p.mode,
    );

    setResult({
      cardCount: p.entries.reduce((n, e) => n + e.quantity, 0),
      distinct: p.entries.length,
      commanders,
      notFound: p.notFound,
    });
    setPending(null);
    setText("");
    setDeckName("");
  }

  async function runImport() {
    if (importable.length === 0) return;
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          names: [...new Set(importable.map((e) => e.name))],
        }),
      });

      const json = (await res.json()) as {
        resolved?: Record<string, ScryfallCard>;
        notFound?: string[];
        error?: string;
      };

      if (!res.ok) {
        setError(json.error ?? "Import failed. Try again in a moment.");
        return;
      }

      const resolved = json.resolved ?? {};

      // Collapse to canonical names — two spellings of the same card, or the
      // same card listed once per printing, become one entry.
      const quantities = new Map<string, number>();
      const commanders = new Set<string>();
      const seen = new Map<string, ScryfallCard>();

      for (const entry of importable) {
        const card = resolved[entry.name];
        if (!card) continue;
        quantities.set(
          card.name,
          (quantities.get(card.name) ?? 0) + entry.quantity,
        );
        seen.set(card.name, card);
        if (entry.section === "commander") commanders.add(card.name);
      }

      if (quantities.size === 0) {
        setError("None of those lines matched a real card.");
        return;
      }

      const entries = [...quantities.entries()].map(([name, quantity]) => ({
        name,
        quantity,
      }));

      // Paste order, deduped — exporters write the commander above the
      // alphabetised mainboard, so the leading eligible cards are the guess.
      const ordered: ScryfallCard[] = [];
      for (const entry of importable) {
        const card = resolved[entry.name];
        if (card && !ordered.some((c) => c.name === card.name)) {
          ordered.push(card);
        }
      }

      const candidates = ordered.filter(canBeCommander);
      const suggested: string[] = [];
      for (const card of ordered) {
        // Stop at the first non-commander; two is the Partner/Background cap.
        if (!canBeCommander(card) || suggested.length >= 2) break;
        suggested.push(card.name);
      }

      const payload: Pending = {
        mode,
        deckName: deckName.trim(),
        entries,
        cards: [...seen.values()],
        candidates,
        suggested,
        notFound: json.notFound ?? [],
      };

      // A *CMDR* tag settles it. Constructed has no commanders, and a list with
      // no eligible card can't have one either — only ask when it's a real question.
      if (
        commanders.size > 0 ||
        candidates.length === 0 ||
        team.format !== "commander"
      ) {
        commit(payload, [...commanders]);
      } else {
        setPending(payload);
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and retry.");
    } finally {
      setBusy(false);
    }
  }

  if (pending) {
    return (
      <PickCommanders
        pending={pending}
        onConfirm={(names) => commit(pending, names)}
        onSkip={() => commit(pending, [])}
      />
    );
  }

  if (result) {
    return (
      <div>
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-5">
          <p className="font-semibold text-white">
            <span className="tabular-nums">{result.cardCount}</span> cards
            imported into Deck {slot.toUpperCase()}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            <span className="tabular-nums">{result.distinct}</span> distinct
            cards
            {result.commanders.length > 0 && (
              <> · commanding {result.commanders.join(" and ")}</>
            )}
          </p>
        </div>

        {result.notFound.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
            <p className="text-sm font-medium text-amber-300">
              {result.notFound.length} line
              {result.notFound.length === 1 ? "" : "s"} didn&apos;t match a card
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
              {result.notFound.join(", ")}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg bg-emerald-400 px-4 py-2.5 font-medium text-zinc-950 transition hover:bg-emerald-300"
          >
            Back to the deck
          </button>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="rounded-lg px-4 py-2.5 text-zinc-300 ring-1 ring-inset ring-white/15 transition hover:bg-white/5 hover:text-white"
          >
            Paste another list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        {/* Only a question when there's something to lose. An empty deck has
            no difference between replacing and adding. */}
        {deck.entries.length > 0 && (
          <fieldset>
            <legend className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Deck {slot.toUpperCase()} has {deck.entries.length} cards
            </legend>
            <div className="mt-2 flex rounded-lg ring-1 ring-inset ring-white/15">
              {(
                [
                  ["replace", "Replace them"],
                  ["merge", "Add to them"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  aria-pressed={mode === value}
                  className={`px-4 py-2 text-sm transition first:rounded-l-lg last:rounded-r-lg ${
                    mode === value
                      ? "bg-white/10 font-medium text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <label className="min-w-[12rem] flex-1">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Deck name <span className="normal-case opacity-60">(optional)</span>
          </span>
          <input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder={deck.name}
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-400/50"
          />
        </label>
      </div>

      <div>
        <label
          htmlFor="decklist"
          className="text-xs font-medium uppercase tracking-wider text-zinc-500"
        >
          Paste your decklist
        </label>
        <textarea
          id="decklist"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          rows={12}
          placeholder={PLACEHOLDER}
          className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-white/[0.03] p-4 font-mono text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-emerald-400/50"
        />
      </div>

      {pastedLink && (
        <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.06] p-4 text-sm">
          <p className="font-medium text-sky-200">
            That&apos;s a deck link, not a decklist.
          </p>
          <p className="mt-1.5 leading-relaxed text-sky-100/70">
            Deck sites block us from reading a link directly, so paste the list
            itself: on Moxfield open the deck, then{" "}
            <span className="text-sky-100">
              More → Export → Copy to clipboard
            </span>
            , and paste that here. Archidekt and Deckstats have the same option
            under Export.
          </p>
        </div>
      )}

      {text.trim() && !pastedLink && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
          <p className="text-zinc-300">
            <span className="font-semibold tabular-nums text-emerald-400">
              {cardCount}
            </span>{" "}
            cards read from {importable.length} line
            {importable.length === 1 ? "" : "s"}
            {cardCount > 0 && cardCount < rules.minDeckSize && (
              <span className="text-zinc-500">
                {" "}
                · {rules.label} wants {rules.minDeckSize}
              </span>
            )}
          </p>

          {setAside > 0 && (
            <p className="mt-1.5 text-xs text-zinc-500">
              {setAside} sideboard/maybeboard line
              {setAside === 1 ? "" : "s"} skipped — 2HG Commander has no
              sideboard.
            </p>
          )}

          {parsed.ignored.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-amber-300/80 hover:text-amber-300">
                {parsed.ignored.length} line
                {parsed.ignored.length === 1 ? "" : "s"} couldn&apos;t be read
              </summary>
              <ul className="mt-2 space-y-1 font-mono text-xs text-zinc-500">
                {parsed.ignored.slice(0, 8).map((l) => (
                  <li key={l.lineNumber}>
                    <span className="text-zinc-700">{l.lineNumber}:</span>{" "}
                    {l.line}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {!text.trim() && (
        <dl className="grid gap-x-6 gap-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs sm:grid-cols-3">
          {SOURCES.map(([name, how]) => (
            <div key={name}>
              <dt className="font-medium text-zinc-300">{name}</dt>
              <dd className="mt-0.5 leading-relaxed text-zinc-500">{how}</dd>
            </div>
          ))}
        </dl>
      )}

      {error && (
        <p className="rounded-lg border border-rose-400/25 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runImport}
          disabled={busy || pastedLink || importable.length === 0}
          className="rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
        >
          {busy ? "Looking up cards…" : `Import into Deck ${slot.toUpperCase()}`}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg px-4 py-2.5 text-sm text-zinc-400 transition hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * The one question a pasted list can't answer for itself.
 *
 * Only Moxfield's *CMDR* export marks the commander; the plain text export
 * everyone actually copies doesn't. Rather than guess silently, we guess out
 * loud — preselecting the cards written above the mainboard — and let it be
 * corrected in one click.
 */
function PickCommanders({
  pending,
  onConfirm,
  onSkip,
}: {
  pending: Pending;
  onConfirm: (commanders: string[]) => void;
  onSkip: () => void;
}) {
  const [picked, setPicked] = useState<string[]>(pending.suggested);

  function toggle(name: string) {
    setPicked((current) => {
      if (current.includes(name)) return current.filter((n) => n !== name);
      // Two is the cap: Partner and Background decks run a pair.
      if (current.length >= 2) return current;
      return [...current, name];
    });
  }

  return (
    <div>
      <h3 className="font-semibold text-white">Which card is the commander?</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
        That export didn&apos;t say — Moxfield only tags the commander when you
        pick the annotated export. We found{" "}
        <span className="tabular-nums text-zinc-300">
          {pending.candidates.length}
        </span>{" "}
        card{pending.candidates.length === 1 ? "" : "s"} in the list that could
        lead it, and preselected the one
        {pending.suggested.length === 1 ? "" : "s"} written above the deck.
      </p>

      <ul className="mt-5 flex max-h-64 flex-wrap gap-2 overflow-y-auto">
        {pending.candidates.map((card) => {
          const on = picked.includes(card.name);
          return (
            <li key={card.name}>
              <button
                type="button"
                onClick={() => toggle(card.name)}
                aria-pressed={on}
                className={`rounded-lg px-3 py-2 text-left text-sm ring-1 ring-inset transition ${
                  on
                    ? "bg-emerald-400/15 text-white ring-emerald-400/40"
                    : "text-zinc-400 ring-white/15 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="block font-medium">{card.name}</span>
                <span className="block text-xs opacity-60">
                  {card.type_line}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-zinc-500">
        Up to two — Partner and Background decks run a pair.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          onClick={() => onConfirm(picked)}
          disabled={picked.length === 0}
          className="rounded-lg bg-emerald-400 px-4 py-2.5 font-medium text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
        >
          {picked.length === 2
            ? "Import with these commanders"
            : "Import with this commander"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg px-4 py-2.5 text-zinc-400 ring-1 ring-inset ring-white/15 transition hover:bg-white/5 hover:text-white"
        >
          Import without one
        </button>
      </div>
    </div>
  );
}
