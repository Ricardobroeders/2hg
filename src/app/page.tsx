import Link from "next/link";
import { searchCards } from "@/lib/scryfall";
import { scoreCard } from "@/lib/twohg-score";
import { CardSearch } from "@/components/CardSearch";
import { CardTile } from "@/components/CardTile";

/**
 * Shelves are curated Scryfall queries rather than hand-written card lists, so
 * the front page stays current as new sets legalise new "each opponent" cards.
 */
const SHELVES = [
  {
    title: "Doubled by two opponents",
    blurb:
      "Every 'each opponent' clause resolves twice against one shared 30-life pool. These are the cards that quietly double in power.",
    query: 'oracle:"each opponent" -type:land legal:commander',
  },
  {
    title: "Two boards, one card",
    blurb:
      "You're answering two developed battlefields. Sweepers are premium removal here, not a last resort.",
    query: 'oracle:"destroy all creatures" legal:commander',
  },
  {
    title: "Shared turns, doubled tempo",
    blurb:
      "Teammates take one turn together, so an extra turn is an extra turn for both players.",
    query: 'oracle:"take an extra turn" legal:commander',
  },
] as const;

export default async function HomePage() {
  const shelves = await Promise.all(
    SHELVES.map(async (shelf) => ({
      ...shelf,
      cards: (await searchCards(shelf.query, { order: "edhrec" })).cards.slice(0, 6),
    })),
  );

  const topCard = shelves[0].cards[0];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.14),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/80">
            Magic: The Gathering · Two-Headed Giant · EDH
          </p>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
            If you can&rsquo;t beat them,{" "}
            <span className="text-emerald-400">join them</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-zinc-400">
            Shared life. Shared turns. Two opponents. Two Headed Giant (2HG)
            changes what a card is worth, and no existing database models it.
            This one does — card ratings, team synergy and a builder that
            validates both decks as a single unit.
          </p>

          <div className="mx-auto mt-9 max-w-xl">
            <CardSearch autoFocus />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <Link
              href="/deck-builder"
              className="rounded-lg bg-emerald-400 px-4 py-2.5 font-medium text-zinc-950 transition hover:bg-emerald-300"
            >
              Build a team pairing
            </Link>
            <Link
              href="/cards?q=oracle%3A%22each+opponent%22+-type%3Aland"
              className="rounded-lg px-4 py-2.5 text-zinc-300 ring-1 ring-inset ring-white/15 transition hover:bg-white/5 hover:text-white"
            >
              Browse the format staples
            </Link>
          </div>
        </div>
      </section>

      {topCard && (
        <section className="border-b border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  stat: `${scoreCard(topCard).score}/100`,
                  label: "2HG Rating",
                  body: `${topCard.name} scores this high because its drain hits each opponent — off one shared life total, the printed number effectively doubles.`,
                },
                {
                  stat: "4 combined",
                  label: "Unified deck rule",
                  body: "A team may run four copies of a card across both decks — not four each. Our builder validates Deck A and Deck B together, so illegal pairings surface while you build.",
                },
                {
                  stat: "1 click",
                  label: "Buy the whole team",
                  body: "Send both decklists to a cart in a single action, instead of exporting two lists and reconciling them by hand.",
                },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-2xl font-semibold tabular-nums text-emerald-400">
                    {item.stat}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-white">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6">
        {shelves.map((shelf) => (
          <section key={shelf.title}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  {shelf.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  {shelf.blurb}
                </p>
              </div>
              <Link
                href={`/cards?q=${encodeURIComponent(shelf.query)}`}
                className="shrink-0 text-sm text-emerald-400 hover:text-emerald-300"
              >
                See all →
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {shelf.cards.map((card) => (
                <CardTile key={card.id} card={card} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
