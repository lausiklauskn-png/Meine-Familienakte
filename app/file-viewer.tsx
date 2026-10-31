// Zeigt Dokumente direkt in der Seite an, wenn neue Fenster nicht erlaubt sind
// (z. B. wenn die Familienakte eingebettet als Link auf claude.ai läuft).
// Bilder und Text werden direkt gezeigt, PDFs Seite für Seite gezeichnet.

import { useEffect, useRef, useState } from "react";
import { ExternalLink, LoaderCircle, X } from "lucide-react";

type ViewRequest = { id: number; file: File; title: string };
let nextId = 1;
let current: ViewRequest | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const embedded = () => { try { return window.self !== window.top; } catch { return true; } };

/** Öffnet eine Datei: normal in einem neuen Fenster, eingebettet in einer Vorschau innerhalb der Seite. */
export function openFile(file: File, title = file.name) {
  if (!embedded()) {
    const url = URL.createObjectURL(file);
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    if (opened !== null || !isPreviewable(file)) return;
  }
  current = { id: nextId++, file, title };
  notify();
}

function isPreviewable(file: File) {
  return file.type.startsWith("image/") || file.type === "application/pdf" || file.type.startsWith("text/") || /\.(pdf|txt|json|csv|png|jpe?g|webp|gif)$/i.test(file.name);
}

