/**
 * The Team Pairing — our core entity, and the format rules it's validated against.
 *
 * This module is the single source of truth for how each 2HG variant works.
 * `/rules` renders from these objects, so correcting a rule here corrects it
 * on the site. Never hard-code a life total or a copy limit in a component.
 */

import type { ScryfallCard } from "./scryfall";

export type DeckSlot = "a" | "b";

export type DeckEntry = {
  /** Canonical Scryfall name — our join key everywhere. */
  name: string;
  quantity: number;
};

export type Deck = {
  name: string;
  entries: DeckEntry[];
  /**
   * Commanders, by canonical name. Also present in `entries` — this only
   * records which of them lead the deck.
   */
  commanders: string[];
};

export type TeamPairing = {
  id: string;
  name: string;
  format: FormatId;
  a: Deck;
  b: Deck;
};

export type FormatId = "commander" | "constructed";

export type FormatRules = {
  id: FormatId;
  label: string;
  /** Life the team shares at the start of the game. */
  startingLife: number;
  /** Poison counters that lose the team the game. */
  poisonToLose: number;
  /** Combat damage from one commander that loses the game, where applicable. */
  commanderDamage: number | null;
  /** Copies of a single card allowed within one player's deck. */
  maxCopiesPerDeck: number;
  /**
   * Unified Deck Construction (MTR 8.4): apart from basic lands, a card may
   * appear in only one deck on the team. `false` when teammates build
   * independently and may both run the same card.
   */
  unifiedDeck: boolean;
  /** Minimum size of each individual deck. */
  minDeckSize: number;
  /** Scryfall legality key to check each card against. */
  legalityKey: string;
  /** Sanctioned by Wizards as an organised-play format. */
  official: boolean;
  blurb: string;
  /** Rule details rendered on /rules. */
  notes: string[];
};

/**
 * 2HG Commander is our primary format: it's an official WotC Commander Play
 * Event running monthly at WPN stores, and it's the only 2HG variant where
 * people build decks at home.
 *
 * Note there is deliberately NO unified deck rule. WotC's event rules say you
 * may bring any legal Commander deck, so teammates may run the same card. The
 * singleton rule applies per deck, never across the team.
 */
export const FORMATS: Record<FormatId, FormatRules> = {
  commander: {
    id: "commander",
    label: "2HG Commander",
    startingLife: 60,
    poisonToLose: 15,
    commanderDamage: 21,
    maxCopiesPerDeck: 1,
    unifiedDeck: false,
    minDeckSize: 100,
    legalityKey: "commander",
    official: true,
    blurb:
      "Each player brings their own legal 100-card Commander deck. The team shares 60 life. Teammates may run the same cards — the singleton rule applies to each deck, not to the team.",
    notes: [
      "Each player's deck is an ordinary, individually legal Commander deck: 100 cards, singleton, color identity enforced per deck.",
      "The team shares one 60-life total instead of the usual 40 per player.",
      // Wizards' 2HG format page words this per team ("A team loses when they
      // take 21 or more damage from a single commander"); CR 903.10a counts it
      // per player and the CR has no 2HG Commander rule. We publish Wizards'
      // event wording and say the CR doesn't settle it — see /rules/commander.
      "Wizards' 2HG page: a team loses when it takes 21 or more damage from a single commander.",
      "A team loses at 15 poison counters, not 10.",
      "There is no unified deck rule. Both teammates may play the same card.",
    ],
  },
  constructed: {
    id: "constructed",
    label: "2HG Constructed",
    startingLife: 30,
    poisonToLose: 15,
    commanderDamage: null,
    maxCopiesPerDeck: 4,
    unifiedDeck: true,
    minDeckSize: 60,
    legalityKey: "standard",
    official: true,
    /**
     * Corrected 2026-10-21. This used to say "four copies across both decks
     * combined", which is the rule before the MTR moved 2HG Constructed onto
     * Unified Deck Construction. MTR 9.5 → 8.4 (Feb 2026), and the judges'
     * annotation to 8.4 flags the change from the old "four of" rule.
     */
    blurb:
      "60-card decks and a shared 30 life. This is the variant with Unified Deck Construction: apart from basic lands, a card can appear in only one teammate's deck.",
    notes: [
      "Each deck is at least 60 cards; the team shares one 30-life total.",
      "Unified Deck Construction: no two decks on a team may contain the same card, by English name. Basic lands are exempt.",
      "A card that overrides the copy limit, like Relentless Rats, may do so in only one deck on the team.",
      "No sideboards, and Erayo, Soratami Ascendant is banned in every 2HG Constructed format.",
      "A team loses at 15 poison counters, not 10.",
    ],
  },
};

