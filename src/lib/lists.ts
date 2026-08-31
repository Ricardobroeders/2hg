/**
 * Rule hub pages — `/lists/[rule]`.
 *
 * One page per 2HG rule, listing the cards that trip it. These exist for two
 * reasons at once. They target queries nobody currently answers ("best sweepers
 * two headed giant", "2HG extra turn cards"), and they are the internal link
 * graph: `/cards` shows nothing without a query, so before these pages roughly
 * 5,600 card pages had no crawlable path in at all.
 *
 * The editorial copy lives here rather than in `twohg-score.ts` — that file is
 * the scoring engine and its `reason` strings are written to explain a score,
 * not to rank. Anything without an entry in `COPY` still gets a working page
 * built from `rule.label` and `rule.reason`, so adding a 19th rule adds a hub
 * instead of a 404.
 */

import { RULES, type Rule } from "./twohg-score";
import { cardsForRule } from "./corpus";

export type ListHub = {
  /** The rule id, already URL-safe: "each-opponent", "cheap-interaction". */
  id: string;
  rule: Rule;
  /** <title>. Shaped like a query, not like a label. */
  title: string;
  /** <h1>. */
  heading: string;
  /** Meta description, and the opening line of the page. */
  description: string;
  cardCount: number;
  /** Enough cards to be worth its own page. */
  indexable: boolean;
};

type Copy = { title: string; heading: string; description: string };

const COPY: Record<string, Copy> = {
  "each-opponent": {
    title: "Best “each opponent” cards in Two-Headed Giant",
    heading: "Cards that hit each opponent",
    description:
      "Every “each opponent” clause resolves twice in 2HG, and both halves come off one shared life total. These are the cards that quietly double in power.",
  },
  sweeper: {
    title: "Best board sweepers in Two-Headed Giant",
    heading: "Board sweepers for 2HG",
    description:
      "You are answering two developed battlefields at once. Wraths are premium removal in Two-Headed Giant rather than a last resort.",
  },
  "extra-turn": {
    title: "Best extra turn cards in Two-Headed Giant",
    heading: "Extra turns are worth double in 2HG",
    description:
      "Teammates take one turn together, so an extra turn is an extra turn for both players. Few effects gain more from the format than these.",
  },
  "aoe-damage": {
    title: "Best drain and burn cards for Two-Headed Giant",
    heading: "Damage that hits the whole enemy team",
    description:
      "Drain and burn that reads “each opponent” lands twice on a single shared life pool, so the printed number is effectively doubled.",
  },
  "opponent-sacrifice": {
    title: "Best edict effects in Two-Headed Giant",
    heading: "Team-wide edicts",
    description:
      "Forcing both opponents to sacrifice strips two boards for one card. This is the classic 2HG blowout.",
  },
  "opponent-discard": {
    title: "Best discard effects in Two-Headed Giant",
    heading: "Symmetrical discard",
    description:
      "“Each opponent discards” is a two-for-one in 2HG. Syphon Mind and its relatives jump several tiers here.",
  },
  "team-protection": {
    title: "Best cards to protect your teammate in Two-Headed Giant",
    heading: "Cards that protect a teammate",
    description:
      "“Target player” and “target permanent” effects can be aimed at your partner — something no duel format lets you do.",
  },
  fog: {
    title: "Best fog effects in Two-Headed Giant",
    heading: "Fogs and damage prevention",
    description:
      "You defend against two attacking players out of one shared pool, so a single fog can buy your team a whole turn.",
  },
  "symmetric-tax": {
    title: "Best stax and tax pieces in Two-Headed Giant",
    heading: "Symmetrical lock pieces",
    description:
      "Stax effects tax two opponents for the price of one — provided your own teammate can play through them.",
  },
  "opponent-trigger": {
    title: "Cards that trigger off opponents in Two-Headed Giant",
    heading: "Triggers that fire twice as often",
    description:
      "“Whenever an opponent…” watches two players instead of one, so these triggers pay out roughly twice as often as they do in a duel.",
  },
  "cheap-interaction": {
    title: "Best cheap interaction for Two-Headed Giant",
    heading: "One- and two-mana answers",
    description:
      "Turns are shared and fast in 2HG. Cheap answers let you hold up interaction without giving up your own development.",
  },
  "group-hug": {
    title: "Cards that get worse in Two-Headed Giant: symmetrical draw",
    heading: "Symmetrical card advantage falls flat",
    description:
      "Shared draw feeds two opponents and only one teammate. These cards read well and play badly in Two-Headed Giant.",
  },
  poison: {
    title: "Infect and poison in Two-Headed Giant",
    heading: "Poison clocks are slower than they look",
    description:
      "A 2HG team loses at 15 poison counters rather than 10, so infect and toxic need half again as much work to close a game.",
  },
  lifegain: {
    title: "Why incremental lifegain is weak in Two-Headed Giant",
    heading: "Small lifegain against a large shared pool",
    description:
      "A bigger shared pool makes small lifegain proportionally weaker — and it is the same pool your teammate is already spending.",
  },
  "single-target-removal": {
    title: "Spot removal in Two-Headed Giant",
    heading: "Single-target answers trade down",
    description:
      "Two opponents deploy two boards. Expensive spot removal trades down unless it is cheap or hits more than one permanent.",
  },
  "one-on-one": {
    title: "Duel-shaped cards that weaken in Two-Headed Giant",
    heading: "Cards written for one opponent",
    description:
      "Effects that name “target opponent” only ever reach half the enemy team, so they lose reach in a format with two.",
  },
  monarch: {
    title: "The monarch and the initiative in Two-Headed Giant",
    heading: "The crown is held by a team",
    description:
      "In 2HG the monarch belongs to a team, so the crown swings between two players and is much harder to take back.",
  },
  "team-anthem": {
    title: "Anthems in Two-Headed Giant",
    heading: "Anthems only pump half your side",
    description:
      "“Creatures you control” stops at your own board. Your teammate's creatures are untouched, so anthems are worse than they look.",
  },
};

/** Below this a page is a list too short to justify its own URL. */
const MIN_CARDS = 10;

function hubFor(rule: Rule): ListHub {
  const cardCount = cardsForRule(rule.id).length;
  const copy: Copy = COPY[rule.id] ?? {
    title: `Best ${rule.label.toLowerCase()} cards in Two-Headed Giant`,
    heading: rule.label,
    // `reason` is already a written, 2HG-specific sentence — the best raw
    // material available, and it keeps the single-sourcing /rules relies on.
    description: rule.reason,
  };

  return { id: rule.id, rule, ...copy, cardCount, indexable: cardCount >= MIN_CARDS };
}

let cached: ListHub[] | null = null;

export function listHubs(): ListHub[] {
  cached ??= RULES.map(hubFor);
  return cached;
}

export function indexableHubs(): ListHub[] {
  return listHubs().filter((hub) => hub.indexable);
}

export function hubById(id: string): ListHub | undefined {
  return listHubs().find((hub) => hub.id === id);
}
