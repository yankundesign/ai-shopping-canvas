// Local dev host: one canvas, the way Claude or ChatGPT would show it, with a
// fake agent on the right. Open with ?canvas=<id> to show an existing canvas
// and ?style=<variant> to pin a style.

import { TOKEN, tool, getCanvas, openSample, mountView, reopen } from "./agent.js";

const $ = (s) => document.querySelector(s);
const query = new URLSearchParams(location.search);
let canvasId = query.get("canvas");
let view = null;

$("#to-styles").href = `/dev/${TOKEN}/styles`;

function log(line) {
  $("#log").textContent = `${new Date().toLocaleTimeString()}  ${line}\n` + $("#log").textContent;
}

const handlers = {
  context: (text) => ($("#context").textContent = text),
  link: (url) => log(`open link: ${url}`),
  message: (text) => {
    if ($("#auto-allow").checked) return log(`message allowed: ${text}`), {};
    return new Promise((resolve) => {
      const row = document.createElement("div");
      row.className = "pending";
      row.innerHTML = `<div></div><button>Allow</button> <button>Decline</button>`;
      row.firstChild.textContent = text;
      const [allow, decline] = row.querySelectorAll("button");
      allow.onclick = () => (row.remove(), log(`message allowed: ${text}`), resolve({}));
      decline.onclick = () => (row.remove(), log(`message declined: ${text}`), resolve({ isError: true }));
      $("#pending").append(row);
    });
  },
};

async function mount(open) {
  view = await mountView($("#frame"), { ...open, theme: $("#dark").checked ? "dark" : "light", style: query.get("style"), mode: query.get("mode") || "fullscreen", handlers });
}

async function agent(name, args) {
  const r = await tool(name, { canvas_id: canvasId, ...args });
  log(`agent ${name}: ${r.content?.[0]?.text?.split("\n")[0]}`);
  return r;
}

$("#open").onclick = async () => {
  const open = await openSample();
  canvasId = open.canvasId;
  log(`agent open_canvas: ${canvasId}`);
  await mount(open);
};

// Made-up specs the fake agent gives when asked to compare the finalists, one value per finalist.
const SPECS = {
  Weight: ["370 g", "485 g", "450 g", "410 g"],
  "Heel-to-toe drop": ["11 mm", "13 mm", "11 mm", "10 mm"],
  "Wide sizes": ["No", "Yes, 2E", "Yes, wide", "No"],
  Returns: ["60 days", "30 days", "30 days, unworn", "45 days"],
};

$("#fill").onclick = async () => {
  const canvas = await getCanvas(canvasId);
  const values = [];
  const requests = [];
  const specs = canvas.specRequest && !canvas.specRequest.answered ? canvas.specRequest : null;
  canvas.cards.filter((c) => !c.deleted).forEach((c, i) => {
    if (c.kind === "request") requests.push(c);
    for (const [detail, d] of Object.entries(c.details || {})) {
      if (d.state !== "waiting") continue;
      if (SPECS[detail]) values.push({ card_id: c.id, detail, value: SPECS[detail][i % 4], source: "https://example.com/spec" });
      else values.push(i % 4 === 3 ? { card_id: c.id, detail, couldnt_find: true } : { card_id: c.id, detail, value: i % 2 ? "Standard only" : "2E available", source: "https://example.com/spec" });
    }
  });
  if (specs) specs.ids.forEach((id, k) => Object.entries(SPECS).forEach(([detail, v]) => values.push({ card_id: id, detail, value: v[k % 4], source: "https://example.com/spec" })));
  if (values.length) await agent("fill_details", { values });
  for (const r of requests) {
    await agent("add_cards", { cards: [{ link: "https://www.keenfootwear.com/products/mens-targhee-iv-waterproof-triple-black", name: "KEEN Targhee IV Waterproof, Triple Black", price: 135, store: "KEEN", fills_request: r.id }] });
  }
  if (!values.length && !requests.length) log("no requests waiting");
};

const products = async () => (await getCanvas(canvasId)).cards.filter((c) => !c.deleted && c.kind === "product");

$("#point").onclick = async () => {
  const [a, b] = await products();
  if (a && b) await agent("point_at_cards", { card_ids: [a.id, b.id], note: "The first is cheapest, the second is roomiest", reasons: [{ card_id: a.id, reason: "Cheapest" }, { card_id: b.id, reason: "Roomiest" }] });
};

$("#point-far").onclick = async () => {
  const last = (await products()).pop();
  if (last) await agent("point_at_cards", { card_ids: [last.id], note: "This one is the outlier" });
};

$("#read").onclick = async () => ($("#agent-out").textContent = (await agent("read_canvas", {})).content[0].text);
$("#dark").onchange = () => view?.setTheme($("#dark").checked ? "dark" : "light");

if (canvasId) mount(reopen(canvasId));
