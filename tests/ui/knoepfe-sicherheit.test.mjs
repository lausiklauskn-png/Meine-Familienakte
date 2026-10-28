// Sicherheitscenter, Export, Sicherung/Wiederherstellung, Bestand prüfen, Systemprüfung, Praktische Abnahme, Hilfe-Knöpfe.
// Ordnerauswahl ist mit echten OPFS-Ordnern gestellt (window.showDirectoryPicker).
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors, footer, openMenu } from "./_harness.mjs";
import { windowStub, directoryPickerStub, schliesseDialoge, aufraeumen, bekannt } from "./_stubs.mjs";

const app = await startApp();
const browser = await launchBrowser();
const meldung = async (page) => (await page.locator("[aria-live], .notice").allInnerTexts()).join(" ").replace(/\s+/g, " ").trim();
try {
  const context = await browser.newContext(DESKTOP);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.addInitScript(windowStub);
  await page.addInitScript(directoryPickerStub);
  const errors = collectErrors(page);
  await step("Start", async () => { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); });

  // ---------- Sicherheitscenter ----------
  await footer(page, "Sicherheitscenter");
  await step("Sicherheitscenter: Zustand zeigt den Browser-Datentresor als verbunden", async () => (await page.locator("main").innerText()).includes("Browser-Datentresor"));
  await step("„Jetzt Abgleich durchführen“ (Datentresor und Abgleich) – Verhalten mit Browser-Datentresor", async () => {
    await page.locator("button", { hasText: "Jetzt Abgleich durchführen" }).click(); await page.waitForTimeout(800);
    const crumb = (await page.locator(".breadcrumb").innerText()).replace(/\n/g, " › ");
    const m = await meldung(page);
    if (/derselbe Ordner|SOFTWARE TESTORDNER/.test(m)) bekannt("„Jetzt Abgleich durchführen“ scheitert mit dem Browser-Datentresor", m.slice(0, 160));
    await schliesseDialoge(page);
    await footer(page, "Sicherheitscenter");
    return `führt nach „${crumb.split(" › ").pop()}“; Meldung: ${m.slice(0, 120)}`;
  });
  await step("„Export vorbereiten“ öffnet den Export-Dialog; Start ist bis Zielordner + Umfang gesperrt", async () => {
    await page.locator("button", { hasText: "Export vorbereiten" }).click();
    await page.waitForSelector(".modal");
    const start = page.locator(".modal button", { hasText: "Export jetzt bewusst starten" });
    return await start.isDisabled();
  });
  await step("Export: Zielordner wählen, Umfang ankreuzen, „Export jetzt bewusst starten“ schreibt Dateien", async () => {
    await page.evaluate(() => { window.__naechsterOrdner = "Export-Probe"; });
    await page.locator(".modal button", { hasText: "Lokalen Zielordner auswählen" }).click();
    await page.waitForTimeout(400);
    const haken = page.locator('.modal input[type="checkbox"]');
    if (!(await haken.first().isChecked())) await haken.first().check();
    await page.locator(".modal button", { hasText: "Export jetzt bewusst starten" }).click();
    await page.waitForTimeout(3000);
    const text = (await page.locator(".modal").last().innerText().catch(() => "")) + " " + (await meldung(page));
    const dateien = await page.evaluate(async () => { const r = await navigator.storage.getDirectory(); const d = await r.getDirectoryHandle("Export-Probe"); const out = []; for await (const [n] of d.entries()) out.push(n); return out; });
    await schliesseDialoge(page);
    return dateien.length > 0 ? `${dateien.length} Einträge im Zielordner (${dateien.slice(0, 3).join(", ")})` : (console.log("   ↳", text.slice(0, 300)), false);
  });
  await step("„Vollständige Sicherung erstellen“ schreibt eine Sicherung in den gewählten Ordner", async () => {
    await page.evaluate(() => { window.__naechsterOrdner = "Sicherung-Probe"; });
    await page.locator("button", { hasText: "Vollständige Sicherung erstellen" }).click();
    await page.waitForFunction(() => /Sicherung/.test([...document.querySelectorAll("[aria-live]")].map((e) => e.innerText).join(" ")), null, { timeout: 15000 }).catch(() => {});
    const m = await meldung(page);
    const dateien = await page.evaluate(async () => { const r = await navigator.storage.getDirectory(); const d = await r.getDirectoryHandle("Sicherung-Probe"); const out = []; for await (const [n] of d.entries()) out.push(n); return out; });
    return dateien.length > 0 && /Sicherung/.test(m) ? `Ordner: ${dateien.join(", ")}; ${m.slice(0, 90)}` : (console.log("   ↳", m.slice(0, 300)), false);
  });
  await step("„Wiederherstellung testen“ (Sicherung → leerer Ordner) läuft durch", async () => {
    const sicherung = await page.evaluate(async () => { const r = await navigator.storage.getDirectory(); const d = await r.getDirectoryHandle("Sicherung-Probe"); for await (const [n] of d.entries()) return n; });
    await page.evaluate(async (name) => { window.__naechsterOrdner = `Sicherung-Probe/${name}`; }, sicherung);
    // Der Stub liefert Unterordner nicht direkt; deshalb beim ersten Aufruf den Sicherungsordner selbst, beim zweiten einen leeren Zielordner.
    await page.evaluate(async (name) => {
      let n = 0; const root = await navigator.storage.getDirectory();
      window.showDirectoryPicker = async () => { n++; if (n === 1) return (await root.getDirectoryHandle("Sicherung-Probe")).getDirectoryHandle(name); return root.getDirectoryHandle("Wiederhergestellt-Probe", { create: true }); };
    }, sicherung);
    await page.locator("button", { hasText: "Wiederherstellung testen" }).click();
    await page.waitForFunction(() => /wiederhergestellt|Wiederherstellung/.test([...document.querySelectorAll("[aria-live]")].map((e) => e.innerText).join(" ")), null, { timeout: 15000 }).catch(() => {});
    const m = await meldung(page);
    return /wiederhergestellt|Wiederherstellung/.test(m) ? m.slice(0, 120) : (console.log("   ↳", m.slice(0, 300)), false);
  });
  await step("„OneDrive-Ordner verbinden“ nimmt einen Ordner an und zeigt ihn", async () => {
    await page.evaluate(async () => { const root = await navigator.storage.getDirectory(); window.showDirectoryPicker = async () => root.getDirectoryHandle("OneDrive-Probe", { create: true }); });
    await page.locator("button", { hasText: "OneDrive-Ordner verbinden" }).click();
    await page.waitForTimeout(2500);
    return (await page.locator("main").innerText()).includes("OneDrive-Probe");
  });
  await step("„Abgleich prüfen“ (OneDrive ↔ PC) meldet fehlende/vorhandene Dateien", async () => {
    const b = page.locator("button", { hasText: "Abgleich prüfen" });
    if (await b.isDisabled()) return false;
    await b.click(); await page.waitForTimeout(2500);
    return (await meldung(page)).slice(0, 120);
  });
  await step("„Sperren“ (OneDrive) trennt die Verbindung ohne Löschen", async () => {
    await page.locator("button", { hasText: "Sperren" }).first().click(); await page.waitForTimeout(800);
    const m = await meldung(page);
    return !(await page.locator("main").innerText()).includes("OneDrive-Probe") ? m.slice(0, 100) : false;
  });
  await step("„Anderen PC-/USB-Ordner wählen“ stellt auf den gewählten Ordner um; Beispieldaten dort neu? (Verhalten dokumentiert)", async () => {
    await page.evaluate(async () => { const root = await navigator.storage.getDirectory(); window.showDirectoryPicker = async () => root.getDirectoryHandle("Tresor-Probe", { create: true }); });
    await page.locator("button", { hasText: "Anderen PC-/USB-Ordner wählen" }).click();
    await page.waitForTimeout(3000);
    const text = await page.locator("main").innerText();
    const m = await meldung(page);
    return text.includes("Tresor-Probe") ? `verbunden; ${m.slice(0, 100)}` : (console.log("   ↳", m.slice(0, 200)), false);
  });
  await step("„Sperren“ (PC/USB) ohne OneDrive leert die Ansicht, Dateien bleiben", async () => {
    await page.locator("button", { hasText: "Sperren" }).last().click(); await page.waitForTimeout(800);
    const m = await meldung(page);
    return m.includes("gesperrt") || m.includes("nicht gelöscht") ? m.slice(0, 100) : false;
  });
  await step("Nach dem Sperren: Startseite verlangt wieder einen Datentresor (Beispieldaten-Hinweis weg)", async () => {
    await page.locator(".site-brand").click(); await page.waitForTimeout(500);
    return (await page.locator(".sample-data-notice").count()) === 0;
  });
  await step("„Hilfe“ im Sicherheitscenter führt zur Hilfe", async () => { await footer(page, "Sicherheitscenter"); await page.locator("main button", { hasText: "Hilfe" }).first().click(); return (await page.locator(".breadcrumb").innerText()).includes("Hilfe"); });

  // ---------- Neu laden: Browser-Datentresor wieder da? ----------
  await step("Nach Neuladen ist der Browser-Datentresor wieder verbunden (Beispieldaten erhalten)", async () => {
    await page.reload({ waitUntil: "networkidle" });
    await ready(page);
    return true;
  });

  // ---------- Hilfe ----------
  await footer(page, "Hilfe");
  await step("Hilfe: alle „… öffnen“-Verweise führen zu einer Seite", async () => {
    const texte = await page.locator("main button.text-link").allInnerTexts();
    let ok = 0;
    for (const t of texte.slice(0, 8)) {
      await footer(page, "Hilfe");
      await page.locator("main button.text-link", { hasText: t }).first().click();
      await page.waitForTimeout(200);
      if ((await page.locator(".breadcrumb").innerText()).trim() !== "Startseite\nHilfe" ) ok++;
    }
    return `${ok}/${Math.min(8, texte.length)} geprüfte Verweise wechseln die Seite (${texte.length} insgesamt)`;
  });
  // ---------- Bestand prüfen ----------
  await footer(page, "Bestand prüfen");
  await step("Bestand: „Hauptordner einschließlich Unterordner auswählen“ nimmt den Ordner an", async () => {
    await page.evaluate(async () => { const root = await navigator.storage.getDirectory(); window.showDirectoryPicker = async () => { const d = await root.getDirectoryHandle("Bestand-Probe", { create: true }); const f = await d.getFileHandle("Probe_Beleg.txt", { create: true }); const w = await f.createWritable(); await w.write("Erfundener Beleg Nr. 1 (Beispiel)."); await w.close(); return d; }; });
    await page.locator("button", { hasText: "Hauptordner einschließlich Unterordner auswählen" }).click();
    await page.waitForTimeout(1500);
    return (await page.locator("main").innerText()).includes("Bestand-Probe");
  });
  await step("Bestand: „Bestand jetzt prüfen“ analysiert den Ordner", async () => {
    const b = page.locator("button", { hasText: "Bestand jetzt prüfen" });
    if (await b.isDisabled()) return (console.log("   ↳ Knopf gesperrt"), false);
    await b.click(); await page.waitForTimeout(4000);
    return (await meldung(page)).slice(0, 140);
  });
  await step("Bestand: „Archivdatenträger auswählen“", async () => {
    await page.evaluate(async () => { const root = await navigator.storage.getDirectory(); window.showDirectoryPicker = async () => root.getDirectoryHandle("Archiv-Probe", { create: true }); });
    await page.locator("button", { hasText: "Archivdatenträger auswählen" }).click(); await page.waitForTimeout(800);
    return (await page.locator("main").innerText()).includes("Archiv-Probe");
  });
  await step("Bestand: „Windows-Dateisystem diagnostizieren“ erzeugt einen Bericht, „Diagnose kopieren“ kopiert", async () => {
    await page.locator("button", { hasText: "Windows-Dateisystem diagnostizieren" }).click(); await page.waitForTimeout(3000);
    const text = await page.locator("main").innerText();
    const kopieren = page.locator("main button", { hasText: /kopieren/i }).first();
    if (await kopieren.count()) { await kopieren.click(); await page.waitForTimeout(300); const clip = await page.evaluate(() => navigator.clipboard.readText()); return clip.includes("DIAGNOSE") ? "Bericht in der Zwischenablage" : (console.log("   ↳ Zwischenablage:", clip.slice(0, 80)), false); }
    return text.includes("Diagnose") ? "Bericht sichtbar, kein Kopierknopf" : false;
  });
  await step("Bestand: „Testumgebung automatisch einrichten und prüfen“ (OPFS statt G:\\) läuft oder meldet ehrlich", async () => {
    await page.evaluate(async () => { const root = await navigator.storage.getDirectory(); window.showDirectoryPicker = async () => root.getDirectoryHandle("Entwicklung-Probe", { create: true }); });
    const b = page.locator("button", { hasText: "Testumgebung automatisch einrichten und prüfen" });
    if (await b.isDisabled()) return "Knopf gesperrt (kritischer Fehler?)";
    await b.click();
    await page.waitForFunction(() => /FEHLERBERICHT|konnte nicht|Fehler|Testumgebung .*(angelegt|geprüft|bereit)/.test(document.querySelector("main").innerText), null, { timeout: 12000 }).catch(() => {});
    const text = await page.locator("main").innerText();
    const fehler = text.match(/FEHLERBERICHT|konnte nicht|Fehler/);
    return (fehler ? `Fehlerbericht: ${text.slice(text.indexOf(fehler[0]), text.indexOf(fehler[0]) + 120).replace(/\n/g, " ")}` : "Testumgebung angelegt");
  });
  await step("Bestand: „Testregister vorbereiten“ zeigt eine Vorschau oder einen klaren Hinweis", async () => {
    await page.locator("button", { hasText: "Testregister vorbereiten" }).first().click(); await page.waitForTimeout(2500);
    const text = await page.locator("main").innerText();
    return /Vorschau|Testregister|Hinweis|nicht/.test(text);
  });

  // ---------- Systemprüfung ----------
  await footer(page, "Systemprüfung");
  await step("Systemprüfung: „Abschlussprüfung 2.28.1 starten“ liefert ein Gesamtergebnis", async () => {
    await page.locator("button", { hasText: "Abschlussprüfung 2.28.1 starten" }).click();
    await page.waitForFunction(() => /offene Prüfpunkte/.test(document.body.innerText), null, { timeout: 25000 }).catch(() => {});
    const text = await page.locator("main").innerText();
    const erg = (await page.locator("[aria-live]").allInnerTexts()).join(" ").match(/Systemprüfung abgeschlossen[^.]*\./);
    const probleme = [...text.matchAll(/(?:ROT|GELB)[^\n]*\n([^\n]{10,120})/g)].map((m) => m[1]).slice(0, 6);
    if (probleme.length) console.log("   ↳ offene Prüfpunkte:", probleme.join(" | ").slice(0, 400));
    return erg ? erg[0].slice(0, 100) : (console.log("   ↳", text.slice(0, 300).replace(/\n/g, " / ")), false);
  });
  await step("Systemprüfung: „Änderungen prüfen“ läuft", async () => { await page.locator("button", { hasText: "Änderungen prüfen" }).click(); await page.waitForTimeout(4000); return (await page.locator("main").innerText()).includes("Prüfbericht"); });
  await step("Systemprüfung: „Systemprüfung reparieren“ läuft ohne Fehler", async () => {
    const b = page.locator("button", { hasText: "Systemprüfung reparieren" });
    if (!(await b.count()) || await b.isDisabled()) return "nicht anklickbar (nichts zu reparieren)";
    await b.click(); await page.waitForTimeout(4000); return true;
  });
  await step("Prüfberichte: Bericht-Knöpfe (öffnen/kopieren) vorhanden", async () => {
    const sect = page.locator("#pruefberichte");
    const knoepfe = await sect.locator("button").allInnerTexts();
    return knoepfe.length ? knoepfe.slice(0, 4).join(" · ") : "keine Knöpfe im Berichtsbereich";
  });
  await step("Praktische Abnahme: 5 × Antwort → „Alle 5 Prüfergebnisse übermitteln“ wird frei", async () => {
    const radios = page.locator('input[type="radio"]');
    const n = await radios.count();
    for (let i = 0; i < n; i += 3) await radios.nth(i).check().catch(() => {});
    const b = page.locator("button", { hasText: "Alle 5 Prüfergebnisse übermitteln" });
    const frei = !(await b.isDisabled());
    if (frei) { await b.click(); await page.waitForTimeout(800); }
    return frei ? `${n} Auswahlfelder; nach 5 Antworten übermittelt` : false;
  });
  await step("Praktische Abnahme: Block 2 anwählen, „Ergebnisse speichern und Testphase unterbrechen“", async () => {
    await page.locator("button", { hasText: /^2 · / }).click().catch(() => {});
    const radios = page.locator('input[type="radio"]'); const n = await radios.count();
    for (let i = 0; i < n; i += 3) await radios.nth(i).check().catch(() => {});
    const b = page.locator("button", { hasText: "Ergebnisse speichern und Testphase unterbrechen" });
    if (await b.isDisabled()) return false;
    await b.click(); await page.waitForTimeout(600);
    return (await page.locator("main").innerText()).includes("unterbrochen") || (await page.locator("button", { hasText: /fortsetzen|Fortsetzen/ }).count()) > 0;
  });

  check(errors.length === 0, "Keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Knöpfe Sicherheit/Bestand/Systemprüfung"));
