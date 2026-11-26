# Startups, new products and open-source projects in AI shopping / agentic commerce (as of 24 Nov 2026), with focus on "shopping canvas" surfaces

Research notes. Verification levels: "(fetched)" = I read the page; "(snippet)" = taken from a search-result summary of that URL, not independently read; "(GitHub API, 2026-11-24)" = star/fork/push data pulled live from the GitHub REST API on 24 Nov 2026. Items older than ~6 months (before ~May 2026) are flagged **[older]**.

---

## Q1. Which companies are closest to the "canvas of cards filled by an agent" idea? UX and destination-vs-infrastructure

### Takeaway
Nobody found ships an agent-agnostic canvas. The closest matches are all closed destination apps: Onton's "Canvas" (infinite canvas for furniture, user-driven drag of product cards plus AI renders), Daydream's new agent with a persistent "clothing rack" shortlist (Nov 2026), Mindtrip's chat + cards + map + collections for travel, and Pinterest's boards plus Assistant / Ask Pinterest. In every case the board is filled from that company's own catalog or agent, not from an outside agent.

### Cited Findings

**Onton (formerly Deft): the only product explicitly called an infinite canvas for shopping**
- Show HN, 14 Nov 2025 **[older]**: "Infinite canvas product search and decision making". Founder describes Canvas as an AI visual workspace for furniture shopping that consolidates Pinterest inspiration, screenshots and browser tabs; users drag products from a catalog of 3M+ items onto the canvas, upload inspiration images that auto-link to shoppable products, and generate AI room renderings. Founder says search and image generation are the hard technical problems, "not the canvas itself". Post got 8 points and no visible comments. — [Hacker News](https://news.ycombinator.com/item?id=45933456) (fetched)
- TechCrunch coverage (26 Nov 2025 **[older]**): Onton offers an infinite canvas with image generation where users add existing images alongside found products for ideation, and can upload a room photo and ask the tool to furnish it. — [TechCrunch](https://techcrunch.com/?p=3070538) (snippet)
- Destination site (onton.com), not infrastructure; no API/MCP surface for third-party agents found in any source.

**Daydream: chat agent + persistent "clothing rack" shortlist (newest, Nov 2026)**
- 17 Nov 2026: Daydream launched an "autonomous agent for fashion shopping, styling and checkout", available in the iOS app or by text message. Results are shown as individual pieces or complete outfits; shoppers save pieces to a persistent "clothing rack" to compare options before deciding; one uploaded photo is reused for virtual try-on of any item on the rack; an "agent's task list" tracks background work (sale alerts, new drops, ongoing searches, weekly digests); with shopper approval per purchase, the agent completes one-click purchases at participating retail/brand partners. Catalog: 10,000+ brands. — [PR Newswire](https://prnewswire.com/news-releases/daydream-launches-first-ever-autonomous-agent-for-fashion-shopping-styling-and-checkout-302941544.html) (fetched; company press release)
- June 2025 beta **[older]**: "Say More" refinement and automatically organized collections that save discoveries. — [Fashionista](https://fashionista.com/2025/06/daydream-ai-shopping-fashion-platform-launch) (snippet)
- Since late July 2026 Daydream's personalized AI shopping search is also embedded directly into retailer websites. — [Value Add VC, 3 Sep 2026](https://valueaddvc.com/pulse/ai-shopping-agents-startups-instinct-daydream-phia-2026) (fetched)
- Destination app plus a B2B embed; the rack is not exposed to other agents in any source found.

**Mindtrip (travel): chat + cards + map + collections, collaborative**
- Collections save places by theme/destination and can be shared; Google Maps saved places can be imported as a themed collection; trips include group chat; invited friends add ideas, comments and likes in real time; a trip is "one flexible hub" for chats, ideas, itineraries and bookings. — [mindtrip.ai](https://mindtrip.ai/) and [App Store listing](https://apps.apple.com/app/id6503107567) (snippets of company pages)
- "Start Anywhere" (July 2024 **[older]**): paste a link (Reddit, blog, TikTok, YouTube, screenshot) and the assistant builds an itinerary; places appear on a map and can be saved to favorites or a trip list. — [TechCrunch](https://techcrunch.com/2024/07/31/travel-startup-mindtrips-new-feature-lets-you-build-an-itinerary-from-a-screenshot-youtube-or-tiktok-video) (snippet)
- In-chat flight booking added May 2026 alongside hotel/activity booking; Sep 2026 added a Personal Travel Assistant that tracks fares; database of 11M+ points of interest; free to consumers. — [DataStudios](https://www.datastudios.org/post/mindtrip-ai-travel-planning-in-chat-booking-and-pricing) (snippet, third-party)

**Pinterest: the incumbent board, now with agents reading it**
- Oct 2025 **[older]**: Pinterest tested "Boards made for you" (editorial + AI curated boards) and "Styled for you" (AI collages from saved fashion Pins, US/Canada). — [Pinterest Newsroom](https://newsroom.pinterest.com/news/pinterest-boards-get-ai-powered-upgrade-for-personalized-experience/), [TechCrunch](https://techcrunch.com/2025/10/27/pinterest-experiments-with-new-ai-powered-personalized-boards/) (snippets)
- Pinterest Assistant (beta US, late 2025 **[older]**) draws on a user's saves, boards and collages to answer shopping requests. — [Pinterest Newsroom](https://newsroom.pinterest.com/news/pinterest-assistant-revolutionizing-the-way-you-shop-online/) (snippet)
- 17 Jun 2026: "Ask Pinterest", an experimental standalone chatbot-style shopping app at ask.pinterest.com, limited access, web only; uses the Taste Graph, retains context across sessions, and when signed in uses saved Pins and Boards to personalize. Article does not describe result display, saving or buying. Same day Pinterest announced a Pinterest MCP, but for advertisers managing campaigns, not for shoppers. — [TechCrunch](https://techcrunch.com/2026/06/17/pinterest-launches-an-experimental-ai-shopping-app-called-ask-pinterest/) (fetched)

**Phia: compare panel, not a board**
- Chrome extension, iOS app and web app. On a product page a "Should I Buy This?" button sends product details to Phia's API and returns new vs. secondhand price comparisons (The RealReal, Vestiaire, ThredUp, StockX, eBay, Poshmark). — [Chrome Web Store](https://chromewebstore.google.com/detail/phia/ehoknmhmadiboejdbinglmbnlghnbldc), [Digital Commerce 360, Apr 2025 [older]](https://www.digitalcommerce360.com/2025/04/28/phia-ecommerce-startup-phoebe-gates/) (snippets)

**General assistants with card UIs and light saving (platform context)**
- ChatGPT Shopping Research returns a structured buying guide with pros/cons, spec comparison and a comparison chart; Perplexity returns compact product cards with PayPal buy-through; Google AI Mode shows shoppable image grids. One source says ChatGPT added a Favorites library and virtual try-on on 1 Oct 2026 (single secondary source, not verified against OpenAI). — [Shopify blog](https://www.shopify.com/blog/perplexity-shopping), [TechRadar](https://www.techradar.com/ai-platforms-assistants/chatgpt-vs-gemini-vs-perplexity-which-ai-is-your-smartest-black-friday-shopper), [Tech Insider](https://tech-insider.org/au/?p=2461) (snippets)
- Edge (9 Nov 2026): Edge recognizes when a user is weighing similar products across open tabs and offers to compare them; it reads pages fully only after the user opts in. — [Microsoft Edge Blog](https://blogs.windows.com/msedgedev/2026/11/09/shop-faster-and-save-money-with-built-in-tools-in-microsoft-edge/) (snippet)
- Dia (The Browser Company, now owned by Atlassian): assistant compares specs across open shopping tabs and synthesizes reviews; reusable "skills" can chain across tabs. — [Dia review roundup](https://supasidebar.com/blog/dia-browser-mac-review-2026) (snippet; third-party reviews, not official docs)

### Inferences
- The "board" exists in three shapes today: (a) a true spatial canvas (Onton), (b) a persistent shortlist/rack attached to an agent (Daydream, ChatGPT Favorites if confirmed), (c) lists/collections with a map (Mindtrip, Pinterest). Only (a) is spatial, and it is filled by the human dragging, not by an agent.
- All are vertical (furniture, fashion, travel) and catalog-bound. None accepts cards from an arbitrary external agent, and none lets the human hand a shortlist back to a different agent.
- Daydream's Nov 2026 "rack + task list + approve each purchase" is the closest behavioural match to "agent collects, human shortlists, then buys or hands back"; it is one week old, so there is no reception data.
- Onton's own founder framing (canvas is not the hard part; 8 HN points) suggests a canvas alone is a weak differentiator; value sits in retrieval quality and what happens after the shortlist.

### Gaps
- No hands-on verification of any UX; all descriptions come from press releases, listings or reviews. Daydream's merchant of record and how the rack renders are not stated.
- Axios coverage of the Daydream agent (18 Nov 2026) returned HTTP 403 and was not read.
- Alta, Doji, Plush, Cherry, Claim UX not researched in detail (funding only; see Q2).
- Layla, Navan consumer UX not found. Whether ChatGPT's Favorites library exists as described is unconfirmed.

---

## Q2. Notable startups: founding, funding, investors, traction, business model

### Takeaway
Consumer AI shopping apps are small-seed businesses living on affiliate revenue (Phia's $35M Series A is the outlier and is now under a cloud); the capital is shifting to infrastructure (payments/identity, merchant enablement, product data) and, in 2026, to general-purpose personal agents such as Instinct. Disclosed AI-shopping funding fell year over year per one tracker.

### Cited Findings

**Consumer / destination apps**

| Company | What | Funding and investors | Traction | Model | Source |
|---|---|---|---|---|---|
| Daydream | Fashion search + agent; founder Julie Bornstein (ex-Stitch Fix; previously founded The Yes) | $50M seed; Forerunner, Index, GV, True Ventures | 2M+ shoppers since June 2025; 10,000+ brands (company claims) | Referral fee when a user buys at a partner; purchases on retailer site; retailer embed since Jul 2026 | [PR Newswire, 17 Nov 2026](https://prnewswire.com/news-releases/daydream-launches-first-ever-autonomous-agent-for-fashion-shopping-styling-and-checkout-302941544.html) (fetched); [Wikipedia](https://en.wikipedia.org/wiki/Daydream_(company)) (snippet) |
| Phia | Price comparison new vs. resale; co-founders Phoebe Gates, Sophia Kianni | $8M seed (Kleiner Perkins); $35M Series A Jan 2026 at $185M valuation; ~$43M total; Kleiner, Khosla, Notable | Third-party directory lists 40K extension users (unverified) | Affiliate | [Forbes, 29 Jan 2026](https://www.forbes.com/sites/nicolecasperson/2026/01/29/phias-35-million-series-a-signals-how-ai-agents-may-reshape-fintech/) (snippet); [Value Add VC](https://valueaddvc.com/pulse/ai-shopping-agents-startups-instinct-daydream-phia-2026) (fetched) |
| Onton (ex-Deft) | AI search + infinite canvas, furniture first, expanding to apparel and electronics | $7.5M led by Footwork (Nov 2025 **[older]**); ~$10M total | 2M+ monthly active users claimed | Not stated in sources found | [TechCrunch](https://techcrunch.com/?p=3070538) (snippet) |
| Doji | Personalized fashion / avatar try-on | $14M seed May 2025 **[older]**; Thrive Capital lead, Seven Seven Six | Not found | Not found | [Retail Technology Innovation Hub](https://retailtechinnovationhub.com/home/2025/5/16/personalised-fashion-shopping-startup-doji-bags-14-million-seed-round-led-by-thrive-capital) (snippet) |
| Alta | AI stylist / closet; founder Jenny Wang | $11M seed Jun 2025 **[older]**; Menlo Ventures lead | Not found | Not found | [The Fashion Law tracker](https://www.thefashionlaw.com/generative-artificial-intelligence-investment-and-ma-tracker/) (snippet) |
| Plush | AI fashion discovery and curation; founders ex-DoorDash/Airbnb | Launched Oct 2025; one secondary source says $11M seed (single source, could be conflated with Alta; unverified) | Not found | Not found | [RETAILBOSS](https://retailboss.co/plush-is-reimagining-shopping-with-ai-powered-discovery-and-curation/) (snippet) |
| Vetted | AI product research/recommendations | $14M Series A, Insight Partners, 2022 **[older]** | Not found for 2026 | Affiliate (2022) | [Crunchbase News](https://news.crunchbase.com/ai-robotics/artificial-intelligence-venture-e-commerce-products/), [TechCrunch 2022](https://techcrunch.com/2022/08/02/vetted-lands-15m-for-ai-that-helps-shoppers-find-top-products-and-deals/) (snippets) |
| Cherry | Screenshot/image to product discovery; founder Ryan Kim | Not found | ~5,000 users in 2024 **[older]** | Not found | [TechCrunch via Yahoo](https://finance.yahoo.com/news/meet-cherry-ai-shopping-assistant-131851539.html) (snippet) |
| Mindtrip | AI travel planner | $20.5M+ incl. undisclosed American Express Ventures investment (secondary source) | 11M+ POIs; free | Booking commissions implied (in-chat booking) | [travelaidaily](https://travelaidaily.com/blog/layla-ai-vs-mindtrip/), [DataStudios](https://www.datastudios.org/post/mindtrip-ai-travel-planning-in-chat-booking-and-pricing) (snippets) |
| Layla | AI trip planner, Berlin, founded 2023 | ~€5M (First Minute Capital, M13 and others) | Claimed $1B planned trip value over 30M messages (Mar 2026); $49/yr premium tier | Subscription + booking; **acquired by Expedia 31 Jul 2026** | [Skift](https://skift.com/2026/07/31/expedia-acquired-ai-trip-planner-layla-exclusive/), [GlobeNewswire](https://www.globenewswire.com/news-release/2026/03/17/3257517/0/en/Layla-Surpasses-1-Billion-in-Trips-Planned-as-Global-Investors-Back-Identity-First-Travel-Planning.html) (snippets) |
| Instinct | General-purpose personal agent (reservations, tickets, shopping); founder Noah Shinn | $250M Series B, 26 Aug 2026, $2.5B valuation, Index + Benchmark co-lead; ~4 months old at the time | User reports of bookings working; one reported ~$300 loss from a wrongly cancelled flight | Not stated | [Value Add VC, 3 Sep 2026](https://valueaddvc.com/pulse/ai-shopping-agents-startups-instinct-daydream-phia-2026) (fetched) |

**Infrastructure (usable by any agent)**

| Company | Layer | Funding and investors | Notes | Source |
|---|---|---|---|---|
| Rye | Checkout execution ("universal checkout API": product URL to completed order via browser automation) | $14M seed 2022 led by a16z crypto **[older]**; Dealroom lists $16M Oct 2022; no 2026 round found | Member of Agentic Commerce Consortium | [Yahoo/a16z round](https://malaysia.news.yahoo.com/a16z-leads-14m-funding-round-150452940.html), [Dealroom](https://dealroom.co/companies/rye/) (snippets) |
| Firmly | Merchant enablement / protocol aggregation; also "Ask Agent" on-site chat | $15M Series A, 5 Nov 2026, led by Squarepoint Capital; strategics J.P. Morgan Payments, Mastercard, Samsung Next; ~$20M total | Claims reach of 11M+ merchants and $900B+ GMV; Ask Agent conversion up to +18%, AOV up to +23% (company figures); merchant stays merchant of record | [PYMNTS](https://www.pymnts.com/news/artificial-intelligence/2026/firmly-lands-15-million-dollars-investors-back-merchant-side-agentic-commerce/) (fetched) |
| Nekuda | Agent payments | $5M seed May 2025 **[older]**; Madrona lead, Amex Ventures, Visa Ventures | | [Rye landscape](https://rye.com/blog/agentic-commerce-startups) (fetched) |
| Skyfire | Agent payments/identity | $9.5M total, Aug–Oct 2024 **[older]**; Neuberger Berman, a16z CSX, Coinbase Ventures | | [Rye landscape](https://rye.com/blog/agentic-commerce-startups) (fetched) |
| Basis Theory | Tokenized/virtual cards for agents; leads the Agentic Commerce Consortium | $33M Series B Oct 2025 **[older]**, Costanoa lead; ~$50M total | Customers named: Pinterest, Melio, MoneyGram | [Rye landscape](https://rye.com/blog/agentic-commerce-startups) (fetched) |
| Channel3 (YC S25) | Universal product graph / search API + MCP server | $6M seed led by Matrix (date not confirmed in my searches) | MCP exposes `search_products`, `get_products` over 100M+ products; free tier without API key; API key adds affiliate attribution | [PR Newswire](https://www.prnewswire.com/news-releases/channel3-secures-6m-seed-funding-to-build-the-infrastructure-behind-agentic-commerce-302637193.html), [Glama listing](https://glama.ai/mcp/servers/channel3-ai/mcp-server), [Launch HN](https://news.ycombinator.com/item?id=44962881) (snippets) |
| Henry Labs | "Operating system for agentic commerce" (checkout execution), New York | Not publicly disclosed | Consortium member | [Caplight](https://www.caplight.com/company/henrylabs) (snippet) |
| New Generation (NewGen) | Listed as Consortium member | No funding data found | | [Rye landscape](https://rye.com/blog/agentic-commerce-startups) (fetched) |
| FERMÀT | Merchant analytics/visibility | $45M Series B Jun 2025 **[older]**, VMG lead | | [Rye landscape](https://rye.com/blog/agentic-commerce-startups) (fetched) |
| ReFiBuy | Agent-ready product catalogs | $13.6M seed, NewRoad Capital lead | | [Dealroom](https://dealroom.co/news/133368-refibuy-raises-13-6m-to-make-product-catalogues-ai-agent-ready/) (snippet) |
| Circuit & Chisel (ATXP) | Agent payments | $19.2M seed | | [Yahoo Finance](https://finance.yahoo.com/news/circuit-chisel-secures-19-2-133000979.html) (snippet) |
| ShopAgentic | Commerce infra for shopping agents | €1.9M pre-seed, May Ventures + Greenfield Capital | | [The Next Web](https://thenextweb.com/news/shopagentic-1-9m-pre-seed-agentic-commerce) (snippet) |
| Spangle | AI storefront generation (ex-Amazon execs) | $15M Series A Jan 2026 | | [GeekWire](https://www.geekwire.com/2026/former-amazon-execs-raise-15m-for-agentic-commerce-startup-that-uses-ai-to-generate-custom-storefronts/) (snippet) |
| Profound | Generative-engine optimization for brands | $96M Series C, Lightspeed lead, Sep 2026 | | [Value Add VC](https://valueaddvc.com/pulse/ai-shopping-agents-startups-instinct-daydream-phia-2026) (fetched) |

**Market-level**
- Rye's landscape post (byline 12 Mar 2026, metadata 24 Jun 2026) says VC in agentic commerce is concentrated in payments/identity (Basis Theory, Nekuda, Skyfire ~ $50M combined) while checkout execution and universal product data have few dedicated startups. Rye is a participant, so this is a self-interested map. Agentic Commerce Consortium (20+ members) named members: Basis Theory, Lithic, Skyfire, Rye, Crossmint, NewGen, Henry Labs, Channel3, Catalog. — [Rye](https://rye.com/blog/agentic-commerce-startups) (fetched)
- One tracker (Sep 2026) reports disclosed AI-shopping funding fell from at least $291.2M to $181.8M year over year with deal count roughly flat, a median round of $2.91M, and Phia's $35M Series A as the only recent round above $20M. — [newmarketpitch funding analysis](https://newmarketpitch.com/blogs/news/ai-shopping-funding-analysis), [deal tracker](https://newmarketpitch.com/blogs/news/ai-shopping-list-deals) (snippets; newsletter-grade source)

### Inferences
- Consumer shopping apps monetize almost exclusively via affiliate/referral; the Phia case (Q5) shows how fragile that is when attribution is the product's only revenue.
- Infrastructure startups sell to agents and merchants (API/take-rate/SaaS) and explicitly do not own a consumer UI, which leaves the display layer to whoever hosts the agent.
- A falling disclosed-funding total with flat deal count suggests investors are funding many small bets and few scale-ups in consumer AI shopping; the large cheques in 2026 went to general agents (Instinct) and adjacent B2B (Profound).

### Gaps
- Founding dates not confirmed for most companies. Business models for Onton, Doji, Alta, Plush, Cherry not stated in sources found.
- No funding data found for Henry Labs or New Generation. "Claim" not found as a shopping-relevant startup in my searches. Deft is the same company as Onton.
- Navan consumer equivalents not researched. Mindtrip funding figure rests on a single secondary source.
- Many figures come from trackers and newsletters rather than primary announcements; verify before quoting.

---

## Q3. Has anyone built an agent-agnostic surface that plugs into ChatGPT, Claude or other agents to display shopping results? Reception?

### Takeaway
The plumbing exists and is standardized (MCP Apps / MCP-UI, OpenAI Apps SDK, Shopify's Shop MCP and Catalog, Channel3, Logimu), and there are small demos of cross-host product-grid widgets, but I found no shipped product that is a persistent, cross-agent board. What exists is either merchant-specific inline carousels, data-only MCP servers, or a browser overlay (Honey). Reception of in-chat retail apps so far is lukewarm.

### Cited Findings
- **MCP Apps** is the official MCP extension (built on MCP-UI) for delivering interactive UI from MCP servers to hosts such as Claude and ChatGPT. — [Wikipedia: Model Context Protocol](https://en.wikipedia.org/wiki/Model_Context_Protocol) (snippet). Repos: `modelcontextprotocol/ext-apps` 3,152 stars, 444 forks, pushed 2026-11-10; `MCP-UI-Org/mcp-ui` 5,276 stars, 408 forks, pushed 2026-09-16; `openai/openai-apps-sdk-examples` 2,402 stars, 537 forks, pushed 2026-04-15. — [ext-apps](https://github.com/modelcontextprotocol/ext-apps), [mcp-ui](https://github.com/MCP-UI-Org/mcp-ui), [apps-sdk-examples](https://github.com/openai/openai-apps-sdk-examples) (GitHub API, 2026-11-24)
- **Cross-host shopping widget demo**: `openmobilehub/mcp-apps-shopping-demo`, one MCP server whose product-grid widget renders inline in Claude (native, web, Desktop), ChatGPT and Goose; cards have quantity steppers; cart state is shared between widget and agent; checkout hands off to a mock merchant page with passkey / AP2-style authorization. Single UI bundle registered under a separate MIME type per host. 5 stars, 2 forks, archived (moved to a "CredentAgent" repo); README says ChatGPT widget behaviour is not fully verified against the current Apps SDK. — [GitHub](https://github.com/openmobilehub/mcp-apps-shopping-demo) (fetched + GitHub API)
- **Shop MCP (Shopify, 15 Oct 2026)**: hosted MCP service open to any MCP-compatible agent with no partnership; 17 tools (catalog search, product details, cart, checkout, order tracking) over 1B+ products; search needs no API key; Claude and ChatGPT named as clients that run Shop sign-in; signed-in shoppers can complete Shop Pay checkout after confirming total; each checkout is single-merchant (three stores = three checkouts); non-Shopify stores handled via single-use card details. The article describes no UI components. Fees/opt-out for merchants unpublished; agent orders never load the storefront so site analytics and pixels do not see them. — [The Keyword](https://www.thekeyword.co/news/shopify-shop-mcp-agent-checkout) (fetched; third-party write-up of Shopify changelog)
- Shopify Agentic Storefronts were turned on by default for eligible US merchants on 24 Mar 2026; one source says 5.6M stores became discoverable in ChatGPT, Copilot, Google AI Mode and Gemini. Catalog MCP `search_catalog` searches "hundreds of millions of products" and requires early-access application. — [Charle agency](https://www.charle.co.uk/articles/shopify-mcp-explained/) (snippet), [shopify.dev](https://www.shopify.dev/docs/agents) (snippet)
- MCP-UI lets a Shopify MCP server return a carousel with images, prices and add-to-cart buttons instead of text. — [Peliqan](https://peliqan.io/blog/shopify-mcp/) (snippet). ElevenLabs published `eleven.shopping`, an agent with a Storefront MCP-UI server and client: 22 stars, last push 2025-11-14 **[older]**. — [GitHub](https://github.com/elevenlabs/eleven.shopping) (GitHub API)
- **Data-only MCP connectors usable in Claude and ChatGPT**: Logimu (Amazon in 11 marketplaces + Walmart US; listed in Claude's connectors directory; free tier 5 searches/day per its GitHub, paid from $19/month; repo 2 stars) and Channel3 (100M+ products, offers and live prices; repo 2 stars). Neither source shows them rendering cards. — [Logimu press release](https://www.wboc.com/online_features/press_releases/logimu-shopping-mcp-brings-real-amazon-and-walmart-data-to-claude-and-chatgpt/article_2227313d-e0df-5160-880d-e3cbdcbe38b7.html), [logimu GitHub](https://github.com/ncosic/logimu-shopping-mcp), [Channel3 MCP](https://github.com/channel3-ai/mcp-server) (snippets + GitHub API)
- **Honey (PayPal), Sep 2025 [older]**: when a user asks an AI chatbot a shopping question, the Honey extension overlays links to the recommended products with real-time pricing, merchant options and offers; "AI agnostic" by design, ChatGPT first. — [TechCrunch](https://techcrunch.com/2025/09/30/paypals-honey-to-integrate-with-chatgpt-and-other-ais-for-shopping-assistance/?rand=8808), [PayPal Newsroom](https://newsroom.paypal-corp.com/2025-09-30-PayPal-Continues-to-Shape-Agentic-Commerce-with-Instant-Product-Discovery) (snippets)
- **Reception of in-chat commerce (CNBC, 20 Mar 2026)**: OpenAI ended Instant Checkout and moved to dedicated retailer apps inside ChatGPT with checkout on the retailer's own site. Walmart found conversion three times lower for items bought inside ChatGPT than for click-outs; only ~30 Shopify merchants were live by February; Etsy called volume relatively low; product data from scraping was stale. Forrester's Emily Pfeiffer: "Right now, I don't see success in retail apps in ChatGPT." Semrush survey: 22% of 1,000+ US consumers had bought inside an AI tool, half had bought after AI research. Amazon blocks dozens of agents including ChatGPT. — [CNBC](https://www.cnbc.com/2026/03/20/open-ai-agentic-shopping-etsy-shopify-walmart-amazon.html) (fetched)
- Copilot Checkout (Microsoft + PayPal) launched 8 Jan 2026 on Copilot.com. — [PayPal Newsroom](https://newsroom.paypal-corp.com/2026-01-08-PayPal-Powers-Microsofts-Launch-of-Copilot-Checkout) (snippet)
- One agency rates native ChatGPT + Shopify product cards as "Limited" versus custom MCP-UI components (vendor's own claim). — [FocusReactive](https://focusreactive.com/custom-ecommerce-chatgpt-apps-with-shopify/) (snippet)

### Inferences
- The data and checkout layers are now effectively open to any MCP agent (Shop MCP needs no key and no partnership). The presentation layer is not: each host renders its own cards or a merchant's widget, and state dies with the conversation.
- Evidence from Instant Checkout (3x lower conversion in-chat, pivot to click-out) favours a surface where the human reviews and then buys on the merchant's site, which is exactly the "browse, shortlist, then buy or hand back" pattern, rather than autonomous in-chat purchase.
- Shop MCP's "one checkout per merchant" means any multi-store shortlist needs a UI that groups items by merchant and tracks several checkouts; nobody appears to provide that outside Shopify's own Shop app.
- The archived 5-star cross-host demo shows the technical path (one widget bundle, per-host MIME types, shared cart state) works but also that host bridge APIs are still moving.

### Gaps
- No reception data (usage, reviews, conversion) found for any MCP-UI / MCP Apps shopping widget.
- Whether Claude's or ChatGPT's connector directories contain a general "shopping board" app was not checked directly; I searched the web and GitHub, not the directories themselves.
- Shop MCP details come from a third-party article about Shopify's changelog, not from shopify.dev directly.

---

## Q4. Open-source projects: what exists, popularity, activity, gaps

### Takeaway
Open source is rich at the protocol and generic generative-UI layers (thousands to tens of thousands of stars) and at the reference-agent layer (Anthropic's `commerce-agents`, 3.5k stars), but the specific thing in question, a shopping canvas/board for agent output, has essentially no open-source presence: GitHub searches for "shopping canvas" and "agent cart" return nothing relevant, and shopping MCP servers are mostly single-retailer, single-digit to low-hundreds stars.

### Cited Findings
All figures: GitHub REST API, retrieved 24 Nov 2026.

**Protocols / standards**
| Repo | Stars | Forks | Last push | Notes |
|---|---|---|---|---|
| [Universal-Commerce-Protocol/ucp](https://github.com/Universal-Commerce-Protocol/ucp) | 3,521 | 506 | 2026-11-24 | UCP spec (Google/Shopify), Apache-2.0 |
| [google-agentic-commerce/AP2](https://github.com/google-agentic-commerce/AP2) | 3,283 | 525 | 2026-06-17 | Agent Payments Protocol, Apache-2.0 |
| [agentic-commerce-protocol/agentic-commerce-protocol](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol) | 1,609 | 258 | 2026-07-18 | ACP (OpenAI/Stripe), Apache-2.0; no push in 4 months |
| [stripe/ai](https://github.com/stripe/ai) | 2,088 | 393 | 2026-11-24 | Stripe agent toolkit (renamed from agent-toolkit) |
| [paypal/agent-toolkit](https://github.com/paypal/agent-toolkit) | 199 | 126 | 2026-09-01 | |

**Reference shopping agents**
| Repo | Stars | Forks | Last push | Notes |
|---|---|---|---|---|
| [anthropics/commerce-agents](https://github.com/anthropics/commerce-agents) | 3,519 | 726 | 2026-11-24 | Created 2026-09-01, Apache-2.0. Blueprint for an embedded shopping agent and a merchant agent on Claude; four demo verticals (retail, travel, telecom, entertainment) each with a storefront web app; `checkout` only renders the cart for the host to complete; includes a Claude Code plugin to scaffold agents. It is for a business embedding an agent in its own app, not a cross-merchant consumer board. (README fetched) |
| [Shopify/claude-for-commerce-examples](https://github.com/Shopify/claude-for-commerce-examples) | 152 | 25 | 2026-11-24 | Shopify implementation over UCP; README says the grid, cart drawer and checkout button "stay in sync with the conversation"; checkout on Shopify's hosted page. (README fetched) |
| [Shopify/ucp-cli](https://github.com/Shopify/ucp-cli) | 84 | 14 | 2026-11-09 | "A shopping skill for AI agents" via UCP, MIT |
| [Shopify/shop-chat-agent](https://github.com/Shopify/shop-chat-agent) | 151 | 121 | 2026-10-13 | Archived |
| [NVIDIA-AI-Blueprints/retail-shopping-assistant](https://github.com/NVIDIA-AI-Blueprints/retail-shopping-assistant) | 110 | 47 | 2026-11-18 | LangGraph retail advisor blueprint |
| [NVIDIA-AI-Blueprints/Retail-Agentic-Commerce](https://github.com/NVIDIA-AI-Blueprints/Retail-Agentic-Commerce) | 89 | 45 | 2026-11-23 | ACP + UCP reference implementation |
| [filtalgo/Filtmall-Shopping-Skill](https://github.com/filtalgo/Filtmall-Shopping-Skill) | 412 | 39 | 2026-11-24 | Agent shopping skill tied to one marketplace |

**Shopping MCP servers / agent carts**
| Repo | Stars | Forks | Last push | Notes |
|---|---|---|---|---|
| [GeLi2001/shopify-mcp](https://github.com/GeLi2001/shopify-mcp) | 239 | 121 | 2026-04-05 | Merchant-side Shopify API, not shopper-side |
| [tomaspavlin/rohlik-mcp](https://github.com/tomaspavlin/rohlik-mcp) | 122 | 32 | 2026-03-17 | Grocery (Rohlik group) |
| [lukabudik/alza-mcp-community](https://github.com/lukabudik/alza-mcp-community) | 103 | 18 | 2026-11-23 | Alza.cz search, unofficial |
| [CupOfOwls/kroger-mcp](https://github.com/CupOfOwls/kroger-mcp) | 85 | 32 | 2026-10-23 | Kroger grocery |
| [Fewsats/amazon-mcp](https://github.com/Fewsats/amazon-mcp) | 81 | 13 | 2026-04-24 | Archived; Amazon search and buy via L402 |
| [mmdju/torob-mcp](https://github.com/mmdju/torob-mcp) | 77 | 7 | 2026-11-13 | Price comparison (Iran), read-only |
| [nguthrie/ucp-mcp-server](https://github.com/nguthrie/ucp-mcp-server) | 10 | 2 | 2026-02-14 | UCP shopping via MCP |
| [devlimelabs/amazon-shopping-mcp](https://github.com/devlimelabs/amazon-shopping-mcp) | 6 | 0 | 2025-05-18 | WIP, stale |
| [SemanticPay/agentic-commerce-demo](https://github.com/SemanticPay/agentic-commerce-demo) | 5 | 3 | 2025-11-01 | Shopify + Google ADK demo |
| [browsa-io/open-shopping-agent](https://github.com/browsa-io/open-shopping-agent) | 1 | 0 | 2026-11-24 | Created 2026-11-18, MIT. Compares Amazon, Walmart, eBay, Best Buy, Target and Shopify stores, fills carts over MCP in the user's own Chrome, approval gate before paying; has a compare view sorted by unit price |
| [TheCartAI/cartai-mcp-server](https://github.com/TheCartAI/cartai-mcp-server) | 1 | 0 | 2026-11-24 | Vendor checkout MCP |
| [Faiziimam/agentcart](https://github.com/Faiziimam/agentcart) | 0 | 0 | 2026-11-14 | Agent fills cart, human approves via UPI QR; signed spending policy |
| [Light-Anchor/shop-search-mcp](https://github.com/Light-Anchor/shop-search-mcp) | 0 | 0 | 2026-08-30 | Hosted pay-per-call search with buy path |
| [CSOAI-ORG/agent-commerce-payments-mcp](https://github.com/CSOAI-ORG/agent-commerce-payments-mcp) | 0 | 0 | 2026-11-16 | Catalog/cart/checkout over MCP |

**UI-for-agent-output building blocks (not shopping-specific)**
| Repo | Stars | Forks | Last push | Notes |
|---|---|---|---|---|
| [tldraw/tldraw](https://github.com/tldraw/tldraw) | 51,564 | 3,616 | 2026-11-24 | Infinite-canvas SDK (custom licence) |
| [tldraw/agent-template](https://github.com/tldraw/agent-template) | 40 | 7 | 2026-11-20 | Agents that read and draw on a tldraw canvas |
| [CopilotKit/CopilotKit](https://github.com/CopilotKit/CopilotKit) | 38,943 | 4,846 | 2026-11-24 | Frontend stack for agents and generative UI, MIT |
| [ag-ui-protocol/ag-ui](https://github.com/ag-ui-protocol/ag-ui) | 21,514 | 2,168 | 2026-11-24 | Agent-User Interaction protocol |
| [vercel-labs/json-render](https://github.com/vercel-labs/json-render) | 19,824 | 1,061 | 2026-11-23 | Generative UI framework, created Jan 2026 |
| [a2ui-project/a2ui](https://github.com/a2ui-project/a2ui) | 18,502 | 1,491 | 2026-11-24 | Agents stream layout data, apps render native components (moved from google/A2UI) |
| [thesysdev/openui](https://github.com/thesysdev/openui) | 15,480 | 1,035 | 2026-11-24 | "Open Standard for Generative UI" |
| [assistant-ui/assistant-ui](https://github.com/assistant-ui/assistant-ui) | 13,399 | 1,364 | 2026-11-24 | React chat UI library |
| [tambo-ai/tambo](https://github.com/tambo-ai/tambo) | 11,224 | 578 | 2026-11-22 | Generative UI SDK for React |
| [microsoft/magentic-ui](https://github.com/microsoft/magentic-ui) | 10,119 | 1,017 | 2026-11-16 | Human-in-the-loop browser agent UI |
| [MCP-UI-Org/mcp-ui](https://github.com/MCP-UI-Org/mcp-ui) | 5,276 | 408 | 2026-09-16 | UI over MCP |
| [modelcontextprotocol/ext-apps](https://github.com/modelcontextprotocol/ext-apps) | 3,152 | 444 | 2026-11-10 | MCP Apps spec + SDK |
| [langchain-ai/open-canvas](https://github.com/langchain-ai/open-canvas) | 5,478 | 878 | 2026-02-25 | Archived (document canvas, not shopping) |
| [botiverse/porthole](https://github.com/botiverse/porthole) | 36 | 0 | 2026-11-23 | Host-side HTML sandbox with adapters for MCP Apps, widgets, artifacts |

**Direct searches for the concept**
- GitHub repository search "shopping canvas" (name/description): 133–166 hits, none relevant in the top results (top results are unrelated spam/political repos). Search "agent cart": no relevant shopping-board repo; nearest is `ivorpad/mercadona-cli` (338 stars, single grocer CLI). Search "product comparison mcp apps": 3 hits, nearest is `rushildharhakim/mcp-apps-starter-kit` (0 stars; five MCP Apps for Claude Desktop including product comparison and trip planner, last push 2026-03-24). Search "wishlist mcp": 50 hits, all under 10 stars and tied to one wishlist service. — [GitHub search](https://github.com/search?q=shopping+canvas&type=repositories) (GitHub API, 2026-11-24)
- `Berbadov/kriko` (7 stars, pushed 2026-11-24): desktop app + extension for sourced product research and comparisons; not agent-agnostic. — [GitHub](https://github.com/Berbadov/kriko)

### Inferences
- Gap 1: no open-source project combines (a) an MCP tool surface an agent can push cards to, (b) a persistent board the human can rearrange/shortlist, and (c) a read-back tool so any agent can see the human's choices. The pieces exist separately (MCP Apps for rendering, tldraw or json-render/A2UI for layout, Shop MCP/Channel3 for data).
- Gap 2: existing shopping MCP servers are retailer-specific and return text/JSON; almost none ship UI resources. The one cross-host UI demo is archived at 5 stars.
- Gap 3: reference agents (Anthropic, Shopify, NVIDIA) target merchants embedding an agent in their own storefront; none targets a shopper comparing across merchants, and none covers hotels/tickets alongside products in a shared card schema.
- Popularity signal: developers star generic generative-UI frameworks heavily (15k–39k) and commerce protocols moderately (1.6k–3.5k); shopper-side tools are in the 0–240 range. Demand for the specific artifact is unproven on GitHub.

### Gaps
- npm and PyPI were not searched directly; only GitHub. MCP registries (Glama, mcpservers.org, official registry) were seen only via search snippets.
- Star counts are point-in-time; several top repos may have inflated counts and I did not check star history.
- GitHub keyword search is noisy; a relevant repo with an unusual name could have been missed.

---

## Q5. Which startups failed, pivoted or were acquired, and what does that suggest?

### Takeaway
Wishlist/collect tools and standalone consumer AI shopping apps are fragile: Carted shut down, Microsoft removed Edge Collections, Phia's affiliate model blew up in a cookie-stuffing scandal, Alle folded after six pivots, and OpenAI itself retreated from in-chat checkout. Survivors are being absorbed by platforms (Layla into Expedia, Cimulate into Salesforce, Cymbio into PayPal).

### Cited Findings
- **Carted (shut down Oct 2025 [older])**: founded Apr 2021; $13M seed led by Blackbird with Grok Ventures and Tidal Ventures; began as a universal commerce API, pivoted in 2024 to a consumer "ultimate wishlist" app (save any product, sale/restock alerts); headcount cut from 14 to 6 in 2023; closed 22 Oct 2025 citing not reaching needed scale and market conditions. The journalist (not the company) attributes pressure to agentic commerce and to TikTok/Instagram/Linktree commerce features. — [Startup Daily](https://www.startupdaily.net/topic/business/4-years-after-a-record-13m-seed-raise-blackbird-backed-ultimate-wishlist-shopping-app-carted-shuts-down/) (fetched)
- **Microsoft Edge Collections (removed 4 Jun 2026)**: Collections is no longer available from Edge version 149; Microsoft also retired the Sidebar and Copilot Mode as a separate mode in favour of Copilot in the core UI; users who did not export lost saved images and notes. — [Windows Latest](https://www.windowslatest.com/2026/06/06/microsoft-just-killed-edges-collections-and-sidebar-for-more-copilot-after-years-of-pushing-both-features/), [Digital Trends](https://www.digitaltrends.com/computing/microsoft-just-killed-one-of-the-coolest-features-of-its-edge-browser-to-favor-more-ai/), [Chrome Story](https://chromestory.com/2026/06/edge-collections-retired-what-to-do/) (snippets)
- **Phia cookie-stuffing scandal (Jul–Aug 2026)**: Bloomberg found Phia's extension set affiliate cookies on purchases it did not drive; Impact.com suspended Phia; a second report cited leaked Slack messages estimating cookie stuffing at about 51% of merchandise value Phia claimed in June and said founders knew for months; Phia disputed parts, said it is reversing payments and hiring a head of compliance. — [TechCrunch, 10 Jul 2026](https://techcrunch.com/2026/07/10/phia-accused-of-cookie-stuffing-taking-affiliate-credit-on-purchases-it-didnt-earn/), [TechCrunch, 11 Aug 2026](https://techcrunch.com/2026/08/11/phoebe-gates-and-sophia-kianni-reportedly-knew-phia-was-cookie-stuffing-for-months/), [The Fashion Law](https://www.thefashionlaw.com/new-phia-allegations-put-intent-fraud-at-the-center-of-cookie-stuffing-scrutiny/) (snippets)
- **OpenAI Instant Checkout (ended Mar 2026)**: see Q3; pivot to retailer apps and click-out checkout. — [CNBC](https://www.cnbc.com/2026/03/20/open-ai-agentic-shopping-etsy-shopify-walmart-amazon.html) (fetched)
- **Alle (India, AI fashion stylist)**: shut down after failing to find product-market fit; decision taken Oct 2025 after six failed pivots, per co-founder. — [Inc42](https://inc42.com/buzz/elevation-capital-backed-ai-startup-alle-shuts-shop/) (snippet)
- **Layla acquired by Expedia (31 Jul 2026)**, terms undisclosed; ~25 employees, ~€5M raised. — [Skift](https://skift.com/2026/07/31/expedia-acquired-ai-trip-planner-layla-exclusive/) (snippet)
- **Salesforce to acquire Cimulate** (AI product discovery), Feb 2026, for Agentforce Commerce. — [Digital Commerce 360](https://www.digitalcommerce360.com/2026/02/17/salesforce-acquisition-cimulate-agentic-commerce/) (snippet)
- **PayPal acquired Cymbio** (store sync for agentic commerce); dates conflict between sources (announced 22 Jan / closed 5 Feb 2026 vs. "May 2026"). — [Banking News AI](https://www.bankingnewsai.com/fintech/paypal), [The Fashion Law tracker](https://www.thefashionlaw.com/generative-artificial-intelligence-investment-and-ma-tracker/) (snippets)
- **Deft rebranded to Onton** (company blog dated 9 Oct 2024 **[older]**). — [Onton blog](https://onton.com/blog/introducing-onton-the-ease-of-use-and-capabilities-you-know-from-deft-now-under-a-new-name) (snippet)
- **The Yes** (Julie Bornstein's earlier AI shopping app) preceded Daydream. — [Wikipedia](https://en.wikipedia.org/wiki/The_Yes) (snippet)
- **Dia / The Browser Company** is now owned by Atlassian. — [QuickFever](https://quickfever.com/dia-browser-guide) (snippet)
- **Shopkick** rewards app shut down abruptly (not AI). — [Wikipedia](https://en.wikipedia.org/wiki/Shopkick) (snippet)
- Google's Doppl try-on app reportedly folded into Google Shopping within a year (weak source). — [SolidAITech](https://www.solidaitech.com/2026/10/ai-startups-products-failed-2026.html) (snippet)
- Honey's AI features launched "after quite a bit of bad press" over affiliate practices. — [TechCrunch](https://techcrunch.com/2025/09/30/paypals-honey-to-integrate-with-chatgpt-and-other-ais-for-shopping-assistance/?rand=8808) (snippet)

### Inferences
- A standalone wishlist/collection is not a business on its own: Carted (venture-backed) and Edge Collections (free, bundled, large distribution) both died. The feature survives only where it is attached to a larger loop (Pinterest's feed and ads, Shop's checkout, Daydream's agent).
- Affiliate-only monetization pushes consumer shopping tools toward attribution gaming (Honey, then Phia). An open-source canvas with no affiliate layer avoids that trust problem and can make neutrality a selling point, but then has no built-in revenue.
- Platforms are pulling the valuable pieces in-house (discovery to Salesforce, trip planning to Expedia, sync to PayPal, checkout to Shopify/Shop Pay). A thin independent layer is more defensible as an open standard/tool than as a venture-scale destination.
- Autonomy has been walked back twice in 2026 (Instant Checkout; Instinct's wrongly cancelled flight), supporting human-in-the-loop review surfaces.

### Gaps
- No confirmed status for Vetted, Cherry, Claim, Karma in 2026. The Fashion Law M&A tracker was not read in full.
- Reasons for Edge Collections' removal beyond "more Copilot" not found in Microsoft's own words.
- Whether Phia lost users or investors after August 2026 is not covered in results.

---

## Q6. Where is the white space for a lightweight, open-source, agent-agnostic shopping canvas?

### Takeaway
The open position is the presentation-and-decision layer between open data/checkout plumbing (Shop MCP, UCP, Channel3) and whatever agent the user already runs: a persistent, neutral board that any MCP agent can write cards to and read the human's shortlist back from, spanning products, hotels and tickets, with click-out or delegated checkout. Nobody found occupies it; the risks are that hosts (ChatGPT Favorites, Pinterest, Shop app) absorb it, and that a board alone has shown weak pull.

### Cited Findings
- Existing collect-and-compare tools (Group 2) are closed and tied to one catalog or one browser:
  - Pinterest boards feed Pinterest's own Assistant and Ask Pinterest; its MCP is advertiser-facing. — [TechCrunch](https://techcrunch.com/2026/06/17/pinterest-launches-an-experimental-ai-shopping-app-called-ask-pinterest/) (fetched)
  - Edge Collections was removed in June 2026; Edge now offers on-demand tab comparison instead of a saved board. — [Windows Latest](https://www.windowslatest.com/2026/06/06/microsoft-just-killed-edges-collections-and-sidebar-for-more-copilot-after-years-of-pushing-both-features/), [Edge Blog](https://blogs.windows.com/msedgedev/2026/11/09/shop-faster-and-save-money-with-built-in-tools-in-microsoft-edge/) (snippets)
  - Carrot: Chrome extension that saves carted items, auto-categorizes them into folders and lets users compare prices and looks inside Carrot; raised $5.5M; affiliate model; still listed (v2.0.7, ~4.8 rating from 557 reviews). — [Chrome Web Store](https://chrome.google.com/webstore/detail/carrot-shopping-save-comp/jkihnaflmidekdffapcafldfcplbbjaj), [Glossy](https://www.glossy.co/fashion/how-carrot-aims-to-create-a-solve-for-abandoned-carts/) (snippets; funding article date not shown **[likely older]**)
  - Honey overlays product links and prices on chatbot answers (AI-agnostic, extension-based). — [PayPal Newsroom](https://newsroom.paypal-corp.com/2025-09-30-PayPal-Continues-to-Shape-Agentic-Commerce-with-Instant-Product-Discovery) (snippet)
  - Shop app receives Shopify Catalog syndication alongside ChatGPT and Copilot. — [Shopify blog](https://www.shopify.com/blog/what-is-shopify-catalog) (snippet)
- Data and checkout are open to any agent without partnership (Shop MCP, 1B+ products, no API key for search). — [The Keyword](https://www.thekeyword.co/news/shopify-shop-mcp-agent-checkout) (fetched)
- A rendering standard exists across hosts (MCP Apps; cross-host widget demo proves one bundle can serve Claude and ChatGPT). — [ext-apps](https://github.com/modelcontextprotocol/ext-apps), [mcp-apps-shopping-demo](https://github.com/openmobilehub/mcp-apps-shopping-demo) (GitHub API / fetched)
- Rye's map identifies fragmentation (agents stitching many APIs) and the long tail of merchants not covered by protocols as open problems; it lists no UI/decision-surface category at all. — [Rye](https://rye.com/blog/agentic-commerce-startups) (fetched)
- In-chat purchase converts worse than click-out (Walmart, 3x lower), and half of surveyed consumers buy after AI research rather than inside the AI tool. — [CNBC](https://www.cnbc.com/2026/03/20/open-ai-agentic-shopping-etsy-shopify-walmart-amazon.html) (fetched)
- No open-source "shopping canvas" or cross-agent board repo found (Q4). — [GitHub search](https://github.com/search?q=shopping+canvas&type=repositories) (GitHub API, 2026-11-24)

### Inferences
White space, in order of confidence:
1. **Agent-agnostic write/read board over MCP.** Tools such as add_card / update_card / get_shortlist, with an MCP Apps view for hosts that render UI and a plain web URL fallback for hosts that do not. No incumbent or repo does this.
2. **Cross-category card schema.** Products, hotels and tickets in one board. Fashion (Daydream), furniture (Onton) and travel (Mindtrip) are siloed; UCP/ACP cover products and checkout but not a human-facing comparison card.
3. **Persistence outside the chat.** Every in-chat carousel dies with the conversation; Edge Collections' removal and Carted's shutdown leave users without a neutral place to keep a shortlist across agents and sessions.
4. **Hand-back loop.** The human's shortlist, rejections and notes become structured input to the next agent turn (any agent). Daydream's rack does this only inside Daydream.
5. **Neutrality as a feature.** No affiliate rewriting, local-first or self-hosted, open licence; a direct answer to the Honey/Phia trust problem.
6. **Multi-merchant checkout orchestration view.** Group shortlisted items by merchant and track N separate checkouts (a stated Shop MCP constraint), with click-out as the default.

Risks and counter-signals:
- A canvas by itself drew little interest (Onton Show HN: 8 points; founder calls the canvas the easy part). The board must earn its place through the agent loop, not as a standalone destination.
- Hosts can ship "good enough" natively (ChatGPT Favorites if confirmed, Pinterest boards, Shop app lists), and they control widget rendering and bridge APIs, which are still changing.
- Standalone collection tools have not sustained businesses; as open source this matters less, but adoption still depends on agents choosing to call the tools.
- Retailer blocking (Amazon blocks dozens of agents) limits card freshness for the largest catalog unless the user's own browser supplies the data.

### Gaps
- No user research or demand data found for a cross-agent shopping board specifically; the white-space claim rests on absence of evidence in web and GitHub searches on 24 Nov 2026.
- Group 2 tools not covered by any source found: Karma, Shop app lists/collections behaviour, Google Shopping lists, Notion/Milanote used for shopping, dedicated wishlist apps. Arc was not researched separately from Dia.
- VC market maps from a16z, Sequoia, Lightspeed and Bessemer were not located; the only map read was Rye's (a participant).
- Product Hunt and the YC directory were not searched directly; recent YC batches may contain closer competitors.
