"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Card art is 63:88; at this width the rules text is still readable. */
const PREVIEW_W = 244;
const PREVIEW_H = Math.round((PREVIEW_W * 88) / 63);
const GAP = 16;

/**
 * A card name that shows the card while you hover it.
 *
 * A decklist is 100 names and most of them are only meaningful if you already
 * know the card. Opening a card page to read one line of oracle text loses your
 * place in the list; hovering doesn't.
 *
 * The preview goes through a portal to `document.body` on purpose: deck lists
 * scroll inside their own `overflow-y-auto` column, and anything rendered in
 * the row would be clipped by it.
 */
export function CardLink({
  name,
  href,
  image,
  className,
  title,
}: {
  name: string;
  href: string;
  /** Scryfall image, or null for a card we couldn't resolve. */
  image: string | null;
  className?: string;
  title?: string;
}) {
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  const frame = useRef<number | null>(null);

  /**
   * Position from the pointer, then keep the whole card on screen: flip to the
   * left of the cursor when it would overflow the right edge, and clamp
   * vertically rather than letting it hang off the bottom.
   */
  const place = useCallback((x: number, y: number) => {
    if (frame.current != null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const flip = x + GAP + PREVIEW_W > window.innerWidth;
      setAt({
        left: flip ? Math.max(GAP, x - GAP - PREVIEW_W) : x + GAP,
        top: Math.min(
          Math.max(GAP, y - PREVIEW_H / 2),
          window.innerHeight - PREVIEW_H - GAP,
        ),
      });
    });
  }, []);

  // A pending frame after the row is gone (navigating away, a list re-sorting)
  // would repaint a preview for a card nobody is pointing at any more.
  useEffect(
    () => () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const hide = useCallback(() => {
    if (frame.current != null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setAt(null);
  }, []);

  return (
    <>
      <Link
        href={href}
        title={title}
        className={className}
        onMouseEnter={(e) => image && place(e.clientX, e.clientY)}
        onMouseMove={(e) => image && place(e.clientX, e.clientY)}
        onMouseLeave={hide}
        // Keyboard and touch users get the link, never a stuck overlay.
        onBlur={hide}
        onClick={hide}
      >
        {name}
      </Link>

      {at &&
        image &&
        createPortal(
          <div
            aria-hidden="true"
            style={{ left: at.left, top: at.top, width: PREVIEW_W }}
            className="pointer-events-none fixed z-50 overflow-hidden rounded-xl shadow-2xl shadow-black/70 ring-1 ring-white/15"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall CDN */}
            <img
              src={image}
              alt=""
              width={PREVIEW_W}
              height={PREVIEW_H}
              className="block w-full bg-zinc-900 aspect-[63/88]"
            />
          </div>,
          document.body,
        )}
    </>
  );
}
