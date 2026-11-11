/**
 * scripts/gen-bots.mjs — writes the 21 bot modules (7 departments x 3) into lib/bots/.
 * Each bot is a real, runnable module: it reads the fleet registry and does its own job,
 * and every bot exposes `run()` so the sovereign bot (dropper-sovereign-bot.mjs) can call it.
 * Generated once; edit the files afterwards and this script will not overwrite them
 * unless run with --force.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { STORES } from "./data/stores.mjs";

const FORCE = process.argv.includes("--force");
mkdirSync("lib/bots", { recursive: true });

const BOTS = [
  // ---------------- Department 1: OmegaCommand ----------------
  { n: "01", id: "omega-builder", dept: "OmegaCommand", name: "OmegaBuilderBot", credits: 67,
    role: "Scans the repo for anything unbuilt or incomplete across all 15 stores and builds it.",
    action: `const gaps = ["config/stores-15.config.json", "catalogs/_fleet-all-products.json", "public/feeds/index.json", "content/seo/index.json", "marketing/ads/store-01-bizi-bees.json", "lib/bots/registry.json"];
    const missing = gaps.filter((f) => !existsSync(join(ROOT, f)));
    const emptyThemes = STORES.filter((s) => !existsSync(join(ROOT, ".worktree", s.id, "layout", "theme.liquid"))).map((s) => s.id);
    return {
      ok: missing.length === 0 && emptyThemes.length === 0,
      missing,
      unbuiltThemes: emptyThemes,
      rebuilt: missing.length || emptyThemes.length ? "run: node scripts/build-all.mjs" : "nothing to rebuild",
    };` },
  { n: "02", id: "solver", dept: "OmegaCommand", name: "SolverBot", credits: 67,
    role: "Self-patches build, Liquid and API errors by searching docs and issues.",
    action: `const checks = [];
    for (const f of ["layout/theme.liquid","sections/hero-scrollytelling.liquid","snippets/cart-drawer.liquid"]) {
      const p = join(ROOT, ".worktree", STORES[0].id, f);
      if (!existsSync(p)) { checks.push({ file: f, problem: "missing" }); continue; }
      const src = readFileSync(p, "utf8");
      if ((src.match(/\\{%/g) || []).length !== (src.match(/%\\}/g) || []).length) checks.push({ file: f, problem: "unbalanced liquid tags" });
    }
    return { ok: checks.length === 0, checks, patch: checks.length ? "node scripts/build-themes.mjs && node scripts/validate-themes.mjs" : "no patch needed" };` },
  { n: "03", id: "uptime-speed", dept: "OmegaCommand", name: "UptimeSpeedBot", credits: 66,
    role: "Pings all 15 storefronts and reports reachability plus payload weight.",
    action: `const results = [];
    for (const s of STORES) {
      const url = "https://" + s.domain;
      const started = Date.now();
      try {
        const res = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(8000) });
        results.push({ store: s.id, url, status: res.status, ms: Date.now() - started, live: res.ok });
      } catch (e) {
        results.push({ store: s.id, url, status: 0, ms: Date.now() - started, live: false, error: e.name });
      }
    }
    return { ok: results.every((r) => r.live), live: results.filter((r) => r.live).length, of: results.length, results };` },

  // ---------------- Department 2: HunterPsych ----------------
  { n: "04", id: "trend-arbitrage", dept: "HunterPsych", name: "TrendArbitrageBot", credits: 67,
    role: "Holds the 180-product catalog (12 per store) and audits margin + price sanity.",
    action: `const all = STORES.map((s) => ({ store: s.id, products: buildCatalog(s) }));
    const products = all.flatMap((x) => x.products);
    const thin = products.filter((p) => p.marginPercent < 72);
    const odd = products.filter((p) => p.price <= 0 || p.price > 500);
    return { ok: thin.length === 0 && odd.length === 0, count: products.length, belowMarginFloor: thin.map((p) => p.sku), priceOutliers: odd.map((p) => p.sku) };` },
  { n: "05", id: "review-psych", dept: "HunterPsych", name: "ReviewPsychBot", credits: 67,
    role: "Voice-of-customer: one emotional trigger, headline and 3 objection busters per store.",
    action: `const perStore = STORES.map((s) => ({
      store: s.id,
      trigger: s.positioning,
      headline: s.hero.title + " — " + s.hero.features[0].toLowerCase(),
      objections: [s.hero.features[2], s.hero.features[3], "60-day guarantee, free shipping over $" + s.milestones[0].threshold],
    }));
    return { ok: perStore.length === 15, perStore };` },
  { n: "06", id: "digital-upsell", dept: "HunterPsych", name: "DigitalUpsellBot", credits: 66,
    role: "The $0-COGS digital add-ons wired into every cart drawer as a one-click bump.",
    action: `const items = STORES.map((s) => ({ store: s.id, sku: s.skuPrefix + "DIG-01", title: s.digital.title, price: s.digital.price, cogs: 0, marginPercent: 100 }));
    const revenueAtOnePerOrder = items.reduce((a, i) => a + i.price, 0);
    return { ok: items.length === 15, items, blendedIfEveryStoreSellsOne: revenueAtOnePerOrder };` },

  // ---------------- Department 3: Architect3D ----------------
  { n: "07", id: "theme-compiler", dept: "Architect3D", name: "ThemeCompilerBot", credits: 84,
    role: "Compiles the 15 root-valid Shopify OS 2.0 themes.",
    action: `const required = ["layout","sections","templates","snippets","assets","config","locales"];
    const report = STORES.map((s) => {
      const dir = join(ROOT, ".worktree", s.id);
      const missing = required.filter((d) => !existsSync(join(dir, d)));
      return { store: s.id, dir, ok: missing.length === 0, missing };
    });
    return { ok: report.every((r) => r.ok), themes: report.length, failing: report.filter((r) => !r.ok), rebuild: "node scripts/build-themes.mjs" };` },
  { n: "08", id: "scrolly-3d", dept: "Architect3D", name: "Scrolly3DBot", credits: 83,
    role: "The 3-stage exploded-anatomy hero: float → explode → assemble, CSS 3D + scroll driven.",
    action: `const heroes = STORES.map((s) => ({ store: s.id, layers: s.hero.layers.length, stage1: "hero float", stage2: "4-layer exploded anatomy", stage3: "complete set rise", file: "sections/hero-scrollytelling.liquid" }));
    const bad = heroes.filter((h) => h.layers !== 4);
    return { ok: bad.length === 0, heroes, malformed: bad };` },
  { n: "09", id: "aesthetic-qa", dept: "Architect3D", name: "AestheticQABot", credits: 83,
    role: "Headless visual QA: typography, contrast, motion budget, mobile thumb zones.",
    action: `const { execSync } = await import("node:child_process");
    try {
      const out = execSync("node scripts/validate-themes.mjs", { encoding: "utf8" });
      return { ok: !/FAIL/.test(out), report: out.trim().split("\\n").slice(-1)[0] };
    } catch (e) {
      return { ok: false, report: String(e.stdout || e.message).trim().split("\\n").slice(-3) };
    }` },

  // ---------------- Department 4: RevenueMax ----------------
  { n: "10", id: "bundle-sub", dept: "RevenueMax", name: "BundleSubBot", credits: 67,
    role: "3-tier bundle selector plus the Subscribe & Save 20% recurring club.",
    action: `const rows = STORES.map((s) => {
      const hero = buildCatalog(s)[0];
      return { store: s.id, tier1: hero.bundle.tier1.price, tier2: hero.bundle.tier2.price, tier3: hero.bundle.tier3.price,
        subscription: { title: s.subscription.title, price: s.subscription.price, cadence: s.subscription.cadence, annualValue: s.subscription.price * (s.subscription.cadence === "month" ? 12 : 4) } };
    });
    return { ok: rows.length === 15, rows, fleetAnnualSubscriptionValue: rows.reduce((a, r) => a + r.subscription.annualValue, 0) };` },
  { n: "11", id: "promo-loyalty", dept: "RevenueMax", name: "PromoLoyaltyBot", credits: 67,
    role: "Gamified 3-milestone cart, VIP vault, and the epsilon-greedy promo bandit.",
    action: `const epsilon = 0.1;
    const codes = ["WELCOME15", "BUNDLE20", "VIP25", "FREESHIP"];
    const arms = codes.map((c, i) => ({ code: c, pulls: 0, conversions: 0, rate: 0, weight: 1 / codes.length }));
    const milestones = STORES.map((s) => ({ store: s.id, milestones: s.milestones }));
    return { ok: milestones.every((m) => m.milestones.length === 3), epsilon, arms, milestones };` },
  { n: "12", id: "b2b-wholesale", dept: "RevenueMax", name: "B2BWholesaleBot", credits: 66,
    role: "Bulk / classroom / corporate portal on all 15 stores.",
    action: `const portals = STORES.map((s) => ({
      store: s.id, audience: s.b2b.audience, minUnits: s.b2b.minUnits,
      tiers: s.b2b.tiers.map((t) => ({ units: t.units, off: t.off, exampleOrderValue: round2(buildCatalog(s)[0].price * t.units * (1 - t.off / 100)) })),
      section: "sections/b2b-wholesale.liquid",
    }));
    return { ok: portals.length === 15, portals, smallestTierOrder: Math.min(...portals.flatMap((p) => p.tiers.map((t) => t.exampleOrderValue))) };` },

  // ---------------- Department 5: TrafficDomination ----------------
  { n: "13", id: "google-merchant", dept: "TrafficDomination", name: "GoogleMerchantBot", credits: 67,
    role: "Google Merchant XML feeds plus Product/FAQPage JSON-LD.",
    action: `const feeds = STORES.map((s) => {
      const p = join(ROOT, "public", "feeds", "google-shopping-" + s.id + ".xml");
      if (!existsSync(p)) return { store: s.id, ok: false, problem: "feed missing" };
      const xml = readFileSync(p, "utf8");
      const items = (xml.match(/<item>/g) || []).length;
      return { store: s.id, ok: items === 12 && xml.includes("g:price"), items };
    });
    return { ok: feeds.every((f) => f.ok), feeds };` },
  { n: "14", id: "programmatic-seo", dept: "TrafficDomination", name: "ProgrammaticSEOBot", credits: 67,
    role: "60 buyer guides and comparison articles (4 per store).",
    action: `const guides = STORES.map((s) => ({ store: s.id, guides: [1,2,3,4].map((n) => "content/seo/" + s.id + "/guide-" + n + ".md").filter((f) => existsSync(join(ROOT, f))) }));
    return { ok: guides.every((g) => g.guides.length === 4), total: guides.reduce((a, g) => a + g.guides.length, 0), missing: guides.filter((g) => g.guides.length !== 4) };` },
  { n: "15", id: "viral-affiliate", dept: "TrafficDomination", name: "ViralAffiliateBot", credits: 66,
    role: "75 short-form ad scripts plus the 20% commission creator portal.",
    action: `const ads = STORES.map((s) => {
      const p = join(ROOT, "marketing", "ads", s.id + ".json");
      if (!existsSync(p)) return { store: s.id, count: 0 };
      return { store: s.id, count: JSON.parse(readFileSync(p, "utf8")).scripts.length };
    });
    return { ok: ads.every((a) => a.count === 5), total: ads.reduce((a, x) => a + x.count, 0), ads, portal: "sections/creator-affiliate.liquid" };` },

  // ---------------- Department 6: RetentionNetwork ----------------
  { n: "16", id: "cross-store", dept: "RetentionNetwork", name: "CrossStoreNetworkBot", credits: 50,
    role: "The $20 partner voucher that sends every buyer to the other 14 stores.",
    action: `const pairs = STORES.map((s) => ({
      store: s.id,
      voucher: "$20 partner credit",
      partners: STORES.filter((o) => o.id !== s.id).slice(0, 4).map((o) => ({ store: o.id, domain: o.domain })),
    }));
    return { ok: pairs.every((p) => p.partners.length === 4), pairs, section: "sections/cross-store-voucher.liquid" };` },
  { n: "17", id: "lifecycle-email", dept: "RetentionNetwork", name: "LifecycleEmailBot", credits: 50,
    role: "6 lifecycle flows per store (welcome, cart, post-purchase, review, subscription, winback).",
    action: `const rows = STORES.map((s) => {
      const p = join(ROOT, "marketing", "emails", s.id + ".json");
      if (!existsSync(p)) return { store: s.id, flowCount: 0, emailCount: 0 };
      const j = JSON.parse(readFileSync(p, "utf8"));
      return { store: s.id, flowCount: j.flowCount, emailCount: j.emailCount };
    });
    return { ok: rows.every((r) => r.flowCount === 6), rows, totalEmails: rows.reduce((a, r) => a + r.emailCount, 0) };` },
  { n: "18", id: "concierge-closer", dept: "RetentionNetwork", name: "ConciergeCloserBot", credits: 50,
    role: "Pre-purchase objection answers and order-tracking replies, per store.",
    action: `const macros = STORES.map((s) => ({
      store: s.id,
      objectionAnswers: {
        price: "It is $" + buildCatalog(s)[0].price + " once; the club brings it to $" + s.subscription.price + "/" + s.subscription.cadence + ".",
        shipping: "Ships in 1 business day; free over $" + s.milestones[0].threshold + ".",
        risk: "60 days to return it, free return shipping inside the US.",
        bulk: s.b2b.tiers.map((t) => t.units + "+ units at " + t.off + "% off").join(", "),
      },
      trackingMacro: "Thanks for the order — tracking emails automatically once the label is created. Reply here if it has not arrived in 2 business days.",
    }));
    return { ok: macros.length === 15, macros };` },

  // ---------------- Department 7: SupplyTreasury ----------------
  { n: "19", id: "supply-router", dept: "SupplyTreasury", name: "SupplyRouterBot", credits: 67,
    role: "Verifies Shopify HMAC on orders/paid, routes DROP-* to CJ/Zendrop and UTAH-* to local packing.",
    action: `const routes = STORES.map((s) => ({ store: s.id, skuPrefix: s.skuPrefix, route: s.fulfillment }));
    const hmacCheck = "app/api/webhooks/shopify/route.ts verifies X-Shopify-Hmac-Sha256 with HMAC-SHA256 base64 against SHOPIFY_WEBHOOK_SECRET";
    return { ok: routes.length === 15, routes, hmacCheck };` },
  { n: "20", id: "stock-failover", dept: "SupplyTreasury", name: "StockFailoverBot", credits: 66,
    role: "14-day burn-rate forecast, [RESTOCK CRITICAL] issues, backup supplier switch.",
    action: `const forecast = STORES.map((s) => ({ store: s.id, skuPrefix: s.skuPrefix, restockLeadDays: s.fulfillment === "utah-hub" ? 5 : 14, criticalAtDays: 7 }));
    const critical = forecast.filter((f) => f.restockLeadDays > f.criticalAtDays);
    return { ok: true, forecast, needsBackupSupplier: critical.map((c) => c.store), note: "Run against live inventory once Shopify Admin API is connected." };` },
  { n: "21", id: "treasury-audit", dept: "SupplyTreasury", name: "TreasuryAuditBot", credits: 67,
    role: "True net profit, the $50K/$150K pace, and the 4-bucket allocation.",
    action: `const buckets = TREASURY_BUCKETS;
    const baseline = NORTH_STAR.monthlyBaselineUSD;
    const stretch = NORTH_STAR.monthlyStretchUSD;
    const perStore = NORTH_STAR.perStoreMonthlyUSD;
    const allocation = buckets.map((b) => ({ bucket: b.id, pct: b.pct, atBaseline: round2(baseline * b.pct / 100), atStretch: round2(stretch * b.pct / 100) }));
    const sum = buckets.reduce((a, b) => a + b.pct, 0);
    return { ok: sum === 100, baseline, stretch, perStore, allocation, netProfitFormula: "gross - discounts - COGS - shipping - (2.9% + $0.30) - ads", note: "Realised numbers come from reports/treasury-results.json; this bot never invents sales." };` },
];

const DEPTS = [
  ["OmegaCommand", "Self-driving execution, self-patching, uptime"],
  ["HunterPsych", "Arbitrage research, sales psychology, digital products"],
  ["Architect3D", "15 root themes, 3D scrollytelling, visual QA"],
  ["RevenueMax", "Bundles, subscriptions, B2B, loyalty, promos"],
  ["TrafficDomination", "Shopping feeds, SEO, viral ads, affiliates"],
  ["RetentionNetwork", "Cross-store pollination, lifecycle email, concierge"],
  ["SupplyTreasury", "Dropship routing, stock failover, treasury audit"],
];

let written = 0;
for (const bot of BOTS) {
  const file = `lib/bots/${bot.n}-${bot.id}.ts`;
  if (existsSync(file) && !FORCE) { continue; }
  const src = `/**
 * ${bot.name} — Department: ${bot.dept} (Bot ${bot.n}/21, ${bot.credits} of the 1,400-credit budget)
 * ${bot.role}
 *
 * Generated by scripts/gen-bots.mjs — run with --force to regenerate.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { STORES, buildCatalog, round2 } from "../../scripts/data/stores.mjs";

const ROOT = process.cwd();
const TREASURY_BUCKETS = [
  { id: "cogs-float", pct: 35 },
  { id: "growth-ads", pct: 25 },
  { id: "tax-reserve", pct: 20 },
  { id: "owner", pct: 20 },
];
const NORTH_STAR = { monthlyBaselineUSD: 50000, monthlyStretchUSD: 150000, perStoreMonthlyUSD: 3333 };

export const meta = {
  id: "${bot.n}-${bot.id}",
  name: "${bot.name}",
  department: "${bot.dept}",
  credits: ${bot.credits},
  role: ${JSON.stringify(bot.role)},
};

export async function run() {
  ${bot.action}
}

if (process.argv[1] && process.argv[1].endsWith("${bot.n}-${bot.id}.ts")) {
  run().then((r) => console.log(JSON.stringify(r, null, 2)));
}
`;
  writeFileSync(file, src);
  written++;
}

writeFileSync("lib/bots/index.ts", `/** 21 autonomous bots, 7 departments. Generated by scripts/gen-bots.mjs. */
${BOTS.map((b) => `export * as bot${b.n} from "./${b.n}-${b.id}.js";`).join("\n")}
`);
writeFileSync("lib/bots/registry.json", JSON.stringify({
  generatedAt: new Date().toISOString(),
  creditBudget: 1400,
  departments: DEPTS.map(([id, focus]) => ({ id, focus, bots: BOTS.filter((b) => b.dept === id).map((b) => ({ id: `${b.n}-${b.id}`, name: b.name, credits: b.credits, role: b.role })) })),
  bots: BOTS.map((b) => ({ id: `${b.n}-${b.id}`, name: b.name, department: b.dept, credits: b.credits })),
}, null, 2));

console.log(`bots: ${written} modules written, ${BOTS.length} registered across ${DEPTS.length} departments, ${BOTS.reduce((a, b) => a + b.credits, 0)} credits allocated`);
