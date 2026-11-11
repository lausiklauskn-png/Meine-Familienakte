// Leere Akte: Beispieldaten entfernen, dann alle Seiten und die wichtigsten Knöpfe ohne Daten prüfen (keine Fehler, ehrliche Leermeldungen).
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors, footer, openMenu } from "./_harness.mjs";
import { demoUmschalten } from "./_demo.mjs";
import { windowStub, directoryPickerStub, schliesseDialoge } from "./_stubs.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage(); page.setDefaultTimeout(8000);
  await page.addInitScript(windowStub); await page.addInitScript(directoryPickerStub);
  const errors = collectErrors(page);
  await step("Start und Beispieldaten entfernen", async () => {
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    const k = page.locator("[data-bsp-weg]"); await k.focus(); await page.keyboard.press("Enter");
    await page.waitForSelector(".sample-data-notice", { state: "detached", timeout: 30000 });
    return true;
  });
  await step("Leere Akte: Startseite zeigt 0 Objekte/Vorgänge und keine Fristen", async () => {
    await page.locator(".site-brand").click(); await page.waitForTimeout(400);
    const text = await page.locator("main").innerText();
    if (!text.includes("Aktive Objekte")) return "Objekt-Cockpit wird ohne Daten gar nicht angezeigt";
    return /Aktive Objekte\s*0/.test(text) ? "Objekt-Cockpit 0" : false;
  });
  // 2.28.39: neue Gruppe „Termine & Aufgaben“ an zweiter Stelle (Cockpit, Fristen, Mein Kalender, Tagebuch); die übrigen rücken eins weiter.
  const seiten = [[0, "Assistenzzentrale"], [0, "Korrespondenz"], [1, "Cockpit"], [1, "Fristen und Aufgaben"], [1, "Tagebuch"], [2, "Diagnosen, AU & ICD-Codes"], [3, "Familienübersicht"], [4, "Miet- & Vermieterunterlagen"], [7, "Dokumentenbibliothek"], [7, "Bestand prüfen"], [7, "Eingangszentrale"], [7, "Sicherheit & lokaler Tresor"], [7, "Unterlagen & Quellen"], [8, "Hilfe & erste Schritte"], [8, "Systemprüfung"], [8, "Was gibt’s Neues?"]];
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
    await footer(page, "Cockpit");
    await page.locator("button.card", { hasText: "Jetzt wichtig" }).click();
    return (await page.locator(".cockpit-todo").count()) === 0;
  });
  await step("Leere Akte: Frist anlegen funktioniert auch ohne Beispieldaten", async () => {
    await footer(page, "Fristen und Aufgaben");
    const form = page.locator("form", { has: page.locator('button:has-text("Frist oder Aufgabe bestätigt anlegen")') });
    await form.locator('input[placeholder="Zum Beispiel: Antwort an Krankenkasse"]').fill("Erste eigene Frist (erfunden)");
    await form.locator('input[type="date"]').first().fill("2026-12-24");
    await form.locator('input[placeholder="Zum Beispiel: Schreiben vom 07.10.2026"]').fill("Probe");
    await form.locator('.schedule-confirm input[type="checkbox"]').check(); // seit dem Kalender zwei Haken im Formular
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
    await footer(page, "Tagebuch");
    return (await page.locator("main").innerText()).includes("Erste eigene Erinnerung");
  });
  await step("Leere Akte: Systemprüfung läuft und meldet ein Ergebnis", async () => {
    await footer(page, "Systemprüfung");
    await page.locator("button", { hasText: "Systemprüfung starten" }).click();
    await page.waitForFunction(() => /offene Prüfpunkte/.test(document.body.innerText), null, { timeout: 25000 }).catch(() => {});
    const erg = (await page.locator("[aria-live]").allInnerTexts()).join(" ").match(/Systemprüfung abgeschlossen[^.]*\./);
    return erg ? erg[0].slice(0, 100) : false;
  });
  // P7 (Klaus 07.11.): Mit der eigenen Frist hat die Akte eigene Daten; die Demo arbeitet dann an einer Kopie davon.
  await step("Eigene Frist: Demo ist eine Kopie und zeigt sie; nach Rückkehr bleibt sie im Original", async () => {
    try {
    // Die Demo startet hinten in der Hilfe (2026-11-04).
    await demoUmschalten(page, true);
    await page.locator('.demo-knopf-schalter[data-demo-kopie="ja"]').waitFor({ state: "attached", timeout: 60000 });
    await footer(page, "Fristen und Aufgaben"); await page.locator("button.schedule-filter", { hasText: "Offen" }).click();
    const eigeneFristInDemo = (await page.locator("main").innerText()).includes("Erste eigene Frist");
    await demoUmschalten(page, false);
    await footer(page, "Fristen und Aufgaben"); await page.locator("button.schedule-filter", { hasText: "Offen" }).click();
    return eigeneFristInDemo && (await page.locator("main").innerText()).includes("Erste eigene Frist");
    } catch (error) {
      console.error("Demo-Rückweg-Diagnose:", error.stack || String(error));
      console.error("Adresse:", page.url());
      console.error("Seiteninhalt:", (await page.locator("body").innerText().catch(() => "nicht erreichbar")).slice(0, 6000));
      await page.screenshot({ path: "work/leerakte-fehler.png" }).catch(() => {});
      throw error;
    }
  });
  check(errors.length === 0, "Keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Leere Akte"));
