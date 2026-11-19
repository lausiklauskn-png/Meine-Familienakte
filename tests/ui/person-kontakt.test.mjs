// Stück 1b (Klaus 2026-10-31, Frage 3 aus Sitzung F: „Ja, speichern“): Anschrift, E-Mail und Telefon an einer Person.
// Weg (2.28.75): Suche „Gerlinde“ → „Alles zu …“ → Steckbrief, Karte „Kontakt“ aufklappen → falsche E-Mail wird abgewiesen →
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
  // 2.28.75: Suche nach der Person → „Alles zu …“ → Steckbrief unter Familie & Personen, Karte „Kontakt“ (ab Werk zu).
  const zurPerson = async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(".global-search input").fill("Gerlinde Arenberg");
    await page.locator('.search-results article[data-such-art="Person"]').first().locator("button").first().click();
    await page.locator('[data-person-steckbrief="Gerlinde Arenberg"]').waitFor();
  };
  const kasten = page.locator('[data-person-steckbrief] [data-klapp="person-kontakt"]');
  const aufklappen = async () => { if ((await kasten.getAttribute("data-klapp-offen")) !== "ja") await kasten.locator("[data-klapp-knopf]").click(); };
  const zahl = async () => (await kasten.locator(".klapp-zahl").count()) ? (await kasten.locator(".klapp-zahl").innerText()).trim() : "0";
  await step("Person öffnen: Karte „Kontakt“ ist da und zu", async () => {
    await page.evaluate(() => { try { const k = JSON.parse(localStorage.getItem("fa_klapp") || "{}"); delete k["person-kontakt"]; localStorage.setItem("fa_klapp", JSON.stringify(k)); } catch { /* egal */ } });
    await zurPerson();
    return (await kasten.count()) === 1 && (await kasten.getAttribute("data-klapp-offen")) === "nein" ? "zu, bis man sie öffnet" : false;
  });
  await step("Falsche E-Mail wird abgewiesen, nichts gespeichert", async () => {
    await aufklappen();
    await kasten.locator('[data-kontakt="email"]').fill("gerlinde@");
    await kasten.locator("[data-kontakt-speichern]").click();
    await page.waitForTimeout(300);
    return /E-Mail/.test(await page.locator(".global-activity-lines").innerText()) && (await zahl()) === "0" ? "Meldung, nichts gespeichert" : false;
  });
  await step("Angaben speichern", async () => {
    await kasten.locator('[data-kontakt="street"]').fill("Am Traumbach 3");
    await kasten.locator('[data-kontakt="postalCode"]').fill("99999");
    await kasten.locator('[data-kontakt="city"]').fill("Kieselbrunn");
    await kasten.locator('[data-kontakt="email"]').fill("gerlinde@beispiel.invalid");
    await kasten.locator('[data-kontakt="phone"]').fill("0000 123456");
    await kasten.locator("[data-kontakt-speichern]").click();
    await page.locator("text=Anschrift und Kontakt gespeichert").first().waitFor();
    await page.waitForTimeout(300);
    return (await zahl()) === "5" ? "5 Angaben" : false;
  });
  await step("Nach Neuladen sind die Angaben noch da", async () => {
    await page.reload({ waitUntil: "networkidle" }); await ready(page);
    await zurPerson(); await aufklappen();
    return (await kasten.locator('[data-kontakt="city"]').inputValue()) === "Kieselbrunn" && (await kasten.locator('[data-kontakt="email"]').inputValue()) === "gerlinde@beispiel.invalid";
  });
  await step("Geleertes Feld wird entfernt", async () => {
    await kasten.locator('[data-kontakt="phone"]').fill("");
    await kasten.locator("[data-kontakt-speichern]").click();
    await page.waitForTimeout(800);
    return (await zahl()) === "4" ? "4 Angaben" : false;
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Anschrift und Kontakt an Personen"));
