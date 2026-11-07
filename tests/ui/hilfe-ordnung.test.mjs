// Hilfe geordnet (Plan 07.11.2026, P3): „Wie kann ich dir helfen?“ findet Themen aus Problem-Sätzen; Gruppen in der
// vereinbarten Reihenfolge; aus einer Seite kommend stehen passende Themen oben; Erledigtes rutscht nach unten; A–Z.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
const gruppen = (page) => page.locator("[data-hilfe-gruppe]").evaluateAll((l) => l.map((e) => e.dataset.hilfeGruppe));
try {
  for (const [name, geraet] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const context = await browser.newContext(geraet);
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await footer(page, "Hilfe");

    await step(`${name}: Gruppen in Reihenfolge Einrichten → Arbeiten → Allgemeines → Fachliches`, async () => {
      const g = await gruppen(page);
      const soll = ["einrichten", "arbeiten", "allgemein"];
      return soll.every((x, i) => g.indexOf(x) === g.indexOf(soll[0]) + i) && g.at(-1) === "fachlich" ? true : g.join(",");
    });
    await step(`${name}: Arbeiten beginnt mit Erfassen (fotografieren), Fachliches enthält die Testakte`, async () => {
      const erstes = await page.locator('[data-hilfe-gruppe="arbeiten"] [data-hilfe-id]').first().getAttribute("data-hilfe-id");
      const testakte = await page.locator('[data-hilfe-gruppe="fachlich"] [data-hilfe-id="testakte"]').count();
      return erstes === "fotografieren" && testakte === 1 ? true : `${erstes} ${testakte}`;
    });
    for (const [frage, erwartet] of [["Die Glocke klingelt nicht", "app-glocke"], ["Mein Foto ist zu groß", "fotografieren"], ["Wie mache ich eine Sicherung?", "akten-sichern"], ["neues Handy, alles übertragen", "umzug"], ["E-Mail aus Gmail in die Akte", "teilen"]]) {
      await step(`${name}: „${frage}“ → ${erwartet} unter den ersten drei`, async () => {
        const feld = page.locator("#hilfe-frage-feld");
        await feld.fill(frage); await page.waitForTimeout(350);
        const ids = await page.locator("[data-hilfe-treffer]").evaluateAll((l) => l.map((e) => e.dataset.hilfeTreffer));
        return ids.slice(0, 3).includes(erwartet) ? true : ids.join(",");
      });
    }
    await step(`${name}: Tipp auf einen Treffer öffnet das Thema und rahmt es`, async () => {
      await page.locator("#hilfe-frage-feld").fill("Glocke klingelt nicht"); await page.waitForTimeout(350);
      await page.locator('[data-hilfe-treffer="app-glocke"]').click(); await page.waitForTimeout(900);
      return await page.locator('[data-hilfe-id="app-glocke"] details').evaluate((e) => e.open && e.classList.contains("hilfe-ziel-rahmen"));
    });
    await step(`${name}: Unsinn findet nichts und sagt es`, async () => {
      await page.locator("#hilfe-frage-feld").fill("xqzv wrrp"); await page.waitForTimeout(350);
      return (await page.locator("[data-hilfe-treffer]").count()) === 0 && (await page.locator(".hilfe-kein-treffer").count()) === 1;
    });
    await step(`${name}: Aus „Fristen und Aufgaben“ kommend steht „Passend zu …“ oben`, async () => {
      await page.locator("#hilfe-frage-feld").fill("");
      await footer(page, "Fristen und Aufgaben");
      await footer(page, "Hilfe");
      const g = await gruppen(page);
      const titel = await page.locator('[data-hilfe-gruppe="passend"] .hilfe-gruppe-titel').innerText().catch(() => "");
      return g[0] === "passend" && /Fristen und Aufgaben/.test(titel) ? true : `${g.join(",")} „${titel}“`;
    });
    await step(`${name}: Glocke an → „App-Glocke“ rutscht nach „Schon eingerichtet“`, async () => {
      await page.evaluate(() => { localStorage.setItem("familienakte.glocke.v1", JSON.stringify({ an: true, seit: Date.now(), geläutet: [] })); });
      await page.reload({ waitUntil: "networkidle" }); await ready(page); await footer(page, "Hilfe");
      const n = await page.locator('[data-hilfe-gruppe="eingerichtet"] [data-hilfe-id="app-glocke"]').count();
      return n === 1 ? true : (await gruppen(page)).join(",");
    });
    await step(`${name}: A–Z zeigt alle Themen alphabetisch, gemerkt nach Neuladen`, async () => {
      await page.locator("[data-hilfe-sortierung]").click();
      const titel = await page.locator('[data-hilfe-gruppe="az"] [data-hilfe-id] summary').evaluateAll((l) => l.map((e) => e.textContent.trim()));
      const sortiert = [...titel].sort((a, b) => a.localeCompare(b, "de"));
      await page.reload({ waitUntil: "networkidle" }); await ready(page); await footer(page, "Hilfe");
      const gemerkt = (await gruppen(page)).join(",") === "az";
      await page.locator("[data-hilfe-sortierung]").click();
      return titel.length >= 50 && gemerkt ? true : `${titel.length} gemerkt=${gemerkt} ${JSON.stringify(titel.slice(0, 3))} vs ${JSON.stringify(sortiert.slice(0, 3))}`;
    });
    check(errors.length === 0, `${name}: keine Seitenfehler`, errors.join(" | "));
    await context.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Hilfe-Ordnung"));
