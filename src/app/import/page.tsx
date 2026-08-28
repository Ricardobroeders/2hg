import type { Metadata } from "next";
import Link from "next/link";
import { DeckImporter } from "@/components/DeckImporter";

export const metadata: Metadata = {
  title: "Import a decklist",
  description:
    "Paste a decklist from Moxfield, Archidekt, MTG Arena or anywhere else and drop it straight into a 2HG team pairing.",
};

/**
 * We don't compete with Moxfield's editor — we take its output. Getting an
 * existing deck into a pairing in one paste is the whole point.
 */
const SOURCES = [
  {
    name: "Moxfield",
    how: "Deck menu → Export → copy the text export.",
  },
  {
    name: "Archidekt",
    how: "Deck menu → Export → Text, then copy.",
  },
  {
    name: "MTG Arena",
    how: "Deck view → the three-dot menu → Export to clipboard.",
  },
  {
    name: "Anywhere else",
    how: "One card per line. Quantities and set codes are optional.",
  },
];

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Import a decklist
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-400">
          Your decks already live somewhere. Paste one in and we&apos;ll match
          every line against Scryfall, then you can pair it with a partner deck
          and see how the two play together.
        </p>
      </header>

      <div className="mt-10">
        <DeckImporter />
      </div>

      <section className="mt-14 border-t border-white/10 pt-8">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Where to get your list
        </h2>
        <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {SOURCES.map((source) => (
            <div key={source.name}>
              <dt className="text-sm font-medium text-white">{source.name}</dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-zinc-400">
                {source.how}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-sm leading-relaxed text-zinc-500">
          Set codes, collector numbers, foil markers and category tags are all
          stripped automatically, and a{" "}
          <code className="rounded bg-white/5 px-1 py-0.5 text-xs text-zinc-400">
            *CMDR*
          </code>{" "}
          tag is read as your commander. Not sure how the format works?{" "}
          <Link
            href="/rules"
            className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
          >
            Read the 2HG rules
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
