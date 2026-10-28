// Erzeugt die PNG-Symbole der PWA aus public/favicon.svg (Chromium über Playwright, kein ImageMagick nötig).
// Aufruf: node tools/icons-bauen.mjs  → public/icons/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(path.join(root, "public/favicon.svg"), "utf8");
const out = path.join(root, "public/icons"); mkdirSync(out, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
// Hintergrund wie manifest background_color; „maskable“ hält die Sicherheitszone ein (Motiv auf 62 % der Fläche).
async function render(size, { maskable = false, bg = "#f2f7fa", name }) {
  const scale = maskable ? 0.62 : 0.8;
  const inner = Math.round(size * scale), pad = Math.round((size - inner) / 2);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;width:${size}px;height:${size}px;background:${bg};display:block"><div style="position:absolute;left:${pad}px;top:${pad}px;width:${inner}px;height:${inner}px">${svg.replace('width="24" height="24"', `width="${inner}" height="${inner}"`)}</div></body></html>`);
  await page.screenshot({ path: path.join(out, name), clip: { x: 0, y: 0, width: size, height: size }, omitBackground: false });
  console.log("geschrieben", name, size);
}
await render(192, { name: "icon-192.png" });
await render(512, { name: "icon-512.png" });
await render(512, { maskable: true, bg: "#0b3154", name: "icon-maskable-512.png" });
await render(180, { name: "apple-touch-icon.png" });
await browser.close();
