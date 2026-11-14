"use client";
// Knopf „Pseudo“ im Kopf (Klaus 14.11.2026): grün „an“, rot „aus“. An öffnet oben das Fenster „Pseudonymisieren“:
// Dateien einfügen (Text, PDF, Bild/Scan mit Texterkennung auf dem Gerät, E-Mail .eml samt Anhängen) oder Text einfügen →
// pseudonymisierte Fassung mit Marke, Kopieren (Doppelblatt), als Textdatei speichern, Antwort einer KI zurückführen.
// Die Maske (lib/maske.ts auf Modul 25) hat keinen Netzweg; die Zuordnung bleibt nur im Speicher dieser Seite.
// Profile: Personen der Akte werden verdeckt, Organisationen dürfen bleiben. In der Pro-App kommen die gespeicherten Profile dazu
// (Stufe C, app/maske-profile.tsx); „Korrigieren“ merkt sich dort ins Profil. Basic speichert nichts.
import { useEffect, useMemo, useState } from "react";
import { Copy, Download, Undo2, Upload, X } from "lucide-react";
import { InfoPopover } from "./ui-controls";
import { maskieren, zurueckfuehren, type MaskeProfil } from "../lib/maske";
import { korrigieren, maskeAusProfilen, neueProfile, profilNummernImText, eintragName, type MaskeProfile, type Regel } from "../lib/maske-profil";
import { profileSpeichern, useMaskeProfile } from "./maske-profil-speicher";
import type { Pseudonymisierer } from "../lib/ki-auftrag";
import { extractEmlAttachments } from "../lib/central-intake";
import { dateiAusgeben } from "./dateiausgabe";

const KEY = "familienakte_pseudo_v1";
const EREIGNIS = "familienakte:pseudo";
const pseudo = () => (window as unknown as { SbkimPseudonym?: Pseudonymisierer }).SbkimPseudonym;
const gemerkt = () => { try { return localStorage.getItem(KEY) === "an"; } catch { return false; } };

export function usePseudo(): [boolean, (an: boolean) => void] {
  const [an, setAn] = useState(gemerkt);
  useEffect(() => { const h = () => setAn(gemerkt()); window.addEventListener(EREIGNIS, h); return () => window.removeEventListener(EREIGNIS, h); }, []);
  const setzen = (wert: boolean) => { try { localStorage.setItem(KEY, wert ? "an" : "aus"); } catch { /* nur für diese Sitzung */ } setAn(wert); window.dispatchEvent(new Event(EREIGNIS)); };
  return [an, setzen];
}

export function PseudoKnopf() {
  const [an, setzen] = usePseudo();
  return <button type="button" className={`icon-button pseudo-knopf ${an ? "pseudo-an" : "pseudo-aus"}`} aria-pressed={an} onClick={() => setzen(!an)}
    title={an ? "Pseudonymisieren ist an – tippen zum Ausschalten" : "Pseudonymisieren ist aus – tippen zum Einschalten"} aria-label={`Pseudo ${an ? "an" : "aus"}`} data-pseudo-knopf={an ? "an" : "aus"}>
    <span className="pseudo-wort">Pseudo</span><small className="pseudo-zustand">{an ? "an" : "aus"}</small>
  </button>;
}

type Stueck = { name: string; text: string; ergebnis: string; funde: number; unsicher: string[]; schon: boolean; leck: string | null };

async function textVon(file: File, meldung: (s: string) => void): Promise<string> {
  if (/\.(txt|md|csv|json|html?)$/i.test(file.name) || file.type.startsWith("text/")) return file.text();
  const { dokumentText, dokumentTextOcr } = await import("./ki-auftrag-dialog");
  let t = "";
  try { t = await dokumentText(file); } catch { t = ""; }
  if (t.trim().length < 40 && (/\.pdf$/i.test(file.name) || file.type === "application/pdf" || file.type.startsWith("image/"))) {
    meldung(`Texterkennung auf dem Gerät: ${file.name} …`);
    try { t = await dokumentTextOcr(file); } catch { /* ohne Text */ }
  }
  return t;
}

function mailKopf(roh: string): string {
  const kopf = roh.slice(0, Math.max(0, roh.search(/\r?\n\r?\n/))).replace(/\r?\n[ \t]+/g, " ");
  return ["From", "To", "Cc", "Date", "Subject"].map((h) => { const m = kopf.match(new RegExp(`^${h}:\\s*(.*)$`, "mi")); return m ? `${h === "Subject" ? "Betreff" : h === "From" ? "Von" : h === "To" ? "An" : h === "Date" ? "Datum" : "Cc"}: ${m[1].trim()}` : ""; }).filter(Boolean).join("\n");
}

