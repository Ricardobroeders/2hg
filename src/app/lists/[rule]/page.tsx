import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCardsByNamesCached } from "@/lib/cards";
import { cardsForRule } from "@/lib/corpus";
import { hubById, listHubs } from "@/lib/lists";
import { CardTile } from "@/components/CardTile";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";

/** 18 known rules; anything else is genuinely not a page. */
export const dynamicParams = false;
export const revalidate = 86400;

/** How many cards get full art. 60 ≤ Scryfall's 75-card collection limit, so one request. */
const SHOWN = 60;
/** The rest are plain links — no extra fetches, and the crawl path into the tail. */
const LISTED = 240;

export function generateStaticParams(): { rule: string }[] {
  return listHubs().map((hub) => ({ rule: hub.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/lists/[rule]">): Promise<Metadata> {
  const { rule } = await params;
  const hub = hubById(rule);
  if (!hub) return { title: "List not found", robots: { index: false, follow: false } };

  return {
    title: hub.title,
    description: hub.description,
    alternates: { canonical: `/lists/${hub.id}` },
    // A list of six cards isn't worth a URL of its own, but its links still count.
    robots: hub.indexable ? undefined : { index: false, follow: true },
    openGraph: {
      url: `/lists/${hub.id}`,
      title: hub.title,
      description: hub.description,
    },
  };
}

export default async function ListPage({ params }: PageProps<"/lists/[rule]">) {
  const { rule } = await params;
  const hub = hubById(rule);
  if (!hub) notFound();

  const ranked = cardsForRule(hub.id);
  const featured = ranked.slice(0, SHOWN);

  // One POST for the whole grid. Scores render live from these, not from the
  // corpus — the corpus only decided which cards belong here.
  const hydrated = await getCardsByNamesCached(featured.map((card) => card.name));
  const byName = new Map(hydrated.map((card) => [card.name, card]));
  const cards = featured
    .map((card) => byName.get(card.name))
    .filter((card) => card != null);

  const rest = ranked.slice(SHOWN, LISTED);
  const siblings = listHubs()
    .filter((other) => other.id !== hub.id && other.rule.impact === hub.rule.impact)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Lists", path: "/lists" },
          { name: hub.heading, path: `/lists/${hub.id}` },
        ])}
      />

      <header className="max-w-3xl">
        <Link
          href="/lists"
          className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/80 hover:text-emerald-300"
        >
          Card lists
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {hub.heading}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
          {hub.description}
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-baseline gap-3">
            <span
              className={`text-sm font-semibold tabular-nums ${
                hub.rule.impact === "up" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {hub.rule.impact === "up" ? "+" : "−"}
              {hub.rule.weight}
            </span>
            <span className="text-sm font-medium text-white">{hub.rule.label}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {hub.rule.reason}
          </p>
          <p className="mt-3 text-xs text-zinc-600">
            {hub.cardCount.toLocaleString()} cards match this rule.{" "}
            <Link href="/rules" className="underline underline-offset-2 hover:text-zinc-400">
              How the format works
            </Link>
          </p>
        </div>
      </header>

      <section className="mt-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {cards.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      </section>

      {rest.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">
            More cards that {hub.rule.label.toLowerCase()}
          </h2>
          <ul className="mt-4 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((card) => (
              <li key={card.slug} className="flex items-baseline justify-between gap-3 border-b border-white/5 py-1.5">
                <Link
                  href={`/cards/${card.slug}`}
                  className="truncate text-sm text-zinc-300 hover:text-white"
                >
                  {card.name}
                </Link>
                <span className="shrink-0 text-xs tabular-nums text-zinc-600">
                  {card.score}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {siblings.length > 0 && (
        <section className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-sm font-medium text-zinc-400">Related lists</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {siblings.map((sibling) => (
              <Link
                key={sibling.id}
                href={`/lists/${sibling.id}`}
                className="rounded-full px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-inset ring-white/15 transition hover:bg-white/5 hover:text-white"
              >
                {sibling.heading}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
