import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  getCardByExactName,
  getCardByFuzzyName,
  getCardsByNames,
  type ScryfallCard,
} from "./scryfall";
import { fromSlug, toSlug } from "./slug";
import { corpusCard } from "./corpus";

export type ResolvedCard = {
  card: ScryfallCard;
  /** `toSlug(card.name)` — the one URL this card should be served at. */
  canonicalSlug: string;
  /** True only when redirecting to `canonicalSlug` is provably terminal. */
  canRedirect: boolean;
};

/**
 * Resolve a `/cards/[slug]` slug to a card.
 *
 * Wrapped in `cache()` so `generateMetadata` and the page body share one
 * resolution per request rather than repeating the work either side of the
 * fetch cache.
 *
 * Known cards resolve by **exact** name from the corpus. Fuzzy is a fallback,
 * not the default: de-punctuated short names are genuinely ambiguous to
 * Scryfall, which answers "Too many cards match" with a 404.
 */
export const resolveCardBySlug = cache(
  async (slug: string): Promise<ResolvedCard | null> => {
    const known = corpusCard(slug);
    const card = known
      ? await getCardByExactName(known.name)
      : await getCardByFuzzyName(fromSlug(slug));
    if (!card) return null;

    const canonicalSlug = toSlug(card.name);
    if (canonicalSlug === slug) {
      return { card, canonicalSlug, canRedirect: false };
    }

    /**
     * Redirect only when the destination provably resolves back to *this* card.
     *
     * Slugs are lossy in both directions, so a naive "slug differs, therefore
     * redirect" can bounce a crawler between two 308s forever — and Google
     * reads a redirect loop as a dead page. A corpus slug is safe by
     * construction: it resolves by exact name, and the corpus builder fails the
     * build on any slug shared by two cards. Anything else keeps the canonical
     * tag and stays put, which consolidates without the risk.
     */
    const destination = corpusCard(canonicalSlug);
    const canRedirect = destination?.name === card.name;

    return { card, canonicalSlug, canRedirect };
  },
);

/**
 * Cached bulk hydration by name.
 *
 * `getCardsByNames` POSTs to Scryfall's collection endpoint, and Next's data
 * cache doesn't cache POSTs — hence the `cache: "no-store"` in the client,
 * which is honest about what was already happening but also opts any page that
 * calls it out of static generation. The rule hubs are 18 fixed pages built
 * from a committed corpus; there is no reason for them to be dynamic. Caching
 * at the function level rather than the fetch level gets them back.
 */
export const getCardsByNamesCached = unstable_cache(
  async (names: string[]): Promise<ScryfallCard[]> => getCardsByNames(names),
  ["scryfall-cards-by-names"],
  { revalidate: 86400 },
);
