// TEMPORARY diagnostic — removed before this work is finished.
import { NextResponse } from "next/server";
import { getTeamBySlug } from "@/lib/db/teams";
import { collectionLookupName } from "@/lib/scryfall";

export const dynamic = "force-dynamic";

async function post(batch: string[]) {
  const started = Date.now();
  const res = await fetch("https://api.scryfall.com/cards/collection", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "TwoHeadedGiant/0.1 (https://2hg.dev)",
    },
    body: JSON.stringify({
      identifiers: batch.map((name) => ({ name: collectionLookupName(name) })),
    }),
    cache: "no-store",
  });
  const text = await res.text();
  return {
    n: batch.length,
    status: res.status,
    retryAfter: res.headers.get("retry-after"),
    ms: Date.now() - started,
    detail: res.ok ? undefined : text.slice(0, 200),
  };
}

export async function GET(req: Request) {
  const size = Number(new URL(req.url).searchParams.get("size") ?? 75);
  const stored = await getTeamBySlug("33j5q6mhyf");
  if (!stored) return NextResponse.json({ error: "no team" });
  const { team } = stored;
  const names = [
    ...new Set([
      ...[...team.a.entries, ...team.b.entries].map((e) => e.name),
      ...team.a.commanders,
      ...team.b.commanders,
    ]),
  ];

  const results = [];
  for (let i = 0; i < names.length; i += size) {
    results.push(await post(names.slice(i, i + size)));
    await new Promise((r) => setTimeout(r, 100));
  }
  return NextResponse.json({ size, total: names.length, results });
}
