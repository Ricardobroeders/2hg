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
 * Attempts per request. Cached reads almost never need a second one; this is
 * insurance for the bursty paths — prerendering many card pages at build time,
 * or a crawler warming cold ISR routes — where we briefly look like a scraper
 * to Scryfall and get a 429.
 */
const MAX_ATTEMPTS = 4;

/** Ceiling on a single backoff. Keeps a retry from outliving the request. */
const MAX_BACKOFF_MS = 2_000;

/**
 * Wall-clock ceiling on one logical read, covering all of its retries.
 *
 * Scryfall's latency is episodic, not uniform, and that is the whole reason
 * this exists. A query it has not run recently can take tens of seconds; the
 * same query answers in ~100ms once its cache is warm. Measured 2026-09-01:
 * `id<=r legal:commander -type:land` took 16.4s cold and 0.1s warm, and card
 * pages depending on such a query were hanging for 30–90s with no timeout
 * anywhere in this file. A render must never be able to wait that long.
 */
const DEADLINE_MS = 8_000;

/**
 * The ceiling for content a page is complete without — synergy suggestions and
 * live prices.
 *
 * Much tighter than `DEADLINE_MS` because the trade is different. A card page
 * now renders its name, art, oracle text and 2HG Rating from a committed
 * artifact, so these two are enhancements arriving beside finished content,
 * and the page is buffered until they land. Waiting the full 8s for a
 * suggestion rail would mean the visitor waits 8s for a page that was ready
 * immediately.
 */
export const OPTIONAL_DEADLINE_MS = 2_500;

/**
 * Scryfall was too slow, as distinct from having no such card.
 *
 * Kept separate from the `null` that means 404 so a slow response can never be
 * mistaken for a missing card — that would turn an outage into a page of 404s,
 * which is far more expensive to undo than an error page.
 */
export class ScryfallTimeout extends Error {
  constructor(path: string, ms: number) {
    super(`Scryfall did not answer ${path} within ${ms}ms`);
    this.name = "ScryfallTimeout";
  }
}

/**
 * Resolve `work`, or reject with `ScryfallTimeout` once `ms` has elapsed.
 *
 * The request is deliberately left running rather than aborted. Passing an
 * `AbortSignal` to `fetch` opts it out of Next's per-render memoization — see
 * the `fetch` API reference in `node_modules/next/dist/docs` — and changing
 * caching semantics in order to add a timeout would trade one performance bug
 * for another. Letting it run is also useful: an abandoned request still
 * populates the data cache when it finally lands, so the visitor who timed out
 * has warmed the entry for whoever comes next.
 */
function withDeadline<T>(
  work: Promise<T>,
  ms: number,
  path: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new ScryfallTimeout(path, ms)), ms);
    // Both handlers are attached even after the deadline fires, so a late
    // rejection is considered handled and never surfaces as an unhandled one.
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error as Error);
      },
    );
  });
}

function get<T>(
  path: string,
  revalidate: number = DAY,
  deadlineMs: number = DEADLINE_MS,
): Promise<T | null> {
  return withDeadline(fetchWithRetry<T>(path, revalidate), deadlineMs, path);
}

async function fetchWithRetry<T>(
  path: string,
  revalidate: number,
): Promise<T | null> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${API}${path}`, {
      headers: HEADERS,
      next: { revalidate },
    });

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
    // of concurrent renders doesn't retry in lockstep. Capped either way: this
    // runs inside a request handler, and an uncapped Retry-After would park a
    // page render for as long as the header says.
    const after = Number(res.headers.get("retry-after"));
    const wait = Math.min(
      Number.isFinite(after) && after > 0
        ? after * 1000
        : 250 * 2 ** (attempt - 1) + Math.random() * 250,
      MAX_BACKOFF_MS,
    );
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
  /** Override the wall-clock ceiling; see `OPTIONAL_DEADLINE_MS`. */
  deadlineMs?: number;
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
    opts.deadlineMs,
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
  deadlineMs?: number,
): Promise<ScryfallCard | null> {
  return get<ScryfallCard>(
    `/cards/named?exact=${encodeURIComponent(name)}`,
    DAY,
    deadlineMs,
  );
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
      // Bounded like every other read here: this backs the rule hubs and the
      // decklist importer, and a slow batch used to be able to park either.
      const res = await withDeadline(
        fetch(`${API}/cards/collection`, {
          method: "POST",
          headers: { ...HEADERS, "Content-Type": "application/json" },
          body: JSON.stringify({
            identifiers: batch.map((name) => ({
              name: collectionLookupName(name),
            })),
          }),
          // POST bodies aren't cached by Next. Callers that need this cached
          // across requests go through `getCardsByNamesCached` in ./cards.
          cache: "no-store",
        }),
        DEADLINE_MS,
        "/cards/collection",
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
