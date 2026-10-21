import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RULES_FORMATS, rulesFormat } from "@/content/rules";
import { JsonLd, articleSchema, breadcrumbSchema, faqSchema } from "@/components/JsonLd";
import { openGraphFor } from "@/lib/site";
import { FaqAccordion, SourceList } from "@/components/FaqAccordion";
import { RulesFacts, RulesSections } from "@/components/RulesBlocks";

/** Three known formats; anything else is genuinely not a page. */
export const dynamicParams = false;

export function generateStaticParams(): { format: string }[] {
  return RULES_FORMATS.map((entry) => ({ format: entry.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/rules/[format]">): Promise<Metadata> {
  const { format } = await params;
  const entry = rulesFormat(format);
  if (!entry) return { title: "Not found", robots: { index: false, follow: false } };

  const path = `/rules/${entry.slug}`;
  return {
    title: entry.content.title,
    description: entry.content.description,
    alternates: { canonical: path },
    openGraph: openGraphFor({
      path,
      title: entry.content.title,
      description: entry.content.description,
    }),
  };
}

/**
 * One 2HG variant in depth. The overview at `/rules` carries what every
 * variant shares; these pages carry only what is specific to theirs, and link
 * back rather than re-explaining the team turn three times.
 */
export default async function RulesFormatPage({
  params,
}: PageProps<"/rules/[format]">) {
  const { format } = await params;
  const entry = rulesFormat(format);
  if (!entry) notFound();

  const { content } = entry;
  const siblings = RULES_FORMATS.filter((other) => other.slug !== entry.slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd
        data={articleSchema({
          path: `/rules/${entry.slug}`,
          headline: content.heading,
          description: content.description,
          datePublished: content.publishedAt,
          dateModified: content.researchedAt,
          sources: content.sources,
        })}
      />
      <JsonLd data={faqSchema(content.faq)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Rules", path: "/rules" },
          { name: entry.label, path: `/rules/${entry.slug}` },
        ])}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <Link href="/rules" className="hover:text-zinc-300">
          Rules
        </Link>
        <span aria-hidden className="mx-1.5 text-zinc-700">/</span>
        <span className="text-zinc-400">{entry.label}</span>
      </nav>

      <header className="mt-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/80">
          {content.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {content.heading}
        </h1>
        <div className="mt-4 space-y-3">
          {content.intro.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-zinc-400">
              {paragraph}
            </p>
          ))}
        </div>
      </header>

      <RulesFacts facts={content.facts} />

      <RulesSections sections={content.sections} />

      {content.related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Where to go from here
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {content.related.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block h-full rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/25 hover:bg-white/[0.04]"
                >
                  <span className="text-sm font-medium text-white">{link.label}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-zinc-400">
                    {link.note}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <FaqAccordion entries={content.faq} />

      <SourceList
        sources={content.sources}
        note="Rules summarised from Wizards of the Coast's Comprehensive Rules, Magic Tournament Rules and event pages. Where a store runs house rules, theirs win."
      />

      <section className="mt-12 border-t border-white/10 pt-8">
        <h2 className="text-sm font-medium text-zinc-400">Other 2HG formats</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/rules"
            className="rounded-full px-3 py-1.5 text-xs text-zinc-400 ring-1 ring-inset ring-white/10 transition hover:bg-white/5 hover:text-white"
          >
            All 2HG rules
          </Link>
          {siblings.map((other) => (
            <Link
              key={other.slug}
              href={`/rules/${other.slug}`}
              className="rounded-full px-3 py-1.5 text-xs text-zinc-400 ring-1 ring-inset ring-white/10 transition hover:bg-white/5 hover:text-white"
            >
              {other.label} rules
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
