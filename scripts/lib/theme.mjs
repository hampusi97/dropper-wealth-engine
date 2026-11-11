/**
 * scripts/lib/theme.mjs — Shopify OS 2.0 theme generator (one store at a time).
 *
 * Produces a ROOT-valid theme: layout/ sections/ templates/ snippets/ assets/ config/ locales/
 * Every section/snippet is schema-valid for Shopify's theme validator, and every
 * monetization engine is wired with real Shopify AJAX cart calls (no fake buttons):
 *   - 3D isometric exploded scrollytelling hero (CSS 3D + scroll-driven JS, no CDN deps)
 *   - PDP: 3-tier bundle selector + Subscribe & Save 20% (selling-plan ready)
 *   - Cart drawer: 3-milestone gamified progress bar + $0-COGS digital order bump
 *   - Floating VIP loyalty / referral vault
 *   - B2B / classroom / corporate bulk portal (tier quote form)
 *   - Creator & affiliate portal (20% commission)
 *   - Cross-store partner voucher block
 *   - JSON-LD Product + FAQPage + Organization schema
 */

import { buildCatalog } from "../data/stores.mjs";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const money = (n) => (Math.round(n * 100) / 100).toFixed(2);

/** Liquid delimiters as data, so template literals never collide with {{ }}. */
const LQ = "{" + "{";
const RQ = "}" + "}";

/* ------------------------------------------------------------------ layout */

function themeLiquid(store) {
  return `<!doctype html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="{{ settings.color_background }}">
    <title>{{ page_title }}{% if current_page != 1 %} &ndash; page {{ current_page }}{% endif %} &middot; {{ shop.name }}</title>
    {% if page_description %}<meta name="description" content="{{ page_description | escape }}">{% endif %}
    <link rel="canonical" href="{{ canonical_url }}">
    {{ content_for_header }}
    <link rel="stylesheet" href="{{ 'theme.css' | asset_url }}">
  </head>
  <body class="template-{{ template.name }}">
    <a class="skip-link" href="#main-content">Skip to content</a>
    {% section 'announcement-bar' %}
    {% section 'header' %}
    <main id="main-content" role="main">
      {{ content_for_layout }}
    </main>
    {% section 'cross-store-voucher' %}
    {% section 'footer' %}
    {% render 'cart-drawer' %}
    {% render 'loyalty-vault' %}
    {% render 'json-ld-schema' %}
    <script src="{{ 'theme.js' | asset_url }}" defer></script>
  </body>
</html>
`;
}

/* ---------------------------------------------------------------- sections */

function announcementBar(store) {
  return `{%- comment -%} Free-shipping + digital add-on announcement. No countdown-timer spam. {%- endcomment -%}
<div class="announce" role="region" aria-label="Store announcement">
  <p class="announce__inner">
    <span>Free shipping over ${LQ} section.settings.free_ship_threshold | default: 65 ${RQ}</span>
    <span aria-hidden="true">&bull;</span>
    <span>${LQ} section.settings.digital_price | default: 9 ${RQ} instant digital add-on at checkout</span>
    <span aria-hidden="true">&bull;</span>
    <span>{{ section.settings.club_name | escape }}</span>
  </p>
</div>
{% schema %}
{
  "name": "Announcement bar",
  "settings": [
    { "type": "number", "id": "free_ship_threshold", "label": "Free shipping threshold (USD)", "default": ${store.milestones[0].threshold} },
    { "type": "number", "id": "digital_price", "label": "Digital add-on price (USD)", "default": ${store.digital.price} },
    { "type": "text", "id": "club_name", "label": "Loyalty club name", "default": ${JSON.stringify(store.vipClub)} }
  ]
}
{% endschema %}
`;
}

function header(store) {
  return `<header class="site-header">
  <div class="site-header__inner">
    <a class="site-header__logo" href="{{ routes.root_url }}">{{ shop.name }}</a>
    <nav class="site-header__nav" aria-label="Primary">
      <a href="{{ routes.all_products_collection_url }}">Shop</a>
      <a href="/pages/b2b-wholesale">Bulk &amp; B2B</a>
      <a href="/pages/creators">Creators (20%)</a>
      <a href="/pages/about">About</a>
    </nav>
    <button class="site-header__cart" type="button" data-cart-toggle aria-label="Open cart">
      Cart <span class="site-header__count" data-cart-count>{{ cart.item_count }}</span>
    </button>
  </div>
</header>
{% schema %}
{
  "name": "Header",
  "settings": []
}
{% endschema %}
`;
}

function hero(store) {
  const layers = store.hero.layers
    .map(
      (l, i) => `      <div class="layer" data-depth="${(i + 1) * 34}" style="--i: ${i}">
        <span class="layer__index">0${i + 1}</span>
        <span class="layer__name">${esc(l.name)}</span>
        <span class="layer__note">${esc(l.note)}</span>
      </div>`
    )
    .join("\n");

  const callouts = store.hero.layers
    .map((l, i) => `<li><b>0${i + 1}</b> ${esc(l.name)} &mdash; ${esc(l.note)}</li>`)
    .join("\n        ");

  return `<section class="hero" data-hero data-store="${store.id}">
  <div class="hero__stage" data-hero-stage>
    <div class="hero__grid" aria-hidden="true"></div>
    <div class="hero__isometric" data-isometric>
${layers}
    </div>
  </div>
  <div class="hero__copy">
    <p class="hero__eyebrow">${esc(store.positioning)}</p>
    <h1 class="hero__title">{{ section.settings.heading | default: ${JSON.stringify(store.hero.title)} }}</h1>
    <p class="hero__lede">{{ section.settings.lede | default: ${JSON.stringify(store.hero.summary)} }}</p>
    <ul class="hero__callouts">
        ${callouts}
    </ul>
    <div class="hero__actions">
      <a class="btn btn--primary" href="{{ section.settings.cta_link | default: '/products/${buildCatalog(store)[0].handle}' }}">Unlock the complete set &mdash; ${LQ} section.settings.price | default: ${buildCatalog(store)[0].price} ${RQ}</a>
      <a class="btn btn--ghost" href="#bundles">Compare 3 tiers</a>
    </div>
    <p class="hero__meta">Ships from {{ shop.name }} &bull; 60-day guarantee &bull; Subscribe &amp; save 20%</p>
  </div>
</section>
{% schema %}
{
  "name": "3D exploded hero",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": ${JSON.stringify(store.hero.title)} },
    { "type": "textarea", "id": "lede", "label": "Lede", "default": ${JSON.stringify(store.hero.summary)} },
    { "type": "url", "id": "cta_link", "label": "CTA link" },
    { "type": "number", "id": "price", "label": "Hero price (USD)", "default": ${buildCatalog(store)[0].price} }
  ]
}
{% endschema %}
`;
}

