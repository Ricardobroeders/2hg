import { auth } from "@/lib/auth/server";

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts`.
 *
 * Only `/account` is gated. Everything else — cards, ratings, the builder, and
 * crucially the public `/t/{slug}` share pages — stays reachable signed-out,
 * because a share link that demanded a login would kill the one mechanism that
 * spreads this site.
 */
export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: ["/account/:path*"],
};
