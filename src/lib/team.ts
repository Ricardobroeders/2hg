/**
 * The Team Pairing — our core entity.
 *
 * A pairing is two decks validated as one unit. Deck A and Deck B are legal
 * individually *and* against each other: the 2HG unified deck rule caps the
 * combined copies of any card across both lists.
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
};

export type TeamPairing = {
  id: string;
  name: string;
  format: FormatId;
  a: Deck;
  b: Deck;
};

export type FormatId = "constructed" | "commander";

export type FormatRules = {
  id: FormatId;
  label: string;
  /** Max combined copies of one card across BOTH decks. */
  maxCombinedCopies: number;
  /** Minimum size of each individual deck. */
  minDeckSize: number;
  /** Scryfall legality key to check each card against. */
  legalityKey: string;
  /** Human name of that card pool, used in violation messages. */
  poolLabel: string;
  blurb: string;
};

export const FORMATS: Record<FormatId, FormatRules> = {
  constructed: {
    id: "constructed",
    label: "2HG Constructed",
    maxCombinedCopies: 4,
    minDeckSize: 60,
    // Sanctioned 2HG constructed events inherit whichever pool the event
    // announces; Legacy is the broadest default that still enforces real ban
    // lists. This should become a user-facing pool selector.
    legalityKey: "legacy",
    poolLabel: "Legacy",
    blurb:
      "60-card decks, Legacy card pool. A team may not run more than four copies of a card across both decks combined.",
  },
  commander: {
    id: "commander",
    label: "2HG Commander",
    maxCombinedCopies: 1,
    minDeckSize: 100,
    legalityKey: "commander",
    poolLabel: "Commander",
    blurb:
      "100-card singleton decks. The singleton rule applies to the team, so the two decks may not share any non-basic card.",
  },
};

/** Cards that ignore the copy limit entirely. */
export function copyLimitFor(card: ScryfallCard, rules: FormatRules): number {
  const type = card.type_line.toLowerCase();
  if (type.includes("basic") && type.includes("land")) return Infinity;

  const text = (card.oracle_text ?? "").toLowerCase();
  if (text.includes("a deck can have any number of cards named")) return Infinity;

  // Seven Dwarves and friends name their own bespoke limit.
  const bespoke = text.match(/up to (seven|nine) cards named/);
  if (bespoke) return bespoke[1] === "seven" ? 7 : 9;

  return rules.maxCombinedCopies;
}

export type Violation = {
  kind: "combined-copies" | "banned" | "out-of-pool" | "deck-size";
  cardName?: string;
  message: string;
  /** Which decks are implicated. */
  decks: DeckSlot[];
};

export type ValidationResult = {
  violations: Violation[];
  /** Cards appearing in both lists — the headline number for the UI. */
  sharedCards: { name: string; a: number; b: number; total: number }[];
  counts: { a: number; b: number; combined: number };
  legal: boolean;
};

function totalCards(deck: Deck): number {
  return deck.entries.reduce((n, e) => n + e.quantity, 0);
}

/**
 * Validate both decks simultaneously. `cards` is a lookup of canonical name →
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
    if (row.a > 0 && row.b > 0) {
      sharedCards.push({ name, a: row.a, b: row.b, total });
    }

    const card = cards.get(name);
    if (!card) continue;

    const limit = copyLimitFor(card, rules);
    if (total > limit) {
      violations.push({
        kind: "combined-copies",
        cardName: name,
        message:
          limit === rules.maxCombinedCopies
            ? `${total} copies of ${name} across the team (Deck A: ${row.a}, Deck B: ${row.b}). The unified deck rule allows ${limit}.`
            : `${total} copies of ${name} across the team exceeds this card's limit of ${limit}.`,
        decks: [row.a > 0 && "a", row.b > 0 && "b"].filter(Boolean) as DeckSlot[],
      });
    }

    // A card is illegal either because it's banned outright, or because it
    // simply isn't in this format's card pool — both are hard stops at a
    // sanctioned event, so we surface them the same way.
    const legality = card.legalities[rules.legalityKey];
    const decks = [row.a > 0 && "a", row.b > 0 && "b"].filter(
      Boolean,
    ) as DeckSlot[];

    if (legality === "banned") {
      violations.push({
        kind: "banned",
        cardName: name,
        message: `${name} is banned in ${rules.label}.`,
        decks,
      });
    } else if (legality !== "legal" && legality !== "restricted") {
      violations.push({
        kind: "out-of-pool",
        cardName: name,
        message: `${name} isn't in the ${rules.poolLabel} card pool used by ${rules.label}.`,
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

  // Shared cards are shown biggest-conflict-first.
  sharedCards.sort((x, y) => y.total - x.total);

  return { violations, sharedCards, counts, legal: violations.length === 0 };
}

export function emptyTeam(): TeamPairing {
  return {
    id: "local",
    name: "Untitled team",
    format: "constructed",
    a: { name: "Deck A", entries: [] },
    b: { name: "Deck B", entries: [] },
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
