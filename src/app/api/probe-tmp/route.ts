// TEMPORARY diagnostic — remove after diagnosing the share-page blank cards.
import { NextResponse } from "next/server";
import { getTeamBySlug } from "@/lib/db/teams";
import { getCardsByNames } from "@/lib/scryfall";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "99vwy2j2z9";
  const out: Record<string, unknown> = { slug };

  try {
    const stored = await getTeamBySlug(slug);
    if (!stored) return NextResponse.json({ ...out, error: "no team" });

    const { team } = stored;
    const names = [
      ...new Set([
        ...[...team.a.entries, ...team.b.entries].map((e) => e.name),
        ...team.a.commanders,
        ...team.b.commanders,
      ]),
    ];
    out.nameCount = names.length;
    out.sampleNames = names.slice(0, 5);
    out.commanders = [...team.a.commanders, ...team.b.commanders];

    const started = Date.now();
    try {
      const cards = await getCardsByNames(names);
      out.resolved = cards.length;
      out.sampleResolved = cards.slice(0, 3).map((c) => c.name);
      const map = new Map(cards.map((c) => [c.name, c]));
      out.commanderHits = [...team.a.commanders, ...team.b.commanders].map(
        (n) => `${n}: ${map.has(n)}`,
      );
    } catch (error) {
      out.getCardsThrew = String(error);
    }
    out.ms = Date.now() - started;
  } catch (error) {
    out.threw = String(error);
  }

  return NextResponse.json(out);
}
