/**
 * The two cross-deck rules this site has published wrong before: 2HG
 * Commander has no unified deck rule at all, and 2HG Constructed's is "one deck
 * per card", not the older "four copies combined".
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { ScryfallCard } from "./scryfall";
import { emptyTeam, validateTeam, type FormatId, type TeamPairing } from "./team";

function card(name: string, type = "Artifact"): ScryfallCard {
  return {
    id: name, oracle_id: name, name, lang: "en", released_at: "", scryfall_uri: "",
    layout: "normal", cmc: 1, type_line: type, color_identity: [], keywords: [],
    legalities: { commander: "legal", standard: "legal" }, set: "", set_name: "",
    collector_number: "", rarity: "common", prices: {},
  };
}

function team(format: FormatId, shared: string): TeamPairing {
  const t = emptyTeam();
  t.format = format;
  t.a.entries = [{ name: shared, quantity: 1 }];
  t.b.entries = [{ name: shared, quantity: 1 }];
  return t;
}

const kinds = (t: TeamPairing, c: ScryfallCard) =>
  validateTeam(t, new Map([[c.name, c]])).violations.map((v) => v.kind);

test("2HG Commander lets both teammates run the same card", () => {
  assert.ok(!kinds(team("commander", "Sol Ring"), card("Sol Ring")).includes("combined-copies"));
});

test("2HG Constructed forbids one card in both decks, even one copy each", () => {
  assert.ok(kinds(team("constructed", "Sol Ring"), card("Sol Ring")).includes("combined-copies"));
});

test("2HG Constructed exempts basic lands from Unified Deck Construction", () => {
  const island = card("Island", "Basic Land — Island");
  assert.ok(!kinds(team("constructed", "Island"), island).includes("combined-copies"));
});
