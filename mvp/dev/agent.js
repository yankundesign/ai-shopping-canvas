// Shared by the dev pages: talk to the MCP server the way a host would, mount
// the canvas view in a frame, and play a fake agent with a sample canvas.
// Nothing here needs Claude or ChatGPT.

import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";

export const TOKEN = location.pathname.split("/")[2];
const MCP = `/mcp/${TOKEN}`;

let rpcId = 0;
export async function rpc(method, params) {
  const res = await fetch(MCP, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

export const tool = (name, args) => rpc("tools/call", { name, arguments: args });
export const getCanvas = async (id) => (await tool("canvas_get", { canvas_id: id })).structuredContent?.canvas || null;

const src = (u) => ({ source: u });
// Real links. The weights and fits further down are made up for the sample.
export const SAMPLE = [
  { link: "https://www.zappos.com/p/mens-keen-targhee-iv-waterproof-sea-turtle-roasted-pecan/product/9955906/color/1096579", name: "KEEN Targhee IV Waterproof", price: 169.99, store: "Zappos", photo_url: "https://m.media-amazon.com/images/I/71X8MF1pf2L._SX700_.jpg", details: [{ name: "Waterproof", value: "Yes, KEEN.DRY", ...src("https://www.keenfootwear.com") }] },
  { link: "https://www.salomon.com/en-us/product/x-ultra-360-gore-tex-li5205/L47865300", name: "Salomon X Ultra 360 GTX", price: 155, store: "Salomon", details: [{ name: "Waterproof", value: "Yes, Gore-Tex", ...src("https://www.salomon.com/en-us/product/x-ultra-360-gore-tex-li5205/L47865300") }] },
  { link: "https://obozfootwear.com/products/mens-sawtooth-x-low-waterproof", name: "Oboz Sawtooth X Low WP", price: 150, details: [{ name: "Waterproof", value: "Yes, B-DRY", ...src("https://obozfootwear.com/products/mens-sawtooth-x-low-waterproof") }] },
  { link: "https://www.merrell.com/US/en/moab-3-waterproof/52474M.html", name: "Merrell Moab 3 Waterproof", price: 140, store: "Merrell", details: [{ name: "Waterproof", value: "Yes", ...src("https://www.merrell.com/US/en/moab-3-waterproof/52474M.html") }] },
  { link: "https://www.adidas.com/us/terrex-skychaser-ax5-gore-tex-hiking-shoes/JQ2210.html", name: "adidas Terrex Skychaser AX5 GORE-TEX", price: 90, store: "adidas", photo_url: "https://cdn.shopify.com/s/files/1/0603/3031/1875/files/JQ2210-1.jpg", details: [{ name: "Waterproof", value: "Yes, Gore-Tex", ...src("https://www.adidas.com/us/terrex-skychaser-ax5-gore-tex-hiking-shoes/JQ2210.html") }] },
  { link: "https://www.backcountry.com/keen-hightrail-waterproof-hiking-shoe-mens?skid=KENZ5RD-BLAVAP-S110", name: "KEEN Hightrail Waterproof", price: 108.71, store: "Backcountry", photo_url: "https://cdn.shopify.com/s/files/1/2344/9313/files/120e7bd38d2d5556d206488a68476233d8179d11.webp", details: [{ name: "Waterproof", value: "Yes, KEEN.DRY", ...src("https://www.keenfootwear.com") }] },
  { link: "https://www.backcountry.com/columbia-crestwood-waterproof-hiking-shoe-mens?skid=COLZCUL-GRADARADO-S110", name: "Columbia Crestwood Waterproof", price: 67.5, store: "Backcountry", details: [{ name: "Waterproof", value: "Yes, Omni-Tech" }] },
  { link: "https://obozfootwear.com/products/not-a-real-shoe-for-testing", name: "Made-up shoe (page not found)", price: 99, details: [{ name: "Waterproof", value: "Yes" }] },
];
export const SAMPLE_TITLE = "Waterproof hiking shoes under $150";

const WEIGHTS = ["530 g", "390 g", "480 g", "460 g", "385 g", "394 g", "357 g", null];
const WIDE = { c1: "Yes, wide sizes", c2: "No", c4: "Yes, wide sizes" };

export async function openSample() {
  const args = { title: SAMPLE_TITLE, cards: SAMPLE };
  const result = await tool("open_canvas", args);
  return { args, result, canvasId: result.structuredContent.canvas_id };
}

/** Bring the sample to a state that shows everything a style has to carry:
    answered and waiting details, "Couldn't find", a request card, finalists, pointing. */
export async function seedReviewState(canvasId) {
  const ids = SAMPLE.map((_, i) => `c${i + 1}`);
  // Wait until a view has placed the cards, so the request card can sit beside them.
  let canvas = await getCanvas(canvasId);
  for (let i = 0; i < 40 && canvas.cards.some((c) => c.x == null); i++) {
    await new Promise((r) => setTimeout(r, 250));
    canvas = await getCanvas(canvasId);
  }
  await tool("canvas_add_detail", { canvas_id: canvasId, name: "Weight", card_ids: ids, scope: "view" });
  await tool("fill_details", { canvas_id: canvasId, values: ids.map((id, i) => (WEIGHTS[i] ? { card_id: id, detail: "Weight", value: WEIGHTS[i], source: SAMPLE[i].link } : { card_id: id, detail: "Weight", couldnt_find: true })) });
  await tool("canvas_add_detail", { canvas_id: canvasId, name: "Wide fit?", card_ids: ["c1", "c2", "c4", "c6"], scope: "selection" });
  await tool("fill_details", { canvas_id: canvasId, values: Object.entries(WIDE).map(([card_id, value]) => ({ card_id, detail: "Wide fit?", value, source: "https://example.com/size-guide" })) });
  const placed = canvas.cards.filter((c) => c.x != null);
  const c6 = canvas.cards.find((c) => c.id === "c6");
  await tool("canvas_add_request_card", { canvas_id: canvasId, hint: "cheaper", like_ids: ["c5", "c6"], x: Math.max(0, ...placed.map((c) => c.x)) + 260, y: c6?.y ?? 0 });
  await tool("canvas_finalists", { canvas_id: canvasId, card_ids: ["c1", "c2", "c4"], how: "compare" });
  await tool("point_at_cards", { canvas_id: canvasId, card_ids: ["c2", "c6"], note: "The Salomon is the lightest finalist; the Hightrail is cheaper than all three", reasons: [{ card_id: "c2", reason: "Lightest" }, { card_id: "c6", reason: "Cheaper" }] });
}

/** Render the canvas view in `container` the way Claude or ChatGPT would: a sandboxed frame plus the MCP Apps bridge. */
export async function mountView(container, { args, result, theme = "light", style = null, mode = "fullscreen", handlers = {} }) {
  const tools = (await rpc("tools/list", {})).tools || [];
  const viewUri = tools.find((t) => t.name === "open_canvas")?._meta?.ui?.resourceUri;
  let html = (await rpc("resources/read", { uri: viewUri })).contents[0].text;
  // A dev-only switch: the style review pins each frame to one variant.
  if (style) html = html.replace("<html ", `<html data-force-style="${style}" `);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
  container.replaceChildren(iframe);

  const bridge = new AppBridge(
    null,
    { name: "Dev host", version: "0.2.0" },
    { serverTools: {}, message: { text: {} }, updateModelContext: { text: {} }, openLinks: {}, logging: {} },
    { hostContext: { displayMode: mode, availableDisplayModes: ["inline", "fullscreen"], theme, platform: "web" } },
  );
  bridge.oncalltool = (params) => rpc("tools/call", params);
  bridge.onupdatemodelcontext = async (params) => (handlers.context?.(params.content?.map((c) => c.text).join("\n") || ""), {});
  bridge.onmessage = async (params) => (handlers.message ? handlers.message(params.content?.map((c) => c.text).join("\n")) : {});
  bridge.onopenlink = async ({ url }) => (handlers.link ? handlers.link(url) : window.open(url, "_blank", "noopener"), {});
  bridge.onrequestdisplaymode = async ({ mode }) => (bridge.sendHostContextChange({ displayMode: mode }), { mode });
  bridge.oninitialized = async () => {
    await bridge.sendToolInput({ arguments: args });
    await bridge.sendToolResult(result);
  };
  await bridge.connect(new PostMessageTransport(iframe.contentWindow, iframe.contentWindow));
  iframe.srcdoc = html;
  return { bridge, setTheme: (t) => bridge.sendHostContextChange({ theme: t }) };
}

/** What to hand a view so it shows an existing canvas. */
export const reopen = (canvasId) => ({ args: { canvas_id: canvasId }, result: { content: [{ type: "text", text: "ok" }], structuredContent: { canvas_id: canvasId } } });
