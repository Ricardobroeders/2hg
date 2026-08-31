"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

export type Viewer = { name?: string | null; image?: string | null } | null;

/**
 * Reads the signed-in user for the nav.
 *
 * Resolved client-side on purpose. Reading the session in the root layout
 * would opt every page into dynamic rendering — including the card pages and
 * the public `/t/{slug}` share pages, which are the ones that need to be
 * cacheable and indexable. The nav is decoration; a moment of "Sign in" before
 * the avatar appears costs nothing, and the pages that actually depend on
 * identity check it on the server.
 *
 * Called once in `Nav` and passed down, so the desktop avatar and the mobile
 * menu's account row don't each fire their own session request.
 */
export function useViewer(): { viewer: Viewer; resolved: boolean } {
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

  return { viewer, resolved };
}
