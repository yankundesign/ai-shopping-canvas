# Technical test: run it and record the answers

Built 2026-11-24 for the four questions in [MVP_SCOPE.md](../MVP_SCOPE.md). This is a test rig, not the MVP: the cards sit in a plain grid rather than a free canvas, and the styling is a placeholder.

## What's built

- **An MCP server with one MCP App.** The agent has five tools: `open_canvas`, `add_cards`, `fill_details`, `point_at_cards` and `read_canvas`.
- **The canvas** lets you select cards (click, shift-click), delete them (Delete key, with undo), and leave two kinds of blank: **+ Detail** and **+ Empty card**.
- **Blanks wait for your next chat message** (the default since 2026-11-24). The bar shows how many are waiting, and **Send now** sends them all in one message. The **Test** panel can switch back to sending a message for every blank.
- **Every selection change is sent to the agent twice:** into its context, and to the server for `read_canvas`. The Test panel can turn the context channel off.
- **The store-page reader** pulls the photo and price from each product link in the background.
- **A report page** collects the numbers for all four questions as you test.

## Already answered: question 4 (store pages)

I ran the reader on 20 links for the hiking shoes ask (`npm run pages`, results in `pages-results.json`).

**Only 3 of 20 links gave both a photo and a price, and 6 gave a photo.** Thirteen links were refused outright with a 403: all six REI links, plus Dick's, Backcountry (two), Columbia, Public Lands, Sportsman's Guide and MEC. DSW's page loaded but had no readable photo or price. The ones that worked are brand sites and Zappos: Salomon, Oboz (a Shopify store) and Zappos returned both; Merrell and the Navy Exchange returned a photo but no price.

The reader identifies itself honestly and doesn't try to get around blocks, so these numbers are what a well-behaved canvas gets. **The page-reading half of the card-data plan fails for the biggest outdoor retailers.** This needs a decision before the MVP; see the end of this guide.

## Run it

You need a computer with Node and a terminal. The connector has to be reachable from the internet, so it runs behind a free tunnel.

1. Install the tunnel tool, once:

   ```bash
   brew install cloudflared
   ```

2. Start the tunnel and copy the `https://….trycloudflare.com` address it prints:

   ```bash
   cloudflared tunnel --protocol http2 --url http://localhost:8787
   ```

   `--protocol http2` is needed on networks that block the tunnel's default UDP transport, as the home network did on 2026-11-24.

3. In a second terminal, start the server with that address:

   ```bash
   cd ~/ai-shopping/tech-test && PUBLIC_URL=https://YOUR-TUNNEL.trycloudflare.com npm start
   ```

   It prints the connector URL, a one-click **Add to Claude** link and the report link. The URL includes a random key from `data/token.txt`, so only people with the link can reach the server.

4. **Claude:** open the Add to Claude link, check the name and URL, and confirm.
5. **ChatGPT** (as of 2026-11-24, no developer mode needed): open chatgpt.com/plugins, click **+**, then **Add custom MCP server**. Paste the connector URL, choose **No authentication**, confirm the warning, click **Create as a plugin**, then install it. In a new chat, type **@** and pick the plugin. OpenAI's help page says full custom MCP is for Business and Enterprise, and Pro gets read/fetch only; Plus isn't mentioned. That page may be out of date, and the test will tell.

The tunnel address changes every time cloudflared restarts. When it does, update the connector URL.

To check the canvas without Claude, open the local dev host from the server's startup output. It plays a fake agent and asks you to allow each message.

## The test script

Use Claude on desktop or web, in a new chat. Start with: *"Find waterproof hiking shoes under $150 and put them on the shopping canvas."* Then:

**1. Approvals.** (Done in Claude. For ChatGPT, first set **Test → Blanks** to "send a message now", since waiting is now the default.) Select three cards, click **+ Detail**, type "Wide fit?", and press Enter. Note what Claude shows: an allow dialog, the text placed in your message box, or a caution banner. Count the taps until the blank fills. Do this three times, then once more after choosing "Always allow" if Claude offers it. Then set **Test → Blanks** to "wait for my next message", leave a blank, and type "go" in the chat.

**2. Selection.** Select two cards and type *"What's actually different about these?"* Check whether the answer is about exactly those two. Repeat five times with different selections, including one with nothing selected (it should mean the cards in view). Then set **Test → Selection** to "read_canvas only" and repeat, to see whether Claude calls `read_canvas` by itself.

**3. ChatGPT.** Run a short version of the above. Does the canvas appear? Can ChatGPT add cards? When the canvas is full screen, is the message box still visible? Does **+ Detail** reach the chat?

**4. Store pages.** Nothing to do. The report counts every page the agent's links lead to, and where each card's photo came from. In the first two Claude runs, the stores refused most links and Claude sent no photo URLs, even when asked, so most cards were blank. Since 2026-11-24, when the page gives no photo, the canvas looks the product up in Shopify's catalog by name and credits the listing ("Photo: KEEN Footwear, matched by name"). That found the right shoe for all six REI cards in the second run. Claude's own photo_url is used last.

