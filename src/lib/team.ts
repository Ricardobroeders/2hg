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
   * Copies allowed across BOTH decks combined, or `null` when teammates build
   * independently and Unified Deck Construction does not apply.
   */
  maxCombinedCopies: number | null;
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
 * Note there is deliberately NO combined copy limit. WotC's event rules say
 * you may bring any legal Commander deck, so teammates may run the same card.
 * The singleton rule applies per deck, never across the team.
 */
export const FORMATS: Record<FormatId, FormatRules> = {
  commander: {
    id: "commander",
    label: "2HG Commander",
    startingLife: 60,
    poisonToLose: 15,
    commanderDamage: 21,
    maxCopiesPerDeck: 1,
    maxCombinedCopies: null,
    minDeckSize: 100,
    legalityKey: "commander",
    official: true,
    blurb:
      "Each player brings their own legal 100-card Commander deck. The team shares 60 life. Teammates may run the same cards — the singleton rule applies to each deck, not to the team.",
    notes: [
      "Each player's deck is an ordinary, individually legal Commander deck: 100 cards, singleton, colour identity enforced per deck.",
      "The team shares one 60-life total instead of the usual 40 per player.",
      "A player still loses to 21 combat damage from a single commander.",
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
    maxCombinedCopies: 4,
    minDeckSize: 60,
    legalityKey: "standard",
    official: true,
    blurb:
      "60-card decks and a shared 30 life. This is the variant with Unified Deck Construction: four copies of a card across both decks combined, not four each.",
    notes: [
      "Each deck is at least 60 cards; the team shares one 30-life total.",
      "Unified Deck Construction: the team's combined decks may not contain more than four of any individual card, by English name.",
      "Cards with the basic supertype, and cards whose text sets their own limit, are exempt.",
      "A card restricted in the format is limited to one copy per team.",
      "A team loses at 15 poison counters, not 10.",
    ],
  },
};

export const DEFAULT_FORMAT: FormatId = "commander";

/**
 * Variants we document but don't build decks for. Sealed is the most-played
 * 2HG by a wide margin, but the pool is opened at the event — there's nothing
 * to build at home, so it's reference material rather than a builder format.
 */
export const REFERENCE_VARIANTS = [
  {
    label: "2HG Sealed",
    blurb:
      "The prerelease format. A team opens a shared pool and builds two decks from it together, collaborating so the decks cover different roles.",
    notes: [
      "Each deck is at least 40 cards, built from one shared pool.",
      "From the Reality Fracture prerelease, a team receives one Prerelease Pack plus two Play Boosters.",
      "The team shares one 30-life total.",
      "Cards left over from the pool are shared — a card can only be in one deck at a time.",
    ],
  },
  {
    label: "2HG Draft",
    blurb:
      "Less common than sealed, but run at some stores. Teams draft and then build two decks from the combined pool.",
    notes: [
      "Each deck is at least 40 cards, built from the team's combined drafted pool.",
      "The team shares one 30-life total.",
    ],
  },
] as const;

/** Rules that are true in every 2HG variant. */
export const SHARED_RULES = [
  {
    title: "One life total",
    body: "Teammates share a single life total. Damage to either player comes off the same pool, and lifegain feeds it back. A team loses when that total hits 0.",
  },
  {
    title: "One turn",
    body: "Teammates take their turns simultaneously as a team turn: one untap, one upkeep, one draw step each, one combat phase. Either player may cast spells whenever the team has priority.",
  },
  {
    title: "The starting team doesn't draw",
    body: "The team that goes first skips their first draw step — both players skip it, not just one.",
  },
  {
    title: "Two opponents, one target",
    body: "'Each opponent' resolves against both members of the opposing team, but their life is one pool — so the printed number effectively doubles. This is the single biggest reason card values shift in 2HG.",
  },
  {
    title: "Range of influence is the team",
    body: "You may target your teammate's permanents and your teammate themselves. Protection, untapping, and 'target player draws' effects can all be pointed at your partner.",
  },
  {
    title: "Poison is 15",
    body: "A team loses at 15 poison counters rather than the usual 10, so infect and toxic clocks are slower than their raw numbers suggest.",
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

    // Only Constructed pools copies across the team. In Commander each deck is
    // built independently, so a shared card is fine.
    if (rules.maxCombinedCopies != null) {
      const teamLimit = copyLimitFor(card, rules.maxCombinedCopies);
      if (total > teamLimit) {
        violations.push({
          kind: "combined-copies",
          cardName: name,
          message: `${total} copies of ${name} across the team (Deck A: ${row.a}, Deck B: ${row.b}). Unified Deck Construction allows ${teamLimit}.`,
          decks,
        });
      }
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
