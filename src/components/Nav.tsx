"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountLink } from "./AccountLink";
import { CardSearch } from "./CardSearch";
import { MobileMenu, type NavLink } from "./MobileMenu";
import { useTeam } from "@/lib/team-store";
import { useViewer } from "@/lib/use-viewer";

const LINKS: readonly NavLink[] = [
  { href: "/cards", label: "Cards" },
  { href: "/lists", label: "Lists" },
  { href: "/deck-builder", label: "Deck builder" },
  { href: "/rules", label: "Rules" },
];

export function Nav() {
  const pathname = usePathname();
  const { validation, hydrated } = useTeam();
  const { viewer, resolved } = useViewer();
  const total = validation.counts.combined;

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        {/* Hamburger first, then the logo — the order the mobile design asks
            for, and the reason this sits ahead of the link in the DOM. */}
        <MobileMenu
          links={LINKS}
          deckCount={hydrated ? total : null}
          viewer={viewer}
          resolved={resolved}
        />

        <Link href="/" className="flex shrink-0 items-center" aria-label="Two-Headed Giant — home">
          {/* Plain <img>: the logo is a fixed-size wordmark, so there's nothing
              for next/image to optimise, and SVG through it needs
              dangerouslyAllowSVG. Intrinsic width/height are set so the header
              doesn't shift while it loads. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/2hg-logo.svg"
            alt="Two-Headed Giant"
            width={393}
            height={139}
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        <div className="hidden min-w-0 flex-1 md:block">
          <CardSearch size="sm" placeholder="Search cards…" />
        </div>

        {/* Below md these links live in the menu instead. The markup stays in
            the server HTML either way, so the crawl paths are unaffected. */}
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                pathname.startsWith(link.href)
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {link.label}
              {link.href === "/deck-builder" && hydrated && total > 0 && (
                <span className="ml-2 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[11px] tabular-nums text-emerald-300">
                  {total}
                </span>
              )}
            </Link>
          ))}
          <AccountLink viewer={viewer} resolved={resolved} />
        </nav>
      </div>

      {/* Search stays on the mobile header rather than moving into the menu.
          It's the primary action of a card database — a tap to open a drawer
          before you can type would be a regression, not a tidy-up. */}
      <div className="border-t border-white/5 px-4 py-2 md:hidden">
        <CardSearch size="sm" placeholder="Search cards…" />
      </div>
    </header>
  );
}
