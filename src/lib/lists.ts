/**
 * Rule hub pages — `/lists/[rule]`.
 *
 * One page per 2HG rule, listing the cards that trip it. These exist for two
 * reasons at once. They target queries nobody currently answers ("best sweepers
 * two headed giant", "2HG extra turn cards"), and they are the internal link
 * graph: `/cards` shows nothing without a query, so before these pages roughly
 * 5,600 card pages had no crawlable path in at all.
 *
 * The editorial copy lives in `src/content/lists/` rather than in
 * `twohg-score.ts` — that file is the scoring engine and its `reason` strings
 * are written to explain a score, not to rank. It is no longer in this file
 * either: one file per rule id keeps a content change to a one-file diff, and
 * keeps this file about the seam rather than about the prose. Anything without
 * an entry in `LIST_CONTENT` still gets a working page built from `rule.label`
 * and `rule.reason`, so adding a 19th rule adds a hub instead of a 404.
 */

import { RULES, type Rule } from "./twohg-score";
import { cardsForRule } from "./corpus";
import { LIST_CONTENT } from "@/content/lists";
import type { ListContent } from "@/content/lists/types";

export type ListHub = {
  /** The rule id, already URL-safe: "each-opponent", "cheap-interaction". */
  id: string;
  rule: Rule;
  /** <title>. Shaped like a query, not like a label. */
  title: string;
  /** <h1>. */
  heading: string;
  /** Meta description, and the opening line of the page. */
  description: string;
  cardCount: number;
  /** Enough cards to be worth its own page. */
  indexable: boolean;
  /**
   * The authored entry. `title`/`heading`/`description` are mirrored above so
   * existing callers don't have to reach through it; everything else — intro,
   * sections, faq, related — is optional, and its absence means "render as
   * this page did before there was anything more to say".
   */
  content: ListContent;
};

/** Below this a page is a list too short to justify its own URL. */
const MIN_CARDS = 10;

function hubFor(rule: Rule): ListHub {
  const cardCount = cardsForRule(rule.id).length;
  const content: ListContent = LIST_CONTENT[rule.id] ?? {
    title: `Best ${rule.label.toLowerCase()} cards in 2HG`,
    heading: rule.label,
    // `reason` is already a written, 2HG-specific sentence — the best raw
    // material available, and it keeps the single-sourcing /rules relies on.
    description: rule.reason,
  };

  return {
    id: rule.id,
    rule,
    title: content.title,
    heading: content.heading,
    description: content.description,
    cardCount,
    indexable: cardCount >= MIN_CARDS,
    content,
  };
}

let cached: ListHub[] | null = null;

export function listHubs(): ListHub[] {
  cached ??= RULES.map(hubFor);
  return cached;
}

export function indexableHubs(): ListHub[] {
  return listHubs().filter((hub) => hub.indexable);
}

export function hubById(id: string): ListHub | undefined {
  return listHubs().find((hub) => hub.id === id);
}

/**
 * Related hubs: curated first, same-impact siblings as the fallback.
 *
 * The fallback ordering is `RULES` order, which is roughly "how much this moves
 * the needle" — a fine default, but a weighting order rather than a topical
 * one, and it never crosses the up/down boundary. A hand-picked `related`
 * array beats it every time, so curated ids win and only a short list gets
 * topped up.
 */
export function relatedHubs(hub: ListHub, limit = 4): ListHub[] {
  const all = listHubs();
  const byId = new Map(all.map((other) => [other.id, other]));

  const curated = (hub.content.related ?? [])
    .filter((id) => id !== hub.id)
    .map((id) => byId.get(id))
    .filter((other) => other != null);

  const seen = new Set(curated.map((other) => other.id));
  const fallback = all.filter(
    (other) =>
      other.id !== hub.id &&
      other.rule.impact === hub.rule.impact &&
      !seen.has(other.id),
  );

  return [...curated, ...fallback].slice(0, limit);
}
