/**
 * scripts/lib/storefront.mjs — platform-free static storefront for one store.
 *
 * The Shopify themes are the production path, but every store also gets a working
 * standalone storefront: plain HTML/CSS/JS with a real client-side cart (localStorage),
 * Stripe Payment Links (one per product, generated from the catalog), the 3-tier bundle
 * selector, Subscribe & Save, the digital add-on order bump, the 3-milestone cart,
 * the VIP vault, the B2B portal and the creator portal.
 *
 * It runs on any static host — GitHub Pages, Netlify, Cloudflare Pages, Vercel, or a
 * folder opened in a browser — with no build step and no server.
 */
import { buildCatalog } from "../data/stores.mjs";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const money = (n) => "$" + (Math.round(n * 100) / 100).toFixed(2);

export function buildStorefront(store, fleet) {
  const cat = buildCatalog(store);
  const hero = cat[0];
  const p = store.palette;
  const partners = fleet.filter((s) => s.id !== store.id).slice(0, 4);

  const products = cat.map((r) => ({
    sku: r.sku,
    title: r.title,
    handle: r.handle,
    category: r.category,
    price: r.price,
    compareAt: r.compareAt,
    summary: r.summary,
    tier2: r.bundle.tier2.price,
    tier3: r.bundle.tier3.price,
    isHero: r.isHero,
  }));
  const digital = { sku: `${store.skuPrefix}DIG-01`, title: store.digital.title, price: store.digital.price, summary: store.digital.description, format: store.digital.format };
  const sub = { title: store.subscription.title, price: store.subscription.price, cadence: store.subscription.cadence };

  const data = {
    storeId: store.id,
    storeName: store.name,
    domain: store.domain,
    vipClub: store.vipClub,
    milestones: store.milestones,
    products,
    digital,
    subscription: sub,
    freeShip: store.milestones[0].threshold,
    /** Stripe Payment Link per product; empty until the owner pastes them in from Stripe. */
    checkout: Object.fromEntries(cat.map((r) => [r.sku, ""])),
    /** Form endpoints (b2b / creator / vault); empty = the form opens the visitor's mail app. */
    forms: { b2b: "", creator: "", vault: "" },
    partnerVoucher: "$20",
    partners: partners.map((x) => ({ name: x.name, domain: x.domain, niche: x.niche })),
    b2b: store.b2b,
    commission: 20,
  };

  const productCards = cat
    .map(
      (r) => `      <a class="card" href="#p-${r.handle}" data-open="${r.handle}">
        <div class="card__media"><span>${esc(r.category)}</span></div>
        <p class="card__title">${esc(r.title)}</p>
        <p class="card__price">${money(r.price)} ${r.compareAt > r.price ? `<s>${money(r.compareAt)}</s>` : ""}</p>
        <p class="card__meta">${r.isHero ? "Hero product" : "Subscribe &amp; save 20%"}</p>
      </a>`
    )
    .join("\n");

  const layers = store.hero.layers
    .map(
      (l, i) => `        <div class="layer" style="top:${i * 52}px;transform:translateZ(${i * 30}px)">
          <span class="layer__i">0${i + 1}</span><b>${esc(l.name)}</b><small>${esc(l.note)}</small>
        </div>`
    )
    .join("\n");

  const milestoneList = store.milestones
    .map((m) => `<li data-threshold="${m.threshold}"><b>$${m.threshold}</b> ${esc(m.reward)}</li>`)
    .join("");

  const partnerList = partners
    .map((x) => `<li><a href="https://${x.domain}" rel="noopener"><b>${esc(x.name)}</b><span>${esc(x.niche)}</span></a></li>`)
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(store.name)} — ${esc(store.niche)}</title>
<meta name="description" content="${esc(store.positioning)}">
<meta property="og:title" content="${esc(store.name)} — ${esc(hero.title)}">
<meta property="og:description" content="${esc(hero.summary)}">
<link rel="stylesheet" href="theme.css">
<script type="application/ld+json">
${JSON.stringify(
  {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: store.name, url: `https://${store.domain}`, description: store.positioning },
      {
        "@type": "Product",
        name: hero.title,
        description: hero.summary,
        sku: hero.sku,
        brand: { "@type": "Brand", name: store.name },
        offers: { "@type": "Offer", priceCurrency: "USD", price: hero.price.toFixed(2), availability: "https://schema.org/InStock", url: `https://${store.domain}/#p-${hero.handle}` },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          ["How fast does it ship?", "Orders before 2pm MT ship the same business day; tracking is emailed automatically."],
          ["Can I subscribe instead of buying once?", `Yes — ${store.subscription.title} at $${store.subscription.price}/${store.subscription.cadence}, skip or cancel anytime.`],
          ["Do you take bulk orders?", `${store.b2b.tiers.map((t) => `${t.units}+ units at ${t.off}% off`).join(" and ")} for ${store.b2b.audience.toLowerCase()}.`],
          ["Is there a digital add-on?", `${store.digital.title} — $${store.digital.price}, delivered by email in seconds, 100% margin, no shipping.`],
        ].map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      },
    ],
  },
  null,
  2
)}
</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<div class="announce">
  <span>Free shipping over $${store.milestones[0].threshold}</span>
  <span>$${store.digital.price} instant digital add-on</span>
  <span>${esc(store.vipClub)}</span>
