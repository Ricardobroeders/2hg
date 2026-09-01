/**
 * Run with `npm test`. Node's built-in runner, so no test dependency —
 * this file and the runner flag are the whole harness.
 *
 * Scope is deliberately narrow: pure functions only, no network. The live
 * Scryfall behaviour these encode was verified against the API by hand, and a
 * test that calls out to Scryfall would be a rate-limit liability rather than
 * a safety net.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { collectionLookupName } from "./scryfall";

test("collectionLookupName reduces a combined name to its front face", () => {
  // The six that were silently dropped from /lists/sweeper.
  assert.equal(collectionLookupName("Dusk // Dawn"), "Dusk");
  assert.equal(collectionLookupName("Rags // Riches"), "Rags");
  assert.equal(collectionLookupName("Cease // Desist"), "Cease");
  assert.equal(
    collectionLookupName("Valki, God of Lies // Tibalt, Cosmic Impostor"),
    "Valki, God of Lies",
  );
  assert.equal(
    collectionLookupName("Nicol Bolas, the Ravager // Nicol Bolas, the Arisen"),
    "Nicol Bolas, the Ravager",
  );
  assert.equal(
    collectionLookupName("Unstable Glyphbridge // Sandswirl Wanderglyph"),
    "Unstable Glyphbridge",
  );
});

test("collectionLookupName leaves an ordinary name untouched", () => {
  // The overwhelming majority of calls. Applying this unconditionally is only
  // safe because these pass straight through.
  assert.equal(collectionLookupName("Wrath of God"), "Wrath of God");
  assert.equal(collectionLookupName("Gray Merchant of Asphodel"), "Gray Merchant of Asphodel");
  // Punctuation and accents are not this function's business.
  assert.equal(collectionLookupName("Séance"), "Séance");
  assert.equal(collectionLookupName("Lim-Dûl's Vault"), "Lim-Dûl's Vault");
});

test("collectionLookupName is idempotent", () => {
  // Callers pass user-typed decklist names, which may already be front-face
  // only. Running it twice must not change the answer.
  const once = collectionLookupName("Fire // Ice");
  assert.equal(collectionLookupName(once), once);
  assert.equal(once, "Fire");
});

test("collectionLookupName trims the face it returns", () => {
  // Some exports pad the separator differently. Scryfall matches exactly, so a
  // trailing space would turn a hit into a not_found.
  assert.equal(collectionLookupName("  Dusk // Dawn  "), "Dusk");
});
