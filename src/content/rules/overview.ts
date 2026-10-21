import { FORMATS, LIMITED_FORMATS } from "@/lib/team";
import type { RulesFaq } from "./types";

/**
 * Copy for `/rules`, the overview. It carries what every 2HG variant shares;
 * each format page carries only what its variant adds, and links back here.
 */
const STANDARD_LIFE = LIMITED_FORMATS.sealed.startingLife;
const COMMANDER_LIFE = FORMATS.commander.startingLife;
const POISON = FORMATS.commander.poisonToLose;

export const OVERVIEW = {
  title: "2HG rules for Commander, Sealed and Draft",
  description: `How Two-Headed Giant works: shared life and turns, ${STANDARD_LIFE} life in Sealed and Draft, ${COMMANDER_LIFE} in 2HG Commander, ${POISON} poison. Rules for every format.`,
  intro: [
    "Two teams of two. Each team shares one life total and takes one turn together. That's the whole format — and it's enough to change what half the cards in Magic are worth.",
    `The core rules are the same in every variant. The numbers aren't: a team starts at ${STANDARD_LIFE} life in Sealed and Draft and at ${COMMANDER_LIFE} in 2HG Commander. Pick your format below for the rules specific to it.`,
  ],
} as const;

export const OVERVIEW_FAQ: readonly RulesFaq[] = [
  {
    title: "What is Two-Headed Giant in Magic: The Gathering?",
    body: "Two-Headed Giant is a team format for four players: two teams of two. Each team shares one life total, takes its turns together and attacks together. It is played as Sealed at prereleases, as Booster Draft, and as 2HG Commander at monthly WPN events.",
  },
  {
    title: "How much life does a team start with in Two-Headed Giant?",
    body: `${STANDARD_LIFE} in standard Two-Headed Giant, which covers Sealed and Draft. 2HG Commander uses ${COMMANDER_LIFE}, per Wizards' format page. In both cases the total is shared, so damage to either teammate comes off the same pool.`,
  },
  {
    title: "Do both players draw a card in Two-Headed Giant?",
    body: "Yes. Each player draws one card in the team's draw step and may play a land each turn. The exception is the team that goes first: both of its players skip the draw on that team's first turn.",
  },
  {
    title: "How do “each opponent” effects work in 2HG?",
    body: "They affect both players on the other team, one at a time, and both results come off the opposing team's shared life total. A card that makes each opponent lose 2 life takes 4 from that team.",
  },
  {
    title: "Can you choose which player to attack in Two-Headed Giant?",
    body: "Yes. Each attacking creature attacks one specific opponent, planeswalker or battle, chosen as attackers are declared. The defending team blocks together, using creatures from either player, and combat damage reduces the shared life total.",
  },
  {
    title: "If one player decks out in 2HG, does the whole team lose?",
    body: "Yes. Teams win and lose together. If either player loses the game, for example by drawing from an empty library, the whole team loses. If either player concedes, the team leaves the game.",
  },
  {
    title: "Do teammates share mana or cards in Two-Headed Giant?",
    body: "No. Only the life total and poison counters are shared. Each player keeps their own hand, mana and permanents. Teammates may look at each other's hands and talk strategy at any time, but can't handle each other's cards.",
  },
  {
    title: "Is the first mulligan free in Two-Headed Giant?",
    body: "Yes. Two-Headed Giant is a multiplayer game, and in multiplayer games each player's first mulligan is free. Each player decides separately, and teammates may consult before deciding.",
  },
];

export const OVERVIEW_SOURCES = [
  { label: "Magic: The Gathering Comprehensive Rules (rules 805 and 810)", href: "https://magic.wizards.com/en/rules" },
  { label: "Magic Tournament Rules (section 9, Two-Headed Giant)", href: "https://wpn.wizards.com/en/rules-documents" },
  { label: "Wizards of the Coast: Two-Headed Giant format page", href: "https://magic.wizards.com/en/formats/two-headed-giant" },
  { label: "Wizards of the Coast: Two-Headed Giant Commander play events", href: "https://magic.wizards.com/en/play-events/two-headed-giant-commander" },
] as const;
