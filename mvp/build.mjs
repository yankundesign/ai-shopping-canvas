// Bundles the canvas view and the two dev pages into single HTML files.
// The view's CSS is styles/base.css (structure) followed by one file per style variant.
import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { VARIANTS } from "./view/styles/variants.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const r = (p) => path.join(HERE, p);

async function bundle(entry) {
  const out = await esbuild.build({ entryPoints: [r(entry)], bundle: true, format: "iife", platform: "browser", target: "es2022", minify: true, write: false, legalComments: "none" });
  return out.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
}
const page = async (html, js, out) => fs.writeFileSync(r(out), fs.readFileSync(r(html), "utf8").replace("/*JS*/", await bundle(js).then((t) => () => t)));

fs.mkdirSync(r("dist"), { recursive: true });

const css = ["base", ...VARIANTS.map((v) => v.id)].map((name) => fs.readFileSync(r(`view/styles/${name}.css`), "utf8")).join("\n");
const viewJs = await bundle("view/main.js");
const view = fs.readFileSync(r("view/index.html"), "utf8").replace("/*CSS*/", () => css).replace("/*JS*/", () => viewJs);
fs.writeFileSync(r("dist/view.html"), view);
await page("dev/host.html", "dev/host.js", "dist/dev-host.html");
await page("dev/styles.html", "dev/styles.js", "dist/dev-styles.html");

console.log(`Built dist/view.html (${Math.round(view.length / 1024)} KB, styles: ${VARIANTS.map((v) => v.id).join(", ")}) and the dev pages`);
