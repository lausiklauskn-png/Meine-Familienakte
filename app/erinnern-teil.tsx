import { BellRing, CalendarCheck, CalendarX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ErinnerungsVorschlag } from "../lib/family-memory";
import { KURZ_ERINNERUNGEN, type ErinnerungsWahl } from "../lib/kalender";
import { DatumFeld } from "./datum-feld";
import { ErinnerungsChips, KalenderAuswahl, kalenderZiel, useKalenderEinst, type KalenderWahl } from "./kalender-karte";

/** Was „Erinnern lassen“ beim Speichern übergibt: eine Aufgabe mit Termin, auf Wunsch im Kalender. */
export type ErinnernWert = { titel: string; dueAt: string; dueTime?: string; erinnerungen: ErinnerungsWahl[]; kalenderEintragen: boolean; kalenderWahl?: KalenderWahl | null };

const heuteIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const wahlFuer = (zeit: string | null | undefined): ErinnerungsWahl[] => zeit ? ["15m", "0m"] : ["0m"];

/**
 * „Erinnern lassen“ (Klaus 2026-11-05): gut sichtbar, damit eine Notiz nicht nur in der Akte liegt. Tag und Uhrzeit kommen
 * aus dem Text („heute um 20 Uhr“, „morgen“, „in 5 Stunden“), solange man sie nicht selbst ändert; von Hand geht immer.
 * Gibt den Wert nach oben oder null, wenn nicht erinnert werden soll.
 */
/** Öffnet „Kalender verbinden“ auf der Seite Fristen und Aufgaben (HealthPortal hört darauf). */
export const KALENDER_OEFFNEN = "familienakte:kalender-oeffnen";

export function ErinnernTeil({ erkannt, titelVorschlag, onChange, onKalender }: { erkannt: ErinnerungsVorschlag | null; titelVorschlag: string; onChange: (w: ErinnernWert | null) => void; onKalender?: () => void }) {
  const kalender = useKalenderEinst();
  const [an, setAn] = useState(Boolean(erkannt?.wunsch));
  const [titel, setTitel] = useState("");
  const [datum, setDatum] = useState(erkannt?.dueAt || heuteIso());
  const [zeit, setZeit] = useState(erkannt?.dueTime || "");
  const [wahl, setWahl] = useState<ErinnerungsWahl[]>(wahlFuer(erkannt?.dueTime));
  const [kalWahl, setKalWahl] = useState<KalenderWahl | null>(null);
  const vonHand = useRef({ an: false, datum: false, zeit: false, wahl: false });

  // Neuer Text, neue Erkennung: nur übernehmen, was noch nicht von Hand gesetzt ist.
  const schluessel = erkannt ? `${erkannt.wunsch}|${erkannt.dueAt}|${erkannt.dueTime}` : "";
  useEffect(() => {
    if (!vonHand.current.an) setAn(Boolean(erkannt?.wunsch)); // nur von selbst an, solange der Text es verlangt
    if (!erkannt) return;
    if (!vonHand.current.datum) setDatum(erkannt.dueAt);
    if (!vonHand.current.zeit) setZeit(erkannt.dueTime || "");
    if (!vonHand.current.wahl) setWahl(wahlFuer(erkannt.dueTime));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schluessel]);

  const wert: ErinnernWert | null = an && datum ? { titel: titel.trim() || titelVorschlag, dueAt: datum, dueTime: zeit || undefined, erinnerungen: wahl, kalenderEintragen: true, kalenderWahl: kalWahl } : null; // Klaus 2026-11-05: wohin sonst? Ohne Kalender bleibt es eine Aufgabe und geht später hinein
  const wertSchluessel = JSON.stringify(wert);
  useEffect(() => { onChange(wert); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [wertSchluessel]);

  return <section className={`memory-erinnern${an ? " an" : ""}`} data-memory-erinnern>
    <label className="check-row"><input type="checkbox" checked={an} onChange={(e) => { vonHand.current.an = true; setAn(e.target.checked); }} data-memory-erinnern-haken/><span><strong><BellRing size={16}/> Erinnern lassen</strong><small>{erkannt?.wunsch ? "Aus dem Text erkannt – bitte prüfen." : "Als Aufgabe mit Termin, auf Wunsch im Kalender."}</small></span></label>
    {an && <div className="memory-erinnern-felder">
      <label className="memory-erinnern-titel"><span>Woran erinnern</span><input value={titel} placeholder={titelVorschlag} onChange={(e) => setTitel(e.target.value)} data-memory-erinnern-titel/></label>
      <label><span>Tag</span><DatumFeld value={datum} required onChange={(e) => { vonHand.current.datum = true; setDatum(e.target.value); }} data-memory-erinnern-datum/></label>
      <label><span>Uhrzeit</span><DatumFeld art="time" value={zeit} onChange={(e) => { vonHand.current.zeit = true; setZeit(e.target.value); }} data-memory-erinnern-zeit/></label>
      {/* Ein Knopf statt Haken (Klaus 2026-11-05): grün = verbunden, rot = keiner; Tipp öffnet die Kalender-Einstellung. */}
      <button type="button" className={`memory-erinnern-kalender kalender-ampel ${kalender ? "gruen" : "rot"}`} onClick={() => { if (onKalender) onKalender(); else window.dispatchEvent(new Event(KALENDER_OEFFNEN)); }} title="Kalender einstellen" data-memory-erinnern-kalender={kalender ? "verbunden" : "keiner"}>
        {kalender ? <CalendarCheck size={18}/> : <CalendarX size={18}/>}<span><strong>{kalender ? "In den Kalender" : "Kein Kalender verbunden"}</strong><small>{kalender ? (kalWahl?.name ? `${kalenderZiel({ ...kalender, kalenderName: kalWahl.name })}` : kalenderZiel(kalender)) : "tippen zum Verbinden"}</small></span><span className="kalender-ampel-pfeil" aria-hidden="true">›</span>
      </button>
      <KalenderAuswahl einst={kalender} wert={kalWahl} onChange={setKalWahl}/>
      {<ErinnerungsChips wert={wahl} onChange={(w) => { vonHand.current.wahl = true; setWahl(w); }} schnell={[...KURZ_ERINNERUNGEN, "1d"]} name="Erinnern"/>}
    </div>}
  </section>;
}
