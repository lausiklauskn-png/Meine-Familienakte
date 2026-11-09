// 2.28.39 Pfad (Brotkrumen) für die 18 Wege aus dem Orientierungsbericht vom 08.11.2026:
// Bereich = der, über den man kam (bei Seiten, die zweimal im Menü stehen) · letztes Glied = was man sieht (auch Akte, Treffer,
// „Mein Kalender“, Suche) · Menü, Pfad und Seitentitel tragen denselben Namen · Pfad bleibt beim Scrollen sichtbar ·
// Rücksprung aus der App-Landkarte landet an der Stelle mit Marke.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, step, summary, footer, ruhig, collectErrors } from "./_harness.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();
const BEREICH = { Assistenz: 0, Termine: 1, Gesundheit: 2, Familie: 3, Wohnen: 4, Fahrzeuge: 5, Käufe: 6, Dokumente: 7, Hilfe: 8 };

try {
  for (const [geraet, profil] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const handy = geraet === "Handy";
    let gestimmt = 0;
    const neu = async () => {
      const context = await browser.newContext(profil); const page = await context.newPage(); const errors = collectErrors(page);
      await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
      return { context, page, errors };
    };
    const lage = (page) => page.evaluate(() => {
      const pfad = document.querySelector(".breadcrumb .pfad"); const r = document.querySelector(".breadcrumb")?.getBoundingClientRect();
      return { pfad: (pfad?.innerText || "").replace(/\s+/g, " ").trim(), h1: (document.querySelector("main h1")?.innerText || "").replace(/\s+/g, " ").trim(), y: Math.round(scrollY), hash: location.hash, pfadImBild: Boolean(r && r.top >= 0 && r.bottom <= innerHeight), marken: document.querySelectorAll(".zurueck-hier").length };
    });
    // Erwarteter Pfad; am Handy ohne „Startseite ›“ (gekürzt, eine Zeile).
    const erwartet = (text) => handy && text !== "Startseite" ? text.replace(/^Startseite › /, "") : text;
    // Die Trenner › sind Symbole (kein Text); verglichen werden die Glieder.
    const gleich = (ist, text) => ist === erwartet(text).replace(/ › /g, " ");
    const menue = async (page, bereich, eintrag) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      if (handy) { await page.locator(".mobile-menu-button").click(); await page.waitForTimeout(200); }
      await page.locator(".main-navigation .nav-cluster > button").nth(BEREICH[bereich]).click({ force: true });
      // Eintrag nach seinem Namen (nicht nach dem Erklärtext darunter: „Familienübersicht“ erwähnt auch „Personen“).
      const name = new RegExp(`^\\s*${eintrag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
      await page.locator(".mega-menu button").filter({ has: page.locator("strong", { hasText: name }) }).first().click();
      await page.waitForTimeout(600);
    };
    const weg = async (name, fn) => {
      const { context, page, errors } = await neu();
      const r = await step(`${geraet}: ${name}`, async () => fn(page));
      if (r) gestimmt++;
      if (errors.length) console.log(`   Seitenfehler: ${errors.slice(0, 2).join(" | ")}`);
      await context.close();
    };
    const pruefe = (l, text, extra = true) => soll(gleich(l.pfad, text) && extra, { pfad: l.pfad, soll: erwartet(text), h1: l.h1 });

    await weg("W1 Start → Arbeitsübersicht → Akte: Akte als letztes Glied", async (p) => {
      await p.locator("main button", { hasText: "Arbeitsübersicht öffnen" }).first().click(); await p.waitForTimeout(700);
      const a = await lage(p); soll(gleich(a.pfad, "Startseite › Termine & Aufgaben › Cockpit"), a);
      const akte = p.locator("#cockpit-cases .cockpit-case-list button").first(); const titel = (await akte.locator("strong").innerText()).trim();
      await akte.click(); await p.locator("[data-stamm-akte]").click(); await p.waitForTimeout(900); // A5: über das Bearbeiten-Fenster
      const b = await lage(p);
      return pruefe(b, `Startseite › Termine & Aufgaben › Cockpit › ${titel}`, b.pfadImBild);
    });
    await weg("W2 Start → Neue Unterlage ablegen (Dialog über der Startseite)", async (p) => {
      await p.locator("main button", { hasText: "Neue Unterlage ablegen" }).first().click(); await p.waitForTimeout(800);
      return pruefe(await lage(p), "Startseite");
    });
    await weg("W3 Start → Lebensbereich „Dokumenteneingang“ → Eingangszentrale", async (p) => {
      const k = p.locator("main button", { hasText: "Dokumenteneingang" }).last(); await k.scrollIntoViewIfNeeded(); await k.click(); await p.waitForTimeout(800);
      return pruefe(await lage(p), "Startseite › Dokumente › Eingangszentrale");
    });
    await weg("W4 Menü Termine & Aufgaben → Fristen und Aufgaben; Tipp aufs Glied führt zum Cockpit (Bereichsanfang)", async (p) => {
      await menue(p, "Termine", "Fristen und Aufgaben");
      const a = await lage(p); pruefe(a, "Startseite › Termine & Aufgaben › Fristen und Aufgaben", a.h1 === "Fristen und Aufgaben");
      await p.locator(".breadcrumb [data-pfad-bereich]").click(); await p.waitForTimeout(600);
      const b = await lage(p);
      return pruefe(b, "Startseite › Termine & Aufgaben › Cockpit", b.h1 === "Cockpit");
    });
    await weg("W4b Menü Familie → Personen: Personenliste im Bild, Eintrag im Pfad", async (p) => {
      await menue(p, "Familie", "Personen");
      const a = await lage(p);
      const imBild = await p.locator("#familie-stamm").evaluate((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; });
      return pruefe(a, "Startseite › Familie & Personen › Personen", imBild && a.h1 === "Familie & Personen");
    });
    await weg("W5 Menü Dokumente → Gesamtes Verzeichnis", async (p) => {
      await menue(p, "Dokumente", "Gesamtes Verzeichnis");
      const a = await lage(p); return pruefe(a, "Startseite › Dokumente › Gesamtes Verzeichnis", a.h1 === "Gesamtes Verzeichnis");
    });
    await weg("W6 Menü Hilfe → Sicherheit & lokaler Tresor: Bereich Hilfe, Titel wie Menü", async (p) => {
      await menue(p, "Hilfe", "Sicherheit & lokaler Tresor");
      const a = await lage(p); return pruefe(a, "Startseite › Hilfe › Sicherheit & lokaler Tresor", a.h1 === "Sicherheit & lokaler Tresor");
    });
    await weg("W7 Menü Gesundheit → Anfragen & Antworten", async (p) => {
      await menue(p, "Gesundheit", "Anfragen & Antworten");
      const a = await lage(p); return pruefe(a, "Startseite › Gesundheit & Arbeit › Anfragen & Antworten", a.h1 === "Anfragen & Antworten");
    });
    await weg("W8 Menü Familie → Vollmachten & Vorsorge: der gewählte Eintrag steht im Pfad", async (p) => {
      await menue(p, "Familie", "Vollmachten");
      return pruefe(await lage(p), "Startseite › Familie & Personen › Dokumentenbibliothek › Vollmachten & Vorsorge");
    });
    await weg("W9 Suche „Teilzeit“ → Treffer → Zurück: Suche und Treffer im Pfad, Suchwort bleibt", async (p) => {
      await p.fill(".global-search input", "Teilzeit"); await p.waitForTimeout(800);
      const a = await lage(p); pruefe(a, "Startseite › Suche „Teilzeit“");
      // „Antrag auf Teilzeit“ ist ein Vorgang (mit Termin): er öffnet als Akte im Cockpit, das Ziel steht als letztes Glied.
      await p.locator("main button").filter({ hasText: /Antrag auf Teilzeit/ }).first().click(); await p.waitForTimeout(1000);
      const b = await lage(p); pruefe(b, "Startseite › Termine & Aufgaben › Cockpit › Antrag auf Teilzeit", b.pfadImBild);
      await p.locator(".breadcrumb .navigation-history button").first().click(); await p.waitForTimeout(1000);
      return soll((await p.inputValue(".global-search input")) === "Teilzeit", "Suchwort weg");
    });
    await weg("W10 Fußzeile Fristen und Aufgaben", async (p) => {
      await footer(p, "Fristen und Aufgaben");
      const a = await lage(p); return pruefe(a, "Startseite › Termine & Aufgaben › Fristen und Aufgaben", a.h1 === "Fristen und Aufgaben");
    });
    await weg("W11 Hilfe → Thema Eingangszentrale → Ziel → Zurück mit Marke", async (p) => {
      await footer(p, "Hilfe");
      const d = p.locator('details[data-hilfe-thema="eingangszentrale"]'); await d.locator(":scope > summary").click(); await p.waitForTimeout(300);
      await d.locator(".hilfe-bild-ziel, .ablauf-link").first().click(); await p.waitForTimeout(900);
      pruefe(await lage(p), "Startseite › Dokumente › Eingangszentrale");
      await p.locator(".breadcrumb .navigation-history button").first().click(); await p.waitForTimeout(1300);
      const b = await lage(p); return soll(b.hash === "#help" && b.marken >= 1, b);
    });
    await weg("W12 Hilfe → App-Landkarte → Kasten → Hingehen › → Zurück: Karte offen, Stelle markiert", async (p) => {
      await footer(p, "Hilfe");
      await p.locator("[data-app-landkarte-knopf]").click(); await p.waitForTimeout(300);
      const k = p.locator('[data-landkarte="app"] .lk-kasten', { hasText: /^\s*Eingangszentrale/ }).first(); await k.scrollIntoViewIfNeeded(); await k.click(); await p.waitForTimeout(300);
      const h = p.locator('[data-landkarte="app"] [data-karte-info] button', { hasText: "Hingehen" }).first(); await h.scrollIntoViewIfNeeded(); await ruhig(p);
      const y0 = await p.evaluate(() => Math.round(scrollY));
      await h.click(); await p.waitForTimeout(900);
      pruefe(await lage(p), "Startseite › Dokumente › Eingangszentrale");
      await p.locator(".breadcrumb .navigation-history button").first().click(); await p.waitForTimeout(1500);
      const b = await lage(p);
      const offen = await p.locator("[data-app-landkarte]").getAttribute("data-app-landkarte");
      const hinImBild = await p.locator('[data-landkarte="app"] [data-karte-info] button.zurueck-hier').evaluate((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }).catch(() => false);
      return soll(b.hash === "#help" && offen === "offen" && b.marken >= 1 && hinImBild && Math.abs(b.y - y0) < 400, { ...b, offen, y0, hinImBild });
    });
    await weg("W13 Start → Gesundheit → Diagnosen: Kachel, Pfad und Titel gleich", async (p) => {
      const k = p.locator("main button", { hasText: "Gesundheit & Leistung" }).first(); await k.scrollIntoViewIfNeeded(); await k.click(); await p.waitForTimeout(800);
      const kachel = p.locator("main .subpage-actions button", { hasText: "Diagnosen, AU & ICD-Codes" }).first();
      await kachel.click(); await p.waitForTimeout(800);
      const a = await lage(p); return pruefe(a, "Startseite › Gesundheit & Arbeit › Diagnosen, AU & ICD-Codes", a.h1 === "Diagnosen, AU & ICD-Codes");
    });
    await weg("W14 Fußzeile Dokumentenbibliothek", async (p) => {
      await footer(p, "Dokumentenbibliothek");
      return pruefe(await lage(p), "Startseite › Dokumente › Dokumentenbibliothek");
    });
    await weg("W15 Dokumente → Sicherheit gescrollt: Pfad bleibt sichtbar; Glied „Dokumente“ → Zurück an dieselbe Stelle", async (p) => {
      await menue(p, "Dokumente", "Sicherheit & lokaler Tresor");
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.5)); await p.waitForTimeout(300);
      const a = await lage(p); soll(a.pfadImBild && a.y > 500, { ...a, grund: "Pfad nicht im Bild" });
      await p.locator(".breadcrumb [data-pfad-bereich]").click(); await p.waitForTimeout(700);
      await p.locator(".breadcrumb .navigation-history button").first().click(); await p.waitForTimeout(1300);
      const b = await lage(p); return soll(b.hash === "#security" && Math.abs(b.y - a.y) < 300, { vorher: a.y, nachher: b.y });
    });
    await weg("W16 Fußzeile Gesamtes Verzeichnis → Eingangszentrale", async (p) => {
      await footer(p, "Gesamtes Verzeichnis");
      pruefe(await lage(p), "Startseite › Dokumente › Gesamtes Verzeichnis");
      const b = p.locator("main button", { hasText: "Eingangszentrale" }).first(); await b.scrollIntoViewIfNeeded(); await b.click(); await p.waitForTimeout(800);
      return pruefe(await lage(p), "Startseite › Dokumente › Eingangszentrale");
    });
    await weg("W17 Kopf „Mein Kalender“: „Mein Kalender“ ist das letzte Glied, Pfad im Bild", async (p) => {
      if (handy && !(await p.locator("[data-mein-kalender-knopf]").isVisible())) await p.locator("[data-kopf-auf]").click();
      await p.locator("[data-mein-kalender-knopf]").click(); await p.waitForTimeout(900);
      const a = await lage(p); return pruefe(a, "Startseite › Termine & Aufgaben › Fristen und Aufgaben › Mein Kalender", a.pfadImBild);
    });
    await weg("W18 Eingangszentrale gescrollt → Seitenleiste Startseite → Zurück an dieselbe Stelle", async (p) => {
      await footer(p, "Eingangszentrale"); await p.evaluate(() => window.scrollTo(0, 900)); await p.waitForTimeout(300);
      await p.locator(".seitenleiste-griff").click(); await p.waitForTimeout(200);
      await p.locator('[data-leiste="start"]').click(); await p.waitForTimeout(800);
      await p.locator(".seitenleiste-griff").click(); await p.locator('[data-leiste="zurueck"]').click(); await p.waitForTimeout(1300);
      const b = await lage(p); return pruefe(b, "Startseite › Dokumente › Eingangszentrale", Math.abs(b.y - 900) < 120);
    });
    await step(`${geraet}: Pfad stimmt für mindestens 10 der Wege`, async () => soll(gestimmt >= 10, `${gestimmt} Wege`) && `${gestimmt} von 19 Wegen`);
  }
} finally {
  await browser.close(); await app.stop();
}
process.exit(summary("Pfad und Rückwege"));
