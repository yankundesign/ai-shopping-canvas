// The test report: one page that answers the four questions from the log.

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const secs = (ms) => (ms == null ? "–" : `${(ms / 1000).toFixed(1)}s`);

function canvasStats(c) {
  const ev = c.events;
  const of = (t) => ev.filter((e) => e.type === t);

  // Q1: blanks as messages
  const blanks = of("blank_created");
  const results = of("view_message_result");
  const outcome = (o) => results.filter((e) => e.data?.outcome === o).length;
  const blankRuns = blanks.map((b) => {
    const fill = ev.find(
      (e) =>
        e.type === "blank_filled" &&
        e.at >= b.at &&
        (b.kind === "card" ? e.card === b.card : e.detail === b.detail && (b.cards || []).includes(e.card)),
    );
    const msg = results.find((e) => e.at >= b.at && e.data?.blank === (b.card || b.detail));
    return { at: b.at, kind: b.kind, what: b.kind === "card" ? `empty card "${b.hint}"` : `"${b.detail}" on ${b.cards?.length || 0} cards`, sent: msg?.data?.outcome || "not sent", ms: fill ? fill.at - b.at : null };
  });

  // Q2: selection
  const reads = of("agent_read");
  const selectionChanges = of("selection_changed").length;
  const contextSent = of("view_context_sent");

  // Q4: store pages
  const pages = of("page_read");
  const pageBoth = pages.filter((p) => p.photo && p.price).length;
  const byCheck = pages.reduce((m, p) => ((m[p.check] = (m[p.check] || 0) + 1), m), {});
  const byStore = {};
  for (const p of pages) {
    let host = "?";
    try {
      host = new URL(p.link).hostname.replace(/^www\./, "");
    } catch {}
    byStore[host] ??= { n: 0, both: 0, blocked: 0 };
    byStore[host].n++;
    if (p.photo && p.price) byStore[host].both++;
    if (p.check === "not_checked") byStore[host].blocked++;
  }

  return {
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
    host: c.host,
    settings: c.settings,
    q1: {
      blanks: blanks.length,
      messages: { accepted: outcome("accepted"), rejected: outcome("rejected"), failed: outcome("failed"), waiting: outcome("waiting") },
      medianFillMs: median(blankRuns.filter((r) => r.ms != null).map((r) => r.ms)),
      filled: blankRuns.filter((r) => r.ms != null).length,
      runs: blankRuns,
    },
    q2: {
      selectionChanges,
      contextUpdates: contextSent.length,
      contextFailures: contextSent.filter((e) => e.data?.ok === false).length,
      agentReads: reads.length,
      readsWithSelection: reads.filter((r) => r.selection?.length).length,
    },
    q4: {
      pages: pages.length,
      photoAndPrice: pageBoth,
      byCheck,
      byStore,
      mismatches: of("price_mismatch").length,
      catalogTried: pages.filter((p) => p.catalogPhoto && p.catalogPhoto !== "not needed").length,
      catalogLoaded: pages.filter((p) => String(p.catalogPhoto || "").startsWith("loaded")).length,
      agentPhotosSent: pages.filter((p) => p.agentPhoto && p.agentPhoto !== "none").length,
      agentPhotosLoaded: pages.filter((p) => p.agentPhoto === "loaded").length,
      agentPhotosFailed: pages.filter((p) => String(p.agentPhoto || "").startsWith("failed")).length,
    },
    agentTools: of("agent_tool").reduce((m, e) => ((m[e.tool] = (m[e.tool] || 0) + 1), m), {}),
    events: ev.slice(-250),
  };
}

export function reportData(canvases, clients) {
  return { generatedAt: new Date().toISOString(), clients, canvases: canvases.map(canvasStats) };
}

