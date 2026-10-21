import { cache } from "react";
import type { ScryfallCard } from "./scryfall";
import { cardDetailByName } from "./card-details";
import { detailToCard } from "./card-record";
import { cardBySlug, cardNearSlug, cardsByNames } from "./card-store";

export type ResolvedCard = {
  card: ScryfallCard;
  /** `toSlug(card.name)` — the one URL this card should be served at. */
  canonicalSlug: string;
  /** True when the requested slug wasn't canonical and should 308 there. */
  canRedirect: boolean;
};

/**
 * Resolve a `/cards/[slug]` slug to a card.
 *
 * Wrapped in `cache()` so `generateMetadata` and the page body share one
 * lookup per render.
 *
 * Exact slug first; the trigram search is only for slugs that match nothing.
 * Redirecting from a near match is safe now in a way it wasn't when this went
 * to Scryfall's fuzzy search: slugs are unique in the `cards` table, so the
 * canonical slug always resolves straight back to the same card by the exact
 * path above, and a 308 can never bounce.
 */
export const resolveCardBySlug = cache(
  async (slug: string): Promise<ResolvedCard | null> => {
    const exact = await cardBySlug(slug);
    if (exact) {
      return { card: detailToCard(exact), canonicalSlug: exact.slug, canRedirect: false };
    }

    const near = await cardNearSlug(slug);
    if (!near) return null;
    return {
      card: detailToCard(near),
      canonicalSlug: near.slug,
      canRedirect: near.slug !== slug,
    };
  },
);

/**
 * Hydrate a decklist for display, degrading instead of failing.
 *
 * Shared pairings and shared decks are the surface a teammate is *sent*, so
 * they must render something even when the database won't answer. The
 * fallback is the committed artifact: it covers only the rule-matching cards,
 * so the page comes back partial, but with art where it can.
 *
 * Not cached on top. These pages already query the database on every view for
 * the team itself, so the card lookup rides the same awake compute — a cache
 * here would add ISR writes to save a few milliseconds.
 */
export async function hydrateDecklist(
  names: string[],
): Promise<ScryfallCard[]> {
  try {
    return await cardsByNames(names);
  } catch (error) {
    console.error(
      `hydrateDecklist: database unavailable for ${names.length} names, falling back to the committed artifact`,
      error,
    );
    return names
      .map((name) => cardDetailByName(name))
      .filter((detail) => detail != null)
      .map(detailToCard);
  }
}
