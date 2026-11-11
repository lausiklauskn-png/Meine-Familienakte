/** 2.28.65: Kasten „E-Mail“ in der Eingangszentrale – zwei Blöcke je Entscheidung: Wie kommen Mails herein? Wie gehen sie hinaus?
 *  Je Wahl ein getrenntes Feld, höchstens ein Hauptknopf, Erklärungen hinter dem „?“. */
import { useEffect, useRef, useState } from "react";
import { Brain, Inbox, Mail, Send, Share2, Wrench, X } from "lucide-react";
import { InfoPopover } from "./ui-controls";
import { mailWahl, mailWahlSetzen, microsoftMailAlsEml, microsoftMailsListen, proEingangAbholen, type MailKopf } from "./mail-wege";
import { microsoftMailAngemeldet, microsoftMailAnmelden } from "./kalender-anbieter";
import type { Empfang, MailWahl, Versand } from "../lib/mail-wege";
import { demoActive } from "../lib/demo-workspace";

type Notice = { kind: "success" | "error" | "info"; text: string; laeuft?: boolean } | null;
export const MAIL_HILFE = {
  rein: "Wie kommen Mails herein?\n• **Private Brain Pro (empfohlen):** dort einmal am Postfach anmelden. Bei einer geöffneten Mail „An Familienakte teilen“ – die Mail mit allen Anhängen geht über den gemeinsamen Pro-Tresor (Fach „Eingang-Familienakte“) hierher. Ist der Haken gesetzt, holt die Familienakte sie von selbst ab.\n• **Teilen aus der Mail-App:** in jeder Mail-App „Teilen → Familienakte“ (auch .eml und .msg).\n• **Microsoft-Postfach:** Anmeldung wie beim Kalender; nur auf Tipp, die letzten 30 Tage, im Postfach wird nichts verändert. Microsoft muss die Rechte für die App freigeben – fehlt das noch, sagt es die App.\n• **Eigenes Mail-Programm:** geplant (Postfach direkt in der Familienakte).\n• Alles landet in der Eingangszentrale zum Prüfen; Anhänge lassen sich dort herauslösen.",
  raus: "Wie gehen Mails hinaus?\n• Schreiben entsteht in der Korrespondenzzentrale (Assistenz). Erst nach dem Haken „geprüft“ geht es weiter.\n• **Mail-App öffnen:** Empfänger, Betreff, Text und Anlagen werden übergeben; abschicken tust du dort. Danach fragt die App, ob du gesendet hast.\n• **Microsoft:** senden nach einem Bestätigungsfenster; die Mail liegt danach in „Gesendete Elemente“.\n• **Ist das verschlüsselt?** Nein. E-Mails sind unterwegs nicht Ende-zu-Ende verschlüsselt. Gesundheitswörter im Betreff meldet die App; ändern tust du.\n• Gmail senden folgt erst nach Googles Zustimmung; bis dahin über die Mail-App.",
};

function Wahl<T extends string>({ name, wert, optionen, onWahl }: { name: string; wert: T; optionen: Array<{ wert: T; titel: string; satz: string; icon: React.ReactNode; aus?: boolean }>; onWahl: (w: T) => void }) {
  return <div className="sicherung-arten wahl-felder" role="radiogroup">{optionen.map((o) =>
    <label key={o.wert} className={`sicherung-art${wert === o.wert ? " gewaehlt" : ""}${o.aus ? " wahl-aus" : ""}`} data-wahl={`${name}-${o.wert}`}>
      <input type="radio" name={name} checked={wert === o.wert} disabled={o.aus} onChange={() => onWahl(o.wert)}/>{o.icon}<span><strong>{o.titel}</strong><small>{o.satz}</small></span>
    </label>)}</div>;
}

