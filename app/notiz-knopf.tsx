import { CalendarDays, Camera, Check, NotebookPen, StickyNote, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FamilyRecordUnion, FamilyRelation } from "../lib/family-data-model";
import { buildMemoryAnalysis, erinnerungAusText, erinnerungsTitel, memoryData } from "../lib/family-memory";
import { ErinnernTeil, KALENDER_OEFFNEN, type ErinnernWert } from "./erinnern-teil";
import { createLocalMemoryBundle, readLocalVaultData, updateLocalScheduleStatus } from "./local-vault";
import { NotizLoeschen } from "./loesch-knopf";
import { MemoryBearbeiten } from "./memory-bearbeiten";
import { glockeEinschalten } from "./app-glocke";
import { kalenderZiel, useKalenderEinst } from "./kalender-karte";
import { VoiceTextarea } from "./ui-controls";
import { AugeKnopf, FlachText, KnopfLeiste, StiftKnopf } from "./flach-zeile";

/**
 * Knopf „Notiz“ im Kopf (Klaus 2026-11-05): eine Notiz einsprechen oder tippen, direkt vom Handy, ohne erst ins Tagebuch zu
 * gehen. Tag und Uhrzeit werden aus dem Text erkannt („erinnere mich morgen um 9 Uhr …“, „in 5 Stunden“); mit „Erinnern
 * lassen“ entsteht dazu eine Aufgabe mit Termin, auf Wunsch im Kalender. Gespeichert wird als Erinnerungseintrag (Memory)
 * – erst nach dem Tipp auf „Speichern“.
 */
export function NotizKnopf({ vaultHandle, records, relations, onGespeichert, onFehler, onKalender }: {
  vaultHandle: FileSystemDirectoryHandle | null; records: FamilyRecordUnion[]; relations: FamilyRelation[];
  onGespeichert: (text: string) => Promise<void> | void; onFehler: (text: string) => void; onKalender?: (tag: string) => void;
}) {
  const [offen, setOffen] = useState(false);
  return <>
    <button type="button" className="icon-button notiz-knopf-schalter" onClick={() => setOffen(true)} title="Notiz oder Erinnerung einsprechen" aria-label="Notiz" aria-haspopup="dialog" data-notiz-knopf><StickyNote size={18}/><span className="kopf-wort" aria-hidden="true">Notiz</span></button>
    {offen && <NotizFenster vaultHandle={vaultHandle} records={records} relations={relations} onZu={() => setOffen(false)} onGespeichert={onGespeichert} onFehler={onFehler} onKalender={onKalender}/>}
  </>;
}

/** Entwurf über das Schließen hinaus (z. B. nach dem Sprung zu „Kalender verbinden“), nur im Speicher. */
let entwurf = "";