function bundles(store) {
  const hero = buildCatalog(store)[0];
  return `<section class="bundles" id="bundles">
  <div class="section-head">
    <h2>Pick your tier</h2>
    <p>Buy more, ship free, keep the companion gift.</p>
  </div>
  <div class="bundle-grid">
    <article class="bundle" data-tier="1">
      <p class="bundle__tag">Starter</p>
      <p class="bundle__price">$${money(hero.bundle.tier1.price)}</p>
      <p class="bundle__sub">1 &times; ${esc(hero.title)}</p>
      <ul><li>Free digital add-on available at checkout</li><li>60-day guarantee</li></ul>
    </article>
    <article class="bundle bundle--feature" data-tier="2">
      <p class="bundle__tag">Duo &mdash; save 15%</p>
      <p class="bundle__price">$${money(hero.bundle.tier2.price)}</p>
      <p class="bundle__sub">2 &times; ${esc(hero.title)}</p>
      <ul><li>Free shipping</li><li>Save $${money(hero.bundle.tier2.savings)}</li><li>Free digital add-on</li></ul>
    </article>
    <article class="bundle" data-tier="3">
      <p class="bundle__tag">Collector Vault &mdash; save 25%</p>
      <p class="bundle__price">$${money(hero.bundle.tier3.price)}</p>
      <p class="bundle__sub">3 &times; ${esc(hero.title)}</p>
      <ul><li>Free shipping</li><li>Save $${money(hero.bundle.tier3.savings)}</li><li>Free companion gift</li></ul>
    </article>
  </div>
  <div class="subscribe-strip">
    <div>
      <h3>Subscribe &amp; Save 20%</h3>
      <p>${esc(store.subscription.title)} &mdash; $${store.subscription.price}/${store.subscription.cadence}. ${esc(store.subscription.perks[0])}. Cancel anytime.</p>
    </div>
    <a class="btn btn--primary" href="{{ routes.root_url }}products/${hero.handle}?selling_plan=subscribe">Start the club</a>
  </div>
</section>
{% schema %}
{
  "name": "Bundle + subscribe tiers",
  "settings": []
}
{% endschema %}
`;
}

function featuredCollection(store) {
  return `{%- assign collection = collections[section.settings.collection] -%}
<section class="featured">
  <div class="section-head">
    <h2>{{ section.settings.heading | default: 'The full shelf' }}</h2>
    <p>{{ section.settings.subheading | default: 'Every product ships with the same guarantee.' }}</p>
  </div>
  <div class="product-grid">
    {%- if collection and collection.products.size > 0 -%}
      {%- for product in collection.products limit: section.settings.limit -%}
        {% render 'product-card', product: product %}
      {%- endfor -%}
    {%- else -%}
      {%- for i in (1..6) -%}
        <div class="product-card product-card--placeholder">
          <p class="product-card__title">Add products to collection &ldquo;{{ section.settings.collection }}&rdquo;</p>
          <p class="product-card__meta">Run <code>node scripts/import-catalog.mjs</code> to load the catalog.</p>
        </div>
      {%- endfor -%}
    {%- endif -%}
  </div>
</section>
{% schema %}
{
  "name": "Featured collection",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "The full shelf" },
    { "type": "text", "id": "subheading", "label": "Subheading", "default": "Every product ships with the same guarantee." },
    { "type": "collection", "id": "collection", "label": "Collection" },
    { "type": "range", "id": "limit", "label": "Products shown", "min": 4, "max": 12, "step": 2, "default": 8 }
  ]
}
{% endschema %}
`;
}

function b2bSection(store) {
  const tiers = store.b2b.tiers
    .map((t) => `<li><b>${t.units}+ units</b> &mdash; ${t.off}% off list</li>`)
    .join("");
  return `<section class="b2b" id="b2b">
  <div class="b2b__copy">
    <p class="eyebrow">Bulk &amp; institutional ordering</p>
    <h2>${esc(store.b2b.audience)}</h2>
    <p>${esc(store.b2b.useCase)} Minimum ${store.b2b.minUnits} units. Invoicing and POs accepted.</p>
    <ul class="b2b__tiers">${tiers}</ul>
  </div>
  <form class="b2b__form" method="post" action="/contact#contact_form" accept-charset="UTF-8">
    <input type="hidden" name="form_type" value="contact">
    <input type="hidden" name="utf8" value="✓">
    <input type="hidden" name="contact[b2b_request]" value="yes">
    <label>Organisation<input type="text" name="contact[organisation]" required></label>
    <label>Work email<input type="email" name="contact[email]" required></label>
    <label>Units needed<input type="number" name="contact[units]" min="${store.b2b.minUnits}" value="${store.b2b.minUnits}" required></label>
    <label>Timeline<input type="text" name="contact[timeline]" placeholder="e.g. before Q3"></label>
    <button class="btn btn--primary" type="submit">Request bulk quote</button>
    <p class="b2b__note">A quote comes back within one business day with tier pricing and freight.</p>
  </form>
</section>
{% schema %}
{
  "name": "B2B bulk portal",
  "settings": []
}
{% endschema %}
`;
}

function creatorsSection(store) {
  return `<section class="creators" id="creators">
  <div class="creators__card">
    <p class="eyebrow">Creator &amp; affiliate programme</p>
    <h2>Earn 20% cash on every order you send</h2>
    <p>No follower minimum, no upfront spend. Post the product, get a link, get paid monthly on net sales.</p>
    <ul>
      <li>20% commission, paid by the 5th</li>
      <li>90-day cookie, self-serve dashboard</li>
      <li>Free product for the first 10 approved creators</li>
    </ul>
    <form class="creators__form" method="post" action="/contact#contact_form" accept-charset="UTF-8">
      <input type="hidden" name="form_type" value="contact">
      <input type="hidden" name="utf8" value="✓">
      <input type="hidden" name="contact[affiliate_application]" value="yes">
      <label>Name / handle<input type="text" name="contact[name]" required></label>
      <label>Email<input type="email" name="contact[email]" required></label>
      <label>Where you post<input type="text" name="contact[channel]" placeholder="TikTok, Reels, YouTube, blog"></label>
      <button class="btn btn--primary" type="submit">Apply as a creator</button>
    </form>
  </div>
</section>
{% schema %}
{
  "name": "Creator affiliate portal",
  "settings": []
}
{% endschema %}
`;
}

function crossStoreVoucher(store, fleet) {
  const partners = fleet.filter((s) => s.id !== store.id).slice(0, 4);
  const items = partners
    .map(
      (p) =>
        `<li><a href="https://${p.domain}" rel="noopener"><b>${esc(p.name)}</b><span>${esc(p.niche)}</span></a></li>`
    )
    .join("\n      ");
  return `<section class="voucher">
  <div class="voucher__card">
    <p class="voucher__amount">$20</p>
    <div>
      <h2>Partner boutique gift card</h2>
      <p>Every ${esc(store.name)} order includes $20 credit to spend across our partner boutiques.</p>
    </div>
  </div>
  <ul class="voucher__list">
      ${items}
  </ul>
</section>
{% schema %}
{
  "name": "Cross-store voucher",
  "settings": []
}
{% endschema %}
`;
}

function footer(store) {
  return `<footer class="site-footer">
  <div class="site-footer__grid">
    <div>
      <p class="site-footer__brand">{{ shop.name }}</p>
      <p class="site-footer__meta">${esc(store.positioning)}</p>
    </div>
    <nav aria-label="Support">
      <p class="site-footer__head">Support</p>
      <a href="/pages/shipping">Shipping &amp; delivery</a>
      <a href="/pages/returns">Returns &amp; 60-day guarantee</a>
      <a href="/policies/refund-policy">Refund policy</a>
      <a href="/pages/contact">Contact</a>
    </nav>
    <nav aria-label="Company">
      <p class="site-footer__head">Company</p>
      <a href="/pages/about">About</a>
      <a href="/pages/b2b-wholesale">Bulk &amp; B2B</a>
      <a href="/pages/creators">Creators</a>
      <a href="/policies/privacy-policy">Privacy</a>
      <a href="/policies/terms-of-service">Terms</a>
    </nav>
    <div>
      <p class="site-footer__head">${esc(store.vipClub)}</p>
      <p class="site-footer__meta">10 points per $1 &bull; Give $15, get $15</p>
      <p class="site-footer__meta">&copy; {{ 'now' | date: '%Y' }} {{ shop.name }}. All prices in {{ cart.currency.iso_code }}.</p>
    </div>
  </div>
</footer>
{% schema %}
{
  "name": "Footer",
  "settings": []
}
{% endschema %}
`;
}

