import { VENDORS, cardLink, priceFor } from "@/lib/affiliates";
import type { ScryfallCard } from "@/lib/scryfall";

/**
 * Buy CTAs for a single card. Rendered as a slot component so any surface
 * (card page, deck row, synergy list) can drop monetization in consistently.
 */
export function AffiliateButtons({ card }: { card: ScryfallCard }) {
  return (
    <div className="space-y-2">
      {VENDORS.map((vendor) => {
        const price = priceFor(card, vendor);
        return (
          <a
            key={vendor.id}
            href={cardLink(card, vendor.id)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 text-sm ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:ring-white/25"
          >
            <span className="text-zinc-200">{vendor.label}</span>
            <span className="tabular-nums text-zinc-400">
              {price ?? "View"}
              <span className="ml-2 text-zinc-600">↗</span>
            </span>
          </a>
        );
      })}
      <p className="pt-1 text-[11px] leading-relaxed text-zinc-600">
        Prices from Scryfall. Buy links are affiliate links — they cost you
        nothing extra and keep the database free.
      </p>
    </div>
  );
}
