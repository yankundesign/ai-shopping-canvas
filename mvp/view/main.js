// The canvas view (MCP App): a free canvas of product cards, the finalists area
// above it, and the agent's pointing. It has no intelligence of its own: it
// carries what the person sees and asks for to their agent, and shows the answers.
//
// Structure and behaviour live here and in styles/base.css. How it looks lives in
// styles/<variant>.css; see styles/variants.mjs.

import { App } from "@modelcontextprotocol/ext-apps";
import { differences } from "./differences.mjs";
import { waitingRequests as waitingFor, contextText as contextFor } from "./context.mjs";
import { VARIANTS } from "./styles/variants.mjs";

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const CARD_W = 232; // matches --card-w in base.css
const GAP_X = 28;
const GAP_Y = 44;
const ROOM = 16; // the least space kept below a card that grows

const root = document.documentElement;
const stage = $("#stage");
const world = $("#world");
const finPanel = $("#finalists");
const finRow = $("#fin-row");

const app = new App({ name: "Shopping canvas", version: "0.2.0" }, { availableDisplayModes: ["inline", "fullscreen"] }, { autoResize: true });

let canvasId = null;
let state = null;
let version = 0;
let agent = "the agent";
let devTheme = "";
const selection = new Set();
let inView = new Set();
const fresh = new Set(); // cards that arrived since the canvas opened and haven't been seen
const undoStack = [];
const els = new Map(); // id -> { el, json }
let heights = new Map(); // id -> rendered height, for canvas cards
const cam = { x: 0, y: 0, k: 1 };
let fitted = false;
let loadedOnce = false;
let drag = null; // { ids, start: Map, pos: Map } while canvas cards are being dragged
const homeH = new Map(); // id -> the height a card last had on the canvas, kept while it is a finalist
let pollTimer = null;
let lastContextText = "";
const viewLog = [];

// ---------- host connection ----------

app.addEventListener("toolinput", (p) => {
  if (p?.arguments?.canvas_id) setCanvas(p.arguments.canvas_id);
});
app.addEventListener("toolresult", (p) => {
  const id = p?.structuredContent?.canvas_id;
  if (id) setCanvas(id);
});
app.addEventListener("hostcontextchanged", () => {
  applyHostContext();
  if (canvasId) logEvent("display_mode", { displayMode: app.getHostContext()?.displayMode });
});

function applyHostContext() {
  const ctx = app.getHostContext() || {};
  root.dataset.theme = devTheme || ctx.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.dataset.mode = ctx.displayMode || "inline";
  const known = (id) => (VARIANTS.some((v) => v.id === id) ? id : null);
  root.dataset.style = known(root.dataset.forceStyle) || known(state?.style) || VARIANTS[0].id;
  renderBar();
}

function hostInfo() {
  const v = app.getHostVersion() || {};
  const ctx = app.getHostContext() || {};
  const caps = app.getHostCapabilities() || {};
  return {
    name: v.name,
    version: v.version,
    displayMode: ctx.displayMode,
    availableDisplayModes: ctx.availableDisplayModes,
    platform: ctx.platform,
    capabilities: { serverTools: !!caps.serverTools, message: caps.message ?? null, updateModelContext: caps.updateModelContext ?? null, openLinks: !!caps.openLinks },
    userAgent: navigator.userAgent,
  };
}

async function logEvent(type, data) {
  viewLog.push({ at: new Date().toLocaleTimeString(), type, data });
  if (viewLog.length > 40) viewLog.shift();
  renderDev();
  if (!canvasId) return;
  try {
    await app.callServerTool({ name: "canvas_event", arguments: { canvas_id: canvasId, type, data } });
  } catch {
    // logging must never break the canvas
  }
}

function setCanvas(id) {
  if (canvasId === id) return;
  canvasId = id;
  version = 0;
  logEvent("host_info", hostInfo());
  poll();
}

// ---------- server state ----------

async function call(name, args) {
  const r = await app.callServerTool({ name, arguments: { canvas_id: canvasId, ...args } });
  if (r?.isError) throw new Error(r.content?.[0]?.text || `${name} failed`);
  return r?.structuredContent || {};
}

// Things the person just did, shown at once and kept on top of older server
// state until the server has caught up, so nothing snaps back under them.
const pending = [];

function optimistic(apply, run, failText) {
  const op = { apply, until: null };
  pending.push(op);
  apply(state);
  render();
  viewChanged();
  run()
    .then((v) => (op.until = v || 0))
    .catch((e) => {
      pending.splice(pending.indexOf(op), 1);
      version = 0;
      setStatus(`${failText}: ${e.message}`, "op", 6000);
    })
    .finally(poll);
}

function applyServer(s) {
  state = s;
  version = s.version;
  for (const op of [...pending]) {
    if (op.until != null && s.version >= op.until) pending.splice(pending.indexOf(op), 1);
    else op.apply(state);
  }
}

let polling = false;
async function poll() {
  clearTimeout(pollTimer);
  if (!canvasId) return;
  if (polling) return;
  polling = true;
  try {
    const r = await app.callServerTool({ name: "canvas_get", arguments: { canvas_id: canvasId, since: version } });
    if (r?.isError) throw new Error(r.content?.[0]?.text || "canvas_get failed");
    const sc = r?.structuredContent;
    if (sc?.changed) {
      applyServer(sc.canvas);
      render();
      loadedOnce = true;
      viewChanged(); // keep the agent's context in step (answered requests, new cards)
    }
    setStatus(null, "poll");
  } catch (e) {
    setStatus(`Can't reach the canvas server: ${e.message}`, "poll");
  }
  polling = false;
  pollTimer = setTimeout(poll, document.hidden ? 5000 : 1500);
}

const live = () => (state?.cards || []).filter((c) => !c.deleted);
const byId = (id) => (state?.cards || []).find((c) => c.id === id);
const isProduct = (c) => c && !c.deleted && c.kind === "product";
const finalistIds = () => (state?.finalists || []).filter((id) => isProduct(byId(id)));
const canvasCards = () => {
  const fin = finalistIds();
  return live().filter((c) => !fin.includes(c.id));
};
const shortName = (c) => (c?.name || "").split(/\s+/).slice(0, 3).join(" ");

// ---------- what the person sees, sent to the agent ----------

let viewTimer = null;
function viewChanged() {
  clearTimeout(viewTimer);
  viewTimer = setTimeout(sendView, 250);
  renderBar();
}

function scopeIds() {
  const sel = [...selection].filter((id) => isProduct(byId(id)));
  if (sel.length) return { ids: sel, scope: "selection" };
  return { ids: live().filter((c) => isProduct(c) && inView.has(c.id)).map((c) => c.id), scope: "view" };
}

// The text and the requests come from context.mjs, which the prompt tests use too.
const waitingRequests = () => waitingFor(state);
const contextText = () => contextFor(state, { canvasId, selection: [...selection], inView: [...inView] });

// One update at a time, in order: overlapping updates arrived out of order in the test.
let viewChain = Promise.resolve();
function sendView() {
  viewChain = viewChain.then(doSendView, doSendView);
  return viewChain;
}
async function doSendView() {
  if (!canvasId || !state) return;
  const sel = [...selection].filter((id) => byId(id) && !byId(id).deleted);
  const view = live().filter((c) => inView.has(c.id)).map((c) => c.id);
  try {
    await call("canvas_view", { selection: sel, in_view: view });
  } catch (e) {
    setStatus(`Couldn't save the selection: ${e.message}`, "view", 5000);
  }
  const text = contextText();
  if (text === lastContextText) return;
  lastContextText = text;
  try {
    await app.updateModelContext({ content: [{ type: "text", text }] });
    logEvent("context_sent", { ok: true, selected: sel.length, chars: text.length });
  } catch (e) {
    logEvent("context_sent", { ok: false, error: String(e?.message || e) });
  }
}

// ---------- requests ----------

// Requests wait for the person's next chat message: the agent sees them in its
// context then. A message from the canvas makes Claude show a caution banner, so
// that only happens when the person chooses Send now.
const sentWaiting = new Set();

