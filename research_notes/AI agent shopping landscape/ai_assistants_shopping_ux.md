# Shopping, booking and buying UX inside general-purpose AI assistants and personal agents (state as of 24 Nov 2026)

Research date: 2026-11-24. Reading conventions used throughout:

- **[P]** = primary source opened and read (vendor blog, release notes, help page).
- **[S]** = secondary source opened and read (news article, hands-on review).
- **[U]** = seen only in a search-result summary, page NOT opened. Treat as unverified lead.
- **(OLD)** = dated before roughly late May 2026 (more than ~6 months old). May have changed since.
- Status words: **Shipped**, **Limited rollout**, **Announced**, **Retired**, **Rumor/unconfirmed**.

Big-picture changes in 2026 that a writer relying on 2025 knowledge would miss: OpenAI demoted Instant Checkout (Mar 2026), retired the Atlas browser (Jul-Aug 2026), launched "Dots" always-on agents (Sep 2026) and "ChatGPT Wallet" (Nov 2026); Google launched UCP checkout (Jan 2026), hotel booking in AI Mode (Aug 2026), Universal Cart (Oct 2026) and a free Gemini "Task" mode (Nov 2026); Meta launched the "Muse" personal agent with checkout (Sep 2026); China blocked Meta's Manus acquisition (Apr 2026) and Manus is independent again; Amazon merged Rufus into "Alexa for Shopping" (May 2026); Anthropic added lifestyle connectors (Apr 2026), product cards (Jun 2026, unannounced) and a commerce blueprint (Sep 2026) but no checkout product.

---

## 1. For each assistant: what shopping/booking features exist today, when did they launch, and in which regions/plans?

### Takeaway
By November 2026 every major assistant has some product-discovery surface, but they have split into three camps: (a) discovery-first with merchant-run checkout (ChatGPT core chat, Claude), (b) platform wallet checkout inside the assistant (Google AI Mode/Gemini with Google Pay + UCP, Copilot Checkout, Perplexity Instant Buy with PayPal), and (c) personal agents that drive a browser/VM and pay with a tokenized card after user approval (Meta Muse with Stripe Link, ChatGPT Dots with ChatGPT Wallet, Gemini Task mode with Google Wallet, Amazon Buy for Me). Almost all transactional features are US-only.

### Cited Findings

