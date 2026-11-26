// Shopping canvas: one-day technical test.
// An MCP server with one MCP App (the canvas). The agent adds cards, fills
// blanks and points; the canvas sends the person's selection and blanks back.
//
// Run: npm start   (then expose it with a tunnel; see TEST_GUIDE.md)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { readProductPage, fetchImage } from "./pages.mjs";
import { findCatalogPhoto } from "./catalog.mjs";
import * as S from "./store.mjs";
import { renderReport, reportData } from "./report.mjs";

const PORT = Number(process.env.PORT || 8787);
const TOKEN = S.getToken();
const HERE = path.dirname(new URL(import.meta.url).pathname);
const VIEW_URI = "ui://shopping-canvas/canvas-v2.html"; // new name when the view changes: ChatGPT caches it for up to an hour
const clients = []; // which hosts connected (from MCP initialize)

// ---------- helpers ----------

function clean(s, max) {
  return String(s ?? "")
    .replace(/[\u0000-\u001f\u007f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function money(p) {
  if (!p) return "no price";
  const sym = { USD: "$", CAD: "CA$", GBP: "£", EUR: "€" }[p.currency] ?? (p.currency ? p.currency + " " : "$");
  return `${sym}${Number(p.amount).toFixed(2)}`;
}

function liveCards(canvas) {
  return canvas.cards.filter((c) => !c.deleted);
}

function detailKey(canvas, name) {
  const n = clean(name, 60);
  const existing = canvas.detailOrder.find((d) => d.toLowerCase() === n.toLowerCase());
  if (existing) return existing;
  canvas.detailOrder.push(n);
  return n;
}

function idList(ids) {
  return ids.length ? ids.join(", ") : "none";
}

function waitingBlanks(canvas) {
  const details = new Map();
  for (const card of liveCards(canvas)) {
    if (card.kind !== "product") continue;
    for (const [name, d] of Object.entries(card.details || {})) {
      if (d.state === "waiting") {
        if (!details.has(name)) details.set(name, []);
        details.get(name).push(card.id);
      }
    }
  }
  const cards = liveCards(canvas).filter((c) => c.kind === "blank");
  return { details, cards };
}

function blanksText(canvas) {
  const { details, cards } = waitingBlanks(canvas);
  const lines = [];
  for (const [name, ids] of details) lines.push(`- Detail "${name}" on ${idList(ids)}`);
  for (const b of cards) lines.push(`- Empty card ${b.id}, hint "${b.hint}"${b.like?.length ? `, like ${idList(b.like)}` : ""}`);
  return lines;
}

function cardLine(card) {
  if (card.kind === "blank") return `${card.id} · empty card · hint "${card.hint}"`;
  const parts = [card.id, card.name, `${money(card.price)}${card.price ? ` (${card.price.from === "page" ? "read from page" : "from you, not checked"})` : ""}`];
  if (card.store) parts.push(card.store);
  if (card.check === "dead_link") parts.push("LINK IS DEAD");
  if (!card.photo && card.check !== "checking") parts.push("no photo");
  for (const [name, d] of Object.entries(card.details || {})) {
    parts.push(`${name}: ${d.state === "answered" ? d.value : d.state === "waiting" ? "(blank, waiting for you)" : "couldn't find"}`);
  }
  return parts.join(" · ");
}

function ago(ms) {
  if (!ms) return "never";
  const s = Math.round((Date.now() - ms) / 1000);
  return s < 60 ? `${s}s ago` : `${Math.round(s / 60)} min ago`;
}

function canvasSummary(canvas, { full = true } = {}) {
  const live = liveCards(canvas);
  const trashed = canvas.cards.length - live.length;
  const v = canvas.view;
  const lines = [
    `Canvas ${canvas.id} "${canvas.title}": ${live.length} cards${trashed ? ` (${trashed} in the trash)` : ""}.`,
    `The person sees: ${v.selection.length ? `selected ${idList(v.selection)}` : "nothing selected"}; in view ${idList(v.inView)} (updated ${ago(v.at)}).`,
  ];
  const blanks = blanksText(canvas);
  lines.push(blanks.length ? "Blanks waiting for you:\n" + blanks.join("\n") : "No blanks waiting.");
  if (full) lines.push("Cards:\n" + live.map(cardLine).join("\n"));
  const trashedNames = canvas.cards.filter((c) => c.deleted && c.kind === "product").map((c) => `${c.id} ${c.name}`);
  if (full && trashedNames.length) lines.push("In the trash (the person said 'not these'): " + trashedNames.join("; "));
  return lines.join("\n");
}

/** The shape the view renders. No events, no raw source links for images. */
function viewState(canvas, base) {
  return {
    id: canvas.id,
    title: canvas.title,
    version: canvas.version,
    detailOrder: canvas.detailOrder,
    pointer: canvas.pointer,
    settings: canvas.settings,
    imgBase: `${base}/img/`,
    cards: canvas.cards.map((c) => ({
      id: c.id,
      kind: c.kind,
      deleted: !!c.deleted,
      name: c.name,
      link: c.link,
      store: c.store,
      price: c.price,
      photo: c.photo,
      check: c.check,
      checkReason: c.checkReason,
      details: c.details,
      hint: c.hint,
      like: c.like,
    })),
  };
}

// ---------- page reading (in the background, 4 at a time) ----------

const readQueue = [];
let reading = 0;
function enqueueRead(canvas, card) {
  readQueue.push({ canvasId: canvas.id, cardId: card.id, link: card.link });
  pumpReads();
}
function pumpReads() {
  while (reading < 4 && readQueue.length) {
    const job = readQueue.shift();
    reading++;
    runRead(job).catch((e) => console.error("read failed", e)).finally(() => {
      reading--;
      pumpReads();
    });
  }
}
async function runRead({ canvasId, cardId, link }) {
  const r = await readProductPage(link);
  const canvas = S.getCanvas(canvasId);
  const card = canvas?.cards.find((c) => c.id === cardId);
  if (!card || card.link !== link) return; // replaced meanwhile
  card.check = r.check;
  card.checkReason = r.reason;
  card.checkedAt = Date.now();
  if (!card.store) card.store = r.store;
  if (r.price) {
    const pagePrice = { amount: r.price.amount, currency: (r.price.currency || card.agentPrice?.currency || "USD").toUpperCase(), from: "page", readAt: Date.now() };
    if (card.agentPrice && Math.abs(card.agentPrice.amount - pagePrice.amount) / pagePrice.amount > 0.02) {
      S.logEvent(canvas, "price_mismatch", { card: card.id, agent: card.agentPrice.amount, page: pagePrice.amount });
    }
    card.price = pagePrice;
  }
  // Photo order: the store page, then Shopify's catalog (a matching listing, credited),
  // then the agent's photo_url. Each is used only if the image really loads.
  let agentPhoto = card.agentPhotoUrl ? "not needed" : "none";
  let catalogPhoto = "not needed";
  const stillCurrent = () => card.link === link && !card.deleted;
  if (r.photo) card.photo = { id: S.registerImage(r.photo), from: "page" };
  else if (r.check !== "dead_link") {
    try {
      const found = await findCatalogPhoto({ name: card.name, link, store: card.store }, UCP_PROFILE_URL);
      if (found.found) {
        const id = S.registerImage(found.imageUrl);
        imageCache.set(id, await fetchImage(found.imageUrl));
        if (stillCurrent()) card.photo = { id, from: "catalog", seller: found.seller, listing: found.listingUrl, title: found.title };
        catalogPhoto = `loaded: ${found.seller || "?"} (${found.title})`;
      } else catalogPhoto = `no match: ${found.reason}`;
    } catch (e) {
      catalogPhoto = `failed: ${e.message}`;
    }
    if (!card.photo && card.agentPhotoUrl) {
      const url = card.agentPhotoUrl;
      const id = S.registerImage(url);
      try {
        imageCache.set(id, await fetchImage(url));
        if (stillCurrent() && card.agentPhotoUrl === url) card.photo = { id, from: "agent" };
        agentPhoto = "loaded";
      } catch (e) {
        agentPhoto = `failed: ${e.message}`;
      }
    }
  }
  S.logEvent(canvas, "page_read", { card: card.id, link, check: r.check, photo: !!r.photo, price: !!r.price, catalogPhoto, agentPhoto, methods: r.methods, reason: r.reason, ms: r.ms });
  S.touch(canvas);
}

// ---------- canvas operations ----------

function linkKey(link) {
  try {
    const u = new URL(link);
    return u.hostname.replace(/^www\./, "").toLowerCase() + u.pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return link;
  }
}

function addCards(canvas, inputs) {
  const added = [];
  const filled = [];
  const updated = [];
  const notes = [];
  for (const input of inputs) {
    let card = null;
    if (input.fills_blank) {
      const blank = canvas.cards.find((c) => c.id === input.fills_blank && c.kind === "blank" && !c.deleted);
      if (blank) {
        card = blank;
        card.kind = "product";
        card.filledAt = Date.now();
        S.logEvent(canvas, "blank_filled", { kind: "card", card: card.id, hint: card.hint, ms: card.filledAt - card.createdAt });
        filled.push(card.id);
      } else {
        notes.push(`${input.fills_blank} is not an empty card, so the product was added as a new card.`);
      }
    }
    if (!card) {
      // Resending a product with the same link updates its card instead of duplicating it.
      card = canvas.cards.find((c) => !c.deleted && c.kind === "product" && linkKey(c.link) === linkKey(input.link)) || null;
      if (card) updated.push(card.id);
    }
    if (!card) {
      card = { id: S.nextCardId(canvas), kind: "product", createdAt: Date.now(), details: {}, deleted: false };
      canvas.cards.push(card);
      added.push(card.id);
    }
    card.link = input.link;
    card.name = clean(input.name, 140);
    card.store = input.store ? clean(input.store, 60) : card.store || null;
    card.agentPrice = input.price ? { amount: input.price, currency: (input.currency || "USD").toUpperCase() } : card.agentPrice || null;
    card.price = card.agentPrice ? { ...card.agentPrice, from: "agent", readAt: null } : null;
    card.agentPhotoUrl = input.photo_url || null;
    card.photo = null;
    card.check = "checking";
    card.details = card.details || {};
    for (const d of input.details || []) {
      const key = detailKey(canvas, d.name);
      card.details[key] = { state: "answered", value: clean(d.value, 200), source: d.source ? clean(d.source, 400) : null };
    }
    // New cards inherit the questions already asked.
    for (const name of canvas.detailOrder) {
      if (!card.details[name]) card.details[name] = { state: "waiting", since: Date.now() };
    }
    enqueueRead(canvas, card);
  }
  S.touch(canvas);
  return { added, filled, updated, notes };
}

function afterAddText(canvas, { added, filled, updated, notes }) {
  const lines = [];
  if (added.length) lines.push(`Added ${added.length} card(s): ${idList(added)}.`);
  if (updated.length) lines.push(`Updated ${updated.length} existing card(s) with the same link: ${idList(updated)}.`);
  if (filled.length) lines.push(`Filled empty card(s): ${idList(filled)}.`);
  lines.push(...notes);
  lines.push("The canvas is reading each store page now. Photo and price from the page replace yours when it can read them. When a store blocks it, the canvas looks for the same product in Shopify's catalog for a photo, and uses your photo_url last.");
  const blanks = blanksText(canvas);
  if (blanks.length) lines.push("Blanks still waiting (fill with fill_details):\n" + blanks.join("\n"));
  return lines.join("\n");
}

// ---------- the MCP server ----------

// The first 512 characters must stand alone: OpenAI says ChatGPT may weigh little beyond them.
const INSTRUCTIONS = `Shopping canvas: product cards beside the chat, shared by you and the person. Answers go on the canvas. When the person asks about products or the cards they selected ("these", "what's different?", "which is lighter?"), write each fact onto the cards with fill_details, one detail per fact, and call point_at_cards on the cards you mean. Keep your chat reply to a short take or recommendation; don't repeat the facts as a table in the chat.
- When the person wants product options, or says "put these on the canvas", call open_canvas with every product as a card. Each card needs a real product page link and a name; add price, store and any facts as details, with sources. Never invent a link.
- The person can select cards. "These", "this one" and questions that don't name cards mean the selection. The canvas puts what the person sees (the selection, or the cards in view when nothing is selected) into your context. If you can't see it, call read_canvas.
- Blanks are requests, and they wait for the person's next message. Whatever the person says next, also fill every blank listed as waiting in your context or in read_canvas, in the same reply. An empty detail: fill it for the listed cards with fill_details, one value per card with a source, or couldnt_find. An empty card with a hint: find one product that fits the hint and resembles the cards it was placed with, then add it with add_cards and fills_blank.
- Turn the person's own words into the first details. "Waterproof hiking shoes under $150" gives a "Waterproof" detail on every card.
- Give a card a photo_url if you saw the product's photo URL. Never make one up; the canvas checks that it loads. Without one, the canvas finds a photo itself when it can.
- Trashed cards mean "not these". Don't add them back.`;

const DetailInput = z.object({
  name: z.string().min(1).max(60).describe('Detail name, e.g. "Waterproof" or "Weight"'),
  value: z.string().min(1).max(200).describe('Short value, e.g. "Yes, Gore-Tex" or "380 g"'),
  source: z.string().max(400).optional().describe("Where you found it, ideally a URL"),
});

const CardInput = z.object({
  link: z.string().url().describe("The product page URL. Required. Never invent one."),
  name: z.string().min(1).max(140).describe("Short product name"),
  price: z.number().positive().optional().describe("Price you saw, as a number"),
  currency: z.string().length(3).optional().describe("ISO currency, default USD"),
  store: z.string().max(60).optional().describe("Store name"),
  photo_url: z
    .string()
    .url()
    .optional()
    .describe(
      "The product's main photo URL, if you saw one. Optional: the canvas reads the store page and looks in Shopify's catalog first. Never make one up; the canvas checks that it loads and labels it as yours.",
    ),
  details: z.array(DetailInput).max(20).optional(),
  fills_blank: z.string().optional().describe('The id of an empty card this product fills, e.g. "c12"'),
});

const appOnly = { ui: { visibility: ["app"] } };

function buildServer(base) {
  const server = new McpServer(
    { name: "shopping-canvas-test", version: "0.1.0", title: "Shopping Canvas (test)" },
    { instructions: INSTRUCTIONS },
  );

  registerAppResource(server, "Shopping canvas", VIEW_URI, { description: "The shopping canvas: product cards the person and the agent share." }, async () => ({
    contents: [
      {
        uri: VIEW_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: fs.readFileSync(path.join(HERE, "dist", "view.html"), "utf8"),
        _meta: {
          ui: {
            csp: { resourceDomains: [base] },
            prefersBorder: false,
            // Claude: try to open beside the chat (or full screen) after the tool returns.
            preferredDisplayMode: "fullscreen",
          },
        },
      },
    ],
  }));

  // --- tools the agent uses ---

  registerAppTool(
    server,
    "open_canvas",
    {
      title: "Open the shopping canvas",
      description:
        "Open the shopping canvas beside the chat, optionally with product cards. Use it whenever the person wants product options to browse, compare or decide on. Pass canvas_id to reopen an existing canvas. Returns the canvas id; use it with the other tools.",
      inputSchema: {
        title: z.string().max(80).optional().describe('What the person is shopping for, e.g. "Waterproof hiking shoes under $150"'),
        canvas_id: z.string().optional().describe("Reopen this canvas instead of making a new one"),
        cards: z.array(CardInput).max(30).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      _meta: { ui: { resourceUri: VIEW_URI } },
    },
    async ({ title, canvas_id, cards }) => {
      let canvas = canvas_id ? S.getCanvas(canvas_id) : null;
      const reopened = !!canvas;
      if (!canvas) canvas = S.createCanvas(title ? clean(title, 80) : null);
      S.logEvent(canvas, "agent_tool", { tool: "open_canvas", cards: cards?.length || 0, reopened });
      let text = reopened ? `Reopened canvas ${canvas.id}.` : `Opened canvas ${canvas.id}.`;
      if (cards?.length) text += "\n" + afterAddText(canvas, addCards(canvas, cards));
      text += "\nTell the person in one line what you put on the canvas. Don't repeat the cards in chat.";
      return {
        content: [{ type: "text", text }],
        structuredContent: { canvas_id: canvas.id, title: canvas.title, cards: liveCards(canvas).length },
      };
    },
  );

  server.registerTool(
    "add_cards",
    {
      title: "Add product cards",
      description:
        "Add products to the canvas, or fill an empty card the person left (set fills_blank to its id). Sending a product whose link is already on the canvas updates that card instead, for example to add its photo_url.",
      inputSchema: { canvas_id: z.string(), cards: z.array(CardInput).min(1).max(30) },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    },
    async ({ canvas_id, cards }) => {
      const canvas = S.getCanvas(canvas_id);
      if (!canvas) return { isError: true, content: [{ type: "text", text: `No canvas ${canvas_id}. Call open_canvas first.` }] };
      S.logEvent(canvas, "agent_tool", { tool: "add_cards", cards: cards.length, fills: cards.filter((c) => c.fills_blank).map((c) => c.fills_blank) });
      return { content: [{ type: "text", text: afterAddText(canvas, addCards(canvas, cards)) }] };
    },
  );

  server.registerTool(
    "fill_details",
    {
      title: "Fill in details on cards",
      description:
        "How you answer questions about cards: write the facts onto the cards as details instead of a table in the chat. Use it to fill the blanks the person left, and to show how the cards they asked about differ (weight, width options, membrane), one detail per fact. One value per card, each with a source. Use couldnt_find when you looked and found nothing; that is different from leaving it empty.",
      inputSchema: {
        canvas_id: z.string(),
        values: z
          .array(
            z.object({
              card_id: z.string(),
              detail: z.string().min(1).max(60),
              value: z.string().max(200).optional(),
              couldnt_find: z.boolean().optional(),
              source: z.string().max(400).optional(),
            }),
          )
          .min(1)
          .max(200),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ canvas_id, values }) => {
      const canvas = S.getCanvas(canvas_id);
      if (!canvas) return { isError: true, content: [{ type: "text", text: `No canvas ${canvas_id}.` }] };
      S.logEvent(canvas, "agent_tool", { tool: "fill_details", values: values.length });
      const problems = [];
      let n = 0;
      for (const v of values) {
        const card = canvas.cards.find((c) => c.id === v.card_id && !c.deleted && c.kind === "product");
        if (!card) {
          problems.push(`${v.card_id}: no such card`);
          continue;
        }
        const key = detailKey(canvas, v.detail);
        const prev = card.details[key];
        if (prev?.state === "waiting") {
          S.logEvent(canvas, "blank_filled", { kind: "detail", detail: key, card: card.id, ms: Date.now() - (prev.since || Date.now()) });
        }
        if (v.couldnt_find || !v.value) {
          card.details[key] = { state: "couldnt_find", source: v.source ? clean(v.source, 400) : null };
        } else {
          card.details[key] = { state: "answered", value: clean(v.value, 200), source: v.source ? clean(v.source, 400) : null };
        }
        n++;
      }
      S.touch(canvas);
      const blanks = blanksText(canvas);
      const text = [`Filled ${n} value(s).`, ...problems, blanks.length ? "Still waiting:\n" + blanks.join("\n") : "No blanks waiting."].join("\n");
      return { content: [{ type: "text", text }] };
    },
  );

  server.registerTool(
    "point_at_cards",
    {
      title: "Point at cards",
      description: "Light up the cards your reply is about, so the person sees which ones you mean. Call it whenever you name specific cards. An empty list clears it.",
      inputSchema: { canvas_id: z.string(), card_ids: z.array(z.string()).max(30), note: z.string().max(120).optional().describe("A few words shown with the highlight") },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ canvas_id, card_ids, note }) => {
      const canvas = S.getCanvas(canvas_id);
      if (!canvas) return { isError: true, content: [{ type: "text", text: `No canvas ${canvas_id}.` }] };
      const ids = card_ids.filter((id) => canvas.cards.some((c) => c.id === id && !c.deleted));
      canvas.pointer = { ids, note: note ? clean(note, 120) : null, at: Date.now() };
      S.logEvent(canvas, "agent_tool", { tool: "point_at_cards", ids });
      S.touch(canvas);
      return { content: [{ type: "text", text: ids.length ? `Pointing at ${idList(ids)}.` : "Cleared." }] };
    },
  );

  server.registerTool(
    "read_canvas",
    {
      title: "Read the canvas",
      description:
        "See what the person sees on the canvas: their selection (or the cards in view), the blanks waiting for you, and every card with its details. Call it when the person refers to cards without naming them and the selection isn't already in your context, or when they say 'go'.",
      inputSchema: { canvas_id: z.string().optional().describe("Defaults to the most recent canvas") },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ canvas_id }) => {
      const canvas = canvas_id ? S.getCanvas(canvas_id) : S.latestCanvas();
      if (!canvas) return { isError: true, content: [{ type: "text", text: "No canvas yet. Call open_canvas first." }] };
      S.logEvent(canvas, "agent_read", { selection: canvas.view.selection, inView: canvas.view.inView.length, viewAgeMs: canvas.view.at ? Date.now() - canvas.view.at : null });
      return { content: [{ type: "text", text: canvasSummary(canvas) }] };
    },
  );

  // --- tools only the canvas view calls ---

  const viewTool = (name, description, inputSchema, handler) =>
    registerAppTool(server, name, { title: name, description, inputSchema, _meta: appOnly, annotations: { readOnlyHint: name === "canvas_get", destructiveHint: false, openWorldHint: false } }, async (args) => {
      const canvas = S.getCanvas(args.canvas_id);
      if (!canvas) return { isError: true, content: [{ type: "text", text: "No such canvas" }] };
      const extra = (await handler(canvas, args)) || {};
      return {
        content: [{ type: "text", text: "ok" }],
        structuredContent: { ok: true, ...extra },
      };
    });

  viewTool("canvas_get", "Canvas state for the view", { canvas_id: z.string(), since: z.number().optional() }, (canvas, { since }) =>
    since === canvas.version ? { changed: false, version: canvas.version } : { changed: true, canvas: viewState(canvas, base) },
  );

  viewTool(
    "canvas_view",
    "What the person sees: selection and cards in view",
    { canvas_id: z.string(), selection: z.array(z.string()).max(200), in_view: z.array(z.string()).max(500) },
    (canvas, { selection, in_view }) => {
      const changed = selection.join() !== canvas.view.selection.join();
      canvas.view = { selection, inView: in_view, at: Date.now() };
      if (changed) S.logEvent(canvas, "selection_changed", { selection });
    },
  );

  viewTool(
    "canvas_add_detail",
    "The person left an empty detail",
    { canvas_id: z.string(), name: z.string().min(1).max(60), card_ids: z.array(z.string()).min(1).max(200), scope: z.enum(["selection", "view"]) },
    (canvas, { name, card_ids, scope }) => {
      const key = detailKey(canvas, name);
      const ids = [];
      for (const card of canvas.cards) {
        if (!card_ids.includes(card.id) || card.deleted || card.kind !== "product") continue;
        if (card.details[key]?.state === "answered") continue;
        card.details[key] = { state: "waiting", since: Date.now() };
        ids.push(card.id);
      }
      S.logEvent(canvas, "blank_created", { kind: "detail", detail: key, cards: ids, scope });
      S.touch(canvas);
      return { detail: key, card_ids: ids, version: canvas.version };
    },
  );

  viewTool(
    "canvas_add_blank_card",
    "The person left an empty card with a hint",
    { canvas_id: z.string(), hint: z.string().min(1).max(80), like_ids: z.array(z.string()).max(50) },
    (canvas, { hint, like_ids }) => {
      const card = { id: S.nextCardId(canvas), kind: "blank", hint: clean(hint, 80), like: like_ids, createdAt: Date.now(), details: {}, deleted: false };
      const lastLike = Math.max(-1, ...like_ids.map((id) => canvas.cards.findIndex((c) => c.id === id)));
      canvas.cards.splice(lastLike >= 0 ? lastLike + 1 : canvas.cards.length, 0, card);
      S.logEvent(canvas, "blank_created", { kind: "card", card: card.id, hint: card.hint, like: like_ids });
      S.touch(canvas);
      return { card_id: card.id, version: canvas.version };
    },
  );

  viewTool("canvas_delete", "The person trashed cards", { canvas_id: z.string(), card_ids: z.array(z.string()).max(200) }, (canvas, { card_ids }) => {
    for (const c of canvas.cards) if (card_ids.includes(c.id)) c.deleted = true;
    S.logEvent(canvas, "person_deleted", { cards: card_ids });
    S.touch(canvas);
    return { version: canvas.version };
  });

  viewTool("canvas_restore", "The person undid a delete", { canvas_id: z.string(), card_ids: z.array(z.string()).max(200) }, (canvas, { card_ids }) => {
    for (const c of canvas.cards) if (card_ids.includes(c.id)) c.deleted = false;
    S.logEvent(canvas, "person_restored", { cards: card_ids });
    S.touch(canvas);
    return { version: canvas.version };
  });

  viewTool(
    "canvas_settings",
    "Test settings",
    { canvas_id: z.string(), blanks: z.enum(["send", "wait"]).optional(), selection: z.enum(["context", "tool"]).optional() },
    (canvas, { blanks, selection }) => {
      if (blanks) canvas.settings.blanks = blanks;
      if (selection) canvas.settings.selection = selection;
      S.logEvent(canvas, "settings", { ...canvas.settings });
      S.touch(canvas);
      return { settings: canvas.settings, version: canvas.version };
    },
  );

  viewTool(
    "canvas_event",
    "Test log from the view",
    {
      canvas_id: z.string(),
      type: z.enum(["host_info", "message_result", "context_sent", "display_mode", "view_error", "link_opened"]),
      data: z.record(z.string(), z.any()).optional(),
    },
    (canvas, { type, data }) => {
      if (type === "host_info") canvas.host = data || null;
      S.logEvent(canvas, "view_" + type, { data: data || {} });
    },
  );

  return server;
}

// ---------- HTTP ----------

function baseUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || `localhost:${PORT}`).split(",")[0].trim();
  return `${proto}://${host}`;
}

