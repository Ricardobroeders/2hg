/**
 * Reader for the committed card-details artifact.
 *
 * SERVER ONLY, and more emphatically than the corpus beside it: this file is
 * ~4 MB. It must never be imported from a `"use client"` module, and it is
 * imported only by the card page.
 *
 * **This one is a cache, not an index** — the opposite of `./corpus`, and the
 * only place in the codebase where that is true. It exists because card pages
 * were hanging: rendering one meant two live Scryfall calls, Scryfall's
 * latency is episodic, and nothing bounded the wait. Measured 2026-09-01, cold
 * card pages took 30–90s while the same page served in 0.4s once ISR had it.
 * Reading a committed artifact instead takes ~7ms for all 5,620 cards.
 *
 * What that buys, and what it costs:
 *
 * - The whole card page shell — name, cost, type, oracle text, art, legality
 *   and the 2HG Rating — renders with **zero** network calls.
 * - Prices are deliberately absent. They move daily, so a committed price is a
 *   wrong price; the page streams them in live instead.
 * - A card whose oracle text is errata'd, or whose legality changes on a ban
 *   announcement, shows the old value until `npm run seo:corpus` reruns. That
 *   is the trade, and it is why only Scryfall-schedule fields live here.
 *
 * Cards that trip no 2HG rule are not in the corpus and so are not here
 * either. Those pages fall back to the live path — they are `noindex` and
 * essentially unlinked, so the tail stays on the slow road by design.
 */

import details from "@/data/card-details.json";
import { decodeLegalities } from "./card-legality";
import type { ScryfallCard } from "./scryfall";

export type CardDetail = {
  slug: string;
  id: string;
  oracleId: string;
  name: string;
  cost: string;
  cmc: number;
  type: string;
  oracle: string;
  colorIdentity: string[];
  keywords: string[];
  setCode: string;
  setName: string;
  rarity: string;
  collectorNumber: string;
  releasedAt: string;
  layout: string;
  uri: string;
  image: string | null;
  rank: number | null;
  legal: string;
};

const DETAILS = details.cards as CardDetail[];

const BY_SLUG = new Map(DETAILS.map((card) => [card.slug, card]));

export function cardDetail(slug: string): CardDetail | undefined {
  return BY_SLUG.get(slug);
}

/**
 * Rebuild a `ScryfallCard` from a stored detail.
 *
 * Every consumer — `scoreCard`, `CardTile`, `AddToTeam`, `AffiliateButtons`,
 * `cardImage`, `oracleText` — keeps taking a `ScryfallCard`, so nothing
 * downstream has to know the data came from disk. The fields are Scryfall's
 * own values, not stand-ins, which is why the artifact stores dull things like
 * `rarity` and `collectorNumber`: a half-populated card would be a trap for
 * whoever next reads one of these fields and finds a plausible lie.
 *
 * `prices` is the single deliberate exception. It is always empty here, and
 * `AffiliateButtons` already renders "View" rather than a figure when a price
 * is missing, so the omission degrades into an honest label rather than a
 * stale number.
 */
export function detailToCard(detail: CardDetail): ScryfallCard {
  return {
    id: detail.id,
    oracle_id: detail.oracleId,
    name: detail.name,
    lang: "en",
    released_at: detail.releasedAt,
    scryfall_uri: detail.uri,
    layout: detail.layout,
    mana_cost: detail.cost || undefined,
    cmc: detail.cmc,
    type_line: detail.type,
    // Stored already joined across faces, so `oracleText()` returns it as-is.
    oracle_text: detail.oracle,
    color_identity: detail.colorIdentity,
    keywords: detail.keywords,
    legalities: decodeLegalities(detail.legal),
    set: detail.setCode,
    set_name: detail.setName,
    collector_number: detail.collectorNumber,
    rarity: detail.rarity,
    edhrec_rank: detail.rank ?? undefined,
    image_uris: detail.image ? { normal: detail.image } : undefined,
    prices: {},
  };
}
