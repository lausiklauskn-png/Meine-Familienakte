// Seite „Workflow PDF“ (Klaus 2026-11-01, Weg B: „einen Klon von WF PDF integrieren in den Farben von Familienakte“).
// Zeigt die ganze App Workflow PDF als Klon (public/apps/workflow-pdf/, byte-1:1, Pins public/apps/HERKUNFT.json) in einem
// Rahmen. Der Klon hat eine eigene Bibliothek (FamilienakteWFPDF1, public/apps/fa-wfpdf-bruecke.js), keinen eigenen Service
// Worker und keinen Mycel-Knoten. Der Rahmen wird erst auf dieser Seite geladen.
import { useEffect, useRef, useState } from "react";

export const KLON_ADRESSE = "apps/workflow-pdf/index.html";

export function WorkflowPdfSeite({ kopf }: { kopf: React.ReactNode }) {
  const rahmen = useRef<HTMLIFrameElement>(null);
  const [bereit, setBereit] = useState(false);
  useEffect(() => {
    const an = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== rahmen.current?.contentWindow) return;
      if ((e.data as { typ?: string })?.typ === "fa-wfpdf-bereit") setBereit(true);
    };
    window.addEventListener("message", an);
    return () => window.removeEventListener("message", an);
  }, []);
  return (
    <div className="fa-wfpdf-seite" data-wfpdf-seite data-wfpdf-bereit={bereit ? "1" : "0"}>
      {kopf}
      <iframe ref={rahmen} className="fa-wfpdf-rahmen" title="Workflow PDF" src={new URL(KLON_ADRESSE, document.baseURI).href}
        allow="camera; microphone; clipboard-read; clipboard-write; web-share" data-wfpdf-rahmen/>
    </div>
  );
}
