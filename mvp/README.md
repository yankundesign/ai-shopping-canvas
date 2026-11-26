# Shopping canvas: the MVP

Built 2026-11-24 from [MVP_SCOPE.md](../MVP_SCOPE.md), starting from [tech-test/](../tech-test/), which is left as it was.

One MCP server and one canvas (an MCP App) for Claude and ChatGPT. The agent puts product cards on a free canvas; the person arranges them, points by selecting, leaves requests, and pulls finalists up to compare.

## Look at it without Claude or ChatGPT

```bash
cd ~/ai-shopping/mvp && npm start
```

The server prints three local links (they include the key from `data/token.txt`):

- **Style review.** Trace on a sample canvas from the fake agent, in Light and Dark. Any style added later shows beside it.
- **Dev host.** One canvas the way a host shows it, with a fake agent: open a sample, answer the waiting requests, point at cards, read the canvas.
- **Report.** What happened on every canvas: requests left, selections, finalists, store pages read.

## Run it in Claude and ChatGPT

The same steps as the test: start a tunnel, then the server with its address.

```bash
cloudflared tunnel --protocol http2 --url http://localhost:8787
```

```bash
cd ~/ai-shopping/mvp && PUBLIC_URL=https://YOUR-TUNNEL.trycloudflare.com npm start
```

It prints the connector URL and a one-click **Add to Claude** link. For ChatGPT: chatgpt.com/plugins, **+**, **Add custom MCP server**, paste the connector URL, **No authentication**. After the tools change, click Refresh on the plugin in ChatGPT; in Claude, start a new chat. The quick-tunnel address changes on every restart, so give the server a fixed address before the five-person test.

Settings, as environment variables: `STYLE` picks the look when there is more than one (Trace is the default), and `DEV_PANEL=0` hides the Dev button for the five-person test.

## Prompt tests, before testing by hand

`npm run eval` puts a real Claude in the agent's seat and plays the person on the canvas: it opens the sample cards, selects, leaves requests, picks finalists or clicks Add specs, then sends a message and checks what changed. Scenarios and their checks are in `evals/scenarios.mjs`; add one by copying another. The agent gets the same context text the canvas sends (`view/context.mjs`) and sees only the tools a host shows it, plus web search.

```bash
npm run eval                          # every scenario except the slow web search
npm run eval -- selection add-specs   # some of them
npm run eval -- --slow                # include first-search (finds real products)
npm run eval -- --dry-run             # no model: set up each canvas and print what the agent would get
npm run eval -- --list
```

It needs one of two ways to reach Claude. **API key** (`ANTHROPIC_API_KEY` set; used when present): the Anthropic SDK, exact control over what the agent sees, billed to your API account. **Claude CLI** (`--agent cli`): your Claude login, after `claude` then `/login` once in a terminal; it runs inside Claude Code's harness, so it's a little further from Claude in the browser. The model is Claude Opus 5.5 unless you pass `--model`. Neither tests ChatGPT.

It runs its own canvas server on port 8799 with data in `evals/data/`, so your canvases are untouched. Each run writes a report to `evals/results/`: per scenario the checks, the agent's reply, its tool calls and the context it got. "Must" checks decide pass or fail; soft checks (marked ~) judge wording and only flag things to read.

## The style

**Trace** was chosen on 2026-11-25, after a side-by-side review with two others (Paper and Plate, since removed). It is grounded in three references from the mood board: RAG Pipeline, AI Spreadsheet Fill and Dropdown Component. Frosted cards on a dot grid, labels in mono, numbered sources, requests as skeleton bars that bloom into answers, and finalists that keep a number and a colour on the number lines.

The look is still separate from the structure, so another style stays cheap to try:

- `view/styles/base.css` holds layout and behaviour, written against design tokens (colour, type, radius, spacing, motion).
- `view/styles/trace.css` sets the tokens for light and dark, and styles cards, the finalists area and pointing.
- `view/styles/variants.mjs` lists the styles. To try another, add one CSS file and one line there; it then shows beside Trace on the style review page and in the Dev panel.

