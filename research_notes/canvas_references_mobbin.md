# Canvas references from Mobbin

Status: research, 2026-11-24. Interaction patterns only, not visual design. Grouped by the canvas vocabulary in [CANVAS_INTERACTIONS.md](../CANVAS_INTERACTIONS.md). Links open on Mobbin.

## Point: the selection is the context

- **Miro Sidekick.** A line above the chat input says what the AI will use: "1 object selected · 12 used as context". With nothing selected it says "Select objects on the canvas to add context", which teaches pointing without a tutorial. [Screen](https://mobbin.com/screens/a4e8d7ba-50dd-48f6-b19e-926dbbda2766) · [Flow](https://mobbin.com/flows/9cedf1f0-8771-425a-88c6-30d4717b9fe9)
- **Replit design canvas.** A "1 canvas element" chip attached to the prompt. [Screen](https://mobbin.com/screens/c8816a79-99e0-4ac4-830e-6a39bc2a52e7)
- **Figma Make.** Select something and a small "Ask for changes" input appears beside it; the selection also shows as a chip in the side chat. Two places to speak about the same thing. [Screen](https://mobbin.com/screens/564f3e07-869b-4d1c-8242-88c9d5cd48a9)
- **MagicPath.** The input hint reads "@ or select on canvas to reference": typing and pointing are equal ways to name an object. [Screen](https://mobbin.com/screens/6587376c-0460-458c-8096-75258e1ce905)

## Leave a blank: empty structure is a request

- **Apollo.** "Add AI research column": you describe a column, and it fills for every row. Naming the column is the whole prompt. [Screen](https://mobbin.com/screens/66bb16a2-3757-4cb9-b842-81d9914cc26c)
- **Clay.** Each enrichment column shows its state ("Up to date"), with an Auto-run toggle. Closest to the MVP's waiting / answered / couldn't find. [Screen](https://mobbin.com/screens/a30b7aac-cf7a-4169-9ee6-10386d90f4a4)
- **Notion AI Autofill.** Pick a property and the AI fills it for every row. [Screen](https://mobbin.com/screens/8440d5d2-b026-429f-b638-69d4fe28dbc6)
- **Higgsfield, FLORA.** An empty block on the canvas ("Describe what you want to create…") is a request waiting to run. [Higgsfield](https://mobbin.com/screens/038caa8d-966b-4d76-a15e-1b62d601e651) · [FLORA](https://mobbin.com/screens/de158d07-15db-40bc-ab34-4eadb60f9faa)
- **Whering (iOS).** Reviewing a clothing item, an unknown field just says "Add". A blank on a phone, one item at a time. [Screen](https://mobbin.com/screens/858b1c81-02af-4c36-bdf7-85bee83d843f)

## Mark: every move is feedback

- **ChatGPT shopping research.** While "gathering requirements" it shows one product at a time with "Not interested", "More like this" and "Skip", then generates a comparison table of its own picks. This is the host's version of Mark, but one card at a time, in the thread, and gone afterwards. [Screen](https://mobbin.com/screens/740b0b9f-805d-46c6-86c1-de07d8b5907b) · [Flow](https://mobbin.com/flows/5b820b5f-e55d-4974-bdce-bd8a71eaf26e)
- **mymind Serendipity (iOS).** One card, Forget or Keep. [Screen](https://mobbin.com/screens/22fa4170-49a0-45b8-bde3-474c27e4492e)

## Comment and send

- **Base44.** A note dropped on the canvas has a status ("In progress") and its own "Send to chat" button. The note stays where it was written; sending is one explicit act. Nearly our "comment, address it to Claude". [Screen](https://mobbin.com/screens/3e6bd559-14f8-4af8-9a61-1e38088d660e) · [Flow](https://mobbin.com/flows/af5b91f2-3668-477c-9c0e-fcc92e5824f1)
- **Jitter, Magnific.** Comments pinned to an object, with an @ picker of people. If the agent sits in that list, @ becomes send. [Jitter](https://mobbin.com/screens/5a02e6ef-d245-4d90-a877-cdc2dae5f422) · [Magnific](https://mobbin.com/screens/e1401d07-bd5e-4023-ba66-3c0b4c037429)

## Agent presence

- **MagicPath.** Several agents with named cursors, each sitting in the frame it is working on, while the chat lists each one's current step ("Astra – Finding the vibe"). The strongest example of an agent visibly working in space. [Screen](https://mobbin.com/screens/6587376c-0460-458c-8096-75258e1ce905)
- **Muse (iOS).** The agent's avatar at the top with a live status, "Creating widget". Presence without a cursor, which suits a phone. [Screen](https://mobbin.com/screens/304e3d27-ecba-4cbd-9010-ddcafa983d2c)
- **Cofounder.** "2 agent updates · Review" in a corner: work that happened while you were away, queued for you. Fits the delegated tempo. [Screen](https://mobbin.com/screens/1ba8ff6a-cd30-453b-8aae-17459263f7f2)
- **Freeform (iOS), Zoom whiteboard.** "Follow Along" and "Jump to Location" for collaborators; "1 person is following you · Stop". Ready-made for "follow the agent". [Freeform](https://mobbin.com/screens/ea8a956d-09d7-45ed-a882-7d006fe4330d) · [Zoom](https://mobbin.com/screens/13816781-2b2c-48d1-80ce-9b5b8c7c2f92)
- **Framer, Stitch.** A small "finished" toast; a collapsed agent log. [Framer](https://mobbin.com/screens/858d3450-8982-4162-b6b9-2e1bbf010142) · [Stitch](https://mobbin.com/screens/d916972e-ffd9-4763-96a3-bc84cf7868bd)

## The agent points back

- **Miro.** The chat reply carries a card for what it made, "Payment Flow · View on canvas". [Screen](https://mobbin.com/screens/a4e8d7ba-50dd-48f6-b19e-926dbbda2766)
- **Variant, Unify.** Canvas objects appear as chips inside sentences ("Transferring style from [A] to [B]"). [Variant](https://mobbin.com/screens/8148c188-8938-4bfe-9407-6ad7e45e694b) · [Unify](https://mobbin.com/screens/a5be18e2-bd05-43bb-8cbd-d4944aaebc65)

## Groups, a final slot, and handing back

- **Shop (Shopify).** Results arrive in named groups, each with a one-line reason ("Chocolatey cups that still taste like coffee"). Agent-made groups that explain themselves. [Screen](https://mobbin.com/screens/9483f338-4957-4f7d-b5f5-fb7e59f5cc86)
- **Magnific.** Lists of generated options, plus a "Final result" frame that asks you to add your favourite from the options. The decision is a place on the board. [Screen](https://mobbin.com/screens/1ad1c0df-c3d6-4e6f-93a2-226ad9411ca3)
- **Programa.** An interior designer's pinboard with sections ("Move to Section") that leads to purchase orders grouped by supplier. The one reference that goes from a board of products to buying them. [Pinboard](https://mobbin.com/screens/d4f5b85b-f29f-4e2b-91ac-66f547e1b48e) · [Flow](https://mobbin.com/flows/6b4278aa-5d88-425b-afe4-e9e4f250acba)

## What to leave

Most AI canvases on Mobbin (Weavy, fal, Runway, Luma, FLORA) are node graphs: inputs wired into models. The wiring is too heavy for shopping. Take only the idea that an empty block is a request.

## What I'd take

1. **A context line on our side.** Miro puts it in its own chat; we don't own Claude's chat box, so the canvas states it: "Claude sees 3 selected" or "Claude sees 9 in view". It also fixes Miro's confusing "1 selected · 12 used": say exactly what goes.
2. **Notes that keep their status after sending** (Base44): Sent, then Answered, with the reply on the note. This makes "answer where you asked" visible.
3. **A "Final" place as the hand-back** (Magnific). Putting a card there is the decision, and the place's contents are the structured selection. A candidate answer to brief decision 6.
4. **Phone as a review deck** (mymind, Whering, ChatGPT): one card at a time, Keep or Forget, blanks visible. Not a shrunken canvas.
5. **One presence per tempo.** Live: a named cursor where the agent is working (MagicPath). Delegated: "3 updates, review" (Cofounder). Not both at once.
