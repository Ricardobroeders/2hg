import type { Metadata } from "next";
import Link from "next/link";
import { FORMATS, LIMITED_FORMATS, SHARED_RULES } from "@/lib/team";
import { RULES_FORMATS } from "@/content/rules";
import { OVERVIEW, OVERVIEW_FAQ, OVERVIEW_SOURCES } from "@/content/rules/overview";
import { JsonLd, articleSchema, breadcrumbSchema, faqSchema } from "@/components/JsonLd";
import { openGraphFor } from "@/lib/site";
import { FaqAccordion, SourceList } from "@/components/FaqAccordion";

export const metadata: Metadata = {
  title: OVERVIEW.title,
  description: OVERVIEW.description,
  alternates: { canonical: "/rules" },
  openGraph: openGraphFor({
    path: "/rules",
    title: OVERVIEW.title,
    description: OVERVIEW.description,
  }),
};

const commander = FORMATS.commander;
const sealed = LIMITED_FORMATS.sealed;
const draft = LIMITED_FORMATS.draft;

/**
 * The overview: what every variant shares, how the variants differ, and a way
 * into each one. Every number renders from `src/lib/team.ts` — correct the
 * data, not the prose.
 *
 * 2HG Constructed is deliberately not a column. Its Unified Deck Construction
 * rule is the single thing people wrongly believe applies to 2HG Commander,
 * and a table setting the two side by side makes that easier to believe. It
 * stays in `FORMATS` so saved Constructed pairings keep validating.
 */
const COMPARISON: { label: string; values: [string, string, string] }[] = [
  {
    label: "Shared starting life",
    values: [`${commander.startingLife}`, `${sealed.startingLife}`, `${draft.startingLife}`],
  },
  {
    label: "Each deck",
    values: [
      `${commander.minDeckSize} cards, singleton`,
      `${sealed.minDeckSize}+ from one pool`,
      `${draft.minDeckSize}+ from the drafted pool`,
    ],
  },
  { label: "Built", values: ["At home", "At the event", "At the event"] },
  {
    label: "Same card in both decks",
    values: ["Allowed", "One copy, one deck", "One copy, one deck"],
  },
  {
    label: "Commander damage",
    values: [`${commander.commanderDamage} from one commander`, "—", "—"],
  },
  {
    label: "Poison to lose",
    values: [`${commander.poisonToLose}`, `${sealed.poisonToLose}`, `${draft.poisonToLose}`],
  },
  { label: "Where it's played", values: ["Monthly Commander Night", "Prereleases", "Store drafts"] },
];

/** One line under each format card, drawn from the same data. */
const CARD_STATS: Record<string, string> = {
  commander: `${commander.startingLife} life · ${commander.minDeckSize}-card decks · no team limit`,
  sealed: `${sealed.startingLife} life · two ${sealed.minDeckSize}-card decks · one pool`,
  draft: `${draft.startingLife} life · ${draft.boostersPerTeam} boosters per team · shared picks`,
};

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd
        data={articleSchema({
          path: "/rules",
          headline: "How Two-Headed Giant works",
          description: OVERVIEW.description,
          datePublished: OVERVIEW.publishedAt,
          dateModified: OVERVIEW.researchedAt,
          sources: OVERVIEW_SOURCES,
        })}
      />
      <JsonLd data={faqSchema(OVERVIEW_FAQ)} />
      <JsonLd data={breadcrumbSchema([{ name: "Rules", path: "/rules" }])} />

      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/80">
          Reference
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          How Two-Headed Giant works
        </h1>
        <div className="mt-4 space-y-3">
          {OVERVIEW.intro.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-zinc-400">
              {paragraph}
            </p>
          ))}
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Three ways to play, one set of core rules
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {RULES_FORMATS.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={`/rules/${entry.slug}`}
                className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-emerald-400/40 hover:bg-white/[0.04]"
              >
                <span className="text-base font-semibold text-white">{entry.label}</span>
                <span className="mt-2 text-xs leading-relaxed tabular-nums text-zinc-400">
                  {CARD_STATS[entry.slug]}
                </span>
                <span className="mt-auto pt-4 text-sm text-emerald-400">
                  {entry.label} rules →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          The rules every variant shares
        </h2>
        <dl className="mt-5 space-y-5">
          {SHARED_RULES.map((rule) => (
            <div key={rule.title}>
              <dt className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-white">
                {rule.title}
                <span className="font-mono text-[11px] font-normal text-zinc-600">
                  {rule.ref}
                </span>
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-zinc-400">
                {rule.body}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Where the formats differ
        </h2>
        {/* A real table: the comparison is the content, and a table is what
            answer engines and screen readers both read best. Scrolls inside
            itself on a phone rather than pushing the page sideways. */}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th scope="col" className="px-4 py-3 font-medium text-zinc-500">
                  <span className="sr-only">Rule</span>
                </th>
                {RULES_FORMATS.map((entry) => (
                  <th key={entry.slug} scope="col" className="px-4 py-3 font-semibold text-white">
                    <Link href={`/rules/${entry.slug}`} className="hover:text-emerald-300">
                      {entry.label}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-white/5 last:border-0">
                  <th scope="row" className="px-4 py-2.5 font-normal text-zinc-400">
                    {row.label}
                  </th>
                  {row.values.map((value, i) => (
                    <td key={i} className="px-4 py-2.5 tabular-nums text-zinc-200">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-6">
        <h2 className="text-lg font-semibold text-white">
          The one rule people get wrong
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          2HG Commander has <strong className="text-white">no unified deck
          rule</strong>. Wizards&apos; event rules say you may bring any legal
          Commander deck, so you and your teammate can both run Sol Ring — the
          singleton rule applies to each deck, not to the team. The cross-deck
          rule people remember belongs to 2HG Constructed, a different format
          entirely, and doesn&apos;t apply to anything you&apos;ll play at a
          Commander Night.
        </p>
      </section>

      <FaqAccordion entries={OVERVIEW_FAQ} />

      <SourceList
        sources={OVERVIEW_SOURCES}
        note="Rules summarised from Wizards of the Coast's Comprehensive Rules, Magic Tournament Rules and format pages. Where a store runs house rules, theirs win."
      />
    </div>
  );
}
