"use client";

import { useState } from "react";
import { useTeam } from "@/lib/team-store";

/**
 * The share link is the product's distribution: a 2HG team is two people, so
 * you *have* to send this to your teammate. It deliberately needs no account —
 * gating it behind a signup would gate the only viral mechanism we have.
 */
export function ShareTeam() {
  const { team, validation, share, setShare } = useTeam();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const empty = validation.counts.combined === 0;
  const url = share ? `${window.location.origin}/t/${share.slug}` : null;

  async function save() {
    setBusy(true);
    setError(null);

    try {
      // An existing link is updated in place, so a teammate's bookmark keeps
      // working as the pairing evolves.
      const res = share
        ? await fetch(`/api/teams/${share.slug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ team, editToken: share.editToken }),
          })
        : await fetch("/api/teams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ team }),
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

      if (json.slug && json.editToken) {
        setShare({ slug: json.slug, editToken: json.editToken });
      }

      if (json.slug) {
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
      <h2 className="text-sm font-semibold text-white">
        Send this to your teammate
      </h2>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
        {share
          ? "Anyone with the link can open this pairing. Save again to push your latest changes."
          : "Creates a link to both decks. No account needed."}
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

      {error && (
        <p className="mt-3 rounded-lg border border-rose-400/25 bg-rose-400/[0.06] px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={busy || empty}
        className="mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-inset ring-white/15 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy
          ? "Saving…"
          : share
            ? "Update the shared link"
            : "Create a share link"}
      </button>

      {share && (
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
          Signed out, only this browser can edit that link — don&apos;t clear
          your site data if you want to keep editing it. Sign in and you can
          claim it to your account instead.
        </p>
      )}
    </div>
  );
}
