"use client";

import Link from "next/link";

/**
 * Covers `/cards` and every card page beneath it.
 *
 * Both surfaces depend on Scryfall for the parts we don't hold locally, and
 * Scryfall's latency is episodic — so "temporarily unavailable" is a real
 * state this site has to be able to show. Before this existed the same
 * condition produced Next's default error screen with no way back.
 *
 * Deliberately not a `notFound()`: a slow or erroring upstream is not a
 * missing card, and serving 404s during an outage is expensive to undo.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Card data didn&apos;t load
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Scryfall — where every card&apos;s text, art and price comes from — was
        slow to answer. This is usually brief.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-emerald-400/15 px-4 py-2 text-sm font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/30 transition hover:bg-emerald-400/25"
        >
          Try again
        </button>
        <Link
          href="/cards"
          className="rounded-lg px-4 py-2 text-sm text-zinc-400 ring-1 ring-inset ring-white/10 transition hover:bg-white/5 hover:text-white"
        >
          Back to card search
        </Link>
      </div>
      {/* The digest is the only handle on a production stack trace, so it's
          worth showing — quietly, and only when Next actually supplies one. */}
      {error.digest && (
        <p className="mt-8 font-mono text-[11px] text-zinc-700">
          {error.digest}
        </p>
      )}
    </div>
  );
}
