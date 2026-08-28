import { NextResponse } from "next/server";
import { autocomplete } from "@/lib/scryfall";

/** Typeahead for the card search box. Proxied so Scryfall sees one origin. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const names = await autocomplete(q);
  return NextResponse.json(
    { names },
    { headers: { "Cache-Control": "public, s-maxage=3600" } },
  );
}
