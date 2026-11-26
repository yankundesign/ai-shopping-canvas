// Store-page reader: given a product link, read the page for photo, price,
// name and store. The page wins over what the agent says (MVP_SCOPE.md).
//
// It identifies itself honestly and does not try to get around bot blocks:
// a page that refuses us is reported as "blocked", and the card shows the
// agent's data marked as not checked.

import dns from "node:dns/promises";
import net from "node:net";

const USER_AGENT =
  "ShoppingCanvasTest/0.1 (open-source prototype; reads a product page for its photo and price)";
const TIMEOUT_MS = 9000;
const MAX_PAGE_BYTES = 4_000_000;
const MAX_IMAGE_BYTES = 6_000_000;
const MAX_REDIRECTS = 4;

// ---------- safe fetching (no private network, size and time limits) ----------

function isPrivateIPv4(ip) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6 === "::" || v6 === "::1") return true;
  if (v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe8") ||
      v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb")) return true;
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

async function assertPublicUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new FetchError("bad_link", "Not a valid link");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new FetchError("bad_link", "Only http and https links");
  }
  if (url.username || url.password) throw new FetchError("bad_link", "Links with credentials are refused");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new FetchError("bad_link", "Private address refused");
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new FetchError("bad_link", "Private address refused");
  } else {
    let addrs;
    try {
      addrs = await dns.lookup(host, { all: true });
    } catch {
      throw new FetchError("dead", "Domain not found");
    }
    if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) {
      throw new FetchError("bad_link", "Private address refused");
    }
  }
  return url;
}

export class FetchError extends Error {
  constructor(kind, message, status) {
    super(message);
    this.kind = kind; // bad_link | dead | blocked | error
    this.status = status;
  }
}

async function readLimited(res, maxBytes) {
  const reader = res.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      reader.cancel().catch(() => {});
      break;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

export async function safeFetch(raw, { accept, maxBytes }) {
  let current = raw;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const url = await assertPublicUrl(current);
    let res;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "user-agent": USER_AGENT, accept, "accept-language": "en-US,en;q=0.8" },
      });
    } catch (e) {
      throw new FetchError("error", e.name === "TimeoutError" ? "Timed out" : "Could not connect");
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location"), url).toString();
      continue;
    }
    if (res.status === 404 || res.status === 410) throw new FetchError("dead", `Page not found (${res.status})`, res.status);
    if (res.status === 401 || res.status === 403 || res.status === 429 || res.status === 503) {
      throw new FetchError("blocked", `The store refused the reader (${res.status})`, res.status);
    }
    if (!res.ok) throw new FetchError("error", `Store page error (${res.status})`, res.status);
    const body = await readLimited(res, maxBytes);
    return { finalUrl: url.toString(), status: res.status, contentType: res.headers.get("content-type") || "", body };
  }
  throw new FetchError("error", "Too many redirects");
}

// ---------- parsing ----------

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function parseAttributes(tag) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m;
  while ((m = re.exec(tag))) attrs[m[1].toLowerCase()] = decodeEntities(m[3] ?? m[4] ?? m[5] ?? "");
  return attrs;
}

function metaTags(html) {
  const out = {};
  const re = /<meta\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const a = parseAttributes(m[0]);
    const key = (a.property || a.name || a.itemprop || "").toLowerCase();
    if (key && a.content != null && out[key] == null) out[key] = a.content.trim();
  }
  return out;
}

function itempropValues(html) {
  // microdata like <span itemprop="price" content="129.95">
  const out = {};
  const re = /<[a-z]+\b[^>]*itemprop\s*=\s*["'](price|pricecurrency|image)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const a = parseAttributes(m[0]);
    const key = m[1].toLowerCase();
    const val = a.content || a.src || a.href;
    if (val && out[key] == null) out[key] = val;
  }
  return out;
}

