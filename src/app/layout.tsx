import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { TeamProvider } from "@/lib/team-store";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Two-Headed Giant — the 2HG card database",
    template: "%s · Two-Headed Giant",
  },
  description:
    "Card ratings, team deckbuilding and legality checks for Magic: The Gathering's Two-Headed Giant format. The first database built for shared life totals and shared turns.",
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
          <footer className="border-t border-white/10 px-4 py-8 text-center text-xs leading-relaxed text-zinc-600 sm:px-6">
            <p>
              Card data and images courtesy of{" "}
              <a
                href="https://scryfall.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
              >
                Scryfall
              </a>
              . Not affiliated with or endorsed by Wizards of the Coast.
            </p>
            <p className="mt-1">
              Buy links are affiliate links. Shared pairings are public to
              anyone with the link.
            </p>
            {/* Linked from every page: Google's OAuth review checks that the
                privacy policy is reachable from the page hosting sign-in. */}
            <p className="mt-3 flex items-center justify-center gap-3">
              <Link
                href="/privacy"
                className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
              >
                Privacy
              </Link>
              <span aria-hidden="true" className="text-zinc-700">
                ·
              </span>
              <Link
                href="/terms"
                className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
              >
                Terms
              </Link>
            </p>
          </footer>
        </TeamProvider>
      </body>
    </html>
  );
}
