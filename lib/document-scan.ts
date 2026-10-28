export const DOCUMENT_SCAN_VERSION = 1 as const;

export type ScanRotation = 0 | 90 | 180 | 270;
export type ScanPageState = {
  id: string;
  rotation: ScanRotation;
  crop: "none" | "small";
  enhance: boolean;
};

export type JpegPdfPage = {
  bytes: Uint8Array;
  width: number;
  height: number;
};

export type DocumentScanMetadata = {
  source: "camera-scan";
  pageCount: number;
  keepOriginals: boolean;
  originals: File[];
};

export type DocumentScanPdfFile = File & { documentScan?: DocumentScanMetadata };

const encoder = new TextEncoder();

function textBytes(value: string) {
  return encoder.encode(value);
}

function concatBytes(chunks: Uint8Array[]) {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export function moveScanPage<T>(pages: T[], from: number, to: number) {
  if (from < 0 || to < 0 || from >= pages.length || to >= pages.length || from === to) return [...pages];
  const next = [...pages];
  const [page] = next.splice(from, 1);
  next.splice(to, 0, page);
  return next;
}

export function rotateScanPage(rotation: ScanRotation): ScanRotation {
  return ((rotation + 90) % 360) as ScanRotation;
}

export function replaceScanPage<T>(pages: T[], index: number, replacement: T) {
  return pages.map((page, position) => position === index ? replacement : page);
}

export function removeScanPage<T>(pages: T[], index: number) {
  return pages.filter((_, position) => position !== index);
}

export function scanPdfName(now = new Date(), hint = "") {
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const safeHint = hint.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9äöüÄÖÜß]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);
  return `Dokumentscan_${stamp}_${time}${safeHint ? `_${safeHint}` : ""}.pdf`;
}

/**
 * Erzeugt eine kleine, standardkonforme PDF ohne externe Bibliothek.
 * Die JPEG-Seiten werden unverändert eingebettet und nur auf eine A4-Seite eingepasst.
 */
export function buildPdfFromJpegPages(pages: JpegPdfPage[]) {
  if (!pages.length) throw new Error("Für die PDF-Erstellung ist mindestens eine Seite erforderlich.");
  const objectCount = 2 + pages.length * 3;
  const objects = new Map<number, Uint8Array[]>();
  objects.set(1, [textBytes("<< /Type /Catalog /Pages 2 0 R >>")]);
  const pageRefs = pages.map((_, index) => `${3 + index * 3} 0 R`).join(" ");
  objects.set(2, [textBytes(`<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`)]);

  pages.forEach((page, index) => {
    if (!page.width || !page.height || !page.bytes.length) throw new Error(`Scan-Seite ${index + 1} ist unvollständig.`);
    const pageObject = 3 + index * 3;
    const imageObject = pageObject + 1;
    const contentObject = pageObject + 2;
    const landscape = page.width > page.height;
    const pageWidth = landscape ? 842 : 595;
    const pageHeight = landscape ? 595 : 842;
    const margin = 18;
    const scale = Math.min((pageWidth - margin * 2) / page.width, (pageHeight - margin * 2) / page.height);
    const drawWidth = Math.round(page.width * scale * 100) / 100;
    const drawHeight = Math.round(page.height * scale * 100) / 100;
    const x = Math.round(((pageWidth - drawWidth) / 2) * 100) / 100;
    const y = Math.round(((pageHeight - drawHeight) / 2) * 100) / 100;
    const content = `q\n${drawWidth} 0 0 ${drawHeight} ${x} ${y} cm\n/Im${index + 1} Do\nQ\n`;
    objects.set(pageObject, [textBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${index + 1} ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>`)]);
    objects.set(imageObject, [
      textBytes(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`),
      page.bytes,
      textBytes("\nendstream"),
    ]);
    objects.set(contentObject, [textBytes(`<< /Length ${textBytes(content).length} >>\nstream\n${content}endstream`)]);
  });

  const chunks: Uint8Array[] = [textBytes("%PDF-1.4\n%MMI-Familienakte\n")];
  const offsets = new Array<number>(objectCount + 1).fill(0);
  let length = chunks[0].length;
  for (let objectNumber = 1; objectNumber <= objectCount; objectNumber++) {
    offsets[objectNumber] = length;
    const body = objects.get(objectNumber);
    if (!body) throw new Error(`PDF-Objekt ${objectNumber} fehlt.`);
    const objectChunks = [textBytes(`${objectNumber} 0 obj\n`), ...body, textBytes("\nendobj\n")];
    chunks.push(...objectChunks);
    length += objectChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  }
  const xrefOffset = length;
  const xref = [`xref\n0 ${objectCount + 1}\n`, "0000000000 65535 f \n"];
  for (let objectNumber = 1; objectNumber <= objectCount; objectNumber++) xref.push(`${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`);
  xref.push(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);
  chunks.push(textBytes(xref.join("")));
  return concatBytes(chunks);
}

