// Bundles the canvas view (and the local dev host) into single HTML files.
import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const r = (p) => path.join(HERE, p);

async function bundle(entry) {
  const out = await esbuild.build({ entryPoints: [r(entry)], bundle: true, format: "iife", platform: "browser", target: "es2022", minify: true, write: false, legalComments: "none" });
  return out.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
}

fs.mkdirSync(r("dist"), { recursive: true });

const viewJs = await bundle("view/main.js");
const css = fs.readFileSync(r("view/style.css"), "utf8");
const view = fs.readFileSync(r("view/index.html"), "utf8").replace("/*CSS*/", () => css).replace("/*JS*/", () => viewJs);
fs.writeFileSync(r("dist/view.html"), view);

const hostJs = await bundle("dev/host.js");
fs.writeFileSync(r("dist/dev-host.html"), fs.readFileSync(r("dev/host.html"), "utf8").replace("/*JS*/", () => hostJs));

console.log(`Built dist/view.html (${Math.round(view.length / 1024)} KB) and dist/dev-host.html`);
