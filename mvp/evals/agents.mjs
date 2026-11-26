// Two ways to put a real Claude in the agent's seat for the prompt tests. Both see
// the same system prompt, the canvas's agent tools and web search, and return the
// same shape: { reply, calls: [{ name, input, result, isError }], usage, ms, error }.
//
//   api: the Anthropic SDK with ANTHROPIC_API_KEY. You choose exactly what the agent
//        sees: only the tools a host shows it, the canvas context as its own block.
//   cli: the Claude Code CLI on your Claude login (run `claude`, then /login, once).
//        No key needed, but it runs inside Claude Code's harness.

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const TURN_LIMIT = 24;

// --- api ---

export async function apiAgent({ model, system, context, prompt, tools, callTool, effort = "medium" }) {
  const client = new Anthropic();
  const started = Date.now();
  const defs = [
    ...tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema })),
    { type: "web_search_20260209", name: "web_search", max_uses: 6 },
    { type: "web_fetch_20260209", name: "web_fetch", max_uses: 6 },
  ];
  // The canvas context arrives with the person's message, as hosts add model context to the next turn.
  const content = [...(context ? [{ type: "text", text: `<canvas_context>\n${context}\n</canvas_context>` }] : []), { type: "text", text: prompt }];
  const messages = [{ role: "user", content }];
  const calls = [];
  const texts = [];
  const usage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, web_search_requests: 0 };
  let error = null;
  try {
    for (let turn = 0; turn < TURN_LIMIT; turn++) {
      const res = await client.beta.messages.create({
        model,
        max_tokens: 16000,
        system,
        tools: defs,
        messages,
        output_config: { effort },
        // If a safety classifier declines, the API reruns the turn on a fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
      usage.input_tokens += res.usage?.input_tokens || 0;
      usage.output_tokens += res.usage?.output_tokens || 0;
      usage.cache_read_input_tokens += res.usage?.cache_read_input_tokens || 0;
      usage.web_search_requests += res.usage?.server_tool_use?.web_search_requests || 0;
      for (const b of res.content) {
        if (b.type === "text" && b.text.trim()) texts.push(b.text.trim());
        if (b.type === "server_tool_use") calls.push({ name: b.name, input: b.input });
      }
      if (res.stop_reason === "refusal") {
        error = `refused (${res.stop_details?.category || "no category"})`;
        break;
      }
      messages.push({ role: "assistant", content: res.content });
      if (res.stop_reason === "pause_turn") continue; // a long web search: send the turn back to continue it
      const uses = res.content.filter((b) => b.type === "tool_use");
      if (res.stop_reason === "max_tokens") {
        error = "hit max_tokens";
        break;
      }
      if (!uses.length) break;
      const results = await Promise.all(
        uses.map(async (u) => {
          const out = await callTool(u.name, u.input);
          calls.push({ name: u.name, input: u.input, result: out.text, isError: out.isError });
          return { type: "tool_result", tool_use_id: u.id, content: out.text || "(empty)", ...(out.isError ? { is_error: true } : {}) };
        }),
      );
      messages.push({ role: "user", content: results });
      if (turn === TURN_LIMIT - 1) error = `stopped after ${TURN_LIMIT} turns`;
    }
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) error = "the API key was refused";
    else if (e instanceof Anthropic.RateLimitError) error = "rate limited; try fewer jobs at once (--jobs 1)";
    else if (e instanceof Anthropic.APIError) error = `API error ${e.status}: ${e.message}`;
    else error = String(e?.message || e);
  }
  return { reply: texts.join("\n\n"), calls, usage, ms: Date.now() - started, error };
}

// --- cli ---

const CLI_NAME = /^mcp__canvas__/;

export async function cliAgent({ model, system, context, prompt, tools, hiddenTools, mcpUrl, timeoutMs = 8 * 60e3 }) {
  const started = Date.now();
  // An empty folder, so no project settings or CLAUDE.md reach the agent.
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "canvas-eval-"));
  const mcp = JSON.stringify({ mcpServers: { canvas: { type: "http", url: mcpUrl } } });
  const text = (context ? `<canvas_context>\n${context}\n</canvas_context>\n\n` : "") + prompt;
  const args = [
    "-p",
    "--model", model,
    "--output-format", "stream-json",
    "--verbose",
    "--no-session-persistence",
    "--setting-sources", "project",
    "--system-prompt", system,
    "--mcp-config", mcp,
    "--strict-mcp-config",
    "--tools", "WebSearch", "WebFetch",
    "--allowedTools", ...tools.map((t) => `mcp__canvas__${t.name}`), "WebSearch", "WebFetch",
    "--disallowedTools", ...hiddenTools.map((n) => `mcp__canvas__${n}`),
  ];
  const calls = [];
  const byId = new Map();
  const texts = [];
  let result = null;
  let stderr = "";
  await new Promise((resolve) => {
    const child = spawn("claude", args, { cwd, env: process.env, stdio: ["pipe", "pipe", "pipe"] });
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    let buf = "";
    child.stdout.on("data", (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line) continue;
        let ev;
        try {
          ev = JSON.parse(line);
        } catch {
          continue;
        }
        if (ev.type === "assistant") {
          for (const b of ev.message?.content || []) {
            if (b.type === "text" && b.text.trim()) texts.push(b.text.trim());
            if (b.type === "tool_use") {
              const call = { name: normalize(b.name), input: b.input };
              byId.set(b.id, call);
              calls.push(call);
            }
          }
        } else if (ev.type === "user") {
          for (const b of ev.message?.content || []) {
            if (b.type !== "tool_result" || !byId.has(b.tool_use_id)) continue;
            const call = byId.get(b.tool_use_id);
            call.result = Array.isArray(b.content) ? b.content.map((c) => c.text || "").join("\n") : String(b.content ?? "");
            call.isError = !!b.is_error;
          }
        } else if (ev.type === "result") result = ev;
      }
    });
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", () => {
      clearTimeout(timer);
      resolve();
    });
    child.on("error", (e) => {
      stderr += String(e.message);
      clearTimeout(timer);
      resolve();
    });
    child.stdin.end(text);
  });
  fs.rmSync(cwd, { recursive: true, force: true });
  let error = null;
  if (!result) error = `the CLI gave no result${stderr ? `: ${stderr.trim().slice(0, 300)}` : ""}`;
  else if (result.is_error) error = /authenticate|login|oauth/i.test(String(result.result)) ? "the Claude CLI isn't logged in: run `claude` in a terminal, then /login" : String(result.result).slice(0, 300);
  return {
    reply: texts.join("\n\n"),
    calls,
    usage: { cost_usd: result?.total_cost_usd ?? null, turns: result?.num_turns ?? null },
    ms: Date.now() - started,
    error,
  };
}

function normalize(name) {
  if (CLI_NAME.test(name)) return name.replace(CLI_NAME, "");
  if (name === "WebSearch") return "web_search";
  if (name === "WebFetch") return "web_fetch";
  return name;
}
