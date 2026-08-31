import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { TeamProvider } from "@/lib/team-store";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const DESCRIPTION =
  "Card ratings, team deckbuilding and legality checks for Magic: The Gathering's Two-Headed Giant format. The first database built for shared life totals and shared turns.";

/**
 * Site-level metadata.
 *
 * `metadataBase` is what makes every relative URL below resolve to one origin.
 * Production answers on more than one Vercel alias, so without it Google is
 * free to index the same page under several hostnames.
 *
 * Deliberately no `alternates.canonical` and no `openGraph.url` here: metadata
 * fields are *inherited* by any page that doesn't set its own, so a canonical
 * declared at this level would tell Google every page on the site is the home
 * page. Canonicals belong on the individual pages, and only there.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Two-Headed Giant — the 2HG card database",
    template: "%s · Two-Headed Giant",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en",
    title: "Two-Headed Giant — the 2HG card database",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Two-Headed Giant — the 2HG card database",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${geistSans.className} flex min-h-full flex-col`}>
        <TeamProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </TeamProvider>
      </body>
    </html>
  );
}
