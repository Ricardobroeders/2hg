/**
 * Synergy suggestions.
 *
 * The real feature is statistical: "Card X appears in N% of teams whose other
 * deck runs Card Y", computed from submitted pairings. Until we're collecting
 * decklists, we approximate it from card characteristics — same colours, same
 * 2HG axis — so the page shape and the UI are already correct when live data
 * replaces the query below.
 */

import { searchCards, type ScryfallCard } from "./scryfall";
import { scoreCard } from "./twohg-score";

/** Maps a 2HG rule to the Scryfall shape of cards that play alongside it. */
const AXIS_QUERIES: Record<string, string> = {
  "each-opponent": 'oracle:"each opponent"',
  "opponent-sacrifice": 'oracle:"sacrifices a creature"',
  "opponent-discard": 'oracle:"each opponent discards"',
  "extra-turn": 'oracle:"take an extra turn"',
  sweeper: 'oracle:"destroy all"',
  "aoe-damage": 'oracle:"each opponent loses"',
  fog: 'oracle:"prevent all combat damage"',
  "symmetric-tax": 'oracle:"players can\'t"',
  "team-protection": 'oracle:"target player"',
  "cheap-interaction": "cmc<=2 (o:counter or o:destroy)",
};

export type SynergyPick = {
  card: ScryfallCard;
  /** Why we're suggesting it, shown under the card. */
  because: string;
};

export async function synergyFor(card: ScryfallCard): Promise<SynergyPick[]> {
  const score = scoreCard(card);
  const axis = score.matched.find((m) => m.impact === "up" && AXIS_QUERIES[m.id]);

  const identity = card.color_identity.length
    ? `id<=${card.color_identity.join("")}`
    : "id<=c";

  const query = axis
    ? `${AXIS_QUERIES[axis.id]} ${identity} -name:"${card.name}" legal:commander`
    : `${identity} -name:"${card.name}" legal:commander -type:land`;

  const { cards } = await searchCards(query, { order: "edhrec" });

  const because = axis
    ? `Shares the "${axis.label.toLowerCase()}" axis`
    : "Fits the same colour identity";

  return cards.slice(0, 6).map((c) => ({ card: c, because }));
}
