# User journey: from landing to purchase

Status: brainstorm draft, 2026-11-24. Builds on [PROJECT_BRIEF.md](PROJECT_BRIEF.md). Describes the experience only. Where a step depends on a technical assumption, it is marked *(assumption)*; none of it is a build plan.

Running example: *"waterproof hiking shoes under $150"*.

## The idea in one paragraph

The board is a place the person owns, at a link, usable the second the page opens. An agent joins it the way a collaborator joins an Excalidraw room: you invite it once, it shows up with a name and a cursor-like presence, and it adds its work to your board. The person stays in charge of the space. The agent fills, the person arranges and decides, and the decision travels back to the agent.

## The journey at a glance

| Stage | The person | The board | The chat |
|---|---|---|---|
| 1. Land | Opens the site | An empty board, ready | — |
| 2. Connect | Copies one thing into their chat app | Shows the agent as connected | Agent can now reach the board |
| 3. Ask | Asks for hiking shoes | Fills with cards as the agent works | Short reply with a board preview |
| 4. Triage | Keeps, drops, notes | Shortlist forms, drops go to a pile | — |
| 5. Refine | Edits the brief, asks for more like one card | New round arrives beside the old one | Agent works on the next turn |
| 6. Compare | Selects 3 cards, compares | Cards become columns of a table | Agent fills blanks |
| 7. Decide | Buys at the store, or asks the agent to buy | Decision is frozen and sent | Agent confirms and acts |
| 8. Return | Comes back later | Shows what changed | A new chat can pick the board up |

---

## 1. Land: a board, not a homepage

The URL opens straight onto an empty board. No sign-up, no marketing page in front. The board saves itself in the browser as you go, as Excalidraw does.

The empty state offers three ways in, ordered from least to most commitment:

1. **Watch a sample.** A short replay of an agent filling a board for hiking shoes. When it ends, the sample is yours to play with: drag, drop, compare. It teaches the whole model in about thirty seconds, before anything is installed.
2. **Paste.** Drop product links on the board, or paste a whole answer copied from any chat. Each link becomes a card. Zero install, works with every assistant, one-way only. *(assumption: links can be turned into cards reliably)*
3. **Connect your agent.** Makes the board live and two-way. Section 2.

Why the paste path matters beyond convenience: it is the cheapest way to test the brief's riskiest assumption, *do people use a board at all?*, before the connector exists.

## 2. Connect: invite your agent like a collaborator

**Where.** A "Connect agent" button sits top right, where Excalidraw puts "Share". It is the same gesture: inviting someone into the room. The someone is your agent.

