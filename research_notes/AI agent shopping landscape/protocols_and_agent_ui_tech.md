# Protocols and agent-UI technology for an AI "shopping canvas" (state as of 24 Nov 2026)

Research notes. Star counts were read from GitHub on 2026-11-24. Items whose newest primary source is older than about six months (before roughly May 2026) are marked **[possibly outdated]**. Where I only saw a search-result summary and not the page itself, the finding is marked **[secondary, unverified]**.

---

## 1. What does each commerce protocol standardize, who has adopted it, and is it open to an independent developer without a merchant or payment partnership?

### Takeaway
Two open commerce specs now cover discovery through checkout: UCP (Google and Shopify led, version 2026-08-25, the most actively developed) and ACP (OpenAI and Stripe, latest stable 2026-04-17, still "beta"). Payment authorization sits in separate layers (AP2 mandates under FIDO, Stripe Shared Payment Tokens, Visa and Mastercard agent tokens). An independent developer can read catalogs and build carts today with no partnership (Shopify's keyless UCP catalog endpoints, UCP/ACP cart objects, checkout permalinks), but completing payment inside their own surface requires approval or a preview waitlist almost everywhere.

### Cited Findings

**Agentic Commerce Protocol (ACP), OpenAI + Stripe**
- ACP is Apache-2.0, maintained by OpenAI and Stripe as founding maintainers, and its README still labels it `beta`. The repo has 1,609 stars and its last push was 2026-07-18. — [ACP GitHub repo](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol)
- Spec versions: 2025-09-29 (initial), 2025-12-12 (fulfillment), 2026-01-16 (capability negotiation), 2026-01-30 (extensions, discounts, payment handlers), 2026-04-17 (cart, feed, orders, authentication, MCP). The 2026-04-17 spec directory contains `openapi`, `json-schema` and `openrpc` folders. — [ACP GitHub repo](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol)
- The 2026-04-17 Feed API is a push model: endpoints (`POST /feeds`, `GET /feeds/{id}`, `GET/PATCH /feeds/{id}/products`) are hosted by the agent and called by merchants; file ingestion uses `metadata.json` plus `products.jsonl`. — [ACP changelog 2026-04-17](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/changelog/2026-04-17.md)
- Governance is consensus between the two founding maintainers, with a stated future path to a neutral foundation. Contributions need a signed CLA and go through SEPs. — [ACP GitHub repo](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol)
- OpenAI moved away from in-chat Instant Checkout in March 2026 and now sends buyers to merchant-owned checkout; reported reasons include about 30 Shopify stores live and weak conversion. Dates given range from 4 to 24 March 2026. **[secondary, unverified]** — [The Keyword](https://www.thekeyword.co/news/openai-chatgpt-instant-checkout-scrapped); [Digital Applied](https://www.digitalapplied.com/blog/ai-agentic-commerce-discover-in-ai-buy-on-site-2026); [Human Forward](https://humanforward.io/us/insights/chatgpt-shopping-after-instant-checkout)
- OpenAI's own Apps SDK docs are consistent with that: merchant-hosted external checkout is the generally available option and is approved only for physical goods; the embedded ChatGPT payment sheet (`requestCheckout`) is in private beta for select marketplaces; apps cannot collect new payment credentials. — [OpenAI: MCP Apps in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt)
- OpenAI's commerce developer index now lists product feeds, "Agent Access" (keeping verified ChatGPT cloud-browser visits from being blocked), "Build a plugin", Sign in with ChatGPT, Accept payments, and Claim your business. — [OpenAI commerce docs](https://developers.openai.com/commerce)

**Universal Commerce Protocol (UCP), Google + Shopify and others**
- UCP exists and is active: the spec repo has 3,521 stars, was created 2025-12-31, is Apache-2.0, and was pushed on 2026-11-24. — [UCP GitHub repo](https://github.com/Universal-Commerce-Protocol/ucp)
- The current spec pages reference version `2026-08-25`. Capabilities in the spec navigation: Checkout (REST, MCP, A2A, Embedded transports), Cart (REST, MCP, Embedded), Permalink, Catalog (Search, Lookup; REST, MCP), Order, Ask, Location, Identity Linking; extensions for Fulfillment, Discounts, Buyer Consent, Loyalty; payment extensions for AP2 Mandates, Payment Authentication (3DS), Payment Terms, Split Payments; plus payment-handler guides and Signatures. — [UCP Cart spec](https://ucp.dev/latest/specification/shopping/cart/)
- Booking (lodging) and Food Checkout are marked draft on the UCP home page. — [ucp.dev](https://ucp.dev/)
- The ucp.dev home page lists as co-developers Google, Shopify, Etsy, Wayfair, Target, Walmart, Amazon, Microsoft, Meta, Salesforce, Stripe, Amadeus, Booking.com, Expedia Group, Hilton, Marriott, Trip.com, DoorDash, Square, Toast and Uber Eats, and as endorsers Adyen, Affirm, Amex, Klarna, Mastercard, PayPal, Visa, Worldpay and others. I read this through an automated page summary and did not verify each logo. — [ucp.dev](https://ucp.dev/)
- Google's original engineering post named Shopify, Etsy, Wayfair, Target and Walmart as collaborators and described a JSON manifest at `/.well-known/ucp`. **[possibly outdated, January 2026]** — [Google Developers Blog](https://developers.googleblog.com/en/under-the-hood-universal-commerce-protocol-ucp/)
- Stripe states it is a member of the UCP Tech Council and ships a Stripe Payments handler for UCP checkouts. — [Stripe UCP docs](https://docs.stripe.com/agentic-commerce/protocols/ucp)
- On Google surfaces UCP powers AI Mode in Search and Gemini; merchants need Merchant Center feeds, join via a waitlist, and remain merchant of record; native checkout is default and embedded (iframe) checkout is limited to approved merchants. The page does not say whether non-Google agents get any access terms. — [Google Merchant UCP guide](https://developers.google.com/merchant/ucp)

**Shopify Catalog, Storefront MCP, Checkout MCP**
- Global Catalog MCP is at `https://catalog.shopify.com/api/ucp/mcp` and per-store Storefront Catalog MCP at `https://{storeDomain}/api/ucp/mcp`. Both authenticate with an agent profile and need no API key. Tools: `search_catalog`, `lookup_catalog` (up to 50 IDs global, 10 storefront), `get_product`. Queries are rate limited and keyless access cannot get limit increases. — [Shopify: About Catalogs](https://shopify.dev/docs/agents/catalog)
- Results carry checkout URLs and attribution parameters (`shcgid`, `shclid`) that must be preserved; some fields are AI-inferred and labelled `Inferred`. — [Shopify: About Catalogs](https://shopify.dev/docs/agents/catalog)
- The older catalog and cart tools on `https://{shop}/api/mcp` were removed in favour of UCP. — [Shopify: Migrate from Storefront MCP](https://shopify.dev/docs/apps/build/storefront-mcp/servers/storefront)
- Checkout MCP exposes `create_checkout`, `update_checkout`, `complete_checkout`; non-terminal states return a `continue_url`. Cart tools accept unauthenticated requests; checkout tools require a bearer token or signed request. Cart and Checkout Permalinks are the default handoff. "The merchant always remains the merchant of record." — [Shopify: Checkout for agents](https://shopify.dev/docs/agents/checkout)
- "Completing checkout within your agent requires Shopify's permission." Shop MCP needs no API key or custom UCP profile. — [Shopify: Build commerce agents](https://shopify.dev/docs/agents)

**Stripe: Agentic Commerce Suite, Shared Payment Tokens, Link Agent Wallet, MPP**
- Agentic Commerce Suite (ACS) for agent builders is private preview with a waitlist, available in the US, Canada and select European countries, physical goods only. — [Stripe: Embed commerce into your AI interface](https://docs.stripe.com/agentic-commerce/agents/embedded.md?agent-checkout-mode=full)
- To use it an agent onboards in the Dashboard, runs an SFTP server to receive seller product feeds, and needs an "orchestrated commerce agreement" with each seller, which only the seller can initiate. Checkout runs through the Delegated Checkout API (`RequestedSession`); Stripe mints and routes the Shared Payment Token on confirm. Agents must collect payment details with Stripe Elements or the mobile Payment Sheet. A "Test Seller" exists for end-to-end testing. — [Stripe: Embed commerce into your AI interface](https://docs.stripe.com/agentic-commerce/agents/embedded.md?agent-checkout-mode=full)
- Stripe warns that agents offering both discovery and purchase in their interface "might be considered marketplace facilitators" with tax obligations, and says it may use Mastercard Agent Pay and Visa Intelligent Commerce network tokens on the agent's behalf. — [Stripe: Embed commerce into your AI interface](https://docs.stripe.com/agentic-commerce/agents/embedded.md?agent-checkout-mode=full)
- Link Agent Wallet lets an agent create a spend request; after the customer approves, Link returns a one-time-use payment credential usable "anywhere on the internet". Agent payments are available to US and Canadian customers, use OAuth against `login.link.com`, ship as `@stripe/link-cli` and TypeScript/Go/Python SDKs, and "don't require a Stripe account". — [Stripe: Link Agent Wallet](https://docs.stripe.com/agentic-commerce/agents/link-agent-wallet)
- Stripe's docs also cover machine payments (Machine Payments Protocol and x402) for charging per tool call or HTTP request, and WebMCP for browser agents inside Stripe payment UIs. — [Stripe agentic commerce docs](https://docs.stripe.com/agentic-commerce)
- Stripe's agent toolkit now lives in `stripe/ai` (2,088 stars, MIT, pushed 2026-11-24). — [stripe/ai](https://github.com/stripe/ai)

**Agent Payments Protocol (AP2)**
- AP2 v0.2 defines Checkout Mandates and Payment Mandates, each in open (user-signed constraints) and closed (transaction-specific) forms, as SD-JWTs. Roles: Shopping Agent, Credential Provider, Merchant, Merchant Payment Processor, Trusted Surface. Modes: Human Present and Human Not Present. Catalog and checkout APIs are explicitly out of scope, and AP2 is agnostic to the contents of the merchant-signed checkout JWT. — [AP2 specification](https://ap2-protocol.org/ap2/specification/)
- Google announced on 28 April 2026 that it is donating AP2 to the FIDO Alliance, released v0.2 with Human Not Present payments, and is also donating Verifiable Intent, co-developed with Mastercard. **[possibly outdated, about 7 months old]** — [Google blog](https://blog.google/products-and-platforms/platforms/google-pay/agent-payments-protocol-fido-alliance/)
- The AP2 repo has 3,283 stars; its last push was 2026-06-17. — [AP2 GitHub repo](https://github.com/google-agentic-commerce/AP2)
- Explainers that still describe Intent, Cart and Payment mandates reflect v0.1 and no longer match the spec. — [AP2 specification](https://ap2-protocol.org/ap2/specification/)

**Visa Intelligent Commerce / Trusted Agent Protocol (TAP)**
- TAP uses RFC 9421 HTTP message signatures so a merchant can verify a "Visa-approved" agent, its intent (browse or pay) bound to the merchant domain and page, and optional consumer identifiers such as Payment Account References. — [Visa Developer: TAP overview](https://developer.visa.com/capabilities/trusted-agent-protocol/overview); [visa/trusted-agent-protocol](https://github.com/visa/trusted-agent-protocol)
- The public sample repo has 225 stars and was last pushed 2025-10-28. **[possibly outdated, 13 months]** — [visa/trusted-agent-protocol](https://github.com/visa/trusted-agent-protocol)
- TAP was announced on 14 October 2025. **[possibly outdated]** — [Visa press release](https://corporate.visa.com/en/sites/visa-perspectives/newsroom/visa-unveils-trusted-agent-protocol-for-ai-commerce.html)

**Mastercard Agent Pay** (all **[secondary, unverified]**; I found no first-party developer page)
- Agent Pay issues "Agentic Tokens" (network tokens on MDES with agent-specific constraints); its Acceptance Framework (14 Oct 2025) has merchants verify agents with Web Bot Auth at the CDN layer; Verifiable Intent was introduced 5 March 2026 with Google and aligned to AP2 and UCP. — [agenticcommerceprotocol.info](https://agenticcommerceprotocol.info/standards/agent-pay); [Merces Atlas](https://atlas.merces.ai/p/mastercard-agent-pay/); [Digital Commerce 360](https://www.digitalcommerce360.com/2025/10/16/visa-mastercard-both-launch-agentic-ai-payments-tools/amp/)

**PayPal**
- PayPal's open-source agent toolkit has 199 stars (Apache-2.0, pushed 2026-09-01). — [paypal/agent-toolkit](https://github.com/paypal/agent-toolkit)
- PayPal announced "Agent Ready" on 28 Oct 2025 and it was reported live on Copilot and Perplexity in January 2026. **[secondary, unverified, possibly outdated]** — [No7 Software](https://no7software.co.uk/blog/visa-mastercard-paypal-agentic-ai-commerce-stack)

**Others**
- x402 (HTTP 402 stablecoin payments) now lives at `x402-foundation/x402` with 6,825 stars. — [x402 GitHub repo](https://github.com/x402-foundation/x402)
- A2A, one of UCP's transports, has 26,668 stars. — [A2A GitHub repo](https://github.com/a2aproject/A2A)

### Inferences
- For a project with no merchant or payment partner, the realistic transaction model is "discover and compose, then hand off": read products via Shopify's keyless UCP catalog, hold a cart or shortlist, and send the buyer to merchant checkout through `continue_url` or a permalink. This is also where OpenAI retreated to after Instant Checkout.
- In-surface payment is gated: Shopify permission, Stripe ACS preview plus per-seller agreements, Google waitlist, card-network agent approval. Link Agent Wallet is the one path that needs no merchant integration, but only for US and Canadian buyers.
- UCP has the momentum (daily commits, travel and food verticals in draft, Stripe on its Tech Council, Shopify's own endpoints rebuilt on it). ACP's last push was four months ago and its flagship use case was scaled back, so it is safer to treat ACP as a feed and checkout format to be compatible with, not the primary target.
- Hotel and ticket cards have less standard backing than product cards: only UCP's draft Booking capability covers lodging, and I found nothing for event tickets.

### Gaps
- No first-party Mastercard Agent Pay or PayPal Agent Ready developer documentation was reached; onboarding requirements for independent agents are unknown.
- How an agent becomes "Visa-approved" (onboarding steps, cost, eligibility) is not on the public overview page.
- Whether a third-party (non-Google) agent can transact with merchants integrated for Google's UCP surfaces is not stated by Google.
- Shopify's exact criteria for granting in-agent checkout permission, and published rate-limit numbers, were not found.
- One third-party guide in search results claimed a "ChatGPT Wallet" launched 13 Nov 2026 for US Pro users to pay on merchant checkout pages; I found no second source and no OpenAI page, so I did not include it as a finding.
- The UCP governance structure (who sits on the Tech Council beyond Stripe) was not confirmed from a primary source.
- OpenAI's current product-feed field list could not be fetched (the guessed guide URL returned 404).

---

## 2. Is there a standard schema for a "product card", cart or shortlist that agents emit, or a standard cart object passed between a human-facing UI and an agent?

### Takeaway
There is no standard for a rendered product card or a "shortlist", but there are now two near-identical standard cart objects (UCP `dev.ucp.shopping.cart` and ACP `Cart`) and two standard product data objects (UCP Catalog product/variant and the ACP feed `Product`). Host design guidelines from Claude and ChatGPT converge on the same visual card anatomy, which is the closest thing to a card standard.

### Cited Findings
- UCP Cart: required fields `ucp`, `id`, `line_items`, `currency`, `totals`; optional `context`, `signals`, `attribution`, `buyer`, `actions`, `messages`, `links`, `policies`, `continue_url`, `expires_at`. Operations: Create, Get, Update (full replacement), Cancel. A cart converts to checkout by passing `cart_id` to Create Checkout. — [UCP Cart spec](https://ucp.dev/latest/specification/shopping/cart/)
- UCP describes `continue_url` as enabling cart handoff, sharing and human-in-the-loop flows; platforms may display it to hand off to the business UI. The page carries a TODO on whether it should point to cart or checkout. — [UCP Cart spec](https://ucp.dev/latest/specification/shopping/cart/)
- ACP Cart (2026-04-17): required `id`, `line_items`, `currency`, `totals`; optional `buyer`, `messages`, `continue_url` ("URL for cart handoff, sharing, or session recovery"), `expires_at`. It is described as "a lightweight pre-checkout phase for item collection without payment configuration or status lifecycle." — [ACP schema.cart.json](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/spec/2026-04-17/json-schema/schema.cart.json)
- UCP Catalog product fields: `id`, `handle`, `title`, `description`, `url`, `categories`, `price_range`, `list_price_range`, `media`, `options`, `variants`, `rating`, `tags`, `metadata`. Variant fields add `sku`, `barcodes`, `price`, `list_price`, `unit_price`, `availability`, `seller`. The variant `id` is used as `item.id` in checkout. — [UCP Catalog spec](https://ucp.dev/latest/specification/shopping/catalog/)
- UCP display rules: the first media item and first variant are treated as featured; warnings with `presentation: "disclosure"` must be shown near the component and not hidden; catalog responses are not transactional commitments and checkout is authoritative. — [UCP Catalog spec](https://ucp.dev/latest/specification/shopping/catalog/)
- ACP feed schema defines `Description` (plain, html, markdown), `Price` (integer minor units plus ISO 4217 currency), `Availability` (`available`, `status` such as in_stock or preorder), `Barcode`, and `Media` (type, url, alt_text). — [ACP schema.feed.json](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/spec/2026-04-17/json-schema/schema.feed.json)
- Stripe's agent feed adds a per-product `disable_checkout` flag: `true` means discovery only, redirect to the seller's site. — [Stripe: Embed commerce into your AI interface](https://docs.stripe.com/agentic-commerce/agents/embedded.md?agent-checkout-mode=full)
- Claude's carousel guidance: 3 to 8 items, each card an image, a title, up to 3 lines of metadata and one optional CTA, with consistent dimensions; it names "product listings or search results" as the use case. — [Claude MCP Apps design guidelines](https://claude.com/docs/connectors/building/mcp-apps/design-guidelines)
- ChatGPT's carousel guidance is the same shape: 3 to 8 items, image required, one optional CTA per item, two actions maximum on an inline card. — [OpenAI Apps SDK UI guidelines](https://developers.openai.com/apps-sdk/concepts/ui-guidelines)
- AP2 defines no cart contents schema; it is agnostic to what the merchant-signed checkout contains. — [AP2 specification](https://ap2-protocol.org/ap2/specification/)

### Inferences
- A shopping canvas can adopt the UCP product/variant shape as its internal card model and the UCP/ACP cart shape as its selection payload. The two cart schemas share `id`, `line_items`, `currency`, `totals`, `buyer`, `messages`, `continue_url`, `expires_at`, so one internal type can serialize to both.
- "Shortlist", "compare set", "saved for later" and human annotations (notes, rankings, rejections) have no standard. This is an open design space, and UCP's `metadata`, `signals` and `context` fields are the natural extension points.
- Because a UCP cart is per business, a cross-merchant canvas has to hold one cart per merchant plus its own wrapper object.

### Gaps
- I did not read the UCP `line_items`, `signals`, `actions` or `attribution` sub-schemas, so their exact fields are unverified.
- I found no schema for hotel or ticket cards beyond the existence of UCP's draft Booking capability.
- I did not check schema.org or Google Merchant feed alignment for either spec.

---

## 3. Which chat hosts can render interactive third-party UI inline today, via which mechanism, and does it work on mobile?

### Takeaway
MCP Apps (extension `io.modelcontextprotocol/ui`, spec 2026-01-26) is the common mechanism: Claude web and desktop, ChatGPT, VS Code Copilot, Microsoft 365 Copilot, Cursor, Goose, Gemini Enterprise and others render it. Claude renders it on iOS and Android through a native WebView; ChatGPT's guidelines describe mobile rendering but I found no explicit platform statement; consumer Gemini relies on A2UI instead and Claude Code does not render MCP Apps.

### Cited Findings

**MCP Apps (the standard)**
- MCP Apps is SEP-1865, identifier `io.modelcontextprotocol/ui`. A tool declares `_meta.ui.resourceUri` pointing at a predeclared `ui://` resource of type `text/html;profile=mcp-app`; the host renders it in a sandboxed iframe and talks to it with JSON-RPC over postMessage. Hosts without support fall back to the plain tool result. — [MCP Apps spec 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
- The official `ext-apps` repo (spec plus SDK) has 3,152 stars, was pushed 2026-11-10, and its `package.json` is at version 2.1.0. It ships starter templates for React, Vue, Svelte, Preact, Solid and vanilla JS, and agent skills including `migrate-oai-app`. — [modelcontextprotocol/ext-apps](https://github.com/modelcontextprotocol/ext-apps)
- The community-maintained client matrix marks MCP Apps as supported in: Claude (web), Claude Desktop, VS Code GitHub Copilot, Microsoft 365 Copilot, Goose, Postman, MCPJam, ChatGPT, Cursor, Archestra.AI, PostHog Code, Kiro Crew, Glean and mcp-use; MCP Inspector is partial; Claude Code is not marked. — [MCP extension support matrix](https://modelcontextprotocol.io/extensions/client-matrix)
- Goose (open-source agent, now at `aaif-goose/goose`) has 56,929 stars. — [Goose GitHub repo](https://github.com/aaif-goose/goose)

**Claude**
- Interactive connectors are available on Claude, Cowork, Claude Desktop and the iOS/Android apps for all users. — [Claude Help Center: Use interactive connectors](https://support.claude.com/en/articles/13454812-use-interactive-connectors-in-claude)
- On mobile Claude renders apps in `WKWebView` (iOS) and `WebView` (Android). Display options are inline card, inline carousel, side panel (web and desktop, limited set of organizations) and full screen; Claude offers the `inline` and `fullscreen` modes. — [Claude MCP Apps design guidelines](https://claude.com/docs/connectors/building/mcp-apps/design-guidelines)
- On 10 November 2026 Anthropic expanded support on web and desktop for all plans: apps can open beside the chat or full screen, Claude can act inside them through app tools, and embedded sites are supported; developer support is public preview. Shopify is listed as "in development". Mobile is not mentioned for these newer features. — [Anthropic blog](https://claude.com/blog/interactive-connectors-full-tool)
- Custom connectors (a user pastes an MCP server URL) share the same runtime as directory connectors with no Anthropic review; they get no in-product discovery, always show the external-link confirmation modal, and can be shared with a prefilled install link. Claude may mark a custom connector's open MCP Apps "Unverified". — [Claude docs: Directory vs custom connectors](https://claude.com/docs/connectors/building/directory-vs-custom)
- Local stdio servers render MCP Apps in Claude Desktop, but app tools, entry points and embedded websites need a remote server; for directory connectors, entry points and embedded sites need a Verified listing. — [Claude docs: Get started with MCP Apps](https://claude.com/docs/connectors/building/mcp-apps/getting-started)

**ChatGPT**
- ChatGPT implements the MCP Apps standard; `window.openai` is an alias layer plus ChatGPT-only extras (`requestCheckout`, `uploadFile`, `requestModal`, `widgetState`). Display modes: inline card, inline carousel, fullscreen, picture-in-picture. — [OpenAI: MCP Apps in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt)
- The UI guidelines reference iOS and Android (system fonts per platform; cards auto-fit "up to the mobile display area's height"). — [OpenAI Apps SDK UI guidelines](https://developers.openai.com/apps-sdk/concepts/ui-guidelines)
- OpenAI's help center says availability "depends on the app, your ChatGPT plan, region, workspace, role, model, and ChatGPT interface", and notes that very old mobile versions show "Apps" instead of "Plugins". — [OpenAI Help Center](https://help.openai.com/en/articles/12503483-apps-in-chatgpt-and-the-apps-sdk)
- Developer mode with full MCP for unpublished apps is described for Business and Enterprise/Edu on ChatGPT web. **[secondary, unverified]** — [OpenAI Help Center: Developer mode](https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt)
- OpenAI's example repos: `openai-apps-sdk-examples` 2,402 stars (last push 2026-04-15, **[possibly outdated]**) and `apps-sdk-ui` 1,082 stars. — [openai-apps-sdk-examples](https://github.com/openai/openai-apps-sdk-examples); [apps-sdk-ui](https://github.com/openai/apps-sdk-ui)

**Google: Gemini and A2UI**
- Gemini Enterprise renders MCP Apps in the chat flow in a sandboxed iframe that can expand to fullscreen or a side panel; setup requires Cloud Run, OAuth and an org-policy override (19 Oct 2026). The post covers Gemini Enterprise only. — [Google Cloud Blog](https://cloud.google.com/blog/topics/developers-practitioners/devs-guide-to-mcp-apps-in-gemini/)
- A2UI 1.0 was announced on 11 November 2026 as the first stable version: a declarative protocol where the agent picks and configures components the client has registered, with renderers for React, Angular, Lit, Flutter, SwiftUI and Jetpack Compose (Compose still on 0.9.1). Gemini lets organizations register A2UI agents and supports 0.9.1 today; Gemini Enterprise is upgrading to 1.0. The web and Flutter renderers also run inside MCP Apps. Named adopters: Atlassian, Alation, Bloomberg, ByteDance. — [Google Developers Blog: A2UI 1.0](https://developers.googleblog.com/en/a2ui-10-build-delightful-fast-reliable-agentic-experiences/)
- The A2UI repo moved to `a2ui-project/a2ui` and has 18,502 stars. A search summary reported its README still calling v1.0 a release candidate, which conflicts with the blog. — [a2ui GitHub repo](https://github.com/a2ui-project/a2ui)
- Google describes A2UI over MCP as a native-rendering alternative to MCP Apps that avoids the iframe. **[secondary, unverified]** — [Google Developers Blog: A2UI and MCP Apps](https://developers.googleblog.com/en/a2ui-and-mcp-apps/)

**MCP-UI**
- MCP-UI was standardized into MCP Apps. Its packages are now positioned as the recommended MCP Apps client SDK (`@mcp-ui/client`) plus server utilities and a legacy adapter. 5,276 stars, last push 2026-09-16. — [mcpui.dev](https://mcpui.dev/); [MCP-UI GitHub repo](https://github.com/MCP-UI-Org/mcp-ui)

**Frameworks for building once and shipping to several hosts**
- Skybridge (2,203 stars) and mcp-use (11,005 stars) are full-stack frameworks targeting both MCP Apps and ChatGPT apps. — [alpic-ai/skybridge](https://github.com/alpic-ai/skybridge); [mcp-use](https://github.com/mcp-use/mcp-use)
- Anthropic's docs say one codebase can run in Claude and other hosts by registering with `registerAppTool()` and `registerAppResource()`; the per-host difference is `ui.domain`. — [Claude docs: Get started with MCP Apps](https://claude.com/docs/connectors/building/mcp-apps/getting-started)

**Real-world reports** (individual blogs, treat as anecdote)
- A developer shipping to both hosts reports: relative asset paths fail silently in the sandbox so everything is inlined; ChatGPT fills `structuredContent` while Claude tends to return a JSON string in `content`; tool-name slugs passed to `callTool()` differ by host; apps must send `ui/notifications/size-changed` or get clipped. **[possibly outdated, 31 March 2026]** — [MCPBundles blog](https://mcpbundles.com/blog/mcp-apps-what-breaks-between-chatgpt-and-claude)
- Other write-ups report ChatGPT streaming partial tool inputs that pass schema validation, a July 2026 ChatGPT mobile regression where a widget did not draw after a prior tool call, and custom apps intermittently disappearing. **[secondary, unverified]** — [sunpeak](https://sunpeak.ai/blogs/chatgpt-apps-what-i-wish-i-knew/); [monday engineering](https://engineering.monday.com/from-prompts-to-clicks-shipping-mcp-apps-in-production/)

### Inferences
- One MCP server with a single MCP App is the highest-leverage build for a small open-source project: it reaches Claude (including phones), ChatGPT, Copilot surfaces, Cursor and Goose without per-host UI code, and users can add it as a custom connector with no directory review.
- The "canvas" ambition collides with inline limits. Both hosts cap inline to a small card or an 8-item carousel, so a real compare-and-arrange canvas has to request fullscreen (or Claude's side panel on web and desktop).
- Mobile parity is partial: Claude documents mobile explicitly, while its November 2026 side panel and app-tool features are web and desktop only. ChatGPT mobile behaviour should be tested, not assumed.
- Consumer Gemini is the gap for MCP Apps; reaching it means an A2UI agent, which is a different (declarative, no custom HTML) model.

### Gaps
- No primary statement found that ChatGPT apps render on iOS and Android for all plans, or on current EU availability.
- Whether Claude custom connectors render MCP Apps on mobile exactly as directory connectors do is not stated explicitly.
- Whether the consumer Gemini app renders MCP Apps at all was not confirmed.
- A search summary said MCP Apps reached "Final" in an MCP 2026-07-28 release; I did not verify this against the spec site.
- Microsoft 365 Copilot and Cursor support is taken from the matrix only; I did not read their docs for limits or mobile behaviour.

---

## 4. How can a UI rendered by an MCP server send a user's selection back to the model, and what are the limits?

### Takeaway
An MCP App has three standard channels back: call server tools directly (`tools/call`), silently update what the model knows (`ui/update-model-context`), or post a user-role message that triggers a turn (`ui/message`). The practical limits are host consent on messages, an overwrite-only context slot, no durable widget state, a default-deny CSP, capped inline height, and host-mediated links.

### Cited Findings

**Channels**
- View-to-host requests defined by the spec: `tools/call`, `ui/message`, `ui/update-model-context`, `ui/open-link`, `ui/request-display-mode`. Host-to-view notifications include `ui/notifications/tool-input` and `ui/notifications/tool-result`. — [MCP Apps spec 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
- `ui/update-model-context` takes `content` and/or `structuredContent`; "Each request overwrites the previous context sent by the View"; hosts may defer it to the next user message and should send only the last update. — [MCP Apps spec 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
- OpenAI calls `ui/update-model-context` "the portable way to send selections or staged edits to the model". — [OpenAI: MCP Apps in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt)
- Tool visibility: `visibility` defaults to `["model","app"]`; a tool marked `["app"]` is hidden from the model and callable only by the app from the same server; cross-server calls are blocked for app-only tools. — [MCP Apps spec 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
- In Claude, `app.sendMessage` arrives as `ui/message`, and Claude acts only with user agreement: it either asks to allow the message or places the text in the user's message box, sometimes with a caution banner. Limits: text blocks only, at most 8,000 characters, no invisible characters, send on user action and not on a timer; a no-error result does not prove the user agreed. — [Claude docs: Send messages from your MCP App](https://claude.com/docs/connectors/building/mcp-apps/send-messages)
- Claude's "app tools" (public preview, remote servers) let the model call tools registered in the app's UI to change what the view shows, such as the selected rows. — [Claude docs: Get started with MCP Apps](https://claude.com/docs/connectors/building/mcp-apps/getting-started)
- ChatGPT adds `widgetState`/`setWidgetState`, which OpenAI says "is not a source of truth or durable storage". — [OpenAI: MCP Apps in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt)

**Limits**
- Persistence: "When your app loads again, it starts from your HTML, so store on your server anything that you need to keep." — [Claude MCP Apps design guidelines](https://claude.com/docs/connectors/building/mcp-apps/design-guidelines)
- CSP: all external origins are blocked by default; origins are declared per resource in `_meta.ui.csp` as `connectDomains`, `resourceDomains`, `frameDomains`. The spec's reference policy is `default-src 'none'`, `frame-src 'none'` unless declared, `object-src 'none'`. — [Claude MCP Apps design guidelines](https://claude.com/docs/connectors/building/mcp-apps/design-guidelines); [MCP Apps spec 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
- Sandbox: web hosts must load the view through a sandbox proxy on a different origin. In Claude the origin is the first 32 hex characters of SHA-256 of the server URL plus `.claudemcpcontent.com`. — [MCP Apps spec 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx); [Claude docs: Get started with MCP Apps](https://claude.com/docs/connectors/building/mcp-apps/getting-started)
- Nested iframes: ChatGPT blocks them by default, requires `frameDomains` plus a written justification at review, and may slow or reject approval. Claude loads embedded sites for custom connectors only after the person allows them in a conversation. — [OpenAI: MCP Apps in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt); [Claude docs: Directory vs custom connectors](https://claude.com/docs/connectors/building/directory-vs-custom)
- Size and scrolling: inline height auto-fits and is capped; on mobile, vertical pans inside an inline app scroll the conversation, and overflow is clipped. An app needing its own scroll must request fullscreen. — [Claude MCP Apps design guidelines](https://claude.com/docs/connectors/building/mcp-apps/design-guidelines)
- Display modes: the spec defines `inline`, `fullscreen`, `pip`; the host returns the mode actually granted. Claude offers inline and fullscreen; ChatGPT adds PiP. — [MCP Apps spec 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx); [OpenAI Apps SDK UI guidelines](https://developers.openai.com/apps-sdk/concepts/ui-guidelines)
- Links out: `ui/open-link` asks the host to open a URL and can be denied; Claude always shows the confirmation modal for custom connectors, and directory connectors can allowlist destinations. — [MCP Apps spec 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx); [Claude docs: Directory vs custom connectors](https://claude.com/docs/connectors/building/directory-vs-custom)
- Device features: on Android, apps get no camera, microphone or location; menus and popovers can be clipped by the container. — [Claude MCP Apps design guidelines](https://claude.com/docs/connectors/building/mcp-apps/design-guidelines)
- Caching: in ChatGPT the resource URI acts as a cache key, so breaking UI changes need a new URI. — [OpenAI: MCP Apps in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt)
- Permission to render: Claude asks the user to allow displaying an app ("Allow once" or "Always allow") unless the permission setting is Auto. — [Claude docs: Get started with MCP Apps](https://claude.com/docs/connectors/building/mcp-apps/getting-started)
- Timing: Google's Gemini Enterprise guide tells developers to keep tool responses under 2 seconds and poll a `get_app_state` tool for longer work; the MCP Apps SDK stops waiting on `sendMessage` after 60 seconds by default. — [Google Cloud Blog](https://cloud.google.com/blog/topics/developers-practitioners/devs-guide-to-mcp-apps-in-gemini/); [Claude docs: Send messages from your MCP App](https://claude.com/docs/connectors/building/mcp-apps/send-messages)

### Inferences
- The robust pattern for "human selects, agent continues" is: every click writes to the server through an app-only tool (durable, cross-device), the view mirrors the current selection into `ui/update-model-context` (so the next turn sees it), and one explicit button ("Ask the agent about these 3") uses `ui/message`. Relying on `ui/message` alone is fragile because Claude gates it on consent.
- Because model context is a single overwrite slot, the view should send a compact snapshot of the whole shortlist each time, not deltas.
- Server-side canvas state keyed by a session ID is effectively mandatory; it is also what makes the same canvas reachable from a hosted link (question 5).
- Product images need their CDN origins in `resourceDomains`. A canvas aggregating many merchants cannot enumerate every image host, so it will likely need an image proxy on one declared origin.

### Gaps
- No documented byte limit for `ui/update-model-context` payloads or for the HTML resource was found for either host.
- Whether older widget instances in a long conversation keep receiving updates was not read (Claude has an "instance supersession" page I did not open).
- Exact ChatGPT consent behaviour for `ui/message` (`sendFollowUpMessage`) was not verified.

---

## 5. What are the practical ways for an agent that cannot render inline UI to hand a user a rich surface?

### Takeaway
The standard fallback is a URL: both commerce specs define `continue_url` on carts for exactly this, MCP Apps degrade to text so a tool can return a link, and Claude artifacts can be shared by link. A self-hosted canvas page can be built with tldraw, json-render, A2UI renderers or AG-UI and reached by any agent through plain MCP tools.

### Cited Findings

**Link-based handoff**
- UCP and ACP carts both carry a `continue_url` meant for handoff, sharing and session recovery. — [UCP Cart spec](https://ucp.dev/latest/specification/shopping/cart/); [ACP schema.cart.json](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/spec/2026-04-17/json-schema/schema.cart.json)
- Shopify's default handoff is Cart and Checkout Permalinks, one store per permalink, built from the store's `/.well-known/ucp` profile. — [Shopify: Checkout for agents](https://shopify.dev/docs/agents/checkout)
- If a host does not support MCP Apps, a tool with a UI resource "behaves as standard tool (text-only fallback)". — [MCP Apps spec 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
- The MCP docs note the trade-off: a standalone web app sent as a link "would need its own API, authentication, and state management". — [MCP Apps overview](https://modelcontextprotocol.io/extensions/apps/overview)

**Claude artifacts**
- Artifacts start private; "anyone with the link" sharing is on all plans, and published chat artifacts can be viewed without a Claude account and embedded on allowed domains. Limits: artifacts that connect to other websites cannot be shared by link; link-only viewers cannot use parts that call Claude or connectors; connector data uses the viewer's own connections; sharing settings cannot be changed from iOS or Android. — [Claude Help Center: Publishing and sharing artifacts](https://support.claude.com/en/articles/9547008-publishing-and-sharing-artifacts)
- Claude MCP App "entry points" let people open an app from the Artifacts page without asking Claude, and pin it to the sidebar. — [Claude docs: Get started with MCP Apps](https://claude.com/docs/connectors/building/mcp-apps/getting-started)

**Building blocks for a self-hosted canvas**
- tldraw: infinite-canvas React SDK, 51,564 stars. The agent starter kit gives an agent canvas read access (screenshot plus simplified shape formats) and write access through `AgentActionUtil` actions, supports Anthropic, OpenAI and Google models, and allows custom shapes. The fetch reported the docs page as last edited Sep 2024, so details may lag. — [tldraw GitHub repo](https://github.com/tldraw/tldraw); [tldraw agent starter kit](https://tldraw.dev/starter-kits/agent)
- tldraw licensing: the SDK is free in development; production use needs a license key (100-day trial, then an annual license). Starter kit code itself is described as MIT. **[secondary, unverified]** — [tldraw SDK license](https://tldraw.dev/legal/tldraw-license); [tldraw pricing](https://tldraw.dev/pricing)
- tldraw shipped its own MCP App (first in Cursor on 3 March 2026, later live in Claude, with a ChatGPT listing); it exposes create, edit and delete shape tools and the agent can see the user's edits. **[secondary, unverified]** — [tldraw blog: MCP App](https://tldraw.dev/blog/tldraw-mcp-app); [Claude connector listing](https://claude.com/connectors/tldraw)
- json-render (Vercel Labs, 19,824 stars, created Jan 2026, Apache-2.0): the developer defines a component catalog with Zod schemas, the model emits JSON constrained to it, components stream in progressively, and props bind to state and actions. — [json-render.dev](https://json-render.dev/); [json-render GitHub repo](https://github.com/vercel-labs/json-render)
- Vercel AI SDK (28,172 stars): generative UI means mapping typed tool parts (`tool-${toolName}`) in `useChat` messages to React components. — [AI SDK docs](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces); [vercel/ai](https://github.com/vercel/ai)
- AG-UI (21,514 stars, MIT) is an event-based agent-to-frontend protocol with shared state, interrupts for human approval, and frontend tool calls; it has integrations for LangGraph, CrewAI, Google ADK, Microsoft Agent Framework, AWS Strands, Mastra, Pydantic AI and others, and lists A2UI and MCP Apps as supported generative-UI specs. CopilotKit (38,943 stars) is its first-party client. — [AG-UI docs](https://docs.ag-ui.com/introduction); [AG-UI GitHub repo](https://github.com/ag-ui-protocol/ag-ui); [CopilotKit GitHub repo](https://github.com/CopilotKit/CopilotKit)
- Other generative-UI libraries by star count: assistant-ui 13,399, Tambo 11,224, OpenUI (formerly thesys Crayon) 15,480. — [assistant-ui](https://github.com/assistant-ui/assistant-ui); [tambo](https://github.com/tambo-ai/tambo); [openui](https://github.com/thesysdev/openui)

### Inferences
- A single hosted canvas URL can serve every agent: hosts with MCP Apps embed it (or a slim view of it), and text-only agents (Claude Code, CLI agents, API agents, messaging bots) return the link. The agent reads the human's selection back with an ordinary MCP tool such as `get_canvas_state`, which is the same polling pattern Google recommends.
- Claude artifacts are a weak fit for a shopping canvas because an artifact that calls external sites cannot be link-shared and loses its AI and connector features for link-only viewers.
- tldraw is the most capable canvas but its production license is a real constraint for an open-source project; a card grid built on json-render or plain React avoids it.
- A2UI and json-render suit agent-composed layouts from a fixed card catalog; MCP Apps and tldraw suit a persistent, human-arranged board. A shopping canvas probably needs the second with a catalog of card types inside it.

### Gaps
- No standard exists for an agent to be notified when a human finishes on a hosted page (MCP Events was listed as an extension but I did not research it).
- I did not verify tldraw's current SDK version or whether its license terms changed in 2026.
- ChatGPT canvas or shared-link equivalents to Claude artifacts were not researched.

---

## 6. What security and trust concerns apply?

### Takeaway
Product content is an attack surface (injection through listings and reviews is demonstrated against current agents), embedded UI is treated as untrusted by hosts, and payment credentials are being kept away from both the model and the agent developer by design. Agent identity is handled with signed requests (Visa TAP, Web Bot Auth) and signed mandates (AP2).

### Cited Findings

**Prompt injection through product content**
- July 2026 research on "agent data injection" corrupted structured data that agents trust; in one demo a planted product review reused a real button's ID so an agent clicked "Buy Now" instead of "Read More". A provenance-tracking defence blocked all attacks but left agents completing about a third of ordinary tasks. — [The Hacker News](https://thehackernews.com/2026/07/new-agent-data-injection-attack-can.html)
- An arXiv paper reports in-page injections already deployed at scale, with a small set of reusable templates behind 95% of instances. **[secondary, unverified; April 2026]** — [arXiv 2604.27202](https://arxiv.org/pdf/2604.27202)
- Unit 42 describes scenario attacks on agentic commerce such as hidden line items added to a cart (analysis, not measured incidents). — [Palo Alto Networks Unit 42](https://unit42.paloaltonetworks.com/retail-fraud-agentic-ai/)
- Hosts filter what a UI can inject: Claude refuses app messages with invisible characters and shows a caution above app-supplied prompt text. — [Claude docs: Send messages from your MCP App](https://claude.com/docs/connectors/building/mcp-apps/send-messages)
- UCP tells platforms they may refuse non-https media URLs, must sandbox external video players, and must not hide `disclosure` warnings. — [UCP Catalog spec](https://ucp.dev/latest/specification/shopping/catalog/)
- Shopify labels AI-inferred catalog fields as `Inferred`. — [Shopify: About Catalogs](https://shopify.dev/docs/agents/catalog)

**Embedded UI trust**
- The MCP Apps threat model lists malicious HTML, sandbox escape, unauthorized tool execution, data exfiltration, and phishing or social engineering. Mitigations are mandatory iframe sandboxing, auditable JSON-RPC, predeclared resources, and CSP enforcement; the spec concedes "UI can still display misleading content". — [MCP Apps spec 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
- ChatGPT review checks declared CSP against actual behaviour; custom connectors in Claude may be shown as "Unverified". — [OpenAI: MCP Apps in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt); [Claude docs: Directory vs custom connectors](https://claude.com/docs/connectors/building/directory-vs-custom)

**Payment credential handling**
- ChatGPT apps cannot collect new payment credentials; saved methods can be shown only for eligible physical goods. — [OpenAI: MCP Apps in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt)
- Stripe requires agents to collect payment details through Stripe Elements, mints the Shared Payment Token itself with usage limits scoped to the seller, and asks for risk signals (Radar session or device metadata) on confirm. — [Stripe: Embed commerce into your AI interface](https://docs.stripe.com/agentic-commerce/agents/embedded.md?agent-checkout-mode=full)
- Link Agent Wallet issues a one-time-use credential only after the customer approves a specific spend request. — [Stripe: Link Agent Wallet](https://docs.stripe.com/agentic-commerce/agents/link-agent-wallet)
- A2UI 1.0 says the server binds data and child components "so sensitive values never reach the model". — [Google Developers Blog: A2UI 1.0](https://developers.googleblog.com/en/a2ui-10-build-delightful-fast-reliable-agentic-experiences/)

**Agent identity and authorization**
- Visa TAP signatures include timestamps, a session identifier and key ID, and are bound to the merchant domain and operation to prevent replay. — [visa/trusted-agent-protocol](https://github.com/visa/trusted-agent-protocol)
- AP2 binds user consent cryptographically: open mandates express user-signed constraints, closed mandates the final transaction; in Human Not Present mode the agent signs closed mandates within those constraints. — [AP2 specification](https://ap2-protocol.org/ap2/specification/)
- Shopify scales access and rate limits with how the agent identifies itself, and its browser-side Checkout WebMCP uses Web Bot Auth. — [Shopify: Checkout for agents](https://shopify.dev/docs/agents/checkout)
- UCP states catalog responses "are not transactional commitments"; checkout is authoritative. — [UCP Catalog spec](https://ucp.dev/latest/specification/shopping/catalog/)

**Regulatory exposure**
- Stripe warns agents that combine discovery and purchase may be marketplace facilitators with tax collection duties. — [Stripe: Embed commerce into your AI interface](https://docs.stripe.com/agentic-commerce/agents/embedded.md?agent-checkout-mode=full)

### Inferences
- A canvas that renders merchant-supplied titles, descriptions and reviews should treat them as untrusted in two directions: escape them in the UI, and keep them out of anything sent to the model as instructions (send IDs and the human's choices through `ui/update-model-context`, not raw listing text).
- A human-facing canvas is itself a mitigation: it is the "trusted surface" where the person sees exact items, prices and merchant before anything is bought, which is the role AP2 names explicitly.
- Staying on the hand-off side of checkout keeps an independent project out of PCI scope, marketplace-facilitator status and card-network agent programmes.
- The social-engineering risk the MCP spec admits applies to a shopping canvas too: a look-alike canvas from a malicious server could show fake prices or links, so clear merchant attribution and host-mediated link opening matter.

### Gaps
- A cited benchmark of 3,168 attacked shopping runs with 42 to 68% injection success came from a promotional LinkedIn post and could not be traced to its source, so it is not included as a finding.
- I found no published guidance from any commerce protocol on sanitizing product text before it reaches a model.
- I did not research consumer-protection or liability rules for agent-initiated purchases, or the IETF status of Web Bot Auth.