function readBody(req, limit = 2_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("Body too large"));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const UCP_VERSION = "2026-08-25";
// The catalog has to fetch the profile, so it only works with a public address.
const UCP_PROFILE_URL = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL.replace(/\/$/, "")}/ucp-agent-profile.json` : null;
const UCP_PROFILE = {
  ucp: {
    version: UCP_VERSION,
    services: {
      "dev.ucp.shopping": [{ version: UCP_VERSION, spec: `https://ucp.dev/${UCP_VERSION}/specification/overview`, transport: "mcp", schema: `https://ucp.dev/${UCP_VERSION}/services/shopping/mcp.openrpc.json` }],
    },
    capabilities: {
      "dev.ucp.shopping.catalog.search": [{ version: UCP_VERSION, spec: `https://ucp.dev/${UCP_VERSION}/specification/shopping/catalog/`, schema: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/catalog_search.json` }],
      "dev.ucp.shopping.catalog.lookup": [{ version: UCP_VERSION, spec: `https://ucp.dev/${UCP_VERSION}/specification/shopping/catalog/`, schema: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/catalog_lookup.json` }],
      "dev.shopify.catalog.global": [{ version: UCP_VERSION, spec: "https://shopify.dev/docs/agents/catalog/global-catalog", schema: `https://shopify.dev/ucp/schemas/${UCP_VERSION}/shopify_catalog_global.json`, extends: ["dev.ucp.shopping.catalog.search", "dev.ucp.shopping.catalog.lookup"] }],
    },
    payment_handlers: {},
  },
};

