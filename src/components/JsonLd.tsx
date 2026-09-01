import { SITE_NAME, absoluteUrl } from "@/lib/site";

/**
 * Structured data.
 *
 * Kept deliberately narrow. We publish only markup that describes something
 * genuinely on the page: what the site is, where you are in it, and the rules
 * Q&A. No `Product` or `Review` markup on card pages — we don't sell cards, and
 * dressing an auto-generated heuristic score as a review is the kind of thing
 * that earns a structured-data manual action rather than a rich result.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from our own data, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Site identity plus the sitelinks search box. Home page only. */
export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/cards?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Trail for nested pages. Pass the crumbs without the site root. */
export function breadcrumbSchema(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...crumbs].map(
      (crumb, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: crumb.name,
        item: absoluteUrl(crumb.path),
      }),
    ),
  };
}

/** Q&A markup. Only for pages that really are a list of questions answered. */
export function faqSchema(entries: readonly { title: string; body: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.title,
      acceptedAnswer: { "@type": "Answer", text: entry.body },
    })),
  };
}

/**
 * A curated list page: what the collection is, and the items on it.
 *
 * `itemListElement` must contain exactly the items the page renders, and
 * `numberOfItems` must equal its length — never the total that matched the
 * rule. A hub lists 60 cards out of a thousand-odd matches, and markup claiming
 * the larger number would contradict the count printed on the page.
 *
 * No rich result rides on this. It ships because it states the page's type and
 * contents in a form answer engines and RAG crawlers read directly, which is
 * the same reason `faqSchema` ships.
 */
export function collectionSchema({
  name,
  description,
  path,
  items,
}: {
  name: string;
  description: string;
  path: string;
  items: readonly { name: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(path),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      // Ranked by the 2HG Rating, best first.
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    },
  };
}