**The dialog.**
- Pick your chat: Claude, ChatGPT, or "another agent".
- One copy button, then two or three steps specific to that app, with a picture of each. *(assumption: a connector URL pasted into the app's settings)*
- What you copy holds a private key to **your desk**, the set of boards that are yours. Not to one board. So you install once, and every later shopping task lands on your desk without repeating this.
- The dialog then **waits for the connection**: "Waiting for Claude…" turns into "Claude connected" when the first contact arrives. This closes the loop, like pairing headphones. Without it, people paste and hope.
- It ends with a test prompt to copy: *"Put waterproof hiking shoes under $150 on my Shopping Canvas."*
- An optional second copy: one sentence for the chat app's custom instructions ("When I'm shopping, use my Shopping Canvas"). The agent decides when to use its tools, and people will not remember the phrasing.

**The key is a secret.** Anyone holding it can write to your desk. The board shows where it is connected and lets you disconnect or make a new key.

**What changes on the board once connected.**
- The agent appears in the presence area, the way a collaborator's avatar does: name, colour, and a state of *idle*, *working* or *away*.
- The empty-state hints switch from "connect your agent" to example requests you can copy into the chat.
- More than one agent can connect. Ask Claude and ChatGPT for the same thing and both fill the same board; every card says who found it. This is the agent-agnostic claim made visible.

## 3. Ask: the board fills while the agent works

The person types in Claude: *"waterproof hiking shoes under $150"*.

**In the chat**, the agent answers as normal plus a compact board preview: title, count, three thumbnails, "Open board". The chat is never empty-handed, and on a phone the preview is the door into the full-screen board.

**On the board** (in a tab beside the chat, or the chat app's own side panel where it has one):

- A new board, "Waterproof hiking shoes", appears on your desk. If you are looking at another board, a toast offers to switch. It never pulls you away.
- **The brief bar** across the top holds the request as chips: `waterproof` `hiking` `under $150`. The agent writes them; you can edit them. The agent can also leave **empty chips as questions**: `size ?` `men's / women's ?`. You answer by filling a chip, instead of the chat stopping to ask.
- **The agent's status line:** "Searching 4 stores · 11 seen · 6 added · 5 left out". "5 left out" opens to show what was filtered and why ("not waterproof"). The agent shows its work, including what it rejected.
- Cards arrive one at a time into a cluster labelled **Round 1**. Each card shows the image, name, price, store, "checked 2 min ago", one line on why it fits, and **fit marks against the brief**: ✓ waterproof ✓ $129 ? wide.

**The board does not jump while you are using it.** While you are dragging, typing or have something selected, new cards gather behind a "+4 new" pill instead of popping in. A Pause control holds all incoming until you release it.

## 4. Triage: keep, drop, note

Three verbs, available on every card by click, keyboard (K, X, N) or swipe on a phone:

- **Keep** puts the card in the Shortlist.
- **Drop** sends it to a discard pile, with an optional one-tap reason: price, style, reviews, brand, fit, other.
- **Note** adds free text to the card ("too heavy?").

Dropping is not deleting. The pile folds away, cards can be restored, and the agent reads it: it will not suggest a dropped product again, and the reasons tell it what you care about. A reason chip is the cheapest refinement there is.

**Space is yours.** Arrange cards however you like. Lasso a few to make a group, optionally named ("for winter"). The agent reads **states** (kept, dropped, noted) and **named groups**. It does not try to interpret raw positions, which mean different things to different people.

## 5. Refine: two speeds

The key distinction is between what the board can do instantly and what needs the agent. The two should look different (a plain control versus one marked with the agent).

| The person wants | Where | Speed |
|---|---|---|
| Narrow what's already here: under $120, Gore-Tex only, sort by weight | Board filter and sort | Instant, no agent |
| Change the brief: size 10, wide fit | Edit a chip, or say it in chat | Agent's next turn |
| More like this card, cheaper than this, other colours | Action on the card | Agent's next turn |
| A question about a card: "true to size?" | Note addressed to the agent, or chat | Agent's next turn |
| Teach taste | Drop with a reason | Instant on the board, read on the next turn |

**The wake-up problem.** An agent only acts when the chat takes a turn.
- Inside the chat app's own view of the board, a card action can send a message and start a turn. *(assumption: Claude asks the person to approve such messages)*
- From the board in a separate tab, it cannot. No standard lets a web page nudge a chat. So asks made on the board queue visibly ("2 asks waiting for Claude"), and any message in the chat, even "go", makes the agent read the board first.
- This is the most important thing to test. The queue has to feel like a to-do list handed to the agent, not input that went nowhere.

**What a refinement does to the board.**
- New results arrive as a new cluster labelled with what changed: **Round 2 · + wide fit · 5 new**.
- Earlier cards you have not touched that fail the new brief dim, say why ("not wide"), and fold into "Earlier".
- Cards you have touched never move or vanish.
- Tidying is a button you press, not something that happens to you. The agent can suggest a tidy; you accept it.

This is the direct answer to "results scroll away" in chat: nothing is replaced, every round stays readable, and the history of the search is visible on the board.

## 6. Compare

- Select two to five cards (shift-click or lasso) and choose **Compare**. The cards become the columns of a **comparison frame**, a lasting object on the board. Drag a card in to add a column, drag it out to remove one.
- Rows start with the brief, the things you said matter (waterproof, price, width), then attributes the cards share (weight, drop, reviews). Each cell shows its source. Unknown cells show "?".
- **Add a row** ("ankle support") and the blank cells become an ask for the agent. When it fills them, each cell is marked with where the answer came from.
- Pin a row, hide a row, mark the winner of a row. Removing a column returns the card to the board; it is not dropped unless you drop it.
- The agent can suggest rows ("reviewers often mention a narrow toe box") as ghost rows you accept or dismiss. You build the comparison; the agent contributes to it.
- On a phone: swipe between columns with the row labels fixed, or a two-up "this or that" that eliminates one at a time.

## 7. Decide: buy it yourself, or hand it back

The Shortlist shows the kept items with a **variant picker** on each (size, colour), because an agent cannot buy "the Merrell" without a size.

Two exits:

- **Buy myself.** Items grouped by store, each linking to the store's own page with the variant chosen.
- **Ask Claude to buy.** Before sending, a preview shows exactly what goes back: the picks with variants, the price and time you saw, the drops with reasons, your notes, and any open questions. Then it is sent.

**Sending freezes the decision.** The agent acts on that snapshot. If the price or stock has changed, it comes back to you instead of buying something you did not see. While it works, cards show their status: *buying*, *in cart*, *ordered*, *needs you*. The board ends with a receipt row and stays on your desk.

## 8. Return

- **Your desk** lists your boards. Opening one shows "since you last looked": what the agent added, and any price or stock change it found when asked to check.
- **Continue in a new chat** by pasting the board's link. The agent reads the full state, including your drops and notes, and carries on.
- **Move to your phone** with an "Open on phone" code, which hands your desk to the phone without an account.

---

## How the board behaves

### Does the board change once an agent connects?

Yes, in three ways, all of them gentle:

1. **Presence.** The agent appears as a collaborator with a state. When the chat is closed it shows as *away*, and the board stays fully usable by hand.
2. **Hints.** The empty state switches from "connect" to "ask".
3. **Incoming work.** Agent results arrive in their own rounds, never on top of what you arranged, and never while you are mid-action.

The board never rearranges itself because an agent connected or disconnected.

### Who can change what

The board belongs to the person; agents are guests with full rights over their own untouched work. A card becomes yours the moment you touch it: keep, drop, note, move, group, or put it in a comparison.

| Agent may… | Its untouched cards | Cards you touched | Your groups, notes, comparisons |
|---|---|---|---|
| Add | Yes, in its current round | — | Suggest only |
| Update price or stock | Yes | Yes, shown as a marked change | — |
| Move or regroup | Yes | Suggest only | Suggest only |
| Remove | Yes, leaving a trace ("removed by Claude: discontinued") | Suggest only | Never |

Suggestions appear as ghost overlays with Accept and Dismiss, like suggestion mode in a document. Anything else can be pinned to protect it explicitly.

### Locking: the word means four different things here

1. **Authority.** Covered above: touching a card makes it yours. There are no hard edit locks between you and the agent; you always win.
2. **Motion.** The board never shifts under you. Incoming cards wait while you are acting; Pause holds them all.
3. **Price.** A kept card freezes the price and time you saw. If the live price changes, the card shows the difference ("was $129, now $139"). It is never updated silently.
4. **Decision.** What you send to the agent is fixed. Editing after sending makes a new version, and the agent is told.

If you are dragging a card at the moment the agent updates it, your drag finishes first and the update lands after, marked as a change.

### Storage

- **A board lives at a link.** Your browser remembers which boards are yours. No account.
- **The board is stored by the service, not only in your browser.** Unlike Excalidraw's local default, an agent writes from elsewhere, so the board's content has to live where both can reach it. The board should say this plainly. *(assumption)*
- **What is kept:** the brief, every card with its source and time checked, positions, groups, notes, keep and drop states with reasons, comparison frames, decision snapshots.
- **A history of every change, with who made it** (you, Claude, ChatGPT). It powers undo, "since you last looked", and the agent's read-back: *"Since my last turn you dropped three for price, kept two, and asked about width on the Merrell."*
- **Download and upload the board as a file**, as Excalidraw does, so it is never trapped.

---

## Open decisions

1. **Where the board sits on desktop.** Its own tab beside any chat, or the chat app's side panel (only some apps offer one). Recommendation: design for the own tab; the side panel is a bonus.
2. **Is paste part of the first version?** Recommendation: yes. It is the zero-install way in and the cheapest test of whether people use a board.
3. **Boards or frames.** One board per shopping task, or one desk canvas with a frame per task (closer to Excalidraw, and useful for "everything for the hiking trip"). Recommendation: one board per task, which can hold more than one brief.
4. **What counts as touching a card.** Does opening the store page make it yours?
5. **Persistence** (brief, decision 5). Recommendation: boards live on, one per task.
6. **Hand-back depth** (brief, decision 6). Recommendation: picks with variants, the price seen, drops with reasons, notes, and open questions.
7. **Can the agent ever act without a chat turn**, for example checking prices overnight? Recommendation: not in the first version.
8. **Retention and sharing.** How long boards are kept, and whether a shared link is view-only or lets a partner vote.
