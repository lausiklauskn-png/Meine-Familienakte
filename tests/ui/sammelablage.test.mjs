// 2.28.39 (Punkt 6): Sammelbestätigung in der Eingangszentrale. Sichere Vorschläge stehen angehakt, unsichere abgewählt;
// „✓ N ausgewählte ablegen“ speichert dieselben Felder wie der Einzel-Prüfdialog (Titel, Datum, Bereich, Textauszug,
// Hinweise), eine erkannte Frist nur mit eigenem Haken. Nichts ohne Bestätigung; „Gespeichert ✓“ an der Stelle.
// „Löschen“ entfernt noch nicht abgelegte Eingänge nach Rückfrage wirklich aus der Warteschlange. Alle Dateien erfunden.
import { startApp, launchBrowser, DESKTOP, ready, footer, check, step, summary, collectErrors } from "./_harness.mjs";
import { windowStub } from "./_stubs.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

function pdfZeilen(name, zeilen) {
  const stream = zeilen.map((z, i) => `BT /F1 12 Tf 50 ${780 - i * 22} Td (${z.replace(/[()\\]/g, "")}) Tj ET`).join("\n");
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"];
  let out = "%PDF-1.4\n"; const off = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return { name, mimeType: "application/pdf", buffer: Buffer.from(out, "latin1") };
}
const STROM = pdfZeilen("Rechnung_Stadtwerke_Wolkenfeld.pdf", ["Stadtwerke Wolkenfeld (erfunden)", "Rechnung Strom Abschlag", "Rechnungsdatum: 02.11.2026", "Kundennummer 778899", "Bitte zahlbar bis zum 16.11.2026."]);
const WASCH = pdfZeilen("Kaufbeleg_Waschmaschine_Lavorix.pdf", ["Kaufbeleg Waschmaschine Lavorix (erfunden)", "Kaufdatum: 14.07.2026", "Rechnung Elektro Bruchtal", "Seriennummer LAV-5521-ZZ"]);
const SCAN = pdfZeilen("scan_0003.pdf", ["Seite (erfunden)"]);
const WERBUNG = { name: "Werbung_Sonderangebot.txt", mimeType: "text/plain", buffer: Buffer.from("Sonderangebot nur heute (erfundene Werbung)") };

