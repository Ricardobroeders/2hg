/**
 * Authored content for `/rules` and `/rules/[format]`.
 *
 * Same split as `src/content/lists`: the prose lives here, one file per page,
 * and every rules *number* is interpolated from `src/lib/team.ts` rather than
 * typed into a string. That file stays the single source of truth for life
 * totals, deck sizes and copy limits — two of which have shipped wrong before.
 *
 * How it reads is `.claude/skills/content-style/`; what may be advertised is
 * `.claude/skills/seo/`.
 */

export type RulesSection = {
  /** `<h2>`. Sentence case, makes a claim, never a question. */
  heading: string;
  /** One to three paragraphs of plain prose. */
  body: readonly string[];
  /** Optional bullet list under the prose, for genuinely list-shaped rules. */
  points?: readonly string[];
  /** Comprehensive Rules or MTR references backing the section, e.g. "CR 810.9". */
  ruleRefs?: readonly string[];
};

/**
 * One question and its answer. `{ title, body }` so it drops straight into
 * `faqSchema()`. `title` is phrased the way players ask it; `body` answers in
 * 40–60 words, answer first, flat register (HUMOR.md bans jokes here).
 */
export type RulesFaq = { title: string; body: string };

export type RulesContent = {
  /** `<title>`, before the layout appends " · Two-Headed Giant". */
  title: string;
  /** `<h1>`. */
  heading: string;
  /** Small label above the `<h1>`. */
  eyebrow: string;
  /** Meta description. Answers the query, under ~155 characters. */
  description: string;
  /** Opening paragraphs. The first one answers the query outright. */
  intro: readonly string[];
  /**
   * The at-a-glance panel under the intro. Every value that is a rules number
   * must be interpolated from `src/lib/team.ts`, never typed.
   */
  facts: readonly { label: string; value: string }[];
  sections: readonly RulesSection[];
  /** Internal links worth following from this page — hubs, tools, siblings. */
  related: readonly { href: string; label: string; note: string }[];
  faq: readonly RulesFaq[];
  sources: readonly { label: string; href: string }[];

  /** Research bookkeeping — not rendered. */
  targetQuery: string;
  secondaryQueries: readonly string[];
  researchedAt: string;
};
