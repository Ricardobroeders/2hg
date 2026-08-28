"use client";

import { useState } from "react";
import { useTeam } from "@/lib/team-store";
import { FORMATS, teamAsDecklist, type FormatId } from "@/lib/team";
import { massEntryLink, teamPrice } from "@/lib/affiliates";

/**
 * Format switch, export, and the primary monetization surface: one action that
 * carts both decklists together.
 */
export function TeamActions() {
  const { team, cards, validation, setFormat, clear } = useTeam();
  const [copied, setCopied] = useState(false);

  const price = teamPrice(team, cards);
  const empty = validation.counts.combined === 0;

  async function copyList() {
    await navigator.clipboard.writeText(teamAsDecklist(team));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Format
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-white/5 p-1">
          {(Object.keys(FORMATS) as FormatId[]).map((id) => (
            <button
              key={id}
              onClick={() => setFormat(id)}
              className={`rounded-md px-3 py-2 text-xs font-medium transition ${
                team.format === id
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {FORMATS[id].label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
        <h2 className="text-sm font-semibold text-white">Buy the whole team</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
          Sends both decklists to a single TCGplayer cart — {validation.counts.combined}{" "}
          cards across Deck A and Deck B.
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
          href={empty ? undefined : massEntryLink(team)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-disabled={empty}
          className={`mt-4 block rounded-lg px-4 py-2.5 text-center text-sm font-medium transition ${
            empty
              ? "pointer-events-none bg-white/5 text-zinc-600"
              : "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
          }`}
        >
          Cart both decks →
        </a>
      </div>

      <div className="flex gap-2">
        <button
          onClick={copyList}
          disabled={empty}
          className="flex-1 rounded-lg px-3 py-2 text-sm text-zinc-300 ring-1 ring-inset ring-white/15 transition hover:bg-white/5 disabled:opacity-40"
        >
          {copied ? "Copied" : "Copy decklist"}
        </button>
        <button
          onClick={() => {
            if (confirm("Clear both decks? This can't be undone.")) clear();
          }}
          disabled={empty}
          className="rounded-lg px-3 py-2 text-sm text-zinc-500 ring-1 ring-inset ring-white/10 transition hover:text-rose-400 disabled:opacity-40"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