function jsonLdBlocks(html) {
  const blocks = [];
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const text = m[1].replace(/^\s*<!--/, "").replace(/-->\s*$/, "").replace(/^\s*\/\/<!\[CDATA\[/, "").replace(/\/\/\]\]>\s*$/, "").trim();
    try {
      blocks.push(JSON.parse(text));
    } catch {
      // Some stores put raw newlines inside strings; try once more without them.
      try { blocks.push(JSON.parse(text.replace(/[\n\r\t]+/g, " "))); } catch { /* ignore */ }
    }
  }
  return blocks;
}

function hasType(node, names) {
  const t = node?.["@type"];
  const types = Array.isArray(t) ? t : [t];
  return types.some((x) => typeof x === "string" && names.includes(x.replace(/^.*[/#]/, "")));
}

function findProducts(node, out = [], depth = 0) {
  if (!node || typeof node !== "object" || depth > 8) return out;
  if (Array.isArray(node)) {
    for (const n of node) findProducts(n, out, depth + 1);
    return out;
  }
  if (hasType(node, ["Product", "ProductGroup", "IndividualProduct", "ProductModel"])) out.push(node);
  for (const key of ["@graph", "mainEntity", "itemListElement", "item", "hasVariant"]) {
    if (node[key]) findProducts(node[key], out, depth + 1);
  }
  return out;
}

function firstImage(img) {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (Array.isArray(img)) {
    for (const i of img) {
      const u = firstImage(i);
      if (u) return u;
    }
    return null;
  }
  return img.url || img.contentUrl || img["@id"] || null;
}

function priceFromOffers(offers) {
  if (!offers) return null;
  const list = Array.isArray(offers) ? offers : [offers];
  for (const o of list) {
    if (!o || typeof o !== "object") continue;
    const spec = Array.isArray(o.priceSpecification) ? o.priceSpecification[0] : o.priceSpecification;
    const amount = o.price ?? o.lowPrice ?? spec?.price ?? o.highPrice;
    const currency = o.priceCurrency ?? spec?.priceCurrency;
    if (amount != null && amount !== "") return { amount, currency };
    if (o.offers) {
      const nested = priceFromOffers(o.offers);
      if (nested) return nested;
    }
  }
  return null;
}

export function parseAmount(raw) {
  if (raw == null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : null;
  let s = String(raw).replace(/[^\d.,]/g, "");
  if (!s) return null;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastComma > lastDot) {
    // "1.299,00" or "129,95"
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function absolutize(u, base) {
  if (!u) return null;
  try {
    const abs = new URL(u.startsWith("//") ? "https:" + u : u, base);
    return abs.protocol === "https:" || abs.protocol === "http:" ? abs.toString() : null;
  } catch {
    return null;
  }
}

function storeFromHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function shopifyHandle(url) {
  const m = new URL(url).pathname.match(/\/products\/([^/?#.]+)/);
  return m ? m[1] : null;
}

async function readShopifyJson(pageUrl) {
  const handle = shopifyHandle(pageUrl);
  if (!handle) return null;
  const origin = new URL(pageUrl).origin;
  try {
    const { body } = await safeFetch(`${origin}/products/${handle}.json`, { accept: "application/json", maxBytes: MAX_PAGE_BYTES });
    const p = JSON.parse(body.toString("utf8")).product;
    if (!p) return null;
    const variant = p.variants?.[0];
    return {
      name: p.title || null,
      photo: p.image?.src || p.images?.[0]?.src || null,
      amount: parseAmount(variant?.price),
      brand: p.vendor || null,
    };
  } catch {
    return null;
  }
}

/**
 * Read a product page. Never throws: failures come back as { check: ... }.
 * check: "checked" (photo and/or price read from the page),
 *        "not_checked" (blocked, timed out, or nothing readable),
 *        "dead_link" (404, 410, or the domain does not exist),
 *        "bad_link" (not a public http(s) link).
 */
export async function readProductPage(link) {
  const startedAt = Date.now();
  const result = {
    link,
    check: "not_checked",
    reason: null,
    photo: null,
    price: null, // { amount, currency }
    name: null,
    store: storeFromHost(link),
    methods: [],
    finalUrl: null,
    ms: 0,
  };
  let page;
  try {
    page = await safeFetch(link, { accept: "text/html,application/xhtml+xml", maxBytes: MAX_PAGE_BYTES });
  } catch (e) {
    result.reason = e.message;
    if (e.kind === "dead") result.check = "dead_link";
    else if (e.kind === "bad_link") result.check = "bad_link";
    else result.check = "not_checked";
    // A store that blocks the page sometimes still serves Shopify's public data.
    if (e.kind === "blocked" || e.kind === "error") {
      const shop = await readShopifyJson(link).catch(() => null);
      if (shop && (shop.photo || shop.amount)) {
        result.methods.push("shopify-json");
        result.photo = absolutize(shop.photo, link);
        result.price = shop.amount ? { amount: shop.amount, currency: null } : null;
        result.name = shop.name;
        result.check = "checked";
        result.reason = null;
      }
    }
    result.ms = Date.now() - startedAt;
    return result;
  }

  result.finalUrl = page.finalUrl;
  const html = page.body.toString("utf8");
  const meta = metaTags(html);
  const micro = itempropValues(html);
  const products = jsonLdBlocks(html).flatMap((b) => findProducts(b));

  // 1. JSON-LD Product (what search engines read)
  for (const p of products) {
    const price = priceFromOffers(p.offers) || priceFromOffers(p.hasVariant?.map?.((v) => v.offers));
    const photo = firstImage(p.image);
    if (price || photo) {
      result.methods.push("json-ld");
      result.name ??= typeof p.name === "string" ? decodeEntities(p.name) : null;
      if (!result.photo && photo) result.photo = absolutize(photo, page.finalUrl);
      if (!result.price && price && parseAmount(price.amount)) {
        result.price = { amount: parseAmount(price.amount), currency: price.currency || null };
      }
      if (result.photo && result.price) break;
    }
  }

  // 2. Open Graph and product meta tags
  const ogPhoto = meta["og:image:secure_url"] || meta["og:image"] || meta["twitter:image"] || micro.image;
  const ogAmount = meta["product:price:amount"] || meta["og:price:amount"] || meta["price"] || micro.price;
  const ogCurrency = meta["product:price:currency"] || meta["og:price:currency"] || meta["pricecurrency"] || micro.pricecurrency;
  if (!result.photo && ogPhoto) {
    result.photo = absolutize(ogPhoto, page.finalUrl);
    result.methods.push("meta-photo");
  }
  if (!result.price && parseAmount(ogAmount)) {
    result.price = { amount: parseAmount(ogAmount), currency: ogCurrency || null };
    result.methods.push("meta-price");
  }
  if (result.price && !result.price.currency && ogCurrency) result.price.currency = ogCurrency;
  result.name ??= meta["og:title"] || null;
  if (meta["og:site_name"]) result.store = meta["og:site_name"];

  // 3. Shopify's public product data, if still missing something
  if ((!result.photo || !result.price) && shopifyHandle(page.finalUrl)) {
    const shop = await readShopifyJson(page.finalUrl);
    if (shop) {
      if (!result.photo && shop.photo) result.photo = absolutize(shop.photo, page.finalUrl);
      if (!result.price && shop.amount) result.price = { amount: shop.amount, currency: ogCurrency || null };
      result.name ??= shop.name;
      result.methods.push("shopify-json");
    }
  }

  result.check = result.photo || result.price ? "checked" : "not_checked";
  if (result.check === "not_checked") result.reason = "No photo or price found on the page";
  result.ms = Date.now() - startedAt;
  return result;
}

/** Fetch an image for the proxy. Returns { type, body } or throws FetchError. */
export async function fetchImage(url) {
  const res = await safeFetch(url, { accept: "image/avif,image/webp,image/png,image/jpeg,image/*", maxBytes: MAX_IMAGE_BYTES });
  const type = res.contentType.split(";")[0].trim().toLowerCase();
  if (!type.startsWith("image/") || type === "image/svg+xml") throw new FetchError("error", "Not an image");
  return { type, body: res.body };
}
