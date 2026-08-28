"use client";

import { useTeam } from "@/lib/team-store";
import { cardImage } from "@/lib/scryfall";
import type { DeckSlot } from "@/lib/team";

function Face({ slot }: { slot: DeckSlot }) {
  const { team, cards } = useTeam();
  const name = team[slot].commanders[0] ?? null;
  const card = name ? cards.get(name) : undefined;
  // Full card, not an art crop: the frame, mana cost and type line are most
  // of what makes a commander recognisable at a glance.
  const art = card ? cardImage(card, "normal") : null;

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element -- Scryfall CDN
        <img
          src={art}
          alt={name ?? ""}
          /* 63:88 is the real Magic card ratio, so nothing is cropped. */
          className="w-14 shrink-0 rounded-md object-cover shadow-lg shadow-black/50 ring-1 ring-white/10 aspect-[63/88]"
        />
      ) : (
        <span className="grid w-14 shrink-0 place-items-center rounded-md border border-dashed border-white/15 text-xs text-zinc-700 aspect-[63/88]">
          {slot.toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p
          className={`truncate text-sm font-medium ${
            name ? "text-white" : "text-zinc-600"
          }`}
        >
          {name ?? "No commander yet"}
        </p>
        <p className="text-[11px] uppercase tracking-wider text-zinc-600">
          Deck {slot.toUpperCase()}
        </p>
      </div>
    </div>
  );
}

/**
 * The pairing's two commanders, side by side.
 *
 * This is how a 2HG team is actually referred to — "Atraxa and Krenko" — so
 * it belongs at the top of the builder, above the decklists that implement it.
 */
export function TeamCommanders() {
  const { team } = useTeam();
  const none = !team.a.commanders.length && !team.b.commanders.length;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
      <Face slot="a" />
      <span aria-hidden="true" className="text-sm text-zinc-700">
        &amp;
      </span>
      <Face slot="b" />

      {none && (
        <p className="w-full text-[11px] leading-relaxed text-zinc-600 sm:w-auto sm:flex-1 sm:text-right">
          Pick a commander in each deck to name your team.
        </p>
      )}
    </div>
  );
}
