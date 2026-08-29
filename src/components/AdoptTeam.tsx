"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ScryfallCard } from "@/lib/scryfall";
import type { TeamPairing } from "@/lib/team";
import { useTeam } from "@/lib/team-store";
import { massEntryLink, teamPrice } from "@/lib/affiliates";

/**
 * The two things a teammate does when they open a shared link: take a copy to
 * tinker with, or buy the cards. Card data is passed down from the server
 * render, so adopting the pairing costs no extra round trips.
 */
export function AdoptTeam({
  team,
  cards,
}: {
  team: TeamPairing;
  cards: ScryfallCard[];
}) {
  const { replaceTeam, validation } = useTeam();
  const router = useRouter();
  const [taken, setTaken] = useState(false);

  const cardMap = new Map(cards.map((c) => [c.name, c]));
  const price = teamPrice(team, cardMap);
  const hasExisting = validation.counts.combined > 0;

  function adopt() {
    if (
      hasExisting &&
      !confirm("This replaces the pairing currently in your builder. Continue?")
    ) {
      return;
    }
    // A copy, not a claim — the original link keeps working for its owner.
    replaceTeam({ ...team, id: "local" }, cards);
    setTaken(true);
    router.push("/deck-builder");
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={adopt}
        disabled={taken}
        className="w-full rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-60"
      >
        {taken ? "Opening…" : "Open a copy in my builder"}
      </button>

      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
        <h2 className="text-sm font-semibold text-white">Buy the whole team</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
          Both decklists into a single TCGplayer cart.
        </p>

        {price != null && (
          <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
            ~${price.toFixed(2)}
            <span className="ml-2 text-xs font-normal text-zinc-500">
              market estimate
            </span>
          </p>
        )}

        <a
          href={massEntryLink(team)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-4 block rounded-lg bg-emerald-400 px-4 py-2.5 text-center text-sm font-medium text-zinc-950 transition hover:bg-emerald-300"
        >
          Cart both decks →
        </a>
      </div>
    </div>
  );
}
