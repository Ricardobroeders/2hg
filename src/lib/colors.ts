/**
 * Colour filtering for card search.
 *
 * Semantics follow Scryfall's own advanced search, which our audience already
 * knows: selecting colours means "the card includes at least these colours",
 * so each chip you add narrows the results. Colourless is a separate state
 * rather than a sixth colour — a card is colourless or it isn't, and
 * "colourless plus red" isn't a thing.
 */

export type ColorCode = "w" | "u" | "b" | "r" | "g";

export const COLORS: { code: ColorCode; label: string }[] = [
  { code: "w", label: "White" },
  { code: "u", label: "Blue" },
  { code: "b", label: "Black" },
  { code: "r", label: "Red" },
  { code: "g", label: "Green" },
];

/** The colourless chip. `c` is not a colour, so it can't combine with them. */
export const COLORLESS = "c";

const ORDER = "wubrg";

/**
 * Parse the `colors` search param into a canonical string: either "c", or
 * WUBRG-ordered colour letters, or "" for no filter. Anything else is dropped
 * rather than passed to Scryfall, so a hand-edited URL can't produce a 400.
 */
export function parseColors(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const lower = raw.toLowerCase();
  if (lower.includes(COLORLESS)) return COLORLESS;

  const picked = new Set(
    lower.split("").filter((c): c is ColorCode => ORDER.includes(c)),
  );
  return ORDER.split("").filter((c) => picked.has(c as ColorCode)).join("");
}

/** Toggle one chip, returning the next `colors` value. */
export function toggleColor(current: string, code: string): string {
  // Colourless and coloured are mutually exclusive: picking either clears
  // the other, so the filter never asks for something no card can satisfy.
  if (code === COLORLESS) return current === COLORLESS ? "" : COLORLESS;
  if (current === COLORLESS) return code;

  return current.includes(code)
    ? current.split("").filter((c) => c !== code).join("")
    : parseColors(current + code);
}

/** The Scryfall clause for a parsed `colors` value, or "" for no filter. */
export function colorQuery(colors: string): string {
  if (!colors) return "";
  if (colors === COLORLESS) return "color=colorless";
  // `>=` is "includes at least" — mono-red matches "r", and so does Rakdos.
  return `color>=${colors}`;
}
