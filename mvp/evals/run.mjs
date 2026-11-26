#!/usr/bin/env node
// Prompt tests for the shopping canvas: a real Claude in the agent's seat, a
// scripted person on the canvas, and checks on what changed.
//
//   npm run eval                      every scenario except the slow web search
//   npm run eval -- selection add-specs
//   npm run eval -- --slow            include first-search
//   npm run eval -- --dry-run         set up each canvas and print what the agent would get
//   npm run eval -- --list
//   options: --agent api|cli  --model claude-opus-5-5  --jobs 2  --port 8799
//
// It starts its own canvas server (data in evals/data/), so your canvases are untouched.
// The report goes to evals/results/.

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scenarios } from "./scenarios.mjs";
import { apiAgent, cliAgent } from "./agents.mjs";
import { contextText } from "../view/context.mjs";
import { SAMPLE, SAMPLE_TITLE } from "../dev/sample.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

// ---------- options ----------

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const option = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const optionNames = new Set(["agent", "model", "jobs", "port"]);
const named = argv.filter((a, i) => !a.startsWith("--") && !optionNames.has(argv[i - 1]?.slice(2)));

if (flag("list")) {
  for (const s of scenarios) console.log(`${s.id.padEnd(18)} ${s.slow ? "(slow) " : ""}${s.title}`);
  process.exit(0);
}

const AGENT = option("agent", process.env.ANTHROPIC_API_KEY ? "api" : "cli");
const MODEL = option("model", "claude-opus-5-5");
const JOBS = Math.max(1, Number(option("jobs", 2)));
const PORT = Number(option("port", 8799));
const DRY = flag("dry-run");
const unknown = named.filter((n) => !scenarios.some((s) => s.id === n));
if (unknown.length) {
  console.error(`No scenario called ${unknown.join(", ")}. See --list.`);
  process.exit(2);
}
const chosen = scenarios.filter((s) => (named.length ? named.includes(s.id) : !s.slow || flag("slow")));

// ---------- the canvas server ----------

const DATA_DIR = path.join(here, "data");
let server = null;

async function startServer() {
  if (!fs.existsSync(path.join(root, "dist/view.html"))) await run("node", ["build.mjs"]);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const log = fs.openSync(path.join(DATA_DIR, "server.log"), "a");
  server = spawn("node", ["server.mjs"], { cwd: root, env: { ...process.env, PORT: String(PORT), DATA_DIR, PUBLIC_URL: "" }, stdio: ["ignore", log, log] });
  server.on("exit", (code) => code && !stopping && console.error(`The test server stopped (code ${code}); see evals/data/server.log. Is port ${PORT} free? Try --port.`));
  const token = () => fs.readFileSync(path.join(DATA_DIR, "token.txt"), "utf8").trim();
  for (let i = 0; i < 60; i++) {
    await sleep(250);
    try {
      MCP_URL = `http://localhost:${PORT}/mcp/${token()}`;
      const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "canvas-evals", version: "1" } });
      return init;
    } catch {
      // not up yet
    }
  }
  throw new Error(`The test server didn't start on port ${PORT}; see evals/data/server.log.`);
}

let stopping = false;
function stopServer() {
  stopping = true;
  server?.kill();
}

let MCP_URL = "";
let rpcId = 0;
async function rpc(method, params) {
  const res = await fetch(MCP_URL, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }) });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}
const tool = async (name, args) => {
  const r = await rpc("tools/call", { name, arguments: args });
  if (r.isError) throw new Error(`${name}: ${r.content?.[0]?.text}`);
  return r;
};
const getCanvas = async (id) => (await tool("canvas_get", { canvas_id: id })).structuredContent.canvas;

// The canvas reads each store page after cards land; wait so prices settle.
async function settle(id, ms = 45000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    const s = await getCanvas(id);
    if (!s.cards.some((c) => !c.deleted && c.check === "checking")) return s;
    await sleep(1000);
  }
  return getCanvas(id);
}

// ---------- the person ----------

