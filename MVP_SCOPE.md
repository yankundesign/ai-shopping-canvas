# MVP scope

Status: ready to build, 2026-11-24. The technical test is done; its results are in [tech-test/TEST_GUIDE.md](tech-test/TEST_GUIDE.md).

The design behind it: [CANVAS_INTERACTIONS.md](CANVAS_INTERACTIONS.md) and [JOURNEY_HIKING_SHOES.md](JOURNEY_HIKING_SHOES.md). Visual inspiration: [the mood board](research_notes/moodboard/index.html).

## The one question

With a canvas beside the chat, do people point and leave requests instead of writing prompts?

If a piece doesn't help answer that, it waits.

## Words

- **Request:** something you leave on the canvas for the agent, either a detail to fill ("Wide fit?") or an empty card with a hint ("cheaper"). Never call it a "blank", in the canvas or in what the agent is told, so the agent doesn't say it in the chat either.
- **Details:** the lines every card shares, like Waterproof or Wide fit?. They are yours: the agent never adds one uninvited.
- **Finalists:** the cards you pulled up to compare. The group is also your shortlist.

## Where it runs

- **Claude and ChatGPT**, on the web and desktop apps. One server and one canvas serve both.
- **Both** open the canvas beside the chat by default, so the person keeps chatting with it in view. "Back to chat" puts it in the chat. (Decided 2026-11-26; ChatGPT used to open it inside the chat.)
- **The phone** is not designed for the MVP.

## What the person does

- **Arrange.** A free canvas: pan, zoom, select one card or many, drag, and delete with undo. New cards arrive in empty space, and nothing moves under you.
- **Point.** Select cards, then speak in the chat. The agent sees what you see: the selection, or the cards in view when nothing is selected.
- **Leave a request**, of two kinds:
  - a detail to fill ("Wide fit?") for the selected cards, or the cards in view;
  - an empty card with a hint ("cheaper"), placed next to the cards it should resemble.

  Requests wait for your next chat message, and the agent answers them along with whatever you say. **Send now** sends every waiting request in one message, for when you have nothing else to say. Claude shows a message from the canvas under a "Use caution" banner; ChatGPT just sends it.
- **Compare your finalists.** Select cards and choose Compare, or drag them up. Drag a card out to remove it.
  - The cards lift out of the canvas into their own area (the top, on desktop) and stay there. The finalists are your shortlist.
  - Below them, differences instead of a table:
    - one quiet line for what they all share;
    - each number (price, weight) as a line with the cards placed on it;
    - a tag on each card for what sets it apart ("Cheapest", "Lightest"), worked out by the canvas from your details.
  - Selecting alone never lifts cards, because selecting is also how you point.
- **Open the store page** with an explicit link. Clicking a card only selects it.

## What the agent does

- Puts products on the canvas, each with a real link and a name, and starts the details from your words ("waterproof", "under $150").
- Answers requests, one value per card, each with its source or "Couldn't find".
- Treats your finalists as the strongest signal on the canvas: "Of your three finalists, only the Targhee is under $150."
- Answers comparison questions briefly in the chat. It never writes rows onto your cards uninvited; the ChatGPT test showed why, when one question rewrote two cards.
- Points back: cards it names light up.
- Never moves, removes or reorders your cards, and never changes your details.

## Pointing (being designed)

The basic version: the cards the agent names light up. The design covers:

- one card in view;
- a card in your finalists, compared with one on the canvas;
- a card out of view: a marker you can follow, never the agent moving your view;
- several cards for different reasons ("the Targhee is cheapest, the Moab is roomiest");
- your selection and the agent's pointing at the same time, which must look different;
- how long it lasts.

In ChatGPT the canvas may be scrolled out of sight when the agent points, so pointing works best with the canvas beside the chat.

## The card

Photo, name, price, store, link and details.

- **A detail's value** is waiting for the agent, answered (with its source), or "Couldn't find".
- **The price** shows when it was read from the store page, or that it came from the agent and isn't checked.
- **The photo** is credited when it doesn't come from the store page.

## Where card data comes from

**The link is the one thing the agent must send.** Everything else is optional.

