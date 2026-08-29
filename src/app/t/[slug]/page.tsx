import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { getTeamBySlug, recordView } from "@/lib/db/teams";
import { getCardsByNames } from "@/lib/scryfall";
import { FORMATS, validateTeam } from "@/lib/team";
import { scoreCard } from "@/lib/twohg-score";
import { AdoptTeam } from "@/components/AdoptTeam";
import { PairingCommanders } from "@/components/PairingCommanders";
import { SharedDeck } from "@/components/SharedDeck";

/** A shared pairing is a snapshot someone sent a teammate — always fresh. */
export const dynamic = "force-dynamic";

/**
 * A deployment with no DATABASE_URL still serves the rest of the site, so a
 * share link there is a 404 rather than a crash.
 */
async function loadTeam(slug: string) {
  try {
    return await getTeamBySlug(slug);
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) return null;
    throw error;
  }
}

export async function generateMetadata(
  props: PageProps<"/t/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const stored = await loadTeam(slug);
  if (!stored) return { title: "Pairing not found" };

  const { team } = stored;
  const commanders = [...team.a.commanders, ...team.b.commanders];

  return {
    title: team.name,
    description: commanders.length
      ? `A ${FORMATS[team.format].label} pairing: ${commanders.join(" and ")}.`
      : `A ${FORMATS[team.format].label} team pairing — two decks built to play together.`,
  };
}

export default async function SharedTeamPage(props: PageProps<"/t/[slug]">) {
  const { slug } = await props.params;

  const stored = await loadTeam(slug);
  if (!stored) notFound();
  // Slugs are unique across both kinds; a solo deck belongs at /d/.
  if (stored.kind === "solo") redirect(`/d/${slug}`);

  const { team } = stored;
  const rules = FORMATS[team.format];

  /**
   * Commanders are folded in explicitly rather than assumed to be among the
   * entries. Both shapes exist in stored data — a pasted list carries its
   * commander as a card, while one picked in the builder is recorded only in
   * `commanders` — and a pairing whose commanders had no art was the result.
   */
  const names = [
    ...new Set([
      ...[...team.a.entries, ...team.b.entries].map((e) => e.name),
      ...team.a.commanders,
      ...team.b.commanders,
    ]),
  ];
  const cardList = await getCardsByNames(names);
  const cards = new Map(cardList.map((c) => [c.name, c]));

  const validation = validateTeam(team, cards);

  const scores = [...team.a.entries, ...team.b.entries]
    .map((e) => cards.get(e.name))
    .filter((c) => c != null)
    .map((c) => scoreCard(c).score);
  const avg = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  // Counting the view shouldn't hold up the render.
  void recordView(slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/80">
            Shared pairing · {rules.label}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {team.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {validation.counts.combined} cards across both decks
            {stored.viewCount > 0 && <> · {stored.viewCount} views</>}
          </p>
        </div>

        {avg != null && (
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums text-emerald-400">
              {avg}
              <span className="text-base font-normal text-zinc-600">/100</span>
            </p>
            <p className="text-xs text-zinc-500">Average 2HG rating</p>
          </div>
        )}
      </header>

      <div className="mt-8">
        <PairingCommanders
          decks={[
            { slot: "a", deck: team.a },
            { slot: "b", deck: team.b },
          ]}
          cards={cards}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,300px)]">
        <SharedDeck deck={team.a} slot="a" cards={cards} />
        <SharedDeck deck={team.b} slot="b" cards={cards} />

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <AdoptTeam team={team} cards={cardList} />

          {validation.violations.length > 0 && (
            <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5">
              <h2 className="text-sm font-semibold text-amber-300">
                {validation.violations.length} thing
                {validation.violations.length === 1 ? "" : "s"} to fix
              </h2>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-amber-200/80">
                {validation.violations.slice(0, 6).map((v) => (
                  <li key={v.message}>{v.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-sm font-semibold text-white">
              About this format
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              {rules.blurb}
            </p>
            <Link
              href="/rules"
              className="mt-3 inline-block text-xs text-emerald-400 hover:text-emerald-300"
            >
              Read the full 2HG rules →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
