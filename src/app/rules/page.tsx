import type { Metadata } from "next";
import Link from "next/link";
import {
  FORMATS,
  REFERENCE_VARIANTS,
  SHARED_RULES,
  type FormatRules,
} from "@/lib/team";

export const metadata: Metadata = {
  title: "Two-Headed Giant rules",
  description:
    "How Two-Headed Giant works: shared life totals, shared turns, and the deckbuilding rules for 2HG Commander, Constructed and Sealed.",
};

/**
 * The reference page. Everything here renders from `src/lib/team.ts` so the
 * rules the builder enforces and the rules we publish can't drift apart —
 * correct the data, not the prose.
 */
const ORDER: FormatRules[] = [FORMATS.commander, FORMATS.constructed];

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/5 py-2 last:border-0">
      <dt className="text-sm text-zinc-400">{label}</dt>
      <dd className="text-sm font-medium tabular-nums text-white">{value}</dd>
    </div>
  );
}

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/80">
          Reference
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          How Two-Headed Giant works
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
          Two teams of two. Each team shares one life total and takes one turn
          together. That&apos;s the whole format — and it&apos;s enough to
          change what half the cards in Magic are worth.
        </p>
      </header>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          The rules every variant shares
        </h2>
        <dl className="mt-5 space-y-5">
          {SHARED_RULES.map((rule) => (
            <div key={rule.title}>
              <dt className="text-sm font-semibold text-white">{rule.title}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-zinc-400">
                {rule.body}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Deckbuilding formats
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          These are the variants you build for at home. Both are supported by
          the{" "}
          <Link
            href="/team"
            className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
          >
            team builder
          </Link>
          .
        </p>

        <div className="mt-6 space-y-6">
          {ORDER.map((format) => (
            <article
              key={format.id}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-white">
                  {format.label}
                </h3>
                {format.id === "commander" && (
                  <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
                    Monthly WPN event
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {format.blurb}
              </p>

              <dl className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-1">
                <StatRow
                  label="Shared starting life"
                  value={`${format.startingLife}`}
                />
                <StatRow
                  label="Deck size"
                  value={`${format.minDeckSize} cards each`}
                />
                <StatRow
                  label="Copies per deck"
                  value={
                    format.maxCopiesPerDeck === 1
                      ? "1 (singleton)"
                      : `${format.maxCopiesPerDeck}`
                  }
                />
                <StatRow
                  label="Copies across the team"
                  value={
                    format.maxCombinedCopies == null
                      ? "No team limit"
                      : `${format.maxCombinedCopies} combined`
                  }
                />
                {format.commanderDamage != null && (
                  <StatRow
                    label="Commander damage"
                    value={`${format.commanderDamage} from one commander`}
                  />
                )}
                <StatRow
                  label="Poison counters to lose"
                  value={`${format.poisonToLose}`}
                />
              </dl>

              <ul className="mt-5 space-y-2">
                {format.notes.map((note) => (
                  <li
                    key={note}
                    className="flex gap-2.5 text-sm leading-relaxed text-zinc-400"
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-400/60"
                    />
                    {note}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Limited variants
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          The most-played 2HG by a wide margin. There&apos;s nothing to build in
          advance, so the builder doesn&apos;t cover these — but the card
          ratings still apply once your pool is open.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {REFERENCE_VARIANTS.map((variant) => (
            <article
              key={variant.label}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <h3 className="text-base font-semibold text-white">
                {variant.label}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                {variant.blurb}
              </p>
              <ul className="mt-4 space-y-2">
                {variant.notes.map((note) => (
                  <li
                    key={note}
                    className="flex gap-2.5 text-sm leading-relaxed text-zinc-400"
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-600"
                    />
                    {note}
                  </li>
                ))}
              </ul>
            </article>
          ))}
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
          singleton rule applies to each deck, not to the team. The four-copies-
          across-both-decks rule people remember belongs to 2HG{" "}
          <em>Constructed</em>, which is a different format.
        </p>
      </section>

      <section className="mt-12 border-t border-white/10 pt-8">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Sources
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          {[
            [
              "Two-Headed Giant format page",
              "https://magic.wizards.com/en/formats/two-headed-giant",
            ],
            [
              "Two-Headed Giant Commander play events",
              "https://magic.wizards.com/en/play-events/two-headed-giant-commander",
            ],
            [
              "Announcing Commander Play Events",
              "https://magic.wizards.com/en/news/announcements/commander-play-featuring-sealed-and-two-headed-giant",
            ],
          ].map(([label, href]) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-zinc-600">
          Rules summarised from Wizards of the Coast&apos;s published format and
          event rules. Where a store runs house rules, theirs win.
        </p>
      </section>
    </div>
  );
}
