// Rundgang durch alle Menüs, Seiten und das Fußzeilen-Verzeichnis (Desktop und Handy).
// Sammelt alle sichtbaren Bedienelemente je Seite nach docs/analyse/inventar-laufend.json
// und prüft, dass keine Seite einen Seitenfehler wirft.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, collectErrors, ROOT } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
const inventar = [];
async function sammeln(page, ort, umgebung) {
  const items = await page.evaluate(() => {
    const sichtbar = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    const text = (el) => (el.getAttribute("aria-label") || el.innerText || el.getAttribute("title") || "").replace(/\s+/g, " ").trim();
    const out = [];
    for (const el of document.querySelectorAll("button, select, input[type=file], input[type=checkbox], input[type=radio], a[href]")) {
      if (el.tagName === "INPUT" && el.type === "file") { out.push({ art: "Datei-Eingang", text: el.accept || "", disabled: el.disabled, cls: el.className }); continue; }
      if (!sichtbar(el)) continue;
      out.push({ art: el.tagName === "BUTTON" ? "Knopf" : el.tagName === "SELECT" ? "Auswahlliste" : el.tagName === "A" ? "Link" : "Schalter", text: text(el).slice(0, 80), disabled: el.disabled, cls: (el.className || "").toString().slice(0, 60) });
    }
    return out;
  });
  inventar.push({ ort, umgebung, anzahl: items.length, elemente: items });
  return items.length;
}

