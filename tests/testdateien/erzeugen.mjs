// Erzeugt den Satz erfundener Testdateien für den Dateieingang reproduzierbar neu.
// Aufruf: node tests/testdateien/erzeugen.mjs
// Alle Inhalte sind frei erfunden (Regeln aus NEUSTART_AUFTRAG.md): keine echten Personen,
// Orte, Firmen, Ärzte oder gültigen Nummern. Es werden keine fremden Pakete benötigt;
// nur das JPEG entsteht über das vorinstallierte Chromium (Playwright), weil Node keinen
// JPEG-Encoder mitbringt.
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const out = (name, bytes) => { writeFileSync(path.join(DIR, name), bytes); console.log(`✔ ${name} (${bytes.length} B)`); };
const enc = (text) => Buffer.from(text, "utf8");

// ---------- PDF (nach dem Muster von lib/sample-pdf.ts) ----------
function pdfString(text) {
  const extra = { "€": 0x80, "„": 0x84, "“": 0x93, "”": 0x94, "–": 0x96, "’": 0x92 };
  const bytes = [...text].map((ch) => extra[ch] ?? ((ch.codePointAt(0) || 63) < 256 ? ch.codePointAt(0) : 63));
  return bytes.map((b) => b === 0x28 || b === 0x29 || b === 0x5c ? `\\${String.fromCharCode(b)}` : b < 32 || b > 126 ? `\\${b.toString(8).padStart(3, "0")}` : String.fromCharCode(b)).join("");
}
function pdfFromObjects(objects, infoIndex) {
  let outText = "%PDF-1.4\n"; const offsets = [];
  const parts = [Buffer.from(outText, "latin1")]; let length = parts[0].length;
  objects.forEach((body, index) => {
    offsets.push(length);
    const head = Buffer.from(`${index + 1} 0 obj\n`, "latin1"); const tail = Buffer.from("\nendobj\n", "latin1");
    const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body, "latin1");
    parts.push(head, bodyBuffer, tail); length += head.length + bodyBuffer.length + tail.length;
  });
  const xref = length;
  let trailer = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  trailer += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R${infoIndex ? ` /Info ${infoIndex} 0 R` : ""} >>\nstartxref\n${xref}\n%%EOF\n`;
  parts.push(Buffer.from(trailer, "latin1"));
  return Buffer.concat(parts);
}
function textPdf({ sender, title, lines }) {
  const ops = ["q 0.93 0.95 0.97 rg BT /F2 110 Tf 0.7071 0.7071 -0.7071 0.7071 135 230 Tm (BEISPIEL) Tj ET Q",
    "q 0.043 0.192 0.329 rg 0 790 595 52 re f Q",
    `BT /F2 11 Tf 1 1 1 rg 50 818 Td (${pdfString(sender)}) Tj ET`,
    `BT /F1 8 Tf 1 1 1 rg 50 803 Td (${pdfString("Testdatei – alle Angaben sind frei erfunden")}) Tj ET`,
    `BT /F2 15 Tf 0.043 0.192 0.329 rg 50 740 Td (${pdfString(title)}) Tj ET`];
  let y = 710; for (const line of lines) { ops.push(`BT /F1 10.5 Tf 0.08 0.16 0.23 rg 50 ${y} Td (${pdfString(line)}) Tj ET`); y -= 15; }
  const stream = ops.join("\n");
  return pdfFromObjects([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    `<< /Title (${pdfString(title)}) /Producer (Meine Familienakte – Testdateien) >>`,
  ], 7);
}
// PDF ohne Textebene: eine Seite, die nur ein (selbst gezeichnetes) Bild enthält.
function imageOnlyPdf(rgb, width, height) {
  const data = zlib.deflateSync(rgb);
  const content = `q ${width * 2} 0 0 ${height * 2} 60 ${842 - 60 - height * 2} cm /Im1 Do Q`;
  const imageObject = Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${data.length} >>\nstream\n`, "latin1"), data, Buffer.from("\nendstream", "latin1")]);
  return pdfFromObjects([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>",
    imageObject,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ], 0);
}

