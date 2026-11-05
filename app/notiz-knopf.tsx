import { Check, NotebookPen, StickyNote, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FamilyRecordUnion, FamilyRelation } from "../lib/family-data-model";
import { buildMemoryAnalysis, erinnerungAusText, erinnerungsTitel } from "../lib/family-memory";
import { ErinnernTeil, KALENDER_OEFFNEN, type ErinnernWert } from "./erinnern-teil";
import { createLocalMemoryBundle, deleteLocalMemoryRecord } from "./local-vault";
import { VoiceTextarea } from "./ui-controls";

/**
 * Knopf „Notiz“ im Kopf (Klaus 2026-11-05): eine Notiz einsprechen oder tippen, direkt vom Handy, ohne erst ins Tagebuch zu
 * gehen. Tag und Uhrzeit werden aus dem Text erkannt („erinnere mich morgen um 9 Uhr …“, „in 5 Stunden“); mit „Erinnern
 * lassen“ entsteht dazu eine Aufgabe mit Termin, auf Wunsch im Kalender. Gespeichert wird als Erinnerungseintrag (Memory)
 * – erst nach dem Tipp auf „Speichern“.
 */
export function NotizKnopf({ vaultHandle, records, relations, onGespeichert, onFehler }: {
  vaultHandle: FileSystemDirectoryHandle | null; records: FamilyRecordUnion[]; relations: FamilyRelation[];
  onGespeichert: (text: string) => Promise<void> | void; onFehler: (text: string) => void;
}) {
  const [offen, setOffen] = useState(false);
  return <>
    <button type="button" className="icon-button notiz-knopf-schalter" onClick={() => setOffen(true)} title="Notiz oder Erinnerung einsprechen" aria-label="Notiz" aria-haspopup="dialog" data-notiz-knopf><StickyNote size={18}/></button>
    {offen && <NotizFenster vaultHandle={vaultHandle} records={records} relations={relations} onZu={() => setOffen(false)} onGespeichert={onGespeichert} onFehler={onFehler}/>}
  </>;
}

/** Entwurf über das Schließen hinaus (z. B. nach dem Sprung zu „Kalender verbinden“), nur im Speicher. */
let entwurf = "";

function NotizFenster({ vaultHandle, records, relations, onZu, onGespeichert, onFehler }: {
  vaultHandle: FileSystemDirectoryHandle | null; records: FamilyRecordUnion[]; relations: FamilyRelation[];
  onZu: () => void; onGespeichert: (text: string) => Promise<void> | void; onFehler: (text: string) => void;
}) {
  const [text, setTextRoh] = useState(entwurf);
  const setText = (t: string) => { entwurf = t; setTextRoh(t); };
  const [erinnerung, setErinnerung] = useState<ErinnernWert | null>(null);
  const [runde, setRunde] = useState(0); // neu beginnen: „Erinnern lassen“ vergisst Eingaben von Hand
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState("");
  // Klaus 2026-11-05: der Haken speichert bewusst; gespeicherte Notizen klappen zu einer Liste zusammen, jede mit Mülleimer,
  // darüber gleich das Feld für die nächste.
  const [liste, setListe] = useState<Array<{ id: string; titel: string; wann: string }>>([]);
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
    if (!text.trim() || !analyse) return setFehler("Bitte eine Notiz eingeben oder einsprechen.");
    if (!vaultHandle) return setFehler("Bitte zuerst im Sicherheitscenter einen Datentresor verbinden.");
    setBusy(true); setFehler("");
    try {
      const r = await createLocalMemoryBundle(vaultHandle, { originalText: text.trim(), captureType: "text", analysis: analyse, mediaFiles: [], selectedReferences: [], erinnerung: erinnerung || undefined });
      const wann = erinnerung ? `${new Date(`${erinnerung.dueAt}T00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}${erinnerung.dueTime ? `, ${erinnerung.dueTime} Uhr` : ""}` : "ohne Erinnerung";
      geaendert.current = true;
      setListe((l) => [{ id: r.event.id, titel: erinnerung?.titel || analyse.title, wann }, ...l]);
      setText(""); setErinnerung(null); setRunde((x) => x + 1);
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
        {text && <button type="button" className="notiz-leeren" onClick={() => { setText(""); setErinnerung(null); setRunde((x) => x + 1); feld.current?.querySelector("textarea")?.focus(); }} aria-label="Text und Erinnerung löschen" title="Text und Erinnerung löschen" data-notiz-leeren><X size={14}/></button>}
        <button type="button" className="notiz-aktion speichern" onClick={() => void speichern()} disabled={busy || !text.trim()} aria-label="Notiz speichern" title="Speichern" data-notiz-speichern><Check size={22}/></button>
      </div>
      {/* Ohne Text keine Erinnerung – woran sollte sie erinnern? (Klaus 2026-11-05) */}
      {text.trim() && <ErinnernTeil key={runde} erkannt={erkannt} titelVorschlag={erkannt?.wunsch ? erinnerungsTitel(text) : analyse?.taskProposal || analyse?.title || text.trim().slice(0, 80)} onChange={setErinnerung} onKalender={zumKalender}/>}
      {fehler && <p className="form-error" role="alert">{fehler}</p>}
      {liste.length > 0 && <ul className="notiz-liste" aria-label="Gespeicherte Notizen" data-notiz-liste>
        {liste.map((n) => <li key={n.id} data-notiz-eintrag={n.id}><Check size={16}/><span><strong>{n.titel}</strong><small>{n.wann}</small></span><button type="button" className="notiz-weg" onClick={() => void loeschen(n.id)} disabled={busy} aria-label={`„${n.titel}“ wieder löschen`} title="Wieder löschen" data-notiz-loeschen><Trash2 size={18}/></button></li>)}
      </ul>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={() => void schliessen()} disabled={busy} data-notiz-fertig>{liste.length ? "Fertig" : "Abbrechen"}</button></div>
    </section>
  </div>;
}
