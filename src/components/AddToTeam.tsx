"use client";

import { useState } from "react";
import type { ScryfallCard } from "@/lib/scryfall";
import { useTeam } from "@/lib/team-store";
import type { DeckSlot } from "@/lib/team";

/**
 * The single entry point for putting a card into the pairing. Deliberately
 * always offers both decks — choosing a side is the decision that makes 2HG
 * deckbuilding different, so we never hide it behind a default.
 */
export function AddToTeam({
  card,
  compact = false,
}: {
  card: ScryfallCard;
  compact?: boolean;
}) {
  const { addCard, team } = useTeam();
  const [flash, setFlash] = useState<DeckSlot | null>(null);

  function add(slot: DeckSlot) {
    addCard(card, slot);
    setFlash(slot);
    setTimeout(() => setFlash(null), 700);
  }

  const inA = team.a.entries.find((e) => e.name === card.name)?.quantity ?? 0;
  const inB = team.b.entries.find((e) => e.name === card.name)?.quantity ?? 0;

  return (
    <div className={`flex items-center ${compact ? "gap-1" : "gap-2"}`}>
      {(["a", "b"] as const).map((slot) => {
        const count = slot === "a" ? inA : inB;
        return (
          <button
            key={slot}
            onClick={() => add(slot)}
            aria-label={`Add ${card.name} to Deck ${slot.toUpperCase()}`}
            className={`rounded-md ring-1 ring-inset transition ${
              compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
            } ${
              flash === slot
                ? "bg-emerald-400/25 text-emerald-200 ring-emerald-400/40"
                : count > 0
                  ? "bg-white/10 text-white ring-white/20 hover:bg-white/20"
                  : "bg-transparent text-zinc-400 ring-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            +{slot.toUpperCase()}
            {count > 0 && <span className="ml-1 tabular-nums opacity-70">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
