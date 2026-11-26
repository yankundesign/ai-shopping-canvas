// Shopping canvas: the MVP server.
// An MCP server with one MCP App (the canvas). The agent adds cards, answers
// requests and points; the canvas sends back what the person sees, their
// finalists and the requests they left.
//
// Run: npm start   (then expose it with a tunnel; see README.md)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
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
const DEFAULT_STYLE = process.env.STYLE || "trace";
const DEV_PANEL = process.env.DEV_PANEL !== "0"; // set DEV_PANEL=0 for the five-person test
const clients = []; // which hosts connected (from MCP initialize)

// ChatGPT keeps the canvas HTML for up to an hour, so the ui:// address is named
// after the built file: it changes whenever the canvas changes.
let viewCache = { mtime: 0, html: "", uri: "ui://shopping-canvas/canvas.html" };
function view() {
  const file = path.join(HERE, "dist", "view.html");
  try {
    const mtime = fs.statSync(file).mtimeMs;
    if (mtime !== viewCache.mtime) {
      const html = fs.readFileSync(file, "utf8");
      const hash = crypto.createHash("sha256").update(html).digest("hex").slice(0, 8);
      viewCache = { mtime, html, uri: `ui://shopping-canvas/canvas-${hash}.html` };
    }
  } catch {
    viewCache = { mtime: 0, html: "<p>The canvas isn't built. Run npm run build.</p>", uri: "ui://shopping-canvas/canvas.html" };
  }
  return viewCache;
}

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

const liveCards = (canvas) => canvas.cards.filter((c) => !c.deleted);
const liveProducts = (canvas) => canvas.cards.filter((c) => !c.deleted && c.kind === "product");
const idList = (ids) => (ids.length ? ids.join(", ") : "none");

function findDetail(canvas, name) {
  const n = clean(name, 60).toLowerCase();
  return canvas.detailOrder.find((d) => d.toLowerCase() === n) || null;
}

function addDetailName(canvas, name, by) {
  const existing = findDetail(canvas, name);
  if (existing) return existing;
  const n = clean(name, 60);
  canvas.detailOrder.push(n);
  canvas.detailBy ??= {};
  canvas.detailBy[n] = by;
  return n;
}

// Finalists sit side by side in the compare table; more than four won't fit beside a chat.
const MAX_FINALISTS = 4;
// A spec the agent added when the person asked to compare: shown in the compare table only.
const finalistsOnly = (canvas, name) => canvas.detailScope?.[name] === "finalists";
const specWaiting = (canvas) => (canvas.specRequest && !canvas.specRequest.answeredAt ? canvas.specRequest : null);
// The person's ask stays an invitation for a few minutes, so the agent can fill in more than one call.
const specInvitation = (canvas) => (canvas.specRequest && (!canvas.specRequest.answeredAt || Date.now() - canvas.specRequest.answeredAt < 5 * 60e3) ? canvas.specRequest : null);
const MAX_NEW_SPECS = 6;

function finalistIds(canvas) {
  canvas.finalists ??= [];
  canvas.finalists = canvas.finalists.filter((id) => canvas.cards.some((c) => c.id === id && !c.deleted && c.kind === "product"));
  return canvas.finalists;
}

function waitingRequests(canvas) {
  const details = new Map();
  const fin = finalistIds(canvas);
  for (const card of liveProducts(canvas)) {
    for (const [name, d] of Object.entries(card.details || {})) {
      // A compare spec is asked only of cards that are finalists now.
      if (d.state === "waiting" && (!finalistsOnly(canvas, name) || fin.includes(card.id))) {
        if (!details.has(name)) details.set(name, []);
        details.get(name).push(card.id);
      }
    }
  }
  const cards = liveCards(canvas).filter((c) => c.kind === "request");
  return { details, cards };
}

