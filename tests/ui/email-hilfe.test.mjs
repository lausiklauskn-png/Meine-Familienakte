// Hilfe „E-Mail in die Familienakte“ (Klaus 07.11.2026): Flussbaum mit Pfeilen auf den Ästen (→ eine Richtung, ⇄ hin und
// zurück), ein Tipp hebt den Weg hervor und zeigt darunter, was dort geschieht. Geplantes steht gestrichelt mit „geplant“.
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
    const lage = await thema.evaluate((d) => ({
      offen: d.open,
      kaesten: d.querySelectorAll("[data-fluss-id]").length,
      beide: [...d.querySelectorAll('[data-fluss-ast="microsoft"] > .fb-linie')].map((l) => l.dataset.richtung)[0],
      hin: [...d.querySelectorAll('[data-fluss-ast="teilen-anhang"] > .fb-linie')].map((l) => l.dataset.richtung)[0],
      geplant: d.querySelectorAll(".fb-kasten.fb-geplant").length,
      chipGeplant: d.querySelector('[data-fluss-id="pruefen"] .fb-chip')?.textContent,
      heuteOhneChip: !d.querySelector('[data-fluss-id="teilen-anhang"] .fb-chip'),
      breiteSeite: document.documentElement.scrollWidth <= innerWidth + 1,
    }));
    check(lage.offen && lage.kaesten >= 18, `${name}: Baum aufgeklappt mit allen Kästen (${lage.kaesten})`);
    check(lage.beide === "beide" && lage.hin === "hin", `${name}: Pfeile auf den Ästen – Microsoft ⇄, Anhang teilen → (${lage.beide}/${lage.hin})`);
    check(lage.geplant >= 6 && lage.chipGeplant === "geplant" && lage.heuteOhneChip, `${name}: Geplantes gestrichelt mit „geplant“, Heutiges ohne Marke`);
    check(lage.breiteSeite, `${name}: die Seite läuft nicht quer (der Baum rollt in seinem Kasten)`);
    await step(`${name}: Tipp auf „Übernehmen mit einem Tipp“ hebt den ganzen Weg hervor und erklärt ihn`, async () => {
      await thema.locator('[data-fluss-id="ein-tipp"]').click();
      const r = await thema.evaluate((d) => ({
        an: [...d.querySelectorAll(".fb-kasten.fb-an")].map((k) => k.dataset.flussId).sort().join(","),
        info: d.querySelector("[data-fluss-info]")?.dataset.flussInfo,
        text: d.querySelector(".fb-info")?.textContent || "",
      }));
      return r.an === "echt,ein-tipp,herausloesen,pruefen" && r.info === "ein-tipp" && /nur in diese Richtung/.test(r.text) ? true : JSON.stringify(r);
    });
    await step(`${name}: Microsoft sagt „hin und zurück“, zweiter Tipp nimmt die Hervorhebung weg`, async () => {
      await thema.locator('[data-fluss-id="microsoft"]').click();
      const text = await thema.locator(".fb-info").textContent();
      await thema.locator('[data-fluss-id="microsoft"]').click();
      const an = await thema.locator(".fb-kasten.fb-an").count();
      return /hin und zurück/.test(text) && an === 0 ? true : `${text} / ${an}`;
    });
    await step(`${name}: Mitte führt zur Eingangszentrale`, async () => {
      await thema.locator('[data-fluss-id="eingang"]').click();
      await thema.locator(".fb-info button", { hasText: "Zur Eingangszentrale" }).click();
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