const app = await startApp();
const browser = await launchBrowser();
try {
  const page = await (await browser.newContext(DESKTOP)).newPage();
  page.setDefaultTimeout(15000);
  await page.addInitScript(windowStub);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  const register = () => page.evaluate(async () => { const f = window.__vaultFixture; return f.readLocalVaultData(await f.browserVault()); });
  const vorher = await register();
  const zeile = (text) => page.locator(".intake-queue-item", { hasText: text }).first();
  const leiste = page.locator('[data-auswahl-leiste="Eingänge"]');

  await footer(page, "Eingangszentrale");
  await page.locator(".central-intake input[type=file]:not([accept])").setInputFiles([STROM, WASCH, SCAN, WERBUNG]);
  for (const t of ["Stadtwerke Wolkenfeld", "Waschmaschine Lavorix", "scan 0003", "Werbung Sonderangebot"]) await zeile(t).locator(".badge:not(:has-text('läuft'))").first().waitFor({ timeout: 30000 });

  await step("Sichere Vorschläge sind angehakt, unsichere abgewählt (mit Grund in der Zeile)", async () => {
    const strom = await zeile("Stadtwerke Wolkenfeld").locator("[data-queue-wahl]").isChecked();
    const wasch = await zeile("Waschmaschine Lavorix").locator("[data-queue-wahl]").isChecked();
    const scan = await zeile("scan 0003").locator("[data-queue-wahl]").isChecked();
    const grund = await zeile("scan 0003").locator("[data-sammel-grund]").innerText();
    return soll(strom && wasch && !scan && /unsicher|nicht gelesen/.test(grund), { strom, wasch, scan, grund });
  });
  await step("Gemeinsame Auswahl-Leiste: „✓ N ausgewählte ablegen“ zählt nur Angehaktes", async () => {
    // Die Werbe-Textdatei kann je nach Einstufung angehakt sein; für diese Probe abwählen.
    const w = zeile("Werbung Sonderangebot").locator("[data-queue-wahl]"); if (await w.isChecked()) { await w.click(); await zeile("Werbung Sonderangebot").locator("[data-queue-wahl]:not(:checked)").waitFor(); }
    const knopf = await leiste.locator('[data-auswahl-aktion="ablegen"]').innerText();
    const zahl = await leiste.locator("[data-auswahl-zahl]").getAttribute("data-auswahl-zahl");
    return soll(/✓ 2 ausgewählte ablegen/.test(knopf) && zahl === "2", { knopf, zahl });
  });
  await step("Erkannte Frist hat ein eigenes Kästchen (aus), Datum TT.MM.JJJJ", async () => {
    const frist = zeile("Stadtwerke Wolkenfeld").locator("[data-sammel-frist] input");
    const aus = !(await frist.isChecked());
    const text = await zeile("Stadtwerke Wolkenfeld").locator("[data-sammel-frist]").innerText();
    await frist.check();
    return soll(aus && /16\.11\.2026/.test(text), text);
  });
  const anzahlVorher = (await register()).documents.length;
  await step("Nichts ist gespeichert, bevor „ablegen“ getippt wird", async () => soll(anzahlVorher === vorher.documents.length, { anzahlVorher, vorher: vorher.documents.length }));
  await step("„✓ 2 ausgewählte ablegen“: „Gespeichert ✓ 2 Dokumente“ an der Leiste und an beiden Zeilen", async () => {
    await leiste.locator('[data-auswahl-aktion="ablegen"]').click();
    await page.locator("[data-sammel-gespeichert]").waitFor({ timeout: 60000 });
    const text = await page.locator("[data-sammel-gespeichert]").innerText();
    const a = await zeile("Stadtwerke Wolkenfeld").locator("[data-gespeichert]").count();
    const b = await zeile("Waschmaschine Lavorix").locator("[data-gespeichert]").count();
    const scanOffen = await zeile("scan 0003").locator("[data-gespeichert]").count();
    return soll(/Gespeichert ✓ 2 Dokumente/.test(text) && a === 1 && b === 1 && scanOffen === 0, { text, a, b, scanOffen });
  });
  const nachher = await register();
  const strom = nachher.documents.find((d) => d.originalName === STROM.name);
  const wasch = nachher.documents.find((d) => d.originalName === WASCH.name);
  await step("Register: genau zwei neue Dokumente, Scan nicht abgelegt", async () => soll(nachher.documents.length === vorher.documents.length + 2 && strom && wasch && !nachher.documents.some((d) => d.originalName === SCAN.name), nachher.documents.map((d) => d.originalName)));
  await step("Felder wie im Prüfdialog: Titel, Dokumentdatum, Bereich, Textauszug, Hinweise", async () => soll(
    strom.titel && strom.documentDate === "2026-11-02" && /Kundennummer 778899/.test(strom.textAuszug || "") && strom.category && /Eingangszentrale: PDF · kontrolliert bestätigt/.test(strom.notes || "") && /FaWoGa:/.test(strom.notes || "")
    && wasch.titel && wasch.documentDate === "2026-07-14" && /LAV-5521-ZZ/.test(wasch.textAuszug || ""),
    { strom: [strom.titel, strom.documentDate, strom.category, strom.notes], wasch: [wasch.titel, wasch.documentDate] }));
  await step("Frist nur, wo angehakt: eine Frist 16.11.2026, mit dem Dokument verknüpft; keine weitere Verknüpfung", async () => {
    const neu = nachher.records.filter((r) => r.recordType === "deadline" && !vorher.records.some((v) => v.id === r.id));
    const verknuepft = neu.filter((r) => nachher.relations.some((rel) => rel.fromId === r.id && rel.toType === "document" && rel.toId === strom.id));
    const eigene = nachher.relations.filter((r) => r.fromType === "document" && (r.fromId === strom.id || r.fromId === wasch.id));
    return soll(neu.length === 1 && neu[0].data.dueAt === "2026-11-16" && verknuepft.length === 1 && eigene.length === 0, { neu: neu.map((r) => r.data.dueAt), verknuepft: verknuepft.length, eigene: eigene.length });
  });
  await step("✎ je Zeile öffnet den Einzel-Prüfdialog für den unsicheren Eingang", async () => {
    await zeile("scan 0003").locator("[data-einzeln-pruefen]").click();
    const modal = page.locator(".intake-modal"); await modal.waitFor();
    const name = await modal.locator(".drop-zone strong").innerText();
    await modal.locator("button", { hasText: "Abbrechen" }).click(); await modal.waitFor({ state: "detached" });
    return soll(/scan_0003\.pdf/.test(name), name);
  });
  await step("„Löschen“ fragt nach; „Abbrechen“ lässt den Eingang stehen", async () => {
    await zeile("Werbung Sonderangebot").locator("[data-queue-wahl]").click(); await zeile("Werbung Sonderangebot").locator("[data-queue-wahl]:checked").waitFor();
    await leiste.locator('[data-auswahl-aktion="loeschen"]').click();
    const dialog = page.locator(".page-dialog"); await dialog.waitFor();
    const frage = await dialog.innerText();
    await dialog.locator("button", { hasText: "Abbrechen" }).click();
    return soll(/aus der Warteschlange löschen/.test(frage) && await zeile("Werbung Sonderangebot").count() === 1, frage);
  });
  await step("„Löschen“ + „Ja, fortfahren“: Eingang weg, auch nach Neuladen; Abgelegtes bleibt", async () => {
    // Nur die Werbung ist angehakt (der Scan ist abgewählt).
    const gewaehlt = await leiste.locator("[data-auswahl-zahl]").getAttribute("data-auswahl-zahl");
    await leiste.locator('[data-auswahl-aktion="loeschen"]').click();
    await page.locator(".page-dialog button", { hasText: "Ja, fortfahren" }).click();
    await zeile("Werbung Sonderangebot").waitFor({ state: "detached" });
    await page.reload({ waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
    await footer(page, "Eingangszentrale");
    await zeile("scan 0003").waitFor();
    const werbung = await zeile("Werbung Sonderangebot").count();
    const docs = (await register()).documents.length;
    return soll(gewaehlt === "1" && werbung === 0 && docs === nachher.documents.length, { gewaehlt, werbung, docs });
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Sammelbestätigung"));