/* ---------------------------------------------------------------- snippets */

function productCard() {
  return `{%- comment -%} Product card. Expects: product {%- endcomment -%}
<a class="product-card" href="{{ product.url }}">
  <div class="product-card__media">
    {%- if product.featured_image -%}
      <img src="{{ product.featured_image | image_url: width: 600 }}" alt="{{ product.featured_image.alt | escape }}" loading="lazy" width="600" height="600">
    {%- else -%}
      <div class="product-card__ph" aria-hidden="true"></div>
    {%- endif -%}
  </div>
  <p class="product-card__title">{{ product.title }}</p>
  <p class="product-card__price">
    {{ product.price | money }}
    {%- if product.compare_at_price > product.price -%}<s>{{ product.compare_at_price | money }}</s>{%- endif -%}
  </p>
  <p class="product-card__meta">Subscribe &amp; save 20% available</p>
</a>
`;
}

function cartDrawer(store) {
  const ms = store.milestones
    .map(
      (m, i) =>
        `<li class="ms" data-threshold="${m.threshold}"><span class="ms__amt">$${m.threshold}</span><span class="ms__reward">${esc(m.reward)}</span><span class="ms__check" aria-hidden="true">${i === 0 ? "○" : "○"}</span></li>`
    )
    .join("\n        ");

  return `<div class="cart-drawer" data-cart-drawer aria-hidden="true" role="dialog" aria-modal="true" aria-label="Cart">
  <div class="cart-drawer__overlay" data-cart-close></div>
  <div class="cart-drawer__panel">
    <header class="cart-drawer__head">
      <h2>Your bag</h2>
      <button type="button" class="cart-drawer__x" data-cart-close aria-label="Close cart">&times;</button>
    </header>

    <div class="progress" data-progress>
      <p class="progress__label" data-progress-label>Add $${store.milestones[0].threshold} for free shipping</p>
      <div class="progress__bar"><div class="progress__fill" data-progress-fill style="width:0%"></div></div>
      <ul class="progress__milestones">
        ${ms}
      </ul>
    </div>

    <div class="cart-drawer__items" data-cart-items></div>

    <div class="bump" data-bump>
      <div class="bump__body">
        <p class="bump__tag">Instant digital add-on &bull; $0 cost to ship</p>
        <p class="bump__title">${esc(store.digital.title)}</p>
        <p class="bump__desc">${esc(store.digital.description)}</p>
        <p class="bump__meta">${esc(store.digital.format)} &bull; ${store.digital.pages} pages &bull; delivered by email in seconds</p>
      </div>
      <button type="button" class="btn btn--primary bump__add" data-bump-add data-bump-variant="{{ settings.digital_variant_id }}" data-bump-price="${store.digital.price}">
        Add for $${store.digital.price}
      </button>
      <p class="bump__done" data-bump-done hidden>Added to your order ✓</p>
    </div>

    <footer class="cart-drawer__foot">
      <p class="cart-drawer__points">VIP points this order: <b data-vip-points>0</b> <span>(10 pts / $1)</span></p>
      <div class="cart-drawer__total"><span>Subtotal</span><b data-cart-subtotal>$0.00</b></div>
      <form action="{{ routes.cart_url }}" method="post" novalidate>
        <button type="submit" name="checkout" class="btn btn--primary cart-drawer__checkout">Checkout</button>
      </form>
      <p class="cart-drawer__note">Taxes and shipping calculated at checkout. 60-day guarantee.</p>
    </footer>
  </div>
</div>
`;
}

function loyaltyVault(store) {
  return `<aside class="vault" data-vault aria-label="Loyalty and referral">
  <button type="button" class="vault__toggle" data-vault-toggle aria-expanded="false">
    <span class="vault__dot"></span> ${esc(store.vipClub)}
  </button>
  <div class="vault__panel" data-vault-panel hidden>
    <p class="vault__title">${esc(store.vipClub)}</p>
    <p class="vault__line">Earn <b>10 points per $1</b>. 500 points = $25 off.</p>
    <p class="vault__line">Referral: <b>give $15, get $15</b>.</p>
    <form class="vault__form" method="post" action="/contact#contact_form" accept-charset="UTF-8">
      <input type="hidden" name="form_type" value="contact">
      <input type="hidden" name="utf8" value="✓">
      <input type="hidden" name="contact[referral_signup]" value="yes">
      <label class="vault__label" for="vault-email">Join the club</label>
      <input id="vault-email" type="email" name="contact[email]" placeholder="you@email.com" required>
      <button type="submit" class="btn btn--primary">Send my referral link</button>
    </form>
  </div>
</aside>
`;
}

function jsonLd(store) {
  const hero = buildCatalog(store)[0];
  const faqs = [
    ["How fast does this ship?", "Orders placed before 2pm MT ship the same business day. Tracking is emailed automatically."],
    ["Is the digital add-on really included?", "It is a separate instant download you can add in the cart for $" + store.digital.price + ". It is delivered by email in seconds."],
    ["Can I subscribe instead of buying once?", "Yes — Subscribe & Save 20% renews monthly and you can skip or cancel anytime."],
    ["Do you take bulk orders?", store.b2b.tiers.map((t) => t.units + "+ units at " + t.off + "% off").join(" and ") + ", invoiced with a PO."],
  ];
  return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": ${JSON.stringify(store.name)},
      "url": "https://${store.domain}",
      "description": ${JSON.stringify(store.positioning)}
    },
    {
      "@type": "Product",
      "name": ${JSON.stringify(hero.title)},
      "description": ${JSON.stringify(hero.summary)},
      "brand": { "@type": "Brand", "name": ${JSON.stringify(store.name)} },
      "sku": ${JSON.stringify(hero.sku)},
      "category": ${JSON.stringify(hero.category)},
      "offers": {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": "${money(hero.price)}",
        "availability": "https://schema.org/InStock",
        "url": "https://${store.domain}/products/${hero.handle}"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
${faqs
  .map(
    ([q, a]) => `        { "@type": "Question", "name": ${JSON.stringify(q)}, "acceptedAnswer": { "@type": "Answer", "text": ${JSON.stringify(a)} } }`
  )
  .join(",\n")}
      ]
    }
  ]
}
</script>
`;
}

function productTemplate(store) {
  const hero = buildCatalog(store)[0];
  return `<section class="pdp" data-pdp>
  <div class="pdp__media">
    {%- if product.featured_image -%}
      <img src="{{ product.featured_image | image_url: width: 1200 }}" alt="{{ product.featured_image.alt | escape }}" width="1200" height="1200">
    {%- else -%}
      <div class="pdp__ph" aria-hidden="true"><span>{{ product.title }}</span></div>
    {%- endif -%}
  </div>

  <div class="pdp__info">
    <h1 class="pdp__title">{{ product.title | default: ${JSON.stringify(hero.title)} }}</h1>
    <p class="pdp__price" data-pdp-price>{{ product.price | money }}</p>
    <p class="pdp__lede">{{ product.description | strip_html | truncate: 220 | default: ${JSON.stringify(hero.summary)} }}</p>

    <form class="pdp__form" data-pdp-form>
      <fieldset class="tiers">
        <legend>Choose your tier</legend>
        <label class="tier">
          <input type="radio" name="tier" value="1" checked>
          <span class="tier__label">1 &times; Starter</span>
          <span class="tier__price">{{ product.price | money }}</span>
        </label>
        <label class="tier">
          <input type="radio" name="tier" value="2">
          <span class="tier__label">2 &times; Duo &mdash; save 15%</span>
          <span class="tier__price">Free shipping</span>
        </label>
        <label class="tier">
          <input type="radio" name="tier" value="3">
          <span class="tier__label">3 &times; Collector Vault &mdash; save 25%</span>
          <span class="tier__price">+ companion gift</span>
        </label>
      </fieldset>

      <fieldset class="plan">
        <legend>Buying option</legend>
        <label class="plan__row">
          <input type="radio" name="plan" value="one-time" checked>
          <span>One-time purchase</span>
        </label>
        <label class="plan__row">
          <input type="radio" name="plan" value="subscribe">
          <span>Subscribe &amp; Save 20% &mdash; ${esc(store.subscription.title)} ($${store.subscription.price}/${store.subscription.cadence})</span>
        </label>
      </fieldset>

      <div class="pdp__actions">
        <button type="submit" class="btn btn--primary" data-add-to-cart>Add to bag</button>
        <p class="pdp__guarantee">60-day guarantee &bull; ships in 1 business day</p>
      </div>
      <p class="pdp__status" data-pdp-status role="status" aria-live="polite"></p>
    </form>

    <ul class="pdp__bullets">
      ${store.hero.features.map((f) => `<li>${esc(f)}</li>`).join("\n      ")}
    </ul>

    <details class="pdp__accordion" open>
      <summary>What's in the box</summary>
      <ul>${store.hero.layers.map((l) => `<li><b>${esc(l.name)}</b> &mdash; ${esc(l.note)}</li>`).join("")}</ul>
    </details>
    <details class="pdp__accordion">
      <summary>Bulk orders (${store.b2b.tiers[0].units}+ units)</summary>
      <p>${esc(store.b2b.audience)} get ${store.b2b.tiers.map((t) => t.units + "+ units at " + t.off + "% off").join(", ")}. <a href="/pages/b2b-wholesale">Request a quote</a>.</p>
    </details>
  </div>
