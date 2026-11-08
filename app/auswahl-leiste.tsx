import type { ReactNode } from "react";

/**
 * Eine Auswahl für alle Listen mit mehreren Einträgen (2.28.39, Punkt 6): „Alle“ oder einzeln anhaken, darunter dieselbe
 * Aktionsleiste. Eingang, Bibliothek und Fristenliste verwenden diese eine Komponente, damit Auswahl überall gleich aussieht.
 */
export type AuswahlAktion = {
  key: string;
  label: ReactNode;
  onClick: () => void;
  /** Hauptaktion (blau) – höchstens eine je Leiste. */
  haupt?: boolean;
  /** Entfernt etwas (rot umrandet); die Rückfrage stellt der Aufrufer. */
  gefahr?: boolean;
  disabled?: boolean;
  title?: string;
};

export function AuswahlLeiste({ name, gesamt, gewaehlt, onAlle, aktionen, hinweis, children }: {
  /** Wofür die Auswahl gilt, z. B. „Eingänge“ – steht im Namen des Kästchens „Alle“. */
  name: string;
  /** Wie viele Einträge auswählbar sind. */
  gesamt: number;
  /** Wie viele davon gerade angehakt sind. */
  gewaehlt: number;
  /** true: alle anhaken, false: Auswahl aufheben. */
  onAlle: (alle: boolean) => void;
  aktionen: AuswahlAktion[];
  /** Kurzer Satz unter den Knöpfen (z. B. „Unsichere bleiben abgewählt“). */
  hinweis?: ReactNode;
  /** Platz für eine Meldung an derselben Stelle (z. B. „Gespeichert ✓“). */
  children?: ReactNode;
}) {
  if (!gesamt) return null;
  const alle = gewaehlt > 0 && gewaehlt === gesamt;
  return <div className={`auswahl-leiste${gewaehlt ? " aktiv" : ""}`} data-auswahl-leiste={name} role="group" aria-label={`Auswahl ${name}`}>
    <label className="auswahl-alle">
      <input type="checkbox" checked={alle} ref={(el) => { if (el) el.indeterminate = gewaehlt > 0 && !alle; }} onChange={() => onAlle(!alle)} data-auswahl-alle aria-label={alle ? `Auswahl der ${name} aufheben` : `Alle ${name} auswählen`}/>
      <span>Alle</span>
    </label>
    <strong className="auswahl-zahl" data-auswahl-zahl={gewaehlt}>{gewaehlt ? `${gewaehlt} von ${gesamt} ausgewählt` : `${gesamt} ${name}`}</strong>
    {gewaehlt > 0 && <span className="auswahl-aktionen">
      {/* Abwählen in einem Schritt, auch wenn nur ein Teil angehakt ist (Nutzer 08.11.2026). */}
      <button type="button" className="button secondary" onClick={() => onAlle(false)} data-auswahl-aufheben>Auswahl aufheben</button>
      {aktionen.map((a) => <button key={a.key} type="button" className={`button ${a.haupt ? "primary" : "secondary"}${a.gefahr ? " gefahr" : ""}`} disabled={a.disabled} title={a.title} onClick={a.onClick} data-auswahl-aktion={a.key}>{a.label}</button>)}
    </span>}
    {gewaehlt > 0 && hinweis && <small className="auswahl-hinweis">{hinweis}</small>}
    {children}
  </div>;
}

/** Kästchen am Anfang einer Zeile; gleich groß in jeder Liste. */
export function AuswahlKaestchen({ an, onWechsel, titel, disabled, ...rest }: { an: boolean; onWechsel: () => void; titel: string; disabled?: boolean } & Record<`data-${string}`, string | boolean | undefined>) {
  return <label className="auswahl-kaestchen" title={`„${titel}“ auswählen`}>
    <input type="checkbox" checked={an} disabled={disabled} onChange={onWechsel} aria-label={`„${titel}“ auswählen`} {...rest}/>
  </label>;
}
