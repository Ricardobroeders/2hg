/**
 * Shown while a card page resolves.
 *
 * Corpus cards now render from a committed artifact and never reach this, so
 * what it really covers is the tail: a card that trips no 2HG rule, or a lossy
 * spelling of one, both of which still resolve over the network. Mirrors the
 * real two-column layout so the swap doesn't move anything.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="aspect-[488/680] w-full animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/10" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-white/5" />
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-10">
          <div>
            <div className="h-9 w-80 max-w-full animate-pulse rounded bg-white/5" />
            <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-white/5" />
          </div>
          <div className="h-64 w-full animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/10" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-white/5" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
