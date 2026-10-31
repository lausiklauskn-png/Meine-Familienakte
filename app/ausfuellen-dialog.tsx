// „Ausfüllen“ (Klaus 2026-10-31, Sitzung F): Unterlage aus der Akte → Felder erkennen (offline, auf Wunsch mit KI über den
// Text-Weg von „Mit KI arbeiten“, unkenntlich) oder selbst setzen → ausfüllen (Vorschläge aus der Akte und aus dem
// Eingabe-Speicher) → unterschreiben → festes oder ausfüllbares PDF als NEUE Unterlage neben dem Original → teilen.
// Die Maschine ist Workflow PDF (public/wfpdf/, byte-1:1): Linien-Erkennung, Beschriftung, Export mit pdf-lib, Reinigung,
// Schloss, Scanner, Texterkennung. Dieser Klebstoff ist Familienakte-eigen (React), Vorbild der Editor in Workflow PDF.
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { Check, Copy, Download, ExternalLink, LoaderCircle, PenLine, ScanLine, Share2, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { loadPdfJs } from "./file-viewer";
import type { LocalDocument, AusfuellAblage } from "./local-vault";
import { brauchtUnicode, kernErkennung, kernExport, kernReinigung, kernSchloss, ocrZeilen, scannen, unicodeSchrift } from "./wfpdf-kern";
import {
  AUSFUELL_TYPEN, FELD_GROESSE, bereitZumSpeichern, ergebnisName, feldArt, kiAnwenden, kiFelderAntwort, kiFelderAuftrag, merken, speicherLesen,
  speicherZahl, typAusLabel, vergessen, vorbelegen, vorschlaege, type AusfuellFeld, type AusfuellInfo, type AusfuellSeite, type AusfuellTyp, type EingabeSpeicher, type PersonAngaben,
} from "../lib/ausfuellen";
import { anonymisieren, KI_ZIELE, oeffnenAdresse, zurueckSetzen, type KiZiel, type Pseudonymisierer } from "../lib/ki-auftrag";

type Notice = { kind: "success" | "error" | "info"; text: string } | null;
export type AusfuellPerson = { id: string; name: string; angaben: PersonAngaben };
type TextItem = { str: string; x: number; y: number; w: number; h: number };
type Seite = AusfuellSeite & { bild: string; px: [number, number]; items: TextItem[]; ocr: boolean };
type PdfSeite = {
  getViewport: (o: { scale: number }) => { width: number; height: number; transform: number[]; convertToViewportRectangle: (r: number[]) => number[] };
  render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
  getTextContent: () => Promise<{ items: Array<{ str: string; transform: number[]; width: number; hasEOL?: boolean }> }>;
  getAnnotations: () => Promise<Array<{ subtype: string; fieldType?: string; fieldName?: string; alternativeText?: string; rect: number[]; checkBox?: boolean; multiLine?: boolean; fieldValue?: unknown }>>;
};
type PdfDok = { numPages: number; getPage: (n: number) => Promise<PdfSeite> };
type PdfLib = { getDocument: (o: { data: Uint8Array }) => { promise: Promise<PdfDok> }; Util: { transform: (a: number[], b: number[]) => number[] } };

const MAX_SEITEN = 20;
const BREITE = 1400;
const uid = () => `F-${crypto.randomUUID().slice(0, 8)}`;
const pseudo = () => (window as unknown as { SbkimPseudonym?: Pseudonymisierer }).SbkimPseudonym;
const iou = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const s = ix * iy; return s / (a.w * a.h + b.w * b.h - s || 1);
};
const istPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);
const istBild = (f: File) => f.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(f.name);

/** Bild → einseitiges PDF in A4-Breite (WFP.Export.bilderZuPdf braucht JPEG). */
async function bildZuPdf(file: File): Promise<Uint8Array> {
  const bmp = await createImageBitmap(file);
  const f = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * f); c.height = Math.round(bmp.height * f);
  const x = c.getContext("2d")!; x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(bmp, 0, 0, c.width, c.height);
  const blob: Blob = await new Promise((ok) => c.toBlob((b) => ok(b!), "image/jpeg", 0.92));
  const ex = await kernExport() as unknown as { bilderZuPdf: (b: Array<{ bytes: Uint8Array }>) => Promise<Uint8Array> };
  return ex.bilderZuPdf([{ bytes: new Uint8Array(await blob.arrayBuffer()) }]);
}

