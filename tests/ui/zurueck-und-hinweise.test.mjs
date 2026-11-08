// Echter Browser-Verlauf und OPFS mit der erfundenen Beispielfamilie.
import assert from "node:assert/strict";
import { startApp, launchBrowser, DESKTOP, ready, footer, step, summary, collectErrors } from "./_harness.mjs";
const app = await startApp(), browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(10000);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await step("Start ohne Aktion: keine Platzhalter über dem Inhalt", async () => assert.equal(await page.locator(".global-activity-lines").count(), 0));
  await footer(page, "Cockpit");
  const object = page.locator("#cockpit-cases button:not(.start-info-trigger)").first();
  await object.scrollIntoViewIfNeeded();
  const sourceY = await page.evaluate(() => window.scrollY);
  await object.click(); await page.locator("#cockpit-dossier").waitFor();
  await step("Objekt hat einen Rückweg; private Kennung fehlt im Browser-Verlauf", async () => {
    assert.equal(await page.locator('#cockpit-dossier button[aria-label="Detailansicht schließen"]').count(), 1);
    const state = await page.evaluate(() => ({ state: history.state, hash: location.hash }));
    assert.equal(state.hash, "#cockpit");
    assert.deepEqual(Object.keys(state.state.familienakteNavigation).sort(), ["index", "session"]);
  });
  await step("Objekt-Zurück kehrt zur Liste an die alte Scrollposition zurück", async () => {
    await page.locator('#cockpit-dossier button[aria-label="Detailansicht schließen"]').click();
    await page.locator("#cockpit-dossier").waitFor({ state: "detached" });
    await page.waitForFunction(y => Math.abs(window.scrollY - y) <= 3, sourceY);
  });
  await step("Vorwärts öffnet das vorher gewählte Objekt wieder", async () => {
    await page.goForward(); await page.locator("#cockpit-dossier").waitFor();
  });
  await step("Maus-Zurücktaste nutzt denselben Verlauf", async () => {
    const cdp = await page.context().newCDPSession(page);
    for (const type of ["mousePressed", "mouseReleased"]) await cdp.send("Input.dispatchMouseEvent", { type, x: 20, y: 300, button: "back", buttons: type === "mousePressed" ? 8 : 0, clickCount: 1 });
    await page.locator("#cockpit-dossier").waitFor({ state: "detached" });
    await page.waitForFunction(y => Math.abs(window.scrollY - y) <= 3, sourceY);
    await cdp.detach();
  });
  await footer(page, "Dokumentenbibliothek");
  const search = page.locator('.library-search input');
  await search.fill("Garantie");
  const sort = page.locator('.library-filter-grid select').last();
  await sort.selectOption("title");
  const security = page.locator('.footer-directory button', { hasText: "Sicherheitscenter" }).first();
  await security.scrollIntoViewIfNeeded();
  const libraryY = await page.evaluate(() => window.scrollY);
  await security.click();
  await page.waitForFunction(() => location.hash === "#security");
  await step("Browser-Zurück stellt Bibliothek samt Suche, Sortierung und Position wieder her", async () => {
    await page.goBack(); await search.waitFor();
    assert.equal(await search.inputValue(), "Garantie"); assert.equal(await sort.inputValue(), "title");
    await page.waitForFunction(y => Math.abs(window.scrollY - y) <= 3, libraryY);
  });
  await step("Strg+Z und Strg+Umschalt+Z außerhalb von Feldern wechseln die Ansicht", async () => {
    await page.locator("h1").first().click(); await page.keyboard.press("Control+z");
    await page.waitForFunction(() => location.hash === "#cockpit");
    await page.locator("h1").first().click(); await page.keyboard.press("Control+Shift+z");
    await search.waitFor(); assert.equal(await search.inputValue(), "Garantie");
  });
  await step("Strg+Z in einem Textfeld bleibt die normale Text-Rücknahme", async () => {
    const global = page.getByRole("textbox", { name: "Gesamte Akte in natürlichen Worten durchsuchen" });
    await global.click(); await global.pressSequentially("UndoTest");
    const before = await global.inputValue();
    await global.press("Control+z");
    const after = await global.inputValue();
    // Native undo groups vary by browser: one word or the last typing group.
    assert.notEqual(after, before); assert.ok(before.startsWith(after));
    assert.ok(page.url().endsWith("#documents"));
    await global.fill("");
  });
  await step("Zehn aufeinanderfolgende Rückschritte bleiben innerhalb der App", async () => {
    const sequence = ["Cockpit", "Eingangszentrale", "Dokumentenbibliothek", "Sicherheitscenter", "Hilfe", "Cockpit", "Eingangszentrale", "Dokumentenbibliothek", "Sicherheitscenter", "Hilfe"];
    const urls = [page.url()];
    for (const name of sequence) { await footer(page, name); urls.push(page.url()); }
    for (let i = sequence.length - 1; i >= 0; i--) { await page.goBack(); await page.waitForURL(urls[i]); }
    assert.equal(await search.inputValue(), "Garantie");
  });
  await step("Beispieldaten entfernen: Hinweis verschwindet, Erfolg wird danach platzsparend ausgeblendet", async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole("button", { name: "Beispieldaten entfernen", exact: true }).click();
    await page.locator('.page-dialog button', { hasText: "Ja, fortfahren" }).click();
    await page.locator('.sample-data-notice').waitFor({ state: "detached" });
    await page.locator('.global-activity-text', { hasText: "Beispieldaten entfernt" }).waitFor();
    await page.locator('.global-activity-lines').waitFor({ state: "detached", timeout: 12000 });
    assert.equal(await page.locator('.activity-empty').count(), 0);
  });
  await step("Neuladen und ältere Browser-Einträge öffnen weiter den passenden Bereich", async () => {
    await footer(page, "Sicherheitscenter");
    await footer(page, "Hilfe");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".breadcrumb > span", { hasText: "Hilfe" }).waitFor();
    await page.goBack();
    await page.locator(".breadcrumb > span", { hasText: "Sicherheit & lokaler Tresor" }).waitFor();
    assert.ok(page.url().endsWith("#security"));
    await page.goForward();
    await page.locator(".breadcrumb > span", { hasText: "Hilfe" }).waitFor();
    assert.ok(page.url().endsWith("#help"));
  });
  await step("Keine Seitenfehler", () => assert.deepEqual(errors, []));
} finally { await browser.close(); await app.stop(); }
process.exitCode = summary("Zurück und kompakte Hinweise");