All type is system fonts. The canvas runs in a sandboxed frame, so a web font would have to be served from this server; none is yet.

## What changed from the test

- **Free canvas** instead of the grid: pan (drag, or scroll), zoom (pinch or ⌘-scroll), select (each click adds a card or takes it out; shift-drag selects a group; empty canvas or Esc clears), drag, Delete with Undo. New cards arrive in empty space below what is there.
- **Finalists** at the top, up to 4: select and choose Compare, or drag cards up; drag one out, or use ↓, to put it back. They sit side by side over a **compare table**: one row per detail, one cell per finalist, and what they all share folded into one line. Tags ("Cheapest", "Lightest") sit on the photos. The arithmetic is in `view/differences.mjs`.
- **Add specs** asks the agent for 4–6 specs that would decide between the finalists. The click is the invitation: those specs live in the compare table only (`detailScope: "finalists"`), never on canvas cards, and each row has an × to drop it. A card that joins the finalists later asks for the same specs. **Expand** gives the comparison the whole canvas; Done or Esc gives it back.
- **Requests**, never "blanks", in the canvas and in everything the agent is told. They wait for the next chat message; **Send now** sends them all.
- **Details belong to the person.** The agent starts them from the person's words with the first cards. After that the server refuses a detail the person didn't ask for and tells the agent to say it in the chat. Only details the person asked for wait on new cards.
- **Cards are all the same height**, read in this order: photo and price, then the name, then the details, with labels quietest. The name is one line and opens in full on hover; the price is the largest text on the card. Every card shows every detail ("—" where it has none), so rows line up. What only some cards have (Cheapest, Page not found, a matched photo's credit) sits on the photo.
- **Pointing** has its own look, a reason on each card, a marker for a card out of view that the person follows, and stays until the agent points again or the person dismisses it.
- **The `ui://` address** is named after the built file, so ChatGPT never shows a stale canvas.
- **The canvas opens beside the chat in both hosts**, so the person keeps chatting with it in view. Claude reads `_meta.ui.preferredDisplayMode`; ChatGPT reads its own `_meta["openai/ui"]` and opens inline without it. If a host still shows the canvas in the chat, the canvas asks once, 2.5 s in; "Back to chat" is never overridden. Try it with `?mode=inline` on the dev host.

## Judgement calls to review

- **A card that grows pushes the cards right below it down**, only as far as needed. Details make cards taller, and overlapping cards looked worse than this small move.
- **ChatGPT's "beside the chat" is full screen**: its message box sits over the canvas, and replies show as a short line above it that opens the chat. ChatGPT's real side panel (a "thread" entry point) is opened by the person, and OpenAI lists it for its Work browser only, so it isn't used.
- **Scrolling inside ChatGPT's chat** belongs to the chat, so in the chat you pan by dragging. Beside the chat, scrolling pans.
- **A detail can't be removed or renamed yet** (a compare spec can), and finalists can't be reordered. Removing a spec has no undo; Add specs gets it back.
- **The agent picks the specs.** One click, no list to choose from first. The invitation stays open 5 minutes after the first answer, so the agent can fill in more than one call, and allows up to 6 new specs per request.
- **The agent adds a detail when the person asks for it in the chat** ("add the weight to the cards"): it passes their words as `asked_in_chat`, and the detail is theirs, like one from + Detail. Without that ask the server still refuses a new detail. The server can't see the chat, so this trusts the agent; each one is logged with the words for the report.

## Not done

- Not run in Claude or ChatGPT yet. Everything here was checked in the dev host.
- The phone, as scoped.

## Files

`server.mjs` is the MCP server and tools. `view/` is the canvas. `pages.mjs` reads store pages and `catalog.mjs` matches photos in Shopify's catalog, both unchanged from the test. `store.mjs` keeps canvases in `data/`. `dev/` is the dev host, the style review and the fake agent. `npm test` checks the finalists' differences.
