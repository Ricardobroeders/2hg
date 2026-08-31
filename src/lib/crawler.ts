import { headers } from "next/headers";

/**
 * Bot detection, used only to decide whether a page view counts.
 *
 * Share pages are public and indexable on purpose — that link is how this site
 * spreads — but they also increment `teams.viewCount` on every render. Left
 * alone, a crawl makes a pairing look popular when nobody has opened it. The
 * view count is a vanity number shown to the owner, so a loose user-agent match
 * is the right tool: the cost of a miss is one over-counted view.
 *
 * Never use this to vary what a crawler *sees*. Serving different content to
 * bots than to people is cloaking.
 */
const BOT = /bot|crawler|crawling|spider|slurp|facebookexternalhit|embedly|preview|scraper|curl|wget|headless|lighthouse|monitoring|python-requests|axios|node-fetch/i;

export async function isCrawler(): Promise<boolean> {
  const ua = (await headers()).get("user-agent");
  // No user-agent at all is far more likely to be automation than a browser.
  if (!ua) return true;
  return BOT.test(ua);
}
