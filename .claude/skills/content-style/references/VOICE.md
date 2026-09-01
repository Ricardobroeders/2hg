# Voice

Characterised from the copy already on the site, not invented. Where a rule says
"observed", it was measured against `COPY` in `src/lib/lists.ts`, `SHARED_RULES`
in `src/lib/team.ts`, `src/app/rules/page.tsx` and `SHELVES` in
`src/app/page.tsx`.

## The shape of a sentence

- **Short and declarative.** Observed median is 16–22 words. Hard ceiling ~35 —
  past that, split it.
- **Open flat, then land the consequence.** The strongest existing paragraph
  does exactly this: *"Two teams of two. Each team shares one life total and
  takes one turn together. That's the whole format — and it's enough to change
  what half the cards in Magic are worth."* Three sentences: 4 words, 14 words,
  then the payoff.
- **Two or three sentences per paragraph.** Four is the maximum.
- **The subject is the card, the rule or the format** — not the reader and never
  us. *"Every 'each opponent' clause resolves twice."* Not *"You'll find that…"*
- **Second person only where the reader is genuinely the actor.** *"You are
  answering two developed battlefields at once."* That is real — the reader is
  the one casting the wrath. Never use "you" for enthusiasm.
- **Contractions are fine and frequent.** *"That's"*, *"doesn't"*, *"you'll"*,
  *"There's"*. The site is not stiff.

## Punctuation

- **Em dashes are in.** Roughly one per paragraph, used for a corrective or a
  consequence: *"Stax effects tax two opponents for the price of one — provided
  your own teammate can play through them."* Do not import an em-dash ban from
  another project; it is not this project's rule. Two in one paragraph is
  usually one too many.
- **Curly quotes around quoted card text** — `“each opponent”`, `“target
  player”` — matching `COPY`. Straight apostrophes in possessives and
  contractions.
- **In `.ts` string literals write the characters literally.** `’` and `“ ”`,
  never `&rsquo;` or `&apos;` — those are for JSX text nodes, where
  `react/no-unescaped-entities` applies, and in a string they render as the
  literal escape.
- **No exclamation marks.** Anywhere.
- **No rhetorical questions in prose.** A question mark belongs in an FAQ
  question and nowhere else.

## Naming and spelling

- **"Two-Headed Giant" on first use in a section, "2HG" after.** This is also
  free keyword coverage — both spellings appear naturally, so neither has to be
  forced.
- **Card names exactly as Scryfall prints them.** Front face in prose; the full
  `A // B` name in a `cards` array.
- **User-facing copy uses neutral spelling.** Code comments in this repo are
  British ("colour", "normalise") — prose is not. Prefer words with no US/UK
  split; where forced, match `/rules`.

## Headings

- **Sentence case.** Not Title Case.
- **A heading makes a claim.** The house style is corrective and specific:
  *"The one rule people get wrong"*, *"Poison clocks are slower than they look"*,
  *"Anthems only pump half your side"*, *"Two boards, one card"*. A heading that
  only labels a topic ("Board wipes") is a wasted line.
- **No "Best …" in an H2.** That shape belongs to the `<title>`; repeating it
  down the page reads as keyword stuffing.
- **No question-form headings** outside an FAQ.

## The honesty principle

This is the differentiator, not a caveat. Seven of the eighteen list hubs exist
to say a card class is *worse* in 2HG, and the pages people remember are the
ones that told them something unwelcome. So:

- **Every long page carries a counter-case section** — the trap, the
  overstatement, the cards in this list that are worse than they look.
- **Undersell before you oversell.** *"Doubling a number is not the same as
  halving the game."*
- **Name the limit in the same breath as the claim.** The existing copy does
  this constantly: *"provided your own teammate can play through them"*, *"but
  the card ratings still apply once your pool is open"*.
- **Correct a common wrong belief where one exists.** *"The
  four-copies-across-both-decks rule people remember is from a different format
  entirely."*

## Hedges

Earned hedges only. *"quietly"*, *"roughly"*, *"effectively"* all appear in the
existing copy and each carries meaning. Stacked hedges do not: never *"arguably
somewhat generally"*. If a claim needs three hedges, it is not a claim.

## Banned

Phrases that do not appear on this site and must not start:

`must-have` · `game-changer` · `powerhouse` · `insane` · `broken` (as praise) ·
`meta-defining` · `best-in-class` · `hands down` · `look no further` ·
`in today's meta` · `whether you're a beginner or a veteran` · `let's dive in` ·
`without further ado` · `in conclusion` · `Top 10` · `Ultimate Guide` ·
`Everything You Need to Know` · `Discover` (as an opener) · `unlock` ·
`supercharge` · `elevate your game`

Also banned as a category:

- **Writing about the site.** No *"our industry-leading ratings"*, no *"the best
  2HG database"*. The pages describe the format, not us.
- **Listicle scaffolding.** No *"Let's take a look at…"*, no *"Now that we've
  covered…"*, no numbered countdown framing.
- **Filler transitions.** If a paragraph opens with *"Additionally"* or
  *"Furthermore"*, delete the word and check the sentence still works. It will.

## Reuse and repetition

The single largest risk when many pages are written separately: every page
explaining the format from scratch. The shared-life explanation belongs on
`/rules`; a hub links to it and says only what is specific to *its* rule.

Before shipping, check your opening sentences against the other pages of the
same type. If a twelve-word window appears anywhere else on the site, rewrite
it — near-duplicate blocks across the site's most important pages are exactly
the problem `meetsIndexBar` exists to keep off it.
