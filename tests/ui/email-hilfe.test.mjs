// Hilfe „E-Mail in die Familienakte“ als Landkarte (Klaus 07.11.2026, Vorbild Sage-Modul-Topologie): Äste verbinden die Kästen
// direkt, Pfeil → eine Richtung, ⇄ hin und zurück; ein Tipp hebt die Äste eines Kastens hervor und nennt woher und wohin.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, footer, collectErrors } from "./_harness.mjs";
const app = await startApp();
const browser = await launchBrowser();
try {
  for (const [name, geraet] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const context = await browser.newContext(geraet);
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await footer(page, "Hilfe");
    const thema = page.locator("details[data-email-hilfe]");
    check(await thema.count() === 1, `${name}: Thema „E-Mail in die Familienakte“ ist da`);
    await thema.locator("summary").click();
    await page.waitForTimeout(400);
    const lage = await thema.evaluate((d) => ({
      offen: d.open,
      kaesten: d.querySelectorAll("[data-karte-id]").length,
      aeste: d.querySelectorAll("path[data-ast]").length,
      beide: d.querySelector('path[data-ast="mail-ms>eingang"]')?.dataset.richtung,
      hin: d.querySelector('path[data-ast="mail-anhang>eingang"]')?.dataset.richtung,
      beideAnfang: Boolean(d.querySelector('path[data-ast="mail-ms>eingang"]')?.getAttribute("marker-start")),
      geplant: d.querySelectorAll(".s-geplant[data-karte-id]").length,
      breiteSeite: document.documentElement.scrollWidth <= innerWidth + 1,
      // Ast endet am Kasten: letzter Punkt des Pfads liegt am linken Rand der Eingangszentrale
      trifft: (() => { const p = d.querySelector('path[data-ast="mail-anhang>eingang"]'); const e = d.querySelector('[data-karte-knoten="eingang"]'); if (!p || !e) return false;
        const z = p.getAttribute("d").trim().split(/[ CM]+/).filter(Boolean).map(Number); const x = z[z.length - 2], y = z[z.length - 1];
        return Math.abs(x - e.offsetLeft) < 4 && y >= e.offsetTop && y <= e.offsetTop + e.offsetHeight; })(),
    }));
    check(lage.offen && lage.kaesten >= 17 && lage.aeste >= 15, `${name}: Landkarte aufgeklappt (${lage.kaesten} Kästen, ${lage.aeste} Äste)`);
    check(lage.beide === "beide" && lage.beideAnfang && lage.hin === "hin", `${name}: Pfeile auf den Ästen – Microsoft ⇄, Anhang teilen → (${lage.beide}/${lage.hin})`);
    check(lage.trifft, `${name}: der Ast endet direkt am Kasten der Eingangszentrale`);
    check(lage.geplant >= 6, `${name}: Geplantes ist als geplant gekennzeichnet (${lage.geplant})`);
    check(lage.breiteSeite, `${name}: die Seite läuft nicht quer (die Karte rollt in ihrem Rahmen)`);
    await step(`${name}: Tipp auf „Echtes PDF, ohne Befund“ hebt seine Äste hervor und nennt woher und wohin`, async () => {
      await thema.locator('[data-karte-id="echt"]').click();
      const r = await thema.evaluate((d) => ({
        an: [...d.querySelectorAll("path.lk-ast.an")].map((p) => p.dataset.ast).sort().join(","),
        info: d.querySelector("[data-karte-info]")?.dataset.karteInfo,
        text: d.querySelector(".lk-info")?.textContent || "",
      }));
      return r.an === "echt>akte,pruefung>echt" && r.info === "echt" && /kommt von: Prüfung jeder Anlage/.test(r.text) && /geht zu: In der Akte/.test(r.text) ? true : JSON.stringify(r);
    });
    await step(`${name}: Microsoft zeigt ⇄, zweiter Tipp nimmt die Hervorhebung weg`, async () => {
      await thema.locator('[data-karte-id="mail-ms"]').click();
      const text = await thema.locator(".lk-info").textContent();
      await thema.locator('[data-karte-id="mail-ms"]').click();
      const an = await thema.locator("path.lk-ast.an").count();
      return /⇄ Eingangszentrale/.test(text) && an === 0 ? true : `${text} / ${an}`;
    });
    await step(`${name}: Eingangszentrale führt zur Eingangszentrale`, async () => {
      await thema.locator('[data-karte-id="eingang"]').click();
      await thema.locator(".lk-info button", { hasText: "Zur Eingangszentrale" }).click();
      await page.waitForTimeout(600);
      return await page.locator("body").evaluate(() => /Eingangszentrale/.test(document.querySelector("main")?.innerText || ""));
    });
    await step(`${name}: „Wie kann ich dir helfen?“ findet das Thema über „Anhang aus der Mail“`, async () => {
      await footer(page, "Hilfe");
      await page.locator("#hilfe-frage-feld").fill("Anhang aus der Mail in die Akte"); await page.waitForTimeout(350);
      const ids = await page.locator("[data-hilfe-treffer]").evaluateAll((l) => l.map((e) => e.dataset.hilfeTreffer));
      return ids.slice(0, 3).includes("email") ? true : ids.join(",");
    });
    check(errors.length === 0, `${name}: keine Fehler in der Konsole`, errors.join(" | "));
    await context.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("E-Mail-Hilfe"));