const imageCache = new Map();
async function serveImage(id, req, res) {
  // Logged so we can tell whether the host's CSP lets the canvas load images at all.
  const who = req.headers["sec-fetch-dest"] || "";
  const src = S.imageSource(id);
  if (!src) {
    console.log(`img ${id} 404 ${who}`);
    res.writeHead(404).end();
    return;
  }
  let img = imageCache.get(id);
  if (!img) {
    try {
      img = await fetchImage(src);
    } catch (e) {
      console.log(`img ${id} 502 ${who} ${e.message}`);
      res.writeHead(502, { "content-type": "text/plain" }).end(e.message);
      return;
    }
    imageCache.set(id, img);
    if (imageCache.size > 300) imageCache.delete(imageCache.keys().next().value);
  }
  res.writeHead(200, {
    "content-type": img.type,
    "cache-control": "public, max-age=86400",
    "cross-origin-resource-policy": "cross-origin",
    "x-content-type-options": "nosniff",
  });
  console.log(`img ${id} 200 ${who}`);
  res.end(img.body);
}

function sendFile(res, file, type) {
  try {
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" }).end(fs.readFileSync(file));
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not built. Run npm run build.");
  }
}

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  try {
    if (p === `/mcp/${TOKEN}`) {
      if (req.method !== "POST") {
        res.writeHead(405, { "content-type": "application/json", allow: "POST" });
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed" }, id: null }));
        return;
      }
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : undefined;
      for (const msg of Array.isArray(body) ? body : [body]) {
        if (msg?.method === "tools/call") {
          // What the agent actually sends, so we know whether it includes photo_url.
          const a = msg.params?.arguments || {};
          const cards = Array.isArray(a.cards) ? a.cards : [];
          console.log(`call ${msg.params?.name}${cards.length ? ` cards=${cards.length} with_photo_url=${cards.filter((c) => c?.photo_url).length}` : ""}`);
        } else if (msg?.method) console.log(`mcp ${msg.method}`);
        if (msg?.method === "initialize") {
          clients.push({ at: Date.now(), clientInfo: msg.params?.clientInfo, capabilities: msg.params?.capabilities, protocolVersion: msg.params?.protocolVersion });
          if (clients.length > 50) clients.shift();
          console.log("client connected:", JSON.stringify(msg.params?.clientInfo));
        }
      }
      const server = buildServer(baseUrl(req));
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on("close", () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
      return;
    }
    if (p.startsWith("/img/") && req.method === "GET") {
      await serveImage(p.slice(5).replace(/[^a-f0-9]/g, ""), req, res);
      return;
    }
    if (p === `/report/${TOKEN}`) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      res.end(renderReport(S.allCanvases(), clients));
      return;
    }
    if (p === `/report/${TOKEN}.json`) {
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify(reportData(S.allCanvases(), clients), null, 2));
      return;
    }
    if (p === "/ucp-agent-profile.json") {
      // Shopify's keyless catalog fetches this to learn who is asking.
      res.writeHead(200, { "content-type": "application/json", "cache-control": "public, max-age=3600" });
      res.end(JSON.stringify(UCP_PROFILE));
      return;
    }
    if (p === `/dev/${TOKEN}`) return sendFile(res, path.join(HERE, "dist", "dev-host.html"), "text/html; charset=utf-8");
    if (p === "/") {
      res.writeHead(200, { "content-type": "text/plain" }).end("Shopping canvas technical test.\n");
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain" }).end("Server error");
  }
});

