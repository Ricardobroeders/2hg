import { LIMITED_FORMATS } from "@/lib/team";
import type { RulesContent } from "./types";

/**
 * Rules numbers from `LIMITED_FORMATS.sealed`. The prerelease kit contents
 * (one Prerelease Pack of six Play Boosters, plus two Play Boosters) are WPN's
 * and are cited in Sources — they change with Wizards' programme, so they are
 * the first thing to re-check when this page is next reviewed.
 */
const S = LIMITED_FORMATS.sealed;

const content: RulesContent = {
  title: "2HG Sealed rules for prereleases",
  heading: "2HG Sealed rules",
  eyebrow: "Rules · Sealed",
  description: `2HG Sealed at a prerelease: a team opens one shared pool and builds two ${S.minDeckSize}-card decks, shares ${S.startingLife} life, and plays one game per match.`,

  intro: [
    `A rare one teammate opens can end up in the other teammate's deck. In 2HG Sealed a team opens one shared pool and builds two decks of at least ${S.minDeckSize} cards from it. The team shares ${S.startingLife} life and plays one game per match.`,
    "When a prerelease offers Two-Headed Giant, this is the format. Nothing is built in advance, so everything on this page happens at the event, between opening the packs and the first game.",
  ],

  facts: [
    { label: "Shared starting life", value: `${S.startingLife}` },
    { label: "Each deck", value: `${S.minDeckSize}+ cards from one pool` },
    { label: "Boosters per team (MTR)", value: `${S.boostersPerTeam}` },
    { label: "Basic lands", value: "Unlimited" },
    { label: "Unused cards", value: "One shared sideboard" },
    { label: "Poison counters to lose", value: `${S.poisonToLose}` },
    { label: "Games per match", value: "1" },
    { label: "Deck construction (MTR)", value: `${S.buildMinutes} minutes` },
  ],

  sections: [
    {
      heading: "Two decks, one pool",
      body: [
        `Everything both players open goes into one pool. Each builds a deck of at least ${S.minDeckSize} cards from it, and basic lands are added freely. A card can only be in one deck at a time, so splitting the pool is the first real decision.`,
        "Whatever neither deck uses is the team's shared sideboard. Both players can reach into it.",
      ],
      ruleRefs: ["MTR 7.1", "MTR 7.2", "MTR 9.6", "CR 100.4c"],
    },
    {
      heading: "What a team opens at a prerelease",
      body: [
        `From Reality Fracture on, Wizards' recommended kit is one Prerelease Pack plus two Play Boosters per team. A Prerelease Pack holds six Play Boosters, so a team opens ${S.boostersPerTeam}, the number the Tournament Rules recommend for 2HG Sealed.`,
        "Before Reality Fracture, each team received two Prerelease Packs. Wizards still allows that if a store's players prefer it, so check what your store hands out.",
      ],
      ruleRefs: ["MTR 9.6"],
    },
    {
      heading: `${S.startingLife} life and one game decide the match`,
      body: [
        "A 2HG match is a single game, and a drawn game doesn't count toward it. Play continues while time allows until one team wins.",
        `The team shares ${S.startingLife} life and loses at ${S.poisonToLose} poison counters. The team that goes first skips its first draw, and each player's first mulligan is free.`,
      ],
      ruleRefs: ["MTR 9.1", "CR 810.4", "CR 810.6", "CR 103.5c"],
    },
    {
      heading: "The sideboard stays open between matches",
      body: [
        "At a prerelease without decklists, players may swap cards between their decks and the shared sideboard between matches. That freedom ends at Competitive enforcement, which no prerelease uses.",
        "Teammates can also talk at any time, during deckbuilding and during the game. The exception is a player who may have picked up hidden information elsewhere while a teammate is still playing.",
      ],
      ruleRefs: ["MTR 7.3", "MTR 9.2", "MTR 4.6"],
    },
    {
      heading: "Card ratings carry over, the life numbers don't",
      body: [
        "The 2HG Rating on each card page is built around 2HG Commander. The mechanisms it reads still apply in Sealed: “each opponent” lands twice, and a sweeper answers two boards.",
        `What changes is scale. At ${S.startingLife} life, a drain for three is a bigger share of the game than it is at Commander's 60. Read the reasons on a card page, not just the score.`,
      ],
    },
  ],

  related: [
    {
      href: "/rules/draft",
      label: "2HG Draft rules",
      note: "Teams draft two cards per pack, then build exactly as they do in Sealed.",
    },
    {
      href: "/lists/sweeper",
      label: "Board sweepers in 2HG",
      note: "A wrath answers two opposing boards at once, and your teammate's too.",
    },
    {
      href: "/lists/each-opponent",
      label: "Cards that hit each opponent",
      note: "Every “each opponent” clause lands twice on one shared total.",
    },
    {
      href: "/cards",
      label: "Search any card",
      note: "Look up a card from your pool and see how the format moves it.",
    },
  ],

  faq: [
    {
      title: "How much life do you get in 2HG Sealed?",
      body: `Each team shares ${S.startingLife} life. That is the standard Two-Headed Giant total from the Comprehensive Rules, used at prereleases. 2HG Commander uses a different, larger total, so don't carry that number over to Sealed.`,
    },
    {
      title: "How many packs does a team get at a 2HG prerelease?",
      body: `From Reality Fracture on, Wizards recommends one Prerelease Pack plus two Play Boosters per team, which is ${S.boostersPerTeam} Play Boosters. Stores may still hand out two Prerelease Packs per team instead, so the exact count depends on the store.`,
    },
    {
      title: "How big is each deck in 2HG Sealed?",
      body: `Each player's deck needs at least ${S.minDeckSize} cards, with no maximum. Both decks are built from the team's one pool, and basic lands can be added in any number.`,
    },
    {
      title: "Can teammates swap cards between decks in 2HG Sealed?",
      body: "Yes, between matches at events without decklists, which covers prereleases. Unused cards form one shared sideboard that both players can draw on. At Competitive events this isn't allowed.",
    },
    {
      title: "Is 2HG Sealed best of one or best of three?",
      body: "Best of one. A Two-Headed Giant match is a single game. A drawn game doesn't count, and play continues while time allows until a team wins.",
    },
    {
      title: "Can you talk to your teammate during a 2HG game?",
      body: "Yes, at any time, and you may show each other your hands. You can't handle your teammate's cards or permanents, and a player who may have overheard hidden information elsewhere shouldn't talk to a teammate who is still playing.",
    },
  ],

  sources: [
    { label: "Magic Tournament Rules (sections 7, 9.1, 9.2, 9.6, Appendix B)", href: "https://wpn.wizards.com/en/rules-documents" },
    { label: "WPN: Two prerelease changes coming with Reality Fracture", href: "https://wpn.wizards.com/en/news/two-prerelease-changes-coming-with-reality-fracture" },
    { label: "Wizards of the Coast: Where to play Reality Fracture", href: "https://magic.wizards.com/en/news/feature/where-to-play-reality-fracture" },
    { label: "Magic: The Gathering Comprehensive Rules (rules 100.4c, 103, 810)", href: "https://magic.wizards.com/en/rules" },
  ],

  targetQuery: "two headed giant sealed rules",
  secondaryQueries: ["2hg prerelease rules", "2hg sealed", "two headed giant prerelease how many packs"],
  researchedAt: "2026-10-21",
};

export default content;
