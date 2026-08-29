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
            className="group flex items-center justify-between gap-3 rounded-lg bg-white/5 px-4 py-3 text-sm ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:ring-white/25"
          >
            <span className="flex min-w-0 items-center gap-3">
              {/* Marks are monochrome white, so they carry the row without
                  competing with the price. Dimmed until hover so the price
                  stays the thing you read first. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vendor.logo}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 shrink-0 opacity-70 transition group-hover:opacity-100"
              />
              <span className="truncate text-zinc-200">{vendor.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-zinc-400">
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
