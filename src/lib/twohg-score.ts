/**
 * The 2HG Rating engine.
 *
 * Two-Headed Giant changes card valuations in ways no generic MTG database
 * models: a team shares one life total and a single turn, and every "each
 * opponent" clause resolves twice. This module turns those structural facts
 * into a transparent, explainable score.
 *
 * It is deliberately a *heuristic* over oracle text, not a statistical model —
 * once we're aggregating real decklists, observed play rates will replace and
 * calibrate these weights rather than sit alongside them.
 */

import { oracleText, type ScryfallCard } from "./scryfall";
import { FORMATS } from "./team";

/**
 * 2HG Commander is the default format everywhere on the site, so the prose we
 * publish quotes its life total. Derived, never retyped: `team.ts` is the single
 * source of truth, and these strings are user-visible on every card page — an
 * earlier version of this file said 30, which is the Constructed number.
 */
const SHARED_LIFE = FORMATS.commander.startingLife;

export type RuleImpact = "up" | "down";

export type Rule = {
  id: string;
  /** Short label shown on the card page. */
  label: string;
  /** Why this matters specifically in 2HG. */
  reason: string;
  impact: RuleImpact;
  /** Points added (up) or removed (down) from the 50-point baseline. */
  weight: number;
  /** Matched against lowercased oracle text + type line. */
  test: (ctx: MatchContext) => boolean;
};

type MatchContext = {
  card: ScryfallCard;
  /** Lowercased oracle text (both faces joined). */
  text: string;
  /** Lowercased type line. */
  type: string;
  keywords: string[];
  has: (...needles: string[]) => boolean;
};

const rule = (r: Rule) => r;

/**
 * Ordered roughly by how much they move the needle. Weights are tuned so a
 * card needs several corroborating signals to reach the top tier.
 */
