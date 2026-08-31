import type { MetadataRoute } from "next";
import { CORPUS_UPDATED_AT, indexableCards } from "@/lib/corpus";
import { indexableHubs } from "@/lib/lists";
import { SITE_URL } from "@/lib/site";

/**
 * One sitemap file, not `generateSitemaps()`.
 *
 * Chunking emits `/sitemap/0.xml`, `/sitemap/1.xml` … , removes `/sitemap.xml`
 * entirely, and generates no index file — so it would cost a hand-written index
 * route for no benefit. Total inventory here is ~5,600 URLs against a 50,000
 * limit. Revisit at ~25,000; note that Next 16 changed `generateSitemaps`' `id`
 * to a promise (`const id = await props.id`), which most examples online predate.
 *
 * Entries must be absolute: `metadataBase` is not applied to sitemap routes.
 */
export const revalidate = 86400;

const STATIC_PATHS = [
  "/",
  "/cards",
  "/lists",
  "/rules",
  "/deck-builder",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // No `lastModified` on the static pages — we'd only be guessing, and a
    // timestamp that moves without the content changing teaches Google to
    // ignore the field across the whole site.
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` })),

    ...indexableHubs().map((hub) => ({
      url: `${SITE_URL}/lists/${hub.id}`,
      lastModified: CORPUS_UPDATED_AT,
    })),

    /**
     * The thin-content guard. Corpus membership *is* "this card trips at least
     * one 2HG rule", so everything here has something format-specific to say.
     * The other ~25,000 Commander-legal cards keep working pages and carry
     * `noindex` — see `generateMetadata` in `/cards/[slug]`.
     */
    ...indexableCards().map((card) => ({
      url: `${SITE_URL}/cards/${card.slug}`,
      lastModified: CORPUS_UPDATED_AT,
    })),
  ];

  /**
   * Shared pairings (`/t/[slug]`, `/d/[slug]`) are deliberately absent.
   *
   * They stay public and indexable — that share link is how this site spreads,
   * and `CLAUDE.md` is explicit that gating it is a regression. But listing
   * them here is a different act: `teams.isPublic` defaults to `true` and
   * nothing in the codebase ever sets it to `false`, so a sitemap would publish
   * a directory of every pairing anyone has saved. The share link's
   * unguessability is currently its only access control, and the privacy page
   * tells people an anonymous pairing "is not linked to you".
   *
   * Add them once there is an explicit "list this publicly" opt-in that sets
   * `isPublic`, and gate on a real card count so scratchpads stay out.
   */
}
