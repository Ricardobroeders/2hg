import { FORMATS } from "@/lib/team";
import type { RulesContent } from "./types";

/**
 * Every rules number on this page comes from `FORMATS.commander`. The one
 * number that isn't 2HG's own — Commander's 40 starting life — is CR 103.4c
 * and is cited in Sources.
 */
const F = FORMATS.commander;
const LIFE = F.startingLife;
const DAMAGE = F.commanderDamage;
const POISON = F.poisonToLose;
const DECK = F.minDeckSize;

const content: RulesContent = {
  title: "2HG Commander rules and FAQ",
  heading: "2HG Commander rules",
  eyebrow: "Rules · Commander",
  description: `2HG Commander: each player brings a legal ${DECK}-card Commander deck, the team shares ${LIFE} life and loses at ${POISON} poison. No unified deck rule.`,

  intro: [
    `Two teammates can both put Sol Ring in their decks for a 2HG Commander game. Each player brings an ordinary, legal ${DECK}-card Commander deck. The team shares ${LIFE} life and takes one turn together against two opponents.`,
    "This is the variant Wizards runs as a monthly Commander Night at WPN stores, and the only 2HG format you build for at home. The rules every variant shares are on the overview; this page covers what Commander adds.",
  ],

  facts: [
    { label: "Shared starting life", value: `${LIFE}` },
    { label: "Each player's deck", value: `${DECK} cards, singleton` },
    { label: "Same card in both decks", value: "Allowed" },
    { label: "Commander damage", value: `${DAMAGE} from one commander` },
    { label: "Poison counters to lose", value: `${POISON}` },
    { label: "First mulligan", value: "Free" },
    { label: "Team that plays first", value: "Skips its first draw" },
    { label: "Commander Night enforcement", value: "Casual" },
  ],

  sections: [
    {
      heading: "Two ordinary decks, no team limit",
      body: [
        "Wizards' event page puts it in one line: “You can use any legal Commander deck at these events.” Each deck is checked on its own for singleton, color identity and the normal Commander banned list. Nothing compares one teammate's list against the other's.",
        "So both players can run Sol Ring, Cyclonic Rift or the same commander. The cross-deck rule people remember belongs to 2HG Constructed, a different format entirely.",
        "Power level is the store's call. Wizards suggests the Commander Brackets for matching decks, but no event page requires them.",
      ],
    },
    {
      heading: `A shared ${LIFE} is less than two players' 40`,
      body: [
        `A Commander player starts at 40, so two of them would bring 80 to the table. A 2HG team brings ${LIFE}, in one pool that both opponents are hitting.`,
        "Every “each opponent” clause widens that gap. Damage and life loss happen to each player and land on the same total, so Gray Merchant of Asphodel drains the team twice. Doubling a number is not the same as halving the game, but it does reorder which cards are worth a slot.",
      ],
      ruleRefs: ["CR 103.4c", "CR 810.9"],
    },
    {
      heading: "Commander damage: the official wording counts the team",
      body: [
        `Wizards' 2HG format page says “A team loses when they take ${DAMAGE} or more damage from a single commander.” Read that way, damage from one commander adds up across both players on the team.`,
        `The Comprehensive Rules don't settle it. They count commander damage per player, and they have no rule for 2HG Commander at all. Under that reading one player has to take all ${DAMAGE}. Ask your store which count it uses before the first game.`,
        "Partner commanders are counted separately either way. Damage from each of the two adds to its own total.",
      ],
      ruleRefs: ["CR 903.10a", "CR 702.124d"],
    },
    {
      heading: "Each player keeps their own commander",
      body: [
        "The command zone, commander tax and the commander itself stay with the player who owns them. Casting your commander a third time costs four more mana, whatever your teammate has cast.",
        "You can't cast your teammate's commander. Teammates may show each other their hands and plan together, but they can't handle each other's cards.",
      ],
      ruleRefs: ["CR 903.8", "CR 810.5"],
    },
    {
      heading: "One turn, two players acting in it",
      body: [
        "The team untaps, draws and attacks together. Each player draws in the team's draw step and may play a land. Either player can cast spells whenever the team has priority, and the team passes only when neither wants to act.",
        "The team that goes first skips its first draw, both players. Mulligans are declared player by player, teammates may consult, and the first mulligan is free, as in any multiplayer game.",
      ],
      ruleRefs: ["CR 805.4", "CR 805.5", "CR 810.6", "CR 805.3a", "CR 103.5c"],
    },
    {
      heading: "Attacks pick a player, and the monarch notices",
      body: [
        "Each attacking creature attacks one specific opponent, planeswalker or battle. The defending team blocks as one, with either player's creatures. The damage comes off the shared total, but it was still dealt to one player.",
        "That detail decides the monarch and the initiative. Both belong to a single player, not to the team, and only combat damage to that player takes them.",
      ],
      ruleRefs: ["CR 805.10", "CR 725.2", "CR 726.2"],
    },
    {
      heading: "A Commander Night is casual by design",
      body: [
        "Wizards has run 2HG Commander as a monthly WPN event since Edge of Eternities in 2025, scheduled set by set. Rules enforcement is Casual, and each participant receives a Commander promo.",
        "You don't need to bring a teammate. The store can pair you with another player, and a preconstructed deck is a legal Commander deck. Rounds and timing are up to the store.",
      ],
    },
  ],

  related: [
    {
      href: "/deck-builder",
      label: "Build both decks as one team",
      note: "Paste two Commander lists and see them side by side, with every card rated for 2HG.",
    },
    {
      href: "/lists/each-opponent",
      label: "Cards that hit each opponent",
      note: "Every “each opponent” clause lands twice on one shared total.",
    },
    {
      href: "/lists/poison",
      label: "Poison and infect",
      note: `A team loses at ${POISON} counters, so poison clocks run slower here.`,
    },
    {
      href: "/lists/monarch",
      label: "Monarch and initiative",
      note: "The crown sits on one player's head, and both opponents can aim at it.",
    },
  ],

  faq: [
    {
      title: "How much life do you start with in 2HG Commander?",
      body: `Each team starts with ${LIFE} life, shared by both players. That is Wizards' figure for 2HG Commander. Ordinary Two-Headed Giant uses 30, and Commander on its own uses 40 per player, so a site quoting either number for 2HG Commander has the wrong variant.`,
    },
    {
      title: "Can both players in 2HG Commander run the same card?",
      body: "Yes. Each player brings any legal Commander deck, and the singleton rule applies to each deck separately. There is no unified deck rule in 2HG Commander, so both teammates can run Sol Ring or even the same commander.",
    },
    {
      title: "How does commander damage work in Two-Headed Giant?",
      body: `Wizards' 2HG page says a team loses when it takes ${DAMAGE} or more damage from a single commander. The Comprehensive Rules count commander damage per player and have no 2HG Commander rule, so confirm with your store which way it is counted.`,
    },
    {
      title: "How many poison counters does it take to lose in 2HG?",
      body: `${POISON}. Poison counters are shared by the team, and the team loses at ${POISON} rather than the usual 10. This applies in 2HG Commander as in every other Two-Headed Giant variant.`,
    },
    {
      title: "Do you get a free mulligan in 2HG Commander?",
      body: "Yes. 2HG is a multiplayer game, and in multiplayer games each player's first mulligan is free. Each player decides separately, teammates may consult, and one player can mulligan even after their teammate keeps.",
    },
    {
      title: "Does the team that goes first draw a card in 2HG?",
      body: "No. The team that plays first skips the draw step of its first turn, and that applies to both players on the team. From the next turn on, each player draws one card in the team's draw step.",
    },
    {
      title: "Does lifelink in 2HG Commander gain life for the whole team?",
      body: "Yes. Lifegain happens to the player who gains it and is then applied to the team's shared life total. A lifelink creature on either side of the team feeds the one total both players use.",
    },
    {
      title: "How does the monarch work in Two-Headed Giant?",
      body: "The monarch is a single player, not the team. That player draws at their end step, and a creature that deals combat damage to that specific player takes the crown. Damage to their teammate doesn't.",
    },
    {
      title: "Do I need a teammate to play at a 2HG Commander Night?",
      body: "No. Wizards' event page says you can bring your own teammate or the store can pair you with another participant. Any legal Commander deck is accepted, including a preconstructed one.",
    },
  ],

  sources: [
    { label: "Wizards of the Coast: Two-Headed Giant format page", href: "https://magic.wizards.com/en/formats/two-headed-giant" },
    { label: "Wizards of the Coast: Two-Headed Giant Commander play events", href: "https://magic.wizards.com/en/play-events/two-headed-giant-commander" },
    { label: "Wizards of the Coast: Commander Play featuring Sealed and Two-Headed Giant", href: "https://magic.wizards.com/en/news/announcements/commander-play-featuring-sealed-and-two-headed-giant" },
    { label: "Magic: The Gathering Comprehensive Rules (rules 103, 805, 810, 903)", href: "https://magic.wizards.com/en/rules" },
  ],

  targetQuery: "2hg commander rules",
  secondaryQueries: [
    "two headed giant commander rules",
    "2hg commander life total",
    "two headed giant commander damage",
    "2hg commander night",
  ],
  publishedAt: "2026-10-21",
  researchedAt: "2026-10-21",
};

export default content;
