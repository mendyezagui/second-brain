#!/usr/bin/env node
// Render one or more payloads into a SINGLE multi-page PDF.
//
// A double-sided handout has to be one file with page 1 = front and page 2 =
// back, or whoever prints it ends up collating by hand. Chromium's own print
// pipeline is used (same as the browser's "Save as PDF"), and the pages are
// concatenated at the PDF level rather than by stacking HTML, so each side
// keeps its own exact @page size.
//
//   node scripts/render-pdf.mjs --out x.pdf --print \
//        --page schedule:front.json --page guide:back.json

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createServer } from "node:http";
import { renderFlyer } from "../src/lib/sofa/templates.js";
import { CANVAS } from "../src/lib/sofa/brand.js";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i > -1 ? argv[i + 1] : d; };
const pages = argv.reduce((a, v, i) => (v === "--page" ? [...a, argv[i + 1]] : a), []);
const out = arg("out");
const printMode = argv.includes("--print");
const canvasName = arg("canvas", "letter");
const canvas = CANVAS[canvasName] || CANVAS.letter;
if (!out || pages.length === 0) { console.error("--out and at least one --page tpl:data.json required"); process.exit(1); }

// The templates reference the logo at a root-relative URL, which setContent()
// cannot resolve. Serve public/ for the life of the render.
const root = resolve(new URL("..", import.meta.url).pathname, "public");
const server = createServer(async (req, res) => {
  try {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (rel.includes("..")) { res.writeHead(403).end(); return; }
    res.writeHead(200, { "Content-Type": rel.endsWith(".png") ? "image/png" : "application/octet-stream" })
       .end(await readFile(resolve(root, "." + rel)));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}/`;

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const buffers = [];
for (const spec of pages) {
  const [tpl, dataPath] = spec.split(":");
  const payload = JSON.parse(await readFile(resolve(dataPath), "utf8"));
  let html = renderFlyer(tpl, payload, { canvas: canvasName, print: printMode });
  html = html.replace(/<base href="[^"]*">/, `<base href="${origin}">`);
  const page = await browser.newPage({ viewport: { width: canvas.w, height: canvas.h } });
  await page.setContent(html, { waitUntil: "networkidle" });
  buffers.push(await page.pdf({
    width: `${canvas.w}px`, height: `${canvas.h}px`,
    printBackground: true, pageRanges: "1",
  }));
  await page.close();
  console.log(`  page ${buffers.length}: ${tpl} (${canvas.w}x${canvas.h}${printMode ? ", white ground" : ""})`);
}
await browser.close();
server.close();

await mkdir(dirname(resolve(out)), { recursive: true });
if (buffers.length === 1) { await writeFile(resolve(out), buffers[0]); }
else {
  // Concatenate at the PDF level so each page keeps its own MediaBox.
  const { PDFDocument } = await import("pdf-lib");
  const merged = await PDFDocument.create();
  for (const b of buffers) {
    const src = await PDFDocument.load(b);
    const copied = await merged.copyPages(src, src.getPageIndices());
    copied.forEach((pg) => merged.addPage(pg));
  }
  await writeFile(resolve(out), Buffer.from(await merged.save()));
}
console.log(`wrote ${out} — ${buffers.length} page(s)`);
