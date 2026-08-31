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
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