export const RULES: Rule[] = [
  rule({
    id: "each-opponent",
    label: "Hits each opponent",
    reason:
      "There are two opponents in 2HG, so every 'each opponent' clause resolves twice against a single shared life total.",
    impact: "up",
    weight: 22,
    test: ({ has }) =>
      has("each opponent", "each of your opponents", "each other player"),
  }),
  rule({
    id: "opponent-sacrifice",
    label: "Team-wide edict",
    reason:
      "Forcing both opponents to sacrifice strips two boards for one card — the classic 2HG blowout.",
    impact: "up",
    weight: 12,
    test: ({ has }) =>
      has("each opponent sacrifices", "each player sacrifices") ||
      (has("sacrifices a creature") && has("each")),
  }),
  rule({
    id: "opponent-discard",
    label: "Symmetrical discard",
    reason:
      "'Each opponent discards' is a two-for-one in 2HG. Syphon Mind and friends jump several tiers here.",
    impact: "up",
    weight: 12,
    test: ({ has }) => has("each opponent discards", "each player discards"),
  }),
  rule({
    id: "extra-turn",
    label: "Extra turn",
    reason:
      "Teammates share one turn, so an extra turn is an extra turn for both players — double the value of the same card in a duel.",
    impact: "up",
    weight: 20,
    test: ({ has }) => has("take an extra turn", "extra turn after this one"),
  }),
  rule({
    id: "sweeper",
    label: "Board sweeper",
    reason:
      "A wrath answers two developed boards at once. Sweepers are premium removal in 2HG.",
    impact: "up",
    weight: 16,
    test: ({ has, type }) =>
      (has("destroy all", "exile all", "all creatures get -", "sacrifices all") &&
        !type.includes("land")) ||
      has("each creature deals damage to itself"),
  }),
  rule({
    id: "team-protection",
    label: "Protects a teammate",
    reason:
      "'Target player' and 'target permanent' effects can be aimed at your teammate — you can't do that in a duel.",
    impact: "up",
    weight: 8,
    test: ({ has }) =>
      has(
        "target player gains",
        "prevent all damage that would be dealt to target",
        "target player draws",
        "gains hexproof",
        "gain hexproof",
        "target permanent you control or",
      ),
  }),
  rule({
    id: "fog",
    label: "Combat fog / damage prevention",
    reason:
      "You're defending against two attacking players out of one shared life pool. Fog effects buy a full team turn.",
    impact: "up",
    weight: 10,
    test: ({ has }) =>
      has(
        "prevent all combat damage",
        "prevent all damage that would be dealt this turn",
        "creatures can't attack",
        "creatures don't untap",
      ),
  }),
  rule({
    id: "aoe-damage",
    label: "Damage to each opponent",
    reason:
      `Drain and burn that reads 'each opponent' comes off one shared ${SHARED_LIFE}-life total, so the printed number doubles.`,
    impact: "up",
    weight: 14,
    test: ({ has }) =>
      has(
        "each opponent loses",
        "deals damage to each opponent",
        "each opponent loses life",
      ),
  }),
  rule({
    id: "symmetric-tax",
    label: "Symmetrical lock piece",
    reason:
      "Stax and tax effects tax two opponents for the price of one, while your team plans around them together.",
    impact: "up",
    weight: 9,
    test: ({ has }) =>
      has(
        "players can't",
        "each player can't",
        "spells cost {",
        "players can't cast",
        "creatures can't block",
      ) && has("player", "players"),
  }),
  rule({
    id: "poison",
    label: "Poison / infect",
    reason:
      "A 2HG team loses at 15 poison counters rather than 10, so infect clocks are slower than the raw numbers suggest.",
    impact: "down",
    weight: 8,
    test: ({ has, keywords }) =>
      keywords.includes("infect") ||
      keywords.includes("toxic") ||
      has("poison counter"),
  }),
  rule({
    id: "opponent-trigger",
    label: "Triggers off opponents",
    reason:
      "'Whenever an opponent…' fires for two players instead of one, so these triggers pay out roughly twice as often.",
    impact: "up",
    weight: 11,
    test: ({ has }) =>
      has("whenever an opponent", "whenever a player", "whenever another player"),
  }),
  rule({
    id: "group-hug",
    label: "Symmetrical card advantage",
    reason:
      "Shared draw feeds two opponents and only one teammate. The math is against you in 2HG.",
    impact: "down",
    weight: 12,
    test: ({ has }) =>
      has(
        "each player draws",
        "each opponent draws",
        "target opponent draws",
        "each player's draw step",
        "draws an additional card",
      ),
  }),
  rule({
    id: "single-target-removal",
    label: "Single-target answer",
    reason:
      "Two opponents deploy two boards. Spot removal trades down unless it's cheap or hits multiple permanents.",
    impact: "down",
    weight: 6,
    test: ({ has, type, card }) =>
      type.includes("instant") || type.includes("sorcery")
        ? has("destroy target creature", "exile target creature") &&
          !has("destroy all", "each") &&
          card.cmc >= 3
        : false,
  }),
  rule({
    id: "lifegain",
    label: "Incremental lifegain",
    reason:
      `${SHARED_LIFE} shared life is a bigger pool than 20, so small lifegain is proportionally weaker — and it's the same pool your teammate is spending.`,
    impact: "down",
    weight: 5,
    test: ({ has }) =>
      has("you gain 1 life", "you gain 2 life", "gain 1 life", "gain 2 life") &&
      !has("each opponent loses"),
  }),
  rule({
    id: "one-on-one",
    label: "Duel-shaped card",
    reason:
      "Cards that reference 'the opponent' or single-combat framing lose reach when the table has two opponents.",
    impact: "down",
    weight: 6,
    test: ({ has }) =>
      has("target opponent") && !has("each opponent", "each player"),
  }),
  rule({
    id: "monarch",
    label: "Monarch / initiative",
    reason:
      "In 2HG the monarch is held by a team, so the crown swings between two players and is much harder to steal back.",
    impact: "down",
    weight: 4,
    test: ({ has }) => has("monarch", "the initiative"),
  }),
  rule({
    id: "team-anthem",
    label: "Team anthem",
    reason:
      "Anthems only pump creatures you control — your teammate's board is untouched, so they're worse than they look.",
    impact: "down",
    weight: 4,
    test: ({ has }) =>
      has("creatures you control get +") && !has("creatures your team"),
  }),
  rule({
    id: "cheap-interaction",
    label: "Cheap interaction",
    reason:
      "Turns are shared and fast in 2HG. One- and two-mana answers let you hold up interaction without losing tempo.",
    impact: "up",
    weight: 6,
    test: ({ card, has }) =>
      card.cmc <= 2 &&
      has("counter target", "destroy target", "exile target", "return target"),
  }),
];

