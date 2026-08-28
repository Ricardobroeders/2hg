"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

/** Google's mark. Inlined because the CSP-safe path is not hotlinking it. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

/**
 * Google sign-in, started from the browser rather than a server action.
 *
 * This matters and is not a style choice. The OAuth handshake stores a
 * short-lived `session_challenge` cookie that has to be on the *browser*
 * before it leaves for Google, and has to come back with it. Starting the
 * flow from the client means that cookie is set by a response the browser
 * receives directly, through our own /api/auth proxy. Every Neon OAuth
 * example does it this way.
 */
export function SignInForm({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    setError(null);

    try {
      // Absolute URL: Neon matches this against its trusted-origins allowlist,
      // and a relative path leaves the origin for it to infer.
      const callbackURL = new URL(next, window.location.origin).toString();

      const { error: err } = await authClient.signIn.social({
        provider: "google",
        callbackURL,
        errorCallbackURL: new URL(
          "/auth/sign-in",
          window.location.origin,
        ).toString(),
      });

      // Reaching here without a thrown redirect means it refused to start.
      if (err) {
        setError(err.message ?? "Couldn't start Google sign-in.");
        setPending(false);
      }
    } catch {
      setError("Couldn't reach the sign-in service. Try again in a moment.");
      setPending(false);
    }
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
      >
        <GoogleMark />
        {pending ? "Redirecting to Google…" : "Continue with Google"}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}
