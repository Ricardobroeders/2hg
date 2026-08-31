/**
 * Reader for the committed card corpus.
 *
 * SERVER ONLY. The artifact is ~700 KB; it must never be imported from a
 * `"use client"` module or it ships to the browser. Everything here is used by
 * the sitemap, the rule hubs and `generateStaticParams`, all of which are
 * server-side.
 *
 * The corpus is an **index, not a cache**: the scores in it decide which URLs
 * we advertise and how lists are ordered, and nothing more. Every score a user
 * actually sees is computed live by `scoreCard()` against fresh Scryfall data,
 * so a stale artifact can misfile a card in a hub — it can never show anyone a
 * stale number. Rebuild with `npm run seo:corpus`.
 */

import corpus from "@/data/card-corpus.json";
import type { Tier } from "./twohg-score";

export type CorpusCard = {
  name: string;
  slug: string;
  /** Scryfall's EDHREC popularity rank; null for cards nobody plays. */
  rank: number | null;
  score: number;
  tier: Tier;
  /** Ids of the 2HG rules this card trips. Never empty — that's the filter. */
  rules: string[];
};

const CARDS = corpus.cards as CorpusCard[];

/** When Scryfall last rebuilt the bulk file this corpus was derived from. */
export const CORPUS_UPDATED_AT = new Date(corpus.scryfallUpdatedAt);

const BY_SLUG = new Map(CARDS.map((card) => [card.slug, card]));

/**
 * Every card with something 2HG-specific to say — ~5,600 of Scryfall's ~30,800
 * Commander-legal cards, in descending popularity.
 *
 * This is also the sitemap's membership test. A card that isn't here still has
 * a working page; it just isn't advertised, because its page would only say
 * "plays about the same in 2HG as it does in any other format".
 */
export function indexableCards(): CorpusCard[] {
  return CARDS;
}

export function corpusCard(slug: string): CorpusCard | undefined {
  return BY_SLUG.get(slug);
}

/**
 * How many card pages `next build` prerenders.
 *
 * Off by default, and that is not a compromise.
 *
 * Indexation comes from the sitemap, which advertises all ~5,600 cards however
 * this is set. Prerendering only decides which pages are already warm instead
 * of ISR-rendered on first request — and every one costs two Scryfall round
 * trips at build time.
 *
 * Measured, because the guesses were wrong twice: 300 cards failed the build
 * outright (page-level 60s timeouts once workers started rate-limiting each
 * other), and 100 cards on Vercel — three workers, cold data cache — was at
 * 36 of 138 pages after three minutes, heading for eleven. The same build runs
 * in five seconds locally with a warm cache, which is exactly why local timing
 * is not evidence here.
 *
 * So: ship fast, deterministic builds and let the first visitor to each card
 * pay ~1s once. Raise `CARD_PRERENDER_LIMIT` later if you want the popular
 * cards warm — later builds are cheap because Vercel persists the data cache
 * between deploys, so the Scryfall calls are already paid for.
 */
const PRERENDER_LIMIT = Number(process.env.CARD_PRERENDER_LIMIT ?? 0);

export function prerenderSlugs(limit = PRERENDER_LIMIT): string[] {
  return CARDS.slice(0, Math.max(0, limit)).map((card) => card.slug);
}

const RULE_CACHE = new Map<string, CorpusCard[]>();

/** Cards tripping one rule, strongest 2HG Rating first. */
export function cardsForRule(ruleId: string): CorpusCard[] {
  const cached = RULE_CACHE.get(ruleId);
  if (cached) return cached;

  const matches = CARDS.filter((card) => card.rules.includes(ruleId)).sort(
    (a, b) =>
      b.score - a.score ||
      (a.rank ?? Infinity) - (b.rank ?? Infinity) ||
      a.name.localeCompare(b.name),
  );

  RULE_CACHE.set(ruleId, matches);
  return matches;
}