#### ChatGPT (OpenAI)
- **Instant Checkout** launched 29 Sep 2025 (US, Etsy sellers first; Shopify, Walmart later), single-item purchase inside chat via the Agentic Commerce Protocol (ACP). (OLD) **Status now: deprioritized.** On 24 Mar 2026 OpenAI said "the initial version of Instant Checkout did not offer the level of flexibility that we aspire to provide" and shifted to discovery with merchants using their own checkout. [S] — [MacRumors, 25 Mar 2026](https://www.macrumors.com/2026/03/25/chatgpt-revamps-shopping-features/); [P] [OpenAI, "Powering Product Discovery in ChatGPT", 24 Mar 2026](https://openai.com/index/powering-product-discovery-in-chatgpt/)
- **Shopping research** (launched 24 Nov 2025, (OLD) but still referenced in Nov 2026 guides): a dedicated mode that asks clarifying questions, researches for a few minutes and returns a personalized buyer's guide. Mobile and web, logged-in Free/Go/Plus/Pro. Powered by a GPT-5 mini variant trained for shopping. Also feeds ChatGPT Pulse (Pro). [P] — [OpenAI, 24 Nov 2025](https://openai.com/index/chatgpt-shopping-research/)
- **Visual shopping revamp** (24 Mar 2026, (OLD)): richer visual product results, browse in chat, refine by conversation, upload an image to find similar items, compare products side by side on price, reviews and features. Rolled out to all users (Free, Go, Plus, Pro). ACP extended to discovery; merchants ready at launch: Target, Sephora, Nordstrom, Lowe's, Best Buy, The Home Depot, Wayfair; Shopify via Shopify Catalog; Walmart via its own in-ChatGPT app (account linking, loyalty, Walmart payments; web first, iOS/Android "shortly"). [P] — [OpenAI, 24 Mar 2026](https://openai.com/index/powering-product-discovery-in-chatgpt/); [P] [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- **GPT-5.5 Instant update** (24 Jun 2026): "Shopping and local business queries should also feel more useful"; combines product recommendations, business info and images in one response, uses location context. [P] — [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- **Atlas browser: Retired.** Release note of 9 Jul 2026: "We're deprecating Atlas as we bring browser-based agentic capabilities into ChatGPT and Codex"; Atlas stopped working 9 Aug 2026. [P] — [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- **Restaurant reservations** (10 Aug 2026): ask for a restaurant with OpenTable (global), Resy (US) or Yelp (US and Canada); "You'll see available reservation times directly in the response"; mobile, web, desktop; all plans. [P] — [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- **ChatGPT Work on signed-in websites** (25 Aug 2026; web and mobile; Plus and Pro for authentication): the agent hands off login screens to the user, then continues; "it will always ask for confirmation before consequential actions, such as completing a reservation or payment." On 31 Aug 2026 Work gained website tools in the desktop app's built-in browser, and the browser extension expanded to Edge, Brave, Opera, Vivaldi with a side-chat panel (not in Opera). [P] — [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- **Dots** (29 Sep 2026): always-on agents, each with its own cloud computer and browser, 4,000+ apps via plugins; Pro, Business Premium, Enterprise in eligible markets; reachable in ChatGPT desktop/web/mobile, Slack, Teams; an Activity View shows progress. The launch post itself describes no shopping features. [P] — [OpenAI, "Introducing Dots"](https://openai.com/index/introducing-dots/)
- **New ways to shop** (1 Oct 2026; mobile and web): a "Try on" button on clothing/accessory listings (selfie-based virtual try-on with ChatGPT Images, reference photo saved), and the ability to **save any product to Favorites or to a folder in the Library**. [P] — [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- **ChatGPT Wallet** (13 Nov 2026; **Limited rollout**): US Pro subscribers 18+, only inside Dots conversations, eligible US-issued Visa/Mastercard/Amex. Save a card once; before the dot pays "you review the merchant, items, total, and selected card, then authorize the purchase" with Face ID/Touch ID; payment uses a substitute credential so neither agent nor merchant sees the card. Planned: spending limits, category/time controls, pre-approved purchases, more retailers, a Commerce Partner Playbook. [P] — [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes); [S] [TechCrunch, 13 Nov 2026](https://techcrunch.com/2026/11/13/chatgpts-new-wallet-lets-ai-agents-shop-and-check-out-for-you/)
- A 23 Nov 2026 release-note entry reportedly mentions further shopping improvements, but the text was truncated in the search summary and I could not confirm details. [U] — [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- Retailer apps inside ChatGPT (as of Mar 2026, (OLD)): Walmart (Sparky, account linking, loyalty, payments), Sephora (advice + loyalty), CarMax (inventory, Feb 2026), Lowe's (details and availability, links out for purchase), DoorDash (Dec 2025, shopping lists from recipes), Etsy building one; Instacart links to its own site for checkout. [S] — [Modern Retail, 27 Mar 2026](https://www.modernretail.co/technology/what-went-wrong-with-chatgpts-instant-checkout/)
- Target's storefront inside ChatGPT is reported back for a second holiday season in 2026. [U] — [Startup Fortune](https://startupfortune.com/target-leans-harder-into-ai-shopping-tools-for-its-second-chatgpt-holiday-season/)
- A Synchrony financing plugin was announced 17 Aug 2026 as coming "soon". [S, third-party tracker] — [Sanbi.ai tracker, 23 Oct 2026](https://sanbi.ai/blog/agentic-commerce-tracker-ai-checkout)

#### Claude (Anthropic)
- **Everyday-life connectors** (23 Apr 2026, (OLD)): AllTrails, Audible, Booking.com, Instacart, Intuit Credit Karma, Intuit TurboTax, Resy, Spotify, StubHub, Taskrabbit, Thumbtack, Tripadvisor, Uber, Uber Eats, Viator; 200+ connectors total; all plans; mobile in beta. "before it books or purchases something on your behalf, it's designed to check with you first." "Claude is ad-free and will stay that way" with no paid placements. [P] — [Anthropic, "New connectors in Claude for everyday life"](https://claude.com/resources/articles/connectors-for-everyday-life)
- Third-party commerce connectors exist in Claude's directory, e.g. a Shop (Shop.app) connector and a Shipt connector (build and edit a cart, continue checkout in the Shipt experience). [U] — [claude.com Shop connector](https://claude.com/marketplace/connectors/shop); [claude.com Shipt connector](https://claude.com/marketplace/connectors/shipt)
- **Product cards** (first spotted ~15 Jun 2026; **Shipped but unannounced**): ReFiBuy's monitoring found Claude serving "rudimentary" product cards "pervasive across all categories" (electronics, pet, fashion, beauty). The observer states Claude has no buy capability yet. Anthropic did not confirm. [S] — [Retailgentic (Scot Wingo), 16 Jun 2026](https://www.retailgentic.com/p/breaking-claude-has-product-cards)
- **Claude Commerce Agents** (2 Sep 2026): an open blueprint for retailers (a shopper agent with catalog search, multi-item carts, comparisons, service questions, checkout, plus a merchant agent); partners named include Shopify, Visa, Mastercard, Accenture. It is developer/retailer infrastructure, not a consumer shopping product in the Claude app; it ships no payment protocol, catalog or ad layer. [U] — [PYMNTS](https://www.pymnts.com/news/artificial-intelligence/2026/anthropic-built-the-shopping-brain-and-skipped-the-wallet/); [Retailgentic](https://www.retailgentic.com/p/flash-claude-for-commerce-drops)
- **Claude in Chrome / Cowork side panel** (12 Aug 2026): the Chrome side panel became a Claude Cowork session; Claude sees the current page, clicks, types, fills forms across tabs using the user's logins; Max and Team now, Pro rolling out; "Automatically approve" mode exists but Claude "still asks before irreversible or costly actions, such as making a purchase or sharing personal data"; does not run on other Chromium browsers or on mobile; sessions can be continued in desktop/web/mobile apps. [P] — [Anthropic, "The Claude in Chrome side panel is now Claude Cowork"](https://claude.com/blog/cowork-chrome-side-panel)

#### Manus
- Corporate status: Meta announced a ~$2B acquisition on 29 Dec 2025; China's foreign-investment security review prohibited it in April 2026; Meta and Manus separated operations in May; Manus announced a return to independent operation (reports give 11 Aug 2026 for the announcement and 1 Sep 2026 for resumption). [U, multiple outlets agree] — [Yahoo Finance](https://finance.yahoo.com/technology/ai/articles/manus-returns-independence-china-blocks-170145849.html); [The Next Web](https://thenextweb.com/news/manus-meta-acquisition-blocked-china-independent-data-deletion); [TechStartups, 1 Sep 2026](https://techstartups.com/2026/09/01/ai-startup-manus-resumes-independent-operations-after-china-kills-metas-2-billion-deal/)
- **Browser Operator** (extension linked from the Chrome Web Store; "available to all users"): Manus acts inside the user's own logged-in browser; asks permission before accessing the browser, access revocable any time; runs "without continuous human supervision"; page gives no shopping/purchase example beyond "booking logistics" and looking up an Amazon order number; mobile not mentioned. [P] — [Manus Browser Operator](https://manus.im/features/manus-browser-operator)
- **My Computer** (17 Mar 2026, (OLD)): desktop agent for macOS/Windows. [U] — [9to5Mac](https://9to5mac.com/2026/03/17/metas-manus-launches-my-computer-to-turn-your-mac-into-an-ai-agent/)
- No dedicated shopping feature, product-card UI, wallet or checkout partner was found for Manus. Third-party reviews list "price comparison shopping" as a typical use and note that CAPTCHAs, MFA and sensitive actions interrupt tasks. [U] — [flowith](https://flowith.io/blog/manus-first-general-purpose-ai-agent); [MyClaw review](https://myclaw.ai/ja/blog/manus-reviews)

#### Meta Muse (notable new personal agent)
- Launched 8 Sep 2026 (page updated 10 Nov 2026): personal agent on iOS, Android, muse.ai and inside WhatsApp; US at launch; free for most needs with paid tiers; runs on a dedicated "Muse Secure VM"; can book travel, fill forms, negotiate and **check out using Link by Stripe** with a one-time-use card; asks before sensitive actions like purchases; keeps an audit trail; Shop Pay "coming soon"; 1Password support planned. Meta's post does not mention Manus. [P] — [Meta, "Introducing Muse"](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)
- Paid tiers reported at $20/month and $100/month. [S] — [Android Authority, 6 Oct 2026](https://www.androidauthority.com/meta-muse-one-week-later-hands-on-3718233/)
- Shop Pay and PayPal were added at Connect on 23 Sep 2026; retailers added include Walmart and Best Buy; Amazon blocked Muse on 20-21 Sep 2026. [S, third-party tracker] — [Sanbi.ai tracker](https://sanbi.ai/blog/agentic-commerce-tracker-ai-checkout); [S] [TechCrunch, 6 Oct 2026](https://techcrunch.com/2026/10/06/the-next-hurdle-for-ai-agents-getting-websites-to-let-them-in/)
- TechCrunch reports Muse has over 10 million users and that AI-assisted shopping is a top activity. [S] — [TechCrunch, 13 Nov 2026](https://techcrunch.com/2026/11/13/chatgpts-new-wallet-lets-ai-agents-shop-and-check-out-for-you/)

#### Google Gemini app and AI Mode in Search
- **Nov 2025 base layer** (13 Nov 2025, (OLD)): conversational shopping in AI Mode and shopping inside the Gemini app (all US users); agentic checkout tied to price tracking (track item with size, color, max budget; get notified; Google buys on the merchant site with Google Pay after the user confirms purchase and shipping details); launch merchants Wayfair, Chewy, Quince, select Shopify; "Let Google Call" (Duplex calls local stores for stock/price; toys, health and beauty, electronics). [P] — [Google, 13 Nov 2025](https://blog.google/products/shopping/agentic-checkout-holiday-ai-shopping/)
- **Agentic booking and Canvas** (17 Nov 2025, (OLD)): AI Mode finds restaurant reservations (US, no Labs needed), event tickets and local appointments (US Labs) across OpenTable, Resy, Tock, Ticketmaster, StubHub, SeatGeek, Vivid Seats, Booksy, Fresha, Vagaro; **Canvas for travel planning** in AI Mode (desktop only, US, Labs). [P] — [Google, 17 Nov 2025](https://blog.google/products/search/agentic-plans-booking-travel-canvas-ai-mode/)
- **Universal Commerce Protocol (UCP)** announced 11 Jan 2026 (co-developed with Shopify); a "Buy" button on eligible listings in the Gemini app and AI Mode; by Feb 2026 UCP checkout was rolling out in the US for Etsy and Wayfair. (OLD) [U] — [9to5Google, 11 Jan 2026](https://9to5google.com/2026/01/11/gemini-ai-mode-checkout/); [Digital Commerce 360, 13 Feb 2026](https://www.digitalcommerce360.com/2026/02/13/google-expands-ai-mode-ecommerce-tools/)
- **Travel in AI Mode** (27 Aug 2026): flight price tracking inside AI Mode (180+ countries, excluding EEA; booking still on the airline/OTA site); points-and-miles pricing; **hotel booking inside AI Mode** via "Continue on Google", choose room, review cancellation policy, pay with Google Pay; US English; partners Booking.com, Choice, Expedia, Hilton, Hotels.com, IHG, Marriott, Priceline, Trip.com, Wyndham; hotel/OTA stays merchant of record. [P] — [Google, 27 Aug 2026](https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/)
- 16 Sep 2026: Google says UCP "already enables direct checkout for hundreds of thousands of brands and retailers across Google"; merchants can enable cart transfer to their own site; rollout gradual in the US, Australia and Canada early next year; loyalty/member pricing can show across Google. [P] — [Google, 16 Sep 2026](https://blog.google/products-and-platforms/products/shopping/google-shopping-updates-holiday-shopping/)
- **Universal Cart** (15 Oct 2026, US; previewed at I/O in May 2026): "your new hub for shopping on Google", a cross-retailer cart across Search (incl. AI Mode) and the Gemini app; background price-drop and back-in-stock notifications; surfaces promo codes; built on Google Wallet so it suggests a payment method based on card perks; check out with Google Pay "in a few taps" for many stores or transfer items to the merchant's cart; merchants named: Nike, Sephora, Target, Ulta Beauty, Walmart, Wayfair, many Shopify merchants. [P] — [Google, 15 Oct 2026](https://blog.google/products-and-platforms/products/shopping/universal-cart-launch/)
- One analysis says the October launch is narrower than the I/O vision (no mention of YouTube, Gmail, the compatibility check, or AP2). [U] — [stellagent.ai](https://stellagent.ai/insights/google-universal-cart-us-launch)
- Direct checkout in AI Mode and Gemini reached Canada on 4 Nov 2026. [U] — [Search Engine Journal](https://www.searchenginejournal.com/google-brings-ucp-direct-checkout-to-ai-mode-in-canada/595882/)
- **Gemini Task mode** (update announced 17 Nov 2026): Gemini app has two tabs, Chat and Task; Task handles multistep work "such as booking appointments and comparing online product listings"; now on Gemini 4 Hydrogen; free in the US, Japan, Korea, Canada, Australia, India; asks for instructions before sensitive tasks such as an online purchase; uses Google Wallet for transactions; card-network tokenization and UCP support planned; each task runs in a dedicated hardware-isolated VM; can use Gmail data such as past purchases to inform suggestions. [S] — [SiliconANGLE, 18 Nov 2026](https://siliconangle.com/2026/11/18/google-upgrades-geminis-agentic-task-mode-with-new-model-e-commerce-features/)
- Additional Task-mode detail not confirmed by the article I opened: US-only buying where the user sets an item and max price, Gemini watches restocks/price drops, stages checkout and sends an itemized summary; nothing bought until approval on device; single-use virtual card. [U] — [Android Headlines](https://www.androidheadlines.com/2026/11/google-gemini-ai-agentic-features-task-mode.html)
- Native checkout for Shopify stores in AI Mode and Gemini reported as on by default from 19 Nov 2026 (merchant opt-out). [U] — [xgentech](https://xgentech.net/blogs/resources/shopify-google-ai-mode-gemini-checkout-opt-out)

#### Perplexity (app and Comet browser)
- **Buy with Pro** (Nov 2024, (OLD)) was the Pro-only one-click checkout; replaced/extended by free shopping plus **Instant Buy with PayPal** on 25 Nov 2025 (OLD): US only; website and desktop app at launch with iOS/Android "in the coming weeks"; launch merchants Abercrombie & Fitch, Ashley Furniture, Fabletics, Adorama, Newegg; merchant remains merchant of record. [S] — [eWeek, 26 Nov 2025](https://www.eweek.com/news/paypal-perplexity-instant-buy-shopping/)
- A third-party tracker dated 23 Oct 2026 found "No 2026 update" to Perplexity's checkout. [S] — [Sanbi.ai tracker](https://sanbi.ai/blog/agentic-commerce-tracker-ai-checkout)
- Unverified 2026 items: Comet free on Mac, Windows, iOS, Android (sources disagree on dates); "Snap to Shop" visual search; a merchant "Commerce Hub" supporting US, UK, Canada, Australia as of Q3 2026 with category expansion in June 2026; Perplexity dropped AI-integrated advertising in Feb 2026. [U] — [toolso.ai](https://toolso.ai/blog/perplexity-updates); [wrkngdigital](https://wrkngdigital.com/post/perplexity-comet-for-shopify-stores-updated-q3-2026-optimization-guide); [Second Talent](https://www.secondtalent.com/resources/perplexity-ai-features-capabilities-2026/)
- **Comet on Amazon:** Amazon sued in Nov 2025; won an injunction blocking Comet's shopping agent on 10 Mar 2026; the Ninth Circuit vacated it on 4 Aug 2026, holding that when an agent acts at a user's direction it is the user who "accesses" Amazon; the district-court case continues (amended complaint 21 Sep 2026; hearing 20 Nov 2026 with no ruling recorded). [U, multiple outlets] — [CNBC, 10 Mar 2026](https://www.cnbc.com/2026/03/10/amazon-wins-court-order-to-block-perplexitys-ai-shopping-agent.html); [MediaPost, 5 Aug 2026](https://www.mediapost.com/publications/article/417007/appeals-court-sides-against-amazon-lifts-perplexi.html); [The Next Web](https://thenextweb.com/news/amazon-loses-perplexity-comet-ai-shopping-ruling)

#### Microsoft Copilot
- **Copilot Checkout** launched 8 Jan 2026 at NRF (OLD): buy inside the Copilot conversation; US; Copilot.com first; PayPal, Shopify, Stripe, Etsy integrations; merchants include Urban Outfitters, Anthropologie, Ashley Furniture, Etsy sellers; retailer remains merchant of record. Microsoft's own claims: journeys with Copilot 33% shorter, 53% more purchases within 30 minutes. [U, multiple outlets] — [Axios, 8 Jan 2026](https://www.axios.com/2026/01/08/microsoft-ai-copilot-checkout); [GeekWire](https://www.geekwire.com/2026/microsoft-launches-copilot-checkout-joining-the-ai-shopping-race-against-amazon-google-and-openai/); [Microsoft Advertising blog](https://about.ads.microsoft.com/en/blog/post/january-2026/conversations-that-convert-copilot-checkout-and-brand-agents)
- Mobile-app checkout reported April 2026 (Windows Central, 22 Apr 2026); ESW cross-border integration 21 Jul 2026; still US. [S, third-party tracker] — [Sanbi.ai tracker](https://sanbi.ai/blog/agentic-commerce-tracker-ai-checkout)
- An April 2026 update reportedly added UCP support, mobile checkout, loyalty and WooCommerce, with a catalog of 500,000+ merchants. [U; the page returned 403 when opened] — [WindowsForum thread](https://windowsforum.com/threads/microsoft-copilot-shopping-update-adds-ucp-mobile-checkout-loyalty-and-woocommerce.414597/)
- Price comparison, price history, price tracking and cashback sit inside Copilot in Edge (US first). [U, source age unclear] — [WindowsForum](https://windowsforum.com/windows-news.4/copilot-in-edge-ai-shopping-assistant-with-price-tracking-and-alerts.391305/)

#### Amazon Alexa for Shopping (retailer-owned, but relevant comparator)
- 13 May 2026 (borderline OLD): Rufus merged into Alexa+ as "Alexa for Shopping", placed in the Amazon search bar; price tracking, product comparisons; **Buy for Me** completes purchases on other retailers' sites using the user's primary address and card; US only. [U, multiple outlets] — [TechCrunch, 13 May 2026](https://techcrunch.com/2026/05/13/amazon-launches-an-ai-shopping-assistant-for-the-search-bar-powered-by-alexa/); [About Amazon](https://www.aboutamazon.com/news/retail/alexa-for-shopping-ai-assistant); [Retail Dive](https://www.retaildive.com/news/amazon-ai-alexa-for-shopping/820218/)

#### Other
- "Instinct" is named by TechCrunch as another personal agent that supports purchases on users' behalf; no further detail gathered. [S] — [TechCrunch, 13 Nov 2026](https://techcrunch.com/2026/11/13/chatgpts-new-wallet-lets-ai-agents-shop-and-check-out-for-you/)
- Walmart announced an "Agent Gateway" (MCP server with per-agent spending limits; agents never receive card data) on 21 Oct 2026. [S, third-party tracker] — [Sanbi.ai tracker](https://sanbi.ai/blog/agentic-commerce-tracker-ai-checkout)

### Inferences
- The clearest 2026 trend is the separation of "chat that recommends" from "agent that buys": OpenAI, Google and Meta each now run a distinct agent surface (Dots, Task mode, Muse) with its own VM and a tokenized wallet, while the ordinary chat surface is a discovery UI.
- Google has the most complete end-to-end consumer stack (discovery tables, cross-retailer cart, price tracking, wallet checkout, hotel booking). OpenAI has the broadest discovery reach but the weakest native checkout. Anthropic has deliberately stayed out of payments.
- Nearly everything transactional is US-only; Google is the only one with a confirmed second country (Canada, Nov 2026).

### Gaps
- Could not confirm the content of the 23 Nov 2026 ChatGPT shopping release note.
- No first-party Perplexity source from 2026 was opened; current state of Instant Buy on mobile, merchant count, and Comet shopping cards is unverified.
- No Microsoft primary source from after January 2026 was opened; mobile and UCP details rest on trackers/forums.
- Whether Claude's product cards are now a stable, documented consumer feature is unknown; Anthropic has published nothing describing them.
- Whether ChatGPT "agent mode" still exists as a named feature after Atlas's retirement was not confirmed; release notes now refer to "ChatGPT Work" and "Dots".

---

## 2. How exactly are shopping results displayed? Is there any persistent place to hold candidates, or do results scroll away in the chat stream?

### Takeaway
The dominant pattern is still inline product cards (grid or carousel) embedded in a scrolling chat reply. Persistent holding places are new and thin: Google's Universal Cart (Oct 2026) and ChatGPT's Favorites/Library folders (Oct 2026) are the only two confirmed persistent, cross-conversation containers for shopping candidates in general-purpose assistants; Google's Canvas side panel (travel only, desktop, Labs) is the only confirmed canvas-style surface.

### Cited Findings
- **ChatGPT, standard chat:** "Products are presented side by side with key details like price, reviews, and features"; users "browse visually" rather than scroll long lists and refine via conversation. [P] — [OpenAI, 24 Mar 2026](https://openai.com/index/powering-product-discovery-in-chatgpt/)
- Reviewers describe the March 2026 UI as visual cards with price, star ratings, availability and key specs in a card grid; OpenAI's mockups show three mobile screens (a visual match, a comparison table, a filtered product grid). [U] — [The Decoder](https://the-decoder.com/chatgpt-is-turning-into-a-shopping-platform-with-product-images-prices-and-comparisons-but-no-checkout/); [Digital Applied](https://www.digitalapplied.com/blog/chatgpt-visual-shopping-image-search-side-by-side-compare)
- **ChatGPT shopping research:** opens "a visual interface where you chat and give feedback on product options"; options surface during research and can be marked "Not interested" or "More like this"; output is a buyer's guide with top products, key differences and tradeoffs. [P] — [OpenAI, 24 Nov 2025](https://openai.com/index/chatgpt-shopping-research/)
- **ChatGPT persistent storage:** since 1 Oct 2026 users "can save any product to Favorites or to a folder in their Library" (mobile and web). [P] — [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- **ChatGPT carousels are inconsistent:** a study of 260 million prompts reportedly found shopping carousels trigger on only about 9% of queries; the same product can be cited in text but absent from the carousel, or the reverse. [U] — [ai-search-tools.com](https://ai-search-tools.com/guides/chatgpt-shopping-carousels-in-2026-how-they-work-what-triggers-them-and-why-your-products-arent-showing-up); [BotRank](https://www.botrank.ai/post/how-to-get-your-products-into-chatgpt-shopping)
- **ChatGPT reservations:** available times are shown "directly in the response" and the user picks one. [P] — [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- **ChatGPT Dots:** an Activity View shows progress including background work and lets the user redirect the agent; no product-specific UI described. [P] — [OpenAI, "Introducing Dots"](https://openai.com/index/introducing-dots/)
- **Google AI Mode:** responses combine visuals with price, reviews and inventory; visual queries return shoppable images; choosing between options yields a comparison table. **Gemini app:** shoppable product listings, comparison tables, prices from across the web and places to buy, inside the chat. [P] — [Google, 13 Nov 2025](https://blog.google/products/shopping/agentic-checkout-holiday-ai-shopping/)
- **Google Universal Cart:** a persistent cart that "keeps progress across Google"; example flow saves a handbag in AI Mode and a sweater and lipgloss in the Gemini app into the same cart; shows "hidden savings and promotions in cart". The post does not say whether it is a side panel or a separate page, nor how it differs on mobile vs desktop. [P] — [Google, 15 Oct 2026](https://blog.google/products-and-platforms/products/shopping/universal-cart-launch/)
- **Google Canvas (travel):** user selects "Create Canvas"; the plan appears in a **side panel** combining flights, hotels, Maps photos/reviews; includes hotel comparisons by price and amenities; reopenable from AI Mode history; desktop only, US, Labs. [P] — [Google, 17 Nov 2025](https://blog.google/products/search/agentic-plans-booking-travel-canvas-ai-mode/)
- **Google hotels in AI Mode:** "a visual list of hotels with guest reviews and comparison factors". [P] — [Google, 27 Aug 2026](https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/)
- **Google agentic booking (restaurants/tickets):** results as "a curated list with direct links". [P] — [Google, 17 Nov 2025](https://blog.google/products/search/agentic-plans-booking-travel-canvas-ai-mode/)
- **Perplexity:** after the AI narrows options, matching products appear as product cards in the answer; conversation context and preferences are remembered within the session. [S] — [eWeek, 26 Nov 2025](https://www.eweek.com/news/paypal-perplexity-instant-buy-shopping/)
- **Claude:** inline product cards described as "rudimentary" (Jun 2026); layout, click behaviour and platform not documented. With multiple connectors, "Claude shows them all and lets you choose"; recommendations are refined in the conversation thread. [S] — [Retailgentic, 16 Jun 2026](https://www.retailgentic.com/p/breaking-claude-has-product-cards); [P] [Anthropic connectors post](https://claude.com/resources/articles/connectors-for-everyday-life)
- **Claude in Chrome / Cowork:** a browser side panel next to the live merchant page; conversations are saved to history. [P] — [Anthropic, 12 Aug 2026](https://claude.com/blog/cowork-chrome-side-panel)
- **Meta Muse:** a text conversation; results arrive as a curated list in chat; searches can be set up as recurring tasks (e.g. an eBay search twice a day); audit trail of past and planned actions. [S] — [Android Authority, 6 Oct 2026](https://www.androidauthority.com/meta-muse-one-week-later-hands-on-3718233/); [P] [Meta](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)
- **Copilot:** shopping answers show sizes, retailers, review summaries, return windows and price history where merchants supply it. [U] — [ecommerceguide.com](https://ecommerceguide.com/agents/copilot-shopping/)
- **Manus:** vendor page does not describe output format for shopping. [P] — [Manus Browser Operator](https://manus.im/features/manus-browser-operator)
- General framing from trade press: assistants "return a shortlist"; there is "no page two" (a product is either in the shortlist or absent). [S] — [ChannelX, Nov 2026](https://channelx.world/2026/11/this-is-the-first-holiday-season-where-the-shopping-happens-in-chat/)

### Inferences
- Outside Google's cart and ChatGPT's Favorites, candidates live only in the message where they were rendered. A later refinement produces a new set of cards further down the thread, so the user's working set is distributed across scroll positions rather than held in one place.
- Persistence, where it exists, is "save for later" (wishlist/cart semantics), not "working set for deciding". Neither Universal Cart nor Favorites is described as a place to arrange, annotate, group or compare candidates.
- Agent surfaces (Dots, Muse, Task mode) present work as a status/activity feed plus a final list; the user reviews an outcome rather than browsing a catalogue.

### Gaps
- No hands-on description of how ChatGPT Favorites/Library folders look, whether they sync price changes, or whether they can be reopened as context for a new chat.
- No authoritative description of Universal Cart's layout (panel vs page, mobile behaviour).
- No documented layout for Claude product cards or Copilot product cards in late 2026.
- No documented Manus shopping output format.

---

## 3. Can users compare options side by side? How?

### Takeaway
Yes in ChatGPT and Google (model-generated comparison tables/side-by-side views inside the reply), and via Canvas for hotels in Google travel planning. Everywhere else comparison is prose or a list. In every confirmed case the assistant, not the user, decides what goes into the comparison and which attributes are columns; no assistant documents a user-driven "pick these three and compare" tray.

### Cited Findings
- **ChatGPT:** products can be compared "side by side on price, reviews, and features, without opening multiple tabs" (24 Mar 2026). [P] — [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes); [OpenAI](https://openai.com/index/powering-product-discovery-in-chatgpt/)
- Reviewers describe ChatGPT comparisons as a structured table of price, key features and tradeoffs. [U] — [Digital Applied](https://www.digitalapplied.com/blog/chatgpt-visual-shopping-image-search-side-by-side-compare)
- **ChatGPT shopping research:** the buyer's guide lays out "top products, key differences, tradeoffs"; steering is via "Not interested" / "More like this" on individual options. [P] — [OpenAI, 24 Nov 2025](https://openai.com/index/chatgpt-shopping-research/)
- **Google AI Mode:** "Choosing between options produces a comparison table with a side-by-side view and review-based insights"; Gemini app also shows comparison tables. [P] — [Google, 13 Nov 2025](https://blog.google/products/shopping/agentic-checkout-holiday-ai-shopping/)
- **Google Canvas (travel):** hotel comparisons by price and amenities and activity ideas sorted by travel time, in a side panel; desktop/US/Labs only. [P] — [Google, 17 Nov 2025](https://blog.google/products/search/agentic-plans-booking-travel-canvas-ai-mode/)
- **Google Universal Cart:** the launch post "does not mention any product comparison tools". [P] — [Google, 15 Oct 2026](https://blog.google/products-and-platforms/products/shopping/universal-cart-launch/)
- **Gemini Task mode:** described as handling "comparing online product listings" as a multistep task. [S] — [SiliconANGLE, 18 Nov 2026](https://siliconangle.com/2026/11/18/google-upgrades-geminis-agentic-task-mode-with-new-model-e-commerce-features/)
- **Perplexity:** launch coverage describes product cards but no side-by-side view. [S] — [eWeek, 26 Nov 2025](https://www.eweek.com/news/paypal-perplexity-instant-buy-shopping/)
- **Meta Muse:** hands-on review describes refining a list by instruction (condition, sort, Buy It Now) but no way to compare options side by side. [S] — [Android Authority, 6 Oct 2026](https://www.androidauthority.com/meta-muse-one-week-later-hands-on-3718233/)
- **Claude:** the Commerce Agents blueprint (for retailers) includes comparisons and multi-item carts, but no comparison UI is documented for the consumer Claude app. [U] — [PYMNTS](https://www.pymnts.com/news/artificial-intelligence/2026/anthropic-built-the-shopping-brain-and-skipped-the-wallet/)
- **Amazon Alexa for Shopping:** launched with product comparisons and price tracking. [U] — [eWeek](https://www.eweek.com/news/amazon-alexa-for-shopping-replaces-rufus/)
- **Copilot:** guides position it for "quick comparisons while browsing" in Edge. [U] — [Panstag, Nov 2026](https://www.panstag.com/2026/11/best-ai-for-black-friday-deals.html)

### Inferences
- Comparison is an output format, not an interaction. The table is regenerated per request; nothing documented lets a user pin a row, add a column, drop a candidate and keep the rest, or carry a comparison forward as the conversation moves on.
- Tables are a poor fit for phones (see Q5), and the one richer comparison surface (Canvas) is desktop-only.

### Gaps
- No hands-on source confirms whether ChatGPT or Google tables let users choose which products or attributes are included, or whether they are static renderings.
- No independent UX study (NN/g, Baymard) of AI comparison tables was found.

---

## 4. How is purchase completed: link-out, native in-chat checkout, or an agent operating a browser? Which merchants/partners?

### Takeaway
All three models coexist in November 2026. Link-out (or in-app browser to the merchant) is the default for ChatGPT chat and Claude; wallet-based native checkout is live in Google (Google Pay/UCP), Copilot (PayPal/Stripe/Shopify) and Perplexity (PayPal); browser/VM-driving agents with tokenized cards are live or in limited rollout at Meta (Muse + Stripe Link), OpenAI (Dots + ChatGPT Wallet), Google (Task mode + Google Wallet), Amazon (Buy for Me), Anthropic (Claude in Chrome, user confirms) and Manus (Browser Operator). Every vendor requires explicit user approval before money moves.

### Cited Findings

| Assistant | Completion model | Rails / partners | Approval step | Status and date |
|---|---|---|---|---|
| ChatGPT chat | Link-out on desktop; in-app browser to merchant store on mobile for Shopify; retailer apps inside ChatGPT (Walmart uses its own payments) | ACP for discovery; Shopify Catalog; Target, Sephora, Nordstrom, Lowe's, Best Buy, Home Depot, Wayfair, Walmart | Merchant's own checkout | Shipped 24 Mar 2026 (OLD) |
| ChatGPT Dots | Agent with own cloud browser pays via ChatGPT Wallet token | Visa/Mastercard/Amex credit cards | Review merchant, items, total, card; Face ID/Touch ID | Limited rollout 13 Nov 2026, US Pro |
| ChatGPT Work | Agent on signed-in websites | User's own accounts | Always asks before reservation or payment | Shipped 25 Aug 2026, Plus/Pro |
| Google AI Mode / Gemini | Native checkout (Buy button, Universal Cart) or transfer to merchant cart | Google Pay, UCP; Nike, Sephora, Target, Ulta, Walmart, Wayfair, Etsy, Shopify merchants | Confirm purchase and shipping details | UCP Jan 2026; Universal Cart 15 Oct 2026; US (+Canada Nov 2026) |
| Google hotels | "Continue on Google", pick room, pay | Google Pay; Booking.com, Expedia, Hilton, Marriott, IHG, etc. | Review details and cancellation policy | Shipped 27 Aug 2026, US |
| Gemini Task mode | Agent in dedicated VM | Google Wallet; card tokenization and UCP planned | Asks before purchase | Updated 17 Nov 2026; free in 6 countries |
| Perplexity | Native in-chat Instant Buy | PayPal; Abercrombie, Ashley, Fabletics, Adorama, Newegg at launch | PayPal flow | Shipped 25 Nov 2025 (OLD); no 2026 update found |
| Perplexity Comet | Browser agent on merchant sites | User's own accounts | Varies | Contested on Amazon; injunction vacated 4 Aug 2026 |
| Copilot | Native Copilot Checkout | PayPal, Stripe, Shopify, Etsy | In-chat checkout form | Shipped 8 Jan 2026 (OLD); mobile reported Apr 2026 |
| Claude app | Connector-mediated booking/cart, then partner flow | Booking.com, Resy, StubHub, Instacart, Uber Eats, Viator, Shop, Shipt | "designed to check with you first" | Shipped 23 Apr 2026 (OLD) |
| Claude in Chrome | Agent drives user's Chrome | User's own accounts | Still asks before purchase even in auto-approve | Cowork side panel 12 Aug 2026 |
| Meta Muse | Agent in own VM | Stripe Link one-time card; Shop Pay, PayPal reported added | Asks before purchase; user approves total in chat | Shipped 8 Sep 2026, US |
| Manus | Agent drives user's browser (Browser Operator) or its own sandbox | None | Permission to access browser | No commerce-specific flow found |
| Amazon Alexa | Buy for Me agent on third-party sites | Amazon account address and card | — | Shipped 13 May 2026, US |

Sources for the table: [OpenAI, 24 Mar 2026](https://openai.com/index/powering-product-discovery-in-chatgpt/); [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes); [TechCrunch on ChatGPT Wallet](https://techcrunch.com/2026/11/13/chatgpts-new-wallet-lets-ai-agents-shop-and-check-out-for-you/); [Google Universal Cart](https://blog.google/products-and-platforms/products/shopping/universal-cart-launch/); [Google travel](https://blog.google/products-and-platforms/products/search/book-travel-ai-mode/); [SiliconANGLE on Task mode](https://siliconangle.com/2026/11/18/google-upgrades-geminis-agentic-task-mode-with-new-model-e-commerce-features/); [eWeek on Instant Buy](https://www.eweek.com/news/paypal-perplexity-instant-buy-shopping/); [Axios on Copilot Checkout](https://www.axios.com/2026/01/08/microsoft-ai-copilot-checkout); [Anthropic connectors](https://claude.com/resources/articles/connectors-for-everyday-life); [Anthropic Cowork side panel](https://claude.com/blog/cowork-chrome-side-panel); [Meta Muse](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/); [Manus Browser Operator](https://manus.im/features/manus-browser-operator); [Sanbi.ai tracker](https://sanbi.ai/blog/agentic-commerce-tracker-ai-checkout)

Additional findings:
- ChatGPT after March 2026: "Mobile opens an in-app browser on the merchant's store. Desktop links out." [S, third-party tracker] — [Sanbi.ai tracker](https://sanbi.ai/blog/agentic-commerce-tracker-ai-checkout)
- ChatGPT Wallet works only in dot conversations and only with credit cards; virtual cards unsupported at launch; a "Ready to check out" status does not confirm the merchant placed the order; no transaction fee at launch. [U] — [Notebookcheck](https://www.notebookcheck.net/ChatGPT-Wallet-lets-AI-agents-shop-without-seeing-your-card-number.1450862.0.html); [The Keyword](https://www.thekeyword.co/news/chatgpt-wallet-agent-payments)
- Google's original agentic checkout was coupled to price tracking: the buy action is offered when the tracked price hits the user's budget. [P] — [Google, 13 Nov 2025](https://blog.google/products/shopping/agentic-checkout-holiday-ai-shopping/)
- In Universal Cart, merchants remain seller of record and provide confirmations and customer support. [P] — [Google, 15 Oct 2026](https://blog.google/products-and-platforms/products/shopping/universal-cart-launch/)
- Amazon blocks third-party agents (Muse from ~21 Sep 2026) and steers users to Alexa. [S] — [TechCrunch, 6 Oct 2026](https://techcrunch.com/2026/10/06/the-next-hurdle-for-ai-agents-getting-websites-to-let-them-in/)
- Share-of-activity claim: ChatGPT 40.4% of AI-assisted shopping sessions but 8.9% of agent purchases; Gemini/AI Mode 27.9% of sessions and 22.6% of agent purchases. [U, low-quality source, methodology unknown] — [TechBloat](https://www.techbloat.com/official-retailer-ai-assistants-vs-third-party-shopping-agents-which-should-you-trust-to-buy.html)

### Inferences
- The industry converged on "tokenized single-use credential + biometric/explicit approval + merchant stays merchant of record" as the trust pattern for agent purchases (Stripe Link for Muse, ChatGPT Wallet, Google Wallet/Pay).
- Multi-item, multi-merchant checkout exists only in Google's Universal Cart. Instant Checkout's single-item limitation was a cited reason for its failure, and no other assistant has documented a multi-merchant basket.
- OpenAI now has three overlapping purchase paths (merchant link-out, retailer apps, Dots with Wallet), which is likely to confuse users about where buying is possible.

### Gaps
- Not confirmed whether Dots purchase by driving a browser on arbitrary merchant sites or only through integrations; TechCrunch's article does not say.
- Current merchant list and volume for Copilot Checkout and Perplexity Instant Buy in late 2026 not verified.
- No confirmed ticket-purchase (events) flow that completes inside any assistant; Google's ticket search links out to Ticketmaster/StubHub/SeatGeek/Vivid Seats, and Claude's StubHub connector flow is not documented in the sources read.

---

## 5. What are the documented complaints and limitations, especially around browsing, comparing, and mobile?

### Takeaway
The best-documented failures are commercial and structural rather than visual: single-item checkout, missing loyalty/promo/pickup, low conversion in chat, retailers blocking agents, and price/stock inaccuracy. Rigorous UX research on browsing and comparing inside chat is largely absent; I found no NN/g or Baymard study and no substantive Reddit or Hacker News threads through search, which is itself a notable gap.

### Cited Findings

Checkout and commercial model
- Walmart's Daniel Danker said customers feared getting "five boxes" because Instant Checkout bought one item at a time; shoppers did not want checkout split from items already in their cart. Walmart's in-chat conversion was three times lower than for click-out items. [S] — [Modern Retail, 27 Mar 2026](https://www.modernretail.co/technology/what-went-wrong-with-chatgpts-instant-checkout/)
- A specialty retailer executive said Instant Checkout lacked real-time inventory, coupons, promotions, customer data collection, loyalty integration and store pickup. [S] — [Modern Retail, 27 Mar 2026](https://www.modernretail.co/technology/what-went-wrong-with-chatgpts-instant-checkout/)
- OpenAI staff reportedly found users researched products in ChatGPT but did not use it to buy (via The Information). [S] — [Modern Retail, 27 Mar 2026](https://www.modernretail.co/technology/what-went-wrong-with-chatgpts-instant-checkout/)
- Expedia: customers prefer booking with trusted brands; Instacart: only a very small share of orders come from AI agents. DoorDash and Uber also report low agent order volumes. [S] — [Modern Retail](https://www.modernretail.co/technology/what-went-wrong-with-chatgpts-instant-checkout/); [TechCrunch, 13 Nov 2026](https://techcrunch.com/2026/11/13/chatgpts-new-wallet-lets-ai-agents-shop-and-check-out-for-you/)
- eMarketer judged that Google's agentic shopping experience "does not quite live up to the promise" (early 2026, (OLD)). [U] — [eMarketer](https://www.emarketer.com/content/google-brings-checkout-ai-mode-races-rivals-agentic-commerce)
- Only 7.2% of US digital shoppers say they regularly use AI shopping tools. [U] — [eMarketer](https://www.emarketer.com/content/ai-shopping-platforms-anthropic-openai-strategy-split)

Agents being blocked or failing mid-task
- Amazon blocked Muse (~21 Sep 2026); Walmart customers reported Muse failing to complete purchases, attributed to a "verify you're human" check that ejects the agent; users report blocks at Yelp, eBay (some accounts suspended), Zillow, Pizza Hut, Adidas and airlines; Delta says it has no partnership allowing third-party agents to book. [S] — [TechCrunch, 6 Oct 2026](https://techcrunch.com/2026/10/06/the-next-hurdle-for-ai-agents-getting-websites-to-let-them-in/)
- For Manus-style browser agents, CAPTCHAs, MFA, sensitive actions and difficult page interactions interrupt tasks. [U] — [MyClaw review](https://myclaw.ai/ja/blog/manus-reviews)
- Claude in Chrome carries prompt-injection risk that Anthropic says it can reduce but not eliminate; it recommends starting on trusted sites. [P] — [Anthropic, 12 Aug 2026](https://claude.com/blog/cowork-chrome-side-panel)
- Muse reviewers found it better at planning than buying; one tester got three credible tote-bag choices in about 15 minutes but bought elsewhere; another was uneasy handing over accounts. [U] — [Agent Sonic](https://www.tryagentsonic.com/articles/meta-muse-review); [TechRadar](https://www.techradar.com/ai-platforms-assistants/i-tried-metas-new-muse-ai-agent-its-incredibly-useful-but-handing-it-my-digital-life-felt-deeply-uncomfortable)
- Muse's first eBay results were weak (poor condition, wrong items) until the user added explicit constraints; the reviewer remained unsure about letting AI purchase. [S] — [Android Authority, 6 Oct 2026](https://www.androidauthority.com/meta-muse-one-week-later-hands-on-3718233/)

Browsing, selection and comparison
- "No page two": a product is either in the assistant's shortlist or absent; products an agent cannot interpret never enter the conversation. [S] — [ChannelX, Nov 2026](https://channelx.world/2026/11/this-is-the-first-holiday-season-where-the-shopping-happens-in-chat/)
- Users see a ranked shelf whose logic they cannot inspect: one analysis found over 83% of ChatGPT carousel products matched Google's top 40 organic shopping positions. [U] — [ai-search-tools.com](https://ai-search-tools.com/guides/chatgpt-shopping-carousels-in-2026-how-they-work-what-triggers-them-and-why-your-products-arent-showing-up)
- Carousels trigger inconsistently (about 9% of prompts in one study) and can disagree with the text answer. [U] — [ai-search-tools.com](https://ai-search-tools.com/guides/chatgpt-shopping-carousels-in-2026-how-they-work-what-triggers-them-and-why-your-products-arent-showing-up); [BotRank](https://www.botrank.ai/post/how-to-get-your-products-into-chatgpt-shopping)
- A hands-on test of one shopping assistant reported a response being cut off with no ability to scroll back, and never learning whether the agent could add to cart or check out. [U, vendor comparison piece] — [delight.ai](https://delight.ai/blog/ai-for-cx/ai-shopping-assistant-comparison)
- Accuracy: OpenAI itself warns shopping research "may make mistakes about details such as price and availability". [P] — [OpenAI](https://openai.com/index/chatgpt-shopping-research/)
- ShoppingBench (AAAI 2026): GPT-4.1 scored under 50% absolute success; authors cite difficulty verifying multi-constraint requirements. [U] — [search summary citing ShoppingBench via izzy.agency](https://izzy.agency/en/blog/ai-shopping-agent-catalog-readiness/)
- Trust: commentary on Meta's product-carousel tests says in-chat ads create suspicion that answers favor paying partners; OpenAI is reported to be testing product carousel ads. [U] — [squaredtech](https://www.squaredtech.co/meta-ai-shopping-tool-product-carousels); [Market Maze](https://www.marketmaze.me/p/chatgpt-product-carousel-ads-paid-shelf)

Mobile-specific limitations (documented by vendors)
- Google Canvas travel planning: desktop only. [P] — [Google, 17 Nov 2025](https://blog.google/products/search/agentic-plans-booking-travel-canvas-ai-mode/)
- Claude in Chrome: no mobile and no other Chromium browsers; Claude connectors on mobile are "in beta". [P] — [Anthropic Cowork](https://claude.com/blog/cowork-chrome-side-panel); [Anthropic connectors](https://claude.com/resources/articles/connectors-for-everyday-life)
- Perplexity Instant Buy launched web/desktop first, mobile later. [S] — [eWeek](https://www.eweek.com/news/paypal-perplexity-instant-buy-shopping/)
- Walmart's ChatGPT app launched on web before iOS/Android. [P] — [OpenAI, 24 Mar 2026](https://openai.com/index/powering-product-discovery-in-chatgpt/)
- Perplexity reportedly disabled Comet's assistant on Amazon.com for iOS temporarily (May 2026 court filing). [U] — [search summary of court coverage](https://agentshoppingguide.com/amazon-v-perplexity-explained)
- Manus Browser Operator page does not mention mobile. [P] — [Manus](https://manus.im/features/manus-browser-operator)
- ChatGPT Dots setup "starts on desktop, then mobile". [P] — [OpenAI, "Introducing Dots"](https://openai.com/index/introducing-dots/)

### Inferences
- The richest decision-support surfaces are consistently desktop-first or desktop-only (Canvas, browser side panels, extensions), while purchase approval is mobile-first (Face ID, Google Pay taps, WhatsApp messaging with Muse). Deciding and paying are being optimized on different devices.
- The public critique has focused on "can it buy" and "will retailers let it"; the middle of the funnel (holding, comparing, narrowing a set of candidates in a small chat viewport) has had little product attention and little published critique. This is an open design space.
- The "no page two" property means chat shopping removes the user's ability to browse the long tail; there is no equivalent of scrolling a results grid, applying facets, or seeing what was excluded.

### Gaps
- No NN/g or Baymard usability study of AI-assistant shopping was found (one targeted search returned none).
- No Reddit or Hacker News threads surfaced through search; community sentiment on scroll-back, losing candidates in long chats, and mobile tables is unverified and should be treated as hypothesis, not finding.
- No hands-on review from The Verge, Wired, The Information or Stratechery was opened; Modern Retail, TechCrunch and Android Authority were the strongest hands-on/reporting sources read.

---

## 6. Has any assistant shipped a canvas-like, board-like or multi-item workspace specifically for shopping results?

### Takeaway
No assistant has shipped a free-form canvas or board for shopping candidates as of 24 Nov 2026, as far as I could find. The nearest shipped things are: Google Universal Cart (persistent cross-retailer cart, Oct 2026), ChatGPT Favorites and Library folders (saved products, Oct 2026), ChatGPT shopping research's dedicated visual interface (Nov 2025), and Google's Canvas side panel in AI Mode, which is for travel planning rather than product shopping and is desktop/US/Labs only.

### Cited Findings
- **Google Universal Cart** (Shipped 15 Oct 2026, US): multi-retailer container spanning Search/AI Mode and Gemini; tracks prices and stock; promo codes; Google Pay checkout or cart transfer. No comparison tools mentioned. [P] — [Google](https://blog.google/products-and-platforms/products/shopping/universal-cart-launch/)
- **ChatGPT Favorites / Library folders** (Shipped 1 Oct 2026, mobile and web): save any product to Favorites or a folder. [P] — [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- **ChatGPT shopping research** (Shipped 24 Nov 2025, (OLD)): a separate visual interface with per-product "Not interested" / "More like this" feedback and a buyer's guide output. [P] — [OpenAI](https://openai.com/index/chatgpt-shopping-research/)
- **Google Canvas in AI Mode** (Shipped to Labs 17 Nov 2025, (OLD)): side-panel plan with hotel comparisons, reopenable from history; travel only; desktop, US, Labs. Google described Canvas as "an AI Mode tool for organizing plans and projects over time." [P] — [Google](https://blog.google/products/search/agentic-plans-booking-travel-canvas-ai-mode/)
- **Gemini Task tab** (Nov 2026): a separate tab for multistep tasks including product-listing comparison; not described as a shopping board. [S] — [SiliconANGLE](https://siliconangle.com/2026/11/18/google-upgrades-geminis-agentic-task-mode-with-new-model-e-commerce-features/)
- **Dots Activity View** and **Muse audit trail** are task-progress surfaces, not candidate workspaces. [P] — [OpenAI](https://openai.com/index/introducing-dots/); [Meta](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)
- **Claude Commerce Agents** blueprint includes multi-item carts and comparisons, but for retailer-built agents, not the Claude consumer app. [U] — [Retailgentic](https://www.retailgentic.com/p/flash-claude-for-commerce-drops)
- Retailer apps embedded in ChatGPT (Walmart, Sephora, CarMax, Lowe's, DoorDash) give a merchant-controlled environment with that retailer's own cart. [S] — [Modern Retail](https://www.modernretail.co/technology/what-went-wrong-with-chatgpts-instant-checkout/)

### Inferences
- The existing "persistent" surfaces are borrowed from e-commerce (cart, wishlist) rather than from decision-making tools (board, comparison tray, shortlist with notes). Nobody has combined persistence, user-controlled comparison and multi-item arrangement into one workspace for shopping.
- Google is closest to being able to do so, because it already has Canvas (a side-panel workspace) and Universal Cart (a persistent multi-retailer container); they are currently separate products with separate scopes (travel vs. retail) and separate device support.
- A shopping canvas that works on mobile is unclaimed territory: the one canvas that exists is desktop-only.

### Gaps
- Claude Artifacts, ChatGPT Canvas and Gemini Canvas can in principle render a custom comparison board on request, but I found no source documenting any vendor positioning these general canvases as a shopping workspace; this was not specifically searched and should be checked before asserting absence.
- Not verified whether ChatGPT Library folders can be shared, compared, or reopened as a working set.
- Amazon's Alexa for Shopping and Perplexity/Comet were not checked in depth for list/board features.
- Absence claims here rest on roughly 45 searches/fetches on 24 Nov 2026; a feature shipped quietly (as Claude's product cards were) could have been missed.
