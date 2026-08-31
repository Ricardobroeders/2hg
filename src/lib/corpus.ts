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
 * The bar for advertising a card page, and the reason it is not just
 * "trips at least one rule".
 *
 * Tripping one rule was the original test. Measured against the real corpus it
 * was far too generous: 86% of these cards match exactly one rule, there are
 * only **121 distinct rule combinations** behind 5,620 pages, the ten most
 * common cover 80% of them, and 931 cards share the identical
 * `cheap-interaction` paragraph. Strip the shared prose and what is left on
 * such a page is Scryfall's own name, cost, type line and oracle text — the
 * same bytes Scryfall, Moxfield, EDHREC and Gatherer already publish.
 *
 * Two rules is where a page starts saying something specific: the interaction
 * between the axes is ours, not a template. A high EDHREC rank earns a page
 * too, on different grounds — those are the cards people actually search for,
 * where being the only 2HG answer is worth more than the prose being thin.
 *
 * Everything below the bar keeps a working, linked, useful page. It is served
 * `noindex, follow`, so it just isn't offered to search. Quality assessments
 * are site-wide: a few thousand near-identical pages drag down `/rules` and the
 * hubs, which are the pages actually worth ranking.
 *
 * Raise this back toward "any matched rule" once card pages carry genuinely
 * per-card prose — computed format math rather than a shared paragraph.
 */
const INDEX_MIN_RULES = 2;
const INDEX_MAX_RANK = 2500;

/**
 * Shared by the sitemap and the card page's robots directive so the two can't
 * drift. Takes the raw figures rather than a `CorpusCard` so a card page can
 * apply it to a live `scoreCard()` result — a newly legal card then behaves
 * correctly before the corpus has been rebuilt.
 */
export function meetsIndexBar(
  matchedRuleCount: number,
  edhrecRank: number | null,
): boolean {
  if (matchedRuleCount === 0) return false;
  return (
    matchedRuleCount >= INDEX_MIN_RULES ||
    (edhrecRank !== null && edhrecRank <= INDEX_MAX_RANK)
  );
}

/**
 * The cards we advertise in the sitemap — about 1,300 of the ~5,600 that trip a
 * rule. See `meetsIndexBar`.
 */
export function indexableCards(): CorpusCard[] {
  return CARDS.filter((card) => meetsIndexBar(card.rules.length, card.rank));
}

/**
 * Every corpus card, advertised or not. The rule hubs list all of them: those
 * links still carry weight (`follow`), and the browse surface shouldn't hide
 * cards just because their page isn't worth offering to search.
 */
export function allCorpusCards(): CorpusCard[] {
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
