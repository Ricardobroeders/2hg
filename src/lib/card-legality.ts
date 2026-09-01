/**
 * The legality codec shared by the card-details artifact's builder and reader.
 *
 * Lives in its own module, with no data import, precisely so
 * `scripts/build-card-corpus.ts` can use it while *generating*
 * `card-details.json` — importing `./card-details` there would mean depending
 * on the file being written.
 */

/** The formats a card page prints, in the order it prints them. */
export const LEGALITY_FORMATS = [
  "standard",
  "pioneer",
  "modern",
  "legacy",
  "vintage",
  "commander",
] as const;

export type Legality = "legal" | "not_legal" | "restricted" | "banned";

/**
 * One character per format instead of Scryfall's full
 * `{"standard":"not_legal",...}` object: ~6 bytes per card rather than ~140,
 * which is 700 KB across the corpus for byte-identical output.
 */
export const LEGALITY_CODE: Record<string, string> = {
  legal: "l",
  not_legal: "n",
  banned: "b",
  restricted: "r",
};

const LEGALITY_NAME: Record<string, Legality> = {
  l: "legal",
  n: "not_legal",
  b: "banned",
  r: "restricted",
};

/** Expand the stored code string back into Scryfall's own shape. */
export function decodeLegalities(code: string): Record<string, Legality> {
  const out: Record<string, Legality> = {};
  LEGALITY_FORMATS.forEach((format, i) => {
    out[format] = LEGALITY_NAME[code[i]] ?? "not_legal";
  });
  return out;
}
