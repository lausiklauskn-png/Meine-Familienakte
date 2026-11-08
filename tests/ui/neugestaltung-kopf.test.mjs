// 2.28.39 (Klaus 08.11.2026, Vorschau neugestaltung-2.28.39 Punkte 1–5): „So fängst du an“ auf der Startseite (Überspringen,
// gemerkt), Knopf „Ablegen“ im Kopf mit Auswahl → Eingangszentrale, rotes Fähnchen „Update verfügbar“ statt ⟳, ein Cockpit
// (gefiltert aus einem Bereich) und Menügruppe „Termine & Aufgaben“ mit „Mein Kalender“.
import { startApp, launchBrowser, DESKTOP, ready, step, summary, check, collectErrors, openMenu } from "./_harness.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);

  // --- 1 · So fängst du an (in einer leeren Akte: Beispieldaten erst entfernen) ---
  await step("Beispieldaten entfernen (leere Akte)", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const k = page.locator("button", { hasText: "Beispieldaten entfernen" });
    if (!(await k.count())) return "keine Beispieldaten";
    await k.focus(); await page.keyboard.press("Enter");
    await page.locator(".page-dialog button", { hasText: "Ja, fortfahren" }).click();
    await page.waitForSelector(".sample-data-notice", { state: "detached", timeout: 30000 });
    await page.locator(".site-brand").click(); await page.waitForTimeout(400);
    return true;
  });
  const kasten = page.locator("[data-erste-schritte]");
  await step("Startseite: „So fängst du an“ ganz oben mit drei Schritten", async () => {
    const schritte = await page.locator("[data-erster-schritt]").evaluateAll((l) => l.map((e) => e.getAttribute("data-erster-schritt")));
    const vorHero = await page.evaluate(() => { const k = document.querySelector("[data-erste-schritte]"); const h = document.querySelector(".family-hero"); return !!k && !!h && !!(k.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING); });
    return soll((await kasten.isVisible()) && schritte.join() === "speicher,dokument,erinnerung" && vorHero, { schritte, vorHero });
  });
  // Neu laden ohne ready(): ready() legt die Beispielfamilie wieder an.
  const neuLaden = async () => { await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector(".site-brand-version", { timeout: 60000 }); await page.waitForTimeout(800); };
  const staende = async () => Object.fromEntries(await page.locator("[data-erster-schritt]").evaluateAll((l) => l.map((e) => [e.getAttribute("data-erster-schritt"), e.getAttribute("data-stand")])));
  const anfang = await staende();
  console.log("   ↳ Ausgangslage:", JSON.stringify(anfang));
  await step("Erledigte Schritte zeigen ✓, offene einen Knopf und „Überspringen“", async () => {
    const r = await page.locator("[data-erster-schritt]").evaluateAll((l) => l.map((e) => ({ stand: e.getAttribute("data-stand"), los: !!e.querySelector("[data-erster-schritt-los]"), weg: !!e.querySelector("[data-erster-schritt-weg]") })));
    return soll(r.every((x) => x.stand === "erledigt" ? !x.los && !x.weg : x.los && x.weg) && r.some((x) => x.stand === "offen"), r);
  });
  await step("„Erstes Dokument ablegen“ öffnet die Ablegen-Auswahl im Kopf", async () => {
    soll(anfang.dokument === "offen" && anfang.erinnerung === "offen", anfang);
    await page.locator('[data-erster-schritt-los="dokument"]').click();
    await page.locator("[data-ablegen-auswahl]").waitFor({ timeout: 3000 });
    const wahl = await page.locator("[data-ablegen-auswahl] [data-ablegen]").evaluateAll((l) => l.map((e) => e.getAttribute("data-ablegen")));
    await page.keyboard.press("Escape");
    return soll(wahl.join() === "foto,dateien,ordner", wahl);
  });
  await step("„Überspringen“ markiert den Schritt und bleibt nach Neuladen", async () => {
    const id = "erinnerung";
    await page.locator(`[data-erster-schritt-weg="${id}"]`).click();
    const sofort = (await staende())[id];
    await neuLaden();
    const danach = (await staende())[id];
    return soll(sofort === "übersprungen" && danach === "übersprungen", { id, sofort, danach });
  });
  await step("Alle übrigen Schritte übersprungen → der Kasten verschwindet (auch nach Neuladen)", async () => {
    for (const id of ["speicher", "dokument", "erinnerung"]) { const k = page.locator(`[data-erster-schritt-weg="${id}"]`); if (await k.count()) await k.click(); }
    const weg = (await kasten.count()) === 0;
    await neuLaden();
    return soll(weg && (await kasten.count()) === 0, "Kasten noch da");
  });

  // --- 2 · Ablegen im Kopf ---
  await step("Kopf: „Ablegen“ (Fach mit Pfeil), kein Drucker, kein ⟳", async () => soll(
    (await page.locator("[data-ablegen-knopf]").isVisible()) && (await page.locator(".header-actions .drucken-knopf, .header-actions .aktualisieren-knopf").count()) === 0,
    "Kopf falsch"));
  await step("Ablegen › Dateien wählen: zwei Dateien landen in der Eingangszentrale zur Prüfung", async () => {
    await page.locator("[data-ablegen-knopf]").click();
    await page.locator("[data-ablegen-auswahl]").waitFor();
    await page.locator('[data-ablegen-eingabe="dateien"]').setInputFiles([
      { name: "Ablegen-Probe-Rechnung.txt", mimeType: "text/plain", buffer: Buffer.from("Rechnung Beispiel GmbH, erfunden, 12,30 Euro") },
      { name: "Ablegen-Probe-Brief.txt", mimeType: "text/plain", buffer: Buffer.from("Brief Beispielamt, erfunden") },
    ]);
    await page.waitForFunction(() => document.body.innerText.includes("Ablegen-Probe-Rechnung") && document.body.innerText.includes("Ablegen-Probe-Brief"), null, { timeout: 15000 });
    const crumb = await page.locator(".breadcrumb").innerText();
    const zu = (await page.locator("[data-ablegen-auswahl]").count()) === 0;
    return soll(crumb.includes("Eingangszentrale") && zu, { crumb, zu });
  });

  // --- 3 · Fähnchen „Update verfügbar“ ---
  await step("Ohne neue Fassung kein Fähnchen an der Versionszeile", async () => soll((await page.locator("[data-update-fahne]").count()) === 0, "Fähnchen ohne Grund"));
  await step("Meldet die Prüfung eine neue Fassung, steht rot „Update verfügbar“ an der Versionszeile", async () => {
    await page.evaluate(() => window.FamilienakteApp.fahne(true, "9.9.9"));
    const f = page.locator("[data-update-fahne]");
    await f.waitFor({ timeout: 3000 });
    const r = await f.evaluate((e) => ({ text: e.textContent, farbe: getComputedStyle(e).backgroundColor, neben: !!e.closest(".site-brand-zeile"), version: document.querySelector(".site-brand-version").textContent }));
    return soll(r.text === "Update verfügbar" && r.farbe === "rgb(198, 40, 40)" && r.neben && r.version.trim() === r.version.trim().replace("Update", ""), r);
  });
  await step("Antippen startet das Update wie die Versionszeile (nicht die Startseite)", async () => {
    await page.evaluate(() => { window.__updates = 0; window.FamilienakteApp.aktualisieren = () => { window.__updates++; }; });
    await page.locator("[data-update-fahne]").click();
    const n = await page.evaluate(() => window.__updates);
    return soll(n === 1 && (await page.locator(".breadcrumb").innerText()).includes("Eingangszentrale"), { n });
  });
  await step("Nach dem Update (keine neue Fassung mehr) ist das Fähnchen weg", async () => {
    await page.evaluate(() => window.FamilienakteApp.fahne(false));
    await page.waitForTimeout(200);
    return soll((await page.locator("[data-update-fahne]").count()) === 0, "bleibt stehen");
  });

  // --- 4/5 · Menü „Termine & Aufgaben“ und ein Cockpit ---
  await step("Menü: Gruppe „Termine & Aufgaben“ mit Cockpit · Fristen und Aufgaben · Mein Kalender · Tagebuch", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const gruppen = await page.locator(".main-navigation .nav-cluster > button").allInnerTexts();
    await page.locator(".main-navigation .nav-cluster > button").nth(1).click({ force: true });
    const eintraege = await page.locator(".mega-menu .mega-group button strong").allInnerTexts();
    await page.locator(".main-navigation .nav-cluster > button").nth(1).click({ force: true });
    return soll(/Termine & Aufgaben/i.test(gruppen[1]) && eintraege.join("|") === "Cockpit|Fristen und Aufgaben|Mein Kalender|Tagebuch & Erinnerungen" && !gruppen.join("|").includes("Interaktives"), { gruppen, eintraege });
  });
  await step("„Familie & Personen“ behält Familienübersicht, Personen, Vollmachten, Versicherungen; kein zweiter Cockpit-Eintrag mehr", async () => {
    await page.locator(".main-navigation .nav-cluster > button").nth(3).click({ force: true });
    const eintraege = await page.locator(".mega-menu .mega-group button strong").allInnerTexts();
    await page.locator(".main-navigation .nav-cluster > button").nth(3).click({ force: true });
    await page.locator(".main-navigation .nav-cluster > button").nth(0).click({ force: true });
    const assistenz = await page.locator(".mega-menu .mega-group button strong").allInnerTexts();
    await page.locator(".main-navigation .nav-cluster > button").nth(0).click({ force: true });
    return soll(eintraege.join("|") === "Familienübersicht|Personen|Vollmachten & Vorsorge|Versicherungen & Verträge" && !assistenz.some((x) => /Cockpit|weiterbearbeiten/.test(x)), { eintraege, assistenz });
  });
  await step("„Mein Kalender“ im Menü öffnet Fristen und Aufgaben mit Mein Kalender", async () => {
    await openMenu(page, 1, "Mein Kalender");
    await page.locator("[data-mein-kalender]").waitFor({ timeout: 5000 });
    return soll((await page.locator(".breadcrumb").innerText()).includes("Fristen und Aufgaben"), "falsche Seite");
  });
  await step("Cockpit heißt überall „Cockpit“", async () => {
    await openMenu(page, 1, "Cockpit");
    const titel = await page.locator(".page-title h1").first().innerText();
    const fuss = await page.locator(".footer-directory button", { hasText: "Cockpit" }).first().innerText();
    return soll(titel.trim() === "Cockpit" && fuss.trim() === "Cockpit" && !(await page.locator("body").innerText()).includes("Interaktives Cockpit"), { titel, fuss });
  });
  await step("„Im Cockpit anzeigen“ in Arbeit & Arbeitgeber öffnet das Cockpit gefiltert; „Alle anzeigen“ hebt auf", async () => {
    await openMenu(page, 2, "Arbeit & Arbeitgeber");
    await page.locator("main .subpage-actions button", { hasText: "Im Cockpit anzeigen" }).first().click();
    const filter = page.locator('[data-cockpit-bereich="work"]');
    await filter.waitFor({ timeout: 5000 });
    const text = await filter.innerText();
    await page.locator("[data-cockpit-alle]").click();
    await page.waitForTimeout(300);
    return soll(/Arbeit & Arbeitgeber/.test(text) && (await page.locator("[data-cockpit-bereich]").count()) === 0 && (await page.locator(".page-title h1").first().innerText()).trim() === "Cockpit", text);
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | ").slice(0, 300));
  await context.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Neugestaltung 2.28.39: Erste Schritte, Ablegen, Fähnchen, Cockpit, Menü"));
