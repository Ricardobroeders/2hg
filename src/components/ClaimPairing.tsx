"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTeam } from "@/lib/team-store";

/**
 * Offers to attach the pairing held in this browser to the signed-in account.
 *
 * Shown only when localStorage actually holds a share ref that the account
 * doesn't already list — otherwise it's noise. Deliberately a button rather
 * than something automatic on sign-in: silently hoovering up whatever the
 * browser was holding is surprising on a shared computer.
 */
export function ClaimPairing({ ownedSlugs }: { ownedSlugs: string[] }) {
  const { share, hydrated } = useTeam();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!hydrated || !share || done) return null;
  if (ownedSlugs.includes(share.slug)) return null;

  async function claim() {
    if (!share) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${share.slug}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editToken: share.editToken }),
      });
      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(json.error ?? "Couldn't claim that pairing.");
        return;
      }

      setDone(true);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-5 py-4">
      <p className="text-sm text-white">
        This browser has an unclaimed pairing.
      </p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
        You saved <code className="text-emerald-300">/t/{share.slug}</code>{" "}
        before signing in. Add it to your account so it follows you to other
        devices.
      </p>

      <button
        type="button"
        onClick={claim}
        disabled={busy}
        className="mt-3 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-50"
      >
        {busy ? "Claiming…" : "Add it to my account"}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
