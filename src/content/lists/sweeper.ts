import { FORMATS } from "@/lib/team";
import type { ListContent } from "./types";

/**
 * Interpolated rather than retyped: this is a user-visible life total, and the
 * site has already shipped the Constructed number (30) on a Commander surface
 * once. `team.ts` stays the only place it is written down.
 */
const SHARED_LIFE = FORMATS.commander.startingLife;

const content: ListContent = {
  title: "Best board sweepers in 2HG Commander",
  heading: "Board sweepers for 2HG",
  description:
    "A wrath answers two opponents' boards at once in 2HG, and destroys your teammate's along with them. One-sided and modal sweepers gain the most.",

  intro: [
    `Toxic Deluge is a three-mana sorcery that also costs X life, and in Two-Headed Giant that X comes out of the ${SHARED_LIFE} life your team shares. A sweeper here answers two opponents' boards with one card. It answers your teammate's board too.`,
    "That second clause is what reorders the list. Wraths are not worse in 2HG, but the one-sided and modal ones pull well ahead of the symmetrical ones. The gap is wider than it is at a four-player table.",
  ],

  sections: [
    {
      heading: "Both opposing boards arrive on the same turn",
      body: [
        "Damnation answers a board that two players built together. Teammates take one turn as a team, with one untap and one combat phase, so the opposing side commits two hands' worth of permanents in a single turn. That is what makes the timing here different from a duel.",
        "The same arithmetic runs backwards once the wrath resolves. Both opponents rebuild from two hands on their next turn, so Supreme Verdict buys your team less time than it would in a duel. The compensation is sequencing: your partner can hold creatures back and redeploy after the sweeper resolves, inside the same turn.",
      ],
      cards: ["Damnation", "Supreme Verdict"],
    },
    {
      heading: "One-sided and modal wraths gain the most",
      body: [
        "Ruinous Ultimatum destroys all nonland permanents your opponents control, and in 2HG “your opponents” is both of them. Seven mana clears two full boards and leaves your team's two standing. In a duel the same card answers one player.",
        "Modal sweepers get a second job here: the mode you skip is the one your own team is standing on. Austere Command picks two of four effects, and Farewell picks one or more. Either can be aimed at what the other side actually has, rather than at everything on the table.",
      ],
      cards: ["Ruinous Ultimatum", "Austere Command", "Farewell"],
    },
    {
      heading: "Selective wraths let your teammate keep a board",
      body: [
        "Fell the Mighty destroys every creature with power greater than target creature's power. Your range of influence covers your partner — so that target can be their smallest creature. Damning Verdict is selective in a different way. It spares every creature carrying a counter, on both sides of the table, so it rewards a counters deck rather than careful aim.",
        "Two more count the board rather than clearing it. Decree of Pain draws a card for each creature destroyed, and Fumigate gains a life for each. Both are counting four players' creatures in 2HG where a duel would give them two.",
      ],
      cards: ["Fell the Mighty", "Damning Verdict", "Decree of Pain", "Fumigate"],
    },
    {
      heading: "A symmetrical wrath is a two-for-two",
      body: [
        "Wrath of God kills four players' creatures in 2HG, and two of those players are on your team. At a four-player Commander table it trades one board for three. Here it trades two for two, the ratio of a duel.",
        "Living Death is the sharper case: every player exiles their creature cards and gets them back, so both opponents reanimate a graveyard on your sorcery. Kindred Dominance spares a single creature type — and your teammate is probably not playing it.",
        "None of that makes a symmetrical wrath unplayable. Toxic Deluge is the standing exception: you choose X, so a small one clears two boards of utility creatures while your bigger threats survive. It also kills through indestructible, which “destroy all creatures” does not.",
      ],
      cards: ["Wrath of God", "Living Death", "Kindred Dominance", "Toxic Deluge"],
    },
  ],

  faq: [
    {
      title: "Are board wipes good in Two-Headed Giant?",
      body: "Yes. One sweeper answers two opponents' boards, and those boards were deployed on a single shared turn. The limit is that a symmetrical wrath destroys your teammate's creatures as well, so it trades two boards for two. One-sided and modal sweepers avoid that and gain the most.",
    },
    {
      title: "Do board wipes destroy your teammate's creatures in Two-Headed Giant?",
      body: "Yes. Teammates share a life total and a turn, but they are separate players controlling separate permanents. Anything that says “all creatures” includes your teammate's. Only one-sided or selective sweepers, such as Ruinous Ultimatum or Fell the Mighty, leave your partner's board standing.",
    },
    {
      title: "How much life do you start with in Two-Headed Giant Commander?",
      body: `${SHARED_LIFE}, shared by the team. It is one pool for both players rather than ${SHARED_LIFE} each. That matters for sweepers because Toxic Deluge pays X life as an additional cost, and Fumigate gives life back for each creature destroyed. Both are drawing on the team's total.`,
    },
    {
      title: "Can you target your teammate's creatures in Two-Headed Giant?",
      body: "Yes. Your range of influence covers your whole team, so “target creature” and “target player” can both be pointed at your partner. Fell the Mighty relies on it: name your teammate's smallest creature and every larger creature on the table is destroyed, including your own.",
    },
    {
      title: "Do board wipes destroy indestructible creatures?",
      body: "No, not the ones that destroy. Indestructible survives “destroy all creatures”, so Wrath of God and Damnation leave those creatures behind. Toxic Deluge gets past it with -X/-X and Farewell exiles instead. Both are worth more when the board holds two opponents' creatures.",
    },
    {
      title: "When should you cast a board wipe in 2HG?",
      body: "When your team has committed the least to the board. Teammates share one turn, so your partner can hold creatures back, let the sweeper resolve, and redeploy before the turn ends. Both opponents have to wait for their own turn to rebuild.",
    },
  ],

  related: [
    "opponent-sacrifice",
    "single-target-removal",
    "symmetric-tax",
    "cheap-interaction",
  ],

  tailHeading: "More sweepers in this list",

  targetQuery: "best sweepers two headed giant",
  secondaryQueries: [
    "best board wipes two headed giant",
    "2hg board wipe cards",
    "two headed giant commander board wipes",
    "are board wipes good in two headed giant",
    "do board wipes destroy your teammate's creatures in two headed giant",
  ],
  researchedAt: "2026-09-01",
};

export default content;
