"use client";

/**
 * Client-side team persistence.
 *
 * The team lives in a small external store backed by localStorage and read
 * through `useSyncExternalStore`, which gives us a correct SSR snapshot
 * without a hydration flash or a mount effect.
 *
 * This is also the seam where Supabase slots in: the provider's API
 * (addCard/setQuantity/…) is already shaped like the server actions we'll
 * write, so swapping the storage backend touches this file and nothing else.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ScryfallCard } from "./scryfall";
import {
  emptyTeam,
  validateTeam,
  type DeckSlot,
  type FormatId,
  type TeamPairing,
  type ValidationResult,
} from "./team";

const STORAGE_KEY = "2hg:team:v1";
const CARD_CACHE_KEY = "2hg:cards:v1";

type Snapshot = {
  team: TeamPairing;
  /** Scryfall data keyed by canonical card name. */
  cards: Record<string, ScryfallCard>;
  /** Names Scryfall couldn't resolve, so we stop asking for them. */
  unresolved: string[];
};

/** Stable identity: the server renders an empty team, always. */
const SERVER_SNAPSHOT: Snapshot = {
  team: emptyTeam(),
  cards: {},
  unresolved: [],
};

let snapshot: Snapshot | null = null;
const listeners = new Set<() => void>();

function readStorage(): Snapshot {
  const next: Snapshot = { team: emptyTeam(), cards: {}, unresolved: [] };
  try {
    const rawTeam = localStorage.getItem(STORAGE_KEY);
    if (rawTeam) next.team = JSON.parse(rawTeam) as TeamPairing;

    const rawCards = localStorage.getItem(CARD_CACHE_KEY);
    if (rawCards) {
      for (const card of JSON.parse(rawCards) as ScryfallCard[]) {
        next.cards[card.name] = card;
      }
    }
  } catch {
    // Corrupt or unavailable storage just means we start empty.
  }
  return next;
}

function persist(s: Snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s.team));
    localStorage.setItem(CARD_CACHE_KEY, JSON.stringify(Object.values(s.cards)));
  } catch {
    // Private browsing / quota — the session still works, it just won't persist.
  }
}

function getSnapshot(): Snapshot {
  snapshot ??= readStorage();
  return snapshot;
}

function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(fn: (s: Snapshot) => Snapshot) {
  const current = getSnapshot();
  const next = fn(current);
  if (next === current) return;
  snapshot = next;
  persist(next);
  for (const listener of listeners) listener();
}

function updateTeam(fn: (t: TeamPairing) => TeamPairing) {
  update((s) => ({ ...s, team: fn(s.team) }));
}

type TeamContextValue = {
  team: TeamPairing;
  /** Scryfall data for every card in the team, keyed by canonical name. */
  cards: Map<string, ScryfallCard>;
  validation: ValidationResult;
  /** True while card data for a newly added name is still in flight. */
  loading: boolean;
  /** False during SSR and the hydration render. */
  hydrated: boolean;
  addCard: (card: ScryfallCard, slot: DeckSlot, quantity?: number) => void;
  setQuantity: (name: string, slot: DeckSlot, quantity: number) => void;
  removeCard: (name: string, slot: DeckSlot) => void;
  renameDeck: (slot: DeckSlot, name: string) => void;
  setFormat: (format: FormatId) => void;
  setTeamName: (name: string) => void;
  clear: () => void;
};

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { team } = snap;

  const cards = useMemo(
    () => new Map(Object.entries(snap.cards)),
    [snap.cards],
  );

  // Names in the team that we don't hold card data for and haven't already
  // failed to resolve. Derived, so there's no state to fall out of sync.
  const missing = useMemo(() => {
    const wanted = new Set(
      [...team.a.entries, ...team.b.entries].map((e) => e.name),
    );
    return [...wanted].filter(
      (name) => !(name in snap.cards) && !snap.unresolved.includes(name),
    );
  }, [team, snap.cards, snap.unresolved]);

  // Backfill Scryfall data for anything the team references but we don't have.
  useEffect(() => {
    if (missing.length === 0) return;

    let cancelled = false;
    fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names: missing }),
    })
      .then((r) => (r.ok ? r.json() : { cards: [] }))
      .then((json: { cards: ScryfallCard[] }) => {
        if (cancelled) return;
        update((s) => {
          const nextCards = { ...s.cards };
          for (const card of json.cards) nextCards[card.name] = card;
          // Anything we asked for and didn't get back is recorded so the
          // effect doesn't request it again on every render.
          const stillMissing = missing.filter((n) => !(n in nextCards));
          return {
            ...s,
            cards: nextCards,
            unresolved: [...new Set([...s.unresolved, ...stillMissing])],
          };
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [missing]);

  const addCard = useCallback(
    (card: ScryfallCard, slot: DeckSlot, quantity = 1) => {
      update((s) => {
        const deck = s.team[slot];
        const existing = deck.entries.find((e) => e.name === card.name);
        const entries = existing
          ? deck.entries.map((e) =>
              e.name === card.name
                ? { ...e, quantity: e.quantity + quantity }
                : e,
            )
          : [...deck.entries, { name: card.name, quantity }];

        return {
          ...s,
          team: { ...s.team, [slot]: { ...deck, entries } },
          cards: { ...s.cards, [card.name]: card },
        };
      });
    },
    [],
  );

  const setQuantity = useCallback(
    (name: string, slot: DeckSlot, quantity: number) => {
      updateTeam((t) => {
        const deck = t[slot];
        const entries =
          quantity <= 0
            ? deck.entries.filter((e) => e.name !== name)
            : deck.entries.map((e) =>
                e.name === name ? { ...e, quantity } : e,
              );
        return { ...t, [slot]: { ...deck, entries } };
      });
    },
    [],
  );

  const removeCard = useCallback((name: string, slot: DeckSlot) => {
    updateTeam((t) => ({
      ...t,
      [slot]: {
        ...t[slot],
        entries: t[slot].entries.filter((e) => e.name !== name),
      },
    }));
  }, []);

  const renameDeck = useCallback((slot: DeckSlot, name: string) => {
    updateTeam((t) => ({ ...t, [slot]: { ...t[slot], name } }));
  }, []);

  const setFormat = useCallback((format: FormatId) => {
    updateTeam((t) => ({ ...t, format }));
  }, []);

  const setTeamName = useCallback((name: string) => {
    updateTeam((t) => ({ ...t, name }));
  }, []);

  const clear = useCallback(() => updateTeam(() => emptyTeam()), []);

  const validation = useMemo(() => validateTeam(team, cards), [team, cards]);

  const value = useMemo<TeamContextValue>(
    () => ({
      team,
      cards,
      validation,
      loading: missing.length > 0,
      hydrated: snap !== SERVER_SNAPSHOT,
      addCard,
      setQuantity,
      removeCard,
      renameDeck,
      setFormat,
      setTeamName,
      clear,
    }),
    [
      team,
      cards,
      validation,
      missing,
      snap,
      addCard,
      setQuantity,
      removeCard,
      renameDeck,
      setFormat,
      setTeamName,
      clear,
    ],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam(): TeamContextValue {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeam must be used inside <TeamProvider>");
  return ctx;
}