/** Von selbst aus Private Brain abholen: beim Start, beim Zurückkehren, jede Minute – nur mit offenem Pro-Tresor. */
export function useMailBrainAuto(aktiv: boolean, onNotice: (n: Notice) => void) {
  const cb = useRef(onNotice); cb.current = onNotice;
  useEffect(() => {
    if (!aktiv || demoActive()) return;
    let lebt = true, laeuft = false;
    const lauf = async () => {
      if (!lebt || laeuft || document.visibilityState !== "visible") return;
      const w = mailWahl(); if (w.empfang !== "brain" || !w.brainAuto) return;
      laeuft = true;
      try { const r = await proEingangAbholen(); if (r.geholt && lebt) cb.current({ kind: "info", text: `${r.geholt} Übergabe${r.geholt === 1 ? "" : "n"} aus dem Pro-Tresor (z. B. Mails aus Private Brain) in die Eingangszentrale geholt.` }); }
      catch (e) { console.warn("Pro-Eingang", e); } finally { laeuft = false; }
    };
    const start = window.setTimeout(() => void lauf(), 8000);
    const takt = window.setInterval(() => void lauf(), 60000);
    const sichtbar = () => { if (document.visibilityState === "visible") void lauf(); };
    document.addEventListener("visibilitychange", sichtbar); window.addEventListener("familienakte:pro-tresor", sichtbar);
    return () => { lebt = false; window.clearTimeout(start); window.clearInterval(takt); document.removeEventListener("visibilitychange", sichtbar); window.removeEventListener("familienakte:pro-tresor", sichtbar); };
  }, [aktiv]);
}

