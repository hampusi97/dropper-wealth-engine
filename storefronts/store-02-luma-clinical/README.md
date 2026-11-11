# Luma Clinical — standalone storefront

A working store with no platform: plain HTML/CSS/JS, a localStorage cart, and the same
6 monetization engines as the Shopify theme.

- Open `index.html` directly, or host this folder anywhere static (GitHub Pages, Netlify, Cloudflare Pages, Vercel).
- Prices and copy come from `products.json`; edit it or regenerate with `node scripts/build-storefronts.mjs store-02-luma-clinical`.
- **Payments:** paste a Stripe Payment Link per product into `checkout` in the generated data
  (see `scripts/data/storefront-checkout.json`). Until then the checkout button composes an
  order email to `orders@lumaclinical.com` so no order is silently lost.
- **Forms:** point `forms` (b2b / creator / vault) at any form endpoint (Formspree, your own API);
  without one they open the visitor's mail app addressed to wholesale@ / hello@lumaclinical.com.
- Domain: lumaclinical.com — point it at this folder's host when ready.