async function sendWaitingNow() {
  const items = waitingRequests().filter((i) => !sentWaiting.has(i.key));
  if (!items.length) return;
  $("#send-now").disabled = true;
  lastContextText = "";
  await sendView(); // the agent should see the requests before the message lands
  const text = `From the shopping canvas: please ${items.map((i) => i.text).join("; ")}.`;
  let outcome = "accepted";
  let error = null;
  try {
    const r = await app.sendMessage({ role: "user", content: [{ type: "text", text }] });
    if (r?.isError) outcome = "rejected";
  } catch (e) {
    outcome = "failed";
    error = String(e?.message || e);
  }
  logEvent("message_result", { request: "send_now", outcome, error, text });
  if (outcome === "accepted") for (const i of items) sentWaiting.add(i.key);
  setStatus(outcome === "accepted" ? `Sent to ${agent}.` : outcome === "rejected" ? `${agent} didn't take the message. Your requests are still here.` : `Couldn't send: ${error}`, "request", 6000);
  $("#send-now").disabled = false;
  renderBar();
}

function leftFor() {
  setStatus(`Left for ${agent}. It goes with your next message.`, "request", 6000);
  lastContextText = "";
  sendView();
}

async function addDetail(name) {
  const { ids, scope } = scopeIds();
  if (!ids.length) {
    setStatus("Select some cards first, or move to the ones you mean.", "request", 5000);
    return;
  }
  try {
    const r = await call("canvas_add_detail", { name, card_ids: ids, scope });
    logEvent("request_waiting", { request: r.detail || name, cards: r.card_ids });
    await poll();
    leftFor();
  } catch (e) {
    setStatus(`Couldn't add the detail: ${e.message}`, "request", 6000);
  }
}

async function addRequestCard(hint) {
  const like = [...selection].filter((id) => isProduct(byId(id)));
  // Next to the cards it should resemble, or in the middle of what the person sees.
  const near = like.map((id) => rectOf(byId(id))).filter(Boolean);
  let x, y;
  if (near.length) {
    x = Math.max(...near.map((r) => r.x + r.w)) + GAP_X;
    y = Math.min(...near.map((r) => r.y));
  } else {
    const v = visibleArea();
    x = ((v.l + v.r) / 2 - cam.x) / cam.k - CARD_W / 2;
    y = ((v.t + v.b) / 2 - cam.y) / cam.k - 150;
  }
  const spot = findFree(x, y, 300);
  try {
    const r = await call("canvas_add_request_card", { hint, like_ids: like, x: spot.x, y: spot.y });
    logEvent("request_waiting", { request: r.card_id });
    await poll();
    leftFor();
  } catch (e) {
    setStatus(`Couldn't add the card: ${e.message}`, "request", 6000);
  }
}

// ---------- finalists ----------

function setFinalists(ids, how, moves = [], shift = true) {
  trayShift = shift;
  optimistic(
    (s) => {
      s.finalists = ids;
      for (const m of moves) Object.assign(s.cards.find((c) => c.id === m.id) || {}, { x: m.x, y: m.y });
    },
    async () => {
      const [a, b] = await Promise.all([call("canvas_finalists", { card_ids: ids, how }), moves.length ? call("canvas_move", { positions: moves, by: "person" }) : null]);
      return Math.max(a.version || 0, b?.version || 0);
    },
    "Couldn't update your finalists",
  );
}

// Side by side, more than four won't fit beside a chat. Matches MAX_FINALISTS on the server.
const MAX_FINALISTS = 4;

function compare(ids) {
  const fin = finalistIds();
  const add = ids.filter((id) => isProduct(byId(id)) && !fin.includes(id));
  const room = MAX_FINALISTS - fin.length;
  if (add.length > room) setStatus(room > 0 ? `Up to ${MAX_FINALISTS} finalists side by side, so ${room} went in.` : `Up to ${MAX_FINALISTS} finalists side by side. Put one back first.`, "fin", 6000);
  if (add.length && room > 0) {
    // Comparing is asking to see the comparison, so a folded tray opens.
    finPanel.classList.remove("closed");
    $("#fin-toggle").setAttribute("aria-expanded", "true");
    setFinalists([...fin, ...add.slice(0, room)], "compare");
  }
}

/** Add specs: the person asks the agent for the specs that would decide between the finalists. */
async function requestSpecs() {
  const ids = finalistIds();
  if (ids.length < 2) return;
  try {
    await call("canvas_request_specs", { card_ids: ids });
    logEvent("request_waiting", { request: "specs", cards: ids });
    await poll();
    leftFor();
  } catch (e) {
    setStatus(`Couldn't ask for specs: ${e.message}`, "request", 6000);
  }
}

/** A row the agent added to the compare table goes, for every finalist. */
function removeSpec(name) {
  optimistic(
    (s) => {
      s.detailOrder = (s.detailOrder || []).filter((d) => d !== name);
      if (s.detailScope) delete s.detailScope[name];
      for (const c of s.cards) if (c.details) delete c.details[name];
    },
    async () => (await call("canvas_remove_spec", { name })).version,
    "Couldn't remove the row",
  );
}

/** Expanded, the comparison takes the whole canvas; Done or Esc gives the canvas back. */
function setFull(on) {
  finPanel.classList.toggle("full", on);
  if (on) {
    finPanel.classList.remove("closed");
    $("#fin-toggle").setAttribute("aria-expanded", "true");
  }
  $("#fin-expand").textContent = on ? "Done" : "Expand";
  applyCamera();
}

/**
 * Where each finalist lands if it is put back now: where it was, or the nearest free spot.
 * The outlines on the canvas show these spots, so Clear and ↓ send a card where its outline is.
 */
function homeSpots(ids) {
  const landed = []; // so two finalists never land on each other
  return ids.map((id) => {
    const c = byId(id);
    const h = homeH.get(id) || 320;
    const spot = findFree(c.x ?? 0, c.y ?? 0, h, [], landed);
    const home = { id, x: Math.round(spot.x), y: Math.round(spot.y), w: CARD_W, h };
    landed.push(home);
    return home;
  });
}

/** Back to the canvas: where the person dropped it, or onto its outline. */
function removeFinalist(id, at) {
  if (!byId(id)) return;
  const spot = at || homeSpots(finalistIds()).find((h) => h.id === id);
  if (!spot) return;
  // Dropped by hand, the card stays under the hand: the canvas doesn't shift then.
  setFinalists(finalistIds().filter((f) => f !== id), "remove", [{ id, x: Math.round(spot.x), y: Math.round(spot.y) }], !at);
}

/** Clear: every finalist goes back to the canvas, each onto its outline. Undo brings them back. */
function clearFinalists() {
  const ids = finalistIds();
  if (!ids.length) return;
  const moves = homeSpots(ids).map(({ id, x, y }) => ({ id, x, y }));
  undoStack.push({ finalists: ids, positions: ids.map((id) => ({ id, x: byId(id).x, y: byId(id).y })).filter((p) => p.x != null) });
  setFinalists([], "clear", moves);
}

// ---------- flights ----------
// A card that changes place between the canvas and the finalists flies there instead of
// jumping. The card itself is already where it is going, hidden; two copies make the trip,
// the old look fading into the new one. A card that left for the finalists leaves an
// outline on the canvas: where it came from, and where it goes back to.

const FLIGHT_MS = 520;
const STAGGER_MS = 55; // between one card taking off and the next
const flights = new Map(); // id -> { nodes, home } while a card is in the air
const homes = new Map(); // id -> the outline's element
let flyFrom = null; // id -> rect: a card let go by hand takes off from where it was dropped
let trayShift = false; // the person just changed the finalists: keep the canvas clear of the tray
let drawTimer = null;
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A spring that settles: a little past the target (about 2%), then home. 0 at t = 0, 1 at t = 1. */
function spring(t) {
  const z = 0.78;
  const w = 8.85;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
}

/** from and to are screen rects; w is the copy's own width before any scaling. */
function flightFrames(from, to, w, lean) {
  const a = { x: from.left, y: from.top, s: from.width / w };
  const b = { x: to.left, y: to.top, s: to.width / w };
  const N = 24;
  return Array.from({ length: N + 1 }, (_, i) => {
    const p = i === N ? 1 : spring(i / N);
    const mid = clamp(p, 0, 1);
    const at = (k) => a[k] + (b[k] - a[k]) * p;
    // It leans into the way it is going, most at half way, and is level when it lands.
    return { transform: `translate(${at("x")}px, ${at("y")}px) rotate(${lean * 4 * mid * (1 - mid)}deg) scale(${at("s")})` };
  });
}

