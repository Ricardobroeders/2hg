"use client";

import { useState } from "react";
import { useTeam } from "@/lib/team-store";
import { emptyDeck, type DeckSlot } from "@/lib/team";

/**
 * Save one deck on its own, separately from the pairing.
 *
 * A pairing is the thing this site is about, but you don't always have a
 * partner yet — and a deck has to exist as its own object before we can ever
 * answer "who should play alongside this?". So a solo save is a first-class
 * action, not a degraded pairing.
 *
 * It deliberately does not touch the builder's `share` ref: that belongs to
 * the pairing, and saving a deck alone must not hijack the teammate's link.
 */
export function SaveDeck({ slot }: { slot: DeckSlot }) {
  const { team, cards } = useTeam();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deck = team[slot];
  const empty = deck.entries.length === 0;

  async function save() {
    setBusy(true);
    setError(null);

    try {
      // Send this deck as slot "a" whichever side it came from — the server
      // stores a solo entry as a single deck, and "b" is left empty.
      const payload = {
        ...team,
        name: deck.name?.trim() || "Untitled deck",
        a: deck,
        b: emptyDeck("Deck B"),
      };

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: payload, kind: "solo" }),
      });
      const json = (await res.json()) as { slug?: string; error?: string };

      if (!res.ok || !json.slug) {
        setError(json.error ?? "Couldn't save that deck. Try again.");
        return;
      }

      const link = `${window.location.origin}/d/${json.slug}`;
      setUrl(link);
      await navigator.clipboard.writeText(link).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Cards are still resolving — saving now would store unverified names.
  const resolving = deck.entries.some((e) => !cards.has(e.name));

  return (
    <div className="border-t border-white/10 p-3">
      {url ? (
        <button
          type="button"
          onClick={copy}
          title={url}
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/60 px-2.5 py-1.5 text-left transition hover:border-white/20"
        >
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-400">
            {url.replace(/^https?:\/\//, "")}
          </span>
          <span className="shrink-0 text-[11px] text-emerald-400">
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={save}
          disabled={busy || empty || resolving}
          className="w-full rounded-lg px-3 py-1.5 text-xs text-zinc-400 ring-1 ring-inset ring-white/10 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          title={
            empty
              ? "Add cards to this deck first"
              : "Save just this deck, with its own link"
          }
        >
          {busy ? "Saving…" : "Save this deck on its own"}
        </button>
      )}

      {error && (
        <p className="mt-2 text-[11px] leading-relaxed text-rose-300">{error}</p>
      )}
    </div>
  );
}
