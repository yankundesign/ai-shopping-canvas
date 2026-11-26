// The canvas view (MCP App). Thin on purpose: a grid of cards, not yet the
// free canvas. It exists to answer the four questions in MVP_SCOPE.md.

import { App } from "@modelcontextprotocol/ext-apps";

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const app = new App({ name: "Shopping canvas", version: "0.1.0" }, { availableDisplayModes: ["inline", "fullscreen"] }, { autoResize: true });

let canvasId = null;
let state = null;
let version = 0;
let agent = "the agent";
const selection = new Set();
const inView = new Set();
const undoStack = [];
const cardEls = new Map(); // id -> { el, json }
let pollTimer = null;
let lastContextText = "";
let lastPointerAt = null;
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
  document.documentElement.dataset.theme = ctx.theme || "";
  document.documentElement.dataset.mode = ctx.displayMode || "inline";
  renderToolbar();
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
    container: ctx.containerDimensions,
    capabilities: {
      serverTools: !!caps.serverTools,
      message: caps.message ?? null,
      updateModelContext: caps.updateModelContext ?? null,
      openLinks: !!caps.openLinks,
    },
    userAgent: navigator.userAgent,
  };
}

async function logEvent(type, data) {
  viewLog.push({ at: new Date().toLocaleTimeString(), type, data });
  if (viewLog.length > 40) viewLog.shift();
  renderTestPanel();
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

async function poll() {
  clearTimeout(pollTimer);
  if (!canvasId) return;
  try {
    const r = await app.callServerTool({ name: "canvas_get", arguments: { canvas_id: canvasId, since: version } });
    const sc = r?.structuredContent;
    if (r?.isError) throw new Error(r.content?.[0]?.text || "canvas_get failed");
    if (sc?.changed) {
      state = sc.canvas;
      version = state.version;
      render();
      viewChanged(); // keep the agent's context in step (filled blanks, new cards)
    }
    setStatus(null, "poll");
  } catch (e) {
    setStatus(`Can't reach the canvas server: ${e.message}`, "poll");
  }
  pollTimer = setTimeout(poll, document.hidden ? 5000 : 1500);
}

async function call(name, args) {
  const r = await app.callServerTool({ name, arguments: { canvas_id: canvasId, ...args } });
  if (r?.isError) throw new Error(r.content?.[0]?.text || `${name} failed`);
  return r?.structuredContent || {};
}

// ---------- what the person sees, sent to the agent ----------

let viewTimer = null;
function viewChanged() {
  clearTimeout(viewTimer);
  viewTimer = setTimeout(sendView, 250);
  renderToolbar();
}

function liveProducts() {
  return (state?.cards || []).filter((c) => !c.deleted && c.kind === "product");
}

function scopeIds() {
  const sel = [...selection].filter((id) => liveProducts().some((c) => c.id === id));
  if (sel.length) return { ids: sel, scope: "selection" };
  return { ids: liveProducts().filter((c) => inView.has(c.id)).map((c) => c.id), scope: "view" };
}

function contextText() {
  const byId = new Map((state?.cards || []).map((c) => [c.id, c]));
  const name = (id) => `${id} ${(byId.get(id)?.name || "").slice(0, 70)}`;
  const sel = [...selection].filter((id) => byId.has(id) && !byId.get(id).deleted);
  const lines = [`Shopping canvas ${canvasId}: what the person sees right now.`];
  if (sel.length) lines.push(`Selected (${sel.length}): ${sel.map(name).join("; ")}.`);
  else {
    const view = (state?.cards || []).filter((c) => !c.deleted && inView.has(c.id)).map((c) => c.id);
    lines.push(`Nothing selected. Cards in view (${view.length}): ${view.map(name).join("; ")}.`);
  }
  const waiting = [];
  const details = new Map();
  for (const c of liveProducts()) {
    for (const [d, v] of Object.entries(c.details || {})) {
      if (v.state === "waiting") details.set(d, [...(details.get(d) || []), c.id]);
    }
  }
  for (const [d, ids] of details) waiting.push(`detail "${d}" on ${ids.join(", ")}`);
  for (const c of state?.cards || []) if (!c.deleted && c.kind === "blank") waiting.push(`empty card ${c.id} with hint "${c.hint}"`);
  lines.push(waiting.length ? `Blanks waiting for you: ${waiting.join("; ")}.` : "No blanks waiting.");
  // Repeated here because ChatGPT answered comparisons in the chat instead of on the canvas.
  lines.push(`Answer on the canvas: put facts about ${sel.length ? "these cards" : "the cards"} on them with fill_details and light them up with point_at_cards. Keep the chat reply to a short take.`);
  return lines.join("\n");
}

async function sendView() {
  if (!canvasId || !state) return;
  const sel = [...selection];
  const view = state.cards.filter((c) => !c.deleted && inView.has(c.id)).map((c) => c.id);
  try {
    await call("canvas_view", { selection: sel, in_view: view });
  } catch (e) {
    setStatus(`Couldn't save the selection: ${e.message}`, "view");
  }
  if (state.settings?.selection !== "context") return;
  const text = contextText();
  if (text === lastContextText) return;
  lastContextText = text;
  try {
    await app.updateModelContext({ content: [{ type: "text", text }] });
    logEvent("context_sent", { ok: true, selected: sel.length, chars: text.length });
  } catch (e) {
    logEvent("context_sent", { ok: false, error: String(e?.message || e) });
  }
  renderTestPanel();
}

// ---------- blanks: messages from the canvas ----------

// Blanks wait for the person's next chat message by default: the agent sees them in its context
// then. Sending a message from the canvas makes Claude show a caution banner, so that only
// happens when the person asks for it (Send now), or in the Test panel's "send" mode.
const sentWaiting = new Set(); // waiting blanks already sent with Send now

function waitingBlanks() {
  const details = new Map();
  for (const c of liveProducts()) {
    for (const [d, v] of Object.entries(c.details || {})) if (v.state === "waiting") details.set(d, [...(details.get(d) || []), c.id]);
  }
  const items = [...details].map(([d, ids]) => ({ key: `d:${d}:${ids.join(",")}`, text: `"${d}" for ${ids.join(", ")}` }));
  for (const c of state?.cards || []) {
    if (c.deleted || c.kind !== "blank") continue;
    const like = Array.isArray(c.like) && c.like.length ? `, like ${c.like.join(" and ")}` : "";
    items.push({ key: `c:${c.id}`, text: `one more product for the empty card ${c.id} ("${c.hint}")${like}` });
  }
  return items;
}

async function sendToChat(text, blankKey, startedAt) {
  lastContextText = "";
  await sendView(); // the agent should see the scope before the message lands
  const t0 = performance.now();
  let outcome = "accepted";
  let error = null;
  try {
    const r = await app.sendMessage({ role: "user", content: [{ type: "text", text }] });
    if (r?.isError) outcome = "rejected";
  } catch (e) {
    outcome = "failed";
    error = String(e?.message || e);
  }
  const msFromAction = Math.round(performance.now() - startedAt);
  logEvent("message_result", { blank: blankKey, outcome, error, ms: Math.round(performance.now() - t0), msFromAction, text });
  setStatus(
    outcome === "accepted" ? `Sent to ${agent}.` : outcome === "rejected" ? `${agent} didn't take the message. It's still on the canvas.` : `Couldn't send: ${error}`,
    "blank",
    6000,
  );
  return outcome;
}

async function sendBlank(text, blankKey, startedAt) {
  if (state?.settings?.blanks === "send") return sendToChat(text, blankKey, startedAt);
  setStatus(`Left for ${agent}. It goes with your next message.`, "blank", 6000);
  logEvent("blank_waiting", { blank: blankKey });
  lastContextText = ""; // make sure the waiting blank reaches the context
  sendView();
  renderToolbar();
}

async function sendWaitingNow() {
  const startedAt = performance.now();
  const items = waitingBlanks().filter((i) => !sentWaiting.has(i.key));
  if (!items.length) return;
  $("#send-now").disabled = true;
  const outcome = await sendToChat(`On the canvas: fill in ${items.map((i) => i.text).join("; ")}.`, "send_now", startedAt);
  if (outcome === "accepted") for (const i of items) sentWaiting.add(i.key);
  $("#send-now").disabled = false;
  renderToolbar();
}

async function addDetail(name) {
  const startedAt = performance.now();
  const { ids, scope } = scopeIds();
  if (!ids.length) {
    setStatus("Select some cards first, or scroll to the ones you mean.", "blank", 5000);
    return;
  }
  try {
    const r = await call("canvas_add_detail", { name, card_ids: ids, scope });
    await poll();
    const n = r.card_ids?.length ?? ids.length;
    const which = scope === "selection" ? `the ${n} selected card${n === 1 ? "" : "s"}` : `the ${n} card${n === 1 ? "" : "s"} in view`;
    await sendBlank(`On the canvas: fill in "${r.detail || name}" for ${which} (${(r.card_ids || ids).join(", ")}).`, r.detail || name, startedAt);
  } catch (e) {
    setStatus(`Couldn't add the detail: ${e.message}`, "blank", 6000);
  }
}

async function addBlankCard(hint) {
  const startedAt = performance.now();
  const like = [...selection].filter((id) => liveProducts().some((c) => c.id === id));
  try {
    const r = await call("canvas_add_blank_card", { hint, like_ids: like });
    await poll();
    const likeText = like.length ? `, like ${like.join(" and ")}` : "";
    await sendBlank(`On the canvas: find one more product for the empty card "${hint}" (${r.card_id})${likeText}.`, r.card_id, startedAt);
  } catch (e) {
    setStatus(`Couldn't add the card: ${e.message}`, "blank", 6000);
  }
}

// ---------- delete and undo ----------

async function trashSelected() {
  const ids = [...selection].filter((id) => (state?.cards || []).some((c) => c.id === id && !c.deleted));
  if (!ids.length) return;
  undoStack.push(ids);
  selection.clear();
  for (const c of state.cards) if (ids.includes(c.id)) c.deleted = true; // instant
  render();
  viewChanged();
  try {
    await call("canvas_delete", { card_ids: ids });
  } catch (e) {
    setStatus(`Couldn't delete: ${e.message}`, "trash", 5000);
  }
  poll();
}

async function undo() {
  const ids = undoStack.pop();
  if (!ids) return;
  for (const c of state.cards) if (ids.includes(c.id)) c.deleted = false;
  render();
  try {
    await call("canvas_restore", { card_ids: ids });
  } catch (e) {
    setStatus(`Couldn't undo: ${e.message}`, "trash", 5000);
  }
  poll();
}

// ---------- rendering ----------

let statusTimers = {};
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
  return `${sym}${Number(p.amount).toFixed(2)}`;
}

function isUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function cardHtml(c) {
  if (c.kind === "blank") {
    return `<div class="hint">“${esc(c.hint)}”</div><div class="waiting">waiting for ${esc(agent)}</div>`;
  }
  const photo = c.photo
    ? `<img src="${esc(state.imgBase + c.photo.id)}" alt="" loading="lazy" draggable="false" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'nophoto',textContent:'Photo didn’t load'}))">`
    : `<span class="nophoto">${c.check === "checking" ? "Reading the store page…" : "No photo"}</span>`;
  const priceMeta = c.price
    ? c.price.from === "page"
      ? `read ${new Date(c.price.readAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
      : `from ${esc(agent)}, not checked`
    : "";
  const flag =
    c.check === "dead_link" ? `<div class="flag">Link is dead: ${esc(c.checkReason || "")}</div>`
    : c.check === "bad_link" ? `<div class="flag">Not a usable link</div>`
    : c.check === "not_checked" ? `<div class="flag soft">Not checked: ${esc(c.checkReason || "couldn't read the page")}</div>`
    : "";
  // Where the photo came from when it isn't the store page itself.
  const photoCredit =
    c.photo?.from === "catalog"
      ? `<div class="credit">Photo: ${c.photo.listing ? `<a href="#" data-link="${esc(c.photo.listing)}">${esc(c.photo.seller || "Shopify listing")}</a>` : esc(c.photo.seller || "Shopify listing")}, matched by name</div>`
      : c.photo?.from === "agent" ? `<div class="credit">Photo from ${esc(agent)}, not checked</div>`
      : "";
  const details = Object.entries(c.details || {})
    .map(([name, d]) => {
      let val;
      if (d.state === "waiting") val = `<dd class="waiting">waiting for ${esc(agent)}</dd>`;
      else if (d.state === "couldnt_find") val = `<dd class="none">Couldn't find</dd>`;
      else val = `<dd>${esc(d.value)}${d.source ? (isUrl(d.source) ? ` <a class="src" href="#" data-link="${esc(d.source)}">source</a>` : ` <span class="src" title="${esc(d.source)}">source</span>`) : ""}</dd>`;
      return `<div><dt>${esc(name)}</dt>${val}</div>`;
    })
    .join("");
  return `
    <div class="photo">${photo}</div>
    <div class="body">
      <div class="name">${esc(c.name)}</div>
      <div class="price">${esc(money(c.price))} <span class="meta">${priceMeta}</span></div>
      <div class="store">${esc(c.store || "")} <a class="open" href="#" data-link="${esc(c.link)}">Open store page</a></div>
      ${details ? `<dl class="details">${details}</dl>` : ""}
      ${photoCredit}
      ${flag}
    </div>`;
}

