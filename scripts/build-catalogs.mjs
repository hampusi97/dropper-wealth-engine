/**
 * scripts/build-catalogs.mjs — 180 products (12/store) as CSV + JSON,
 * plus 15 digital add-ons and 15 subscription plans in one fleet file.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { STORES, buildCatalog, round2 } from "./data/stores.mjs";

mkdirSync("catalogs", { recursive: true });
const HEAD = ["sku","title","handle","category","price","compare_at_price","cost","margin_percent","margin_usd","tier2_price","tier2_save","tier3_price","tier3_save","summary","is_hero"];
const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
let total = 0;
const digital = [];
const subs = [];
const all = [];

for (const store of STORES) {
  const rows = buildCatalog(store);
  total += rows.length;
  const csv = [HEAD.join(",")].concat(
    rows.map((r) => [r.sku, r.title, r.handle, r.category, r.price.toFixed(2), r.compareAt.toFixed(2), r.cost.toFixed(2), r.marginPercent, r.marginUSD.toFixed(2), r.bundle.tier2.price.toFixed(2), "15%", r.bundle.tier3.price.toFixed(2), "25%", r.summary, r.isHero].map(q).join(","))
  ).join("\n");
  writeFileSync(`catalogs/${store.id}.csv`, csv + "\n");
  writeFileSync(`catalogs/${store.id}.json`, JSON.stringify({
    storeId: store.id, storeName: store.name, domain: store.domain, niche: store.niche,
    skuPrefix: store.skuPrefix, fulfillment: store.fulfillment, generatedAt: new Date().toISOString(),
    productCount: rows.length, products: rows,
  }, null, 2));
  all.push(...rows.map((r) => ({ ...r, storeId: store.id })));

  digital.push({ storeId: store.id, sku: `${store.skuPrefix}DIG-01`, productType: "Digital", cogs: 0, marginPercent: 100, ...store.digital, deliverable: "instant email download" });
  subs.push({ storeId: store.id, sku: `${store.skuPrefix}SUB-01`, ...store.subscription, annualValue: round2(store.subscription.price * (store.subscription.cadence === "month" ? 12 : 4)) });
}

writeFileSync("catalogs/_fleet-digital-addons.json", JSON.stringify({ generatedAt: new Date().toISOString(), count: digital.length, items: digital }, null, 2));
writeFileSync("catalogs/_fleet-subscriptions.json", JSON.stringify({ generatedAt: new Date().toISOString(), count: subs.length, items: subs }, null, 2));
writeFileSync("catalogs/_fleet-all-products.json", JSON.stringify({ generatedAt: new Date().toISOString(), count: all.length, products: all }, null, 2));

const margins = all.map((p) => p.marginPercent);
console.log(`catalogs: ${STORES.length} stores, ${total} products, ${digital.length} digital add-ons, ${subs.length} subscription plans`);
console.log(`margin: min ${Math.min(...margins)}% avg ${(margins.reduce((a, b) => a + b, 0) / margins.length).toFixed(1)}% max ${Math.max(...margins)}%`);
