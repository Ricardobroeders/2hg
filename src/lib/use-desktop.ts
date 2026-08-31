"use client";

import { useSyncExternalStore } from "react";

/** Tailwind's `md`, as a media query. */
const DESKTOP = "(min-width: 48rem)";

let query: MediaQueryList | null = null;

function subscribe(onChange: () => void) {
  query ??= window.matchMedia(DESKTOP);
  query.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

function snapshot() {
  query ??= window.matchMedia(DESKTOP);
  return query.matches;
}

/**
 * True from Tailwind's `md` breakpoint up.
 *
 * Reads as `false` on the server and for the first client render, so callers
 * must render their mobile form first and correct after hydration. Use it for
 * things CSS can't express — ARIA state, releasing a scroll lock — and leave
 * anything visual to a `md:` class, which is right on the first paint and
 * never flashes.
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
