"use client";

import Link from "next/link";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import { setConsent, useConsent } from "@/lib/consent";

/**
 * The one thing on this site that interrupts a first visit, so it is kept to a
 * strip rather than a modal: share links are how this site spreads, and a
 * teammate opening one lands on a pairing, not on a dialog.
 *
 * Accept and decline are the same size and weight on purpose. A greyed-out
 * "decline" next to a bright "accept" is the dark pattern the GDPR's "freely
 * given" test exists to catch, and Dutch enforcement has been explicit about it.
 */
export function ConsentBanner() {
  const consent = useConsent();

  // Nothing to consent to without a measurement ID, so previews and local dev
  // never show this. `unknown` is the pre-hydration state; `granted`/`denied`
  // mean it has already been answered.
  if (!GA_MEASUREMENT_ID || consent !== "pending") return null;

  return (
    <div
      role="region"
      aria-label="Analytics consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:gap-8">
        <p className="text-xs leading-relaxed text-zinc-400 md:flex-1">
          Google Analytics tells us which pages people actually use. It sets
          cookies and sends your visit to Google, so it runs only if you allow
          it. The site works the same either way.{" "}
          <Link
            href="/privacy"
            className="text-zinc-300 underline underline-offset-2 hover:text-white"
          >
            Privacy Policy
          </Link>
        </p>

        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => setConsent("denied")}
            className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white md:flex-none"
          >
            No thanks
          </button>
          <button
            type="button"
            onClick={() => setConsent("granted")}
            className="flex-1 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-300 md:flex-none"
          >
            Allow analytics
          </button>
        </div>
      </div>
    </div>
  );
}
