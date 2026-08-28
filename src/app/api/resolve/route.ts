import { NextResponse } from "next/server";
import { resolveCardNames } from "@/lib/scryfall";

/**
 * Turn the names in a pasted decklist into canonical Scryfall cards.
 *
 * Separate from /api/cards because the importer needs the mapping back —
 * which written name became which card, and which ones matched nothing.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    names?: unknown;
  } | null;

  if (!Array.isArray(body?.names)) {
    return NextResponse.json({ error: "names[] required" }, { status: 400 });
  }

  const names = body.names.filter((n): n is string => typeof n === "string");

  // A Commander deck is 100 cards; anything much past that is a paste
  // accident, and each name can cost us a Scryfall round trip.
  if (names.length > 500) {
    return NextResponse.json(
      { error: "That list is too long — 500 distinct cards maximum." },
      { status: 400 },
    );
  }

  try {
    const result = await resolveCardNames(names);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach Scryfall. Try again in a moment." },
      { status: 502 },
    );
  }
}
