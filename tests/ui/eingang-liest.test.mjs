// Klaus 2026-10-31 (Tablet): „nicht das komplette Werkzeug von Workflow PDF“ und „die Texterkennung hat nur Dokumentenscan und
// Datum erfasst“. Jetzt: „Dokument fotografieren“ öffnet den Scanner von Workflow PDF (im Prüfbrowser ein Stellvertreter, Kamera
// gibt es hier nicht), der Scan geht in die Prüfung; der Eingang liest den Text aus PDFs (Textebene, sonst Texterkennung).
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";
import { probePdf } from "./_dateien.mjs";

const scanPdf = probePdf("Nebenkostenabrechnung 2025 Pustelblumenweg 7 Nachzahlung 84,17 (erfunden)").buffer.toString("base64");
const STELLVERTRETER = `(() => { const bytes = Uint8Array.from(atob(${JSON.stringify(scanPdf)}), (c) => c.charCodeAt(0));
  window.WFP = window.WFP || {};
  window.WFP.Scanner = { pfade() {}, zustand() { return {}; }, oeffnen(o) { window.__scanTitel = o.titel; setTimeout(() => o.fertig(bytes, { name: "Dokumentscan 2026-10-31" }), 50); } };
})();`;

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext({ ...DESKTOP, serviceWorkers: "block" })).newPage();
  page.setDefaultTimeout(20000);
  await page.addInitScript(windowStub);
  await page.route(/\/wfpdf\/scanner\.js(\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: STELLVERTRETER }));
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  const modal = page.locator(".intake-modal");
  await step("Eingangszentrale → „Dokument fotografieren“ öffnet den Scanner von Workflow PDF", async () => {
    await footer(page, "Eingangszentrale");
    await page.locator(".central-intake [data-dokument-scannen]").click();
    await modal.waitFor();
    return (await page.evaluate(() => window.__scanTitel)) === "Dokument scannen" ? "Scanner geöffnet, Scan in der Prüfung" : false;
  });
  check(/Dokumentscan 2026-10-31\.pdf/.test(await modal.innerText()), "Der Scan steht als Datei in der Prüfung");
  await step("Der Eingang liest den Text des Scans", async () => {
    await page.waitForFunction(() => /Text gelesen/.test(document.querySelector(".intake-modal")?.textContent || ""), null, { timeout: 30000 });
    return true;
  });
  await step("Zusammenhang aus dem Inhalt: Nebenkostenabrechnung (der Dateiname sagt nichts)", async () => {
    await page.waitForFunction(() => /Nebenkosten/.test(document.querySelector(".intake-modal .context-suggestion h3")?.textContent || ""), null, { timeout: 15000 });
    return await modal.locator(".context-suggestion h3").innerText();
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
  // Startseite: derselbe Knopf.
  const start = await (await browser.newContext({ ...DESKTOP, serviceWorkers: "block" })).newPage();
  start.setDefaultTimeout(20000);
  await start.addInitScript(windowStub);
  await start.route(/\/wfpdf\/scanner\.js(\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: STELLVERTRETER }));
  await start.goto(app.base, { waitUntil: "networkidle" }); await ready(start);
  await step("Startseite → „Dokument fotografieren“ öffnet denselben Scanner", async () => {
    await start.locator(".document-intake [data-dokument-scannen]").first().click();
    await start.locator(".intake-modal").waitFor();
    return (await start.evaluate(() => window.__scanTitel)) === "Dokument scannen";
  });
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Eingang liest"));
