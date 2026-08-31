import type { Metadata } from "next";

/**
 * The builder page itself is a client component, so it can't export metadata —
 * this layout carries it instead.
 */
export const metadata: Metadata = {
  title: "Deck builder",
  description:
    "Build a Two-Headed Giant pairing: two decks checked together for legality, curve collision and 2HG Rating. Paste a decklist from Moxfield or Archidekt to start.",
  alternates: { canonical: "/deck-builder" },
  openGraph: { url: "/deck-builder" },
};

export default function DeckBuilderLayout({
  children,
}: LayoutProps<"/deck-builder">) {
  return children;
}
