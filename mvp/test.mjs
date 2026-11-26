import { differences, parseNumber } from "./view/differences.mjs";
import assert from "node:assert";
assert.deepEqual(parseNumber("1 lb 6.6 oz"), { n: 22.6, unit: "oz" });
assert.deepEqual(parseNumber("380 g"), { n: 380, unit: "g" });
assert.equal(parseNumber("Yes, 2E available"), null);
const money = (p) => "$" + p.amount;
const d = (v) => ({ state: "answered", value: v });
const cards = [
  { id: "a", store: "REI", price: { amount: 140, currency: "USD" }, details: { Waterproof: d("Yes, Gore-Tex"), Weight: d("380 g"), "Wide fit?": d("Yes, 2E") } },
  { id: "b", store: "REI", price: { amount: 155, currency: "USD" }, details: { Waterproof: d("Yes"), Weight: d("0.45 kg"), "Wide fit?": d("No") } },
  { id: "c", store: "REI", price: { amount: 150, currency: "USD" }, details: { Waterproof: d("Yes, B-DRY"), Weight: d("410 g"), "Wide fit?": d("No, standard only") } },
];
const r = differences(cards, ["Waterproof", "Weight", "Wide fit?"], money);
assert.equal(r.sharedText, "All three: from REI · waterproof");
assert.deepEqual(r.tags.a, ["Cheapest", "Lightest", "Wide fit"]);
assert.equal(r.lines.length, 2);
console.log("ok");
