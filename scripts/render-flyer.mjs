#!/usr/bin/env node
// Render a flyer's HTML to PNG.
//
// The associate stores flyers as HTML because that is what stays editable and
// diffable in git. A PNG is what actually gets sent to a WhatsApp group or
// pinned to a board, so this turns one into the other at exact canvas size.
//
//   node scripts/render-flyer.mjs --template holiday --data flyer.json --out public/sofa-jcc/flyers/x.png
//   node scripts/render-flyer.mjs --html flyer.html --out x.png
//
// Playwright is intentionally NOT a dependency: the deployed app never renders
// PNGs, so it would be ~19MB added to every Vercel build for nothing. Install it
// on demand:  npm i -D playwright && npx playwright install chromium

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { renderFlyer } from "../src/lib/sofa/templates.js";
import { CANVAS } from "../src/lib/sofa/brand.js";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i > -1 ? argv[i + 1] : d; };

const out = arg("out");
if (!out) { console.error("--out <path.png> is required"); process.exit(1); }

const canvasName = arg("canvas", "portrait");
const canvas = CANVAS[canvasName] || CANVAS.portrait;

let html = arg("html") ? await readFile(resolve(arg("html")), "utf8") : null;
if (!html) {
  const template = arg("template", "holiday");
  const dataPath = arg("data");
  if (!dataPath) { console.error("--data <payload.json> or --html <file> is required"); process.exit(1); }
  const payload = JSON.parse(await readFile(resolve(dataPath), "utf8"));
  html = renderFlyer(template, payload, { canvas: canvasName });
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("playwright not installed. Run: npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}

const launch = process.env.PLAYWRIGHT_CHROMIUM_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
  : {};
const browser = await chromium.launch(launch);
const page = await browser.newPage({
  viewport: { width: canvas.w, height: canvas.h },
  deviceScaleFactor: Number(arg("scale", "1")),
});
await page.setContent(html, { waitUntil: "networkidle" });
await mkdir(dirname(resolve(out)), { recursive: true });
await page.screenshot({ path: resolve(out), type: "png" });
await browser.close();

if (arg("save-html")) await writeFile(resolve(arg("save-html")), html, "utf8");
console.log(`rendered ${canvasName} ${canvas.w}x${canvas.h} -> ${out}`);
