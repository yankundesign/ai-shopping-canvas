// Question 4: of N product links, how many give a photo and a price?
// Usage: node pages-test.mjs [links-file]   (default: pages-links.txt)
import fs from "node:fs";
import { readProductPage } from "./pages.mjs";

const file = process.argv[2] || "pages-links.txt";
const links = fs.readFileSync(file, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

const results = new Array(links.length);
let next = 0;
async function worker() {
  while (next < links.length) {
    const i = next++;
    results[i] = await readProductPage(links[i]);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);

const short = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");
console.log("\n#  check        photo price      store                  via                ms    reason");
results.forEach((r, i) => {
  const price = r.price ? `${r.price.currency || ""} ${r.price.amount}`.trim() : "-";
  console.log(
    String(i + 1).padStart(2), " ",
    r.check.padEnd(12),
    (r.photo ? "yes" : "-").padEnd(5),
    short(price, 10).padEnd(10),
    short(r.store, 22).padEnd(22),
    short(r.methods.join(","), 18).padEnd(18),
    String(r.ms).padStart(5), " ",
    short(r.reason, 50),
  );
});
const both = results.filter((r) => r.photo && r.price).length;
const photo = results.filter((r) => r.photo).length;
const price = results.filter((r) => r.price).length;
const byCheck = results.reduce((m, r) => ((m[r.check] = (m[r.check] || 0) + 1), m), {});
console.log(`\nPhoto and price: ${both} of ${results.length}. Photo: ${photo}. Price: ${price}.`);
console.log("By result:", JSON.stringify(byCheck));
fs.writeFileSync("pages-results.json", JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2));
console.log("Details saved to pages-results.json");
