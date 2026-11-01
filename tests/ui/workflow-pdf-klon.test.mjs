// Stück 1 (Klaus 2026-11-01, Weg B): die ganze App Workflow PDF als Klon in der Familienakte.
// Geprüft: Menü Dokumente → „Workflow PDF“ zeigt den Klon im Rahmen · Farben der Akte (Petrol statt Rot) · kein Mycel, kein
// Installieren, kein ⟳ · eigene Bibliothek („FamilienakteWFPDF1“, Schlüssel „fa_wfpdf_*“), die Datenbank der Workflow-PDF-PWA
// bleibt unberührt · ⟳-Weg sieht weder Vorräte noch Service Worker der Akte · Einlesen eines PDF im Klon geht und bleibt nach dem
// Neuladen · kein Service Worker und kein Mycel-Baustein aus dem Klon geladen · Handy 390 px ohne Querrollen.
import { readFileSync } from "node:fs";
import path from "node:path";
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, collectErrors, ROOT } from "./_harness.mjs";

const zumKlon = async (page) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".main-navigation .nav-cluster > button", { hasText: "Dokumente" }).first().click({ force: true });
  await page.locator(".mega-menu button", { hasText: "Workflow PDF" }).first().click();
  await page.locator("[data-wfpdf-seite]").waitFor();
  const f = page.frameLocator("[data-wfpdf-rahmen]");
  await f.locator("#sc-bib").waitFor({ timeout: 30000 });
  return page.frames().find((x) => x.url().includes("/apps/workflow-pdf/"));
};
const PDF = path.join(ROOT, "tests/testdateien/Garantiebeleg_Waschautomat_Lavorix.pdf");

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = collectErrors(page);
  const klonAnfragen = [];
  page.on("request", (r) => { const u = r.url(); if (/\/apps\/workflow-pdf\//.test(u)) klonAnfragen.push(u); });
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  check(klonAnfragen.length === 0, "Start: vom Klon wird nichts geladen", klonAnfragen.slice(0, 2).join(" "));
  // Eine „echte“ Workflow-PDF-PWA am selben Ursprung vortäuschen: ihre Datenbank und Einstellung dürfen unberührt bleiben.
  await page.evaluate(() => new Promise((ok) => { const r = indexedDB.open("WorkflohPDF1", 1); r.onupgradeneeded = () => r.result.createObjectStore("docs", { keyPath: "id" }); r.onsuccess = () => { r.result.close(); localStorage.setItem("wfpdf_einst_v1", "{\"fremd\":1}"); ok(); }; }));

  let klon;
  await step("Menü Dokumente → „Workflow PDF“: Klon erscheint im Rahmen", async () => { klon = await zumKlon(page); return !!klon; });
  check(await klon.evaluate(() => document.documentElement.getAttribute("data-fa-eingebettet")) === "1", "Brücke läuft im Klon (eingebettet)");
  const farbe = await klon.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--rot").trim().toLowerCase());
  check(farbe === "#087f7a", "Farben der Familienakte (Petrol statt Rot)", farbe);
  check(!(await klon.locator(".netzleiste").isVisible()) && !(await klon.locator("#btnInstall").isVisible()) && !(await klon.locator("#btnNeu").isVisible()), "Kein Mycel, kein Installieren, kein ⟳ im Klon");
  check(await klon.evaluate(() => !window.SbkimRendezvous && !document.querySelector('script[src*="sbkim-init"]')), "Kein Mycel-Baustein geladen");
  check(!klonAnfragen.some((u) => /\/sbkim\/|sbkim-init|\/sw\.js/.test(u)), "Keine Anfrage an Mycel oder eigenen Service Worker", klonAnfragen.filter((u) => /sbkim|sw\.js/.test(u)).join(" "));
  const sw = await klon.evaluate(async () => ({ reg: (await navigator.serviceWorker.getRegistrations()).length, keys: await caches.keys(), anmelden: await navigator.serviceWorker.register("sw.js").then(() => "ja", () => "nein") }));
  check(sw.reg === 0 && sw.keys.every((k) => k.startsWith("fa-wfpdf-")) && sw.anmelden === "nein", "⟳-Weg sieht keine Vorräte/Worker der Akte, kein eigener Worker", JSON.stringify(sw));

  await step("PDF im Klon einlesen", async () => {
    await klon.locator("#inDatei").setInputFiles({ name: "Garantiebeleg.pdf", mimeType: "application/pdf", buffer: readFileSync(PDF) });
    // ein einzelnes PDF öffnet den Editor: zurück zur Bibliothek
    await klon.waitForFunction(() => document.querySelectorAll(".dok").length > 0 || document.querySelector("#sc-ed.on"), null, { timeout: 30000 });
    if (await klon.locator("#sc-ed.on").count()) await klon.locator("#edZurueck").click();
    await klon.locator(".dok", { hasText: "Garantiebeleg" }).first().waitFor({ timeout: 30000 });
    return true;
  });
  const dbs = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
  check(dbs.includes("FamilienakteWFPDF1"), "Eigene Datenbank „FamilienakteWFPDF1“", dbs.join(", "));
  const fremd = await page.evaluate(() => new Promise((ok) => { const r = indexedDB.open("WorkflohPDF1"); r.onsuccess = () => { const db = r.result; const n = [...db.objectStoreNames]; if (!n.includes("docs")) { db.close(); return ok(-1); } const c = db.transaction("docs").objectStore("docs").count(); c.onsuccess = () => { db.close(); ok(c.result); }; }; }));
  check(fremd === 0, "Datenbank der Workflow-PDF-PWA unberührt (0 Dokumente)", String(fremd));
  await klon.evaluate(() => localStorage.setItem("wfpdf_probe_v1", "klon"));
  check(await page.evaluate(() => localStorage.getItem("fa_wfpdf_probe_v1")) === "klon" && await klon.evaluate(() => localStorage.getItem("wfpdf_probe_v1")) === "klon", "Einstellung des Klons landet unter fa_wfpdf_*");
  const ls = await page.evaluate(() => Object.keys(localStorage).filter((k) => /wfpdf_/.test(k)));
  check(ls.includes("wfpdf_einst_v1") && await page.evaluate(() => localStorage.getItem("wfpdf_einst_v1")) === "{\"fremd\":1}" && ls.filter((k) => k.startsWith("wfpdf_")).length === 1, "Einstellungen der Workflow-PDF-PWA unberührt, Klon schreibt nur fa_wfpdf_*", ls.join(", "));

  await step("Nach dem Neuladen: Dokument im Klon noch da", async () => {
    await page.reload({ waitUntil: "networkidle" }); await ready(page);
    klon = await zumKlon(page);
    await klon.locator(".dok", { hasText: "Garantiebeleg" }).first().waitFor({ timeout: 20000 });
    return true;
  });

  const handy = await (await browser.newContext(HANDY)).newPage();
  await handy.goto(app.base, { waitUntil: "networkidle" }); await ready(handy);
  await step("Handy 390 px: Klon ohne Querrollen", async () => {
    await handy.evaluate(() => window.scrollTo(0, 0));
    await handy.locator(".mobile-menu-button").click();
    await handy.locator(".main-navigation .nav-cluster > button", { hasText: "Dokumente" }).first().click({ force: true });
    await handy.locator(".mega-menu .mega-group button", { hasText: "Workflow PDF" }).first().click({ force: true });
    await handy.frameLocator("[data-wfpdf-rahmen]").locator("#sc-bib").waitFor({ timeout: 30000 });
    const ueber = await handy.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    return ueber <= 1 ? `Überlauf ${ueber} px` : false;
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Workflow PDF als Klon"));
