// 2.28.39 Punkt 9 (Neugestaltung, vom Nutzer mit Ja): Kopfsuche als kompakte Trefferzeilen „Datum · Titel · Bereich/Art“,
// nach Art getrennt (Überschrift „Art (Anzahl)“), innerhalb der Art neueste zuerst, zuerst wenige Zeilen und
// „Weitere Ergebnisse (n)“ wie bei Suchmaschinen. Alle Dokumente erfunden.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, collectErrors } from "./_harness.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };
const iso = (d) => d.split(".").reverse().join("-");

async function suchen(page, frage) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const feld = page.locator(".global-search input");
  await feld.fill(""); await feld.fill(frage);
  await page.waitForSelector(".search-results", { timeout: 10000 });
  await page.waitForTimeout(300);
}
const gruppen = (page) => page.locator("[data-such-gruppe]").evaluateAll((els) => els.map((g) => ({
  name: g.getAttribute("data-such-gruppe"), kopf: g.querySelector("h3")?.textContent?.trim() || "",
  zeilen: [...g.querySelectorAll("article.such-zeile")].map((a) => ({ art: a.getAttribute("data-such-art"), datum: a.querySelector(".such-datum")?.textContent?.trim() || "", titel: a.querySelector("strong")?.textContent?.trim() || "", bereich: a.querySelector("small")?.textContent?.trim() || "", hoehe: Math.round(a.getBoundingClientRect().height) })),
  mehr: g.querySelector("[data-such-mehr]")?.textContent?.trim() || "",
})));

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(15000);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  await page.evaluate(async () => {
    const f = window.__vaultFixture; const h = await f.browserVault();
    for (let i = 0; i < 12; i++) {
      const datum = `202${i % 6}-${String(1 + i).padStart(2, "0")}-0${1 + (i % 8)}`;
      await f.saveLocalDocument(h, new File([`Erfundene Stromrechnung ${i}`], `Stromrechnung_Glimmwerk_${i}.pdf`, { type: "application/pdf" }), { category: "Haus & Wohnung", documentDate: datum, notes: "Erfundene Probe", allowDuplicate: true });
    }
  });
  await page.reload({ waitUntil: "networkidle" }); await ready(page);

  await suchen(page, "Stromrechnung Glimmwerk");
  await step("Treffer als kompakte Zeile: Datum TT.MM.JJJJ · Titel · Bereich, je Zeile höchstens 60 px", async () => {
    const g = (await gruppen(page)).find((x) => x.name === "Dokumente");
    const z = g?.zeilen || [];
    return soll(z.length > 0 && z.every((x) => /^\d{2}\.\d{2}\.\d{4}$/.test(x.datum) && /Stromrechnung/.test(x.titel) && x.bereich === "Haus & Wohnung" && x.hoehe <= 60), z.slice(0, 3));
  });
  await step("Nach Art getrennt: Überschrift „Dokumente (12)“, neueste zuerst", async () => {
    const g = (await gruppen(page)).find((x) => x.name === "Dokumente");
    const daten = g.zeilen.map((x) => iso(x.datum));
    return soll(g.kopf === "Dokumente (12)" && daten.every((d, i) => i === 0 || daten[i - 1] >= d), { kopf: g.kopf, daten });
  });
  await step("Zuerst 5 Zeilen, „Weitere Ergebnisse (7)“ zeigt den Rest, weiter neueste zuerst", async () => {
    const vorher = (await gruppen(page)).find((x) => x.name === "Dokumente");
    await page.locator('[data-such-gruppe="Dokumente"] [data-such-mehr]').click();
    const nachher = (await gruppen(page)).find((x) => x.name === "Dokumente");
    const daten = nachher.zeilen.map((x) => iso(x.datum));
    return soll(vorher.zeilen.length === 5 && vorher.mehr === "Weitere Ergebnisse (7)" && nachher.zeilen.length === 12 && !nachher.mehr && daten.every((d, i) => i === 0 || daten[i - 1] >= d), { vorher: vorher.zeilen.length, mehr: vorher.mehr, nachher: nachher.zeilen.length });
  });
  await suchen(page, "Waschmaschine");
  await step("Gemischte Suche: jede Art eine eigene Gruppe, in jeder Gruppe nur diese Art", async () => {
    const g = (await gruppen(page)).filter((x) => x.name !== "Bereiche der App");
    const rein = g.every((x) => x.zeilen.every((z) => z.art === x.name || x.name === "Dokumente"));
    return soll(g.length >= 2 && rein && g.every((x) => new RegExp(`^${x.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(\\d+\\)$`).test(x.kopf)), g.map((x) => `${x.kopf}: ${x.zeilen.map((z) => z.art).join(",")}`));
  });
  await step("Tipp auf eine Zeile führt aus der Suche an die Stelle", async () => {
    await page.locator(".search-results article.such-zeile > button").first().click();
    await page.waitForTimeout(500);
    return soll((await page.locator(".search-results").count()) === 0, "Suche noch offen");
  });
  check(errors.length === 0, "Desktop: keine Seitenfehler", errors.join(" | "));

  const handy = await (await browser.newContext(HANDY)).newPage();
  const handyErrors = collectErrors(handy);
  await handy.goto(app.base, { waitUntil: "networkidle" }); await ready(handy);
  await suchen(handy, "Waschmaschine");
  await step("Handy 390 px: Zeilen ohne Querrollen, Titel und Bereich lesbar", async () => {
    const breit = await handy.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    const z = (await gruppen(handy)).flatMap((x) => x.zeilen);
    return soll(!breit && z.length > 0 && z.every((x) => x.titel && x.hoehe <= 80), { breit, z: z.slice(0, 3) });
  });
  check(handyErrors.length === 0, "Handy: keine Seitenfehler", handyErrors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Suche als kompakte Trefferzeilen (2.28.39)"));
