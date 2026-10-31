// Stück 1b (Klaus 2026-10-31, Frage 2 aus Sitzung F: „Ja, erlauben“): auch geschützte Gesundheitsunterlagen lassen sich
// ausfüllen. Dabei gibt es keinen Weg zur KI („Mit KI benennen“ fehlt), und die ausgefüllte Fassung bleibt geschützt.
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const oeffne = async (page, name) => {
    await footer(page, "Eingangszentrale");
    const item = page.locator(".document-item", { has: page.locator(".document-title-link", { hasText: name }) }).first();
    await item.locator("[data-af-oeffnen]").click();
    const dlg = page.locator("[data-af]");
    await dlg.locator(".af-seite").first().waitFor({ timeout: 30000 });
    await dlg.locator('[role=tab]', { hasText: "Felder setzen" }).click();
    await dlg.locator("[data-af-erkennen]").waitFor();
    return dlg;
  };
  const page = await (await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(15000);
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);

  await step("Eingangszentrale: die geschützte Gesundheitsunterlage hat jetzt „Ausfüllen“", async () => {
    await footer(page, "Eingangszentrale");
    const geschuetzt = page.locator(".document-item", { hasText: "Geschützte Gesundheitsunterlage" });
    const n = await geschuetzt.count(), mit = await geschuetzt.locator("[data-af-oeffnen]").count();
    return n > 0 && mit > 0 ? `${mit} von ${n} geschützten Unterlagen mit Knopf` : false;
  });
  const titel = await page.locator(".document-item", { hasText: "Geschützte Gesundheitsunterlage" }).first().locator(".document-title-link").textContent();
  const dlg = await oeffne(page, titel.trim());
  check(await dlg.locator("[data-af-ki]").count() === 0, "Gesundheitsunterlage: kein „Mit KI benennen“ im Ausfüllen");
  check(await dlg.locator("[data-af-erkennen]").count() === 1, "Gesundheitsunterlage: Felder erkennen (offline) ist da");

  const page2 = await (await browser.newContext(DESKTOP)).newPage();
  page2.setDefaultTimeout(15000);
  await page2.addInitScript(windowStub);
  await page2.goto(app.base, { waitUntil: "networkidle" }); await ready(page2);
  const dlg2 = await oeffne(page2, "Nebenkostenabrechnung_2025.pdf");
  check(await dlg2.locator("[data-af-ki]").count() === 1, "Gegenstück: gewöhnliche Unterlage behält „Mit KI benennen“");

  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Ausfüllen Gesundheitsunterlagen"));
