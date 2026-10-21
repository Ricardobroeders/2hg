/**
 * Server-side card lookups. SERVER ONLY.
 *
 * Every card a server render needs comes from here, and none of it comes from
 * Scryfall. Rendering used to mean a live Scryfall call from Vercel's shared
 * egress address; a crawler walking card pages turned that into 429s, 30–90s
 * hangs and a bill for functions held open waiting (alerts of 2026-08-31 and
 * 2026-09-04). The `cards` table is loaded once a day from Scryfall's bulk
 * file instead, by `scripts/import-cards.ts`.
 *
 * Interactive lookups — autocomplete, decklist import, the builder, card
 * search, live prices — don't come here either. They run in the visitor's
 * browser against Scryfall directly (`./scryfall-browser`), on the visitor's
 * own rate limit and none of our compute.
 *
 * With no `DATABASE_URL` every function falls back to the committed
 * `card-details.json` artifact, so the site still builds and serves the ~5,600
 * rule-matching cards from a fresh clone.
 */

import { and, asc, eq, ilike, inArray, lte, notIlike, or, sql, type SQL } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "./db";
import { cards } from "./db/schema";
import { allCardDetails, cardDetail, cardDetailByName } from "./card-details";
import { detailToCard, lookupKey, type CardDetail } from "./card-record";
import { LEGALITY_FORMATS } from "./card-legality";
import type { ScryfallCard } from "./scryfall";

/** The `cards` columns that make up a `CardDetail`, so a row converts as-is. */
const DETAIL = {
  slug: cards.slug,
  id: cards.id,
  oracleId: cards.oracleId,
  name: cards.name,
  cost: cards.cost,
  cmc: cards.cmc,
  type: cards.type,
  oracle: cards.oracle,
  colorIdentity: cards.colorIdentity,
  keywords: cards.keywords,
  setCode: cards.setCode,
  setName: cards.setName,
  rarity: cards.rarity,
  collectorNumber: cards.collectorNumber,
  releasedAt: cards.releasedAt,
  layout: cards.layout,
  uri: cards.uri,
  image: cards.image,
  rank: cards.rank,
  legal: cards.legal,
};

const byPopularity = [sql`${cards.rank} asc nulls last`, asc(cards.name)];

export async function cardBySlug(slug: string): Promise<CardDetail | null> {
  if (!isDatabaseConfigured()) return cardDetail(slug) ?? null;

  const [row] = await getDb()
    .select(DETAIL)
    .from(cards)
    .where(eq(cards.slug, slug))
    .limit(1);
  return row ?? null;
}

/**
 * The nearest card to a slug that matched nothing exactly — an old link, a
 * typo, a name with its punctuation spelled out.
 *
 * Trigram similarity on the slug, which pg_trgm indexes. The 0.3 floor is
 * pg_trgm's own default for `%`; below it a "match" is usually a different
 * card, and a 404 is the more honest answer. No database, no fuzzy matching:
 * the artifact fallback only knows exact slugs.
 */
export async function cardNearSlug(slug: string): Promise<CardDetail | null> {
  if (!isDatabaseConfigured()) return null;

  const [row] = await getDb()
    .select(DETAIL)
    .from(cards)
    .where(sql`${cards.slug} % ${slug}`)
    .orderBy(sql`similarity(${cards.slug}, ${slug}) desc`, ...byPopularity)
    .limit(1);
  return row ?? null;
}

/**
 * Cards for a list of names, in one query.
 *
 * Names are matched exactly first and then on `lookupKey`, so a stored
 * decklist written before a rename, or a front-face-only "Delver of Secrets",
 * still finds its card. Exact wins because loose keys collide — "Wasteland"
 * and the joke card "Waste Land" share one. The result is keyed by Scryfall's
 * canonical name, which is the join key everywhere else.
 */
export async function cardsByNames(names: string[]): Promise<ScryfallCard[]> {
  const wanted = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (wanted.length === 0) return [];

  if (!isDatabaseConfigured()) {
    return wanted
      .map((name) => cardDetailByName(name))
      .filter((detail) => detail != null)
      .map(detailToCard);
  }

  const keys = [...new Set(wanted.map(lookupKey))];
  const rows = await getDb()
    .select({ ...DETAIL, lookupKey: cards.lookupKey })
    .from(cards)
    .where(or(inArray(cards.name, wanted), inArray(cards.lookupKey, keys)))
    .orderBy(...byPopularity);

  const byName = new Map(rows.map((row) => [row.name, row]));
  const byKey = new Map<string, (typeof rows)[number]>();
  // Rows arrive most-played first, so the first claimant of a key keeps it.
  for (const row of rows) if (!byKey.has(row.lookupKey)) byKey.set(row.lookupKey, row);

  const found = new Map<string, CardDetail>();
  for (const name of wanted) {
    const row = byName.get(name) ?? byKey.get(lookupKey(name));
    if (row) found.set(row.name, row);
  }
  return [...found.values()].map(detailToCard);
}

export type CardFilter = {
  /** Oracle text containing any of these phrases, case-insensitively. */
  oracleAny?: readonly string[];
  /** Colour identity within this set — Scryfall's `id<=`. Empty means colourless. */
  identityWithin?: readonly string[];
  maxCmc?: number;
  excludeLands?: boolean;
  limit: number;
};

/**
 * Commander-legal cards matching a filter, most played first.
 *
 * The structured stand-in for the Scryfall queries the home shelves and the
 * synergy rail used to send — `oracle:"each opponent" id<=wu legal:commander`
 * becomes `{ oracleAny: ["each opponent"], identityWithin: ["W", "U"] }`.
 */
export async function findCards(filter: CardFilter): Promise<ScryfallCard[]> {
  if (!isDatabaseConfigured()) return findInArtifact(filter);

  const where: (SQL | undefined)[] = [eq(cards.commanderLegal, true)];
  if (filter.oracleAny?.length) {
    where.push(or(...filter.oracleAny.map((p) => ilike(cards.oracle, `%${escapeLike(p)}%`))));
  }
  if (filter.identityWithin) {
    const colours = filter.identityWithin.map((c) => sql`${c}`);
    where.push(
      sql`${cards.colorIdentity} <@ ARRAY[${sql.join(colours, sql`, `)}]::text[]`,
    );
  }
  if (filter.maxCmc !== undefined) where.push(lte(cards.cmc, filter.maxCmc));
  if (filter.excludeLands) where.push(notIlike(cards.type, "%land%"));

  const rows = await getDb()
    .select(DETAIL)
    .from(cards)
    .where(and(...where))
    .orderBy(...byPopularity)
    .limit(filter.limit);
  return rows.map(detailToCard);
}

function escapeLike(phrase: string): string {
  return phrase.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** `findCards` over the committed artifact — the rule-matching cards only. */
function findInArtifact(filter: CardFilter): ScryfallCard[] {
  const commander = LEGALITY_FORMATS.indexOf("commander");
  const phrases = filter.oracleAny?.map((p) => p.toLowerCase());
  const within = filter.identityWithin ? new Set(filter.identityWithin) : null;

  return allCardDetails()
    .filter((d) => d.legal[commander] === "l")
    .filter((d) => !phrases || phrases.some((p) => d.oracle.toLowerCase().includes(p)))
    .filter((d) => !within || d.colorIdentity.every((c) => within.has(c)))
    .filter((d) => filter.maxCmc === undefined || d.cmc <= filter.maxCmc)
    .filter((d) => !filter.excludeLands || !d.type.toLowerCase().includes("land"))
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.name.localeCompare(b.name))
    .slice(0, filter.limit)
    .map(detailToCard);
}
