// Klaus 2026-11-01 („ja“ zum Vorschlag): Absender · Empfänger · Nummer aus dem Briefkopf im Eingang sichtbar und änderbar; die Notiz
// merkt sie; ein zweiter Brief mit derselben Kundennummer nennt die frühere Unterlage. Erfundene Briefe, Textebene des PDF.
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";

function briefPdf(name, zeilen) {
  const stream = zeilen.map((z, i) => `BT /F1 11 Tf 60 ${780 - i * 18} Td (${z.replace(/[()\\]/g, "")}) Tj ET`).join("\n");
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"];
  let out = "%PDF-1.4\n"; const off = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + off.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return { name, mimeType: "application/pdf", buffer: Buffer.from(out, "latin1") };
}
const kopf = (name, datum, betreff) => briefPdf(name, ["Stadtwerke Lindwurm GmbH, Postfach 12 34, 12345 Musterstadt", "", "Frau Erika Probe", "Wiesenweg 3", "54321 Beispielort",
  "", `Datum: ${datum}`, "Kundennummer: 4711-0815", `Betreff: ${betreff}`, "", "Sehr geehrte Frau Probe,", "anbei Ihre Jahresabrechnung fuer Strom und Gas.",
  "Ihr neuer Abschlag betraegt 80 Euro.", "Mit freundlichen Gruessen", "Stadtwerke Lindwurm GmbH"]);
const ERST = kopf("Dokumentscan 2026-10-12.pdf", "12.10.2026", "Jahresabrechnung Strom");
const ZWEIT = kopf("Dokumentscan 2026-10-20.pdf", "20.10.2026", "Abschlag Strom");

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext({ ...DESKTOP, serviceWorkers: "block" })).newPage();
  page.setDefaultTimeout(30000);
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  const m = page.locator(".intake-modal");
  const oeffnen = async (datei) => {
    await footer(page, "Eingangszentrale");
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([datei]);
    await page.locator(".intake-queue-item button", { hasText: "Zuordnung prüfen" }).first().click();
    await m.getByText("Text gelesen").first().waitFor({ timeout: 30000 });
    await page.waitForFunction(() => (document.querySelector("[data-brief-feld=absender]")?.value || "").length > 0, null, { timeout: 15000 }).catch(() => {});
  };
  let a = {};
  await step("Erster Brief: Briefkopf im Eingang", async () => { await oeffnen(ERST); a = await page.evaluate(() => ({
    abs: document.querySelector("[data-brief-feld=absender]")?.value, emp: document.querySelector("[data-brief-feld=empfaenger]")?.value,
    nr: document.querySelector("[data-brief-feld=nummern]")?.value, datum: document.querySelector(".intake-modal input[name=documentDate]")?.value,
    thema: document.querySelector("[data-brief-thema]")?.textContent || "" })); return JSON.stringify(a); });
  check(a.abs === "Stadtwerke Lindwurm GmbH", "Absender erkannt", a.abs);
  check(a.emp === "Erika Probe", "Empfänger getrennt vom Absender erkannt", a.emp);
  check(/4711-0815/.test(a.nr || ""), "Kundennummer erkannt", a.nr);
  check(a.datum === "2026-10-12", "Briefdatum ins Dokumentdatum übernommen", a.datum);
  check(/Energie/.test(a.thema), "Thema genannt", a.thema);
  await step("Absender von Hand ändern und speichern", async () => {
    await m.locator("[data-brief-feld=absender]").fill("Stadtwerke Lindwurm");
    await m.getByRole("button", { name: "Geprüft lokal speichern" }).click();
    await m.waitFor({ state: "detached", timeout: 20000 }); return "gespeichert"; });
  await step("Zweiter Brief mit derselben Kundennummer", async () => { await oeffnen(ZWEIT);
    await m.locator("[data-brief-gleich]").waitFor({ timeout: 15000 }).catch(() => {}); return "geöffnet"; });
  const gleich = await m.locator("[data-brief-gleich]").innerText().catch(() => "");
  check(/4711-0815/.test(gleich) && /Dokumentscan 2026-10-12/.test(gleich), "frühere Unterlage mit derselben Nummer genannt", gleich);
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Briefkopf im Eingang"));