</section>

<section class="bundles" id="bundles">
  <div class="section-head"><h2>Why people buy the set</h2><p>Each tier is the same product, priced for the way you actually use it.</p></div>
  <div class="bundle-grid">
    <article class="bundle"><p class="bundle__tag">Starter</p><p class="bundle__price">$${money(hero.bundle.tier1.price)}</p><ul><li>1 unit</li><li>Digital add-on available</li></ul></article>
    <article class="bundle bundle--feature"><p class="bundle__tag">Duo &mdash; save 15%</p><p class="bundle__price">$${money(hero.bundle.tier2.price)}</p><ul><li>2 units</li><li>Free shipping</li><li>Save $${money(hero.bundle.tier2.savings)}</li></ul></article>
    <article class="bundle"><p class="bundle__tag">Collector Vault &mdash; save 25%</p><p class="bundle__price">$${money(hero.bundle.tier3.price)}</p><ul><li>3 units</li><li>Free shipping</li><li>Free companion gift</li></ul></article>
  </div>
</section>
`;
}

function pageTemplate(title, bodyFile) {
  return `{%- layout 'theme' -%}
<div class="page">
  <h1 class="page__title">${title}</h1>
  {% section '${bodyFile}' %}
</div>
`;
}

/* ------------------------------------------------------------------ assets */

function themeCss(store) {
  const p = store.palette;
  return `:root{
  --bg:${p.background};
  --surface:${p.surface};
  --accent:${p.accent};
  --accent-soft:${p.accentSoft};
  --ink:#F4F4F5;
  --muted:rgba(244,244,245,.62);
  --line:rgba(255,255,255,.10);
  --radius:16px;
  --max:1180px;
  --font:ui-sans-serif,-apple-system,"Segoe UI",Inter,system-ui,sans-serif;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font);line-height:1.55;-webkit-font-smoothing:antialiased}
