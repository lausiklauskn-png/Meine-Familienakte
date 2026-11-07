/** P7 (Frage g): vor dem Übernehmen der Demo-Kopie die Liste „Was ändert sich?“. */
import { useState } from "react";
import { X } from "lucide-react";
import type { Aenderung } from "../lib/demo-kopie";

export const DEMO_UEBERNAHME_MERKER = "familienakte-demo-uebernahme";
export const DEMO_NEU_MERKER = "familienakte-demo-neu";
const WORT = { neu: "neu", geaendert: "geändert", entfernt: "entfernt" } as const;

export function DemoUebernahmeDialog({ plan, onUebernehmen, onClose }: {
  plan: { liste: Aenderung[]; zaehlung: { neu: number; geaendert: number; entfernt: number }; kalender: number; geaendertSeitStart: boolean };
  onUebernehmen: () => Promise<void>; onClose: () => void;
}) {
  const [laeuft, setLaeuft] = useState(false); const [fehler, setFehler] = useState("");
  const leer = !plan.liste.length;
  const los = async () => { setLaeuft(true); setFehler(""); try { await onUebernehmen(); } catch (e) { setFehler(e instanceof Error ? e.message : "Übernehmen nicht möglich."); setLaeuft(false); } };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !laeuft && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="demo-uebernahme-titel" data-demo-uebernahme>
      <div className="modal-head"><div><span className="badge warning">Demo übernehmen</span><h2 id="demo-uebernahme-titel">Was ändert sich?</h2></div><button className="icon-button" onClick={onClose} disabled={laeuft} aria-label="Fenster schließen"><X/></button></div>
      <p data-demo-zaehlung><strong>{plan.zaehlung.neu} neu · {plan.zaehlung.geaendert} geändert · {plan.zaehlung.entfernt} entfernt</strong></p>
      {leer ? <p>In der Demo wurde nichts geändert.</p> : <ul className="demo-aenderungen" data-demo-liste>{plan.liste.slice(0, 200).map((a, i) => <li key={i} data-art={a.art}><span className={`badge ${a.art === "entfernt" ? "danger" : a.art === "neu" ? "success" : "warning"}`}>{WORT[a.art]}</span> {a.titel}{a.kalender && a.art !== "neu" ? " · Kalender-Eintrag wird angepasst" : ""}</li>)}</ul>}
      {plan.liste.length > 200 && <p className="fine-print">… und {plan.liste.length - 200} weitere.</p>}
      <ul className="fine-print">
        <li>Die eigene Akte wird als Ganzes durch die Demo ersetzt.</li>
        <li>Vorher wird das bisherige Register gesichert (Registersicherung); keine Originaldatei wird gelöscht.</li>
        {plan.kalender > 0 && <li>{plan.kalender} Einträge mit Kalender: geänderte und entfernte Fristen ändern beim nächsten Abgleich auch den Kalender.</li>}
      </ul>
      {plan.geaendertSeitStart && <p className="form-error" data-demo-veraltet>Die eigene Akte wurde seit dem Start der Demo geändert. Übernehmen würde diese Änderungen verlieren und ist darum gesperrt.</p>}
      {fehler && <p className="form-error">{fehler}</p>}
      <div className="modal-actions"><button className="button secondary" onClick={onClose} disabled={laeuft}>Abbrechen</button>{!leer && !plan.geaendertSeitStart && <button className="button primary" data-demo-uebernehmen-start disabled={laeuft} onClick={() => void los()}>{laeuft ? "Wird übernommen …" : "Übernehmen"}</button>}</div>
    </div>
  </div>;
}