export function EmailWegeKarte({ aktiv, onNotice, onDateien, onSchreiben }: { aktiv: boolean; onNotice: (n: Notice) => void; onDateien: (files: File[]) => Promise<boolean>; onSchreiben: () => void }) {
  const [w, setW] = useState<MailWahl>(mailWahl);
  const [laeuft, setLaeuft] = useState(false);
  const [liste, setListe] = useState<{ mails: MailKopf[]; gewaehlt: Set<string> } | null>(null);
  useEffect(() => { const f = () => setW(mailWahl()); window.addEventListener("familienakte:mail-wahl", f); return () => window.removeEventListener("familienakte:mail-wahl", f); }, []);
  if (demoActive()) return null;
  const setzen = (neu: Partial<MailWahl>) => { const x = { ...w, ...neu }; setW(x); mailWahlSetzen(x); };
  const tun = async (f: () => Promise<void>, fehler: string) => { setLaeuft(true); try { await f(); } catch (e) { onNotice({ kind: "error", text: e instanceof Error ? e.message : fehler }); } finally { setLaeuft(false); } };
  const brainJetzt = () => tun(async () => {
    const r = await proEingangAbholen();
    onNotice(!r.offen ? { kind: "info", text: "Der Pro-Tresor ist nicht offen. Unter Sicherheit › Pro-Tresor entsperren, dann kommen die Mails aus Private Brain." } : { kind: r.geholt ? "success" : "info", text: r.geholt ? `${r.geholt} Übergabe${r.geholt === 1 ? "" : "n"} in die Eingangszentrale geholt.` : "Keine neuen Mails aus Private Brain." });
  }, "Der Pro-Eingang konnte nicht gelesen werden.");
  const microsoftHolen = () => tun(async () => {
    if (!microsoftMailAngemeldet()) await microsoftMailAnmelden();
    const mails = await microsoftMailsListen(30);
    setListe({ mails, gewaehlt: new Set(mails.filter((m) => m.anhaenge).map((m) => m.id)) });
  }, "Das Microsoft-Postfach konnte nicht gelesen werden.");
  const uebernehmen = () => tun(async () => {
    if (!liste) return;
    const files: File[] = [];
    for (const m of liste.mails.filter((x) => liste.gewaehlt.has(x.id))) files.push(await microsoftMailAlsEml(m));
    setListe(null);
    if (files.length && await onDateien(files)) onNotice({ kind: "success", text: `${files.length} Mail${files.length === 1 ? "" : "s"} als .eml in die Eingangszentrale gelegt. Im Postfach wurde nichts verändert.` });
  }, "Die Mails konnten nicht geholt werden.");

  const rein: Array<{ wert: Empfang; titel: string; satz: string; icon: React.ReactNode; aus?: boolean }> = [
    { wert: "brain", titel: "Private Brain Pro (empfohlen)", satz: "Dort „An Familienakte teilen“ – kommt über den Pro-Tresor.", icon: <Brain size={18}/> },
    { wert: "teilen", titel: "Teilen aus der Mail-App", satz: "In der Mail-App „Teilen → Familienakte“.", icon: <Share2 size={18}/> },
    { wert: "microsoft", titel: "Microsoft-Postfach", satz: "Auf Tipp die letzten 30 Tage holen.", icon: <Mail size={18}/> },
    { wert: "eigen", titel: "Eigenes Mail-Programm", satz: "Geplant – Postfach direkt in der Familienakte.", icon: <Wrench size={18}/>, aus: true },
  ];
  const raus: Array<{ wert: Versand; titel: string; satz: string; icon: React.ReactNode }> = [
    { wert: "mailapp", titel: "Mail-App öffnen", satz: "Abschicken tust du in deiner Mail-App.", icon: <Send size={18}/> },
    { wert: "microsoft", titel: "Über Microsoft senden", satz: "Nach Bestätigung, liegt dann in „Gesendete Elemente“.", icon: <Mail size={18}/> },
  ];
  return <section className="card email-wege-karte" data-email-wege data-hilfe-ziel="email-wege">
    <div className="card-heading"><div><span className="ui-heading-help"><h2><Mail size={20}/> E-Mail</h2><InfoPopover label="E-Mail-Wege erklären" text={MAIL_HILFE.rein}/></span><p className="fine-print">Du wählst, wie Mails in die Akte kommen und wie du schreibst.</p></div></div>
    <div className="entscheid-bloecke">
      <section className="entscheid-block" data-block="mail-rein">
        <span className="ui-heading-help"><h3><Inbox size={17}/> Wie kommen Mails herein?</h3><InfoPopover label="Wie kommen Mails herein erklären" text={MAIL_HILFE.rein}/></span>
        <Wahl name="mail-rein" wert={w.empfang} onWahl={(v) => setzen({ empfang: v })} optionen={rein}/>
        {w.empfang === "brain" && <><label className="checkbox-row" data-mail-brain-auto><input type="checkbox" checked={w.brainAuto} onChange={(e) => setzen({ brainAuto: e.target.checked })}/> Von selbst abholen, sobald der Pro-Tresor offen ist</label>
          <div className="button-row"><button className="button primary" disabled={!aktiv || laeuft} onClick={() => void brainJetzt()} data-mail-brain-jetzt>Jetzt abholen</button></div></>}
        {w.empfang === "teilen" && <p className="entscheid-zustand" data-mail-teilen>In der Mail-App: Mail öffnen › Teilen › Familienakte.</p>}
        {w.empfang === "microsoft" && <div className="button-row"><button className="button primary" disabled={!aktiv || laeuft} onClick={() => void microsoftHolen()} data-mail-microsoft-holen>{laeuft ? "Läuft …" : "Mails holen …"}</button></div>}
      </section>
      <section className="entscheid-block" data-block="mail-raus">
        <span className="ui-heading-help"><h3><Send size={17}/> Wie gehen Mails hinaus?</h3><InfoPopover label="Wie gehen Mails hinaus erklären" text={MAIL_HILFE.raus}/></span>
        <Wahl name="mail-raus" wert={w.versand} onWahl={(v) => setzen({ versand: v })} optionen={raus}/>
        <div className="button-row"><button className="button secondary" onClick={onSchreiben} data-mail-schreiben>Zur Korrespondenzzentrale</button></div>
      </section>
    </div>
    {liste && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setListe(null)}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="mail-liste-titel" data-mail-liste>
        <div className="modal-head"><div><span className="badge">Microsoft-Postfach</span><h2 id="mail-liste-titel">E-Mails abholen</h2></div><button className="icon-button" onClick={() => setListe(null)} aria-label="Fenster schließen"><X/></button></div>
        {!liste.mails.length ? <p>Keine Mails in den letzten 30 Tagen.</p> : <div className="mail-liste">{liste.mails.map((m) => <label key={m.id} className="checkbox-row" data-mail-eintrag><input type="checkbox" checked={liste.gewaehlt.has(m.id)} onChange={(e) => { const g = new Set(liste.gewaehlt); if (e.target.checked) g.add(m.id); else g.delete(m.id); setListe({ ...liste, gewaehlt: g }); }}/><span><strong>{m.betreff}</strong> <small>{m.von} · {m.empfangen.slice(0, 10).split("-").reverse().join(".")}{m.anhaenge ? " · 📎" : ""}</small></span></label>)}</div>}
        <p className="fine-print">Gewählte Mails gehen als .eml in die Eingangszentrale. Im Postfach wird nichts gelöscht, verschoben oder als gelesen markiert.</p>
        <div className="modal-actions"><button className="button secondary" onClick={() => setListe(null)}>Abbrechen</button><button className="button primary" disabled={laeuft || !liste.gewaehlt.size} onClick={() => void uebernehmen()} data-mail-uebernehmen>{liste.gewaehlt.size} in die Eingangszentrale</button></div>
      </div>
    </div>}
  </section>;
}
