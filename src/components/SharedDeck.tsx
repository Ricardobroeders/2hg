import { cardImage, type ScryfallCard } from "@/lib/scryfall";
import type { Deck, DeckSlot } from "@/lib/team";
import { scoreCard, tierColor } from "@/lib/twohg-score";
import { toSlug } from "@/lib/slug";
import { CardLink } from "./CardLink";

/**
 * Read-only deck view for a shared pairing.
 *
 * Still server-rendered — a link a teammate opens has to be indexable, and the
 * names and scores are all in the HTML. Only the hover preview is a client
 * component, and it takes its image URL as a prop, so nothing about reading the
 * list depends on JS running.
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
            {deck.commanders.map((name, i) => {
              const commander = cards.get(name);
              return (
                <span key={name}>
                  {i > 0 && " and "}
                  {/* The commander is the one card a visitor most wants to
                      see, and it is often not in the list below it. */}
                  <CardLink
                    name={name}
                    href={`/cards/${toSlug(name)}`}
                    image={commander ? cardImage(commander, "normal") : null}
                    className="text-zinc-300 hover:text-white"
                  />
                </span>
              );
            })}
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
              <span className="min-w-0 flex-1 truncate">
                <CardLink
                  name={entry.name}
                  href={`/cards/${toSlug(entry.name)}`}
                  image={card ? cardImage(card, "normal") : null}
                  className="text-sm text-zinc-300 hover:text-white"
                />
              </span>
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
