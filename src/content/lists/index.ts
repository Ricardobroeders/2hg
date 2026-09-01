import type { ListContent } from "./types";
import eachOpponent from "./each-opponent";
import sweeper from "./sweeper";
import extraTurn from "./extra-turn";
import aoeDamage from "./aoe-damage";
import opponentSacrifice from "./opponent-sacrifice";
import opponentDiscard from "./opponent-discard";
import teamProtection from "./team-protection";
import fog from "./fog";
import symmetricTax from "./symmetric-tax";
import opponentTrigger from "./opponent-trigger";
import cheapInteraction from "./cheap-interaction";
import groupHug from "./group-hug";
import poison from "./poison";
import lifegain from "./lifegain";
import singleTargetRemoval from "./single-target-removal";
import oneOnOne from "./one-on-one";
import monarch from "./monarch";
import teamAnthem from "./team-anthem";

/**
 * Every rule id that has authored content. A rule missing from here still gets
 * a working page — `hubFor` generates copy from the rule itself — so adding a
 * 19th rule adds a hub instead of a 404.
 *
 * Not keyed on a `RuleId` union: `RULES` in `twohg-score.ts` is a `Rule[]`
 * with `id: string`, and narrowing it would mean editing that file, which
 * triggers the "rerun the corpus in the same change" rule for no benefit here.
 */
export const LIST_CONTENT: Record<string, ListContent> = {
  "each-opponent": eachOpponent,
  sweeper: sweeper,
  "extra-turn": extraTurn,
  "aoe-damage": aoeDamage,
  "opponent-sacrifice": opponentSacrifice,
  "opponent-discard": opponentDiscard,
  "team-protection": teamProtection,
  fog: fog,
  "symmetric-tax": symmetricTax,
  "opponent-trigger": opponentTrigger,
  "cheap-interaction": cheapInteraction,
  "group-hug": groupHug,
  poison: poison,
  lifegain: lifegain,
  "single-target-removal": singleTargetRemoval,
  "one-on-one": oneOnOne,
  monarch: monarch,
  "team-anthem": teamAnthem,
};
