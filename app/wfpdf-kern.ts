// Lädt den Kern von Workflow PDF (public/wfpdf/, byte-1:1, Pins in public/wfpdf/HERKUNFT.json) erst, wenn er gebraucht wird.
// Familienakte-eigener Klebstoff (Sitzung F): Pfade, Rückrufe des Scanners, Texterkennung für Scans.
// Alles liegt im Paket — keine Verbindung nach außen, geht offline und bei ausgeschaltetem Internetschalter.

type PdfLibNs = { PDFDocument: { load: (b: Uint8Array, o?: unknown) => Promise<unknown> } };
export type WfpExport = { exportieren: (doc: unknown, bytes: Uint8Array, modus: "fest" | "ausfuellbar" | "vorlage", opt?: { schrift?: Uint8Array; unicodeFelder?: boolean }) => Promise<{ bytes: Uint8Array; hinweise: string[] }> };
export type WfpKandidat = { type: "text" | "check"; x: number; y: number; w: number; h: number; label?: string; quelle?: string };
export type WfpErkennung = {
  linienErkennung: (img: ImageData) => WfpKandidat[];
  beschrifte: (felder: WfpKandidat[], items: Array<{ str: string; x: number; y: number; w: number; h: number }>) => void;
};
export type WfpReinigung = { versteckt: (st: { s: string; x: number; y: number; w: number; fh: number }, img: ImageData, scale: number) => string | null; grundSatz: (g: string) => string };
export type WfpSchloss = { zu: (passwort: string, klartext: string) => Promise<unknown>; auf: (passwort: string, paket: unknown) => Promise<string>; istPaket: (d: unknown) => boolean };
type WfpScanner = { oeffnen: (opt: Record<string, unknown>) => unknown; pfade: (p: Record<string, string>) => unknown; zustand: () => Record<string, unknown> | null; hinzu: (f: File[]) => Promise<void> };
type Fenster = Window & { WFP?: { Export?: WfpExport; Erkennung?: WfpErkennung; Reinigung?: WfpReinigung; Scanner?: WfpScanner }; PDFLib?: PdfLibNs; WERKSTATT_SCHLUESSEL?: WfpSchloss; fontkit?: unknown;
  Tesseract?: { createWorker: (sprache: string, oem: number, opt: Record<string, unknown>) => Promise<TessWorker> } };
type TessWorker = { recognize: (bild: HTMLCanvasElement, o?: unknown, a?: unknown) => Promise<{ data: { blocks?: Array<{ paragraphs?: Array<{ lines?: Array<{ text?: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }> }> }> } }>; terminate: () => Promise<void> };
const w = () => window as Fenster;

export const basis = () => new URL("wfpdf/", document.baseURI).href;
const geladen = new Map<string, Promise<void>>();
function skript(datei: string) {
  // Einzeldatei (scripts/build-single-file.mjs): dort steht ein Teil des Kerns schon eingebettet in der Seite.
  if ((window as Window & { __FA_KERN_EINGEBETTET?: string[] }).__FA_KERN_EINGEBETTET?.includes(datei)) return Promise.resolve();
  const url = new URL(datei, basis()).href;
  let p = geladen.get(url);
  if (!p) {
    p = new Promise<void>((ok, nein) => {
      const s = document.createElement("script"); s.src = url; s.async = false;
      s.onload = () => ok(); s.onerror = () => nein(new Error(`Baustein von Workflow PDF fehlt (${datei}).`));
      document.head.appendChild(s);
    });
    p.catch(() => geladen.delete(url));
    geladen.set(url, p);
  }
  return p;
}
function stil(href: string) {
  if (document.querySelector(`link[data-wfpdf-stil="${href}"]`)) return Promise.resolve();
  return new Promise<void>((ok, nein) => {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = new URL(href, document.baseURI).href; l.setAttribute("data-wfpdf-stil", href);
    l.onload = () => ok(); l.onerror = () => nein(new Error("Stil des Scanners fehlt.")); document.head.appendChild(l);
  });
}

export async function kernExport() { await skript("pdf-lib.min.js"); await skript("export.js"); return w().WFP!.Export!; }
export async function kernErkennung() { await skript("erkennung.js"); return w().WFP!.Erkennung!; }
export async function kernReinigung() { await skript("reinigung.js"); return w().WFP!.Reinigung!; }
export async function kernSchloss() { await skript("schluesseltresor.js"); return w().WERKSTATT_SCHLUESSEL!; }

/** Noto Sans (ganz eingebettet, nie als Teilmenge — Befund aus Workflow PDF) für Einträge, die Helvetica nicht kann. */
let schriftBytes: Promise<Uint8Array> | null = null;
export async function unicodeSchrift() {
  await skript("fontkit.umd.min.js");
  if (!schriftBytes) schriftBytes = fetch(new URL("fonts/NotoSans-Regular.ttf", basis()).href).then(async (r) => { if (!r.ok) throw new Error("Schrift fehlt"); return new Uint8Array(await r.arrayBuffer()); });
  schriftBytes.catch(() => { schriftBytes = null; });
  return schriftBytes;
}
export const brauchtUnicode = (texte: string[]) => texte.some((t) => /[^\u0000-ÿ€„“”‚‘’–—…•]/.test(t));

