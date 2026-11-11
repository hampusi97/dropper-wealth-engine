# Dropper OS — 17 Shopify stores, 6 money engines, 21 bots

Command deck: open `dashboard/index.html` (or `node scripts/serve-dashboard.mjs` → http://localhost:8787).
It reads the real repo files — nothing on it is hard-coded.

## What is actually built

| Piece | Where | State |
| --- | --- | --- |
| Fleet registry — 17 stores, real SKUs, prices, margins | `config/stores-17.config.json` ← `scripts/data/stores.mjs` | ✅ built |
| 180 products (12/store), ≥72% gross margin | `catalogs/*.csv` + `*.json` | ✅ built |
| 17 digital add-ons ($0 COGS) + 17 subscription clubs | `catalogs/_fleet-digital-addons.json`, `_fleet-subscriptions.json` | ✅ built |
| 17 root-valid Shopify OS 2.0 themes | branches `store-01-bizi-bees` … `store-17-chrono-forge` | ✅ built + QA-passed |
| **17 standalone storefronts — real shops, no platform** | `storefronts/<store-id>/` (cart, tiers, subscribe, bump, B2B, creators) | ✅ built + runnable |
| Payments for the standalone shops | Stripe Payment Links per SKU in `scripts/data/storefront-checkout.json` | ⏳ needs your Stripe links |
| 17 Google Merchant XML feeds (204 items) | `public/feeds/google-shopping-*.xml` | ✅ built |
| 68 SEO buyer guides, 85 ad scripts, 170 lifecycle emails, 17 creator briefs | `content/seo/`, `marketing/` | ✅ built |
| 21 bots in 7 departments, 1,400-credit allocation | `lib/bots/` | ✅ built, all runnable |
| Sovereign runner (build + 21 bots + report) | `dropper-sovereign-bot.mjs` | ✅ green |
| Daily treasury report | `reports/LATEST.md` | ⚠️ zeros — no sales recorded |
| Live stores / real orders / dropship routing | needs Shopify + CJ/Zendrop keys | ❌ not connected |

## Monetization engines on every store
1. **3-tier bundles** — Starter / Duo (−15%, free shipping) / Collector Vault (−25%, free gift)
2. **Digital add-on** — $9–$15 order bump in the cart drawer, 100% margin
3. **Subscribe & Save 20%** — recurring club per store, selling-plan ready
4. **B2B / classroom / corporate portal** — 10+ units −30%, 25+ units −40%
5. **3-milestone gamified cart + VIP loyalty vault** — free shipping → extra % off → free gift
6. **Cross-store $20 partner voucher** + **20% creator/affiliate portal**

## Commands
```bash
node scripts/build-fleet-config.mjs   # registry from scripts/data/stores.mjs
node scripts/build-catalogs.mjs       # 180 products
node scripts/build-feeds.mjs          # Google Shopping XML
node scripts/build-content.mjs        # SEO / ads / emails / creator briefs
node scripts/gen-bots.mjs --force     # the 21 bot modules
node scripts/build-themes.mjs         # themes into .worktree/<store>
node scripts/validate-themes.mjs      # static QA gate (Liquid balance, schema, JSON)
node dropper-sovereign-bot.mjs        # everything + 21 bots + report
node scripts/serve-dashboard.mjs      # command deck on :8787
```

## Two ways every store exists

**A. Standalone storefront (works today).** `storefronts/store-01-bizi-bees/index.html` … `store-17-chrono-forge`
are complete shops: real cart in localStorage, 3-tier bundles, Subscribe & Save, $9–$15 digital order bump,
3-milestone cart, VIP vault, B2B and creator forms, JSON-LD. Host the folder anywhere static
(GitHub Pages via `.github/workflows/pages.yml`, Netlify, Cloudflare Pages, Vercel) and the store is live.
Payments: paste a Stripe Payment Link per SKU into `scripts/data/storefront-checkout.json` and rerun
`node scripts/build-storefronts.mjs`; until then checkout composes an order email so no order is lost.

**B. Shopify theme (when an account exists).** Each `store-*` branch is a root-valid OS 2.0 theme —
`shopify theme push --store <store>.myshopify.com --unpublished` from that branch's worktree.

## Going live (needs the user's accounts)
1. Create the 17 Shopify stores, install the CLI: `shopify theme push --store <store>.myshopify.com --unpublished` from each `.worktree/store-*`.
2. Import `catalogs/<store>.csv` as products; set the **digital add-on variant ID** and **Subscribe & Save selling plan ID** in Theme settings → Monetization engines.
3. Add `SHOPIFY_WEBHOOK_SECRET`, `CJ_API_KEY`, `ZENDROP_API_KEY` as repo secrets so `lib/bots/19-supply-router.ts` can route paid orders.
4. Submit each `public/feeds/google-shopping-*.xml` to Google Merchant Center.
5. Fill `reports/treasury-results.json` (copy of `treasury-results.template.json`) with real payouts — the daily report stays at zero until you do.
