# Context

What a writer needs to know before drafting, and where every fact actually
lives.

**This file deliberately does not restate the format numbers.** Putting "60
life" here would create a fourth place for it to go stale, and a stale copy is
exactly how the wrong life total shipped once already. Every rules fact below is
a cross-reference. Follow it.

## Who is reading

**2HG Commander players**, mostly at a WPN store's monthly Commander Play Event.
They have a Commander deck already. They are deciding what to change about it
because their next game has a teammate, two opponents, one shared life total and
one shared turn.

Assume they know Magic. Assume they know Commander. Do **not** assume they know
2HG — the format changes enough that experienced players get it wrong, and the
site exists because of that gap.

Concretely: **do not gloss Commander vocabulary.** Wrath, edict, stax, extort,
aristocrats, group hug, spot removal and tutor all go unexplained. The only
thing a page explains is what 2HG does differently. A gloss costs six words,
signals the wrong audience, and the reader who needed it was not searching for
"best sweepers two headed giant".

Secondary: cEDH-adjacent players who tune decks seriously and are the natural
converts, and players walking into a prerelease 2HG Sealed event who will never
build a deck but do want to know what the format does to a card.

They are searching for a specific answer — *"are board wipes good in 2HG"* —
not for a general guide. Answer the question in the first sentence.

## What we own, and what we do not

**Own — write about these freely:**

- **The 2HG Rating.** A per-card score explaining how the format changes that
  card's value. It is a heuristic over oracle text and is always labelled as one
  (`STATS.md`). Every rule that fires must be explainable in one sentence, and
  card pages show which rules matched and why.
- **The rule hubs.** Eighteen classes of card the format moves, each with the
  cards it affects, at `/lists/[rule]`.
- **Format precision.** `/rules` renders from the data, so it is right when
  other sites are vague.

**Do not exist yet — never write as though they do:**

- **The synergy engine.** No role coverage, no redundancy scoring, no curve
  collision, no anti-synergy detection. Therefore **no "best 2HG partner for
  [commander]"** claim, no "pairs well with", no synergy score. There are four
  observed pairings in the database. That is not a dataset.
- **Measured play data.** See `STATS.md`.
- **Accounts as a requirement.** Building a team and sharing it works signed
  out, and copy must never imply a login is needed.

## Which file answers which question

| Question | Source |
| --- | --- |
| Any rules number — life, poison, deck size, copy limits, commander damage | `FORMATS` in `src/lib/team.ts` |
| What is true in every 2HG variant | `SHARED_RULES` in `src/lib/team.ts` |
| Sealed / Limited variants | `REFERENCE_VARIANTS` in `src/lib/team.ts` |
| What a rule means and why it fires | the `Rule` entry in `src/lib/twohg-score.ts` — `label`, `reason`, `impact`, `weight`, and the `test` predicate |
| Which cards are in a list, and how many | `cardsForRule(id)` in `src/lib/corpus.ts` |
| How popular a card is | the `rank` field (Scryfall's EDHREC rank) on a corpus card |
| What a card actually does | Scryfall oracle text, via `src/lib/scryfall.ts` — never from memory |
| Whether a page may be advertised | `meetsIndexBar` in `src/lib/corpus.ts` |
| Titles, canonicals, structured data, sitemap | `.claude/skills/seo/` |

The `test` predicate is the definition of a list. Prose about a class of card
the predicate does not match is prose about a list that does not exist — read it
before writing about a hub.

## The three format traps

Each of these has been written wrong before, here or elsewhere:

1. **2HG Commander life is not the Constructed number.** Two different variants,
   two different totals. Read `FORMATS.commander.startingLife` and
   `FORMATS.constructed.startingLife` rather than trusting a memory of either.
2. **There is no unified deck rule in 2HG Commander.** Each player brings their
   own individually-legal deck; teammates may both run the same card; the
   singleton rule applies per deck and never across the team.
   `FORMATS.commander.maxCombinedCopies` is `null` and says so. The
   four-copies-across-both-decks rule people remember belongs to 2HG
   Constructed — where it is real, and where `maxCombinedCopies` is set.
3. **Poison is not the usual number.** Read `FORMATS.commander.poisonToLose`.

If a draft states a rules number, it must either interpolate from `FORMATS` or
have been checked against it during the same edit.

## Card facts

- **Canonical Scryfall name is the join key**, everywhere on this site. Name
  cards exactly as printed.
- **Card behaviour comes from oracle text**, never recall. Magic text is the
  single thing a writer is most likely to misremember confidently, and a wrong
  card claim on a page about card evaluation is the most damaging error
  available.
- **Never write a mana cost as text.** `{3}{B}` in a plain string bypasses the
  `ManaCost` / `ManaText` components entirely. Say "a three-mana black spell",
  or render the components.
- Choose examples readers recognise. A list is ordered by the rating, so its top
  entries are the cards that trip the most rules — which is not the same as the
  cards people have heard of. Cross-check against EDHREC rank before naming
  something as a flagship example.

## Commercial

Buy links exist and go through `src/lib/affiliates.ts`. Prose does not sell.
Never write "pick one up", never compare prices, never imply urgency. Scryfall
attribution is non-optional and lives in the footer.
