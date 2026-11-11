/** 2.28.65 (E-Mail-Plan E2/E3, e1–e5): Versand aus der Korrespondenzzentrale – erst nach dem Haken „geprüft“.
 *  Anlagen aus dem Vorgang einzeln abwählbar, Hinweis bei Gesundheitswort im Betreff (nur Hinweis), Ansage über 20 MB.
 *  Mail-App: danach die Frage „abgeschickt?“ (e1). Microsoft: Bestätigungsfenster mit Empfänger und Anlagen. */
import { useEffect, useState } from "react";
import { Mail, Send, X } from "lucide-react";
import { adressen, anlagenPruefen, gesundheitswort } from "../lib/mail-wege";
import { inMailAppOeffnen, mailWahl, microsoftMailSenden } from "./mail-wege";
import { microsoftMailAngemeldet, microsoftMailAnmelden } from "./kalender-anbieter";

type Notice = { kind: "success" | "error" | "info"; text: string } | null;
/** Zwei Teile: `vorher` (Anlagen, Hinweise) steht über dem Prüf-Haken, `nachher` (Senden, Rückfrage) darunter. */
export function useMailVersand({ an, betreff, text, dokumente, bestaetigt, onDateiLaden, onGesendet, onNotice }: {
  an: string; betreff: string; text: string; dokumente: Array<{ id: string; title: string }>; bestaetigt: boolean;
  onDateiLaden?: (id: string) => Promise<File>; onGesendet: () => Promise<void>; onNotice: (n: Notice) => void;
}) {
  const [weg, setWeg] = useState(mailWahl().versand);
  useEffect(() => { const f = () => setWeg(mailWahl().versand); window.addEventListener("familienakte:mail-wahl", f); return () => window.removeEventListener("familienakte:mail-wahl", f); }, []);
  const [aus, setAus] = useState<Set<string>>(new Set());
  const [groessen, setGroessen] = useState<Record<string, number>>({});
  const [frage, setFrage] = useState(false);
  const [bestaetigen, setBestaetigen] = useState<File[] | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const gewaehlt = dokumente.filter((d) => !aus.has(d.id));
  useEffect(() => { let lebt = true; if (!onDateiLaden) return; void (async () => { const g: Record<string, number> = {}; for (const d of dokumente) { try { g[d.id] = (await onDateiLaden(d.id)).size; } catch { /* unten gemeldet */ } } if (lebt) setGroessen(g); })(); return () => { lebt = false; }; }, [dokumente.map((d) => d.id).join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  const wort = gesundheitswort(betreff);
  const pruefung = anlagenPruefen(gewaehlt.map((d) => groessen[d.id] || 0), weg);
  const empfaenger = adressen(an);
  const laden = async () => { if (!onDateiLaden) return []; const out: File[] = []; for (const d of gewaehlt) out.push(await onDateiLaden(d.id)); return out; };
  const los = async () => {
    if (!empfaenger) { onNotice({ kind: "info", text: "Bitte als Empfänger eine E-Mail-Adresse eintragen (mehrere mit Komma)." }); return; }
    if (!pruefung.ok) { onNotice({ kind: "info", text: pruefung.satz }); return; }
    setLaeuft(true);
    try {
      const anlagen = await laden();
      if (weg === "microsoft") { if (!microsoftMailAngemeldet()) await microsoftMailAnmelden(); setBestaetigen(anlagen); return; }
      const r = await inMailAppOeffnen({ an: empfaenger.join(", "), betreff, text, anlagen });
      if (r === "abgebrochen") return;
      if (r === "kopiert") onNotice({ kind: "info", text: "Auf diesem Gerät nimmt die Mail-App keine Anlagen an: Text ist kopiert, die Anlagen sind gespeichert, die Mail-App öffnet sich ohne Anlagen." });
      setFrage(true);
    } catch (e) { onNotice({ kind: "error", text: e instanceof Error ? e.message : "Die Mail-App konnte nicht geöffnet werden." }); }
    finally { setLaeuft(false); }
  };
  const senden = async () => {
    if (!bestaetigen || !empfaenger) return;
    setLaeuft(true);
    try { await microsoftMailSenden({ an: empfaenger, betreff, text, anlagen: bestaetigen }); setBestaetigen(null); await onGesendet(); onNotice({ kind: "success", text: "Über Microsoft gesendet. Die Mail liegt in „Gesendete Elemente“ und ist als versendet gespeichert." }); }
    catch (e) { setBestaetigen(null); onNotice({ kind: "error", text: e instanceof Error ? e.message : "Nicht gesendet." }); }
    finally { setLaeuft(false); }
  };
  const vorher = <div className="mail-versand" data-mail-versand>
    {dokumente.length > 0 && <fieldset className="mail-anlagen" data-mail-anlagen><legend>Anlagen aus dem Vorgang</legend>{dokumente.map((d) => <label key={d.id} className="checkbox-row"><input type="checkbox" checked={!aus.has(d.id)} onChange={(e) => { const s = new Set(aus); if (e.target.checked) s.delete(d.id); else s.add(d.id); setAus(s); }}/> {d.title}{groessen[d.id] ? ` · ${(groessen[d.id] / 1048576).toFixed(1).replace(".", ",")} MB` : ""}</label>)}</fieldset>}
    {wort && <p className="sync-message warning" data-mail-gesundheit>Im Betreff steht ein Gesundheitswort („{wort}“). E-Mails sind unterwegs nicht Ende-zu-Ende verschlüsselt – Betreff neutral halten? Du entscheidest.</p>}
    {!pruefung.ok && <p className="sync-message warning" data-mail-zu-gross>{pruefung.satz}</p>}
  </div>;
  const nachher = <div className="mail-versand" data-mail-versand-knopf>
    <div className="button-row"><button className="button primary" disabled={!bestaetigt || laeuft} onClick={() => void los()} data-mail-senden>{weg === "microsoft" ? <><Mail size={17}/> Über Microsoft senden …</> : <><Send size={17}/> In der Mail-App öffnen</>}</button></div>
    {frage && <div className="sync-message info" role="status" data-mail-frage><strong>Hast du die E-Mail in der Mail-App abgeschickt?</strong>
      <div className="button-row"><button className="button primary" onClick={() => { setFrage(false); void onGesendet(); }} data-mail-frage-ja>Ja, als versendet speichern</button><button className="button secondary" onClick={() => setFrage(false)} data-mail-frage-nein>Nein, Entwurf bleibt</button></div></div>}
    {bestaetigen && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setBestaetigen(null)}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="mail-senden-titel" data-mail-bestaetigen>
        <div className="modal-head"><div><span className="badge">Microsoft</span><h2 id="mail-senden-titel">Jetzt über Microsoft senden?</h2></div><button className="icon-button" onClick={() => setBestaetigen(null)} aria-label="Fenster schließen"><X/></button></div>
        <dl className="mail-bestaetigen"><dt>An</dt><dd>{empfaenger?.join(", ")}</dd><dt>Betreff</dt><dd>{betreff}</dd><dt>Anlagen</dt><dd>{bestaetigen.length ? bestaetigen.map((f) => f.name).join(", ") : "keine"}</dd></dl>
        <div className="modal-actions"><button className="button secondary" onClick={() => setBestaetigen(null)}>Zurück</button><button className="button primary" disabled={laeuft} onClick={() => void senden()} data-mail-jetzt-senden>{laeuft ? "Sendet …" : "Jetzt senden"}</button></div>
      </div>
    </div>}
  </div>;
  return { vorher, nachher };
}
