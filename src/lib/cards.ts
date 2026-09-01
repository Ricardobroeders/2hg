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
import { cardDetail, cardDetailByName, detailToCard } from "./card-details";

export type ResolvedCard = {
  card: ScryfallCard;
  /** `toSlug(card.name)` — the one URL this card should be served at. */
  canonicalSlug: string;
  /** True only when redirecting to `canonicalSlug` is provably terminal. */
  canRedirect: boolean;
  /**
   * Whether this came from the committed details artifact rather than the
   * network. The card page reads it to decide if it still owes the visitor a
   * live price lookup — an artifact card carries no prices by design.
   */
  fromArtifact: boolean;
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
    /**
     * The fast path, and the reason card pages stopped hanging.
     *
     * A hit here is by definition already canonical — details are keyed by
     * `toSlug(card.name)`, the same function that produces `canonicalSlug` —
     * so there is nothing to redirect to and no reason to ask Scryfall. Every
     * other slug (a lossy spelling, or a card that trips no 2HG rule and so
     * isn't in the artifact) falls through to the live path below, which still
     * owns all of the canonicalisation logic.
     */
    const detail = cardDetail(slug);
    if (detail) {
      return {
        card: detailToCard(detail),
        canonicalSlug: detail.slug,
        canRedirect: false,
        fromArtifact: true,
      };
    }

    const known = corpusCard(slug);
    const card = known
      ? await getCardByExactName(known.name)
      : await getCardByFuzzyName(fromSlug(slug));
    if (!card) return null;

    const canonicalSlug = toSlug(card.name);
    if (canonicalSlug === slug) {
      return { card, canonicalSlug, canRedirect: false, fromArtifact: false };
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

    return { card, canonicalSlug, canRedirect, fromArtifact: false };
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
 *
 * The shared pairing and deck pages go through here for a different reason.
 * They are `force-dynamic` because the *team* is a snapshot that must be
 * fresh, but the cards in it are not: oracle text and art never change. Left
 * uncached, every view of a share link re-POSTed the whole decklist to
 * Scryfall, which rate-limited us into rendering pairings with no art at all.
 * A day-long entry means a link that gets passed around costs one upstream
 * hydration, not one per visitor.
 */
export const getCardsByNamesCached = unstable_cache(
  async (names: string[]): Promise<ScryfallCard[]> => getCardsByNames(names),
  /**
   * Bump this whenever a change alters what a cached entry means. Vercel's
   * Data Cache survives deployments, so a bad entry outlives the fix for it.
   * v2 abandoned entries written while a partial hydration could be cached;
   * v3, those written while the inner POST still declared `no-store` inside
   * this cache scope and intermittently failed.
   */
  ["scryfall-cards-by-names", "v3"],
  { revalidate: 86400 },
);

/**
 * Hydrate a decklist for display, degrading instead of failing.
 *
 * Shared pairings and shared decks are the surface a teammate is *sent*, so
 * they must render something even when Scryfall won't answer. Two rules make
 * that safe:
 *
 * 1. `getCardsByNames` is all-or-nothing, so a rate-limited moment throws and
 *    `unstable_cache` stores nothing. Caching a failure is the one outcome
 *    worse than the failure, because it outlives the outage by a day.
 * 2. The fallback is the committed artifact, never a half-finished upstream
 *    read. It covers the rule-matching cards only, so the page comes back
 *    partial — but the next visitor retries Scryfall rather than inheriting
 *    this.
 */
export async function hydrateDecklist(
  names: string[],
): Promise<ScryfallCard[]> {
  try {
    return await getCardsByNamesCached(names);
  } catch (error) {
    console.error(
      `hydrateDecklist: Scryfall unavailable for ${names.length} names, falling back to the committed artifact`,
      error,
    );
    return names
      .map((name) => cardDetailByName(name))
      .filter((detail) => detail != null)
      .map(detailToCard);
  }
}
