"use client";

import { useEffect, useState } from "react";
import type { ScryfallCard } from "@/lib/scryfall";
import { cardByName } from "@/lib/scryfall-browser";
import { AffiliateButtons } from "./AffiliateButtons";

/**
 * Buy links whose prices arrive from the visitor's browser.
 *
 * Prices are the one thing on a card page that can't be cached — they move
 * daily, and the page around them is cached for 90 days. Fetching them during
 * the server render is what used to tie card pages to Scryfall's rate limit;
 * fetching them here costs one request on the visitor's own quota.
 *
 * The first paint is the stored card, which has no prices, so every button
 * reads "View" and already works. A failed lookup simply leaves it that way.
 */
export function LiveBuyButtons({ card }: { card: ScryfallCard }) {
  const [priced, setPriced] = useState<ScryfallCard | null>(null);

  useEffect(() => {
    let cancelled = false;
    cardByName(card.name)
      .then((live) => {
        if (!cancelled && live) setPriced(live);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [card.name]);

  return <AffiliateButtons card={priced ?? card} />;
}