export function renderReport(canvases, clients) {
  const data = reportData(canvases, clients);
  const t0 = (c) => c.createdAt;
  const section = (c) => `
  <section>
    <h2>${esc(c.title)} <small>${esc(c.id)} · ${new Date(c.createdAt).toLocaleString()}</small></h2>
    <p class="muted">Host: ${esc(c.host?.name || "unknown")} ${esc(c.host?.version || "")} · display mode ${esc(c.host?.displayMode || "?")} · blanks: ${esc(c.settings.blanks)} · selection via: ${esc(c.settings.selection)}</p>

    <h3>1. Approvals: blanks sent as messages</h3>
    <p>${c.q1.blanks} blanks · messages accepted by the host ${c.q1.messages.accepted}, refused ${c.q1.messages.rejected}, failed ${c.q1.messages.failed} · filled ${c.q1.filled} of ${c.q1.blanks} · median time to filled ${secs(c.q1.medianFillMs)}</p>
    <table><tr><th>When</th><th>Blank</th><th>Message</th><th>Filled after</th></tr>
    ${c.q1.runs.map((r) => `<tr><td>${secs(r.at - t0(c))}</td><td>${esc(r.what)}</td><td>${esc(r.sent)}</td><td>${secs(r.ms)}</td></tr>`).join("")}</table>
    <p class="muted">"Accepted" only means the host took the message; Claude may still be waiting for the person to allow it. Note what Claude showed each time in TEST_GUIDE.md.</p>

    <h3>2. Selection</h3>
    <p>Selection changed ${c.q2.selectionChanges} times · sent into model context ${c.q2.contextUpdates} times (${c.q2.contextFailures} failed) · agent called read_canvas ${c.q2.agentReads} times (${c.q2.readsWithSelection} with something selected)</p>

    <h3>3. Host</h3>
    <pre>${esc(JSON.stringify(c.host, null, 2) || "No host info yet")}</pre>

    <h3>4. Store pages</h3>
    <p>${c.q4.photoAndPrice} of ${c.q4.pages} pages gave photo and price · ${esc(JSON.stringify(c.q4.byCheck))} · agent price differed from page ${c.q4.mismatches} times</p>
    <p>Shopify catalog asked for ${c.q4.catalogTried} cards without a page photo · found a matching photo for ${c.q4.catalogLoaded}</p>
    <p>Agent sent a photo for ${c.q4.agentPhotosSent} cards · used and loaded ${c.q4.agentPhotosLoaded} · failed to load ${c.q4.agentPhotosFailed}</p>
    <table><tr><th>Store</th><th>Links</th><th>Photo and price</th><th>Refused or unreadable</th></tr>
    ${Object.entries(c.q4.byStore).map(([s, v]) => `<tr><td>${esc(s)}</td><td>${v.n}</td><td>${v.both}</td><td>${v.blocked}</td></tr>`).join("")}</table>

    <h3>Agent tool calls</h3>
    <p>${esc(JSON.stringify(c.agentTools))}</p>

    <details><summary>Event log (last 250)</summary>
    <table>${c.events.map((e) => `<tr><td>${secs(e.at - t0(c))}</td><td>${esc(e.type)}</td><td><code>${esc(JSON.stringify({ ...e, at: undefined, type: undefined }))}</code></td></tr>`).join("")}</table>
    </details>
  </section>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Tech test report</title>
<style>
body{font:14px/1.5 -apple-system,system-ui,sans-serif;max-width:980px;margin:32px auto;padding:0 16px;color:#222}
h1{font-size:20px} h2{font-size:17px;margin-top:40px;border-top:1px solid #ddd;padding-top:16px} h3{font-size:14px;margin:20px 0 4px}
small,.muted{color:#777;font-weight:normal} table{border-collapse:collapse;width:100%;font-size:13px}
td,th{border-bottom:1px solid #eee;padding:4px 6px;text-align:left;vertical-align:top} code,pre{font-size:12px;white-space:pre-wrap;word-break:break-all}
</style></head><body>
<h1>Shopping canvas: technical test report</h1>
<p class="muted">Generated ${esc(data.generatedAt)}. Reload to update.</p>
<h3>Hosts that connected</h3>
<table><tr><th>When</th><th>Client</th><th>MCP Apps support</th></tr>
${data.clients.map((cl) => `<tr><td>${new Date(cl.at).toLocaleString()}</td><td>${esc(JSON.stringify(cl.clientInfo))}</td><td>${cl.capabilities?.extensions?.["io.modelcontextprotocol/ui"] ? "yes" : "not declared"}</td></tr>`).join("") || "<tr><td colspan=3>None since the server started</td></tr>"}
</table>
${data.canvases.map(section).join("") || "<p>No canvases yet.</p>"}
</body></html>`;
}