export const DEFAULT_FORMAT: FormatId = "commander";

/**
 * The Limited variants: documented on `/rules/sealed` and `/rules/draft`, but
 * not builder formats — the pool is opened at the event, so there is nothing
 * to build at home.
 *
 * Every number is sourced, because these pages exist to be more correct than
 * the sites that rank today:
 * - life 30 and poison 15: CR 103.4a, 810.4, 810.8d
 * - 40-card minimum: MTR 7.1 (and CR 100.2b)
 * - boosters per team: MTR 9.6 recommends 8 for Sealed and 6 for Draft
 * - build time: MTR Appendix B
 * - two picks per pack: MTR 9.7
 */
export type LimitedFormatId = "sealed" | "draft";

export type LimitedRules = {
  id: LimitedFormatId;
  label: string;
  startingLife: number;
  poisonToLose: number;
  /** Minimum size of each of the team's two decks. */
  minDeckSize: number;
  /** Boosters per team the MTR recommends. Stores may hand out more. */
  boostersPerTeam: number;
  /** Deck construction time the MTR recommends, in minutes. */
  buildMinutes: number;
};

export const LIMITED_FORMATS: Record<LimitedFormatId, LimitedRules> = {
  sealed: {
    id: "sealed",
    label: "2HG Sealed",
    startingLife: 30,
    poisonToLose: 15,
    minDeckSize: 40,
    boostersPerTeam: 8,
    buildMinutes: 60,
  },
  draft: {
    id: "draft",
    label: "2HG Draft",
    startingLife: 30,
    poisonToLose: 15,
    minDeckSize: 40,
    boostersPerTeam: 6,
    // MTR Appendix B gives Draft 40 minutes for construction and registration together.
    buildMinutes: 40,
  },
};

/** Cards a team takes from each pack in a 2HG draft, together (MTR 9.7). */
export const DRAFT_PICKS_PER_PACK = 2;

/**
 * Rules that are true in every 2HG variant, each with the Comprehensive Rules
 * number behind it. Rewritten 2026-10-21 against the CR effective 2026-09-25.
 */
export const SHARED_RULES = [
  {
    title: "One life total",
    body: "Teammates share a single life total. Damage, life loss and lifegain happen to each player and land on the team's total, and the team loses when it hits 0.",
    ref: "CR 810.9, 810.8c",
  },
  {
    title: "One turn",
    body: "The team takes its turn together. Each player draws in the team's draw step and may play a land, and either teammate can act whenever the team has priority.",
    ref: "CR 805.4, 805.5",
  },
  {
    title: "The starting team doesn't draw",
    body: "The team that goes first skips the draw step of its first turn — both players skip it, not just one.",
    ref: "CR 810.6",
  },
  {
    title: "Two opponents, one total",
    body: "'Each opponent' resolves against both players on the other team, and both results come off one shared life total. A drain of two takes four.",
    ref: "CR 810.9, 102.3",
  },
  {
    title: "Attacks pick a player",
    body: "Each attacking creature attacks one specific opponent, planeswalker or battle. The defending team blocks as one, with creatures from either player.",
    ref: "CR 805.10",
  },
  {
    title: "One player loses, the team loses",
    body: "If either player loses — drawing from an empty library, say — the whole team loses. A concession takes the team out too.",
    ref: "CR 810.8a, 810.8b",
  },
  {
    title: "Your teammate is a legal target",
    body: "Spells and abilities can target your teammate and their permanents. Hands can be shown and plans discussed at any time, but you can't handle each other's cards.",
    ref: "CR 810.5",
  },
  {
    title: "Poison is 15",
    body: "Poison counters are shared by the team, and a team loses at 15 rather than the usual 10, so infect and toxic clocks are slower than their raw numbers suggest.",
    ref: "CR 810.10, 810.8d",
  },
] as const;

/**
 * How many copies of this card a single deck may contain, honouring cards that
 * override the format limit.
 */
export function copyLimitFor(card: ScryfallCard, baseLimit: number): number {
  const type = card.type_line.toLowerCase();
  if (type.includes("basic") && type.includes("land")) return Infinity;

  const text = (card.oracle_text ?? "").toLowerCase();
  if (text.includes("a deck can have any number of cards named")) return Infinity;

  // Seven Dwarves and friends name their own bespoke limit.
  const bespoke = text.match(/up to (seven|nine) cards named/);
  if (bespoke) return bespoke[1] === "seven" ? 7 : 9;

  return baseLimit;
}

export type Violation = {
  kind: "combined-copies" | "deck-copies" | "banned" | "deck-size";
  cardName?: string;
  message: string;
  /** Which decks are implicated. */
  decks: DeckSlot[];
};

