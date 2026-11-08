// Kurzhinweise an Knöpfen (2026-11-04): Haken in der Hilfe; aus = Hinweistexte zurückgehalten, an = zurück;
// langer Druck (Touch) zeigt die Blase und löst den Knopf nicht aus.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, footer, collectErrors } from "./_harness.mjs";
const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  // 2.28.39: Drucker und ⟳ sind aus dem Kopf; geprüft wird am Knopf „Ablegen“ und am Kalender-Knopf.
  const HINWEIS = "Ablegen: fotografieren, Dateien oder Ordner wählen";
  const titel = () => page.locator(".ablegen-knopf-schalter").getAttribute("title");
  check((await titel()) === HINWEIS, "Ab Werk an: Knopf „Ablegen“ hat seinen Hinweis");
  await footer(page, "Hilfe");
  const haken = page.getByLabel("Kurzhinweise an Knöpfen anzeigen");
  await step("Aus: Hinweise werden zurückgehalten, auch nach Neuladen", async () => {
    await haken.uncheck();
    if ((await titel()) !== null || (await page.locator(".ablegen-knopf-schalter").getAttribute("data-fa-titel")) !== HINWEIS) return false;
    await page.reload(); await ready(page);
    return (await titel()) === null;
  });
  await step("An: Hinweise kommen zurück", async () => {
    await footer(page, "Hilfe"); await page.getByLabel("Kurzhinweise an Knöpfen anzeigen").check();
    return (await titel()) === HINWEIS;
  });
  await step("Langer Druck (Touch) zeigt die Blase und löst den Knopf nicht aus", async () => {
    const ergebnis = await page.evaluate(async () => {
      const k = document.querySelector(".kalender-knopf-schalter"); let geklickt = 0;
      k.addEventListener("click", () => { geklickt++; });
      const r = k.getBoundingClientRect(), o = { bubbles: true, pointerType: "touch", clientX: r.x + 5, clientY: r.y + 5 };
      k.dispatchEvent(new PointerEvent("pointerdown", o));
      await new Promise((f) => setTimeout(f, 700));
      const text = document.querySelector(".kurzhinweis-blase")?.textContent || "";
      k.dispatchEvent(new PointerEvent("pointerup", o)); k.click();
      return { text, geklickt };
    });
    return ergebnis.text === "Mein Kalender" && ergebnis.geklickt === 0 ? ergebnis.text : JSON.stringify(ergebnis);
  });
  check(errors.length === 0, "Keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Kurzhinweise"));
