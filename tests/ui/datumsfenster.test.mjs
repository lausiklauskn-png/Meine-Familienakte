// Datumsfenster (Klaus 2026-11-05): jedes Datumsfeld öffnet beim Antippen sofort das Auswahlfenster (showPicker), damit
// niemand ein Datum tippen muss. showPicker wird hier gestellt und gezählt; das echte Fenster mit Jahreswahl zeichnet der
// Browser selbst. Rückfall: wirft showPicker oder fehlt es, bleibt das Feld ohne Fehler tippbar.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, footer, collectErrors } from "./_harness.mjs";

const zaehler = `
  window.__picker = [];
  const echt = HTMLInputElement.prototype.showPicker;
  HTMLInputElement.prototype.showPicker = function () {
    window.__picker.push(this.type);
    if (window.__pickerWirft) throw new DOMException("verweigert", "NotAllowedError");
  };
  window.__pickerEcht = echt;
`;

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  await context.addInitScript(zaehler);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);

  const alleTippen = async () => page.evaluate(async () => {
    const felder = [...document.querySelectorAll('input[type="date"]')];
    window.__picker = [];
    for (const feld of felder) feld.click();
    return { felder: felder.length, ohneFenster: felder.filter((f) => !f.hasAttribute("data-datumsfenster")).length, aufrufe: window.__picker.length };
  });

  await footer(page, "Fristen und Aufgaben");
  const fristen = await alleTippen();
  check(fristen.felder === 2, "Fristen: zwei Datumsfelder (Fälligkeit, Erinnerung)", String(fristen.felder));
  check(fristen.ohneFenster === 0 && fristen.aufrufe === fristen.felder, "Fristen: jedes Datumsfeld öffnet das Fenster", `${fristen.aufrufe}/${fristen.felder}`);

  await footer(page, "Dokumentenbibliothek");
  await page.getByRole("button", { name: "Alle ansehen", exact: true }).first().click();
  await page.waitForTimeout(300);
  const bibliothek = await alleTippen();
  check(bibliothek.felder === 2 && bibliothek.aufrufe === 2, "Bibliothek „Alle ansehen“: Von und Bis öffnen das Fenster", `${bibliothek.aufrufe}/${bibliothek.felder}`);

  await footer(page, "Was gibt’s Neues?");
  await page.locator(".news-filter select").selectOption("custom");
  const neues = await alleTippen();
  check(neues.felder === 2 && neues.aufrufe === 2, "„Was gibt’s Neues?“ eigener Zeitraum: Von und Bis öffnen das Fenster", `${neues.aufrufe}/${neues.felder}`);

  await step("Echter Tipp (Maus) auf das Fälligkeitsdatum ruft das Fenster", async () => {
    await footer(page, "Fristen und Aufgaben");
    await page.evaluate(() => { window.__picker = []; });
    await page.locator('.schedule-create input[type="date"]').first().click();
    return (await page.evaluate(() => window.__picker.length)) === 1;
  });

  await step("Rückfall: verweigertes Fenster wirft keinen Fehler, das Feld bleibt tippbar", async () => {
    const vorher = errors.length;
    await page.evaluate(() => { window.__pickerWirft = true; });
    const feld = page.locator('.schedule-create input[type="date"]').first();
    await feld.click();
    await feld.fill("2026-11-20");
    await page.evaluate(() => { window.__pickerWirft = false; });
    return errors.length === vorher && (await feld.inputValue()) === "2026-11-20";
  });

  await step("Rückfall: ohne showPicker (älterer Browser) bleibt das Feld tippbar", async () => {
    await page.evaluate(() => { delete HTMLInputElement.prototype.showPicker; });
    const feld = page.locator('.schedule-create input[type="date"]').nth(1);
    await feld.click();
    await feld.fill("2026-11-13");
    return (await feld.inputValue()) === "2026-11-13";
  });

  await step("Quelltext: kein Datumsfeld mehr ohne den gemeinsamen Baustein", async () => {
    const { readFileSync } = await import("node:fs");
    const quelle = readFileSync(new URL("../../app/health-portal.tsx", import.meta.url), "utf8");
    const ausfuellen = readFileSync(new URL("../../app/ausfuellen-dialog.tsx", import.meta.url), "utf8");
    return !/type="date"/.test(quelle) && /oeffneDatumsfenster/.test(ausfuellen);
  });

  check(errors.length === 0, "Keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Datumsfenster"));