const io = new IntersectionObserver(
  (entries) => {
    let changed = false;
    for (const e of entries) {
      const id = e.target.dataset.id;
      if (e.isIntersecting && !inView.has(id)) {
        inView.add(id);
        changed = true;
      } else if (!e.isIntersecting && inView.has(id)) {
        inView.delete(id);
        changed = true;
      }
    }
    if (changed) viewChanged();
  },
  { threshold: 0.5 },
);

function render() {
  if (!state) return;
  $("#title").textContent = state.title;
  const grid = $("#grid");
  const live = state.cards.filter((c) => !c.deleted);
  const ids = new Set(live.map((c) => c.id));
  for (const [id, entry] of cardEls) {
    if (!ids.has(id)) {
      io.unobserve(entry.el);
      entry.el.remove();
      cardEls.delete(id);
      inView.delete(id);
      selection.delete(id);
    }
  }
  live.forEach((c, i) => {
    const json = JSON.stringify(c) + agent;
    let entry = cardEls.get(c.id);
    if (!entry) {
      const el = document.createElement("article");
      el.dataset.id = c.id;
      el.tabIndex = 0;
      entry = { el, json: "" };
      cardEls.set(c.id, entry);
      io.observe(el);
    }
    if (entry.json !== json) {
      entry.el.innerHTML = cardHtml(c);
      entry.json = json;
    }
    entry.el.className = `card ${c.kind}`;
    if (grid.children[i] !== entry.el) grid.insertBefore(entry.el, grid.children[i] || null);
  });
  $("#empty").hidden = live.length > 0;
  renderSelection();
  renderPointer();
  renderToolbar();
  renderTestPanel();
}

