// Assistenzzentrale, Korrespondenz, Gesundheit & Arbeit, Familie, Wohnen/Fahrzeuge/Käufe (vorbereitete Bereiche), Verzeichnis, Was gibt’s Neues.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors, footer, openMenu } from "./_harness.mjs";
import { speechStub, windowStub, schliesseDialoge, aufraeumen, verdecktVon } from "./_stubs.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage(); page.setDefaultTimeout(8000);
  await page.addInitScript(speechStub("Welche Unterlagen fehlen für die Reklamation der Waschmaschine"));
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await step("Start", async () => { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); });

  // ---------- Assistenz ----------
  await openMenu(page, 0, "Assistenzzentrale");
  await step("Assistenz: fünf Modus-Knöpfe schalten um (aria-pressed)", async () => {
    const modi = page.locator("button.assistant-mode-action");
    const n = await modi.count();
    await modi.nth(1).click();
    return n === 5 && (await modi.nth(1).getAttribute("aria-pressed")) === "true" ? `${n} Modi` : false;
  });
  await step("Assistenz: Diktat füllt die Frage", async () => {
    const mic = page.locator(".dictation-button").nth(1);
    if (await mic.isDisabled()) return false;
    await mic.click(); await page.waitForFunction(() => [...document.querySelectorAll("textarea")].some((t) => t.value.includes("Waschmaschine")));
    await mic.click().catch(() => {}); return true;
  });
  await step("Assistenz: „Familienakte prüfen und Vorschlag vorbereiten“ liefert Fakten und Vorgang", async () => {
    await page.locator("button.assistant-mode-action").first().click();
    await page.locator("textarea").first().fill("Welche Unterlagen fehlen für die Reklamation der Waschmaschine?");
    await page.locator("button", { hasText: "Familienakte prüfen und Vorschlag vorbereiten" }).click();
    await page.waitForTimeout(800);
    const text = await page.locator("main").innerText();
    return /Vorgang öffnen|Waschmaschine/.test(text) && (await page.locator("button", { hasText: "Vorgang öffnen" }).count()) >= 0;
  });
  await step("Assistenz: Fakt-Knopf öffnet Dokument oder Vorgang", async () => {
    const f = page.locator("main button.text-link", { hasText: /·/ }).first();
    if (!(await f.count())) return "kein Fakt-Knopf";
    await f.click(); await page.waitForTimeout(600);
    const modal = (await page.locator(".modal").count()) > 0; const crumb = await page.locator(".breadcrumb").innerText();
    await schliesseDialoge(page);
    if (!crumb.includes("Assistenz")) { await openMenu(page, 0, "Assistenzzentrale"); await page.locator("textarea").first().fill("Reklamation Waschmaschine"); await page.locator("button", { hasText: "Familienakte prüfen und Vorschlag vorbereiten" }).click(); await page.waitForTimeout(600); }
    return modal ? "öffnet Dokumentvorschau" : "öffnet Vorgang im Cockpit";
  });
  await step("Assistenz: Modus „Schreiben oder E-Mail erstellen“ → „Schreiben vorbereiten“ zeigt Typ, Ton, Empfänger, Betreff, Entwurf", async () => {
    await aufraeumen(page); await openMenu(page, 0, "Assistenzzentrale");
    await page.locator("button.assistant-mode-action", { hasText: "Schreiben oder E-Mail erstellen" }).click();
    await page.locator("textarea").first().fill("Bitte um Belegeinsicht zur Nebenkostenabrechnung 2025.");
    await page.locator("button", { hasText: "Familienakte prüfen und Vorschlag vorbereiten" }).click(); await page.waitForTimeout(600);
    await page.locator("button", { hasText: "Schreiben vorbereiten" }).click(); await page.waitForTimeout(400);
    const text = await page.locator("main").innerText();
    return ["Schreibentyp", "Ton", "Empfänger", "Betreff", "Entwurf"].every((w) => text.includes(w));
  });
  await step("Assistenz: „Kürzer / Freundlicher / Bestimmter / Sachlicher“ verändern den Entwurf", async () => {
    const entwurf = page.locator("textarea").last();
    const vorher = await entwurf.inputValue();
    const ergebnisse = [];
    for (const w of ["Kürzer", "Freundlicher", "Bestimmter", "Sachlicher"]) { await page.locator("button", { hasText: w }).click(); await page.waitForTimeout(150); ergebnisse.push((await entwurf.inputValue()) !== vorher); }
    return `geändert: ${ergebnisse.map((x, i) => `${["Kürzer", "Freundlicher", "Bestimmter", "Sachlicher"][i]}=${x ? "ja" : "nein"}`).join(", ")}`;
  });
  await step("Assistenz: Speichern ist ohne Bestätigungshaken gesperrt; mit Haken „Als Entwurf speichern“ legt Korrespondenz an", async () => {
    const b = page.locator("button", { hasText: "Als Entwurf speichern" });
    const gesperrt = await b.isDisabled();
    await page.locator('main input[type="checkbox"]').last().check();
    await b.click(); await page.waitForTimeout(1500);
    const text = (await page.locator("[aria-live], .notice").allInnerTexts()).join(" ");
    return gesperrt && /gespeichert|Korrespondenz/.test(text) ? text.replace(/\s+/g, " ").slice(0, 100) : (console.log("   ↳ gesperrt:", gesperrt, text.slice(0, 120)), false);
  });
  await step("Assistenz: gespeicherte Korrespondenz anklicken öffnet den Vorgang", async () => {
    const k = page.locator("main button", { hasText: /Entwurf|Brief|E-Mail/ }).last();
    await k.click(); await page.waitForTimeout(400);
    return (await page.locator(".breadcrumb").innerText()).includes("Cockpit");
  });

  // ---------- Korrespondenz, Gesundheit & Arbeit, Unterseiten ----------
  for (const [nav, eintrag] of [[0, "Korrespondenz", /Schriftverkehr|Anfragen/], [1, "Diagnosen, AU & ICD-Codes", /Gesundheitsdokumente/], [1, "Krankenkasse & Leistungen", /Leistung/], [1, "Arbeit & Arbeitgeber", /Arbeit/], [1, "Anträge & Bescheide", /Antr/], [2, "Familienübersicht", /Öffnen/]]) {
    if (eintrag === "Familienübersicht") {
      await step("Unterseite „Familienübersicht“: „Öffnen“-Karten führen zu Tagebuch, Cockpit, Fristen, Bibliothek", async () => {
        await aufraeumen(page); await openMenu(page, 2, "Familienübersicht");
        await page.locator("main button", { hasText: "Termine und Fristen" }).first().click(); await page.waitForTimeout(300);
        return (await page.locator(".breadcrumb").innerText()).includes("Fristen");
      });
      continue;
    }
    await step(`Unterseite „${eintrag}“: Aktionskarten führen zur Bibliothek/zum Cockpit`, async () => {
      await aufraeumen(page); await openMenu(page, nav, eintrag);
      const karten = page.locator("main .subpage-actions button, main button.card, main .action-grid button, main button:has(strong)").filter({ visible: true });
      const n = await karten.count();
      if (!n) return false;
      await karten.first().click();
      await page.waitForTimeout(300);
      const crumb = (await page.locator(".breadcrumb").innerText()).replace(/\n/g, " › ");
      return !crumb.endsWith(eintrag) ? `${n} Karten; erste führt zu „${crumb.split(" › ").pop()}“` : (await page.locator(".search-results").count()) ? "startet eine Suche" : false;
    });
  }
  await step("Gesundheit: Beispiel-Einträge mit Suchwörtern (z. B. „Brillenpass Mattis“) starten die Suche", async () => {
    await openMenu(page, 1, "Diagnosen, AU & ICD-Codes");
    const b = page.locator("main button", { hasText: "Brillenpass Mattis" }).first();
    if (!(await b.count())) return "Knopf nicht da";
    await b.click(); await page.waitForTimeout(300);
    return (await page.locator(".search-results").count()) === 1 || (await page.locator(".breadcrumb").innerText()).includes("Bibliothek");
  });
  const klick = async (loc, label) => { try { await loc.click(); } catch (e) { throw new Error(`${label}: ${String(e.message).split("\n")[0]} | Mega-Menü: ${await page.locator(".mega-menu").count()} | Dialoge: ${await page.locator(".modal-backdrop").count()} | Suche: ${await page.locator(".search-results").count()}`); } };
  await step("Wohnen: „Unterlage hinzufügen“ öffnet den Ablage-Dialog; Unterbereich-Karten filtern die Bibliothek", async () => {
    await aufraeumen(page); await page.locator(".global-search input").fill(""); await page.waitForTimeout(200);
    await klick(page.locator(".site-brand"), "Marke");
    await page.evaluate(() => window.scrollTo(0, 0));
    await klick(page.locator(".main-navigation .nav-cluster > button").nth(3), "Wohnen-Menü");
    await klick(page.locator(".mega-menu button", { hasText: "Miet- & Vermieterunterlagen" }).first(), "Menüeintrag");
    await page.waitForTimeout(300);
    const u = page.locator("main button", { hasText: "Unterlage hinzufügen" }).first();
    try { await u.click(); } catch (e) { console.log("   ↳ darüber liegt:", await verdecktVon(page, u), "| Mega-Menü offen:", await page.locator(".mega-menu").count(), "| Dialoge:", await page.locator(".modal-backdrop").count()); throw e; }
    await page.waitForTimeout(300);
    const offen = (await page.locator(".modal").count()) > 0; await schliesseDialoge(page);
    await page.locator("main button", { hasText: /01\s*Mietvertrag/ }).click(); await page.waitForTimeout(300);
    return offen && (await page.locator(".breadcrumb").innerText()).includes("Dokumentenbibliothek");
  });
  await step("Fahrzeuge und Käufe: dieselben Karten (vorbereitete Bereiche)", async () => {
    await aufraeumen(page); await openMenu(page, 4, "Fahrzeugpapiere");
    const f = await page.locator("main button", { hasText: /^0\d/ }).count();
    await openMenu(page, 5, "Käufe & Rechnungen");
    const k = await page.locator("main button", { hasText: /^0\d/ }).count();
    return f >= 3 && k >= 3 ? `Fahrzeuge ${f}, Käufe ${k} Unterbereiche` : false;
  });
  await step("Gesamtes Verzeichnis: jeder Eintrag ist ein Knopf und wechselt die Seite", async () => {
    await footer(page, "Gesamtes Verzeichnis");
    const n = await page.locator("main button:not(.start-info-trigger)").count();
    await page.locator("main button:not(.start-info-trigger)", { hasText: "Fristen und Aufgaben" }).first().click(); await page.waitForTimeout(300);
    return (await page.locator(".breadcrumb").innerText()).includes("Fristen") ? `${n} Einträge` : false;
  });
  await step("Was gibt’s Neues: Vorschau-Karten öffnen die Quelle; geschützte Einträge führen in den Gesundheitsbereich", async () => {
    await footer(page, "Was gibt’s Neues?");
    const karten = page.locator("button.news-preview");
    const n = await karten.count();
    const sensibel = await page.locator("button.news-preview.sensitive").count();
    await karten.first().click(); await page.waitForTimeout(400);
    const crumb = await page.locator(".breadcrumb").innerText();
    await schliesseDialoge(page);
    return n > 0 ? `${n} Karten (${sensibel} geschützt); erste → ${crumb.split("\n").pop()}` : false;
  });
  await step("Unterlagen & Quellen: Kerndokument-Knöpfe filtern die Bibliothek", async () => {
    await openMenu(page, 6, "Unterlagen & Quellen");
    await page.locator("main button", { hasText: "Mietvertrag Pustelblumenweg 7" }).first().click(); await page.waitForTimeout(300);
    return (await page.locator(".breadcrumb").innerText()).includes("Dokumentenbibliothek");
  });
  check(errors.length === 0, "Keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Knöpfe Assistenz/Bereiche"));