httpServer.listen(PORT, () => {
  // Look again for photos on recent cards that have none (e.g. read before the catalog step existed).
  for (const c of S.allCanvases()) {
    if (Date.now() - (c.createdAt || 0) > 3 * 86400e3) continue;
    for (const card of c.cards) if (card.kind === "product" && !card.deleted && !card.photo && card.link) enqueueRead(c, card);
  }
  const local = `http://localhost:${PORT}`;
  console.log(`\nShopping canvas test server on ${local}`);
  console.log(`  Connector URL path: /mcp/${TOKEN}`);
  console.log(`  Report:             ${local}/report/${TOKEN}`);
  console.log(`  Local dev host:     ${local}/dev/${TOKEN}`);
  if (process.env.PUBLIC_URL) {
    const pub = process.env.PUBLIC_URL.replace(/\/$/, "");
    const connector = `${pub}/mcp/${TOKEN}`;
    console.log(`\n  Connector URL:      ${connector}`);
    console.log(`  Add to Claude:      https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodeURIComponent("Shopping Canvas (test)")}&connectorUrl=${encodeURIComponent(connector)}`);
    console.log(`  Report (public):    ${pub}/report/${TOKEN}`);
  } else {
    console.log(`\n  No PUBLIC_URL set, so Claude and ChatGPT can't reach this yet. See TEST_GUIDE.md.`);
  }
});