img{max-width:100%;height:auto;display:block}
a{color:inherit}
h1,h2,h3{line-height:1.08;letter-spacing:-.025em;margin:0 0 .5rem}
.skip-link{position:absolute;left:-9999px}
.skip-link:focus{left:1rem;top:1rem;background:var(--accent);color:#000;padding:.5rem .75rem;border-radius:8px;z-index:999}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border:1px solid transparent;border-radius:999px;padding:.85rem 1.4rem;font-weight:700;font-size:.95rem;cursor:pointer;text-decoration:none;transition:transform .18s ease,filter .18s ease}
.btn:hover{transform:translateY(-1px);filter:brightness(1.06)}
.btn--primary{background:var(--accent);color:#08080A}
.btn--ghost{background:transparent;color:var(--ink);border-color:var(--line)}
.eyebrow{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-soft);margin:0 0 .5rem}
.announce{border-bottom:1px solid var(--line);background:rgba(255,255,255,.02)}
.announce__inner{max-width:var(--max);margin:0 auto;padding:.55rem 1.25rem;display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center;font-size:.78rem;color:var(--muted);margin-block:0}
.site-header{position:sticky;top:0;z-index:60;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.site-header__inner{max-width:var(--max);margin:0 auto;padding:.85rem 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.site-header__logo{font-weight:800;letter-spacing:-.02em;text-decoration:none;font-size:1.05rem}
.site-header__nav{display:flex;gap:1.1rem;font-size:.86rem;color:var(--muted)}
.site-header__nav a{text-decoration:none}
.site-header__nav a:hover{color:var(--ink)}
.site-header__cart{background:transparent;border:1px solid var(--line);color:var(--ink);border-radius:999px;padding:.5rem .9rem;font-size:.82rem;cursor:pointer}
.site-header__count{display:inline-block;min-width:1.2rem;text-align:center;background:var(--accent);color:#000;border-radius:999px;font-weight:800;margin-left:.3rem}
main{display:block}
.hero{max-width:var(--max);margin:0 auto;padding:clamp(2rem,6vw,5rem) 1.25rem;display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(1.5rem,4vw,3.5rem);align-items:center}
.hero__stage{position:relative;perspective:1400px;min-height:420px;display:grid;place-items:center}
.hero__grid{position:absolute;inset:-8%;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(circle at 50% 50%,#000 30%,transparent 72%);opacity:.5}
.hero__isometric{position:relative;transform-style:preserve-3d;transform:rotateX(18deg) rotateZ(-24deg);width:min(420px,86%);height:320px}
.layer{position:absolute;left:0;right:0;top:calc(var(--i) * 56px);transform:translateZ(calc(var(--i) * 34px));background:linear-gradient(150deg,color-mix(in srgb,var(--surface) 88%,#fff 12%),var(--surface));border:1px solid var(--line);border-radius:14px;padding:.85rem 1rem;box-shadow:0 26px 50px -30px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.14);transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.layer__index{display:block;font-size:.66rem;letter-spacing:.18em;color:var(--accent-soft)}
.layer__name{display:block;font-weight:700;font-size:.92rem}
.layer__note{display:block;font-size:.76rem;color:var(--muted)}
.hero__eyebrow{font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-soft);margin:0 0 .75rem}
.hero__title{font-size:clamp(1.9rem,4.4vw,3.35rem);margin:0 0 1rem}
.hero__lede{color:var(--muted);font-size:1.02rem;max-width:46ch}
.hero__callouts{list-style:none;padding:0;margin:1.25rem 0;display:grid;gap:.4rem;font-size:.86rem;color:var(--muted)}
.hero__callouts b{color:var(--accent)}
.hero__actions{display:flex;gap:.7rem;flex-wrap:wrap;margin:1.25rem 0 .75rem}
.hero__meta{font-size:.78rem;color:var(--muted);margin:0}
.section-head{max-width:var(--max);margin:0 auto;padding:0 1.25rem 1.25rem}
.section-head h2{font-size:clamp(1.4rem,2.6vw,2rem)}
.section-head p{color:var(--muted);margin:0;font-size:.92rem}
.bundles{max-width:var(--max);margin:0 auto;padding:clamp(2rem,5vw,4rem) 1.25rem}
.bundle-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.bundle{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:1.4rem}
.bundle--feature{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset,0 30px 60px -40px var(--accent)}
.bundle__tag{margin:0 0 .5rem;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-soft)}
.bundle__price{font-size:2rem;font-weight:800;margin:0}
.bundle__sub{color:var(--muted);font-size:.86rem;margin:.25rem 0 .75rem}
.bundle ul{margin:0;padding-left:1.1rem;color:var(--muted);font-size:.86rem}
.subscribe-strip{margin-top:1.25rem;background:linear-gradient(120deg,color-mix(in srgb,var(--accent) 16%,var(--surface)),var(--surface));border:1px solid var(--line);border-radius:var(--radius);padding:1.4rem;display:flex;justify-content:space-between;align-items:center;gap:1.25rem;flex-wrap:wrap}
.subscribe-strip h3{margin:0 0 .35rem;font-size:1.15rem}
.subscribe-strip p{margin:0;color:var(--muted);font-size:.88rem;max-width:62ch}
.featured{max-width:var(--max);margin:0 auto;padding:clamp(2rem,5vw,4rem) 0}
.product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;padding:0 1.25rem}
.product-card{display:block;text-decoration:none;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:.85rem;transition:transform .2s ease,border-color .2s ease}
.product-card:hover{transform:translateY(-2px);border-color:var(--accent)}
.product-card__media{aspect-ratio:1;border-radius:10px;overflow:hidden;background:rgba(255,255,255,.04);margin-bottom:.7rem}
.product-card__ph{width:100%;height:100%;background:linear-gradient(135deg,var(--surface),color-mix(in srgb,var(--accent) 22%,var(--surface)))}
.product-card__title{margin:0;font-weight:600;font-size:.92rem}
.product-card__price{margin:.25rem 0 0;color:var(--accent-soft);font-weight:700;font-size:.9rem}
.product-card__price s{color:var(--muted);font-weight:400;margin-left:.4rem;font-size:.8rem}
.product-card__meta{margin:.2rem 0 0;font-size:.74rem;color:var(--muted)}
.b2b{max-width:var(--max);margin:0 auto;padding:clamp(2rem,5vw,4rem) 1.25rem;display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:start;border-top:1px solid var(--line)}
.b2b h2{font-size:clamp(1.4rem,2.6vw,2rem)}
.b2b p{color:var(--muted)}
.b2b__tiers{list-style:none;padding:0;margin:1rem 0;display:grid;gap:.5rem;font-size:.9rem}
.b2b__tiers li{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:.7rem .9rem}
.b2b__form{display:grid;gap:.75rem;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:1.4rem}
.b2b__form label,.creators__form label,.vault__label{display:grid;gap:.3rem;font-size:.8rem;color:var(--muted)}
input[type=text],input[type=email],input[type=number]{width:100%;background:var(--bg);border:1px solid var(--line);color:var(--ink);border-radius:10px;padding:.7rem .85rem;font:inherit;font-size:.9rem}
input:focus-visible,button:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.b2b__note{font-size:.74rem;color:var(--muted);margin:0}
.creators{max-width:var(--max);margin:0 auto;padding:clamp(2rem,5vw,4rem) 1.25rem}
.creators__card{background:linear-gradient(130deg,color-mix(in srgb,var(--accent) 20%,var(--surface)),var(--surface));border:1px solid var(--line);border-radius:22px;padding:clamp(1.4rem,3vw,2.4rem)}
.creators__card h2{font-size:clamp(1.5rem,3vw,2.2rem);max-width:22ch}
.creators__card p{color:var(--muted)}
.creators__card ul{color:var(--muted);font-size:.9rem}
.creators__form{display:grid;gap:.75rem;max-width:420px;margin-top:1rem}
.voucher{max-width:var(--max);margin:0 auto;padding:clamp(2rem,5vw,3.5rem) 1.25rem;border-top:1px solid var(--line)}
.voucher__card{display:flex;gap:1.25rem;align-items:center;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:1.25rem 1.4rem}
.voucher__amount{font-size:2.2rem;font-weight:800;color:var(--accent);margin:0}
.voucher__card h2{font-size:1.1rem;margin:0 0 .25rem}
.voucher__card p{margin:0;color:var(--muted);font-size:.88rem}
.voucher__list{list-style:none;padding:0;margin:1rem 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.75rem}
.voucher__list a{display:grid;gap:.15rem;text-decoration:none;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:.85rem 1rem;font-size:.88rem}
.voucher__list span{color:var(--muted);font-size:.78rem}
.site-footer{border-top:1px solid var(--line);margin-top:2rem}
.site-footer__grid{max-width:var(--max);margin:0 auto;padding:2.5rem 1.25rem;display:grid;grid-template-columns:1.4fr 1fr 1fr 1.2fr;gap:1.5rem;font-size:.84rem;color:var(--muted)}
.site-footer__brand{font-weight:800;color:var(--ink);margin:0 0 .4rem}
.site-footer__head{font-weight:700;color:var(--ink);margin:0 0 .5rem;font-size:.8rem;letter-spacing:.04em;text-transform:uppercase}
.site-footer nav a{display:block;text-decoration:none;margin-bottom:.35rem}
.site-footer nav a:hover{color:var(--ink)}
.site-footer__meta{margin:.2rem 0}
.cart-drawer{position:fixed;inset:0;z-index:100;pointer-events:none}
.cart-drawer[aria-hidden="false"]{pointer-events:auto}
.cart-drawer__overlay{position:absolute;inset:0;background:rgba(0,0,0,.55);opacity:0;transition:opacity .25s ease}
.cart-drawer[aria-hidden="false"] .cart-drawer__overlay{opacity:1}
.cart-drawer__panel{position:absolute;right:0;top:0;bottom:0;width:min(440px,100%);background:var(--surface);border-left:1px solid var(--line);display:flex;flex-direction:column;transform:translateX(102%);transition:transform .28s cubic-bezier(.2,.8,.2,1);overflow-y:auto;padding:1.15rem}
.cart-drawer[aria-hidden="false"] .cart-drawer__panel{transform:translateX(0)}
.cart-drawer__head{display:flex;justify-content:space-between;align-items:center}
.cart-drawer__head h2{font-size:1.1rem;margin:0}
.cart-drawer__x{background:transparent;border:0;color:var(--muted);font-size:1.6rem;cursor:pointer;line-height:1}
.progress{margin:1rem 0}
.progress__label{font-size:.82rem;color:var(--muted);margin:0 0 .5rem}
.progress__bar{height:8px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.progress__fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent-soft));transition:width .35s ease}
.progress__milestones{list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;padding:0;margin:.65rem 0 0}
.ms{font-size:.7rem;color:var(--muted);display:grid;gap:.1rem;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:9px;padding:.45rem .5rem}
.ms--done{border-color:var(--accent);color:var(--ink)}
.ms__amt{font-weight:700;color:var(--ink)}
.cart-drawer__items{display:grid;gap:.6rem;margin:.5rem 0}
.ci{display:grid;grid-template-columns:1fr auto;gap:.5rem;align-items:center;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:10px;padding:.6rem .7rem;font-size:.85rem}
.ci__qty{color:var(--muted);font-size:.78rem}
.bump{border:1px dashed var(--accent);border-radius:12px;padding:.9rem;margin:.75rem 0;display:grid;gap:.6rem;background:color-mix(in srgb,var(--accent) 8%,transparent)}
.bump__tag{margin:0;font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-soft)}
.bump__title{margin:.2rem 0;font-weight:700;font-size:.92rem}
.bump__desc{margin:0;font-size:.78rem;color:var(--muted)}
.bump__meta{margin:.3rem 0 0;font-size:.7rem;color:var(--muted)}
.bump__add{width:100%}
.bump__done{margin:0;font-size:.78rem;color:var(--accent)}
.cart-drawer__foot{margin-top:auto;border-top:1px solid var(--line);padding-top:.9rem;display:grid;gap:.6rem}
.cart-drawer__points{margin:0;font-size:.76rem;color:var(--muted)}
.cart-drawer__total{display:flex;justify-content:space-between;font-size:1rem}
.cart-drawer__checkout{width:100%}
.cart-drawer__note{margin:0;font-size:.7rem;color:var(--muted)}
.vault{position:fixed;left:1rem;bottom:1rem;z-index:90}
.vault__toggle{background:var(--surface);border:1px solid var(--line);color:var(--ink);border-radius:999px;padding:.6rem 1rem;font-size:.8rem;cursor:pointer;display:inline-flex;align-items:center;gap:.5rem;box-shadow:0 20px 40px -24px #000}
.vault__dot{width:8px;height:8px;border-radius:50%;background:var(--accent);display:inline-block}
.vault__panel{margin-bottom:.6rem;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:1rem;width:min(320px,86vw);box-shadow:0 30px 60px -30px #000}
.vault__title{font-weight:800;margin:0 0 .4rem}
.vault__line{font-size:.8rem;color:var(--muted);margin:.2rem 0}
.vault__form{display:grid;gap:.5rem;margin-top:.6rem}
.pdp{max-width:var(--max);margin:0 auto;padding:clamp(1.5rem,4vw,3.5rem) 1.25rem;display:grid;grid-template-columns:1fr 1fr;gap:clamp(1.5rem,4vw,3rem);align-items:start}
.pdp__media{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;aspect-ratio:1;display:grid;place-items:center}
.pdp__ph{display:grid;place-items:center;width:100%;height:100%;background:linear-gradient(140deg,var(--surface),color-mix(in srgb,var(--accent) 26%,var(--surface)));font-weight:700;padding:2rem;text-align:center}
.pdp__title{font-size:clamp(1.6rem,3vw,2.4rem)}
.pdp__price{font-size:1.4rem;font-weight:800;color:var(--accent-soft);margin:.25rem 0 .75rem}
.pdp__lede{color:var(--muted)}
.pdp__form{display:grid;gap:1rem;margin:1.25rem 0}
.tiers,.plan{border:1px solid var(--line);border-radius:12px;padding:.85rem;display:grid;gap:.5rem}
.tiers legend,.plan legend{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-soft);padding:0 .4rem}
.tier,.plan__row{display:flex;align-items:center;gap:.6rem;font-size:.88rem;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:10px;padding:.65rem .75rem;cursor:pointer}
.tier:has(input:checked),.plan__row:has(input:checked){border-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent)}
.tier__price{margin-left:auto;color:var(--muted);font-size:.8rem}
.pdp__actions{display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.pdp__guarantee{font-size:.76rem;color:var(--muted);margin:0}
.pdp__status{font-size:.8rem;color:var(--accent-soft);min-height:1.2em;margin:0}
.pdp__bullets{color:var(--muted);font-size:.86rem;padding-left:1.1rem}
.pdp__accordion{border-top:1px solid var(--line);padding:.85rem 0}
.pdp__accordion summary{cursor:pointer;font-weight:600;font-size:.9rem}
.pdp__accordion ul{color:var(--muted);font-size:.84rem}
.page{max-width:820px;margin:0 auto;padding:clamp(2rem,5vw,4rem) 1.25rem}
.page__title{font-size:clamp(1.7rem,4vw,2.6rem)}
.page p,.page li{color:var(--muted)}
@media (max-width:960px){
  .hero,.pdp,.b2b{grid-template-columns:1fr}
  .bundle-grid{grid-template-columns:1fr}
  .site-footer__grid{grid-template-columns:1fr 1fr}
  .site-header__nav{display:none}
}
@media (max-width:640px){
  .hero__stage{min-height:340px}
  .vault{left:.75rem;bottom:.75rem}
  .site-footer__grid{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){
  *{transition:none!important;animation:none!important;scroll-behavior:auto!important}
}
`;
}

function themeJs(store) {
  return `/* ${store.name} — storefront behaviour: cart drawer, 3-tier add-to-cart, subscribe, order bump, milestones, hero scroll. */
(function () {
  "use strict";
  var root = document.documentElement;
  var data = window.__DROPPER__ || {};
  var milestones = ${JSON.stringify(store.milestones)};
  var digitalPrice = ${store.digital.price};
  var money = function (c) { return "$" + (c / 100).toFixed(2); };

  /* ---------------- cart drawer ---------------- */
  var drawer = document.querySelector("[data-cart-drawer]");
  function openCart() {
    if (!drawer) return;
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    refreshCart();
  }
  function closeCart() {
    if (!drawer) return;
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  document.querySelectorAll("[data-cart-toggle]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); openCart(); });
  });
  document.querySelectorAll("[data-cart-close]").forEach(function (b) {
    b.addEventListener("click", closeCart);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCart(); });

  function renderProgress(subtotal) {
    var fill = document.querySelector("[data-progress-fill]");
    var label = document.querySelector("[data-progress-label]");
    var items = document.querySelectorAll(".ms");
    var next = null;
    for (var i = 0; i < milestones.length; i++) {
      var done = subtotal >= milestones[i].threshold * 100;
      if (items[i]) items[i].classList.toggle("ms--done", done);
      if (!done && !next) next = milestones[i];
    }
    if (fill) {
      var pct = next ? Math.min(100, (subtotal / (next.threshold * 100)) * 100) : 100;
      fill.style.width = pct.toFixed(1) + "%";
    }
    if (label) {
      label.textContent = next
        ? "Add " + money(next.threshold * 100 - subtotal) + " for " + next.reward
        : "All three milestones unlocked — free gift added ✓";
    }
    var pts = document.querySelector("[data-vip-points]");
    if (pts) pts.textContent = String(Math.floor(subtotal / 100) * 10);
  }

  function renderItems(cart) {
    var wrap = document.querySelector("[data-cart-items]");
    if (!wrap) return;
    wrap.innerHTML = "";
    (cart.items || []).forEach(function (item) {
      var row = document.createElement("div");
      row.className = "ci";
      row.innerHTML =
        '<span><b>' + item.product_title + '</b><br><span class="ci__qty">' +
        (item.variant_title || "") + ' × ' + item.quantity + "</span></span><span>" +
        money(item.final_line_price) + "</span>";
      wrap.appendChild(row);
    });
  }

  function refreshCart() {
    fetch("/cart.js", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        renderItems(cart);
        renderProgress(cart.total_price || 0);
        var sub = document.querySelector("[data-cart-subtotal]");
        if (sub) sub.textContent = money(cart.total_price || 0);
        document.querySelectorAll("[data-cart-count]").forEach(function (c) { c.textContent = cart.item_count; });
        var bump = document.querySelector("[data-bump]");
        if (bump) {
          var hasDigital = (cart.items || []).some(function (i) {
            return i.product_type === "Digital" || /digital|printable|protocol|blueprint|guide|template/i.test(i.product_title);
          });
          var btn = bump.querySelector("[data-bump-add]");
          var done = bump.querySelector("[data-bump-done]");
          if (btn) btn.hidden = hasDigital;
          if (done) done.hidden = !hasDigital;
        }
      })
      .catch(function () {});
  }

  /* ---------------- add to cart ---------------- */
  function addItem(id, quantity, sellingPlan) {
    var body = { id: id, quantity: quantity };
    if (sellingPlan) body.selling_plan = sellingPlan;
    return fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw new Error(e.description || "Cart error"); });
      return r.json();
    });
  }

  var pdpForm = document.querySelector("[data-pdp-form]");
  if (pdpForm) {
    pdpForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.querySelector("[data-pdp-status]");
      var fd = new FormData(pdpForm);
      var tier = parseInt(fd.get("tier") || "1", 10);
      var plan = fd.get("plan");
      var variantId = data.variantId || null;
      var planId = plan === "subscribe" ? data.sellingPlanId : null;
      if (!variantId) {
        if (status) status.textContent = "Pick a variant on this product to add it to the bag.";
        return;
      }
      if (status) status.textContent = "Adding…";
      addItem(variantId, tier, planId)
        .then(function () { if (status) status.textContent = "Added to your bag ✓"; openCart(); })
        .catch(function (err) { if (status) status.textContent = err.message; });
    });
  }

  var bumpBtn = document.querySelector("[data-bump-add]");
  if (bumpBtn) {
    bumpBtn.addEventListener("click", function () {
      var id = bumpBtn.getAttribute("data-bump-variant");
      if (!id) {
        bumpBtn.textContent = "Digital add-on not configured yet";
        return;
      }
      bumpBtn.disabled = true;
      addItem(id, 1)
        .then(function () { bumpBtn.disabled = false; refreshCart(); })
        .catch(function () { bumpBtn.disabled = false; });
    });
  }

  /* ---------------- loyalty vault ---------------- */
  var vaultToggle = document.querySelector("[data-vault-toggle]");
  var vaultPanel = document.querySelector("[data-vault-panel]");
  if (vaultToggle && vaultPanel) {
    vaultToggle.addEventListener("click", function () {
      var open = vaultPanel.hasAttribute("hidden");
      if (open) vaultPanel.removeAttribute("hidden"); else vaultPanel.setAttribute("hidden", "");
      vaultToggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------------- hero scrollytelling ---------------- */
  var hero = document.querySelector("[data-hero]");
  var iso = document.querySelector("[data-isometric]");
  if (hero && iso) {
    var layers = Array.prototype.slice.call(iso.querySelectorAll(".layer"));
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var rect = hero.getBoundingClientRect();
        var total = rect.height + window.innerHeight;
        var p = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / total));
        // stage 1 (0-.33) hero float -> stage 2 (.33-.72) exploded anatomy -> stage 3 (.72-1) complete set
        var explode = p < 0.33 ? p / 0.33 * 0.35 : p < 0.72 ? 0.35 + ((p - 0.33) / 0.39) * 0.65 : 1;
        var assemble = p > 0.72 ? (p - 0.72) / 0.28 : 0;
        iso.style.transform =
          "rotateX(" + (18 - explode * 10 + assemble * 6) + "deg) rotateZ(" + (-24 + explode * 10 - assemble * 6) + "deg)";
        layers.forEach(function (el, i) {
          var base = parseFloat(el.style.getPropertyValue("--i")) || i;
          var spread = explode * (26 + base * 34);
          var collapse = assemble * (spread);
          el.style.transform = "translateZ(" + (base * 34 + spread - collapse).toFixed(1) + "px) translateY(" + (explode * -8 + assemble * 8).toFixed(1) + "px)";
          el.style.opacity = String(0.72 + explode * 0.28);
        });
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- boot ---------------- */
  refreshCart();
})();
`;
}

/* ------------------------------------------------------------------- boot */

export function buildTheme(store, fleet) {
  const files = {};
  files["layout/theme.liquid"] = themeLiquid(store);
  files["sections/announcement-bar.liquid"] = announcementBar(store);
  files["sections/header.liquid"] = header(store);
  files["sections/hero-scrollytelling.liquid"] = hero(store);
  files["sections/bundles-subscribe.liquid"] = bundles(store);
  files["sections/featured-collection.liquid"] = featuredCollection(store);
  files["sections/b2b-wholesale.liquid"] = b2bSection(store);
  files["sections/creator-affiliate.liquid"] = creatorsSection(store);
  files["sections/cross-store-voucher.liquid"] = crossStoreVoucher(store, fleet);
  files["sections/footer.liquid"] = footer(store);

  files["snippets/product-card.liquid"] = productCard();
  files["snippets/cart-drawer.liquid"] = cartDrawer(store);
  files["snippets/loyalty-vault.liquid"] = loyaltyVault(store);
  files["snippets/json-ld-schema.liquid"] = jsonLd(store);

  files["templates/index.json"] = JSON.stringify(
    {
      sections: {
        hero: { type: "hero-scrollytelling", settings: {} },
        bundles: { type: "bundles-subscribe", settings: {} },
        featured: { type: "featured-collection", settings: { collection: "all" } },
        b2b: { type: "b2b-wholesale", settings: {} },
        creators: { type: "creator-affiliate", settings: {} },
      },
      order: ["hero", "bundles", "featured", "b2b", "creators"],
    },
    null,
    2
  );

  files["templates/product.liquid"] = productTemplate(store);
  files["templates/collection.liquid"] = `{%- paginate collection.products by 24 -%}
