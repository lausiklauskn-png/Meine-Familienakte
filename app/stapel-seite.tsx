// Seite „Stapel“ (Klaus 2026-11-01): „erstmal sauber der Scan“ — viele Fotos/Scans auf einmal übernehmen, Blatt automatisch finden
// und gerade ziehen (Workflow PDF), als schlanke Liste ablegen. Große Vorschau erst beim Antippen einer Zeile; dort anpassen/zuschneiden/
// prüfen in Workflow PDF. „Einordnen“ (rechts oben) gibt die gewählten oder alle an die Eingangszentrale (Text lesen, Einordnen, Zusammenhang).
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, FileText, GripVertical, Layers, Pause, Play, Square, Trash2, Upload } from "lucide-react";
import { FILTER_NAMEN, STAPEL_VORGABE, pdfsZusammenfuegen, stapelAbbrechen, stapelAnhalten, stapelHoeren, stapelLauf, stapelStarten, stapelWeiter, type StapelEinst, type StapelErgebnis, type StapelLauf } from "./stapel";
import { stapelAlle, stapelDatei, stapelLegen, stapelWeg, type StapelEintrag } from "./stapel-ablage";
import { openFile } from "./file-viewer";
import { ShieldCheck } from "lucide-react";

const groesse = (n: number) => n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
export async function stapelAblegen(e: StapelErgebnis) {
  const id = crypto.randomUUID();
  await stapelLegen({ id, name: e.file.name, sicher: e.sicher, grund: e.grund, quelle: e.quelle, groesse: e.file.size, zeit: new Date().toISOString(), pdf: e.file, vorschau: e.vorschau });
  window.dispatchEvent(new Event("familienakte:stapel"));
  return id;
}
// Einstellungen des Stapels (Klaus 2026-11-01: Filter wie Workflow PDF, Schärfe, „ein Brief“) — je Gerät gemerkt.
const EINST_SCHLUESSEL = "fa_stapel_einst_v1";
export function stapelEinst(): StapelEinst {
  try { const e = JSON.parse(localStorage.getItem(EINST_SCHLUESSEL) || "null"); if (e && e.filter in FILTER_NAMEN) return { ...STAPEL_VORGABE, ...e, schaerfe: Math.max(0, Math.min(100, Number(e.schaerfe) || 0)), zusammen: !!e.zusammen }; } catch { /* Vorgabe */ }
  return { ...STAPEL_VORGABE };
}
function einstMerken(e: StapelEinst) { try { localStorage.setItem(EINST_SCHLUESSEL, JSON.stringify(e)); } catch { /* nur für diese Sitzung */ } }
/** Einträge in der gegebenen Reihenfolge zu EINEM zusammenfügen; die Quellen verschwinden aus dem Stapel. */
export async function eintraegeZusammenfuegen(eintraege: StapelEintrag[]) {
  if (eintraege.length < 2) return null;
  const { bytes, seiten } = await pdfsZusammenfuegen(eintraege.map((e) => e.pdf));
  const basis = eintraege[0].name.replace(/\s*\(Ecken prüfen\)/, "").replace(/\s*\(\d+ Blätter\)/, "").replace(/\.pdf$/i, "");
  const neu: StapelEintrag = { id: crypto.randomUUID(), name: `${basis} (${seiten} Blätter).pdf`, sicher: eintraege.every((e) => e.sicher),
    grund: `${seiten} Seiten, zusammengefügt aus: ${eintraege.map((e) => e.name).join(" · ")}`, quelle: "zusammen", groesse: bytes.length,
    zeit: eintraege[0].zeit, pdf: new Blob([bytes as BlobPart], { type: "application/pdf" }), vorschau: eintraege[0].vorschau };
  await stapelLegen(neu);
  for (const e of eintraege) await stapelWeg(e.id);
  window.dispatchEvent(new Event("familienakte:stapel"));
  return neu;
}
/** Einen Stapel starten — mit den gemerkten Einstellungen; „ein Brief“ fügt am Ende alles aus diesem Durchgang zusammen. */
export function stapelStartenMitEinst(dateien: File[], einst = stapelEinst()) {
  const ids: string[] = [];
  return stapelStarten(dateien, async (e) => { ids.push(await stapelAblegen(e)); }, { einst, ende: einst.zusammen ? async () => {
    const alle = await stapelAlle(); const diese = ids.map((id) => alle.find((x) => x.id === id)).filter((x): x is StapelEintrag => !!x);
    await eintraegeZusammenfuegen(diese);
  } : undefined });
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
  const [einst, setEinst] = useState<StapelEinst>(stapelEinst);
  const [ziel, setZiel] = useState<string | null>(null);
  const zug = useRef<{ von: string } | null>(null);
  const aendern = (teil: Partial<StapelEinst>) => setEinst((e) => { const n = { ...e, ...teil }; einstMerken(n); return n; });
  const eingabe = useRef<HTMLInputElement>(null);
  const laden = useCallback(async () => { try { setListe(await stapelAlle()); } catch { setListe([]); } }, []);
  useEffect(() => { void laden(); const h = () => void laden(); window.addEventListener("familienakte:stapel", h); const weg = stapelHoeren(setLauf); return () => { window.removeEventListener("familienakte:stapel", h); weg(); }; }, [laden]);
  useEffect(() => { if (neu?.length) { void stapelStartenMitEinst(neu); onNeuGenommen(); } }, [neu, onNeuGenommen]);
  useEffect(() => {
    const e = liste.find((x) => x.id === offen);
    if (!e?.vorschau) { setBild(null); return; }
    const url = URL.createObjectURL(e.vorschau); setBild(url);
    return () => URL.revokeObjectURL(url);
  }, [offen, liste]);
  const gewaehlt = liste.filter((e) => wahl.has(e.id));
  const auswahlZiel = gewaehlt.length ? gewaehlt : liste;
  const einordnen = async (eintraege: StapelEintrag[]) => {
    if (!eintraege.length) return;
    setBusy(true);
    try { await onEinordnen(eintraege.map(stapelDatei)); for (const e of eintraege) await stapelWeg(e.id); setWahl(new Set()); setOffen(null); await laden(); }
    finally { setBusy(false); }
  };
  // Prüfbericht nur auf Wahl (Klaus: „Dokumente vom Amt brauchen das nicht. Spart Rechnerleistung.“)
  const [prueft, setPrueft] = useState(0);
  const pruefen = async (eintraege: StapelEintrag[]) => {
    if (!eintraege.length) return;
    setBusy(true); setPrueft(eintraege.length);
    try {
      const { dateiPruefen } = await import("./wfpdf-kern");
      for (const e of eintraege) { const p = await dateiPruefen(e.name, e.pdf); await stapelLegen({ ...e, pruefung: p }); setPrueft((n) => n - 1); }
      await laden();
    } finally { setBusy(false); setPrueft(0); }
  };
  const fuegen = async (eintraege: StapelEintrag[]) => {
    if (eintraege.length < 2) return;
    setBusy(true);
    try { await eintraegeZusammenfuegen(eintraege); setWahl(new Set()); setOffen(null); await laden(); }
    finally { setBusy(false); }
  };
  // Ziehen (Maus, Finger, Stift): Griff einer Zeile auf eine andere legen → die gezogene kommt HINTER die Ziel-Zeile in ein PDF.
  const zugStart = (ev: React.PointerEvent, id: string) => { ev.preventDefault(); zug.current = { von: id }; (ev.target as Element).setPointerCapture?.(ev.pointerId); };
  const zugWo = (ev: React.PointerEvent) => {
    if (!zug.current) return null;
    const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-stapel-zeile]") as HTMLElement | null;
    const id = el?.dataset.id || null; return id && id !== zug.current.von ? id : null;
  };
  const zugEnde = (ev: React.PointerEvent) => {
    const von = zug.current?.von, nach = zugWo(ev); zug.current = null; setZiel(null);
    if (!von || !nach) return;
    const a = liste.find((x) => x.id === nach), b = liste.find((x) => x.id === von);
    if (a && b) void fuegen([a, b]);
  };
  const entfernen = async (e: StapelEintrag) => { await stapelWeg(e.id); setOffen(null); await laden(); };
  const laeuft = lauf.zustand === "laeuft" || lauf.zustand === "angehalten";
  return (
    <div className="fa-stapel" data-stapel-seite>
      {kopf}
      <div className="fa-stapel-leiste">
        <input ref={eingabe} className="sr-only" type="file" accept="image/*,application/pdf" multiple data-stapel-eingabe
          onChange={(ev) => { const f = ev.target.files ? Array.from(ev.target.files) : []; if (f.length) void stapelStartenMitEinst(f, einst); ev.currentTarget.value = ""; }}/>
        <button type="button" className="button secondary" onClick={() => eingabe.current?.click()} data-stapel-mehr><Upload size={16}/> Fotos oder Scans hinzufügen</button>
        {gewaehlt.length >= 1 && <button type="button" className="button secondary" disabled={busy || laeuft} onClick={() => void pruefen(gewaehlt)} data-stapel-pruefen-wahl><ShieldCheck size={16}/> {prueft ? `Prüfe … noch ${prueft}` : `Prüfen (${gewaehlt.length})`}</button>}
        {gewaehlt.length >= 2 && <button type="button" className="button secondary" disabled={busy || laeuft} onClick={() => void fuegen(gewaehlt)} data-stapel-fuegen><Layers size={16}/> Zusammenfügen ({gewaehlt.length})</button>}
        <button type="button" className="button primary fa-stapel-einordnen" disabled={busy || !liste.length || laeuft} onClick={() => void einordnen(auswahlZiel)} data-stapel-einordnen>
          Einordnen ({auswahlZiel.length})
        </button>
      </div>
      <div className="fa-stapel-einst" data-stapel-einst>
        <label><span>Farbe</span><select value={einst.filter} onChange={(e) => aendern({ filter: e.target.value as StapelEinst["filter"] })} data-stapel-filter>
          {(Object.keys(FILTER_NAMEN) as StapelEinst["filter"][]).map((k) => <option key={k} value={k}>{FILTER_NAMEN[k]}</option>)}</select></label>
        <label><span>Schärfe {einst.schaerfe}</span><input type="range" min={0} max={100} step={10} value={einst.schaerfe} onChange={(e) => aendern({ schaerfe: Number(e.target.value) })} data-stapel-schaerfe/></label>
        <label className="fa-stapel-haken"><input type="checkbox" checked={einst.zusammen} onChange={(e) => aendern({ zusammen: e.target.checked })} data-stapel-zusammen/> <span>Alle Blätter eines Durchgangs zu einem Brief zusammenfassen</span></label>
      </div>
      {lauf.zustand !== "ruht" && <div className="fa-stapel-lauf" role="status" data-stapel-lauf={lauf.zustand} data-stapel-rechnet={lauf.rechnet ? "1" : "0"}>
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
          {liste.map((e) => <li key={e.id} className={`${offen === e.id ? "offen" : ""} ${ziel === e.id ? "ziel" : ""}`} data-stapel-zeile data-id={e.id}>
            <div className="fa-stapel-zeile">
              <button type="button" className="fa-stapel-griff" aria-label={`${e.name} auf ein anderes Blatt ziehen, um beide zusammenzufügen`} title="Auf ein anderes Blatt ziehen = zusammenfügen"
                onPointerDown={(ev) => zugStart(ev, e.id)} onPointerMove={(ev) => setZiel(zugWo(ev))} onPointerUp={zugEnde} onPointerCancel={() => { zug.current = null; setZiel(null); }} data-stapel-griff><GripVertical size={16}/></button>
              <input type="checkbox" checked={wahl.has(e.id)} aria-label={`${e.name} wählen`} onChange={() => setWahl((w) => { const n = new Set(w); if (n.has(e.id)) n.delete(e.id); else n.add(e.id); return n; })}/>
              <button type="button" className="fa-stapel-name" onClick={() => setOffen(offen === e.id ? null : e.id)} aria-expanded={offen === e.id}>
                {offen === e.id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}<span>{e.name}</span>
              </button>
              <span className={`badge ${e.sicher ? "" : "warn"}`} data-stapel-stand={e.sicher ? "sicher" : "pruefen"}>{e.quelle === "pdf" ? "PDF" : e.quelle === "zusammen" ? "zusammengefügt" : e.sicher ? "gerade gezogen" : "Ecken prüfen"}</span>
              {e.pruefung && <span className={`badge ${e.pruefung.stand === "warnung" ? "warn" : ""}`} data-stapel-geprueft={e.pruefung.stand}>{e.pruefung.stand === "warnung" ? "Prüfung: Befund" : e.pruefung.stand === "sauber" ? "geprüft" : "ungeprüft"}</span>}
              <small>{groesse(e.groesse)}</small>
            </div>
            {offen === e.id && <div className="fa-stapel-detail" data-stapel-detail>
              {bild ? <img src={bild} alt={`Vorschau ${e.name}`} data-stapel-vorschau/> : <button type="button" className="button secondary" onClick={() => openFile(stapelDatei(e))}><FileText size={16}/> PDF ansehen</button>}
              <p className="fa-stapel-grund">{e.grund}</p>
              {e.pruefung && <div className="fa-stapel-bericht" data-stapel-bericht={e.pruefung.stand}><strong>Prüfbericht: {e.pruefung.stand === "warnung" ? `${e.pruefung.funde.length} Befund(e)` : e.pruefung.stand === "sauber" ? "nichts Verstecktes gefunden" : "nicht geprüft"}</strong>
                {e.pruefung.funde.map((f, i) => <span key={i}>{f.name}: {f.satz}</span>)}{e.pruefung.stand !== "sauber" && e.pruefung.hinweise.slice(0, 3).map((h, i) => <small key={`h${i}`}>{h}</small>)}</div>}
              <div className="button-row">
                <button type="button" className="button secondary" onClick={() => onWorkflowPdf(stapelDatei(e))} data-stapel-wfpdf>In Workflow PDF öffnen (anpassen, zuschneiden, prüfen)</button>
                <button type="button" className="button secondary" disabled={busy} onClick={() => void pruefen([e])} data-stapel-pruefen><ShieldCheck size={15}/> Prüfen (versteckter Text, Anweisungen an eine KI)</button>
                <button type="button" className="button primary" disabled={busy} onClick={() => void einordnen([e])} data-stapel-einzeln>Einordnen</button>
                <button type="button" className="button secondary" onClick={() => void entfernen(e)} data-stapel-weg><Trash2 size={15}/> Entfernen</button>
              </div>
            </div>}
          </li>)}
        </ul>}
    </div>
  );
}
