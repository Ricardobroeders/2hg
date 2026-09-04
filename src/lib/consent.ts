"use client";

/**
 * The visitor's analytics decision, as an external store.
 *
 * Same shape as `team-store.tsx`: a module-level snapshot read through
 * `useSyncExternalStore`, so the value is available on first client render
 * rather than one effect late. The server snapshot is deliberately `unknown` —
 * the markup can't depend on a per-browser choice without a hydration mismatch,
 * so the banner and the tag both mount on the client, after hydration.
 */

import { useSyncExternalStore } from "react";
import {
  CONSENT_STORAGE_KEY,
  type ConsentDecision,
  type ConsentState,
} from "./analytics";

let snapshot: ConsentState | null = null;
const listeners = new Set<() => void>();

function read(): ConsentState {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored === "granted" || stored === "denied" ? stored : "pending";
  } catch {
    // Private mode, or storage blocked outright. Treat it as undecided: we
    // can't remember an answer, so we can't claim to have one.
    return "pending";
  }
}

function getSnapshot(): ConsentState {
  // Cached because `useSyncExternalStore` compares by identity and would loop
  // on a value re-derived every render.
  snapshot ??= read();
  return snapshot;
}

/** Stable across renders, and never a stored value. */
function getServerSnapshot(): ConsentState {
  return "unknown";
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Answering in one tab settles it in every other one, so a second tab doesn't
  // keep asking. `storage` only fires in the tabs that didn't write.
  function onStorage(e: StorageEvent) {
    if (e.key !== CONSENT_STORAGE_KEY) return;
    snapshot = read();
    listener();
  }
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Record a decision and tell Google about it in the same breath.
 *
 * The `consent update` goes onto `dataLayer` here rather than in a component
 * effect so that it is queued *before* React mounts the tag on a fresh grant —
 * gtag.js replays the queue in order when it loads, so the tag never runs a
 * moment in the denied state. On a withdrawal the tag is already loaded and
 * cannot be unloaded; the update is what actually stops it storing anything.
 */
export function setConsent(decision: ConsentDecision): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, decision);
  } catch {
    // Nothing to do: the choice holds for this page view either way.
  }

  window.gtag?.("consent", "update", {
    analytics_storage: decision === "granted" ? "granted" : "denied",
  });

  snapshot = decision;
  for (const listener of listeners) listener();
}

/** Reopen the question — the control on `/privacy` uses this. */
export function resetConsent(): void {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Same as above.
  }

  window.gtag?.("consent", "update", { analytics_storage: "denied" });

  snapshot = "pending";
  for (const listener of listeners) listener();
}

export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
