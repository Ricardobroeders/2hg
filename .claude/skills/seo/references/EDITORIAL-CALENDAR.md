# Editorial calendar

The one recurring, low-competition, high-intent keyword we have.

## Why this works

**Two-Headed Giant Commander Night** is an official WPN promo programme that has
run monthly since June 2025, scheduled set by set. People search
`two headed giant commander night [set]` in the weeks around each window, and
the only thing ranking is WotC's own event page — which is thin, and which does
not tell anyone what to actually build.

The pattern is: **publish at spoiler season, before the event window opens.**
A page that goes live after the window has started has missed the search.

## Known windows

| Set | Set release | 2HG Commander Night | Publish by |
| --- | --- | --- | --- |
| Edge of Eternities | Jul 2026 | from ~Jul 2026 | passed |
| Marvel Super Heroes | — | Jun 26 – Aug 6, 2026 | passed |
| **The Hobbit** | Aug 14, 2026 | **Aug 14 – Sep 24, 2026** | **window open now** |
| Reality Fracture | Oct 2, 2026 | from ~Oct 2026 | mid-Sep 2026 |
| Star Trek | late 2026 | from ~late 2026 | ~3 weeks pre-release |
| Nauctis: The Sunken Realm | Feb 5, 2027 | from ~Feb 2027 | mid-Jan 2027 |
| Kamigawa: Titanbreach | Jun 4, 2027 | from ~Jun 2027 | mid-May 2027 |
| Zhalfir | Oct 1, 2027 | from ~Oct 2027 | mid-Sep 2027 |

Dates verified against `wpn.wizards.com` on 2026-08-31; the WPN event pages are
the authority and carry the exact window per set. Re-check before publishing.

## Page shape (not yet built)

Model the data on `src/lib/team.ts`: a small hand-maintained file of
`{ set, slug, window, promo, notableCards }`, one route per set, static via
`generateStaticParams`. What each page has to answer, in order:

1. When is it, and what is the promo.
2. The format rules, one screen — 60 shared life, own 100-card deck, no unified
   deck rule. Pull from `FORMATS.commander`, do not retype.
3. What is worth building from *this* set for 2HG — the differentiator, and
   where the 2HG Rating earns its place. Link the cards.
4. Link to `/rules` and the relevant `/lists/[rule]` hubs.

Old set pages keep their URLs and stay indexed. They accumulate.

## The other content track

`/rules` is the authority page. It already derives from the data the builder
enforces, so the prose cannot drift from the rules we validate. Expand it to
answer what people actually search: does the unified deck rule apply (no), how
much life (60), commander damage (21), poison (15).

## Not doing

General "ultimate guide to Two-Headed Giant" articles. Draftsim, the judge blog
and MTG Wiki hold those terms with authority we cannot match, and a fourth guide
adds nothing. Community primers wait until there is a community to write them —
they are a moat, not a launch engine.
