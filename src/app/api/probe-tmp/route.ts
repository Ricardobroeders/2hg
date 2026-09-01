// TEMPORARY diagnostic — remove after diagnosing the share-page blank cards.
import { NextResponse } from "next/server";
import { getTeamBySlug } from "@/lib/db/teams";
import { collectionLookupName } from "@/lib/scryfall";

export const dynamic = "force-dynamic";

const HEADERS = {
  Accept: "application/json",
  "User-Agent": "TwoHeadedGiant/0.1 (https://2hg.dev)",
  "Content-Type": "application/json",
};

async function post(batch: string[]) {
  const started = Date.now();
  try {
    const res = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        identifiers: batch.map((name) => ({ name: collectionLookupName(name) })),
      }),
      cache: "no-store",
    });
    const text = await res.text();
    return {
      size: batch.length,
      status: res.status,
      ok: res.ok,
      retryAfter: res.headers.get("retry-after"),
      cfRay: res.headers.get("cf-ray"),
      body: text.slice(0, 300),
      ms: Date.now() - started,
    };
  } catch (error) {
    return { size: batch.length, threw: String(error), ms: Date.now() - started };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") ?? "99vwy2j2z9";
  const mode = url.searchParams.get("mode") ?? "parallel";

  const stored = await getTeamBySlug(slug);
  if (!stored) return NextResponse.json({ error: "no team" });
  const { team } = stored;
  const names = [
    ...new Set([
      ...[...team.a.entries, ...team.b.entries].map((e) => e.name),
      ...team.a.commanders,
      ...team.b.commanders,
    ]),
  ];

  const batches: string[][] = [];
  for (let i = 0; i < names.length; i += 75) batches.push(names.slice(i, i + 75));

  let results;
  if (mode === "serial") {
    results = [];
    for (const b of batches) results.push(await post(b));
  } else {
    results = await Promise.all(batches.map(post));
  }

  return NextResponse.json({ mode, nameCount: names.length, results });
}
