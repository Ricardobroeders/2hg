"use client";

import { useEffect, useRef, useState } from "react";
import type { ScryfallCard } from "@/lib/scryfall";
import { useTeam } from "@/lib/team-store";
import type { DeckSlot } from "@/lib/team";

/**
 * In-builder card search. Picking a name adds it straight to the target deck
 * without leaving the page — the builder is a flow, not a browse surface.
 */
export function QuickAdd({ slot }: { slot: DeckSlot }) {
  const { addCard } = useTeam();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; names: string[] }>({
    q: "",
    names: [],
  });
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  const term = query.trim();
  // Derived rather than stored, so a stale query's names never show.
  const names = results.q === term ? results.names : [];

  useEffect(() => {
    if (term.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/autocomplete?q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((json: { names: string[] }) => {
          setResults({ q: term, names: json.names.slice(0, 6) });
          setActive(-1);
        })
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  async function pick(name: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: [name] }),
      });
      const json = (await res.json()) as { cards: ScryfallCard[] };
      const card = json.cards[0];
      if (card) {
        addCard(card, slot);
        setQuery("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={busy}
        placeholder={`Add a card to Deck ${slot.toUpperCase()}…`}
        aria-label={`Add a card to Deck ${slot.toUpperCase()}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, names.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, -1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            const name = active >= 0 ? names[active] : names[0];
            if (name) void pick(name);
          } else if (e.key === "Escape") {
            setResults({ q: "", names: [] });
            setQuery("");
          }
        }}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50"
      />

      {names.length > 0 && (
        <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-white/10 bg-zinc-950 shadow-2xl shadow-black/60">
          {names.map((name, i) => (
            <li key={name}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => void pick(name)}
                className={`block w-full px-3 py-2 text-left text-sm ${
                  i === active ? "bg-white/10 text-white" : "text-zinc-300"
                }`}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