// ---------- Bild: einfache "Belegzeichnung" als RGB-Rohdaten, PNG-Encoder mit zlib ----------
function drawReceipt(width, height) {
  const rgb = Buffer.alloc(width * height * 3, 0xf4);
  const px = (x, y, r, g, b) => { if (x < 0 || y < 0 || x >= width || y >= height) return; const i = (y * width + x) * 3; rgb[i] = r; rgb[i + 1] = g; rgb[i + 2] = b; };
  for (let y = 0; y < 24; y++) for (let x = 0; x < width; x++) px(x, y, 11, 49, 84);            // Kopfbalken
  for (let row = 0; row < 7; row++) for (let x = 20; x < width - 20 - row * 11; x++) for (let y = 0; y < 4; y++) px(x, 44 + row * 18 + y, 60, 60, 70); // Textzeilen
  for (let y = 190; y < 212; y++) for (let x = 20; x < 150; x++) px(x, y, 200, 40, 40);          // "Stempel"
  for (let i = 0; i < 60; i++) for (let y = 0; y < 30; y++) px(width - 90 + (i % 2 ? i : i + 1), 150 + y, 0, 0, 0); // Strichcode
  return rgb;
}
function crc32(buf) { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; }
function png(rgb, width, height) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (width * 3 + 1)] = 0; rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3); }
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, "latin1"), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
async function jpeg(pngBytes) {
  const { chromium } = createRequire(import.meta.url)("playwright");
  const browser = await chromium.launch(); const page = await browser.newPage();
  const dataUrl = await page.evaluate(async (base64) => {
    const img = new Image(); img.src = `data:image/png;base64,${base64}`; await img.decode();
    const canvas = document.createElement("canvas"); canvas.width = img.width; canvas.height = img.height;
    canvas.getContext("2d").drawImage(img, 0, 0); return canvas.toDataURL("image/jpeg", 0.85);
  }, pngBytes.toString("base64"));
  await browser.close();
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

// ---------- ZIP-Container (gespeichert, ohne Kompression) für DOCX/XLSX/ZIP ----------
function zip(entries) {
  const locals = [], centrals = []; let offset = 0;
  for (const [name, data] of entries) {
    const nameBuf = enc(name); const crc = crc32(data);
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6); local.writeUInt16LE(0, 8); local.writeUInt16LE(0, 10); local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0, 8); central.writeUInt16LE(0, 10); central.writeUInt16LE(0, 12); central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(nameBuf.length, 28); central.writeUInt16LE(0, 30); central.writeUInt16LE(0, 32); central.writeUInt16LE(0, 34); central.writeUInt16LE(0, 36); central.writeUInt32LE(0, 38); central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, data); centrals.push(central, nameBuf); offset += local.length + nameBuf.length + data.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const eocd = Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10); eocd.writeUInt32LE(centralSize, 12); eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, eocd]);
}
const xmlEscape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function docx(paragraphs) {
  return zip([
    ["[Content_Types].xml", enc(`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`)],
    ["_rels/.rels", enc(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`)],
    ["word/document.xml", enc(`<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs.map((p) => `<w:p><w:r><w:t>${xmlEscape(p)}</w:t></w:r></w:p>`).join("")}</w:body></w:document>`)],
  ]);
}
function xlsx(rows) {
  const cells = rows.map((row, r) => `<row r="${r + 1}">${row.map((v, c) => `<c r="${String.fromCharCode(65 + c)}${r + 1}" t="inlineStr"><is><t>${xmlEscape(String(v))}</t></is></c>`).join("")}</row>`).join("");
  return zip([
    ["[Content_Types].xml", enc(`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`)],
    ["_rels/.rels", enc(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)],
    ["xl/workbook.xml", enc(`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Nebenkosten" sheetId="1" r:id="rId1"/></sheets></workbook>`)],
    ["xl/_rels/workbook.xml.rels", enc(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`)],
    ["xl/worksheets/sheet1.xml", enc(`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${cells}</sheetData></worksheet>`)],
  ]);
}

// ---------- E-Mail (.eml) mit Anhängen ----------
function eml({ subject, from, to, date, body, attachments }) {
  const boundary = "----=_Testdatei_Grenze_0815";
  const parts = [
    `From: ${from}`, `To: ${to}`, `Subject: ${subject}`, `Date: ${date}`, `Message-ID: <${Math.random().toString(16).slice(2)}@beispiel.invalid>`,
    "MIME-Version: 1.0", `Content-Type: multipart/mixed; boundary="${boundary}"`, "",
    `--${boundary}`, "Content-Type: text/plain; charset=utf-8", "Content-Transfer-Encoding: 8bit", "", body, "",
  ];
  for (const [name, type, data] of attachments) {
    parts.push(`--${boundary}`, `Content-Type: ${type}; name="${name}"`, "Content-Transfer-Encoding: base64", `Content-Disposition: attachment; filename="${name}"`, "", data.toString("base64").replace(/(.{76})/g, "$1\r\n"), "");
  }
  parts.push(`--${boundary}--`, "");
  return Buffer.from(parts.join("\r\n"), "utf8");
}

// ================= Dateien =================
mkdirSync(DIR, { recursive: true });
const nebenkosten = textPdf({ sender: "Hausverwaltung Pustelblume (erfunden)", title: "Nebenkostenabrechnung 2025 – Arenberg-Hof 7, 99999 Nebelquell", lines: [
  "Mieter: Familie Lindqvist-Arenberg, Arenberg-Hof 7, 99999 Nebelquell (erfundener Ort)",
  "Abrechnungszeitraum: 01.01.2025 bis 31.12.2025. Vertragsnummer MV-000-TEST-1.",
  "Summe der umlagefähigen Nebenkosten: 2.345,00 EUR. Vorauszahlungen: 2.400,00 EUR.",
  "Guthaben zu Ihren Gunsten: 55,00 EUR. Bitte innerhalb von vier Wochen prüfen.",
  "Rückfragen bitte bis zum 30.11.2026 an die Hausverwaltung richten.",
  "Alle Angaben sind frei erfunden und dienen nur der Prüfung des Dateieingangs.",
] });
out("Nebenkostenabrechnung_2025_Arenberg-Hof.pdf", nebenkosten);
out("Kopie_Abrechnung_Pustelblume.pdf", nebenkosten); // Dublette: gleicher Inhalt, anderer Name
out("Garantiebeleg_Waschautomat_Lavorix.pdf", textPdf({ sender: "Elektrohaus Funkenflug (erfunden)", title: "Rechnung und Garantie – Waschautomat Lavorix WA-9 Beispiel", lines: [
  "Kaufdatum: 14.07.2026, Rechnungsnummer RE-TEST-12-3, Seriennummer LAV-00-BEISPIEL.",
  "Garantie bis 14.07.2028. Bei einem Schaden bitte diesen Beleg vorlegen.",
  "Alle Angaben sind frei erfunden.",
] }));
const belegRgb = drawReceipt(240, 320);
out("Scan_Garantiebeleg_nur_Bild.pdf", imageOnlyPdf(belegRgb, 240, 320));
const pngBytes = png(belegRgb, 240, 320);
out("Foto_Garantiebeleg_Lavorix.png", pngBytes);
out("Foto_Garantiebeleg_Lavorix_Seite2.jpg", await jpeg(pngBytes));
out("Mietvertrag_Arenberg-Hof_Nachtrag.docx", docx(["Nachtrag zum Mietvertrag MV-000-TEST-1 (Beispiel)", "Vermieter: Hausverwaltung Pustelblume (erfunden), Mieter: Familie Lindqvist-Arenberg.", "Die Miete für die Wohnung Arenberg-Hof 7 wird ab 01.01.2027 angepasst.", "Alle Angaben sind frei erfunden."]));
out("Nebenkosten_Uebersicht_2025.xlsx", xlsx([["Posten", "Betrag", "Hinweis"], ["Heizung", "980,00", "Beispiel"], ["Wasser", "410,00", "Beispiel"], ["Hausmeister", "320,00", "Beispiel"], ["Summe Nebenkosten", "2345,00", "frei erfunden"]]));
out("Notiz_Fahrradkauf_Velotrix.txt", enc("Notiz vom 03.09.2026: Fahrrad Velotrix Pendel 7 (erfundene Marke) gekauft, Rechnung RE-TEST-77, Garantie zwei Jahre. Das Schloss fehlt noch, bis zum 20.09.2026 nachkaufen.\n"));
out("Protokoll_Schulausflug.vtt", enc("WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nSchulausflug am 12.06.2026 nach Wolkenhain (erfundener Ort).\n\n00:00:04.000 --> 00:00:09.000\nBitte den Elternbrief bis zum 05.06.2026 unterschrieben zurückgeben.\n"));
out("Mail_Garantiefall_mit_PDF.eml", eml({ subject: "Garantiefall Waschautomat Lavorix – Antwort erforderlich", from: "service@funkenflug.invalid", to: "familie@lindqvist-arenberg.invalid", date: "Tue, 20 Oct 2026 09:30:00 +0200",
  body: "Guten Tag, bitte senden Sie uns die Seriennummer und den Kaufbeleg bis zum 05.11.2026. Alle Angaben sind frei erfunden.",
  attachments: [["Garantiebeleg_Waschautomat_Lavorix.pdf", "application/pdf", textPdf({ sender: "Elektrohaus Funkenflug (erfunden)", title: "Garantiebeleg Waschautomat Lavorix (Anlage)", lines: ["Anlage zur E-Mail. Frei erfunden."] })]] }));
out("Mail_Schulausflug_mit_Foto.eml", eml({ subject: "Schulausflug Wolkenhain – Foto und Elternbrief", from: "elternrat@schule-wolkenhain.invalid", to: "familie@lindqvist-arenberg.invalid", date: "Mon, 01 Jun 2026 18:00:00 +0200",
  body: "Liebe Eltern, anbei ein Foto vom letzten Ausflug. Der Elternbrief liegt als Textdatei bei.",
  attachments: [["Ausflug_Wolkenhain.png", "image/png", pngBytes], ["Elternbrief.txt", "text/plain", enc("Elternbrief: Bitte bis zum 05.06.2026 unterschreiben. Frei erfunden.")]] }));
// MSG: Ein echtes Outlook-MSG ist ein OLE/CFB-Container; ohne Bibliothek nicht erzeugbar.
// Die App liest .msg nur als UTF-16LE-Text (lib/document-intake.ts, extractDocumentIntakeTextHint).
// Diese Minimaldatei stellt genau das nach: UTF-16LE-Text mit Betreff und Inhalt.
out("Outlook_Nachricht_Stromtarif.msg", Buffer.from("﻿Betreff: Automatische Optimierung Ihres Stromtarifs (Vertragsportal, erfunden)\r\nBitte reichen Sie die fehlende Information bis zum 15.11.2026 nach.\r\n", "utf16le"));
out("Unterlagen_Umzug_Paket.zip", zip([["Umzugsliste.txt", enc("Umzug nach Nebelquell am 15.03.2027 (erfunden).")], ["Kuendigung_alte_Wohnung.pdf", textPdf({ sender: "Familie Lindqvist-Arenberg", title: "Kündigung der Wohnung Sternenweg 3 (erfunden)", lines: ["Hiermit kündigen wir zum 31.03.2027. Frei erfunden."] })], ["Foto_Schluessel.png", pngBytes]]));
out("Programm_nicht_erlaubt.exe", Buffer.from("MZ Dies ist keine ausfuehrbare Datei, nur ein Testname fuer einen nicht erlaubten Typ.", "latin1"));
console.log("Fertig. Die zu große Datei (> 20 MB) erzeugt die Probe zur Laufzeit unter tests/testdateien/.laufzeit/ (nicht im Repo).");