function mailText(roh: string): string {
  const i = roh.search(/\r?\n\r?\n/);
  const koerper = i >= 0 ? roh.slice(i) : roh;
  const plain = koerper.split(/\r?\n--[^\r\n]+/).find((t) => /content-type:\s*text\/plain/i.test(t));
  const teil = plain ? plain.slice(plain.search(/\r?\n\r?\n/)) : koerper;
  return teil.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/<[^>]+>/g, " ").trim();
}

function markiert(text: string) {
  return text.split(/(⟦[^⟧]+⟧)/g).map((t, i) => /^⟦/.test(t) ? <mark key={i} className="pseudo-platzhalter">{t}</mark> : t);
}

type AkteRecord = { id?: string; type?: string; data?: Record<string, unknown> };

export function PseudoFenster({ profil, basic, records = [], onProfile }: { profil: MaskeProfil; basic: boolean; records?: AkteRecord[]; onProfile?: () => void }) {
  const [an, setzen] = usePseudo();
  const [eingabe, setEingabe] = useState("");
  const [stuecke, setStuecke] = useState<Stueck[]>([]);
  const [map, setMap] = useState<Record<string, string>>({});
  const [zusatz, setZusatz] = useState("");
  const [bleibt, setBleibt] = useState("");
  const [antwort, setAntwort] = useState("");
  const [zurueck, setZurueck] = useState<{ text: string; offen: string[] } | null>(null);
  const [meldung, setMeldung] = useState("");
  const [busy, setBusy] = useState(false);
  const [korrWort, setKorrWort] = useState("");
  const [korrZiel, setKorrZiel] = useState("");
  const stand = useMaskeProfile(basic);
  const merktSich = !basic && (stand.ort === "tresor" || stand.ort === "geraet");
  const p = pseudo();
  const voll = useMemo<MaskeProfil>(() => ({ ...profil, zusatz: zusatz.split(/\n+/).map((w) => w.trim()).filter((w) => w.length >= 2), nieVerdecken: bleibt.split(/\n+/).map((w) => w.trim()).filter(Boolean) }), [profil, zusatz, bleibt]);
  if (!an) return null;

  const einzeln = async (text: string, profile: MaskeProfile | null, m: Record<string, string>) => {
    const nummern = profile ? await profilNummernImText(profile, text) : [];
    return maskieren(p!, text, maskeAusProfilen(profile, records, voll, nummern), m);
  };
  const verarbeiten = async (liste: Array<{ name: string; text: string }>) => {
    if (!p) return;
    let m = map; const neu: Stueck[] = [];
    for (const s of liste) {
      const r = await einzeln(s.text, stand.eigene, m); m = r.map;
      neu.push({ name: s.name, text: s.text, ergebnis: r.text, funde: r.funde.length, unsicher: r.unsicher, schon: r.schonPseudonymisiert, leck: r.leck });
    }
    setMap(m); setStuecke((alt) => [...neu, ...alt]);
    const schon = neu.filter((s) => s.schon).length;
    setMeldung(`${neu.length} pseudonymisiert${schon ? ` · ${schon} war schon pseudonymisiert und blieb unverändert` : ""}. Nichts hat das Gerät verlassen.`);
  };
  /** Korrigieren in der Pro-App: ins Profil merken und die gezeigten Fassungen gleich neu rechnen. */
  const merken = async (wort: string, wie: Regel, ziel?: string) => {
    const w = wort.trim(); if (w.length < 2 || !p) return;
    try {
      const neu = korrigieren(stand.eigene || await neueProfile(), w, wie, ziel || undefined);
      await profileSpeichern(neu);
      let m = map; const neuStuecke: Stueck[] = [];
      for (const st of stuecke) {
        if (st.schon) { neuStuecke.push(st); continue; }
        const r = await einzeln(st.text, neu, m); m = r.map;
        neuStuecke.push({ ...st, ergebnis: r.text, funde: r.funde.length, unsicher: r.unsicher, leck: r.leck });
      }
      setMap(m); setStuecke(neuStuecke); setKorrWort("");
      setMeldung(`„${w}“ ${wie === "verdecken" ? "wird immer verdeckt" : "darf bleiben"} – ins Profil gemerkt und neu gerechnet.`);
    } catch (e) { setMeldung(e instanceof Error ? e.message : String(e)); }
  };
  const dateien = async (files: FileList | null) => {
    if (!files?.length || !p) return;
    setBusy(true);
    const liste: Array<{ name: string; text: string }> = [];
    try {
      for (const f of Array.from(files)) {
        if (/\.eml$/i.test(f.name) || f.type === "message/rfc822") {
          const roh = await f.text();
          const teile = [`${mailKopf(roh)}\n\n${mailText(roh)}`];
          for (const a of await extractEmlAttachments(f)) { const t = await textVon(a, setMeldung); teile.push(`--- Anhang: ${a.name} ---\n${t.trim() || "(kein lesbarer Text)"}`); }
          liste.push({ name: f.name, text: teile.join("\n\n") });
        } else {
          setMeldung(`Lese ${f.name} …`);
          const t = await textVon(f, setMeldung);
          liste.push({ name: f.name, text: t.trim() || "(kein lesbarer Text)" });
        }
      }
      await verarbeiten(liste);
    } catch (e) { setMeldung(`Lesen ging nicht: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setBusy(false); }
  };
  const kopieren = async (s: Stueck) => {
    if (s.leck) { setMeldung("Im Text steht noch eine echte Angabe. Nichts wurde kopiert."); return; }
    try { await navigator.clipboard.writeText(s.ergebnis); setMeldung(`Pseudonymisierte Fassung von „${s.name}“ kopiert. Das Original bleibt hier.`); }
    catch { setMeldung("Kopieren ging nicht. Bitte den Text markieren und von Hand kopieren."); }
  };
  const speichern = async (s: Stueck) => {
    if (s.leck) { setMeldung("Im Text steht noch eine echte Angabe. Nichts wurde gespeichert."); return; }
    const name = `${s.name.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").trim().slice(0, 80) || "Text"} (pseudonymisiert).txt`;
    try { await dateiAusgeben(new File([s.ergebnis], name, { type: "text/plain" })); setMeldung(`„${name}“ gespeichert.`); }
    catch (e) { setMeldung(e instanceof Error ? e.message : "Speichern ging nicht."); }
  };

  return <section className="card pseudo-fenster" data-pseudo-fenster>
    <div className="card-heading"><div><span className="ui-heading-help"><h2>Pseudonymisieren</h2><InfoPopover label="Pseudonymisieren erklären" text="Namen, Anschriften, Geburtsdaten, Steuer-ID, Versicherten-, Renten-, Ausweis-, Kunden- und Kontonummern, Telefon, Mail und Diagnose-Codes werden zu Platzhaltern wie ⟦NAME-1⟧. Daten, Fristen, Beträge und Firmen bleiben lesbar, damit eine KI sortieren und antworten kann. Personen aus deiner Akte werden immer verdeckt, Organisationen aus deiner Akte bleiben stehen. Jede Fassung beginnt mit ⟦PSEUDONYMISIERT v1⟧ und wird nie ein zweites Mal verarbeitet. Die Zuordnung bleibt nur in dieser Seite; „Zurückführen“ setzt die echten Angaben in die Antwort der KI ein. Pseudonymisieren ist kein Anonymisieren: mit der Zuordnung bleibt es persönlich."/></span></div>
      <button type="button" className="icon-button" onClick={() => setzen(false)} aria-label="Pseudo ausschalten" title="Pseudo ausschalten"><X size={18}/></button></div>
    <p className="pseudo-hinweis">🔒 Läuft nur auf diesem Gerät, ohne Netz. {basic ? "Basic speichert keine Profile – für eigene Nummern und Gesundheitsdaten die Pro-App nehmen." : stand.ort === "gesperrt" ? "Pro-Tresor gesperrt: es gelten nur Muster und die Akte, bis er entsperrt ist." : `Personen und Stellen kommen aus deiner Akte${stand.eigene?.eintraege.length ? ` und ${stand.eigene.eintraege.length} Profilen` : ""}.`}{!basic && onProfile && <> <button type="button" className="link-button" onClick={onProfile} data-pseudo-profile>Profile ›</button></>}</p>
    {!p && <p className="form-error">Der Baustein zum Verdecken ist nicht geladen. Bitte die App neu laden.</p>}
    <div className="button-row">
      <label className="button primary pseudo-datei"><Upload size={16}/> Dateien einfügen<input type="file" multiple hidden disabled={busy || !p} accept=".txt,.md,.pdf,.eml,.csv,.html,image/*,message/rfc822,text/*,application/pdf" onChange={(e) => { void dateien(e.target.files); e.target.value = ""; }} data-pseudo-datei/></label>
    </div>
    <label><span>Oder Text einfügen</span><textarea rows={4} value={eingabe} onChange={(e) => setEingabe(e.target.value)} placeholder="Brief, Mail oder Notiz hier einfügen …" data-pseudo-text/></label>
    <div className="button-row"><button type="button" className="button secondary" disabled={!eingabe.trim() || !p} onClick={() => { void verarbeiten([{ name: "Eingefügter Text", text: eingabe }]); setEingabe(""); }} data-pseudo-los>Pseudonymisieren</button></div>
    {merktSich ? <details className="pseudo-korrektur" data-pseudo-korrektur="profil"><summary>Korrigieren: verdecken / darf bleiben – ins Profil merken</summary>
      <div className="form-grid">
        <label><span>Wort oder Name</span><input value={korrWort} onChange={(e) => setKorrWort(e.target.value)} data-pseudo-korr-wort/></label>
        <label><span>Merken als</span><select value={korrZiel} onChange={(e) => setKorrZiel(e.target.value)} data-pseudo-korr-ziel>
          <option value="">Neuer Kontakt</option>
          {(stand.eigene?.eintraege || []).filter((e) => e.art !== "stelle").map((e) => <option key={e.id} value={e.id}>Schreibweise von {eintragName(e, records)}</option>)}
        </select></label>
      </div>
      <div className="button-row">
        <button type="button" className="button secondary" disabled={korrWort.trim().length < 2} onClick={() => void merken(korrWort, "verdecken", korrZiel)} data-pseudo-korr-verdecken>Immer verdecken</button>
        <button type="button" className="button secondary" disabled={korrWort.trim().length < 2} onClick={() => void merken(korrWort, "bleibt")} data-pseudo-korr-bleibt>Darf bleiben</button>
      </div>
      <small>Gilt ab sofort für alle Texte und wird in deinen Profilen gemerkt.</small>
    </details> : <details className="pseudo-korrektur"><summary>Korrigieren: zusätzlich verdecken / darf bleiben</summary>
      <div className="form-grid">
        <label><span>Immer verdecken (eins pro Zeile)</span><textarea rows={2} value={zusatz} onChange={(e) => setZusatz(e.target.value)} data-pseudo-zusatz/></label>
        <label><span>Darf bleiben (eins pro Zeile)</span><textarea rows={2} value={bleibt} onChange={(e) => setBleibt(e.target.value)} data-pseudo-bleibt/></label>
      </div>
      <small>Gilt für die nächsten Texte, nur bis zum Schließen der App.</small>
    </details>}
    {meldung && <p className="sync-message" role="status" data-pseudo-meldung>{busy ? "⏳ " : ""}{meldung}</p>}
    {stuecke.map((s, i) => <div className="pseudo-stueck" key={`${i}-${s.name}`} data-pseudo-stueck>
      <div className="pseudo-stueck-kopf"><strong>{s.name}</strong><span className={`badge ${s.leck ? "danger" : s.schon ? "" : "success"}`}>{s.leck ? "⚠ echte Angabe übrig" : s.schon ? "schon pseudonymisiert" : `${s.funde} verdeckt`}</span></div>
      {s.unsicher.length > 0 && (merktSich
        ? <div className="pseudo-unsicher">Bitte prüfen (verdeckt, aber nicht sicher ein Name): {s.unsicher.map((w) => <span key={w} className="pseudo-unsicher-wort"><strong>{w}</strong> <button type="button" className="link-button" onClick={() => void merken(w, "verdecken")} data-pseudo-unsicher-verdecken={w}>immer verdecken</button> · <button type="button" className="link-button" onClick={() => void merken(w, "bleibt")} data-pseudo-unsicher-bleibt={w}>darf bleiben</button></span>)}</div>
        : <p className="pseudo-unsicher">Bitte prüfen (verdeckt, aber nicht sicher ein Name): {s.unsicher.join(" · ")} – falls das bleiben darf, unter „Korrigieren“ eintragen.</p>)}
      <pre className="platzhalter-text" data-pseudo-ergebnis>{markiert(s.ergebnis)}</pre>
      <div className="button-row">
        <button type="button" className="button primary" onClick={() => void kopieren(s)} data-pseudo-kopieren><Copy size={16}/> Kopieren</button>
        <button type="button" className="button secondary" onClick={() => void speichern(s)} data-pseudo-speichern><Download size={16}/> Als Textdatei</button>
      </div>
    </div>)}
    {stuecke.length > 0 && <div className="pseudo-zurueck">
      <label><span>Antwort der KI hier einfügen – Zurückführen</span><textarea rows={4} value={antwort} onChange={(e) => setAntwort(e.target.value)} data-pseudo-antwort/></label>
      <div className="button-row"><button type="button" className="button secondary" disabled={!antwort.trim() || !p} onClick={() => p && setZurueck(zurueckfuehren(p, antwort, map))} data-pseudo-zurueckfuehren><Undo2 size={16}/> Zurückführen</button></div>
      {zurueck && <><pre className="platzhalter-text" data-pseudo-klar>{zurueck.text}</pre>{zurueck.offen.length > 0 && <small>{zurueck.offen.length} Platzhalter kannte die App nicht: {zurueck.offen.join(" ")}</small>}</>}
    </div>}
  </section>;
}
