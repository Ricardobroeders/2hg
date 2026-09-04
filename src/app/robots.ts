import type { MetadataRoute } from "next";
import { IS_PRODUCTION, absoluteUrl } from "@/lib/site";

/**
 * Crawl directives.
 *
 * Preview deployments get a blanket disallow. Vercel gives every branch a
 * publicly reachable URL, and an indexed preview competes with production for
 * the same content — the duplicate-content problem we're already fixing once.
 *
 * Everything else is open on purpose. Shared pairings at /t and /d are meant to
 * be public and indexable; that share link is the only way this site spreads.
 */
export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/", // no crawlable content, and /api/resolve is a POST surface
        "/account", // session-only, already noindex
        "/auth/", // sign-in flow
        /**
         * Filtered card search — the site's one unbounded crawl space.
         *
         * `id<=w legal:commander -type:land` alone is 7,108 cards: 41 pages of
         * 175 links each, and every card page's "More →" points into it. Times
         * 32 colour identities, times 4 sort orders. Walking that cost a live
         * Scryfall search per search page *and* a live fuzzy lookup for each of
         * the ~26,000 cards outside the corpus, which is what rate-limited us
         * into 8s timeouts on 2026-09-04.
         *
         * Nothing we want indexed loses a path: all 5,620 corpus cards are
         * linked from the 18 rule hubs, and the ~26,000 others are `noindex`
         * on arrival, so crawling them was only ever cost. Prefix matching
         * means this hits `?`-bearing URLs only — bare `/cards` and every
         * `/cards/[slug]` stay crawlable.
         */
        "/cards?",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
