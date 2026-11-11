/**
 * scripts/build-store-index.mjs — a landing page that links every store in the fleet,
 * both its standalone storefront and its Shopify branch, plus its domain.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { STORES, buildCatalog } from "./data/stores.mjs";

mkdirSync("storefronts", { recursive: true });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const cards = STORES.map((s) => {
  const hero = buildCatalog(s)[0];
  return `    <a class="card" href="${s.id}/index.html" style="--a:${s.palette.accent}">
      <p class="card__domain">${esc(s.domain)}</p>
      <h2>${esc(s.name)}</h2>
      <p class="card__niche">${esc(s.niche)}</p>
      <p class="card__hero">${esc(hero.title)} — $${hero.price}</p>
      <p class="card__meta">${s.fulfillment} · branch <code>${s.id}</code></p>
    </a>`;
}).join("\n");

writeFileSync(
  "storefronts/index.html",
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dropper OS — 17 storefronts</title>
<style>
body{margin:0;background:#08090B;color:#F2F3F5;font-family:ui-sans-serif,-apple-system,"Segoe UI",Inter,system-ui,sans-serif;line-height:1.55}
.wrap{max-width:1120px;margin:0 auto;padding:3rem 1.25rem}
h1{font-size:clamp(1.8rem,4vw,2.6rem);letter-spacing:-.03em;margin:0 0 .5rem}
.lede{color:rgba(242,243,245,.6);max-width:60ch;margin:0 0 2rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.9rem}
.card{display:block;text-decoration:none;color:inherit;background:#111318;border:1px solid rgba(255,255,255,.09);border-left:3px solid var(--a);border-radius:14px;padding:1rem 1.1rem;transition:transform .18s ease}
.card:hover{transform:translateY(-2px)}
.card h2{font-size:1rem;margin:.2rem 0}
.card__domain{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--a);margin:0}
.card__niche{font-size:.8rem;color:rgba(242,243,245,.6);margin:.2rem 0 .6rem}
.card__hero{font-size:.84rem;margin:0}
.card__meta{font-size:.72rem;color:rgba(242,243,245,.45);margin:.5rem 0 0}
code{font-family:ui-monospace,Menlo,monospace;font-size:.72rem;background:#161920;padding:.1rem .3rem;border-radius:4px}
</style></head>
<body><div class="wrap">
<h1>17 storefronts</h1>
<p class="lede">Every store below runs as a standalone shop right now — real cart, 3-tier bundles, digital add-on, subscription club, B2B and creator portals. Each one also has a root-valid Shopify OS 2.0 theme on its own branch for when a Shopify account is connected.</p>
<div class="grid">
${cards}
</div>
</div></body></html>
`
);
console.log(`store index: ${STORES.length} storefronts linked`);
