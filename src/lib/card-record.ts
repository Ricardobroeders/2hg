/**
 * The stored shape of a card, and the two conversions either side of it.
 *
 * One record, three homes: the `cards` table in Neon (every card, refreshed
 * daily by `scripts/import-cards.ts`), the committed `card-details.json`
 * artifact (the rule-matching slice, kept as the no-database fallback), and the
 * `ScryfallCard` every component consumes. Keeping the conversions here — in a
 * module with no data import — is what lets the import script, the corpus
 * builder and the site all agree on it without any of them pulling in a 4 MB
 * JSON file they don't need.
 */

import { oracleText, type ScryfallCard } from "./scryfall";
import { normalizeName } from "./decklist";
import { toSlug } from "./slug";
import {
  LEGALITY_CODE,
  LEGALITY_FORMATS,
  decodeLegalities,
} from "./card-legality";

/**
 * Everything a card page needs to render without calling Scryfall.
 *
 * Only fields that change on Scryfall's schedule (errata, ban announcements, a
 * new printing) belong here. Prices deliberately do not — they move daily, and
 * card pages are cached for months, so a stored price would be a wrong price.
 * The browser fetches them live from Scryfall instead.
 */
export type CardDetail = {
  slug: string;
  id: string;
  oracleId: string;
  name: string;
  /** `mana_cost`; empty for lands and for the top level of a transform card. */
  cost: string;
  cmc: number;
  type: string;
  /** Already joined across faces exactly as `oracleText()` joins them. */
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
  /**
   * The `normal` image, stored rather than derived from the card id.
   *
   * Scryfall's CDN path can be reconstructed from the id, but that scheme is
   * not part of their documented API, and a silent change to it would break
   * every image on the site at once. One URL per card is ~4 MB across all of
   * them; the other sizes are derived from it by `imageSizes`.
   */
  image: string | null;
  rank: number | null;
  /** One character per `LEGALITY_FORMATS` entry. See `LEGALITY_CODE`. */
  legal: string;
};

/** Layouts that aren't cards anyone would have a page for. */
export const SKIP_LAYOUTS = new Set([
  "token",
  "double_faced_token",
  "emblem",
  "art_series",
  "vanguard",
  "scheme",
  "planar",
  "augment",
  "host",
  "reversible_card",
]);

/**
 * Whether a bulk-file card gets a row at all — a real, paper, playable card.
 *
 * Deliberately not limited to Commander: Constructed is a supported format,
 * and a decklist for it can name cards Commander bans.
 *
 * `digital` is not the test it looks like. The bulk file carries one printing
 * per card, and for ~1,060 real paper cards — every original dual land, Lion's
 * Eye Diamond, most of the Reserved List — the printing it picks is an MTGO
 * set like Vintage Masters. Filtering on `digital` dropped all of them, and 19
 * cards already saved in pairings with it. What actually marks a card that
 * doesn't exist on paper (Arena's Alchemy rebalances) is that it has no paper
 * legality at all, and Vintage is the format every paper card has a status in.
 */
export function isPlayableCard(card: ScryfallCard): boolean {
  if (SKIP_LAYOUTS.has(card.layout)) return false;
  if (!card.type_line) return false;
  if (
    (card as { digital?: boolean }).digital &&
    (card.legalities?.vintage ?? "not_legal") === "not_legal"
  ) {
    return false;
  }
  return toSlug(card.name) !== "";
}

export function detailFor(card: ScryfallCard, slug = toSlug(card.name)): CardDetail {
  return {
    slug,
    id: card.id,
    oracleId: card.oracle_id,
    name: card.name,
    cost: card.mana_cost ?? "",
    cmc: card.cmc,
    type: card.type_line,
    oracle: oracleText(card),
    colorIdentity: card.color_identity,
    keywords: card.keywords,
    setCode: card.set,
    setName: card.set_name,
    rarity: card.rarity,
    collectorNumber: card.collector_number,
    releasedAt: card.released_at,
    layout: card.layout,
    uri: card.scryfall_uri,
    image:
      card.image_uris?.normal ??
      card.card_faces?.[0]?.image_uris?.normal ??
      null,
    rank: card.edhrec_rank ?? null,
    legal: LEGALITY_FORMATS.map(
      (f) => LEGALITY_CODE[card.legalities?.[f] ?? "not_legal"] ?? "n",
    ).join(""),
  };
}

/**
 * Which of two cards keeps a contested slug.
 *
 * Across every playable card, ~45 slugs are claimed twice — almost all Un-set
 * and playtest variants sharing one name ("Everythingamajig" six times), plus
 * pairs like "Rampant Growth" and the joke card "Rampant, Growth". The real,
 * played card has to win, so: Commander-legal first, then most played, then
 * the exact name the slug was made from.
 */
export function prefersForSlug(a: CardDetail, b: CardDetail): boolean {
  const legalA = a.legal[LEGALITY_FORMATS.indexOf("commander")] === "l";
  const legalB = b.legal[LEGALITY_FORMATS.indexOf("commander")] === "l";
  if (legalA !== legalB) return legalA;
  const rankA = a.rank ?? Infinity;
  const rankB = b.rank ?? Infinity;
  if (rankA !== rankB) return rankA < rankB;
  return a.name.localeCompare(b.name) <= 0;
}

/** The loose key decklist names are matched on. See `normalizeName`. */
export function lookupKey(name: string): string {
  return normalizeName(name);
}

/**
 * Every size we render, from the one URL we store.
 *
 * Swaps the size segment of a URL Scryfall gave us rather than building one
 * from the card id — the path segment is the only part assumed, and if it ever
 * doesn't match, the other sizes are simply absent and `cardImage` callers
 * already handle a missing image.
 */
export function imageSizes(normal: string | null): ScryfallCard["image_uris"] {
  if (!normal) return undefined;
  if (!normal.includes("/normal/")) return { normal };
  return {
    normal,
    small: normal.replace("/normal/", "/small/"),
    large: normal.replace("/normal/", "/large/"),
  };
}

/**
 * Rebuild a `ScryfallCard` from a stored detail.
 *
 * Every consumer — `scoreCard`, `CardTile`, `AddToTeam`, `AffiliateButtons`,
 * `cardImage`, `oracleText` — keeps taking a `ScryfallCard`, so nothing
 * downstream has to know the data came from Postgres or disk. The fields are
 * Scryfall's own values, not stand-ins, which is why the record stores dull
 * things like `rarity` and `collectorNumber`: a half-populated card would be a
 * trap for whoever next reads one of these fields and finds a plausible lie.
 *
 * `prices` is the single deliberate exception. It is always empty here, and
 * `AffiliateButtons` renders "View" rather than a figure when a price is
 * missing, so the omission degrades into an honest label rather than a stale
 * number until the browser fills it in.
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
    image_uris: imageSizes(detail.image),
    prices: {},
  };
}