export type MatchedRule = Omit<Rule, "test">;

export type Tier =
  | "Format staple"
  | "Strong in 2HG"
  | "Playable"
  | "Situational"
  | "Weak in 2HG";

export type TwoHgScore = {
  /** 0–100. 50 is "behaves the same as it does anywhere else". */
  score: number;
  tier: Tier;
  matched: MatchedRule[];
  /** One-line summary for cards, meta descriptions and list views. */
  summary: string;
};

const BASELINE = 50;

function tierFor(score: number): Tier {
  if (score >= 82) return "Format staple";
  if (score >= 66) return "Strong in 2HG";
  if (score >= 45) return "Playable";
  if (score >= 32) return "Situational";
  return "Weak in 2HG";
}

export function scoreCard(card: ScryfallCard): TwoHgScore {
  const text = oracleText(card).toLowerCase();
  const type = card.type_line.toLowerCase();
  const keywords = card.keywords.map((k) => k.toLowerCase());

  const ctx: MatchContext = {
    card,
    text,
    type,
    keywords,
    has: (...needles) => needles.some((n) => text.includes(n)),
  };

  const matched: MatchedRule[] = [];
  let score = BASELINE;

  for (const r of RULES) {
    if (!r.test(ctx)) continue;
    score += r.impact === "up" ? r.weight : -r.weight;
    matched.push({
      id: r.id,
      label: r.label,
      reason: r.reason,
      impact: r.impact,
      weight: r.weight,
    });
  }

  // Popular cards are popular for a reason; nudge (don't decide) with EDHREC
  // rank as a weak prior until we have our own play-rate data.
  if (card.edhrec_rank != null && card.edhrec_rank < 500) score += 3;

  score = Math.max(1, Math.min(100, Math.round(score)));

  const ups = matched.filter((m) => m.impact === "up");
  const downs = matched.filter((m) => m.impact === "down");

  let summary: string;
  if (matched.length === 0) {
    summary = "Plays about the same in 2HG as it does in any other format.";
  } else if (ups.length && !downs.length) {
    summary = `Gains value in 2HG: ${ups.map((u) => u.label.toLowerCase()).join(", ")}.`;
  } else if (downs.length && !ups.length) {
    summary = `Loses value in 2HG: ${downs.map((d) => d.label.toLowerCase()).join(", ")}.`;
  } else {
    summary = `Mixed in 2HG — ${ups[0].label.toLowerCase()}, but ${downs[0].label.toLowerCase()}.`;
  }

  return { score, tier: tierFor(score), matched, summary };
}

/**
 * Tier chips are solid and light-on-dark: they sit on top of card art, which is
 * arbitrary and often bright, so a translucent tint is unreadable there. The
 * hue carries the tier, the solid fill carries the legibility.
 */
export function tierColor(tier: Tier): string {
  switch (tier) {
    case "Format staple":
      return "bg-amber-200 text-amber-950 ring-amber-900/20";
    case "Strong in 2HG":
      return "bg-emerald-200 text-emerald-950 ring-emerald-900/20";
    case "Playable":
      return "bg-sky-200 text-sky-950 ring-sky-900/20";
    case "Situational":
      return "bg-zinc-200 text-zinc-900 ring-zinc-900/20";
    case "Weak in 2HG":
      return "bg-rose-200 text-rose-950 ring-rose-900/20";
  }
}
