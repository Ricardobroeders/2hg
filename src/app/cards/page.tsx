import Link from "next/link";
import { searchCards } from "@/lib/scryfall";
import { scoreCard } from "@/lib/twohg-score";
import { CardTile } from "@/components/CardTile";
import {
  COLORLESS,
  COLORS,
  colorQuery,
  parseColors,
  toggleColor,
} from "@/lib/colors";

export const metadata = { title: "Card search" };

/** Shortcuts that translate a 2HG concept into a Scryfall query. */
const PRESETS = [
  { label: "Hits each opponent", query: 'oracle:"each opponent" -type:land' },
  { label: "Sweepers", query: 'oracle:"destroy all creatures"' },
  { label: "Extra turns", query: 'oracle:"take an extra turn"' },
  { label: "Team edicts", query: 'oracle:"each opponent sacrifices"' },
  { label: "Fog effects", query: 'oracle:"prevent all combat damage"' },
];

const SORTS = [
  { id: "2hg", label: "2HG Rating" },
  { id: "edhrec", label: "Popularity" },
  { id: "cmc", label: "Mana value" },
  { id: "usd", label: "Price" },
];

/**
 * Build a /cards URL, carrying the parts of the current view that aren't
 * being changed. Page deliberately resets on every filter or sort change —
 * staying on page 7 of a result set you just replaced is never what's wanted.
 */
function href(state: {
  q: string;
  sort: string;
  colors: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.colors) params.set("colors", state.colors);
  if (state.sort !== "2hg") params.set("sort", state.sort);
  if (state.page && state.page > 1) params.set("page", String(state.page));
  const qs = params.toString();
  return qs ? `/cards?${qs}` : "/cards";
}

export default async function CardsPage({
  searchParams,
}: PageProps<"/cards">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const page = Number(typeof params.page === "string" ? params.page : 1) || 1;
  const sort = typeof params.sort === "string" ? params.sort : "2hg";
  const colors = parseColors(params.colors);

  // Colours are a real query on their own — clicking "Red" with an empty
  // search box should show red cards, not the empty state.
  const query = [q, colorQuery(colors)].filter(Boolean).join(" ");

  const result = query
    ? await searchCards(query, {
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

  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs ring-1 ring-inset transition ${
      active
        ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30"
        : "text-zinc-400 ring-white/10 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        {q ? (
          <>
            <span className="text-zinc-500">Results for</span>{" "}
            <span className="font-mono text-lg">{q}</span>
          </>
        ) : colors ? (
          <>
            <span className="text-zinc-500">All</span>{" "}
            {colors === COLORLESS
              ? "colourless cards"
              : COLORS.filter((c) => colors.includes(c.code))
                  .map((c) => c.label.toLowerCase())
                  .join(" + ") + " cards"}
          </>
        ) : (
          "Card search"
        )}
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Link
            key={preset.label}
            href={href({ q: preset.query, sort, colors })}
            className={chipClass(q === preset.query)}
          >
            {preset.label}
          </Link>
        ))}
      </div>

      {/* Colour filter. Each chip carries its own pip so the row is readable
          at a glance without relying on the label alone. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {COLORS.map((color) => {
          const active = colors.includes(color.code);
          return (
            <Link
              key={color.code}
              href={href({ q, sort, colors: toggleColor(colors, color.code) })}
              aria-pressed={active}
              className={`flex items-center gap-1.5 ${chipClass(active)}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/mana/${color.code}.svg`}
                alt=""
                className={`h-4 w-4 ${active ? "" : "opacity-70"}`}
              />
              {color.label}
            </Link>
          );
        })}
        <Link
          href={href({ q, sort, colors: toggleColor(colors, COLORLESS) })}
          aria-pressed={colors === COLORLESS}
          className={`flex items-center gap-1.5 ${chipClass(colors === COLORLESS)}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/mana/c.svg"
            alt=""
            className={`h-4 w-4 ${colors === COLORLESS ? "" : "opacity-70"}`}
          />
          Colourless
        </Link>

        {colors && (
          <Link
            href={href({ q, sort, colors: "" })}
            className="px-1 text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
          >
            Clear
          </Link>
        )}
      </div>

      {!result && (
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
              {SORTS.map((option) => (
                <Link
                  key={option.id}
                  href={href({ q, sort: option.id, colors })}
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
                href={href({ q, sort, colors, page: page - 1 })}
                className="rounded-lg px-4 py-2 text-zinc-300 ring-1 ring-inset ring-white/15 hover:bg-white/5"
              >
                ← Previous
              </Link>
            )}
            {result.hasMore && (
              <Link
                href={href({ q, sort, colors, page: page + 1 })}
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
