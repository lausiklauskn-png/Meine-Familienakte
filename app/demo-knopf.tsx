import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LogOut, RefreshCw, Trash2, Play } from "lucide-react";
import { InfoPopover } from "./ui-controls";

/**
 * Demo nur noch über einen Knopf (Nutzerwunsch 2026-11-04): Ist die Demo aus, steht oben nichts von „Demo“; gestartet wird
 * sie hinten in der Hilfe ({@link DemoStarten}). Läuft sie, steht direkt hinter „FAMILIENAKTE“ der rote Knopf „DEMO ▾“;
 * ein Tipp klappt am Knopf das Menü auf: Demo verlassen · Demo zurücksetzen · Demo löschen und verlassen.
 * Kein „zweimal tippen“. Schließt bei Tipp daneben und mit Esc.
 */
export function DemoKnopf({ gesperrt, verlassen, zuruecksetzen, loeschen, kopie = false, uebernehmen }: { gesperrt: boolean; verlassen: () => void; zuruecksetzen: () => void; loeschen: () => void; kopie?: boolean; uebernehmen?: () => void }) {
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
    <button type="button" className="demo-knopf-schalter" aria-haspopup="menu" aria-expanded={offen} aria-label="Demo läuft – Menü" title={kopie ? "Demo läuft: Kopie der eigenen Daten, das Original bleibt unverändert" : "Demo läuft: Vorführung mit erfundener Beispielfamilie"} data-demo-kopie={kopie ? "ja" : undefined} onClick={() => setOffen((wert) => !wert)}>DEMO<ChevronDown size={14} aria-hidden="true"/></button>
    {offen && <span className="demo-knopf-menue" role="menu">
      <button type="button" role="menuitem" disabled={gesperrt} onClick={wahl(verlassen)}><LogOut size={16}/> Demo verlassen</button>
      {kopie && uebernehmen && <button type="button" role="menuitem" data-demo-uebernehmen disabled={gesperrt} onClick={wahl(uebernehmen)}><Check size={16}/> Übernehmen …</button>}
      <button type="button" role="menuitem" disabled={gesperrt} onClick={wahl(zuruecksetzen)}><RefreshCw size={16}/> Demo zurücksetzen</button>
      <button type="button" role="menuitem" className="gefahr" disabled={gesperrt} onClick={wahl(loeschen)}><Trash2 size={16}/> Demo löschen und verlassen</button>
    </span>}
  </span>;
}

/** Hinten in der Hilfe: die Demo starten (oder sagen, dass sie läuft und wo man sie verlässt). */
/** Demo-Kasten in der Hilfe (Klaus 2026-11-07): nur der Knopf „Demo starten“, die Erklärung hinter dem „?“. */
const DEMO_HILFE = "• Hast du eigene Daten, arbeitet die Demo an einer Kopie davon. Du probierst aus, das Original bleibt unverändert.\n• Ohne eigene Daten zeigt sie eine erfundene Beispielfamilie.\n• Übernehmen (nur bei der Kopie): vorher kommt die Liste „Was ändert sich?“; das bisherige Register wird gesichert.\n• Während sie läuft, steht oben der rote Knopf „DEMO ▾“: verlassen · zurücksetzen · löschen.";
export function DemoStarten({ aktiv, gesperrt, starten, grund }: { aktiv: boolean; gesperrt: boolean; starten: () => void; grund?: string }) {
  return <section className="card demo-starten" aria-label="Demo">
    <div className="demo-starten-zeile">
      <span className="ui-heading-help"><h2>Demo</h2><InfoPopover label="Demo erklären" text={DEMO_HILFE}/></span>
      {aktiv
        ? <span className="fine-print" data-demo-laeuft>läuft – roter Knopf „DEMO“ oben</span>
        : <button type="button" className="button secondary" data-demo-start disabled={gesperrt} onClick={starten}><Play size={16}/> Demo starten</button>}
    </div>
    {!aktiv && gesperrt && grund && <p className="fine-print" data-demo-grund>{grund}</p>}
  </section>;
}
