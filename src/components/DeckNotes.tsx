"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTeam } from "@/lib/team-store";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_NOTES_LENGTH,
  type DeckSlot,
} from "@/lib/team";
import { Modal } from "./Modal";

const NotesEditor = dynamic(() => import("./NotesEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-60 rounded-xl border border-white/15 bg-white/[0.03]" />
  ),
});

/**
 * A deck's description and notes, edited from its column in the builder.
 *
 * They live on the deck rather than the pairing so they travel with it: saving
 * Deck A on its own, reopening it, or adopting a teammate's copy all carry the
 * primer along. The editor opens in a dialog because a deck column is too
 * narrow to write anything longer than a sentence in.
 */
export function DeckNotes({ slot }: { slot: DeckSlot }) {
  const { team, setDeckText } = useTeam();
  const [open, setOpen] = useState(false);

  const deck = team[slot];
  const hasNotes = deck.notes.trim().length > 0;
  const hasAny = hasNotes || deck.description.trim().length > 0;

  return (
    <>
      {hasAny ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group mt-3 block w-full rounded-lg border border-white/10 px-3 py-2 text-left transition hover:border-white/20"
        >
          {deck.description && (
            <span className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
              {deck.description}
            </span>
          )}
          <span className="mt-0.5 block text-[11px] text-zinc-600 group-hover:text-emerald-400">
            {hasNotes ? "Edit notes" : "Add notes"}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 text-xs text-zinc-500 transition hover:text-emerald-400"
        >
          + Add a description and notes
        </button>
      )}

      {open && (
        <Modal
          title={`Notes for ${deck.name || `Deck ${slot.toUpperCase()}`}`}
          description="Shown to anyone you send the link to. Save the deck or the pairing to publish changes."
          size="lg"
          onClose={() => setOpen(false)}
        >
          <label className="block">
            <span className="flex items-baseline justify-between text-xs font-medium uppercase tracking-wider text-zinc-500">
              Description
              <span className="font-normal normal-case tracking-normal tabular-nums text-zinc-600">
                {deck.description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </span>
            <textarea
              value={deck.description}
              onChange={(e) =>
                setDeckText(slot, {
                  // One line: this becomes the page's search snippet.
                  description: e.target.value.replace(/\n/g, " "),
                })
              }
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={2}
              placeholder="One or two sentences on what this deck does."
              className="mt-2 w-full resize-none rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-400/50"
            />
          </label>

          <div className="mt-5">
            <span className="flex items-baseline justify-between text-xs font-medium uppercase tracking-wider text-zinc-500">
              Notes
              {deck.notes.length > MAX_NOTES_LENGTH * 0.8 && (
                <span
                  className={`font-normal normal-case tracking-normal tabular-nums ${
                    deck.notes.length > MAX_NOTES_LENGTH
                      ? "text-rose-400"
                      : "text-zinc-600"
                  }`}
                >
                  {deck.notes.length.toLocaleString()}/
                  {MAX_NOTES_LENGTH.toLocaleString()}
                </span>
              )}
            </span>
            <div className="mt-2">
              <NotesEditor
                value={deck.notes}
                onChange={(notes) => setDeckText(slot, { notes })}
              />
            </div>
            {deck.notes.length > MAX_NOTES_LENGTH && (
              <p className="mt-2 text-xs text-rose-300">
                Anything past {MAX_NOTES_LENGTH.toLocaleString()} characters is
                cut off when you save.
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-300"
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