function NotizFenster({ vaultHandle, records, relations, onZu, onGespeichert, onFehler, onKalender }: {
  vaultHandle: FileSystemDirectoryHandle | null; records: FamilyRecordUnion[]; relations: FamilyRelation[];
  onZu: () => void; onGespeichert: (text: string) => Promise<void> | void; onFehler: (text: string) => void; onKalender?: (tag: string) => void;
}) {
  const kalender = useKalenderEinst();
  const [text, setTextRoh] = useState(entwurf);
  const setText = (t: string) => { entwurf = t; setTextRoh(t); };
  const [erinnerung, setErinnerung] = useState<ErinnernWert | null>(null);
  const [runde, setRunde] = useState(0); // neu beginnen: „Erinnern lassen“ vergisst Eingaben von Hand
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState("");
  // Klaus 2026-11-05: der Haken speichert bewusst; gespeicherte Notizen klappen zu einer Liste zusammen, jede mit Mülleimer,
  // darüber gleich das Feld für die nächste.
  // Klaus 2026-11-06: Foto zur Notiz (Kamera zwischen Mikrofon und Haken); gespeichert wie Fotos im Tagebuch.
  const [fotos, setFotos] = useState<File[]>([]);
  const kamera = useRef<HTMLInputElement>(null);
  const [listeAuf, setListeAuf] = useState<string | null>(null); // Auge (Klaus 2026-11-06)
  const [liste, setListe] = useState<Array<{ id: string; titel: string; wann: string; tag?: string; aufgabe?: string; erledigt?: boolean }>>([]);
  // U9: derselbe ✓ wie in den Listen – die Erinnerung (Aufgabe) zur Notiz als erledigt markieren.
  const erledigen = async (id: string, aufgabe: string) => {
    if (!vaultHandle) return;
    setBusy(true); setFehler("");
    try { await updateLocalScheduleStatus(vaultHandle, aufgabe, "erledigt"); geaendert.current = true; setListe((l) => l.map((x) => x.id === id ? { ...x, erledigt: true, wann: `✓ erledigt · ${x.wann}` } : x)); }
    catch (g) { const t = g instanceof Error ? g.message : String(g); setFehler(t); onFehler(t); }
    finally { setBusy(false); }
  };
  const geaendert = useRef(false);
  const feld = useRef<HTMLDivElement>(null);
  const erkannt = useMemo(() => erinnerungAusText(text), [text]);
  const analyse = useMemo(() => text.trim() ? buildMemoryAnalysis({ originalText: text, captureType: "text", records, relations }) : null, [text, records, relations]);
  // Klaus 2026-11-06: das Mikrofon startet NICHT mehr von selbst (fremde Nutzer erschraken). Erst der Tipp auf das Mikrofon
  // nimmt Sprache auf; beim Öffnen steht nur der Cursor im Textfeld.
  useEffect(() => { feld.current?.querySelector("textarea")?.focus(); }, []);
  // Schließen: erst jetzt neu laden, damit der Kalender-Abgleich nicht vor einem Löschen einträgt.
  const schliessen = async (behalten = false) => {
    if (busy) return;
    if (!behalten) entwurf = "";
    if (geaendert.current) await onGespeichert(liste.length ? `${liste.length} Notiz${liste.length === 1 ? "" : "en"} gespeichert.` : "Notizen aktualisiert.");
    onZu();
  };
  const zuRef = useRef(schliessen); zuRef.current = schliessen;
  useEffect(() => { const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector("[data-memory-bearbeiten]")) void zuRef.current(); }; window.addEventListener("keydown", esc); return () => window.removeEventListener("keydown", esc); }, []);

  const speichern = async () => {
    if (!text.trim() && !fotos.length) return setFehler("Bitte eine Notiz eingeben, einsprechen oder ein Foto machen.");
    const analyseJetzt = analyse || buildMemoryAnalysis({ originalText: "Foto-Notiz", captureType: "foto", records, relations });
    if (!vaultHandle) return setFehler("Bitte zuerst im Sicherheitscenter einen Datentresor verbinden.");
    setBusy(true); setFehler("");
    try {
      const r = await createLocalMemoryBundle(vaultHandle, { originalText: text.trim(), captureType: fotos.length ? (text.trim() ? "kombination" : "foto") : "text", analysis: analyseJetzt, mediaFiles: fotos, selectedReferences: [], erinnerung: erinnerung || undefined });
      // Wo es gelandet ist (Klaus 2026-11-05): die Notiz im Tagebuch, die Erinnerung in „Mein Kalender“ (und im verbundenen).
      const wann = erinnerung ? `🔔 ${new Date(`${erinnerung.dueAt}T00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}${erinnerung.dueTime ? `, ${erinnerung.dueTime} Uhr` : ""} · in Mein Kalender${erinnerung.kalenderEintragen && kalender ? ` und ${kalenderZiel(kalender)}` : ""}` : "im Tagebuch, ohne Erinnerung";
      geaendert.current = true;
      if (erinnerung) glockeEinschalten(); // Klaus 2026-11-06: Erinnerung gespeichert = Glocke an, ohne extra Tipp
      setListe((l) => [{ id: r.event.id, titel: erinnerung?.titel || (text.trim() ? analyseJetzt.title : `Foto-Notiz (${fotos.length})`), wann: fotos.length ? `📷 ${fotos.length} · ${wann}` : wann, tag: erinnerung?.dueAt, aufgabe: erinnerung && r.task ? r.task.id : undefined }, ...l]);
      setText(""); setFotos([]); setErinnerung(null); setRunde((x) => x + 1);
      feld.current?.querySelector("textarea")?.focus();
    } catch (g) { const t = g instanceof Error ? g.message : String(g); setFehler(t); onFehler(t); }
    finally { setBusy(false); }
  };
  // Stift in der Notiz-Liste (Klaus 2026-11-08): gespeicherte Notiz frisch aus dem Tresor lesen und gleich bearbeiten.
  const [aendern, setAendern] = useState<{ event: FamilyRecordUnion; aufgaben: FamilyRecordUnion[] } | null>(null);
  const aendernOeffnen = async (id: string) => {
    if (!vaultHandle) return;
    setBusy(true); setFehler("");
    try {
      const d = await readLocalVaultData(vaultHandle);
      const event = d.records.find((r) => r.id === id);
      if (!event || !memoryData(event)) throw new Error("Die Notiz wurde nicht gefunden.");
      const aufgaben = d.records.filter((r) => (r.recordType === "task" || r.recordType === "deadline") && r.status !== "erledigt" && d.relations.some((rel) => rel.fromId === r.id && rel.toId === id));
      setAendern({ event, aufgaben });
    } catch (g) { const t = g instanceof Error ? g.message : String(g); setFehler(t); onFehler(t); }
    finally { setBusy(false); }
  };
  // Kalender-Knopf: Entwurf behalten, Fenster zu, zu „Kalender verbinden“.
  const zumKalender = () => { void schliessen(true).then(() => window.dispatchEvent(new Event(KALENDER_OEFFNEN))); };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) void schliessen(); }}>
    <section className="modal notiz-fenster" role="dialog" aria-modal="true" aria-labelledby="notiz-titel" data-notiz-fenster>
      <div className="modal-head"><div><h2 id="notiz-titel"><NotebookPen size={18}/> Notiz</h2></div><button type="button" className="icon-button" onClick={() => void schliessen()} aria-label="Schließen" disabled={busy} data-notiz-schliessen><X size={18}/></button></div>
      <div ref={feld} className="notiz-text"><VoiceTextarea rows={3} value={text} onValueChange={setText} placeholder={liste.length ? "Nächste Notiz …" : "Zum Beispiel: Erinnere mich morgen um 9 Uhr, Jens anzurufen"} speechLabel="Notiz" data-notiz-eingabe/>
        {(text || fotos.length > 0) && <button type="button" className="notiz-leeren" onClick={() => { setText(""); setFotos([]); setErinnerung(null); setRunde((x) => x + 1); feld.current?.querySelector("textarea")?.focus(); }} aria-label="Text und Erinnerung löschen" title="Text und Erinnerung löschen" data-notiz-leeren><X size={14}/></button>}
        <input ref={kamera} className="sr-only" type="file" accept="image/*" capture="environment" multiple onChange={(e) => { const neu = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/")); setFotos((f) => [...f, ...neu].slice(0, 12)); e.currentTarget.value = ""; }} data-notiz-kamera-eingabe/>
        <button type="button" className="notiz-aktion kamera" onClick={() => kamera.current?.click()} disabled={busy || fotos.length >= 12} aria-label="Foto zur Notiz aufnehmen" title="Foto aufnehmen" data-notiz-kamera><Camera size={20}/>{fotos.length > 0 && <i className="notiz-foto-zahl">{fotos.length}</i>}</button>
        <button type="button" className="notiz-aktion speichern" onClick={() => void speichern()} disabled={busy || (!text.trim() && !fotos.length)} aria-label="Notiz speichern" title="Speichern" data-notiz-speichern><Check size={22}/></button>
      </div>
      {fotos.length > 0 && <ul className="notiz-fotos" aria-label="Fotos zur Notiz" data-notiz-fotos>{fotos.map((f, i) => <li key={`${f.name}-${i}`}><FotoVorschau datei={f}/><button type="button" onClick={() => setFotos((l) => l.filter((_, j) => j !== i))} aria-label={`Foto ${i + 1} entfernen`} title="Foto entfernen" data-notiz-foto-weg><X size={14}/></button></li>)}</ul>}
      {/* Ohne Text keine Erinnerung – woran sollte sie erinnern? (Klaus 2026-11-05) */}
      {text.trim() && <ErinnernTeil key={runde} erkannt={erkannt} titelVorschlag={erkannt?.wunsch ? erinnerungsTitel(text) : analyse?.taskProposal || analyse?.title || text.trim().slice(0, 80)} onChange={setErinnerung} onKalender={zumKalender}/>}
      {fehler && <p className="form-error" role="alert">{fehler}</p>}
      {liste.length > 0 && <ul className="notiz-liste" aria-label="Gespeicherte Notizen" data-notiz-liste>
        {liste.map((n) => { const auf = listeAuf === n.id; return <li key={n.id} data-notiz-eintrag={n.id} className={auf ? "offen" : undefined}><div className="fz-kopf fz-voll"><Check size={16}/><span className="mk-text"><strong><FlachText text={n.titel} ganz={auf}/></strong><small>{n.wann}</small></span><KnopfLeiste titel={n.titel}>{vaultHandle && n.aufgabe && !n.erledigt && <button type="button" className="icon-button" disabled={busy} onClick={() => void erledigen(n.id, n.aufgabe!)} aria-label={`Erinnerung „${n.titel}“ als erledigt markieren`} title="Als erledigt markieren" data-notiz-erledigt={n.id}><Check size={18}/></button>}{vaultHandle && <StiftKnopf titel={n.titel} disabled={busy} onClick={() => void aendernOeffnen(n.id)} data-notiz-aendern={n.id}/>}{vaultHandle && <NotizLoeschen id={n.id} titel={n.titel} vaultHandle={vaultHandle} onGeloescht={() => { geaendert.current = true; setListe((l) => l.filter((x) => x.id !== n.id)); }}/>}<AugeKnopf offen={auf} titel={n.titel} onClick={() => setListeAuf(auf ? null : n.id)} data-notiz-auge/></KnopfLeiste></div>
          {auf && n.tag && onKalender && <div className="fz-offen"><div className="button-row">{n.tag && onKalender && <button type="button" className="button secondary" onClick={() => { const t = n.tag!; void schliessen().then(() => onKalender(t)); }} disabled={busy} title="Im Kalender ansehen" data-notiz-im-kalender><CalendarDays size={16}/> Im Kalender</button>}</div></div>}</li>; })}
      </ul>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={() => void schliessen()} disabled={busy} data-notiz-fertig>{liste.length ? "Fertig" : "Abbrechen"}</button></div>
    </section>
    {aendern && vaultHandle && <MemoryBearbeiten event={aendern.event} data={memoryData(aendern.event)!} aufgaben={aendern.aufgaben} vaultHandle={vaultHandle} onZu={() => setAendern(null)} onGespeichert={async () => {
      geaendert.current = true;
      const d = await readLocalVaultData(vaultHandle); const neu = d.records.find((r) => r.id === aendern.event.id); const titel = neu ? memoryData(neu)?.title : undefined;
      if (titel) setListe((l) => l.map((x) => x.id === aendern.event.id ? { ...x, titel } : x));
    }}/>}
  </div>;
}

function FotoVorschau({ datei }: { datei: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => { const u = URL.createObjectURL(datei); setUrl(u); return () => URL.revokeObjectURL(u); }, [datei]);
  return url ? <img src={url} alt=""/> : null;
}
