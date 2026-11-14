"use client";
// 👁 im Pseudo-Fenster bei PDF (Klaus 14.11.): die echte Seite, auf dem Gerät gezeichnet (pdf.js aus dem Paket, ohne Netz), darüber die
// verdeckten Stellen an ihrem Platz – „KI sieht“ schwarz mit Platzhalter, „Original“ gelb markiert. Lage aus der Textebene
// (lib/pdf-kaesten.ts). Ohne Textebene (Scan) meldet die Seite das, und die Ansicht nimmt die Text-Seite (Rückfall).
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { loadPdfJs } from "./file-viewer";
import { kaestenFuerSeite, type Kasten, type TextStueck, type Wert } from "../lib/pdf-kaesten";

type Viewport = { width: number; height: number; convertToViewportPoint: (x: number, y: number) => [number, number] };
type Seite = {
  getViewport: (o: { scale: number }) => Viewport;
  render: (o: { canvasContext: CanvasRenderingContext2D; viewport: Viewport }) => { promise: Promise<void> };
  getTextContent: () => Promise<{ items: Array<{ str?: string; transform?: number[]; width?: number; height?: number }> }>;
};
type Dok = { numPages: number; getPage: (n: number) => Promise<Seite>; destroy?: () => void };

export function PdfSeite({ datei, seite, werte, sicht, unsicher, onStelle, onInfo }: {
  datei: File; seite: number; werte: Wert[]; sicht: "ki" | "original"; unsicher: (token: string) => boolean;
  onStelle: (token: string, e: MouseEvent) => void;
  onInfo: (i: { seiten: number; mitText: boolean }) => void;
}) {
  const leinwand = useRef<HTMLCanvasElement>(null);
  const halter = useRef<HTMLDivElement>(null);
  const [dok, setDok] = useState<Dok | null>(null);
  const [stuecke, setStuecke] = useState<TextStueck[]>([]);
  const [verhaeltnis, setVerhaeltnis] = useState(1.414);
  const [fehler, setFehler] = useState(false);
  const info = useRef(onInfo); info.current = onInfo;

  useEffect(() => {
    let weg = false; let d: Dok | null = null;
    (async () => {
      try {
        const lib = await loadPdfJs();
        d = await (lib.getDocument({ data: new Uint8Array(await datei.arrayBuffer()) }).promise as unknown as Promise<Dok>);
        if (weg) return;
        // Textebene über die ersten Seiten prüfen: ohne Text ist das Seitenbild ohne Kästen nutzlos.
        let zeichen = 0;
        for (let n = 1; n <= Math.min(d.numPages, 3); n++) zeichen += (await (await d.getPage(n)).getTextContent()).items.reduce((a, i) => a + (i.str || "").trim().length, 0);
        if (weg) return;
        setDok(d); info.current({ seiten: d.numPages, mitText: zeichen >= 20 });
      } catch { if (!weg) { setFehler(true); info.current({ seiten: 0, mitText: false }); } }
    })();
    return () => { weg = true; d?.destroy?.(); };
  }, [datei]);

  useEffect(() => {
    if (!dok) return;
    let weg = false;
    (async () => {
      const s = await dok.getPage(Math.min(seite + 1, dok.numPages));
      const basis = s.getViewport({ scale: 1 });
      const breite = Math.min(halter.current?.clientWidth || 600, 900);
      const dpr = window.devicePixelRatio || 1;
      const vp = s.getViewport({ scale: (breite / basis.width) * dpr });
      const c = leinwand.current; if (!c || weg) return;
      c.width = vp.width; c.height = vp.height;
      setVerhaeltnis(vp.height / vp.width);
      await s.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
      const inhalt = await s.getTextContent();
      if (weg) return;
      const aus: TextStueck[] = [];
      for (const i of inhalt.items) {
        if (!i.str || !i.transform) continue;
        const [x, y] = vp.convertToViewportPoint(i.transform[4], i.transform[5]);
        const hoehe = Math.hypot(i.transform[2], i.transform[3]) * (vp.width / basis.width);
        const w = (i.width || 0) * (vp.width / basis.width);
        aus.push({ str: i.str, x: x / vp.width * 100, y: (y - hoehe) / vp.height * 100, w: w / vp.width * 100, h: hoehe * 1.2 / vp.height * 100 });
      }
      setStuecke(aus);
    })().catch(() => setFehler(true));
    return () => { weg = true; };
  }, [dok, seite]);

  const kaesten: Kasten[] = useMemo(() => kaestenFuerSeite(stuecke, werte), [stuecke, werte]);
  if (fehler) return <p className="leise">Die Seite lässt sich hier nicht zeichnen – unten die Text-Seite.</p>;
  return <div ref={halter} className={`pf-pdfseite ${sicht === "ki" ? "zeigt-ki" : "zeigt-original"}`} style={{ aspectRatio: `1 / ${verhaeltnis}` }} data-pseudo-pdfseite={kaesten.length}>
    <canvas ref={leinwand} aria-label={`Seite ${seite + 1}`}/>
    {kaesten.map((k, i) => <span key={i} className={`pf-kasten${unsicher(k.token) ? " unsicher" : ""}`} data-pseudo-kasten={k.token} data-t={k.token}
      style={{ left: `${k.x}%`, top: `${k.y}%`, width: `${k.w}%`, height: `${k.h}%` }} onClick={(e) => { e.stopPropagation(); onStelle(k.token, e); }}/>)}
  </div>;
}
