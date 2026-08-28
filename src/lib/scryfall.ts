/**
 * Thin, cached Scryfall client.
 *
 * Everything goes through the Next.js data cache so a page render never
 * hammers Scryfall directly. Card data (oracle text, images) is effectively
 * static, so we cache it hard; search results churn a little more.
 */

const API = "https://api.scryfall.com";

/** Scryfall asks for a descriptive UA and an explicit Accept header. */
const HEADERS = {
  Accept: "application/json",
  "User-Agent": "TwoHeadedGiant/0.1 (https://2hg.gg)",
};

const DAY = 60 * 60 * 24;

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

type SearchResponse = {
  object: "list";
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: ScryfallCard[];
};

type ScryfallError = {
  object: "error";
  status: number;
  code: string;
  details: string;
};

async function get<T>(
  path: string,
  revalidate: number = DAY,
): Promise<T | null> {
  const res = await fetch(`${API}${path}`, {
    headers: HEADERS,
    next: { revalidate },
  });

  // 404 is a normal outcome here (no such card / no search results).
  if (res.status === 404) return null;

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ScryfallError | null;
    throw new Error(
      `Scryfall ${res.status}: ${body?.details ?? res.statusText}`,
    );
  }

  return (await res.json()) as T;
}

export type SearchOptions = {
  /** Scryfall `order:` value — e.g. "edhrec", "name", "cmc", "usd". */
  order?: string;
  dir?: "asc" | "desc";
  page?: number;
  /** Collapse reprints down to one printing per card. */
  unique?: "cards" | "art" | "prints";
};

export type SearchResult = {
  cards: ScryfallCard[];
  totalCards: number;
  hasMore: boolean;
  page: number;
};

const EMPTY: SearchResult = {
  cards: [],
  totalCards: 0,
  hasMore: false,
  page: 1,
};

export async function searchCards(
  query: string,
  opts: SearchOptions = {},
): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return EMPTY;

  const params = new URLSearchParams({
    q,
    order: opts.order ?? "edhrec",
    dir: opts.dir ?? "auto",
    unique: opts.unique ?? "cards",
    page: String(opts.page ?? 1),
  });

  const data = await get<SearchResponse>(
    `/cards/search?${params}`,
    60 * 60 * 6,
  );
  if (!data) return { ...EMPTY, page: opts.page ?? 1 };

  return {
    cards: data.data,
    totalCards: data.total_cards,
    hasMore: data.has_more,
    page: opts.page ?? 1,
  };
}

export async function getCardByExactName(
  name: string,
): Promise<ScryfallCard | null> {
  return get<ScryfallCard>(`/cards/named?exact=${encodeURIComponent(name)}`);
}

export async function getCardByFuzzyName(
  name: string,
): Promise<ScryfallCard | null> {
  return get<ScryfallCard>(`/cards/named?fuzzy=${encodeURIComponent(name)}`);
}

export async function autocomplete(query: string): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const data = await get<{ data: string[] }>(
    `/cards/autocomplete?q=${encodeURIComponent(q)}`,
    60 * 60,
  );
  return data?.data ?? [];
}

/** Fetch many cards at once via Scryfall's collection endpoint (75 max/call). */
export async function getCardsByNames(
  names: string[],
): Promise<ScryfallCard[]> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  const batches: string[][] = [];
  for (let i = 0; i < unique.length; i += 75) {
    batches.push(unique.slice(i, i + 75));
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      const res = await fetch(`${API}/cards/collection`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({
          identifiers: batch.map((name) => ({ name })),
        }),
        // POST bodies aren't cached by Next; these are only hit from
        // client-driven routes where the response is already small.
        cache: "no-store",
      });
      if (!res.ok) return [];
      const json = (await res.json()) as { data: ScryfallCard[] };
      return json.data;
    }),
  );

  return results.flat();
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
