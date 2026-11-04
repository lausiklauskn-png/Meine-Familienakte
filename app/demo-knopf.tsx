import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, RefreshCw, Trash2, Play } from "lucide-react";

/**
 * Demo nur noch über einen Knopf (Nutzerwunsch 2026-11-04): Ist die Demo aus, steht oben nichts von „Demo“; gestartet wird
 * sie hinten in der Hilfe ({@link DemoStarten}). Läuft sie, steht direkt hinter „FAMILIENAKTE“ der rote Knopf „DEMO ▾“;
 * ein Tipp klappt am Knopf das Menü auf: Demo verlassen · Demo zurücksetzen · Demo löschen und verlassen.
 * Kein „zweimal tippen“. Schließt bei Tipp daneben und mit Esc.
 */
export function DemoKnopf({ gesperrt, verlassen, zuruecksetzen, loeschen }: { gesperrt: boolean; verlassen: () => void; zuruecksetzen: () => void; loeschen: () => void }) {
  const [offen, setOffen] = useState(false);
  const rahmen = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!offen) return;
    const weg = (event: Event) => { if (!rahmen.current?.contains(event.target as Node)) setOffen(false); };
    const taste = (event: KeyboardEvent) => { if (event.key === "Escape") setOffen(false); };
    document.addEventListener("pointerdown", weg); document.addEventListener("keydown", taste);
    return () => { document.removeEventListener("pointerdown", weg); document.removeEventListener("keydown", taste); };
  }, [offen]);
  const wahl = (tun: () => void) => () => { setOffen(false); tun(); };
  return <span className="demo-knopf" ref={rahmen}>
    <button type="button" className="demo-knopf-schalter" aria-haspopup="menu" aria-expanded={offen} aria-label="Demo läuft – Menü" title="Demo läuft: Vorführung mit erfundener Beispielfamilie" onClick={() => setOffen((wert) => !wert)}>DEMO<ChevronDown size={14} aria-hidden="true"/></button>
    {offen && <span className="demo-knopf-menue" role="menu">
      <button type="button" role="menuitem" disabled={gesperrt} onClick={wahl(verlassen)}><LogOut size={16}/> Demo verlassen</button>
      <button type="button" role="menuitem" disabled={gesperrt} onClick={wahl(zuruecksetzen)}><RefreshCw size={16}/> Demo zurücksetzen</button>
      <button type="button" role="menuitem" className="gefahr" disabled={gesperrt} onClick={wahl(loeschen)}><Trash2 size={16}/> Demo löschen und verlassen</button>
    </span>}
  </span>;
}

/** Hinten in der Hilfe: die Demo starten (oder sagen, dass sie läuft und wo man sie verlässt). */
export function DemoStarten({ aktiv, gesperrt, starten }: { aktiv: boolean; gesperrt: boolean; starten: () => void }) {
  return <section className="card demo-starten" aria-label="Demo">
    <h2>Demo ansehen</h2>
    {aktiv
      ? <p>Die Demo läuft. Verlassen, zurücksetzen oder löschen über den roten Knopf „DEMO“ oben neben dem Namen.</p>
      : <><p>Eine Vorführung mit einer frei erfundenen Beispielfamilie, in einem eigenen Bestand. Deine eigene Akte bleibt unberührt. Während die Demo läuft, steht oben ein roter Knopf „DEMO“.</p>
        <button type="button" className="button secondary" disabled={gesperrt} onClick={starten}><Play size={16}/> Demo ansehen</button></>}
  </section>;
}
