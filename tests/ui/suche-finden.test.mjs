// 2.28.39 (Prüfbericht Suche M1–M14): „Ich gebe oben eine Frage ein und bekomme das Dokument, den Termin, den Bankauszug.“
// Eigene Akte ohne Beispieldaten in der Suche, alle Treffer erreichbar (neueste zuerst, „Weitere anzeigen“, nach Art gruppiert),
// Bankauszug = Kontoauszug, Monate/deutsche Daten, mehr Wörter = weniger Treffer, Gesundheit zusammengefasst, Bereichsknöpfe
// treffen die vorhandenen Dokumente mit sichtbarem Filter, Bibliothek seitenweise, Assistenz deutsch und mit Datum.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, footer, collectErrors } from "./_harness.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

async function suchen(page, frage) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const feld = page.locator(".global-search input");
  await feld.fill("");
  await feld.fill(frage);
  await page.waitForSelector(".search-results", { timeout: 10000 });
  await page.waitForTimeout(300);
  return page.locator(".search-results article").evaluateAll((els) => els.map((el) => ({
    art: el.getAttribute("data-such-art") || "",
    datum: el.querySelector(".such-datum")?.textContent?.trim() || "",
    titel: el.querySelector("strong")?.textContent?.trim() || "",
    detail: el.querySelector("small")?.textContent?.trim() || "",
    gruppe: el.closest("[data-such-gruppe]")?.getAttribute("data-such-gruppe") || "",
  })));
}
const datenTreffer = (page) => page.locator(".search-results").getAttribute("data-such-anzahl").then(Number);

