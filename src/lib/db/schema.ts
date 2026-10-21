/**
 * Database schema.
 *
 * Two things drive this design:
 *
 * 1. **Anonymous first.** A 2HG team is two people, so the share link is the
 *    product's distribution. `owner_id` is nullable and `edit_token` lets an
 *    anonymous creator keep editing — accounts become an upgrade ("claim this
 *    pairing") rather than a wall in front of the only viral mechanism.
 *
 * 2. **Card rows, not JSON blobs.** The long-term asset is co-occurrence —
 *    "card X appears in N% of teams whose partner deck runs Y". That's an
 *    aggregation over `deck_cards`, so it stays relational and indexed even
 *    though a decklist reads like a document.
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const formatEnum = pgEnum("format", ["commander", "constructed"]);
export const deckSlotEnum = pgEnum("deck_slot", ["a", "b"]);

/**
 * A saved entry is either a pairing (two decks, the product's core entity) or
 * a solo deck (one deck, slot "a").
 *
 * Solo decks are not a lesser case — they're the input to the thing we
 * eventually want to be known for: "find me a partner for this deck". A deck
 * has to be savable on its own before it can be matched against anything.
 */
export const entryKindEnum = pgEnum("entry_kind", ["pairing", "solo"]);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** The share URL: /t/{slug}. Short, unguessable, never reused. */
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    format: formatEnum("format").notNull().default("commander"),
    /**
     * Existing rows are all pairings, so the default keeps this migration
     * non-breaking. A "solo" row has exactly one deck, in slot "a".
     */
    kind: entryKindEnum("kind").notNull().default("pairing"),
    /**
     * Null while the pairing is anonymous. Holds a Neon Managed Better Auth
     * user id — `neon_auth."user".id`, which is a **uuid** while this column
     * is text, so joining across needs `owner_id::uuid`. Kept as text (and not
     * a foreign key) because the auth schema is managed by Neon rather than by
     * our migrations: a cross-schema constraint would couple our migration
     * order to theirs, and the session hands us the id as a string anyway.
     */
    ownerId: text("owner_id"),
    /**
     * Secret held by whoever created the pairing, letting them edit it back
     * without an account. Never sent to anyone who only opens the share link.
     */
    editToken: text("edit_token").notNull(),
    isPublic: boolean("is_public").notNull().default(true),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("teams_slug_idx").on(t.slug),
    index("teams_owner_idx").on(t.ownerId),
  ],
);

export const decks = pgTable(
  "decks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    slot: deckSlotEnum("slot").notNull(),
    name: text("name").notNull(),
    /** Canonical Scryfall names. Also present in deck_cards. */
    commanders: text("commanders")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
  },
  // A team has exactly one deck per slot.
  (t) => [uniqueIndex("decks_team_slot_idx").on(t.teamId, t.slot)],
);

export const deckCards = pgTable(
  "deck_cards",
  {
    deckId: uuid("deck_id")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    /** Canonical Scryfall name — the join key across the whole app. */
    cardName: text("card_name").notNull(),
    quantity: integer("quantity").notNull().default(1),
  },
  (t) => [
    primaryKey({ columns: [t.deckId, t.cardName] }),
    // The index that makes "which teams run this card" cheap. This is the one
    // that matters once we compute synergy from real pairings.
    index("deck_cards_card_name_idx").on(t.cardName),
  ],
);

export type TeamRow = typeof teams.$inferSelect;
export type DeckRow = typeof decks.$inferSelect;
export type DeckCardRow = typeof deckCards.$inferSelect;

/**
 * Every playable card, loaded from Scryfall's daily bulk file by
 * `scripts/import-cards.ts`.
 *
 * This table is why no page render calls Scryfall any more. Rendering a card
 * used to mean a live API call from Vercel's shared egress address, and a
 * crawler walking card pages turned that into Scryfall 429s, 30–90s hangs and
 * a Vercel bill for functions held open waiting. Scryfall's own guidance is to
 * use bulk data for exactly this.
 *
 * Columns mirror `CardDetail` in `src/lib/card-record.ts` one-for-one, so a row
 * converts to a `ScryfallCard` with the same function the committed artifact
 * uses. ~33,000 rows, tens of MB — comfortably inside the free tier's 1 GB.
 * No prices: see `CardDetail`.
 */
export const cards = pgTable(
  "cards",
  {
    oracleId: text("oracle_id").primaryKey(),
    /**
     * Unique, unlike names: the importer settles the ~45 slugs two cards share
     * (Un-set variants, mostly) before writing. See `prefersForSlug`.
     */
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    /** `normalizeName(name)` — how pasted and stored decklist names match. */
    lookupKey: text("lookup_key").notNull(),
    id: text("id").notNull(),
    cost: text("cost").notNull(),
    cmc: real("cmc").notNull(),
    type: text("type").notNull(),
    oracle: text("oracle").notNull(),
    colorIdentity: text("color_identity").array().notNull(),
    keywords: text("keywords").array().notNull(),
    setCode: text("set_code").notNull(),
    setName: text("set_name").notNull(),
    rarity: text("rarity").notNull(),
    collectorNumber: text("collector_number").notNull(),
    releasedAt: text("released_at").notNull(),
    layout: text("layout").notNull(),
    uri: text("uri").notNull(),
    image: text("image"),
    rank: integer("rank"),
    legal: text("legal").notNull(),
    /** Denormalised from `legal` so the shelf and synergy queries can filter on it. */
    commanderLegal: boolean("commander_legal").notNull(),
    /**
     * Hash of everything a card page renders — so not `rank`, which moves
     * daily for thousands of cards. The importer compares it to decide which
     * pages to refresh; a rank-only change updates the row and nothing else.
     */
    contentHash: text("content_hash").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("cards_slug_idx").on(t.slug),
    index("cards_name_idx").on(t.name),
    index("cards_lookup_key_idx").on(t.lookupKey),
    // Typo-tolerant slug lookups for URLs that aren't canonical. Needs
    // pg_trgm, created by the migration before this index.
    index("cards_slug_trgm_idx").using("gin", sql`${t.slug} gin_trgm_ops`),
  ],
);

export type CardRow = typeof cards.$inferSelect;
