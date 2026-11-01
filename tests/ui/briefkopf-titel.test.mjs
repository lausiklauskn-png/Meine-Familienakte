// Klaus 2026-11-01 (Antwort 4): „Brief von …, Datum“ als Titel-Vorschlag im Eingang. Baustein briefkopf.js aus Workflow PDF (byte-1:1
// im Klon), gelesen aus der Textebene des PDF. Geprüft: erfundener Brief mit Absender (Rechtsform) und „Datum:“ → Vorschlag
// „Brief von <Absender>, <TT.MM.JJJJ>“ · ohne erkennbaren Absender bleibt der alte Titel (nie geraten).
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
const BRIEF = briefPdf("Dokumentscan 2026-11-01.pdf", ["Lindwurm Versand GmbH, Postfach 12 34, 12345 Musterstadt", "", "Frau Erika Probe", "Wiesenweg 3", "54321 Beispielort",
  "", "Datum: 12.10.2026", "Kundennummer: 4711-0815", "Betreff: Ihre Bestellung vom 01.10.2026", "", "Sehr geehrte Frau Probe,", "vielen Dank fuer Ihre Bestellung.",
  "Mit freundlichen Gruessen", "Lindwurm Versand GmbH"]);
const OHNE = briefPdf("Notizzettel Einkauf.pdf", ["Milch", "Brot", "Tomaten"]);

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext({ ...DESKTOP, serviceWorkers: "block" })).newPage();
  page.setDefaultTimeout(30000);
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  const titel = async (datei, warte) => {
    await footer(page, "Eingangszentrale");
    await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([datei]);
    const q = page.locator(".intake-queue-item").first();
    await q.locator("button", { hasText: "Zuordnung prüfen" }).click();
    const kopf = page.locator(".intake-modal .intake-analysis-head strong");
    await page.locator(".intake-modal").getByText("Text gelesen").first().waitFor({ timeout: 30000 });
    if (warte) await page.locator(".intake-modal .intake-analysis-head strong", { hasText: warte }).waitFor({ timeout: 15000 }).catch(() => {});
    else await page.waitForTimeout(1500);
    const t = await kopf.innerText();
    await page.locator(".intake-modal").getByRole("button", { name: /Abbrechen|Schließen/ }).first().click().catch(() => page.keyboard.press("Escape"));
    await page.locator(".intake-modal").waitFor({ state: "detached", timeout: 10000 }).catch(() => {});
    return t;
  };
  let t1 = "";
  await step("Brief mit Absender und Datum: Vorschlag „Brief von …, Datum“", async () => { t1 = await titel(BRIEF, "Brief von"); return t1; });
  check(t1 === "Brief von Lindwurm Versand GmbH, 12.10.2026", "Titel genau „Brief von Lindwurm Versand GmbH, 12.10.2026“", t1);
  let t2 = "";
  await step("Zettel ohne Briefkopf: der alte Titel bleibt", async () => { t2 = await titel(OHNE, null); return t2; });
  check(!/Brief von/.test(t2) && /Notizzettel/.test(t2), "Ohne Absender kein geratener Briefkopf", t2);
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Briefkopf als Titel-Vorschlag"));
