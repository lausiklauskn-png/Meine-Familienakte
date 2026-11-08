import { CalendarCheck, CalendarX, X } from "lucide-react";
import { useState } from "react";
import type { FamilyRecordUnion } from "../lib/family-data-model";
import { ERINNERUNG_VORGABE, KURZ_ERINNERUNGEN, erinnerungenVerschieben, kalenderFelder, tageZwischen, type ErinnerungsWahl } from "../lib/kalender";
import { DatumFeld } from "./datum-feld";
import { KALENDER_OEFFNEN } from "./erinnern-teil";
import { ErinnerungsChips, KalenderAuswahl, kalenderZiel, useKalenderEinst, type KalenderWahl } from "./kalender-karte";
import { updateLocalScheduleTermin } from "./local-vault";
import { ErinnerungLoeschen } from "./loesch-knopf";
import { VoiceInput } from "./ui-controls";

/**
 * Termin einer Aufgabe oder Frist an Ort und Stelle ändern (Klaus 2026-11-05: „Erinnerung sehen, bearbeiten, speichern“,
 * ohne zwischen Seiten hin und her zu springen): Titel, Tag, Uhrzeit, Erinnerungen, Kalender. Gespeichert wird erst auf
 * „Speichern“; der Kalender-Abgleich zieht nach.
 */
export function TerminBearbeiten({ record, vaultHandle, onZu, onGespeichert }: { record: FamilyRecordUnion; vaultHandle: FileSystemDirectoryHandle; onZu: () => void; onGespeichert: (text: string) => Promise<void> | void }) {
  const kalender = useKalenderEinst();
  // Reine Erinnerung (Klaus 2026-11-08): nur Titel, Tag und Uhrzeit; Kalender und Vorlauf gehören zur Frist dahinter.
  const nurErinnerung = record.recordType === "reminder";
  const d = record.data as { title: string; dueAt?: string; remindAt?: string };
  const k = kalenderFelder(record);
  const [titel, setTitel] = useState(d.title || "");
  const [datum, setDatum] = useState(nurErinnerung ? String(d.remindAt || "").slice(0, 10) : d.dueAt || "");
  const [zeit, setZeit] = useState(nurErinnerung ? String(d.remindAt || "").slice(11, 16) : k.dueTime || "");
  // Gezeigt wird, was gilt (eigene Zeiten, sonst die Vorgabe – auch das Erinnerungsdatum steht hier als eigener Chip, U7).
  const [anfang] = useState(() => ({ wahl: k.erinnerungen || kalender?.erinnerungen || ERINNERUNG_VORGABE, imKalender: k.kalenderEintragen === true, kal: k.kalenderWahl || null }));
  const [wahl, setWahl] = useState<ErinnerungsWahl[]>(anfang.wahl);
  const [kal, setKal] = useState<KalenderWahl | null>(anfang.kal);
  const [imKalender, setImKalender] = useState(anfang.imKalender);
  const [kalenderGetippt, setKalenderGetippt] = useState(false);
  // U7: Tag verschoben – eigene Erinnerungszeiten ziehen sichtbar mit.
  const tagSetzen = (neu: string) => { if (!nurErinnerung && datum && /^\d{4}-\d{2}-\d{2}$/.test(neu)) setWahl((w) => erinnerungenVerschieben(w, tageZwischen(datum, neu))); setDatum(neu); };
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState("");
  const speichern = async () => {
    setBusy(true); setFehler("");
    try {
      // U6: nur Geändertes speichern – bloßes Umbenennen schaltet weder Kalender noch Erinnerungen still ein.
      const gleich = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
      await updateLocalScheduleTermin(vaultHandle, record.id, nurErinnerung ? { title: titel, dueAt: datum, dueTime: zeit || null } : {
        title: titel, dueAt: datum, dueTime: zeit || null,
        ...(gleich(wahl, anfang.wahl) ? {} : { erinnerungen: wahl }),
        ...(gleich(kal, anfang.kal) ? {} : { kalenderWahl: kal }),
        ...(kalenderGetippt && imKalender !== anfang.imKalender ? { kalenderEintragen: imKalender } : {}),
      });
      await onGespeichert(`Gespeichert: ${titel.trim()} – ${new Date(`${datum}T00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}${zeit ? `, ${zeit} Uhr` : ""}.`);
      onZu();
    } catch (g) { setFehler(g instanceof Error ? g.message : String(g)); }
    finally { setBusy(false); }
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onZu(); }}>
    <section className="modal termin-bearbeiten" role="dialog" aria-modal="true" aria-labelledby="termin-bearbeiten-titel" data-termin-bearbeiten>
      <div className="modal-head"><div><span className="eyebrow dark">{record.recordType === "deadline" ? "Frist" : nurErinnerung ? "Erinnerung" : "Aufgabe"}</span><h2 id="termin-bearbeiten-titel">{nurErinnerung ? "🔔 Erinnerung ändern" : "🔔 Termin und Erinnerung"}</h2></div><button type="button" className="icon-button" onClick={onZu} aria-label="Schließen" disabled={busy}><X size={18}/></button></div>
      <div className="memory-erinnern-felder">
        <label className="memory-erinnern-titel"><span>Woran erinnern</span><VoiceInput value={titel} onValueChange={setTitel} speechLabel="Titel" data-tb-titel/></label>
        <label><span>Tag</span><DatumFeld value={datum} required onChange={(e) => tagSetzen(e.target.value)} data-tb-tag/></label>
        <label><span>Uhrzeit</span><DatumFeld art="time" value={zeit} onChange={(e) => setZeit(e.target.value)} data-tb-uhr/></label>
        {!nurErinnerung && <><button type="button" className={`memory-erinnern-kalender kalender-ampel ${kalender && imKalender ? "gruen" : "rot"}`} onClick={() => { if (!kalender) { onZu(); window.dispatchEvent(new Event(KALENDER_OEFFNEN)); } else { setKalenderGetippt(true); setImKalender((x) => !x); } }} data-tb-kalender={kalender ? (imKalender ? "an" : "aus") : "keiner"}>
          {kalender && imKalender ? <CalendarCheck size={18}/> : <CalendarX size={18}/>}<span><strong>{!kalender ? "Kein Kalender verbunden" : imKalender ? "In den Kalender" : "Nicht in den Kalender"}</strong><small>{!kalender ? "tippen zum Verbinden" : imKalender ? `${kalenderZiel(kalender)} – tippen zum Abwählen` : "tippen, um einzutragen"}</small></span>
        </button>
        {kalender && imKalender && <KalenderAuswahl einst={kalender} wert={kal} onChange={setKal}/>}
        <ErinnerungsChips wert={wahl} onChange={setWahl} schnell={[...KURZ_ERINNERUNGEN, "1d", "7d"]} name="Erinnern"/></>}
      </div>
      {fehler && <p className="form-error" role="alert">{fehler}</p>}
      <div className="modal-actions"><ErinnerungLoeschen id={record.id} titel={titel || d.title} vaultHandle={vaultHandle} mitText onGeloescht={async (t) => { await onGespeichert(t); onZu(); }}/><button type="button" className="button secondary" onClick={onZu} disabled={busy}>Abbrechen</button><button type="button" className="button primary" onClick={() => void speichern()} disabled={busy || !titel.trim() || !datum} data-tb-speichern>{busy ? "Wird gespeichert …" : "✓ Speichern"}</button></div>
    </section>
  </div>;
}
