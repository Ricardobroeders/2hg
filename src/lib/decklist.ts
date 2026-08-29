/**
 * Decklist parsing.
 *
 * We don't rebuild Moxfield — we accept what it exports. People arrive with a
 * list already built somewhere else, so the importer has to tolerate every
 * common export shape without asking them to clean it up first:
 *
 *   4 Lightning Bolt
 *   4x Lightning Bolt
 *   1 Atraxa, Praetors' Voice (2XM) 197 *CMDR*      (Moxfield)
 *   1x Sol Ring (c21) 263 [Ramp]                    (Archidekt)
 *   4 Lightning Bolt (M10) 146                      (MTGA / MTGO)
 *
 * Parsing is deliberately permissive and never throws: anything we can't read
 * comes back in `ignored` so the UI can show it rather than silently dropping
 * cards from someone's deck.
 */

export type DeckSection = "main" | "commander" | "sideboard" | "maybeboard";

export type ParsedEntry = {
  quantity: number;
  /** Name as written, cleaned of set codes and tags. Not yet canonical. */
  name: string;
  section: DeckSection;
  lineNumber: number;
};

export type IgnoredLine = {
  line: string;
  lineNumber: number;
  reason: string;
};

export type ParsedDecklist = {
  entries: ParsedEntry[];
  ignored: IgnoredLine[];
  /** Distinct names across every section, ready for resolution. */
  names: string[];
};

/** Section headers, as the various exporters spell them. */
const SECTION_HEADERS: [RegExp, DeckSection][] = [
  [/^(deck|mainboard|main deck|main)$/i, "main"],
  [/^(commanders?|cmdr)$/i, "commander"],
  [/^(sideboard|side)$/i, "sideboard"],
  [/^(maybeboard|maybe|considering)$/i, "maybeboard"],
];

/**
 * Lines that are structural rather than cards. `About`/`Name` head Arena
 * exports; `Companion` and `Tokens` are sections we don't import.
 */
const SKIP_HEADERS = /^(about|name|companion|tokens?|planes?|schemes?)$/i;

function matchSection(line: string): DeckSection | null {
  // "Deck (100)", "Sideboard:", "Commander (1)" all appear in the wild.
  const bare = line
    .replace(/[:\uff1a]\s*$/, "")
    .replace(/\s*\(\d+\)\s*$/, "")
    .trim();

  for (const [pattern, section] of SECTION_HEADERS) {
    if (pattern.test(bare)) return section;
  }
  return null;
}

/**
 * Strip exporter annotations from the tail of a line, returning the bare card
 * name and whether it was tagged as a commander.
 */
function cleanName(raw: string): { name: string; isCommander: boolean } {
  let name = raw;
  let isCommander = false;

  // Archidekt colour tags: ^Buy,#ff0000^
  name = name.replace(/\^[^^]*\^/g, " ");

  // Moxfield markers: *CMDR*, *F* (foil), *E* (etched).
  name = name.replace(/\*([^*]*)\*/g, (_, flag: string) => {
    if (/^(cmdr|commander)$/i.test(flag.trim())) isCommander = true;
    return " ";
  });

  // Moxfield category tags trail the line: "Sol Ring #Ramp". No card name
  // contains '#', so everything from the first one is annotation.
  name = name.replace(/\s+#.*$/, "");

  // Bracketed tails: [Ramp], [LTC], [Ramp,Artifacts].
  name = name.replace(/\s*\[[^\]]*\]\s*$/g, " ");

  // Multi-face cards: keep the front face only. Scryfall's bulk collection
  // lookup rejects the joined form — "Fire // Ice" and "Birgi, God of
  // Storytelling // Harnfel, Horn of Bounty" both come back not_found, while
  // "Fire" and "Birgi, God of Storytelling" resolve to the same card. Exports
  // write the join with one slash or two, so accept either.
  name = name.replace(/\s+\/{1,2}\s+.*$/, "");

  // "(SET) 123" or "(SET)". Collector numbers can carry a letter suffix
  // ("123a", "★"), so allow a loose token after the set code.
  name = name.replace(/\s*\(([A-Za-z0-9]{2,6})\)(\s+[\w★-]+)?\s*$/, " ");

  return { name: name.replace(/\s+/g, " ").trim(), isCommander };
}

const QUANTITY = /^(\d{1,3})\s*[xX]?\s+(?=\S)/;

export function parseDecklist(input: string): ParsedDecklist {
  const entries: ParsedEntry[] = [];
  const ignored: IgnoredLine[] = [];
  let section: DeckSection = "main";

  const lines = input.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i].trim();

    if (!line) continue;

    // Comments. A leading '//' only — card names use " // " between faces.
    if (line.startsWith("//") || line.startsWith("#")) continue;

    const nextSection = matchSection(line);
    if (nextSection) {
      section = nextSection;
      continue;
    }

    if (SKIP_HEADERS.test(line.replace(/[:\uff1a]\s*$/, "").trim())) continue;

    const qtyMatch = line.match(QUANTITY);
    const quantity = qtyMatch ? Number(qtyMatch[1]) : 1;
    const rest = qtyMatch ? line.slice(qtyMatch[0].length) : line;

    const { name, isCommander } = cleanName(rest);

    if (!name) {
      ignored.push({ line, lineNumber, reason: "No card name found" });
      continue;
    }

    // A bare number, or a line that cleaned down to punctuation, isn't a card.
    if (!/[a-z]/i.test(name)) {
      ignored.push({ line, lineNumber, reason: "Not a card name" });
      continue;
    }

    if (quantity < 1) {
      ignored.push({ line, lineNumber, reason: "Quantity is zero" });
      continue;
    }

    entries.push({
      quantity,
      name,
      section: isCommander ? "commander" : section,
      lineNumber,
    });
  }

  const names = [...new Set(entries.map((e) => e.name))];
  return { entries, ignored, names };
}

/**
 * Loose key for matching a written name against Scryfall's canonical one.
 * Handles smart quotes, accents, and lists that give only a double-faced
 * card's front face.
 *
 * Split on a single slash, not "//": Scryfall writes both faces as
 * "Birgi, God of Storytelling // Harnfel, Horn of Bounty", but exports in the
 * wild drop a half and write one slash. Keying on the front face alone matches
 * every spelling of the same card.
 */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .split("/")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/** Merge duplicate lines — some exports list a card once per printing. */
export function mergeEntries(
  entries: { name: string; quantity: number }[],
): { name: string; quantity: number }[] {
  const merged = new Map<string, number>();
  for (const e of entries) {
    merged.set(e.name, (merged.get(e.name) ?? 0) + e.quantity);
  }
  return [...merged.entries()].map(([name, quantity]) => ({ name, quantity }));
}
