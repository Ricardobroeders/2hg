"use client";

import { useEffect, useRef } from "react";

/**
 * The one modal in the app.
 *
 * Deliberately hand-rolled rather than pulled from a component library — there
 * are two dialogs on the whole site (bulk import, and naming a deck on first
 * save) and neither needs more than this: a backdrop, Escape, and focus that
 * starts inside and comes back where it was.
 */
export function Modal({
  title,
  description,
  onClose,
  children,
  size = "md",
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreTo.current = document.activeElement as HTMLElement | null;

    // Focus the first thing worth typing into, falling back to the panel so
    // Escape and the tab order still start inside the dialog.
    const first = panelRef.current?.querySelector<HTMLElement>(
      "textarea, input, button",
    );
    (first ?? panelRef.current)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    // The page behind must not scroll while the dialog owns the viewport.
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;

    // Locking can reclaim the scrollbar's width and jolt the page sideways —
    // the exact shift `scrollbar-gutter: stable` exists to prevent everywhere
    // else. Measure what locking actually took rather than assuming: if the
    // gutter survives the lock the delta is 0 and nothing is padded, so this
    // can't over-correct.
    const widthBefore = document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    const reclaimed = document.documentElement.clientWidth - widthBefore;
    if (reclaimed > 0) body.style.paddingRight = `${reclaimed}px`;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      restoreTo.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/80 p-4 backdrop-blur-sm sm:p-8"
      onMouseDown={(e) => {
        // Only a click that both starts and ends on the backdrop closes —
        // dragging a text selection out of the panel shouldn't dismiss it.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`my-auto w-full rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/60 outline-none ${
          size === "lg" ? "max-w-3xl" : "max-w-md"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-1.5 shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
