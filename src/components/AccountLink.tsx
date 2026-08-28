"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

type Viewer = { name?: string | null; image?: string | null } | null;

/**
 * Nav affordance for the signed-in user.
 *
 * Resolved client-side on purpose. Reading the session in the root layout
 * would opt every page into dynamic rendering — including the card pages and
 * the public `/t/{slug}` share pages, which are the ones that need to be
 * cacheable and indexable. The nav is decoration; a moment of "Sign in" before
 * the avatar appears costs nothing, and the pages that actually depend on
 * identity check it on the server.
 */
export function AccountLink() {
  const [viewer, setViewer] = useState<Viewer>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let active = true;

    authClient
      .getSession()
      .then((res) => {
        if (!active) return;
        setViewer(res?.data?.user ?? null);
      })
      // Auth being unreachable must not break the nav on every page.
      .catch(() => {})
      .finally(() => {
        if (active) setResolved(true);
      });

    return () => {
      active = false;
    };
  }, []);

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
