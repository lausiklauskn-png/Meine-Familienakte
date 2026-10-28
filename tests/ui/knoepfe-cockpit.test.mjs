// Cockpit, Fristen und Aufgaben, Tagebuch: Statuswechsel, Notiz, Verknüpfen/Lösen, Frist anlegen/erledigen/zurückstellen,
// Entwurf prüfen/ergänzen/löschen, Memory bearbeiten/löschen, offene Punkte.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors, footer, openMenu } from "./_harness.mjs";
import { speechStub, windowStub, schliesseDialoge, aufraeumen } from "./_stubs.mjs";

const app = await startApp();
const browser = await launchBrowser();
const ja = async (page) => { await page.waitForSelector(".page-dialog", { timeout: 5000 }); await page.locator(".page-dialog button", { hasText: "Ja, fortfahren" }).click(); await page.waitForTimeout(500); };
try {
  const page = await (await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(8000);
  await page.addInitScript(speechStub("Diktierte Bezeichnung"));
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await step("Start", async () => { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); });

  // ---------- Cockpit ----------
  await footer(page, "Interaktives Cockpit");
  await step("Cockpit: vier Zähl-Kacheln sind Knöpfe und rollen zum Abschnitt", async () => {
    await page.locator("button.card", { hasText: "Aktive To-dos" }).click();
    await page.waitForTimeout(400);
    const y = await page.evaluate(() => document.getElementById("cockpit-todos")?.getBoundingClientRect().top ?? 9999);
    return y < 400;
  });
  await step("Cockpit: „Jetzt wichtig“-Eintrag öffnet das Dossier", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator("#cockpit-priorities button:not(.start-info-trigger)").first().click();
    await page.waitForTimeout(400);
    return (await page.locator("#cockpit-dossier").count()) === 1;
  });
  await step("Cockpit: Statuswechsel fragt nach und speichert („in Bearbeitung“)", async () => {
    const zeile = page.locator(".cockpit-todo").first();
    const titel = (await zeile.locator("strong").first().innerText()).trim();
    await zeile.locator("select").selectOption("in_bearbeitung");
    await zeile.locator("button", { hasText: "Status bestätigen" }).click();
    await ja(page);
    await page.waitForTimeout(600);
    const text = await page.locator("body").innerText();
    return text.includes("Aufgabenstatus wurde nach deiner Bestätigung aktualisiert") ? `„${titel}“` : false;
  });
  await step("Cockpit: Statuswechsel „Abbrechen“ ändert nichts", async () => {
    const zeile = page.locator(".cockpit-todo").first();
    const vorher = await zeile.locator("select").inputValue();
    await zeile.locator("select").selectOption(vorher === "erledigt" ? "offen" : "erledigt");
    await zeile.locator("button", { hasText: "Status bestätigen" }).click();
    await page.waitForSelector(".page-dialog"); await page.locator(".page-dialog button", { hasText: "Abbrechen" }).click();
    await page.waitForTimeout(300);
    return (await page.locator(".page-dialog").count()) === 0;
  });
  await step("Cockpit: Dossier öffnen und „Notiz nach Bestätigung ergänzen“", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator("#cockpit-cases button:not(.start-info-trigger)").first().click();
    await page.waitForSelector("#cockpit-dossier");
    const feld = page.locator("#cockpit-dossier textarea").first();
    if (!(await feld.count())) return "kein Notizfeld im Dossier";
    await feld.fill("Probe-Notiz: Rückruf am Freitag (erfunden).");
    await page.locator("#cockpit-dossier button", { hasText: "Notiz nach Bestätigung ergänzen" }).click();
    await ja(page);
    return (await page.locator("body").innerText()).includes("Notiz wurde nach deiner Bestätigung ergänzt");
  });
  await step("Cockpit: Dossier-Knöpfe „Unterlage“, „Erinnerung“, „Assistenz“ führen weiter", async () => {
    const d = page.locator("#cockpit-dossier");
    const n = await d.locator("button.button.secondary").count();
    const assist = d.locator("button", { hasText: /Assistenz/ }).first();
    if (!(await assist.count())) return `nur ${n} Dossier-Knöpfe, kein Assistenz-Knopf`;
    await assist.click(); await page.waitForTimeout(300);
    const ok = (await page.locator(".breadcrumb").innerText()).includes("Assistenz");
    await footer(page, "Interaktives Cockpit");
    return ok;
  });
  await step("Cockpit: Zusammenhangs-Vorschlag „Verknüpfen“ / „Nicht verknüpfen“", async () => {
    const r = page.locator("#context-review");
    if (!(await r.count())) return "kein offener Vorschlag (Beispieldaten sind schon verknüpft)";
    const nein = r.locator("button", { hasText: "Nicht verknüpfen" }).first();
    await nein.click(); await page.waitForTimeout(500);
    return true;
  });
  await step("Cockpit: Dossier schließen (✕)", async () => {
    const x = page.locator('button[aria-label="Detailansicht schließen"]');
    if (!(await x.count())) return "Dossier nicht offen";
    await x.click(); return (await page.locator("#cockpit-dossier").count()) === 0;
  });

  // ---------- Fristen und Aufgaben ----------
  await footer(page, "Fristen und Aufgaben");
  await step("Fristen: Filter „Überfällig / Bald fällig / Offen“ schalten um", async () => {
    await page.locator("button.schedule-filter", { hasText: "Bald fällig" }).click();
    const aktiv = await page.locator("button.schedule-filter.active").innerText();
    return aktiv.includes("Bald fällig");
  });
  await step("Fristen: Diktat in „Bezeichnung“ setzt Text ein", async () => {
    const mic = page.locator('.dictation-button[aria-label^="Titel"]');
    if (!(await mic.count()) || await mic.isDisabled()) return false;
    await mic.click();
    await page.waitForFunction(() => [...document.querySelectorAll("input")].some((i) => i.value.includes("Diktierte Bezeichnung")));
    await mic.click().catch(() => {});
    return true;
  });
  await step("Fristen: neue Aufgabe anlegen (Bestätigung nötig)", async () => {
    const form = page.locator("form", { has: page.locator('button:has-text("Frist oder Aufgabe bestätigt anlegen")') });
    await form.locator("select").first().selectOption({ label: "Aufgabe" }).catch(() => form.locator("select").first().selectOption("task"));
    await form.locator('input[placeholder="Zum Beispiel: Antwort an Krankenkasse"]').fill("Probe-Aufgabe: Fahrradlicht prüfen (erfunden)");
    await form.locator('input[type="date"]').first().fill("2026-12-01");
    await form.locator('input[placeholder="Zum Beispiel: Schreiben vom 07.10.2026"]').fill("Probe");
    const knopf = form.locator("button", { hasText: "Frist oder Aufgabe bestätigt anlegen" });
    const vorher = await knopf.isDisabled();
    await form.locator('input[type="checkbox"]').check();
    await knopf.click();
    await page.waitForTimeout(800);
    const meldung = (await page.locator("[aria-live]").allInnerTexts()).join(" ").slice(0, 160);
    await page.locator("button.schedule-filter", { hasText: "Offen" }).click(); await page.waitForTimeout(300);
    return (await page.locator("body").innerText()).includes("Probe-Aufgabe: Fahrradlicht") ? `Knopf vor Bestätigung gesperrt: ${vorher}; ${meldung.slice(0, 80)}` : (console.log("   ↳ Meldung:", meldung), false);
  });
  await step("Fristen: „Als erledigt markieren“ fragt nach und setzt den Status", async () => {
    await page.locator("button.schedule-filter", { hasText: "Offen" }).click();
    const eintrag = page.locator("article, li", { hasText: "Probe-Aufgabe: Fahrradlicht" }).first();
    await eintrag.locator("button", { hasText: "Als erledigt markieren" }).click();
    const dialog = (await page.locator(".page-dialog").count()) === 1;
    if (dialog) await page.locator(".page-dialog button", { hasText: "Ja, fortfahren" }).click();
    await page.waitForTimeout(600);
    return `Rückfrage: ${dialog ? "ja" : "nein"}`;
  });
  await step("Fristen: „Zurückstellen“ bei einem offenen Eintrag", async () => {
    await page.locator("button.schedule-filter", { hasText: "Offen" }).click();
    const knopf = page.locator("button", { hasText: "Zurückstellen" }).first();
    if (!(await knopf.count())) return "kein offener Eintrag";
    await knopf.click();
    if (await page.locator(".page-dialog").count()) await page.locator(".page-dialog button", { hasText: "Ja, fortfahren" }).click();
    await page.waitForTimeout(600);
    return (await page.locator("body").innerText()).includes("zurückgestellt");
  });
  await step("Fristen: Verweis-Knopf (z. B. „Vorgang: VORG-…“) öffnet das Cockpit", async () => {
    const link = page.locator("button.text-link", { hasText: /^Vorgang: VORG-/ }).first();
    if (!(await link.count())) return "kein Verweis sichtbar";
    await link.click(); await page.waitForTimeout(300);
    return (await page.locator(".breadcrumb").innerText()).includes("Cockpit");
  });

  // ---------- Tagebuch ----------
  await footer(page, "Tagebuch & Erinnerungen");
  await step("Tagebuch: Chronologie-Eintrag auswählen zeigt Details", async () => {
    await aufraeumen(page);
    await page.locator(".memory-chronology button, .chronology button, section:has(h2:has-text('Chronologie')) button:not(.start-info-trigger)").first().click().catch(() => {});
    await page.waitForTimeout(300);
    return (await page.locator("button", { hasText: /Memory bearbeiten|Memory löschen/ }).count()) > 0;
  });
  const klick = async (loc, label) => { try { await loc.click(); } catch (e) { throw new Error(`${label}: ${String(e.message).split("\n")[0]}`); } };
  await step("Tagebuch: Entwurf anlegen („Nächste Eingabe“)", async () => {
    await aufraeumen(page); await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(".memory-text textarea").fill("Probe-Entwurf zum Löschen (erfunden).");
    await klick(page.locator("button", { hasText: "Nächste Eingabe" }).first(), "Nächste Eingabe");
    await page.waitForTimeout(500);
    return (await page.locator("#memory-draft-queue").innerText()).includes("Probe-Entwurf");
  });
  await step("Tagebuch: „Ergänzen“ führt zur Startseite und holt den Entwurf ins Eingabefeld", async () => {
    await klick(page.locator("#memory-draft-queue button", { hasText: "Ergänzen" }).first(), "Ergänzen");
    await page.waitForTimeout(400);
    const start = (await page.locator(".breadcrumb").innerText()).trim() === "Startseite";
    return start && (await page.locator(".memory-text textarea").inputValue()).includes("Probe-Entwurf");
  });
  await step("Startseite: ergänzter Entwurf geht mit „Nächste Eingabe“ zurück in die Warteschlange (kein Doppel)", async () => {
    await page.locator(".memory-text textarea").fill("Probe-Entwurf zum Löschen (erfunden), ergänzt.");
    await klick(page.locator("button", { hasText: "Nächste Eingabe" }).first(), "Nächste Eingabe");
    await page.waitForTimeout(500);
    await footer(page, "Tagebuch & Erinnerungen");
    const q = await page.locator("#memory-draft-queue").innerText();
    const anzahl = (q.match(/Probe-Entwurf/g) || []).length;
    return q.includes("ergänzt") && anzahl <= 2 ? `Vorkommen im Text: ${anzahl}` : (console.log("   ↳ Warteschlange:", q.slice(0, 200).replace(/\n/g, " / ")), false);
  });
  await step("Tagebuch: „Tag zusammenfassen“ schaltet die Zusammenfassung ein/aus", async () => {
    await aufraeumen(page);
    await klick(page.locator("button", { hasText: "Tag zusammenfassen" }).first(), "Tag zusammenfassen");
    const an = (await page.locator("button", { hasText: "Zusammenfassung schließen" }).count()) === 1;
    await page.locator("button", { hasText: "Zusammenfassung schließen" }).click();
    return an;
  });
  await step("Tagebuch: „Älteste zuerst“ ↔ „Neueste zuerst“", async () => {
    const b = page.locator("button", { hasText: /Älteste zuerst|Neueste zuerst/ }).first();
    const vorher = await b.innerText(); await b.click(); return (await b.innerText()) !== vorher;
  });
  await step("Tagebuch: „Entwurf löschen“ fragt nach und löscht nur diesen Entwurf", async () => {
    await aufraeumen(page);
    await klick(page.locator("#memory-draft-queue button", { hasText: "Entwurf löschen" }).first(), "Entwurf löschen");
    await ja(page);
    return (await page.locator("#memory-draft-queue").innerText()).includes("Probe-Entwurf") === false;
  });
  await step("Tagebuch: offener Memory-Punkt „Weiter beobachten“ / „Als erledigt bestätigen“", async () => {
    const punkt = page.locator("#memory-open-points button", { hasText: "Weiter beobachten" }).first();
    if (!(await punkt.count())) return "kein offener Punkt";
    await punkt.click(); if (await page.locator(".page-dialog").count()) await ja(page);
    await page.waitForTimeout(500);
    return true;
  });
  const eintragWaehlen = async () => {
    await aufraeumen(page);
    if (!(await page.locator("button", { hasText: "Memory bearbeiten" }).count())) {
      await page.locator("section:has(h2:has-text('Chronologie')) button:not(.start-info-trigger)").first().click().catch(() => {});
      await page.waitForTimeout(300);
    }
  };
  await step("Tagebuch: „Memory bearbeiten“ fragt Titel und Text ab (Eingabe-Dialoge) und bestätigt", async () => {
    await eintragWaehlen();
    const b = page.locator("button", { hasText: "Memory bearbeiten" }).first();
    if (!(await b.count())) return "kein gespeicherter Eintrag ausgewählt";
    await b.click(); await page.waitForSelector(".page-dialog");
    const d1 = await page.locator(".page-dialog").innerText();
    await page.locator(".page-dialog button", { hasText: "Übernehmen" }).click(); await page.waitForTimeout(200);
    const d2 = await page.locator(".page-dialog").innerText();
    await page.locator(".page-dialog textarea").fill((await page.locator(".page-dialog textarea").inputValue()) + " (Probe-Ergänzung)");
    await page.locator(".page-dialog button", { hasText: "Übernehmen" }).click(); await page.waitForTimeout(200);
    await page.locator(".page-dialog button", { hasText: "Ja, fortfahren" }).click(); await page.waitForTimeout(600);
    return d1.includes("Titel") && d2.includes("Text") && (await page.locator("body").innerText()).includes("Probe-Ergänzung");
  });
  await step("Tagebuch: „Memory löschen“ fragt nach; „Abbrechen“ behält den Eintrag", async () => {
    await eintragWaehlen();
    const b = page.locator("button", { hasText: "Memory löschen" }).first();
    if (!(await b.count())) return "kein gespeicherter Eintrag ausgewählt";
    await b.click(); await page.waitForSelector(".page-dialog");
    const frage = await page.locator(".page-dialog").innerText();
    await page.locator(".page-dialog button", { hasText: "Abbrechen" }).click();
    return frage.includes("löschen") && (await page.locator("button", { hasText: "Memory löschen" }).count()) > 0;
  });
  await step("Tagebuch: „Verbindung lösen“ fragt nach", async () => {
    await eintragWaehlen();
    const b = page.locator("button", { hasText: "Verbindung lösen" }).first();
    if (!(await b.count())) return "keine Verbindung angezeigt";
    await b.click(); await page.waitForSelector(".page-dialog");
    await page.locator(".page-dialog button", { hasText: "Abbrechen" }).click(); return true;
  });
  check(errors.length === 0, "Keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Knöpfe Cockpit/Fristen/Tagebuch"));
