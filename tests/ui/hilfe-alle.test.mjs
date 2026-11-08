// 2.28.37 (Klaus 07.11.2026): jedes Hilfe-Thema als Bild zum Antippen, höchstens drei fette Kernpunkte; Vorschaufenster zeigt
// eine Skizze der Zielseite mit der Stelle rot und springt hin. Ausnahme: die Kartenhilfe (Liste mit Sprüngen).
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, footer, collectErrors } from "./_harness.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };
const app = await startApp();
const browser = await launchBrowser();
try {
  for (const [name, geraet] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const context = await browser.newContext(geraet);
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await footer(page, "Hilfe");
    const r = await page.locator("[data-hilfe-id]").evaluateAll((l) => l.map((e) => ({ id: e.dataset.hilfeId,
      bild: Boolean(e.querySelector("[data-ablaufbild], [data-landkarte], [data-kastenreihe], [data-ordnerbaum]")),
      merk: e.querySelectorAll(".hilfe-merk > li").length, fett: [...e.querySelectorAll(".hilfe-merk > li")].every((li) => li.querySelector("b")) })));
    const ohneBild = r.filter((t) => t.id !== "kartenhilfe" && !t.bild).map((t) => t.id);
    check(r.length >= 59 && ohneBild.length === 0, `${name}: alle ${r.length} Themen mit Bild${ohneBild.length ? ` – ohne: ${ohneBild.join(", ")}` : ""}`);
    const zuviel = r.filter((t) => t.merk > 3).map((t) => t.id);
    check(zuviel.length === 0, `${name}: nirgends mehr als drei Kernpunkte${zuviel.length ? ` – ${zuviel.join(", ")}` : ""}`);
    const unfett = r.filter((t) => t.merk && !t.fett).map((t) => t.id);
    check(unfett.length === 0, `${name}: Kernpunkte haben das Wichtigste fett${unfett.length ? ` – ${unfett.join(", ")}` : ""}`);
    check(r.filter((t) => t.merk).length >= 50, `${name}: mindestens 50 Themen mit Kernpunkten (${r.filter((t) => t.merk).length})`);
    await step(`${name}: „▣“ bei „Bestand prüfen“ zeigt die Skizze, Seitentitel rot`, async () => {
      await page.locator('[data-hilfe-id="bestand-pruefen"] [data-hv-knopf]').click();
      const f = page.locator("[data-hilfe-vorschau]");
      await f.waitFor();
      const ziel = (await f.locator("[data-hv-ziel]").count()) ? "Karte" : ""; // Seitentitel: ganze Seite, Titel rot
      const offen = await page.locator('[data-hilfe-id="bestand-pruefen"] > details').evaluate((d) => d.open);
      const inBild = await f.evaluate((e) => { const b = e.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth + 1 && b.top >= 0 && b.bottom <= innerHeight + 1; });
      return soll(ziel === "" && !offen && inBild, JSON.stringify({ ziel, offen, inBild }));
    });
    await step(`${name}: „Hingehen ›“ öffnet „Bestand prüfen“ und schließt das Fenster`, async () => {
      await page.locator("[data-hilfe-vorschau] [data-hv-hin]").click(); await page.waitForTimeout(1100);
      const r2 = await page.evaluate(() => ({ fenster: document.querySelectorAll("[data-hilfe-vorschau]").length, h1: document.querySelector("main h1")?.textContent || "" }));
      return soll(r2.fenster === 0 && r2.h1 === "Bestand prüfen", JSON.stringify(r2));
    });
    await footer(page, "Hilfe");
    await step(`${name}: Esc schließt das Fenster`, async () => {
      await page.locator('[data-hilfe-id="mein-kalender"] [data-hv-knopf]').click();
      await page.locator("[data-hilfe-vorschau]").waitFor();
      await page.keyboard.press("Escape"); await page.waitForTimeout(200);
      return (await page.locator("[data-hilfe-vorschau]").count()) === 0;
    });
    if (name === "Desktop") await step(`${name}: Maus auf „Wie benutze ich das Interaktive Cockpit?“ öffnet die Vorschau, wegbewegen schließt`, async () => {
      await page.locator('[data-hilfe-id="cockpit"] > details > summary').hover(); await page.waitForTimeout(1000);
      const auf = await page.locator("[data-hilfe-vorschau]").count();
      await page.mouse.move(5, 5); await page.waitForTimeout(700);
      const zu = await page.locator("[data-hilfe-vorschau]").count();
      return soll(auf === 1 && zu === 0, `${auf}/${zu}`);
    });
    await footer(page, "Hilfe");
    await step(`${name}: Vorschau „Unbehandelte“ → „Zwei getrennte Arbeitslisten“ rot gerahmt`, async () => {
      await page.locator('[data-hilfe-id="mehrere-erinnerungen"] [data-hv-knopf]').click();
      await page.locator("[data-hilfe-vorschau] [data-hv-hin]").click(); await page.waitForTimeout(1100);
      const t = await page.evaluate(() => document.querySelector(".hilfe-ziel-rahmen")?.textContent?.slice(0, 80) || "");
      return soll(/Zwei getrennte Arbeitslisten/.test(t), t);
    });
    await footer(page, "Hilfe");
    await step(`${name}: Kasten im Ablaufbild springt zur Karte und rahmt sie rot („Cockpit“ → Was ist jetzt wichtig?)`, async () => {
      const d = page.locator('[data-hilfe-id="cockpit"] > details');
      await d.locator(":scope > summary").click();
      await d.locator(".ablauf-link").first().click(); await page.waitForTimeout(1100);
      const t = await page.evaluate(() => document.querySelector(".hilfe-ziel-rahmen")?.textContent?.slice(0, 80) || "");
      return soll(/Was ist jetzt wichtig/.test(t), t);
    });
    if (name === "Desktop") {
      // Die Skizzen zeigen nur Kartentitel aus lib/hilfe-seiten.ts; jeder muss auf seiner Seite noch vorkommen (sonst veraltet).
      const { SEITEN_KARTEN } = await import("../../lib/hilfe-seiten.ts");
      const FUSS = { inventory: "Bestand prüfen", cockpit: "Cockpit", memory: "Tagebuch & Erinnerungen", reminders: "Fristen und Aufgaben", inbox: "Eingangszentrale",
        documents: "Dokumentenbibliothek", security: "Sicherheitscenter", changelog: "Was gibt’s Neues?", systemcheck: "Systemprüfung" };
      for (const [seite, karten] of Object.entries(SEITEN_KARTEN)) await step(`${name}: Skizze „${seite}“ passt zur App`, async () => {
        if (seite === "overview") { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); } else await footer(page, FUSS[seite]);
        const da = await page.evaluate(() => [...document.querySelectorAll("main.site-main [aria-label$=' erklären']")].map((e) => e.getAttribute("aria-label").replace(/ erklären$/, "")));
        const fehlt = karten.filter((k) => !da.includes(k));
        return soll(fehlt.length === 0, `fehlt: ${fehlt.join(", ")}`);
      });
    }
    check(errors.length === 0, `${name}: keine Fehler in der Konsole`, errors.join(" | "));
    await context.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Hilfe überall als Bild"));