function renderSelection() {
  for (const [id, { el }] of cardEls) el.classList.toggle("selected", selection.has(id));
}

let pointerTimer = null;
function renderPointer() {
  const p = state?.pointer;
  if (!p?.at || p.at === lastPointerAt) return;
  lastPointerAt = p.at;
  clearTimeout(pointerTimer);
  for (const [, { el }] of cardEls) el.classList.remove("pointed");
  if (!p.ids?.length) return;
  for (const id of p.ids) cardEls.get(id)?.el.classList.add("pointed");
  const first = cardEls.get(p.ids[0])?.el;
  if (first && !inView.has(p.ids[0])) first.scrollIntoView({ behavior: "smooth", block: "nearest" });
  setStatus(p.note ? `${agent}: ${p.note}` : `${agent} is pointing at ${p.ids.length} card${p.ids.length === 1 ? "" : "s"}`, "pointer", 20000);
  pointerTimer = setTimeout(() => {
    for (const [, { el }] of cardEls) el.classList.remove("pointed");
  }, 20000);
}

function renderToolbar() {
  const n = [...selection].length;
  const view = liveProducts().filter((c) => inView.has(c.id)).length;
  $("#scope").textContent = !state ? "" : n ? `${n} selected` : `${view} in view`;
  $("#trash").disabled = n === 0;
  $("#undo").hidden = undoStack.length === 0;
  const waiting = state?.settings?.blanks === "send" ? [] : waitingBlanks();
  const unsent = waiting.filter((i) => !sentWaiting.has(i.key));
  $("#waiting").hidden = !waiting.length;
  $("#waiting-text").textContent = unsent.length
    ? `${unsent.length} blank${unsent.length === 1 ? "" : "s"} go${unsent.length === 1 ? "es" : ""} with your next message`
    : `Sent. Waiting for ${agent}`;
  $("#send-now").hidden = !unsent.length;
  const ctx = app.getHostContext() || {};
  const canFull = (ctx.availableDisplayModes || []).includes("fullscreen");
  $("#expand").hidden = !canFull || ctx.displayMode === "fullscreen";
  $("#collapse").hidden = ctx.displayMode !== "fullscreen" || !(ctx.availableDisplayModes || []).includes("inline");
}

function renderTestPanel() {
  const panel = $("#test");
  if (panel.hidden) return;
  const info = hostInfo();
  $("#test-host").textContent = `${info.name || "?"} ${info.version || ""} · ${info.displayMode || "?"} · ${info.platform || "?"} · messages ${info.capabilities.message ? "yes" : "no"} · model context ${info.capabilities.updateModelContext ? "yes" : "no"} · server tools ${info.capabilities.serverTools ? "yes" : "no"}`;
  $("#set-blanks").value = state?.settings?.blanks || "wait";
  $("#set-selection").value = state?.settings?.selection || "context";
  $("#test-context").textContent = lastContextText || "(nothing sent yet)";
  $("#test-log").textContent = viewLog
    .slice()
    .reverse()
    .map((e) => `${e.at}  ${e.type}  ${JSON.stringify(e.data)}`)
    .join("\n");
}

