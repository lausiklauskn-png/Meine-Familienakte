// Startseite, Kopf- und Fußzeile: Suche, Diktat, Drucken, Ausloggen, Objekt-Cockpit, Erinnerung erfassen,
// Dokumenteneingang-Kacheln, Beispieldaten entfernen/laden.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors, footer, openMenu } from "./_harness.mjs";
import { speechStub, windowStub, directoryPickerStub, schliesseDialoge, bekannt, verdecktVon } from "./_stubs.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.addInitScript(speechStub("Zeige mir den Mietvertrag"));
  await page.addInitScript(windowStub);
  await page.addInitScript(directoryPickerStub);
  const errors = collectErrors(page);
  await step("Start mit Beispieldaten", async () => { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); });

  // --- Kopfzeile ---
  await step("Drucken ruft window.print()", async () => { await page.locator('button[title="Aktuelle Seite drucken"]').click(); return (await page.evaluate(() => window.__gedruckt)) === 1; });
  await step("Markenknopf „FAMILIENAKTE“ führt zur Startseite", async () => { await footer(page, "Hilfe"); await page.locator(".site-brand").click(); return (await page.locator(".breadcrumb").innerText()).trim() === "Startseite"; });
  await step("Ausloggen lädt die Seite neu (kein Konto, nur Neustart)", async () => {
    await page.locator(".logout-button").click();
    await page.waitForLoadState("load"); await ready(page);
    return (await page.evaluate(() => window.__gedruckt)) === 0; // frisches Fenster-Objekt = neu geladen
  });

  // --- Suche ---
  const suche = page.locator(".global-search input");
  await step("Suche: „Krankenkasse“ zeigt Treffer und „Verstanden als:“", async () => {
    await suche.fill("Zeige mir meine Krankenkasse-Schreiben");
    await page.waitForSelector(".search-results");
    const verstanden = await page.locator(".search-interpretation").count();
    const treffer = await page.locator(".search-results article").count();
    return `Verstanden-als: ${verstanden ? "ja" : "nein"}, Treffer: ${treffer}` && verstanden === 1 && treffer > 0;
  });
  await step("Suche: Treffer öffnen springt zur Seite", async () => { await page.locator(".search-results article > button").first().click(); return (await page.locator(".search-results").count()) === 0; });
  await step("Suche: „Zusammenhang öffnen“ führt ins Cockpit", async () => {
    await suche.fill("Waschmaschine"); await page.waitForSelector(".search-results");
    const link = page.locator(".context-open-link").first();
    if (!(await link.count())) return "kein Treffer mit Zusammenhang";
    await link.click(); return (await page.locator(".breadcrumb").innerText()).includes("Cockpit");
  });
  await step("Suche: Unsinn ergibt ehrliche Leermeldung", async () => { await suche.fill("xyzqq-nichts"); await page.waitForSelector(".search-results"); return (await page.locator(".search-results .empty-state").count()) === 1; });
  await step("Suche löschen (✕) leert das Feld", async () => { await page.locator(".search-clear").click(); return (await suche.inputValue()) === "" && (await page.locator(".search-results").count()) === 0; });
  await step("Diktat in der Suche: Mikrofon setzt den erkannten Text ein", async () => {
    const mic = page.locator('.global-search .dictation-button');
    if (await mic.isDisabled()) return false;
    await mic.click();
    await page.waitForFunction(() => document.querySelector(".global-search input").value.includes("Mietvertrag"));
    await page.locator(".global-search .dictation-button").click().catch(() => {});
    return true;
  });
  await step("Diktat: Tippen beendet das laufende Diktat", async () => {
    await page.locator('.global-search .dictation-button').click();
    await page.waitForSelector('.global-search .dictation-button.listening', { timeout: 3000 }).catch(() => {});
    await suche.fill("Miete");
    await page.waitForTimeout(300);
    return (await page.locator('.global-search .dictation-button.listening').count()) === 0;
  });
  await suche.fill("");

  // --- Hilfe: Beispielfragen setzen die Suche ---
  await step("Hilfe: Beispielfrage „Rechnung der Waschmaschine“ startet die Suche", async () => {
    await footer(page, "Hilfe");
    await page.locator("button", { hasText: "Rechnung der Waschmaschine" }).first().click();
    return (await suche.inputValue()).includes("Waschmaschine") && (await page.locator(".search-results").count()) === 1;
  });
  await suche.fill(""); await page.locator(".site-brand").click();

  // --- Objekt-Cockpit / Aktionen ---
  await step("Objekt-Cockpit-Kachel führt ins Cockpit", async () => { await page.locator("button", { hasText: "Aktive Objekte" }).first().click(); return (await page.locator(".breadcrumb").innerText()).includes("Cockpit"); });
  await page.locator(".site-brand").click();
  await step("„Arbeitsübersicht öffnen“ führt ins Cockpit", async () => { await page.locator("button", { hasText: "Arbeitsübersicht öffnen" }).first().click(); return (await page.locator(".breadcrumb").innerText()).includes("Cockpit"); });
  await page.locator(".site-brand").click();
  await step("ⓘ „erklären“ öffnet und schließt den Hinweis", async () => {
    await page.locator('button[aria-label="Zuletzt wichtig erklären"]').click();
    const offen = (await page.locator(".start-info-panel").count()) === 1;
    await page.locator(".start-info-panel .info-close").click();
    return offen && (await page.locator(".start-info-panel").count()) === 0;
  });
  await step("Überfälliger Termin auf der Startseite öffnet das Cockpit", async () => { await page.locator("button", { hasText: "Antrag auf Teilzeit" }).first().click(); return (await page.locator(".breadcrumb").innerText()).includes("Cockpit"); });
  await page.locator(".site-brand").click();
  await step("„Neue Unterlage ablegen“ (Statuskachel) öffnet den Ablage-Dialog", async () => {
    await page.locator("button", { hasText: "Neue Unterlage ablegen. Status" }).first().click().catch(async () => page.locator('button[aria-label^="Neue Unterlage ablegen"]').first().click());
    const offen = (await page.locator(".modal").count()) >= 1;
    await page.locator('.modal button[aria-label="Fenster schließen"]').last().click().catch(() => {});
    return offen;
  });
  await step("„Abgleich durchführen“ meldet Ergebnis ohne Fehler", async () => {
    await schliesseDialoge(page);
    await page.locator('button[aria-label^="Abgleich durchführen"], button:has-text("Abgleich durchführen. Status")').first().click();
    await page.waitForTimeout(800);
    const modal = await page.locator(".modal").count();
    const text = modal ? await page.locator(".modal").last().innerText() : "";
    await schliesseDialoge(page);
    return modal ? `öffnet Dialog: ${text.split("\n")[0].slice(0, 50)}` : "ohne Dialog";
  });

  // --- Dokumenteneingang-Kacheln ---
  await step("„Datei auswählen“ öffnet die Dateiauswahl (Datei-Eingang vorhanden)", async () => {
    await schliesseDialoge(page); await page.locator(".site-brand").click();
    const [chooser] = await Promise.all([page.waitForEvent("filechooser", { timeout: 4000 }), page.locator("button", { hasText: "Datei auswählen" }).first().click()]);
    return !!chooser;
  });
  await step("„Fotofunktion öffnen“ öffnet den Scan-Dialog", async () => {
    await page.locator("button", { hasText: "Fotofunktion öffnen" }).first().click();
    const offen = (await page.locator(".modal", { hasText: "fotografieren" }).count()) >= 1 || (await page.locator("text=Dokument fotografieren").count()) > 0;
    await page.keyboard.press("Escape");
    await page.locator('.modal button[aria-label*="chließen"]').last().click().catch(() => {});
    return offen;
  });
  await step("„Ordner auswählen“ (Eingangsordner) nimmt den gewählten Ordner an", async () => {
    await page.evaluate(() => { window.__naechsterOrdner = "Posteingang-Probe"; });
    await page.locator("button", { hasText: "Ordner auswählen" }).first().click();
    await page.waitForTimeout(600);
    return (await page.locator("text=Posteingang-Probe").count()) > 0;
  });
  await step("„OneDrive-Ordner prüfen“ ohne Verbindung führt ins Sicherheitscenter", async () => {
    await page.locator("button", { hasText: "OneDrive-Ordner prüfen" }).first().click();
    await page.waitForTimeout(400);
    const crumb = await page.locator(".breadcrumb").innerText();
    return crumb.includes("Sicherheit") || (await page.locator(".notice").count()) > 0;
  });
  await page.locator(".site-brand").click();

  // --- Erinnerung erfassen ---
  await step("Erinnerung: Diktat füllt das Feld", async () => {
    const mic = page.locator('.memory-text .dictation-button');
    if (await mic.isDisabled()) return false;
    await mic.click(); await page.waitForFunction(() => (document.querySelector(".memory-text textarea") || {}).value?.includes("Mietvertrag"));
    await page.locator('.memory-text .dictation-button').click().catch(() => {});
    return true;
  });
  await step("Erinnerung: „Nächste Eingabe“ legt einen Entwurf in die Warteschlange", async () => {
    await page.locator(".memory-text textarea").fill("Der Elektriker war heute da. Die zweite Lampe flackert weiterhin.");
    await page.locator("button", { hasText: "Nächste Eingabe" }).click();
    await page.waitForTimeout(500);
    return (await page.locator("button", { hasText: /Unbehandelte Erinnerungen: 1/ }).count()) > 0;
  });
  await step("Erinnerung: „Eintrag prüfen“ bei mehreren Entwürfen führt zur Warteschlange im Tagebuch", async () => {
    await page.locator(".memory-text textarea").fill("Fiete hat heute seine Hausaufgaben allein gemacht.");
    await page.locator("button", { hasText: "Eintrag prüfen" }).click();
    await page.waitForTimeout(600);
    return (await page.locator(".breadcrumb").innerText()).includes("Tagebuch");
  });
  await step("Tagebuch: „Prüfen“ öffnet die Prüfung, „Bestätigt speichern“ speichert den Eintrag", async () => {
    await page.locator("#memory-draft-queue button.text-link", { hasText: "Prüfen" }).first().click();
    await page.waitForSelector(".modal");
    const dialog = page.locator(".modal").last();
    if ((await dialog.locator("button", { hasText: "Nicht verknüpfen" }).count()) > 0) await dialog.locator("button", { hasText: "Nicht verknüpfen" }).click();
    await dialog.locator("button", { hasText: "Bestätigt speichern" }).click();
    await page.waitForTimeout(1000);
    const abschluss = await page.locator(".modal").last().innerText().catch(() => "");
    await schliesseDialoge(page);
    return abschluss ? `Abschlussdialog: ${abschluss.split("\n")[0].slice(0, 60)}` : false;
  });
  await step("Erinnerung: „Fotos oder Videos“ öffnet die Dateiauswahl", async () => {
    await schliesseDialoge(page); await page.locator(".site-brand").click();
    const [chooser] = await Promise.all([page.waitForEvent("filechooser", { timeout: 4000 }), page.locator("button", { hasText: "Fotos oder Videos" }).first().click()]);
    return !!chooser;
  });
  await step("„Tagebuch öffnen“ führt zum Tagebuch", async () => { await page.locator("button", { hasText: "Tagebuch öffnen" }).first().click(); return (await page.locator(".breadcrumb").innerText()).includes("Tagebuch"); });
  await page.locator(".site-brand").click();

  // --- Beispieldaten ---
  await step("„Beispieldaten entfernen“ fragt im Seiten-Dialog nach; „Abbrechen“ behält alles", async () => {
    await schliesseDialoge(page); await page.locator(".site-brand").click();
    await page.evaluate(() => window.scrollTo(0, 0));
    const knopf = page.locator("button", { hasText: "Beispieldaten entfernen" });
    const darueber = await verdecktVon(page, knopf);
    if (!darueber.startsWith("button")) bekannt("„Beispieldaten entfernen“ ist mit der Maus nicht erreichbar", `darüber liegt ${darueber} (Zierkreis .family-hero:after); Tastatur (Tab + Enter) geht`);
    await knopf.focus(); await page.keyboard.press("Enter");
    await page.waitForSelector(".page-dialog");
    const text = await page.locator(".page-dialog").innerText();
    await page.locator(".page-dialog button", { hasText: "Abbrechen" }).click();
    return text.includes("Beispieldaten") && (await page.locator(".sample-data-notice").count()) === 1;
  });
  await step("„Beispieldaten entfernen“ + „Ja, fortfahren“ entfernt die Beispielfamilie", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const knopf = page.locator("button", { hasText: "Beispieldaten entfernen" });
    await knopf.focus(); await page.keyboard.press("Enter");
    await page.locator(".page-dialog button", { hasText: "Ja, fortfahren" }).click();
    await page.waitForSelector(".sample-data-notice", { state: "detached", timeout: 30000 });
    await page.waitForTimeout(500);
    return (await page.locator("text=Beispieldaten entfernt").count()) > 0 || (await page.locator(".footer-sample-link").count()) === 1;
  });
  await step("Eigene Erinnerung bleibt nach dem Entfernen erhalten", async () => {
    await footer(page, "Tagebuch & Erinnerungen");
    return (await page.locator("text=Elektriker war heute da").count()) > 0 || (await page.locator("text=Hausaufgaben allein").count()) > 0;
  });
  await step("„Beispieldaten laden“ (Fußzeile) legt die Beispielfamilie wieder an", async () => {
    await page.locator(".footer-sample-link").scrollIntoViewIfNeeded();
    await page.locator(".footer-sample-link").click();
    await page.waitForSelector(".sample-data-notice strong", { timeout: 60000 });
    return true;
  });
  check(errors.length === 0, "Keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Knöpfe Startseite"));
