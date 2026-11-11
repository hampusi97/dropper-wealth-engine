# Atelier Grid — Shopify OS 2.0 theme

Root-valid theme for **Atelier Grid** (ateliergrid.com) — branch `store-06-atelier-grid`.

| Folder | Contents |
| --- | --- |
| `layout/` | `theme.liquid` — header, sections, cart drawer, loyalty vault, JSON-LD |
| `sections/` | 3D exploded hero, bundle + subscribe tiers, featured collection, B2B portal, creator portal, cross-store voucher, announcement, header, footer |
| `templates/` | index, product, collection, cart, search, list-collections, page.* (b2b, creators, about, contact, shipping, returns) |
| `snippets/` | product card, cart drawer (milestones + digital order bump), loyalty vault, JSON-LD |
| `assets/` | theme.css, theme.js (real `/cart/add.js` + `/cart.js` calls) |
| `config/` | settings_schema.json, settings_data.json |
| `locales/` | en.default.json, en.default.schema.json |

## Monetization engines on this theme
1. 3-tier physical bundles — Starter / Duo (−15%, free shipping) / Collector Vault (−25%, free gift)
2. $12 digital add-on (100% margin) as a cart-drawer order bump
3. Subscribe & Save 20% — Quarterly Dotted Archival Notebook &amp; Pen Club
4. B2B / institutional portal — 10+ units at 30% off, 25+ units at 40% off (Architecture Firms &amp; Executive Teams)
5. 3-milestone gamified cart + Atelier Grid Society loyalty vault
6. Cross-store $20 partner voucher across the fleet

## Publish it
```bash
npm i -g @shopify/cli
shopify theme push --store atelier-grid.myshopify.com --unpublished
shopify theme publish --store atelier-grid.myshopify.com --theme <id>
```

Then set **Digital add-on variant ID** and **Subscribe & Save selling plan ID** in
Theme settings → Monetization engines so the order bump and subscription buttons
add the real variants to the cart.
