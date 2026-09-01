---
name: list-hub-content-agent
description: Research and write the SEO body content for one /lists/[rule] hub — keyword research, meta title and description, H2/H3 sections, FAQ and related lists — into src/content/lists/<slug>.ts
tools:
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - TodoWrite
---

# List Hub Content Agent

Researches and writes the long-form content for **one** rule hub at
`/lists/[rule]`. Each hub targets a query nobody currently answers well ("best
sweepers two headed giant", "2hg extra turn cards"). The page already has the
cards; this agent gives it the explanation, the FAQ and the metadata.

**How to run:** "Run the list hub content agent" or `/run-list-hub-content [slug]`
**Processes:** 1 hub per run → one edited file, `src/content/lists/<slug>.ts`
**Backlog:** the filesystem. A hub is *queued* when its content file has no
`sections` key. There is no database and no run log — the diff is the record.
**Locale:** English only. No hreflang, no translations.

**IMPORTANT:** This agent edits exactly ONE content file per run:
`src/content/lists/<slug>.ts` (plus the narrow `KEYWORD-MAP.md` refresh in Step
12). It must NOT touch `src/lib/twohg-score.ts` (a weight change requires a
corpus rebuild in the same commit), `src/data/card-corpus.json`,
`src/lib/lists.ts`, `src/lib/team.ts`, `src/app/**`, or `src/components/**`. It
must not run `npm run seo:corpus`. It must not commit, push, or deploy. If
`git diff --stat` at the end of the run shows any file other than the target
content file and `KEYWORD-MAP.md`, **the run has failed** — report it and stop
rather than reverting blindly.

## Brand and Voice Rules

**Read `.claude/skills/content-style/` in full — all five files — and follow
them.** They are the standard; this agent does not restate them, so that the
register can be changed in one place and every content agent inherits it.
`.claude/skills/seo/` remains the on-page and technical standard.

The four rules broken most often while drafting, repeated here only because they
are the ones that cost a rewrite:

1. **Never state a number we did not measure.** No percentages, win rates, play
   rates or search volumes. The 2HG Rating is a heuristic over oracle text and
   is always labelled as one.
2. **Format facts come from `FORMATS.commander`, never memory.** 60 shared life,
   not 30. 15 poison, not 10. No unified deck rule in 2HG Commander.
3. **Never write a mana cost in prose.** `{3}{B}` in a string literal bypasses
   `ManaCost`/`ManaText` entirely. Say "a three-mana black spell".
4. **Undersell before you oversell.** Every page carries an honest counter-case
   section. It is the differentiator, not a disclaimer.

---

## Step 0 — Preconditions

1. Confirm the repo: `git rev-parse --show-toplevel` ends in `/2HG`.
2. `git status --short` — if anything under `src/` is already modified, **stop**
   and report. The run's diff has to be reviewable on its own.
3. Read in full: `CLAUDE.md`; `.claude/skills/seo/SKILL.md` and all three files
   in `.claude/skills/seo/references/`; **all five files in
   `.claude/skills/content-style/`**; `src/content/lists/types.ts`.
4. Confirm `WebSearch` is callable. **If it is not, halt.** Keyword research
   without a SERP is invention, and invention is precisely what this agent
   exists to avoid.
5. Note the run date — it becomes `researchedAt`.

## Step 1 — Pick the hub

If the operator named a slug, use it. Otherwise take the first hub with no
`sections` key, in this order:

`sweeper` → `each-opponent` → `extra-turn` → `group-hug` → `cheap-interaction`
→ `team-protection` → `aoe-damage` → `fog` → `one-on-one` → `poison` →
`opponent-sacrifice` → `symmetric-tax` → `lifegain` → `opponent-trigger` →
`single-target-removal` → `opponent-discard` → `team-anthem` → `monarch`

`group-hug` and `lifegain` sit above their card counts on purpose: the "cards
that get *worse* in 2HG" angle is the genuinely uncontested one.

**Clean halt.** If every hub already has `sections`, stop and report *"All 18
hubs have researched content. Nothing to write."* Do not invent a 19th list, do
not propose a new rule, do not lower a threshold, and do not rewrite an existing
hub to keep the cadence. Rewriting requires an explicit `--rewrite <slug>` from
the operator. **Filler content is worse than no content.**

## Step 2 — Ground in the repo before touching the web

In this order:

1. Read the rule's entry in `src/lib/twohg-score.ts` — `label`, `reason`,
   `impact`, `weight`, and **the `test` predicate**. The predicate is the
   definition of what is on this page. Prose about a class of card the predicate
   does not match is prose about a list that does not exist.

2. Pull both orderings from the corpus:

   ```bash
   node -e 'const c=require("./src/data/card-corpus.json");const r=process.argv[1];
     const m=c.cards.filter(x=>x.rules.includes(r));
     console.log("total",m.length);
     console.log("--- by score ---");
     console.log(m.slice().sort((a,b)=>b.score-a.score||(a.rank??1e9)-(b.rank??1e9)).slice(0,15).map(x=>`${x.name} s${x.score} #${x.rank}`).join("\n"));
     console.log("--- by EDHREC rank ---");
     console.log(m.filter(x=>x.rank!=null).sort((a,b)=>a.rank-b.rank).slice(0,20).map(x=>`${x.name} #${x.rank} s${x.score}`).join("\n"));' <slug>
   ```

   **Draw prose examples from the rank-sorted list.** The score-sorted head is
   the page's own ordering and is dominated by multi-rule cards nobody
   recognises — for `each-opponent` it leads with *Kefka, Court Mage* and *One
   Ring to Rule Them All*, while the rank list leads with *Impact Tremors* and
   *Gray Merchant of Asphodel*. Readers search for the second set.

3. Read `FORMATS.commander` and `SHARED_RULES` in `src/lib/team.ts`. Every
   format number in the draft comes from here.

4. If you need a card's oracle text, `WebFetch https://api.scryfall.com/cards/named?exact=<name>`
   — **at most 10 per run**, never a bulk endpoint, never scraping scryfall.com
   HTML. Card behaviour is never written from memory.

5. Read the first body paragraph of every other content file:

   ```bash
   grep -A3 '"body": \[\|body: \[' src/content/lists/*.ts | head -80
   ```

   You must not repeat their framing.

## Step 3 — Keyword research

WebSearch each of these, substituting the plain-English class name (`board
sweepers`, not `sweeper`):

- the hub's current `title`, verbatim
- `best <class> two headed giant`
- `2hg <class> cards`
- `two headed giant commander <class>`
- `are <class> good in two headed giant`
- one question form drawn from the rule's `reason`

For each query record: the ranking URLs, whether each is a forum, a dead thread,
a deck dump or a real page, and any related searches surfaced. Then **WebFetch
the top three non-forum results** and extract their `<title>` and their H2s.
That outline gap analysis is the single most useful input to Step 5.

**Separately collect every question-shaped query you observe** — related
searches, People-Also-Ask style questions, competitor headings phrased as
questions — verbatim as written. This list is the raw material for the FAQ in
Step 7, and it is the reason the FAQ can claim to match real queries rather than
guesses.

Slot the primary term into a `KEYWORD-MAP.md` tier and note whether that file's
"who ranks today" column still holds.

**Hard rule: never state a search volume.** WebSearch does not return one, so a
number written here is fabricated — `SKILL.md` rule 2. If the DataForSEO MCP
happens to be authorised, its volumes may be used to *order* candidate queries
and may be quoted **in the run report only**, never in page copy and never in a
code comment. It is enrichment, not a dependency; if it is unavailable, say so
and proceed.

## Step 4 — Meta, against a blocking gate

**Title.** The root layout appends `" · Two-Headed Giant"` — **19 characters**.
So the title must **not** itself contain "Two-Headed Giant". Write "2HG" and let
the template supply the long form; one title then covers both spellings.

- Target **24–41 chars** (rendered 43–60). **Hard reject outside 20–46**
  (rendered 39–65).
- Query-shaped, not label-shaped. Banned: "Complete Guide", "Everything You Need
  to Know", "Ultimate", a year.

**Description.** Target **125–158 chars**, **hard reject outside 110–165**.
First sentence answers the query. No "Discover", no "Looking for".

**Uniqueness.** Zero hits required:

```bash
node -e 'const fs=require("fs"),p="src/content/lists";
  const T=process.argv[1],D=process.argv[2];
  for(const f of fs.readdirSync(p).filter(f=>f.endsWith(".ts")&&f!=="index.ts"&&f!=="types.ts")){
    const s=fs.readFileSync(p+"/"+f,"utf8");
    if(s.includes(T))console.log("TITLE COLLISION",f);
    if(s.includes(D))console.log("DESC COLLISION",f);
  }' "<new title>" "<new description>"
grep -rn "<first 25 chars of new title>" src/content/lists src/app src/lib
```

Also check the static `metadata` objects in `src/app/**/page.tsx` and
`src/app/layout.tsx`. On any collision or bound violation, rewrite with a
stronger differentiator and re-check. **Never publish a failing meta.**

## Step 5 — Outline

Three to five `<h2>`s. Required spine, adapted to the rule:

1. **The mechanism** — why the format changes this class, grounded in
   `rule.reason` and `SHARED_RULES`. This is the section most at risk of being
   identical across 18 hubs. It must be about *this rule's* mechanism, not about
   2HG in general — the shared-life explanation belongs on `/rules`.
2. **How to pick** — the selection criteria, with named cards from the
   rank-sorted list.
3. **The honest counter-case** — the trap, the overstatement, the cards in this
   list that are worse than they look. This is what makes the page not a
   listicle.
4. *(optional)* the numbers — the rule's weight and how the rating treats it,
   **labelled a heuristic**.
5. *(optional)* `<h3>`s under section 2 for sub-classes.

Constraints: sentence case; no "Best …"; no question-form H2 outside the FAQ; no
H2 restating the H1; 60–140 words per section; **350–600 words of prose total**;
and **no H2 without at least one card named from this rule's own list**.

## Step 6 — Write the body

Apply `.claude/skills/content-style/`. Card names go in `sections[].cards`
exactly as Scryfall prints them (front face in prose, full `A // B` name in the
array for MDFCs) — the page links them by slug, so a name outside this rule's
list would link to a page contradicting the section it sits under.

Write curly quotes and apostrophes **literally**. These are `.ts` string
literals rendered through `{expr}`, not JSX text, so
`react/no-unescaped-entities` does not apply and `&rsquo;` would render as the
literal escape.

## Step 7 — FAQ (5–8 entries)

Each `title` is a **real search query** taken from the question list collected in
Step 3 — not invented at the desk. Natural phrasing as a person types it, ending
in `?`. Do not title-case it into a marketing headline.

Each `body` is **40–60 words**, answer in the first sentence, the rest
supporting. Every fact must already be on the page — the FAQ summarises, it
never introduces. Format numbers must match `/rules` exactly; two pages on this
site disagreeing about the life total is a failure that has shipped before. No
humor here.

If Step 3 yielded fewer than five real questions, say so in the report and ship
what is evidenced rather than padding to the count.

## Step 8 — Related lists

Three to four hub ids, chosen by **topical** adjacency rather than by `impact` —
the render fallback already covers same-impact siblings, and it orders them by
rule weight, which is not a topical order. Every id must exist in `RULES`. Self
excluded.

## Step 9 — QA gate (blocking)

Run every check and report pass/fail for each.

| # | Check | How |
|---|---|---|
| 1 | Title 20–46 chars, and +19 ≤ 65 rendered | count |
| 2 | Description 110–165 chars | count |
| 3 | Title, 25-char prefix and description unique sitewide | Step 4 commands |
| 4 | No mana braces in prose | `grep -nE '\{[0-9WUBRGCXSPTwubrgc/]+\}' src/content/lists/<slug>.ts` → empty |
| 5 | Format facts | `grep -nE '\b(10\|15\|21\|30\|40\|60\|100)\b'` → hand-check every hit against `FORMATS.commander`. Any number not derivable from `FORMATS` needs a `sources[]` entry |
| 6 | Heuristic labelling | `grep -niE 'measured\|data shows\|statistic\|proven\|studies\|win.?rate\|tested'` → empty |
| 7 | No fabricated aggregates | `grep -nE '%\|\bmost players\b\|\bon average\b\|\bsearch volume\b\|\bcommonly\b'` → empty |
| 8 | Every named card is in this rule's list | `node -e` intersecting `sections[].cards` against the Step 2 corpus filter, plus a hand-scan of capitalised names in prose |
| 9 | **No duplicate framing across hubs** | for the first sentence of every section, take each 12-word window and `grep -F` it across `src/content/lists/*.ts`. Any hit outside the target file is a fail |
| 10 | No blocked claims | `grep -niE 'best partner\|pairs (best\|well) with\|synergy score'` → empty. The synergy engine does not exist |
| 11 | Only one file changed | `git diff --stat` |
| 12 | Word count 350–600 | if you cannot reach 350 honestly, **say so and stop** |

**FAQ checks:** 5–8 entries; every `title` ends in `?` and appears in the Step 3
question list (a question with no research provenance is a fail); every `body`
is **40–60 words**, reported per entry; no two questions are paraphrases; no
humor.

**Style checks:** banned-phrase grep from `VOICE.md`; no sentence over 28 words;
at most one humor aside on the page and none in an FAQ, H2, meta or opening
sentence (`HUMOR.md`); every number classified per `STATS.md` as corpus-exact,
`FORMATS`-derived, or `sources[]`-backed.

## Step 10 — Apply

`Edit` the single file `src/content/lists/<slug>.ts`.

## Step 11 — Verify

All three must be clean, in order:

```bash
npx tsc --noEmit
npx eslint src
npm run build
```

Then confirm the page prerendered with what you wrote:

```bash
grep -c 'FAQPage' .next/server/app/lists/<slug>.html
grep -oE '<h2[^>]*>[^<]+' .next/server/app/lists/<slug>.html
```

Best effort — the prerender path can move between Next versions, so a failure
here is a note in the report, not a blocker. A failing `tsc`, `eslint` or
`build` **is** a blocker.

## Step 12 — Refresh KEYWORD-MAP.md, narrowly

That file says to re-check the "who ranks" column before committing to a term,
so a research agent that never writes back lets it rot. Update **only**:

1. the `Research done <date>` line,
2. the *"Who ranks today"* cell of the **List / class** row, and only if what you
   observed differs from what is written,
3. one row appended to a `## Hub research log` table:
   `| slug | researched | primary query | who ranks |`.

Do **not** rewrite the tiers, the verdicts, the competitive notes or the
localisation section. Those are strategy calls, not observations.

## Step 13 — Report

There is no run-log table; the transcript and the diff are the record. Report:

1. Hub, slug and live URL.
2. Primary and secondary queries, who ranks for each, and whether
   `KEYWORD-MAP.md` changed.
3. Meta before/after with character counts — both the page title and the
   rendered title (`+19`).
4. The H2/H3 outline as shipped.
5. The FAQ questions, with each answer's word count.
6. Every card named, and confirmation each is in this rule's list.
7. The QA table with a result per row.
8. The three verification command results.
9. `git diff --stat`.
10. **What was deliberately not done**, and why.
11. How many hubs remain unwritten.

End with: *"Not committed, not pushed, not deployed."*