function person() {
  const st = { canvasId: null, selection: [], inView: [], setup: {} };
  const send = () => tool("canvas_view", { canvas_id: st.canvasId, selection: st.selection, in_view: st.inView });
  return {
    st,
    async open() {
      const r = await tool("open_canvas", { title: SAMPLE_TITLE, cards: SAMPLE });
      st.canvasId = r.structuredContent.canvas_id;
      st.inView = SAMPLE.map((_, i) => `c${i + 1}`);
      await settle(st.canvasId);
      await send();
    },
    async select(ids) {
      st.selection = ids;
      await send();
    },
    async view(ids) {
      st.selection = [];
      st.inView = ids;
      await send();
    },
    async finalists(ids) {
      await tool("canvas_finalists", { canvas_id: st.canvasId, card_ids: ids, how: "compare" });
    },
    async addDetail(name, ids) {
      await tool("canvas_add_detail", { canvas_id: st.canvasId, name, card_ids: ids, scope: st.selection.length ? "selection" : "view" });
    },
    async requestCard(hint, likeIds) {
      const r = await tool("canvas_add_request_card", { canvas_id: st.canvasId, hint, like_ids: likeIds, x: 2000, y: 0 });
      st.setup.requestId = r.structuredContent.card_id;
    },
    async requestSpecs() {
      const s = await getCanvas(st.canvasId);
      await tool("canvas_request_specs", { canvas_id: st.canvasId, card_ids: s.finalists });
    },
  };
}

// ---------- one scenario ----------

function systemPrompt(instructions) {
  return `You are Claude, an AI assistant, chatting with a person in a chat app. The person is shopping. A shopping canvas app is connected to this chat and shows beside it; use its tools as its instructions say. Text inside <canvas_context> comes from the canvas, not from the person: it says what they see there right now. Reply the way you would in a chat: conversational and brief.

# Shopping canvas: the app's instructions
${instructions}`;
}

async function runScenario(sc, env) {
  const p = person();
  const started = Date.now();
  try {
    if (sc.setup) await sc.setup(p);
  } catch (e) {
    return { sc, error: `setup failed: ${e.message}`, checks: [], pass: false, ms: Date.now() - started };
  }
  let canvasId = p.st.canvasId;
  const before = canvasId ? await getCanvas(canvasId) : null;
  const context = before ? contextText(before, { canvasId, selection: p.st.selection, inView: p.st.inView }) : null;
  if (DRY) return { sc, context, dry: true, before, pass: true, checks: [], ms: Date.now() - started };

  const args = { model: MODEL, system: env.system, context, prompt: sc.prompt, tools: env.agentTools };
  const out =
    AGENT === "api"
      ? await apiAgent({ ...args, callTool: async (name, input) => {
          const r = await rpc("tools/call", { name, arguments: input });
          return { text: (r.content || []).map((c) => c.text || "").join("\n"), isError: !!r.isError };
        } })
      : await cliAgent({ ...args, hiddenTools: env.hiddenTools, mcpUrl: MCP_URL });

  // A canvas the agent opened itself: find it in its calls.
  if (!canvasId) {
    const ids = out.calls.flatMap((c) => [c.input?.canvas_id, ...(String(c.result || "").match(/cv_[0-9a-f]+/g) || [])]).filter(Boolean);
    canvasId = ids[0] || null;
  }
  const after = canvasId ? await settle(canvasId) : null;
  const r = { ...out, before, after, canvasId, selection: p.st.selection, inView: p.st.inView, setup: p.st.setup };
  const checks = sc.checks.map((ch) => {
    try {
      const [pass, detail] = ch.test(r);
      return { name: ch.name, level: ch.level, pass: !!pass, detail: detail ?? "" };
    } catch (e) {
      return { name: ch.name, level: ch.level, pass: false, detail: `couldn't check: ${e.message}` };
    }
  });
  const pass = !out.error && checks.filter((c) => c.level === "must").every((c) => c.pass);
  return { sc, context, ...out, checks, pass, after, ms: Date.now() - started };
}

// ---------- report ----------

const mark = (c) => (c.pass ? "✓" : c.level === "must" ? "✗" : "~");
const compact = (v, n = 220) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
};

function summaryLine(res) {
  if (res.dry) return `SETUP ${res.sc.id}`;
  const failed = res.checks.filter((c) => !c.pass);
  const head = `${res.pass ? "PASS" : "FAIL"}  ${res.sc.id.padEnd(18)} ${(res.ms / 1000).toFixed(0)} s`;
  const lines = [head];
  if (res.error) lines.push(`        ✗ ${res.error}`);
  for (const c of failed) lines.push(`        ${mark(c)} ${c.name}: ${c.detail}`);
  return lines.join("\n");
}

