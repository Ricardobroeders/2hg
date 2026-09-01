import { FooterAccordion, type FooterColumn } from "./FooterAccordion";
import { DISCORD_URL } from "@/lib/site";

/**
 * The footer's link columns.
 *
 * Every href here resolves to a route that exists. A footer sits on every
 * page, so a dead link here is a sitewide 404 — the design's Cookie Policy
 * link stays out until that page is built. Adding it is a change to this array
 * and nothing else.
 */
const COLUMNS: readonly FooterColumn[] = [
  {
    title: "2 Headed Giant",
    links: [
      { href: "/", label: "Home" },
      { href: "/rules", label: "Rules" },
      { href: "/account", label: "Account" },
    ],
  },
  {
    title: "The Library",
    links: [
      { href: "/cards", label: "Cards" },
      { href: "/lists", label: "Lists" },
      { href: "/deck-builder", label: "Deck builder" },
    ],
  },
  {
    // Sitewide links into the rule hubs, which is the point of them: `/cards`
    // shows nothing without a query, so these pages carry the crawl path down
    // into the card corpus. All three clear `meetsIndexBar` — linking a thin
    // hub from every page would spend crawl budget on a page we noindex.
    title: "Top Lists",
    links: [
      { href: "/lists/each-opponent", label: "Hits each opponent" },
      { href: "/lists/opponent-sacrifice", label: "Team-wide edicts" },
      { href: "/lists/poison", label: "Poison & infect" },
    ],
  },
  {
    // Reachable from every page on purpose: Google's OAuth review checks that
    // the privacy policy is linked from the page hosting sign-in.
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

/**
 * Discord is a real server and doubles as the contact route `/privacy` and
 * `/terms` point at, so it links out. Reddit and Instagram are still the
 * exported Figma glyphs with no accounts behind them: they stay decoration
 * rather than links to nowhere, and `alt=""` keeps screen readers from
 * announcing them. Give one an `href` when its account exists.
 */
const SOCIALS: { name: string; src: string; href?: string }[] = [
  { name: "Reddit", src: "/images/social/reddit.svg" },
  { name: "Instagram", src: "/images/social/instagram.svg" },
  { name: "Discord", src: "/images/social/discord.svg", href: DISCORD_URL },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10">
      {/* No horizontal padding below md: the accordion rows are full-bleed
          there, so their hairlines have to run edge to edge. */}
      <div className="mx-auto max-w-7xl md:px-6 md:pt-12 md:pb-10">
        <FooterAccordion columns={COLUMNS} />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-y-5 px-4 py-7 sm:px-6 md:flex-nowrap md:gap-8 md:py-5">
          {/* Plain <img> for the same reason as the header's copy: a fixed-size
              wordmark has nothing for next/image to optimise, and SVG through
              it needs dangerouslyAllowSVG. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/2hg-logo.svg"
            alt="Two-Headed Giant"
            width={393}
            height={139}
            className="h-7 w-auto shrink-0 sm:h-8"
          />

          {/* Sits beside the logo on mobile and at the far end of the row from
              md up. The row now carries one real link, so `md:order-last` does
              move a focusable control away from where it's painted. Tolerable
              for a single footer link; anything further that's focusable
              should be reordered in the DOM instead of by CSS. */}
          <div className="ml-auto flex shrink-0 items-center gap-4 md:order-last md:ml-0">
            {SOCIALS.map((social) =>
              social.href ? (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${social.name} — join the server`}
                  className="transition hover:opacity-70"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={social.src}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6"
                  />
                </a>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={social.name}
                  src={social.src}
                  alt=""
                  aria-hidden="true"
                  width={24}
                  height={24}
                  className="size-6"
                />
              ),
            )}
          </div>

          <div className="w-full text-xs leading-relaxed text-zinc-600 md:w-auto md:flex-1">
            <p>
              Card data and images courtesy of{" "}
              <a
                href="https://scryfall.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 underline underline-offset-2 hover:text-white"
              >
                Scryfall
              </a>
              . Not affiliated with or endorsed by Wizards of the Coast.
            </p>
            <p>
              Buy links are affiliate links. Shared pairings are public to
              anyone with the link.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
