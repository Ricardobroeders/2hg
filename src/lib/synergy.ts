/**
 * Synergy suggestions.
 *
 * The real feature is statistical: "Card X appears in N% of teams whose other
 * deck runs Card Y", computed from submitted pairings. Until we're collecting
 * decklists, we approximate it from card characteristics — same colours, same
 * 2HG axis — so the page shape and the UI are already correct when live data
 * replaces the query below.
 */

import type { ScryfallCard } from "./scryfall";
import { findCards, type CardFilter } from "./card-store";
import { scoreCard } from "./twohg-score";

/**
 * Maps a 2HG rule to the shape of cards that play alongside it. These were
 * Scryfall query strings until card data moved into our own table; each one
 * is the same search, written as a filter.
 */
const AXIS_FILTERS: Record<string, Omit<CardFilter, "identityWithin" | "limit">> = {
  "each-opponent": { oracleAny: ["each opponent"] },
  "opponent-sacrifice": { oracleAny: ["sacrifices a creature"] },
  "opponent-discard": { oracleAny: ["each opponent discards"] },
  "extra-turn": { oracleAny: ["take an extra turn"] },
  sweeper: { oracleAny: ["destroy all"] },
  "aoe-damage": { oracleAny: ["each opponent loses"] },
  fog: { oracleAny: ["prevent all combat damage"] },
  "symmetric-tax": { oracleAny: ["players can't"] },
  "team-protection": { oracleAny: ["target player"] },
  "cheap-interaction": { oracleAny: ["counter", "destroy"], maxCmc: 2 },
};

export type SynergyPick = {
  card: ScryfallCard;
  /** Why we're suggesting it, shown under the card. */
  because: string;
};

export async function synergyFor(card: ScryfallCard): Promise<SynergyPick[]> {
  const score = scoreCard(card);
  const axis = score.matched.find((m) => m.impact === "up" && AXIS_FILTERS[m.id]);

  const filter: CardFilter = {
    ...(axis ? AXIS_FILTERS[axis.id] : { excludeLands: true }),
    identityWithin: card.color_identity,
    // One spare, because the card itself is usually among the results.
    limit: 7,
  };

  /**
   * A suggestion rail is never worth a broken page, so a database error
   * degrades to no rail. The card's own content has already rendered beside it.
   */
  const cards = await findCards(filter).catch(() => []);

  const because = axis
    ? `Shares the "${axis.label.toLowerCase()}" axis`
    : "Fits the same colour identity";

  return cards
    .filter((c) => c.oracle_id !== card.oracle_id)
    .slice(0, 6)
    .map((c) => ({ card: c, because }));
}
