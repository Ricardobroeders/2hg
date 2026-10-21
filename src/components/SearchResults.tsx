"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { scoreCard } from "@/lib/twohg-score";
import { searchCards, type SearchResult } from "@/lib/scryfall-browser";
import { CardTile } from "./CardTile";

type NavLink = { id: string; label: string; href: string };

/**
 * One page of card-search results, fetched by the visitor's browser.
 *
 * This page was the site's one unbounded crawl space — query x colour x sort x
 * page — and every URL in it was a live Scryfall search run on our server.
 * Running it here means a crawler that ignores `Disallow: /cards?` gets the
 * filter chips and nothing to follow, and a person searching spends their own
 * Scryfall quota rather than ours.
 */
export function SearchResults({
  query,
  page,
  sort,
  sorts,
  prevHref,
  nextHref,
}: {
  query: string;
  page: number;
  sort: string;
  sorts: NavLink[];
  prevHref: string | null;
  nextHref: string;
}) {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    searchCards(query, {
      page,
      order: sort === "2hg" ? "edhrec" : sort,
      signal: controller.signal,
    })
      .then(setResult)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [query, page, sort]);

  if (failed) {
    return (
      <p className="mt-12 text-center text-sm text-zinc-500">
        Scryfall didn&apos;t answer. Try again in a moment.
      </p>
    );
  }

  if (!result) {
    return (
      <div aria-busy="true" className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="aspect-[488/680] w-full rounded-xl bg-white/5 ring-1 ring-white/10" />
        ))}
      </div>
    );
  }

  // The 2HG rating is computed here, not by Scryfall, so sorting by it happens
  // over the fetched page rather than the whole result set.
  const cards =
    sort === "2hg"
      ? [...result.cards].sort((a, b) => scoreCard(b).score - scoreCard(a).score)
      : result.cards;

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <p className="text-sm tabular-nums text-zinc-500">
          {result.totalCards.toLocaleString()} card
          {result.totalCards === 1 ? "" : "s"}
          {result.hasMore && " · showing page " + page}
        </p>
        <div className="flex gap-1 text-xs">
          {sorts.map((option) => (
            <Link
              key={option.id}
              href={option.href}
              rel="nofollow"
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
        {prevHref && (
          <Link
            href={prevHref}
            rel="nofollow"
            className="rounded-lg px-4 py-2 text-zinc-300 ring-1 ring-inset ring-white/15 hover:bg-white/5"
          >
            ← Previous
          </Link>
        )}
        {result.hasMore && (
          <Link
            href={nextHref}
            rel="nofollow"
            className="rounded-lg px-4 py-2 text-zinc-300 ring-1 ring-inset ring-white/15 hover:bg-white/5"
          >
            Next →
          </Link>
        )}
      </div>
    </>
  );
}
