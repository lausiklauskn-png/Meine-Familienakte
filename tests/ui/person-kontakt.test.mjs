// Stück 1b (Klaus 2026-10-31, Frage 3 aus Sitzung F: „Ja, speichern“): Anschrift, E-Mail und Telefon an einer Person.
// Weg: Suche „Gerlinde“ → Person öffnen (Cockpit-Detail) → „Anschrift und Kontakt“ aufklappen → falsche E-Mail wird abgewiesen →
// richtige Angaben speichern → nach Neuladen noch da → Feld leeren entfernt die Angabe. (Vorbelegen aus diesen Angaben: lib/ausfuellen.ts personWert.)
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(15000);
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  const zurPerson = async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(".global-search input").fill("Gerlinde Arenberg");
    await page.locator(".search-results article", { has: page.locator(".badge", { hasText: /^Person$/ }) }).first().locator("button").first().click();
    await page.locator("#cockpit-dossier").waitFor();
  };
  const kasten = page.locator("#cockpit-dossier [data-person-kontakt]");
  await step("Person öffnen: Kasten „Anschrift und Kontakt“ ist da und zu", async () => {
    await zurPerson();
    return (await kasten.count()) === 1 && !(await kasten.evaluate((d) => d.open)) ? "zu, bis man ihn öffnet" : false;
  });
  await step("Falsche E-Mail wird abgewiesen, nichts gespeichert", async () => {
    await kasten.locator("summary").click();
    await kasten.locator('[data-kontakt="email"]').fill("gerlinde@");
    await kasten.locator("[data-kontakt-speichern]").click();
    return /E-Mail/.test(await kasten.locator("[role=alert]").textContent()) ? "Meldung im Kasten" : false;
  });
  await step("Angaben speichern", async () => {
    await kasten.locator('[data-kontakt="street"]').fill("Am Traumbach 3");
    await kasten.locator('[data-kontakt="postalCode"]').fill("99999");
    await kasten.locator('[data-kontakt="city"]').fill("Kieselbrunn");
    await kasten.locator('[data-kontakt="email"]').fill("gerlinde@beispiel.invalid");
    await kasten.locator('[data-kontakt="phone"]').fill("0000 123456");
    await kasten.locator("[data-kontakt-speichern]").click();
    await page.locator("text=Anschrift und Kontakt gespeichert").first().waitFor();
    return (await kasten.locator("summary").textContent()).includes("5 Angaben") ? "5 Angaben" : false;
  });
  await step("Nach Neuladen sind die Angaben noch da", async () => {
    await page.reload({ waitUntil: "networkidle" }); await ready(page);
    await zurPerson(); await kasten.locator("summary").click();
    return (await kasten.locator('[data-kontakt="city"]').inputValue()) === "Kieselbrunn" && (await kasten.locator('[data-kontakt="email"]').inputValue()) === "gerlinde@beispiel.invalid";
  });
  await step("Geleertes Feld wird entfernt", async () => {
    await kasten.locator('[data-kontakt="phone"]').fill("");
    await kasten.locator("[data-kontakt-speichern]").click();
    await page.waitForTimeout(800);
    return (await kasten.locator("summary").textContent()).includes("4 Angaben") ? "4 Angaben" : false;
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Anschrift und Kontakt an Personen"));
