/** Stufe B (Plan 08.11.2026): Fenster rund um die verschlüsselte Vollsicherung.
 *  - SicherungAnlegenDialog: verschlüsselt (empfohlen) oder lesbar, Passwort ≥ 10 Zeichen zweimal.
 *  - NotfallblattDialog: Notfallschlüssel zum Drucken, Speichern oder Kopieren; schließt erst nach Bestätigung.
 *  - SicherungPasswortDialog: Passwort oder Notfallschlüssel zum Einlesen einer verschlüsselten Sicherung.
 *  - PapierkorbLeerenDialog: aussortierte Dokumente endgültig löschen, nur nach zwei Bestätigungen.
 *  - SicherungErinnerung: „lange nicht gesichert“ nach 7 Tagen (Entscheidung 7). */
import { useState } from "react";
import { Copy, Download, Printer, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { PASSWORT_MINDESTLAENGE, notfallblattText, passwortPruefen } from "../lib/sicherung-krypto";
import { dateiAusgeben } from "./dateiausgabe";

export const SICHERUNG_ERINNERUNG_TAGE = 7;

export function SicherungAnlegenDialog({ onStart, onClose }: { onStart: (passwort: string | null) => void; onClose: () => void }) {
  const [art, setArt] = useState<"verschluesselt" | "lesbar">("verschluesselt");
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [zeigen, setZeigen] = useState(false); const [fehler, setFehler] = useState("");
  const los = () => {
    if (art === "lesbar") { onStart(null); return; }
    const f = passwortPruefen(pw); if (f) { setFehler(f); return; }
    if (pw !== pw2) { setFehler("Die beiden Eingaben stimmen nicht überein."); return; }
    onStart(pw);
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="sicherung-anlegen-titel" data-sicherung-anlegen>
      <div className="modal-head"><div><span className="badge">Vollsicherung</span><h2 id="sicherung-anlegen-titel">Wie soll gesichert werden?</h2></div><button className="icon-button" onClick={onClose} aria-label="Fenster schließen"><X/></button></div>
      <div className="sicherung-arten">
        <label className={`sicherung-art${art === "verschluesselt" ? " gewaehlt" : ""}`} data-sicherung-art="verschluesselt"><input type="radio" name="sicherung-art" checked={art === "verschluesselt"} onChange={() => setArt("verschluesselt")}/><ShieldCheck size={20}/><span><strong>Verschlüsselt (empfohlen)</strong><small>Nur mit Passwort oder Notfallblatt lesbar. Richtig für Festplatten, die mitgenommen werden.</small></span></label>
        <label className={`sicherung-art${art === "lesbar" ? " gewaehlt" : ""}`} data-sicherung-art="lesbar"><input type="radio" name="sicherung-art" checked={art === "lesbar"} onChange={() => setArt("lesbar")}/><TriangleAlert size={20}/><span><strong>Lesbar</strong><small>Jeder, der den Ordner hat, kann alle Unterlagen öffnen – auch ohne die App.</small></span></label>
      </div>
      {art === "verschluesselt" ? <div className="form-grid" data-sicherung-passwort>
        <label>Passwort (mindestens {PASSWORT_MINDESTLAENGE} Zeichen)<input type={zeigen ? "text" : "password"} value={pw} autoComplete="new-password" onChange={(e) => { setPw(e.target.value); setFehler(""); }} data-passwort/></label>
        <label>Passwort wiederholen<input type={zeigen ? "text" : "password"} value={pw2} autoComplete="new-password" onChange={(e) => { setPw2(e.target.value); setFehler(""); }} data-passwort-wieder/></label>
        <label className="checkbox-row"><input type="checkbox" checked={zeigen} onChange={(e) => setZeigen(e.target.checked)}/> Passwort anzeigen</label>
        <p className="fine-print">Das Passwort wird nirgends gespeichert. Danach bekommst du ein <strong>Notfallblatt</strong> mit einem Schlüssel, der die Sicherung auch ohne Passwort öffnet – ausdrucken und zu den Papieren legen.</p>
      </div> : <p className="sync-message warning" data-sicherung-lesbar-hinweis><strong>Lesbar heißt: ohne Schutz.</strong> Wer diesen Ordner findet, liest alle Dokumente. Nur sinnvoll für einen Speicher, der zu Hause bleibt.</p>}
      {fehler && <p className="form-error" data-sicherung-fehler>{fehler}</p>}
      <div className="modal-actions"><button className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary" data-sicherung-los onClick={los}>{art === "verschluesselt" ? "Verschlüsselt sichern" : "Lesbar sichern"}</button></div>
    </div>
  </div>;
}

/** Druckt nur das Blatt: ein Element am Ende von body, der Rest ist per CSS (.druck-notfallblatt) ausgeblendet. */
function blattDrucken(text: string, drucken: () => void) {
  const el = document.createElement("pre"); el.className = "notfallblatt-druck"; el.textContent = text;
  document.body.appendChild(el); document.body.classList.add("druck-notfallblatt");
  const aufraeumen = () => { document.body.classList.remove("druck-notfallblatt"); el.remove(); window.removeEventListener("afterprint", aufraeumen); };
  window.addEventListener("afterprint", aufraeumen);
  try { drucken(); } finally { setTimeout(aufraeumen, 60000); }
}

export function NotfallblattDialog({ notfall, ordner, erstellt, appVersion, onDrucken, onClose }: { notfall: string; ordner: string; erstellt: string; appVersion: string; onDrucken: () => void; onClose: () => void }) {
  const [bestaetigt, setBestaetigt] = useState(false); const [meldung, setMeldung] = useState("");
  const text = notfallblattText({ notfall, ordner, createdAt: erstellt, appVersion });
  const speichern = async () => {
    const r = await dateiAusgeben(new File([text], `Notfallblatt_${ordner}.txt`, { type: "text/plain" })).catch((e) => { setMeldung(e instanceof Error ? e.message : "Speichern nicht möglich."); return null; });
    if (r === "gespeichert") setMeldung("Notfallblatt gespeichert. Bitte nicht auf dieselbe Festplatte wie die Sicherung."); else if (r === "download-gestartet") setMeldung("Download gestartet.");
  };
  const kopieren = async () => { try { await navigator.clipboard.writeText(notfall); setMeldung("Notfallschlüssel kopiert."); } catch { setMeldung("Kopieren nicht möglich – bitte abschreiben."); } };
  return <div className="modal-backdrop" role="presentation">
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="notfallblatt-titel" data-notfallblatt>
      <div className="modal-head"><div><span className="badge success">Sicherung fertig</span><h2 id="notfallblatt-titel">Notfallblatt</h2></div></div>
      <p>Die Sicherung <strong>{ordner}</strong> ist verschlüsselt. Dieser Schlüssel öffnet sie auch, wenn das Passwort vergessen ist. <strong>Er wird nur jetzt angezeigt.</strong></p>
      <p className="notfall-schluessel" data-notfall-schluessel>{notfall}</p>
      <div className="button-row">
        <button className="button secondary" onClick={() => blattDrucken(text, onDrucken)} data-notfall-drucken><Printer size={16}/> Drucken</button>
        <button className="button secondary" onClick={() => void speichern()} data-notfall-speichern><Download size={16}/> Als Datei speichern</button>
        <button className="button secondary" onClick={() => void kopieren()} data-notfall-kopieren><Copy size={16}/> Kopieren</button>
      </div>
      {meldung && <p className="notiz-gespeichert" role="status">{meldung}</p>}
      <p className="fine-print">Blatt ausdrucken und zu den wichtigen Papieren legen – nicht zur Sicherung auf dieselbe Festplatte. Wer Blatt oder Passwort hat, kann die Sicherung lesen. Ohne beides sind die Daten unlesbar.</p>
      <label className="checkbox-row" data-notfall-bestaetigung><input type="checkbox" checked={bestaetigt} onChange={(e) => setBestaetigt(e.target.checked)}/> Ich habe das Notfallblatt gedruckt, gespeichert oder abgeschrieben.</label>
      <div className="modal-actions"><button className="button primary" disabled={!bestaetigt} onClick={onClose} data-notfall-fertig>Fertig</button></div>
    </div>
  </div>;
}

export function SicherungPasswortDialog({ ordner, fehler, laeuft, onZugang, onClose }: { ordner: string; fehler: string; laeuft: boolean; onZugang: (zugang: { passwort?: string; notfall?: string }) => void; onClose: () => void }) {
  const [weg, setWeg] = useState<"passwort" | "notfall">("passwort"); const [wert, setWert] = useState(""); const [zeigen, setZeigen] = useState(false);
  const los = () => { if (!wert.trim()) return; onZugang(weg === "passwort" ? { passwort: wert } : { notfall: wert }); };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !laeuft && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="sicherung-passwort-titel" data-sicherung-passwort-dialog>
      <div className="modal-head"><div><span className="badge">Verschlüsselte Sicherung</span><h2 id="sicherung-passwort-titel">{weg === "passwort" ? "Passwort eingeben" : "Notfallschlüssel eingeben"}</h2></div><button className="icon-button" onClick={onClose} disabled={laeuft} aria-label="Fenster schließen"><X/></button></div>
      <p><strong>{ordner}</strong> ist verschlüsselt. Es wird nichts geschrieben; danach kommt die Probe.</p>
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); los(); }}>
        <label>{weg === "passwort" ? "Passwort" : "Notfallschlüssel vom Notfallblatt (52 Zeichen, Bindestriche egal)"}<input type={zeigen || weg === "notfall" ? "text" : "password"} value={wert} autoComplete="off" autoFocus onChange={(e) => setWert(e.target.value)} data-zugang-wert/></label>
        {weg === "passwort" && <label className="checkbox-row"><input type="checkbox" checked={zeigen} onChange={(e) => setZeigen(e.target.checked)}/> Passwort anzeigen</label>}
        {fehler && <p className="form-error" data-zugang-fehler>{fehler}</p>}
        <div className="modal-actions">
          <button type="button" className="text-link" onClick={() => { setWeg(weg === "passwort" ? "notfall" : "passwort"); setWert(""); }} data-zugang-wechsel>{weg === "passwort" ? "Passwort vergessen? Notfallschlüssel eingeben" : "Doch mit Passwort"}</button>
          <button type="button" className="button secondary" onClick={onClose} disabled={laeuft}>Abbrechen</button>
          <button type="submit" className="button primary" disabled={laeuft || !wert.trim()} data-zugang-los>{laeuft ? "Wird geprüft …" : "Öffnen und prüfen"}</button>
        </div>
      </form>
    </div>
  </div>;
}

