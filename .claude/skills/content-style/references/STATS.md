# Stats

How numbers may be used. This is where a confident writer most easily breaks a
`CLAUDE.md` invariant, because the broken version reads better than the true
one.

## The three kinds of number

Every number in a sentence is one of these. If it is none of them, it does not
go in.

### 1. Corpus-exact — say it plainly

Counts derived from `src/data/card-corpus.json` are real and citable.

- *"1,097 cards match this rule."* — from `cardsForRule(id).length`.
- Format the thousands separator (`toLocaleString()`), and use `tabular-nums`
  when it is rendered as a stat.
- **EDHREC rank is a popularity field**, not a power rating. It comes from
  Scryfall and it measures how many decks run a card. Never write "the
  best-ranked card"; write "one of the most-played".

### 2. Format-derived — read it from the code

Rules numbers come from `src/lib/team.ts` and are interpolated, never retyped:
`FORMATS.commander.startingLife`, `.minDeckSize`, `.maxCombinedCopies`,
`.commanderDamage`, `.poisonToLose`, plus `SHARED_RULES`.

Retyping is how this site has already shipped a wrong life total once. If you
are writing a string that contains a rules number, either interpolate it or
check it against `team.ts` in the same breath.

### 3. Sourced — link it

Any number that is neither of the above needs an entry in the page's `sources[]`
and a real URL. Commander's own 40 life, a WPN event window, a WotC rules
statement. `/rules` already models this with its Sources block.

## Never invent

Not "approximately", not "roughly" — **never**, in any hedged form:

- percentages of anything
- win rates, play rates, pick rates
- search volumes or keyword difficulty (the research tools available here do not
  return them; a number written here is fabricated)
- *"most players"*, *"on average"*, *"commonly"*, *"the community agrees"*
- deck counts, user counts, pairing counts

`.claude/skills/seo/SKILL.md` rule 2 is the governing text: heuristics are fine
and must be labelled; measured claims must actually be measured. There are four
observed pairings in the database. There is no aggregate to report and there is
no synergy engine, so there is no "best partner for X" claim to make.

## The 2HG Rating

**It is a heuristic over oracle text.** Always framed as one.

- Fine: *"the rating weights this at +22"*, *"this is the largest single bonus
  the rating applies"*, *"scores 86 out of 100"*.
- Banned: *"measured"*, *"data shows"*, *"proven"*, *"statistically"*,
  *"studies"*, *"tested"*, *"win rate"*.
- Rules must be explainable in one sentence — that is a `CLAUDE.md` invariant —
  so if you cannot say why a rule fires, do not write around it.

The comments in the code saying real play-rate data will replace the heuristics
are a plan, not an apology. Do not present the current scores as measured, and
do not apologise for them either.

## The doubling rule

The site's central subtlety, and the easiest place to overclaim.

- *"resolves twice"* — a fact about the rules.
- *"twice as good"* — not a fact, and usually false.

A 2HG Commander team shares 60 life. That is half again as much as one Commander
player's 40, so a doubled drain is closing a proportionally larger gap than the
arithmetic suggests. Ten damage against 60 is worth more than five against 40 —
but not twice as much.

Write the mechanism, then the honest size of it. *"Doubling a number is not the
same as halving the game."*

## Comparisons

- Compare to a stated baseline. "Better in 2HG" is meaningless without saying
  better than what — a duel, Commander at four seats, or the same card before
  the format changed.
- Do not rank across pages. A card is not "the fifth-best sweeper" because the
  list ordering is a heuristic score and it changes when the corpus rebuilds.
- Do not quote a card's score in prose. Scores are rendered live by `scoreCard()`
  and the corpus number is only an index; a score typed into a sentence will
  eventually disagree with the number rendered beside it.
