// Canvas state, kept in memory and saved to data/canvases.json, so a canvas
// comes back when the person returns to its chat. One process, no accounts.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DATA_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), "data");
const FILE = path.join(DATA_DIR, "canvases.json");
const MAX_EVENTS = 3000;

const canvases = new Map();
const images = new Map(); // image id -> source url

function load() {
  try {
    const saved = JSON.parse(fs.readFileSync(FILE, "utf8"));
    for (const c of saved.canvases || []) canvases.set(c.id, c);
    for (const [id, url] of Object.entries(saved.images || {})) images.set(id, url);
  } catch {
    // first run
  }
}
load();

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const data = { canvases: [...canvases.values()], images: Object.fromEntries(images) };
    fs.writeFileSync(FILE + ".tmp", JSON.stringify(data));
    fs.renameSync(FILE + ".tmp", FILE);
  }, 400);
}

export function getToken() {
  const file = path.join(DATA_DIR, "token.txt");
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const token = crypto.randomBytes(12).toString("hex");
    fs.writeFileSync(file, token);
    return token;
  }
}

export function createCanvas(title) {
  const id = "cv_" + crypto.randomBytes(5).toString("hex");
  const canvas = {
    id,
    title: title || "Shopping canvas",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    nextCard: 1,
    cards: [],
    detailOrder: [],
    view: { selection: [], inView: [], at: null },
    detailBy: {}, // detail name -> "person" | "agent": who started it
    finalists: [], // card ids, in the person's order
    pointer: { ids: [], note: null, reasons: {}, at: null },
    style: null, // style variant picked in the dev panel; null = the server default
    host: null,
    events: [],
  };
  canvases.set(id, canvas);
  logEvent(canvas, "canvas_created", { title: canvas.title });
  return canvas;
}

export function getCanvas(id) {
  return canvases.get(id) || null;
}

export function latestCanvas() {
  let latest = null;
  for (const c of canvases.values()) if (!latest || c.updatedAt > latest.updatedAt) latest = c;
  return latest;
}

export function allCanvases() {
  return [...canvases.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function touch(canvas) {
  canvas.version += 1;
  canvas.updatedAt = Date.now();
  scheduleSave();
}

export function logEvent(canvas, type, data = {}) {
  canvas.events.push({ at: Date.now(), type, ...data });
  if (canvas.events.length > MAX_EVENTS) canvas.events.splice(0, canvas.events.length - MAX_EVENTS);
  scheduleSave();
}

export function nextCardId(canvas) {
  return "c" + canvas.nextCard++;
}

export function registerImage(url) {
  const id = crypto.createHash("sha256").update(url).digest("hex").slice(0, 24);
  images.set(id, url);
  scheduleSave();
  return id;
}

export function imageSource(id) {
  return images.get(id) || null;
}