</div>

<header class="head">
  <a class="head__logo" href="#top">${esc(store.name)}</a>
  <nav class="head__nav">
    <a href="#shelf">Shop</a><a href="#b2b">Bulk &amp; B2B</a><a href="#creators">Creators (${data.commission}%)</a><a href="#about">About</a>
  </nav>
  <button class="head__cart" type="button" data-cart-open>Cart <span data-cart-count>0</span></button>
</header>

<main id="main">
  <section class="hero" id="top">
    <div class="hero__stage">
      <div class="hero__iso" data-iso>
${layers}
      </div>
    </div>
    <div class="hero__copy">
      <p class="eyebrow">${esc(store.positioning)}</p>
      <h1>${esc(store.hero.title)}</h1>
      <p class="lede">${esc(store.hero.summary)}</p>
      <ul class="feats">${store.hero.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      <div class="row">
        <button class="btn btn--primary" type="button" data-buy="${hero.sku}" data-qty="1">Add to cart — ${money(hero.price)}</button>
        <a class="btn btn--ghost" href="#tiers">Compare 3 tiers</a>
      </div>
      <p class="fine">60-day guarantee · ships in 1 business day · subscribe &amp; save 20%</p>
    </div>
  </section>

  <section class="tiers" id="tiers">
    <h2>Pick your tier</h2>
    <div class="tier-grid">
      <article class="tier"><p class="tier__tag">Starter</p><p class="tier__price">${money(hero.price)}</p><p class="tier__sub">1 × ${esc(hero.title)}</p>
        <button class="btn btn--primary" type="button" data-buy="${hero.sku}" data-qty="1">Add 1</button></article>
      <article class="tier tier--best"><p class="tier__tag">Duo — save 15%</p><p class="tier__price">${money(hero.tier2)}</p><p class="tier__sub">2 × ${esc(hero.title)} · free shipping</p>
        <button class="btn btn--primary" type="button" data-buy="${hero.sku}" data-qty="2">Add 2</button></article>
      <article class="tier"><p class="tier__tag">Collector Vault — save 25%</p><p class="tier__price">${money(hero.tier3)}</p><p class="tier__sub">3 × ${esc(hero.title)} · free gift</p>
        <button class="btn btn--primary" type="button" data-buy="${hero.sku}" data-qty="3">Add 3</button></article>
    </div>
    <div class="sub-strip">
      <div><h3>Subscribe &amp; Save 20%</h3><p>${esc(store.subscription.title)} — ${money(store.subscription.price)}/${store.subscription.cadence}. ${esc(store.subscription.perks[0])}. Cancel anytime.</p></div>
      <button class="btn btn--primary" type="button" data-buy="${hero.sku}" data-qty="1" data-subscribe="1">Start the club</button>
    </div>
  </section>

  <section class="shelf" id="shelf">
    <h2>The full shelf</h2>
    <div class="card-grid">
${productCards}
    </div>
  </section>

  <section class="b2b" id="b2b">
    <div>
      <p class="eyebrow">Bulk &amp; institutional ordering</p>
      <h2>${esc(store.b2b.audience)}</h2>
      <p>${esc(store.b2b.useCase)} Minimum ${store.b2b.minUnits} units. Invoicing and POs accepted.</p>
      <ul class="b2b__tiers">${store.b2b.tiers.map((t) => `<li><b>${t.units}+ units</b> — ${t.off}% off list</li>`).join("")}</ul>
    </div>
    <form class="form" data-form="b2b">
      <label>Organisation<input name="organisation" required></label>
      <label>Work email<input type="email" name="email" required></label>
      <label>Units needed<input type="number" name="units" min="${store.b2b.minUnits}" value="${store.b2b.minUnits}" required></label>
      <button class="btn btn--primary" type="submit">Request bulk quote</button>
      <p class="fine" data-form-note></p>
    </form>
  </section>

  <section class="creators" id="creators">
    <div class="creators__card">
      <p class="eyebrow">Creator &amp; affiliate programme</p>
      <h2>Earn ${data.commission}% cash on every order you send</h2>
      <p>No follower minimum. Post the product, get a link, get paid monthly on net sales.</p>
      <form class="form" data-form="creator">
        <label>Name / handle<input name="name" required></label>
        <label>Email<input type="email" name="email" required></label>
        <label>Where you post<input name="channel" placeholder="TikTok, Reels, YouTube, blog"></label>
        <button class="btn btn--primary" type="submit">Apply as a creator</button>
        <p class="fine" data-form-note></p>
      </form>
    </div>
  </section>

  <section class="voucher">
    <div class="voucher__card"><p class="voucher__amount">$20</p><div><h3>Partner boutique gift card</h3><p>Every ${esc(store.name)} order includes $20 credit for our partner boutiques.</p></div></div>
    <ul class="voucher__list">${partnerList}</ul>
  </section>

  <section class="about" id="about">
    <h2>About ${esc(store.name)}</h2>
    <p>${esc(store.positioning)}</p>
    <p>Every order ships with a 60-day guarantee. Institutions and teams get written bulk pricing: ${store.b2b.tiers.map((t) => `${t.units}+ units at ${t.off}% off`).join(", ")}.</p>
  </section>
</main>

<footer class="foot">
  <p><b>${esc(store.name)}</b> · ${esc(store.domain)}</p>
  <p>${esc(store.vipClub)} · 10 points per $1 · give $15, get $15</p>
  <p class="fine">Static storefront built by Dropper OS. Payments run through Stripe Payment Links; shipping and support are handled by ${esc(store.name)}.</p>
</footer>

<!-- cart drawer -->
<div class="drawer" data-drawer aria-hidden="true">
  <div class="drawer__overlay" data-cart-close></div>
  <div class="drawer__panel">
    <header class="drawer__head"><h2>Your cart</h2><button type="button" data-cart-close aria-label="Close">&times;</button></header>
    <div class="progress">
      <p class="progress__label" data-progress-label></p>
      <div class="progress__bar"><div class="progress__fill" data-progress-fill></div></div>
      <ul class="progress__ms">${milestoneList}</ul>
    </div>
    <div class="drawer__items" data-items></div>
    <div class="bump">
      <p class="bump__tag">Instant digital add-on · $0 to ship</p>
      <p class="bump__title">${esc(store.digital.title)}</p>
      <p class="bump__desc">${esc(store.digital.description)}</p>
      <button class="btn btn--primary" type="button" data-bump>Add for ${money(store.digital.price)}</button>
    </div>
    <footer class="drawer__foot">
      <p class="fine">VIP points this order: <b data-points>0</b></p>
      <p class="drawer__total"><span>Subtotal</span><b data-subtotal>$0.00</b></p>
      <button class="btn btn--primary" type="button" data-checkout>Checkout</button>
      <p class="fine" data-checkout-note></p>
    </footer>
  </div>
</div>

<aside class="vault">
  <button type="button" data-vault-toggle>${esc(store.vipClub)}</button>
  <div class="vault__panel" data-vault-panel hidden>
    <p><b>${esc(store.vipClub)}</b></p>
    <p>Earn 10 points per $1. 500 points = $25 off.</p>
    <p>Referral: give $15, get $15.</p>
    <form class="form" data-form="vault"><label>Email<input type="email" name="email" required></label><button class="btn btn--primary" type="submit">Send my referral link</button><p class="fine" data-form-note></p></form>
  </div>
</aside>

<script>window.__FORMS__ = ${JSON.stringify(data.forms)};</script>
<script>window.__STORE__ = ${JSON.stringify(data)};</script>
<script src="theme.js"></script>
</body>
</html>
`;

  const css = `:root{--bg:${p.background};--surface:${p.surface};--accent:${p.accent};--accent-soft:${p.accentSoft};--ink:#F4F4F5;--muted:rgba(244,244,245,.6);--line:rgba(255,255,255,.1);--max:1160px;--font:ui-sans-serif,-apple-system,"Segoe UI",Inter,system-ui,sans-serif}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font);line-height:1.55}
a{color:inherit}img{max-width:100%}
.skip{position:absolute;left:-9999px}.skip:focus{left:1rem;top:1rem;background:var(--accent);color:#000;padding:.5rem .8rem;border-radius:8px;z-index:999}
.btn{display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:999px;padding:.8rem 1.3rem;font:inherit;font-weight:700;font-size:.92rem;cursor:pointer;text-decoration:none;transition:transform .16s ease,filter .16s ease}
.btn:hover{transform:translateY(-1px);filter:brightness(1.07)}
.btn--primary{background:var(--accent);color:#0a0a0a}.btn--ghost{background:transparent;color:var(--ink);border-color:var(--line)}
.eyebrow{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-soft);margin:0 0 .6rem}
.fine{font-size:.75rem;color:var(--muted);margin:.5rem 0 0}
.announce{display:flex;gap:1.25rem;justify-content:center;flex-wrap:wrap;font-size:.76rem;color:var(--muted);padding:.5rem 1rem;border-bottom:1px solid var(--line)}
.head{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.85rem 1.25rem;background:rgba(10,10,12,.86);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);max-width:var(--max);margin:0 auto}
.head__logo{font-weight:800;text-decoration:none;letter-spacing:-.02em}
.head__nav{display:flex;gap:1rem;font-size:.85rem;color:var(--muted)}.head__nav a{text-decoration:none}.head__nav a:hover{color:var(--ink)}
.head__cart{background:transparent;border:1px solid var(--line);color:var(--ink);border-radius:999px;padding:.45rem .9rem;font:inherit;font-size:.8rem;cursor:pointer}
.head__cart span{background:var(--accent);color:#000;border-radius:999px;padding:0 .4rem;font-weight:800;margin-left:.3rem}
main{max-width:var(--max);margin:0 auto;padding:0 1.25rem}
.hero{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1.5rem,4vw,3rem);align-items:center;padding:clamp(2rem,6vw,4.5rem) 0}
.hero__stage{perspective:1200px;display:grid;place-items:center;min-height:360px}
.hero__iso{position:relative;transform-style:preserve-3d;transform:rotateX(18deg) rotateZ(-22deg);width:min(340px,92%);height:250px}
.layer{position:absolute;left:0;right:0;background:linear-gradient(150deg,#1e222b,#14171d);border:1px solid var(--line);border-radius:12px;padding:.6rem .8rem;box-shadow:0 22px 44px -28px #000}
.layer__i{font-size:.62rem;letter-spacing:.18em;color:var(--accent-soft);display:block}
.layer b{font-size:.86rem;display:block}.layer small{color:var(--muted);font-size:.72rem}
.hero h1{font-size:clamp(1.9rem,4.4vw,3.1rem);line-height:1.06;letter-spacing:-.03em;margin:0 0 .9rem}
.lede{color:var(--muted);max-width:46ch}
.feats{color:var(--muted);font-size:.86rem;padding-left:1.1rem;margin:1rem 0}
.row{display:flex;gap:.7rem;flex-wrap:wrap;margin:1.1rem 0}
h2{font-size:clamp(1.4rem,2.6vw,2rem);letter-spacing:-.02em;margin:0 0 1rem}
.tiers,.shelf,.b2b,.creators,.voucher,.about{padding:clamp(2rem,5vw,3.5rem) 0;border-top:1px solid var(--line)}
.tier-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.tier{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:1.3rem}
.tier--best{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}
.tier__tag{font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-soft);margin:0 0 .4rem}
.tier__price{font-size:1.9rem;font-weight:800;margin:0}.tier__sub{color:var(--muted);font-size:.82rem;margin:.2rem 0 .9rem}
.sub-strip{margin-top:1rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;background:linear-gradient(120deg,rgba(245,158,11,.12),var(--surface));border:1px solid var(--line);border-radius:16px;padding:1.2rem}
.sub-strip h3{margin:0 0 .3rem}.sub-strip p{margin:0;color:var(--muted);font-size:.85rem;max-width:60ch}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:.9rem}
.card{display:block;text-decoration:none;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:.8rem;transition:transform .18s ease,border-color .18s ease}
.card:hover{transform:translateY(-2px);border-color:var(--accent)}
.card__media{aspect-ratio:1;border-radius:10px;background:linear-gradient(140deg,var(--surface),color-mix(in srgb,var(--accent) 24%,var(--surface)));display:grid;place-items:center;font-size:.7rem;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:.6rem}
.card__title{margin:0;font-weight:600;font-size:.9rem}.card__price{margin:.25rem 0 0;color:var(--accent-soft);font-weight:700;font-size:.88rem}
.card__price s{color:var(--muted);font-weight:400;margin-left:.35rem;font-size:.78rem}
.card__meta{margin:.2rem 0 0;font-size:.72rem;color:var(--muted)}
.b2b{display:grid;grid-template-columns:1fr 1fr;gap:2rem}
.b2b__tiers{list-style:none;padding:0;display:grid;gap:.45rem;font-size:.88rem;color:var(--muted)}
.b2b__tiers li{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:.6rem .8rem}
.form{display:grid;gap:.65rem;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:1.2rem}
.form label{display:grid;gap:.28rem;font-size:.78rem;color:var(--muted)}
input{width:100%;background:var(--bg);border:1px solid var(--line);color:var(--ink);border-radius:10px;padding:.65rem .8rem;font:inherit;font-size:.88rem}
input:focus-visible,button:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.creators__card{background:linear-gradient(130deg,rgba(245,158,11,.16),var(--surface));border:1px solid var(--line);border-radius:20px;padding:clamp(1.3rem,3vw,2.2rem)}
.creators__card h2{max-width:24ch}.creators__card p{color:var(--muted)}
.voucher__card{display:flex;gap:1.1rem;align-items:center;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:1.2rem}
.voucher__amount{font-size:2rem;font-weight:800;color:var(--accent);margin:0}
.voucher__card h3{margin:0 0 .2rem}.voucher__card p{margin:0;color:var(--muted);font-size:.85rem}
.voucher__list{list-style:none;padding:0;margin:1rem 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.7rem}
.voucher__list a{display:grid;gap:.1rem;text-decoration:none;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:.8rem .9rem;font-size:.86rem}
.voucher__list span{color:var(--muted);font-size:.75rem}
.about p{color:var(--muted)}
.foot{border-top:1px solid var(--line);margin-top:2rem;padding:2rem 1.25rem;max-width:var(--max);margin-inline:auto;color:var(--muted);font-size:.82rem}
.drawer{position:fixed;inset:0;z-index:100;pointer-events:none}
.drawer[aria-hidden="false"]{pointer-events:auto}
.drawer__overlay{position:absolute;inset:0;background:rgba(0,0,0,.6);opacity:0;transition:opacity .22s}
.drawer[aria-hidden="false"] .drawer__overlay{opacity:1}
.drawer__panel{position:absolute;top:0;right:0;bottom:0;width:min(430px,100%);background:var(--surface);border-left:1px solid var(--line);transform:translateX(102%);transition:transform .26s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;padding:1.1rem;overflow-y:auto}
.drawer[aria-hidden="false"] .drawer__panel{transform:translateX(0)}
.drawer__head{display:flex;justify-content:space-between;align-items:center}
.drawer__head h2{font-size:1.05rem;margin:0}
.drawer__head button{background:transparent;border:0;color:var(--muted);font-size:1.5rem;cursor:pointer;line-height:1}
.progress__label{font-size:.8rem;color:var(--muted);margin:.9rem 0 .45rem}
.progress__bar{height:8px;background:rgba(255,255,255,.1);border-radius:999px;overflow:hidden}
.progress__fill{height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--accent-soft));transition:width .3s ease}
.progress__ms{list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:.35rem;padding:0;margin:.6rem 0 0;font-size:.68rem;color:var(--muted)}
.progress__ms li{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:9px;padding:.4rem .45rem}
.progress__ms li.done{border-color:var(--accent);color:var(--ink)}
.drawer__items{display:grid;gap:.5rem;margin:.6rem 0}
.ci{display:grid;grid-template-columns:1fr auto auto;gap:.5rem;align-items:center;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:10px;padding:.55rem .65rem;font-size:.82rem}
.ci button{background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:6px;width:1.5rem;height:1.5rem;cursor:pointer;line-height:1}
.bump{border:1px dashed var(--accent);border-radius:12px;padding:.85rem;display:grid;gap:.5rem;margin:.6rem 0;background:color-mix(in srgb,var(--accent) 8%,transparent)}
.bump__tag{margin:0;font-size:.64rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-soft)}
.bump__title{margin:0;font-weight:700;font-size:.9rem}.bump__desc{margin:0;font-size:.76rem;color:var(--muted)}
.drawer__foot{margin-top:auto;border-top:1px solid var(--line);padding-top:.8rem}
.drawer__total{display:flex;justify-content:space-between;margin:.4rem 0 .7rem}
.drawer__foot .btn{width:100%}
.vault{position:fixed;left:1rem;bottom:1rem;z-index:90}
.vault>button{background:var(--surface);border:1px solid var(--line);color:var(--ink);border-radius:999px;padding:.55rem .95rem;font:inherit;font-size:.78rem;cursor:pointer;box-shadow:0 18px 36px -24px #000}
.vault__panel{margin-bottom:.5rem;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:.9rem;width:min(310px,86vw);font-size:.8rem;color:var(--muted)}
.vault__panel p{margin:.2rem 0}
@media(max-width:900px){.hero,.b2b,.tier-grid{grid-template-columns:1fr}.head__nav{display:none}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto!important}}
`;

  const js = `/* ${store.name} — standalone storefront: cart, tiers, subscribe, digital bump, milestones, Stripe checkout. */
