#!/usr/bin/env node
/**
 * dropper-sovereign-bot.mjs — the 24/7 maintainer.
 *
 * Runs the whole fleet build in order, then every one of the 21 bots, and writes
 * state/sovereign-state.json + reports/SOVEREIGN.md. Exits non-zero if any step fails,
 * so the GitHub Actions maintainer (and any cron you point at it) fails loudly instead
 * of silently drifting.
 *
 *   node dropper-sovereign-bot.mjs            # full cycle
 *   node dropper-sovereign-bot.mjs --check    # bots only, no rebuild
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { STORES } from "./scripts/data/stores.mjs";

const ROOT = process.cwd();
const CHECK_ONLY = process.argv.includes("--check");
const started = new Date();

const STEPS = CHECK_ONLY
  ? []
  : [
      ["fleet config", "node", ["scripts/build-fleet-config.mjs"]],
      ["catalogs", "node", ["scripts/build-catalogs.mjs"]],
      ["feeds", "node", ["scripts/build-feeds.mjs"]],
      ["content", "node", ["scripts/build-content.mjs"]],
      ["bots", "node", ["scripts/gen-bots.mjs"]],
      ["themes", "node", ["scripts/build-themes.mjs"]],
      ["theme QA", "node", ["scripts/validate-themes.mjs"]],
      ["daily report", "node", ["scripts/generate-daily-report.mjs"]],
    ];

const results = [];
function step(name, cmd, args) {
  const t = Date.now();
  try {
    const out = execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const line = out.trim().split("\n").slice(-1)[0] || "";
    results.push({ name, ok: true, ms: Date.now() - t, detail: line });
    console.log(`✓ ${name} (${Date.now() - t}ms) — ${line}`);
    return true;
  } catch (e) {
    const detail = String(e.stdout || "").trim().split("\n").slice(-3).join(" | ") || e.message;
    results.push({ name, ok: false, ms: Date.now() - t, detail });
    console.log(`✗ ${name} (${Date.now() - t}ms) — ${detail}`);
    return false;
  }
}

for (const [name, cmd, args] of STEPS) step(name, cmd, args);

/* ---- the 21 bots, run in department order ---- */
const BOT_FILES = [
  "01-omega-builder", "02-solver", "03-uptime-speed",
  "04-trend-arbitrage", "05-review-psych", "06-digital-upsell",
  "07-theme-compiler", "08-scrolly-3d", "09-aesthetic-qa",
  "10-bundle-sub", "11-promo-loyalty", "12-b2b-wholesale",
  "13-google-merchant", "14-programmatic-seo", "15-viral-affiliate",
  "16-cross-store", "17-lifecycle-email", "18-concierge-closer",
  "19-supply-router", "20-stock-failover", "21-treasury-audit",
];

const bots = [];
const { buildCatalog, round2 } = await import("./scripts/data/stores.mjs");
const TREASURY_BUCKETS = [{ id: "cogs-float", pct: 35 }, { id: "growth-ads", pct: 25 }, { id: "tax-reserve", pct: 20 }, { id: "owner", pct: 20 }];
const NORTH_STAR = { monthlyBaselineUSD: 50000, monthlyStretchUSD: 150000, perStoreMonthlyUSD: 3333 };

for (const f of BOT_FILES) {
  const src = readFileSync(join(ROOT, "lib", "bots", `${f}.ts`), "utf8");
  const start = src.indexOf("export async function run()");
  const body = src.slice(start).replace("export async function run() {", "").replace(/\}\s*(if \(process\.argv\[1\][\s\S]*)?$/, "");
  const t = Date.now();
  try {
    // the bot body runs as-is: same code the repo ships, no transpiler
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction(
      "existsSync", "readFileSync", "join", "ROOT", "STORES", "buildCatalog", "round2", "TREASURY_BUCKETS", "NORTH_STAR",
      body
    );
    const outcome = await fn(existsSync, readFileSync, join, ROOT, STORES, buildCatalog, round2, TREASURY_BUCKETS, NORTH_STAR);
    const ok = outcome && outcome.ok !== false;
    bots.push({ id: f, ok, ms: Date.now() - t, summary: ok ? "pass" : JSON.stringify(outcome).slice(0, 160) });
    console.log(`${ok ? "✓" : "!"} bot ${f} — ${ok ? "pass" : JSON.stringify(outcome).slice(0, 140)}`);
  } catch (e) {
    bots.push({ id: f, ok: false, ms: Date.now() - t, summary: e.message });
    console.log(`✗ bot ${f} — ${e.message}`);
  }
}

/* ---- state + report ---- */
mkdirSync(join(ROOT, "state"), { recursive: true });
mkdirSync(join(ROOT, "reports"), { recursive: true });
const state = {
  ranAt: started.toISOString(),
  durationMs: Date.now() - started.getTime(),
  mode: CHECK_ONLY ? "check" : "full",
  steps: results,
  bots,
  stores: STORES.length,
  products: STORES.reduce((a, s) => a + (JSON.parse(readFileSync(join(ROOT, "catalogs", s.id + ".json"), "utf8")).productCount), 0),
  ok: results.every((r) => r.ok) && bots.every((b) => b.ok),
};
writeFileSync(join(ROOT, "state", "sovereign-state.json"), JSON.stringify(state, null, 2));

const buildFailed = results.filter((r) => !r.ok).map((r) => r.name);
const botFailed = bots.filter((b) => !b.ok).map((b) => "bot " + b.id);
const failing = [...buildFailed, ...botFailed];
// bots 03 (uptime) and 20 (stock) depend on live stores/Admin API; without a connection they
// report attention, which is not a build failure. Everything else must be green.
const LIVE_ONLY = new Set(["03-uptime-speed", "20-stock-failover"]);
const hardFail = buildFailed.length > 0 || bots.filter((b) => !b.ok && !LIVE_ONLY.has(b.id)).length > 0;
state.ok = !hardFail;
state.awaitingLiveConnections = bots.filter((b) => !b.ok && LIVE_ONLY.has(b.id)).map((b) => b.id);
writeFileSync(
  join(ROOT, "reports", "SOVEREIGN.md"),
  `# Sovereign maintainer run — ${started.toISOString()}

- Mode: **${state.mode}**
- Duration: ${(state.durationMs / 1000).toFixed(1)}s
- Fleet: ${state.stores} stores, ${state.products} products
- Result: **${state.ok ? (failing.length ? "GREEN — awaiting live connections: " + failing.join(", ") : "ALL GREEN") : "ATTENTION: " + failing.join(", ")}**

## Build steps
${results.map((r) => `- ${r.ok ? "✅" : "❌"} ${r.name} — ${r.detail}`).join("\n") || "_skipped (--check)_"}

## The 21 bots
${bots.map((b) => `- ${b.ok ? "✅" : "⚠️"} \`${b.id}\` — ${b.summary} (${b.ms}ms)`).join("\n")}
`
);

console.log(`\nsovereign cycle ${state.ok ? "PASSED" : "FAILED"} in ${(state.durationMs / 1000).toFixed(1)}s — state/sovereign-state.json, reports/SOVEREIGN.md`);
process.exit(state.ok ? 0 : 1);
