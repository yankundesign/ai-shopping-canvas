// The sample canvas: eight real products, shared by the dev pages and the prompt tests.
// Real links. The weights and fits in the dev host are made up for the sample.

const src = (u) => ({ source: u });
export const SAMPLE = [
  { link: "https://www.zappos.com/p/mens-keen-targhee-iv-waterproof-sea-turtle-roasted-pecan/product/9955906/color/1096579", name: "KEEN Targhee IV Waterproof", price: 169.99, store: "Zappos", photo_url: "https://m.media-amazon.com/images/I/71X8MF1pf2L._SX700_.jpg", details: [{ name: "Waterproof", value: "Yes, KEEN.DRY", ...src("https://www.keenfootwear.com") }] },
  { link: "https://www.salomon.com/en-us/product/x-ultra-360-gore-tex-li5205/L47865300", name: "Salomon X Ultra 360 GTX", price: 155, store: "Salomon", details: [{ name: "Waterproof", value: "Yes, Gore-Tex", ...src("https://www.salomon.com/en-us/product/x-ultra-360-gore-tex-li5205/L47865300") }] },
  { link: "https://obozfootwear.com/products/mens-sawtooth-x-low-waterproof", name: "Oboz Sawtooth X Low WP", price: 150, details: [{ name: "Waterproof", value: "Yes, B-DRY", ...src("https://obozfootwear.com/products/mens-sawtooth-x-low-waterproof") }] },
  { link: "https://www.merrell.com/US/en/moab-3-waterproof/52474M.html", name: "Merrell Moab 3 Waterproof", price: 140, store: "Merrell", details: [{ name: "Waterproof", value: "Yes", ...src("https://www.merrell.com/US/en/moab-3-waterproof/52474M.html") }] },
  { link: "https://www.adidas.com/us/terrex-skychaser-ax5-gore-tex-hiking-shoes/JQ2210.html", name: "adidas Terrex Skychaser AX5 GORE-TEX", price: 90, store: "adidas", photo_url: "https://cdn.shopify.com/s/files/1/0603/3031/1875/files/JQ2210-1.jpg", details: [{ name: "Waterproof", value: "Yes, Gore-Tex", ...src("https://www.adidas.com/us/terrex-skychaser-ax5-gore-tex-hiking-shoes/JQ2210.html") }] },
  { link: "https://www.backcountry.com/keen-hightrail-waterproof-hiking-shoe-mens?skid=KENZ5RD-BLAVAP-S110", name: "KEEN Hightrail Waterproof", price: 108.71, store: "Backcountry", photo_url: "https://cdn.shopify.com/s/files/1/2344/9313/files/120e7bd38d2d5556d206488a68476233d8179d11.webp", details: [{ name: "Waterproof", value: "Yes, KEEN.DRY", ...src("https://www.keenfootwear.com") }] },
  { link: "https://www.backcountry.com/columbia-crestwood-waterproof-hiking-shoe-mens?skid=COLZCUL-GRADARADO-S110", name: "Columbia Crestwood Waterproof", price: 67.5, store: "Backcountry", details: [{ name: "Waterproof", value: "Yes, Omni-Tech" }] },
  { link: "https://obozfootwear.com/products/not-a-real-shoe-for-testing", name: "Made-up shoe (page not found)", price: 99, details: [{ name: "Waterproof", value: "Yes" }] },
];
export const SAMPLE_TITLE = "Waterproof hiking shoes under $150";
