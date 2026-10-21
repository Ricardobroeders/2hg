/**
 * Scryfall, called from the visitor's browser. For client components only.
 *
 * Everything interactive — autocomplete, decklist import, builder hydration,
 * card search, live prices — runs here rather than through our server. That
 * used to be a proxy on Vercel, and it is what got us rate-limited: every
 * visitor and every crawler shared one egress address and one Scryfall quota,
 * and our functions sat billing while they waited on it. From the browser each
 * visitor spends their own quota, and none of our compute.
 *
 * Scryfall serves its API with `Access-Control-Allow-Origin: *` and accepts
 * the POST preflight, so none of this needs a proxy. What it can't do is set
 * a descriptive User-Agent — browsers forbid that header — which Scryfall's
 * guidelines accept for browser-side use.
 *
 * Server code must not import this: server renders read the `cards` table
 * (`./card-store`) and never call Scryfall at all.
 */

import { normalizeName } from "./decklist";
import {
  collectionLookupName,
  type ResolvedNames,
  type ScryfallCard,
} from "./scryfall";

const API = "https://api.scryfall.com";

/**
 * Scryfall asks for 50–100ms between requests. Every call in this tab queues
 * behind the previous one's slot, so a 300-card import paces itself instead of
 * bursting into a 429.
 */
const SPACING_MS = 100;
let nextSlot = 0;

async function pace(): Promise<void> {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + SPACING_MS;
  if (slot > now) await new Promise((r) => setTimeout(r, slot - now));
}

const MAX_ATTEMPTS = 3;

/** One request, paced, with a short retry on 429/5xx. 404 is `null`. */
async function call<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  for (let attempt = 1; ; attempt++) {
    await pace();
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...init.headers },
    });

    if (res.status === 404) return null;
    if (res.ok) return (await res.json()) as T;

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS) {
      const body = (await res.json().catch(() => null)) as { details?: string } | null;
      throw new Error(`Scryfall ${res.status}: ${body?.details ?? res.statusText}`);
    }
    const after = Number(res.headers.get("retry-after"));
    const wait = Number.isFinite(after) && after > 0 ? after * 1000 : 500 * attempt;
    await new Promise((r) => setTimeout(r, Math.min(wait, 3_000)));
  }
}

/** Card-name typeahead. Abortable, because every keystroke supersedes the last. */
export async function autocomplete(
  query: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const data = await call<{ data: string[] }>(
    `/cards/autocomplete?q=${encodeURIComponent(q)}`,
    { signal },
  );
  return data?.data ?? [];
}

/** One card by its exact name — the live-price lookup on a card page. */
export function cardByName(name: string): Promise<ScryfallCard | null> {
  return call<ScryfallCard>(`/cards/named?exact=${encodeURIComponent(name)}`);
}

/**
 * Many cards by name via `/cards/collection` (75 per request).
 *
 * Batches go one at a time, paced, and a failed batch throws rather than
 * returning what it managed — callers record misses as "unresolved", and a
 * rate-limited moment must not be mistaken for cards that don't exist.
 */
export async function cardsByNames(names: string[]): Promise<ScryfallCard[]> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const cards: ScryfallCard[] = [];

  for (let i = 0; i < unique.length; i += 75) {
    const batch = unique.slice(i, i + 75);
    const data = await call<{ data: ScryfallCard[] }>("/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifiers: batch.map((name) => ({ name: collectionLookupName(name) })),
      }),
    });
    cards.push(...(data?.data ?? []));
  }
  return cards;
}

/**
 * Resolve written card names to canonical Scryfall cards, preserving which
 * input produced which card.
 *
 * The importer needs that mapping: a list saying "Atraxa, Praetors Voice" has
 * to become "Atraxa, Praetors' Voice", and the user has to be told which lines
 * we couldn't read at all.
 */
export async function resolveCardNames(names: string[]): Promise<ResolvedNames> {
  const wanted = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (wanted.length === 0) return { resolved: {}, notFound: [] };

  const cards = await cardsByNames(wanted);

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
  // pasted wall of nonsense can't turn into hundreds of requests, and
  // sequential so they pace like everything else.
  const FUZZY_LIMIT = 20;
  const notFound: string[] = misses.slice(FUZZY_LIMIT);
  for (const name of misses.slice(0, FUZZY_LIMIT)) {
    const card = await call<ScryfallCard>(
      `/cards/named?fuzzy=${encodeURIComponent(name)}`,
    ).catch(() => null);
    if (card) resolved[name] = card;
    else notFound.push(name);
  }

  return { resolved, notFound };
}

export type SearchResult = {
  cards: ScryfallCard[];
  totalCards: number;
  hasMore: boolean;
};

/** Full Scryfall-syntax search, one page of up to 175 cards. */
export async function searchCards(
  query: string,
  opts: { order?: string; page?: number; signal?: AbortSignal } = {},
): Promise<SearchResult> {
  const params = new URLSearchParams({
    q: query,
    order: opts.order ?? "edhrec",
    unique: "cards",
    page: String(opts.page ?? 1),
  });
  const data = await call<{
    data: ScryfallCard[];
    total_cards: number;
    has_more: boolean;
  }>(`/cards/search?${params}`, { signal: opts.signal });

  return data
    ? { cards: data.data, totalCards: data.total_cards, hasMore: data.has_more }
    : { cards: [], totalCards: 0, hasMore: false };
}
