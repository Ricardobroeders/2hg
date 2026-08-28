import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth/server";
import { DatabaseNotConfiguredError } from "@/lib/db";
import { claimTeam } from "@/lib/db/teams";

/**
 * Attach a pairing you created anonymously to your account.
 *
 * The edit token is the credential — it's what the browser has been holding
 * in localStorage since the pairing was first saved, and it's the same proof
 * that already authorises an anonymous edit. Signing in doesn't grant any new
 * power over a pairing; it just moves an existing claim somewhere durable.
 */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/teams/[slug]/claim">,
) {
  const { slug } = await ctx.params;

  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    editToken?: string;
  } | null;

  if (!body?.editToken) {
    return NextResponse.json({ error: "editToken required" }, { status: 400 });
  }

  try {
    const ok = await claimTeam(slug, body.editToken, userId);
    if (!ok) {
      // Same answer for "wrong token" and "already owned by someone else", so
      // this can't be used to probe which slugs exist or who owns them.
      return NextResponse.json(
        { error: "That pairing can't be claimed." },
        { status: 403 },
      );
    }
    return NextResponse.json({ slug, claimed: true });
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return NextResponse.json(
        { error: "Sharing isn't configured on this deployment yet." },
        { status: 503 },
      );
    }
    console.error("claimTeam failed", error);
    return NextResponse.json({ error: "Couldn't claim." }, { status: 500 });
  }
}
