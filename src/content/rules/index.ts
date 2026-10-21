/**
 * The `/rules/[format]` registry. Order is display order: Commander first,
 * because it is the format people build for and the site's primary target.
 *
 * 2HG Constructed is deliberately absent. Its Unified Deck Construction rule is
 * the one thing people wrongly carry into 2HG Commander, so it is not given a
 * page of its own beside Commander's — see the callout on `/rules`.
 */

import type { RulesContent } from "./types";
import commander from "./commander";
import sealed from "./sealed";
import draft from "./draft";

export type RulesFormatSlug = "commander" | "sealed" | "draft";

export type RulesFormatEntry = {
  slug: RulesFormatSlug;
  /** Short name for breadcrumbs and links, e.g. "2HG Commander". */
  label: string;
  content: RulesContent;
};

export const RULES_FORMATS: readonly RulesFormatEntry[] = [
  { slug: "commander", label: "2HG Commander", content: commander },
  { slug: "sealed", label: "2HG Sealed", content: sealed },
  { slug: "draft", label: "2HG Draft", content: draft },
];

export function rulesFormat(slug: string): RulesFormatEntry | undefined {
  return RULES_FORMATS.find((entry) => entry.slug === slug);
}
