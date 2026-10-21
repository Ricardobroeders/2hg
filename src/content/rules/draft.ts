import { DRAFT_PICKS_PER_PACK, LIMITED_FORMATS } from "@/lib/team";
import type { RulesContent } from "./types";

/**
 * Rules numbers from `LIMITED_FORMATS.draft` and `DRAFT_PICKS_PER_PACK`. The
 * draft procedure is MTR 9.7 and the pick timer is MTR Appendix B, both cited
 * in Sources. No source says how common 2HG Draft is, so this page doesn't.
 */
const D = LIMITED_FORMATS.draft;
const PICKS = DRAFT_PICKS_PER_PACK;

/**
 * MTR Appendix B, "Two-Headed Giant Draft Timing", by pick rather than by cards
 * left: teams take two at a time, so the same sequence serves 14- and 15-card
 * boosters. Only a 15-card booster reaches the seventh timed pick.
 */
const PICK_SECONDS = [50, 45, 40, 30, 20, 10, 5] as const;

const content: RulesContent = {
  title: "2HG Draft rules: how a team draft works",
  heading: "2HG Draft rules",
  eyebrow: "Rules · Draft",
  description: `In a 2HG draft each team takes ${PICKS} cards from every pack into one shared pool, then builds two ${D.minDeckSize}-card decks. Picks, passing, timers and life.`,

  intro: [
    `The two cards a team takes from its first pack belong to neither player yet. In a 2HG draft, teammates sit together and take ${PICKS} cards from each pack into one shared pool. They build two decks of at least ${D.minDeckSize} cards from it afterwards.`,
    `From there it plays like 2HG Sealed: ${D.startingLife} shared life and one game per match. This page covers what happens at the draft table.`,
  ],

  facts: [
    { label: "Boosters per team (MTR)", value: `${D.boostersPerTeam}` },
    { label: "Cards taken per pack", value: `${PICKS}, by the team` },
    { label: "Picks go to", value: "One shared pool" },
    { label: "Pass direction", value: "Alternates every pack" },
    { label: "Each deck", value: `${D.minDeckSize}+ cards` },
    { label: "Shared starting life", value: `${D.startingLife}` },
    { label: "Poison counters to lose", value: `${D.poisonToLose}` },
    { label: "Build and register (MTR)", value: `${D.buildMinutes} minutes` },
  ],

  sections: [
    {
      heading: "Teams draft, players don't",
      body: [
        `Teams, not players, sit in the pod, and teammates sit next to each other. Each team opens a pack, takes ${PICKS} cards from it together, and passes the rest face down to the next team.`,
        "The cards taken aren't assigned to either player. They go into one pool, and both decks are built from it once the draft ends.",
      ],
      ruleRefs: ["MTR 9.7"],
    },
    {
      heading: "The pass direction flips every pack",
      body: [
        `A team drafts from ${D.boostersPerTeam} boosters, the number the Tournament Rules recommend. The first pack passes left, the second right, and so on, so the direction alternates across all of them.`,
        "The judges' annotation to the rule recommends pods of three or four teams rather than the six to eight of an individual draft.",
      ],
      ruleRefs: ["MTR 9.6", "MTR 9.7"],
    },
    {
      heading: "The pick timer starts at 50 seconds",
      body: [
        "Each pick runs against a clock that shortens as the pack empties. Teams get 60 seconds to review their picks between packs.",
      ],
      points: [
        PICK_SECONDS.map((seconds, i) => `pick ${i + 1}: ${seconds}s`).join(" · "),
        "The seventh pick only exists in a 15-card booster. The last card or two in a pack need no time.",
      ],
      ruleRefs: ["MTR Appendix B"],
    },
    {
      heading: "Talk all you like, write nothing down",
      body: [
        "Teammates may talk throughout the draft, which is the exception that makes the format work. Written notes are banned during any draft, team drafts included.",
        "At Regular enforcement you may look back through your picks between picks, unless the head judge says otherwise. At Competitive enforcement you can't.",
      ],
      ruleRefs: ["MTR 9.2", "MTR 4.6", "MTR 7.7"],
    },
    {
      heading: "Then it becomes a Sealed build",
      body: [
        `After the draft, the team builds two decks of at least ${D.minDeckSize} cards from its pool, adding basic lands freely. Unused cards are a shared sideboard. The Tournament Rules allow ${D.buildMinutes} minutes for building and registering together.`,
        "Everything after that follows the Sealed page: one game per match, shared life, and a sideboard both players can use.",
      ],
      ruleRefs: ["MTR 7.1", "MTR 7.2", "MTR 9.6", "MTR Appendix B"],
    },
  ],

  related: [
    {
      href: "/rules/sealed",
      label: "2HG Sealed rules",
      note: "How the team's pool becomes two decks, and how matches are played.",
    },
    {
      href: "/lists/each-opponent",
      label: "Cards that hit each opponent",
      note: "The commons and uncommons that quietly double in 2HG.",
    },
    {
      href: "/lists/fog",
      label: "Fog effects",
      note: "One fog stops two attackers' worth of creatures in a team combat.",
    },
    {
      href: "/cards",
      label: "Search any card",
      note: "Check how 2HG moves a card before you take it.",
    },
  ],

  faq: [
    {
      title: "How does a Two-Headed Giant draft work?",
      body: `Teams sit together in a pod. Each team opens a pack, takes ${PICKS} cards from it together, and passes the rest to the next team. The picks go into one shared pool, and both teammates build a ${D.minDeckSize}-card deck from it after the draft.`,
    },
    {
      title: "How many packs does each team draft in 2HG?",
      body: `The Magic Tournament Rules recommend ${D.boostersPerTeam} boosters per team for 2HG Booster Draft. The pass direction alternates with each pack. A store running a casual draft can choose a different number.`,
    },
    {
      title: "Can teammates talk during a 2HG draft?",
      body: "Yes. Teammates may communicate at any time, including during the draft. Written notes are not allowed during any draft, team drafts included.",
    },
    {
      title: "Who gets the cards in a 2HG draft?",
      body: "Neither player, at first. The cards a team takes are not assigned to a particular teammate. They form one pool, and the team decides who plays what when it builds its two decks.",
    },
    {
      title: "How much life do you get in 2HG Draft?",
      body: `Each team shares ${D.startingLife} life and loses at ${D.poisonToLose} poison counters, the standard Two-Headed Giant numbers. A match is a single game.`,
    },
  ],

  sources: [
    { label: "Magic Tournament Rules (sections 4.6, 7, 9.6, 9.7, Appendix B)", href: "https://wpn.wizards.com/en/rules-documents" },
    { label: "Annotated Magic Tournament Rules: 9.7 Two-Headed Giant Booster Draft", href: "https://blogs.magicjudges.org/rules/mtr9-7/" },
    { label: "Magic: The Gathering Comprehensive Rules (rule 810)", href: "https://magic.wizards.com/en/rules" },
  ],

  targetQuery: "two headed giant draft rules",
  secondaryQueries: ["2hg draft", "how does two headed giant draft work", "2hg draft how many packs"],
  researchedAt: "2026-10-21",
};

export default content;
