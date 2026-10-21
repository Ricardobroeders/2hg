/**
 * The FAQ block at the foot of the list hubs and the rules pages.
 *
 * Shared so every FAQ on the site looks and behaves the same, and so the
 * visible text always comes from the same `{ title, body }` entries the page
 * hands to `faqSchema()` — the markup can never disagree with what is shown.
 */
export function FaqAccordion({
  entries,
  heading = "Common questions",
}: {
  entries: readonly { title: string; body: string }[];
  heading?: string;
}) {
  if (entries.length === 0) return null;

  return (
    <section className="mt-14 max-w-3xl">
      <h2 className="text-xl font-semibold tracking-tight text-white">
        {heading}
      </h2>
      <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
        {entries.map((entry, i) => (
          <details
            key={entry.title}
            /*
              Native <details>: no client component, no JS, and the answer
              ships in the HTML either way. The first one stays open —
              collapsed content is indexed, but Google is on record that
              visible text carries more weight than content behind an
              interaction, so the page keeps one answer in plain view.
            */
            open={i === 0}
            className="group py-3"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-white transition hover:text-emerald-300 [&::-webkit-details-marker]:hidden">
              {entry.title}
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-[240ms] group-open:rotate-180"
              >
                <path
                  d="m6 8 4 4 4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>
            <p className="mt-2 pr-8 text-sm leading-relaxed text-zinc-400">
              {entry.body}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** The Sources block: every external claim on a page, linked. */
export function SourceList({
  sources,
  note,
}: {
  sources: readonly { label: string; href: string }[];
  note?: string;
}) {
  if (sources.length === 0) return null;

  return (
    <section className="mt-12 max-w-3xl border-t border-white/10 pt-8">
      <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
        Sources
      </h2>
      <ul className="mt-3 space-y-2">
        {sources.map((source) => (
          <li key={source.href}>
            <a
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
            >
              {source.label}
            </a>
          </li>
        ))}
      </ul>
      {note && (
        <p className="mt-4 text-xs leading-relaxed text-zinc-600">{note}</p>
      )}
    </section>
  );
}
