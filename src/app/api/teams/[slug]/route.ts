import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth/server";
import { DatabaseNotConfiguredError } from "@/lib/db";
import {
  canEdit,
  getTeamBySlug,
  updateTeam,
  TeamTooLargeError,
} from "@/lib/db/teams";
import type { TeamPairing } from "@/lib/team";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/teams/[slug]">,
) {
  const { slug } = await ctx.params;

  let stored;
  try {
    stored = await getTeamBySlug(slug);
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return NextResponse.json(
        { error: "Sharing isn't configured on this deployment yet." },
        { status: 503 },
      );
    }
    throw error;
  }

  if (!stored) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // The edit token never leaves the server on a read — anyone with the link
  // can view a pairing, only its creator can change it.
  return NextResponse.json({
    team: stored.team,
    kind: stored.kind,
    slug: stored.slug,
    viewCount: stored.viewCount,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  });
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/teams/[slug]">,
) {
  const { slug } = await ctx.params;

  const body = (await request.json().catch(() => null)) as {
    team?: TeamPairing;
    editToken?: string;
  } | null;

  if (!body?.team) {
    return NextResponse.json({ error: "team required" }, { status: 400 });
  }

  try {
    // No editToken is fine as long as the session owns this row — that's the
    // "open my saved deck from /account and change it" path.
    const userId = await currentUserId();
    if (!(await canEdit(slug, body.editToken ?? null, userId))) {
      return NextResponse.json(
        {
          error: userId
            ? "That deck isn't yours to edit."
            : "That edit link is no longer valid. Sign in if it's yours.",
        },
        { status: 403 },
      );
    }

    const ok = await updateTeam(slug, body.team);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ slug });
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return NextResponse.json(
        { error: "Sharing isn't configured on this deployment yet." },
        { status: 503 },
      );
    }
    if (error instanceof TeamTooLargeError) {
      return NextResponse.json(
        { error: "That pairing is too large to save." },
        { status: 413 },
      );
    }
    console.error("updateTeam failed", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}
