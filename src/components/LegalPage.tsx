import type { ReactNode } from "react";

/**
 * Shared shell for the privacy and terms pages.
 *
 * Kept deliberately plain: these are documents people skim when deciding
 * whether to trust a login, so readability beats the dense styling used
 * everywhere else.
 */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-xs text-zinc-500">
        Last updated <time dateTime={updated}>{updated}</time>
      </p>
      <p className="mt-6 text-sm leading-relaxed text-zinc-300">{intro}</p>

      <div className="mt-10 space-y-8">{children}</div>
    </div>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold tracking-tight text-white">
        {heading}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-400 [&_a]:text-emerald-300 [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-zinc-200 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
