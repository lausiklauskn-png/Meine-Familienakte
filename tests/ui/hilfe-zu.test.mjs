// Hilfe (Klaus 2026-11-05): alle Fragen starten zugeklappt, „Wie suche ich etwas?“ ebenso; der Kasten „Demo ansehen“
// steht ganz oben (vorher ganz unten, hinter rund zwanzig offenen Fragen). Gesperrt nennt er den Grund.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, footer, collectErrors } from "./_harness.mjs";
const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await footer(page, "Hilfe");
  const lage = await page.evaluate(() => {
    const fragen = [...document.querySelectorAll(".help-topics > details, .hilfe-eintrag > details, details.help-suche")];
    const demo = document.querySelector(".demo-starten"), erste = document.querySelector(".help-start");
    return { fragen: fragen.length, offen: fragen.filter((d) => d.open).length,
      demoVorne: Boolean(demo && erste && (demo.compareDocumentPosition(erste) & Node.DOCUMENT_POSITION_FOLLOWING)),
      demoSichtbar: Boolean(demo && demo.getBoundingClientRect().top < innerHeight * 1.5) };
  });
  check(lage.fragen >= 20, "Hilfe hat ihre Fragen (" + lage.fragen + ")");
  check(lage.offen === 0, "Alle Fragen und „Wie suche ich etwas?“ starten zugeklappt (offen: " + lage.offen + ")");
  check(lage.demoVorne, "„Demo starten“ steht vor „Was möchtest du tun?“");
  check(lage.demoSichtbar, "„Demo starten“ ist ohne langes Rollen zu sehen");
  await step("Eine Frage lässt sich aufklappen und zeigt ihren Text", async () => {
    const f = page.locator(".hilfe-eintrag > details", { hasText: "Was ist „Bestand prüfen“?" }).first();
    await f.locator("summary").click();
    return await f.evaluate((d) => d.open && d.querySelector("div").innerText.length > 20);
  });
  await step("Gesperrte Demo nennt den Grund (kein Datentresor gewählt)", async () => {
    const knopf = page.locator(".demo-starten button", { hasText: "Demo starten" });
    if (!(await knopf.isDisabled())) return true; // mit Tresor: kein Grund nötig
    return /Datentresor wählen/.test(await page.locator(".demo-starten [data-demo-grund]").innerText());
  });
  check(errors.length === 0, "Keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Hilfe zu"));
