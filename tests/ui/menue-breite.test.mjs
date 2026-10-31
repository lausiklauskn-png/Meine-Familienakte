// Klaus 2026-10-31 (Tablet, geteilte Ansicht ≈ 1000 px): „ich finde nicht mal das Wort Eingangszentrale“. Ursache: zwischen 901 und
// 1000 px lief die Menüleiste rechts aus dem Fenster (1090 px), „Käufe & Garantien“, „Dokumente“ und „Hilfe“ waren unsichtbar.
// Jetzt bricht sie dort wie bei 1001–1439 px in zwei Reihen um. Geprüft: alle acht Menüs ganz im Fenster, Eingangszentrale erreichbar.
import { startApp, launchBrowser, ready, check, step, summary, collectErrors } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  for (const breite of [901, 960, 1000, 1024, 1280, 1440]) {
    const page = await (await browser.newContext({ viewport: { width: breite, height: 1000 }, locale: "de-DE" })).newPage();
    page.setDefaultTimeout(15000);
    const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    const lage = await page.evaluate(() => [...document.querySelectorAll(".main-navigation .nav-cluster > button")].map((b) => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim(), l: r.left, r: r.right, sichtbar: r.width > 0 && r.left >= 0 && r.right <= window.innerWidth + 0.5 }; }));
    const weg = lage.filter((x) => !x.sichtbar).map((x) => x.t);
    check(lage.length === 8 && weg.length === 0, `${breite} px: alle acht Menüs ganz im Fenster`, weg.length ? `abgeschnitten: ${weg.join(", ")}` : "");
    await step(`${breite} px: Dokumente → Eingangszentrale erreichbar`, async () => {
      await page.locator(".main-navigation .nav-cluster > button", { hasText: "Dokumente" }).first().click();
      await page.locator(".mega-menu button", { hasText: "Eingangszentrale" }).first().click();
      await page.locator("[data-formular-scannen]").waitFor();
      return true;
    });
    const quer = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(quer <= 0, `${breite} px: kein Querrollen`, `${quer} px`);
    check(errors.length === 0, `${breite} px: keine Seitenfehler`, errors.join(" | "));
    await page.context().close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Menüleiste je Breite"));
