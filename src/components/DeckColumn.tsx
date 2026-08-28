"use client";

import Link from "next/link";
import { useTeam } from "@/lib/team-store";
import { FORMATS, type DeckSlot } from "@/lib/team";
import { scoreCard } from "@/lib/twohg-score";
import { toSlug } from "@/lib/slug";
import { CommanderPicker } from "./CommanderPicker";
import { QuickAdd } from "./QuickAdd";
import { SaveDeck } from "./SaveDeck";

export function DeckColumn({ slot }: { slot: DeckSlot }) {
  const { team, cards, validation, setQuantity, removeCard, renameDeck } = useTeam();
  const deck = team[slot];
  const rules = FORMATS[team.format];
  const count = validation.counts[slot];

  const shared = new Set(validation.sharedCards.map((s) => s.name));
  // Any card-level violation — over the combined limit, banned, or outside
  // the format's pool — gets flagged in place.
  const offending = new Map(
    validation.violations
      .filter((v) => v.cardName != null)
      .map((v) => [v.cardName!, v.message] as const),
  );

  // Highest-rated cards first — the builder's job is to surface the 2HG read.
  const entries = [...deck.entries].sort((a, b) => {
    const sa = cards.get(a.name);
    const sb = cards.get(b.name);
    if (!sa || !sb) return a.name.localeCompare(b.name);
    return scoreCard(sb).score - scoreCard(sa).score;
  });

  return (
    <section className="flex min-h-[28rem] flex-col rounded-2xl border border-white/10 bg-white/[0.02]">
      <header className="border-b border-white/10 p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-white/10 text-[11px] font-bold text-zinc-300">
            {slot.toUpperCase()}
          </span>
          <input
            value={deck.name}
            onChange={(e) => renameDeck(slot, e.target.value)}
            aria-label={`Deck ${slot.toUpperCase()} name`}
            className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-white outline-none hover:border-white/10 focus:border-emerald-400/40"
          />
          <span
            className={`shrink-0 text-xs tabular-nums ${
              count >= rules.minDeckSize ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            {count}/{rules.minDeckSize}
          </span>
        </div>
        {/* Commander sits above the card search: it defines the deck's colour
            identity, so it's the first decision, not another card added. */}
        <div className="mt-3">
          <CommanderPicker slot={slot} />
        </div>

        <div className="mt-3">
          <QuickAdd slot={slot} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-2">
        {entries.length === 0 ? (
          <p className="px-2 py-10 text-center text-sm text-zinc-600">
            Nothing here yet. Search above, or add cards from any card page.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {entries.map((entry) => {
              const card = cards.get(entry.name);
              const score = card ? scoreCard(card) : null;
              const isShared = shared.has(entry.name);
              const problem = offending.get(entry.name);

              return (
                <li
                  key={entry.name}
                  className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 transition ${
                    problem ? "bg-rose-500/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex shrink-0 items-center rounded ring-1 ring-inset ring-white/10">
                    <button
                      onClick={() => setQuantity(entry.name, slot, entry.quantity - 1)}
                      aria-label={`Remove one ${entry.name}`}
                      className="px-1.5 py-0.5 text-xs text-zinc-500 hover:text-white"
                    >
                      −
                    </button>
                    <span className="w-4 text-center text-xs tabular-nums text-zinc-300">
                      {entry.quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(entry.name, slot, entry.quantity + 1)}
                      aria-label={`Add one ${entry.name}`}
                      className="px-1.5 py-0.5 text-xs text-zinc-500 hover:text-white"
                    >
                      +
                    </button>
                  </div>

                  <Link
                    href={`/cards/${toSlug(entry.name)}`}
                    title={problem}
                    className={`min-w-0 flex-1 truncate text-sm hover:text-white ${
                      problem ? "text-rose-200" : "text-zinc-200"
                    }`}
                  >
                    {entry.name}
                  </Link>

                  {isShared && (
                    <span
                      title="Also in the other deck — counts toward the team's combined limit"
                      className="shrink-0 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300"
                    >
                      shared
                    </span>
                  )}

                  {score && (
                    <span
                      title={score.summary}
                      className={`shrink-0 text-xs tabular-nums ${
                        score.score >= 66
                          ? "text-emerald-400"
                          : score.score <= 40
                            ? "text-rose-400"
                            : "text-zinc-500"
                      }`}
                    >
                      {score.score}
                    </span>
                  )}

                  <button
                    onClick={() => removeCard(entry.name, slot)}
                    aria-label={`Remove ${entry.name} from Deck ${slot.toUpperCase()}`}
                    className="shrink-0 px-1 text-zinc-700 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <SaveDeck slot={slot} />
    </section>
  );
}
