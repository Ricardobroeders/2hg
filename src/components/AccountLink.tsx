"use client";

import Link from "next/link";
import type { Viewer } from "@/lib/use-viewer";

/**
 * Nav affordance for the signed-in user, on desktop.
 *
 * The session itself is read once by `Nav` via `useViewer` and passed in, so
 * this and the mobile menu's account row share a single request. See that hook
 * for why it resolves client-side.
 */
export function AccountLink({
  viewer,
  resolved,
}: {
  viewer: Viewer;
  resolved: boolean;
}) {
  // Render nothing until we know, so the link doesn't flip label mid-paint.
  if (!resolved) return <span className="w-16" aria-hidden="true" />;

  if (!viewer) {
    return (
      <Link
        href="/auth/sign-in"
        className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:text-white"
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
      title={viewer.name ?? "Account"}
    >
      {viewer.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote avatar host
        <img
          src={viewer.image}
          alt=""
          className="h-7 w-7 rounded-full border border-white/10"
        />
      ) : (
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-xs font-black text-zinc-950">
          {(viewer.name ?? "?").slice(0, 1).toUpperCase()}
        </span>
      )}
    </Link>
  );
}