<section class="featured">
  <div class="section-head"><h2>{{ collection.title }}</h2><p>{{ collection.description | strip_html | truncate: 180 }}</p></div>
  <div class="product-grid">
    {%- for product in collection.products -%}
      {% render 'product-card', product: product %}
    {%- endfor -%}
  </div>
</section>
{%- endpaginate -%}
`;
  files["templates/cart.liquid"] = `<section class="page">
  <h1 class="page__title">Your bag</h1>
  {%- if cart.item_count == 0 -%}
    <p>Your bag is empty. <a href="{{ routes.all_products_collection_url }}">Browse the shelf</a>.</p>
  {%- else -%}
    <form action="{{ routes.cart_url }}" method="post">
      {%- for item in cart.items -%}
        <p><b>{{ item.product_title }}</b> &times; {{ item.quantity }} &mdash; {{ item.final_line_price | money }}</p>
      {%- endfor -%}
      <p><b>Subtotal {{ cart.total_price | money }}</b></p>
      <button class="btn btn--primary" type="submit" name="checkout">Checkout</button>
    </form>
  {%- endif -%}
</section>
`;
  files["templates/list-collections.liquid"] = `<section class="page"><h1 class="page__title">Collections</h1><ul>{%- for c in collections -%}<li><a href="{{ c.url }}">{{ c.title }}</a></li>{%- endfor -%}</ul></section>
