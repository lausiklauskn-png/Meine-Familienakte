/** P6 (Plan 07.11., Punkt 2b): Sicherung einlesen. Erst die Probe ohne Schreiben, dann – nur in eine leere Akte – einlesen. */
import { useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import type { EinleseProbe } from "./local-vault";

const mb = (b: number) => `${(b / 1048576).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;

export function SicherungEinlesenDialog({ probe, onEinlesen, onClose }: { probe: EinleseProbe; onEinlesen: () => Promise<void>; onClose: () => void }) {
  const [laeuft, setLaeuft] = useState(false); const [fehler, setFehler] = useState("");
  const darf = probe.ok && probe.akteLeer;
  const einlesen = async () => { setLaeuft(true); setFehler(""); try { await onEinlesen(); } catch (e) { setFehler(e instanceof Error ? e.message : "Einlesen nicht möglich."); setLaeuft(false); } };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !laeuft && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="einlesen-titel" data-sicherung-einlesen>
      <div className="modal-head"><div><span className={`badge ${probe.ok ? "success" : "danger"}`}>Probe ohne Schreiben</span><h2 id="einlesen-titel">Sicherung einlesen</h2></div><button className="icon-button" onClick={onClose} disabled={laeuft} aria-label="Fenster schließen"><X/></button></div>
      <ul className="einlesen-liste" data-einlesen-probe>
        <li><strong>{probe.ordner}</strong>{probe.hinweis && <small> · {probe.hinweis}</small>}</li>
        <li>Erstellt {new Date(probe.erstellt).toLocaleString("de-DE")} · Prüfstand {probe.appVersion}</li>
        <li>{probe.zaehlung.documents} Dokumente · {probe.zaehlung.records} Einträge · {probe.zaehlung.relations} Verknüpfungen · {probe.zaehlung.memoryDrafts} Memory-Entwürfe</li>
        <li data-einlesen-dateien>{probe.ok ? <CheckCircle2 size={16}/> : <CircleAlert size={16}/>} {probe.dateien} Dateien ({mb(probe.bytes)}) per Prüfsumme geprüft{probe.fehler.length ? `, ${probe.fehler.length} Fehler` : ""}</li>
      </ul>
      {probe.fehler.length > 0 && <div className="form-error" data-einlesen-fehler><strong>Die Sicherung ist beschädigt und wird nicht eingelesen.</strong><ul>{probe.fehler.slice(0, 8).map((f) => <li key={f}>{f}</li>)}</ul></div>}
      {probe.warnungen.length > 0 && <div className="notice warning" data-einlesen-warnungen><ul>{probe.warnungen.slice(0, 6).map((f) => <li key={f}>{f}</li>)}</ul></div>}
      {probe.ok && !probe.akteLeer && <p className="form-error" data-einlesen-nicht-leer>Die Akte ist nicht leer ({probe.akteZaehlung.dokumente} Dokumente, {probe.akteZaehlung.eintraege} Einträge). Eingelesen wird nur in eine leere Akte, zum Beispiel nach einer Neuinstallation. Es wird nichts zusammengeführt oder überschrieben.</p>}
      {darf && <p data-einlesen-bereit>Die Probe ist bestanden. „Jetzt einlesen“ kopiert alle Dateien in die leere Akte, prüft jede Kopie und übernimmt danach das Register.</p>}
      {fehler && <p className="form-error">{fehler}</p>}
      <div className="modal-actions"><button className="button secondary" onClick={onClose} disabled={laeuft}>Abbrechen</button>{darf && <button className="button primary" data-einlesen-start disabled={laeuft} onClick={() => void einlesen()}>{laeuft ? "Wird eingelesen …" : "Jetzt einlesen"}</button>}</div>
    </div>
  </div>;
}
