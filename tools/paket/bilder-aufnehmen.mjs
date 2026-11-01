// Bildschirmfotos für das Paket (tools/paket/paketseite.py): neue Teile der Familienakte, markiert mit rotem Rahmen, Nummer und
// Zeigehand (Klaus 2026-11-01; Hand spiegelt sich am rechten Rand, Hände überdecken sich nie). Vorher `npm run build`.
// Aufruf: node tools/paket/bilder-aufnehmen.mjs <ausgabe-ordner>
import path from "node:path";
import { readFileSync } from "node:fs";
import { startApp, launchBrowser, ready, footer, ROOT } from "../../tests/ui/_harness.mjs";
import { windowStub } from "../../tests/ui/_stubs.mjs";
const OUT = process.argv[2];
const FORM = path.join(ROOT, "public/apps/workflow-pdf/beispiele/Beispiel-Amtsformular-Bewohnerparkausweis.pdf");
function briefPdf(name, zeilen) {
  const stream = zeilen.map((z, i) => `BT /F1 11 Tf 60 ${780 - i * 18} Td (${z.replace(/[()\\]/g, "")}) Tj ET`).join("\n");
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"];
  let out = "%PDF-1.4\n"; const off = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + off.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return { name, mimeType: "application/pdf", buffer: Buffer.from(out, "latin1") };
}
const BRIEF = briefPdf("Dokumentscan 2026-10-12.pdf", ["Stadtwerke Lindwurm GmbH, Postfach 12 34, 12345 Musterstadt", "", "Frau Erika Probe", "Wiesenweg 3", "54321 Beispielort",
  "", "Datum: 12.10.2026", "Kundennummer: 4711-0815", "Betreff: Jahresabrechnung Strom", "", "Sehr geehrte Frau Probe,", "anbei Ihre Jahresabrechnung fuer Strom und Gas.",
  "Ihr neuer Abschlag betraegt 80 Euro.", "Mit freundlichen Gruessen", "Stadtwerke Lindwurm GmbH"]);
const app = await startApp();
const browser = await launchBrowser();
const shot = async (loc, name) => { try { const l = loc.first(); await l.scrollIntoViewIfNeeded(); const pg = l.page();
  const r = await l.evaluate((e) => { const b = e.getBoundingClientRect(); return { x: b.x + scrollX, y: b.y + scrollY, w: b.width, h: b.height, W: document.documentElement.scrollWidth }; });
  const x = Math.max(0, r.x - 24), y = Math.max(0, r.y - 24), w = Math.min(r.W - x, r.w + 24 + 70), h = r.h + 24 + 70;
  await pg.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 72, fullPage: true, clip: { x, y, width: w, height: h } }); console.log("OK", name); } catch (e) { console.log("FEHLT", name, String(e).slice(0, 160)); } };

