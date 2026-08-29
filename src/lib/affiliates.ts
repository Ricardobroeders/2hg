/**
 * Affiliate link construction.
 *
 * Every outbound buy link on the site goes through here, so partner IDs live
 * in exactly one place and adding a new marketplace is a one-line change.
 * Links still work with no partner ID configured — the params are simply
 * omitted — which keeps local dev and previews honest.
 */

import type { ScryfallCard } from "./scryfall";
import type { TeamPairing } from "./team";
import { teamAsDecklist } from "./team";

const PARTNERS = {
  tcgplayer: process.env.NEXT_PUBLIC_TCGPLAYER_PARTNER ?? "",
  cardkingdom: process.env.NEXT_PUBLIC_CARDKINGDOM_PARTNER ?? "",
  cardmarket: process.env.NEXT_PUBLIC_CARDMARKET_PARTNER ?? "",
};

export type Vendor = {
  id: keyof typeof PARTNERS;
  label: string;
  /** Currency hint shown next to the price. */
  currency: "USD" | "EUR";
  /**
   * Monochrome mark in `public/images`. Lives here rather than in the button
   * component so adding a marketplace stays a one-line change in this file.
   */
  logo: string;
};

export const VENDORS: Vendor[] = [
  {
    id: "tcgplayer",
    label: "TCGplayer",
    currency: "USD",
    logo: "/images/tcg.svg",
  },
  {
    id: "cardkingdom",
    label: "Card Kingdom",
    currency: "USD",
    logo: "/images/cardkingdom.svg",
  },
  {
    id: "cardmarket",
    label: "Cardmarket",
    currency: "EUR",
    logo: "/images/cardmarket.svg",
  },
];

function withPartner(url: string, vendor: Vendor["id"]): string {
  const partner = PARTNERS[vendor];
  if (!partner) return url;

  const u = new URL(url);
  if (vendor === "tcgplayer") {
    u.searchParams.set("partner", partner);
    u.searchParams.set("utm_source", partner);
    u.searchParams.set("utm_medium", "affiliate");
    u.searchParams.set("utm_campaign", "2hg");
  } else if (vendor === "cardkingdom") {
    u.searchParams.set("partner", partner);
    u.searchParams.set("utm_source", partner);
  } else {
    u.searchParams.set("utm_source", partner);
    u.searchParams.set("utm_campaign", "2hg");
  }
  return u.toString();
}

/** Buy link for a single card. */
export function cardLink(card: ScryfallCard, vendor: Vendor["id"]): string {
  const name = encodeURIComponent(card.name);

  switch (vendor) {
    case "tcgplayer":
      return withPartner(
        `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${name}&view=grid`,
        vendor,
      );
    case "cardkingdom":
      return withPartner(
        `https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=${name}`,
        vendor,
      );
    case "cardmarket":
      return withPartner(
        `https://www.cardmarket.com/en/Magic/Products/Search?searchString=${name}`,
        vendor,
      );
  }
}

export function priceFor(card: ScryfallCard, vendor: Vendor): string | null {
  const raw = vendor.currency === "EUR" ? card.prices.eur : card.prices.usd;
  if (!raw) return null;
  const symbol = vendor.currency === "EUR" ? "€" : "$";
  return `${symbol}${raw}`;
}

/**
 * "Buy the whole team" — TCGplayer Mass Entry takes a newline-delimited
 * decklist, so one click carts both decks at once. This is the highest-intent
 * conversion point on the site.
 */
export function massEntryLink(team: TeamPairing): string {
  const list = teamAsDecklist(team)
    .split("\n")
    .map((line) => `${line}||`)
    .join("\n");

  const u = new URL("https://www.tcgplayer.com/massentry");
  u.searchParams.set("productline", "Magic");
  u.searchParams.set("c", list);

  const partner = PARTNERS.tcgplayer;
  if (partner) {
    u.searchParams.set("partner", partner);
    u.searchParams.set("utm_source", partner);
    u.searchParams.set("utm_medium", "affiliate");
    u.searchParams.set("utm_campaign", "team-cart");
  }
  return u.toString();
}

/** Rough cart total, used to make the buy CTA concrete. */
export function teamPrice(
  team: TeamPairing,
  cards: Map<string, ScryfallCard>,
): number | null {
  let total = 0;
  let priced = 0;

  for (const deck of [team.a, team.b]) {
    for (const entry of deck.entries) {
      const usd = cards.get(entry.name)?.prices.usd;
      if (!usd) continue;
      total += Number(usd) * entry.quantity;
      priced++;
    }
  }

  return priced > 0 ? total : null;
}
