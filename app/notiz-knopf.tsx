import { NotebookPen, StickyNote, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FamilyRecordUnion, FamilyRelation } from "../lib/family-data-model";
import { buildMemoryAnalysis, erinnerungAusText } from "../lib/family-memory";
import { ErinnernTeil, type ErinnernWert } from "./erinnern-teil";
import { createLocalMemoryBundle } from "./local-vault";
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
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState("");
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
  useEffect(() => { const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onZu(); }; window.addEventListener("keydown", esc); return () => window.removeEventListener("keydown", esc); }, [onZu]);

  const speichern = async () => {
    if (!text.trim() || !analyse) return setFehler("Bitte eine Notiz eingeben oder einsprechen.");
    if (!vaultHandle) return setFehler("Bitte zuerst im Sicherheitscenter einen Datentresor verbinden.");
    setBusy(true); setFehler("");
    try {
      const r = await createLocalMemoryBundle(vaultHandle, { originalText: text.trim(), captureType: "text", analysis: analyse, mediaFiles: [], selectedReferences: [], erinnerung: erinnerung || undefined });
      const wann = erinnerung ? ` Erinnerung am ${new Date(`${erinnerung.dueAt}T00:00`).toLocaleDateString("de-DE")}${erinnerung.dueTime ? ` um ${erinnerung.dueTime} Uhr` : ""}${erinnerung.kalenderEintragen ? ", für den Kalender vorgemerkt" : ""}.` : "";
      await onGespeichert(`Notiz gespeichert (${r.event.id}).${wann}`);
      onZu();
    } catch (g) { const t = g instanceof Error ? g.message : String(g); setFehler(t); onFehler(t); }
    finally { setBusy(false); }
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onZu(); }}>
    <section className="modal notiz-fenster" role="dialog" aria-modal="true" aria-labelledby="notiz-titel" data-notiz-fenster>
      <div className="modal-head"><div><h2 id="notiz-titel"><NotebookPen size={18}/> Notiz</h2></div><button type="button" className="icon-button" onClick={onZu} aria-label="Schließen" disabled={busy}><X size={18}/></button></div>
      <div ref={feld} className="notiz-text"><VoiceTextarea rows={3} value={text} onValueChange={setText} placeholder="Zum Beispiel: Erinnere mich morgen um 9 Uhr, Jens anzurufen" speechLabel="Notiz" data-notiz-eingabe/></div>
      <ErinnernTeil erkannt={erkannt} titelVorschlag={analyse?.taskProposal || analyse?.title || text.trim().slice(0, 80)} onChange={setErinnerung}/>
      {fehler && <p className="form-error" role="alert">{fehler}</p>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onZu} disabled={busy}>Abbrechen</button><button type="button" className="button primary" onClick={() => void speichern()} disabled={busy || !text.trim()} data-notiz-speichern>{busy ? "Wird gespeichert …" : "Speichern"}</button></div>
    </section>
  </div>;
}
