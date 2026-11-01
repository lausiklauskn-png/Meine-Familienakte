// Seite „Stapel“ (Klaus 2026-11-01): „erstmal sauber der Scan“ — viele Fotos/Scans auf einmal übernehmen, Blatt automatisch finden
// und gerade ziehen (Workflow PDF), als schlanke Liste ablegen. Große Vorschau erst beim Antippen einer Zeile; dort anpassen/zuschneiden/
// prüfen in Workflow PDF. „Einordnen“ (rechts oben) gibt die gewählten oder alle an die Eingangszentrale (Text lesen, Einordnen, Zusammenhang).
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, FileText, Pause, Play, Square, Trash2, Upload } from "lucide-react";
import { stapelAbbrechen, stapelAnhalten, stapelHoeren, stapelLauf, stapelStarten, stapelWeiter, type StapelErgebnis, type StapelLauf } from "./stapel";
import { stapelAlle, stapelDatei, stapelLegen, stapelWeg, type StapelEintrag } from "./stapel-ablage";
import { openFile } from "./file-viewer";

const groesse = (n: number) => n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
export async function stapelAblegen(e: StapelErgebnis) {
  await stapelLegen({ id: crypto.randomUUID(), name: e.file.name, sicher: e.sicher, grund: e.grund, quelle: e.quelle, groesse: e.file.size, zeit: new Date().toISOString(), pdf: e.file, vorschau: e.vorschau });
  window.dispatchEvent(new Event("familienakte:stapel"));
}

