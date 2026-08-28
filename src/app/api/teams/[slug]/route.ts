import { NextResponse } from "next/server";
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

  if (!body?.team || !body.editToken) {
    return NextResponse.json(
      { error: "team and editToken required" },
      { status: 400 },
    );
  }

  try {
    if (!(await canEdit(slug, body.editToken))) {
      return NextResponse.json(
        { error: "That edit link is no longer valid." },
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
