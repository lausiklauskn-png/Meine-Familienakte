// Pseudo-Knopf (Klaus 14.11.2026): rot „inaktiv“ → Tipp → grün „aktiv“, Fenster pseudonymisiert eine eingefügte Datei
// (erfundene Daten) ohne einen einzigen Netzaufruf, Marke vorn, zweiter Durchlauf unverändert, Zurückführen. Handy und PC.
import { startApp, launchBrowser, HANDY, DESKTOP, ready, step, soll, check, summary, collectErrors } from "./_harness.mjs";

const BRIEF = "Sehr geehrte Frau Mara Testfeld,\nLindenweg 12, 12345 Musterstadt, geb. 03.04.1981\nSteuer-ID 47158203699, KVNR T528173648\nIBAN DE89 3704 0044 0532 0130 00\nDiagnose: I10.9\nFrist 31.12.2026, Betrag 412,50 €.";
const KLAR = ["Mara Testfeld", "Lindenweg 12", "Musterstadt", "03.04.1981", "47158203699", "T528173648", "DE89", "I10.9"];
const app = await startApp();
const browser = await launchBrowser();
try {
  for (const [name, geraet] of [["Handy", HANDY], ["PC", DESKTOP]]) {
    const context = await browser.newContext({ ...geraet, permissions: ["clipboard-read", "clipboard-write"] });
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    const knopf = page.locator("[data-pseudo-knopf]");
    await step(`${name}: Knopf rot „inaktiv“, kein Fenster`, async () => {
      const r = { zustand: await knopf.getAttribute("data-pseudo-knopf"), text: await knopf.innerText(), fenster: await page.locator("[data-pseudo-fenster]").count(), sichtbar: await knopf.isVisible() };
      return soll(r.zustand === "aus" && /Pseudo\s*inaktiv/.test(r.text) && r.fenster === 0 && r.sichtbar, r);
    });
    const netz = [];
    await step(`${name}: Tipp → grün „aktiv“, Datei einfügen, alles verdeckt, kein Netzaufruf`, async () => {
      await knopf.click();
      await page.locator("[data-pseudo-fenster]").waitFor();
      page.on("request", (r) => { if (!r.url().startsWith(app.base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) netz.push(r.url()); });
      await page.locator("[data-pseudo-datei]").setInputFiles({ name: "Brief.txt", mimeType: "text/plain", buffer: Buffer.from(BRIEF) });
      await page.locator("[data-pseudo-ergebnis]").first().waitFor();
      const t = await page.locator("[data-pseudo-ergebnis]").first().innerText();
      const r = { knopf: await knopf.innerText(), offen: KLAR.filter((k) => t.includes(k)), marke: t.startsWith("⟦PSEUDONYMISIERT v1⟧"), bleibt: t.includes("31.12.2026") && t.includes("412,50"), netz };
      return soll(/aktiv/.test(r.knopf) && !/inaktiv/.test(r.knopf) && r.offen.length === 0 && r.marke && r.bleibt && netz.length === 0, r);
    });
    await step(`${name}: Kopieren nimmt nur die Fassung, zweiter Durchlauf unverändert, Zurückführen`, async () => {
      await page.locator("[data-pseudo-kopieren]").first().click();
      const kopie = await page.evaluate(() => navigator.clipboard.readText());
      await page.locator("[data-pseudo-text]").fill(kopie); await page.locator("[data-pseudo-los]").click();
      const zweit = await page.locator("[data-pseudo-ergebnis]").first().innerText();
      const tok = (kopie.match(/⟦(?:PERSON|NAME)-\d+⟧/) || [""])[0];
      await page.locator("[data-pseudo-antwort]").fill(`Liebe ${tok}, alles erledigt.`);
      await page.locator("[data-pseudo-zurueckfuehren]").click();
      const klar = await page.locator("[data-pseudo-klar]").innerText();
      return soll(!KLAR.some((k) => kopie.includes(k)) && zweit === kopie && /Mara Testfeld/.test(klar), { zweitGleich: zweit === kopie, klar, tok });
    });
    await step(`${name}: Tipp → wieder rot, Fenster zu`, async () => {
      await knopf.click();
      return soll((await knopf.getAttribute("data-pseudo-knopf")) === "aus" && (await page.locator("[data-pseudo-fenster]").count()) === 0, "nicht aus");
    });
    check(errors.length === 0, `${name}: keine Seitenfehler`, errors.join(" | "));
    await context.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Pseudo-Knopf"));