export type ValidationResult = {
  violations: Violation[];
  /**
   * Cards appearing in both lists. A rules problem under Unified Deck
   * Construction; in Commander it's just overlap worth knowing about, since
   * duplicated effects are wasted team slots.
   */
  sharedCards: { name: string; a: number; b: number; total: number }[];
  counts: { a: number; b: number; combined: number };
  legal: boolean;
};

function totalCards(deck: Deck): number {
  return deck.entries.reduce((n, e) => n + e.quantity, 0);
}

/**
 * Validate both decks together. `cards` is a lookup of canonical name →
 * Scryfall card; entries with no match are skipped rather than failed, so the
 * builder stays usable while card data is still loading.
 */
export function validateTeam(
  team: TeamPairing,
  cards: Map<string, ScryfallCard>,
): ValidationResult {
  const rules = FORMATS[team.format];
  const violations: Violation[] = [];

  const combined = new Map<string, { a: number; b: number }>();
  for (const [slot, deck] of [["a", team.a], ["b", team.b]] as const) {
    for (const entry of deck.entries) {
      const row = combined.get(entry.name) ?? { a: 0, b: 0 };
      row[slot] += entry.quantity;
      combined.set(entry.name, row);
    }
  }

  const sharedCards: ValidationResult["sharedCards"] = [];

  for (const [name, row] of combined) {
    const total = row.a + row.b;
    const decks = [row.a > 0 && "a", row.b > 0 && "b"].filter(
      Boolean,
    ) as DeckSlot[];

    if (row.a > 0 && row.b > 0) {
      sharedCards.push({ name, a: row.a, b: row.b, total });
    }

    const card = cards.get(name);
    if (!card) continue;

    const perDeck = copyLimitFor(card, rules.maxCopiesPerDeck);
    for (const [slot, count] of [["a", row.a], ["b", row.b]] as const) {
      if (count > perDeck) {
        violations.push({
          kind: "deck-copies",
          cardName: name,
          message: `Deck ${slot.toUpperCase()} runs ${count} copies of ${name}; ${rules.label} allows ${perDeck} per deck.`,
          decks: [slot],
        });
      }
    }

    // Only Constructed unifies the team's decks. In Commander each deck is
    // built independently, so a shared card is fine. Under Unified Deck
    // Construction only the basic supertype is exempt — a Relentless Rats
    // overrides the copy limit for one deck on the team, never both.
    const basic = card.type_line.toLowerCase().includes("basic");
    if (rules.unifiedDeck && row.a > 0 && row.b > 0 && !basic) {
      violations.push({
        kind: "combined-copies",
        cardName: name,
        message: `${name} is in both decks (Deck A: ${row.a}, Deck B: ${row.b}). Unified Deck Construction lets only one deck on a team use a card.`,
        decks,
      });
    }

    const legality = card.legalities[rules.legalityKey];
    if (legality === "banned") {
      violations.push({
        kind: "banned",
        cardName: name,
        message: `${name} is banned in ${rules.label}.`,
        decks,
      });
    }
  }

  const counts = {
    a: totalCards(team.a),
    b: totalCards(team.b),
    combined: totalCards(team.a) + totalCards(team.b),
  };

  for (const [slot, count] of [["a", counts.a], ["b", counts.b]] as const) {
    if (count > 0 && count < rules.minDeckSize) {
      violations.push({
        kind: "deck-size",
        message: `Deck ${slot.toUpperCase()} has ${count} cards; ${rules.label} requires at least ${rules.minDeckSize}.`,
        decks: [slot],
      });
    }
  }

  // Biggest overlap first.
  sharedCards.sort((x, y) => y.total - x.total);

  return { violations, sharedCards, counts, legal: violations.length === 0 };
}

export function emptyDeck(name: string): Deck {
  return { name, entries: [], commanders: [] };
}

export function emptyTeam(): TeamPairing {
  return {
    id: "local",
    name: "Untitled team",
    format: DEFAULT_FORMAT,
    a: emptyDeck("Deck A"),
    b: emptyDeck("Deck B"),
  };
}

/** Flatten both decks into the "4 Card Name" lines a cart importer expects. */
export function teamAsDecklist(team: TeamPairing): string {
  const combined = new Map<string, number>();
  for (const deck of [team.a, team.b]) {
    for (const e of deck.entries) {
      combined.set(e.name, (combined.get(e.name) ?? 0) + e.quantity);
    }
  }
  return [...combined.entries()]
    .sort((x, y) => x[0].localeCompare(y[0]))
    .map(([name, qty]) => `${qty} ${name}`)
    .join("\n");
}
