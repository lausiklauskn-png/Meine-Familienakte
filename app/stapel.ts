// „Stapel direkt übernehmen“ (Klaus 2026-11-01): viele Fotos oder Scans auf einmal, ohne jedes Blatt einzeln zu prüfen.
// Je Bild: Blatt finden mit den drei Meinungen von Workflow PDF (blatt.js, Scanic-Kanten, Scanic-Modell → ScanBild.entscheiden),
// sind sich zwei einig („sicher“), wird das Blatt verzerrungsfrei gerade gezogen (ScanBild.seitenMass/entzerren, Seitengröße
// automatisch); sonst bleibt das GANZE Foto stehen (nie still schneiden) und die Unterlage heißt „… (Ecken prüfen)“ — nacharbeiten
// einzeln über „In Workflow PDF öffnen“ → ✂️ Zuschneiden. PDFs (vom Scanner) gehen unverändert durch.
// Rechnung byte-1:1 aus Workflow PDF (public/wfpdf/scan-bild.js, blatt.js; Scanic im Klon), hier nur der Ablauf.
import { basis, vendorBasis } from "./wfpdf-kern";

type Ecken = number[][];
type ScanBild = {
  entscheiden: (ein: Record<string, unknown>, w: number, h: number) => { ecken: Ecken; sicher: boolean; grund: string; quelle: string };
  seitenMass: (ecken: Ecken, format: string, dpi: number) => { W: number; H: number; seite: [number, number]; format: string };
  entzerren: (src: ImageData, ecken: Ecken, W: number, H: number) => { data: Uint8ClampedArray; width: number; height: number };
  ausScanic: (c: unknown) => Ecken;
  filtern: (img: ImageData, modus: string, opt: { schaerfe?: number }) => ImageData;
  ganz: (w: number, h: number) => Ecken;
};
type Fenster = Window & { WFP?: { ScanBild?: ScanBild; Blatt?: { finden: (c: HTMLCanvasElement) => { sicher: boolean; ecken: Ecken } } };
  PDFLib?: { PDFDocument: { create: () => Promise<PdfDok>; load: (b: Uint8Array, o?: unknown) => Promise<PdfDok> } } };
type PdfDok = { embedJpg: (b: Uint8Array) => Promise<unknown>; addPage: (s: [number, number] | unknown) => { drawImage: (i: unknown, o: Record<string, number>) => void }; save: () => Promise<Uint8Array>; setProducer: (s: string) => void; setCreator: (s: string) => void;
  copyPages: (von: PdfDok, idx: number[]) => Promise<unknown[]>; getPageIndices: () => number[] };
/** Filter wie im Scanner von Workflow PDF (ScanBild.FILTER) und Schärfe 0–100. */
export type StapelEinst = { filter: "original" | "farbe" | "grau" | "dokument" | "sw"; schaerfe: number; zusammen: boolean };
export const STAPEL_VORGABE: StapelEinst = { filter: "original", schaerfe: 40, zusammen: false };
export const FILTER_NAMEN: Record<StapelEinst["filter"], string> = { original: "Original", farbe: "Farbe verbessern", grau: "Graustufen", dokument: "Dokument (Schatten weg, Papier weiß)", sw: "Schwarzweiß" };
export type StapelErgebnis = { file: File; sicher: boolean; grund: string; quelle: string; seite?: [number, number]; vorschau?: Blob };

