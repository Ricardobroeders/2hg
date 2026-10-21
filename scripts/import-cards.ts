/**
 * Loads every playable card into the `cards` table from Scryfall's bulk file.
 *
 *     npm run cards:import                   # import, then refresh changed pages
 *     npm run cards:import -- --dry-run      # report what would change, write nothing
 *     npm run cards:import -- --no-revalidate
 *
 * Runs daily from `.github/workflows/import-cards.yml`, shortly after Scryfall
 * rebuilds the file (~09:00 UTC). This is the only code that talks to Scryfall
 * from our side at all: one 25 MB download a day replaces what used to be a
 * live API call per page render, which is what got us rate-limited.
 *
 * Writes are a diff, not a reload. Most days only `rank` moves (EDHREC
 * popularity), and a rank-only change updates the row without touching the
 * card's page. A change to anything a page renders — oracle text after errata,
 * legality after a ban — updates the row *and* asks the site to re-render that
 * one page, so a ban shows the next day rather than when the 90-day page cache
 * would have expired on its own.
 */

import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { inArray, sql } from "drizzle-orm";
import type { ScryfallCard } from "@/lib/scryfall";
import { cards } from "@/lib/db/schema";
import {
  detailFor,
  isPlayableCard,
  lookupKey,
  prefersForSlug,
  type CardDetail,
} from "@/lib/card-record";
import { LEGALITY_FORMATS } from "@/lib/card-legality";

try {
  process.loadEnvFile(".env.local");
} catch {
  // CI passes the environment directly.
}

const BULK = "https://api.scryfall.com/bulk-data/oracle-cards";
const HEADERS = {
  Accept: "application/json",
  "User-Agent": "TwoHeadedGiant/0.1 (https://2hg.dev)",
};

/** Rows per INSERT. ~500 KB a statement — well inside Neon's HTTP limits. */
const CHUNK = 500;

/**
 * A guard against a truncated download, which would otherwise read as "most
 * cards were deleted from Magic" and remove them. There are ~33,000 playable
 * cards and the number only grows.
 */
const MIN_EXPECTED = 30_000;

/**
 * Past this many changed pages, skip per-page refresh and say so. A number
 * like that means a rules-wide oracle update, and the next deploy re-renders
 * everything anyway.
 */
const MAX_REVALIDATE = 2_000;

const DRY_RUN = process.argv.includes("--dry-run");
const NO_REVALIDATE = process.argv.includes("--no-revalidate");

type Row = typeof cards.$inferInsert;

/** Hash of what a card page renders. `rank` is left out on purpose. */
function contentHash(detail: CardDetail): string {
  const rendered: Partial<CardDetail> = { ...detail };
  delete rendered.rank;
  return createHash("sha1").update(JSON.stringify(rendered)).digest("hex");
}

function toRow(detail: CardDetail): Row {
  return {
    ...detail,
    lookupKey: lookupKey(detail.name),
    commanderLegal: detail.legal[LEGALITY_FORMATS.indexOf("commander")] === "l",
    contentHash: contentHash(detail),
  };
}

async function readBulk(): Promise<{ rows: Row[]; updatedAt: string; contested: number }> {
  const meta = await fetch(BULK, { headers: HEADERS });
  if (!meta.ok) throw new Error(`Scryfall bulk-data ${meta.status}`);
  const { jsonl_download_uri: uri, updated_at: updatedAt } = (await meta.json()) as {
    jsonl_download_uri: string;
    updated_at: string;
  };

  process.stdout.write(`streaming ${uri}\n`);
  const res = await fetch(uri, { headers: { "User-Agent": HEADERS["User-Agent"] } });
  if (!res.ok || !res.body) throw new Error(`bulk download ${res.status}`);

  const lines = createInterface({
    input: Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]).pipe(
      createGunzip(),
    ),
    crlfDelay: Infinity,
  });

  const bySlug = new Map<string, CardDetail>();
  let contested = 0;

  for await (const line of lines) {
    const trimmed = line.trim().replace(/,$/, "");
    if (!trimmed || trimmed === "[" || trimmed === "]") continue;

    let card: ScryfallCard;
    try {
      card = JSON.parse(trimmed) as ScryfallCard;
    } catch {
      continue;
    }
    if (!isPlayableCard(card)) continue;

    const detail = detailFor(card);
    const held = bySlug.get(detail.slug);
    if (held) {
      contested++;
      if (!prefersForSlug(detail, held)) continue;
    }
    bySlug.set(detail.slug, detail);
  }

  return { rows: [...bySlug.values()].map(toRow), updatedAt, contested };
}

