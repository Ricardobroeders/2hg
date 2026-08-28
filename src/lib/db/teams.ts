/**
 * Team pairing persistence.
 *
 * Server-only. Every write goes through `db.batch`, which Neon's HTTP driver
 * sends as a single transaction in one round trip — there are no interactive
 * transactions to lean on, so a write is never split across requests.
 */

import { randomBytes, randomUUID } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "./index";
import { deckCards, decks, teams } from "./schema";
import {
  DEFAULT_FORMAT,
  FORMATS,
  emptyDeck,
  type DeckSlot,
  type FormatId,
  type TeamPairing,
} from "../team";

export type StoredTeam = {
  team: TeamPairing;
  slug: string;
  ownerId: string | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Share slugs are unguessable rather than pretty: the link itself is the only
 * access control on an unlisted pairing. Crockford-ish alphabet, no vowels, so
 * a slug can't accidentally spell something and can be read aloud.
 */
const ALPHABET = "0123456789bcdfghjkmnpqrstvwxyz";

function shortId(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

/** Cheap sanity bound — a pairing is two decks, not a card database. */
const MAX_CARD_ROWS = 600;

export class TeamTooLargeError extends Error {}

function cardRowsFor(team: TeamPairing, deckIds: Record<DeckSlot, string>) {
  const rows: { deckId: string; cardName: string; quantity: number }[] = [];

  for (const slot of ["a", "b"] as const) {
    // Collapse any duplicate names so the (deck_id, card_name) primary key
    // can't be violated by a malformed client payload.
    const merged = new Map<string, number>();
    for (const entry of team[slot].entries) {
      const name = entry.name.trim();
      if (!name) continue;
      const qty = Math.max(1, Math.min(1000, Math.floor(entry.quantity) || 1));
      merged.set(name, (merged.get(name) ?? 0) + qty);
    }
    for (const [cardName, quantity] of merged) {
      rows.push({ deckId: deckIds[slot], cardName, quantity });
    }
  }

  if (rows.length > MAX_CARD_ROWS) throw new TeamTooLargeError();
  return rows;
}

function deckRowsFor(
  team: TeamPairing,
  teamId: string,
  deckIds: Record<DeckSlot, string>,
) {
  return (["a", "b"] as const).map((slot) => ({
    id: deckIds[slot],
    teamId,
    slot,
    name: team[slot].name.slice(0, 120) || `Deck ${slot.toUpperCase()}`,
    commanders: team[slot].commanders ?? [],
  }));
}

function normalizeFormat(format: unknown): FormatId {
  return typeof format === "string" && format in FORMATS
    ? (format as FormatId)
    : DEFAULT_FORMAT;
}

/**
 * Save a new pairing and return the share slug plus the edit token that lets
 * an anonymous creator come back and change it.
 */
export async function createTeam(
  team: TeamPairing,
  ownerId: string | null = null,
): Promise<{ slug: string; editToken: string }> {
  const db = getDb();
  const teamId = randomUUID();
  const deckIds: Record<DeckSlot, string> = {
    a: randomUUID(),
    b: randomUUID(),
  };

  const slug = shortId(10);
  const editToken = shortId(32);
  const cards = cardRowsFor(team, deckIds);

  const writes = [
    db.insert(teams).values({
      id: teamId,
      slug,
      name: team.name.slice(0, 120) || "Untitled team",
      format: normalizeFormat(team.format),
      ownerId,
      editToken,
    }),
    db.insert(decks).values(deckRowsFor(team, teamId, deckIds)),
  ] as const;

  await (cards.length
    ? db.batch([...writes, db.insert(deckCards).values(cards)])
    : db.batch(writes));

  return { slug, editToken };
}

/**
 * Load a pairing by its share slug. One round trip — the join is flattened and
 * regrouped here rather than costing three queries.
 */
export async function getTeamBySlug(slug: string): Promise<StoredTeam | null> {
  const db = getDb();
  const rows = await db
    .select({
      team: teams,
      deckId: decks.id,
      deckSlot: decks.slot,
      deckName: decks.name,
      commanders: decks.commanders,
      cardName: deckCards.cardName,
      quantity: deckCards.quantity,
    })
    .from(teams)
    .leftJoin(decks, eq(decks.teamId, teams.id))
    .leftJoin(deckCards, eq(deckCards.deckId, decks.id))
    .where(eq(teams.slug, slug));

  if (rows.length === 0) return null;

  const row = rows[0].team;
  const pairing: TeamPairing = {
    id: row.id,
    name: row.name,
    format: row.format,
    a: emptyDeck("Deck A"),
    b: emptyDeck("Deck B"),
  };

  for (const r of rows) {
    if (!r.deckSlot) continue;
    const deck = pairing[r.deckSlot];
    deck.name = r.deckName ?? deck.name;
    deck.commanders = r.commanders ?? [];
    // leftJoin yields one null-card row for a deck with no cards.
    if (r.cardName) {
      deck.entries.push({ name: r.cardName, quantity: r.quantity ?? 1 });
    }
  }

  return {
    team: pairing,
    slug: row.slug,
    ownerId: row.ownerId,
    viewCount: row.viewCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Whether this token may edit this pairing. */
export async function canEdit(
  slug: string,
  editToken: string,
): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ editToken: teams.editToken })
    .from(teams)
    .where(eq(teams.slug, slug))
    .limit(1);

  return row != null && row.editToken === editToken;
}

/**
 * Replace a pairing's contents. Decks are dropped and rewritten rather than
 * diffed — a decklist is small, and a full rewrite can't leave stale rows.
 */
export async function updateTeam(
  slug: string,
  team: TeamPairing,
): Promise<boolean> {
  const db = getDb();
  const [existing] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.slug, slug))
    .limit(1);

  if (!existing) return false;

  const deckIds: Record<DeckSlot, string> = {
    a: randomUUID(),
    b: randomUUID(),
  };
  const cards = cardRowsFor(team, deckIds);

  const writes = [
    db
      .update(teams)
      .set({
        name: team.name.slice(0, 120) || "Untitled team",
        format: normalizeFormat(team.format),
        updatedAt: new Date(),
      })
      .where(eq(teams.id, existing.id)),
    // deck_cards cascade with their decks.
    db.delete(decks).where(eq(decks.teamId, existing.id)),
    db.insert(decks).values(deckRowsFor(team, existing.id, deckIds)),
  ] as const;

  await (cards.length
    ? db.batch([...writes, db.insert(deckCards).values(cards)])
    : db.batch(writes));

  return true;
}

