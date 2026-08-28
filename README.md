# Two-Headed Giant

A community card database and team deckbuilder for Magic: The Gathering's
**Two-Headed Giant** format.

2HG changes what cards are worth — a team shares one 30-life pool, shares a
turn, and faces two opponents — and no existing database models that. This one
does.

## Status: MVP (no database yet)

Everything runs off the Scryfall API plus browser storage. There is **no
Supabase project wired up**, deliberately — this build exists to settle the UX
and the format logic first.

- Card data: fetched live from Scryfall, cached in the Next.js data cache.
- Your team pairing: stored in `localStorage` only. Not shared, not synced.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

Optional — affiliate partner IDs. Links work without them, they just don't earn:

```bash
cp .env.example .env.local
```

## What's here

| Route | What it does |
| --- | --- |
| `/` | Shelves of cards whose value shifts in 2HG, driven by live Scryfall queries |
| `/cards?q=` | Full Scryfall search syntax, re-ranked by 2HG Rating |
| `/cards/[slug]` | Card page: rating breakdown, oracle text, synergy picks, buy links |
| `/team` | The team builder — two decks validated as one unit |

### The 2HG Rating

[`src/lib/twohg-score.ts`](src/lib/twohg-score.ts) scores a card 0–100 from a
neutral baseline of 50, applying rules derived from the format's structure.
Every rule carries the reason it fires, and the card page shows the full
breakdown — the score is never a black box.

| Card | Score | Why |
| --- | --- | --- |
| Gray Merchant of Asphodel | 89 | Drain resolves against each opponent, off one shared life total |
| Time Warp | 70 | Teammates share a turn, so an extra turn is two players' turn |
| Rhystic Study | 64 | "Whenever an opponent…" fires for two players |
| Howling Mine | 38 | Symmetrical draw feeds two opponents and one teammate |

These weights are hand-tuned heuristics. They're meant to be replaced by
observed play rates once teams start submitting decklists — the rule list is
the scaffolding, not the destination.

### The unified deck rule

[`src/lib/team.ts`](src/lib/team.ts) validates Deck A and Deck B
*simultaneously*. A team may run four copies of a card across both decks
combined — not four each — and 2HG Commander makes that one. The builder also
handles the exemptions (basic lands, "any number of cards named…", Seven
Dwarves) and flags banned and out-of-pool cards.

### Monetization surfaces

- [`src/lib/affiliates.ts`](src/lib/affiliates.ts) is the single place partner
  IDs live. Adding a marketplace is a one-line change.
- `AffiliateButtons` is a slot component — drop it on any surface.
- **Buy the whole team**: `massEntryLink()` sends both decklists to one
  TCGplayer cart in a single click, with a running price estimate.

## Where Supabase slots in

The seams are already cut, so wiring the database up shouldn't require
reshaping the UI:

- [`src/lib/team-store.tsx`](src/lib/team-store.tsx) — the provider's API
  (`addCard`, `setQuantity`, …) is already shaped like the server actions that
  will replace it. Swap the localStorage backend; components don't change.
- [`src/lib/synergy.ts`](src/lib/synergy.ts) — currently approximates "plays
  well beside it" from card characteristics. The page shape is already correct
  for the real co-occurrence query: *played in X% of teams whose partner deck
  runs Y*.
- Card data should move to a `cards` table seeded from Scryfall's bulk data
  export rather than the live API, so search runs in Postgres.

## Notes

Card data and images courtesy of [Scryfall](https://scryfall.com). Not
affiliated with or endorsed by Wizards of the Coast.
