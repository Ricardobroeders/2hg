/**
 * Shown while `/cards` runs its search.
 *
 * `/cards` is dynamic on `searchParams`, so every new query, colour chip or
 * sort is a fresh server render with a live Scryfall call behind it. Without
 * this the browser sat on the previous page with no feedback for the whole
 * round trip, which is what "clicking a filter doesn't load anything" actually
 * was — the click had registered, the render just had nothing to say yet.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="h-8 w-64 animate-pulse rounded bg-white/5" />

      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-7 w-32 animate-pulse rounded-full bg-white/5" />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-7 w-24 animate-pulse rounded-full bg-white/5" />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-[488/680] w-full animate-pulse rounded-xl bg-white/5 ring-1 ring-white/10" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
