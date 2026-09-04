"use client";

import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import { resetConsent, setConsent, useConsent } from "@/lib/consent";

/**
 * Withdrawing consent has to be as easy as giving it, and the banner is gone
 * once answered — so the standing control lives on `/privacy`, which the footer
 * links from every page. It states the current answer rather than just offering
 * a switch: people arrive here to find out what they agreed to.
 */
export function ConsentSettings() {
  const consent = useConsent();

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      {consent === "granted" ? (
        <>
          <p className="text-sm text-white">
            Analytics is <strong>on</strong> for this
            browser.
          </p>
          <button
            type="button"
            onClick={() => setConsent("denied")}
            className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            Turn analytics off
          </button>
        </>
      ) : consent === "denied" ? (
        <>
          <p className="text-sm text-white">
            Analytics is <strong>off</strong> for this
            browser. Nothing is sent to Google.
          </p>
          <button
            type="button"
            onClick={() => setConsent("granted")}
            className="mt-4 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-300"
          >
            Turn analytics on
          </button>
        </>
      ) : (
        // `pending` (banner still showing) and `unknown` (pre-hydration) both
        // land here, so the block never renders an answer it doesn't have yet.
        <p className="text-sm text-zinc-400">
          You haven&apos;t answered the analytics question yet. Until you do,
          nothing is sent to Google.
        </p>
      )}

      {consent !== "pending" && consent !== "unknown" && (
        <button
          type="button"
          onClick={resetConsent}
          className="mt-3 block text-xs text-zinc-500 underline underline-offset-2 transition hover:text-zinc-300"
        >
          Forget my choice and ask again
        </button>
      )}
    </div>
  );
}
