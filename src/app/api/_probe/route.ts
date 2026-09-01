// TEMPORARY diagnostic — remove after diagnosing the share-page blank cards.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NAMES = [
  "Ad Nauseam", "Ancient Tomb", "Arcane Signet", "Command Tower",
  "Dark Ritual", "Demonic Tutor", "Sen Triplets", "Yawgmoth, Thran Physician",
];

export async function GET() {
  const started = Date.now();
  const out: Record<string, unknown> = {};

  try {
    const res = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "TwoHeadedGiant/0.1 (https://2hg.dev)",
      },
      body: JSON.stringify({ identifiers: NAMES.map((name) => ({ name })) }),
      cache: "no-store",
    });
    out.status = res.status;
    out.ok = res.ok;
    out.headers = Object.fromEntries(res.headers.entries());
    const text = await res.text();
    out.bodyPreview = text.slice(0, 400);
    try {
      out.found = (JSON.parse(text) as { data?: unknown[] }).data?.length ?? null;
    } catch {
      out.found = null;
    }
  } catch (error) {
    out.threw = String(error);
    out.cause = String((error as { cause?: unknown })?.cause ?? "");
  }

  out.ms = Date.now() - started;
  return NextResponse.json(out);
}
