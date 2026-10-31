// Stück 1b (Klaus 2026-10-31, Frage 1 aus Sitzung F: „Ja, Knopf dazu“): Eingangszentrale → „Formular scannen und ausfüllen“.
// Der Scanner von Workflow PDF wird hier durch einen Stellvertreter ersetzt, der sofort ein erfundenes Formular-PDF liefert
// (Kamera gibt es im Prüfbrowser nicht). Geprüft wird der Weg danach: Scan als Unterlage abgelegt → Ausfüllen öffnet sich → Felder erkennen.
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";

function formularPdf() {
  const z = [];
  const text = (x, y, s, gr = 11) => z.push(`BT /F1 ${gr} Tf ${x} ${y} Td (${s}) Tj ET`);
  const linie = (x0, y, x1) => z.push(`0 0 0 RG 1 w ${x0} ${y} m ${x1} ${y} l S`);
  text(50, 790, "Anmeldung Ferienbetreuung - Gemeinde Wolkenhain (erfunden)", 15);
  for (const [l, y] of [["Vorname:", 720], ["Nachname:", 680], ["E-Mail:", 640]]) { text(50, y + 3, l); linie(160, y, 520); }
  const stream = z.join("\n");
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"];
  let out = "%PDF-1.4\n"; const off = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return Buffer.from(out, "latin1").toString("base64");
}
const STELLVERTRETER = `(() => { const b64 = ${JSON.stringify(formularPdf())};
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  window.WFP = window.WFP || {};
  window.WFP.Scanner = { pfade() {}, zustand() { return {}; }, oeffnen(o) { window.__scanOffen = (window.__scanOffen || 0) + 1; setTimeout(() => o.fertig(bytes, { name: "Anmeldung Ferienbetreuung" }), 50); } };
})();`;

const app = await startApp();
const browser = await launchBrowser();
try {
  // Service Worker gesperrt: sonst kommt scanner.js aus dem Vorrat und der Stellvertreter greift nicht.
  const page = await (await browser.newContext({ ...DESKTOP, serviceWorkers: "block" })).newPage();
  page.setDefaultTimeout(20000);
  await page.addInitScript(windowStub);
  await page.route(/\/wfpdf\/scanner\.js(\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: STELLVERTRETER }));
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await footer(page, "Eingangszentrale");
  const knopf = page.locator("[data-formular-scannen]");
  check(await knopf.count() === 1, "Eingangszentrale: Knopf „Formular scannen und ausfüllen“ ist da");
  check(await page.locator(".intake-source", { hasText: "Dokument fotografieren" }).count() === 1, "„Dokument fotografieren“ des Freundes bleibt");
  const dlg = page.locator("[data-af]");
  await step("Tipp → Scanner → Scan liegt als Unterlage in der Akte und das Ausfüllen öffnet sich", async () => {
    await knopf.click();
    await dlg.locator(".af-seite").first().waitFor({ timeout: 30000 });
    const titel = await dlg.locator("#af-titel").textContent();
    return /Anmeldung Ferienbetreuung\.pdf/.test(titel) && (await page.evaluate(() => window.__scanOffen)) === 1 ? titel : false;
  });
  await step("Felder erkennen findet die Linien des gescannten Formulars", async () => {
    await dlg.locator("[role=tab]", { hasText: "Felder setzen" }).click();
    await dlg.locator("[data-af-erkennen]").click();
    await page.waitForFunction(() => document.querySelectorAll("[data-af] [data-af-feld]").length >= 3, null, { timeout: 30000 });
    return `${await dlg.locator("[data-af-feld]").count()} Felder`;
  });
  await step("Der Scan steht danach in der Eingangszentrale als Unterlage", async () => {
    await dlg.locator('[aria-label="Ausfüllen schließen"]').click();
    await footer(page, "Eingangszentrale");
    return (await page.locator(".document-item", { hasText: "Anmeldung Ferienbetreuung.pdf" }).count()) >= 1;
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Formular scannen und ausfüllen"));