/**
 * View counter. Incremented in SQL rather than read-modify-write, so
 * concurrent opens of the same share link can't lose counts.
 */
export async function recordView(slug: string): Promise<void> {
  try {
    await getDb()
      .update(teams)
      .set({ viewCount: sql`${teams.viewCount} + 1` })
      .where(eq(teams.slug, slug));
  } catch {
    // A missed view is never worth failing the page render over.
  }
}

/**
 * Every pairing owned by a user, newest first.
 *
 * Deliberately a summary query, not a full hydrate — the account page shows a
 * list, and pulling every deck_cards row for every team to render card counts
 * would be a needless fan-out.
 */
export async function listTeamsByOwner(ownerId: string): Promise<
  {
    slug: string;
    name: string;
    format: FormatId;
    viewCount: number;
    updatedAt: Date;
    cardCount: number;
  }[]
> {
  const db = getDb();
  const rows = await db
    .select({
      slug: teams.slug,
      name: teams.name,
      format: teams.format,
      viewCount: teams.viewCount,
      updatedAt: teams.updatedAt,
      cardCount: sql<number>`
        coalesce((
          select sum(${deckCards.quantity})
          from ${deckCards}
          join ${decks} on ${decks.id} = ${deckCards.deckId}
          where ${decks.teamId} = ${teams.id}
        ), 0)::int
      `,
    })
    .from(teams)
    .where(eq(teams.ownerId, ownerId))
    .orderBy(desc(teams.updatedAt));

  return rows;
}

/**
 * Attach an anonymous pairing to a user account.
 *
 * The edit token is the proof of ownership — it's what the anonymous creator
 * has been holding since they first saved. Claiming is idempotent and refuses
 * to steal: a pairing that already has an owner is never reassigned.
 */
export async function claimTeam(
  slug: string,
  editToken: string,
  ownerId: string,
): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: teams.id, ownerId: teams.ownerId, editToken: teams.editToken })
    .from(teams)
    .where(eq(teams.slug, slug))
    .limit(1);

  if (!row || row.editToken !== editToken) return false;
  if (row.ownerId && row.ownerId !== ownerId) return false;
  if (row.ownerId === ownerId) return true;

  await db
    .update(teams)
    .set({ ownerId, updatedAt: new Date() })
    .where(eq(teams.id, row.id));

  return true;
}
