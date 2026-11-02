// Seite „Workflow PDF“ (Klaus 2026-11-01, Weg B: „einen Klon von WF PDF integrieren in den Farben von Familienakte“).
// Zeigt die ganze App Workflow PDF als Klon (public/apps/workflow-pdf/, byte-1:1, Pins public/apps/HERKUNFT.json) in einem
// Rahmen. Der Klon hat eine eigene Bibliothek (FamilienakteWFPDF1, public/apps/fa-wfpdf-bruecke.js), keinen eigenen Service
// Worker und keinen Mycel-Knoten. Der Rahmen wird erst auf dieser Seite geladen.
// Stück 2: „📤 Teilen“ im Klon und ein Scan, den die Akte gestartet hat, kommen über die Brücke zurück (onAblegen);
// eine Unterlage aus der Akte geht über die Brücke hinein (oeffnen → bestätigter normaler Import im Klon).
import { useEffect, useRef, useState } from "react";

export const KLON_ADRESSE = "apps/workflow-pdf/index.html";
export type WfpdfAblage = { quelle: "teilen" | "scan"; dateien: File[]; vertraege: unknown[] };

export function WorkflowPdfSeite({ kopf, scan = false, oeffnen = null, onAblegen, onGeoeffnet }: {
  kopf: React.ReactNode; scan?: boolean; oeffnen?: File[] | null; onAblegen?: (a: WfpdfAblage) => Promise<unknown>; onGeoeffnet?: () => void;
}) {
  const rahmen = useRef<HTMLIFrameElement>(null);
  const gesendet = useRef<string | null>(null);
  const [bereit, setBereit] = useState(false);
  const [fehler, setFehler] = useState(false);
  const [versuch, setVersuch] = useState(0);
  const ablegen = useRef(onAblegen); ablegen.current = onAblegen;
  useEffect(() => {
    const an = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== rahmen.current?.contentWindow) return;
      const d = (e.data || {}) as { typ?: string; quelle?: string; id?: string; ok?: boolean; dateien?: unknown[]; vertraege?: unknown[] };
      if (d.typ === "fa-wfpdf-bereit") setBereit(true);
      if (d.typ === "fa-wfpdf-geoeffnet" && d.id === gesendet.current) {
        if (d.ok === true) { gesendet.current = null; setFehler(false); fertig.current?.(); }
        else setFehler(true);
      }
      if (d.typ === "fa-wfpdf-ablegen" && typeof d.id === "string" && d.id.length <= 160 && Array.isArray(d.dateien) && Array.isArray(d.vertraege)) {
        const dateien = d.dateien.filter((f): f is File => f instanceof Blob && typeof (f as File).name === "string");
        const antwort = (ok: boolean) => rahmen.current?.contentWindow?.postMessage({ typ: "fa-wfpdf-abgelegt", id: d.id, ok }, location.origin);
        if (!dateien.length || dateien.length > 30 || dateien.length !== d.dateien.length || dateien.length !== d.vertraege.length || !ablegen.current) { antwort(false); return; }
        void ablegen.current({ quelle: d.quelle === "scan" ? "scan" : "teilen", dateien, vertraege: d.vertraege }).then(() => antwort(true), () => antwort(false));
      }
    };
    window.addEventListener("message", an);
    return () => window.removeEventListener("message", an);
  }, []);
  const fertig = useRef(onGeoeffnet); fertig.current = onGeoeffnet;
  useEffect(() => {
    if (!bereit) return;
    if (oeffnen?.length) {
      setFehler(false);
      const id = gesendet.current || crypto.randomUUID(); gesendet.current = id;
      rahmen.current?.contentWindow?.postMessage({ typ: "fa-wfpdf-oeffnen", id, dateien: oeffnen }, location.origin);
    } else if (scan) fertig.current?.();
  }, [bereit, oeffnen, scan, versuch]);
  // Die Adresse gilt für die ganze Lebenszeit des Rahmens: ein späteres scan=false lädt ihn nicht neu.
  const [src] = useState(() => new URL(KLON_ADRESSE + (scan ? "?scan=1&von=Familienakte" : ""), document.baseURI).href);
  return (
    <div className="fa-wfpdf-seite" data-wfpdf-seite data-wfpdf-oeffnen-offen={oeffnen?.length ? "1" : "0"} data-wfpdf-bereit={bereit ? "1" : "0"}>
      {kopf}
      {fehler && <div role="alert">Workflow PDF hat die Ablage noch nicht bestätigt. Die Quelle bleibt in der Familienakte. <button type="button" onClick={() => setVersuch(v => v + 1)}>Erneut übergeben</button></div>}
      <iframe ref={rahmen} className="fa-wfpdf-rahmen" title="Workflow PDF" src={src}
        allow="camera; microphone; clipboard-read; clipboard-write; web-share" data-wfpdf-rahmen/>
    </div>
  );
}
