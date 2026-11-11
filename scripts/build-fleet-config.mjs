/** scripts/build-fleet-config.mjs — writes config/stores-15.config.json from scripts/data/stores.mjs. */
import { writeFileSync, mkdirSync } from "node:fs";
import { STORES, FLEET, buildCatalog } from "./data/stores.mjs";

mkdirSync("config", { recursive: true });
const out = {
  schema: "dropper-os-stores-registry-v14",
  documentId: FLEET.documentId,
  repo: FLEET.repo,
  generatedAt: new Date().toISOString(),
  northStar: FLEET.northStar,
  creditBudget: FLEET.creditBudget,
  engines: FLEET.engines,
  treasuryBuckets: FLEET.treasuryBuckets,
  paymentFees: FLEET.paymentFees,
  stores: STORES.map((s) => {
    const cat = buildCatalog(s);
    return {
      id: s.id, name: s.name, branch: s.id, domain: s.domain, myshopify: s.myshopify,
      mode: s.mode, fulfillment: s.fulfillment, skuPrefix: s.skuPrefix, niche: s.niche,
      positioning: s.positioning, palette: s.palette, vipClub: s.vipClub,
      hero: { title: s.hero.title, price: cat[0].price, cost: s.hero.cost, layers: s.hero.layers },
      digital: s.digital, subscription: s.subscription, b2b: s.b2b,
      cartMilestones: s.milestones, competitors: s.competitors, keywords: s.keywords,
      productCount: cat.length,
      dailyTargetUSD: FLEET.northStar.perStoreDailyUSD,
      monthlyTargetUSD: FLEET.northStar.perStoreMonthlyUSD,
    };
  }),
};
writeFileSync("config/stores-15.config.json", JSON.stringify(out, null, 2));
console.log(`fleet config: ${out.stores.length} stores`);
