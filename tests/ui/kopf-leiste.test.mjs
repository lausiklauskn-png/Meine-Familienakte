// 2.28.38 (Klaus 08.11.2026): Kopf im geteilten Bildschirm und am Handy – nichts überlagert den Namen; Installieren
// und Abmelden stehen bis 900 px hinter dem Pfeil ‹ in einer Leiste, › schließt. Breiter stehen alle Knöpfe direkt da.
// 2.28.39 (Vorschau neugestaltung Punkt 2/3): kein Drucker und kein ⟳ mehr im Kopf, dafür „Ablegen“; am Handy ein Wort unter jedem Symbol.
import { startApp, launchBrowser, ready, check, step, summary, collectErrors } from "./_harness.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };
const S = process.env.KOPF_BILDER || "";
const app = await startApp();
const browser = await launchBrowser();
const sichtbar = (page, sel) => page.locator(sel).evaluateAll((l) => l.some((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden"; }));
try {
  for (const breite of [360, 390, 640, 1280]) {
    const context = await browser.newContext({ viewport: { width: breite, height: 800 }, deviceScaleFactor: 1, hasTouch: breite < 900, locale: "de-DE" });
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await step(`${breite} px: der Name „FAMILIENAKTE“ wird von keinem Knopf überdeckt`, async () => {
      const r = await page.evaluate(() => { const t = document.querySelector(".site-brand > span:last-child").getBoundingClientRect(); const a = [...document.querySelectorAll(".header-actions > *")].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.getBoundingClientRect().left); return { ende: t.right, knoepfe: Math.min(...a) }; });
      const ganz = await page.evaluate(() => { const s = document.querySelector(".site-brand strong"); return s.scrollWidth <= s.clientWidth + 1; });
      return soll(r.ende <= r.knoepfe + 1 && ganz, { ...r, ganz });
    });
    if (S) await page.screenshot({ path: `${S}/kopf-${breite}-zu.png`, clip: { x: 0, y: 0, width: breite, height: 80 } });
    if (breite >= 901) {
      await step(`${breite} px: kein Pfeil, Abmelden direkt im Kopf`, async () => soll(!(await sichtbar(page, "[data-kopf-auf]")) && await sichtbar(page, ".header-actions > :is(.logout-button, .login-button)"), "Pfeil oder Abmelden falsch"));
    } else {
      await step(`${breite} px: Pfeil ‹ sichtbar, Abmelden zunächst nicht`, async () => soll(await sichtbar(page, "[data-kopf-auf]") && !(await sichtbar(page, ".header-actions > :is(.logout-button, .login-button)")), "Pfeil fehlt oder Abmelden sichtbar"));
      await step(`${breite} px: ‹ öffnet die Leiste mit Abmelden und ›, „Neu“ ist solange verdeckt; › schließt`, async () => {
        await page.locator("[data-kopf-auf]").click(); await page.waitForTimeout(300);
        const auf = { drucken: await sichtbar(page, ".header-actions > :is(.logout-button, .login-button)"), zu: await sichtbar(page, "[data-kopf-zu]"), neu: await sichtbar(page, ".header-actions > .neu-knopf") };
        if (S) await page.screenshot({ path: `${S}/kopf-${breite}-auf.png`, clip: { x: 0, y: 0, width: breite, height: 80 } });
        await page.locator("[data-kopf-zu]").click(); await page.waitForTimeout(300);
        const danach = { drucken: await sichtbar(page, ".header-actions > :is(.logout-button, .login-button)"), neu: await sichtbar(page, ".header-actions > .neu-knopf") };
        return soll(auf.drucken && auf.zu && !auf.neu && !danach.drucken && danach.neu, { auf, danach });
      });
      await step(`${breite} px: Tipp daneben schließt die Leiste`, async () => {
        await page.locator("[data-kopf-auf]").click(); await page.waitForTimeout(200);
        await page.mouse.click(Math.round(breite / 2), 400); await page.waitForTimeout(300);
        return soll((await page.locator("[data-kopf-leiste]").getAttribute("data-kopf-leiste")) === "zu", "bleibt offen");
      });
    }
    await step(`${breite} px: kein Drucker und kein ⟳ im Kopf, „Ablegen“ sichtbar`, async () => soll((await page.locator(".header-actions .drucken-knopf, .header-actions .aktualisieren-knopf").count()) === 0 && await sichtbar(page, "[data-ablegen-knopf]"), "Drucker/⟳ noch da oder Ablegen fehlt"));
    if (breite <= 620) {
      await step(`${breite} px: unter Internet, Ablegen, Notiz, Kalender steht ein Wort`, async () => {
        const w = await page.evaluate(() => [...document.querySelectorAll(".header-actions .kopf-wort")].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.textContent));
        return soll(["Internet", "Ablegen", "Notiz", "Kalender"].every((x) => w.includes(x)), w);
      });
    } else {
      await step(`${breite} px: breiter keine Wörter unter den Symbolen`, async () => soll(!(await sichtbar(page, ".header-actions .kopf-wort")), "Wörter sichtbar"));
    }
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${breite} px: Seite läuft nicht quer`);
    check(errors.length === 0, `${breite} px: keine Seitenfehler`, errors.join(" | "));
    await context.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Kopf mit Aufklappleiste"));
