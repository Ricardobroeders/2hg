import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCardsByNamesCached } from "@/lib/cards";
import { cardsForRule, CORPUS_UPDATED_AT } from "@/lib/corpus";
import { hubById, listHubs, relatedHubs } from "@/lib/lists";
import { toSlug } from "@/lib/slug";
import { CardTile } from "@/components/CardTile";
import { JsonLd, breadcrumbSchema, collectionSchema, faqSchema } from "@/components/JsonLd";

/** 18 known rules; anything else is genuinely not a page. */
export const dynamicParams = false;
export const revalidate = 86400;

/** How many cards get full art. 60 ≤ Scryfall's 75-card collection limit, so one request. */
const SHOWN = 60;
/** The rest are plain links — no extra fetches, and the crawl path into the tail. */
const LISTED = 240;

export function generateStaticParams(): { rule: string }[] {
  return listHubs().map((hub) => ({ rule: hub.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/lists/[rule]">): Promise<Metadata> {
  const { rule } = await params;
  const hub = hubById(rule);
  if (!hub) return { title: "List not found", robots: { index: false, follow: false } };

  return {
    title: hub.title,
    description: hub.description,
    alternates: { canonical: `/lists/${hub.id}` },
    // A list of six cards isn't worth a URL of its own, but its links still count.
    robots: hub.indexable ? undefined : { index: false, follow: true },
    openGraph: {
      url: `/lists/${hub.id}`,
      title: hub.title,
      description: hub.description,
    },
  };
}

export default async function ListPage({ params }: PageProps<"/lists/[rule]">) {
  const { rule } = await params;
  const hub = hubById(rule);
  if (!hub) notFound();

  const ranked = cardsForRule(hub.id);
  const featured = ranked.slice(0, SHOWN);

  // One POST for the whole grid. Scores render live from these, not from the
  // corpus — the corpus only decided which cards belong here.
  const hydrated = await getCardsByNamesCached(featured.map((card) => card.name));
  const byName = new Map(hydrated.map((card) => [card.name, card]));
  const cards = featured
    .map((card) => byName.get(card.name))
    .filter((card) => card != null);

  // Exactly what the grid renders, in order — featured minus anything that
  // failed to hydrate. This is what the ItemList enumerates, so the markup and
  // the DOM cannot disagree.
  const listed = featured
    .filter((card) => byName.has(card.name))
    .map((card) => ({ name: card.name, path: `/cards/${card.slug}` }));

  const rest = ranked.slice(SHOWN, LISTED);
  const siblings = relatedHubs(hub);

  const { content } = hub;
  // Before any hub had an authored intro, the description *was* the opening
  // paragraph. Keeping that as the fallback is what lets a content-less hub
  // render exactly as it did.
  const intro = content.intro ?? [hub.description];
  const sections = content.sections ?? [];
  const faq = content.faq ?? [];
  const sources = content.sources ?? [];

  // ISO rather than toLocaleDateString: the latter differs between the build
  // machine's locale and the runtime's, which shows up as an ISR mismatch.
  const corpusDate = CORPUS_UPDATED_AT.toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Lists", path: "/lists" },
          { name: hub.heading, path: `/lists/${hub.id}` },
        ])}
      />
      {/*
        FAQPage ships for AI answer engines, never for a rich result. Google
        restricted those to government and health sites in August 2023 and
        deprecated them outright on 7 May 2026, so this will not render anything
        in Google Search — but the markup stays valid and Bingbot, PerplexityBot
        and the RAG crawlers still read it. It is cheap to keep because it
        renders from the same array as the visible answers below, so the markup
        cannot drift from the page. Indexable hubs only: marking up a page we
        are asking Google not to index is noise.
      */}
      {hub.indexable && faq.length > 0 && <JsonLd data={faqSchema(faq)} />}
      {hub.indexable && listed.length > 0 && (
        <JsonLd
          data={collectionSchema({
            name: hub.heading,
            description: hub.description,
            path: `/lists/${hub.id}`,
            items: listed,
          })}
        />
      )}

      <header className="max-w-3xl">
        <Link
          href="/lists"
          className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/80 hover:text-emerald-300"
        >
          Card lists
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {hub.heading}
        </h1>
        {intro.map((paragraph, i) => (
          <p
            key={paragraph}
            className={`${i === 0 ? "mt-4" : "mt-3"} text-base leading-relaxed text-zinc-400`}
          >
            {paragraph}
          </p>
        ))}

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-baseline gap-3">
            <span
              className={`text-sm font-semibold tabular-nums ${
                hub.rule.impact === "up" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {hub.rule.impact === "up" ? "+" : "−"}
              {hub.rule.weight}
            </span>
            <span className="text-sm font-medium text-white">{hub.rule.label}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {hub.rule.reason}
          </p>
          <p className="mt-3 text-xs text-zinc-600">
            {hub.cardCount.toLocaleString()} cards match this rule.{" "}
            <Link href="/rules" className="underline underline-offset-2 hover:text-zinc-400">
              How the format works
            </Link>
          </p>
          {/*
            Describes the card data, never the article. A visible timestamp that
            moves when nothing changed is the same bad signal the sitemap
            comment warns about.
          */}
          <p className="mt-1.5 text-xs text-zinc-600">
            Card data from Scryfall, rebuilt <time dateTime={corpusDate}>{corpusDate}</time>.
          </p>
        </div>
      </header>

      <section className="mt-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {cards.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      </section>

      {rest.length > 0 && (
        <section className="mt-12">
          {/*
            The generated `More cards that {rule.label}` read as "More cards
            that board sweeper" for about half the rules. The authored override
            carries the keyword; the default is at least grammatical for all 18.
          */}
          <h2 className="text-lg font-semibold text-white">
            {content.tailHeading ?? "More cards in this list"}
          </h2>
          <ul className="mt-4 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((card) => (
              <li key={card.slug} className="flex items-baseline justify-between gap-3 border-b border-white/5 py-1.5">
                <Link
                  href={`/cards/${card.slug}`}
                  className="truncate text-sm text-zinc-300 hover:text-white"
                >
                  {card.name}
                </Link>
                <span className="shrink-0 text-xs tabular-nums text-zinc-600">
                  {card.score}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/*
        Prose sits below the grid on purpose. The query is "best sweepers two
        headed giant" and the answer is the sweepers — the explanation is what
        the reader wants second, not what they should have to scroll past.
      */}
      {sections.length > 0 && (
        <div className="mt-14 max-w-3xl space-y-10">
          {sections.map((section) => (
            <section key={section.heading} id={toSlug(section.heading)}>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 text-sm leading-relaxed text-zinc-400"
                >
                  {paragraph}
                </p>
              ))}

              {section.subsections?.map((sub) => (
                <div key={sub.heading} className="mt-6">
                  <h3 className="text-base font-semibold text-white">{sub.heading}</h3>
                  {sub.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="mt-2 text-sm leading-relaxed text-zinc-400"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ))}

              {section.cards && section.cards.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {section.cards.map((name) => (
                    <Link
                      key={name}
                      href={`/cards/${toSlug(name)}`}
                      className="rounded-full px-3 py-1 text-xs text-zinc-300 ring-1 ring-inset ring-white/15 transition hover:bg-white/5 hover:text-white"
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {faq.length > 0 && (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Common questions
          </h2>
          <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {faq.map((entry, i) => (
              <details
                key={entry.title}
                /*
                  Native <details>: no client component, no JS, and the answer
                  ships in the HTML either way. The first one stays open —
                  collapsed content is indexed, but Google is on record that
                  visible text carries more weight than content behind an
                  interaction, so the page keeps one answer in plain view.
                */
                open={i === 0}
                className="group py-3"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-white transition hover:text-emerald-300 [&::-webkit-details-marker]:hidden">
                  {entry.title}
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-[240ms] group-open:rotate-180"
                  >
                    <path
                      d="m6 8 4 4 4-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <p className="mt-2 pr-8 text-sm leading-relaxed text-zinc-400">
                  {entry.body}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {sources.length > 0 && (
        <section className="mt-12 max-w-3xl border-t border-white/10 pt-8">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Sources
          </h2>
          <ul className="mt-3 space-y-2">
            {sources.map((source) => (
              <li key={source.href}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {siblings.length > 0 && (
        <section className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-sm font-medium text-zinc-400">Related lists</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {siblings.map((sibling) => (
              <Link
                key={sibling.id}
                href={`/lists/${sibling.id}`}
                className="rounded-full px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-inset ring-white/15 transition hover:bg-white/5 hover:text-white"
              >
                {sibling.heading}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
