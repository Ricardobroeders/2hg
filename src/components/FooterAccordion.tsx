"use client";

import Link from "next/link";
import { useId, useState } from "react";

export type FooterLink = { href: string; label: string };
export type FooterColumn = { title: string; links: readonly FooterLink[] };

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${
        open ? "rotate-90" : ""
      }`}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/**
 * The footer's link columns, in both of the layouts the design asks for: a
 * stack of tap-to-open accordion rows on mobile, the same columns side by side
 * from `md` up.
 *
 * Each link is written to the DOM exactly once and the two presentations are
 * pure CSS, so the footer's crawl paths don't depend on the viewport or on
 * hydration. That's also why the closed panel uses `hidden` rather than a
 * height transition — `display: none` takes the links out of the tab order,
 * where a collapsed-but-painted panel would leave invisible link targets
 * focusable.
 */
export function FooterAccordion({
  columns,
}: {
  columns: readonly FooterColumn[];
}) {
  // Which accordion row is expanded, by title. Mobile only — from `md` up
  // every panel is shown regardless. One at a time, matching the design.
  const [expanded, setExpanded] = useState<string | null>(null);
  const idPrefix = useId();

  return (
    // One track per column, spread across the full width.
    <div className="flex flex-col md:grid md:grid-cols-4 md:gap-8">
      {columns.map((column) => {
        const open = expanded === column.title;
        const panelId = `${idPrefix}-${column.title.replace(/\W+/g, "-")}`;

        return (
          <div
            key={column.title}
            className="border-t border-white/10 md:border-0"
          >
            {/* Below md the heading is the accordion's trigger; from md up it's
                a plain heading and the button is inert chrome, so the real
                heading element is rendered separately rather than nesting an
                <h3> inside a <button> that desktop never uses. */}
            <h3 className="hidden text-sm font-bold text-zinc-100 md:block">
              {column.title}
            </h3>

            <button
              type="button"
              onClick={() => setExpanded(open ? null : column.title)}
              aria-expanded={open}
              aria-controls={panelId}
              className="flex h-12 w-full items-center justify-between gap-3 px-4 text-left text-sm font-bold text-zinc-100 transition hover:text-white md:hidden"
            >
              {column.title}
              <Chevron open={open} />
            </button>

            <ul
              id={panelId}
              className={`bg-white/[0.03] px-4 pt-3 pb-3 md:mt-1 md:block md:bg-transparent md:p-0 ${
                open ? "block" : "hidden"
              }`}
            >
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-1 text-sm leading-6 text-zinc-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
