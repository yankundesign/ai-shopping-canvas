# Journey: waterproof hiking shoes, with Point and Leave a request

Status: brainstorm, 2026-11-24. Nothing decided. Interactions only, no UI.

**Point:** select cards, and the selection tells the agent what "these" means.
**Leave a request:** anything empty (a column, a card) is a request the agent fills.

`[Name]` stands for the product name, still open.

## Before: from a post to the first canvas

1. **The post** (X, LinkedIn, Product Hunt) shows rather than tells: a 15-second clip of someone selecting three cards, asking "what's different?", and watching columns appear. It sells Point and Leave a request, not a feature list.
2. **The page** is one screen with one job: get you into your chat app. A looping clip, "Add to Claude", "Add to ChatGPT", and "No account. Free. Open source." It is not a canvas.
3. **Add to Claude** is one click. Claude supports a prefilled install link: it opens the add-connector dialog with the name and address filled in, and you confirm. You sign in first if you're signed out.
4. **Add to ChatGPT** is copy and paste. No one-click link was found. Plus and Pro accounts can add a custom server; the menu path has changed recently, so the page shows the current three steps with pictures. Whether those accounts allow tools that write (which the canvas needs) is unclear and must be tested first; it could block ChatGPT until the app is in OpenAI's directory.
5. **The first sentence.** After adding, a "Try it" button opens a new chat with the first prompt already typed, if the chat app supports a prefilled prompt link: *"Put waterproof hiking shoes under $150 on [Name]."* The name is the word people say to the agent, so it has to work in "put these on ___".
6. **The first tool use.** Claude asks permission the first time a connector runs. The page says so ahead of time and suggests "Always allow", so the first moment isn't a surprise dialog.

**Most people will see the post on a phone**, and setup may only work well on a computer (to test). If so, the phone page's job is to get the link to the laptop, not to fight through setup on a small screen.

## Where the canvas opens

Inside the agent, with a browser tab as a second window onto the same canvas.

- **In the chat:** the agent's reply carries a compact preview of the canvas.
- **Claude on web and desktop:** the canvas opens beside the chat. This is the layout Point needs: select on one side, speak on the other.
- **ChatGPT:** the canvas opens full screen, with the chat box still available (to verify on desktop and phone).
- **Phones:** full screen.
- **Own browser tab:** "Open in browser", for more room, keeping the canvas after the chat, sharing it, or agents that can't show apps. In a tab you can't speak next to what you point at, so the tab is the delegated tempo.

One canvas, two windows. The person never chooses up front.

## The walk-through

Setup: Claude on a laptop, with the canvas open beside the chat (the live tempo). The delegated version is at the end.

**1. Ask.** In chat: *"I need waterproof hiking shoes under $150. Put options on [Name]."* Claude finds twelve and puts them on the canvas. Each card has a photo, name, price and store, plus two properties you never added: Waterproof and Price. They came from your sentence.
> Idea: **your words become the first columns.** It shows, without explaining, that cards have properties and that properties come from what you ask.

**2. Clear the obvious.** You trash three you would never wear. No agent involved; it is tidying. Claude will later read the trash as "not these".

**3. Point.** Three look almost the same: a Merrell, a Salomon, a Keen. You select them and type in chat: *"What's actually different about these?"* You don't name them. Claude reads what is selected on the canvas.
> Idea: **point on the canvas, speak in the chat.** The canvas is the pointer; the chat is the voice. The canvas stays free of intelligence.

**4. The answer comes back as structure.** Instead of three paragraphs, Claude adds properties where the three differ (weight, width options, membrane) and says in one line what it did. You flip the three to a table to see them side by side.
> Idea: **the agent teaches requests by filling one.** You have now seen a column appear from a question, which is how you learn you can make one.

**5. Leave a request.** You have wide feet, and nobody has mentioned width fit. You add a column, name it "Wide fit?", and leave it empty. Four cards are selected, so the request covers only those four. The cells show *waiting for Claude*, then fill: "2E available", "Standard only", "Wide version, $10 more", "Couldn't find". Each answer carries its source.
> Idea: **selection sets the scope of a request.**
> Idea: **"Couldn't find" is not empty.** A cell is waiting, answered with a source, or couldn't find.

**6. Ask once, sort forever.** With width and weight filled, you sort and filter by them, instantly and without the agent. You hide everything with no wide option. Five left.
> Idea: the canvas has no intelligence, but **once the agent has answered, the canvas has data.** Every request the agent answers makes the dumb canvas more capable.

**7. Point plus request.** You love two of them, but both are $145. You select them, add an empty card beside them, and write "cheaper" on it. Claude fills the slot with a $109 shoe, and fills its width and weight too, because those columns exist.
> Idea: **point says "like these", the empty card says "one more", the hint says how.**
> Idea: **new cards inherit the questions you have already asked.**

**8. Facts become columns; opinions stay in chat.** Down to two. You select both and ask: *"Which is better for muddy trails in Scotland?"* That is a judgement, not a fact, so Claude answers in chat, naming the two cards. It may add a "lug depth" column as the evidence behind its view.

**9. The agent leaves you a request.** When you shortlist your pick, Claude adds a "Your size" property to it. It cannot buy without it, and it is the one request only you can answer.
> Idea: **requests go both ways.**

**10. Buy.** Open the store page, or say in chat *"buy it in size 10"*. Claude reads the shortlisted card and the size you filled in.

## The delegated version

Canvas in a separate tab, or on a phone away from the chat. Steps 5 and 7 still work, but the requests wait, marked *waiting for Claude*, until your next message in chat, even just "go". Like leaving a comment for a colleague.

A note on words: "column" here means a detail every card shares, such as weight or wide fit. On a card it is a line; with cards side by side it reads as a column. "Detail" may be the better word.

## Starting points (2026-11-24)

- **You speak in the chat box beside the canvas.** Comments on the canvas are a second way in; see "How the canvas and the chat talk" in [CANVAS_INTERACTIONS.md](CANVAS_INTERACTIONS.md).
- **Claude sees what you see:** your selection, or with nothing selected, the cards in view. There is no separate "add to chat" step. The same rule sets the context for what you say and the scope of a request.
- **A request is a message from the canvas** (first phase; since the test, requests wait for your next chat message instead). Making one sends it into the chat, the agent starts working, answers the request and updates the canvas. It works the same as a comment addressed to Claude. In a browser tab, where the canvas can't reach the chat, requests wait for your next chat message.

## Open questions, with a lean

| Question | Lean |
|---|---|
| Claude asks the person to approve messages an app sends. How often, and does it break the flow? | Test it in the first prototype. If it hurts, bundle requests or let them ride along with the next chat message. |
| If the selection is old, what does "these" mean? | Mostly dissolved by the canvas–chat model: the selection is always visible, the agent names what it used, and comments are pinned to their cards. |
| Who decides that a detail like weight is a number, so it sorts? | Parked. A build detail. |
| How does a person first discover they can leave a request? | Step 4: the agent does it first. **To test.** |