// ---------- input ----------

$("#grid").addEventListener("click", (e) => {
  const link = e.target.closest("[data-link]");
  if (link) {
    e.preventDefault();
    e.stopPropagation();
    const url = link.dataset.link;
    app.openLink({ url }).then((r) => logEvent("link_opened", { url, refused: !!r?.isError })).catch(() => {});
    return;
  }
  const card = e.target.closest(".card");
  if (!card) {
    if (selection.size) {
      selection.clear();
      renderSelection();
      viewChanged();
    }
    return;
  }
  const id = card.dataset.id;
  if (e.shiftKey || e.metaKey || e.ctrlKey) {
    selection.has(id) ? selection.delete(id) : selection.add(id);
  } else if (selection.size === 1 && selection.has(id)) {
    selection.clear();
  } else {
    selection.clear();
    selection.add(id);
  }
  renderSelection();
  viewChanged();
});

document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, select, textarea")) return;
  if (e.key === "Escape" && selection.size) {
    selection.clear();
    renderSelection();
    viewChanged();
  } else if ((e.key === "Delete" || e.key === "Backspace") && selection.size) {
    e.preventDefault();
    trashSelected();
  } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    undo();
  }
});

function openForm(kind) {
  const form = $("#form");
  form.hidden = false;
  form.dataset.kind = kind;
  const input = $("#form-input");
  input.value = "";
  input.placeholder = kind === "detail" ? "A detail to fill, e.g. Wide fit?" : "What should it be? e.g. cheaper";
  const { ids, scope } = scopeIds();
  const like = [...selection].length;
  $("#form-scope").textContent =
    kind === "detail" ? (scope === "selection" ? `for the ${ids.length} selected` : `for the ${ids.length} in view`) : like ? `like the ${like} selected` : "";
  input.focus();
}

$("#add-detail").addEventListener("click", () => openForm("detail"));
$("#add-card").addEventListener("click", () => openForm("card"));
// No <form>: sandboxed iframes without allow-forms never fire submit.
function submitForm() {
  const value = $("#form-input").value.trim();
  const kind = $("#form").dataset.kind;
  $("#form").hidden = true;
  if (!value) return;
  kind === "detail" ? addDetail(value) : addBlankCard(value);
}
$("#form-submit").addEventListener("click", submitForm);
$("#form-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitForm();
  } else if (e.key === "Escape") $("#form").hidden = true;
});
$("#trash").addEventListener("click", trashSelected);
$("#undo").addEventListener("click", undo);

async function setMode(mode) {
  try {
    const r = await app.requestDisplayMode({ mode });
    logEvent("display_mode", { requested: mode, granted: r?.mode });
  } catch (e) {
    logEvent("display_mode", { requested: mode, error: String(e?.message || e) });
  }
  applyHostContext();
}
$("#expand").addEventListener("click", () => setMode("fullscreen"));
$("#collapse").addEventListener("click", () => setMode("inline"));

$("#test-toggle").addEventListener("click", () => {
  $("#test").hidden = !$("#test").hidden;
  renderTestPanel();
});
$("#send-now").addEventListener("click", () => sendWaitingNow());
$("#set-blanks").addEventListener("change", async (e) => {
  await call("canvas_settings", { blanks: e.target.value }).catch(() => {});
  poll();
});
$("#set-selection").addEventListener("change", async (e) => {
  await call("canvas_settings", { selection: e.target.value }).catch(() => {});
  if (e.target.value === "tool") {
    // Clear what the canvas put in the agent's context, so only read_canvas works.
    lastContextText = "";
    await app.updateModelContext({ content: [{ type: "text", text: "The shopping canvas is not sharing the selection in context right now. Call read_canvas to see it." }] }).catch(() => {});
  } else {
    lastContextText = "";
  }
  await poll();
  sendView();
});

// ---------- start ----------

(async () => {
  try {
    await app.connect();
  } catch (e) {
    setStatus(`Couldn't connect to the host: ${e.message}`, "connect");
    return;
  }
  const name = app.getHostVersion()?.name || "";
  agent = /claude/i.test(name) ? "Claude" : /chatgpt|openai/i.test(name) ? "ChatGPT" : "the agent";
  applyHostContext();
  // Some hosts pass the canvas id in the tool input; otherwise it arrives with the tool result.
  const input = app.getHostContext()?.toolInfo;
  if (input?.tool?.name && canvasId == null) setStatus("Waiting for the canvas…", "poll");
})();
