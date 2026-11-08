/** P6 (Plan 07.11., Punkt 2b): Sicherung einlesen. Erst die Probe ohne Schreiben, dann einlesen.
 *  Stufe A (Plan 08.11.): in eine volle Akte wird zusammengeführt – Liste „Was kommt dazu?“, bei Unterschieden je Eintrag wählen. */
import { useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import type { EinleseProbe } from "./local-vault";
import type { Seite } from "../lib/abgleich";

const zeit = (z: string | null) => { if (!z) return "ohne Zeit"; const d = new Date(z); return Number.isNaN(d.getTime()) ? z : d.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" }); };
const mb = (b: number) => `${(b / 1048576).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;

export function SicherungEinlesenDialog({ probe, onEinlesen, onClose }: { probe: EinleseProbe; onEinlesen: (wahl: Record<string, Seite>) => Promise<void>; onClose: () => void; onEingang?: () => void }) {
  const [laeuft, setLaeuft] = useState(false); const [fehler, setFehler] = useState("");
  const z = probe.ok && !probe.akteLeer ? probe.zusammen : undefined;
  const [wahl, setWahl] = useState<Record<string, Seite>>(() => Object.fromEntries((z?.konflikte || []).map((k) => [k.schluessel, k.vorschlag])));
  const alle = (s: Seite) => setWahl(Object.fromEntries((z?.konflikte || []).map((k) => [k.schluessel, s])));
  const darf = probe.ok && (probe.akteLeer || Boolean(z));
  const nichtsZuTun = Boolean(z && !z.zaehlung.neu && !z.zaehlung.konflikte && !z.zaehlung.uebernommen);
  const einlesen = async () => { setLaeuft(true); setFehler(""); try { await onEinlesen(wahl); } catch (e) { setFehler(e instanceof Error ? e.message : "Einlesen nicht möglich."); setLaeuft(false); } };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !laeuft && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="einlesen-titel" data-sicherung-einlesen>
      <div className="modal-head"><div><span className={`badge ${!probe.ok ? "danger" : probe.warnungen.length ? "warning" : "success"}`}>Probe ohne Schreiben{probe.ok && probe.warnungen.length ? " · mit Warnung" : ""}</span><h2 id="einlesen-titel">Sicherung einlesen</h2></div><button className="icon-button" onClick={onClose} disabled={laeuft} aria-label="Fenster schließen"><X/></button></div>
      <ul className="einlesen-liste" data-einlesen-probe>
        <li><strong>{probe.ordner}</strong>{probe.hinweis && <small> · {probe.hinweis}</small>}</li>
        <li>Erstellt {new Date(probe.erstellt).toLocaleString("de-DE")}</li>
        <li>{probe.zaehlung.documents} Dokumente · {probe.zaehlung.records} Einträge · {probe.zaehlung.relations} Verknüpfungen · {probe.zaehlung.memoryDrafts} Memory-Entwürfe</li>
        <li data-einlesen-dateien>{probe.ok ? <CheckCircle2 size={16}/> : <CircleAlert size={16}/>} {probe.dateien} Dateien ({mb(probe.bytes)}) per Prüfsumme geprüft{probe.fehler.length ? `, ${probe.fehler.length} Fehler` : ""}</li>
      </ul>
      {probe.fehler.length > 0 && <div className="form-error" data-einlesen-fehler><strong>Die Sicherung ist beschädigt und wird nicht eingelesen.</strong><ul>{probe.fehler.slice(0, 8).map((f) => <li key={f}>{f}</li>)}</ul></div>}
      {probe.warnungen.length > 0 && <div className="sync-message warning" data-einlesen-warnungen><strong>{probe.warnungen.length} Warnung{probe.warnungen.length === 1 ? "" : "en"}: Was hier fehlt, kommt beim Einlesen nicht zurück.</strong><ul>{probe.warnungen.slice(0, 6).map((f) => <li key={f}>{f}</li>)}</ul></div>}
      {z && <div className="sync-message" data-einlesen-zusammen>
        <strong>Deine Akte ist nicht leer ({probe.akteZaehlung.dokumente} Dokumente, {probe.akteZaehlung.eintraege} Einträge). Die Sicherung wird zusammengeführt:</strong>
        <ul data-einlesen-zaehlung>
          <li>{z.zaehlung.neu} kommen dazu</li>
          <li>{z.zaehlung.gleich} sind schon gleich da</li>
          <li>{z.zaehlung.nurHier} gibt es nur in deiner Akte – sie bleiben</li>
          {z.zaehlung.konflikte > 0 && <li><strong>{z.zaehlung.konflikte} unterscheiden sich</strong> – unten wählen, welche Fassung bleibt</li>}
        </ul>
        <p className="fine-print">Gelöscht wird nichts. Vorhandene Dateien werden nicht ersetzt. Das bisherige Register wird vorher gesichert.</p>
        {z.liste.length > 0 && <details data-einlesen-liste><summary>Was kommt dazu? ({z.liste.length})</summary><ul>{z.liste.slice(0, 60).map((x, i) => <li key={i}>{x.art === "neu" ? "neu" : x.art === "gleich-datei" ? "schon da (gleiche Datei)" : x.art === "neu-nummeriert" ? "neu, mit neuer Nummer" : "übernommen"} · {x.titel}</li>)}{z.liste.length > 60 && <li>… und {z.liste.length - 60} weitere</li>}</ul></details>}
      </div>}
      {z && z.konflikte.length > 0 && <div className="einlesen-konflikte" data-einlesen-konflikte>
        <div className="button-row"><strong>Welche Fassung behalten?</strong><button type="button" className="button secondary" data-einlesen-alle-hier onClick={() => alle("hier")}>Alle: meine behalten</button><button type="button" className="button secondary" data-einlesen-alle-dort onClick={() => alle("dort")}>Alle: aus der Sicherung</button></div>
        <p className="fine-print">Vorgewählt ist jeweils die jüngere Änderung.</p>
        <ul>{z.konflikte.map((k) => <li key={k.schluessel} data-einlesen-konflikt={k.schluessel}><span>{k.titel}</span>
          <label><input type="radio" name={k.schluessel} checked={wahl[k.schluessel] === "hier"} onChange={() => setWahl({ ...wahl, [k.schluessel]: "hier" })}/> meine ({zeit(k.hierZeit)})</label>
          <label><input type="radio" name={k.schluessel} checked={wahl[k.schluessel] === "dort"} onChange={() => setWahl({ ...wahl, [k.schluessel]: "dort" })}/> aus der Sicherung ({zeit(k.dortZeit)})</label>
        </li>)}</ul>
      </div>}
      {darf && <p data-einlesen-bereit>{probe.warnungen.length ? `Die Probe ist ohne Fehler durchgelaufen, aber mit ${probe.warnungen.length} Warnung${probe.warnungen.length === 1 ? "" : "en"} (siehe oben).` : "Die Probe ist bestanden."} {z ? (nichtsZuTun ? "Es gibt nichts zusammenzuführen – alles ist schon da." : "„Zusammenführen“ kopiert neue Dateien, prüft jede Kopie und übernimmt danach die Einträge.") : "„Jetzt einlesen“ kopiert alle Dateien in die leere Akte, prüft jede Kopie und übernimmt danach das Register."}</p>}
      {fehler && <p className="form-error">{fehler}</p>}
      <div className="modal-actions"><button className="button secondary" onClick={onClose} disabled={laeuft}>{nichtsZuTun ? "Schließen" : "Abbrechen"}</button>{darf && !nichtsZuTun && <button className="button primary" data-einlesen-start disabled={laeuft} onClick={() => void einlesen()}>{laeuft ? (z ? "Wird zusammengeführt …" : "Wird eingelesen …") : (z ? "Zusammenführen" : "Jetzt einlesen")}</button>}</div>
    </div>
  </div>;
}