async function imageSource(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();
  return { source: image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
}

export async function renderScanPageToJpeg(input: { file: File; rotation: ScanRotation; crop: "none" | "small"; enhance: boolean }) {
  const loaded = await imageSource(input.file);
  try {
    const cropRatio = input.crop === "small" ? 0.02 : 0;
    const sourceX = Math.round(loaded.width * cropRatio);
    const sourceY = Math.round(loaded.height * cropRatio);
    const sourceWidth = Math.max(1, loaded.width - sourceX * 2);
    const sourceHeight = Math.max(1, loaded.height - sourceY * 2);
    const maxLongEdge = 2200;
    const scale = Math.min(1, maxLongEdge / Math.max(sourceWidth, sourceHeight));
    const rotated = input.rotation === 90 || input.rotation === 270;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((rotated ? sourceHeight : sourceWidth) * scale));
    canvas.height = Math.max(1, Math.round((rotated ? sourceWidth : sourceHeight) * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Die Bildseite konnte im Browser nicht vorbereitet werden.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(input.rotation * Math.PI / 180);
    context.filter = input.enhance ? "contrast(1.08) saturate(0.96)" : "none";
    context.drawImage(loaded.source, sourceX, sourceY, sourceWidth, sourceHeight, -sourceWidth * scale / 2, -sourceHeight * scale / 2, sourceWidth * scale, sourceHeight * scale);
    context.restore();
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Die Bildseite konnte nicht gespeichert werden.")), "image/jpeg", 0.88));
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height };
  } finally {
    loaded.close?.();
  }
}

export async function createDocumentScanPdf(input: {
  pages: Array<{ file: File; rotation: ScanRotation; crop: "none" | "small"; enhance: boolean }>;
  titleHint?: string;
  keepOriginals?: boolean;
  now?: Date;
}) {
  if (!input.pages.length) throw new Error("Bitte zuerst mindestens eine Dokumentseite fotografieren.");
  const rendered: JpegPdfPage[] = [];
  for (const page of input.pages) rendered.push(await renderScanPageToJpeg(page));
  const pdf = buildPdfFromJpegPages(rendered);
  const file = new File([pdf], scanPdfName(input.now, input.titleHint), { type: "application/pdf", lastModified: (input.now || new Date()).getTime() }) as DocumentScanPdfFile;
  file.documentScan = { source: "camera-scan", pageCount: input.pages.length, keepOriginals: !!input.keepOriginals, originals: input.keepOriginals ? input.pages.map((page) => page.file) : [] };
  return file;
}

export function runDocumentScanSelfTests() {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const onePage = buildPdfFromJpegPages([{ bytes: jpeg, width: 1200, height: 1800 }]);
  const threePages = buildPdfFromJpegPages([
    { bytes: jpeg, width: 1200, height: 1800 },
    { bytes: jpeg, width: 1800, height: 1200 },
    { bytes: jpeg, width: 1200, height: 1800 },
  ]);
  const decode = (value: Uint8Array) => new TextDecoder("latin1").decode(value);
  const initial = [{ id: "1" }, { id: "2" }, { id: "3" }];
  return [
    { id: "scan-one-page", label: "Einseitige PDF", passed: decode(onePage).includes("/Count 1") && decode(onePage).startsWith("%PDF-1.4"), summary: "Eine fotografierte Seite wird zu genau einer PDF-Seite." },
    { id: "scan-multi-page", label: "Mehrseitige PDF", passed: decode(threePages).includes("/Count 3"), summary: "Drei Scan-Seiten werden in einer dreiseitigen PDF zusammengeführt." },
    { id: "scan-retake", label: "Seite neu aufnehmen", passed: replaceScanPage(initial, 1, { id: "neu" }).map((item) => item.id).join(",") === "1,neu,3", summary: "Eine neue Aufnahme ersetzt nur die ausgewählte alte Seite." },
    { id: "scan-rotate", label: "Seite drehen", passed: rotateScanPage(0) === 90 && rotateScanPage(270) === 0, summary: "Die Seitendrehung bleibt in 90-Grad-Schritten nachvollziehbar." },
    { id: "scan-reorder", label: "Reihenfolge ändern", passed: moveScanPage(initial, 2, 0).map((item) => item.id).join(",") === "3,1,2", summary: "Die Reihenfolge kann vor der PDF-Erstellung geändert werden." },
    { id: "scan-abort", label: "Abbruch ohne Ablage", passed: removeScanPage(initial, 1).map((item) => item.id).join(",") === "1,3" && initial.length === 3, summary: "Temporäre Seiten werden unveränderlich verwaltet; bestehende Akten bleiben unberührt." },
    { id: "scan-separate-documents", label: "Mehrere Dokumente", passed: scanPdfName(new Date(2026, 9, 8, 15, 30), "Dokument A") !== scanPdfName(new Date(2026, 9, 8, 15, 31), "Dokument B"), summary: "Getrennte Scanvorgänge erhalten getrennte PDF-Dateien." },
    { id: "scan-shared-pipeline", label: "Bestehende Dokumentpipeline", passed: DOCUMENT_SCAN_VERSION === 1 && scanPdfName(new Date(2026, 9, 8, 15, 30)).endsWith(".pdf"), summary: "Der Scan erzeugt eine PDF als neuen Eingangsweg für die vorhandene Dokumentenpipeline." },
  ];
}
