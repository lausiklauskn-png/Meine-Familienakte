import { X } from "lucide-react";
import { useState } from "react";
import { FAWOGA_LIFE_AREAS } from "../lib/document-intake";
import type { FamilyRecordUnion } from "../lib/family-data-model";
import { erinnerungAusText, erinnerungsTitel, type MemoryConfidence, type MemoryEventData } from "../lib/family-memory";
import { ERINNERUNG_VORGABE, erinnerungsName as erinnerungsNameKurz, kalenderFelder, KURZ_ERINNERUNGEN, type ErinnerungsWahl } from "../lib/kalender";
import { DatumFeld } from "./datum-feld";
import { ErinnernTeil, type ErinnernWert } from "./erinnern-teil";
import { ErinnerungsChips, KalenderAuswahl, useKalenderEinst, type KalenderWahl } from "./kalender-karte";
import { addLocalMemoryErinnerung, updateLocalMemoryRecord, updateLocalScheduleTermin } from "./local-vault";
import { VoiceInput, VoiceTextarea } from "./ui-controls";

type Termin = { id: string; titel: string; datum: string; zeit: string; wahl: ErinnerungsWahl[]; kal: KalenderWahl | null };

/**
 * „Memory bearbeiten“ (Klaus 2026-11-05): ein Eintrag lässt sich jederzeit ändern – Titel, Text, Lebensbereich, Zeitpunkt,
 * Einordnung und die Erinnerung (Tag, Uhrzeit, Erinnern, Kalender). Fehlt eine Erinnerung, kann man sie hier anlegen.
 * Gespeichert wird erst auf „Speichern“; der Kalender-Abgleich zieht geänderte Termine nach.
 */
export function MemoryBearbeiten({ event, data, aufgaben, vaultHandle, onZu, onGespeichert }: {
  event: FamilyRecordUnion; data: MemoryEventData; aufgaben: FamilyRecordUnion[]; vaultHandle: FileSystemDirectoryHandle;
  onZu: () => void; onGespeichert: (text: string) => Promise<void> | void;
}) {
  const kalender = useKalenderEinst();
  const [titel, setTitel] = useState(data.title);
  const [text, setText] = useState(data.originalText || "");
  const [bereich, setBereich] = useState(data.lifeArea);
  const [tag, setTag] = useState(data.eventAt.slice(0, 10));
  const [uhr, setUhr] = useState(data.eventAt.slice(11, 16));
  const [einordnung, setEinordnung] = useState<MemoryConfidence>(data.confidence);
  const [termine, setTermine] = useState<Termin[]>(() => aufgaben.map((a) => { const d = a.data as { title: string; dueAt?: string }; const k = kalenderFelder(a); return { id: a.id, titel: d.title, datum: d.dueAt || "", zeit: k.dueTime || "", wahl: k.erinnerungen || kalender?.erinnerungen || ERINNERUNG_VORGABE, kal: k.kalenderWahl || null }; }));
  const [neu, setNeu] = useState<ErnnernOderNull>(null);
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState("");
  const aendern = (id: string, teil: Partial<Termin>) => setTermine((l) => l.map((t) => t.id === id ? { ...t, ...teil } : t));

  const speichern = async () => {
    setBusy(true); setFehler("");
    try {
      await updateLocalMemoryRecord(vaultHandle, event.id, { title: titel, originalText: text, lifeArea: bereich, eventAt: `${tag}T${uhr || "00:00"}:00`, confidence: einordnung });
      for (const t of termine) await updateLocalScheduleTermin(vaultHandle, t.id, { title: t.titel, dueAt: t.datum, dueTime: t.zeit || null, erinnerungen: t.wahl, kalenderWahl: t.kal, kalenderEintragen: true }); // hier bearbeitet = für den Kalender gemeint
      if (neu) await addLocalMemoryErinnerung(vaultHandle, event.id, neu);
      await onGespeichert("Eintrag gespeichert" + (termine.length || neu ? "; die Erinnerung geht beim nächsten Abgleich in den Kalender." : "."));
      onZu();
    } catch (g) { setFehler(g instanceof Error ? g.message : String(g)); }
    finally { setBusy(false); }
  };

  return <div className="modal-backdrop" role="presentation">
    <section className="modal memory-bearbeiten" role="dialog" aria-modal="true" aria-labelledby="memory-bearbeiten-titel" data-memory-bearbeiten>
      <div className="modal-head"><div><span className="eyebrow dark">{event.id}</span><h2 id="memory-bearbeiten-titel">Eintrag bearbeiten</h2></div><button type="button" className="icon-button" onClick={onZu} aria-label="Schließen" disabled={busy}><X size={18}/></button></div>
      <div className="form-grid">
        <label><span>Titel</span><VoiceInput value={titel} onValueChange={setTitel} speechLabel="Titel" data-mb-titel/></label>
        <label><span>Lebensbereich</span><select value={bereich} onChange={(e) => setBereich(e.target.value)} data-mb-bereich>{FAWOGA_LIFE_AREAS.map((b) => <option key={b}>{b}</option>)}</select></label>
        <label><span>Aufgenommen am</span><DatumFeld value={tag} required onChange={(e) => setTag(e.target.value)} data-mb-tag/></label>
        <label><span>Aufgenommen um</span><DatumFeld art="time" value={uhr} onChange={(e) => setUhr(e.target.value)} data-mb-uhr/></label>
        <label><span>Einordnung</span><select value={einordnung} onChange={(e) => setEinordnung(e.target.value as MemoryConfidence)} data-mb-einordnung><option value="bestätigt">bestätigt</option><option value="wahrscheinlich">wahrscheinlich</option><option value="unklar">unklar, noch prüfen</option></select></label>
      </div>
      <label className="memory-bearbeiten-text"><span>Text</span><VoiceTextarea rows={3} value={text} onValueChange={setText} speechLabel="Text" data-mb-text/></label>
      {termine.map((t) => <section key={t.id} className="memory-erinnern an" data-mb-termin={t.id}>
        <strong>🔔 Erinnerung</strong>
        <div className="memory-erinnern-felder">
          <label className="memory-erinnern-titel"><span>Woran erinnern</span><input value={t.titel} onChange={(e) => aendern(t.id, { titel: e.target.value })}/></label>
          <label><span>Tag</span><DatumFeld value={t.datum} required onChange={(e) => aendern(t.id, { datum: e.target.value })} data-mb-termin-tag/></label>
          <label><span>Uhrzeit</span><DatumFeld art="time" value={t.zeit} onChange={(e) => aendern(t.id, { zeit: e.target.value })} data-mb-termin-uhr/></label>
          <KalenderAuswahl einst={kalender} wert={t.kal} onChange={(w) => aendern(t.id, { kal: w })}/>
          <ErinnerungsChips wert={t.wahl} onChange={(w) => aendern(t.id, { wahl: w })} schnell={[...KURZ_ERINNERUNGEN, "1d"]} name="Erinnern"/>
        </div>
      </section>)}
      {!termine.length && <ErinnernTeil erkannt={erinnerungAusText(text)} titelVorschlag={erinnerungsTitel(text) || titel} onChange={setNeu}/>}
      {fehler && <p className="form-error" role="alert">{fehler}</p>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onZu} disabled={busy}>Abbrechen</button><button type="button" className="button primary" onClick={() => void speichern()} disabled={busy || !titel.trim() || !tag} data-mb-speichern>{busy ? "Wird gespeichert …" : "Speichern"}</button></div>
    </section>
  </div>;
}

