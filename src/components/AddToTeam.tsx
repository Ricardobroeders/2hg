"use client";

import { useState } from "react";
import type { ScryfallCard } from "@/lib/scryfall";
import { useTeam } from "@/lib/team-store";
import type { DeckSlot } from "@/lib/team";

/**
 * `overlay` is the card-grid variant: the pair sits in the top-right corner of
 * the art, where the convention on every other card-grid site puts an add
 * control. Its idle fill is the design's warm near-black at 80% rather than a
 * tint, because card art is arbitrary and often bright — a translucent control
 * over Ghostly Prison's purple has to stay readable.
 */
const STYLES = {
  default: {
    base: "rounded-md px-3 py-2 text-sm ring-1 ring-inset transition",
    flash: "bg-emerald-400/40 text-white ring-emerald-300/60",
    held: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30 hover:bg-emerald-500/25",
    idle: "bg-transparent text-zinc-400 ring-white/10 hover:bg-white/10 hover:text-white",
  },
  overlay: {
    base: "rounded border px-2 py-2.5 text-sm leading-none transition",
    flash: "border-emerald-300/70 bg-emerald-400/40 text-white",
    held: "border-emerald-400/50 bg-emerald-900/80 text-emerald-200",
    idle: "border-[#222223] bg-[#14120d]/80 text-white hover:bg-[#14120d]",
  },
} as const;

/**
 * The single entry point for putting a card into the pairing. Deliberately
 * always offers both decks — choosing a side is the decision that makes 2HG
 * deckbuilding different, so we never hide it behind a default.
 */
export function AddToTeam({
  card,
  variant = "default",
}: {
  card: ScryfallCard;
  variant?: keyof typeof STYLES;
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
  const style = STYLES[variant];

  return (
    <div
      className={`flex items-center ${variant === "overlay" ? "gap-1.5" : "gap-2"}`}
    >
      {(["a", "b"] as const).map((slot) => {
        const count = slot === "a" ? inA : inB;
        const state = flash === slot ? "flash" : count > 0 ? "held" : "idle";
        return (
          <button
            key={slot}
            onClick={() => add(slot)}
            aria-label={
              count > 0
                ? `Add ${card.name} to Deck ${slot.toUpperCase()} (${count} already in it)`
                : `Add ${card.name} to Deck ${slot.toUpperCase()}`
            }
            className={`${style.base} ${style[state]} tabular-nums`}
          >
            {count > 0
              ? `${slot.toUpperCase()}${count}`
              : `+${slot.toUpperCase()}`}
          </button>
        );
      })}
    </div>
  );
}
