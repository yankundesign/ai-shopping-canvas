// Prompt tests: what a person types, with the canvas in a given state, and what
// must be true afterwards. "must" checks decide pass or fail; "soft" checks are
// worth reading but judge wording, so they only warn.
//
// setup(p) plays the person before the message: p.open() puts the sample cards
// on a new canvas (as if the agent had done it earlier in the chat), then
// p.select / p.view / p.finalists / p.addDetail / p.requestCard / p.requestSpecs.
// Sample cards: c1 KEEN Targhee IV, c2 Salomon X Ultra 360, c3 Oboz Sawtooth X,
// c4 Merrell Moab 3, c5 adidas Terrex Skychaser, c6 KEEN Hightrail,
// c7 Columbia Crestwood, c8 a made-up shoe whose page doesn't exist.

// Words that identify each sample card in a reply.
export const NAMES = { c1: /targhee/i, c2: /salomon|x ultra/i, c3: /oboz|sawtooth/i, c4: /merrell|moab/i, c5: /adidas|skychaser/i, c6: /hightrail/i, c7: /columbia|crestwood/i, c8: /made-up/i };

const must = (name, test) => ({ name, level: "must", test });
const soft = (name, test) => ({ name, level: "soft", test });

// Helpers for checks. r = { reply, calls, before, after, canvasId, selection, inView, setup }
const products = (s) => (s?.cards || []).filter((c) => !c.deleted && c.kind === "product");
const card = (s, id) => (s?.cards || []).find((c) => c.id === id);
const pointed = (r) => r.after?.pointer?.ids || [];
const said = (r, id) => NAMES[id].test(r.reply);
const sameDetails = (r) => JSON.stringify(r.after?.detailOrder) === JSON.stringify(r.before?.detailOrder);
const subset = (ids, allowed) => ids.length > 0 && ids.every((id) => allowed.includes(id));
const list = (ids) => ids.join(", ") || "none";
// The agent kept telling the person a price "hasn't been checked"; that note is gone from what it's told.
const caveat = /\b(haven'?t|have not|hasn'?t|has not|not been|couldn'?t|could not|didn'?t|did not)\b[^.]{0,30}\b(check|verif|confirm)|\bnone of\b[^.]{0,40}\b(checked|verified|confirmed)|\bunverified\b/i;
const noCaveat = soft("doesn't hedge that prices weren't checked", (r) => {
  const m = r.reply.match(caveat);
  return [!m, m ? `"…${r.reply.slice(Math.max(0, m.index - 30), m.index + m[0].length + 10)}…"` : "no hedge"];
});

