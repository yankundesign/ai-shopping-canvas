// Shopify's keyless Global Catalog, used to find a photo when the store page can't be read.
// The card keeps the agent's link; the photo is credited to the Shopify listing it came from.

const ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";
const cache = new Map(); // query -> { at, products }
const CACHE_MS = 60 * 60 * 1000;

const SYNONYMS = { mens: "men", men: "men", womens: "women", women: "women", ladies: "women", shoes: "shoe", boots: "boot", gtx: "goretex", wp: "waterproof" };
const STOP = new Set(["the", "and", "with", "for", "a", "of", "in", "by", "product", "products", "p", "dp", "www", "com", "html"]);
const SOFT = new Set(["hiking", "shoe", "trail", "walking", "running", "sneaker", "sneakers", "men", "new", "sale"]);

export function words(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/gore-?tex/g, "goretex")
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w))
    .map((w) => SYNONYMS[w] || w);
}

function slugWords(link) {
  try {
    return words(decodeURIComponent(new URL(link).pathname));
  } catch {
    return [];
  }
}

/**
 * How well a catalog product matches the card, or null if it's a different product.
 * Every word of the card's name must appear (the brand may instead be the seller), and the
 * listing must not contradict the context: men's vs women's, shoe vs boot or mid, kids.
 */
export function matchScore({ name, link, store }, product) {
  // The store's own name ("KEEN Targhee IV (REI)") says nothing about the product.
  let host = [];
  try {
    host = words(new URL(link).hostname);
  } catch {}
  const storeW = new Set([...words(store), ...host]);
  const nameW = [...new Set(words(name))].filter((w) => !storeW.has(w));
  const context = new Set([...nameW, ...slugWords(link)]);
  const seller = product.variants?.[0]?.seller?.name || "";
  const title = new Set([...words(product.title), ...words(seller)]);
  // Model words must all be there. The brand may be missing (it's often only the seller),
  // and so may generic words like "hiking" or "shoe".
  const hard = nameW.filter((w, i) => !(i === 0 && !/\d/.test(w)) && !SOFT.has(w));
  if (!hard.length) return null;
  if (hard.some((w) => !title.has(w))) return null;
  const missing = nameW.filter((w) => !title.has(w));
  const has = (w) => title.has(w);
  if (has("women") && context.has("men") && !context.has("women")) return null;
  if (has("men") && context.has("women") && !context.has("men")) return null;
  if (["kids", "kid", "youth", "junior", "toddler", "little", "big"].some((w) => has(w) && !context.has(w))) return null;
  const tall = ["mid", "boot", "high"];
  if (tall.some((w) => has(w) && !context.has(w)) && (context.has("shoe") || context.has("low"))) return null;
  if ((has("shoe") || has("low")) && tall.some((w) => context.has(w)) && !tall.some(has)) return null;
  let score = nameW.length - missing.length;
  if (seller && words(seller).includes(nameW[0])) score += 0.5; // the brand's own store
  return score;
}

async function search(query, profileUrl) {
  const hit = cache.get(query);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.products;
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "search_catalog",
      arguments: { meta: { "ucp-agent": { profile: profileUrl } }, catalog: { query, context: { address_country: "US", currency: "USD" } } },
    },
  };
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`catalog HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`catalog: ${data.error.message}${data.error.data?.code ? ` (${data.error.data.code})` : ""}`);
  const r = data.result || {};
  let sc = r.structuredContent;
  if (!sc) {
    const text = (r.content || []).find((c) => c.type === "text")?.text;
    try {
      sc = JSON.parse(text);
    } catch {
      throw new Error(`catalog: ${String(text || "no result").slice(0, 120)}`);
    }
  }
  if (r.isError) throw new Error("catalog returned an error");
  const products = Array.isArray(sc?.products) ? sc.products : [];
  cache.set(query, { at: Date.now(), products });
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  return products;
}

/**
 * Find a photo for this card in Shopify's catalog.
 * Returns { found: true, imageUrl, title, seller, listingUrl, price } or { found: false, reason }.
 */
export async function findCatalogPhoto({ name, link, store }, profileUrl) {
  if (!profileUrl) return { found: false, reason: "no public address for the agent profile" };
  if (!name) return { found: false, reason: "no name" };
  // Search without the store's name, e.g. "KEEN Targhee IV WP (REI)" -> "KEEN Targhee IV WP".
  let query = String(name);
  if (store) query = query.split(store).join(" ");
  query = query.replace(/[()[\]|]/g, " ").replace(/\s+/g, " ").trim() || String(name);
  const products = await search(query, profileUrl);
  let best = null;
  for (const p of products) {
    const imageUrl = (p.media || []).find((m) => m?.type === "image" && m.url)?.url;
    if (!imageUrl) continue;
    const score = matchScore({ name, link, store }, p);
    if (score == null) continue;
    if (!best || score > best.score) best = { score, p, imageUrl };
  }
  if (!best) return { found: false, reason: products.length ? `none of ${products.length} results matched` : "no results" };
  const v = best.p.variants?.[0] || {};
  return {
    found: true,
    imageUrl: best.imageUrl,
    title: best.p.title,
    seller: v.seller?.name || null,
    listingUrl: v.url || null,
    price: best.p.price_range?.min || null,
  };
}
