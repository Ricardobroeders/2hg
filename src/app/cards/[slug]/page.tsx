import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { cardImage, oracleText } from "@/lib/scryfall";
import { resolveCardBySlug } from "@/lib/cards";
import { prerenderSlugs } from "@/lib/corpus";
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
  const resolved = await resolveCardBySlug(slug);
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
     * The thin-content guard.
     *
     * No matched rules means this page says nothing about 2HG that Scryfall
     * doesn't already say better — roughly four in five Commander-legal cards.
     * Keeping them out of the sitemap isn't enough on its own: they're linked
     * from search results, the home shelves and the synergy rails, so a crawler
     * finds them anyway. `follow` stays on so those links still carry weight.
     */
    robots:
      score.matched.length === 0 ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      url: canonical,
      images: image ? [image] : [],
    },
  };
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
  const synergy = await synergyFor(card);
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
            <AffiliateButtons card={card} />
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

          {synergy.length > 0 && (
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
                <Link
                  href={`/cards?q=${encodeURIComponent(`id<=${card.color_identity.join("") || "c"}`)}`}
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
          )}

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