export function PapierkorbLeerenDialog({ anzahl, onLoeschen, onClose }: { anzahl: number; onLoeschen: () => Promise<void>; onClose: () => void }) {
  const [sicher, setSicher] = useState(false); const [laeuft, setLaeuft] = useState(false); const [fehler, setFehler] = useState("");
  const los = async () => { setLaeuft(true); setFehler(""); try { await onLoeschen(); } catch (e) { setFehler(e instanceof Error ? e.message : "Löschen nicht möglich."); setLaeuft(false); } };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !laeuft && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="papierkorb-titel" data-papierkorb-leeren>
      <div className="modal-head"><div><span className="badge danger">Endgültig</span><h2 id="papierkorb-titel">{anzahl === 1 ? "Ein aussortiertes Dokument" : `${anzahl} aussortierte Dokumente`} endgültig löschen?</h2></div><button className="icon-button" onClick={onClose} disabled={laeuft} aria-label="Fenster schließen"><X/></button></div>
      <ul className="fine-print">
        <li>Die Einträge verschwinden aus der Akte, die Dateien werden vom Speicher entfernt.</li>
        <li>Das lässt sich nicht rückgängig machen. Zurückholen geht danach nur aus einer Sicherung.</li>
        <li>Dateien im Pro-Tresor bleiben dort liegen; der Eintrag wird trotzdem entfernt.</li>
      </ul>
      <label className="checkbox-row" data-papierkorb-sicher><input type="checkbox" checked={sicher} onChange={(e) => setSicher(e.target.checked)}/> Ja, endgültig löschen.</label>
      {fehler && <p className="form-error">{fehler}</p>}
      <div className="modal-actions"><button className="button secondary" onClick={onClose} disabled={laeuft}>Abbrechen</button><button className="button primary gefahr" disabled={!sicher || laeuft} onClick={() => void los()} data-papierkorb-los>{laeuft ? "Wird gelöscht …" : "Endgültig löschen"}</button></div>
    </div>
  </div>;
}