export function StapelSeite({ kopf, neu, onNeuGenommen, onEinordnen, onWorkflowPdf }: {
  kopf: React.ReactNode; neu: File[] | null; onNeuGenommen: () => void;
  onEinordnen: (dateien: File[]) => Promise<void>; onWorkflowPdf: (datei: File) => void;
}) {
  const [liste, setListe] = useState<StapelEintrag[]>([]);
  const [lauf, setLauf] = useState<StapelLauf>(stapelLauf());
  const [offen, setOffen] = useState<string | null>(null);
  const [wahl, setWahl] = useState<Set<string>>(new Set());
  const [bild, setBild] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const eingabe = useRef<HTMLInputElement>(null);
  const laden = useCallback(async () => { try { setListe(await stapelAlle()); } catch { setListe([]); } }, []);
  useEffect(() => { void laden(); const h = () => void laden(); window.addEventListener("familienakte:stapel", h); const weg = stapelHoeren(setLauf); return () => { window.removeEventListener("familienakte:stapel", h); weg(); }; }, [laden]);
  useEffect(() => { if (neu?.length) { void stapelStarten(neu, stapelAblegen); onNeuGenommen(); } }, [neu, onNeuGenommen]);
  useEffect(() => {
    const e = liste.find((x) => x.id === offen);
    if (!e?.vorschau) { setBild(null); return; }
    const url = URL.createObjectURL(e.vorschau); setBild(url);
    return () => URL.revokeObjectURL(url);
  }, [offen, liste]);
  const gewaehlt = liste.filter((e) => wahl.has(e.id));
  const ziel = gewaehlt.length ? gewaehlt : liste;
  const einordnen = async (eintraege: StapelEintrag[]) => {
    if (!eintraege.length) return;
    setBusy(true);
    try { await onEinordnen(eintraege.map(stapelDatei)); for (const e of eintraege) await stapelWeg(e.id); setWahl(new Set()); setOffen(null); await laden(); }
    finally { setBusy(false); }
  };
  const entfernen = async (e: StapelEintrag) => { await stapelWeg(e.id); setOffen(null); await laden(); };
  const laeuft = lauf.zustand === "laeuft" || lauf.zustand === "angehalten";
  return (
    <div className="fa-stapel" data-stapel-seite>
      {kopf}
      <div className="fa-stapel-leiste">
        <input ref={eingabe} className="sr-only" type="file" accept="image/*,application/pdf" multiple data-stapel-eingabe
          onChange={(ev) => { const f = ev.target.files ? Array.from(ev.target.files) : []; if (f.length) void stapelStarten(f, stapelAblegen); ev.currentTarget.value = ""; }}/>
        <button type="button" className="button secondary" onClick={() => eingabe.current?.click()} data-stapel-mehr><Upload size={16}/> Fotos oder Scans hinzufügen</button>
        <button type="button" className="button primary fa-stapel-einordnen" disabled={busy || !liste.length || laeuft} onClick={() => void einordnen(ziel)} data-stapel-einordnen>
          Einordnen ({ziel.length})
        </button>
      </div>
      {lauf.zustand !== "ruht" && <div className="fa-stapel-lauf" role="status" data-stapel-lauf={lauf.zustand}>
        <span>{lauf.zustand === "fertig" ? `Fertig: ${lauf.fertig} übernommen${lauf.offen ? `, davon ${lauf.offen} mit „Ecken prüfen“` : ""}.`
          : lauf.zustand === "abgebrochen" ? `Abgebrochen: ${lauf.fertig} übernommen, der Rest nicht.`
          : `${lauf.zustand === "angehalten" ? "Angehalten" : "Blatt"} ${Math.min(lauf.i + 1, lauf.n)} von ${lauf.n}${lauf.aktuell ? ` · ${lauf.aktuell}` : ""}`}</span>
        {laeuft && <progress max={lauf.n} value={lauf.i}/>}
        {lauf.zustand === "laeuft" && <button type="button" className="button secondary compact-button" onClick={stapelAnhalten} data-stapel-anhalten><Pause size={15}/> Anhalten</button>}
        {lauf.zustand === "angehalten" && <button type="button" className="button secondary compact-button" onClick={stapelWeiter} data-stapel-weiter><Play size={15}/> Weiter</button>}
        {laeuft && <button type="button" className="button secondary compact-button" onClick={stapelAbbrechen} data-stapel-abbrechen><Square size={15}/> Abbrechen</button>}
      </div>}
      {liste.length === 0 ? <p className="fa-stapel-leer">Noch nichts im Stapel. „Fotos oder Scans hinzufügen“ nimmt viele auf einmal: das Blatt wird gefunden und gerade gezogen, ohne jedes einzeln zu prüfen.</p>
        : <ul className="fa-stapel-liste" data-stapel-liste>
          {liste.map((e) => <li key={e.id} className={offen === e.id ? "offen" : ""} data-stapel-zeile>
            <div className="fa-stapel-zeile">
              <input type="checkbox" checked={wahl.has(e.id)} aria-label={`${e.name} wählen`} onChange={() => setWahl((w) => { const n = new Set(w); if (n.has(e.id)) n.delete(e.id); else n.add(e.id); return n; })}/>
              <button type="button" className="fa-stapel-name" onClick={() => setOffen(offen === e.id ? null : e.id)} aria-expanded={offen === e.id}>
                {offen === e.id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}<span>{e.name}</span>
              </button>
              <span className={`badge ${e.sicher ? "" : "warn"}`} data-stapel-stand={e.sicher ? "sicher" : "pruefen"}>{e.quelle === "pdf" ? "PDF" : e.sicher ? "gerade gezogen" : "Ecken prüfen"}</span>
              <small>{groesse(e.groesse)}</small>
            </div>
            {offen === e.id && <div className="fa-stapel-detail" data-stapel-detail>
              {bild ? <img src={bild} alt={`Vorschau ${e.name}`} data-stapel-vorschau/> : <button type="button" className="button secondary" onClick={() => openFile(stapelDatei(e))}><FileText size={16}/> PDF ansehen</button>}
              <p className="fa-stapel-grund">{e.grund}</p>
              <div className="button-row">
                <button type="button" className="button secondary" onClick={() => onWorkflowPdf(stapelDatei(e))} data-stapel-wfpdf>In Workflow PDF öffnen (anpassen, zuschneiden, prüfen)</button>
                <button type="button" className="button primary" disabled={busy} onClick={() => void einordnen([e])} data-stapel-einzeln>Einordnen</button>
                <button type="button" className="button secondary" onClick={() => void entfernen(e)} data-stapel-weg><Trash2 size={15}/> Entfernen</button>
              </div>
            </div>}
          </li>)}
        </ul>}
    </div>
  );
}
