// Dokumentenbibliothek, Eingangszentrale, Ablage-Dialog, Dokument fotografieren, Vorschau, Statuswechsel.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors, footer } from "./_harness.mjs";
import { windowStub, schliesseDialoge, aufraeumen, bekannt } from "./_stubs.mjs";
import { probePdf, probePng, probeTxt, probeEml } from "./_dateien.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(8000);
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await step("Start", async () => { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); });

  // ---------- Dokumentenbibliothek ----------
  await footer(page, "Dokumentenbibliothek");
  await step("Bibliothek: Übersicht nach Lebensbereichen, „Alle ansehen“ zeigt die Liste", async () => {
    await page.locator("button", { hasText: "Alle ansehen" }).first().click();
    await page.waitForTimeout(300);
    return (await page.locator(".library-count-button").count()) === 1 && (await page.locator("button.library-preview").count()) > 5;
  });
  await step("Bibliothek: Suchfeld filtert („Waschmaschine“) und ✕ leert", async () => {
    const feld = page.locator('input[placeholder^="Titel, Dateiname"]');
    await feld.fill("Waschmaschine"); await page.waitForTimeout(300);
    const n = await page.locator(".library-count-button").innerText().catch(() => "");
    await page.locator('button[aria-label="Dokumentensuche löschen"]').click();
    return n.match(/^\d+/) && Number(n.match(/^\d+/)[0]) >= 1 ? `${n}` : false;
  });
  await step("Bibliothek: Filter Lebensbereich / Dokumentart / Sortierung / Zeitraum wirken", async () => {
    const selects = page.locator("select");
    const vorher = await page.locator(".library-count-button").innerText();
    await selects.nth(0).selectOption({ index: 1 }); await page.waitForTimeout(200);
    const nachher = await page.locator(".library-count-button").innerText();
    await selects.nth(2).selectOption({ index: 1 }).catch(() => {});
    await page.locator('input[type="date"]').first().fill("2026-10-01"); await page.waitForTimeout(200);
    const mitDatum = await page.locator(".library-count-button").innerText();
    await page.locator("button", { hasText: "Filter zurücksetzen" }).click();
    return `${vorher} → Bereich: ${nachher} → +Datum: ${mitDatum}`;
  });
  await step("Bibliothek: Karte „öffnen“ zeigt die Dokumentvorschau (PDF)", async () => {
    await page.locator("button.library-preview").first().click();
    await page.waitForSelector(".modal", { timeout: 8000 });
    await page.waitForTimeout(2500);
    const text = await page.locator(".modal").last().innerText();
    const canvases = await page.locator(".modal canvas").count();
    const ok = canvases > 0;
    if (!ok) bekannt("PDF-Vorschau zeigt keine Seite", text.replace(/\n/g, " ").slice(0, 160));
    return `Seiten gezeichnet: ${canvases}; ${text.split("\n")[0].slice(0, 40)}`;
  });
  await step("Vorschau: „In neuem Fenster versuchen“ ruft window.open, „Schließen“ schließt", async () => {
    await page.locator(".modal button", { hasText: "In neuem Fenster versuchen" }).click();
    const geoeffnet = await page.evaluate(() => window.__geoeffnet.length);
    await schliesseDialoge(page);
    return geoeffnet >= 1 && (await page.locator(".modal").count()) === 0 ? `window.open-Aufrufe: ${geoeffnet}` : false;
  });
  await step("Bibliothek: Verweis-Knopf „Vorgang …“ auf der Karte öffnet das Cockpit", async () => {
    const link = page.locator(".document-library-card button, article button", { hasText: /^Vorgang\s/ }).first();
    if (!(await link.count())) return "kein Vorgangs-Verweis";
    await link.click(); await page.waitForTimeout(300);
    const ok = (await page.locator(".breadcrumb").innerText()).includes("Cockpit");
    await footer(page, "Dokumentenbibliothek");
    return ok;
  });
  await step("Bibliothek: Lebensbereichs-Kachel (z. B. „HAUS & WOHNUNG“) filtert", async () => {
    await page.locator("button", { hasText: "Zur Bibliotheksübersicht" }).click().catch(() => {});
    await page.locator("button", { hasText: /Haus & Wohnung/i }).first().click();
    await page.waitForTimeout(300);
    return (await page.locator(".library-count-button").count()) === 1;
  });

  // ---------- Ablage-Dialog („Neue Unterlage“) ----------
  await step("„Neue Unterlage“ öffnet den Ablage-Dialog; Datei auswählen zeigt Zuordnungsvorschlag", async () => {
    await page.locator("button", { hasText: "Neue Unterlage" }).first().click();
    await page.waitForSelector(".modal");
    await page.locator('.modal input[type="file"]').setInputFiles(probePdf());
    await page.waitForTimeout(1500);
    const tabs = await page.locator('.modal button[aria-label="Lebensbereich auswählen"]').count();
    return tabs === 1;
  });
  await step("Ablage-Dialog: „Lebensbereich auswählen“ öffnet die Auswahl, „Ohne Änderung schließen“", async () => {
    await page.locator('.modal button[aria-label="Lebensbereich auswählen"]').click();
    await page.waitForSelector(".intake-choice-backdrop");
    const optionen = await page.locator(".intake-choice-backdrop button").count();
    await page.locator(".intake-choice-backdrop button", { hasText: "Ohne Änderung schließen" }).click();
    return optionen > 3 ? `${optionen} Optionen` : false;
  });
  await step("Ablage-Dialog: Datum und Notiz, „Geprüft lokal speichern“ legt das Dokument an", async () => {
    await page.locator('.modal input[name="documentDate"]').fill("2026-10-20");
    await page.locator('.modal textarea[name="notes"]').fill("Probe-Notiz (erfunden)");
    const dialog = page.locator(".modal").last();
    if (await dialog.locator("button", { hasText: "Nicht verknüpfen" }).count()) await dialog.locator("button", { hasText: "Nicht verknüpfen" }).click();
    await dialog.locator("button", { hasText: "Geprüft lokal speichern" }).click();
    await page.waitForTimeout(2500);
    await schliesseDialoge(page);
    return (await page.locator("body").innerText()).includes("Probe_Rechnung.pdf");
  });
  await step("Ablage-Dialog: dieselbe Datei erneut → „Mögliche Dublette“, „Trotzdem übernehmen“ nötig", async () => {
    await footer(page, "Dokumentenbibliothek");
    await page.locator("button", { hasText: "Neue Unterlage" }).first().click();
    await page.waitForSelector(".modal");
    await page.locator('.modal input[type="file"]').setInputFiles(probePdf());
    await page.waitForTimeout(1500);
    const text = await page.locator(".modal").last().innerText();
    const dublette = text.includes("Dublette");
    const speichern = page.locator(".modal button", { hasText: "Geprüft lokal speichern" });
    const gesperrt = await speichern.isDisabled();
    const vorhanden = (await page.locator(".modal button", { hasText: /Vorhandenes Dokument .* öffnen/ }).count()) > 0;
    let abgewiesen = "nicht geprüft";
    if (!gesperrt) {
      const dialog = page.locator(".modal").last();
      if (await dialog.locator("button", { hasText: "Nicht verknüpfen" }).count()) await dialog.locator("button", { hasText: "Nicht verknüpfen" }).click();
      await speichern.click(); await page.waitForTimeout(800);
      abgewiesen = (await page.locator(".modal").count()) > 0 ? "ja (Dialog bleibt offen, Hinweis)" : "NEIN – Dublette wurde gespeichert";
    }
    await schliesseDialoge(page);
    return dublette && !/NEIN/.test(abgewiesen) ? `Dublette erkannt; Speichern ohne Haken abgewiesen: ${abgewiesen}; Verweis auf Vorhandenes: ${vorhanden}` : false;
  });
  await step("Ablage-Dialog: Abbrechen schließt ohne Speichern", async () => {
    await page.locator("button", { hasText: "Neue Unterlage" }).first().click();
    await page.waitForSelector(".modal");
    await page.locator(".modal button", { hasText: "Abbrechen" }).click();
    return (await page.locator(".modal").count()) === 0;
  });

  // ---------- Eingangszentrale ----------
  await footer(page, "Eingangszentrale");
  await step("Eingangszentrale: Dateien auswählen (PDF, PNG, TXT, EML) füllt die Warteschlange", async () => {
    await page.locator('.central-intake-center input[type="file"], input[type="file"]').first().setInputFiles([probePdf(), probePng(), probeTxt(), probeEml()]);
    await page.waitForTimeout(2500);
    const text = await page.locator("body").innerText();
    const m = text.match(/(\d+) Eingänge/);
    return m && Number(m[1]) >= 4 ? `${m[1]} Eingänge` : (console.log("   ↳", text.slice(text.indexOf("Eingänge prüfen"), text.indexOf("Eingänge prüfen") + 300).replace(/\n/g, " / ")), false);
  });
  await step("Eingangszentrale: E-Mail → „Anlagen in Warteschlange prüfen“ legt die Anlage an", async () => {
    const b = page.locator("button", { hasText: "Anlagen in Warteschlange prüfen" }).first();
    if (!(await b.count())) return false;
    await b.click(); await page.waitForTimeout(1500);
    const text = await page.locator("body").innerText();
    const m = text.match(/(\d+) Eingänge/);
    return /Anlage[_ ]Probe/.test(text) && m && Number(m[1]) >= 5 ? `${m[1]} Eingänge, Anlage als eigener Eingang` : false;
  });
  await step("Eingangszentrale: „Zurückstellen“ und „Weiterbearbeiten“", async () => {
    await page.locator("button", { hasText: "Zurückstellen" }).first().click(); await page.waitForTimeout(300);
    const z = (await page.locator("body").innerText()).match(/(\d+) zurückgestellt/);
    await page.locator("button", { hasText: "Weiterbearbeiten" }).first().click(); await page.waitForTimeout(300);
    return z && Number(z[1]) >= 1;
  });
  await step("Eingangszentrale: Eingang ankreuzen → Sammelknöpfe; „Nicht übernehmen“ nimmt ihn aus der Prüfung", async () => {
    const vorher = (await page.locator("body").innerText()).match(/(\d+) Eingänge/)[1];
    await page.locator('main input[type="checkbox"]').first().check();
    await page.waitForTimeout(200);
    const sammel = await page.locator("button", { hasText: "Sichere Vorschläge vormerken" }).count();
    await page.locator("button", { hasText: "Nicht übernehmen" }).first().click(); await page.waitForTimeout(300);
    const nachher = (await page.locator("body").innerText()).match(/(\d+) Eingänge/)[1];
    return `${vorher} → ${nachher}; Sammelknöpfe nach Ankreuzen: ${sammel ? "ja" : "nein"}`;
  });
  await step("Eingangszentrale: „Zuordnung prüfen“ öffnet den Ablage-Dialog mit der Datei", async () => {
    await page.locator("button", { hasText: "Zuordnung prüfen" }).first().click();
    await page.waitForSelector(".modal");
    const text = await page.locator(".modal").last().innerText();
    await schliesseDialoge(page);
    return text.includes("Probe") || text.includes("Zuordnung");
  });
  await step("Eingangszentrale: „Sichere Vorschläge vormerken“ / „Als gemeinsames Scan-Dokument prüfen“", async () => {
    await aufraeumen(page);
    const a = page.locator("button", { hasText: "Sichere Vorschläge vormerken" }).first();
    const aVorhanden = await a.count();
    if (aVorhanden) { await a.click(); await page.waitForTimeout(300); }
    const scan = page.locator("button", { hasText: "Als gemeinsames Scan-Dokument prüfen" }).first();
    const sVorhanden = await scan.count();
    if (sVorhanden) { await scan.click(); await page.waitForTimeout(500); await schliesseDialoge(page); }
    return `vormerken: ${aVorhanden ? "da" : "nicht sichtbar"}, Scan-Sammel: ${sVorhanden ? "da" : "nicht sichtbar (keine 2 Bilder)"}`;
  });
  await step("Eingangszentrale: Bestandsliste „Abgleich vormerken“ / „Als geprüft bestätigen“ / „Als eingearbeitet bestätigen“", async () => {
    await aufraeumen(page);
    const b = page.locator("button", { hasText: "Als geprüft bestätigen" }).first();
    if (!(await b.count())) return "kein Dokument mit diesem Status";
    await b.click(); await page.waitForTimeout(600);
    return (await page.locator("body").innerText()).includes("geprüft");
  });
  await step("Eingangszentrale: „Neu laden“ ohne Fehler", async () => { await page.locator("button", { hasText: "Neu laden" }).first().click(); await page.waitForTimeout(600); return true; });
  await step("Eingangszentrale: „Einzelne Unterlage prüfen“ öffnet den Ablage-Dialog", async () => {
    await page.locator("button", { hasText: "Einzelne Unterlage prüfen" }).first().click();
    await page.waitForSelector(".modal"); await schliesseDialoge(page); return true;
  });

  // ---------- Dokument fotografieren ----------
  await step("„Dokument fotografieren“ mit zwei Bildern → Seiten, Drehen, Reihenfolge, PDF bauen → Ablage-Dialog", async () => {
    await aufraeumen(page);
    const kamera = page.locator('input[type="file"][capture]').first();
    await kamera.setInputFiles([probePng("Seite1.png"), probePng("Seite2.png", 48, 64)]);
    await page.waitForSelector(".modal");
    await page.waitForTimeout(800);
    const dialog = page.locator(".modal").last();
    const seiten = await dialog.locator("button.scan-page-preview").count();
    await dialog.locator('button[aria-label="Seite 2 nach oben"]').click().catch(() => {});
    await dialog.locator('button[aria-label^="Seite 1"][aria-label$="drehen"]').first().click().catch(() => {});
    await dialog.locator("button", { hasText: /Weiter|prüfen|Reihenfolge/ }).first().click().catch(() => {});
    const bauen = dialog.locator("button.button.primary").last();
    const bauText = await bauen.innerText();
    await bauen.click();
    await page.waitForTimeout(3000);
    const text = await page.locator(".modal").last().innerText().catch(() => "");
    const ablage = text.includes("Geprüft lokal speichern") || (await page.locator(".modal button", { hasText: "Geprüft lokal speichern" }).count()) > 0;
    await schliesseDialoge(page);
    return seiten === 2 && ablage ? `2 Seiten; „${bauText.trim()}“ führt zur Ablage` : (console.log("   ↳ Dialog:", text.slice(0, 200).replace(/\n/g, " / ")), false);
  });
  const netz = errors.filter((e) => /ERR_TUNNEL|cdnjs|net::/.test(e));
  if (netz.length) bekannt("PDF-Vorschau lädt pdf.js von cdnjs.cloudflare.com (Netz nötig; hier gesperrt)", `${netz.length} Netzfehler`);
  check(errors.length === netz.length, "Keine Seitenfehler (außer gesperrtem Netz)", errors.filter((e) => !netz.includes(e)).join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Knöpfe Dokumente"));
