"use client";

import { useState } from "react";
import type { DeckSlot } from "@/lib/team";
import { DeckImporter } from "./DeckImporter";
import { Modal } from "./Modal";

/**
 * Bulk import, sitting next to the card search it's the alternative to.
 *
 * Adding 100 cards one autocomplete at a time is nobody's idea of a good time,
 * and the decks people want here already exist on Moxfield or Archidekt. So the
 * two ways into a deck live side by side: search for a card, or paste the lot.
 */
export function BulkImport({ slot }: { slot: DeckSlot }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Paste a whole decklist into Deck ${slot.toUpperCase()}`}
        className="shrink-0 rounded-lg px-3 py-2 text-sm text-zinc-400 ring-1 ring-inset ring-white/15 transition hover:bg-white/5 hover:text-white"
      >
        Bulk import
      </button>

      {open && (
        <Modal
          size="lg"
          title={`Import a decklist into Deck ${slot.toUpperCase()}`}
          description="Paste an export from Moxfield, Archidekt, MTG Arena or anywhere else. Set codes, collector numbers and category tags are stripped for you."
          onClose={() => setOpen(false)}
        >
          <DeckImporter slot={slot} onDone={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
