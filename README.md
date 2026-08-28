# Two-Headed Giant

A card database and team-pairing tool for Magic: The Gathering's **Two-Headed
Giant** format.

2HG changes what a card is worth in ways no existing MTG database models: a
team shares one life total, shares a turn, and faces two opponents. Cards that
read "each opponent" resolve twice. Extra turns are extra turns for two
players. Symmetrical card draw feeds two opponents and only one teammate.

Nothing indexes any of that. This does.

## Status: MVP, no database yet

Everything runs off the Scryfall API plus browser storage. There is
deliberately **no Supabase project wired up** — this build exists to settle the
format logic and the UX before any schema work.

- **Card data** — fetched from Scryfall through a cached client.
- **Your team** — stored in `localStorage` only. Not synced, not shared.

```bash
npm install
npm run dev          # http://localhost:3000
```

Affiliate partner IDs are optional; links work without them, they just don't
earn.

```bash
cp .env.example .env.local
```

## Formats

The primary target is **2HG Commander** — an official Wizards Commander Play
Event, running monthly at WPN stores, and the only 2HG variant where people
build decks at home.

| | 2HG Commander | 2HG Constructed |
| --- | --- | --- |
| Deck size | 100, singleton | 60+ |
| Shared life | 60 | 30 |
| Poison to lose | 15 | 15 |
| Commander damage | 21 | — |
| Combined copy limit | **none** | 4 across both decks |

The rule most often gotten wrong: **2HG Commander has no unified deck rule.**
Wizards' event rules say you may bring any legal Commander deck, so teammates
may run the same card — the singleton rule applies to each deck, never across
the team. Unified Deck Construction is a *Constructed* rule, and there it's
strict: four copies across both decks combined, not four each.

Sealed and Draft are documented on `/rules` but aren't builder formats — the
pool is opened at the event, so there's nothing to build at home.

[`src/lib/team.ts`](src/lib/team.ts) is the single source of truth for all of
this, and `/rules` renders from it. Change the data, not the prose.

## What's here

| Route | What it does |
| --- | --- |
| `/` | Shelves of cards whose value shifts in 2HG, from live Scryfall queries |
| `/cards?q=` | Full Scryfall search syntax, re-ranked by 2HG Rating |
| `/cards/[slug]` | Rating breakdown, oracle text, synergy picks, buy links |
| `/import` | Paste a decklist — the fast path in, since decks live elsewhere |
| `/team` | The pairing: two decks side by side |
| `/rules` | Format reference, rendered from `team.ts` |

### The 2HG Rating

[`src/lib/twohg-score.ts`](src/lib/twohg-score.ts) scores a card 0–100 from a
neutral baseline of 50, applying rules derived from the format's structure —
two opponents, one shared life total, one shared turn, a teammate whose
permanents you don't control.

| Card | Score | Why |
| --- | --- | --- |
| Gray Merchant of Asphodel | 89 | Drain resolves against each opponent, off one shared pool |
| Time Warp | 70 | Teammates share a turn, so an extra turn is two players' turn |
| Rhystic Study | 64 | "Whenever an opponent…" fires for two players |
| Howling Mine | 38 | Symmetrical draw feeds two opponents and one teammate |

Every rule carries the reason it fires, and card pages show the full
breakdown — the score is never a black box. A rule that can't state its 2HG
reason in one sentence doesn't ship.

### Monetization

[`src/lib/affiliates.ts`](src/lib/affiliates.ts) is the only place partner IDs
live; adding a marketplace is a one-line change there. `AffiliateButtons` is a
slot component that drops onto any surface, and `massEntryLink()` sends both
decklists to a single TCGplayer cart with a running price estimate.

## Known limitations

These are honest gaps, not oversights:

- **Scores are heuristics over oracle text, not measured data.** They're
  hand-tuned weights meant to be recalibrated against real play rates once
  teams start submitting pairings. Don't read them as statistics.
- **The scorer matches substrings**, so it's blind to board state and to
  anything a card's text doesn't say. It also ignores mana value almost
  entirely — a nine-mana "each opponent" card scores like a three-mana one.
- **`"each other player"` is currently scored as pure upside**, which is wrong:
  that phrasing includes your teammate. It overrates Grave Pact and badly
  misreads cards keyed to other players' turns (Seedborn Muse scores *Strong*
  when a shared turn structure makes it weak).
- **Synergy picks are characteristic-based.** [`src/lib/synergy.ts`](src/lib/synergy.ts)
  approximates "plays well beside it" from colours and shared rules. The page
  shape is already correct for the real query — *played in X% of teams whose
  partner deck runs Y* — but that needs submitted decklists.
- **Pairing analysis isn't built yet.** Role coverage, curve collision and
  cross-deck anti-synergy are the intended differentiators and don't exist in
  code.

## Where the database slots in

The seams are cut so wiring Supabase up shouldn't reshape the UI:

- [`src/lib/team-store.tsx`](src/lib/team-store.tsx) — the provider's API
  (`addCard`, `setQuantity`, …) is already shaped like the server actions that
  will replace it. Swap the storage backend; components don't change.
- Card data should move to a `cards` table seeded from Scryfall's bulk export
  rather than the live API, so search runs in Postgres.
- Submitted pairings are the data asset everything above depends on.

## Conventions

Next.js 16 App Router, React 19, TypeScript, Tailwind v4, no component
library. Server Components by default; `"use client"` only where there's real
interaction. Canonical Scryfall card names are the join key everywhere — decks
store names, never IDs.

Scryfall attribution is non-optional and stays in the footer; all card data
goes through the cached client in [`src/lib/scryfall.ts`](src/lib/scryfall.ts),
never a direct `fetch`.

---

Card data and images courtesy of [Scryfall](https://scryfall.com). Not
affiliated with or endorsed by Wizards of the Coast.
