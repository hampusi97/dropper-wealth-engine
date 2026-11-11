# LumenDesk — Shopify OS 2.0 theme

Root-valid theme for **LumenDesk** (lumendesk.com) — branch `store-14-lumen-desk`.

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
2. $11 digital add-on (100% margin) as a cart-drawer order bump
3. Subscribe & Save 20% — Quarterly Merino Felt &amp; Desk Hardware Care Kit
4. B2B / institutional portal — 10+ units at 30% off, 25+ units at 40% off (Remote Engineering &amp; Design Teams)
5. 3-milestone gamified cart + LumenDesk Deep Work Club loyalty vault
6. Cross-store $20 partner voucher across the fleet

## Publish it
```bash
npm i -g @shopify/cli
shopify theme push --store lumen-desk.myshopify.com --unpublished
shopify theme publish --store lumen-desk.myshopify.com --theme <id>
```

Then set **Digital add-on variant ID** and **Subscribe & Save selling plan ID** in
Theme settings → Monetization engines so the order bump and subscription buttons
add the real variants to the cart.
