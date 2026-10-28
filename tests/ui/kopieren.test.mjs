// Copy-Knöpfe: Aktivitätszeilen, „Auftrag kopieren“ (ChatGPT), Assistenz „Kopieren“, Diagnose – mit und ohne Zwischenablage-Berechtigung.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, collectErrors, footer, openMenu } from "./_harness.mjs";
import { windowStub, clipboardDeniedStub, schliesseDialoge, verdecktVon, bekannt } from "./_stubs.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  // ---------- mit Berechtigung ----------
  const context = await browser.newContext(DESKTOP);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const page = await context.newPage(); page.setDefaultTimeout(8000);
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await step("Start", async () => { await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); });
  await step("Aktivitätszeilen: Copy ist ohne Aktion gesperrt", async () => page.locator('button[aria-label="Aktivitätszeile 1 kopieren"]').isDisabled());
  await step("Nach einer Aktion: „Aktivitätszeile 1 kopieren“ legt genau den Zeilentext in die Zwischenablage", async () => {
    await footer(page, "Sicherheitscenter");
    await page.locator("button", { hasText: "Export vorbereiten" }).click(); await page.waitForTimeout(300); await schliesseDialoge(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    const zeile = (await page.locator(".global-activity-row").first().locator(".global-activity-text").innerText()).trim();
    const knopf = page.locator('button[aria-label="Aktivitätszeile 1 kopieren"]');
    const dar = await verdecktVon(page, knopf);
    if (!dar.startsWith("button")) bekannt("Copy-Knopf der Aktivitätszeile 1 ist überdeckt", dar);
    await knopf.focus(); await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    const status = await page.locator(".global-activity-row").first().locator('[role="status"]').innerText();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    return clip === zeile && status === "Kopiert" ? `„${zeile.slice(0, 60)}…“` : (console.log("   ↳ Zeile:", zeile.slice(0, 80), "| Clip:", clip.slice(0, 80), "| Status:", status), false);
  });
  await step("Zweite Aktion rückt die erste in Zeile 2; „Aktivitätszeile 2 kopieren“ liefert die ältere", async () => {
    const alt = (await page.locator(".global-activity-row").first().locator(".global-activity-text").innerText()).trim();
    await page.locator(".footer-directory button", { hasText: "Mit ChatGPT arbeiten" }).click(); await page.waitForSelector(".modal");
    await page.locator(".modal button", { hasText: "Auftrag kopieren" }).click(); await page.waitForTimeout(300); await schliesseDialoge(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    const k = page.locator('button[aria-label="Aktivitätszeile 2 kopieren"]'); await k.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(200);
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    return clip === alt;
  });
  await step("ChatGPT-Dialog: „Auftrag kopieren“ kopiert den vorbereiteten Auftrag samt Wunsch", async () => {
    await page.locator(".footer-directory button", { hasText: "Mit ChatGPT arbeiten" }).click();
    await page.waitForSelector(".modal");
    await page.locator(".modal textarea").first().fill("Ergänze im Bereich Fahrzeuge einen Unterpunkt für TÜV-Termine.");
    await page.locator(".modal button", { hasText: "Auftrag kopieren" }).click(); await page.waitForTimeout(300);
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    const link = await page.locator('.modal a[href="https://chatgpt.com/"]').count();
    await schliesseDialoge(page);
    return clip.includes("Nimm die folgenden Änderungen") && clip.includes("TÜV-Termine") && link === 1 ? "Auftrag kopiert; „ChatGPT öffnen“ ist ein Link in neuem Tab" : false;
  });
  await step("Assistenz: Schreiben vorbereiten → „Kopieren“ legt Betreff + Entwurf in die Zwischenablage", async () => {
    await openMenu(page, 0, "Assistenzzentrale");
    await page.locator("button", { hasText: "Schreiben oder E-Mail erstellen" }).first().click();
    await page.locator("textarea").first().fill("Bitte um Belegeinsicht zur Nebenkostenabrechnung 2025.");
    await page.locator("button", { hasText: "Familienakte prüfen und Vorschlag vorbereiten" }).click(); await page.waitForTimeout(600);
    await page.locator("button", { hasText: "Schreiben vorbereiten" }).click(); await page.waitForTimeout(400);
    await page.locator("button", { hasText: "Kopieren" }).first().click(); await page.waitForTimeout(300);
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    return clip.startsWith("Betreff:") ? `„${clip.split("\n")[0].slice(0, 60)}“` : (console.log("   ↳", clip.slice(0, 80)), false);
  });
  check(errors.length === 0, "Keine Seitenfehler (mit Berechtigung)", errors.join(" | "));

  // ---------- ohne Berechtigung ----------
  const ctx2 = await browser.newContext(DESKTOP);
  const p2 = await ctx2.newPage(); p2.setDefaultTimeout(8000);
  await p2.addInitScript(windowStub); await p2.addInitScript(clipboardDeniedStub);
  const e2 = collectErrors(p2);
  await step("Ohne Berechtigung: Start", async () => { await p2.goto(app.base, { waitUntil: "networkidle" }); await ready(p2); });
  await step("Ohne Berechtigung: Aktivitätszeile zeigt „Kopieren fehlgeschlagen“ statt zu hängen", async () => {
    await footer(p2, "Sicherheitscenter"); await p2.locator("button", { hasText: "Export vorbereiten" }).click(); await p2.waitForTimeout(300); await schliesseDialoge(p2);
    await p2.evaluate(() => window.scrollTo(0, 0));
    const k = p2.locator('button[aria-label="Aktivitätszeile 1 kopieren"]'); await k.focus(); await p2.keyboard.press("Enter"); await p2.waitForTimeout(300);
    const status = await p2.locator(".global-activity-row").first().locator('[role="status"]').innerText();
    return /fehl|nicht möglich/i.test(status) ? `Status: „${status}“` : (console.log("   ↳ Status:", status), false);
  });
  await step("Ohne Berechtigung: ChatGPT „Auftrag kopieren“ nennt den Handweg", async () => {
    await p2.locator(".footer-directory button", { hasText: "Mit ChatGPT arbeiten" }).click(); await p2.waitForSelector(".modal");
    await p2.locator(".modal button", { hasText: "Auftrag kopieren" }).click(); await p2.waitForTimeout(400);
    const text = (await p2.locator("[aria-live], .notice").allInnerTexts()).join(" ");
    await schliesseDialoge(p2);
    return /von Hand|markiere/.test(text) ? text.replace(/\s+/g, " ").slice(0, 100) : (console.log("   ↳", text.slice(0, 120)), false);
  });
  check(e2.length === 0, "Keine Seitenfehler (ohne Berechtigung)", e2.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Kopieren"));