function requestsText(canvas) {
  const { details, cards } = waitingRequests(canvas);
  const lines = [];
  for (const [name, ids] of details) lines.push(`- Detail "${name}" for ${idList(ids)}: answer with fill_details`);
  for (const b of cards) lines.push(`- One more product, hint "${b.hint}"${b.like?.length ? `, like ${idList(b.like)}` : ""}: answer with add_cards and fills_request "${b.id}"`);
  const specs = specWaiting(canvas);
  if (specs) lines.push(`- Specs to compare the finalists ${idList(specs.ids)}: pick 4 to 6 specs that would decide between them and aren't on the canvas yet, then give every finalist a value with fill_details, each with its source. Give the value only ("546 g", not "546 g (heaviest)"): the canvas works out which is lightest or cheapest. New spec names are allowed for this; they show only in the compare table.`);
  return lines;
}

function cardLine(card) {
  if (card.kind === "request") return `${card.id} · request for one more product · hint "${card.hint}"`;
  // The agent's own price carries no note (in tests it repeated "not checked" back to the person); a price the page confirmed says so.
  const parts = [card.id, card.name, `${money(card.price)}${card.price?.from === "page" ? " (read from the store page)" : ""}`];
  if (card.store) parts.push(card.store);
  if (card.check === "dead_link") parts.push("LINK IS DEAD");
  for (const [name, d] of Object.entries(card.details || {})) {
    parts.push(`${name}: ${d.state === "answered" ? d.value : d.state === "waiting" ? "(waiting for you)" : "couldn't find"}`);
  }
  return parts.join(" · ");
}

function ago(ms) {
  if (!ms) return "never";
  const s = Math.round((Date.now() - ms) / 1000);
  return s < 60 ? `${s}s ago` : `${Math.round(s / 60)} min ago`;
}

function canvasSummary(canvas) {
  const live = liveCards(canvas);
  const trashed = canvas.cards.filter((c) => c.deleted && c.kind === "product");
  const v = canvas.view;
  const fin = finalistIds(canvas);
  const lines = [
    `Canvas ${canvas.id} "${canvas.title}": ${live.length} cards.`,
    `The person sees: ${v.selection.length ? `selected ${idList(v.selection)}` : "nothing selected"}; in view ${idList(v.inView)} (updated ${ago(v.at)}).`,
    fin.length
      ? `Finalists, the person's shortlist and the strongest signal here: ${idList(fin)}. Speak about them first.`
      : "No finalists yet.",
  ];
  const requests = requestsText(canvas);
  lines.push(requests.length ? "Requests waiting for you:\n" + requests.join("\n") : "No requests waiting.");
  const specs = canvas.detailOrder.filter((d) => finalistsOnly(canvas, d));
  const details = canvas.detailOrder.filter((d) => !finalistsOnly(canvas, d));
  lines.push(`The person's details: ${details.length ? details.join(", ") : "none"}.${specs.length ? ` Specs in the compare table, for the finalists: ${specs.join(", ")}.` : ""} Don't add others.`);
  lines.push("Cards:\n" + live.map(cardLine).join("\n"));
  if (trashed.length) lines.push("In the trash (the person said 'not these'): " + trashed.map((c) => `${c.id} ${c.name}`).join("; "));
  return lines.join("\n");
}

