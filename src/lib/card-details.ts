/**
 * Reader for the committed card-details artifact.
 *
 * SERVER ONLY, and more emphatically than the corpus beside it: this file is
 * ~4 MB. It must never be imported from a `"use client"` module.
 *
 * **Demoted to a fallback on 2026-10-21.** Card data now lives in the `cards`
 * table, loaded daily from Scryfall's bulk file — see `./card-store`. This
 * artifact still serves two jobs there:
 *
 * - The site keeps building and running with no `DATABASE_URL` (a fresh
 *   clone, a preview without a branch database). Card pages for the ~5,600
 *   rule-matching cards still render; the long tail 404s.
 * - A database error degrades a shared pairing to partial art rather than to
 *   bare names. See `hydrateDecklist` in `./cards`.
 *
 * It covers only the cards that trip a 2HG rule, so anything served from here
 * is partial by construction. Rebuilt by `npm run seo:corpus`.
 */

import details from "@/data/card-details.json";
import type { CardDetail } from "./card-record";

export type { CardDetail } from "./card-record";
export { detailToCard } from "./card-record";

const DETAILS = details.cards as CardDetail[];

const BY_SLUG = new Map(DETAILS.map((card) => [card.slug, card]));

export function cardDetail(slug: string): CardDetail | undefined {
  return BY_SLUG.get(slug);
}

const BY_NAME = new Map(DETAILS.map((card) => [card.name, card]));

/**
 * Look a card up by its canonical Scryfall name — the join key everywhere
 * decks are concerned, since a decklist stores names and never ids.
 *
 * This is the fallback the shared pairing pages use when the database will
 * not answer. It covers only the ~18% of Commander-legal cards that trip a 2HG
 * rule, so a decklist hydrated this way is partial by construction; it exists
 * so an outage costs a visitor some art rather than all of it.
 */
export function cardDetailByName(name: string): CardDetail | undefined {
  return BY_NAME.get(name);
}

/** Every artifact card, for the in-memory search `./card-store` falls back to. */
export function allCardDetails(): readonly CardDetail[] {
  return DETAILS;
}
