#!/usr/bin/env node
/**
 * scripts/serve-dashboard.mjs — zero-dependency static server for the command deck.
 * Serves the repo root so the dashboard can fetch config/, catalogs/, reports/, state/
 * with relative paths.  node scripts/serve-dashboard.mjs [port]
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const ROOT = process.cwd();
const PORT = Number(process.argv[2] || 8787);
const TYPES = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".js": "text/javascript", ".css": "text/css", ".xml": "application/xml", ".md": "text/markdown; charset=utf-8", ".csv": "text/csv" };

createServer(async (req, res) => {
  let path = decodeURIComponent((req.url || "/").split("?")[0]);
  if (path === "/" || path === "") path = "/dashboard/index.html";
  const file = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ""));
  try {
    const s = await stat(file);
    const target = s.isDirectory() ? join(file, "index.html") : file;
    const body = await readFile(target);
    res.writeHead(200, { "Content-Type": TYPES[extname(target)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found: " + path);
  }
}).listen(PORT, () => console.log(`Dropper OS dashboard → http://localhost:${PORT}/dashboard/index.html`));
