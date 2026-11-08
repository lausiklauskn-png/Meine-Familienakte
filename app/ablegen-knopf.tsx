import { useEffect, useRef, useState } from "react";
import { Camera, FileText, FolderOpen, Import } from "lucide-react";
import type { DocumentIntakeSource } from "@/lib/document-intake";

/**
 * Ein Einstieg zum Ablegen (2.28.39, Klaus 08.11.2026, Vorschau neugestaltung-2.28.39 Punkt 2): Knopf „Ablegen“ im Kopf
 * (offenes Fach mit Pfeil nach unten) klappt eine Auswahl auf – 📷 Fotografieren · 📄 Dateien wählen · 📁 Ordner. Alle drei
 * enden in derselben Eingangszentrale mit Prüfliste; abgelegt wird erst nach Bestätigung dort.
 */
export const ABLEGEN_OEFFNEN = "familienakte:ablegen-oeffnen";
export type AblegenWahl = "foto" | "dateien" | "ordner";
const QUELLE: Record<AblegenWahl, DocumentIntakeSource> = { foto: "camera-scan", dateien: "file-picker", ordner: "local-inbox" };

export function AblegenKnopf({ onDateien }: { onDateien: (files: File[], quelle: DocumentIntakeSource, wahl: AblegenWahl) => void }) {
  const [offen, setOffen] = useState(false);
  const rahmen = useRef<HTMLSpanElement>(null);
  const foto = useRef<HTMLInputElement>(null);
  const dateien = useRef<HTMLInputElement>(null);
  const ordner = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Ordnerwahl: Chrome/Edge (und Android-Chrome mit Dateiauswahl) kennen das Attribut nur ohne React-Typ.
    ordner.current?.setAttribute("webkitdirectory", "");
    ordner.current?.setAttribute("directory", "");
  }, []);
  // „So fängst du an“ › „Erstes Dokument ablegen“ öffnet diese Auswahl (zeigt, wo der Knopf sitzt).
  useEffect(() => {
    const auf = () => { window.scrollTo({ top: 0 }); setOffen(true); };
    window.addEventListener(ABLEGEN_OEFFNEN, auf);
    return () => window.removeEventListener(ABLEGEN_OEFFNEN, auf);
  }, []);
  useEffect(() => {
    if (!offen) return;
    const weg = (event: Event) => { if (!rahmen.current?.contains(event.target as Node)) setOffen(false); };
    const taste = (event: KeyboardEvent) => { if (event.key === "Escape") setOffen(false); };
    document.addEventListener("pointerdown", weg); document.addEventListener("keydown", taste);
    return () => { document.removeEventListener("pointerdown", weg); document.removeEventListener("keydown", taste); };
  }, [offen]);
  const gewaehlt = (wahl: AblegenWahl) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const liste = Array.from(event.target.files || []).filter((f) => f.size > 0 && !f.name.startsWith("."));
    event.target.value = "";
    setOffen(false);
    if (liste.length) onDateien(liste, QUELLE[wahl], wahl);
  };
  const waehlen = (ref: React.RefObject<HTMLInputElement | null>) => () => ref.current?.click();
  return <span className="ablegen-knopf" ref={rahmen}>
    <button type="button" className="icon-button ablegen-knopf-schalter" onClick={() => setOffen((x) => !x)} aria-haspopup="menu" aria-expanded={offen}
      title="Ablegen: fotografieren, Dateien oder Ordner wählen" aria-label="Ablegen" data-ablegen-knopf><Import size={18}/><span className="kopf-wort" aria-hidden="true">Ablegen</span></button>
    {offen && <div className="ablegen-auswahl" role="menu" aria-label="Ablegen" data-ablegen-auswahl>
      <button type="button" role="menuitem" onClick={waehlen(foto)} data-ablegen="foto"><Camera size={18}/><span><strong>Fotografieren</strong><small>Kamera öffnen</small></span></button>
      <button type="button" role="menuitem" onClick={waehlen(dateien)} data-ablegen="dateien"><FileText size={18}/><span><strong>Dateien wählen</strong><small>PDF, Fotos, Word, E-Mails</small></span></button>
      <button type="button" role="menuitem" onClick={waehlen(ordner)} data-ablegen="ordner"><FolderOpen size={18}/><span><strong>Ordner</strong><small>alle Dateien eines Ordners</small></span></button>
      <p className="ablegen-auswahl-ziel">Alles landet in der Eingangszentrale zur Prüfung.</p>
    </div>}
    <input ref={foto} type="file" accept="image/*" capture="environment" multiple hidden onChange={gewaehlt("foto")} data-ablegen-eingabe="foto"/>
    <input ref={dateien} type="file" multiple hidden onChange={gewaehlt("dateien")} data-ablegen-eingabe="dateien"/>
    <input ref={ordner} type="file" multiple hidden onChange={gewaehlt("ordner")} data-ablegen-eingabe="ordner"/>
  </span>;
}
