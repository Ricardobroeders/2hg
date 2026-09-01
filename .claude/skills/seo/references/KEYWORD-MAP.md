# Keyword map

Research done 2026-09-01. Re-check the "who ranks" column before committing to
a term — it is the part that goes stale.

## The four tiers

| Tier | Shape | Who ranks today | Verdict |
| --- | --- | --- | --- |
| **Head** | "two headed giant rules", "2hg commander", "two headed giant commander" | WotC's own format page, Draftsim's "Ultimate Guide", `blogs.magicjudges.org/2hg` FAQ, MTG Wiki | **Contested.** High-authority incumbents. Compete with `/rules` on precision, not with another guide. |
| **Set-timed** | "two headed giant commander night [set]" | Only WotC's own thin WPN event page | **Weak — take it.** Recurring monthly, calendar known in advance. |
| **Card long tail** | "[card] in two headed giant", "is [card] good in 2hg" | Nothing | **Open.** ~5,600 genuinely differentiated pages. The main engine. |
| **List / class** | "best sweepers two headed giant", "2hg extra turn cards" | Two disjoint sets, neither on the query: generic Commander class listicles that never say 2HG (Draftsim, TheGamer, krakenthemeta), and 2HG guides with no card lists (Draftsim's guide, Face to Face's primer). Plus dead MTGSalvation/TappedOut threads and Archidekt user decks. | **Open.** 18 hub pages at `/lists/[rule]`. |
| **Pairing** | "best 2HG partner for [commander]" | Nothing | **Blocked** — needs the synergy engine. Do not fake it. |

## Competitive notes

**EDHREC** covers 2HG editorially only — articles and deck techs tagged `2hg` /
`two-headed-giant`. No 2HG data pages, no 2HG recommendations engine. Their
authority beats ours on any article we write; their gap is exactly our product.

**Moxfield** is ~70% direct / ~16% search. Its user deck pages are largely thin
and duplicate. This is why UGC deck pages are not our launch engine — a fact
worth re-reading before anyone proposes making them one.

**Archidekt / TappedOut** hold scattered user-made "2HG pairing ideas" decks.
Individual decks, no editorial, no aggregation.

## Hub research log

One row per `/lists/[rule]` hub whose long-form content has been researched.

| slug | researched | primary query | who ranks |
| --- | --- | --- | --- |
| `sweeper` | 2026-09-01 | best sweepers two headed giant | Nobody on the intersection. Board-wipe listicles omit 2HG entirely; 2HG guides omit board wipes. Face to Face's 2HG primer ranks and states 30 life, which is the Sealed/Constructed number. |

## Localisation

English only, for Europe and the US. **No hreflang, no i18n routing** — one
canonical set of URLs. The regional difference is commercial, not linguistic,
and is already handled by `src/lib/affiliates.ts` (Cardmarket in EUR for the EU,
TCGplayer and Card Kingdom in USD for the US).
