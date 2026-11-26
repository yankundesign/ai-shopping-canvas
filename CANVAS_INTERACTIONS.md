# Canvas interactions: brainstorm

Status: brainstorm, 2026-11-24. Nothing here is decided. Interactions only; UI and visual design come later.

Running example: *"waterproof hiking shoes under $150"*.

## The reframe

In chat there is one way to talk to the agent (type a prompt) and one way it answers (paragraphs). A shared surface gives both sides more ways to speak. That vocabulary is the subject of this project.

The canvas has no intelligence of its own. It carries messages between the person and their agent; it does not think.

## One collection, many views (from Notion)

The cards are a collection, not objects scattered on a board. The same items can be seen as:

- **a canvas**, spatial and Miro-like, for browsing and sorting by feel;
- **a table**, for comparing;
- **columns** (considering, shortlist, no), for deciding.

So a shortlist area and a compare mode are not containers to design. They are views of the same cards. Compare is "select three, see them as a table". Nothing is copied, so nothing gets out of sync.

**Changed 2026-11-24: compare is a place, and it is the shortlist.** Pull cards up into a finalists group: they lift out of the canvas and sit together, and you drag cards in and out. It stays, because pulling three shoes aside already says "these are my finalists". One object does compare, shortlist and, later, hand-back ("buy one of these"). The cards still move rather than being copied. Below them, differences instead of a table: one line for what they share, numbers as lines with the cards placed on them, and a tag on each card for what sets it apart.

## The person talks to the agent without writing a prompt

1. **Point.** Select cards, then speak: "Which of these is most waterproof?" The selection is the context, so "these", "this one" and "cheaper than that" just work. Figma and Cursor do the same with layers and code. It removes chat's need to describe "the grey Merrell, the second one".
2. **Leave a request.** Empty structure asks for something.
   - An empty column, "Weight" or "Good for wide feet?": the agent fills it for every card. The person sets the criteria; the agent does the legwork. Notion's AI autofill does this inside a database; here it is the person's own agent researching across stores.
   - An empty card beside three you like: "find one that belongs here".
   - An empty group named "Under $100": the agent fills it.
3. **Place.** Space carries meaning. Pull cards into two piles, "trail" and "everyday", and the agent sorts new finds into the right pile. Spread cards along a line from cheap to durable, and new cards land where they fit. Miro's affinity mapping, with the agent taking part.
4. **Mark.** Every move is feedback. Trash means "not this". Shortlist means "more like this". **Pin one as the benchmark** and every other card shows itself relative to it: +$20, 80 g lighter, not wide. That last part needs no intelligence; the canvas can do the arithmetic.
5. **Comment on a thing.** @-mention the agent on a card: "@Claude, does this run small?" The answer comes back as a reply on that card. Conversations live on objects instead of scrolling away in a thread, which was the original problem with chat. See "How the canvas and the chat talk" below.

## The agent talks back

- **Presence.** A cursor you can watch working, follow, or summon to where you are. Miro's "bring everyone to me" becomes "work here".
- **Notes in place.** Instead of a paragraph in chat, a short note beside the cards it is about: "These three run narrow." Dismissable.
- **Questions as objects.** "Men's or women's sizing?" appears as a small card you answer whenever, instead of stopping the chat.

## How the canvas and the chat talk

One constraint shapes all of it: **we own the canvas, not the chat box.** Nothing can be placed in Claude's or ChatGPT's message box. So the canvas shows what the agent can see, and the agent says what it took.

**You to the agent**

1. **Point and speak.** Select cards on the canvas, type in the chat. The starting point on desktop. **Claude sees what you see:** the selection, or with nothing selected, the cards in view. No separate "add to chat" step.
2. **Comment and send.** Select a card or a few, write a comment right there, address it to Claude, and it goes into the chat as your message with the cards attached. The comment stays pinned to the cards.
3. **Leave a note.** The same comment, not addressed to Claude. It stays on the canvas; the agent can read it the next time it looks but does not act on it.

**@ is the send button.** Mention the agent and a comment becomes a message; leave it out and it stays a note. Notion and Figma comments work the same way, so there is nothing new to learn.

**A request is a message too** (first phase; since the test, requests wait for your next chat message instead). Leaving a request sends it into the chat, just like a comment addressed to Claude. The agent starts, fills it and updates the canvas. Everything that leaves the canvas is a message.

Commenting on the canvas may become the main way to speak on a phone, where the canvas fills the screen and the chat box may be out of sight.

**The agent to you**

1. **Facts you asked for land on the cards**, as filled-in details. You own the rows: the agent doesn't add rows uninvited. Later, facts it volunteers could arrive as suggestions you keep or dismiss (not in the MVP).
2. **Opinions come back in words**, where you asked: in the chat if you asked in the chat, in the comment's thread if you asked on the canvas (with one line in the chat). **Answer where you asked.**
3. **The agent points too.** When it names cards ("the Merrell and the Keen run narrow"), those cards light up on the canvas. **Both sides can point.**

**Stale selection mostly dissolves.** The selection is always visible, so nothing is attached silently. The agent names what it used: "Of the three you selected, the Keen is cheapest at $119. Across all nine, it's the Ridge at $99." A comment is pinned to its cards, so it never goes stale.

**The tension.** Claude asks the person to approve each message an app sends. For a comment you wrote and addressed, "Send" feels natural, but it is still a second tap. A prototype should show whether that breaks the flow.

## Two tempos: live and delegated

An agent only acts when its chat takes a turn. Rather than fight that, lean into it:

- **Delegated.** Requests, comments and questions work like notes left for a colleague in Notion. You set up the work; the next time the agent runs, it clears the queue.
- **Live.** When the canvas is open inside the chat app, it can wake the agent right away, and the same interactions feel immediate.

Same vocabulary, two speeds.

## Social, the Miro way

Shopping is often shared: a couch with a partner, a gift with siblings. Share the canvas, others react to cards, and the agent reads the reactions.

## What to explore first

**Point and leave a request.** Together they make a complete loop: point at what you mean, leave requests for what you want. Both are new for shopping, and they test the core question: do people prefer shaping to prompting? Walk-through: [JOURNEY_HIKING_SHOES.md](JOURNEY_HIKING_SHOES.md).

**Place** is the most ambitious and the most fun, but the hardest to make legible.

## Basics that hold whichever way this goes

- Pan, zoom, select one or many, drag.
- The agent adds and updates cards. It never moves a card on its own initiative.
- Deleting is always undoable, and deleted cards can be restored.
- New cards arrive in empty space. They never land on a card or push one, and nothing moves while you are dragging.
- Opening the store page is an explicit link, never a plain click.

The broader first draft is in [archive/USER_JOURNEY_v1.md](archive/USER_JOURNEY_v1.md).
