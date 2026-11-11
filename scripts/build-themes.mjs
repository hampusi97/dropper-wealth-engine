/**
 * scripts/build-themes.mjs — writes each store's root-valid Shopify OS 2.0 theme
 * into its own git worktree (branch = store id), so every branch has
 * layout/ sections/ templates/ snippets/ assets/ config/ locales/ at its ROOT.
 *
 *   node scripts/build-themes.mjs            # all 15 stores
 *   node scripts/build-themes.mjs store-02-luma-clinical
 */
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { STORES } from "./data/stores.mjs";
import { buildTheme } from "./lib/theme.mjs";

const ROOT = process.cwd();
const only = process.argv[2];
const targets = only ? STORES.filter((s) => s.id === only) : STORES;
if (targets.length === 0) { console.error(`unknown store: ${only}`); process.exit(1); }

const THEME_DIRS = ["layout", "sections", "templates", "snippets", "assets", "config", "locales"];
let files = 0;
for (const store of targets) {
  const out = join(ROOT, ".worktree", store.id);
  if (!existsSync(out)) { console.error(`missing worktree ${out} — run: git worktree add .worktree/${store.id} ${store.id}`); process.exit(1); }
  for (const d of THEME_DIRS) {
    rmSync(join(out, d), { recursive: true, force: true });
    mkdirSync(join(out, d), { recursive: true });
  }
  const theme = buildTheme(store, STORES);
  for (const [rel, content] of Object.entries(theme)) {
    const full = join(out, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
    files++;
  }
  console.log(`[theme] ${store.id}: ${Object.keys(theme).length} files`);
}
console.log(`[theme] done — ${targets.length} themes, ${files} files`);
