"use client";

import { Suspense } from "react";
import { useTeam } from "@/lib/team-store";
import { OpenSaved } from "@/components/OpenSaved";
import { DeckColumn } from "@/components/DeckColumn";
import { LegalityPanel } from "@/components/LegalityPanel";
import { TeamActions } from "@/components/TeamActions";
import { TeamCommanders } from "@/components/TeamCommanders";
import { scoreCard } from "@/lib/twohg-score";

export default function DeckBuilderPage() {
  const { team, cards, validation, hydrated, setTeamName } = useTeam();

  // Average 2HG rating across the pairing — the headline "is this a 2HG deck?" number.
  const scored = [...team.a.entries, ...team.b.entries]
    .map((e) => cards.get(e.name))
    .filter((c) => c != null)
    .map((c) => scoreCard(c!).score);
  const avg = scored.length
    ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <input
            value={team.name}
            onChange={(e) => setTeamName(e.target.value)}
            aria-label="Team name"
            className="w-full max-w-md rounded-lg border border-transparent bg-transparent px-2 py-1 text-2xl font-semibold tracking-tight text-white outline-none hover:border-white/10 focus:border-emerald-400/40"
          />
          {/* Not "one legal unit" — 2HG Commander has no unified deck rule.
              Each deck is individually legal; what's shared is the game. */}
          <p className="mt-1 px-2 text-sm text-zinc-500">
            Two Commander decks, one shared life total — rated as a team.
          </p>
        </div>

        {avg != null && (
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums text-emerald-400">
              {avg}
              <span className="text-base font-normal text-zinc-600">/100</span>
            </p>
            <p className="text-xs text-zinc-500">Average 2HG rating</p>
          </div>
        )}
      </header>

      {/* useSearchParams needs a boundary so the rest of the builder can still
          be prerendered as a static shell. */}
      <Suspense fallback={null}>
        <OpenSaved />
      </Suspense>

      {!hydrated ? (
        <p className="py-24 text-center text-sm text-zinc-600">Loading your team…</p>
      ) : (
        <>
        <div className="mt-8">
          <TeamCommanders />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,320px)]">
          <DeckColumn slot="a" />
          <DeckColumn slot="b" />

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <TeamActions />
            <LegalityPanel />

            <p className="text-xs leading-relaxed text-zinc-600">
              This pairing lives in your browser until you save it —{" "}
              {validation.counts.combined} cards are saved locally right now.
            </p>
          </aside>
        </div>
        </>
      )}
    </div>
  );
}
