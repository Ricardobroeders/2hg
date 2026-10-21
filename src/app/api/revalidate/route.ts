import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Refreshes specific card pages after the daily card import changes them.
 *
 * Card pages are cached for 90 days, which is right for oracle text and wrong
 * for a ban announcement. `scripts/import-cards.ts` calls this with exactly the
 * pages whose rendered content changed — usually none, a handful after a ban.
 * `revalidatePath` only marks them stale; each one re-renders on its next
 * visit, so even a long list costs nothing until someone looks.
 *
 * Bearer-token protected because an open endpoint would let anyone force
 * re-renders, which is the cost this whole setup exists to avoid.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { paths?: unknown } | null;
  const paths = Array.isArray(body?.paths)
    ? body.paths.filter(
        (p): p is string => typeof p === "string" && /^\/cards\/[a-z0-9-]+$/.test(p),
      )
    : [];
  if (paths.length === 0 || paths.length > 100) {
    return NextResponse.json({ error: "1–100 /cards/<slug> paths required" }, { status: 400 });
  }

  for (const path of paths) revalidatePath(path);
  return NextResponse.json({ revalidated: paths.length });
}
