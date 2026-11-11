// 2.28.61 (Klaus 11.11., Ja zu allen vier): Meine Geräte – dieses Gerät einmal per Knopf benennen, Erklärungen hinter dem „?“,
// alte Einzelübergabe weg; an jeder Unterlage der Dateiort mit „Pfad kopieren“ (Explorer nur in der Windows-App).
import { startApp, launchBrowser, DESKTOP, ready, footer, step, fail, summary, collectErrors } from "./_harness.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext({ ...DESKTOP, serviceWorkers: "block" });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: app.base });
  const page = await context.newPage(); page.setDefaultTimeout(20000); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  await page.evaluate(async () => { const f = window.__vaultFixture; await f.seedSampleFamily(await f.browserVault(), { force: true }); });
  await page.reload({ waitUntil: "networkidle" }); await ready(page);
  await footer(page, "Sicherheitscenter");
  const k = page.locator("[data-meine-geraete]");

  await step("Meine Geräte: neues Gerät fragt „Wie heißt dieses Gerät?“ mit Handy/Tablet/PC/Laptop; ohne Wahl kein Speichern", async () => {
    await k.waitFor();
    const arten = await k.locator("[data-geraet-art]").allInnerTexts();
    soll(arten.join(",") === "Handy,Tablet,PC,Laptop", arten);
    soll(await k.locator("[data-geraet-speichern]").isDisabled(), "Speichern ohne Wahl möglich");
    return soll((await k.locator("[data-geraet-name]").innerText()).includes("noch ohne Namen"), "Vorgabename sichtbar");
  });
  await step("Laptop + Zusatz speichern; nach Neuladen bleibt der Name, keine Frage mehr", async () => {
    await k.locator('[data-geraet-art="Laptop"]').click(); await k.locator("[data-geraet-zusatz]").fill("im Büro"); await k.locator("[data-geraet-speichern]").click();
    await page.reload({ waitUntil: "networkidle" }); await ready(page); await footer(page, "Sicherheitscenter"); await k.waitFor();
    const name = await k.locator("[data-geraet-name]").innerText();
    soll(name === "Laptop im Büro" && !(await k.locator("[data-geraet-benennen]").count()), name);
    await k.locator("[data-geraet-aendern]").click();
    soll(await k.locator('[data-geraet-art="Laptop"]').getAttribute("aria-pressed") === "true" && await k.locator("[data-geraet-zusatz]").inputValue() === "im Büro", "Ändern zeigt die bisherige Wahl nicht");
    await k.getByRole("button", { name: "Abbrechen" }).click();
    return name;
  });
  await step("Erklärungen hinter dem „?“: Geräte, Festplatte, Netz, Paket; keine langen Erklärsätze auf der Karte", async () => {
    const main = await page.locator("main").innerText();
    soll(!/Ohne Platte und ohne gemeinsames Netz|Eine SD-Karte, USB-Platte oder ein Netzordner|Gemerkt wird der Schlüssel nur/.test(main), "Erklärtext steht offen auf der Seite");
    for (const label of ["Meine Geräte erklären", "Gemeinsame Festplatte erklären", "Paket per Teilen erklären"]) soll(await page.getByRole("button", { name: label }).count() >= 1, `„?“ fehlt: ${label}`);
    await page.getByRole("button", { name: "Meine Geräte erklären" }).click();
    const text = await page.locator(".start-info-panel").innerText();
    soll(/keine Geräte/.test(text) && /von allein/.test(text), text);
    return true;
  });
  await step("Gegenprobe: alte Einzelübergabe-Karte und Satz „geplant, noch nicht gebaut“ sind weg; Paket fragt keinen Namen", async () => {
    soll(await page.locator(".pro-geraetetransport").count() === 0, "alte Karte da");
    soll(!/geplant, (aber )?noch nicht gebaut/.test(await page.locator("main").innerText()), "veralteter Satz");
    await page.locator("[data-paket-erstellen]").click();
    const d = page.locator("[data-paket-dialog]"); await d.waitFor();
    soll(await d.locator("[data-paket-name]").count() === 0 && /Neues Gerät/.test(await d.locator("[data-paket-ziel]").innerText()), "Namensfeld oder Wahl falsch");
    await d.getByRole("button", { name: "Abbrechen" }).click();
    return true;
  });
  await step("Unterlage: „Gespeichert in:“ mit Pfad, „Pfad kopieren“ legt ihn in die Zwischenablage; im Browser kein Explorer-Knopf", async () => {
    await footer(page, "Dokumentenbibliothek");
    await page.locator("button", { hasText: "Alle ansehen" }).first().click();
    const zeile = page.locator("[data-bibliothek-zeile]").first(); await zeile.waitFor();
    const id = await zeile.getAttribute("data-bibliothek-zeile");
    await zeile.locator("[data-bibliothek-auge]").click();
    const karte = page.locator(`[data-bibliothek-karte="${id}"]`).first(); await karte.waitFor();
    const ort = karte.locator("[data-datei-ort]"); await ort.waitFor();
    const pfad = await ort.locator("[data-datei-ort-pfad]").innerText();
    soll(/Me_Myself_and_I_Familienakte › 01_Dokumente › /.test(pfad), pfad);
    await ort.locator("[data-datei-ort-kopieren]").click();
    await ort.locator("[data-datei-ort-meldung]").waitFor();
    const kopie = await page.evaluate(() => navigator.clipboard.readText());
    soll(kopie.includes("Me_Myself_and_I_Familienakte/01_Dokumente/"), kopie);
    soll(await ort.locator("[data-datei-ort-explorer]").count() === 0, "Explorer-Knopf im Browser");
    soll(await ort.getByRole("button", { name: "Dateiort erklären" }).count() === 1, "„?“ am Dateiort fehlt");
    return pfad;
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Meine Geräte und Dateiort"));
