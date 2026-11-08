// Lange Listen seitenweise zeigen (z. B. 50 je Seite, „Weitere anzeigen“), damit 1000 Einträge nicht 120 000 px lang werden.
import { useState } from "react";

export const LISTEN_SEITE = 50;

/** Wie viele Einträge gezeigt werden; beginnt bei einer Seite und wieder von vorn, sobald sich der Schlüssel (Filter) ändert.
 *  mindestens: so viele werden auf jeden Fall gezeigt (Sprung an einen Eintrag auf einer späteren Seite, 2.28.39). */
export function useSeiten(gesamt: number, schluessel: string, start = LISTEN_SEITE, mindestens = 0): [number, () => void] {
  const [anzahl, setAnzahl] = useState(start);
  const [bisher, setBisher] = useState(schluessel);
  if (bisher !== schluessel) { setBisher(schluessel); setAnzahl(LISTEN_SEITE); }
  return [Math.min(Math.max(anzahl, mindestens), gesamt), () => setAnzahl((wert) => Math.max(wert, mindestens) + LISTEN_SEITE)];
}

export function WeitereAnzeigen({ gezeigt, gesamt, onMehr }: { gezeigt: number; gesamt: number; onMehr: () => void }) {
  if (gezeigt >= gesamt) return null;
  return <div className="button-row liste-mehr" data-liste-mehr={gesamt - gezeigt}>
    <button type="button" className="button secondary" onClick={onMehr}>Weitere {Math.min(LISTEN_SEITE, gesamt - gezeigt)} anzeigen</button>
    <span>{gezeigt} von {gesamt} angezeigt</span>
  </div>;
}
