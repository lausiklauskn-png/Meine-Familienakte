// Kasten „Anschrift und Kontakt“ in der Detailansicht einer Person (Klaus 2026-10-31, Frage 3 aus Sitzung F: „Ja, speichern“).
// Zu, bis man ihn öffnet; gespeichert wird erst auf „Speichern“. Die Angaben nutzt das Vorbelegen beim Ausfüllen.
import { useEffect, useState } from "react";
import { KONTAKT_BESCHRIFTUNG, KONTAKT_FELDER, kontaktPruefen, type PersonKontakt } from "../lib/person-kontakt";

export function PersonKontaktKasten({ daten, onSpeichern }: { daten: Record<string, unknown>; onSpeichern: (kontakt: PersonKontakt) => Promise<boolean> }) {
  const aus = () => Object.fromEntries(KONTAKT_FELDER.map((k) => [k, String(daten[k] ?? "")])) as PersonKontakt;
  const [werte, setWerte] = useState<PersonKontakt>(aus);
  const [fehler, setFehler] = useState<string[]>([]);
  const [arbeit, setArbeit] = useState(false);
  useEffect(() => { setWerte(aus()); setFehler([]); }, [KONTAKT_FELDER.map((k) => String(daten[k] ?? "")).join("|")]);
  const vorhanden = KONTAKT_FELDER.filter((k) => String(daten[k] ?? "").trim()).length;
  const speichern = async () => {
    const p = kontaktPruefen(werte); setFehler(p.fehler); if (p.fehler.length) return;
    setArbeit(true); try { await onSpeichern(p.kontakt); } finally { setArbeit(false); }
  };
  return <details className="person-kontakt" data-person-kontakt>
    <summary>Anschrift und Kontakt{vorhanden ? ` (${vorhanden} Angaben)` : ""}</summary>
    <p className="person-kontakt-hinweis">Wird beim Ausfüllen eines Formulars als Vorschlag eingesetzt. Bleibt in der Akte auf diesem Gerät.</p>
    <div className="person-kontakt-felder">{KONTAKT_FELDER.map((k) => <label key={k}><span>{KONTAKT_BESCHRIFTUNG[k]}</span>
      <input type={k === "email" ? "email" : k === "phone" ? "tel" : "text"} value={werte[k] || ""} autoComplete="off" data-kontakt={k}
        onChange={(e) => setWerte({ ...werte, [k]: e.target.value })}/></label>)}</div>
    {fehler.length > 0 && <p className="person-kontakt-fehler" role="alert">{fehler.join(" ")}</p>}
    <button className="button primary" disabled={arbeit} onClick={() => void speichern()} data-kontakt-speichern>{arbeit ? "Wird gespeichert …" : "Speichern"}</button>
  </details>;
}