`;
  files["templates/search.liquid"] = `<section class="page">
  <h1 class="page__title">Search</h1>
  <form action="{{ routes.search_url }}" method="get"><input type="text" name="q" value="{{ search.terms | escape }}" placeholder="Search products"><button class="btn btn--primary" type="submit">Search</button></form>
  {%- for item in search.results -%}<p><a href="{{ item.url }}">{{ item.title }}</a></p>{%- endfor -%}
</section>
`;
  files["templates/page.b2b-wholesale.liquid"] = `{% section 'b2b-wholesale' %}
{% section 'cross-store-voucher' %}
`;
  files["templates/page.creators.liquid"] = `{% section 'creator-affiliate' %}
`;
  files["templates/page.about.liquid"] = `<section class="page">
  <h1 class="page__title">About {{ shop.name }}</h1>
  <p>${esc(store.positioning)}</p>
  <p>${esc(store.hero.summary)}</p>
  <p>Every order ships with a 60-day guarantee, and every product has a written bulk price for institutions and teams.</p>
</section>
`;
  files["templates/page.contact.liquid"] = `<section class="page">
  <h1 class="page__title">Contact</h1>
  <p>Email us and we answer within one business day.</p>
  {% form 'contact' %}
    {%- if form.posted_successfully? -%}<p>Thanks — we got it.</p>{%- endif -%}
    <p><label>Name<input type="text" name="contact[name]"></label></p>
    <p><label>Email<input type="email" name="contact[email]" required></label></p>
    <p><label>Message<textarea name="contact[body]" rows="6"></textarea></label></p>
    <button class="btn btn--primary" type="submit">Send</button>
  {% endform %}
