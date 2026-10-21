/**
 * The slug tie-break decides which card a URL serves when two share one, and
 * the image-size swap decides whether account thumbnails load at all. Both
 * fail silently in production, so they're pinned here.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { imageSizes, prefersForSlug, type CardDetail } from "./card-record";

function detail(overrides: Partial<CardDetail>): CardDetail {
  return {
    slug: "rampant-growth",
    id: "id",
    oracleId: "oracle",
    name: "Rampant Growth",
    cost: "{1}{G}",
    cmc: 2,
    type: "Sorcery",
    oracle: "",
    colorIdentity: ["G"],
    keywords: [],
    setCode: "m10",
    setName: "Magic 2010",
    rarity: "common",
    collectorNumber: "1",
    releasedAt: "2009-07-17",
    layout: "normal",
    uri: "https://scryfall.com/card/m10/1",
    image: null,
    rank: null,
    legal: "nlllll",
    ...overrides,
  };
}

test("prefersForSlug keeps the Commander-legal card over a joke card", () => {
  const real = detail({ name: "Rampant Growth", legal: "nlllll", rank: 40 });
  const joke = detail({ name: "Rampant, Growth", legal: "nnnnnn", rank: null });
  assert.equal(prefersForSlug(real, joke), true);
  assert.equal(prefersForSlug(joke, real), false);
});

test("prefersForSlug falls back to the more played card", () => {
  const popular = detail({ rank: 10 });
  const obscure = detail({ rank: 9000 });
  assert.equal(prefersForSlug(popular, obscure), true);
  assert.equal(prefersForSlug(obscure, popular), false);
});

test("imageSizes derives small and large from the stored normal URL", () => {
  const normal = "https://cards.scryfall.io/normal/front/c/a/ca0c.jpg?178391";
  assert.deepEqual(imageSizes(normal), {
    normal,
    small: "https://cards.scryfall.io/small/front/c/a/ca0c.jpg?178391",
    large: "https://cards.scryfall.io/large/front/c/a/ca0c.jpg?178391",
  });
});

test("imageSizes leaves an unfamiliar URL alone rather than guessing", () => {
  assert.deepEqual(imageSizes("https://example.com/card.jpg"), {
    normal: "https://example.com/card.jpg",
  });
  assert.equal(imageSizes(null), undefined);
});
