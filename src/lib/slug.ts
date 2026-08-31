/** Card-name ↔ URL slug. Stable and reversible enough for `/cards/[slug]`. */

/**
 * Accents are folded, not dropped.
 *
 * This is load-bearing rather than cosmetic. Stripping a diacritic to a hyphen
 * turned "Séance" into `s-ance`, which `fromSlug` handed to Scryfall as
 * "s ance" — and Scryfall answers that with *"Too many cards match ambiguous
 * name"*, a 404. The same breakage hit Lim-Dûl's Vault, Jötun Grunt and
 * Márton Stromgald. Folding first gives `seance`, which resolves.
 *
 * `normalizeName` in `./decklist` already folds the same way for decklist
 * matching; this keeps the two consistent.
 */
function fold(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u2013\u2014]/g, "-");
}

export function toSlug(name: string): string {
  return fold(name)
    .toLowerCase()
    .replace(/[',.]/g, "")
    .replace(/\s*\/\/\s*/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Slugs are lossy, so we hand the de-slugged string to Scryfall's fuzzy name
 * search rather than trying to reconstruct punctuation ourselves.
 */
export function fromSlug(slug: string): string {
  return slug.replace(/-/g, " ");
}
