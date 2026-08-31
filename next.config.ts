import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /**
     * Prerendering card pages is Scryfall-bound, not CPU-bound. The default
     * spreads pages over one worker per 25, so a few hundred cards fan out to
     * a dozen processes all calling Scryfall at once — which rate-limits us and
     * times pages out. Fewer, busier workers keep the request rate sane; the
     * per-process ceiling in `src/lib/scryfall.ts` does the rest.
     */
    staticGenerationMinPagesPerWorker: 200,
    staticGenerationRetryCount: 3,
  },
  /**
   * `/team` and `/import` were real URLs people bookmarked and we linked from
   * card pages, so they redirect rather than 404. `/import` folds into the
   * builder: importing a list is a step in building a deck, not a destination.
   */
  async redirects() {
    return [
      { source: "/team", destination: "/deck-builder", permanent: true },
      { source: "/import", destination: "/deck-builder", permanent: true },
    ];
  },
};

export default nextConfig;
