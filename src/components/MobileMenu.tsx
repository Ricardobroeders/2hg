"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useIsDesktop } from "@/lib/use-desktop";
import { useScrollLock } from "@/lib/use-scroll-lock";
import type { Viewer } from "@/lib/use-viewer";

export type NavLink = { href: string; label: string };

/** Nothing to subscribe to — this only distinguishes server from client. */
const subscribeNever = () => () => {};

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4 shrink-0 text-zinc-600"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function MenuRow({
  href,
  label,
  active,
  onNavigate,
  badge,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate: () => void;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center justify-between gap-3 border-b border-white/5 px-5 py-3.5 text-sm transition ${
        active
          ? "bg-emerald-400/10 text-emerald-300"
          : "text-zinc-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {children}
        <span className="truncate">{label}</span>
        {badge}
      </span>
      <Chevron />
    </Link>
  );
}

/**
 * The mobile header menu: a hamburger beside the logo opening a left slide-out
 * that carries every nav item the desktop header shows.
 *
 * The panel is portalled to `document.body` rather than rendered in place. The
 * header sets `backdrop-blur`, and a backdrop-filter makes an element a
 * containing block for its fixed-position descendants — so a panel nested
 * inside it would size itself to the 56px header instead of the viewport.
 *
 * It also stays mounted and is hidden with `inert` + a transform rather than
 * being conditionally rendered, which is what lets it animate closed as well as
 * open without a timer to defer unmounting.
 */
export function MobileMenu({
  links,
  deckCount,
  viewer,
  resolved,
}: {
  links: readonly NavLink[];
  /** Cards in the local builder; shown as a badge, hidden until hydrated. */
  deckCount: number | null;
  viewer: Viewer;
  resolved: boolean;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Dismissing sends focus back to the hamburger; following a link must not,
  // or every navigation would land the caret back in the header.
  const restoreFocus = useRef(false);
  const panelId = useId();

  /**
   * The menu belongs to the route it was opened on, so `open` is derived
   * rather than synchronised. Any navigation — a link, the back button —
   * closes it for free, and so does crossing to a viewport where the panel is
   * `md:hidden`, which otherwise strands the scroll lock on a page with no
   * visible menu to close.
   */
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const desktop = useIsDesktop();
  const open = openedAt === pathname && !desktop;

  // `document.body` doesn't exist while rendering on the server.
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;

    // Captured for the cleanup: by then React may have detached the node.
    const trigger = triggerRef.current;

    // Focus starts inside the panel so Escape and the tab order follow it.
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        restoreFocus.current = true;
        setOpenedAt(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (restoreFocus.current) trigger?.focus();
      restoreFocus.current = false;
    };
  }, [open]);

  function dismiss() {
    restoreFocus.current = true;
    setOpenedAt(null);
  }

  function navigate() {
    restoreFocus.current = false;
    setOpenedAt(null);
  }

  const overlay = (
    <>
      <div
        onClick={dismiss}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        id={panelId}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-[19rem] max-w-[85%] flex-col border-r border-white/10 bg-zinc-950 shadow-2xl shadow-black/60 transition-transform duration-200 ease-out motion-reduce:transition-none md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <span className="text-sm font-semibold tracking-tight text-white">
            Menu
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close menu"
            className="-mr-1.5 rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden="true"
              className="size-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col overflow-y-auto">
          {links.map((link) => (
            <MenuRow
              key={link.href}
              href={link.href}
              label={link.label}
              active={pathname.startsWith(link.href)}
              onNavigate={navigate}
              badge={
                link.href === "/deck-builder" &&
                deckCount !== null &&
                deckCount > 0 ? (
                  <span className="rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[11px] tabular-nums text-emerald-300">
                    {deckCount}
                  </span>
                ) : undefined
              }
            />
          ))}

          {/* Separates browsing from the account, the way the desktop header
              separates them by pushing the avatar to the far right. */}
          <div className="h-2 bg-white/[0.03]" />

          {/* Nothing until the session resolves, so the row doesn't flip from
              "Sign in" to a name mid-paint. */}
          {resolved &&
            (viewer ? (
              <MenuRow
                href="/account"
                label={viewer.name ?? "Your account"}
                active={pathname.startsWith("/account")}
                onNavigate={navigate}
              >
                {viewer.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote avatar host
                  <img
                    src={viewer.image}
                    alt=""
                    className="size-6 shrink-0 rounded-full border border-white/10"
                  />
                ) : (
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-[11px] font-black text-zinc-950">
                    {(viewer.name ?? "?").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </MenuRow>
            ) : (
              <MenuRow
                href="/auth/sign-in"
                label="Sign in"
                active={pathname.startsWith("/auth")}
                onNavigate={navigate}
              />
            ))}
        </nav>

        <div className="flex-1 bg-white/[0.02]" />
      </div>
    </>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpenedAt(pathname)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={panelId}
        className="-ml-1.5 shrink-0 rounded-lg p-1.5 text-zinc-300 transition hover:bg-white/5 hover:text-white md:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
          className="size-6"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