(function () {
  "use strict";
  var S = window.__STORE__ || {};
  var KEY = "dropper-cart-" + S.storeId;
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { cart = []; }
  var fmt = function (n) { return "$" + (Math.round(n * 100) / 100).toFixed(2); };
  var find = function (sku) { return (S.products || []).find(function (p) { return p.sku === sku; }); };
  var q = function (s) { return document.querySelector(s); };
  var qa = function (s) { return [].slice.call(document.querySelectorAll(s)); };

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
    render();
  }
  function add(line) {
    var hit = cart.find(function (l) { return l.sku === line.sku && !!l.subscribe === !!line.subscribe; });
    if (hit) hit.qty += line.qty; else cart.push(line);
    save();
    openDrawer();
  }
  function remove(i) { cart.splice(i, 1); save(); }
  function subtotal() {
    return cart.reduce(function (a, l) {
      var p = find(l.sku) || (S.digital && l.sku === S.digital.sku ? S.digital : null);
      if (!p) return a;
      var unit = p.price;
      if (l.subscribe && S.subscription) unit = Math.round(S.subscription.price * 100) / 100;
      if (l.qty === 2 && p.tier2) unit = p.tier2 / 2;
      if (l.qty === 3 && p.tier3) unit = p.tier3 / 3;
      return a + unit * l.qty;
    }, 0);
  }
  function openDrawer() { var d = q("[data-drawer]"); if (d) { d.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; } }
  function closeDrawer() { var d = q("[data-drawer]"); if (d) { d.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; } }

  function render() {
    var sub = subtotal();
    var count = cart.reduce(function (a, l) { return a + l.qty; }, 0);
    qa("[data-cart-count]").forEach(function (n) { n.textContent = String(count); });
    var items = q("[data-items]");
    if (items) {
      items.innerHTML = cart.map(function (l, i) {
        var p = find(l.sku) || (S.digital && l.sku === S.digital.sku ? S.digital : null);
        var label = p ? p.title : l.sku;
        return '<div class="ci"><span>' + label + (l.subscribe ? " · club" : "") + ' × ' + l.qty +
          '</span><span>' + fmt((p ? p.price : 0) * l.qty) + '</span><button type="button" data-rm="' + i + '" aria-label="Remove">×</button></div>';
      }).join("");
      qa("[data-rm]").forEach(function (b) { b.addEventListener("click", function () { remove(Number(b.getAttribute("data-rm"))); }); });
    }
    qa("[data-subtotal]").forEach(function (n) { n.textContent = fmt(sub); });
    qa("[data-points]").forEach(function (n) { n.textContent = String(Math.floor(sub) * 10); });
    var ms = S.milestones || [];
    var next = null;
    qa(".progress__ms li").forEach(function (li) {
      var t = Number(li.getAttribute("data-threshold"));
      var done = sub >= t;
      li.classList.toggle("done", done);
      if (!done && !next) next = { threshold: t, reward: li.textContent.replace(/^\\$\\d+\\s*/, "") };
    });
    var fill = q("[data-progress-fill]");
    var label = q("[data-progress-label]");
    if (fill) fill.style.width = (next ? Math.min(100, (sub / next.threshold) * 100) : 100).toFixed(1) + "%";
    if (label) label.textContent = next ? "Add " + fmt(next.threshold - sub) + " for " + next.reward : "All milestones unlocked — free gift added ✓";
  }

  qa("[data-cart-open]").forEach(function (b) { b.addEventListener("click", openDrawer); });
  qa("[data-cart-close]").forEach(function (b) { b.addEventListener("click", closeDrawer); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

  qa("[data-buy]").forEach(function (b) {
    b.addEventListener("click", function () {
      add({ sku: b.getAttribute("data-buy"), qty: Number(b.getAttribute("data-qty") || 1), subscribe: b.getAttribute("data-subscribe") === "1" });
    });
  });
  qa("[data-open]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var handle = a.getAttribute("data-open");
      var p = (S.products || []).find(function (x) { return x.handle === handle; });
      if (p) add({ sku: p.sku, qty: 1, subscribe: false });
    });
  });
  var bump = q("[data-bump]");
  if (bump) bump.addEventListener("click", function () {
    if (S.digital) add({ sku: S.digital.sku, qty: 1, subscribe: false });
  });

  var checkout = q("[data-checkout]");
  if (checkout) checkout.addEventListener("click", function () {
    var note = q("[data-checkout-note]");
    if (!cart.length) { if (note) note.textContent = "Your cart is empty."; return; }
    var lines = cart.map(function (l) {
      var p = find(l.sku) || (S.digital ? S.digital : null);
      return (p ? p.title : l.sku) + " x" + l.qty + (l.subscribe ? " (club)" : "");
    });
    var link = (S.checkout || {})[cart[0].sku];
    if (link) { window.location.href = link; return; }
    // no Stripe Payment Link configured yet: fall back to an email order so nothing is silently lost
    var body = encodeURIComponent("Order for " + S.storeName + "\\n\\n" + lines.join("\\n") + "\\n\\nSubtotal: " + fmt(subtotal()));
    if (note) note.innerHTML = 'Stripe checkout is not linked yet. <a href="mailto:orders@' + S.domain + '?subject=Order%20' + encodeURIComponent(S.storeName) + '&body=' + body + '">Send this order by email</a> and we will invoice you.';
  });

  qa("[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector("[data-form-note]");
      var data = Object.fromEntries(new FormData(form).entries());
      var kind = form.getAttribute("data-form");
      if (note) note.textContent = "Thanks — sending…";
      var endpoint = (S.forms || {})[kind];
      if (!endpoint) {
        // no backend configured: open the visitor's mail client with a pre-filled message
        var subject = kind === "b2b" ? "Bulk quote request — " + S.storeName : kind === "creator" ? "Creator application — " + S.storeName : "Club signup — " + S.storeName;
        var body = encodeURIComponent(Object.keys(data).map(function (k) { return k + ": " + data[k]; }).join("\\n"));
        window.location.href = "mailto:" + (kind === "b2b" ? "wholesale" : "hello") + "@" + S.domain + "?subject=" + encodeURIComponent(subject) + "&body=" + body;
        if (note) note.textContent = "Opened your email app — send it and we reply within one business day.";
        return;
      }
      fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function () { if (note) note.textContent = "Got it — we reply within one business day."; form.reset(); })
        .catch(function () { if (note) note.textContent = "Could not send — email us instead."; });
    });
  });

  var vaultBtn = q("[data-vault-toggle]");
  var vaultPanel = q("[data-vault-panel]");
  if (vaultBtn && vaultPanel) vaultBtn.addEventListener("click", function () {
    var open = vaultPanel.hasAttribute("hidden");
    if (open) vaultPanel.removeAttribute("hidden"); else vaultPanel.setAttribute("hidden", "");
    vaultBtn.setAttribute("aria-expanded", String(open));
  });

  var iso = q("[data-iso]");
  if (iso) {
    var layers = [].slice.call(iso.querySelectorAll(".layer"));
    var tick = false;
    window.addEventListener("scroll", function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        var p = Math.min(1, window.scrollY / (window.innerHeight || 800));
        iso.style.transform = "rotateX(" + (18 - p * 12) + "deg) rotateZ(" + (-22 + p * 12) + "deg)";
        layers.forEach(function (el, i) {
          el.style.transform = "translateZ(" + (i * 30 + p * (40 + i * 26)) + "px)";
        });
        tick = false;
      });
    }, { passive: true });
  }

  render();
})();
`;

  return {
    "index.html": html,
    "theme.css": css,
    "theme.js": js,
    "products.json": JSON.stringify({ storeId: store.id, generatedAt: new Date().toISOString(), products, digital, subscription: sub }, null, 2),
    "README.md": `# ${store.name} — standalone storefront

A working store with no platform: plain HTML/CSS/JS, a localStorage cart, and the same
6 monetization engines as the Shopify theme.

- Open \`index.html\` directly, or host this folder anywhere static (GitHub Pages, Netlify, Cloudflare Pages, Vercel).
- Prices and copy come from \`products.json\`; edit it or regenerate with \`node scripts/build-storefronts.mjs ${store.id}\`.
- **Payments:** paste a Stripe Payment Link per product into \`checkout\` in the generated data
  (see \`scripts/data/storefront-checkout.json\`). Until then the checkout button composes an
  order email to \`orders@${store.domain}\` so no order is silently lost.
- **Forms:** point \`forms\` (b2b / creator / vault) at any form endpoint (Formspree, your own API);
  without one they open the visitor's mail app addressed to wholesale@ / hello@${store.domain}.
- Domain: ${store.domain} — point it at this folder's host when ready.
`,
  };
}
