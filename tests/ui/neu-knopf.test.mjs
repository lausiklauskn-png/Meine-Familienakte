// Knopf „Neu“ (2.28.51: sechster Eintrag „Zustand deines Geräts auf einen Blick“ ganz oben; 2.28.35: fünfter Eintrag „E-Mail in der Hilfe“; 2.28.34: vierter Eintrag „Sichern auch am Handy“; 2.28.33: „Hilfe auf neuem Stand“) mit Fenster „Was ist neu“ (Klaus 2026-11-05): roter Punkt bei Ungelesenem, × je Eintrag, gemerkt je Gerät
// (auch nach Neuladen), Demo getrennt, „Kalender verbinden“ springt zur Karte, Platz im Kopf am Handy.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, collectErrors, neuKnopf } from "./_harness.mjs";
import { demoUmschalten } from "./_demo.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  const knopf = page.locator(".neu-knopf-schalter");

  await step("Kopf: Knopf „Neu“ mit rotem Punkt, vier ungelesene", async () => (await knopf.isVisible()) && (await page.locator(".neu-knopf .neu-punkt").count()) === 1 && (await knopf.getAttribute("data-ungelesen")) === "4");
  await step("Fenster „Was ist neu“: nur die letzten zwei Fassungen, je ein Satz, je mit ×", async () => {
    await knopf.click();
    const titel = await page.locator(".neu-fenster .neu-eintrag strong").allInnerTexts();
    const saetze = await page.locator(".neu-fenster .neu-eintrag p").allInnerTexts();
    return titel.join("|") === "Sicherung an einem zweiten Ort|Cloud-Ordner hereinholen|E-Mail: Weg wählen|Landkarte zeigt, was zu tun ist" && saetze.every((t) => t.length <= 80 && !/ jetzt /.test(t)) && (await page.locator(".neu-fenster .neu-x").count()) === 4;
  });
  await step("„Einrichten“ führt ins Sicherheitscenter zur Karte „Sicherung an einem zweiten Ort“", async () => {
    await page.locator(".neu-fenster button", { hasText: "Einrichten" }).click();
    await page.locator("[data-zweiter-ort]").waitFor();
    await page.waitForTimeout(700);
    const r = await page.locator("[data-zweiter-ort]").boundingBox();
    return Boolean(r) && r.y < 1000 && (await page.locator(".neu-fenster").count()) === 0;
  });
  await step("× blendet einen Eintrag aus, der Punkt bleibt, solange noch einer da ist", async () => {
    await knopf.click();
    await page.locator('.neu-eintrag[data-neu="cloud-ordner-2026-11-12"] .neu-x').click();
    return (await page.locator(".neu-fenster .neu-eintrag").count()) === 3 && (await page.locator(".neu-knopf .neu-punkt").count()) === 1;
  });
  await step("„Landkarte öffnen“ führt in die Hilfe mit den Themen", async () => {
    await page.locator('.neu-eintrag[data-neu="landkarte-farben-2026-11-11"] button', { hasText: "Landkarte öffnen" }).click();
    await page.locator('details[data-hilfe-thema="mein-kalender"]').waitFor();
    // 15 Themen aus hilfe-themen.tsx (2.28.39: „Internet für die App“) und 39 als Bild aus hilfe-bilder.tsx (2.28.36: 6, 2.28.37: 33 weitere)
    return (await page.locator("details[data-hilfe-thema]").count()) === 54 && (await page.locator(".neu-fenster").count()) === 0;
  });
  await step("Zweites × blendet „E-Mail: Weg wählen“ aus", async () => {
    await knopf.click();
    await page.locator('.neu-eintrag[data-neu="email-wege-2026-11-12"] .neu-x').click();
    return (await page.locator(".neu-fenster .neu-eintrag").count()) === 2;
  });
  await step("Letzte × : Punkt weg, „Nichts Neues“", async () => {
    for (let i = 0; i < 2; i++) await page.locator(".neu-fenster .neu-x").first().click();
    return (await page.locator(".neu-knopf .neu-punkt").count()) === 0 && /Nichts Neues/.test(await page.locator(".neu-fenster").innerText());
  });
  await step("Esc schließt, Tipp daneben ebenso", async () => {
    await page.keyboard.press("Escape");
    const zu1 = (await page.locator(".neu-fenster").count()) === 0;
    await knopf.click(); await page.mouse.click(700, 600);
    return zu1 && (await page.locator(".neu-fenster").count()) === 0;
  });
  await step("Nach Neuladen bleibt alles gelesen", async () => {
    await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector(".neu-knopf-schalter", { state: "attached" });
    return (await page.locator(".neu-knopf .neu-punkt").count()) === 0 && (await knopf.getAttribute("data-ungelesen")) === "0";
  });
  await step("Demo getrennt: in der Demo ist wieder alles ungelesen", async () => {
    await demoUmschalten(page, true);
    await page.waitForSelector(".neu-knopf-schalter", { state: "attached" });
    return (await page.locator(".neu-knopf-schalter").getAttribute("data-ungelesen")) === "4";
  });
  check(errors.length === 0, "Desktop: keine Seitenfehler", errors.join(" | "));
  await context.close();

  for (const breite of [390, 320]) {
    const ctx = await browser.newContext({ ...HANDY, viewport: { width: breite, height: 760 } });
    const p = await ctx.newPage(); const err = collectErrors(p);
    await p.goto(app.base, { waitUntil: "networkidle" }); await ready(p);
    await step(`Handy ${breite} px: Kopf ohne Überlauf, Menü sichtbar, „Neu“ hinter ‹, Fenster im Bild, Knopf „Einrichten“ sichtbar`, async () => {
      const m = await p.evaluate(() => {
        const kopf = document.querySelector(".masthead"), neu = document.querySelector(".neu-knopf-schalter").getBoundingClientRect(), menue = document.querySelector(".mobile-menu-button").getBoundingClientRect();
        return { ueber: kopf.scrollWidth - kopf.clientWidth, seite: document.documentElement.scrollWidth - innerWidth, neuRechts: neu.right, menueRechts: menue.right, breite: innerWidth, hoehe: kopf.getBoundingClientRect().height };
      });
      await (await neuKnopf(p)).click();
      const f = await p.locator(".neu-fenster").boundingBox();
      const knopfDa = await p.locator(".neu-fenster button", { hasText: "Einrichten" }).isVisible();
      const ok = knopfDa && m.ueber <= 0 && m.seite <= 0 && m.neuRechts <= m.breite && m.menueRechts <= m.breite && f && f.x >= 0 && f.x + f.width <= m.breite + 0.5;
      return ok ? `Kopfhöhe ${Math.round(m.hoehe)} px` : (console.log("   ↳", JSON.stringify({ ...m, f })), false);
    });
    check(err.length === 0, `Handy ${breite} px: keine Seitenfehler`, err.join(" | "));
    await ctx.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Neu-Knopf"));
