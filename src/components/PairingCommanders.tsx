import Link from "next/link";
import { cardImage, type ScryfallCard } from "@/lib/scryfall";
import { toSlug } from "@/lib/slug";
import type { Deck, DeckSlot } from "@/lib/team";
import { CardLink } from "./CardLink";

function Face({
  slot,
  deck,
  cards,
}: {
  slot: DeckSlot;
  deck: Deck;
  cards: Map<string, ScryfallCard>;
}) {
  // Up to two: Partner and Background decks are led by a pair.
  const commanders = deck.commanders.slice(0, 2);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex shrink-0 gap-1.5">
        {commanders.length > 0 ? (
          commanders.map((name) => {
            const card = cards.get(name);
            // Full card, not an art crop: the frame, mana cost and type line
            // are most of what makes a commander recognisable at a glance.
            const art = card ? cardImage(card, "normal") : null;
            return art ? (
              <Link key={name} href={`/cards/${toSlug(name)}`} title={name}>
                {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall CDN */}
                <img
                  src={art}
                  alt={name}
                  /* 63:88 is the real Magic card ratio, so nothing is cropped. */
                  className="w-16 rounded-md object-cover shadow-lg shadow-black/50 ring-1 ring-white/10 transition aspect-[63/88] hover:ring-white/30"
                />
              </Link>
            ) : (
              <span
                key={name}
                title={name}
                className="grid w-16 place-items-center rounded-md border border-dashed border-white/15 text-xs text-zinc-700 aspect-[63/88]"
              >
                {name.slice(0, 1)}
              </span>
            );
          })
        ) : (
          <span className="grid w-16 place-items-center rounded-md border border-dashed border-white/15 text-xs text-zinc-700 aspect-[63/88]">
            {slot.toUpperCase()}
          </span>
        )}
      </span>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {commanders.length > 0 ? (
            commanders.map((name, i) => {
              const card = cards.get(name);
              return (
                <span key={name}>
                  {i > 0 && <span className="text-zinc-600"> &amp; </span>}
                  <CardLink
                    name={name}
                    href={`/cards/${toSlug(name)}`}
                    image={card ? cardImage(card, "normal") : null}
                    className="hover:text-emerald-300"
                  />
                </span>
              );
            })
          ) : (
            <span className="text-zinc-600">No commander</span>
          )}
        </p>
        <p className="mt-0.5 truncate text-[11px] uppercase tracking-wider text-zinc-600">
          Deck {slot.toUpperCase()} · {deck.name}
        </p>
      </div>
    </div>
  );
}

/**
 * The commanders at the top of a shared page.
 *
 * A 2HG team is referred to by its commanders — "Yawgmoth and Sen Triplets" —
 * long before anyone reads either decklist, and on a link someone was *sent*
 * that recognition is the whole first impression. The names alone were already
 * in each deck's header; what was missing is the two cards.
 */
export function PairingCommanders({
  decks,
  cards,
}: {
  decks: { slot: DeckSlot; deck: Deck }[];
  cards: Map<string, ScryfallCard>;
}) {
  // Nothing to show beats an empty frame on a deck that never named one.
  if (decks.every((d) => d.deck.commanders.length === 0)) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
      {decks.map(({ slot, deck }, i) => (
        <span key={slot} className="flex min-w-0 items-center gap-x-6">
          {i > 0 && (
            <span aria-hidden="true" className="text-sm text-zinc-700">
              &amp;
            </span>
          )}
          <Face slot={slot} deck={deck} cards={cards} />
        </span>
      ))}
    </div>
  );
}
