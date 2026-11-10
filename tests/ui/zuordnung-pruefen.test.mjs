// Gerätetest 10.11.2026 (Tablet, 2.28.52): Karte „Zuordnung prüfen“ blieb rot und „unklar“ mit der Dateinummer, auch nach eigener Wahl;
// „Vorgang wählen“ war ohne angelegte Vorgänge eine leere Liste. Jetzt: Titel aus dem Feld, Haken „Zuordnung stimmt“ (alle vier
// Vorschläge auf einmal), grüner Rand nach eigener Wahl, ohne Vorgänge ein erklärender Satz statt leerer Liste.
import { startApp, launchBrowser, ready, footer, step, soll, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";
import { probePng } from "./_dateien.mjs";
const TAB = { viewport: { width: 1000, height: 625 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: "de-DE" };
const app = await startApp(); const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(TAB)).newPage(); page.setDefaultTimeout(8000);
  await page.addInitScript(windowStub); const errs = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await footer(page, "Dokumentenbibliothek");
  await page.locator("button", { hasText: "Neue Unterlage" }).first().click();
  await page.locator('.modal input[type="file"]').setInputFiles(probePng()); await page.waitForTimeout(2000);
  const karte = page.locator("[data-zuordnung-karte]");
  const lage = async () => ({ klasse: await karte.getAttribute("class"), stand: await page.locator("[data-zuordnung-stand]").textContent(), titel: await page.locator("[data-zuordnung-titel]").innerText(),
    gewaehlt: await page.locator(".intake-choice-card small", { hasText: "von dir gewählt" }).count() });
  await step("Foto ohne Hinweis: Karte rot, „bitte prüfen“, Haken aus", async () => {
    const r = await lage(); return soll(/confidence-unklar/.test(r.klasse) && r.stand === "bitte prüfen" && !(await page.locator("[data-zuordnung-stimmt]").isChecked()), r);
  });
  await step("Eigener Titel erscheint oben in der Karte statt des Dateinamens", async () => {
    await page.locator("[data-intake-titel]").fill("Guten morgen");
    await page.waitForTimeout(200); const r = await lage(); return soll(r.titel === "Guten morgen", r);
  });
  await step("Haken „Zuordnung stimmt“: alle vier übernommen, Rand grün, „bestätigt“ – ohne ein Feld zu öffnen", async () => {
    await page.locator("[data-zuordnung-stimmt]").tap(); await page.waitForTimeout(200);
    const r = await lage(); return soll(/confidence-angepasst/.test(r.klasse) && r.stand === "bestätigt" && r.gewaehlt === 4 && (await page.locator(".intake-choice-backdrop").count()) === 0, r);
  });
  await step("Haken wieder weg: zurück auf den Vorschlag, rot", async () => {
    await page.locator("[data-zuordnung-stimmt]").tap(); await page.waitForTimeout(200);
    const r = await lage(); return soll(/confidence-unklar/.test(r.klasse) && r.gewaehlt === 0, r);
  });
  await step("Eine Wahl über ≡ färbt die Karte grün, „von dir angepasst“", async () => {
    await page.locator('.modal button[aria-label="Bereich auswählen"]').tap(); await page.locator(".intake-choice-options button").nth(1).tap(); await page.waitForTimeout(200);
    const r = await lage(); return soll(/confidence-angepasst/.test(r.klasse) && r.stand === "von dir angepasst" && r.gewaehlt === 1, r);
  });
  await step("Vorgang: mit Vorgängen eine Liste, ohne Vorgänge ein Satz statt leerer Liste", async () => {
    const liste = await page.locator("[data-kontext-vorgang]").count(), satz = await page.locator("[data-kontext-ohne-vorgang]").count();
    const optionen = liste ? await page.locator("[data-kontext-vorgang] option").count() : 0;
    return soll((liste === 1 && optionen > 1 && satz === 0) || (liste === 0 && satz === 1), { liste, optionen, satz });
  });
  await step("Keine Seitenfehler", async () => soll(errs.length === 0, errs));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Zuordnung prüfen"));
