"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountLink } from "./AccountLink";
import { CardSearch } from "./CardSearch";
import { useTeam } from "@/lib/team-store";

const LINKS = [
  { href: "/cards", label: "Cards" },
  { href: "/lists", label: "Lists" },
  { href: "/deck-builder", label: "Deck builder" },
  { href: "/rules", label: "Rules" },
];

export function Nav() {
  const pathname = usePathname();
  const { validation, hydrated } = useTeam();
  const total = validation.counts.combined;

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
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

        <nav className="ml-auto flex items-center gap-1">
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
          <AccountLink />
        </nav>
      </div>

      <div className="border-t border-white/5 px-4 py-2 md:hidden">
        <CardSearch size="sm" placeholder="Search cards…" />
      </div>
    </header>
  );
}