/** Tage seit der letzten Vollsicherung; null = nie gesichert. */
export function tageSeitSicherung(letzte: string | null | undefined, jetzt = Date.now()) {
  if (!letzte) return null;
  const t = new Date(letzte).getTime(); if (Number.isNaN(t)) return null;
  return Math.floor((jetzt - t) / 86400000);
}
export function sicherungFaellig(letzte: string | null | undefined, hatDaten: boolean, jetzt = Date.now()) {
  if (!hatDaten) return false;
  const tage = tageSeitSicherung(letzte, jetzt);
  return tage === null || tage >= SICHERUNG_ERINNERUNG_TAGE;
}

export function SicherungErinnerung({ letzte, hatDaten, onSichern, kompakt = false }: { letzte: string | null | undefined; hatDaten: boolean; onSichern: () => void; kompakt?: boolean }) {
  if (!sicherungFaellig(letzte, hatDaten)) return null;
  const tage = tageSeitSicherung(letzte);
  const text = tage === null ? "Deine Akte wurde noch nie vollständig gesichert." : `Die letzte Vollsicherung ist ${tage} Tage her.`;
  return <section className={`sync-message warning sicherung-erinnerung${kompakt ? " kompakt" : ""}`} role="status" data-sicherung-erinnerung={tage === null ? "nie" : String(tage)}>
    <TriangleAlert size={18}/><span><strong>{text}</strong> Eine Sicherung auf eine Festplatte oder SD-Karte schützt vor Verlust des Geräts.</span>
    <button type="button" className="button secondary" onClick={onSichern} data-sicherung-erinnerung-los>Jetzt sichern ›</button>
  </section>;
}