async function revalidate(paths: string[]): Promise<void> {
  const site = process.env.SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!site || !secret) {
    process.stdout.write("SITE_URL or REVALIDATE_SECRET unset — pages refresh when their cache expires.\n");
    return;
  }

  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const res = await fetch(new URL("/api/revalidate", site), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paths: batch }),
    });
    // Not fatal: the rows are already right, and a paused or unreachable site
    // simply picks the change up when each page's cache expires.
    if (!res.ok) {
      process.stdout.write(`revalidate answered ${res.status}; leaving ${paths.length - i} pages to expire naturally.\n`);
      return;
    }
  }
  process.stdout.write(`asked the site to refresh ${paths.length} card pages.\n`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const db = drizzle(neon(url));

  const { rows, updatedAt, contested } = await readBulk();
  process.stdout.write(
    `${rows.length} playable cards (Scryfall ${updatedAt}); ${contested} lost a contested slug.\n`,
  );
  if (rows.length < MIN_EXPECTED) {
    throw new Error(`only ${rows.length} cards parsed — refusing to import a truncated file`);
  }

  const existing = await db
    .select({
      oracleId: cards.oracleId,
      slug: cards.slug,
      contentHash: cards.contentHash,
      rank: cards.rank,
    })
    .from(cards);
  const before = new Map(existing.map((r) => [r.oracleId, r]));
  const slugOwner = new Map(rows.map((r) => [r.slug, r.oracleId]));

  /**
   * Rows that have to go before anything is written: cards no longer in the
   * file, and rows sitting on a slug another card now owns (a rename, or a
   * contested slug changing hands). Upserting first would trip the unique slug
   * index, because the upsert conflicts on `oracle_id`, not `slug`.
   */
  const incoming = new Set(rows.map((r) => r.oracleId));
  const stale = existing.filter((r) => {
    if (!incoming.has(r.oracleId)) return true;
    const owner = slugOwner.get(r.slug);
    return owner !== undefined && owner !== r.oracleId;
  });
  const staleIds = new Set(stale.map((r) => r.oracleId));

  const changed: Row[] = [];
  // Every removed row's page now shows something else — another card, or a 404.
  const refresh: string[] = stale.map((r) => `/cards/${r.slug}`);
  let rankOnly = 0;

  for (const row of rows) {
    const old = staleIds.has(row.oracleId) ? undefined : before.get(row.oracleId);
    if (!old) {
      changed.push(row);
      continue;
    }
    if (old.contentHash !== row.contentHash) {
      changed.push(row);
      // A new card has no cached page to refresh; an edited one does, at the
      // slug it had and (if renamed) the one it has now.
      refresh.push(`/cards/${old.slug}`);
      if (old.slug !== row.slug) refresh.push(`/cards/${row.slug}`);
    } else if (old.rank !== row.rank) {
      changed.push(row);
      rankOnly++;
    }
  }

  process.stdout.write(
    `${existing.length} rows stored · ${stale.length} to remove · ${changed.length} to write (${rankOnly} rank-only) · ${refresh.length} pages to refresh\n`,
  );
  if (DRY_RUN) return;

  const staleList = [...staleIds];
  for (let i = 0; i < staleList.length; i += CHUNK) {
    await db.delete(cards).where(inArray(cards.oracleId, staleList.slice(i, i + CHUNK)));
  }

  for (let i = 0; i < changed.length; i += CHUNK) {
    await db
      .insert(cards)
      .values(changed.slice(i, i + CHUNK))
      .onConflictDoUpdate({
        target: cards.oracleId,
        set: {
          slug: sql`excluded.slug`,
          name: sql`excluded.name`,
          lookupKey: sql`excluded.lookup_key`,
          id: sql`excluded.id`,
          cost: sql`excluded.cost`,
          cmc: sql`excluded.cmc`,
          type: sql`excluded.type`,
          oracle: sql`excluded.oracle`,
          colorIdentity: sql`excluded.color_identity`,
          keywords: sql`excluded.keywords`,
          setCode: sql`excluded.set_code`,
          setName: sql`excluded.set_name`,
          rarity: sql`excluded.rarity`,
          collectorNumber: sql`excluded.collector_number`,
          releasedAt: sql`excluded.released_at`,
          layout: sql`excluded.layout`,
          uri: sql`excluded.uri`,
          image: sql`excluded.image`,
          rank: sql`excluded.rank`,
          legal: sql`excluded.legal`,
          commanderLegal: sql`excluded.commander_legal`,
          contentHash: sql`excluded.content_hash`,
          updatedAt: sql`now()`,
        },
      });
    process.stdout.write(`  wrote ${Math.min(i + CHUNK, changed.length)}/${changed.length}\r`);
  }
  process.stdout.write("\n");

  if (NO_REVALIDATE || refresh.length === 0) return;
  if (refresh.length > MAX_REVALIDATE) {
    process.stdout.write(`${refresh.length} pages changed — too many to refresh one by one; the next deploy will.\n`);
    return;
  }
  await revalidate([...new Set(refresh)]);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
  process.exit(1);
});
