// Leere Akte: Beispieldaten entfernen, dann alle Seiten und die wichtigsten Knöpfe ohne Daten prüfen (keine Fehler, ehrliche Leermeldungen).
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors, footer, openMenu } from "./_harness.mjs";
import { windowStub, directoryPickerStub, schliesseDialoge, aufraeumen } from "./_stubs.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage(); page.setDefaultTimeout(8000);
  await page.addInitScript(windowStub); await page.addInitScript(directoryPickerStub);
  const errors = collectErrors(page);
  await step("Start und Beispieldaten entfernen", async () => {
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    const k = page.locator("button", { hasText: "Beispieldaten entfernen" }); await k.focus(); await page.keyboard.press("Enter");
    await page.locator(".page-dialog button", { hasText: "Ja, fortfahren" }).click();
    await page.waitForSelector(".sample-data-notice", { state: "detached", timeout: 30000 });
    return true;
  });
  await step("Leere Akte: Startseite zeigt 0 Objekte/Vorgänge und keine Fristen", async () => {
    await page.locator(".site-brand").click(); await page.waitForTimeout(400);
    const text = await page.locator("main").innerText();
    if (!text.includes("Aktive Objekte")) return "Objekt-Cockpit wird ohne Daten gar nicht angezeigt";
    return /Aktive Objekte\s*0/.test(text) ? "Objekt-Cockpit 0" : false;
  });
  const seiten = [[0, "Assistenzzentrale"], [0, "Korrespondenz"], [1, "Diagnosen, AU & ICD-Codes"], [2, "Interaktives Cockpit"], [2, "Familienübersicht"], [2, "Fristen und Aufgaben"], [2, "Tagebuch & Erinnerungen"], [3, "Miet- & Vermieterunterlagen"], [6, "Dokumentenbibliothek"], [6, "Bestand prüfen"], [6, "Eingangszentrale"], [6, "Sicherheit & lokaler Tresor"], [6, "Unterlagen & Quellen"], [7, "Hilfe & erste Schritte"], [7, "Systemprüfung"], [7, "Was gibt’s Neues?"]];
  for (const [nav, eintrag] of seiten) {
    await step(`Leere Akte: „${eintrag}“ lädt ohne Fehler`, async () => {
      const vorher = errors.length;
      await openMenu(page, nav, eintrag);
      const n = await page.locator("main button").count();
      return errors.length === vorher ? `${n} Knöpfe` : false;
    });
  }
  await step("Leere Akte: Suche meldet ehrlich „Keine passende gespeicherte Angabe“", async () => {
    await page.locator(".global-search input").fill("Waschmaschine"); await page.waitForTimeout(300);
    const leer = (await page.locator(".search-results .empty-state").count()) === 1;
    await page.locator(".global-search input").fill(""); return leer;
  });
  await step("Leere Akte: Cockpit-Statuswechsel/Kacheln ohne Einträge ohne Fehler", async () => {
    await footer(page, "Interaktives Cockpit");
    await page.locator("button.card", { hasText: "Jetzt wichtig" }).click();
    return (await page.locator(".cockpit-todo").count()) === 0;
  });
  await step("Leere Akte: Frist anlegen funktioniert auch ohne Beispieldaten", async () => {
    await footer(page, "Fristen und Aufgaben");
    const form = page.locator("form", { has: page.locator('button:has-text("Frist oder Aufgabe bestätigt anlegen")') });
    await form.locator('input[placeholder="Zum Beispiel: Antwort an Krankenkasse"]').fill("Erste eigene Frist (erfunden)");
    await form.locator('input[type="date"]').first().fill("2026-12-24");
    await form.locator('input[placeholder="Zum Beispiel: Schreiben vom 07.10.2026"]').fill("Probe");
    await form.locator('input[type="checkbox"]').check();
    await form.locator("button", { hasText: "Frist oder Aufgabe bestätigt anlegen" }).click(); await page.waitForTimeout(800);
    await page.locator("button.schedule-filter", { hasText: "Offen" }).click();
    return (await page.locator("main").innerText()).includes("Erste eigene Frist");
  });
  await step("Leere Akte: Erinnerung erfassen und speichern", async () => {
    await page.locator(".site-brand").click();
    await page.locator(".memory-text textarea").fill("Erste eigene Erinnerung (erfunden).");
    await page.locator("button", { hasText: "Eintrag prüfen" }).click();
    await page.waitForSelector(".modal");
    const d = page.locator(".modal").last();
    if (await d.locator("button", { hasText: "Nicht verknüpfen" }).count()) await d.locator("button", { hasText: "Nicht verknüpfen" }).click();
    await d.locator("button", { hasText: "Bestätigt speichern" }).click(); await page.waitForTimeout(1000);
    await schliesseDialoge(page);
    await footer(page, "Tagebuch & Erinnerungen");
    return (await page.locator("main").innerText()).includes("Erste eigene Erinnerung");
  });
  await step("Leere Akte: Systemprüfung läuft und meldet ein Ergebnis", async () => {
    await footer(page, "Systemprüfung");
    await page.locator("button", { hasText: "Abschlussprüfung 2.28.1 starten" }).click();
    await page.waitForFunction(() => /offene Prüfpunkte/.test(document.body.innerText), null, { timeout: 25000 }).catch(() => {});
    const erg = (await page.locator("[aria-live]").allInnerTexts()).join(" ").match(/Systemprüfung abgeschlossen[^.]*\./);
    return erg ? erg[0].slice(0, 100) : false;
  });
  await step("Leere Akte: „Beispieldaten laden“ stellt die Beispielfamilie wieder her; eigene Einträge bleiben", async () => {
    await page.locator(".footer-sample-link").scrollIntoViewIfNeeded(); await page.locator(".footer-sample-link").click();
    await page.waitForSelector(".sample-data-notice strong", { timeout: 60000 });
    await footer(page, "Fristen und Aufgaben"); await page.locator("button.schedule-filter", { hasText: "Offen" }).click();
    return (await page.locator("main").innerText()).includes("Erste eigene Frist");
  });
  check(errors.length === 0, "Keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Leere Akte"));
