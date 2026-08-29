import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
