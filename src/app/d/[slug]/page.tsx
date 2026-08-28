import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { getTeamBySlug, recordView } from "@/lib/db/teams";
import { getCardsByNames } from "@/lib/scryfall";
import { FORMATS } from "@/lib/team";
import { scoreCard } from "@/lib/twohg-score";
import { AdoptTeam } from "@/components/AdoptTeam";
import { SharedDeck } from "@/components/SharedDeck";

export const dynamic = "force-dynamic";

async function loadDeck(slug: string) {
  try {
    return await getTeamBySlug(slug);
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) return null;
    throw error;
  }
}

export async function generateMetadata(
  props: PageProps<"/d/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const stored = await loadDeck(slug);
  if (!stored) return { title: "Deck not found" };

  const { team } = stored;
  const commanders = team.a.commanders;

  return {
    title: team.name,
    description: commanders.length
      ? `A ${FORMATS[team.format].label} deck led by ${commanders.join(" and ")}, rated for Two-Headed Giant.`
      : `A ${FORMATS[team.format].label} deck rated for Two-Headed Giant.`,
  };
}

export default async function SharedDeckPage(props: PageProps<"/d/[slug]">) {
  const { slug } = await props.params;

  const stored = await loadDeck(slug);
  if (!stored) notFound();

  // Slugs are unique across both kinds, so a pairing opened at /d/ is simply
  // sent to its real home rather than rendered half-missing.
  if (stored.kind !== "solo") redirect(`/t/${slug}`);

  const { team } = stored;
  const rules = FORMATS[team.format];

  const names = team.a.entries.map((e) => e.name);
  const cardList = await getCardsByNames(names);
  const cards = new Map(cardList.map((c) => [c.name, c]));

  const total = team.a.entries.reduce((n, e) => n + e.quantity, 0);

  const scores = team.a.entries
    .map((e) => cards.get(e.name))
    .filter((c) => c != null)
    .map((c) => scoreCard(c).score);
  const avg = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  void recordView(slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/80">
            Shared deck · {rules.label}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {team.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            <span className="tabular-nums">{total}</span> cards
            {stored.viewCount > 0 && (
              <>
                {" · "}
                <span className="tabular-nums">{stored.viewCount}</span> views
              </>
            )}
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

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        <SharedDeck deck={team.a} slot="a" cards={cards} />

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <AdoptTeam team={team} cards={cardList} />

          {/* The reason solo decks exist: one deck is half a team, and the
              pairing surface is what this site is actually for. */}
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
            <h2 className="text-sm font-semibold text-white">
              This is half a team
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              Two-Headed Giant is played in pairs, and a deck is only as good as
              the deck sitting next to it. Open this in the builder to pair it
              with a partner and see how they play together.
            </p>
            <Link
              href="/team"
              className="mt-3 inline-block text-xs text-emerald-400 hover:text-emerald-300"
            >
              Build a pairing around it →
            </Link>
          </div>

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