try {
  // ---------- Desktop ----------
  const page = await (await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(8000);
  const errors = collectErrors(page);
  await step("Start", async () => { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); });
  const n0 = await sammeln(page, "Startseite", "desktop");
  check(n0 > 20, "Startseite: sichtbare Bedienelemente gesammelt", `${n0}`);

  const clusters = await page.locator(".main-navigation .nav-cluster > button").allInnerTexts();
  check(clusters.length === 8, "Acht Hauptbereiche", clusters.join(" | "));
  let seiten = 0;
  for (let i = 0; i < clusters.length; i++) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(".main-navigation .nav-cluster > button").nth(i).click({ force: true });
    const eintraege = await page.locator(".mega-menu .mega-group button strong").allInnerTexts();
    await page.keyboard.press("Escape").catch(() => {});
    await page.locator("body").click({ position: { x: 5, y: 600 } }).catch(() => {});
    check(eintraege.length > 0, `Mega-Menü „${clusters[i].trim()}“ hat Einträge`, eintraege.join(" · "));
    // „Bereich öffnen“
    await page.locator(".main-navigation .nav-cluster > button").nth(i).click({ force: true });
    await page.locator(".mega-menu .mega-intro button").first().click();
    await page.waitForTimeout(300);
    await sammeln(page, `${clusters[i].trim()} › Bereich öffnen`, "desktop"); seiten++;
    for (const eintrag of eintraege) {
      const vorher = errors.length;
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.locator(".main-navigation .nav-cluster > button").nth(i).click({ force: true });
      await page.locator(".mega-menu .mega-group button", { hasText: eintrag }).first().click();
      await page.waitForTimeout(350);
      const crumb = await page.locator(".breadcrumb").innerText().catch(() => "");
      const n = await sammeln(page, `${clusters[i].trim()} › ${eintrag}`, "desktop"); seiten++;
      check(errors.length === vorher, `Seite „${eintrag}“ ohne Fehler (${n} Elemente)`, errors.slice(vorher).join(" | ") || crumb.replace(/\n/g, " › "));
    }
  }
  // Fußzeile
  const fussEintraege = await page.locator(".footer-directory button").allInnerTexts();
  check(fussEintraege.length >= 15, "Fußzeilen-Verzeichnis vollständig", `${fussEintraege.length}: ${fussEintraege.join(" · ")}`);
  for (const eintrag of fussEintraege) {
    if (/ChatGPT|exportieren/.test(eintrag)) continue; // Dialoge – eigene Proben
    const vorher = errors.length;
    await page.locator(".footer-directory button", { hasText: eintrag }).first().click();
    await page.waitForTimeout(350);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sammeln(page, `Fußzeile › ${eintrag}`, "desktop"); seiten++;
    check(errors.length === vorher, `Fußzeile „${eintrag}“ ohne Fehler`, errors.slice(vorher).join(" | "));
  }
  // Dialoge aus der Fußzeile
  for (const [eintrag, erwartet] of [["Mit ChatGPT arbeiten", "ChatGPT"], ["Familienakte exportieren", "Export"]]) {
    await page.locator(".footer-directory button", { hasText: eintrag }).first().click();
    const modal = page.locator(".modal").last();
    const ok = await modal.isVisible().catch(() => false);
    if (ok) await sammeln(page, `Dialog › ${eintrag}`, "desktop");
    check(ok && (await modal.innerText()).includes(erwartet), `Dialog „${eintrag}“ öffnet sich`);
    await page.locator('.modal button[aria-label="Fenster schließen"]').last().click().catch(() => {});
    await page.waitForTimeout(200);
    check(await page.locator(".modal-backdrop").count() === 0, `Dialog „${eintrag}“ schließt über ✕`);
  }
  check(errors.length === 0, "Desktop-Rundgang ohne Seitenfehler", errors.join(" | "));
  ok(`Desktop: ${seiten} Seiten besucht`);

  // ---------- Handy ----------
  const mobile = await (await browser.newContext(HANDY)).newPage();
  mobile.setDefaultTimeout(8000);
  const mErrors = collectErrors(mobile);
  await step("Handy: Start", async () => { await mobile.goto(app.base, { waitUntil: "networkidle" }); await ready(mobile); });
  await sammeln(mobile, "Startseite", "handy");
  await step("Handy: Hauptmenü-Knopf öffnet die Navigation", async () => {
    await mobile.locator(".mobile-menu-button").click();
    return (await mobile.locator(".main-navigation.mobile-open").count()) === 1;
  });
  let mSeiten = 0;
  for (let i = 0; i < 8; i++) {
    if (!(await mobile.locator(".main-navigation.mobile-open").count())) await mobile.locator(".mobile-menu-button").click();
    await mobile.locator(".main-navigation .nav-cluster > button").nth(i).click({ force: true });
    const eintraege = await mobile.locator(".mega-menu .mega-group button strong").allInnerTexts();
    const erster = eintraege[0];
    await mobile.locator(".mega-menu .mega-group button", { hasText: erster }).first().click({ force: true });
    await mobile.waitForTimeout(350);
    await sammeln(mobile, `${clusters[i].trim()} › ${erster}`, "handy"); mSeiten++;
  }
  for (const eintrag of ["Interaktives Cockpit", "Dokumentenbibliothek", "Eingangszentrale", "Sicherheitscenter", "Fristen und Aufgaben", "Tagebuch & Erinnerungen", "Hilfe", "Systemprüfung"]) {
    await mobile.locator(".footer-directory button", { hasText: eintrag }).first().click({ force: true });
    await mobile.waitForTimeout(300);
    await sammeln(mobile, `Fußzeile › ${eintrag}`, "handy"); mSeiten++;
  }
  check(mErrors.length === 0, "Handy-Rundgang ohne Seitenfehler", mErrors.join(" | "));
  ok(`Handy: ${mSeiten} Seiten besucht`);
  // Überlauf: läuft etwas quer aus dem Fenster?
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 0, "Handy: kein Querlaufen der Seite", `Überlauf ${overflow} px`);

  writeFileSync(path.join(ROOT, "docs/analyse/inventar-laufend.json"), JSON.stringify(inventar, null, 1));
  const gesamt = new Set(inventar.flatMap((s) => s.elemente.map((e) => `${e.art}|${e.text}`)));
  ok(`Inventar aus der laufenden App: ${inventar.length} Orte, ${gesamt.size} verschiedene Bedienelemente`);
} finally { await browser.close(); await app.stop(); }
function ok(t) { check(true, t); }
process.exit(summary("Rundgang"));
