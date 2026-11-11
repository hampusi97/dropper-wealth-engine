/**
 * scripts/build-feeds.mjs — Google Merchant Center RSS 2.0 product feeds, one per store.
 * Spec: https://support.google.com/merchants/answer/160589 (id, title, description,
 * link, image_link, availability, price, brand, condition, google_product_category, mpn).
 * Image links point at the Shopify CDN path the importer writes; swap to real
 * product images after the catalog import (see scripts/import-catalog.mjs).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { STORES, buildCatalog } from "./data/stores.mjs";

mkdirSync("public/feeds", { recursive: true });
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const CATEGORY = {
  "Gift Box": "Home & Garden > Gift Baskets",
  "Skincare Device": "Health & Beauty > Personal Care > Cosmetics > Skin Care",
  Consumables: "Health & Beauty > Personal Care > Cosmetics > Skin Care",
  Skincare: "Health & Beauty > Personal Care > Cosmetics > Skin Care",
  "Device Parts": "Health & Beauty > Personal Care > Cosmetics > Skin Care",
  Tools: "Health & Beauty > Personal Care > Cosmetics > Skin Care",
  Education: "Media > Books",
  "Cold Therapy": "Health & Beauty > Health Care > Hot & Cold Therapies",
  Sleep: "Home & Garden > Linens & Bedding > Bedding",
  Recovery: "Health & Beauty > Health Care > Massage & Relaxation",
  Accessories: "Luggage & Bags > Luggage Accessories",
  "Body Device": "Health & Beauty > Personal Care > Massage & Relaxation",
  Tracking: "Health & Beauty > Health Care",
  "Math Manipulatives": "Toys & Games > Toys > Educational Toys > Math Toys",
  Sensory: "Toys & Games > Toys > Educational Toys",
  Math: "Toys & Games > Toys > Educational Toys > Math Toys",
  STEM: "Toys & Games > Toys > Educational Toys",
  Literacy: "Toys & Games > Toys > Educational Toys",
  Planner: "Office Supplies > Calendars & Planners > Planners",
  Notebooks: "Office Supplies > Paper > Notebooks & Notepads",
  Desk: "Office Supplies > Office Accessories",
  Stationery: "Office Supplies > Paper",
  Storage: "Office Supplies > Filing & Storage",
  Consumables2: "Office Supplies",
  Circadian: "Home & Garden > Lighting",
  Travel: "Luggage & Bags > Luggage Accessories",
  Brewing: "Home & Garden > Kitchen & Dining > Coffee & Tea",
  Posture: "Health & Beauty > Health Care > Supports & Braces",
  "Dog Beds": "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Beds",
  "Bed Parts": "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Beds",
  Enrichment: "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Toys",
  Health: "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Health Care",
  Beds: "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Beds",
  Calming: "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Apparel",
  Grooming: "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Grooming Supplies",
  Luggage: "Luggage & Bags > Backpacks",
  Packing: "Luggage & Bags > Luggage Accessories > Packing Organizers",
  Diffusers: "Home & Garden > Decor > Home Fragrances > Fragrance Oil Burners",
  Oils: "Home & Garden > Decor > Home Fragrances > Air Fresheners",
  Training: "Sporting Goods > Exercise & Fitness > Strength Training",
  "Desk Lighting": "Home & Garden > Lighting > Lamps",
  "Deep Work": "Office Supplies > Office Accessories",
  "Plant Lighting": "Home & Garden > Lighting > Grow Lights",
  Propagation: "Home & Garden > Plants",
  Planters: "Home & Garden > Decor > Vases",
  Plants: "Home & Garden > Plants",
  "Board Games": "Toys & Games > Games > Board Games",
  Books: "Media > Books",
  Games: "Toys & Games > Games",
  Home: "Home & Garden > Decor",
  "Utah Finds": "Home & Garden > Decor",
  "Desk Lighting ": "Home & Garden > Lighting > Lamps",
};

let total = 0;
for (const store of STORES) {
  const rows = buildCatalog(store);
  const items = rows.map((p) => {
    const cat = CATEGORY[p.category] || "Home & Garden";
    return `    <item>
      <g:id>${esc(p.sku)}</g:id>
      <g:title>${esc(p.title)}</g:title>
      <g:description>${esc(p.summary)}</g:description>
      <g:link>https://${store.domain}/products/${p.handle}</g:link>
      <g:image_link>https://cdn.shopify.com/s/files/1/0000/${esc(store.id)}/${esc(p.handle)}.jpg</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${p.price.toFixed(2)} USD</g:price>
      <g:sale_price>${p.price.toFixed(2)} USD</g:sale_price>
      <g:brand>${esc(store.name)}</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>${esc(cat)}</g:google_product_category>
      <g:product_type>${esc(p.category)}</g:product_type>
      <g:mpn>${esc(p.sku)}</g:mpn>
      <g:identifier_exists>yes</g:identifier_exists>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard</g:service>
        <g:price>${p.price >= 65 ? "0.00" : "5.95"} USD</g:price>
      </g:shipping>
      <g:custom_label_0>${esc(store.id)}</g:custom_label_0>
    </item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(store.name)} — Google Shopping feed</title>
    <link>https://${store.domain}</link>
    <description>${esc(store.positioning)}</description>
${items.join("\n")}
  </channel>
</rss>
`;
  writeFileSync(`public/feeds/google-shopping-${store.id}.xml`, xml);
  total += items.length;
  // digital add-on gets its own feed item in the same file family
}
writeFileSync("public/feeds/index.json", JSON.stringify({
  generatedAt: new Date().toISOString(),
  feedCount: STORES.length,
  itemCount: total,
  feeds: STORES.map((s) => ({ store: s.id, url: `https://${s.domain}/feeds/google-shopping-${s.id}.xml`, local: `public/feeds/google-shopping-${s.id}.xml`, items: 12 })),
}, null, 2));
console.log(`feeds: ${STORES.length} files, ${total} items`);
