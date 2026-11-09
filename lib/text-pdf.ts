// Abschnitt D (09.11., Klaus d4): Antwortbrief als PDF für „In Workflow PDF öffnen“ (dort Briefkopf, Unterschrift, Drucken).
// Kleinster PDF-Schreiber ohne Fremdpaket: A4, Helvetica 11 pt, WinAnsi (Umlaute, ß, €), Zeilenumbruch, mehrere Seiten.

const WINANSI_EXTRA: Record<string, number> = { "€": 0x80, "‚": 0x82, "„": 0x84, "…": 0x85, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97 };

function winAnsi(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (WINANSI_EXTRA[ch] !== undefined) out.push(WINANSI_EXTRA[ch]);
    else if (c >= 0x20 && c <= 0x7e) out.push(c);
    else if (c >= 0xa0 && c <= 0xff) out.push(c);
    else out.push(0x3f); // „?“ für Zeichen außerhalb WinAnsi (z. B. Platzhalter ⟦ ⟧)
  }
  return out;
}

function pdfString(bytes: number[]): string {
  let s = "(";
  for (const b of bytes) s += b === 0x28 || b === 0x29 || b === 0x5c ? `\\${String.fromCharCode(b)}` : b < 0x20 || b > 0x7e ? `\\${b.toString(8).padStart(3, "0")}` : String.fromCharCode(b);
  return `${s})`;
}

/** Zeilen umbrechen: höchstens `breite` Zeichen, an Leerzeichen; Absätze bleiben. */
export function zeilenUmbrechen(text: string, breite = 88): string[] {
  const zeilen: string[] = [];
  for (const absatz of text.replace(/\r\n?/g, "\n").split("\n")) {
    if (!absatz.trim()) { zeilen.push(""); continue; }
    let zeile = "";
    for (const wort of absatz.split(/\s+/)) {
      if (!zeile) zeile = wort;
      else if ((zeile + " " + wort).length <= breite) zeile += " " + wort;
      else { zeilen.push(zeile); zeile = wort; }
      while (zeile.length > breite) { zeilen.push(zeile.slice(0, breite)); zeile = zeile.slice(breite); }
    }
    zeilen.push(zeile);
  }
  return zeilen;
}

/** Text → PDF-Bytes (A4 595×842 pt, Rand 64 pt, 15 pt Zeilenabstand, 48 Zeilen je Seite). */
export function textAlsPdf(text: string, titel = "Brief"): Uint8Array {
  const zeilen = zeilenUmbrechen(text);
  const proSeite = 48;
  const seiten: string[][] = [];
  for (let i = 0; i < Math.max(1, zeilen.length); i += proSeite) seiten.push(zeilen.slice(i, i + proSeite));
  const objekte: string[] = [];
  const fontNr = 3, ersteSeite = 4;
  objekte[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objekte[2] = `<< /Type /Pages /Kids [${seiten.map((_, i) => `${ersteSeite + i * 2} 0 R`).join(" ")}] /Count ${seiten.length} >>`;
  objekte[fontNr] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  seiten.forEach((z, i) => {
    const inhalt = `BT /F1 11 Tf 15 TL 64 778 Td\n${z.map((zeile) => `${pdfString(winAnsi(zeile))} Tj T*`).join("\n")}\nET`;
    objekte[ersteSeite + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontNr} 0 R >> >> /Contents ${ersteSeite + i * 2 + 1} 0 R >>`;
    objekte[ersteSeite + i * 2 + 1] = `<< /Length ${inhalt.length} >>\nstream\n${inhalt}\nendstream`;
  });
  const info = objekte.length;
  objekte[info] = `<< /Title ${pdfString(winAnsi(titel))} /Producer (Familienakte) >>`;
  let pdf = "%PDF-1.4\n%âãÏÓ\n";
  const lagen: number[] = [];
  for (let n = 1; n < objekte.length; n++) { lagen[n] = pdf.length; pdf += `${n} 0 obj\n${objekte[n]}\nendobj\n`; }
  const xref = pdf.length;
  pdf += `xref\n0 ${objekte.length}\n0000000000 65535 f \n${lagen.slice(1).map((l) => `${String(l).padStart(10, "0")} 00000 n \n`).join("")}`;
  pdf += `trailer\n<< /Size ${objekte.length} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  // Alle Zeichen liegen unter 256 (latin1) – Byte für Byte übernehmen, damit die xref-Lagen stimmen.
  return Uint8Array.from(pdf, (c) => c.charCodeAt(0) & 0xff);
}

export function runTextPdfSelfTests() {
  const bytes = textAlsPdf("Sehr geehrter Herr Brandt,\n\nich bitte um Ratenzahlung über 412,50 € – in drei Teilen (Grüße).\n" + "Lange Zeile ".repeat(200), "Antwort");
  const s = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  const xref = Number(s.match(/startxref\n(\d+)/)?.[1]);
  const ersteLage = Number(s.match(/xref\n0 \d+\n0000000000 65535 f \n(\d{10})/)?.[1]);
  return [
    { label: "Kopf und Ende", passed: s.startsWith("%PDF-1.4") && s.trimEnd().endsWith("%%EOF"), summary: "PDF beginnt mit %PDF-1.4 und endet mit %%EOF" },
    { label: "xref stimmt", passed: s.slice(xref, xref + 4) === "xref" && s.slice(ersteLage, ersteLage + 7) === "1 0 obj", summary: "Querverweis und erste Objektlage zeigen auf die richtigen Bytes" },
    { label: "Umlaute und €", passed: s.includes("\\200") && s.includes("Gr\\374\\337e") && s.includes("\\(Gr"), summary: "€, ü, ß als WinAnsi, Klammern maskiert" },
    { label: "Umbruch", passed: zeilenUmbrechen("a ".repeat(100), 20).every((z) => z.length <= 20), summary: "Zeilen höchstens so breit wie verlangt" },
  ];
}
