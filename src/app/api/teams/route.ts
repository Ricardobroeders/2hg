import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth/server";
import { DatabaseNotConfiguredError } from "@/lib/db";
import {
  createTeam,
  TeamTooLargeError,
  type EntryKind,
} from "@/lib/db/teams";
import type { TeamPairing } from "@/lib/team";

/**
 * Save a pairing and get a share link back.
 *
 * No auth: a 2HG team is two people, and requiring a signup before you can
 * send your teammate a link would gate the product's only distribution
 * mechanism. The returned `editToken` is the caller's proof of ownership.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    team?: TeamPairing;
    kind?: string;
  } | null;

  const team = body?.team;
  if (!team || typeof team !== "object" || !team.a || !team.b) {
    return NextResponse.json({ error: "team required" }, { status: 400 });
  }

  const kind: EntryKind = body?.kind === "solo" ? "solo" : "pairing";

  // A solo entry only ever stores deck "a", so only deck "a" needs cards.
  const cardCount =
    kind === "solo"
      ? (team.a.entries?.length ?? 0)
      : (team.a.entries?.length ?? 0) + (team.b.entries?.length ?? 0);

  if (cardCount === 0) {
    return NextResponse.json(
      {
        error:
          kind === "solo"
            ? "Add some cards to this deck before saving it."
            : "Add some cards before sharing.",
      },
      { status: 400 },
    );
  }

  try {
    // Signed in? The pairing is yours from the moment it's saved. Signed out?
    // ownerId stays null and the edit token is the only claim on it — the
    // anonymous path is never degraded to push people toward an account.
    const ownerId = await currentUserId();
    const { slug, editToken } = await createTeam(team, ownerId, kind);
    return NextResponse.json({ slug, editToken, kind }, { status: 201 });
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
    console.error("createTeam failed", error);
    return NextResponse.json(
      { error: "Couldn't save your pairing. Try again in a moment." },
      { status: 500 },
    );
  }
}
