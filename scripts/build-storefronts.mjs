/**
 * scripts/build-storefronts.mjs — builds the standalone (platform-free) storefront for
 * every store into storefronts/<store-id>/ on main, so all 15 stores exist as runnable
 * shops even before any Shopify account is connected.
 *
 *   node scripts/build-storefronts.mjs            # all 15
 *   node scripts/build-storefronts.mjs store-01-bizi-bees
 */
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { STORES } from "./data/stores.mjs";
import { buildStorefront } from "./lib/storefront.mjs";

const ROOT = process.cwd();
const only = process.argv[2];
const targets = only ? STORES.filter((s) => s.id === only) : STORES;
if (!targets.length) { console.error("unknown store: " + only); process.exit(1); }

// optional per-store Stripe Payment Links + form endpoints, kept in one place
const checkoutPath = join(ROOT, "scripts", "data", "storefront-checkout.json");
const checkoutCfg = existsSync(checkoutPath) ? JSON.parse(readFileSync(checkoutPath, "utf8")) : {};
if (!existsSync(checkoutPath)) {
  const seed = Object.fromEntries(STORES.map((s) => [s.id, { stripePaymentLinks: {}, forms: { b2b: "", creator: "", vault: "" } }]));
  writeFileSync(checkoutPath, JSON.stringify({ _note: "Paste a Stripe Payment Link per SKU, and form endpoints, then rerun node scripts/build-storefronts.mjs", ...seed }, null, 2));
}

let total = 0;
const index = [];
for (const store of targets) {
  const out = join(ROOT, "storefronts", store.id);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const files = buildStorefront(store, STORES);
  // wire checkout links + form endpoints from config
  const cfg = checkoutCfg[store.id] || {};
  if (cfg.stripePaymentLinks && Object.keys(cfg.stripePaymentLinks).length) {
    const data = JSON.parse(files["index.html"].match(/window\.__STORE__ = (\{[\s\S]*?\});<\/script>/)[1]);
    data.checkout = { ...data.checkout, ...cfg.stripePaymentLinks };
    files["index.html"] = files["index.html"].replace(/window\.__STORE__ = \{[\s\S]*?\};<\/script>/, `window.__STORE__ = ${JSON.stringify(data)};</script>`);
  }
  if (cfg.forms && Object.values(cfg.forms).some(Boolean)) {
    files["index.html"] = files["index.html"].replace(/<script>window\.__FORMS__ = \{[^}]*\};<\/script>/, `<script>window.__FORMS__ = ${JSON.stringify(cfg.forms)};</script>`);
  }
  for (const [rel, content] of Object.entries(files)) {
    writeFileSync(join(out, rel), content);
    total++;
  }
  index.push({ store: store.id, name: store.name, domain: store.domain, path: `storefronts/${store.id}/index.html`, products: 12 });
  console.log(`[storefront] ${store.id}: ${Object.keys(files).length} files`);
}
writeFileSync(join(ROOT, "storefronts", "index.json"), JSON.stringify({ generatedAt: new Date().toISOString(), count: index.length, storefronts: index }, null, 2));
console.log(`[storefront] done — ${targets.length} storefronts, ${total} files`);
