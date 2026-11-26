// The style review: every variant showing the same sample canvas, side by side.
// The frames share one canvas on the server, so a card moved in one moves in all.

import { TOKEN, getCanvas, openSample, seedReviewState, mountView, reopen } from "./agent.js";
import { VARIANTS } from "../view/styles/variants.mjs";

const $ = (s) => document.querySelector(s);
const KEY = "shopping-canvas-style-review";
let theme = "light";
const views = [];

$("#to-host").href = `/dev/${TOKEN}`;
$("#cols").style.setProperty("--n", VARIANTS.length);
$("#cols").innerHTML = VARIANTS.map(
  (v) => `<section class="col" data-col="${v.id}">
    <div class="cap"><button data-focus="${v.id}">Full width</button><b>${v.name}</b><span class="refs">${v.refs}</span><p>${v.note}</p></div>
    <div class="frame"></div>
  </section>`,
).join("");

async function start(fresh) {
  let canvasId = fresh ? null : localStorage.getItem(KEY);
  if (canvasId && !(await getCanvas(canvasId).catch(() => null))) canvasId = null;
  const frames = [...document.querySelectorAll(".frame")];
  views.length = 0;
  if (!canvasId) {
    // The first view places the cards; then the sample is brought to its review state.
    const open = await openSample();
    canvasId = open.canvasId;
    localStorage.setItem(KEY, canvasId);
    views.push(await mountView(frames[0], { ...open, theme, style: VARIANTS[0].id }));
    await seedReviewState(canvasId);
  } else views.push(await mountView(frames[0], { ...reopen(canvasId), theme, style: VARIANTS[0].id }));
  for (let i = 1; i < VARIANTS.length; i++) views.push(await mountView(frames[i], { ...reopen(canvasId), theme, style: VARIANTS[i].id }));
}

function setTheme(t) {
  theme = t;
  document.body.classList.toggle("dark", t === "dark");
  $("#light").classList.toggle("on", t === "light");
  $("#dark").classList.toggle("on", t === "dark");
  for (const v of views) v.setTheme(t);
}
$("#light").onclick = () => setTheme("light");
$("#dark").onclick = () => setTheme("dark");
$("#reset").onclick = () => start(true);
document.addEventListener("click", (e) => {
  const id = e.target.dataset?.focus;
  if (!id) return;
  const col = document.querySelector(`[data-col="${id}"]`);
  const on = !col.classList.contains("focus");
  for (const c of document.querySelectorAll(".col")) c.classList.toggle("focus", on && c === col);
  $("#cols").classList.toggle("one", on);
  for (const b of document.querySelectorAll("[data-focus]")) b.textContent = on ? "Side by side" : "Full width";
});

start(false);
