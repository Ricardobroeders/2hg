import Link from "next/link";
import type { ScryfallCard } from "@/lib/scryfall";
import type { Deck, DeckSlot } from "@/lib/team";
import { scoreCard, tierColor } from "@/lib/twohg-score";
import { toSlug } from "@/lib/slug";

/**
 * Read-only deck view for a shared pairing. Server-rendered, so a link a
 * teammate opens is indexable and needs no client JS to read.
 */
export function SharedDeck({
  deck,
  slot,
  cards,
}: {
  deck: Deck;
  slot: DeckSlot;
  cards: Map<string, ScryfallCard>;
}) {
  const count = deck.entries.reduce((n, e) => n + e.quantity, 0);

  // Highest-rated first — the whole point is surfacing the 2HG read.
  const entries = [...deck.entries].sort((a, b) => {
    const ca = cards.get(a.name);
    const cb = cards.get(b.name);
    if (!ca || !cb) return a.name.localeCompare(b.name);
    return scoreCard(cb).score - scoreCard(ca).score;
  });

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
      <header className="border-b border-white/10 p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-white/10 text-[11px] font-bold text-zinc-300">
            {slot.toUpperCase()}
          </span>
          <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-white">
            {deck.name}
          </h2>
          <span className="shrink-0 text-xs tabular-nums text-zinc-500">
            {count}
          </span>
        </div>

        {deck.commanders.length > 0 && (
          <p className="mt-2 text-xs text-zinc-500">
            Commanded by{" "}
            <span className="text-zinc-300">
              {deck.commanders.join(" and ")}
            </span>
          </p>
        )}
      </header>

      <ul className="divide-y divide-white/5">
        {entries.map((entry) => {
          const card = cards.get(entry.name);
          const score = card ? scoreCard(card) : null;

          return (
            <li key={entry.name} className="flex items-center gap-3 px-4 py-2">
              <span className="w-6 shrink-0 text-right text-xs tabular-nums text-zinc-600">
                {entry.quantity}
              </span>
              <Link
                href={`/cards/${toSlug(entry.name)}`}
                className="min-w-0 flex-1 truncate text-sm text-zinc-300 hover:text-white"
              >
                {entry.name}
              </Link>
              {score && (
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums ring-1 ring-inset ${tierColor(
                    score.tier,
                  )}`}
                >
                  {score.score}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {entries.length === 0 && (
        <p className="p-8 text-center text-sm text-zinc-600">
          This deck is empty.
        </p>
      )}
    </section>
  );
}
