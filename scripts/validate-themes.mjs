/**
 * scripts/validate-themes.mjs — static QA gate run before every push.
 * Checks, per store theme: required dirs/files, JSON validity, schema validity,
 * Liquid tag balance ({% %} and {{ }}), and that all render/include targets exist.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { STORES } from "./data/stores.mjs";

const ROOT = process.cwd();
const REQUIRED_DIRS = ["layout", "sections", "templates", "snippets", "assets", "config", "locales"];
const REQUIRED_FILES = [
  "layout/theme.liquid", "config/settings_schema.json", "config/settings_data.json",
  "locales/en.default.json", "templates/index.json", "templates/product.liquid",
  "snippets/cart-drawer.liquid", "snippets/json-ld-schema.liquid",
  "sections/hero-scrollytelling.liquid", "sections/bundles-subscribe.liquid",
  "sections/b2b-wholesale.liquid", "sections/creator-affiliate.liquid",
  "sections/cross-store-voucher.liquid", "assets/theme.css", "assets/theme.js",
];

let errors = 0;
const err = (m) => { errors++; console.log("  ✗ " + m); };

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function liquidBalance(src, label) {
  const strip = src.replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, "");
  const opens = (strip.match(/\{%/g) || []).length;
  const closes = (strip.match(/%\}/g) || []).length;
  if (opens !== closes) err(`${label}: {% %} unbalanced (${opens} open, ${closes} close)`);
  const o2 = (strip.match(/{{/g) || []).length;
  const c2 = (strip.match(/}}/g) || []).length;
  if (o2 !== c2) err(`${label}: {{ }} unbalanced (${o2} open, ${c2} close)`);
}

for (const store of STORES) {
  const dir = join(ROOT, ".worktree", store.id);
  console.log(`\n[${store.id}]`);
  if (!existsSync(dir)) { err("worktree missing"); continue; }
  for (const d of REQUIRED_DIRS) if (!existsSync(join(dir, d))) err(`missing dir ${d}/`);
  for (const f of REQUIRED_FILES) if (!existsSync(join(dir, f))) err(`missing file ${f}`);

  const files = walk(dir).filter((f) => /\.(liquid|json)$/.test(f));
  const have = new Set(walk(dir).map((f) => relative(dir, f)));

  for (const f of files) {
    const rel = relative(dir, f);
    const src = readFileSync(f, "utf8");
    if (rel.endsWith(".json")) {
      try { JSON.parse(src); } catch (e) { err(`${rel}: invalid JSON — ${e.message}`); }
    }
    if (rel.endsWith(".liquid")) {
      liquidBalance(src, rel);
      for (const m of src.matchAll(/\{%-?\s*(?:render|include|section)\s+'([^']+)'/g)) {
        const t = m[1];
        const candidates = [`snippets/${t}.liquid`, `sections/${t}.liquid`];
        if (!candidates.some((c) => have.has(c))) err(`${rel}: references missing '${t}'`);
      }
      const schema = src.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
      if (rel.startsWith("sections/") && !schema) err(`${rel}: section has no {% schema %}`);
      if (schema) { try { JSON.parse(schema[1]); } catch (e) { err(`${rel}: invalid section schema — ${e.message}`); } }
    }
  }
  // JSON template section types must exist as sections
  for (const f of files.filter((f) => /templates\/.*\.json$/.test(f))) {
    const j = JSON.parse(readFileSync(f, "utf8"));
    for (const [id, s] of Object.entries(j.sections || {})) {
      if (!have.has(`sections/${s.type}.liquid`)) err(`${relative(dir, f)}: section "${id}" type "${s.type}" has no file`);
    }
  }
  if (!errors) console.log("  ✓ all checks passed");
}

console.log(`\n=== ${errors === 0 ? "PASS" : "FAIL"} — ${errors} error(s) across ${STORES.length} themes ===`);
process.exit(errors ? 1 : 0);
