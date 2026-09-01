/**
 * Authored content for a rule hub.
 *
 * Split out of `src/lib/lists.ts` because that file is the seam between the
 * scoring engine and the editorial layer, and it stops being readable once it
 * carries the prose as well. One file per rule id, so a content change is a
 * one-file diff and a bad edit can only damage one page.
 *
 * Everything past the first three fields is optional. A hub with only those
 * three renders exactly as it did before this file existed — that is the
 * contract, and `/lists/[rule]` must keep honouring it.
 *
 * How it reads is `.claude/skills/content-style/`; what may be advertised is
 * `.claude/skills/seo/`.
 */

/** One `<h2>` and the prose under it. */
export type ListSection = {
  /**
   * Rendered as an `<h2>`. Sentence case, and never "Best …" — that shape
   * belongs to the `<title>`, and repeating it here reads as keyword stuffing.
   */
  heading: string;
  /** One to three paragraphs. Plain prose: no markdown, no mana braces. */
  body: readonly string[];
  /** Optional `<h3>` sub-sections. Omit rather than pad the outline. */
  subsections?: readonly { heading: string; body: readonly string[] }[];
  /**
   * Cards named as examples for this section, exactly as Scryfall prints them.
   * Every name must be in `cardsForRule(id)` — the page links them by slug, so
   * a name that isn't in this rule's list is a link to a page that contradicts
   * the section it sits under.
   */
  cards?: readonly string[];
};

/**
 * A question and its answer. Deliberately `{ title, body }` rather than
 * `{ question, answer }` so it drops straight into `faqSchema()` alongside
 * `SHARED_RULES`, and the markup can never disagree with the visible text.
 *
 * `title` is the question as a person actually types it into a search box.
 * `body` answers it in 40–60 words, answer first.
 */
export type ListFaq = { title: string; body: string };

export type ListContent = {
  /**
   * `<title>`, before the root layout appends " · Two-Headed Giant" (19 chars).
   * So write it *without* "Two-Headed Giant" — say "2HG" and let the template
   * supply the long form. One title then carries both spellings and stays
   * inside the ~60-char truncation.
   */
  title: string;
  /** `<h1>`. May restate the topic in full; it isn't competing for pixels. */
  heading: string;
  /** Meta description, and the first paragraph when `intro` is absent. */
  description: string;

  /**
   * The opening, one to three paragraphs. Falls back to `[description]`, which
   * is what every hub did before there was anything else to say.
   */
  intro?: readonly string[];
  /** Long-form body, in reading order. Rendered below the card grid. */
  sections?: readonly ListSection[];
  /** Ships as `FAQPage` JSON-LD too, but only when the hub is indexable. */
  faq?: readonly ListFaq[];
  /**
   * Curated related hub ids, best first. Unknown ids and self are dropped at
   * render; an empty or absent list falls back to same-impact siblings.
   */
  related?: readonly string[];

  /** The query this page is written to answer. Research bookkeeping, not rendered. */
  targetQuery?: string;
  /** Secondary queries the body should also satisfy. Not rendered. */
  secondaryQueries?: readonly string[];
  /** ISO date of the keyword research behind this entry. SERPs go stale. */
  researchedAt?: string;
  /**
   * External sources for any claim not derivable from `FORMATS.commander` or
   * the corpus. Rendered as a Sources list, the way `/rules` does it.
   */
  sources?: readonly { label: string; href: string }[];
  /**
   * `<h2>` over the rank-60-to-240 tail links. Defaults to "More cards in this
   * list", because the generated `More cards that {rule.label}` is
   * ungrammatical for about half the rules ("More cards that board sweeper").
   */
  tailHeading?: string;
};
