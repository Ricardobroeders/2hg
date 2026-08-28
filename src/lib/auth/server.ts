/**
 * Server-side auth instance (Neon Managed Better Auth).
 *
 * Accounts are an *upgrade*, never a wall. The share link is this product's
 * only distribution mechanism, so anonymous create-and-share stays fully
 * functional and signing in only adds "my pairings" on top. Every call site
 * here has to tolerate a null session.
 *
 * Identity lives in the `neon_auth` schema of the same Postgres database as
 * `teams`, which is what lets `teams.owner_id` join straight to a user
 * without a second datastore or a sync job.
 */

import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

/** True when auth env vars are present. Mirrors `getDb()`'s lazy posture: the
 *  site must still build and deploy without auth configured, so the UI asks
 *  this before rendering a sign-in affordance that couldn't work. */
export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET,
  );
}

/** The signed-in user's id, or null. Never throws — a broken auth service
 *  degrades the site to anonymous rather than taking pages down with it. */
export async function currentUserId(): Promise<string | null> {
  if (!isAuthConfigured()) return null;
  try {
    const { data } = await auth.getSession();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}
