/** P4: Fotos und Foto-PDFs über der Gerätegrenze verkleinern, ohne die Texterkennung einzuschränken (Klaus 07.11.).
 *  1. Qualität 80 %, dann 72 % bei voller Auflösung. 2. Kante kleiner, nie unter 300 dpi (A4). 3. Gegenprobe mit der
 *  vorhandenen Texterkennung (Tesseract aus Workflow PDF): erkennt die kleine Fassung unter 98 % der Wörter, wird sie verworfen.
 *  4. Passt nichts: nicht weiter verkleinern. Das große Original wird nicht aufbewahrt (Frage a). */
import { buildPdfFromJpegPages, type JpegPdfPage } from "../lib/document-scan";
import { MIN_KANTE_300DPI, textGeprueft, trefferQuote, verkleinerStufen, verkleinertNotiz } from "../lib/geraete-grenze";
import { loadPdfJs } from "./file-viewer";

export type VerkleinerErgebnis =
  | { ok: true; file: File; vonBytes: number; notiz: string; quote: number }
  | { ok: false; grund: "kein-foto" | "pdf-mit-text" | "zu-gross" | "text-leidet"; text: string };
export type Schritt = (text: string) => void;

const istBild = (f: File) => /^image\/(jpeg|png|webp)$/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name);
const istPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);
export const verkleinerbar = (f: File) => istBild(f) || istPdf(f);

const leinwand = (b: number, h: number) => { const c = document.createElement("canvas"); c.width = b; c.height = h; return c; };
const alsJpeg = (c: HTMLCanvasElement, q: number) => new Promise<Blob>((ok, nein) => c.toBlob((b) => b ? ok(b) : nein(Error("Bild konnte nicht gespeichert werden.")), "image/jpeg", q));
async function ocrText(c: HTMLCanvasElement) {
  const { ocrZeilen } = await import("./wfpdf-kern");
  return (await ocrZeilen(c)).map((z) => z.text).join("\n");
}
function zeichnen(quelle: CanvasImageSource, b: number, h: number, kante: number) {
  const f = Math.min(1, kante / Math.max(b, h));
  const c = leinwand(Math.round(b * f), Math.round(h * f)), x = c.getContext("2d")!;
  x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.imageSmoothingQuality = "high";
  x.drawImage(quelle, 0, 0, c.width, c.height); return c;
}
const jpegName = (name: string) => name.replace(/\.(png|webp|jpe?g)$/i, "") + ".jpg";

export async function verkleinern(file: File, grenze: number, schritt: Schritt = () => {}): Promise<VerkleinerErgebnis> {
  if (istBild(file)) return bildVerkleinern(file, grenze, schritt);
  if (istPdf(file)) return pdfVerkleinern(file, grenze, schritt);
  return { ok: false, grund: "kein-foto", text: "Diese Datei besteht nicht aus Fotos und lässt sich nicht verkleinern. Bitte am Rechner ablegen." };
}

async function bildVerkleinern(file: File, grenze: number, schritt: Schritt): Promise<VerkleinerErgebnis> {
  const bmp = await createImageBitmap(file);
  try {
    let gewaehlt: { blob: Blob; c: HTMLCanvasElement } | null = null;
    for (const s of verkleinerStufen(bmp.width, bmp.height)) {
      schritt(`Verkleinere: Kante ${s.kante} px, Qualität ${Math.round(s.qualitaet * 100)} % …`);
      const c = zeichnen(bmp, bmp.width, bmp.height, s.kante), blob = await alsJpeg(c, s.qualitaet);
      if (blob.size <= grenze) { gewaehlt = { blob, c }; break; }
      c.width = c.height = 0;
    }
    if (!gewaehlt) return { ok: false, grund: "zu-gross", text: `Auch mit 300 dpi bleibt das Foto zu groß für dieses Gerät. Bitte am Rechner ablegen.` };
    schritt("Gegenprobe: Texterkennung auf Original und verkleinerter Fassung …");
    const original = zeichnen(bmp, bmp.width, bmp.height, Math.max(bmp.width, bmp.height));
    const textOriginal = await ocrText(original); original.width = original.height = 0;
    const kleinBild = await createImageBitmap(gewaehlt.blob);
    const klein = zeichnen(kleinBild, kleinBild.width, kleinBild.height, Math.max(kleinBild.width, kleinBild.height)); kleinBild.close();
    const textKlein = await ocrText(klein); klein.width = klein.height = 0; gewaehlt.c.width = gewaehlt.c.height = 0;
    const q = trefferQuote(textOriginal, textKlein);
    if (!textGeprueft(q)) return { ok: false, grund: "text-leidet", text: `Die verkleinerte Fassung erkennt nur ${Math.round(q.quote * 100)} % der Wörter. Sie wird verworfen; bitte am Rechner ablegen.` };
    return { ok: true, file: new File([gewaehlt.blob], jpegName(file.name), { type: "image/jpeg", lastModified: file.lastModified }), vonBytes: file.size, notiz: verkleinertNotiz(file.size, q), quote: q.quote };
  } finally { bmp.close(); }
}

