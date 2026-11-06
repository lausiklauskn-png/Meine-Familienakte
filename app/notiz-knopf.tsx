import { CalendarDays, Camera, Check, NotebookPen, StickyNote, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FamilyRecordUnion, FamilyRelation } from "../lib/family-data-model";
import { buildMemoryAnalysis, erinnerungAusText, erinnerungsTitel } from "../lib/family-memory";
import { ErinnernTeil, KALENDER_OEFFNEN, type ErinnernWert } from "./erinnern-teil";
import { createLocalMemoryBundle, deleteLocalMemoryRecord } from "./local-vault";
import { glockeEinschalten } from "./app-glocke";
import { kalenderZiel, useKalenderEinst } from "./kalender-karte";
import { VoiceTextarea } from "./ui-controls";
import { AugeKnopf, FlachText } from "./flach-zeile";

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
    <button type="button" className="icon-button notiz-knopf-schalter" onClick={() => setOffen(true)} title="Notiz oder Erinnerung einsprechen" aria-label="Notiz" aria-haspopup="dialog" data-notiz-knopf><StickyNote size={18}/></button>
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
  const [liste, setListe] = useState<Array<{ id: string; titel: string; wann: string; tag?: string }>>([]);
  const geaendert = useRef(false);
  const feld = useRef<HTMLDivElement>(null);
  const erkannt = useMemo(() => erinnerungAusText(text), [text]);
  const analyse = useMemo(() => text.trim() ? buildMemoryAnalysis({ originalText: text, captureType: "text", records, relations }) : null, [text, records, relations]);
  // Klaus 2026-11-05: Tipp auf „Notiz“ und gleich sprechen – das Mikrofon startet von selbst (wo der Browser es zulässt).
  // Der Mikrofonknopf prüft beim Einhängen erst die Freigabe; bis zu 2 s warten, sonst ins Textfeld. Mit Entwurf nicht.
  useEffect(() => {
    let n = 0; feld.current?.querySelector("textarea")?.focus();
    if (entwurf) return;
    const t = window.setInterval(() => { const mic = feld.current?.querySelector<HTMLButtonElement>(".dictation-button"); if (mic && !mic.disabled) { window.clearInterval(t); if (!mic.classList.contains("listening")) mic.click(); } else if (++n > 20) window.clearInterval(t); }, 100);
    return () => window.clearInterval(t);
  }, []);
  // Schließen: erst jetzt neu laden, damit der Kalender-Abgleich nicht vor einem Löschen einträgt.
  const schliessen = async (behalten = false) => {
    if (busy) return;
    if (!behalten) entwurf = "";
    if (geaendert.current) await onGespeichert(liste.length ? `${liste.length} Notiz${liste.length === 1 ? "" : "en"} gespeichert.` : "Notizen aktualisiert.");
    onZu();
  };
  const zuRef = useRef(schliessen); zuRef.current = schliessen;
  useEffect(() => { const esc = (e: KeyboardEvent) => { if (e.key === "Escape") void zuRef.current(); }; window.addEventListener("keydown", esc); return () => window.removeEventListener("keydown", esc); }, []);

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
      setListe((l) => [{ id: r.event.id, titel: erinnerung?.titel || (text.trim() ? analyseJetzt.title : `Foto-Notiz (${fotos.length})`), wann: fotos.length ? `📷 ${fotos.length} · ${wann}` : wann, tag: erinnerung?.dueAt }, ...l]);
      setText(""); setFotos([]); setErinnerung(null); setRunde((x) => x + 1);
      feld.current?.querySelector("textarea")?.focus();
    } catch (g) { const t = g instanceof Error ? g.message : String(g); setFehler(t); onFehler(t); }
    finally { setBusy(false); }
  };
  const loeschen = async (id: string) => {
    if (!vaultHandle) return;
    setBusy(true); setFehler("");
    try { await deleteLocalMemoryRecord(vaultHandle, id, { keepLinkedSchedules: false }); geaendert.current = true; setListe((l) => l.filter((x) => x.id !== id)); }
    catch (g) { const t = g instanceof Error ? g.message : String(g); setFehler(t); onFehler(t); }
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
        {liste.map((n) => { const auf = listeAuf === n.id; return <li key={n.id} data-notiz-eintrag={n.id} className={auf ? "offen" : undefined}><div className="fz-kopf"><Check size={16}/><span className="mk-text"><strong><FlachText text={n.titel}/></strong><small>{n.wann}</small></span><AugeKnopf offen={auf} titel={n.titel} onClick={() => setListeAuf(auf ? null : n.id)} data-notiz-auge/></div>
          {auf && <div className="fz-offen"><p><strong>{n.titel}</strong></p><small>{n.wann}</small><div className="button-row">{n.tag && onKalender && <button type="button" className="button secondary" onClick={() => { const t = n.tag!; void schliessen().then(() => onKalender(t)); }} disabled={busy} title="Im Kalender ansehen" data-notiz-im-kalender><CalendarDays size={16}/> Im Kalender</button>}<button type="button" className="loesch-knopf mit-text" onClick={() => void loeschen(n.id)} disabled={busy} aria-label={`„${n.titel}“ wieder löschen`} title="Wieder löschen" data-notiz-loeschen><Trash2 size={16}/><span>Löschen</span></button></div></div>}</li>; })}
      </ul>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={() => void schliessen()} disabled={busy} data-notiz-fertig>{liste.length ? "Fertig" : "Abbrechen"}</button></div>
    </section>
  </div>;
}

function FotoVorschau({ datei }: { datei: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => { const u = URL.createObjectURL(datei); setUrl(u); return () => URL.revokeObjectURL(u); }, [datei]);
  return url ? <img src={url} alt=""/> : null;
}
