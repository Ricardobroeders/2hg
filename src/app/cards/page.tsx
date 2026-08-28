import Link from "next/link";
import { searchCards } from "@/lib/scryfall";
import { scoreCard } from "@/lib/twohg-score";
import { CardTile } from "@/components/CardTile";

export const metadata = { title: "Card search" };

/** Shortcuts that translate a 2HG concept into a Scryfall query. */
const PRESETS = [
  { label: "Hits each opponent", query: 'oracle:"each opponent" -type:land' },
  { label: "Sweepers", query: 'oracle:"destroy all creatures"' },
  { label: "Extra turns", query: 'oracle:"take an extra turn"' },
  { label: "Team edicts", query: 'oracle:"each opponent sacrifices"' },
  { label: "Fog effects", query: 'oracle:"prevent all combat damage"' },
];

export default async function CardsPage({
  searchParams,
}: PageProps<"/cards">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const page = Number(typeof params.page === "string" ? params.page : 1) || 1;
  const sort = typeof params.sort === "string" ? params.sort : "2hg";

  const result = q
    ? await searchCards(q, {
        page,
        order: sort === "2hg" ? "edhrec" : sort,
      })
    : null;

  // The 2HG rating is computed here, not by Scryfall, so sorting by it happens
  // over the fetched page rather than the whole result set.
  const cards = result
    ? sort === "2hg"
      ? [...result.cards].sort((a, b) => scoreCard(b).score - scoreCard(a).score)
      : result.cards
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        {q ? (
          <>
            <span className="text-zinc-500">Results for</span>{" "}
            <span className="font-mono text-lg">{q}</span>
          </>
        ) : (
          "Card search"
        )}
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Link
            key={preset.label}
            href={`/cards?q=${encodeURIComponent(preset.query)}`}
            className={`rounded-full px-3 py-1.5 text-xs ring-1 ring-inset transition ${
              q === preset.query
                ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30"
                : "text-zinc-400 ring-white/10 hover:bg-white/5 hover:text-white"
            }`}
          >
            {preset.label}
          </Link>
        ))}
      </div>

      {!q && (
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Search accepts full{" "}
          <a
            href="https://scryfall.com/docs/syntax"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Scryfall syntax
          </a>{" "}
          — <span className="font-mono text-zinc-300">oracle:&quot;each opponent&quot; cmc&lt;=3</span>{" "}
          works. Results are re-ranked by their 2HG Rating.
        </p>
      )}

      {result && (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <p className="text-sm text-zinc-500">
              {result.totalCards.toLocaleString()} card
              {result.totalCards === 1 ? "" : "s"}
              {result.hasMore && " · showing page " + page}
            </p>
            <div className="flex gap-1 text-xs">
              {[
                { id: "2hg", label: "2HG Rating" },
                { id: "edhrec", label: "Popularity" },
                { id: "cmc", label: "Mana value" },
                { id: "usd", label: "Price" },
              ].map((option) => (
                <Link
                  key={option.id}
                  href={`/cards?q=${encodeURIComponent(q)}&sort=${option.id}`}
                  className={`rounded-md px-2.5 py-1.5 transition ${
                    sort === option.id
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>

          {cards.length === 0 ? (
            <p className="mt-12 text-center text-sm text-zinc-500">
              No cards matched that query.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {cards.map((card) => (
                <CardTile key={card.id} card={card} />
              ))}
            </div>
          )}

          <div className="mt-10 flex justify-center gap-3 text-sm">
            {page > 1 && (
              <Link
                href={`/cards?q=${encodeURIComponent(q)}&sort=${sort}&page=${page - 1}`}
                className="rounded-lg px-4 py-2 text-zinc-300 ring-1 ring-inset ring-white/15 hover:bg-white/5"
              >
                ← Previous
              </Link>
            )}
            {result.hasMore && (
              <Link
                href={`/cards?q=${encodeURIComponent(q)}&sort=${sort}&page=${page + 1}`}
                className="rounded-lg px-4 py-2 text-zinc-300 ring-1 ring-inset ring-white/15 hover:bg-white/5"
              >
                Next →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
