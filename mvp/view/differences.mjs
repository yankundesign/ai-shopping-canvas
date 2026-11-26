// What sets the finalists apart, worked out by the canvas from the person's
// details. No intelligence here, only arithmetic and string comparison:
//   shared: one quiet line for what they all have in common
//   lines:  each number (price, weight) as a line with the cards placed on it
//   tags:   a word on each card for what sets it apart ("Cheapest", "Lightest")

const UNITS = { g: ["g", 1], gram: ["g", 1], grams: ["g", 1], kg: ["g", 1000], oz: ["oz", 1], ounce: ["oz", 1], ounces: ["oz", 1], lb: ["oz", 16], lbs: ["oz", 16], mm: ["mm", 1], cm: ["mm", 10], in: ["in", 1], inch: ["in", 1], inches: ["in", 1], '"': ["in", 1] };

/** "380 g" -> { n: 380, unit: "g" }; "1 lb 6.6 oz" -> { n: 22.6, unit: "oz" }; "Yes, 2E" -> null */
export function parseNumber(value) {
  const s = String(value ?? "").trim();
  const m = /^[~≈]?\s*([$€£])?\s*(\d[\d,]*(?:\.\d+)?)\s*([a-zA-Z%"]+)?(?:\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+))?/.exec(s);
  if (!m) return null;
  let n = Number(m[2].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  if (m[1]) return { n, unit: m[1] };
  const u = UNITS[(m[3] || "").toLowerCase()];
  if (!u) return { n, unit: (m[3] || "").toLowerCase() };
  n *= u[1];
  // A second part in a smaller unit of the same kind: "1 lb 6.6 oz".
  const u2 = m[4] ? UNITS[(m[5] || "").toLowerCase()] : null;
  if (u2 && u2[0] === u[0]) n += Number(m[4]) * u2[1];
  return { n, unit: u[0] };
}

const norm = (s) => String(s ?? "").trim().toLowerCase().replace(/[.!]+$/, "");
const yesNo = (s) => (/^(yes|true)\b/i.test(String(s).trim()) ? "yes" : /^(no|none|false)\b/i.test(String(s).trim()) ? "no" : null);
const bare = (name) => String(name).replace(/\?+$/, "").trim();
const count = (n) => (n === 2 ? "Both" : `All ${["", "", "", "three", "four", "five", "six"][n] || n}`);

function numberLine(label, entries) {
  // entries: [{ id, n, text }]
  const ns = entries.map((e) => e.n);
  const min = Math.min(...ns);
  const max = Math.max(...ns);
  return {
    label,
    min,
    max,
    points: entries.map((e) => ({ id: e.id, text: e.text, t: max === min ? 0.5 : (e.n - min) / (max - min) })).sort((a, b) => a.t - b.t),
  };
}

function only(entries, pick) {
  const best = pick(...entries.map((e) => e.n));
  const winners = entries.filter((e) => e.n === best);
  return winners.length === 1 ? winners[0].id : null;
}

export function differences(cards, detailOrder, money) {
  const out = { shared: [], lines: [], consumed: [], tags: Object.fromEntries(cards.map((c) => [c.id, []])) };
  if (cards.length < 2) return out;

  // Price
  const priced = cards.filter((c) => c.price).map((c) => ({ id: c.id, n: Number(c.price.amount), text: money(c.price) }));
  if (priced.length >= 2 && new Set(cards.filter((c) => c.price).map((c) => c.price.currency)).size === 1) {
    if (new Set(priced.map((p) => p.n)).size === 1) out.shared.push(`${priced[0].text} each`);
    else {
      out.lines.push(numberLine("Price", priced));
      const cheapest = priced.length === cards.length ? only(priced, Math.min) : null;
      if (cheapest) out.tags[cheapest].push("Cheapest");
    }
  }

  // Store
  const stores = cards.map((c) => norm(c.store));
  if (stores[0] && stores.every((s) => s === stores[0])) out.shared.push(`from ${cards[0].store}`);

  // The person's details
  for (const name of detailOrder) {
    const answered = cards.map((c) => ({ id: c.id, d: c.details?.[name] })).filter((e) => e.d?.state === "answered");
    if (answered.length < 2) continue;
    const complete = answered.length === cards.length;

    const nums = answered.map((e) => ({ id: e.id, text: e.d.value, p: parseNumber(e.d.value) }));
    if (nums.every((e) => e.p) && new Set(nums.map((e) => e.p.unit)).size === 1) {
      const entries = nums.map((e) => ({ id: e.id, n: e.p.n, text: e.text }));
      if (new Set(entries.map((e) => e.n)).size === 1) {
        if (complete) out.shared.push(`${bare(name)}: ${entries[0].text}`), out.consumed.push(name);
        continue;
      }
      out.lines.push(numberLine(bare(name), entries));
      out.consumed.push(name);
      if (complete && /weigh/i.test(name)) {
        const lightest = only(entries, Math.min);
        if (lightest) out.tags[lightest].push("Lightest");
      }
      continue;
    }

    if (!complete) continue;
    const yn = answered.map((e) => yesNo(e.d.value));
    const values = answered.map((e) => norm(e.d.value));
    if (yn.every((v) => v === "yes")) out.shared.push(bare(name).toLowerCase()), out.consumed.push(name);
    else if (yn.every((v) => v === "no")) out.shared.push(`no ${bare(name).toLowerCase()}`), out.consumed.push(name);
    else if (values.every((v) => v === values[0])) out.shared.push(`${bare(name)}: ${answered[0].d.value}`), out.consumed.push(name);
    else if (cards.length >= 3) {
      // The odd one out: one card differs and the rest agree.
      const keys = yn.every(Boolean) ? yn : values;
      for (let i = 0; i < keys.length; i++) {
        const rest = keys.filter((_, j) => j !== i);
        if (rest.every((v) => v === rest[0]) && keys[i] !== rest[0]) {
          const tag = yn[i] === "yes" ? bare(name) : yn[i] === "no" ? `No ${bare(name).toLowerCase()}` : answered[i].d.value;
          out.tags[answered[i].id].push(tag.length > 28 ? tag.slice(0, 27) + "…" : tag);
        }
      }
    }
  }

  if (out.shared.length) {
    const s = out.shared.join(" · ");
    out.sharedText = `${count(cards.length)}: ${s}`;
  }
  return out;
}
