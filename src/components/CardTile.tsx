import Link from "next/link";
import { cardImage, type ScryfallCard } from "@/lib/scryfall";
import { scoreCard } from "@/lib/twohg-score";
import { toSlug } from "@/lib/slug";
import { ScoreBadge } from "./ScoreBadge";
import { AddToTeam } from "./AddToTeam";

export function CardTile({ card }: { card: ScryfallCard }) {
  const image = cardImage(card, "normal");
  const score = scoreCard(card);

  return (
    <div className="group relative flex flex-col gap-2">
      <Link
        href={`/cards/${toSlug(card.name)}`}
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
        <div className="absolute left-2 top-2">
          <ScoreBadge score={score} />
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/cards/${toSlug(card.name)}`}
          className="truncate text-sm text-zinc-200 hover:text-white"
        >
          {card.name}
        </Link>
        <AddToTeam card={card} compact />
      </div>
    </div>
  );
}
