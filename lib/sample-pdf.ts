// Erzeugt kleine, gültige PDF-Dateien für die Beispieldaten – ganz ohne fremde Vorlagen.
// Jede Seite trägt ein großes Wasserzeichen „BEISPIEL“ und den Hinweis „frei erfunden“.

const WIN_ANSI_EXTRA: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "„": 0x84, "…": 0x85, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94,
  "•": 0x95, "–": 0x96, "—": 0x97,
};

function encodeWinAnsi(text: string): number[] {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0) || 63;
    if (WIN_ANSI_EXTRA[char] !== undefined) bytes.push(WIN_ANSI_EXTRA[char]);
    else if (code < 256) bytes.push(code);
    else bytes.push(63);
  }
  return bytes;
}

function pdfString(text: string): string {
  // Klammern und Backslash maskieren; Zeichen > 127 als Oktal-Escape, damit die Datei reines ASCII bleibt.
  return encodeWinAnsi(text).map((byte) => {
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) return `\\${String.fromCharCode(byte)}`;
    if (byte < 32 || byte > 126) return `\\${byte.toString(8).padStart(3, "0")}`;
    return String.fromCharCode(byte);
  }).join("");
}

function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) { lines.push(""); continue; }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if ((line ? `${line} ${word}` : word).length > width) { if (line) lines.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line);
  }
  return lines;
}

export type SamplePdfInput = {
  sender: string;
  recipient?: string;
  place: string;
  title: string;
  body: string;
};

export function createSamplePdf(input: SamplePdfInput): Uint8Array<ArrayBuffer> {
  const ops: string[] = [];
  // Wasserzeichen
  ops.push("q 0.93 0.95 0.97 rg BT /F2 110 Tf 0.7071 0.7071 -0.7071 0.7071 135 230 Tm (BEISPIEL) Tj ET Q");
  // Kopfzeile
  ops.push("q 0.043 0.192 0.329 rg 0 790 595 52 re f Q");
  ops.push(`BT /F2 11 Tf 1 1 1 rg 50 818 Td (${pdfString(input.sender)}) Tj ET`);
  ops.push(`BT /F1 8 Tf 1 1 1 rg 50 803 Td (${pdfString("Beispieldokument – alle Angaben sind frei erfunden")}) Tj ET`);
  let y = 750;
  if (input.recipient) {
    for (const line of input.recipient.split("\n")) { ops.push(`BT /F1 10 Tf 0.08 0.16 0.23 rg 50 ${y} Td (${pdfString(line)}) Tj ET`); y -= 14; }
    y -= 16;
  }
  ops.push(`BT /F1 10 Tf 0.38 0.44 0.5 rg 360 ${y + 8} Td (${pdfString(input.place)}) Tj ET`);
  y -= 18;
  for (const line of wrap(input.title, 60)) { ops.push(`BT /F2 15 Tf 0.043 0.192 0.329 rg 50 ${y} Td (${pdfString(line)}) Tj ET`); y -= 20; }
  y -= 8;
  for (const line of wrap(input.body, 92)) {
    if (y < 80) break;
    ops.push(`BT /F1 10.5 Tf 0.08 0.16 0.23 rg 50 ${y} Td (${pdfString(line)}) Tj ET`);
    y -= 15;
  }
  ops.push("q 0.85 0.89 0.92 RG 50 60 m 545 60 l S Q");
  ops.push(`BT /F1 8 Tf 0.38 0.44 0.5 rg 50 46 Td (${pdfString("Meine Familienakte · Beispieldaten – keine echten Personen, Orte, Firmen oder Nummern.")}) Tj ET`);
  const stream = ops.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    `<< /Title (${pdfString(input.title)}) /Producer (Meine Familienakte – Beispieldaten) >>`,
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => { offsets.push(out.length); out += `${index + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}