const DPI = 200;
const LANG_MAX = 2400;
const w = () => window as Fenster;
const geladen = new Map<string, Promise<void>>();
function skript(url: string) {
  let p = geladen.get(url);
  if (!p) { p = new Promise<void>((ok, nein) => { const s = document.createElement("script"); s.src = url; s.async = false; s.onload = () => ok(); s.onerror = () => nein(new Error("Baustein von Workflow PDF fehlt.")); document.head.appendChild(s); }); geladen.set(url, p); p.catch(() => geladen.delete(url)); }
  return p;
}
async function kern() {
  for (const d of ["pdf-lib.min.js", "scan-bild.js", "blatt.js"]) await skript(new URL(d, basis()).href);
}
let scanic: Promise<{ scanDocument: (c: HTMLCanvasElement, o?: unknown) => Promise<{ success?: boolean; corners?: unknown; score?: number }> } | null> | null = null;
function scanicLaden() {
  if (!scanic) scanic = import(/* @vite-ignore */ `${vendorBasis()}scanic/scanic.js`).catch(() => null);
  return scanic;
}
async function bildLesen(file: File) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const f = Math.min(1, LANG_MAX / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * f); c.height = Math.round(bmp.height * f);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.();
  return c;
}
/** Großes Vorschaubild (lange Kante 1400 px) — gezeigt wird es erst beim Antippen einer Zeile. */
async function vorschauAus(c: HTMLCanvasElement) {
  const f = Math.min(1, 1400 / Math.max(c.width, c.height));
  const v = document.createElement("canvas"); v.width = Math.round(c.width * f); v.height = Math.round(c.height * f);
  v.getContext("2d")!.drawImage(c, 0, 0, v.width, v.height);
  return await new Promise<Blob>((ok, nein) => v.toBlob((b) => b ? ok(b) : nein(new Error("Vorschau nicht erzeugt.")), "image/jpeg", 0.85));
}
/** Ein Bild → ein PDF (eine Seite). */
export async function stapelSeite(file: File, einst: StapelEinst = STAPEL_VORGABE): Promise<StapelErgebnis> {
  await kern();
  const SB = w().WFP!.ScanBild!, c = await bildLesen(file), ein: Record<string, unknown> = {};
  try { const b = w().WFP?.Blatt?.finden(c); if (b) ein.blatt = b; } catch { /* eine Meinung weniger */ }
  const sc = await scanicLaden();
  if (sc) {
    try { const r = await sc.scanDocument(c); if (r?.success) ein.klassisch = { ecken: SB.ausScanic(r.corners) }; } catch { /* eine Meinung weniger */ }
    try { const r = await sc.scanDocument(c, { detector: "ml", ml: { assetBaseUrl: `${vendorBasis()}scanic/` } }); if (r?.corners) ein.ml = { ecken: SB.ausScanic(r.corners), score: r.score }; } catch { /* eine Meinung weniger */ }
  }
  const e = SB.entscheiden(ein, c.width, c.height);
  const ecken = e.sicher ? e.ecken : SB.ganz(c.width, c.height);
  const m = SB.seitenMass(ecken, e.sicher ? "auto" : "blatt", DPI);
  const img = SB.entzerren(c.getContext("2d")!.getImageData(0, 0, c.width, c.height), ecken, m.W, m.H);
  // scan-bild.js liefert ein einfaches Objekt; Filter und Schärfe rechnet dieselbe Funktion wie der Scanner (ScanBild.filtern)
  const gerade = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
  if (einst.filter !== "original" || einst.schaerfe > 0) SB.filtern(gerade, einst.filter, { schaerfe: einst.schaerfe });
  const z = document.createElement("canvas"); z.width = m.W; z.height = m.H; z.getContext("2d")!.putImageData(gerade, 0, 0);
  const jpg = new Uint8Array(await (await new Promise<Blob>((ok, nein) => z.toBlob((b) => b ? ok(b) : nein(new Error("Bild nicht erzeugt.")), "image/jpeg", 0.9))).arrayBuffer());
  const doc = await w().PDFLib!.PDFDocument.create();
  doc.setProducer("Familienakte"); doc.setCreator("Familienakte · Stapel direkt übernehmen (Workflow PDF)");
  const bild = await doc.embedJpg(jpg); const seite = doc.addPage(m.seite);
  seite.drawImage(bild, { x: 0, y: 0, width: m.seite[0], height: m.seite[1] });
  const name = file.name.replace(/\.[^.]+$/, "") + (e.sicher ? "" : " (Ecken prüfen)") + ".pdf";
  const vorschau = await vorschauAus(z);
  return { file: new File([await doc.save() as BlobPart], name, { type: "application/pdf" }), sicher: e.sicher, grund: e.grund, quelle: e.quelle, seite: m.seite, vorschau };
}
// ---------- Ablauf mit Anhalten · Weiter · Abbrechen (Klaus 2026-11-01) ----------
// Läuft unabhängig von der Seite weiter (Modulzustand); jedes fertige Blatt liegt sofort in der Stapel-Ablage (IndexedDB).
export type StapelLauf = { zustand: "ruht" | "laeuft" | "angehalten" | "fertig" | "abgebrochen"; i: number; n: number; aktuell: string; fertig: number; offen: number };
let lauf: StapelLauf = { zustand: "ruht", i: 0, n: 0, aktuell: "", fertig: 0, offen: 0 };
let warteschlange: File[] = [];
let weiter: (() => void) | null = null;
const hoerer = new Set<(l: StapelLauf) => void>();
const melde = (teil: Partial<StapelLauf>) => { lauf = { ...lauf, ...teil }; hoerer.forEach((h) => h(lauf)); };
export const stapelLauf = () => lauf;
const jetzt = (): StapelLauf["zustand"] => lauf.zustand;   // frisch gelesen (der Zustand ändert sich während await)
export function stapelHoeren(h: (l: StapelLauf) => void) { hoerer.add(h); return () => { hoerer.delete(h); }; }
export function stapelAnhalten() { if (lauf.zustand === "laeuft") melde({ zustand: "angehalten" }); }
export function stapelWeiter() { if (lauf.zustand === "angehalten") { melde({ zustand: "laeuft" }); weiter?.(); weiter = null; } }
export function stapelAbbrechen() { if (lauf.zustand === "laeuft" || lauf.zustand === "angehalten") { warteschlange = []; melde({ zustand: "abgebrochen" }); weiter?.(); weiter = null; } }

