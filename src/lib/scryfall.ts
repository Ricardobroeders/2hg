/**
 * Thin, cached Scryfall client.
 *
 * Everything goes through the Next.js data cache so a page render never
 * hammers Scryfall directly. Card data (oracle text, images) is effectively
 * static, so we cache it hard; search results churn a little more.
 */

import { normalizeName } from "./decklist";

const API = "https://api.scryfall.com";

/** Scryfall asks for a descriptive UA and an explicit Accept header. */
const HEADERS = {
  Accept: "application/json",
  "User-Agent": "TwoHeadedGiant/0.1 (https://2hg.dev)",
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

/**
 * In-flight request limit, per process.
 *
 * Scryfall asks for roughly 10 requests a second and throttles well before
 * that when they arrive all at once. Next prerenders across many worker
 * processes, each rendering several pages in parallel, so without a ceiling a
 * build fans out into hundreds of simultaneous calls, collects 429s, and times
 * pages out — which is exactly how the first build of the card corpus failed.
 *
 * A semaphore here rather than a build-only setting, because the same burst
 * happens at runtime whenever a crawler walks a few hundred cold ISR pages.
 */
const MAX_IN_FLIGHT = 4;

let inFlight = 0;
const waiting: (() => void)[] = [];

async function acquire(): Promise<void> {
  if (inFlight < MAX_IN_FLIGHT) {
    inFlight++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
  inFlight++;
}

function release(): void {
  inFlight--;
  waiting.shift()?.();
}

/** Run `fn` with a slot held, releasing it however `fn` finishes. */
async function limited<T>(fn: () => Promise<T>): Promise<T> {
  await acquire();
  try {
    return await fn();
  } finally {
    release();
  }
}

/**
 * Attempts per request. Cached reads almost never need a second one; this is
 * insurance for the bursty paths — prerendering many card pages at build time,
 * or a crawler warming cold ISR routes — where we briefly look like a scraper
 * to Scryfall and get a 429.
 */
const MAX_ATTEMPTS = 4;

async function get<T>(
  path: string,
  revalidate: number = DAY,
): Promise<T | null> {
  for (let attempt = 1; ; attempt++) {
    const res = await limited(() =>
      fetch(`${API}${path}`, { headers: HEADERS, next: { revalidate } }),
    );

    // 404 is a normal outcome here (no such card / no search results).
    if (res.status === 404) return null;
    if (res.ok) return (await res.json()) as T;

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS) {
      const body = (await res.json().catch(() => null)) as ScryfallError | null;
      throw new Error(
        `Scryfall ${res.status}: ${body?.details ?? res.statusText}`,
      );
    }

    // Release the socket before sleeping — undici holds the connection until
    // the body is read or cancelled, and a retry loop that skips this leaks
    // one per attempt under build concurrency.
    await res.body?.cancel().catch(() => {});

    // Honour Retry-After when given, otherwise back off with jitter so a wave
    // of concurrent renders doesn't retry in lockstep.
    const after = Number(res.headers.get("retry-after"));
    const wait =
      Number.isFinite(after) && after > 0
        ? after * 1000
        : 250 * 2 ** (attempt - 1) + Math.random() * 250;
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
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
      const res = await limited(() =>
        fetch(`${API}/cards/collection`, {
          method: "POST",
          headers: { ...HEADERS, "Content-Type": "application/json" },
          body: JSON.stringify({
            identifiers: batch.map((name) => ({ name })),
          }),
          // POST bodies aren't cached by Next. Callers that need this cached
          // across requests go through `getCardsByNamesCached` in ./cards.
          cache: "no-store",
        }),
      );
      if (!res.ok) return [];
      const json = (await res.json()) as { data: ScryfallCard[] };
      return json.data;
    }),
  );

  return results.flat();
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

/**
 * Resolve written card names to canonical Scryfall cards, preserving which
 * input produced which card.
 *
 * `getCardsByNames` throws that mapping away, but the importer needs it: a
 * list saying "Atraxa, Praetors Voice" has to become "Atraxa, Praetors'
 * Voice", and the user has to be told which lines we couldn't read at all.
 */
export async function resolveCardNames(
  names: string[],
): Promise<ResolvedNames> {
  const wanted = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (wanted.length === 0) return { resolved: {}, notFound: [] };

  const cards = await getCardsByNames(wanted);

  // Scryfall doesn't guarantee response order, so match on a loose key rather
  // than by index. Double-faced cards are indexed under their front face too,
  // since most exports only write that half.
  const byKey = new Map<string, ScryfallCard>();
  for (const card of cards) {
    byKey.set(normalizeName(card.name), card);
    const front = card.card_faces?.[0]?.name;
    if (front) byKey.set(normalizeName(front), card);
  }

  const resolved: Record<string, ScryfallCard> = {};
  const misses: string[] = [];

  for (const name of wanted) {
    const hit = byKey.get(normalizeName(name));
    if (hit) resolved[name] = hit;
    else misses.push(name);
  }

  // Second pass for the stragglers — typos and partial names. Capped so a
  // pasted wall of nonsense can't turn into hundreds of Scryfall requests.
  const FUZZY_LIMIT = 20;
  const notFound: string[] = misses.slice(FUZZY_LIMIT);

  const fuzzy = await Promise.all(
    misses.slice(0, FUZZY_LIMIT).map(async (name) => {
      const card = await getCardByFuzzyName(name).catch(() => null);
      return [name, card] as const;
    }),
  );

  for (const [name, card] of fuzzy) {
    if (card) resolved[name] = card;
    else notFound.push(name);
  }

  return { resolved, notFound };
}
