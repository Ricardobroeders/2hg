"use client";

import { useTeam } from "@/lib/team-store";
import { FORMATS } from "@/lib/team";

/**
 * The unified deck rule, live. This is the check no other deckbuilder runs:
 * both decks validated as a single legal unit.
 */
export function LegalityPanel() {
  const { team, validation, loading } = useTeam();
  const rules = FORMATS[team.format];
  const { violations, sharedCards, counts } = validation;
  const empty = counts.combined === 0;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Team legality</h2>
        {!empty && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
              violations.length === 0
                ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30"
                : "bg-rose-400/15 text-rose-300 ring-rose-400/30"
            }`}
          >
            {violations.length === 0
              ? "Legal pairing"
              : `${violations.length} issue${violations.length === 1 ? "" : "s"}`}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-zinc-500">{rules.blurb}</p>

      {empty ? (
        <p className="mt-4 text-sm text-zinc-600">
          Add cards to either deck and both lists are validated together, live.
        </p>
      ) : (
        <>
          {violations.length > 0 && (
            <ul className="mt-4 space-y-2">
              {violations.map((v, i) => (
                <li
                  key={`${v.kind}-${v.cardName ?? i}`}
                  className="flex gap-2.5 rounded-lg bg-rose-500/10 p-3 text-sm leading-relaxed text-rose-200"
                >
                  <span aria-hidden className="shrink-0 text-rose-400">
                    !
                  </span>
                  <span>{v.message}</span>
                </li>
              ))}
            </ul>
          )}

          {sharedCards.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Cards in both decks
              </h3>
              <ul className="mt-2 space-y-1">
                {sharedCards.map((s) => (
                  <li
                    key={s.name}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate text-zinc-300">{s.name}</span>
                    <span className="shrink-0 font-mono text-xs text-zinc-500">
                      {s.a} + {s.b} = {s.total}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {loading && (
            <p className="mt-4 text-xs text-zinc-600">Loading card data…</p>
          )}
        </>
      )}
    </section>
  );
}