/** Nimmt einen Stapel an (auch während eines Laufs: hinten angehängt) und rechnet Blatt für Blatt; ablegen speichert jedes Ergebnis. */
export async function stapelStarten(dateien: File[], ablegen: (e: StapelErgebnis) => Promise<void>, opt: { einst?: StapelEinst; ende?: () => Promise<void> } = {}) {
  const einst = opt.einst || STAPEL_VORGABE;
  warteschlange.push(...dateien);
  if (lauf.zustand === "laeuft" || lauf.zustand === "angehalten") { melde({ n: lauf.n + dateien.length }); return; }
  melde({ zustand: "laeuft", i: 0, n: dateien.length, aktuell: "", fertig: 0, offen: 0 });
  const protokoll: Array<{ name: string; sicher: boolean; quelle: string; seite?: [number, number] }> = [];
  while (warteschlange.length) {
    if (jetzt() === "angehalten") await new Promise<void>((ok) => { weiter = ok; });
    if (jetzt() === "abgebrochen") break;
    const f = warteschlange.shift()!;
    melde({ aktuell: f.name });
    let e: StapelErgebnis;
    if (/^application\/pdf$/.test(f.type) || /\.pdf$/i.test(f.name)) e = { file: f, sicher: true, grund: "PDF unverändert übernommen", quelle: "pdf" };
    else { try { e = await stapelSeite(f, einst); } catch (reason) { e = { file: f, sicher: false, grund: reason instanceof Error ? reason.message : "Bild nicht lesbar", quelle: "fehler" }; } }
    await ablegen(e);
    protokoll.push({ name: e.file.name, sicher: e.sicher, quelle: e.quelle, seite: e.seite });
    (window as Window & { __faStapel?: unknown }).__faStapel = protokoll;   // für die Probe
    melde({ i: lauf.i + 1, fertig: lauf.fertig + 1, offen: lauf.offen + (e.sicher ? 0 : 1) });
  }
  if (opt.ende) { try { await opt.ende(); } catch { /* das Zusammenfügen meldet sich selbst */ } }
  if (jetzt() !== "abgebrochen") melde({ zustand: "fertig", aktuell: "" });
}

/** Mehrere Stapel-PDFs zu EINEM zusammenfügen (Klaus 2026-11-01: „ob ich den Stapel zusammenfasse … per Drag and Drop … zusammenfügen“).
 *  Seiten in der gegebenen Reihenfolge, je Quelle alle ihre Seiten. pdf-lib aus dem Kern von Workflow PDF. */
export async function pdfsZusammenfuegen(dateien: Blob[]): Promise<Uint8Array> {
  await kern();
  const P = w().PDFLib!.PDFDocument, ziel = await P.create();
  ziel.setProducer("Familienakte"); ziel.setCreator("Familienakte · Stapel zusammengefügt (Workflow PDF)");
  for (const d of dateien) {
    const quelle = await P.load(new Uint8Array(await d.arrayBuffer()), { ignoreEncryption: true });
    for (const s of await ziel.copyPages(quelle, quelle.getPageIndices())) ziel.addPage(s);
  }
  return await ziel.save();
}