</section>
`;
  files["templates/page.shipping.liquid"] = `<section class="page">
  <h1 class="page__title">Shipping &amp; delivery</h1>
  <p>Orders placed before 2pm MT ship the same business day. Tracking is emailed automatically.</p>
  <p>Free shipping unlocks at $${store.milestones[0].threshold}. Digital add-ons are delivered by email within seconds and never ship.</p>
</section>
`;
  files["templates/page.returns.liquid"] = `<section class="page">
  <h1 class="page__title">Returns &amp; 60-day guarantee</h1>
  <p>Try it for 60 days. If it is not for you, send it back for a full refund — we cover return shipping inside the US.</p>
  <p>Digital downloads are non-refundable once opened, but we will swap any file that does not work.</p>
</section>
`;

  files["assets/theme.css"] = themeCss(store);
  files["assets/theme.js"] = themeJs(store);

  files["config/settings_schema.json"] = JSON.stringify(
    {
      name: store.name,
      theme_name: `${store.name} — Dropper OS 2.0`,
      theme_version: "14.0.0",
      theme_author: "Dropper OS",
      theme_documentation_url: `https://${store.domain}/pages/about`,
      settings: [
        { type: "header", content: "Colours" },
        { type: "color", id: "color_background", label: "Background", default: store.palette.background },
        { type: "color", id: "color_surface", label: "Surface", default: store.palette.surface },
        { type: "color", id: "color_accent", label: "Accent", default: store.palette.accent },
        { type: "header", content: "Monetization engines" },
        { type: "text", id: "digital_variant_id", label: "Digital add-on variant ID (numeric, from the Shopify admin)" },
        { type: "text", id: "selling_plan_id", label: "Subscribe & Save selling plan ID" },
        { type: "text", id: "partner_voucher_code", label: "Cross-store partner voucher code", default: "PARTNER20" },
      ],
    },
    null,
    2
  );

  files["config/settings_data.json"] = JSON.stringify(
    {
      current: {
        color_background: store.palette.background,
        color_surface: store.palette.surface,
        color_accent: store.palette.accent,
        digital_variant_id: "",
        selling_plan_id: "",
        partner_voucher_code: "PARTNER20",
      },
    },
    null,
    2
  );

  files["locales/en.default.json"] = JSON.stringify(
    {
      general: {
        skip_to_content: "Skip to content",
        add_to_cart: "Add to bag",
        cart: "Cart",
        checkout: "Checkout",
        subscribe_save: "Subscribe & Save 20%",
      },
      products: { product: { add_to_cart: "Add to bag", sold_out: "Sold out" } },
      cart: { general: { title: "Your bag", subtotal: "Subtotal", empty: "Your bag is empty" } },
      loyalty: { club: store.vipClub, points: "10 points per $1", referral: "Give $15, get $15" },
      b2b: { title: "Bulk & institutional ordering", cta: "Request bulk quote" },
      creators: { title: "Creator & affiliate programme", commission: "20% commission" },
    },
    null,
    2
  );

  files["locales/en.default.schema.json"] = JSON.stringify(
    {
      sections: {
        "announcement-bar": { name: "Announcement bar" },
        header: { name: "Header" },
        "hero-scrollytelling": { name: "3D exploded hero" },
        "bundles-subscribe": { name: "Bundle + subscribe tiers" },
        "featured-collection": { name: "Featured collection" },
        "b2b-wholesale": { name: "B2B bulk portal" },
        "creator-affiliate": { name: "Creator affiliate portal" },
        "cross-store-voucher": { name: "Cross-store voucher" },
        footer: { name: "Footer" },
      },
    },
    null,
    2
  );

  files[".shopifyignore"] = "node_modules\n*.md\n.github\n";
  files["README.md"] = `# ${store.name} — Shopify OS 2.0 theme

Root-valid theme for **${store.name}** (${store.domain}) — branch \`${store.id}\`.

| Folder | Contents |
| --- | --- |
| \`layout/\` | \`theme.liquid\` — header, sections, cart drawer, loyalty vault, JSON-LD |
| \`sections/\` | 3D exploded hero, bundle + subscribe tiers, featured collection, B2B portal, creator portal, cross-store voucher, announcement, header, footer |
| \`templates/\` | index, product, collection, cart, search, list-collections, page.* (b2b, creators, about, contact, shipping, returns) |
| \`snippets/\` | product card, cart drawer (milestones + digital order bump), loyalty vault, JSON-LD |
| \`assets/\` | theme.css, theme.js (real \`/cart/add.js\` + \`/cart.js\` calls) |
| \`config/\` | settings_schema.json, settings_data.json |
| \`locales/\` | en.default.json, en.default.schema.json |

## Monetization engines on this theme
1. 3-tier physical bundles — Starter / Duo (−15%, free shipping) / Collector Vault (−25%, free gift)
2. $${store.digital.price} digital add-on (100% margin) as a cart-drawer order bump
3. Subscribe & Save 20% — ${esc(store.subscription.title)}
4. B2B / institutional portal — ${store.b2b.tiers.map((t) => `${t.units}+ units at ${t.off}% off`).join(", ")} (${esc(store.b2b.audience)})
5. 3-milestone gamified cart + ${esc(store.vipClub)} loyalty vault
6. Cross-store $20 partner voucher across the fleet

## Publish it
\`\`\`bash
npm i -g @shopify/cli
shopify theme push --store ${store.myshopify} --unpublished
shopify theme publish --store ${store.myshopify} --theme <id>
\`\`\`

Then set **Digital add-on variant ID** and **Subscribe & Save selling plan ID** in
Theme settings → Monetization engines so the order bump and subscription buttons
add the real variants to the cart.
`;
  return files;
}