// ---------- Rückrufe des Scanners (dieselben wie in Workflow PDF, BookLedgerPro und den WorkFlohs) ----------
const h = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]!));
let toastUhr = 0;
export function wfpToast(text: string, ms = 4200) {
  let t = document.getElementById("wfpdf-toasts");
  if (!t) { t = document.createElement("div"); t.id = "wfpdf-toasts"; t.setAttribute("aria-live", "polite"); document.body.appendChild(t); }
  const e = document.createElement("div"); e.className = "wfpdf-toast"; e.textContent = String(text);
  t.replaceChildren(e); window.clearTimeout(toastUhr); toastUhr = window.setTimeout(() => e.remove(), ms);
}
function scanDialog(html: string, onMount?: (d: HTMLElement, zu: () => void) => void) {
  const g = document.createElement("div"); g.className = "scan-dlg-grund";
  g.innerHTML = `<div class="scan-dlg" role="dialog" aria-modal="true">${html}</div>`;
  const zu = () => { g.remove(); document.removeEventListener("keydown", esc); };
  const esc = (e: KeyboardEvent) => { if (e.key === "Escape") zu(); };
  g.addEventListener("click", (e) => { if (e.target === g) zu(); });
  document.addEventListener("keydown", esc); document.body.appendChild(g);
  if (onMount) onMount(g.querySelector(".scan-dlg") as HTMLElement, zu);
  return zu;
}
function scanFrage(titel: string, text: string, ja?: string, nein?: string) {
  return new Promise<boolean>((res) => scanDialog(`<h2>${h(titel)}</h2><div>${text}</div><div class="zeile"><button class="knopf" data-n>${h(nein || "Abbrechen")}</button><button class="knopf rot" data-j>${h(ja || "OK")}</button></div>`,
    (d, zu) => { (d.querySelector("[data-j]") as HTMLButtonElement).onclick = () => { zu(); res(true); }; (d.querySelector("[data-n]") as HTMLButtonElement).onclick = () => { zu(); res(false); }; }));
}
function scanFortschritt(titel: string) {
  let el: HTMLElement | null = null, tx: HTMLElement | null = null;
  const zu = scanDialog(`<h2>${h(titel)}</h2><div class="fortschritt"><i></i></div><p class="hinweis" data-t>…</p>`, (d) => { el = d.querySelector(".fortschritt i"); tx = d.querySelector("[data-t]"); });
  return { setze(anteil: number, text?: string) { if (el) el.style.width = `${Math.round(Math.min(1, Math.max(0, anteil)) * 100)}%`; if (tx && text) tx.textContent = text; }, zu };
}
function laden(name: string, bytes: Uint8Array, typ?: string) {
  const blob = new Blob([bytes as BlobPart], { type: typ || "application/pdf" }); const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000); return blob;
}

/** Öffnet den Scanner von Workflow PDF über der App. `fertig` bekommt das PDF (mit Textebene, „Durchsuchbar“ an). */
export async function scannen(opt: { titel?: string; fertigText?: string; name?: string; fertig: (file: File) => void | Promise<void> }) {
  await stil("wfpdf-fa/scanner.css");
  for (const d of ["pdf-lib.min.js", "scan-bild.js", "blatt.js", "zip.js", "scanner.js"]) await skript(d);
  const SC = w().WFP!.Scanner!;
  const b = basis();
  SC.pfade({ vendor: b, scanic: `${b}vendor/scanic/`, ocr: `${b}vendor/` });
  SC.oeffnen({
    titel: opt.titel || "Unterlage scannen", fertigText: opt.fertigText || "Weiter zum Ausfüllen", name: opt.name,
    ort: "in der Familienakte", ortKurz: "in der Familienakte",
    toast: wfpToast, dialog: scanDialog, frage: scanFrage, fortschritt: scanFortschritt, laden, ablegen: null,
    fertig: async (bytes: Uint8Array, info: { name?: string }) => {
      const name = `${String(info?.name || "Scan").replace(/[\\/:*?"<>|]+/g, "_").trim() || "Scan"}.pdf`;
      await opt.fertig(new File([bytes as BlobPart], name, { type: "application/pdf" }));
    },
  });
  const st = SC.zustand(); if (st) st.durchsuchbar = true;   // Textebene: damit gehen Scans unkenntlich an die KI und die Felder bekommen Beschriftungen
}

// ---------- Texterkennung für Scans und Bilder (Tesseract aus Workflow PDF, auf dem Gerät) ----------
export type OcrZeile = { text: string; x: number; y: number; w: number; h: number };
let ocr: Promise<TessWorker> | null = null;
async function ocrWorker() {
  if (!ocr) ocr = (async () => {
    await skript("vendor/tesseract/tesseract.min.js");
    const t = `${basis()}vendor/tesseract/`;
    return w().Tesseract!.createWorker("deu", 1, { workerPath: `${t}worker.min.js`, corePath: t, langPath: `${t}lang`, gzip: false, cacheMethod: "none" });
  })();
  ocr.catch(() => { ocr = null; });
  return ocr;
}
/** Zeilen einer gezeichneten Seite, Lage in Prozent (wie die Felder). Zeilen unter 30 % Sicherheit fallen weg. */
export async function ocrZeilen(c: HTMLCanvasElement): Promise<OcrZeile[]> {
  const worker = await ocrWorker();
  const r = await worker.recognize(c, {}, { blocks: true, text: false });
  const out: OcrZeile[] = [];
  for (const bl of r.data.blocks || []) for (const pa of bl.paragraphs || []) for (const li of pa.lines || []) {
    const t = String(li.text || "").replace(/\s+/g, " ").trim();
    if (!t || li.confidence < 30 || !/[\p{L}\p{N}]/u.test(t)) continue;
    const b = li.bbox;
    out.push({ text: t, x: b.x0 / c.width * 100, y: b.y0 / c.height * 100, w: (b.x1 - b.x0) / c.width * 100, h: (b.y1 - b.y0) / c.height * 100 });
  }
  return out;
}
