"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toSlug } from "@/lib/slug";

/** Debounced Scryfall typeahead. Enter runs a full search; a pick jumps to the card. */
export function CardSearch({
  autoFocus = false,
  placeholder = "Search cards — try “Gray Merchant of Asphodel”",
  size = "lg",
}: {
  autoFocus?: boolean;
  placeholder?: string;
  size?: "sm" | "lg";
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  // Results are stored with the query that produced them, so suggestions for
  // a stale keystroke can be derived away rather than cleared via setState.
  const [results, setResults] = useState<{ q: string; names: string[] }>({
    q: "",
    names: [],
  });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  const term = query.trim();
  const suggestions = results.q === term ? results.names : [];

  useEffect(() => {
    if (term.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/autocomplete?q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((json: { names: string[] }) => {
          setResults({ q: term, names: json.names.slice(0, 8) });
          setActive(-1);
        })
        .catch(() => {});
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(name: string) {
    setOpen(false);
    router.push(`/cards/${toSlug(name)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && suggestions[active]) go(suggestions[active]);
      else if (term) {
        setOpen(false);
        router.push(`/cards?q=${encodeURIComponent(term)}`);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <input
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="Search cards"
        className={`w-full rounded-xl border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-emerald-400/40 focus:bg-white/[0.07] focus:ring-2 focus:ring-emerald-400/20 ${
          size === "lg" ? "px-5 py-4 text-base" : "px-3 py-2 text-sm"
        }`}
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50">
          {suggestions.map((name, i) => (
            <li key={name}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(name)}
                className={`block w-full px-4 py-2.5 text-left text-sm ${
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
