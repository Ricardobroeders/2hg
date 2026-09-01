---
name: content-style
description: How 2HG writes. Voice, humor, how numbers may be used, and what the reader already knows. Use when writing or editing any user-facing prose — list hub copy, card page summaries, set pages, rules prose, meta descriptions, FAQs — and whenever an agent authors content for this site.
---

# 2HG content style

This is the register. `.claude/skills/seo/SKILL.md` is the on-page and technical
standard — titles, canonicals, structured data, the index bar — and this file
does not repeat any of it. Two separate questions: *may this page exist and how
is it marked up* (SEO skill) versus *how does it read* (here).

Why it exists: the site's pages are written one at a time, months apart, often by
an agent that has never seen the others. Eighteen list hubs written across
eighteen runs will drift into eighteen different voices, or — worse — into one
voice repeated eighteen times. Both are visible to a reader and both are visible
to Google.

## The four references

Read all four before drafting. They are short.

| File | What it settles |
| --- | --- |
| `references/VOICE.md` | Sentence shape, person, punctuation, banned phrases, the honesty principle |
| `references/HUMOR.md` | How much, what kind, and the four places it is never allowed |
| `references/STATS.md` | Which numbers are facts, which are heuristics, and which may never be written |
| `references/CONTEXT.md` | Who the reader is, what we own, and which file answers which factual question |

## The five things most often got wrong

If you read nothing else:

1. **We are honest about cards being worse.** Seven of the eighteen list hubs
   exist to say a card class is *weaker* in 2HG. Undersell before you oversell —
   it is the whole differentiator, and every long page carries a counter-case
   section for that reason. See `VOICE.md`.
2. **Never state a number we did not measure.** No percentages, no win rates, no
   play rates, no search volumes, no "most players". The 2HG Rating is a
   heuristic over oracle text and is always labelled as one. See `STATS.md`.
3. **Format facts come from the code, never from memory.** 2HG Commander is 60
   shared life, not 30. Poison is 15, not 10. There is no unified deck rule. All
   of it lives in `src/lib/team.ts` and all of it has shipped wrong before. See
   `CONTEXT.md`.
4. **Mana costs are artwork, never text.** Never write `{3}{B}` in prose. In a
   React component use `ManaCost` / `ManaText`; in a plain string, write "a
   three-mana black spell" instead. A string literal bypasses the components
   entirely, which is the one place the invariant cannot defend itself.
5. **Em dashes are in, but sparing.** About one paragraph in five carries one,
   for a corrective or a consequence. If you have absorbed a house rule banning
   them from somewhere else, that rule is not this project's. See `VOICE.md`.

## Where the voice already lives

Do not invent the register — match it. The canonical samples, in order of how
much they should influence you:

- `COPY` in `src/lib/lists.ts` — 18 hub titles, headings and descriptions.
- `SHARED_RULES` in `src/lib/team.ts` — the tightest prose on the site.
- `src/app/rules/page.tsx` — the longest, and the model for prose structure,
  callouts and a Sources block.
- `SHELVES` in `src/app/page.tsx` — the homepage shelf blurbs.

## Scope

Everything a visitor reads: page copy, headings, meta titles and descriptions,
FAQ answers, empty states, button labels. Not code comments — those are
engineering notes and follow `CLAUDE.md` instead (they are British-spelled and
explain *why*; user-facing copy is neither).