async function seitenLesen(bytes: Uint8Array, melde: (t: string) => void) {
  const lib = await loadPdfJs() as unknown as PdfLib;
  const pdf = await lib.getDocument({ data: bytes.slice(0) }).promise;
  const seiten: Seite[] = []; const felder: AusfuellFeld[] = [];
  for (let i = 0; i < Math.min(pdf.numPages, MAX_SEITEN); i++) {
    melde(`Seite ${i + 1} von ${pdf.numPages} wird gelesen …`);
    const p = await pdf.getPage(i + 1);
    const v1 = p.getViewport({ scale: 1 });
    const vp = p.getViewport({ scale: BREITE / v1.width });
    const c = document.createElement("canvas"); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const x = c.getContext("2d", { willReadFrequently: true })!; x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    await p.render({ canvasContext: x, viewport: vp }).promise;
    const tc = await p.getTextContent();
    const items: TextItem[] = tc.items.filter((t) => t.str && t.str.trim()).map((t) => {
      const tr = lib.Util.transform(vp.transform, t.transform); const fh = Math.hypot(tr[2], tr[3]);
      return { str: t.str, x: tr[4] / c.width * 100, y: (tr[5] - fh) / c.height * 100, w: t.width * (BREITE / v1.width) / c.width * 100, h: fh / c.height * 100 };
    });
    // Echte Formularfelder des PDF (AcroForm) gibt es schon — sie werden übernommen.
    try {
      for (const a of await p.getAnnotations()) {
        if (a.subtype !== "Widget" || (a.fieldType !== "Tx" && !(a.fieldType === "Btn" && a.checkBox))) continue;
        const r = v1.convertToViewportRectangle(a.rect);
        const fx = Math.min(r[0], r[2]) / v1.width * 100, fy = Math.min(r[1], r[3]) / v1.height * 100, fw = Math.abs(r[2] - r[0]) / v1.width * 100, fh = Math.abs(r[3] - r[1]) / v1.height * 100;
        const label = String(a.alternativeText || a.fieldName || "").slice(0, 80);
        const type: AusfuellTyp = a.fieldType === "Btn" ? "check" : typAusLabel(label);
        felder.push({ id: uid(), page: i, type, label, x: fx, y: fy, w: fw, h: fh, value: type === "check" ? false : typeof a.fieldValue === "string" ? a.fieldValue : "", mehrzeilig: !!a.multiLine, herkunft: "pdf", geprueft: true });
      }
    } catch { /* ohne Formularfelder weiter */ }
    seiten.push({ t: v1.transform, w: v1.width, h: v1.height, bild: c.toDataURL("image/jpeg", 0.85), px: [c.width, c.height], items, ocr: false });
    c.width = c.height = 0;
  }
  return { seiten, felder, gesamt: pdf.numPages };
}

/** Unterschrift zeichnen: Finger, Stift oder Maus. Gibt ein auf die Striche zugeschnittenes PNG zurück. */
function UnterschriftFeld({ onFertig, onAbbrechen }: { onFertig: (png: string) => void; onAbbrechen: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const zieht = useRef(false); const leer = useRef(true);
  const punkt = (e: RPointerEvent<HTMLCanvasElement>) => { const r = e.currentTarget.getBoundingClientRect(); return [(e.clientX - r.left) * e.currentTarget.width / r.width, (e.clientY - r.top) * e.currentTarget.height / r.height]; };
  const ctx = () => { const x = ref.current!.getContext("2d")!; x.lineWidth = 4; x.lineCap = "round"; x.lineJoin = "round"; x.strokeStyle = "#0b1f63"; return x; };
  const fertig = () => {
    const c = ref.current!; if (leer.current) return;
    const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const k = document.createElement("canvas"); k.width = Math.max(1, x1 - x0 + 8); k.height = Math.max(1, y1 - y0 + 8);
    k.getContext("2d")!.drawImage(c, x0 - 4, y0 - 4, k.width, k.height, 0, 0, k.width, k.height);
    onFertig(k.toDataURL("image/png"));
  };
  return <div className="af-unterschrift-pad">
    <canvas ref={ref} width={900} height={300} aria-label="Hier unterschreiben" data-af-pad
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); zieht.current = true; const [x, y] = punkt(e); const c = ctx(); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 0.1, y + 0.1); c.stroke(); leer.current = false; }}
      onPointerMove={(e) => { if (!zieht.current) return; const [x, y] = punkt(e); const c = ctx(); c.lineTo(x, y); c.stroke(); }}
      onPointerUp={() => { zieht.current = false; }}/>
    <div className="button-row"><button type="button" className="button secondary" onClick={() => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); leer.current = true; }}>Neu</button><button type="button" className="button secondary" onClick={onAbbrechen}>Abbrechen</button><button type="button" className="button primary" onClick={fertig} data-af-pad-fertig>Übernehmen</button></div>
  </div>;
}

