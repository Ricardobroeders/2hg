"use client";

import { useState } from "react";
import { useTeam } from "@/lib/team-store";
import { SaveDialog } from "./SaveDialog";

/**
 * Save the pairing — both decks as one object — and get the link that shares it.
 *
 * Saving and sharing are the same action here, and the wording has to say
 * "save" first. Framed only as "send this to your teammate" it reads as a
 * share-sheet, and people conclude the pairing can't be saved at all and that
 * the per-deck button is the only real save. It is the *primary* save on this
 * page: the pairing is the entity this site is about, and a lone deck is half
 * of one.
 *
 * It deliberately needs no account — gating it behind a signup would gate the
 * only mechanism that spreads this site.
 */
export function ShareTeam() {
  const { team, validation, share, setShare, setTeamName } = useTeam();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const empty = validation.counts.combined === 0;
  const url = share ? `${window.location.origin}/t/${share.slug}` : null;

  /** Both commanders name the pairing better than "Untitled team" does. */
  const suggestedName =
    team.name && team.name !== "Untitled team"
      ? team.name
      : [team.a.commanders[0], team.b.commanders[0]]
          .filter(Boolean)
          .join(" + ");

  async function save(name: string) {
    setBusy(true);
    setError(null);

    try {
      const payload = { ...team, name };
      // An existing link is updated in place, so a teammate's bookmark keeps
      // working as the pairing evolves.
      const res = share
        ? await fetch(`/api/teams/${share.slug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ team: payload, editToken: share.editToken }),
          })
        : await fetch("/api/teams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ team: payload }),
          });

      const json = (await res.json()) as {
        slug?: string;
        editToken?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(json.error ?? "Couldn't save. Try again in a moment.");
        return;
      }

      if (name !== team.name) setTeamName(name);

      if (json.slug && !share) {
        setShare({ slug: json.slug, editToken: json.editToken ?? null });
      }

      if (json.slug) {
        setAsking(false);
        await navigator.clipboard
          .writeText(`${window.location.origin}/t/${json.slug}`)
          .catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
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

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="text-sm font-semibold text-white">Save this pairing</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
        {share
          ? "Saved as one pairing. Anyone with the link can open both decks — save again to push your latest changes."
          : "Saves Deck A and Deck B together as one pairing, and gives you a link to send your teammate. No account needed."}
      </p>

      {url && (
        <button
          type="button"
          onClick={copy}
          title={url}
          className="mt-3 flex w-full items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-left transition hover:border-white/20"
        >
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-400">
            {url.replace(/^https?:\/\//, "")}
          </span>
          <span className="shrink-0 text-xs text-emerald-400">
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
      )}

      {error && !asking && (
        <p className="mt-3 rounded-lg border border-rose-400/25 bg-rose-400/[0.06] px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setError(null);
          // Only the first save needs a name; after that the link exists and
          // "update" should be one click, not a dialog.
          if (share) void save(team.name);
          else setAsking(true);
        }}
        disabled={busy || empty}
        className="mt-3 w-full rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
      >
        {busy ? "Saving…" : share ? "Save changes" : "Save both decks"}
      </button>

      {share && (
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
          Signed out, only this browser can edit that link — don&apos;t clear
          your site data if you want to keep editing it. Sign in and you can
          claim it to your account instead.
        </p>
      )}

      {asking && (
        <SaveDialog
          title="Name this pairing"
          description="Both decks are saved together under one link. A name makes it findable later."
          defaultName={suggestedName}
          placeholder="Untitled team"
          action="Create the link"
          busy={busy}
          error={error}
          onSave={(name) => void save(name)}
          onClose={() => setAsking(false)}
        />
      )}
    </div>
  );
}
