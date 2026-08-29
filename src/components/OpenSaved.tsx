"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ScryfallCard } from "@/lib/scryfall";
import type { TeamPairing } from "@/lib/team";
import { useTeam, type DeckRefs, type SharedRef } from "@/lib/team-store";

/**
 * `/deck-builder?edit={slug}` — load something you already saved back into the
 * builder so you can change it.
 *
 * The builder is the only place decks are edited, so "edit" from `/account`
 * means "put it back here". Loading also records *what* is being edited, which
 * is what makes the next save an update rather than a second copy of the same
 * deck.
 */
export function OpenSaved() {
  const params = useSearchParams();
  const router = useRouter();
  const { replaceTeam, validation, share, deckRefs, hydrated } = useTeam();

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const slug = params.get("edit");
  /**
   * One load per slug, ever.
   *
   * This is the *only* guard, deliberately. An `if (cancelled) return` before
   * the commit looks like good hygiene and is actively wrong here: React's dev
   * StrictMode runs the effect, tears it down, and runs it again, so the first
   * pass would be cancelled while the second bailed out on this ref — leaving
   * the deck unloaded and the spinner up forever. Writes are safe without it:
   * the team is an external store, and React 19 no-ops a setState after
   * unmount.
   */
  const attempted = useRef<string | null>(null);

  // Mirrored into a ref so the loader below can read current state without
  // listing it as a dependency — otherwise adding a card would re-run the
  // import. Declared before that effect so it has run by the time it fires.
  const live = useRef({
    counts: 0,
    share: null as SharedRef | null,
    deckRefs: {} as DeckRefs,
  });
  useEffect(() => {
    live.current = { counts: validation.counts.combined, share, deckRefs };
  });

  useEffect(() => {
    if (!slug || !hydrated) return;
    if (attempted.current === slug) return;
    attempted.current = slug;

    const { counts, share: pairingRef, deckRefs: soloRefs } = live.current;

    /**
     * Ask whenever there's anything to lose — including when the builder is
     * already pointed at this same slug. "Same link" does not mean "same
     * contents": the whole reason to reopen a saved deck is that the copy in
     * the builder has drifted from it, and skipping the prompt there would
     * throw away unsaved changes without a word.
     */
    if (counts > 0) {
      const ok = confirm(
        "Opening this replaces what's in your builder right now. Anything you haven't saved will be lost. Continue?",
      );
      if (!ok) {
        router.replace("/deck-builder");
        return;
      }
    }

    // If this browser holds the anonymous edit token for this slug, keep it —
    // it still works, and it's what lets a signed-out creator keep editing.
    const knownToken =
      (pairingRef?.slug === slug ? pairingRef.editToken : null) ??
      Object.values(soloRefs).find((r) => r?.slug === slug)?.editToken ??
      null;

    setStatus("loading");

    void (async () => {
      try {
        const res = await fetch(`/api/teams/${slug}`);
        const json = (await res.json()) as {
          team?: TeamPairing;
          kind?: "solo" | "pairing";
          error?: string;
        };

        if (!res.ok || !json.team) {
          throw new Error(json.error ?? "We couldn't find that deck.");
        }

        const team = json.team;
        const names = [
          ...new Set(
            [...team.a.entries, ...team.b.entries].map((e) => e.name),
          ),
        ];

        // Hydrate card data up front so the builder renders scores immediately
        // rather than flashing an unrated list while the store backfills.
        const cardRes = await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names }),
        });
        const cards: ScryfallCard[] = cardRes.ok
          ? ((await cardRes.json()) as { cards: ScryfallCard[] }).cards
          : [];

        const ref: SharedRef = { slug, editToken: knownToken };
        replaceTeam(
          { ...team, id: "local" },
          cards,
          // A solo deck was stored as slot "a" and comes back into slot "a".
          json.kind === "solo" ? { decks: { a: ref } } : { share: ref },
        );

        // Drop the query string: a refresh must not re-import over edits that
        // haven't been saved yet.
        router.replace("/deck-builder");
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "We couldn't open that deck.",
        );
      }
    })();
  }, [slug, hydrated, replaceTeam, router]);

  if (status === "loading") {
    return (
      <p className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
        Opening your saved deck…
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="mb-6 rounded-xl border border-rose-400/25 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-300">
        {message}
      </p>
    );
  }

  return null;
}