type ErnnernOderNull = ErinnernWert | null;

/** Kasten „Erinnerung“ in der Eintragsansicht (Klaus 2026-11-05): Tag, Uhrzeit, Erinnern, Kalender – mit Knopf zum Ändern. */
export function ErinnerungKasten({ aufgaben, onAendern }: { aufgaben: FamilyRecordUnion[]; onAendern: () => void }) {
  const kalender = useKalenderEinst();
  return <section className={`memory-erinnerung-kasten${aufgaben.length ? " an" : ""}`} data-erinnerung-kasten>
    <div><strong>🔔 {aufgaben.length ? "Erinnerung aktiv" : "Erinnerung"}</strong>
      {aufgaben.length ? aufgaben.map((a) => { const d = a.data as { title: string; dueAt?: string }; const k = kalenderFelder(a); const imKal = (k.kalender || []).length > 0;
        return <p key={a.id} data-erinnerung-zeile>{d.dueAt ? new Date(`${d.dueAt}T00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }) : "ohne Tag"}{k.dueTime ? `, ${k.dueTime} Uhr` : ""}
          {k.erinnerungen?.length ? ` · ${k.erinnerungen.map(erinnerungsNameKurz).join(", ")}` : ""}
          <small>{!k.kalenderEintragen ? "nicht für den Kalender vorgemerkt" : imKal ? "im Kalender eingetragen" : kalender ? "wartet auf den Kalender (Anmeldung/Abgleich)" : "kein Kalender verbunden"}</small></p>; })
        : <p><small>Keine Erinnerung – der Eintrag liegt nur im Tagebuch.</small></p>}
    </div>
    <button type="button" className="button secondary" onClick={onAendern} data-erinnerung-aendern>{aufgaben.length ? "Erinnerung ändern" : "Erinnern lassen"}</button>
  </section>;
}
