// Knopf „Neu“ (2.28.33: dritter Eintrag „Hilfe auf neuem Stand“) mit Fenster „Was ist neu“ (Klaus 2026-11-05): roter Punkt bei Ungelesenem, × je Eintrag, gemerkt je Gerät
// (auch nach Neuladen), Demo getrennt, „Kalender verbinden“ springt zur Karte, Platz im Kopf am Handy.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, collectErrors } from "./_harness.mjs";
import { demoUmschalten } from "./_demo.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  const knopf = page.locator(".neu-knopf-schalter");

  await step("Kopf: Knopf „Neu“ mit rotem Punkt, drei ungelesene", async () => (await knopf.isVisible()) && (await page.locator(".neu-knopf .neu-punkt").count()) === 1 && (await knopf.getAttribute("data-ungelesen")) === "3");
  await step("Fenster „Was ist neu“: Hilfe auf neuem Stand, Fristen im Kalender, Akten sichern, je mit ×", async () => {
    await knopf.click();
    const titel = await page.locator(".neu-fenster .neu-eintrag strong").allInnerTexts();
    return titel.join("|") === "Hilfe auf neuem Stand|Fristen im Kalender|Akten sichern" && (await page.locator(".neu-fenster .neu-x").count()) === 3;
  });
  await step("„Kalender verbinden“ führt zu Fristen → Karte „Kalender verbinden“", async () => {
    await page.locator(".neu-fenster button", { hasText: "Kalender verbinden" }).click();
    await page.locator("#kalender-verbinden").waitFor();
    await page.waitForTimeout(700);
    const r = await page.locator("#kalender-verbinden").boundingBox();
    return Boolean(r) && r.y < 1000 && (await page.locator(".neu-fenster").count()) === 0;
  });
  await step("× blendet einen Eintrag aus, der Punkt bleibt, solange noch einer da ist", async () => {
    await knopf.click();
    await page.locator('.neu-eintrag[data-neu="akten-sichern-2026-11"] .neu-x').click();
    return (await page.locator(".neu-fenster .neu-eintrag").count()) === 2 && (await page.locator(".neu-knopf .neu-punkt").count()) === 1;
  });
  await step("„Zur Hilfe“ führt in die Hilfe mit den neuen Themen", async () => {
    await page.locator('.neu-eintrag[data-neu="hilfe-2026-11-07"] button', { hasText: "Zur Hilfe" }).click();
    await page.locator('details[data-hilfe-thema="mein-kalender"]').waitFor();
    return (await page.locator("details[data-hilfe-thema]").count()) === 13 && (await page.locator(".neu-fenster").count()) === 0;
  });
  await step("Zweites × blendet „Hilfe auf neuem Stand“ aus", async () => {
    await knopf.click();
    await page.locator('.neu-eintrag[data-neu="hilfe-2026-11-07"] .neu-x').click();
    return (await page.locator(".neu-fenster .neu-eintrag").count()) === 1;
  });
  await step("Letztes × : Punkt weg, „Nichts Neues“", async () => {
    await page.locator(".neu-fenster .neu-x").click();
    return (await page.locator(".neu-knopf .neu-punkt").count()) === 0 && /Nichts Neues/.test(await page.locator(".neu-fenster").innerText());
  });
  await step("Esc schließt, Tipp daneben ebenso", async () => {
    await page.keyboard.press("Escape");
    const zu1 = (await page.locator(".neu-fenster").count()) === 0;
    await knopf.click(); await page.mouse.click(700, 600);
    return zu1 && (await page.locator(".neu-fenster").count()) === 0;
  });
  await step("Nach Neuladen bleibt alles gelesen", async () => {
    await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector(".neu-knopf-schalter");
    return (await page.locator(".neu-knopf .neu-punkt").count()) === 0 && (await knopf.getAttribute("data-ungelesen")) === "0";
  });
  await step("Demo getrennt: in der Demo ist wieder alles ungelesen", async () => {
    await demoUmschalten(page, true);
    await page.waitForSelector(".neu-knopf-schalter");
    return (await page.locator(".neu-knopf-schalter").getAttribute("data-ungelesen")) === "3";
  });
  check(errors.length === 0, "Desktop: keine Seitenfehler", errors.join(" | "));
  await context.close();

  for (const breite of [390, 320]) {
    const ctx = await browser.newContext({ ...HANDY, viewport: { width: breite, height: 760 } });
    const p = await ctx.newPage(); const err = collectErrors(p);
    await p.goto(app.base, { waitUntil: "networkidle" }); await ready(p);
    await step(`Handy ${breite} px: Kopf ohne Überlauf, „Neu“ und Menü sichtbar, Fenster im Bild, Knopf „Kalender verbinden“ sichtbar`, async () => {
      const m = await p.evaluate(() => {
        const kopf = document.querySelector(".masthead"), neu = document.querySelector(".neu-knopf-schalter").getBoundingClientRect(), menue = document.querySelector(".mobile-menu-button").getBoundingClientRect();
        return { ueber: kopf.scrollWidth - kopf.clientWidth, seite: document.documentElement.scrollWidth - innerWidth, neuRechts: neu.right, menueRechts: menue.right, breite: innerWidth, hoehe: kopf.getBoundingClientRect().height };
      });
      await p.locator(".neu-knopf-schalter").click();
      const f = await p.locator(".neu-fenster").boundingBox();
      const knopfDa = await p.locator(".neu-fenster button", { hasText: "Kalender verbinden" }).isVisible();
      const ok = knopfDa && m.ueber <= 0 && m.seite <= 0 && m.neuRechts <= m.breite && m.menueRechts <= m.breite && f && f.x >= 0 && f.x + f.width <= m.breite + 0.5;
      return ok ? `Kopfhöhe ${Math.round(m.hoehe)} px` : (console.log("   ↳", JSON.stringify({ ...m, f })), false);
    });
    check(err.length === 0, `Handy ${breite} px: keine Seitenfehler`, err.join(" | "));
    await ctx.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Neu-Knopf"));