function copyOf(el) {
  const n = el.cloneNode(true);
  n.classList.remove("selected", "pointed", "dragging", "landed", "lifted", "flying", "ghost", "out", "drop-ghost");
  n.classList.add("flyer");
  n.removeAttribute("tabindex");
  n.setAttribute("aria-hidden", "true");
  n.querySelector(":scope > .point-chip")?.remove();
  Object.assign(n.style, { left: "", top: "", visibility: "", transform: "", width: `${el.offsetWidth}px` });
  for (const img of n.querySelectorAll("img")) Object.assign(img, { loading: "eager", decoding: "sync" });
  return n;
}

function endFlight(id) {
  const f = flights.get(id);
  if (!f) return;
  flights.delete(id);
  for (const n of f.nodes) n.remove();
  els.get(id)?.el.classList.remove("flying");
  renderHomes();
}

/** Before the cards move: where each one that is about to change place is now, and how it looks. */
function takeOff(fin) {
  const leaving = new Map();
  const from = flyFrom;
  if (!loadedOnce || calm() || document.hidden) return leaving;
  for (const [id, { el }] of els) {
    const c = byId(id);
    if (!c || c.deleted || !el.isConnected || el.classList.contains("fin") === fin.includes(id)) continue;
    const src = flights.get(id)?.nodes[0] || el; // already in the air: it turns round from where it is
    const rect = from?.get(id) || src.getBoundingClientRect();
    if (rect.width) leaving.set(id, { from: rect, old: copyOf(src), byHand: !!from?.has(id) });
    endFlight(id);
  }
  return leaving;
}

/** After they have moved: fly each one from where it was to where it is, left to right. */
function fly(leaving, fin) {
  const sr = stage.getBoundingClientRect();
  const order = [...leaving.keys()].sort((a, b) => leaving.get(a).from.left - leaving.get(b).from.left || leaving.get(a).from.top - leaving.get(b).from.top);
  let i = 0;
  for (const id of order) {
    const { from, old, byHand } = leaving.get(id);
    const el = els.get(id)?.el;
    if (!el?.isConnected) continue;
    let to;
    let home = null;
    if (fin.includes(id)) to = el.getBoundingClientRect();
    else {
      // Worked out, not measured: the canvas may be gliding, and the card lands where it will be.
      const r = rectOf(byId(id));
      if (!r || finPanel.classList.contains("full")) continue;
      const s = toScreen(r);
      to = { left: sr.left + s.l, top: sr.top + s.t, width: s.r - s.l };
      if (!byHand) home = { id, x: r.x, y: r.y, h: r.h }; // put down by hand, it needs no outline to aim for
    }
    if (!to.width) continue;
    const now = copyOf(el);
    const lean = clamp((to.left - from.left) / 240, -1, 1) * 2.5;
    const timing = { duration: FLIGHT_MS, delay: i++ * STAGGER_MS, fill: "both", easing: "linear" };
    document.body.append(now, old); // the old look on top, fading
    const trip = now.animate(flightFrames(from, to, parseFloat(now.style.width), lean), timing);
    old.animate(flightFrames(from, to, parseFloat(old.style.width), lean), timing);
    now.animate([{ opacity: 0 }, { opacity: 1 }], { ...timing, duration: FLIGHT_MS * 0.25 });
    old.animate([{ opacity: 1 }, { opacity: 0 }], { ...timing, duration: FLIGHT_MS * 0.5 });
    const flight = { nodes: [now, old], home };
    flights.set(id, flight);
    el.classList.add("flying");
    trip.finished.then(() => flights.get(id) === flight && endFlight(id)).catch(() => {});
  }
  renderHomes();
}

/** The outlines: one for each finalist, and one under a card on its way back until it lands. */
function renderHomes() {
  const fin = finalistIds();
  const spots = homeSpots(fin).map((h, i) => ({ ...h, n: i + 1 }));
  for (const [id, f] of flights) if (f.home && !fin.includes(id)) spots.push(f.home);
  for (const [id, el] of homes) {
    if (spots.some((s) => s.id === id)) continue;
    el.remove();
    homes.delete(id);
  }
  for (const s of spots) {
    let el = homes.get(s.id);
    if (!el) {
      el = Object.assign(document.createElement("div"), { className: "home" });
      world.prepend(el); // under every card
      homes.set(s.id, el);
    }
    Object.assign(el.style, { left: `${s.x}px`, top: `${s.y}px`, height: `${s.h}px` });
    if (s.n) el.dataset.n = s.n;
  }
}

