import Link from "next/link";
import { cardImage, type ScryfallCard } from "@/lib/scryfall";
import { scoreCard } from "@/lib/twohg-score";
import { toSlug } from "@/lib/slug";
import { ScoreCorner } from "./ScoreBadge";
import { AddToTeam } from "./AddToTeam";

export function CardTile({ card }: { card: ScryfallCard }) {
  const image = cardImage(card, "normal");
  const score = scoreCard(card);
  const href = `/cards/${toSlug(card.name)}`;

  return (
    <div className="group flex flex-col gap-2">
      {/* The add buttons overlap the art but can't live inside the anchor — a
          <button> inside an <a> is invalid, and the anchor would swallow the
          click. They're siblings, stacked over it by this wrapper. */}
      <div className="relative">
        {/* `relative` is load-bearing: it makes this the score corner's
            containing block. Without it the corner is positioned by the
            wrapper above instead, and an ancestor only clips an absolute child
            that it actually contains — so `overflow-hidden` would stop
            rounding the badge and it would square off the tile's corner. */}
        <Link
          href={href}
          className="relative block overflow-hidden rounded-xl ring-1 ring-white/10 transition group-hover:ring-white/30"
        >
          {image ? (
            // Scryfall serves pre-sized card images; Next's optimizer adds cost
            // and latency for no gain here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={card.name}
              loading="lazy"
              className="aspect-[488/680] w-full bg-zinc-900 object-cover"
            />
          ) : (
            <div className="flex aspect-[488/680] w-full items-center justify-center bg-zinc-900 p-3 text-center text-sm text-zinc-400">
              {card.name}
            </div>
          )}
          <ScoreCorner score={score} />
        </Link>

        <div className="absolute right-2 top-2">
          <AddToTeam card={card} variant="overlay" />
        </div>
      </div>

      {/* Now has the whole tile width: the add buttons used to share this row
          and truncated the name to a few characters. */}
      <Link href={href} className="truncate text-sm text-zinc-200 hover:text-white">
        {card.name}
      </Link>
    </div>
  );
}
