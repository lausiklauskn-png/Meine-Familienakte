// Klaus 2026-10-31 (Tablet): „Möglicher vorhandener Zusammenhang … wird jedes Mal wieder zurückgesetzt, obwohl ich
// Nebenkostenabrechnung eingebe“. Ursachen: „Verknüpfen“ setzte immer den Vorschlag, eine Automatik setzte jede leere Auswahl
// wieder auf den Vorschlag, die Überschrift nannte nur den Vorschlag, der Vorschlag kannte Bereich/Dokumentart/Text nicht.
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";
import { probePdf } from "./_dateien.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(15000);
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  const modal = page.locator(".intake-modal");
  const oeffne = async (name, text) => {
    await footer(page, "Eingangszentrale");
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([{ ...probePdf(text), name }]);
    await page.waitForTimeout(800);
    const q = page.locator(".intake-queue-item").filter({ has: page.locator("button", { hasText: "Zuordnung prüfen" }) }).first();
    await q.locator("button", { hasText: "Zuordnung prüfen" }).click();
    await modal.waitFor();
    await modal.locator(".context-suggestion").waitFor();
    // Seit 2.28.8 liest der Eingang den PDF-Text; erst danach steht der Vorschlag fest.
    await page.waitForFunction(() => /Text gelesen/.test(document.querySelector(".intake-modal")?.textContent || ""), null, { timeout: 30000 });
  };
  await oeffne("Garantie_Waschmaschine_Pumpe.pdf", "Garantieanfrage Waschmaschine pumpt nicht ab");
  const auswahl = modal.locator("[data-kontext-vorgang]");
  const titel = () => modal.locator(".context-suggestion h3").innerText();
  if (process.env.ZEIGEN) console.log("Titel:", await titel(), "| Wahl:", await auswahl.inputValue());
  const vorschlag = await auswahl.inputValue();
  check(!!vorschlag && /passt wahrscheinlich zu/.test(await titel()), "Vorschlag ist vorbelegt und die Überschrift nennt ihn", await titel());
  // Ein anderer Vorgang als der Vorschlag (welcher das ist, hängt vom gelesenen Text ab).
  const nebenkosten = await auswahl.locator("option").evaluateAll((os, v) => os.map((o) => o.value).find((x) => x && x !== v), vorschlag);
  await step("Anderen Vorgang wählen → Überschrift nennt die Wahl", async () => {
    await auswahl.selectOption(nebenkosten);
    return /Wird verknüpft mit „/.test(await titel()) ? await titel() : false;
  });
  await step("„Verknüpfen“ behält die eigene Wahl (vorher: zurück auf den Vorschlag)", async () => {
    await modal.locator("[data-kontext-verknuepfen]").click();
    await page.waitForTimeout(300);
    return (await auswahl.inputValue()) === nebenkosten;
  });
  await step("„Nicht verknüpfen“ bleibt leer (vorher: sofort wieder der Vorschlag)", async () => {
    await modal.locator(".context-suggestion button", { hasText: "Nicht verknüpfen" }).click();
    await page.waitForTimeout(400);
    return (await auswahl.inputValue()) === "";
  });
  await step("„Noch nicht verknüpfen“ in der Liste bleibt stehen", async () => {
    await auswahl.selectOption(nebenkosten); await auswahl.selectOption("");
    await page.waitForTimeout(400);
    return (await auswahl.inputValue()) === "";
  });
  // Grenze (gemessen 2026-10-31): extractDocumentIntakeTextHint liest PDFs und Fotos nicht (nur Mail/Text) — ein Scan mit
  // allgemeinem Namen bekommt deshalb keinen Vorschlag aus seinem Inhalt. Eigenes Stück (Texterkennung/Briefkopf im Eingang).
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Zusammenhang wählen"));
