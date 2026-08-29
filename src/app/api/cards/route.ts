import { NextResponse } from "next/server";
import { getCardsByNames } from "@/lib/scryfall";

/**
 * Bulk card hydration for the deck builder. The client holds only card names;
 * this fills in oracle text, images and prices in a single round trip.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    names?: unknown;
  } | null;

  if (!Array.isArray(body?.names)) {
    return NextResponse.json({ error: "names[] required" }, { status: 400 });
  }

  const names = body.names.filter((n): n is string => typeof n === "string");
  if (names.length > 300) {
    return NextResponse.json({ error: "too many names" }, { status: 400 });
  }

  const cards = await getCardsByNames(names);
  return NextResponse.json({ cards });
}