/** The tray is gone at once, so the cards have somewhere to fly from; this is its fade. */
function fadeTray(box) {
  const ghost = Object.assign(document.createElement("div"), { className: "tray-ghost" });
  Object.assign(ghost.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px`, borderRadius: box.radius });
  stage.append(ghost);
  ghost.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(-6px)" }], { duration: 240, easing: "ease-out" }).finished.then(() => ghost.remove(), () => ghost.remove());
}

// ---------- delete and undo ----------

function trashSelected() {
  const ids = [...selection].filter((id) => byId(id) && !byId(id).deleted);
  if (!ids.length) return;
  const fin = finalistIds();
  undoStack.push({ ids, wereFinalists: ids.filter((id) => fin.includes(id)) });
  selection.clear();
  optimistic(
    (s) => s.cards.forEach((c) => ids.includes(c.id) && (c.deleted = true)),
    async () => (await call("canvas_delete", { card_ids: ids })).version,
    "Couldn't delete",
  );
}

function undo() {
  const last = undoStack.pop();
  if (!last) return;
  if (last.finalists) return setFinalists(last.finalists, "undo", last.positions);
  if (last.positions) return moveCards(last.positions, "Couldn't undo");
  const finalists = [...finalistIds(), ...last.wereFinalists];
  optimistic(
    (s) => {
      s.cards.forEach((c) => last.ids.includes(c.id) && (c.deleted = false));
      s.finalists = finalists;
    },
    async () => (await call("canvas_restore", { card_ids: last.ids, finalists })).version,
    "Couldn't undo",
  );
}

// ---------- geometry ----------

function rectOf(c) {
  if (!c || c.x == null) return null;
  const p = drag?.pos.get(c.id);
  return { id: c.id, x: p ? p.x : c.x, y: p ? p.y : c.y, w: CARD_W, h: heights.get(c.id) || 320 };
}

/** The part of the stage not covered by the finalists area, in stage pixels. */
function visibleArea() {
  const top = finPanel.hidden ? 0 : finPanel.offsetTop + finPanel.offsetHeight;
  return { l: 0, t: top, r: stage.clientWidth, b: stage.clientHeight };
}

function toScreen(r) {
  return { l: r.x * cam.k + cam.x, t: r.y * cam.k + cam.y, r: (r.x + r.w) * cam.k + cam.x, b: (r.y + r.h) * cam.k + cam.y };
}

function overlaps(a, b, m = 0) {
  return a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
}

/** The free spot nearest to (x, y) for a card of height h. New cards never land on a card. */
function findFree(x, y, h, ignore = [], also = []) {
  const taken = [...canvasCards().filter((c) => !ignore.includes(c.id)).map(rectOf).filter(Boolean), ...also];
  const free = (px, py) => !taken.some((r) => overlaps({ x: px, y: py, w: CARD_W, h }, r, 12));
  if (free(x, y)) return { x, y };
  const tries = [];
  for (let i = -10; i <= 10; i++) for (let j = -10; j <= 10; j++) tries.push([i * (CARD_W + GAP_X) * 0.5, j * 90]);
  tries.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
  for (const [dx, dy] of tries) if (free(x + dx, y + dy)) return { x: x + dx, y: y + dy };
  return { x, y: Math.max(y, ...taken.map((r) => r.y + r.h + GAP_Y)) };
}

function applyCamera() {
  world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.k})`;
  stage.style.setProperty("--cam-x", `${cam.x}px`);
  stage.style.setProperty("--cam-y", `${cam.y}px`);
  stage.style.setProperty("--cam-k", cam.k);
  $("#zoom-level").textContent = `${Math.round(cam.k * 100)}%`;
  updateInView();
  renderMarkers();
}

let glideTimer = null;
function glide() {
  world.classList.add("gliding");
  stage.classList.add("gliding"); // the dots glide with the cards
  clearTimeout(glideTimer);
  glideTimer = setTimeout(() => (world.classList.remove("gliding"), stage.classList.remove("gliding")), 320);
}

function fit() {
  const rects = canvasCards().map(rectOf).filter(Boolean);
  if (!rects.length) return;
  const v = visibleArea();
  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  const bw = Math.max(...rects.map((r) => r.x + r.w)) - minX;
  const bh = Math.max(...rects.map((r) => r.y + r.h)) - minY;
  const availW = v.r - v.l - 48;
  const availH = v.b - v.t - 48 - 52; // room for the dock
  // Never so small that cards can't be read: when everything won't fit, start at the top.
  cam.k = clamp(Math.min(availW / bw, availH / bh), 0.45, 1);
  cam.x = v.l + 24 + Math.max(0, (availW - bw * cam.k) / 2) - minX * cam.k;
  cam.y = v.t + 24 + Math.max(0, (availH - bh * cam.k) / 2) - minY * cam.k;
  applyCamera();
}

function zoomAt(sx, sy, factor) {
  const k = clamp(cam.k * factor, 0.2, 2);
  cam.x = sx - (sx - cam.x) * (k / cam.k);
  cam.y = sy - (sy - cam.y) * (k / cam.k);
  cam.k = k;
  applyCamera();
}

/** The person follows a marker. The agent never moves the view. */
function goTo(ids) {
  const rects = ids.map((id) => rectOf(byId(id))).filter(Boolean);
  if (!rects.length) return;
  const v = visibleArea();
  const cx = (Math.min(...rects.map((r) => r.x)) + Math.max(...rects.map((r) => r.x + r.w))) / 2;
  const cy = (Math.min(...rects.map((r) => r.y)) + Math.max(...rects.map((r) => r.y + r.h))) / 2;
  cam.x = (v.l + v.r) / 2 - cx * cam.k;
  cam.y = (v.t + v.b) / 2 - cy * cam.k;
  glide();
  applyCamera();
}

function updateInView() {
  const v = visibleArea();
  const next = new Set(finalistIds()); // the finalists area is always in sight
  for (const c of canvasCards()) {
    const r = rectOf(c);
    if (!r) continue;
    const s = toScreen(r);
    const w = Math.min(s.r, v.r) - Math.max(s.l, v.l);
    const h = Math.min(s.b, v.b) - Math.max(s.t, v.t);
    if (w > 0 && h > 0 && (w * h) / ((s.r - s.l) * (s.b - s.t)) >= 0.5) next.add(c.id);
  }
  const changed = next.size !== inView.size || [...next].some((id) => !inView.has(id));
  inView = next;
  for (const id of [...fresh]) if (inView.has(id) || !byId(id) || byId(id).deleted) fresh.delete(id);
  if (changed) viewChanged();
}

// ---------- placing cards ----------

/** New cards arrive in empty space below what is there. Nothing already placed moves. */
function placeCards(unplaced) {
  const placed = canvasCards().map(rectOf).filter(Boolean);
  let x0 = 0;
  let y0 = 0;
  let cols;
  if (placed.length) {
    x0 = Math.min(...placed.map((r) => r.x));
    y0 = Math.max(...placed.map((r) => r.y + r.h)) + GAP_Y;
    const width = Math.max(...placed.map((r) => r.x + r.w)) - x0;
    cols = Math.max(Math.round((width + GAP_X) / (CARD_W + GAP_X)), Math.min(unplaced.length, 3));
  } else cols = gridCols(unplaced.length);
  const positions = [];
  let y = y0;
  for (let i = 0; i < unplaced.length; i += cols) {
    const row = unplaced.slice(i, i + cols);
    row.forEach((c, j) => positions.push({ id: c.id, x: x0 + j * (CARD_W + GAP_X), y }));
    y += Math.max(...row.map((c) => heights.get(c.id) || 320)) + GAP_Y;
  }
  if (loadedOnce) for (const p of positions) fresh.add(p.id);
  commitPositions(positions, "canvas");
}

/** How many columns a grid of n cards gets, from the shape of the part of the stage in sight. */
function gridCols(n) {
  const v = visibleArea();
  const aspect = (v.r - v.l) / Math.max(240, v.b - v.t);
  const cols = clamp(Math.round(Math.sqrt(n * aspect * 1.5)), 1, 6);
  return Math.ceil(n / Math.ceil(n / cols)); // rows as even as they can be: 4 + 3, not 5 + 2
}

/** Tidy: line the cards up in a grid, in the order the person reads them now (top to bottom, left to right). */
function tidy() {
  const rects = canvasCards().map(rectOf).filter(Boolean);
  if (!rects.length) return;
  // Cards whose tops are within half a card of each other count as one row.
  const rows = [];
  for (const r of [...rects].sort((a, b) => a.y - b.y)) {
    const row = rows[rows.length - 1];
    if (row && r.y - row[0].y < 160) row.push(r);
    else rows.push([r]);
  }
  const order = rows.flatMap((row) => row.sort((a, b) => a.x - b.x));
  const cols = gridCols(order.length);
  const x0 = Math.min(...rects.map((r) => r.x));
  const y0 = Math.min(...rects.map((r) => r.y));
  const positions = [];
  let y = y0;
  for (let i = 0; i < order.length; i += cols) {
    const row = order.slice(i, i + cols);
    row.forEach((r, j) => positions.push({ id: r.id, x: x0 + j * (CARD_W + GAP_X), y }));
    y += Math.max(...row.map((r) => r.h)) + GAP_Y;
  }
  const was = new Map(rects.map((r) => [r.id, r]));
  if (positions.every((p) => was.get(p.id).x === p.x && was.get(p.id).y === p.y)) return glide(), fit();
  undoStack.push({ positions: rects.map(({ id, x, y }) => ({ id, x, y })) });
  moveCards(positions, "Couldn't tidy");
}

/** Moves cards together, sliding them into place, and fits the view to the result. */
function moveCards(positions, failText) {
  world.classList.add("tidying");
  setTimeout(() => world.classList.remove("tidying"), 420);
  optimistic(
    (s) => positions.forEach((p) => Object.assign(s.cards.find((k) => k.id === p.id) || {}, { x: p.x, y: p.y })),
    async () => (await call("canvas_move", { positions, by: "person" })).version,
    failText,
  );
  glide();
  fit();
}

/** A card that grew (a new detail) gets room: cards right below it step down, and only as far as needed. */
function makeRoom(before) {
  const rects = canvasCards().map(rectOf).filter(Boolean);
  const queue = rects.filter((r) => before.has(r.id) && r.h > before.get(r.id)).map((r) => ({ r, oldBottom: r.y + before.get(r.id) }));
  const moved = new Map();
  while (queue.length) {
    const { r, oldBottom } = queue.shift();
    const bottom = r.y + r.h;
    for (const b of rects) {
      if (b === r || b.x >= r.x + r.w || b.x + b.w <= r.x) continue;
      if (b.y < oldBottom - 1 || b.y >= bottom + ROOM) continue;
      const was = b.y + b.h;
      b.y = bottom + ROOM;
      moved.set(b.id, b);
      queue.push({ r: b, oldBottom: was });
    }
  }
  if (moved.size) commitPositions([...moved.values()].map((b) => ({ id: b.id, x: b.x, y: b.y })), "room");
}

function commitPositions(positions, by) {
  const apply = (s) => {
    for (const p of positions) {
      const c = s.cards.find((k) => k.id === p.id);
      if (c && (by !== "canvas" || c.x == null)) Object.assign(c, { x: p.x, y: p.y });
    }
  };
  const op = { apply, until: null };
  pending.push(op);
  apply(state);
  call("canvas_move", { positions, by })
    .then((r) => (op.until = r.version || 0))
    .catch(() => pending.splice(pending.indexOf(op), 1));
}

// ---------- rendering ----------

const statusTimers = {};
const statuses = {};
function setStatus(text, key, ttl) {
  statuses[key] = text;
  clearTimeout(statusTimers[key]);
  if (text && ttl) statusTimers[key] = setTimeout(() => setStatus(null, key), ttl);
  const shown = Object.values(statuses).filter(Boolean);
  $("#status").textContent = shown[shown.length - 1] || "";
}

function money(p) {
  if (!p) return "";
  const sym = { USD: "$", CAD: "CA$", GBP: "£", EUR: "€" }[p.currency] ?? (p.currency ? p.currency + " " : "$");
  const n = Number(p.amount);
  return `${sym}${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

function urlHost(s) {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
}

function detailHtml(name, d, arrived) {
  // Every card shows every detail, so rows line up across cards; "—" is one this card doesn't have.
  if (!d) return `<div class="detail missing"><dt>${esc(name)}</dt><dd><span class="val">—</span></dd></div>`;
  if (d.state === "waiting") return `<div class="detail waiting"><dt>${esc(name)}</dt><dd><span class="wait">waiting for ${esc(agent)}</span></dd></div>`;
  if (d.state === "couldnt_find") return `<div class="detail none${arrived ? " arrived" : ""}"><dt>${esc(name)}</dt><dd><span class="cant">Couldn't find</span></dd></div>`;
  return `<div class="detail answered${arrived ? " arrived" : ""}"><dt>${esc(name)}</dt><dd><span class="val" title="${esc(d.value)}">${esc(d.value)}</span>${srcHtml(d)}</dd></div>`;
}

function priceHtml(p) {
  return p ? `<span class="price">${esc(money(p))}</span>` : `<span class="price none">No price</span>`;
}

function photoUrl(c) {
  return c.photo ? state.imgBase + c.photo.id : null;
}

/** fin: { tags, hide } when the card is in the finalists area. */
function cardHtml(c, fin, arrived) {
  if (c.kind === "request") {
    return `<div class="req"><div class="hint">${esc(c.hint)}</div><div class="wait">waiting for ${esc(agent)}</div></div>`;
  }
  const photo = c.photo
    ? `<img src="${esc(photoUrl(c))}" alt="" loading="lazy" draggable="false">`
    : `<span class="nophoto">${c.check === "checking" ? "Reading the store page…" : "No photo"}</span>`;
  // A price read from the store page says so. The agent's word gets no label: it's the default.
  const priceMeta =
    c.price?.from === "page"
      ? `<span class="meta checked" title="Price read from the store page at ${new Date(c.price.readAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}">from store page</span>`
      : "";
  // What only some cards have sits on the photo, so every card keeps the same height.
  const flag =
    c.check === "dead_link" ? `<span class="flag" title="${esc(c.checkReason || "The store page didn't load")}">Page not found</span>`
    : c.check === "bad_link" ? `<span class="flag">Not a usable link</span>`
    : "";
  const tags = (fin?.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  // The photo is credited when it doesn't come from the store page.
  const seller = esc(c.photo?.seller || "Shopify listing");
  const credit =
    c.photo?.from === "catalog"
      ? `<span class="credit" title="Photo from ${seller}, matched by name">Photo: ${c.photo.listing ? `<a href="#" data-link="${esc(c.photo.listing)}">${seller}</a>` : seller}</span>`
      : "";
  // A finalist's details are in the compare table under it. Specs added for the comparison stay there.
  const names = fin ? [] : (state.detailOrder || []).filter((n) => state.detailScope?.[n] !== "finalists");
  const details = names.map((n) => detailHtml(n, c.details?.[n], arrived?.has(n))).join("");
  return `
    <div class="photo">${photo}${tags || flag ? `<div class="badges">${tags}${flag}</div>` : ""}${credit}</div>
    <div class="body">
      <div class="store">${esc(c.store || urlHost(c.link) || "")}</div>
      <div class="name"><span>${esc(c.name)}</span></div>
      <div class="price-row">${priceHtml(c.price)}${priceMeta}</div>
      ${details ? `<dl class="details">${details}</dl>` : ""}
      <div class="foot"><a class="open" href="#" data-link="${esc(c.link)}">${fin ? "Store page" : "Open store page"}</a>${fin ? `<button class="putback quiet" type="button" data-putback="${esc(c.id)}" title="Put back on the canvas" aria-label="Put back on the canvas">↓</button>` : ""}</div>
    </div>`;
}

function srcHtml(d) {
  if (!d.source) return "";
  const host = urlHost(d.source);
  return host ? `<a class="src" href="#" data-link="${esc(d.source)}" title="Source: ${esc(d.source)}">${esc(host)}</a>` : `<span class="src" title="Source: ${esc(d.source)}">source</span>`;
}

let tableStates = new Map(); // "detail|card" -> state, so an answer that just arrived shows it
let lastTable = "";

/**
 * The compare table: one row per detail or spec, one cell per finalist, lined up under the
 * cards. What all of them share folds into one line at the end.
 */
function tableHtml(fin, diff) {
  if (!fin.length) return "";
  const cards = fin.map(byId);
  const next = new Map();
  const names = (state.detailOrder || []).filter((n) => !diff.sharedNames?.includes(n) && cards.some((c) => c.details?.[n]));
  const rows = names.map((name, r) => {
    const cells = cards.map((c, i) => {
      const d = c.details?.[name];
      const key = `${name}|${c.id}`;
      next.set(key, d?.state);
      const arrived = tableStates.get(key) === "waiting" && d && d.state !== "waiting";
      let inner;
      if (!d) inner = `<span class="val none">—</span>`;
      else if (d.state === "waiting") inner = `<span class="wait">waiting for ${esc(agent)}</span>`;
      else if (d.state === "couldnt_find") inner = `<span class="cant">Couldn't find</span>`;
      else inner = `<span class="val">${esc(d.value)}</span>${srcHtml(d)}`;
      return `<div class="ft-cell${arrived ? " arrived" : ""}" role="cell" data-n="${i + 1}" style="--r:${r}">${inner}</div>`;
    });
    const remove = state.detailScope?.[name] === "finalists" ? `<button class="ft-remove quiet" type="button" data-remove-spec="${esc(name)}" title="Remove this row" aria-label="Remove ${esc(name)}">×</button>` : "";
    return `<div class="ft-label" role="rowheader" title="${esc(name)}" style="--r:${r}"><span>${esc(name)}</span>${remove}</div>${cells.join("")}`;
  });
  const asking = state.specRequest && !state.specRequest.answered;
  if (asking) {
    const wait = `<span class="wait">waiting for ${esc(agent)}</span>`;
    for (let r = 0; r < 3; r++) rows.push(`<div class="ft-label">${wait}</div>${cards.map((_, i) => `<div class="ft-cell" data-n="${i + 1}">${wait}</div>`).join("")}`);
  }
  if (diff.sharedText) rows.push(`<div class="ft-label" role="rowheader" style="--r:${rows.length}">${esc(diff.sharedLabel)}</div><div class="ft-cell ft-common" role="cell" style="--r:${rows.length}">${esc(diff.shared.join(" · "))}</div>`);
  if (!rows.length && fin.length >= 2) rows.push(`<div class="ft-empty">Nothing to compare yet. Add specs and ${esc(agent)} fills them in for each finalist.</div>`);
  tableStates = next;
  return rows.join("");
}

function render() {
  if (!state) return;
  applyHostContext();
  $("#title").textContent = state.title;
  const fin = finalistIds();
  const diff = differences(fin.map(byId), state.detailOrder || [], money);
  const cards = live();
  const ids = new Set(cards.map((c) => c.id));
  // Before anything moves: what is about to change place, and how much canvas the tray leaves.
  const leaving = takeOff(fin);
  const tray = { hidden: finPanel.hidden, full: finPanel.classList.contains("full"), bottom: visibleArea().t, x: finPanel.offsetLeft, y: finPanel.offsetTop, w: finPanel.offsetWidth, h: finPanel.offsetHeight };
  for (const [id, entry] of els) {
    if (!ids.has(id)) {
      endFlight(id);
      entry.el.remove();
      els.delete(id);
      selection.delete(id);
    }
  }
  for (const c of cards) {
    const inFin = fin.includes(c.id);
    const ctx = inFin ? { tags: diff.tags[c.id] || [] } : null;
    const json = JSON.stringify([c.kind, c.name, c.link, c.store, c.price, c.photo, c.check, c.checkReason, c.details, c.hint, ctx, agent, state.detailOrder, state.detailScope]);
    let entry = els.get(c.id);
    if (!entry) {
      const el = document.createElement("article");
      el.dataset.id = c.id;
      el.tabIndex = 0;
      el.style.setProperty("--i", Number(c.id.replace(/\D/g, "")) % 6); // lets a variant vary cards (a tint per card, say)
      entry = { el, json: "", landed: loadedOnce ? Date.now() + 1500 : 0 };
      els.set(c.id, entry);
    }
    if (entry.json !== json) {
      // An answer that just arrived shows it: this is how a person learns what a request does.
      const was = entry.states || {};
      const arrived = new Set(Object.entries(c.details || {}).filter(([n, d]) => was[n] === "waiting" && d.state !== "waiting").map(([n]) => n));
      if (entry.kind === "request" && c.kind === "product") entry.landed = Date.now() + 1500;
      entry.el.innerHTML = cardHtml(c, ctx, arrived);
      entry.states = Object.fromEntries(Object.entries(c.details || {}).map(([n, d]) => [n, d.state]));
      entry.kind = c.kind;
      entry.json = json;
    }
    entry.el.className = `card ${c.kind}${inFin ? " fin" : ""}${drag?.ids.includes(c.id) ? " dragging" : ""}${entry.landed > Date.now() ? " landed" : ""}${flights.has(c.id) ? " flying" : ""}`;
    if (inFin) entry.el.dataset.n = fin.indexOf(c.id) + 1;
    else delete entry.el.dataset.n;
    if (!inFin && entry.el.parentNode !== world) world.append(entry.el);
  }
  fin.forEach((id, i) => {
    const el = els.get(id).el;
    if (finRow.children[i] !== el) finRow.insertBefore(el, finRow.children[i] || null);
    el.style.left = el.style.top = "";
  });
  finPanel.hidden = fin.length === 0;
  if (!fin.length && finPanel.classList.contains("full")) setFull(false);
  finPanel.style.setProperty("--fin-n", Math.max(fin.length, 1));
  $("#fin-title").textContent = `Finalists ${fin.length}`;
  const table = tableHtml(fin, diff);
  if (table !== lastTable) $("#fin-table").innerHTML = lastTable = table;
  const asking = state.specRequest && !state.specRequest.answered;
  $("#fin-specs").hidden = fin.length < 2;
  $("#fin-specs").disabled = !!asking;
  $("#fin-specs").textContent = asking ? `Asked ${agent}` : "Add specs";
  $("#empty").hidden = cards.length > 0;

  // Measure, place what is new, and give room to what grew.
  const before = heights;
  heights = new Map(canvasCards().map((c) => [c.id, els.get(c.id).el.offsetHeight]));
  for (const [id, h] of heights) homeH.set(id, h);
  if (!drag) {
    const unplaced = canvasCards().filter((c) => c.x == null);
    if (unplaced.length) placeCards(unplaced);
    makeRoom(before);
  }
  for (const c of canvasCards()) {
    const r = rectOf(c);
    const el = els.get(c.id).el;
    el.style.left = `${r?.x ?? 0}px`;
    el.style.top = `${r?.y ?? 0}px`;
  }
  renderSelection();
  renderPointer();
  renderBar();
  renderDev();
  if (!fitted && canvasCards().some((c) => c.x != null)) {
    fitted = true;
    fit();
  } else {
    // The tray takes its room from the top, so the canvas moves down by as much, and back
    // up when the tray goes. Only when the person changed the finalists: never under them.
    const by = visibleArea().t - tray.bottom;
    if (trayShift && by && !tray.full && !finPanel.classList.contains("full")) {
      cam.y += by;
      if (!calm()) glide();
    }
    applyCamera();
  }
  trayShift = false;
  if (leaving.size) {
    fly(leaving, fin);
    if (tray.hidden && !finPanel.hidden) finPanel.animate([{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" });
    if (!tray.hidden && finPanel.hidden) fadeTray({ ...tray, radius: getComputedStyle(finPanel).borderRadius });
    if ([...leaving.keys()].some((id) => fin.includes(id))) {
      // The rows draw in under the cards as they land.
      const table = $("#fin-table");
      table.classList.remove("draw");
      void table.offsetWidth;
      table.classList.add("draw");
      clearTimeout(drawTimer);
      drawTimer = setTimeout(() => table.classList.remove("draw"), 1400);
    }
  } else renderHomes();
}

function renderSelection() {
  for (const [id, { el }] of els) el.classList.toggle("selected", selection.has(id));
}

// --- the agent's pointing ---
// It looks different from the person's selection, names its reason on each card,
// stays until the agent points again or the person dismisses it, and never moves
// the view: a card out of sight gets a marker to follow.

function pointer() {
  const p = state?.pointer;
  if (!p?.ids?.length || !p.at || Date.now() - p.at > 30 * 60e3) return null;
  const ids = p.ids.filter((id) => byId(id) && !byId(id).deleted);
  return ids.length ? { ...p, ids } : null;
}

function renderPointer() {
  const p = pointer();
  for (const [id, { el }] of els) {
    const on = !!p && p.ids.includes(id);
    el.classList.toggle("pointed", on);
    let chip = el.querySelector(":scope > .point-chip");
    if (!on) {
      chip?.remove();
      continue;
    }
    if (!chip) {
      chip = document.createElement("div");
      chip.className = "point-chip";
      el.prepend(chip);
    }
    chip.innerHTML = `<span class="face" aria-hidden="true"></span><span>${esc(p.reasons?.[id] || agent)}</span>`;
  }
  $("#pointer-note").hidden = !p;
  if (p) $("#pointer-text").textContent = p.note ? `${agent}: ${p.note}` : `${agent} is pointing at ${p.ids.length === 1 ? shortName(byId(p.ids[0])) : `${p.ids.length} cards`}`;
}

function renderMarkers() {
  const v = visibleArea();
  const items = [];
  const p = pointer();
  for (const id of p?.ids || []) if (!inView.has(id)) items.push({ ids: [id], kind: "agent", label: p.reasons?.[id] || shortName(byId(id)) });
  const unseen = [...fresh].filter((id) => !inView.has(id));
  if (unseen.length) items.push({ ids: unseen, kind: "new", label: `${unseen.length} new card${unseen.length === 1 ? "" : "s"}` });
  $("#markers").innerHTML = items
    .map((it) => {
      const rects = it.ids.map((id) => rectOf(byId(id))).filter(Boolean).map(toScreen);
      if (!rects.length) return "";
      const cx = (Math.min(...rects.map((r) => r.l)) + Math.max(...rects.map((r) => r.r))) / 2;
      const cy = (Math.min(...rects.map((r) => r.t)) + Math.max(...rects.map((r) => r.b))) / 2;
      const mx = clamp(cx, v.l + 16, v.r - 16);
      const my = clamp(cy, v.t + 22, v.b - 70);
      const angle = Math.atan2(cy - my, cx - mx);
      const tx = mx < v.l + 90 ? "0" : mx > v.r - 90 ? "-100%" : "-50%";
      return `<button type="button" class="marker ${it.kind}" data-go="${esc(it.ids.join(","))}" style="left:${mx}px;top:${my}px;transform:translate(${tx},-50%)">
        ${it.kind === "agent" ? '<span class="face" aria-hidden="true"></span>' : ""}<span>${esc(it.label)}</span><span class="arrow" style="transform:rotate(${angle}rad)">→</span></button>`;
    })
    .join("");
}

function renderBar() {
  const n = [...selection].filter((id) => byId(id) && !byId(id).deleted).length;
  const view = live().filter((c) => inView.has(c.id)).length;
  $("#scope").textContent = !state ? "" : n ? `${n} selected` : `${view} in view`;
  const canCompare = [...selection].some((id) => isProduct(byId(id)) && !finalistIds().includes(id));
  $("#compare").hidden = !canCompare;
  $("#trash").hidden = n === 0;
  $("#undo").hidden = undoStack.length === 0;
  $("#dock-sep").hidden = !canCompare && n === 0 && undoStack.length === 0;
  const waiting = state ? waitingRequests() : [];
  const unsent = waiting.filter((i) => !sentWaiting.has(i.key));
  $("#waiting").hidden = !waiting.length;
  $("#waiting-text").innerHTML = unsent.length
    ? `<b>${unsent.length}</b> request${unsent.length === 1 ? "" : "s"} go${unsent.length === 1 ? "es" : ""} with your next message`
    : `Sent. Waiting for ${esc(agent)}`;
  $("#send-now").hidden = !unsent.length;
  const ctx = app.getHostContext() || {};
  const modes = ctx.availableDisplayModes || [];
  $("#expand").hidden = !modes.includes("fullscreen") || ctx.displayMode === "fullscreen";
  $("#collapse").hidden = ctx.displayMode !== "fullscreen" || !modes.includes("inline");
  $("#dev-toggle").hidden = !state?.dev || !!root.dataset.forceStyle;
}

// --- the dev panel: style variants, and what the agent was told ---

function renderDev() {
  const panel = $("#dev");
  if (panel.hidden) return;
  const current = root.dataset.style;
  $("#dev-styles").innerHTML = VARIANTS.map((v) => `<button type="button" data-style-pick="${v.id}" class="${v.id === current ? "on" : ""}"><b>${esc(v.name)}</b><span>${esc(v.refs)}</span></button>`).join("");
  for (const b of document.querySelectorAll("[data-theme-pick]")) b.classList.toggle("on", b.dataset.themePick === devTheme);
  const info = hostInfo();
  $("#dev-host").textContent = `${info.name || "?"} ${info.version || ""} · ${info.displayMode || "?"} · ${info.platform || "?"} · messages ${info.capabilities.message ? "yes" : "no"} · model context ${info.capabilities.updateModelContext ? "yes" : "no"} · server tools ${info.capabilities.serverTools ? "yes" : "no"}`;
  $("#dev-context").textContent = lastContextText || "(nothing sent yet)";
  $("#dev-log").textContent = viewLog.slice().reverse().map((e) => `${e.at}  ${e.type}  ${JSON.stringify(e.data)}`).join("\n");
}

// ---------- input ----------
// No <form> anywhere: the canvas runs in a sandboxed frame without forms, so
// everything is key and click handlers.

function openLink(url) {
  app.openLink({ url }).then((r) => logEvent("link_opened", { url, refused: !!r?.isError })).catch(() => {});
}

/** A click adds a card to the selection or takes it out; no Shift needed. Empty canvas or Esc clears it. */
function clickCard(id) {
  selection.has(id) ? selection.delete(id) : selection.add(id);
  renderSelection();
  viewChanged();
}

function clearSelection() {
  if (!selection.size) return;
  selection.clear();
  renderSelection();
  viewChanged();
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-link]");
  if (link) {
    e.preventDefault();
    openLink(link.dataset.link);
    return;
  }
  const t = e.target.closest("[data-putback], [data-remove-spec], [data-go], [data-style-pick], [data-theme-pick]");
  if (!t) return;
  if (t.dataset.putback) removeFinalist(t.dataset.putback);
  else if (t.dataset.removeSpec) removeSpec(t.dataset.removeSpec);
  else if (t.dataset.go) goTo(t.dataset.go.split(","));
  else if (t.dataset.stylePick) {
    const style = t.dataset.stylePick;
    optimistic((s) => (s.style = style), async () => (await call("canvas_style", { style })).version, "Couldn't switch the style");
  } else if ("themePick" in t.dataset) {
    devTheme = t.dataset.themePick;
    applyHostContext();
    renderDev();
  }
});

// Images that fail to load say so, instead of showing a broken picture.
document.addEventListener(
  "error",
  (e) => {
    if (e.target.tagName === "IMG" && e.target.closest(".photo")) e.target.replaceWith(Object.assign(document.createElement("span"), { className: "nophoto", textContent: "Photo didn't load" }));
  },
  true,
);

// A name cut short shows in full on hover. Measured then, since a finalist's width changes with the panel.
stage.addEventListener("mouseover", (e) => {
  const name = e.target.closest?.(".card .name");
  if (name) name.classList.toggle("cut", name.firstElementChild.scrollWidth > name.firstElementChild.clientWidth + 1);
});

// --- pointer gestures on the stage: pan, marquee, click, drag cards, drag finalists out ---

let gesture = null;

function dropZone() {
  const el = finPanel.hidden ? $("#drop-hint") : finPanel;
  return el.hidden ? null : el.getBoundingClientRect();
}
const inZone = (e, z) => !!z && e.clientX >= z.left && e.clientX <= z.right && e.clientY >= z.top && e.clientY <= z.bottom;

stage.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || e.target.closest("button, input, a, [data-link], #dock, #zoom, #composer, #markers, #pointer-note")) return;
  const cardEl = e.target.closest(".card");
  if (!cardEl && e.target.closest("#finalists")) return;
  gesture = {
    type: cardEl ? (cardEl.classList.contains("fin") ? "finalist" : "card") : e.shiftKey ? "marquee" : "pan",
    id: cardEl?.dataset.id,
    sx: e.clientX,
    sy: e.clientY,
    cam: { ...cam },
    additive: e.shiftKey || e.metaKey || e.ctrlKey,
    moved: false,
  };
  stage.setPointerCapture(e.pointerId);
});

