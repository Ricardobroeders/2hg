"use client";

import { useEffect } from "react";

/**
 * Freeze the page behind an overlay for as long as `locked` is true.
 *
 * Shared by the modal and the mobile menu rather than written twice, because
 * the scrollbar compensation below is subtle enough that two copies would
 * drift apart.
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;

    // Locking can reclaim the scrollbar's width and jolt the page sideways —
    // the exact shift `scrollbar-gutter: stable` exists to prevent everywhere
    // else. Measure what locking actually took rather than assuming: if the
    // gutter survives the lock the delta is 0 and nothing is padded, so this
    // can't over-correct. On a phone, where scrollbars are overlaid and have
    // no width, the delta is 0 too.
    const widthBefore = document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    const reclaimed = document.documentElement.clientWidth - widthBefore;
    if (reclaimed > 0) body.style.paddingRight = `${reclaimed}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [locked]);
}