- **The agent sends** the link, a name, and anything it knows: price, details, sources.
- **The canvas reads the store page** for the photo, price and store name. The page wins, and the card shows when the price was read.
- **When the store blocks the canvas**, which most big retailers do, the canvas looks for the same product in Shopify's catalog by name and uses that photo, credited to the listing. The match is strict, because no photo is better than the wrong shoe. The agent's own photo URL comes last, used only if it loads, and labelled as the agent's.
- **If the page can't be read**, the card shows the agent's price, marked as not checked.
- **If the link is dead**, the card says so. A product the agent invented never looks real.

## Saving

**MVP default:** a canvas is saved on the server and comes back when you return to its chat. No accounts. (Decision 5 in the brief stays open beyond the MVP.)

## Visual design and style variants

- **Inspiration** is the mood board's eight references. No style is settled yet; the build should make it cheap to try several.
- **Keep the look separate from the structure.** One set of design tokens (colour, type, radius, spacing, motion) plus the styles for cards, the finalists area and pointing. A variant changes those, never the layout or behaviour.
- **Build a few style variants for review** (three is a good start). Ground each in named references from the board, and render each with the same sample canvas from the dev host's fake agent, so no Claude or ChatGPT is needed. Make them switchable in the canvas's dev panel and viewable side by side.
- **Light and dark.** Both Claude and ChatGPT run in dark mode, as in the test screenshots.

## Later

Agent suggestions (rows, tags, a card for your finalists), the agent leaving you a request ("Your size"), comments and notes, more than one group, the table view, sorting and filtering by details, handing your finalists back to the agent to buy, the phone, sharing, the canvas in a browser tab, and a landing page. For the MVP, the landing page is a README with "Add to Claude" and the ChatGPT steps.

## The success test: five people

- **Their own shopping**, not the hiking shoes: something each person actually needs to buy. A real need shows real behavior.
- **Don't explain requests.** Show the canvas and nothing else, then watch whether they learn from the agent's first filled detail.
- **It works if** three of five point or leave a request without being told, and keep doing it.
- **It fails if** they type full prompts that name products, and treat the canvas as a picture of the chat.
- **Also watch** whether the finalists become their shortlist, and trust: do they check the store page, and does the price match?

## For the build session

**Start from [tech-test/](tech-test/).**

- **Keep:**
  - the store-page reader (`pages.mjs`) and the Shopify catalog photo match (`catalog.mjs`);
  - the image proxy and the agent profile route the catalog needs;
  - the MCP App setup in `server.mjs`: tools for the agent, tools only the canvas calls, stateless HTTP;
  - the dev host with its fake agent, and the report.
- **Replace:**
  - the card grid, which becomes the free canvas and the finalists area;
  - the test panel's toggles, which become a dev panel for style variants.

**What the test taught:**

- **Canvas behaviour:**
  - The canvas runs in a sandboxed frame with no forms. Use key and click handlers instead.
  - Images go through the server's image proxy so they pass the hosts' content rules.
- **What the agent is told:**
  - Give every tool `readOnlyHint`, `destructiveHint` and `openWorldHint`. ChatGPT requires them.
  - Make the first 512 characters of the server instructions stand on their own, since ChatGPT may weigh little beyond them. Put the core rules there.
- **How each host behaves:**
  - ChatGPT keeps the canvas HTML for up to an hour, so give the `ui://` address a new name whenever the canvas changes. After tool changes, click Refresh on the plugin in ChatGPT; in Claude, start a new chat.
  - Claude opens the canvas beside the chat because of `preferredDisplayMode: "fullscreen"`. ChatGPT ignores it and reads `_meta["openai/ui"]` instead (same `preferredDisplayMode`), which the tech test didn't set.
- **Selection and requests:**
  - The selection reaches the agent two ways: in its context (both hosts support this) and through `read_canvas`, which Claude calls on its own when unsure. Keep both.
  - Send context updates one at a time. Overlapping updates arrived out of order in the test.
  - Only details the person asked for should wait for the agent. In the test, a detail the agent gave some cards showed up on the others as a waiting request the person never made.
- **Running it:**
  - The tunnel needs `cloudflared --protocol http2` on this network.
  - The quick-tunnel address changes on every restart, and the connector URL with it. Before the five-person test, give the server a fixed address.

## Still open

- **The name.**
