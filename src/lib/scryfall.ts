/**
 * Scryfall's card shape and the pure helpers that read it.
 *
 * No network code lives here, on purpose. Server renders never call Scryfall
 * any more — card data comes from our own `cards` table, loaded daily from
 * Scryfall's bulk file (`./card-store`, `scripts/import-cards.ts`). The calls
 * that remain run in the visitor's browser and live in `./scryfall-browser`.
 * This file is imported from both sides, so it must stay free of either.
 */

export type ScryfallImageUris = {
  small?: string;
  normal?: string;
  large?: string;
  art_crop?: string;
  border_crop?: string;
  png?: string;
};

export type ScryfallCardFace = {
  name: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  image_uris?: ScryfallImageUris;
};

export type ScryfallCard = {
  id: string;
  oracle_id: string;
  name: string;
  lang: string;
  released_at: string;
  scryfall_uri: string;
  layout: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  colors?: string[];
  color_identity: string[];
  keywords: string[];
  legalities: Record<string, "legal" | "not_legal" | "restricted" | "banned">;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  edhrec_rank?: number;
  image_uris?: ScryfallImageUris;
  card_faces?: ScryfallCardFace[];
  prices: {
    usd?: string | null;
    usd_foil?: string | null;
    eur?: string | null;
    tix?: string | null;
  };
  purchase_uris?: Record<string, string>;
  related_uris?: Record<string, string>;
};

/**
 * The name to send to Scryfall's `/cards/collection` endpoint.
 *
 * That endpoint matches a split, transform or adventure card by its **front
 * face** and rejects the combined "A // B" form outright — not as a miss, but
 * as `not_found`. Both of our name sources use the combined form: the card
 * corpus stores Scryfall's own `name`, and Moxfield and Archidekt exports
 * print it that way too. So every such card was silently dropped, leaving 60
 * blank slots across the 18 rule hubs and quietly losing cards out of pasted
 * decklists.
 *
 * Scryfall answers with the full combined name regardless of which form it was
 * asked for, so callers keying results by the combined name keep matching. A
 * name without a `//` is returned unchanged, which is why this is safe to
 * apply to every identifier rather than only the ones we think need it.
 */
export function collectionLookupName(name: string): string {
  return name.split(" // ")[0].trim();
}

/**
 * Whether a card can head a Commander deck.
 *
 * Moxfield's plain-text export carries no *CMDR* marker, so a pasted 100-card
 * list arrives with no commander at all unless we work it out from the cards
 * themselves — and in a Commander-first product a deck with no commander is
 * the wrong answer.
 */
export function canBeCommander(card: ScryfallCard): boolean {
  // Planeswalkers and a handful of oddities say so in their own text.
  if (oracleText(card).toLowerCase().includes("can be your commander")) {
    return true;
  }
  // type_line joins both faces on a DFC, so this covers transforming legends.
  const type = card.type_line.toLowerCase();
  return type.includes("legendary") && type.includes("creature");
}

/** The image for a card, transparently handling double-faced layouts. */
export function cardImage(
  card: ScryfallCard,
  size: keyof ScryfallImageUris = "normal",
): string | null {
  return card.image_uris?.[size] ?? card.card_faces?.[0]?.image_uris?.[size] ?? null;
}

/** Full oracle text, joining both halves of a modal/transform card. */
export function oracleText(card: ScryfallCard): string {
  if (card.oracle_text) return card.oracle_text;
  if (card.card_faces?.length) {
    return card.card_faces
      .map((f) => `${f.name}\n${f.oracle_text ?? ""}`)
      .join("\n//\n");
  }
  return "";
}

export type ResolvedNames = {
  /** Name as written in the list → the canonical Scryfall card. */
  resolved: Record<string, ScryfallCard>;
  /** Names Scryfall had no match for, even fuzzily. */
  notFound: string[];
};