export const scenarios = [
  {
    id: "first-search",
    slow: true, // searches the web for real products
    title: "No canvas yet: asks for options",
    prompt: "I need waterproof hiking shoes for wide feet, under $150. Can you find me some options?",
    checks: [
      must("puts products on a canvas", (r) => [products(r.after).length >= 3, `${products(r.after).length} cards`]),
      must("every card has a real-looking https link", (r) => {
        const bad = products(r.after).filter((c) => !/^https:\/\/[^/]+\.[a-z]{2,}\/.+/i.test(c.link || ""));
        return [bad.length === 0, bad.length ? `no proper link: ${list(bad.map((c) => c.id))}` : "all linked"];
      }),
      soft("starts details from the person's words (waterproof, wide)", (r) => [(r.after?.detailOrder || []).some((d) => /waterproof|wide/i.test(d)), `details: ${list(r.after?.detailOrder || [])}`]),
      soft("prices it gave are $150 or less", (r) => {
        const over = products(r.after).filter((c) => c.price && c.price.amount > 150);
        return [over.length === 0, over.length ? `over: ${over.map((c) => `${c.id} $${c.price.amount}`).join(", ")}` : "all within"];
      }),
      soft("pages the canvas found dead: none", (r) => {
        const dead = products(r.after).filter((c) => c.check === "dead_link");
        return [dead.length === 0, dead.length ? `page not found: ${list(dead.map((c) => c.id))}` : "none"];
      }),
    ],
  },
  {
    id: "selection",
    title: "Two cards selected: \"What's actually different about these?\"",
    setup: async (p) => {
      await p.open();
      await p.select(["c2", "c4"]);
    },
    prompt: "What's actually different about these?",
    checks: [
      must("talks about both selected shoes", (r) => [said(r, "c2") && said(r, "c4"), `Salomon ${said(r, "c2") ? "yes" : "no"}, Merrell ${said(r, "c4") ? "yes" : "no"}`]),
      must("points at the selected cards, and only those", (r) => [subset(pointed(r), ["c2", "c4"]), `pointed at ${list(pointed(r))}`]),
      must("adds no details", (r) => [sameDetails(r), `details: ${list(r.after?.detailOrder || [])}`]),
      soft("leaves the other cards out of it", (r) => {
        const others = ["c1", "c3", "c5", "c6", "c7"].filter((id) => said(r, id));
        return [others.length === 0, others.length ? `also mentions ${list(others)}` : "only those two"];
      }),
      soft("keeps it short (under 1,200 characters)", (r) => [r.reply.length < 1200, `${r.reply.length} characters`]),
      noCaveat,
    ],
  },
  {
    id: "in-view",
    title: "Nothing selected, four cards in view: \"Which of these is the cheapest?\"",
    setup: async (p) => {
      await p.open();
      await p.view(["c5", "c6", "c7", "c8"]);
    },
    prompt: "Which of these is the cheapest?",
    checks: [
      must("names the cheapest card in view", (r) => {
        const cheapest = ["c5", "c6", "c7", "c8"].map((id) => card(r.before, id)).filter((c) => c?.price).sort((a, b) => a.price.amount - b.price.amount)[0];
        return [said(r, cheapest.id), `cheapest in view: ${cheapest.id} ${cheapest.name} $${cheapest.price.amount}`];
      }),
      must("points at it", (r) => {
        const cheapest = ["c5", "c6", "c7", "c8"].map((id) => card(r.before, id)).filter((c) => c?.price).sort((a, b) => a.price.amount - b.price.amount)[0];
        return [pointed(r).includes(cheapest.id), `pointed at ${list(pointed(r))}`];
      }),
      soft("stays with the cards in view", (r) => [subset(pointed(r), ["c5", "c6", "c7", "c8"]), `pointed at ${list(pointed(r))}`]),
      soft("answers from the context, without read_canvas (prices are in it)", (r) => [!r.calls.some((c) => c.name === "read_canvas"), r.calls.some((c) => c.name === "read_canvas") ? "called read_canvas" : "no read_canvas"]),
      noCaveat,
    ],
  },
  {
    id: "detail-request",
    title: "\"Wide fit?\" left on four cards, then an unrelated message",
    setup: async (p) => {
      await p.open();
      await p.view(["c1", "c2", "c3", "c4"]);
      await p.addDetail("Wide fit?", ["c1", "c2", "c3", "c4"]);
    },
    prompt: "Thanks! Also, would any of these work for winter hiking?",
    checks: [
      must("answers \"Wide fit?\" on all four cards", (r) => {
        const left = ["c1", "c2", "c3", "c4"].filter((id) => !card(r.after, id)?.details?.["Wide fit?"] || card(r.after, id).details["Wide fit?"].state === "waiting");
        return [left.length === 0, left.length ? `still waiting: ${list(left)}` : "all four answered"];
      }),
      must("each answer has a source, or says it couldn't find one", (r) => {
        const bare = ["c1", "c2", "c3", "c4"].filter((id) => card(r.after, id)?.details?.["Wide fit?"]?.state === "answered" && !card(r.after, id).details["Wide fit?"].source);
        return [bare.length === 0, bare.length ? `no source: ${list(bare)}` : "sourced"];
      }),
      soft("also answers the winter question in the chat", (r) => [/winter|cold|snow|insulat/i.test(r.reply), r.reply.slice(0, 80)]),
    ],
  },
  {
    id: "detail-in-chat",
    title: "Asks in the chat to put the weights on the cards",
    setup: async (p) => {
      await p.open();
    },
    prompt: "Can you add the weight of each shoe to the cards?",
    checks: [
      must("adds a weight detail", (r) => {
        const added = (r.after?.detailOrder || []).filter((d) => !(r.before?.detailOrder || []).includes(d));
        return [added.length === 1 && /weight/i.test(added[0]), `added: ${list(added)}`];
      }),
      must("fills it on the seven real cards (a value or couldn't find)", (r) => {
        const name = (r.after?.detailOrder || []).find((d) => /weight/i.test(d));
        const gaps = ["c1", "c2", "c3", "c4", "c5", "c6", "c7"].filter((id) => !["answered", "couldnt_find"].includes(card(r.after, id)?.details?.[name]?.state));
        return [!!name && gaps.length === 0, !name ? "no weight detail" : gaps.length ? `missing: ${list(gaps)}` : "all seven"];
      }),
      must("passes the person's words as asked_in_chat", (r) => {
        const call = r.calls.find((c) => c.name === "fill_details" && c.input?.asked_in_chat);
        return [!!call, call ? `"${call.input.asked_in_chat}"` : "not set"];
      }),
      soft("gives a source for most weights (80%)", (r) => {
        const name = (r.after?.detailOrder || []).find((d) => /weight/i.test(d));
        const vals = products(r.after).map((c) => c.details?.[name]).filter((d) => d?.state === "answered");
        const sourced = vals.filter((d) => d.source).length;
        return [vals.length > 0 && sourced / vals.length >= 0.8, `${sourced} of ${vals.length} sourced`];
      }),
    ],
  },
  {
    id: "lightest-question",
    title: "Asks which is lightest, without asking to change the cards",
    setup: async (p) => {
      await p.open();
      await p.view(["c1", "c2", "c3", "c4"]);
    },
    prompt: "Which of these is the lightest?",
    checks: [
      must("adds no detail: a question isn't an ask to change the cards", (r) => [sameDetails(r), `details: ${list(r.after?.detailOrder || [])}`]),
      must("doesn't use asked_in_chat", (r) => [!r.calls.some((c) => c.input?.asked_in_chat), r.calls.some((c) => c.input?.asked_in_chat) ? "it did" : "no"]),
      soft("answers in the chat and points at one card", (r) => [pointed(r).length >= 1 && subset(pointed(r), ["c1", "c2", "c3", "c4"]), `pointed at ${list(pointed(r))}`]),
    ],
  },
  {
    id: "request-card",
    title: "An empty card left for \"cheaper, still Gore-Tex\" next to the Salomon, then \"go\"",
    setup: async (p) => {
      await p.open();
      await p.select(["c2"]);
      await p.requestCard("cheaper, still Gore-Tex", ["c2"]);
    },
    prompt: "go",
    checks: [
      must("fills the empty card with a product", (r) => {
        const c = card(r.after, r.setup.requestId);
        return [c?.kind === "product", c?.kind === "product" ? `${c.name}` : "still empty"];
      }),
      must("with a real-looking https link", (r) => {
        const c = card(r.after, r.setup.requestId);
        return [/^https:\/\/[^/]+\.[a-z]{2,}\/.+/i.test(c?.link || ""), c?.link || "no link"];
      }),
      must("points at the card it added", (r) => [pointed(r).includes(r.setup.requestId), `pointed at ${list(pointed(r))}; the new card is ${r.setup.requestId}`]),
      soft("cheaper than the Salomon", (r) => {
        const c = card(r.after, r.setup.requestId);
        const salomon = card(r.before, "c2");
        return [!!c?.price && c.price.amount < salomon.price.amount, `${c?.price ? "$" + c.price.amount : "no price"} vs $${salomon.price.amount}`];
      }),
      soft("Gore-Tex", (r) => {
        const c = card(r.after, r.setup.requestId);
        const text = [c?.name, ...Object.values(c?.details || {}).map((d) => d.value)].join(" ");
        return [/gore-?tex|gtx/i.test(text), text.slice(0, 100)];
      }),
    ],
  },
  {
    id: "add-specs",
    title: "Three finalists and Add specs: \"Help me decide between my finalists\"",
    setup: async (p) => {
      await p.open();
      await p.finalists(["c1", "c2", "c4"]);
      await p.requestSpecs();
    },
    prompt: "Help me decide between my finalists.",
    checks: [
      must("answers the spec request", (r) => [!!r.after?.specRequest?.answered, r.after?.specRequest?.answered ? "answered" : "still waiting"]),
      must("adds 4 to 6 specs", (r) => {
        const specs = (r.after?.detailOrder || []).filter((d) => r.after.detailScope?.[d] === "finalists");
        return [specs.length >= 4 && specs.length <= 6, `${specs.length}: ${list(specs)}`];
      }),
      must("fills every spec for every finalist", (r) => {
        const specs = (r.after?.detailOrder || []).filter((d) => r.after.detailScope?.[d] === "finalists");
        const gaps = [];
        for (const id of ["c1", "c2", "c4"]) for (const s of specs) if (!["answered", "couldnt_find"].includes(card(r.after, id)?.details?.[s]?.state)) gaps.push(`${id} ${s}`);
        return [specs.length > 0 && gaps.length === 0, gaps.length ? `missing: ${gaps.join("; ")}` : "complete"];
      }),
      must("puts no spec on the other cards", (r) => {
        const specs = (r.after?.detailOrder || []).filter((d) => r.after.detailScope?.[d] === "finalists");
        const leaks = ["c3", "c5", "c6", "c7", "c8"].filter((id) => specs.some((s) => card(r.after, id)?.details?.[s]));
        return [leaks.length === 0, leaks.length ? `on ${list(leaks)}` : "finalists only"];
      }),
      must("gives values only, no comparisons like \"(heaviest)\"", (r) => {
        const specs = (r.after?.detailOrder || []).filter((d) => r.after.detailScope?.[d] === "finalists");
        const vals = ["c1", "c2", "c4"].flatMap((id) => specs.map((s) => card(r.after, id)?.details?.[s]?.value)).filter(Boolean);
        const loaded = vals.filter((v) => /\b(heaviest|lightest|cheapest|priciest|best|worst|most|least|roomiest|narrowest|widest)\b/i.test(v));
        return [loaded.length === 0, loaded.length ? `e.g. "${loaded[0]}"` : `${vals.length} plain values`];
      }),
      soft("gives a source for most values (80%)", (r) => {
        const specs = (r.after?.detailOrder || []).filter((d) => r.after.detailScope?.[d] === "finalists");
        const vals = ["c1", "c2", "c4"].flatMap((id) => specs.map((s) => card(r.after, id)?.details?.[s])).filter((d) => d?.state === "answered");
        const sourced = vals.filter((d) => d.source).length;
        return [vals.length > 0 && sourced / vals.length >= 0.8, `${sourced} of ${vals.length} sourced`];
      }),
      soft("talks about the finalists", (r) => [["c1", "c2", "c4"].filter((id) => said(r, id)).length >= 2, `mentions ${list(["c1", "c2", "c4"].filter((id) => said(r, id)))}`]),
    ],
  },
  {
    id: "finalists-advice",
    title: "Two finalists, nothing selected: \"Which one should I buy?\"",
    setup: async (p) => {
      await p.open();
      await p.finalists(["c2", "c5"]);
    },
    prompt: "Which one should I buy?",
    checks: [
      must("answers about the finalists", (r) => [said(r, "c2") || said(r, "c5"), `Salomon ${said(r, "c2") ? "yes" : "no"}, adidas ${said(r, "c5") ? "yes" : "no"}`]),
      must("points only at finalists", (r) => [subset(pointed(r), ["c2", "c5"]), `pointed at ${list(pointed(r))}`]),
      must("adds no details", (r) => [sameDetails(r), `details: ${list(r.after?.detailOrder || [])}`]),
      soft("doesn't steer to cards outside the finalists", (r) => {
        const others = ["c1", "c3", "c4", "c6", "c7"].filter((id) => said(r, id));
        return [others.length === 0, others.length ? `also mentions ${list(others)}` : "finalists only"];
      }),
      noCaveat,
    ],
  },
];

