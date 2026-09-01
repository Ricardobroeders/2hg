/**
 * The site's own identity.
 *
 * Every absolute URL we publish — canonical tags, Open Graph, the sitemap,
 * JSON-LD — resolves through here, so the origin is stated in exactly one
 * place. That matters more than usual for this project: production answers on
 * two Vercel aliases at once, and without a single canonical origin Google
 * sees two copies of every page and picks a winner itself.
 */

function normalise(raw: string): string {
  const withScheme = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, "");
}

/**
 * Resolution order, and why it isn't just `"https://2hg.dev"`.
 *
 * A canonical tag naming a host that doesn't resolve is worse than no canonical
 * at all — it points every page at a dead URL and Google drops them rather than
 * falling back. So the domain is never assumed: set `SITE_URL` in Vercel on the
 * day it is actually attached, and until then `VERCEL_PROJECT_PRODUCTION_URL`
 * (the project's own production alias) is always correct and always live.
 *
 * Whichever alias Vercel reports becomes canonical, and the other consolidates
 * into it — which is the duplicate-hostname fix, for free.
 */
export const SITE_URL: string = (() => {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return normalise(explicit);

  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return normalise(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }

  const preview = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;
  if (preview) return normalise(preview);

  return "http://localhost:3000";
})();

export const SITE_NAME = "Two-Headed Giant";

/**
 * True only on a real production deployment. Previews and local dev are
 * deliberately excluded: `robots.ts` uses this to keep preview builds out of
 * the index, since Vercel gives every branch a publicly reachable URL.
 */
export const IS_PRODUCTION = process.env.VERCEL_ENV === "production";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Public contact channel.
 *
 * Load-bearing rather than decorative: `/privacy` and `/terms` name it as the
 * route for data-protection and account-deletion requests, so if the invite is
 * ever revoked both pages lose their stated way to reach us.
 */
export const DISCORD_URL = "https://discord.gg/chdATWFckx";
