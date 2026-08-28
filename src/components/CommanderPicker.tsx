"use client";

import { useEffect, useRef, useState } from "react";
import { useTeam } from "@/lib/team-store";
import { canBeCommander, cardImage, type ScryfallCard } from "@/lib/scryfall";
import type { DeckSlot } from "@/lib/team";

/**
 * Choose a deck's commander.
 *
 * In a Commander-first product the commander is the deck's identity — it
 * decides the colour identity every other card is checked against, and it's
 * how a pairing gets described ("Atraxa and Krenko"). So it gets its own
 * control at the top of the deck rather than being just another card.
 *
 * Legality is checked after resolving the pick, not by filtering the
 * typeahead: Scryfall's autocomplete has no type filter, and silently hiding
 * results a user typed correctly is worse than telling them why one won't work.
 */
export function CommanderPicker({ slot }: { slot: DeckSlot }) {
  const { team, cards, setCommander } = useTeam();
  const deck = team[slot];
  const current = deck.commanders[0] ?? null;
  const currentCard = current ? cards.get(current) : undefined;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; names: string[] }>({
    q: "",
    names: [],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const term = query.trim();
  const names = results.q === term ? results.names : [];

  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/autocomplete?q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((json: { names: string[] }) =>
          setResults({ q: term, names: json.names.slice(0, 6) }),
        )
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  // Close on outside click, so the panel doesn't linger over the deck list.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function pick(name: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: [name] }),
      });
      const json = (await res.json()) as { cards?: ScryfallCard[] };
      const card = json.cards?.[0];

      if (!card) {
        setError("Couldn't find that card.");
        return;
      }
      if (!canBeCommander(card)) {
        setError(`${card.name} can't be a commander — it isn't a legendary creature.`);
        return;
      }

      setCommander(slot, card);
      setOpen(false);
      setQuery("");
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  // Full card rather than a crop — see TeamCommanders. "small" is plenty at
  // this size and keeps the builder light when both decks have one.
  const art = currentCard ? cardImage(currentCard, "small") : null;

  return (
    <div ref={boxRef} className="relative">
      {current ? (
        <div className="flex items-center gap-2.5">
          {art ? (
            // eslint-disable-next-line @next/next/no-img-element -- Scryfall CDN
            <img
              src={art}
              alt={current}
              className="w-10 shrink-0 rounded object-cover shadow-md shadow-black/50 ring-1 ring-white/10 aspect-[63/88]"
            />
          ) : (
            <span className="w-10 shrink-0 rounded bg-white/5 ring-1 ring-white/10 aspect-[63/88]" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{current}</p>
            <p className="text-[11px] text-zinc-500">Commander</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 rounded px-2 py-1 text-[11px] text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            Change
          </button>
          <button
            type="button"
            onClick={() => setCommander(slot, null)}
            aria-label="Remove commander"
            className="shrink-0 px-1 text-zinc-600 transition hover:text-rose-400"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-lg border border-dashed border-white/15 px-2.5 py-2 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.03]"
        >
          <span className="grid w-10 shrink-0 place-items-center rounded bg-white/5 text-zinc-600 aspect-[63/88]">
            +
          </span>
          <span className="text-xs text-zinc-400">Choose a commander</span>
        </button>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-xl shadow-black/60">
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            placeholder="Search legendary creatures…"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-emerald-400/40"
          />

          {error && (
            <p className="mt-2 px-1 text-[11px] leading-relaxed text-rose-300">
              {error}
            </p>
          )}

          <ul className="mt-1.5 max-h-56 overflow-y-auto">
            {names.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => pick(name)}
                  className="w-full truncate rounded px-2 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  {name}
                </button>
              </li>
            ))}
            {term.length >= 2 && names.length === 0 && !busy && (
              <li className="px-2 py-1.5 text-[11px] text-zinc-600">
                No matches.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
