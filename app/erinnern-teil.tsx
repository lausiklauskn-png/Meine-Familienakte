import { BellRing } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ErinnerungsVorschlag } from "../lib/family-memory";
import { KURZ_ERINNERUNGEN, type ErinnerungsWahl } from "../lib/kalender";
import { DatumFeld } from "./datum-feld";
import { ErinnerungsChips, kalenderZiel, useKalenderEinst } from "./kalender-karte";

/** Was „Erinnern lassen“ beim Speichern übergibt: eine Aufgabe mit Termin, auf Wunsch im Kalender. */
export type ErinnernWert = { titel: string; dueAt: string; dueTime?: string; erinnerungen: ErinnerungsWahl[]; kalenderEintragen: boolean };

const heuteIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const wahlFuer = (zeit: string | null | undefined): ErinnerungsWahl[] => zeit ? ["15m", "0m"] : ["0m"];

/**
 * „Erinnern lassen“ (Klaus 2026-11-05): gut sichtbar, damit eine Notiz nicht nur in der Akte liegt. Tag und Uhrzeit kommen
 * aus dem Text („heute um 20 Uhr“, „morgen“, „in 5 Stunden“), solange man sie nicht selbst ändert; von Hand geht immer.
 * Gibt den Wert nach oben oder null, wenn nicht erinnert werden soll.
 */
export function ErinnernTeil({ erkannt, titelVorschlag, onChange }: { erkannt: ErinnerungsVorschlag | null; titelVorschlag: string; onChange: (w: ErinnernWert | null) => void }) {
  const kalender = useKalenderEinst();
  const [an, setAn] = useState(Boolean(erkannt?.wunsch));
  const [titel, setTitel] = useState("");
  const [datum, setDatum] = useState(erkannt?.dueAt || heuteIso());
  const [zeit, setZeit] = useState(erkannt?.dueTime || "");
  const [inKalender, setInKalender] = useState(Boolean(kalender));
  const [wahl, setWahl] = useState<ErinnerungsWahl[]>(wahlFuer(erkannt?.dueTime));
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
  useEffect(() => { if (kalender) setInKalender(true); }, [Boolean(kalender)]);

  const wert: ErinnernWert | null = an && datum ? { titel: titel.trim() || titelVorschlag, dueAt: datum, dueTime: zeit || undefined, erinnerungen: wahl, kalenderEintragen: inKalender } : null;
  const wertSchluessel = JSON.stringify(wert);
  useEffect(() => { onChange(wert); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [wertSchluessel]);

  return <section className={`memory-erinnern${an ? " an" : ""}`} data-memory-erinnern>
    <label className="check-row"><input type="checkbox" checked={an} onChange={(e) => { vonHand.current.an = true; setAn(e.target.checked); }} data-memory-erinnern-haken/><span><strong><BellRing size={16}/> Erinnern lassen</strong><small>{erkannt?.wunsch ? "Aus dem Text erkannt – bitte prüfen." : "Als Aufgabe mit Termin, auf Wunsch im Kalender."}</small></span></label>
    {an && <div className="memory-erinnern-felder">
      <label className="memory-erinnern-titel"><span>Woran erinnern</span><input value={titel} placeholder={titelVorschlag} onChange={(e) => setTitel(e.target.value)} data-memory-erinnern-titel/></label>
      <label><span>Tag</span><DatumFeld value={datum} required onChange={(e) => { vonHand.current.datum = true; setDatum(e.target.value); }} data-memory-erinnern-datum/></label>
      <label><span>Uhrzeit</span><DatumFeld art="time" value={zeit} onChange={(e) => { vonHand.current.zeit = true; setZeit(e.target.value); }} data-memory-erinnern-zeit/></label>
      <label className="check-row memory-erinnern-kalender"><input type="checkbox" checked={inKalender} onChange={(e) => setInKalender(e.target.checked)} data-memory-erinnern-kalender/><span><strong>In den Kalender eintragen</strong><small>{kalender ? kalenderZiel(kalender) : "Kein Kalender verbunden – unter Fristen und Aufgaben verbinden"}</small></span></label>
      {inKalender && <ErinnerungsChips wert={wahl} onChange={(w) => { vonHand.current.wahl = true; setWahl(w); }} schnell={[...KURZ_ERINNERUNGEN, "1d"]} name="Erinnern"/>}
    </div>}
  </section>;
}
