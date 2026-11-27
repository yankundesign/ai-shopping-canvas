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

It prints the connector URL and a one-click **Add to Claude** link. For ChatGPT: chatgpt.com/plugins, **+**, **Add custom MCP server**, paste the connector URL, **No authentication**. After the tools change, click Refresh on the plugin in ChatGPT; in Claude, start a new chat. The quick-tunnel address changes on every restart; for a fixed address, see Host it on Render below.

Settings, as environment variables: `STYLE` picks the look when there is more than one (Trace is the default), and `DEV_PANEL=0` hides the Dev button for the five-person test.

## Host it on Render

For a link that lasts, such as the five-person test. Not deployed yet: the server was only started the way Render starts it, on this Mac.

[render.yaml](../render.yaml) at the top of the repo describes the setup: one always-on service on the smallest paid plan, built from `mvp/` on every push to `main`, with a 1 GB disk at `/var/data` for `canvases.json` and `token.txt`. The server takes its public address from Render (`RENDER_EXTERNAL_URL`), so there is no `PUBLIC_URL` to set.

1. Merge the work into `main`; Render deploys that branch.
2. On render.com: **New**, **Blueprint**, pick this repo, and apply. Render reads `render.yaml`.
3. When the deploy is live, open the service's **Logs**. The server prints the connector URL and the **Add to Claude** link, the same as it does locally.
4. Add the connector in Claude and ChatGPT with that URL.

Things to know:

