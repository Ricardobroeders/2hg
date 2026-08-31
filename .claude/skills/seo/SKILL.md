---
name: seo
description: 2HG's SEO strategy, page architecture and content conventions. Use when asked to "add a page", "write an article", "improve SEO", "add metadata", "update the sitemap", "add structured data", or whenever creating a new indexable route.
---

# 2HG SEO

## The strategy in one paragraph

We are not going to out-rank EDHREC, Draftsim or the judge blog on general
Two-Headed Giant articles — they have the authority and they already publish
2HG content. What none of them have is **per-card and per-commander 2HG data**,
because that needs a 2HG-specific rating engine and pairing data. That is the
moat. So the engine is programmatic aggregates that work at zero users, not
user-generated deck pages. (Moxfield, the obvious model, takes ~70% of its
traffic direct and only ~16% from search — its deck pages are not what ranks.)

## Rules of the road

These are the ones most likely to be broken by well-meaning future work.

### 1. Thin content never enters the sitemap — and carries `noindex`

A page is advertised only if it says something unique, and the bar is higher
than it first looks. Of ~30,800 Commander-legal cards, 5,620 trip a 2HG rule at
all — but those 5,620 pages are built from only **121 distinct rule-prose
templates**, 86% of them match exactly one rule, and 931 share the identical
`cheap-interaction` paragraph. Strip the shared prose and what's left is
Scryfall's own text, which a dozen sites already publish.

So the bar is `meetsIndexBar` in `src/lib/corpus.ts`: **two or more matched
rules, or an EDHREC rank of 2,500 or better** — about 1,300 cards. Two rules is
where the interaction between axes becomes ours rather than a template; a high
rank earns a page on different grounds, being the only 2HG answer for something
people actually search.

Raise it back toward "any matched rule" only once card pages carry genuinely
per-card prose — computed format math, not a shared paragraph.

Sitemap exclusion alone is **not enough** — those pages are linked from search
results, home shelves and synergy rails, so a crawler finds them regardless.
They need `robots: { index: false, follow: true }` in `generateMetadata` too.
`follow` stays on so their links still carry weight.

The same test applies to any new page type: if you cannot say what is on it that
is not on ten thousand other pages, do not advertise it.

### 2. Never publish fabricated aggregates

No "best partner for X" page until the synergy engine exists. There are four
observed commander pairings in the database; a programmatic page implying we
know the best partner for Atraxa would be invented, and mass-produced invented
aggregates are what the helpful-content system demotes.

Heuristics are fine — they are explainable and labelled as heuristics, per the
`CLAUDE.md` invariant. Measured claims must actually be measured.

### 3. Get the format facts right, everywhere

Our whole differentiation is being correct about 2HG. Two specific traps, both
of which have already shipped wrong once:

- **2HG Commander is 60 life.** 30 is the Constructed number. Derive from
  `FORMATS.commander.startingLife`, never retype it.
- **There is no unified deck rule in 2HG Commander.** Teammates may both run the
  same card. `FORMATS.commander.maxCombinedCopies` is `null` and says so.

`src/lib/team.ts` is the single source of truth. Change the data, not the prose.

### 4. One card, one URL

`toSlug`/`fromSlug` are lossy — many spellings reach the same card. Card pages
resolve through `resolveCardBySlug` (`src/lib/cards.ts`), which 308s to the
canonical slug **only when the destination provably resolves back to the same
card**. A naive "slug differs, so redirect" can bounce a crawler between two
308s forever, and Google reads a redirect loop as a dead page.

Accents are folded, not stripped: `Séance` → `seance`, because `s-ance` was a
404 ("Too many cards match ambiguous name").

### 5. Canonicals go on pages, never on the root layout

Next inherits metadata fields into any page that does not set its own. A
`alternates.canonical` in `src/app/layout.tsx` would tell Google every page on
the site is the home page. Same for `openGraph.url`.

### 6. Absolute URLs come from one place

`src/lib/site.ts`. `SITE_URL` resolves from the `SITE_URL` env var, then
Vercel's production alias, then localhost. It deliberately does **not** hardcode
a domain: a canonical naming a host that does not resolve is worse than no
canonical. Sitemap entries must be absolute — `metadataBase` is not applied to
sitemap routes.

### 7. Previews are never indexed

`src/app/robots.ts` returns a blanket `Disallow: /` unless
`VERCEL_ENV === "production"`. Vercel gives every branch a public URL, and an
indexed preview competes with production for the same content.

## The corpus

`src/data/card-corpus.json` is a committed artifact built by
`npm run seo:corpus` from Scryfall's bulk file (one request, ~20s). It holds
every Commander-legal card that trips at least one 2HG rule.

It is an **index, never a cache**. Its scores decide which URLs we advertise and
how lists are ordered; nothing user-facing renders them — card pages call
`scoreCard()` on live Scryfall data. So a stale corpus can misfile a card in a
hub; it can never show anyone a stale number.

**Editing `RULES` in `src/lib/twohg-score.ts` means rerunning `npm run seo:corpus`
in the same change.** The diff is the review artifact for the weight change.
`npm run seo:corpus:check` exits non-zero when Scryfall has newer data.

## Where things live

| Concern | File |
| --- | --- |
| Site URL, production detection | `src/lib/site.ts` |
| Crawl directives | `src/app/robots.ts` |
| Sitemap | `src/app/sitemap.ts` |
| Corpus reader | `src/lib/corpus.ts` |
| Card resolution + canonical slug | `src/lib/cards.ts` |
| Rule hub copy | `src/lib/lists.ts` |
| Structured data | `src/components/JsonLd.tsx` |
| Format facts | `src/lib/team.ts` |

## Adding a new indexable route — checklist

- [ ] `alternates.canonical` set on the page (never the layout)
- [ ] `description` written for the query, not for us
- [ ] `openGraph.url` matching the canonical
- [ ] `noindex` for any thin or infinitely-parameterised variant
- [ ] `BreadcrumbList` JSON-LD if nested
- [ ] Added to `src/app/sitemap.ts` if it passes the thin-content test
- [ ] Linked from somewhere crawlable — a page nothing links to is not a page
- [ ] `npx tsc --noEmit` and `npx eslint src` clean, `npm run build` passes

## References

- [Keyword map](references/KEYWORD-MAP.md) — the tiers, who currently ranks
- [Page types](references/PAGE-TYPES.md) — URL shapes, metadata, sitemap eligibility
- [Editorial calendar](references/EDITORIAL-CALENDAR.md) — the WPN set cycle
