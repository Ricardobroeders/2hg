import type { Metadata } from "next";
import Link from "next/link";
import { listHubs } from "@/lib/lists";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Two-Headed Giant card lists",
  description:
    "Every way Two-Headed Giant changes what a card is worth, and the cards most affected by each — sweepers, extra turns, “each opponent” effects, and the cards that quietly get worse.",
  alternates: { canonical: "/lists" },
  openGraph: { url: "/lists" },
};

/** Static: the hubs come from the committed corpus, so there's nothing to fetch. */
export default function ListsIndexPage() {
  const hubs = listHubs();
  const gains = hubs.filter((hub) => hub.rule.impact === "up");
  const loses = hubs.filter((hub) => hub.rule.impact === "down");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbSchema([{ name: "Lists", path: "/lists" }])} />

      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/80">
          Card lists
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          What the format changes
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
          Two-Headed Giant moves card values in a small number of specific ways.
          Each list below is one of them, with the cards it affects most,
          ordered by 2HG Rating.
        </p>
      </header>

      {[
        { title: "Cards that gain in 2HG", hubs: gains },
        { title: "Cards that lose value in 2HG", hubs: loses },
      ].map((group) => (
        <section key={group.title} className="mt-12">
          <h2 className="text-lg font-semibold text-white">{group.title}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {group.hubs.map((hub) => (
              <Link
                key={hub.id}
                href={`/lists/${hub.id}`}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/25 hover:bg-white/[0.04]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-medium text-white">
                    {hub.heading}
                  </h3>
                  <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                    {hub.cardCount}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {hub.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