- **The link is fixed.** The key in it is made on the first start and kept on the disk. Delete `/var/data/token.txt` and restart to change it.
- **A deploy takes the canvas offline for a moment**, because a service with a disk stops before its replacement starts.
- **One copy only.** Canvases live in this one process and one file, so the service can't be scaled to more instances.
- **Stores may refuse a cloud address** more often than a home one. Check that cards still get photos and prices before the test.
- The Dev button is off there (`DEV_PANEL=0`). Your local canvases in `mvp/data/` are separate from the hosted ones.

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
- **Cards fly between the canvas and the finalists** instead of jumping: on Compare, a drop on the tray, Clear, ↓ and Undo. They go one after another, left to right, on a spring that settles a little past the target, and a card turned round mid-air turns from where it is. Each finalist leaves a dashed **outline** on the canvas with its number and colour: where it came from, and what decides its place in the grid when Clear or ↓ sends it back. Hovering a finalist lights its outline. The table rows draw in as the cards land. All of it is in "flights" in `view/main.js`; reduced motion turns it off.
- **A card answers the hand.** Under the cursor it rises 2 px; nothing on the card moves by itself, the photo included. Picked up, it grows a touch, hangs from where it was taken, and swings behind the hand (the other way when taken below its middle); let go, it swings to rest and stays on top of what it was put on. The numbers are `SWING` in `view/main.js`. A finger gets no hover, and reduced motion gets no swing.
- **Tidy is a wave.** Cards slide to their places one after another in reading order, 25 ms apart (the whole wave sets off within 0.3 s however many there are), on the same spring as the flights. Undo of a Tidy goes back the same way.
- **Deleted cards go into the Undo button and come back out of it.** They shrink into it, the button swells once as the last arrives, and Undo sends them back to where they were.
- **A photo always shows the whole product.** It fits inside its plate whatever its shape (`--photo-fit`), on the canvas and in the finalists, which now use the same 4:3 plate. Until it has loaded the plate shimmers like a waiting request. A card with no photo gets a quiet tinted plate with the first letter of its name.
- **The dock grows and shrinks** to fit its buttons instead of jumping, and a button that appears fades in. Selection is the ring alone; the "selected" label is gone.
- **The finalists make room.** A card dragged over the tray gets a dashed slot where it would go and the others step aside; dropped, it flies into that slot. A finalist dragged along the row changes places with the others, and outside the tray it is still a put-back. Numbers and colours follow the order. While the row is parted the table under it fades back, since its columns no longer line up.
- **New cards are dealt in.** One after another, 60 ms apart, each growing from a small start and settling a little past its place: the agent's from the bottom middle of the canvas (where its note shows), a card the person asked for from the + Card button. A card that arrives out of sight waits there unseen, behind the "new cards" marker, and is dealt when at least half of it is showing, so an arrival is always watched. Opening a canvas deals the cards made in the last half minute (the server sends its own clock for this); an older canvas just shows. Nothing is dealt while the person is dragging.
- **The dot grid answers a landing.** Where a card comes down, a ring of the canvas's own dots lights up and spreads from behind it: in ink when the person put it there (a drop, a put-back, an Undo), in the agent's blue when the agent dealt it. Tidy doesn't ripple. An empty canvas breathes: the dots in the middle come up and settle back. Both belong to Trace (`.ripple` and the `#empty` rule in `trace.css`); a style without a grid shows neither.
- **Clear and ↓ tidy the canvas.** The finalists that go back fly down and the canvas is lined up in the same move, as if Tidy had been pressed: each one takes its place in the grid by where its outline was, the cards already there slide to close up around it. When the tray goes (Clear, or ↓ on the last finalist) the view fits the result; while finalists stay, the view and its zoom are left alone, since fitting under the tray would shrink the cards on every ↓. With the zoom kept, the grid starts at the top left of the cards already on the canvas and is no wider than the columns that fit in view, so nothing lands under the tray or off to the side. One Undo brings them back up, puts every card where it was and returns the view. A finalist dragged out by hand lands where it is dropped and nothing else moves. The outlines of finalists still in the tray don't hold a place in the grid (the same as the Tidy button), so they move to the nearest free spot. `putBack` in `view/main.js`.
- **Several cards in the hand gather into a stack over the finalists.** Carried over the tray (or the "Drop here to compare" strip), the selected products slide under the one that was taken and fan out behind it, and fade as one object; the tray opens a slot for each. Dropped, they fly from the stack into their slots. Carried back out, they spread to where they were in the hand. Over the open canvas they keep their formation, because there each card's place is what the person is arranging. `GATHER` in `view/main.js` is the switch: `"pickup"` gathers them from the moment they are taken and spreads them on the drop. The fan's numbers are `FAN`. Reduced motion gets no stack.
- **A waiting card breathes, and its answer blooms.** The dots under an empty request card come up in the agent's blue and settle back, on a 4.5 s breath, the same way the empty canvas breathes; the hint holds still in a clear middle, and the bar under it keeps the same breath instead of shimmering. In the hand the card is off the grid and shows no dots. When the agent fills it, the product comes in where the card waited with the agent's ring, which fades, and the grid sends out a blue ring. The canvas can't see whether the agent has started, so the card breathes from the moment it is left, not only once the request is sent. Trace only (`.card.request::before` in `trace.css`; `--wx`/`--wy` on each card say where it is on the grid).
- **Requests**, never "blanks", in the canvas and in everything the agent is told. They wait for the next chat message; **Send now** sends them all.
- **Details belong to the person.** The agent starts them from the person's words with the first cards. After that the server refuses a detail the person didn't ask for and tells the agent to say it in the chat. Only details the person asked for wait on new cards.
- **Cards are all the same height**, read in this order: photo and price, then the name, then the details, with labels quietest. The name is one line and opens in full on hover; the price is the largest text on the card. Every card shows every detail ("—" where it has none), so rows line up. What only some cards have (Cheapest, Page not found, a matched photo's credit) sits on the photo.
- **Pointing** has its own look, a reason on each card, a marker for a card out of view that the person follows, and stays until the agent points again or the person dismisses it. In the finalists, the row of cards makes room above itself for the reasons while the agent points, so the tray is 16 px taller for that time.
- **The `ui://` address** is named after the built file, so ChatGPT never shows a stale canvas. A host keeps the address it read when the connector was added, so an address from an earlier build still gets the canvas as it is now; without that, a rebuild left Claude showing "Unable to reach Shopping Canvas". The server logs each address a host asks for.
- **The canvas opens beside the chat in both hosts**, so the person keeps chatting with it in view. Claude reads `_meta.ui.preferredDisplayMode`; ChatGPT reads its own `_meta["openai/ui"]` and opens inline without it. If a host still shows the canvas in the chat, the canvas asks once, 2.5 s in; "Back to chat" is never overridden. Try it with `?mode=inline` on the dev host.

## Judgement calls to review

- **The canvas moves down to stay clear of the finalists**, and back up when they go, so no card hides behind the tray. Only when the person changed the finalists themselves, and never when they drop a card by hand. Beside a short chat panel the tray is tall, so this can push the lower rows out of view; `trayShift` in `view/main.js` is the switch.
- **A card that grows pushes the cards right below it down**, only as far as needed. Details make cards taller, and overlapping cards looked worse than this small move.
- **ChatGPT's "beside the chat" is full screen**: its message box sits over the canvas, and replies show as a short line above it that opens the chat. ChatGPT's real side panel (a "thread" entry point) is opened by the person, and OpenAI lists it for its Work browser only, so it isn't used.
- **Scrolling inside ChatGPT's chat** belongs to the chat, so in the chat you pan by dragging. Beside the chat, scrolling pans.
- **A detail can't be removed or renamed yet** (a compare spec can). Removing a spec has no undo; Add specs gets it back.
- **The agent picks the specs.** One click, no list to choose from first. The invitation stays open 5 minutes after the first answer, so the agent can fill in more than one call, and allows up to 6 new specs per request.
- **The agent adds a detail when the person asks for it in the chat** ("add the weight to the cards"): it passes their words as `asked_in_chat`, and the detail is theirs, like one from + Detail. Without that ask the server still refuses a new detail. The server can't see the chat, so this trusts the agent; each one is logged with the words for the report.

## Not done

- Not run in Claude or ChatGPT yet. Everything here was checked in the dev host.
- The phone, as scoped.

## Files

`server.mjs` is the MCP server and tools. `view/` is the canvas. `pages.mjs` reads store pages and `catalog.mjs` matches photos in Shopify's catalog, both unchanged from the test. `store.mjs` keeps canvases in `data/`. `dev/` is the dev host, the style review and the fake agent. `npm test` checks the finalists' differences.
