// Local dev host: renders the canvas view the way Claude or ChatGPT would
// (iframe + MCP Apps bridge) and plays a fake agent, so the view can be
// checked without a tunnel. Not part of the test itself.

import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";

const TOKEN = location.pathname.split("/").pop();
const MCP = `/mcp/${TOKEN}`;
const $ = (s) => document.querySelector(s);

let rpcId = 0;
async function rpc(method, params) {
  const res = await fetch(MCP, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

function log(line) {
  const el = $("#log");
  el.textContent = `${new Date().toLocaleTimeString()}  ${line}\n` + el.textContent;
}

let canvasId = null;
let bridge = null;

const SAMPLE = [
  { link: "https://www.zappos.com/p/mens-keen-targhee-iv-waterproof-sea-turtle-roasted-pecan/product/9955906/color/1096579", name: "KEEN Targhee IV Waterproof", price: 169.99, store: "Zappos", details: [{ name: "Waterproof", value: "Yes, KEEN.DRY", source: "https://www.keenfootwear.com" }] },
  { link: "https://www.salomon.com/en-us/product/x-ultra-360-gore-tex-li5205/L47865300", name: "Salomon X Ultra 360 GTX", price: 155, store: "Salomon", details: [{ name: "Waterproof", value: "Yes, Gore-Tex" }] },
  { link: "https://obozfootwear.com/products/mens-sawtooth-x-low-waterproof", name: "Oboz Sawtooth X Low WP", price: 150, details: [{ name: "Waterproof", value: "Yes, B-DRY" }] },
  { link: "https://www.merrell.com/US/en/moab-3-waterproof/52474M.html", name: "Merrell Moab 3 Waterproof", price: 140, store: "Merrell", details: [{ name: "Waterproof", value: "Yes" }] },
  { link: "https://www.rei.com/product/229856/keen-targhee-iv-waterproof-hiking-shoes-mens", name: "KEEN Targhee IV WP (REI)", price: 160, store: "REI", details: [{ name: "Waterproof", value: "Yes" }] },
  { link: "https://obozfootwear.com/products/not-a-real-shoe-for-testing", name: "Made-up shoe (dead link test)", price: 99, details: [{ name: "Waterproof", value: "Yes" }] },
];

async function mountView(args, result) {
  // Use the canvas the server announces on open_canvas, like a real host.
  const tools = (await rpc("tools/list", {})).tools || [];
  const viewUri = tools.find((t) => t.name === "open_canvas")?._meta?.ui?.resourceUri;
  const res = await rpc("resources/read", { uri: viewUri });
  const html = res.contents[0].text;
  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
  $("#frame").replaceChildren(iframe);

  const hostContext = { displayMode: "fullscreen", availableDisplayModes: ["inline", "fullscreen"], theme: "light", platform: "web" };
  bridge = new AppBridge(
    null,
    { name: "Dev host", version: "0.1.0" },
    { serverTools: {}, message: { text: {} }, updateModelContext: { text: {} }, openLinks: {}, logging: {} },
    { hostContext },
  );
  bridge.oncalltool = (params) => rpc("tools/call", params);
  bridge.onupdatemodelcontext = async (params) => {
    $("#context").textContent = params.content?.map((c) => c.text).join("\n") || JSON.stringify(params);
    return {};
  };
  bridge.onmessage = async (params) => {
    const text = params.content?.map((c) => c.text).join("\n");
    if ($("#auto-allow").checked) {
      log(`message allowed: ${text}`);
      return {};
    }
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
  };
  bridge.onopenlink = async ({ url }) => (log(`open link: ${url}`), {});
  bridge.onrequestdisplaymode = async ({ mode }) => {
    bridge.sendHostContextChange({ displayMode: mode });
    return { mode };
  };
  bridge.onloggingmessage = (p) => log(`view log: ${JSON.stringify(p.data)}`);
  bridge.oninitialized = async () => {
    await bridge.sendToolInput({ arguments: args });
    await bridge.sendToolResult(result);
    log("view initialized");
  };
  await bridge.connect(new PostMessageTransport(iframe.contentWindow, iframe.contentWindow));
  iframe.srcdoc = html;
}

async function agentTool(name, args) {
  const r = await rpc("tools/call", { name, arguments: args });
  log(`agent ${name}: ${r.content?.[0]?.text?.split("\n")[0]}`);
  return r;
}

$("#open").onclick = async () => {
  const args = { title: "Waterproof hiking shoes under $150", cards: SAMPLE };
  const result = await agentTool("open_canvas", args);
  canvasId = result.structuredContent.canvas_id;
  await mountView(args, result);
};

$("#read").onclick = async () => {
  const r = await agentTool("read_canvas", { canvas_id: canvasId });
  $("#agent-out").textContent = r.content[0].text;
};

$("#fill").onclick = async () => {
  const st = (await rpc("tools/call", { name: "canvas_get", arguments: { canvas_id: canvasId } })).structuredContent.canvas;
  const values = [];
  const blanks = [];
  st.cards.filter((c) => !c.deleted).forEach((c, i) => {
    if (c.kind === "blank") blanks.push(c);
    for (const [detail, d] of Object.entries(c.details || {})) {
      if (d.state === "waiting") values.push(i % 3 === 2 ? { card_id: c.id, detail, couldnt_find: true } : { card_id: c.id, detail, value: i % 2 ? "Standard only" : "2E available", source: "https://example.com/spec" });
    }
  });
  if (values.length) await agentTool("fill_details", { canvas_id: canvasId, values });
  for (const b of blanks) {
    await agentTool("add_cards", { canvas_id: canvasId, cards: [{ link: "https://obozfootwear.com/products/mens-sawtooth-x-low-waterproof", name: `Filled "${b.hint}"`, price: 109, fills_blank: b.id }] });
  }
  if (!values.length && !blanks.length) log("no blanks waiting");
};

$("#point").onclick = async () => {
  const st = (await rpc("tools/call", { name: "canvas_get", arguments: { canvas_id: canvasId } })).structuredContent.canvas;
  const ids = st.cards.filter((c) => !c.deleted && c.kind === "product").slice(0, 2).map((c) => c.id);
  await agentTool("point_at_cards", { canvas_id: canvasId, card_ids: ids, note: "These two run narrow" });
};
