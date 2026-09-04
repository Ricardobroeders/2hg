import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  OPTIONAL_DEADLINE_MS,
  cardImage,
  getCardByExactName,
  oracleText,
  type ScryfallCard,
} from "@/lib/scryfall";
import { resolveCardBySlug } from "@/lib/cards";
import { meetsIndexBar, prerenderSlugs } from "@/lib/corpus";
import { scoreCard } from "@/lib/twohg-score";
import { synergyFor } from "@/lib/synergy";
import { FORMATS } from "@/lib/team";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";
import { ScoreBadge, ScoreMeter } from "@/components/ScoreBadge";
import { AffiliateButtons } from "@/components/AffiliateButtons";
import { AddToTeam } from "@/components/AddToTeam";
import { CardTile } from "@/components/CardTile";
import { ManaCost, ManaText } from "@/components/ManaSymbols";

/**
 * Corpus cards get a prerendered head slice; everything else is ISR'd on first
 * request. `dynamicParams` is stated rather than left to default so nobody
 * "tidies" it away — turning it off would 404 every card outside the slice.
 */
export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams(): { slug: string }[] {
  return prerenderSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/cards/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  /**
   * A throw in here escapes the error boundary — `generateMetadata` runs
   * before the page renders, so a Scryfall timeout during it produced a bare
   * 500 with none of `error.tsx` on it. Swallowing lets the page body do the
   * throwing, where the boundary can catch it and offer a retry.
   *
   * `null` and "it failed" deliberately land in the same place: both mean we
   * have nothing to describe, and neither should be advertised to search.
   */
  const resolved = await resolveCardBySlug(slug).catch(() => null);
  if (!resolved) {
    return { title: "Card not found", robots: { index: false, follow: false } };
  }

  const { card, canonicalSlug } = resolved;
  const score = scoreCard(card);
  // Always canonicalise to the slug the card's own name produces, never to the
  // slug that was requested — many spellings reach the same card, and each one
  // would otherwise be its own indexable URL.
  const canonical = `/cards/${canonicalSlug}`;
  const image = cardImage(card, "normal");

  return {
    title: `${card.name} in Two-Headed Giant`,
    description: `${card.name} scores ${score.score}/100 in 2HG. ${score.summary}`,
    alternates: { canonical },
    /**
     * The thin-content guard, computed live so it holds for cards the corpus
     * hasn't seen yet. `meetsIndexBar` is the same predicate the sitemap uses.
     *
     * Keeping a page out of the sitemap isn't enough on its own: card pages are
     * linked from search results, the home shelves, the rule hubs and the
     * synergy rails, so a crawler finds them regardless. `follow` stays on so
     * those links keep carrying weight.
     */
    robots: meetsIndexBar(score.matched.length, card.edhrec_rank ?? null)
      ? undefined
      : { index: false, follow: true },
    openGraph: {
      type: "article",
      url: canonical,
      images: image ? [image] : [],
    },
  };
}

/**
 * Buy links with live prices.
 *
 * Split out and suspended because prices are the one thing on this page that
 * genuinely can't be committed — they move daily, so a stored price is a wrong
 * price. The fallback is the same component with the artifact's price-less
 * card, which already renders "View" instead of a figure, so the rail is
 * complete and clickable from the first paint and only the numbers arrive late.
 */
async function PricedBuyRail({ card }: { card: ScryfallCard }) {
  const live = await getCardByExactName(
    card.name,
    OPTIONAL_DEADLINE_MS,
  ).catch(() => null);
  return <AffiliateButtons card={live ?? card} />;
}

/**
 * The "plays well beside it" rail.
 *
 * Suspended because it issues the widest Scryfall query on the site and used
 * to be awaited before *any* of this page rendered — a suggestion rail at the
 * very bottom was holding up the card's name, its art and its 2HG Rating. It
 * now streams in beside content that has already painted, and returns nothing
 * at all if Scryfall is too slow.
 */
async function SynergyRail({ card }: { card: ScryfallCard }) {
  const synergy = await synergyFor(card);
  if (synergy.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Plays well beside it
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {synergy[0].because} — good candidates for your teammate&apos;s
            deck.
          </p>
        </div>
        {/* nofollow: this is the widest search URL on the site, and it was the
            doorway a crawler used to enumerate every Commander-legal card one
            paginated page at a time. Useful to a person, never to a bot. */}
        <Link
          href={`/cards?q=${encodeURIComponent(`id<=${card.color_identity.join("") || "c"}`)}`}
          rel="nofollow"
          className="shrink-0 text-sm text-emerald-400 hover:text-emerald-300"
        >
          More →
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {synergy.map(({ card: pick }) => (
          <CardTile key={pick.id} card={pick} />
        ))}
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        Suggestions are characteristic-based for now. Once teams submit
        pairings, this becomes a real co-occurrence score:{" "}
        <em>played in X% of teams whose partner deck runs {card.name}</em>.
      </p>
    </section>
  );
}

