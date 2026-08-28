"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ScryfallCard } from "@/lib/scryfall";
import { parseDecklist } from "@/lib/decklist";
import { useTeam, type ImportMode } from "@/lib/team-store";
import { FORMATS, type DeckSlot } from "@/lib/team";

type ImportResult = {
  slot: DeckSlot;
  cardCount: number;
  distinct: number;
  commanders: string[];
  notFound: string[];
};

const PLACEHOLDER = `1 Atraxa, Praetors' Voice (2XM) 197 *CMDR*
1 Sol Ring
1 Arcane Signet
1x Cultivate
36 Forest`;

export function DeckImporter() {
  const { team, importDeck } = useTeam();
  const rules = FORMATS[team.format];

  const [text, setText] = useState("");
  const [slot, setSlot] = useState<DeckSlot>("a");
  const [mode, setMode] = useState<ImportMode>("replace");
  const [deckName, setDeckName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Parsing is local and cheap, so the preview updates as they paste. Only
  // resolution costs a round trip.
  const parsed = useMemo(() => parseDecklist(text), [text]);

  // Commander has no sideboard, so those sections are previewed but not imported.
  const importable = parsed.entries.filter(
    (e) => e.section === "main" || e.section === "commander",
  );
  const setAside = parsed.entries.length - importable.length;
  const cardCount = importable.reduce((n, e) => n + e.quantity, 0);

  async function runImport() {
    if (importable.length === 0) return;
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: [...new Set(importable.map((e) => e.name)) ] }),
      });

      const json = (await res.json()) as {
        resolved?: Record<string, ScryfallCard>;
        notFound?: string[];
        error?: string;
      };

      if (!res.ok) {
        setError(json.error ?? "Import failed. Try again in a moment.");
        return;
      }

      const resolved = json.resolved ?? {};

      // Collapse to canonical names — two spellings of the same card, or the
      // same card listed once per printing, become one entry.
      const quantities = new Map<string, number>();
      const commanders = new Set<string>();
      const seen = new Map<string, ScryfallCard>();

      for (const entry of importable) {
        const card = resolved[entry.name];
        if (!card) continue;
        quantities.set(
          card.name,
          (quantities.get(card.name) ?? 0) + entry.quantity,
        );
        seen.set(card.name, card);
        if (entry.section === "commander") commanders.add(card.name);
      }

      if (quantities.size === 0) {
        setError("None of those lines matched a real card.");
        return;
      }

      const entries = [...quantities.entries()].map(([name, quantity]) => ({
        name,
        quantity,
      }));

      importDeck(
        slot,
        {
          name: deckName.trim() || undefined,
          entries,
          commanders: [...commanders],
          cards: [...seen.values()],
        },
        mode,
      );

      setResult({
        slot,
        cardCount: entries.reduce((n, e) => n + e.quantity, 0),
        distinct: entries.length,
        commanders: [...commanders],
        notFound: json.notFound ?? [],
      });
      setText("");
      setDeckName("");
    } catch {
      setError("Couldn't reach the server. Check your connection and retry.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-6">
        <p className="text-lg font-semibold text-white">
          {result.cardCount} cards imported into Deck{" "}
          {result.slot.toUpperCase()}
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          {result.distinct} distinct cards
          {result.commanders.length > 0 && (
            <> · commanding {result.commanders.join(" and ")}</>
          )}
        </p>

        {result.notFound.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] p-3">
            <p className="text-sm font-medium text-amber-300">
              {result.notFound.length} line
              {result.notFound.length === 1 ? "" : "s"} didn&apos;t match a card
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
              {result.notFound.join(", ")}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link
            href="/team"
            className="rounded-lg bg-emerald-400 px-4 py-2.5 font-medium text-zinc-950 transition hover:bg-emerald-300"
          >
            Open the team builder
          </Link>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setSlot(result.slot === "a" ? "b" : "a");
            }}
            className="rounded-lg px-4 py-2.5 text-zinc-300 ring-1 ring-inset ring-white/15 transition hover:bg-white/5 hover:text-white"
          >
            Import the partner deck
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Import into
          </legend>
          <div className="mt-2 flex rounded-lg ring-1 ring-inset ring-white/15">
            {(["a", "b"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlot(s)}
                aria-pressed={slot === s}
                className={`px-4 py-2 text-sm transition first:rounded-l-lg last:rounded-r-lg ${
                  slot === s
                    ? "bg-emerald-400 font-medium text-zinc-950"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Deck {s.toUpperCase()}
                <span className="ml-1.5 text-xs opacity-60">
                  {team[s].entries.length > 0
                    ? `· ${team[s].entries.length}`
                    : "· empty"}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            If the deck isn&apos;t empty
          </legend>
          <div className="mt-2 flex rounded-lg ring-1 ring-inset ring-white/15">
            {(
              [
                ["replace", "Replace it"],
                ["merge", "Add to it"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-pressed={mode === value}
                className={`px-4 py-2 text-sm transition first:rounded-l-lg last:rounded-r-lg ${
                  mode === value
                    ? "bg-white/10 font-medium text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="min-w-[12rem] flex-1">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Deck name <span className="normal-case opacity-60">(optional)</span>
          </span>
          <input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder={team[slot].name}
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-400/50"
          />
        </label>
      </div>

      <div>
        <label
          htmlFor="decklist"
          className="text-xs font-medium uppercase tracking-wider text-zinc-500"
        >
          Paste your decklist
        </label>
        <textarea
          id="decklist"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          rows={14}
          placeholder={PLACEHOLDER}
          className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-white/[0.03] p-4 font-mono text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-emerald-400/50"
        />
      </div>

      {text.trim() && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
          <p className="text-zinc-300">
            <span className="font-semibold tabular-nums text-emerald-400">
              {cardCount}
            </span>{" "}
            cards read from {importable.length} line
            {importable.length === 1 ? "" : "s"}
            {cardCount > 0 && cardCount < rules.minDeckSize && (
              <span className="text-zinc-500">
                {" "}
                · {rules.label} wants {rules.minDeckSize}
              </span>
            )}
          </p>

          {setAside > 0 && (
            <p className="mt-1.5 text-xs text-zinc-500">
              {setAside} sideboard/maybeboard line
              {setAside === 1 ? "" : "s"} skipped — 2HG Commander has no
              sideboard.
            </p>
          )}

          {parsed.ignored.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-amber-300/80 hover:text-amber-300">
                {parsed.ignored.length} line
                {parsed.ignored.length === 1 ? "" : "s"} couldn&apos;t be read
              </summary>
              <ul className="mt-2 space-y-1 font-mono text-xs text-zinc-500">
                {parsed.ignored.slice(0, 8).map((l) => (
                  <li key={l.lineNumber}>
                    <span className="text-zinc-700">{l.lineNumber}:</span>{" "}
                    {l.line}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-rose-400/25 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={runImport}
        disabled={busy || importable.length === 0}
        className="rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
      >
        {busy
          ? "Looking up cards…"
          : `Import into Deck ${slot.toUpperCase()}`}
      </button>
    </div>
  );
}
