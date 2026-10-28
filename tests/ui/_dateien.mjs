// Kleine, erfundene Probe-Dateien im Speicher (für setInputFiles). Keine echten Inhalte.
import { deflateSync } from "node:zlib";

/** Minimal gültiges PDF mit einer Seite und einem Text. */
export function probePdf(text = "Probe-Rechnung Waschwunder 7 (erfunden)") {
  const stream = `BT /F1 18 Tf 50 740 Td (${text.replace(/[()\\]/g, "")}) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n"; const offsets = [];
  objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return { name: "Probe_Rechnung.pdf", mimeType: "application/pdf", buffer: Buffer.from(out, "latin1") };
}
/** Kleines PNG (einfarbig, w×h). */
export function probePng(name = "Probe_Foto.png", w = 64, h = 48, rgb = [200, 180, 120]) {
  const crc = (buf) => { let c, crcTable = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; } let v = 0xffffffff; for (const b of buf) v = crcTable[(v ^ b) & 0xff] ^ (v >>> 8); return (v ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = rgb[0]; raw[o + 1] = rgb[1]; raw[o + 2] = (rgb[2] + x) & 255; } }
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
  return { name, mimeType: "image/png", buffer: png };
}
export const probeTxt = (name = "Probe_Notiz.txt", text = "Erfundene Notiz: Zählerstand Strom 12345 (Beispiel).") => ({ name, mimeType: "text/plain", buffer: Buffer.from(text, "utf8") });
export function probeEml() {
  const pdf = probePdf("Anlage zur Probe-Mail (erfunden)");
  const eml = ["From: Hausverwaltung Pustelblume <post@pustelblume.beispiel>", "To: familie@lindqvist-arenberg.beispiel", "Subject: Probe-Mail mit Anlage (erfunden)", "Date: Mon, 26 Oct 2026 10:00:00 +0100", "Message-ID: <probe-1@pustelblume.beispiel>", "MIME-Version: 1.0", 'Content-Type: multipart/mixed; boundary="grenze"', "", "--grenze", "Content-Type: text/plain; charset=utf-8", "", "Guten Tag, anbei die erfundene Anlage.", "", "--grenze", 'Content-Type: application/pdf; name="Anlage_Probe.pdf"', "Content-Transfer-Encoding: base64", 'Content-Disposition: attachment; filename="Anlage_Probe.pdf"', "", pdf.buffer.toString("base64").replace(/(.{76})/g, "$1\n"), "--grenze--", ""].join("\r\n");
  return { name: "Probe_Mail.eml", mimeType: "message/rfc822", buffer: Buffer.from(eml, "utf8") };
}