const HAND = "data:image/png;base64," + readFileSync(new URL("./zeigehand.png", import.meta.url)).toString("base64");
const markieren = async (page, ziele) => {
  await page.evaluate(() => { document.querySelectorAll(".fa-mark").forEach((n) => n.remove()); window.__faHaende = []; });
  for (const [loc, nr] of ziele) {
    const b = await loc.first().boundingBox().catch(() => null); if (!b) { console.log("ohne Ziel", nr); continue; }
    await page.evaluate(({ b, nr, HAND }) => {
      const x = b.x + scrollX, y = b.y + scrollY, p = 6;
      const ring = Object.assign(document.createElement("div"), { className: "fa-mark" });
      Object.assign(ring.style, { position: "absolute", left: x - p + "px", top: y - p + "px", width: b.width + 2 * p + "px", height: b.height + 2 * p + "px", border: "3.5px solid #d6261c", borderRadius: "14px", boxShadow: "0 0 0 3px rgba(255,255,255,.85)", zIndex: 2147483646, pointerEvents: "none" });
      const zahl = Object.assign(document.createElement("div"), { className: "fa-mark", textContent: nr });
      Object.assign(zahl.style, { position: "absolute", left: x - p - 14 + "px", top: y - p - 14 + "px", width: "28px", height: "28px", borderRadius: "50%", background: "#d6261c", color: "#fff", font: "800 16px/28px system-ui,sans-serif", textAlign: "center", boxShadow: "0 0 0 3px #fff", zIndex: 2147483647, pointerEvents: "none" });
      const W = 72, H = 73, breit = b.width > 300;
      const belegt = (window.__faHaende ||= []);
      const frei = (l, t) => l >= scrollX + 2 && l + W <= scrollX + innerWidth - 2 && !belegt.some((r) => l < r.l + W + 6 && l + W + 6 > r.l && t < r.t + H + 6 && t + H + 6 > r.t);
      const unten = y + b.height - 6, versuche = [];
      const ankerR = breit ? x + 140 : x + b.width, ankerL = breit ? x + b.width - 140 : x;
      for (const dx of [0, 40, -40, 80, -80, 120, -120, 160, -160, 220, -220]) { versuche.push({ l: ankerR - 6 + dx, s: false }); versuche.push({ l: ankerL - W + 6 + dx, s: true }); }
      const wahl = versuche.find((v) => frei(v.l, unten)) || versuche[0];
      belegt.push({ l: wahl.l, t: unten });
      const hand = Object.assign(document.createElement("img"), { className: "fa-mark", src: HAND, alt: "" });
      Object.assign(hand.style, { position: "absolute", width: W + "px", left: wahl.l + "px", top: unten + "px", transform: wahl.s ? "scaleX(-1)" : "none", zIndex: 2147483647, pointerEvents: "none", filter: "drop-shadow(0 2px 3px rgba(0,0,0,.35))" });
      document.body.append(ring, zahl, hand);
    }, { b, nr, HAND });
  }
};
const flach = (page) => page.addStyleTag({ content: ".site-header,.main-navigation{position:relative!important;top:auto!important}" });
const szene = async (name, fn) => { try { await fn(); } catch (e) { console.log("FEHLT", name, String(e).slice(0, 200)); } };
try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, locale: "de-DE", serviceWorkers: "block" })).newPage();
  page.setDefaultTimeout(30000);
  await page.addInitScript(windowStub);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await szene("kopf", async () => { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
    await markieren(page, [[page.locator(".site-brand-version"), 1], [page.locator(".netz-schalter"), 2], [page.locator('[aria-label="Auf eine neue Fassung prüfen"]'), 3], [page.locator(".site-header button", { hasText: "Installieren" }), 4]]);
    await page.screenshot({ path: `${OUT}/01-kopf.jpg`, type: "jpeg", quality: 72, clip: { x: 0, y: 0, width: 1280, height: 160 } }); console.log("OK kopf"); });
  await szene("eingang", async () => { await flach(page); await footer(page, "Eingangszentrale"); await page.waitForTimeout(600);
    await page.locator("[data-stapel]").scrollIntoViewIfNeeded();
    await markieren(page, [[page.locator("[data-dokument-scannen]"), 1], [page.locator("[data-stapel]"), 2], [page.locator("[data-formular-scannen]"), 3]]);
    await shot(page.locator("section", { has: page.locator("#central-intake-drop-title") }), "02-eingang"); });
  await szene("briefkopf", async () => {
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([BRIEF]);
    await page.locator(".intake-queue-item button", { hasText: "Zuordnung prüfen" }).first().click();
    const m = page.locator(".intake-modal");
    await m.getByText("Text gelesen").first().waitFor({ timeout: 30000 });
    await page.waitForFunction(() => (document.querySelector("[data-brief-feld=absender]")?.value || "").length > 0, null, { timeout: 15000 });
    await page.waitForTimeout(500);
    await markieren(page, [[m.locator("[data-briefkopf]"), 1], [m.locator(".intake-analysis-head strong"), 2]]);
    await shot(m, "05-briefkopf");
    await page.evaluate(() => document.querySelectorAll(".fa-mark").forEach((n) => n.remove()));
    await shot(m.locator("[data-briefkopf]"), "05b-briefkopf-zeile");
    await m.getByRole("button", { name: "Geprüft lokal speichern" }).click(); await m.waitFor({ state: "detached", timeout: 20000 });
  });
  await szene("formular", async () => {
    await footer(page, "Eingangszentrale");
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([FORM]);
    await page.locator(".intake-queue-item button", { hasText: "Zuordnung prüfen" }).first().click();
    await page.locator(".intake-modal button[type=submit]").click();
    await page.locator(".intake-modal").waitFor({ state: "detached", timeout: 20000 });
    const item = page.locator(".document-item", { hasText: "Bewohnerparkausweis" }).first();
    await item.waitFor({ timeout: 20000 }); await page.waitForTimeout(400);
    await markieren(page, [[item.locator("[data-af-oeffnen]"), 1], [item.locator("[data-wfpdf-oeffnen]"), 2]]);
    await shot(item, "06-unterlage-knoepfe");
    await page.evaluate(() => document.querySelectorAll(".fa-mark").forEach((n) => n.remove()));
    await item.locator("[data-af-oeffnen]").click();
    const dlg = page.locator("[data-af]"); await dlg.locator(".af-seite").first().waitFor({ timeout: 30000 });
    await dlg.locator("[data-af-erkennen]").click();
    await dlg.locator("[data-af-hinweis]", { hasText: "vorgeschlagen" }).waitFor({ timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(800);
    await markieren(page, [[dlg.locator("[data-af-erkennen]"), 1], [dlg.locator("button", { hasText: "Mit KI benennen" }), 2], [dlg.locator("button", { hasText: "Neu scannen" }), 3], [dlg.locator("button", { hasText: "Festes PDF speichern" }), 4]]);
    await page.screenshot({ path: `${OUT}/07-ausfuellen.jpg`, type: "jpeg", quality: 72 }); console.log("OK ausfuellen");
    await page.evaluate(() => document.querySelectorAll(".fa-mark").forEach((n) => n.remove()));
    await dlg.locator("button[aria-label='Ausfüllen schließen']").click();
  });
  await szene("wfpdf", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(".main-navigation .nav-cluster > button", { hasText: "Dokumente" }).first().click({ force: true });
    await page.waitForTimeout(400);
    await markieren(page, [[page.locator(".mega-menu button:visible", { hasText: "Workflow PDF" }), 1], [page.locator(".mega-menu button:visible", { hasText: "Stapel (noch einordnen)" }), 2]]);
    await shot(page.locator(".mega-menu:visible").first(), "03-menue");
    await page.evaluate(() => document.querySelectorAll(".fa-mark").forEach((n) => n.remove()));
    await page.locator(".mega-menu button", { hasText: "Workflow PDF" }).first().click();
    await page.frameLocator("[data-wfpdf-rahmen]").locator("#sc-bib").waitFor({ timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.locator("[data-wfpdf-rahmen]").scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, -120));
    await markieren(page, [[page.locator("[data-wfpdf-rahmen]"), 1]]);
    await page.screenshot({ path: `${OUT}/04-workflow-pdf.jpg`, type: "jpeg", quality: 72 }); console.log("OK wfpdf");
  });
  await szene("stapel", async () => {
    const bilder = await page.evaluate(async () => {
      const png = async (c) => Array.from(new Uint8Array(await (await new Promise((ok) => c.toBlob(ok, "image/png"))).arrayBuffer()));
      const mk = async (rot, n) => { const a = document.createElement("canvas"); a.width = 1200; a.height = 1600; const g = a.getContext("2d");
        g.fillStyle = "#3a3a3a"; g.fillRect(0, 0, a.width, a.height); g.save(); g.translate(600, 800); g.rotate(rot); g.fillStyle = "#fafafa"; g.fillRect(-380, -537, 760, 1074);
        g.fillStyle = "#222"; g.font = "bold 40px sans-serif"; g.fillText("Brief " + n, -300, -440);
        for (let i = 0; i < 16; i++) g.fillRect(-300, -380 + i * 50, 420 + (i % 3) * 60, 10); g.restore(); return png(a); };
      return [await mk(0.12, 1), await mk(-0.08, 2), await mk(0.05, 3)];
    });
    await footer(page, "Eingangszentrale");
    await page.locator("[data-stapel-start]").setInputFiles(bilder.map((b, i) => ({ name: `Scan-Rechnung-0${i + 1}.png`, mimeType: "image/png", buffer: Buffer.from(b) })));
    await page.locator('[data-stapel-lauf="fertig"]').waitFor({ timeout: 120000 });
    await page.waitForTimeout(500);
    await markieren(page, [[page.locator("[data-stapel-einst]"), 1], [page.locator("[data-stapel-einordnen]"), 2], [page.locator("[data-stapel-griff]").first(), 3]]);
    await shot(page.locator("[data-stapel-seite]"), "08-stapel-liste");
    await page.evaluate(() => document.querySelectorAll(".fa-mark").forEach((n) => n.remove()));
    await page.locator("[data-stapel-zeile] .fa-stapel-name").first().click();
    await page.locator("[data-stapel-vorschau]").waitFor(); await page.waitForTimeout(800);
    await markieren(page, [[page.locator("[data-stapel-vorschau]"), 1], [page.locator("[data-stapel-wfpdf]"), 2], [page.locator("[data-stapel-pruefen]"), 3]]);
    await shot(page.locator("[data-stapel-seite]"), "09-stapel-vorschau");
  });
} finally { await browser.close(); await app.stop(); }