function markdown(results, meta) {
  const out = [`# Canvas prompt tests, ${meta.when}`, "", `Agent: ${meta.agent} · model ${meta.model} · ${results.filter((r) => r.pass).length} of ${results.length} passed`, ""];
  out.push("✓ passed · ✗ failed (must) · ~ worth a look (soft check, judges wording)", "");
  for (const r of results) {
    out.push(`## ${r.dry ? "·" : r.pass ? "✅" : "❌"} ${r.sc.id}: ${r.sc.title}`, "");
    out.push(`**The person types:** ${r.sc.prompt}`, "");
    if (r.error) out.push(`**Error:** ${r.error}`, "");
    if (r.checks?.length) {
      out.push("**Checks**", "");
      for (const c of r.checks) out.push(`- ${mark(c)} ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
      out.push("");
    }
    if (r.reply != null) out.push("**The agent's reply**", "", r.reply ? r.reply.split("\n").map((l) => `> ${l}`).join("\n") : "_(no text)_", "");
    if (r.calls?.length) {
      out.push("**Tool calls**", "");
      r.calls.forEach((c, i) => out.push(`${i + 1}. \`${c.name}\` ${compact(c.input)}${c.isError ? " → error" : ""}${c.result && c.name !== "web_search" && c.name !== "web_fetch" ? `\n   → ${compact(c.result, 300).replace(/\n/g, " ⏎ ")}` : ""}`));
      out.push("");
    }
    if (r.context) out.push("<details><summary>Canvas context the agent got</summary>", "", "```text", r.context, "```", "</details>", "");
    const u = r.usage || {};
    const cost = u.cost_usd != null ? ` · $${u.cost_usd.toFixed(3)}` : u.input_tokens != null ? ` · ${u.input_tokens} in / ${u.output_tokens} out tokens${u.web_search_requests ? ` · ${u.web_search_requests} searches` : ""}` : "";
    out.push(`_${(r.ms / 1000).toFixed(0)} s${cost}_`, "");
  }
  return out.join("\n");
}

// ---------- main ----------

async function main() {
  console.log(`${DRY ? "Dry run" : `Agent: ${AGENT}, model ${MODEL}`}. Scenarios: ${chosen.map((s) => s.id).join(", ")}`);
  if (!DRY && AGENT === "api" && !process.env.ANTHROPIC_API_KEY) throw new Error("--agent api needs ANTHROPIC_API_KEY.");
  const init = await startServer();
  const { tools } = await rpc("tools/list", {});
  const appOnly = (t) => {
    const v = t._meta?.ui?.visibility;
    return Array.isArray(v) && v.length && !v.includes("model");
  };
  const env = { system: systemPrompt(init.instructions || ""), agentTools: tools.filter((t) => !appOnly(t)), hiddenTools: tools.filter(appOnly).map((t) => t.name) };
  console.log(`Test server on port ${PORT}. The agent sees: ${env.agentTools.map((t) => t.name).join(", ")}, web search.`);

  const results = [];
  const queue = [...chosen];
  await Promise.all(
    Array.from({ length: Math.min(JOBS, queue.length) }, async () => {
      while (queue.length) {
        const sc = queue.shift();
        const res = await runScenario(sc, env);
        results.push(res);
        console.log(summaryLine(res));
        if (DRY && res.context) console.log(res.context.replace(/^/gm, "        ") + `\n        The person types: ${sc.prompt}\n`);
      }
    }),
  );
  results.sort((a, b) => chosen.indexOf(a.sc) - chosen.indexOf(b.sc));

  if (!DRY) {
    const when = new Date();
    const stamp = when.toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
    const dir = path.join(here, "results");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${stamp}-${AGENT}.md`);
    fs.writeFileSync(file, markdown(results, { when: when.toLocaleString(), agent: AGENT, model: MODEL }));
    const passed = results.filter((r) => r.pass).length;
    console.log(`\n${passed} of ${results.length} passed. Report: ${path.relative(process.cwd(), file)}`);
    process.exitCode = passed === results.length ? 0 : 1;
  }
}

function run(cmd, args) {
  return new Promise((resolve, reject) => spawn(cmd, args, { cwd: root, stdio: "inherit" }).on("close", (c) => (c ? reject(new Error(`${cmd} failed`)) : resolve())));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 2;
  })
  .finally(stopServer);
