# Page types

Every indexable route, what makes it unique, and whether it is advertised.

| Route | Render | Canonical | JSON-LD | In sitemap |
| --- | --- | --- | --- | --- |
| `/` | Static, 6h ISR | `/` | `WebSite` + `SearchAction` | Yes |
| `/cards` | Dynamic (searchParams) | `/cards` when unfiltered, else none | — | Yes (bare only) |
| `/cards/[slug]` | ISR 24h (no prerender by default) | `/cards/{toSlug(name)}` | `BreadcrumbList` | Only if it clears `meetsIndexBar` (~1,300) |
| `/lists` | Static | `/lists` | `BreadcrumbList` | Yes |
| `/lists/[rule]` | 18 prerendered, ISR 24h | `/lists/{id}` | `BreadcrumbList` | Only if ≥10 cards |
| `/rules` | Static | `/rules` | `FAQPage` + `BreadcrumbList` | Yes |
| `/deck-builder` | Static shell | `/deck-builder` | — | Yes |
| `/privacy`, `/terms` | Static | self | — | Yes |
| `/t/[slug]`, `/d/[slug]` | Dynamic | self | — | **No** — see below |
| `/account`, `/auth/*` | Dynamic | — | — | No, `noindex` |

## Shared pairings are indexable but not advertised

`/t` and `/d` stay public and crawlable — `CLAUDE.md` is explicit that gating
the share link is a regression, and that link is the only way this site spreads.

They are **not in the sitemap**, and that is a deliberate privacy call:
`teams.isPublic` defaults to `true` and nothing in the codebase ever sets it to
`false`, so a sitemap would publish a directory of every pairing anyone has ever
saved. The slug's unguessability is currently the only access control, and the
privacy page tells people an anonymous pairing "is not linked to you".

To include them, two things must land first: an explicit "list this publicly"
toggle that actually sets `isPublic`, and a card-count floor so scratchpads stay
out. The excluding comment in `src/app/sitemap.ts` says the same.

## `/cards` filter space

Query × six colour chips × four sorts × page is unbounded, and every combination
is the same cards reordered. The bare hub is indexed; every filtered variant
gets `noindex, follow` so its links still pass through. It is deliberately
**not** blocked in `robots.txt` — blocking would stop Googlebot seeing the
`noindex` and following the card links, which are a real discovery path.

## Title and description patterns

- Card: `{name} in Two-Headed Giant` / `{name} scores {n}/100 in 2HG. {summary}`
- Hub: query-shaped, e.g. *Best board sweepers in Two-Headed Giant*
- Everything else: title is a noun phrase, description answers the query

## What we deliberately do not mark up

No `Product`, `Review` or `AggregateRating` on card pages. We do not sell cards;
the 2HG Rating is one deterministic heuristic, not an aggregate of independent
ratings; and prices are ISR-cached and would be stale. Marking a heuristic as a
review is the machine-readable version of presenting it as measured, which
`CLAUDE.md` forbids in prose — and it risks a site-wide manual action for a rich
result Google mostly stopped showing anyway.

Revisit only when real submitted pairings give genuine aggregate data.

## Two honest caveats about the structured data we do ship

- **`FAQPage`**: Google restricted FAQ rich results in August 2023 to
  well-known government and health sites. This will not render an accordion for
  us, ever. It ships because it makes the six format facts machine-extractable
  for AI answer engines, not for a rich result.
- **`SearchAction`**: the sitelinks searchbox rich result was retired in
  November 2024. Same reasoning — it is for non-Google consumers now.

Do not let anyone "fix" the absence of these rich results.
