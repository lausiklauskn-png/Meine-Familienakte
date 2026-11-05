import { Check, NotebookPen, StickyNote, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FamilyRecordUnion, FamilyRelation } from "../lib/family-data-model";
import { buildMemoryAnalysis, erinnerungAusText, erinnerungsTitel } from "../lib/family-memory";
import { ErinnernTeil, type ErinnernWert } from "./erinnern-teil";
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
    <button type="button" className="notiz-knopf-schalter" onClick={() => setOffen(true)} title="Notiz oder Erinnerung einsprechen" aria-haspopup="dialog" data-notiz-knopf><StickyNote size={16}/> <span>Notiz</span></button>
    {offen && <NotizFenster vaultHandle={vaultHandle} records={records} relations={relations} onZu={() => setOffen(false)} onGespeichert={onGespeichert} onFehler={onFehler}/>}
  </>;
}

function NotizFenster({ vaultHandle, records, relations, onZu, onGespeichert, onFehler }: {
  vaultHandle: FileSystemDirectoryHandle | null; records: FamilyRecordUnion[]; relations: FamilyRelation[];
  onZu: () => void; onGespeichert: (text: string) => Promise<void> | void; onFehler: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [erinnerung, setErinnerung] = useState<ErinnernWert | null>(null);
  const [runde, setRunde] = useState(0); // neu beginnen: „Erinnern lassen“ vergisst Eingaben von Hand
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState("");
  // Klaus 2026-11-05: Haken setzen speichert bewusst; danach wird er zum Mülleimer, der den Eintrag wieder löscht.
  const [gespeichert, setGespeichert] = useState<{ id: string; meldung: string } | null>(null);
  const feld = useRef<HTMLDivElement>(null);
  const erkannt = useMemo(() => erinnerungAusText(text), [text]);
  const analyse = useMemo(() => text.trim() ? buildMemoryAnalysis({ originalText: text, captureType: "text", records, relations }) : null, [text, records, relations]);
  // Klaus 2026-11-05: Tipp auf „Notiz“ und gleich sprechen – das Mikrofon startet von selbst (wo der Browser es zulässt).
  // Der Mikrofonknopf prüft beim Einhängen erst die Freigabe; bis zu 2 s warten, sonst ins Textfeld.
  useEffect(() => {
    let n = 0; feld.current?.querySelector("textarea")?.focus();
    const t = window.setInterval(() => { const mic = feld.current?.querySelector<HTMLButtonElement>(".dictation-button"); if (mic && !mic.disabled) { window.clearInterval(t); if (!mic.classList.contains("listening")) mic.click(); } else if (++n > 20) window.clearInterval(t); }, 100);
    return () => window.clearInterval(t);
  }, []);
  // Schließen: erst jetzt neu laden, damit der Kalender-Abgleich nicht vor einem Löschen einträgt.
  const schliessen = async () => { if (busy) return; if (gespeichert) await onGespeichert(gespeichert.meldung); onZu(); };
  const zuRef = useRef(schliessen); zuRef.current = schliessen;
  useEffect(() => { const esc = (e: KeyboardEvent) => { if (e.key === "Escape") void zuRef.current(); }; window.addEventListener("keydown", esc); return () => window.removeEventListener("keydown", esc); }, []);

  const speichern = async () => {
    if (!text.trim() || !analyse) return setFehler("Bitte eine Notiz eingeben oder einsprechen.");
    if (!vaultHandle) return setFehler("Bitte zuerst im Sicherheitscenter einen Datentresor verbinden.");
    setBusy(true); setFehler("");
    try {
      const r = await createLocalMemoryBundle(vaultHandle, { originalText: text.trim(), captureType: "text", analysis: analyse, mediaFiles: [], selectedReferences: [], erinnerung: erinnerung || undefined });
      const wann = erinnerung ? ` Erinnerung am ${new Date(`${erinnerung.dueAt}T00:00`).toLocaleDateString("de-DE")}${erinnerung.dueTime ? ` um ${erinnerung.dueTime} Uhr` : ""}${erinnerung.kalenderEintragen ? ", für den Kalender vorgemerkt" : ""}.` : "";
      setGespeichert({ id: r.event.id, meldung: `Notiz gespeichert (${r.event.id}).${wann}` });
    } catch (g) { const t = g instanceof Error ? g.message : String(g); setFehler(t); onFehler(t); }
    finally { setBusy(false); }
  };
  const loeschen = async () => {
    if (!gespeichert || !vaultHandle) return;
    setBusy(true); setFehler("");
    try { await deleteLocalMemoryRecord(vaultHandle, gespeichert.id, { keepLinkedSchedules: false }); setGespeichert(null); await onGespeichert(`Notiz ${gespeichert.id} wieder gelöscht.`); }
    catch (g) { const t = g instanceof Error ? g.message : String(g); setFehler(t); onFehler(t); }
    finally { setBusy(false); }
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) void schliessen(); }}>
    <section className="modal notiz-fenster" role="dialog" aria-modal="true" aria-labelledby="notiz-titel" data-notiz-fenster>
      <div className="modal-head"><div><h2 id="notiz-titel"><NotebookPen size={18}/> Notiz</h2></div><button type="button" className="icon-button" onClick={() => void schliessen()} aria-label="Schließen" disabled={busy} data-notiz-schliessen><X size={18}/></button></div>
      <div ref={feld} className="notiz-text"><VoiceTextarea rows={3} value={text} onValueChange={setText} placeholder="Zum Beispiel: Erinnere mich morgen um 9 Uhr, Jens anzurufen" speechLabel="Notiz" readOnly={Boolean(gespeichert)} data-notiz-eingabe/>
        {text && !gespeichert && <button type="button" className="notiz-leeren" onClick={() => { setText(""); setErinnerung(null); setRunde((x) => x + 1); feld.current?.querySelector("textarea")?.focus(); }} aria-label="Text und Erinnerung löschen" title="Text und Erinnerung löschen" data-notiz-leeren><X size={14}/></button>}
        {gespeichert
          ? <button type="button" className="notiz-aktion loeschen" onClick={() => void loeschen()} disabled={busy} aria-label="Gespeicherte Notiz wieder löschen" title="Wieder löschen" data-notiz-loeschen><Trash2 size={20}/></button>
          : <button type="button" className="notiz-aktion speichern" onClick={() => void speichern()} disabled={busy || !text.trim()} aria-label="Notiz speichern" title="Speichern" data-notiz-speichern><Check size={22}/></button>}
      </div>
      {gespeichert && <p className="notiz-gespeichert" role="status" data-notiz-gespeichert><Check size={16}/> Gespeichert. Mülleimer löscht den Eintrag wieder.</p>}
      {/* Ohne Text keine Erinnerung – woran sollte sie erinnern? (Klaus 2026-11-05) */}
      {text.trim() && <ErinnernTeil key={runde} erkannt={erkannt} titelVorschlag={erkannt?.wunsch ? erinnerungsTitel(text) : analyse?.taskProposal || analyse?.title || text.trim().slice(0, 80)} onChange={setErinnerung}/>}
      {fehler && <p className="form-error" role="alert">{fehler}</p>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={() => void schliessen()} disabled={busy} data-notiz-fertig>{gespeichert ? "Fertig" : "Abbrechen"}</button></div>
    </section>
  </div>;
}