export function AusfuellenDialog({ dokument, leseDatei, personen, namen, ablage, onVormerken, onErgebnis, onClose, onNotice: meldeAussen }: {
  dokument: LocalDocument;
  leseDatei: () => Promise<File>;
  personen: AusfuellPerson[];
  namen: string[];
  ablage: { lesen: () => Promise<AusfuellAblage>; schreiben: (teil: Partial<AusfuellAblage>) => Promise<void> };
  onVormerken: (info: AusfuellInfo | null) => Promise<void>;
  onErgebnis: (file: File, modus: "fest" | "ausfuellbar", info: AusfuellInfo) => Promise<void>;
  onClose: () => void;
  onNotice: (n: Notice) => void;
}) {
  const [hinweis, setHinweis] = useState<Notice>(null);
  // Hinweise stehen IM Fenster (die Hinweiszeile der Seite liegt darunter) und gehen zusätzlich an die Seite.
  const onNotice = (n: Notice) => { setHinweis(n); meldeAussen(n); };
  const [zustand, setZustand] = useState<"laden" | "bereit" | "fehler">("laden");
  const [meldung, setMeldung] = useState("Unterlage wird geöffnet …");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [seiten, setSeiten] = useState<Seite[]>([]);
  const [gesamt, setGesamt] = useState(0);
  const [felder, setFelder] = useState<AusfuellFeld[]>([]);
  const [modus, setModus] = useState<"setzen" | "ausfuellen">("ausfuellen");
  const [werkzeug, setWerkzeug] = useState<AusfuellTyp | null>(null);
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const [aktiv, setAktiv] = useState<string | null>(null);
  const [arbeit, setArbeit] = useState("");
  const [speicher, setSpeicher] = useState<EingabeSpeicher>(() => speicherLesen(null));
  const [unterschriften, setUnterschriften] = useState<Record<string, unknown>>({});
  const [personId, setPersonId] = useState("");
  const [pad, setPad] = useState<string | null>(null);
  const [usPasswort, setUsPasswort] = useState("");
  const [usPasswort2, setUsPasswort2] = useState("");
  const [usFuer, setUsFuer] = useState("");
  const [ki, setKi] = useState<{ text: string; map: Record<string, string>; leck: string | null } | null>(null);
  const [kiAntwort, setKiAntwort] = useState("");
  const [kiZiel, setKiZiel] = useState<KiZiel>("chatgpt");
  const [ergebnis, setErgebnis] = useState<File | null>(null);
  const [quelleName, setQuelleName] = useState(dokument.originalName);
  const ziehen = useRef<{ id: string; art: "schieben" | "groesse"; sx: number; sy: number; f: AusfuellFeld; rect: DOMRect } | null>(null);

  const oeffnen = async (datei: File, gemerkt?: AusfuellInfo | null) => {
    setZustand("laden"); setFelder([]); setSeiten([]);
    try {
      const b = istPdf(datei) ? new Uint8Array(await datei.arrayBuffer()) : istBild(datei) ? await bildZuPdf(datei) : null;
      if (!b) throw new Error("Ausfüllen geht mit PDF-Dateien und Fotos.");
      const r = await seitenLesen(b, setMeldung);
      setBytes(b); setSeiten(r.seiten); setGesamt(r.gesamt);
      const maske = gemerkt && "felder" in gemerkt && gemerkt.felder.length ? gemerkt.felder.map((f) => ({ ...f })) : r.felder;
      setFelder(maske);
      setModus(maske.length ? "ausfuellen" : "setzen");
      setZustand("bereit");
    } catch (e) { setMeldung((e as Error).message || "Die Unterlage konnte nicht gelesen werden."); setZustand("fehler"); }
  };

  useEffect(() => {
    void (async () => {
      try { const a = await ablage.lesen(); setSpeicher(speicherLesen(a.speicher)); setUnterschriften(a.unterschriften); } catch { /* ohne Ablage weiter */ }
      try { await oeffnen(await leseDatei(), dokument.ausfuellen); } catch (e) { setMeldung((e as Error).message); setZustand("fehler"); }
    })();
  }, []);

  const aendern = (id: string, teil: Partial<AusfuellFeld>) => setFelder((alt) => alt.map((f) => f.id === id ? { ...f, ...teil } : f));
  const stand = bereitZumSpeichern(felder);

  // ---------- Felder erkennen (offline) ----------
  const erkennen = async () => {
    setArbeit("Felder werden erkannt …");
    try {
      const ER = await kernErkennung();
      const neu: AusfuellFeld[] = [...felder];
      const naechste = [...seiten];
      for (let i = 0; i < seiten.length; i++) {
        setArbeit(`Felder werden erkannt: Seite ${i + 1} von ${seiten.length} …`);
        const img = new Image(); img.src = seiten[i].bild; await img.decode();
        const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const x = c.getContext("2d", { willReadFrequently: true })!; x.drawImage(img, 0, 0);
        let items = seiten[i].items;
        if (!items.length) {   // Scan ohne Textebene: Texterkennung auf dem Gerät liefert die Beschriftungen
          setArbeit(`Seite ${i + 1}: Texterkennung auf dem Gerät …`);
          try { items = (await ocrZeilen(c)).map((z) => ({ str: z.text, x: z.x, y: z.y, w: z.w, h: z.h })); naechste[i] = { ...seiten[i], items, ocr: true }; } catch { /* ohne Text weiter */ }
        }
        const kand = ER.linienErkennung(x.getImageData(0, 0, c.width, c.height));
        ER.beschrifte(kand, items);
        let nr = 0;
        for (const k of kand) {
          if (neu.some((v) => v.page === i && iou(v, k) > 0.25)) continue;
          nr++;
          const type = k.type === "check" ? "check" : typAusLabel(k.label || "");
          neu.push({ id: uid(), page: i, type, label: k.label || `${type === "check" ? "Kästchen" : "Feld"} ${i + 1}.${nr}`, x: k.x, y: k.y, w: k.w, h: k.h, value: type === "check" ? false : "", mehrzeilig: type === "text" && k.h > 4.5, herkunft: "erkennung", geprueft: false });
        }
        c.width = c.height = 0;
      }
      setSeiten(naechste); setFelder(neu); setModus("setzen");
      onNotice({ kind: "success", text: `${neu.length - felder.length} Feld${neu.length - felder.length === 1 ? "" : "er"} vorgeschlagen. Bitte prüfen: Lage ziehen, Beschriftung ändern, Überflüssiges löschen.` });
    } catch (e) { onNotice({ kind: "error", text: (e as Error).message }); }
    finally { setArbeit(""); }
  };

  // ---------- Mit KI benennen (Text-Weg, unkenntlich) ----------
  const kiVorbereiten = async () => {
    const p = pseudo();
    if (!p) { onNotice({ kind: "error", text: "Die Unkenntlich-Funktion (Modul 25) ist nicht geladen. Ohne sie geht nichts an eine KI." }); return; }
    if (!felder.length) { onNotice({ kind: "info", text: "Erst Felder erkennen oder setzen — die KI benennt sie dann." }); return; }
    setArbeit("Auftrag wird vorbereitet …");
    try {
      const RE = await kernReinigung();
      const texte: string[] = [];
      for (let i = 0; i < seiten.length; i++) {
        let items = seiten[i].items;
        if (!items.length) {
          const img = new Image(); img.src = seiten[i].bild; await img.decode();
          const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext("2d")!.drawImage(img, 0, 0);
          try { items = (await ocrZeilen(c)).map((z) => ({ str: z.text, x: z.x, y: z.y, w: z.w, h: z.h })); } catch { items = []; }
          c.width = c.height = 0;
        } else if (!seiten[i].ocr) {
          // Reinigung (Workflow PDF): Text, der auf der gezeichneten Seite nicht zu sehen ist, geht nicht mit.
          const img = new Image(); img.src = seiten[i].bild; await img.decode();
          const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
          const x = c.getContext("2d", { willReadFrequently: true })!; x.drawImage(img, 0, 0);
          const daten = x.getImageData(0, 0, c.width, c.height); const scale = c.width / seiten[i].w;
          items = items.filter((t) => !RE.versteckt({ s: t.str, x: t.x / 100 * seiten[i].w, y: (t.y + t.h) / 100 * seiten[i].h, w: t.w / 100 * seiten[i].w, fh: t.h / 100 * seiten[i].h }, daten, scale));
          c.width = c.height = 0;
        }
        texte.push(items.map((t) => t.str).join(" ").replace(/\s+/g, " ").trim());
      }
      const kand = felder.map((f, n) => ({ nr: n + 1, seite: f.page, x: f.x, y: f.y, w: f.w, h: f.h, typ: f.type, text: f.label }));
      const roh = kiFelderAuftrag(kand, texte);
      const a = anonymisieren(p, roh, namen, {}, true);
      setKi({ text: a.text, map: a.map, leck: a.leck }); setKiAntwort("");
    } catch (e) { onNotice({ kind: "error", text: (e as Error).message }); }
    finally { setArbeit(""); }
  };
  const kiOeffnen = async () => {
    if (!ki || ki.leck) return;
    const { url, textInAdresse } = oeffnenAdresse(kiZiel, ki.text);
    if (!textInAdresse) { try { await navigator.clipboard.writeText(ki.text); onNotice({ kind: "success", text: `Auftrag kopiert. In ${KI_ZIELE[kiZiel].name} einfügen.` }); } catch { onNotice({ kind: "info", text: "Bitte den Auftrag markieren und von Hand kopieren." }); } }
    window.open(url, "_blank", "noopener");
  };
  const kiUebernehmen = () => {
    const p = pseudo();
    try {
      const r = kiFelderAntwort(kiAntwort);
      const klar = { ...r, felder: r.felder.map((f) => ({ ...f, bezeichnung: p && ki ? zurueckSetzen(p, f.bezeichnung, ki.map) : f.bezeichnung })) };
      const a = kiAnwenden(felder, klar);
      setFelder(a.felder); setKi(null); setKiAntwort("");
      onNotice({ kind: "success", text: `${a.benannt} Feld${a.benannt === 1 ? "" : "er"} von der KI benannt${a.weg ? `, ${a.weg} entfernt` : ""}. Bitte prüfen.` });
    } catch (e) { onNotice({ kind: "error", text: (e as Error).message }); }
  };

  // ---------- Setzen: tippen legt ein Feld an, ziehen verschiebt, Ecke ändert die Größe ----------
  const seiteTipp = (e: React.MouseEvent<HTMLDivElement>, page: number) => {
    if (modus !== "setzen" || !werkzeug || e.target !== e.currentTarget) return;
    const r = e.currentTarget.getBoundingClientRect();
    const [w, hh] = FELD_GROESSE[werkzeug];
    const x = Math.max(0, Math.min(100 - w, (e.clientX - r.left) / r.width * 100)), y = Math.max(0, Math.min(100 - hh, (e.clientY - r.top) / r.height * 100 - hh / 2));
    const f: AusfuellFeld = { id: uid(), page, type: werkzeug, label: AUSFUELL_TYPEN[werkzeug], x, y, w, h: hh, value: werkzeug === "check" ? false : "", herkunft: "hand", geprueft: true };
    setFelder((alt) => [...alt, f]); setGewaehlt(f.id);
  };
  const ziehStart = (e: RPointerEvent, f: AusfuellFeld, art: "schieben" | "groesse") => {
    if (modus !== "setzen") return;
    e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const seite = (e.currentTarget as HTMLElement).closest(".af-seite") as HTMLElement;
    ziehen.current = { id: f.id, art, sx: e.clientX, sy: e.clientY, f: { ...f }, rect: seite.getBoundingClientRect() };
    setGewaehlt(f.id);
  };
  const ziehWeiter = (e: RPointerEvent) => {
    const z = ziehen.current; if (!z) return;
    const dx = (e.clientX - z.sx) / z.rect.width * 100, dy = (e.clientY - z.sy) / z.rect.height * 100;
    if (z.art === "schieben") aendern(z.id, { x: Math.max(0, Math.min(100 - z.f.w, z.f.x + dx)), y: Math.max(0, Math.min(100 - z.f.h, z.f.y + dy)), geprueft: true });
    else aendern(z.id, { w: Math.max(1.5, Math.min(100 - z.f.x, z.f.w + dx)), h: Math.max(1.2, Math.min(100 - z.f.y, z.f.h + dy)), geprueft: true });
  };

  // ---------- Unterschrift ----------
  const usSchluessel = usFuer || personId || "ich";
  const usGemerkt = Boolean(unterschriften[usSchluessel]);
  const usEinsetzen = async (feldId: string) => {
    try {
      const S = await kernSchloss();
      const png = await S.auf(usPasswort, unterschriften[usSchluessel]);
      aendern(feldId, { value: png }); setUsPasswort(""); onNotice({ kind: "success", text: "Gespeicherte Unterschrift eingesetzt." });
      return true;
    } catch { onNotice({ kind: "error", text: "Das Passwort passt nicht zur gespeicherten Unterschrift." }); return false; }
  };
  const usMerken = async (png: string) => {
    if (usPasswort.length < 8 || usPasswort !== usPasswort2) { onNotice({ kind: "error", text: "Passwort: mindestens 8 Zeichen, zweimal gleich." }); return; }
    const S = await kernSchloss();
    const neu = { ...unterschriften, [usSchluessel]: await S.zu(usPasswort, png) };
    await ablage.schreiben({ unterschriften: neu }); setUnterschriften(neu); setUsPasswort(""); setUsPasswort2("");
    onNotice({ kind: "success", text: "Unterschrift verschlüsselt im Datentresor gemerkt. Ohne das Passwort lässt sie sich nicht öffnen." });
  };
  const usVergessen = async () => {
    const neu = { ...unterschriften }; delete neu[usSchluessel];
    await ablage.schreiben({ unterschriften: neu }); setUnterschriften(neu); onNotice({ kind: "success", text: "Gespeicherte Unterschrift gelöscht." });
  };

  // ---------- Speicher ----------
  const speicherSchreiben = async (s: EingabeSpeicher) => { setSpeicher(s); try { await ablage.schreiben({ speicher: s }); } catch (e) { onNotice({ kind: "error", text: (e as Error).message }); } };

  // ---------- Ausgabe ----------
  const exportDok = () => ({ name: quelleName.replace(/\.[a-z0-9]{2,5}$/i, ""), pages: seiten.map((s) => ({ t: s.t, w: s.w, h: s.h })), fields: felder.map((f) => ({ ...f, value: f.type === "check" ? Boolean(f.value) : f.value })) });
  const speichern = async (art: "fest" | "ausfuellbar") => {
    if (!bytes) return;
    setArbeit(art === "fest" ? "Festes PDF wird gebaut …" : "Ausfüllbares PDF wird gebaut …");
    try {
      const ex = await kernExport();
      const texte = felder.map((f) => typeof f.value === "string" && f.type !== "unterschrift" ? f.value : "");
      const opt = brauchtUnicode(texte) ? { schrift: await unicodeSchrift() } : {};
      const r = await ex.exportieren(exportDok(), bytes, art, opt);
      const file = new File([r.bytes as BlobPart], ergebnisName(dokument.originalName, art), { type: "application/pdf" });
      const info: AusfuellInfo = { stand: "ausgefuellt", felder: felder.map((f) => ({ ...f, value: f.type === "check" ? false : "", vorschlag: undefined })), seiten: seiten.map((s) => ({ t: s.t, w: s.w, h: s.h })), geaendertAm: new Date().toISOString() };
      await onErgebnis(file, art, info);
      await speicherSchreiben(merken(speicher, felder));
      setErgebnis(file);
      onNotice({ kind: "success", text: `„${file.name}“ liegt jetzt neben dem Original in der Akte. Das Original ist unverändert.${r.hinweise.length ? ` Hinweis: ${r.hinweise.join(" ")}` : ""}` });
    } catch (e) { onNotice({ kind: "error", text: `Das PDF konnte nicht gebaut werden: ${(e as Error).message}` }); }
    finally { setArbeit(""); }
  };
  const teilen = async () => {
    if (!ergebnis) return;
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.share && nav.canShare?.({ files: [ergebnis] })) {
      try { await nav.share({ files: [ergebnis], title: ergebnis.name }); return; } catch (e) { if ((e as Error).name === "AbortError") return; }
    }
    const url = URL.createObjectURL(ergebnis); const a = document.createElement("a"); a.href = url; a.download = ergebnis.name; document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    onNotice({ kind: "info", text: "Teilen geht auf diesem Gerät nicht direkt — die Datei wurde heruntergeladen." });
  };
  const vormerken = async (an: boolean) => {
    try {
      await onVormerken(an ? { stand: "offen", felder: felder.map((f) => ({ ...f, value: f.type === "check" ? false : "", vorschlag: undefined })), seiten: seiten.map((s) => ({ t: s.t, w: s.w, h: s.h })), geaendertAm: new Date().toISOString() } : null);
      onNotice({ kind: "success", text: an ? "Vorgemerkt: „Muss noch ausgefüllt werden“ — steht jetzt im Cockpit. Die Felder sind gemerkt." : "Vormerkung entfernt." });
    } catch (e) { onNotice({ kind: "error", text: (e as Error).message }); }
  };
  const neuScannen = async () => {
    try {
      await scannen({ titel: "Unterlage scannen", fertigText: "Weiter zum Ausfüllen", name: dokument.originalName.replace(/\.[a-z0-9]{2,5}$/i, ""), fertig: async (file) => { setQuelleName(file.name); await oeffnen(file); onNotice({ kind: "info", text: "Der Scan ist die Vorlage zum Ausfüllen. Gespeichert wird er erst mit der ausgefüllten Fassung." }); } });
    } catch (e) { onNotice({ kind: "error", text: (e as Error).message }); }
  };

  const gew = felder.find((f) => f.id === gewaehlt) || null;
  const aktivFeld = felder.find((f) => f.id === aktiv) || null;
  const vorschlagListe = useMemo(() => aktivFeld && typeof aktivFeld.value === "string" ? vorschlaege(speicher, aktivFeld, aktivFeld.value) : [], [aktivFeld, speicher]);

  return <div className="modal-backdrop af-backdrop" role="presentation">
    <div className="modal af-dialog" role="dialog" aria-modal="true" aria-labelledby="af-titel" data-af>
      <div className="modal-head"><div><span className="badge neutral">Ausfüllen</span><h2 id="af-titel">{dokument.originalName}</h2><p>{seiten.length ? `${seiten.length}${gesamt > seiten.length ? ` von ${gesamt}` : ""} Seite${seiten.length === 1 ? "" : "n"} · ${felder.length} Feld${felder.length === 1 ? "" : "er"}` : "…"} · Das Original bleibt unverändert.</p></div><button className="icon-button" onClick={onClose} aria-label="Ausfüllen schließen"><X/></button></div>

      {zustand === "laden" && <div className="empty-state"><LoaderCircle className="file-viewer-spin" size={28}/><strong>{meldung}</strong></div>}
      {zustand === "fehler" && <div className="empty-state"><strong>{meldung}</strong><button className="button secondary" onClick={() => void neuScannen()}><ScanLine size={16}/> Papier-Unterlage scannen</button></div>}

      {zustand === "bereit" && <>
        <div className="af-leiste" role="toolbar" aria-label="Ausfüllen">
          <div className="af-reiter" role="tablist">
            <button role="tab" aria-selected={modus === "setzen"} className={modus === "setzen" ? "aktiv" : ""} onClick={() => setModus("setzen")}>Felder setzen</button>
            <button role="tab" aria-selected={modus === "ausfuellen"} className={modus === "ausfuellen" ? "aktiv" : ""} onClick={() => { setModus("ausfuellen"); setWerkzeug(null); }}>Ausfüllen</button>
          </div>
          {modus === "setzen" ? <>
            <button className="button secondary compact-button" onClick={() => void erkennen()} disabled={!!arbeit} data-af-erkennen><Wand2 size={16}/> Felder erkennen</button>
            <button className="button secondary compact-button" onClick={() => void kiVorbereiten()} disabled={!!arbeit} data-af-ki><Sparkles size={16}/> Mit KI benennen</button>
            <label className="af-werkzeug"><span>Neues Feld</span><select value={werkzeug || ""} onChange={(e) => setWerkzeug((e.target.value || null) as AusfuellTyp | null)} data-af-werkzeug><option value="">— wählen, dann auf die Seite tippen —</option>{(Object.keys(AUSFUELL_TYPEN) as AusfuellTyp[]).map((t) => <option key={t} value={t}>{AUSFUELL_TYPEN[t]}</option>)}</select></label>
            <button className="button secondary compact-button" onClick={() => void neuScannen()}><ScanLine size={16}/> Neu scannen</button>
          </> : <>
            <label className="af-werkzeug"><span>Angaben aus der Akte</span><select value={personId} onChange={(e) => { setPersonId(e.target.value); setUsFuer(e.target.value); }} data-af-person><option value="">Person wählen …</option>{personen.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <button className="button secondary compact-button" disabled={!personId} data-af-vorbelegen onClick={() => { const p = personen.find((x) => x.id === personId); if (!p) return; const kopie = felder.map((f) => ({ ...f })); const n = vorbelegen(kopie, p.angaben); setFelder(kopie); onNotice({ kind: n ? "success" : "info", text: n ? `${n} Feld${n === 1 ? "" : "er"} aus der Akte vorbelegt (gelb). Bitte prüfen.` : "Für diese Felder steht bei der Person nichts in der Akte." }); }}><Check size={16}/> Vorbelegen</button>
            <label className="af-schalter"><input type="checkbox" checked={speicher.an} onChange={(e) => void speicherSchreiben({ ...speicher, an: e.target.checked })} data-af-speicher-schalter/> Eingaben merken und vorschlagen</label>
            {speicherZahl(speicher) > 0 && <button className="text-link" data-af-speicher-loeschen onClick={() => void speicherSchreiben(vergessen(speicher))}>Gemerkte Eingaben löschen ({speicherZahl(speicher)})</button>}
          </>}
        </div>
        {hinweis && <p className={`af-hinweis af-hinweis-${hinweis.kind}`} role="status" data-af-hinweis>{hinweis.text}<button type="button" className="icon-button" aria-label="Hinweis schließen" onClick={() => setHinweis(null)}><X size={14}/></button></p>}
        {arbeit && <p className="af-arbeit" role="status"><LoaderCircle className="file-viewer-spin" size={16}/> {arbeit}</p>}

        {ki && <section className="af-ki card" data-af-ki-vorschau>
          <h3>Das sieht die KI</h3>
          <p className="fine-print">Nur Beschriftungen, Lage der Felder und der Seitentext — keine eingetragenen Werte, keine Bilder. Namen und Anschriften sind unkenntlich gemacht; versteckter Text ist entfernt.</p>
          {ki.leck ? <p className="af-warnung">Es steht noch Klartext darin ({ki.leck}). So geht nichts hinaus.</p> : null}
          <textarea readOnly value={ki.text} rows={8} data-kein-mikro/>
          <div className="button-row">
            <select value={kiZiel} onChange={(e) => setKiZiel(e.target.value as KiZiel)} aria-label="KI wählen">{(Object.keys(KI_ZIELE) as KiZiel[]).map((z) => <option key={z} value={z}>{KI_ZIELE[z].name}</option>)}</select>
            <button className="button primary" disabled={!!ki.leck} onClick={() => void kiOeffnen()}><ExternalLink size={16}/> Öffnen</button>
            <button className="button secondary" disabled={!!ki.leck} onClick={() => void navigator.clipboard.writeText(ki.text).then(() => onNotice({ kind: "success", text: "Auftrag kopiert." }), () => onNotice({ kind: "info", text: "Bitte von Hand kopieren." }))}><Copy size={16}/> Kopieren</button>
          </div>
          <label><span>Antwort der KI hier einfügen</span><textarea value={kiAntwort} onChange={(e) => setKiAntwort(e.target.value)} rows={4} data-af-ki-antwort data-kein-mikro/></label>
          <div className="button-row"><button className="button secondary" onClick={() => setKi(null)}>Abbrechen</button><button className="button primary" disabled={!kiAntwort.trim()} onClick={kiUebernehmen} data-af-ki-uebernehmen>Benennungen übernehmen</button></div>
        </section>}

        {modus === "setzen" && gew && <section className="af-feld-bearbeiten card" data-af-feld-bearbeiten>
          <label><span>Beschriftung</span><input value={gew.label} onChange={(e) => aendern(gew.id, { label: e.target.value, geprueft: true })} data-kein-mikro/></label>
          <label><span>Art</span><select value={gew.type} onChange={(e) => aendern(gew.id, { type: e.target.value as AusfuellTyp, value: e.target.value === "check" ? false : "", geprueft: true })}>{(Object.keys(AUSFUELL_TYPEN) as AusfuellTyp[]).map((t) => <option key={t} value={t}>{AUSFUELL_TYPEN[t]}</option>)}</select></label>
          {gew.type === "text" && <label className="af-schalter"><input type="checkbox" checked={!!gew.mehrzeilig} onChange={(e) => aendern(gew.id, { mehrzeilig: e.target.checked })}/> mehrzeilig</label>}
          <button className="button secondary compact-button" onClick={() => { setFelder((alt) => alt.filter((f) => f.id !== gew.id)); setGewaehlt(null); }} data-af-feld-loeschen><Trash2 size={16}/> Feld löschen</button>
        </section>}

        <div className="af-seiten" onPointerMove={ziehWeiter} onPointerUp={() => { ziehen.current = null; }}>
          {seiten.map((s, i) => <div key={i} className={`af-seite ${modus === "setzen" && werkzeug ? "af-setzt" : ""}`} style={{ aspectRatio: `${s.px[0]} / ${s.px[1]}`, backgroundImage: `url(${s.bild})` }} onClick={(e) => seiteTipp(e, i)} aria-label={`Seite ${i + 1}`} data-af-seite={i}>
            {felder.filter((f) => f.page === i).map((f) => {
              const pos = { left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` };
              const klasse = `af-feld af-${f.type} ${f.vorschlag ? "af-vorschlag" : ""} ${gewaehlt === f.id && modus === "setzen" ? "af-gewaehlt" : ""} ${!f.geprueft ? "af-ungeprueft" : ""}`;
              if (modus === "setzen") return <div key={f.id} className={klasse} style={pos} title={f.label} data-af-feld={f.id} onPointerDown={(e) => ziehStart(e, f, "schieben")} onClick={(e) => { e.stopPropagation(); setGewaehlt(f.id); }}><span className="af-label">{f.label}</span><span className="af-griff" onPointerDown={(e) => ziehStart(e, f, "groesse")} aria-hidden="true"/></div>;
              if (f.type === "check") return <button key={f.id} type="button" className={klasse} style={pos} aria-label={f.label} aria-pressed={!!f.value} data-af-feld={f.id} onClick={() => aendern(f.id, { value: !f.value })}>{f.value ? "✕" : ""}</button>;
              if (f.type === "unterschrift") return <button key={f.id} type="button" className={klasse} style={pos} aria-label={f.label} data-af-feld={f.id} onClick={() => setPad(f.id)}>{f.value ? <img src={String(f.value)} alt="Unterschrift"/> : <span><PenLine size={14}/> unterschreiben</span>}</button>;
              const props = { className: klasse, style: pos, "aria-label": f.label, title: f.label, value: String(f.value || ""), "data-af-feld": f.id, "data-kein-mikro": true,
                onFocus: () => setAktiv(f.id), onBlur: () => window.setTimeout(() => setAktiv((a) => a === f.id ? null : a), 180),
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => aendern(f.id, { value: e.target.value, vorschlag: false }) };
              return f.mehrzeilig ? <textarea key={f.id} {...props}/> : <input key={f.id} type={f.type === "datum" ? "date" : f.type === "email" ? "email" : f.type === "tel" ? "tel" : "text"} autoComplete="off" {...props}/>;
            })}
            {aktivFeld && aktivFeld.page === i && vorschlagListe.length > 0 && <div className="af-vorschlaege" style={{ left: `${aktivFeld.x}%`, top: `${aktivFeld.y + aktivFeld.h}%`, minWidth: `${aktivFeld.w}%` }} role="listbox" aria-label="Gemerkte Eingaben" data-af-vorschlaege>
              {vorschlagListe.map((v) => <button key={v} type="button" role="option" aria-selected="false" onMouseDown={(e) => e.preventDefault()} onClick={() => { aendern(aktivFeld.id, { value: v, vorschlag: false }); setAktiv(null); }}>{v}</button>)}
              <button type="button" className="af-vorschlag-weg" onMouseDown={(e) => e.preventDefault()} onClick={() => void speicherSchreiben(vergessen(speicher, feldArt(aktivFeld)))} title="Gemerkte Eingaben für diese Art Feld löschen">Diese Vorschläge löschen</button>
            </div>}
          </div>)}
        </div>

        {pad && <section className="af-pad card" data-af-unterschrift>
          <h3>Unterschrift</h3>
          <label className="af-werkzeug"><span>Unterschrift von</span><select value={usFuer} onChange={(e) => setUsFuer(e.target.value)}><option value="">Ich (ohne Person)</option>{personen.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          {usGemerkt && <div className="af-us-gemerkt"><span>Gespeichert (verschlüsselt).</span><input type="password" placeholder="Passwort" value={usPasswort} onChange={(e) => setUsPasswort(e.target.value)} aria-label="Passwort der Unterschrift" data-af-us-passwort/><button className="button primary compact-button" disabled={!usPasswort} onClick={() => void usEinsetzen(pad).then((ok) => { if (ok) setPad(null); })} data-af-us-einsetzen>Einsetzen</button><button className="text-link" onClick={() => void usVergessen()}>Gespeicherte löschen</button></div>}
          <UnterschriftFeld onAbbrechen={() => setPad(null)} onFertig={(png) => { aendern(pad, { value: png }); if (usPasswort && usPasswort2) void usMerken(png); setPad(null); }}/>
          <details className="af-us-merken"><summary>Diese Unterschrift verschlüsselt merken</summary>
            <p className="fine-print">Der Datentresor der Familienakte ist selbst nicht verschlüsselt. Deshalb bekommt die Unterschrift ein eigenes Passwort (mindestens 8 Zeichen). Es wird nirgends gespeichert; ohne es lässt sich die Unterschrift nicht öffnen.</p>
            <input type="password" placeholder="Passwort" value={usPasswort} onChange={(e) => setUsPasswort(e.target.value)} aria-label="Neues Passwort" data-af-us-neu1/>
            <input type="password" placeholder="Passwort wiederholen" value={usPasswort2} onChange={(e) => setUsPasswort2(e.target.value)} aria-label="Passwort wiederholen" data-af-us-neu2/>
            <p className="fine-print">Beim „Übernehmen“ oben wird sie dann gemerkt.</p>
          </details>
        </section>}

        <div className="modal-actions af-aktionen">
          <span className="fine-print" data-af-stand>{stand.leer ? `${stand.leer} Feld${stand.leer === 1 ? "" : "er"} leer` : "Alle Felder ausgefüllt"}{stand.vorschlag ? ` · ${stand.vorschlag} Vorschlag${stand.vorschlag === 1 ? "" : "e"} aus der Akte prüfen` : ""}</span>
          {dokument.ausfuellen?.stand === "offen" ? <button className="button secondary" onClick={() => void vormerken(false)}>Vormerkung entfernen</button> : <button className="button secondary" onClick={() => void vormerken(true)} disabled={!felder.length} data-af-vormerken>Später ausfüllen (vormerken)</button>}
          <button className="button secondary" onClick={() => void speichern("ausfuellbar")} disabled={!!arbeit || !felder.length} data-af-ausfuellbar>Ausfüllbares PDF speichern</button>
          <button className="button primary" onClick={() => void speichern("fest")} disabled={!!arbeit || !felder.length} data-af-fest><Download size={16}/> Festes PDF speichern</button>
          {ergebnis && <button className="button primary" onClick={() => void teilen()} data-af-teilen><Share2 size={16}/> Teilen</button>}
        </div>
      </>}
    </div>
  </div>;
}
