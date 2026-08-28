/** Card-name ↔ URL slug. Stable and reversible enough for `/cards/[slug]`. */

export function toSlug(name: string): string {
  return name
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
