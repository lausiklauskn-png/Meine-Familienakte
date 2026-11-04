// Seite „Workflow PDF“ (Klaus 2026-11-01, Weg B: „einen Klon von WF PDF integrieren in den Farben von Familienakte“).
// Zeigt die ganze App Workflow PDF als Klon (public/apps/workflow-pdf/, byte-1:1, Pins public/apps/HERKUNFT.json) in einem
// Rahmen. Der Klon hat eine eigene Bibliothek (FamilienakteWFPDF1, public/apps/fa-wfpdf-bruecke.js), keinen eigenen Service
// Worker und keinen Mycel-Knoten. Der Rahmen wird erst auf dieser Seite geladen.
// Stück 2: „📤 Teilen“ im Klon und ein Scan, den die Akte gestartet hat, kommen über die Brücke zurück (onAblegen);
// Bestandsunterlagen werden quellgebunden nur im Arbeitsspeicher geöffnet und kehren nach bestätigtem Speichern zur Akte zurück.
import type { PdfQuelle } from "../lib/pdf-bearbeitung";
import { useEffect, useRef, useState } from "react";

export const KLON_ADRESSE = "apps/workflow-pdf/index.html";
export type WfpdfAblage = { quelle: "teilen" | "scan"; dateien: File[]; vertraege: unknown[]; bearbeitung?: string | null };

export function WorkflowPdfSeite({ kopf, scan = false, oeffnen = null, onAblegen, onGeoeffnet, bindung = null, onZurueck }: {
  kopf: React.ReactNode; scan?: boolean; oeffnen?: File[] | null; onAblegen?: (a: WfpdfAblage) => Promise<unknown>; onGeoeffnet?: () => void; bindung?: PdfQuelle | null; onZurueck?: () => void;
}) {
  const rahmen = useRef<HTMLIFrameElement>(null);
  const gesendet = useRef<string | null>(null);
  const quelle = useRef(bindung); quelle.current = bindung;
  const rueckweg = useRef(onZurueck); rueckweg.current = onZurueck;
  const bestaetigteRueckgabe = useRef<string | null>(null);
  const [rueckFehler, setRueckFehler] = useState("");
  const [imRaum, setImRaum] = useState(false);
  const [bereit, setBereit] = useState(false);
  const [fehler, setFehler] = useState(false);
  const [versuch, setVersuch] = useState(0);
  const ablegen = useRef(onAblegen); ablegen.current = onAblegen;
  useEffect(() => {
    const an = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== rahmen.current?.contentWindow) return;
      const d = (e.data || {}) as { typ?: string; quelle?: string; id?: string; ok?: boolean; dateien?: unknown[]; vertraege?: unknown[]; bearbeitung?: string; sitzung?: string };
      if (d.typ === "fa-wfpdf-rueckgabe-fertig" && d.id === bestaetigteRueckgabe.current && d.sitzung === quelle.current?.sitzung) { bestaetigteRueckgabe.current = null; rueckweg.current?.(); }
      if (d.typ === "fa-wfpdf-bereit") setBereit(true);
      if (d.typ === "fa-wfpdf-geoeffnet" && d.id === gesendet.current) {
        if (d.ok === true) { gesendet.current = null; setFehler(false); setImRaum(true); fertig.current?.(); }
        else setFehler(true);
      }
      if (d.typ === "fa-wfpdf-ablegen" && typeof d.id === "string" && d.id.length <= 160 && Array.isArray(d.dateien) && Array.isArray(d.vertraege)) {
        const dateien = d.dateien.filter((f): f is File => f instanceof Blob && typeof (f as File).name === "string");
        const antwort = (ok: boolean) => rahmen.current?.contentWindow?.postMessage({ typ: "fa-wfpdf-abgelegt", id: d.id, ok }, location.origin);
        if (!dateien.length || dateien.length > 30 || dateien.length !== d.dateien.length || dateien.length !== d.vertraege.length || !ablegen.current) { antwort(false); return; }
        if (quelle.current && (d.bearbeitung !== quelle.current.sitzung || dateien.length !== 1)) { antwort(false); return; }
        if (!quelle.current && d.bearbeitung) { antwort(false); return; }
        void ablegen.current({ bearbeitung: d.bearbeitung || null, quelle: d.quelle === "scan" ? "scan" : "teilen", dateien, vertraege: d.vertraege }).then(() => { bestaetigteRueckgabe.current = d.id!; setRueckFehler(""); antwort(true); }, (error) => { if (quelle.current) setRueckFehler(error instanceof Error ? error.message : "Die Rückgabe wurde nicht bestätigt. Der Arbeitsraum bleibt offen."); antwort(false); });
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
      rahmen.current?.contentWindow?.postMessage({ typ: "fa-wfpdf-oeffnen", id, dateien: oeffnen, bindung: quelle.current }, location.origin);
    } else if (scan) fertig.current?.();
  }, [bereit, oeffnen, scan, versuch]);
  // Die Adresse gilt für die ganze Lebenszeit des Rahmens: ein späteres scan=false lädt ihn nicht neu.
  const [src] = useState(() => new URL(KLON_ADRESSE + (bindung ? "?akte=1" : scan ? "?scan=1&von=Familienakte" : ""), document.baseURI).href);
  return (
    <div className="fa-wfpdf-seite" data-wfpdf-seite data-wfpdf-oeffnen-offen={oeffnen?.length ? "1" : "0"} data-wfpdf-bereit={bereit ? "1" : "0"}>
      {kopf}
      {bindung && <div className="card" data-wfpdf-arbeitsraum>
        <p>Vorübergehender Bearbeitungsraum. Beim Zurückspeichern bleiben Dokument und Zuordnung in der Akte erhalten.</p>
        <button type="button" className="button primary" disabled={!imRaum} onClick={() => rahmen.current?.contentWindow?.postMessage({ typ: "fa-wfpdf-zurueck", sitzung: bindung.sitzung }, location.origin)} data-wfpdf-zurueck>In Akte zurückspeichern</button>
      </div>}
      {rueckFehler && <div role="alert" data-wfpdf-rueckfehler>{rueckFehler}</div>}
      {fehler && <div role="alert">Workflow PDF hat die Ablage noch nicht bestätigt. Die Quelle bleibt in der Familienakte. <button type="button" onClick={() => setVersuch(v => v + 1)}>Erneut übergeben</button></div>}
      <iframe ref={rahmen} className="fa-wfpdf-rahmen" title="Workflow PDF" src={src}
        allow="camera; microphone; clipboard-read; clipboard-write; web-share" data-wfpdf-rahmen/>
    </div>
  );
}