function beginDrag(g) {
  $("#composer").hidden = true;
  if (g.type === "card") {
    // A selected card brings the rest of the selection along; any other card moves alone.
    // Dragging never changes what is selected, so rearranging keeps a selection the person built.
    const ids = selection.has(g.id) ? canvasCards().filter((c) => selection.has(c.id) && c.x != null).map((c) => c.id) : [g.id];
    drag = { ids, start: new Map(ids.map((id) => [id, { x: byId(id).x, y: byId(id).y }])), pos: new Map() };
    for (const id of ids) els.get(id).el.classList.add("dragging");
    if (finPanel.hidden && ids.some((id) => isProduct(byId(id)))) $("#drop-hint").hidden = false;
  } else if (g.type === "finalist") {
    const el = els.get(g.id).el;
    const r = el.getBoundingClientRect();
    g.ghost = el.cloneNode(true);
    g.ghost.classList.add("ghost");
    g.ghost.classList.remove("selected");
    Object.assign(g.ghost.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px` });
    g.ox = r.left - g.sx;
    g.oy = r.top - g.sy;
    document.body.append(g.ghost);
    el.classList.add("lifted");
  } else if (g.type === "marquee") {
    g.base = new Set(g.additive ? selection : []);
    $("#marquee").hidden = false;
  } else stage.classList.add("panning");
}

/**
 * Cards live under the finalists area, so over it a dragged card would vanish. Instead it shows
 * on top, faded: dropping here puts it in. Dragged back out, it is the card again.
 */
function showDropGhosts(over) {
  const ids = over ? drag.ids.filter((id) => isProduct(byId(id))) : [];
  if (!ids.length) return clearDropGhosts();
  drag.ghosts ||= new Map();
  for (const id of ids) {
    const el = els.get(id).el;
    let ghost = drag.ghosts.get(id);
    if (!ghost) {
      ghost = el.cloneNode(true);
      ghost.classList.remove("selected", "dragging", "landed");
      ghost.classList.add("drop-ghost");
      document.body.append(ghost);
      drag.ghosts.set(id, ghost);
      el.style.visibility = "hidden";
    }
    const r = el.getBoundingClientRect();
    Object.assign(ghost.style, { left: `${r.left}px`, top: `${r.top}px`, transform: `scale(${cam.k})` });
  }
}

function clearDropGhosts() {
  if (!drag?.ghosts) return;
  for (const [id, ghost] of drag.ghosts) {
    ghost.remove();
    const el = els.get(id)?.el;
    if (el) el.style.visibility = "";
  }
  drag.ghosts = null;
}

stage.addEventListener("pointermove", (e) => {
  const g = gesture;
  if (!g) return;
  const dx = e.clientX - g.sx;
  const dy = e.clientY - g.sy;
  if (!g.moved) {
    if (Math.hypot(dx, dy) < 4) return;
    g.moved = true;
    beginDrag(g);
  }
  if (g.type === "pan") {
    cam.x = g.cam.x + dx;
    cam.y = g.cam.y + dy;
    applyCamera();
  } else if (g.type === "card") {
    for (const id of drag.ids) {
      const s = drag.start.get(id);
      const p = { x: s.x + dx / cam.k, y: s.y + dy / cam.k };
      drag.pos.set(id, p);
      const el = els.get(id).el;
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
    }
    const over = inZone(e, dropZone());
    finPanel.classList.toggle("over", over);
    $("#drop-hint").classList.toggle("over", over);
    showDropGhosts(over);
  } else if (g.type === "finalist") {
    g.ghost.style.left = `${e.clientX + g.ox}px`;
    g.ghost.style.top = `${e.clientY + g.oy}px`;
    g.out = !inZone(e, finPanel.getBoundingClientRect());
    g.ghost.classList.toggle("out", g.out);
  } else if (g.type === "marquee") {
    const sr = stage.getBoundingClientRect();
    const box = { l: Math.min(g.sx, e.clientX), t: Math.min(g.sy, e.clientY), r: Math.max(g.sx, e.clientX), b: Math.max(g.sy, e.clientY) };
    Object.assign($("#marquee").style, { left: `${box.l - sr.left}px`, top: `${box.t - sr.top}px`, width: `${box.r - box.l}px`, height: `${box.b - box.t}px` });
    selection.clear();
    for (const id of g.base) selection.add(id);
    for (const c of canvasCards()) {
      const r = els.get(c.id).el.getBoundingClientRect();
      if (r.left < box.r && r.right > box.l && r.top < box.b && r.bottom > box.t) selection.add(c.id);
    }
    renderSelection();
  }
});

function endGesture(e, cancelled) {
  const g = gesture;
  if (!g) return;
  gesture = null;
  if (!g.moved) {
    if (cancelled) return;
    $("#composer").hidden = true;
    if (g.id) clickCard(g.id);
    else clearSelection();
    return;
  }
  stage.classList.remove("panning");
  $("#marquee").hidden = true;
  $("#drop-hint").hidden = true;
  $("#drop-hint").classList.remove("over");
  finPanel.classList.remove("over");
  if (g.type === "card") {
    const d = drag;
    const toFinalists = !cancelled && inZone(e, dropZoneAt(g));
    // Dropped on the finalists, a card flies in from where it was let go.
    if (toFinalists) flyFrom = new Map(d.ids.map((id) => [id, els.get(id).el.getBoundingClientRect()]));
    clearDropGhosts();
    drag = null;
    for (const id of d.ids) els.get(id).el.classList.remove("dragging");
    if (cancelled || toFinalists || !d.pos.size) {
      render(); // back where they were
      if (toFinalists) compare(d.ids);
      flyFrom = null;
    } else {
      const positions = d.ids.map((id) => ({ id, x: Math.round(d.pos.get(id).x), y: Math.round(d.pos.get(id).y) }));
      optimistic(
        (s) => positions.forEach((p) => Object.assign(s.cards.find((c) => c.id === p.id) || {}, { x: p.x, y: p.y })),
        async () => (await call("canvas_move", { positions, by: "person" })).version,
        "Couldn't save where you put it",
      );
    }
  } else if (g.type === "finalist") {
    const from = g.ghost.getBoundingClientRect();
    g.ghost.remove();
    els.get(g.id)?.el.classList.remove("lifted");
    if (!cancelled && g.out) {
      // It lands where the person dropped it.
      const sr = stage.getBoundingClientRect();
      flyFrom = new Map([[g.id, from]]);
      removeFinalist(g.id, { x: (e.clientX + g.ox - sr.left - cam.x) / cam.k, y: (e.clientY + g.oy - sr.top - cam.y) / cam.k });
      flyFrom = null;
    }
  }
  viewChanged();
}
// The drop hint is hidden by the time the gesture ends, so remember its box while it shows.
function dropZoneAt(g) {
  return g.zone;
}
stage.addEventListener("pointermove", (e) => {
  if (gesture?.moved && gesture.type === "card") gesture.zone = dropZone();
});
stage.addEventListener("pointerup", (e) => endGesture(e, false));
stage.addEventListener("pointercancel", (e) => endGesture(e, true));

stage.addEventListener(
  "wheel",
  (e) => {
    if (e.target.closest("#finalists, #composer")) return;
    const zooming = e.ctrlKey || e.metaKey;
    // Inside the chat (ChatGPT), plain scrolling belongs to the chat. Drag to pan there.
    if (!zooming && root.dataset.mode !== "fullscreen") return;
    e.preventDefault();
    const sr = stage.getBoundingClientRect();
    if (zooming) zoomAt(e.clientX - sr.left, e.clientY - sr.top, Math.exp(-e.deltaY * 0.01));
    else {
      cam.x -= e.deltaX;
      cam.y -= e.deltaY;
      applyCamera();
    }
  },
  { passive: false },
);

document.addEventListener("keydown", (e) => {
  if (e.target.closest?.("input, select, textarea")) return;
  const mod = e.metaKey || e.ctrlKey;
  if (e.key === "Escape" && finPanel.classList.contains("full")) {
    setFull(false);
  } else if (e.key === "Escape") {
    $("#composer").hidden = true;
    clearSelection();
  } else if ((e.key === "Delete" || e.key === "Backspace") && selection.size) {
    e.preventDefault();
    trashSelected();
  } else if (mod && e.key.toLowerCase() === "z") {
    e.preventDefault();
    undo();
  } else if (mod && e.key.toLowerCase() === "a") {
    e.preventDefault();
    for (const c of live()) selection.add(c.id);
    renderSelection();
    viewChanged();
  } else if ((e.key === "Enter" || e.key === " ") && e.target.closest?.(".card")) {
    e.preventDefault();
    clickCard(e.target.closest(".card").dataset.id);
  }
});

function openComposer(kind) {
  const box = $("#composer");
  box.hidden = false;
  box.dataset.kind = kind;
  const input = $("#composer-input");
  input.value = "";
  input.placeholder = kind === "detail" ? "A detail to fill, e.g. Wide fit?" : "What should it be? e.g. cheaper";
  const { ids, scope } = scopeIds();
  const like = [...selection].filter((id) => isProduct(byId(id))).length;
  $("#composer-scope").textContent = kind === "detail" ? (scope === "selection" ? `for the ${ids.length} selected` : `for the ${ids.length} in view`) : like ? `like the ${like} selected` : "one more card";
  $("#composer-submit").textContent = `Leave for ${agent}`;
  input.focus();
}

function submitComposer() {
  const value = $("#composer-input").value.trim();
  const kind = $("#composer").dataset.kind;
  $("#composer").hidden = true;
  if (!value) return;
  kind === "detail" ? addDetail(value) : addRequestCard(value);
}

$("#add-detail").addEventListener("click", () => openComposer("detail"));
$("#add-card").addEventListener("click", () => openComposer("card"));
$("#composer-submit").addEventListener("click", submitComposer);
$("#composer-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitComposer();
  } else if (e.key === "Escape") $("#composer").hidden = true;
});
$("#compare").addEventListener("click", () => compare([...selection]));
$("#trash").addEventListener("click", trashSelected);
$("#undo").addEventListener("click", undo);
$("#send-now").addEventListener("click", sendWaitingNow);
$("#zoom-in").addEventListener("click", () => (glide(), zoomAt(stage.clientWidth / 2, stage.clientHeight / 2, 1.25)));
$("#zoom-out").addEventListener("click", () => (glide(), zoomAt(stage.clientWidth / 2, stage.clientHeight / 2, 0.8)));
$("#zoom-fit").addEventListener("click", () => (glide(), fit()));
$("#tidy").addEventListener("click", tidy);
$("#fin-clear").addEventListener("click", clearFinalists);
$("#fin-specs").addEventListener("click", requestSpecs);
$("#fin-expand").addEventListener("click", () => setFull(!finPanel.classList.contains("full")));
$("#fin-toggle").addEventListener("click", () => {
  const closed = finPanel.classList.toggle("closed");
  if (closed) setFull(false);
  $("#fin-toggle").setAttribute("aria-expanded", String(!closed));
  applyCamera();
});
$("#pointer-text").addEventListener("click", () => {
  const p = pointer();
  if (p) goTo(p.ids.filter((id) => !finalistIds().includes(id)));
});
$("#pointer-clear").addEventListener("click", () => {
  optimistic((s) => (s.pointer = { ids: [], note: null, reasons: {}, at: Date.now() }), async () => (await call("canvas_pointer_clear", {})).version, "Couldn't dismiss");
});

async function setMode(mode) {
  try {
    const r = await app.requestDisplayMode({ mode });
    logEvent("display_mode", { requested: mode, granted: r?.mode });
  } catch (e) {
    logEvent("display_mode", { requested: mode, error: String(e?.message || e) });
  }
  applyHostContext();
}
// The canvas belongs beside the chat, so the person keeps chatting with it in view. Claude and
// ChatGPT put it there from the resource's hints; a host that still shows it in the chat is
// asked once, after giving it time to apply its own. "Back to chat" is never overridden.
let askedBeside = false;
function openBeside() {
  const ctx = app.getHostContext() || {};
  if (askedBeside || ctx.platform === "mobile" || ctx.displayMode !== "inline" || !(ctx.availableDisplayModes || []).includes("fullscreen")) return;
  askedBeside = true;
  setMode("fullscreen");
}
$("#expand").addEventListener("click", () => setMode("fullscreen"));
$("#collapse").addEventListener("click", () => ((askedBeside = true), setMode("inline")));
$("#dev-toggle").addEventListener("click", () => {
  $("#dev").hidden = !$("#dev").hidden;
  renderDev();
});
$("#dev-close").addEventListener("click", () => ($("#dev").hidden = true));

new ResizeObserver(() => state && applyCamera()).observe(stage);

// ---------- start ----------

(async () => {
  applyCamera();
  try {
    await app.connect();
  } catch (e) {
    setStatus(`Couldn't connect to the host: ${e.message}`, "connect");
    return;
  }
  const name = app.getHostVersion()?.name || "";
  agent = /claude/i.test(name) ? "Claude" : /chatgpt|openai/i.test(name) ? "ChatGPT" : "the agent";
  applyHostContext();
  if (canvasId == null) setStatus("Waiting for the canvas…", "poll");
  setTimeout(openBeside, 2500);
})();
