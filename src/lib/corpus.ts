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
 * A build-time budget, not an SEO setting. The sitemap advertises all ~5,600
 * cards either way; this slice only decides which ones are already warm rather
 * than ISR-rendered on first request. Prerendering is Scryfall-bound, measured
 * at roughly **1.1s per card** — 300 cards put the build at 6.5 minutes, which
 * is a lot of deploy latency to buy first-paint on pages a crawler would warm
 * anyway. 100 keeps the genuinely popular cards hot at about a third of that.
 *
 * `CARD_PRERENDER_LIMIT=0` skips prerendering entirely, which is what you want
 * for a local build with no network.
 */
const PRERENDER_LIMIT = Number(process.env.CARD_PRERENDER_LIMIT ?? 100);

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