// pdf.js 3.11.174, siehe public/vendor/pdfjs/HERKUNFT.md
type PdfJs = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (input: { data: Uint8Array }) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<{ getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> } }> }> };
};
let pdfJsPromise: Promise<PdfJs> | null = null;
function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src; script.async = true;
    script.onload = () => resolve(); script.onerror = () => reject(new Error(`${src} konnte nicht geladen werden.`));
    document.head.appendChild(script);
  });
}
function loadPdfJs(): Promise<PdfJs> {
  if (!pdfJsPromise) {
    // pdf.js liegt im Paket (public/vendor/pdfjs, A8): keine Verbindung nach außen, geht offline und bei ausgeschaltetem
    // Internetschalter. In der Einzeldatei ist die Bibliothek schon eingebettet (window.pdfjsLib vorhanden).
    const base = new URL("vendor/pdfjs", document.baseURI).href;
    const preloaded = (window as unknown as { pdfjsLib?: PdfJs }).pdfjsLib;
    // Der Worker wird im Hauptfenster geladen; pdf.js nutzt ihn dann ohne eigenen Hintergrundprozess.
    pdfJsPromise = (preloaded ? Promise.resolve() : loadScript(`${base}/pdf.min.js`).then(() => loadScript(`${base}/pdf.worker.min.js`))).then(() => {
      const lib = (window as unknown as { pdfjsLib?: PdfJs }).pdfjsLib;
      if (!lib) throw new Error("Die PDF-Anzeige ist nicht verfügbar.");
      lib.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.js`;
      return lib;
    }).catch((error) => { pdfJsPromise = null; throw error; });
  }
  return pdfJsPromise;
}

/** Text aus der Textebene eines PDF (für den KI-Auftrag), höchstens `maxSeiten` Seiten. Gescannte Seiten ohne Textebene liefern nichts. */
export async function pdfText(file: File, maxSeiten = 30): Promise<string> {
  const lib = await loadPdfJs();
  type TextSeite = { getTextContent: () => Promise<{ items: Array<{ str?: string; hasEOL?: boolean }> }> };
  const doc = await (lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise as unknown as Promise<{ numPages: number; getPage: (n: number) => Promise<TextSeite> }>);
  const teile: string[] = [];
  for (let n = 1; n <= Math.min(doc.numPages, maxSeiten); n++) {
    const inhalt = await (await doc.getPage(n)).getTextContent();
    teile.push(inhalt.items.map((i) => (i.str || "") + (i.hasEOL ? "\n" : " ")).join("").replace(/[ \t]+/g, " ").trim());
  }
  return teile.filter(Boolean).join("\n\n");
}

function PdfPages({ file }: { file: File }) {
  const holder = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"laden" | "fertig" | "fehler">("laden");
  const [pages, setPages] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lib = await loadPdfJs();
        const pdf = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        if (cancelled || !holder.current) return;
        setPages(pdf.numPages);
        holder.current.innerHTML = "";
        const width = Math.min(holder.current.clientWidth || 640, 900);
        for (let number = 1; number <= Math.min(pdf.numPages, 30); number++) {
          const page = await pdf.getPage(number);
          const base = page.getViewport({ scale: 1 });
          const ratio = window.devicePixelRatio || 1;
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width; canvas.height = viewport.height;
          canvas.style.width = `${viewport.width / ratio}px`; canvas.style.height = `${viewport.height / ratio}px`;
          canvas.setAttribute("aria-label", `Seite ${number}`);
          if (cancelled || !holder.current) return;
          holder.current.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
        }
        if (!cancelled) setState("fertig");
      } catch { if (!cancelled) setState("fehler"); }
    })();
    return () => { cancelled = true; };
  }, [file]);
  return <>
    {state === "laden" && <div className="empty-state"><LoaderCircle className="file-viewer-spin" size={28}/><strong>PDF wird angezeigt …</strong></div>}
    {state === "fehler" && <div className="empty-state"><strong>Die PDF-Vorschau ist hier nicht verfügbar.</strong><span>Die Datei liegt unverändert im Datentresor.</span></div>}
    {state === "fertig" && pages > 30 && <p className="fine-print">Es werden die ersten 30 von {pages} Seiten angezeigt.</p>}
    <div className="file-viewer-pages" ref={holder}/>
  </>;
}

function Body({ file }: { file: File }) {
  const [text, setText] = useState<string | null>(null);
  const [url, setUrl] = useState<string>("");
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const isImage = file.type.startsWith("image/");
  const isText = file.type.startsWith("text/") || /\.(txt|json|csv)$/i.test(file.name);
  useEffect(() => {
    if (!isImage) return;
    const objectUrl = URL.createObjectURL(file); setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, isImage]);
  useEffect(() => { if (isText) void file.text().then((value) => setText(value.slice(0, 200000))); }, [file, isText]);
  if (isPdf) return <PdfPages file={file}/>;
  if (isImage) return url ? <img className="file-viewer-image" src={url} alt={file.name}/> : null;
  if (isText) return <pre className="file-viewer-text">{text ?? "Wird geladen …"}</pre>;
  return <div className="empty-state"><strong>Für diesen Dateityp gibt es hier keine Vorschau.</strong><span>{file.name} liegt unverändert im Datentresor.</span></div>;
}

export function FileViewerHost() {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const listener = () => setVersion((value) => value + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  if (!current) return null;
  const view = current;
  const close = () => { current = null; notify(); };
  const openOutside = () => { const url = URL.createObjectURL(view.file); window.open(url, "_blank", "noopener,noreferrer"); window.setTimeout(() => URL.revokeObjectURL(url), 60000); };
  return <div className="modal-backdrop file-viewer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()} onKeyDown={(event) => { if (event.key === "Escape") close(); }}>
    <div className="modal file-viewer" role="dialog" aria-modal="true" aria-labelledby={`file-viewer-${view.id}`}>
      <div className="modal-head"><div><span className="badge neutral">Dokumentvorschau</span><h2 id={`file-viewer-${view.id}`}>{view.title}</h2><p>{view.file.name} · {(view.file.size / 1024).toLocaleString("de-DE", { maximumFractionDigits: 0 })} KB</p></div><button className="icon-button" onClick={close} aria-label="Vorschau schließen" autoFocus><X/></button></div>
      <div className="file-viewer-body"><Body key={view.id} file={view.file}/></div>
      <div className="modal-actions"><button type="button" className="button secondary" onClick={openOutside}><ExternalLink size={16}/> In neuem Fenster versuchen</button><button type="button" className="button primary" onClick={close}>Schließen</button></div>
    </div>
  </div>;
}