/** Holds the rail's space while it loads, so the page doesn't jump. */
function SynergySkeleton() {
  return (
    <section aria-hidden="true">
      <div className="h-6 w-48 rounded bg-white/5" />
      <div className="mt-2 h-4 w-72 rounded bg-white/5" />
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="aspect-[488/680] w-full rounded-xl bg-white/5 ring-1 ring-white/10"
          />
        ))}
      </div>
    </section>
  );
}

export default async function CardPage({ params }: PageProps<"/cards/[slug]">) {
  const { slug } = await params;
  const resolved = await resolveCardBySlug(slug);
  if (!resolved) notFound();

  // One card, one URL. A canonical tag alone leaves every lossy spelling live
  // and crawlable; a 308 collapses them — but only where the destination
  // provably resolves back here (see `resolveCardBySlug`).
  const { card, canonicalSlug } = resolved;
  if (resolved.canRedirect) permanentRedirect(`/cards/${canonicalSlug}`);

  const score = scoreCard(card);
  const image = cardImage(card, "normal");
  const ups = score.matched.filter((m) => m.impact === "up");
  const downs = score.matched.filter((m) => m.impact === "down");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Cards", path: "/cards" },
          { name: card.name, path: `/cards/${canonicalSlug}` },
        ])}
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Card art + buy rail */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={card.name}
              className="w-full rounded-2xl ring-1 ring-white/10"
            />
          )}

          <AddToTeam card={card} />

          <div>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Buy this card
            </h2>
            {/* Only an artifact card is missing prices. One resolved live has
                them already, and refetching would be a request for nothing. */}
            {resolved.fromArtifact ? (
              <Suspense fallback={<AffiliateButtons card={card} />}>
                <PricedBuyRail card={card} />
              </Suspense>
            ) : (
              <AffiliateButtons card={card} />
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-10">
          <header>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {card.name}
              </h1>
              <ScoreBadge score={score} size="lg" />
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 font-mono text-sm text-zinc-500">
              <span>{card.type_line}</span>
              {card.mana_cost && (
                <>
                  <span aria-hidden>·</span>
                  <ManaCost cost={card.mana_cost} size="lg" />
                </>
              )}
              <span aria-hidden>·</span>
              <span>{card.set_name}</span>
            </p>
          </header>

          {/* The differentiator: why this card is different here. */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-white">2HG Rating</h2>
              <p className="text-3xl font-bold tabular-nums text-emerald-400">
                {score.score}
                <span className="text-base font-normal text-zinc-600">/100</span>
              </p>
            </div>

            <p className="mt-1 text-sm text-zinc-400">{score.summary}</p>

            <div className="mt-5">
              <ScoreMeter score={score} />
            </div>

            {score.matched.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {[...ups, ...downs].map((m) => (
                  <li key={m.id} className="flex gap-3">
                    <span
                      className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                        m.impact === "up"
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-rose-400/15 text-rose-300"
                      }`}
                    >
                      {m.impact === "up" ? "+" : "−"}
                      {m.weight}
                    </span>
                    <div>
                      {/* Each matched rule links to its list. This is what
                          connects a card page to every other card that shares
                          its 2HG axis — and the crawl path in both directions. */}
                      <Link
                        href={`/lists/${m.id}`}
                        className="text-sm font-medium text-zinc-200 underline decoration-white/20 underline-offset-4 hover:text-white hover:decoration-white/50"
                      >
                        {m.label}
                      </Link>
                      <p className="mt-0.5 text-sm leading-relaxed text-zinc-400">
                        {m.reason}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-sm text-zinc-500">
                No 2HG-specific rules fire on this card — it plays much the same
                here as anywhere else.
              </p>
            )}

            <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-zinc-600">
              Ratings start at a neutral 50 and are adjusted by rules derived
              from 2HG&apos;s structure — shared {FORMATS.commander.startingLife}{" "}
              life, shared turns, two opponents. They&apos;ll be recalibrated against real play rates
              once teams start submitting decklists.
            </p>
          </section>

          {oracleText(card) && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Oracle text
              </h2>
              {/* leading-7 buys the inline symbols room; the default line
                  height crowds them against the row above. */}
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-300">
                <ManaText text={oracleText(card)} size="md" />
              </p>
            </section>
          )}

          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Legality
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {["standard", "pioneer", "modern", "legacy", "vintage", "commander"].map(
                (fmt) => {
                  const status = card.legalities[fmt];
                  return (
                    <span
                      key={fmt}
                      className={`rounded-md px-2.5 py-1 text-xs capitalize ring-1 ring-inset ${
                        status === "legal"
                          ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20"
                          : status === "banned"
                            ? "bg-rose-400/10 text-rose-300 ring-rose-400/20"
                            : "text-zinc-500 ring-white/10"
                      }`}
                    >
                      {fmt}
                    </span>
                  );
                },
              )}
            </div>
          </section>

          <Suspense fallback={<SynergySkeleton />}>
            <SynergyRail card={card} />
          </Suspense>

          <p className="text-xs text-zinc-600">
            <a
              href={card.scryfall_uri}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400"
            >
              View {card.name} on Scryfall ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