const app = await startApp();
const browser = await launchBrowser();
try {
  // A) Eigene, echte Akte (keine Demo, keine Beispielfamilie)
  const page = await (await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(20000);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" });
  await page.waitForSelector(".site-brand-version", { timeout: 120000 });
  await vaultFixture(page);

  await step("Eigene leere Akte: „Krankenkasse“, „März“, „Brille“ finden keine erfundenen Beispieleinträge", async () => {
    const funde = [];
    for (const frage of ["Krankenkasse", "März", "Brille", "Arbeit"]) funde.push(...(await suchen(page, frage)).filter((t) => t.gruppe !== "Bereiche der App"));
    return soll(funde.length === 0, funde.map((t) => `${t.art}: ${t.titel}`).join(" | "));
  });

  await page.evaluate(async () => {
    const f = window.__vaultFixture; const h = await f.browserVault();
    const datei = (name) => new File([`Erfundenes Testdokument ${name}`], name, { type: "application/pdf" });
    for (let i = 0; i < 60; i++) {
      const jahr = 2020 + (i % 6), monat = String(1 + (i % 12)).padStart(2, "0");
      await f.saveLocalDocument(h, datei(`Kontoauszug_${jahr}-${monat}_${i}.pdf`), { category: "Finanzen", documentDate: `${jahr}-${monat}-15`, notes: "Erfundene Probe", allowDuplicate: true });
    }
    await f.saveLocalDocument(h, datei("Kontoauszug_Familienkonto.pdf"), { category: "Finanzen", documentDate: "2026-03-04", notes: "Erfundene Probe", allowDuplicate: true });
    await f.saveLocalDocument(h, datei("Fahrzeugschein_Kombi.pdf"), { category: "Fahrzeuge", documentDate: "2024-05-02", notes: "Erfundene Probe", allowDuplicate: true });
    for (const n of [1, 2, 3]) await f.saveLocalDocument(h, datei(`Zahnarzt_Rechnung_${n}.pdf`), { category: "Gesundheit", documentDate: `2025-0${n}-10`, notes: "Erfundene Probe", allowDuplicate: true });
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".site-brand-version", { timeout: 120000 });

  await step("„Bankauszug März“ findet den Kontoauszug vom März (Synonym und Monat)", async () => {
    const t = await suchen(page, "Bankauszug März");
    const doks = t.filter((x) => x.art === "Dokument").map((x) => x.titel);
    return soll(doks.includes("Kontoauszug_Familienkonto.pdf") && doks.every((x) => /Kontoauszug/.test(x)), doks.join(" | "));
  });
  await step("„15.03.2022“ als deutsches Datum: nur Auszüge vom 15.03.2022", async () => {
    const t = (await suchen(page, "Kontoauszug 15.03.2022")).filter((x) => x.art === "Dokument");
    return soll(t.length >= 1 && t.every((x) => x.datum === "15.03.2022"), t.map((x) => `${x.datum} ${x.titel}`).join(" | "));
  });
  await step("Mehr Wörter = weniger Treffer: „Kontoauszug März 2022“ < „Kontoauszug“", async () => {
    await suchen(page, "Kontoauszug"); const alle = await datenTreffer(page);
    await suchen(page, "Kontoauszug März 2022"); const eng = await datenTreffer(page);
    return soll(alle === 61 && eng > 0 && eng < alle, { alle, eng });
  });
  await step("Alle 61 Kontoauszüge erreichbar: neueste zuerst, „Weitere Ergebnisse“ zeigt mehr", async () => {
    const t = await suchen(page, "Kontoauszug");
    const erste = t.find((x) => x.art === "Dokument");
    const vorher = (await suchen(page, "Kontoauszug")).filter((x) => x.art === "Dokument").length;
    await page.locator('[data-such-gruppe="Dokumente"] [data-such-mehr]').click();
    const nachher = (await page.locator('[data-such-gruppe="Dokumente"] article').count());
    return soll(/2026|2025/.test(erste?.datum || "") && vorher < nachher && /61 Treffer/.test(await page.locator("[data-such-gesamt]").innerText()), { erste, vorher, nachher });
  });
  await step("Gesundheit: ein zusammengefasster Treffer statt drei gleicher Zeilen", async () => {
    const t = await suchen(page, "Zahnarzt");
    const geschuetzt = t.filter((x) => /geschützte Gesundheitsunterlage/i.test(x.titel));
    return soll(geschuetzt.length === 1 && /^3 geschützte/.test(geschuetzt[0].titel), t.map((x) => x.titel).join(" | "));
  });
  await step("„Erinnerung Fahrzeugschein“: Bereichswort holt keine fremden Einträge herein", async () => {
    const t = (await suchen(page, "Erinnerung Fahrzeugschein")).filter((x) => x.gruppe !== "Bereiche der App");
    return soll(t.length === 1 && /Fahrzeugschein/.test(t[0].titel), t.map((x) => x.titel).join(" | "));
  });
  await step("Fahrzeuge → Dokumente zeigt den Fahrzeugschein, der Filter ist sichtbar", async () => {
    await suchen(page, "Fahrzeuge");
    await page.locator(".search-results article", { has: page.locator("strong", { hasText: /^Fahrzeuge$/ }) }).first().locator("button").first().click();
    await page.locator(".subpage-actions button, .card button", { hasText: /^Dokumente/ }).first().click();
    await page.waitForSelector(".library-filters");
    const zahl = await page.locator(".news-result-heading h2").innerText();
    const filter = await page.locator("[data-filter-aktiv]").innerText();
    const auswahl = await page.locator(".library-filter-grid select").first().inputValue();
    return soll(/^[1-9]/.test(zahl) && /Fahrzeuge/.test(filter) && auswahl === "Fahrzeuge", { zahl, filter, auswahl });
  });
  await step("Bibliothek „Alle ansehen“: 50 Zeilen je Seite, „Weitere anzeigen“ lädt nach", async () => {
    await footer(page, "Dokumentenbibliothek");
    await page.locator(".library-toolbar button", { hasText: "Alle ansehen" }).click();
    await page.waitForSelector(".library-filters");
    // 2.28.39 (Punkt 7): kompakte Zeilen statt Karten, weiter 50 je Seite.
    const vorher = await page.locator("[data-bibliothek-zeile]").count();
    await page.locator("[data-liste-mehr] button").click();
    const nachher = await page.locator("[data-bibliothek-zeile]").count();
    return soll(vorher === 50 && nachher === 65, { vorher, nachher });
  });
  await step("„Unterlagen & Quellen“ zeigt in der eigenen Akte keine Beispiel-Kerndokumente", async () => {
    await suchen(page, "Unterlagen & Quellen");
    await page.locator(".search-results article", { has: page.locator("strong", { hasText: "Unterlagen & Quellen" }) }).first().locator("button").first().click();
    await page.waitForSelector("[data-quellen-leer]");
    const text = await page.locator("main").innerText();
    return soll(!/Lindqvist|Kerndokumente \(Beispiel\)/.test(text), "Beispieldaten sichtbar");
  });
  check(errors.length === 0, "eigene Akte: keine Seitenfehler", errors.join(" | "));

  // B) Beispielfamilie: Assistenz und Kopfsuche liefern dieselben Einträge, deutsch und mit Datum
  const demo = await (await browser.newContext(DESKTOP)).newPage();
  demo.setDefaultTimeout(20000);
  const demoErrors = collectErrors(demo);
  await demo.goto(app.base, { waitUntil: "networkidle" }); await ready(demo);
  const frage = "Wann ist der Vorsorgetermin von Ella?";
  // Verglichen werden die Einträge der Akte (Aufgaben, Fristen, Vorgänge …); feste Beispielangaben und Dokumente nutzt die Assistenz nicht.
  const kopf = (await suchen(demo, frage)).filter((x) => !["Bereiche der App", "Dokumente", "Diagnose", "Arzt/Praxis", "Schriftverkehr", "Leistung", "Arbeit", "Gesundheit"].includes(x.gruppe));
  await step("Assistenz: deutsche Art, Datum bei „wann“, gleiche Einträge wie die Kopfsuche", async () => {
    await demo.locator(".global-search input").fill("");
    await demo.evaluate(() => window.scrollTo(0, 0));
    await demo.locator(".main-navigation .nav-cluster > button").nth(0).click({ force: true });
    await demo.locator(".mega-menu button", { hasText: "Assistenzzentrale" }).first().click();
    await demo.locator("textarea").first().fill(frage);
    await demo.locator("button", { hasText: "Familienakte prüfen und Vorschlag vorbereiten" }).click();
    const antwort = await demo.locator("[data-assistenz-antwort]").innerText();
    const fakten = await demo.locator(".evidence-card li").allInnerTexts();
    const englisch = fakten.filter((f) => /^(task|person|event|deadline|contract|reminder)\b/.test(f));
    const kopfTitel = kopf.filter((x) => x.art !== "Dokument").map((x) => x.titel);
    const gleich = kopfTitel.every((titel) => fakten.some((f) => f.includes(titel)));
    return soll(/\d{2}\.\d{2}\.\d{4}/.test(antwort) && englisch.length === 0 && kopfTitel.length > 0 && gleich, { antwort, fakten, kopfTitel });
  });
  await step("Frist aus der Suche führt nach „Fristen und Aufgaben“ an den Termin (nicht ins Cockpit)", async () => {
    await suchen(demo, "Kfz-Versicherung");
    await demo.locator(".search-results article[data-such-art=\"Frist\"]").first().locator("button").first().click();
    await demo.waitForTimeout(1200);
    const crumb = await demo.locator(".breadcrumb").innerText();
    const sichtbar = await demo.evaluate(() => { const el = document.querySelector("[id^='termin-'].hervorgehoben, [id^='termin-'].offen"); if (!el) return null; const r = el.getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; });
    return soll(/Fristen/.test(crumb) && sichtbar === true, { crumb, sichtbar });
  });
  await step("Tagebuch-Treffer: der Eintrag steht im Bild, nicht nur das Eingabefeld", async () => {
    await suchen(demo, "Stützräder");
    await demo.locator(".search-results article[data-such-art^=\"Tagebuch\"]").first().locator("button").first().click();
    await demo.waitForTimeout(1500);
    const lage = await demo.evaluate(() => { const el = document.querySelector(".memory-detail"); const r = el?.getBoundingClientRect(); return r ? { top: Math.round(r.top), text: el.textContent.slice(0, 80) } : null; });
    return soll(lage && lage.top >= -40 && lage.top < 600 && /Stützräder|Fiete/.test(lage.text), lage);
  });
  check(demoErrors.length === 0, "Beispielfamilie: keine Seitenfehler", demoErrors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Suche finden (2.28.39)"));
