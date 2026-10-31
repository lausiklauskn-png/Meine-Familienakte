// Stück 1 (Klaus 2026-10-31): „Überall suchen in der eigenen Akte“ ist die vorhandene breite Suchleiste.
// Die Probe sichert ab, dass sie aus allen drei Quellen findet — Dokumente, Memory, Vorgänge — und dass jeder
// Treffer an seine Stelle führt. Geschützte Gesundheitsangaben erscheinen nur datensparsam (Titel verdeckt).
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, collectErrors } from "./_harness.mjs";

async function suchen(page, frage) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const feld = page.locator(".global-search input");
  await feld.fill("");
  await feld.fill(frage);
  await page.waitForSelector(".search-results", { timeout: 10000 });
  await page.waitForTimeout(300);
  return page.locator(".search-results article").evaluateAll((els) => els.map((el) => ({
    art: el.querySelector(".badge")?.textContent?.trim() || "",
    titel: el.querySelector("strong")?.textContent?.trim() || "",
    detail: el.querySelector("small")?.textContent?.trim() || "",
  })));
}

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage();
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);

  const memory = await suchen(page, "Stützräder");
  if (process.env.SUCHE_ZEIGEN) console.log(JSON.stringify(memory));
  check(memory.some((t) => t.art === "Erinnerung" && /Stützräder/.test(t.titel)), "Memory: Tagebucheintrag „ohne Stützräder“ wird gefunden", memory.map((t) => `${t.art}: ${t.titel}`).slice(0, 4).join(" | "));

  const vorgang = await suchen(page, "Nebenkosten");
  if (process.env.SUCHE_ZEIGEN) console.log(JSON.stringify(vorgang));
  check(vorgang.some((t) => t.art === "Vorgang"), "Vorgang: „Nebenkosten“ findet den Vorgang", vorgang.map((t) => `${t.art}: ${t.titel}`).slice(0, 6).join(" | "));
  check(vorgang.some((t) => /dokument/i.test(t.art)), "Dokument: „Nebenkosten“ findet die Nebenkostenabrechnung", vorgang.filter((t) => /dokument/i.test(t.art)).map((t) => t.titel).join(" | "));
  check(vorgang.some((t) => /frist|aufgabe/i.test(t.art)), "Fristen/Aufgaben zum Vorgang werden mitgefunden");

  await step("Tipp auf den Vorgang-Treffer führt aus der Suche heraus an seine Stelle", async () => {
    await page.locator(".search-results article", { has: page.locator(".badge", { hasText: "Vorgang" }) }).first().locator("button").first().click();
    await page.waitForTimeout(500);
    return (await page.locator(".global-search input").inputValue()) === "" || (await page.locator(".search-results").count()) === 0 ? "Suche verlassen" : false;
  });

  const geschuetzt = await suchen(page, "Brille Mattis");
  const diag = geschuetzt.filter((t) => t.art === "Diagnose");
  check(diag.length > 0 && diag.every((t) => t.titel === "Geschützte Diagnose" && !/Brille|Mattis/.test(`${t.titel} ${t.detail}`)), "Gesundheit datensparsam: Treffer heißt „Geschützte Diagnose“, ohne Inhalt", diag.map((t) => `${t.titel} · ${t.detail}`).join(" | "));

  const nichts = await suchen(page, "Quarkzwiebelsuppenrezept");
  check(nichts.length === 0 && await page.locator(".search-results .empty-state").count() === 1, "Unbekanntes Wort: keine erfundenen Treffer, klare Leer-Anzeige");

  const handy = await (await browser.newContext(HANDY)).newPage();
  await handy.goto(app.base, { waitUntil: "networkidle" }); await ready(handy);
  const mobil = await suchen(handy, "Waschmaschine");
  check(mobil.some((t) => t.art === "Vorgang") && mobil.some((t) => /dokument/i.test(t.art)), "Handy 390 px: „Waschmaschine“ findet Vorgang und Dokument", `${mobil.length} Treffer`);
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Überall suchen (eigene Akte)"));
