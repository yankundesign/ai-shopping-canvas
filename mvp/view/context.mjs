// What the canvas tells the agent about what the person sees: the selection (or
// the cards in view), the finalists, and the requests waiting. The view sends it
// as model context; the prompt tests send the same text, so they test what the
// agent really gets. Pure functions of the canvas state, no DOM.

const price = (p) => {
  if (!p) return "";
  const n = Number(p.amount);
  const sym = !p.currency || p.currency === "USD" ? "$" : `${p.currency} `;
  return `, ${sym}${Number.isInteger(n) ? n : n.toFixed(2)}`;
};
const liveCards = (state) => (state?.cards || []).filter((c) => !c.deleted);
const finder = (state) => (id) => (state?.cards || []).find((c) => c.id === id);

/** Requests waiting for the agent: details to fill, empty cards, specs to compare. */
export function waitingRequests(state) {
  const live = liveCards(state);
  const fin = state?.finalists || [];
  const details = new Map();
  for (const c of live) {
    if (c.kind !== "product") continue;
    for (const [d, v] of Object.entries(c.details || {})) {
      // A compare spec is asked only of cards that are finalists now.
      if (v.state === "waiting" && (state.detailScope?.[d] !== "finalists" || fin.includes(c.id))) details.set(d, [...(details.get(d) || []), c.id]);
    }
  }
  const items = [...details].map(([d, ids]) => ({ key: `d:${d}:${ids.join(",")}`, text: `fill in "${d}" for ${ids.join(", ")}`, context: `detail "${d}" for ${ids.join(", ")} (fill_details)` }));
  for (const c of live) {
    if (c.kind !== "request") continue;
    const like = Array.isArray(c.like) && c.like.length ? `, like ${c.like.join(" and ")}` : "";
    items.push({ key: `c:${c.id}`, text: `find one more product for the empty card ${c.id} ("${c.hint}")${like}`, context: `one more product, hint "${c.hint}"${like} (add_cards with fills_request "${c.id}")` });
  }
  const specs = state?.specRequest;
  if (specs && !specs.answered) {
    const ids = specs.ids.join(", ");
    items.push({ key: `s:${specs.at}`, text: `add the specs that would decide between my finalists ${ids}`, context: `specs to compare the finalists ${ids}: pick 4 to 6 that would decide between them and fill every finalist with the value only (fill_details; new spec names are allowed for this)` });
  }
  return items;
}

/** The model context text. selection and inView are card ids. */
export function contextText(state, { canvasId, selection = [], inView = [] }) {
  const byId = finder(state);
  const isProduct = (c) => c && !c.deleted && c.kind === "product";
  // Each card with its price, so a question like "which is cheapest?" needs no read_canvas.
  const name = (id) => (byId(id)?.kind === "request" ? `${id} (a request: "${byId(id).hint}")` : `${id} ${(byId(id)?.name || "").slice(0, 70)}${price(byId(id)?.price)}`);
  const sel = [...selection].filter((id) => byId(id) && !byId(id).deleted);
  const fin = (state?.finalists || []).filter((id) => isProduct(byId(id)));
  const lines = [`Shopping canvas ${canvasId}: what the person sees right now.`];
  if (sel.length) lines.push(`Selected (${sel.length}): ${sel.map(name).join("; ")}. "These" means these cards.`);
  else {
    const seen = new Set(inView);
    const view = liveCards(state).filter((c) => seen.has(c.id)).map((c) => c.id);
    lines.push(`Nothing selected. Cards in view (${view.length}): ${view.map(name).join("; ")}.`);
  }
  lines.push(fin.length ? `Finalists, the person's shortlist (${fin.length}): ${fin.map(name).join("; ")}. Speak about them first.` : "No finalists yet.");
  const specs = (state?.detailOrder || []).filter((d) => state.detailScope?.[d] === "finalists");
  if (specs.length) lines.push(`Specs in the compare table, for the finalists: ${specs.join(", ")}.`);
  const waiting = waitingRequests(state);
  lines.push(waiting.length ? `Requests waiting for you, to answer in your next reply: ${waiting.map((w) => w.context).join("; ")}.` : "No requests waiting.");
  lines.push("Answer comparisons briefly in the chat and call point_at_cards on the cards you name. Don't add details the person didn't ask for.");
  return lines.join("\n");
}
