/**
 * Builds the card corpus that the sitemap, the rule hubs and static generation
 * all read from.
 *
 *     npm run seo:corpus          # rebuild the artifact
 *     npm run seo:corpus:check    # exit 1 if Scryfall has newer data
 *
 * Reads Scryfall's `oracle-cards` bulk file — one gzipped JSON-Lines download,
 * streamed. Not `/cards/search`: enumerating ~31,800 Commander-legal cards that
 * way is ~180 requests, and Scryfall's own API guidelines say to use bulk data
 * for exactly this.
 *
 * The artifact is committed rather than fetched at build time, so builds stay
 * reproducible and offline (`CLAUDE.md` requires the site to build with no
 * network), and so a Scryfall-side change lands as a reviewable diff instead of
 * silently altering what we publish.
 *
 * **It is an index, never a cache.** `score` and `tier` here decide only which
 * URLs we advertise and how lists are ordered — nothing user-facing renders
 * them. Card pages call `scoreCard()` on live Scryfall data. So a stale corpus
 * can leave a card in a hub it no longer earns; it can never show anyone a
 * stale number.
 *
 * What it throws away is the point. Only ~15% of Commander-legal cards trip a
 * 2HG rule at all. The rest render "plays about the same in 2HG as it does in
 * any other format" — a fair answer for a visitor, a thin page for a search
 * engine. Publishing 25,000 of those is how a site gets demoted, so they stay
 * routable and stay out of here.
 */

import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ScryfallCard } from "@/lib/scryfall";
import { scoreCard } from "@/lib/twohg-score";
import { toSlug } from "@/lib/slug";

const BULK = "https://api.scryfall.com/bulk-data/oracle-cards";
const OUT = join(process.cwd(), "src/data/card-corpus.json");

const HEADERS = {
  Accept: "application/json",
  "User-Agent": "TwoHeadedGiant/0.1 (https://2hg.dev)",
};

/** Layouts that aren't cards anyone would have a page for. */
const SKIP_LAYOUTS = new Set([
  "token",
  "double_faced_token",
  "emblem",
  "art_series",
  "vanguard",
  "scheme",
  "planar",
  "augment",
  "host",
  "reversible_card",
]);

type CorpusCard = {
  name: string;
  slug: string;
  /** Scryfall's EDHREC popularity rank; null for cards nobody plays. */
  rank: number | null;
  score: number;
  tier: string;
  /** Ids of the 2HG rules this card trips. Never empty — that's the filter. */
  rules: string[];
};

function eligible(card: ScryfallCard): boolean {
  if (card.legalities?.commander !== "legal") return false;
  if (SKIP_LAYOUTS.has(card.layout)) return false;
  if ((card as { digital?: boolean }).digital) return false;
  if (!card.type_line) return false;
  return true;
}

async function bulkMeta(): Promise<{ uri: string; updatedAt: string }> {
  const res = await fetch(BULK, { headers: HEADERS });
  if (!res.ok) throw new Error(`Scryfall bulk-data ${res.status}`);
  const meta = (await res.json()) as {
    jsonl_download_uri: string;
    updated_at: string;
  };
  return { uri: meta.jsonl_download_uri, updatedAt: meta.updated_at };
}

function committedUpdatedAt(): string | null {
  if (!existsSync(OUT)) return null;
  try {
    return (
      JSON.parse(readFileSync(OUT, "utf8")) as { scryfallUpdatedAt?: string }
    ).scryfallUpdatedAt ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const { uri, updatedAt } = await bulkMeta();

  if (process.argv.includes("--check")) {
    const have = committedUpdatedAt();
    const stale = have !== updatedAt;
    process.stdout.write(
      `committed: ${have ?? "(none)"}\nscryfall:  ${updatedAt}\n${stale ? "STALE — run npm run seo:corpus\n" : "up to date\n"}`,
    );
    process.exit(stale ? 1 : 0);
  }

  process.stdout.write(`streaming ${uri}\n`);
  const res = await fetch(uri, { headers: { "User-Agent": HEADERS["User-Agent"] } });
  if (!res.ok || !res.body) throw new Error(`bulk download ${res.status}`);

  const lines = createInterface({
    input: Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]).pipe(
      createGunzip(),
    ),
    crlfDelay: Infinity,
  });

  const kept: CorpusCard[] = [];
  const byRule = new Map<string, number>();
  const slugs = new Map<string, string[]>();
  let seen = 0;
  let commanderLegal = 0;

  for await (const line of lines) {
    const trimmed = line.trim().replace(/,$/, "");
    if (!trimmed || trimmed === "[" || trimmed === "]") continue;

    let card: ScryfallCard;
    try {
      card = JSON.parse(trimmed) as ScryfallCard;
    } catch {
      continue;
    }

    seen++;
    if (!eligible(card)) continue;
    commanderLegal++;

    const score = scoreCard(card);
    // The thin-content filter, and the same predicate the sitemap uses.
    if (score.matched.length === 0) continue;

    const slug = toSlug(card.name);
    slugs.set(slug, [...(slugs.get(slug) ?? []), card.name]);

    for (const rule of score.matched) {
      byRule.set(rule.id, (byRule.get(rule.id) ?? 0) + 1);
    }

    kept.push({
      name: card.name,
      slug,
      rank: card.edhrec_rank ?? null,
      score: score.score,
      tier: score.tier,
      rules: score.matched.map((m) => m.id),
    });
  }

  // Two cards on one URL means one of them is permanently unreachable. Fail
  // loudly rather than publish a sitemap entry that serves the wrong card.
  const collisions = [...slugs].filter(([, names]) => names.length > 1);
  if (collisions.length) {
    process.stderr.write("\nslug collisions:\n");
    for (const [slug, names] of collisions) {
      process.stderr.write(`  ${slug}: ${names.join(" | ")}\n`);
    }
    process.exit(1);
  }

  // Most-played first, so `generateStaticParams` can take the head of the list.
  // Deterministic ordering is what keeps the committed diff reviewable.
  kept.sort(
    (a, b) =>
      (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.name.localeCompare(b.name),
  );

  // One card per line: compact enough to commit, still readable in a diff.
  const body = kept.map((c) => JSON.stringify(c)).join(",\n");
  writeFileSync(
    OUT,
    `{\n"scryfallUpdatedAt": ${JSON.stringify(updatedAt)},\n"cardCount": ${kept.length},\n"cards": [\n${body}\n]}\n`,
  );

  const pct = ((kept.length / commanderLegal) * 100).toFixed(1);
  process.stdout.write(
    `\n${seen} cards scanned, ${commanderLegal} Commander-legal, ${kept.length} trip a 2HG rule (${pct}%).\n\n`,
  );
  for (const [rule, count] of [...byRule].sort((a, b) => b[1] - a[1])) {
    process.stdout.write(`  ${rule.padEnd(24)} ${String(count).padStart(5)}\n`);
  }
  process.stdout.write(`\nWrote ${OUT}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
  process.exit(1);
});