/** The shape the view renders. No events, no raw source links for images. */
function viewState(canvas, base) {
  return {
    id: canvas.id,
    title: canvas.title,
    version: canvas.version,
    detailOrder: canvas.detailOrder,
    detailScope: canvas.detailScope || {},
    specRequest: canvas.specRequest ? { ids: canvas.specRequest.ids, at: canvas.specRequest.at, answered: !!canvas.specRequest.answeredAt } : null,
    finalists: finalistIds(canvas),
    pointer: canvas.pointer,
    style: canvas.style || DEFAULT_STYLE,
    dev: DEV_PANEL,
    imgBase: `${base}/img/`,
    cards: canvas.cards.map((c) => ({
      id: c.id,
      kind: c.kind,
      deleted: !!c.deleted,
      x: c.x ?? null,
      y: c.y ?? null,
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
  const refused = new Set();
  // The agent starts the details from the person's words, with the first cards.
  // After that the details are the person's: the agent fills them, and adds none.
  const mayStartDetails = liveProducts(canvas).length === 0;
  for (const input of inputs) {
    let card = null;
    if (input.fills_request) {
      const request = canvas.cards.find((c) => c.id === input.fills_request && c.kind === "request" && !c.deleted);
      if (request) {
        card = request;
        card.kind = "product";
        card.filledAt = Date.now();
        S.logEvent(canvas, "request_filled", { kind: "card", card: card.id, hint: card.hint, ms: card.filledAt - card.createdAt });
        filled.push(card.id);
      } else {
        notes.push(`${input.fills_request} is not a waiting request, so the product was added as a new card.`);
      }
    }
    if (!card) {
      // Resending a product with the same link updates its card instead of duplicating it.
      card = canvas.cards.find((c) => !c.deleted && c.kind === "product" && linkKey(c.link) === linkKey(input.link)) || null;
      if (card) updated.push(card.id);
    }
    if (!card) {
      // No position: the canvas places new cards in empty space when it shows them.
      card = { id: S.nextCardId(canvas), kind: "product", createdAt: Date.now(), details: {}, deleted: false, x: null, y: null };
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
      let key = findDetail(canvas, d.name);
      if (!key && mayStartDetails) key = addDetailName(canvas, d.name, "agent");
      if (!key) {
        refused.add(clean(d.name, 60));
        continue;
      }
      card.details[key] = { state: "answered", value: clean(d.value, 200), source: d.source ? clean(d.source, 400) : null };
    }
    // New cards inherit the questions the person asked, and only those. A detail the
    // agent started is never shown as a waiting request the person didn't make.
    for (const name of canvas.detailOrder) {
      if (!card.details[name] && canvas.detailBy?.[name] === "person") card.details[name] = { state: "waiting", since: Date.now() };
    }
    enqueueRead(canvas, card);
  }
  if (refused.size) {
    notes.push(`Not added as details, because the person didn't ask for them: ${[...refused].join(", ")}. The details are theirs. Say these facts in the chat instead.`);
  }
  S.touch(canvas);
  return { added, filled, updated, notes };
}

function afterAddText(canvas, { added, filled, updated, notes }) {
  const lines = [];
  if (added.length) lines.push(`Added ${added.length} card(s): ${idList(added)}.`);
  if (updated.length) lines.push(`Updated ${updated.length} existing card(s) with the same link: ${idList(updated)}.`);
  if (filled.length) lines.push(`Answered the request(s) for one more product: ${idList(filled)}. When you tell the person about it, call point_at_cards on ${filled.length === 1 ? "that card" : "those cards"}.`);
  lines.push(...notes);
  lines.push("The canvas is reading each store page now. Photo and price from the page replace yours when it can read them.");
  const requests = requestsText(canvas);
  if (requests.length) lines.push("Requests still waiting:\n" + requests.join("\n"));
  return lines.join("\n");
}

// ---------- the MCP server ----------

// The first 512 characters must stand alone: OpenAI says ChatGPT may weigh little beyond them.
export const INSTRUCTIONS = `Shopping canvas: product cards beside the chat, shared with the person. Put products on it with open_canvas, each with a real link. "These" means the cards the person selected. In every reply, answer each request listed as waiting: fill_details for a detail, add_cards with fills_request for one more product. Call point_at_cards on the cards you name. Details belong to the person: never add one they didn't ask for. Answer comparisons briefly in the chat. Finalists are their shortlist: speak about them first.
- When the person wants product options, or says "put these on the canvas", call open_canvas with every product as a card. Each card needs a real product page link and a name; add price and store if you know them. Never invent a link.
- Start the details from the person's own words, with the first cards only. "Waterproof hiking shoes under $150" gives a "Waterproof" detail on every card, with a source. After that, add a detail only when the person asks you in the chat to put it on the cards ("add the weight to the cards"): fill_details with asked_in_chat set to their words. Otherwise the person adds details and you fill them.
- The canvas puts what the person sees into your context: the selection (or the cards in view when nothing is selected), their finalists, and the requests waiting. If you can't see it, call read_canvas.
- Requests wait for the person's next message. Whatever they say next, also answer every waiting request in the same reply. A detail: one value per listed card with fill_details, each with its source, or couldnt_find when you looked and found nothing. One more product: find one that fits the hint and resembles the cards it was placed with, then add_cards with fills_request.
- When the person asks for specs to compare their finalists, that is your invitation: pick 4 to 6 specs that would decide between them (weight, fit, warranty, returns), skip ones already on the canvas, and fill every finalist with fill_details and a source. Those rows show only in the compare table.
- Finalists are the cards the person pulled up to compare. Treat them as the strongest signal: "Of your three finalists, only the Targhee is under $150."
- Comparison questions and opinions get a short answer in the chat, naming the cards, with point_at_cards so they light up. Don't write the comparison onto the cards.
- You never move, remove or reorder cards, and never change the person's details.
- Give a card a photo_url only if you saw the product's photo URL. Never make one up; the canvas checks that it loads.
- Trashed cards mean "not these". Don't add them back.`;

const DetailInput = z.object({
  name: z.string().min(1).max(60).describe('Detail name, e.g. "Waterproof"'),
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
    .describe("The product's main photo URL, if you saw one. Optional: the canvas reads the store page and looks in Shopify's catalog first. Never make one up; the canvas checks that it loads and labels it as yours."),
  details: z
    .array(DetailInput)
    .max(20)
    .optional()
    .describe("With the first cards: details taken from the person's own words. Later: values for details that already exist on the canvas. Other names are dropped."),
  fills_request: z.string().optional().describe('The id of the request for one more product that this card answers, e.g. "c12"'),
});

const appOnly = { ui: { visibility: ["app"] } };

function buildServer(base) {
  const server = new McpServer({ name: "shopping-canvas", version: "0.2.0", title: "Shopping Canvas" }, { instructions: INSTRUCTIONS });
  const VIEW_URI = view().uri;

  registerAppResource(server, "Shopping canvas", VIEW_URI, { description: "The shopping canvas: product cards the person and the agent share." }, async () => ({
    contents: [
      {
        uri: VIEW_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: view().html,
        _meta: {
          ui: {
            csp: { resourceDomains: [base] },
            prefersBorder: false,
            // The canvas opens beside the chat, so the person keeps chatting with it in view.
            // Claude reads this one: its full screen is a panel beside the chat.
            preferredDisplayMode: "fullscreen",
          },
          // ChatGPT reads its own key and opens inline without it. Its full screen keeps the
          // message box over the canvas and shows replies as a short line above it.
          "openai/ui": { availableDisplayModes: ["inline", "fullscreen"], preferredDisplayMode: "fullscreen" },
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
        "Open the shopping canvas beside the chat, optionally with product cards. Use it whenever the person wants product options to browse, compare or decide on. Pass canvas_id to reopen the canvas from earlier in this chat. Returns the canvas id; use it with the other tools.",
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
        "Add products to the canvas, or answer a request for one more product (set fills_request to its id). New cards arrive in empty space; you can't place them. Sending a product whose link is already on the canvas updates that card instead.",
      inputSchema: { canvas_id: z.string(), cards: z.array(CardInput).min(1).max(30) },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    },
    async ({ canvas_id, cards }) => {
      const canvas = S.getCanvas(canvas_id);
      if (!canvas) return { isError: true, content: [{ type: "text", text: `No canvas ${canvas_id}. Call open_canvas first.` }] };
      S.logEvent(canvas, "agent_tool", { tool: "add_cards", cards: cards.length, fills: cards.filter((c) => c.fills_request).map((c) => c.fills_request) });
      return { content: [{ type: "text", text: afterAddText(canvas, addCards(canvas, cards)) }] };
    },
  );

  server.registerTool(
    "fill_details",
    {
      title: "Fill in details on cards",
      description:
        "Answer the person's detail requests: one value per card, each with its source. Use couldnt_find when you looked and found nothing; that is different from leaving it empty. Only details already on the canvas can be filled; the details are the person's, so say other facts in the chat. Two exceptions. When the person asks you in this chat to put something on the cards, give it a new detail name and set asked_in_chat to their words. When they asked for specs to compare their finalists, give those finalists new spec names (up to 6).",
      inputSchema: {
        canvas_id: z.string(),
        values: z
          .array(
            z.object({
              card_id: z.string(),
              detail: z.string().min(1).max(60).describe("The name of a detail already on the canvas, or a new one the person asked for"),
              value: z.string().max(200).optional().describe('The value only, e.g. "Yes, 2E" or "380 g". No comparisons such as "(heaviest)": the canvas works those out.'),
              couldnt_find: z.boolean().optional(),
              source: z.string().max(400).optional(),
            }),
          )
          .min(1)
          .max(200),
        asked_in_chat: z
          .string()
          .max(300)
          .optional()
          .describe("Only when the person asked you in this chat to put this on the cards: their words, quoted. It lets you add a new detail. Never set it on your own initiative."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ canvas_id, values, asked_in_chat }) => {
      const canvas = S.getCanvas(canvas_id);
      if (!canvas) return { isError: true, content: [{ type: "text", text: `No canvas ${canvas_id}.` }] };
      S.logEvent(canvas, "agent_tool", { tool: "fill_details", values: values.length });
      const problems = [];
      const uninvited = new Set();
      const tooMany = new Set();
      const invite = specInvitation(canvas);
      // The person asked in the chat: that is their invitation, like + Detail, and the detail is theirs.
      const askedWords = asked_in_chat && asked_in_chat.trim().length >= 3 ? clean(asked_in_chat, 300) : null;
      const askedFor = new Set();
      let specsTouched = false;
      let n = 0;
      for (const v of values) {
        const card = canvas.cards.find((c) => c.id === v.card_id && !c.deleted && c.kind === "product");
        if (!card) {
          problems.push(`${v.card_id}: no such card`);
          continue;
        }
        let key = findDetail(canvas, v.detail);
        if (!key && askedWords) {
          if (askedFor.size >= 3) {
            tooMany.add(clean(v.detail, 60));
            continue;
          }
          key = addDetailName(canvas, v.detail, "person");
          askedFor.add(key);
          S.logEvent(canvas, "detail_added_on_request", { detail: key, words: askedWords });
        }
        if (!key && invite?.ids.includes(card.id)) {
          // The person asked for specs to compare: the agent may name new ones, for the finalists only.
          invite.added ??= [];
          if (invite.added.length >= MAX_NEW_SPECS) {
            tooMany.add(clean(v.detail, 60));
            continue;
          }
          key = addDetailName(canvas, v.detail, "agent");
          canvas.detailScope ??= {};
          canvas.detailScope[key] = "finalists";
          invite.added.push(key);
          S.logEvent(canvas, "spec_added", { detail: key });
        }
        if (!key) {
          uninvited.add(clean(v.detail, 60));
          continue;
        }
        if (invite?.ids.includes(card.id)) specsTouched = true;
        const prev = card.details[key];
        if (prev?.state === "waiting") {
          S.logEvent(canvas, "request_filled", { kind: "detail", detail: key, card: card.id, ms: Date.now() - (prev.since || Date.now()) });
        }
        if (v.couldnt_find || !v.value) {
          card.details[key] = { state: "couldnt_find", source: v.source ? clean(v.source, 400) : null };
        } else {
          card.details[key] = { state: "answered", value: clean(v.value, 200), source: v.source ? clean(v.source, 400) : null };
        }
        n++;
      }
      const waitingSpecs = specWaiting(canvas);
      if (waitingSpecs && specsTouched) {
        waitingSpecs.answeredAt = Date.now();
        S.logEvent(canvas, "request_filled", { kind: "specs", specs: waitingSpecs.added || [], ms: waitingSpecs.answeredAt - waitingSpecs.at });
      }
      if (tooMany.size) problems.push(`Not added: ${[...tooMany].join(", ")}. Up to ${MAX_NEW_SPECS} new specs per request, and 3 new details per call.`);
      if (uninvited.size) {
        S.logEvent(canvas, "uninvited_detail", { details: [...uninvited] });
        problems.push(`Not written: ${[...uninvited].join(", ")}. The person hasn't asked for ${uninvited.size === 1 ? "that detail" : "those details"}, and the details are theirs. Say it briefly in the chat instead. If they asked you in this chat to put it on the cards, call fill_details again with asked_in_chat set to their words.`);
      }
      S.touch(canvas);
      const requests = requestsText(canvas);
      const text = [`Filled ${n} value(s).`, ...problems, requests.length ? "Still waiting:\n" + requests.join("\n") : "No requests waiting."].join("\n");
      return { content: [{ type: "text", text }] };
    },
  );

  server.registerTool(
    "point_at_cards",
    {
      title: "Point at cards",
      description:
        "Light up the cards your reply is about, so the person sees which ones you mean. Call it whenever you name specific cards. When you name cards for different reasons, give each a reason of a word or two. It never moves the person's view. An empty list clears it.",
      inputSchema: {
        canvas_id: z.string(),
        card_ids: z.array(z.string()).max(30),
        note: z.string().max(120).optional().describe("A few words shown with the highlight"),
        reasons: z
          .array(z.object({ card_id: z.string(), reason: z.string().max(40).describe('A word or two, e.g. "Cheapest" or "Roomiest"') }))
          .max(30)
          .optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ canvas_id, card_ids, note, reasons }) => {
      const canvas = S.getCanvas(canvas_id);
      if (!canvas) return { isError: true, content: [{ type: "text", text: `No canvas ${canvas_id}.` }] };
      const isLive = (id) => canvas.cards.some((c) => c.id === id && !c.deleted);
      const ids = [...new Set([...card_ids, ...(reasons || []).map((r) => r.card_id)])].filter(isLive);
      const why = {};
      for (const r of reasons || []) if (isLive(r.card_id)) why[r.card_id] = clean(r.reason, 40);
      canvas.pointer = { ids, note: note ? clean(note, 120) : null, reasons: why, at: Date.now() };
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
        "See what the person sees on the canvas: their selection (or the cards in view), their finalists, the requests waiting for you, and every card with its details. Call it when the person refers to cards without naming them and the selection isn't already in your context, or when they say 'go'.",
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

  const Ids = z.array(z.string()).max(200);

  viewTool("canvas_get", "Canvas state for the view", { canvas_id: z.string(), since: z.number().optional() }, (canvas, { since }) =>
    since === canvas.version ? { changed: false, version: canvas.version } : { changed: true, canvas: viewState(canvas, base) },
  );

  viewTool("canvas_view", "What the person sees: selection and cards in view", { canvas_id: z.string(), selection: Ids, in_view: z.array(z.string()).max(500) }, (canvas, { selection, in_view }) => {
    const changed = selection.join() !== canvas.view.selection.join();
    canvas.view = { selection, inView: in_view, at: Date.now() };
    if (changed) S.logEvent(canvas, "selection_changed", { selection });
  });

  viewTool(
    "canvas_move",
    "The person moved cards, or the canvas placed new ones in empty space",
    { canvas_id: z.string(), positions: z.array(z.object({ id: z.string(), x: z.number(), y: z.number() })).max(300), by: z.enum(["person", "canvas", "room"]) },
    (canvas, { positions, by }) => {
      for (const p of positions) {
        const card = canvas.cards.find((c) => c.id === p.id);
        if (!card) continue;
        if (by === "canvas" && card.x != null) continue; // another window placed it first
        card.x = Math.round(p.x);
        card.y = Math.round(p.y);
      }
      if (by === "person") S.logEvent(canvas, "person_moved", { cards: positions.map((p) => p.id) });
      S.touch(canvas);
      return { version: canvas.version };
    },
  );

  viewTool("canvas_finalists", "The person's finalists, in their order", { canvas_id: z.string(), card_ids: Ids, how: z.enum(["compare", "drag", "remove", "clear", "undo"]).optional() }, (canvas, { card_ids, how }) => {
    const before = finalistIds(canvas);
    canvas.finalists = [...new Set(card_ids)].slice(0, MAX_FINALISTS);
    // A card joining the compare table asks for the specs the others already have;
    // a card leaving it stops asking (values it already has stay, out of sight).
    const now = finalistIds(canvas);
    for (const card of canvas.cards) {
      if (now.includes(card.id) && !before.includes(card.id)) {
        for (const name of canvas.detailOrder) if (finalistsOnly(canvas, name) && !card.details[name]) card.details[name] = { state: "waiting", since: Date.now() };
      } else if (!now.includes(card.id) && before.includes(card.id)) {
        for (const name of Object.keys(card.details || {})) if (finalistsOnly(canvas, name) && card.details[name].state === "waiting") delete card.details[name];
      }
    }
    S.logEvent(canvas, "finalists_changed", { finalists: finalistIds(canvas), how: how || null });
    S.touch(canvas);
    return { finalists: canvas.finalists, version: canvas.version };
  });

  viewTool(
    "canvas_add_detail",
    "The person left a request: a detail to fill",
    { canvas_id: z.string(), name: z.string().min(1).max(60), card_ids: Ids.min(1), scope: z.enum(["selection", "view"]) },
    (canvas, { name, card_ids, scope }) => {
      const key = addDetailName(canvas, name, "person");
      canvas.detailBy[key] = "person"; // asking for an existing detail makes it theirs
      if (canvas.detailScope) delete canvas.detailScope[key]; // and puts it on every card
      const ids = [];
      for (const card of canvas.cards) {
        if (!card_ids.includes(card.id) || card.deleted || card.kind !== "product") continue;
        if (card.details[key]?.state === "answered") continue;
        card.details[key] = { state: "waiting", since: Date.now() };
        ids.push(card.id);
      }
      S.logEvent(canvas, "request_created", { kind: "detail", detail: key, cards: ids, scope });
      S.touch(canvas);
      return { detail: key, card_ids: ids, version: canvas.version };
    },
  );

  viewTool(
    "canvas_add_request_card",
    "The person left a request: an empty card with a hint",
    { canvas_id: z.string(), hint: z.string().min(1).max(80), like_ids: Ids, x: z.number(), y: z.number() },
    (canvas, { hint, like_ids, x, y }) => {
      const card = { id: S.nextCardId(canvas), kind: "request", hint: clean(hint, 80), like: like_ids, createdAt: Date.now(), details: {}, deleted: false, x: Math.round(x), y: Math.round(y) };
      canvas.cards.push(card);
      S.logEvent(canvas, "request_created", { kind: "card", card: card.id, hint: card.hint, like: like_ids });
      S.touch(canvas);
      return { card_id: card.id, version: canvas.version };
    },
  );

  viewTool("canvas_request_specs", "The person asked for specs to compare their finalists", { canvas_id: z.string(), card_ids: Ids.min(2) }, (canvas, { card_ids }) => {
    const ids = card_ids.filter((id) => finalistIds(canvas).includes(id));
    canvas.specRequest = { ids, at: Date.now(), added: [] };
    S.logEvent(canvas, "request_created", { kind: "specs", cards: ids });
    S.touch(canvas);
    return { card_ids: ids, version: canvas.version };
  });

  viewTool("canvas_remove_spec", "The person removed a row from the compare table", { canvas_id: z.string(), name: z.string().min(1).max(60) }, (canvas, { name }) => {
    const key = findDetail(canvas, name);
    if (!key || !finalistsOnly(canvas, key)) return { removed: false, version: canvas.version };
    canvas.detailOrder = canvas.detailOrder.filter((d) => d !== key);
    delete canvas.detailScope[key];
    if (canvas.detailBy) delete canvas.detailBy[key];
    for (const c of canvas.cards) if (c.details) delete c.details[key];
    S.logEvent(canvas, "spec_removed", { detail: key });
    S.touch(canvas);
    return { removed: true, version: canvas.version };
  });

  viewTool("canvas_delete", "The person trashed cards", { canvas_id: z.string(), card_ids: Ids }, (canvas, { card_ids }) => {
    for (const c of canvas.cards) if (card_ids.includes(c.id)) c.deleted = true;
    S.logEvent(canvas, "person_deleted", { cards: card_ids });
    S.touch(canvas);
    return { version: canvas.version };
  });

  viewTool("canvas_restore", "The person undid a delete", { canvas_id: z.string(), card_ids: Ids, finalists: Ids.optional() }, (canvas, { card_ids, finalists }) => {
    for (const c of canvas.cards) if (card_ids.includes(c.id)) c.deleted = false;
    if (finalists) canvas.finalists = finalists;
    S.logEvent(canvas, "person_restored", { cards: card_ids });
    S.touch(canvas);
    return { version: canvas.version };
  });

  viewTool("canvas_pointer_clear", "The person dismissed the agent's pointing", { canvas_id: z.string() }, (canvas) => {
    canvas.pointer = { ids: [], note: null, reasons: {}, at: Date.now() };
    S.touch(canvas);
    return { version: canvas.version };
  });

  viewTool("canvas_style", "Dev panel: the style variant for this canvas", { canvas_id: z.string(), style: z.string().regex(/^[a-z]{1,20}$/) }, (canvas, { style }) => {
    canvas.style = style;
    S.touch(canvas);
    return { style, version: canvas.version };
  });

  viewTool(
    "canvas_event",
    "Log from the view",
    {
      canvas_id: z.string(),
      type: z.enum(["host_info", "message_result", "context_sent", "display_mode", "view_error", "link_opened", "request_waiting"]),
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
  const src = S.imageSource(id);
  if (!src) {
    res.writeHead(404).end();
    return;
  }
  let img = imageCache.get(id);
  if (!img) {
    try {
      img = await fetchImage(src);
    } catch (e) {
      console.log(`img ${id} 502 ${e.message}`);
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
        if (msg?.method === "tools/call" && !String(msg.params?.name).startsWith("canvas_")) console.log(`call ${msg.params?.name}`);
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
    if (p === `/dev/${TOKEN}/styles`) return sendFile(res, path.join(HERE, "dist", "dev-styles.html"), "text/html; charset=utf-8");
    if (p === "/") {
      res.writeHead(200, { "content-type": "text/plain" }).end("Shopping canvas.\n");
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain" }).end("Server error");
  }
});

httpServer.listen(PORT, () => {
  // Look again for photos on recent cards that have none.
  for (const c of S.allCanvases()) {
    if (Date.now() - (c.createdAt || 0) > 3 * 86400e3) continue;
    for (const card of c.cards) if (card.kind === "product" && !card.deleted && !card.photo && card.link) enqueueRead(c, card);
  }
  const local = `http://localhost:${PORT}`;
  console.log(`\nShopping canvas on ${local}`);
  console.log(`  Style review:                 ${local}/dev/${TOKEN}/styles`);
  console.log(`  Local dev host (fake agent):  ${local}/dev/${TOKEN}`);
  console.log(`  Report:                       ${local}/report/${TOKEN}`);
  if (process.env.PUBLIC_URL) {
    const pub = process.env.PUBLIC_URL.replace(/\/$/, "");
    const connector = `${pub}/mcp/${TOKEN}`;
    console.log(`\n  Connector URL:  ${connector}`);
    console.log(`  Add to Claude:  https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodeURIComponent("Shopping Canvas")}&connectorUrl=${encodeURIComponent(connector)}`);
  } else {
    console.log(`\n  No PUBLIC_URL set, so Claude and ChatGPT can't reach this yet. See README.md.`);
  }
});
