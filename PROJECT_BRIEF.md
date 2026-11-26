# Project brief: a shopping canvas for AI agents

Working title: **Shopping Canvas** (placeholder)
Status: v1 draft, 2026-11-24. Revised after the landscape research in [reports/AI agent shopping landscape.md](reports/AI%20agent%20shopping%20landscape.md). Nothing here is decided; the "Decisions to make" section is the agenda for brainstorming.

## One-liner

A lightweight canvas that any AI agent can fill with cards while it shops for you. You browse, compare and shortlist there, then either buy from the merchant yourself or hand your picks back to the agent to buy.

## The problem

People now ask their AI chat or personal agent to recommend products, buy tickets, and book hotels. The agent is good at the *finding* part. The *browsing and deciding* part is missing:

- Chat is a linear stream. Shopping is not. Shoppers open many tabs, compare side by side, shortlist, discard, and come back.
- In a chat, results scroll away. Each refinement produces a new set of cards further down the thread.
- Comparison is something the assistant generates, with products and criteria it picked. The user cannot select three items and compare those.
- All of this is worst on a phone, where the many-tabs workaround is least available.

## The idea

Give the agent a canvas it can write to.

1. **Collect.** While researching, the agent creates cards on the canvas: one per product, ticket, or hotel, with image, price, source, and why it fits the request.
2. **Return.** The agent hands the canvas to the user as the result of the task.
3. **Browse.** The user scans, compares, shortlists, and discards.
4. **Act.** Two exits:
   - The user buys directly (a link to the merchant's own checkout).
   - The user's selection goes back to the agent as structured data, and the agent executes the purchase.

## What the research showed

Full detail and sources are in the report. The points that shape this project:

**The gap is real, as of today.**
- Every major assistant shows product cards inline in the chat thread. Only two keep anything: Google's Universal Cart and ChatGPT's Favorites, both launched in October 2026, both wishlist-style holders and neither a comparison workspace.
- No assistant, retailer, startup or open-source project found accepts cards from an arbitrary agent, holds a shortlist outside one vendor's walls, or passes a person's picks back to an agent as structured data.
- The closest products (Daydream's "clothing rack", Onton's furniture canvas, Mindtrip's collections, Google's travel Canvas) are closed, tied to one category, and filled from one company's catalog.

**People want this division of labor.**
- Comparison is the most-wanted AI shopping task (63% in Baymard's June 2026 survey).
- Only 9% to 16% of consumers accept an agent buying unsupervised; 32% accept "the agent picks, I approve" (Accenture).
- Shoppers leave the chat to verify prices, variants and reviews on retailer sites before buying.

**It is buildable on open standards.**
- MCP Apps lets one UI render inside Claude (including the phone apps), ChatGPT, Copilot, Cursor and others. A hosted link covers agents that cannot render UI.
- The UI can send the user's selection back to the model through standard channels.
- UCP and ACP define product and cart shapes to borrow. Shopify's catalog is searchable without an API key, which gives real demo data.
- Agents now carry their own wallets (ChatGPT Wallet, Stripe Link in Meta Muse, Google Wallet in Gemini), so the canvas never needs to touch payment.

**The cautions.**
- The card grid is the easy part and every host can copy it. Google already has both halves (a side-panel canvas and a persistent cart) and only has to join them.
- Standalone "save and collect" tools have failed as businesses (Carted shut down, Microsoft removed Edge Collections).
- Affiliate revenue is thin (about $2 to $4 on a $100 basket) and breaks when an agent does the browsing. Phia's suspension shows the danger of forcing it.
- Checkout inside an independent surface is gated everywhere; retailers keep the checkout. Amazon blocks outside agents.
- Two things the research could not confirm: no study has tested chat shopping on phones (the phone argument is inference), and ChatGPT's rendering of third-party apps on mobile needs hands-on testing.

## Sharpened positioning

The research moves the centre of the idea. The scarce thing is the **return path**: a person's deliberate choice (these three, not that one, with this note) travelling as structured data to whichever agent holds the wallet. The visual canvas is how the person makes that choice.

So the project is a **neutral decision layer** between any agent and any merchant:

- any agent can write cards to it,
- the shortlist persists outside the chat,
- the human's picks, rejections and notes go back to the agent in a defined format,
- purchase happens at the merchant or through the user's own agent, never through the canvas.

## Principles

- **Super lightweight.** A small tool surface and one view. No accounts to start.
- **The human decides.** The agent prepares; the person chooses.
- **Agent-agnostic.** Works with the agent the user already has.
- **Neutral.** No paid placement and no rewriting of affiliate links.
- **Never touches payment.** No retailer credentials, no server-side checkout. This keeps it outside the legal and platform disputes, which all involve agents that log in and buy.
- **Honest cards.** Every card shows its source and when the price was retrieved.
- **Phone-first** *(to test)*. Likeliest place of unmet need, and not yet proven.

## Proposed first shape *(recommendation, not decided)*

An open-source reference implementation:

| Piece | What it does |
|---|---|
| MCP server | A few tools: create a board, add or update cards, read back the shortlist |
| Canvas view | An MCP App: compact carousel inline, full-screen for comparing up to about five items |
| Hosted board link | The same board at a URL, for agents that cannot render UI |
| Card and shortlist schema | Product cards borrowing UCP shapes; project-defined hotel and ticket cards; a shortlist format with picks, rejections and notes |
| Hand-back | One explicit action ("have the agent buy these") that sends the structured selection to the agent |
| Checkout | A link to the merchant, items grouped by merchant |

## Paths

- **Open-source portfolio project.** Clear and low-risk. It shows protocol fluency, interaction design for the least-served part of the funnel, and a security stance. Caveat: GitHub interest in shopper-side tools is low so far (under 250 stars each), so stars are not guaranteed; it should stand as a reference implementation and a design argument.
- **Product.** Harder; needs a wedge beyond the board. Three candidates: a hosted tier (sync, price and stock tracking on shortlisted items), a vertical start where people insist on choosing (hotels, tickets), or a component sold to agent builders who have no decision surface.
- **Both.** Start open source; let the wedge emerge from how people use it.

## Risks

1. **Absorption.** Hosts ship the feature natively. The window in which the decision layer is unclaimed looks short.
2. **Weak pull.** No evidence yet that people use a board when an agent fills it.
3. **Distribution.** The canvas only appears when an agent chooses to call its tools, and a custom connector gets no in-app discovery.
4. **Data quality.** Stale prices and stock are a main way AI shopping tools lose trust; Amazon data depends on what the user's own agent can supply.
5. **Monetization.** No strong independent business model found.

## Decided

- **Goal (2026-11-24): open-source portfolio project.** The first version is a reference implementation and a design argument. Monetization, accounts and a hosted paid tier are out of scope for now; the product path stays open if it gets traction.

- **First user (2026-11-24): a person shopping inside Claude or ChatGPT.** They add the connector and use the chat app they already have. Developer reuse is secondary.
- **First category (2026-11-24): products.** Real data through Shopify's keyless catalog. The card format should leave room for hotels and tickets later.
- **Purpose (2026-11-24): explore AI agent interaction patterns.** Shopping is the setting; the subject is how a person and an agent work together on a shared surface. The project is judged first on the quality of the interaction design.
- **Canvas form (2026-11-24): the desktop canvas is the centrepiece, with the phone experience alongside it.** Desktop is a free-form spatial board where the agent places cards and the person arranges, groups and compares them. The phone experience is designed as its own answer to the same board, not a reduced version and not the starting point.
- **Build the technical test (2026-11-24).** This replaces "No building yet". The one-day technical test from [MVP_SCOPE.md](MVP_SCOPE.md) is built in [tech-test/](tech-test/TEST_GUIDE.md). The MVP itself waits for the test's answers.

## Working assumptions (brainstorm, not decided)

- **No intelligence of its own.** Think Miro or Notion, but for shopping. The canvas is powered by the person's agent; we supply no model and no tokens. It can carry the person's messages to the agent, but it does not think.
- **The agent is the way in.** The agent creates a canvas from a shopping chat and gives the person the link. No standalone landing experience for now.
- **Start small.** Product cards first; add an element only when an interaction needs it. Interactions come before UI, and the visual and design guide comes later.
- **The heart of the project is how a person and an agent interact** through the canvas, not the canvas features themselves.

## Decisions to make

1. ~~Goal for the first three months~~ (decided above)
2. ~~First user~~ (decided above)
3. ~~First category~~ (decided above)
4. ~~What "canvas" means~~ (decided above)
5. **Persistence:** one-off result per task, or a board that lives on and updates?
6. **Hand-back depth:** selection only, or also notes, rejections and follow-up questions about a card?
7. **Name.**

## Interaction questions to explore

These are the design questions the canvas exists to answer:

1. **Agent presence.** How does the agent show up on the board: cards appearing as it works, a visible cursor or trail, a status of what it is searching? Can the person watch and steer mid-task?
2. **Shared authorship.** Who can move, group, add and remove cards? What happens when the agent wants to rearrange something the person placed?
3. **Space as meaning.** What do position, proximity and grouping say? Can the agent read the person's arrangement ("these three are my finalists") as intent?
4. **Talking to the canvas.** How does the person address the agent from the board: about one card, a selected group, an empty area ("find more like these")?
5. **Explaining itself.** How does a card show why the agent chose it, how confident it is, and how fresh the price is?
6. **Comparing.** How do cards become a comparison: drag together, select and compare, or an agent-built table the person can edit?
7. **Handing back.** What does "go buy these" look like, and what does the person see while the agent acts?
8. **Phone and desktop.** What is the phone's own way of doing the above without free-form space, and how does one board move between the two?

## Next steps

1. Work through the interaction questions and settle the concept. Current draft: [CANVAS_INTERACTIONS.md](CANVAS_INTERACTIONS.md), a brainstorm of ways a person and an agent can talk through the canvas. The broader first pass is kept in [archive/USER_JOURNEY_v1.md](archive/USER_JOURNEY_v1.md).
2. Design the desktop canvas and the phone experience.
3. **Prototyping.** The technical test passed in Claude and ChatGPT (results in [tech-test/TEST_GUIDE.md](tech-test/TEST_GUIDE.md)). [MVP_SCOPE.md](MVP_SCOPE.md) is ready to build, with requests, finalists and pointing as the core interactions.
