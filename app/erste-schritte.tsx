import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { workspaceStorage } from "../lib/demo-workspace.ts";

/**
 * „So fängst du an“ ganz oben auf der Startseite (2.28.39, Klaus 08.11.2026, Vorschau neugestaltung-2.28.39 Punkt 1):
 * drei Schritte – Speicherort, erstes Dokument, erste Erinnerung. Jeder Schritt hat „Überspringen“ (gemerkt je Gerät,
 * Demo getrennt); der Kasten verschwindet, sobald alle drei erledigt oder übersprungen sind.
 */
export type ErsterSchritt = "speicher" | "dokument" | "erinnerung";
export const ERSTE_SCHRITTE_SCHLUESSEL = "familienakte-erste-schritte-v1";

function uebersprungenLesen(): ErsterSchritt[] {
  try { const v = JSON.parse(workspaceStorage.getItem(ERSTE_SCHRITTE_SCHLUESSEL) || "[]"); return Array.isArray(v) ? v.filter((x): x is ErsterSchritt => ["speicher", "dokument", "erinnerung"].includes(x)) : []; } catch { return []; }
}

export function ErsteSchritte({ erledigt, onSchritt }: { erledigt: Record<ErsterSchritt, boolean>; onSchritt: (schritt: ErsterSchritt) => void }) {
  const [uebersprungen, setUebersprungen] = useState<ErsterSchritt[]>(uebersprungenLesen);
  const schritte: Array<{ id: ErsterSchritt; titel: string; fertig: string }> = [
    { id: "speicher", titel: "Speicherort wählen", fertig: "Speicherort gewählt" },
    { id: "dokument", titel: "Erstes Dokument ablegen", fertig: "Erstes Dokument abgelegt" },
    { id: "erinnerung", titel: "Erste Erinnerung anlegen", fertig: "Erste Erinnerung angelegt" },
  ];
  if (schritte.every((s) => erledigt[s.id] || uebersprungen.includes(s.id))) return null;
  const ueberspringen = (id: ErsterSchritt) => {
    const neu = [...new Set([...uebersprungen, id])];
    setUebersprungen(neu);
    try { workspaceStorage.setItem(ERSTE_SCHRITTE_SCHLUESSEL, JSON.stringify(neu)); } catch { /* nur für diese Sitzung */ }
  };
  return <section className="card erste-schritte" aria-labelledby="erste-schritte-titel" data-erste-schritte>
    <h2 id="erste-schritte-titel">So fängst du an</h2>
    <ol>{schritte.map((s, i) => {
      const fertig = erledigt[s.id]; const weg = !fertig && uebersprungen.includes(s.id);
      return <li key={s.id} className={fertig ? "fertig" : weg ? "uebersprungen" : "offen"} data-erster-schritt={s.id} data-stand={fertig ? "erledigt" : weg ? "übersprungen" : "offen"}>
        <span className="erste-schritte-nr" aria-hidden="true">{fertig ? <Check size={16}/> : i + 1}</span>
        {fertig ? <span className="erste-schritte-text">{s.fertig}</span>
          : weg ? <span className="erste-schritte-text">{s.titel} <small>(übersprungen)</small></span>
            : <><button type="button" className="erste-schritte-los" onClick={() => onSchritt(s.id)} data-erster-schritt-los={s.id}>{s.titel} <ChevronRight size={16}/></button>
              <button type="button" className="text-link erste-schritte-weg" onClick={() => ueberspringen(s.id)} data-erster-schritt-weg={s.id}>Überspringen</button></>}
      </li>;
    })}</ol>
    <p className="muted">Der Kasten verschwindet, sobald alle drei erledigt oder übersprungen sind.</p>
  </section>;
}