Also note whether the canvas opens beside the chat by itself. It asks Claude to, and has an **Open beside chat** button as a fallback.

## Results

| Question | Claude | ChatGPT |
|---|---|---|
| 1. What happens when the canvas sends a blank? Taps per blank? | The text lands in your message box under a red banner: "Use caution before running this prompt. Malicious content could trick Claude…". One tap (send). "Wide fit?" was filled on 8 of 8 cards with sources, about 40 s after sending. (Run 2026-11-24, one blank, 8 cards in view.) | Run 2026-11-24, blanks on "wait", then **Send now**. It just sends: no confirmation, no banner, nothing in your message box. "Wide fits?" on 2 cards was filled 5 s after the click; "shipping fee" on 8 cards, 35 s. |
| 1. With "wait", does "go" fill it? | Yes, and it doesn't need "go". A "ship fast?" blank on 2 cards sent nothing and showed no banner. Your next chat message was a different question, and Claude filled the blank in the same reply. | Not tested (Send now was used) |
| 2. Selection right (out of 5), via context | Works, by your check. In the one logged question (2 cards selected), Claude also called read_canvas on its own, then answered about exactly those two and lit them up. | Works, by your check: with c3 and c4 selected, it answered about exactly those two, from its context alone (no tool calls). But it answered in the chat, with a table and charts, and put nothing on the canvas. |
| 2. Selection right (out of 5), read_canvas only | 1 question logged: Claude called read_canvas by itself, got the 2 selected cards (c1, c3), added the differences as details on exactly those two, and lit them up. | |
| 3. Canvas renders / agent can add cards / chat box visible | Yes / yes / yes: full screen in Claude is a side panel beside the chat | Yes / yes, 9 cards (writes are allowed on your plan) / yes, in full screen too |
| 4. Photo and price from the page (report) | 3 of 20 (pre-run). Run 2: 0 of 8 (all REI, refused). Shopify catalog photo: 8 of 8. Claude sent a photo_url for 7 of 8, all REI addresses built from the product number; not needed. | 1 of 9 pages gave a photo (Merrell), none a price. Shopify catalog photo for the other 8. |
| Opens beside the chat by itself? | Yes, about 2 s after the canvas appears | No: it opens in the chat. **Open beside chat** works (full screen granted). |

**Notes from run 2 (2026-11-24).**
- **Agents differ in where they answer.** Asked how two selected cards differ, Claude added the differences as details on those cards and lit them up. ChatGPT wrote a table and charts in the chat and left the canvas alone. The instruction to put differences on the canvas sits deep in the server instructions, and OpenAI says to keep the first 512 characters self-contained, so ChatGPT may not weigh it.
- ChatGPT connected as "openai-mcp" and declared everything the canvas uses: server tools, messages, model context and opening links. Claude opens the canvas beside the chat by itself; ChatGPT doesn't.
- The banner is the real cost of Q1, not the tap. Every blank arrives framed as a possible attack.
- In the wait test, Claude learned about the blank by calling read_canvas, because the context channel was off by then. Blanks also go into the context, so "wait" with the context channel on should work too; not tested.
- Some selection updates to Claude's context never confirmed (for example, the last change to c6 + c7 before the question). Claude still got it right by calling read_canvas. Worth watching in the remaining rounds.

## Decision waiting: where card data comes from

The pre-run says the canvas can't rely on reading store pages. Three ways forward:

- **Lean on the agent.** It sends photo and price too, and the card says "from Claude, not checked" when the page can't confirm them. This is cheap, but most cards end up unchecked, which is the trust problem the MVP set out to avoid.
- **Shopify first.** Use Shopify's keyless catalog, which the brief already names for real data, as the place the agent searches. Shopify stores served data reliably in the pre-run. It covers fewer stores, but every card is real.
- **Both, labelled.** Catalog products are checked; anything else is the agent's word, and the card says so.

My lean is **both, labelled**: the agent's freedom to search anywhere is the point of using your own agent, and the label keeps the canvas honest.

**Built for photos (2026-11-24).** The agent's link stays the card's link. For the photo, the canvas tries the store page, then a Shopify catalog listing whose name matches (all model words present; no boot for a shoe, no women's for men's), then the agent's photo_url. A catalog photo is credited to its listing. In the second Claude run, the catalog found the right shoe for all six REI cards: KEEN sells on Shopify itself, and small Shopify retailers carry Merrell and HOKA. Prices still come only from the store page or the agent; the catalog's price is from a different store.

## Files

`server.mjs` is the MCP server and tools. `view/` is the canvas. `pages.mjs` is the store-page reader. `report.mjs` builds the report. `dev/` is the local fake host. `store.mjs` keeps canvas state in `data/`.
