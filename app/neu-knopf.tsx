import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { workspaceStorage } from "../lib/demo-workspace.ts";

/**
 * Knopf „Neu“ im Kopf mit Fenster „Was ist neu“ (Klaus 2026-11-05, Vorschau freigegeben). Roter Punkt, solange etwas
 * Ungelesenes da ist; jeder Eintrag verschwindet mit ×, gemerkt je Gerät (Demo getrennt). Die Liste steht hier im Code,
 * neue Einträge bekommen eine neue Kennung. Keine Personennamen.
 */
export type Neuigkeit = { id: string; titel: string; text: string; knopf?: { text: string; ziel: "kalender" | "hilfe-sichern" | "hilfe" } };
export const NEUIGKEITEN: Neuigkeit[] = [
  { id: "daten-2026-11-07", titel: "Sichern auch am Handy", text: "Vollsicherung in einen frei gewählten Ordner (SD-Karte, USB), mit Programm daneben. Sicherung einlesen nach Neuinstallation. Zu große Fotos lassen sich verkleinern. Die Demo arbeitet an einer Kopie deiner Daten.", knopf: { text: "Akten sichern", ziel: "hilfe-sichern" } },
  { id: "hilfe-2026-11-07", titel: "Hilfe auf neuem Stand", text: "Oben „Wie kann ich dir helfen?“, Themen nach Schritten geordnet, Sprünge mit rotem Rahmen. Neu am rechten Rand: Seitenleiste mit alle zu, nach oben, zurück.", knopf: { text: "Zur Hilfe", ziel: "hilfe" } },
  { id: "kalender-2026-11", titel: "Fristen im Kalender", text: "Termine und Fristen landen mit Erinnerung in deinem Kalender.", knopf: { text: "Kalender verbinden", ziel: "kalender" } },
  { id: "akten-sichern-2026-11", titel: "Akten sichern", text: "Plan zum Abhaken in der Hilfe.", knopf: { text: "Zur Hilfe", ziel: "hilfe-sichern" } },
];
export const NEU_GELESEN_SCHLUESSEL = "familienakte-neu-gelesen-v1";

function gelesenLesen(): string[] {
  try { const v = JSON.parse(workspaceStorage.getItem(NEU_GELESEN_SCHLUESSEL) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; }
}
function gelesenSchreiben(ids: string[]) { try { workspaceStorage.setItem(NEU_GELESEN_SCHLUESSEL, JSON.stringify(ids)); } catch { /* nur für diese Sitzung */ } }

export function NeuKnopf({ ziel }: { ziel: (z: NonNullable<Neuigkeit["knopf"]>["ziel"]) => void }) {
  const [gelesen, setGelesen] = useState<string[]>(gelesenLesen);
  const [offen, setOffen] = useState(false);
  const rahmen = useRef<HTMLSpanElement>(null);
  const ungelesen = NEUIGKEITEN.filter((n) => !gelesen.includes(n.id));
  useEffect(() => {
    if (!offen) return;
    const weg = (event: Event) => { if (!rahmen.current?.contains(event.target as Node)) setOffen(false); };
    const taste = (event: KeyboardEvent) => { if (event.key === "Escape") setOffen(false); };
    document.addEventListener("pointerdown", weg); document.addEventListener("keydown", taste);
    return () => { document.removeEventListener("pointerdown", weg); document.removeEventListener("keydown", taste); };
  }, [offen]);
  const ausblenden = (id: string) => { const neu = [...new Set([...gelesen, id])]; setGelesen(neu); gelesenSchreiben(neu); };
  const label = ungelesen.length ? `Was ist neu – ${ungelesen.length} Neuigkeit${ungelesen.length === 1 ? "" : "en"}` : "Was ist neu";
  return <span className="neu-knopf" ref={rahmen}>
    <button type="button" className="neu-knopf-schalter" aria-haspopup="dialog" aria-expanded={offen} aria-label={label} title={label} onClick={() => setOffen((x) => !x)} data-ungelesen={ungelesen.length}>
      {ungelesen.length > 0 && <span className="neu-punkt" aria-hidden="true"/>}Neu
    </button>
    {offen && <section className="neu-fenster" role="dialog" aria-label="Was ist neu">
      <h2>Was ist neu</h2>
      {ungelesen.length ? <ul>{ungelesen.map((n) => <li key={n.id} className="neu-eintrag" data-neu={n.id}>
        <div><strong>{n.titel}</strong><span>{n.text}</span>{n.knopf && <button type="button" className="button primary" onClick={() => { setOffen(false); ziel(n.knopf!.ziel); }}>{n.knopf.text}</button>}</div>
        <button type="button" className="neu-x" aria-label={`„${n.titel}“ ausblenden`} title="Ausblenden" onClick={() => ausblenden(n.id)}><X size={15}/></button>
      </li>)}</ul> : <p className="neu-leer">Nichts Neues. Alles gelesen.</p>}
    </section>}
  </span>;
}