type PdfSeite = { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> }; getTextContent: () => Promise<{ items: Array<{ str?: string }> }> };
type PdfDok = { numPages: number; getPage: (n: number) => Promise<PdfSeite>; destroy?: () => void };

async function seiteZeichnen(seite: PdfSeite, kante: number) {
  const v1 = seite.getViewport({ scale: 1 }), vp = seite.getViewport({ scale: kante / Math.max(v1.width, v1.height) });
  const c = leinwand(Math.round(vp.width), Math.round(vp.height)), x = c.getContext("2d")!;
  x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
  await seite.render({ canvasContext: x, viewport: vp }).promise; return c;
}

async function pdfVerkleinern(file: File, grenze: number, schritt: Schritt): Promise<VerkleinerErgebnis> {
  const lib = await loadPdfJs() as unknown as { getDocument: (o: { data: Uint8Array }) => { promise: Promise<PdfDok> } };
  const pdf = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  try {
    for (let n = 1; n <= pdf.numPages; n++) {
      const t = await (await pdf.getPage(n)).getTextContent();
      if (t.items.some((i) => (i.str || "").trim())) return { ok: false, grund: "pdf-mit-text", text: "Dieses PDF hat eine eigene Textebene und besteht nicht nur aus Fotos. Es lässt sich nicht verkleinern; bitte am Rechner ablegen." };
    }
    for (const qualitaet of [0.8, 0.72]) {
      const seiten: JpegPdfPage[] = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        schritt(`Seite ${n} von ${pdf.numPages} mit 300 dpi, Qualität ${Math.round(qualitaet * 100)} % …`);
        const c = await seiteZeichnen(await pdf.getPage(n), MIN_KANTE_300DPI);
        const blob = await alsJpeg(c, qualitaet);
        seiten.push({ bytes: new Uint8Array(await blob.arrayBuffer()), width: c.width, height: c.height } as JpegPdfPage);
        c.width = c.height = 0;
      }
      const bytes = buildPdfFromJpegPages(seiten);
      if (bytes.length > grenze) continue;
      const neu = new File([bytes as BlobPart], file.name, { type: "application/pdf", lastModified: file.lastModified });
      schritt("Gegenprobe: Texterkennung auf Original und verkleinerter Fassung …");
      const kleinPdf = await lib.getDocument({ data: new Uint8Array(bytes) }).promise;
      let a = "", b = "";
      try {
        for (let n = 1; n <= Math.min(pdf.numPages, 3); n++) {
          const o = await seiteZeichnen(await pdf.getPage(n), 4200); a += `${await ocrText(o)}\n`; o.width = o.height = 0;
          const k = await seiteZeichnen(await kleinPdf.getPage(n), MIN_KANTE_300DPI); b += `${await ocrText(k)}\n`; k.width = k.height = 0;
        }
      } finally { kleinPdf.destroy?.(); }
      const q = trefferQuote(a, b);
      if (!textGeprueft(q)) return { ok: false, grund: "text-leidet", text: `Die verkleinerte Fassung erkennt nur ${Math.round(q.quote * 100)} % der Wörter. Sie wird verworfen; bitte am Rechner ablegen.` };
      return { ok: true, file: neu, vonBytes: file.size, notiz: verkleinertNotiz(file.size, q), quote: q.quote };
    }
    return { ok: false, grund: "zu-gross", text: "Auch mit 300 dpi bleibt das PDF zu groß für dieses Gerät. Bitte am Rechner ablegen." };
  } finally { pdf.destroy?.(); }
}
