// Abschnitt D (Rückmeldung 09.11., Klaus d1–d4 Ja): Weg 2 der Assistenz „Brief oder E-Mail beantworten“.
// Technik aus Private Brain Pro („KI beim Schreiben“): Modul 25 (byte-1:1) und die Familien-Muster verdecken Namen, Anschriften,
// Nummern, Beträge und Daten; nur der verdeckte Text verlässt das Gerät – kopiert, per Direktlink in die eigene KI (Abo) oder mit
// eigenem Schlüssel an Mistral (EU). Die Zuordnung Platzhalter → Klartext bleibt im Speicher dieser Seite.
import { useMemo, useRef, useState } from "react";
import { Copy, ExternalLink, FileText, Send, ShieldCheck, Undo2 } from "lucide-react";
import { InfoPopover, VoiceInput, VoiceTextarea } from "./ui-controls";
import { KI_ZIELE, oeffnenAdresse, type KiZiel, type Pseudonymisierer } from "../lib/ki-auftrag";
import { antwortZurueck, briefFuerKi, MISTRAL_ADRESSE, mistralAnfrage, type BriefArt } from "../lib/brief-antwort";
import { textAlsPdf } from "../lib/text-pdf";
import type { AssistantDocument, CorrespondenceKind } from "@/lib/family-assistant";

type Notice = { kind: "success" | "error" | "info"; text: string } | null;
const SCHLUESSEL_KEY = "familienakte_mistral_schluessel_v1";
const pseudo = () => (window as unknown as { SbkimPseudonym?: Pseudonymisierer }).SbkimPseudonym;
const offline = () => { const w = window as unknown as { PBNetwork?: { ready: boolean; offline: boolean } }; return navigator.onLine === false || Boolean(w.PBNetwork && (!w.PBNetwork.ready || w.PBNetwork.offline)); };
const gemerkt = () => { try { return localStorage.getItem(SCHLUESSEL_KEY) || ""; } catch { return ""; } };

export function BriefAntwort({ namen, documents, cases, vaultReady, onSave, onWorkflowPdf, onNotice }: {
  namen: string[];
  documents: AssistantDocument[];
  cases: Array<{ id: string; label: string }>;
  vaultReady: boolean;
  onSave: (input: { status: "Entwurf"; kind: CorrespondenceKind; recipient: string; subject: string; body: string; caseId: string | null; documentIds: string[] }) => Promise<void>;
  onWorkflowPdf: (file: File) => void;
  onNotice: (notice: Notice) => void;
}) {
  const [text, setText] = useState("");
  const [betreff, setBetreff] = useState("");
  const [quelle, setQuelle] = useState("");
  const [art, setArt] = useState<BriefArt>("antwort");
  const [wunsch, setWunsch] = useState("");
  const [zusatz, setZusatz] = useState("");
  const [antwort, setAntwort] = useState("");
  const [ergebnis, setErgebnis] = useState<{ betreff: string; text: string; offen: string[] } | null>(null);
  const [vorher, setVorher] = useState<{ betreff: string; text: string; offen: string[] } | null>(null);
  const [caseId, setCaseId] = useState("");
  const [schluessel, setSchluessel] = useState(gemerkt);
  const [merken, setMerken] = useState(() => Boolean(gemerkt()));
  const [frage, setFrage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [meldung, setMeldung] = useState("");
  const abbruch = useRef<AbortController | null>(null);
  const p = pseudo();
  const fuerKi = useMemo(() => p && text.trim() ? briefFuerKi(p, { text, betreff, art, wunsch, namen, zusatz }) : null, [p, text, betreff, art, wunsch, namen, zusatz]);
  const mitText = documents.filter((d) => (d.textauszug || "").trim().length > 40);

  const kopieren = async () => {
    if (!fuerKi) return;
    if (fuerKi.leck) { setMeldung("Im verdeckten Text steht noch eine echte Angabe. Nichts wurde kopiert."); return; }
    try { await navigator.clipboard.writeText(fuerKi.zumKopieren); setMeldung("Verdeckter Text kopiert. In deiner KI einfügen, die Antwort unten wieder einfügen."); }
    catch { setMeldung("Kopieren ging nicht. Bitte den Text im Kasten „Das sieht die KI“ markieren und von Hand kopieren."); }
  };
  const oeffnen = async (ziel: KiZiel) => {
    if (!fuerKi || fuerKi.leck) { setMeldung("Im verdeckten Text steht noch eine echte Angabe. Nichts wurde geöffnet."); return; }
    const { url, textInAdresse } = oeffnenAdresse(ziel, fuerKi.zumKopieren);
    if (!textInAdresse) { try { await navigator.clipboard.writeText(fuerKi.zumKopieren); } catch { /* der Kasten bleibt zum Markieren */ } }
    window.open(url, "_blank", "noopener");
    setMeldung(textInAdresse ? `${KI_ZIELE[ziel].name} öffnet mit dem verdeckten Text. Die Antwort unten einfügen.` : `${KI_ZIELE[ziel].name} öffnet; der verdeckte Text liegt in der Zwischenablage. Dort einfügen, Antwort unten einfügen.`);
  };
  const senden = async () => {
    if (!fuerKi || !p) return;
    setFrage(false);
    if (fuerKi.leck) { setMeldung("Im verdeckten Text steht noch eine echte Angabe. Nichts wurde gesendet."); return; }
    if (!schluessel.trim()) { setMeldung("Für den direkten Weg unten den Mistral-Schlüssel eintragen. Sonst: verdeckten Text kopieren."); return; }
    if (offline()) { setMeldung("Die App ist vom Internet getrennt. Kopieren für dein Abo geht trotzdem."); return; }
    try { if (merken) localStorage.setItem(SCHLUESSEL_KEY, schluessel.trim()); else localStorage.removeItem(SCHLUESSEL_KEY); } catch { /* nur für diese Sitzung */ }
    setBusy(true); setMeldung("Die KI schreibt …");
    abbruch.current = new AbortController();
    try {
      const r = await fetch(MISTRAL_ADRESSE, { method: "POST", signal: abbruch.current.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${schluessel.trim()}` }, body: JSON.stringify(mistralAnfrage(fuerKi, crypto.randomUUID())) });
      if (!r.ok) throw new Error(r.status === 401 ? "Der Schlüssel wurde abgelehnt." : `Antwort ${r.status}.`);
      const daten = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
      const inhalt = daten.choices?.[0]?.message?.content || "";
      if (!inhalt.trim()) throw new Error("Die Antwort war leer.");
      setAntwort(inhalt); uebernehmen(inhalt);
    } catch (reason) { setMeldung(`Die KI hat nicht geantwortet: ${reason instanceof Error ? reason.message : String(reason)}`); }
    finally { setBusy(false); abbruch.current = null; }
  };
  const uebernehmen = (roh = antwort) => {
    if (!fuerKi || !p || !roh.trim()) return;
    const r = antwortZurueck(p, roh, fuerKi.map);
    setVorher(ergebnis);
    setErgebnis({ betreff: r.betreff || (betreff ? `Re: ${betreff}` : ""), text: r.text, offen: r.offenePlatzhalter });
    setMeldung(r.offenePlatzhalter.length ? `Übernommen. ${r.offenePlatzhalter.length} Platzhalter kannte die App nicht – sie stehen noch im Text, bitte selbst ersetzen.` : "Übernommen. Platzhalter wurden wieder durch die echten Angaben ersetzt.");
  };
  const speichern = async () => {
    if (!ergebnis) return;
    if (!vaultReady) { onNotice({ kind: "info", text: "Bitte zuerst den lokalen Datentresor verbinden." }); return; }
    setBusy(true);
    try { await onSave({ status: "Entwurf", kind: "Antwort", recipient: "", subject: ergebnis.betreff || "Antwort", body: ergebnis.text, caseId: caseId || null, documentIds: quelle ? [quelle] : [] }); setMeldung("Als Entwurf gespeichert – steht unten in der gespeicherten Korrespondenz."); }
    catch (reason) { onNotice({ kind: "error", text: reason instanceof Error ? reason.message : "Der Entwurf konnte nicht gespeichert werden." }); }
    finally { setBusy(false); }
  };
  const alsPdf = () => {
    if (!ergebnis) return;
    const name = `${(ergebnis.betreff || "Antwort").replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 60) || "Antwort"}.pdf`;
    onWorkflowPdf(new File([textAlsPdf(`${ergebnis.betreff ? `${ergebnis.betreff}\n\n` : ""}${ergebnis.text}`, ergebnis.betreff || "Antwort") as Uint8Array<ArrayBuffer>], name, { type: "application/pdf" }));
  };

  if (!p) return <section className="card" data-brief-antwort><p className="form-error">Der Baustein zum Verdecken ist nicht geladen. Bitte die App neu laden.</p></section>;
  return <section className="card brief-antwort" data-brief-antwort>
    <div className="card-heading"><div><span className="ui-heading-help"><h2>Brief oder E-Mail beantworten</h2><InfoPopover label="Brief oder E-Mail beantworten erklären" text="Namen, Anschriften, Nummern, Beträge und Daten werden durch Platzhalter wie ⟦NAME-1⟧ ersetzt, bevor etwas das Gerät verlässt. Namen aus deiner Akte werden immer verdeckt. Was kein festes Muster hat (eine Straße ohne Hausnummer, „die Chefin in Kiel“), trägst du unten selbst ein. Die Antwort deiner KI fügst du wieder ein; die App setzt die echten Angaben zurück. Anhänge gehen nie an die KI."/></span></div><span className="badge success"><ShieldCheck size={14}/> verdeckt</span></div>
    <div className="form-grid">
      <label><span>Aus einer Unterlage, optional</span><select value={quelle} onChange={(e) => { const id = e.target.value; setQuelle(id); const d = documents.find((x) => x.id === id); if (d?.textauszug) { setText(d.textauszug); setBetreff(d.title); } }} data-brief-quelle><option value="">Text selbst einfügen</option>{mitText.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select></label>
      <label><span>Betreff, optional</span><VoiceInput value={betreff} onValueChange={setBetreff} speechLabel="Betreff" data-brief-betreff/></label>
    </div>
    <label><span>Brief oder E-Mail</span><VoiceTextarea rows={7} value={text} onValueChange={setText} speechLabel="Brief" placeholder="Den Brief oder die E-Mail hier einfügen …" data-brief-text/></label>
    <div className="wahl-reihe" role="radiogroup" aria-label="Was soll die KI tun?"><button type="button" role="radio" aria-checked={art === "antwort"} className={art === "antwort" ? "gewaehlt" : ""} onClick={() => setArt("antwort")} data-brief-art="antwort">Antwort schreiben lassen</button><button type="button" role="radio" aria-checked={art === "gegenlesen"} className={art === "gegenlesen" ? "gewaehlt" : ""} onClick={() => setArt("gegenlesen")} data-brief-art="gegenlesen">Gegenlesen</button></div>
    {art === "antwort" && <label><span>Was soll in der Antwort stehen?</span><VoiceInput value={wunsch} onValueChange={setWunsch} speechLabel="Wunsch" placeholder="Zum Beispiel: Ratenzahlung in drei Teilen anfragen" data-brief-wunsch/></label>}
    <label><span>Diese Wörter zusätzlich verdecken (eins pro Zeile)</span><textarea rows={2} value={zusatz} onChange={(e) => setZusatz(e.target.value)} data-brief-zusatz/></label>
    {fuerKi && <div className="brief-ki-sicht"><strong>Das sieht die KI</strong><pre className="platzhalter-text" data-brief-verdeckt>{fuerKi.text}</pre><small>{fuerKi.funde.length} Angaben verdeckt{fuerKi.leck ? " · ⚠ noch eine echte Angabe im Text – so geht nichts hinaus" : ""}</small></div>}
    <div className="button-row">
      <button type="button" className="button primary" disabled={!fuerKi || busy} onClick={() => void kopieren()} data-brief-kopieren><Copy size={16}/> Kopieren für deine KI</button>
      <button type="button" className="button secondary" disabled={!fuerKi || busy} onClick={() => void oeffnen("chatgpt")} data-brief-oeffnen="chatgpt"><ExternalLink size={16}/> In ChatGPT öffnen</button>
      <button type="button" className="button secondary" disabled={!fuerKi || busy} onClick={() => void oeffnen("claude")} data-brief-oeffnen="claude"><ExternalLink size={16}/> In Claude öffnen</button>
      {!frage ? <button type="button" className="button secondary" disabled={!fuerKi || busy} onClick={() => setFrage(true)} data-brief-senden><Send size={16}/> Mit eigenem Schlüssel senden</button>
        : <span className="brief-frage" data-brief-frage>{fuerKi?.funde.length || 0} Angaben sind verdeckt. Jetzt an Mistral (EU) senden? <button type="button" className="button primary compact-button" onClick={() => void senden()} data-brief-senden-ja>Ja, senden</button><button type="button" className="button secondary compact-button" onClick={() => setFrage(false)}>Abbrechen</button></span>}
    </div>
    <details className="brief-schluessel"><summary>Eigener Schlüssel (Mistral, EU)</summary><label><span>API-Schlüssel</span><input type="password" autoComplete="off" value={schluessel} onChange={(e) => setSchluessel(e.target.value)} data-brief-schluessel/></label><label className="check-row"><input type="checkbox" checked={merken} onChange={(e) => { setMerken(e.target.checked); if (!e.target.checked) { try { localStorage.removeItem(SCHLUESSEL_KEY); } catch { /* egal */ } } }}/><span><strong>Auf diesem Gerät merken</strong><small>Sonst nur bis zum Schließen der App. Nie im Tresor, nie in der Sicherung.</small></span></label></details>
    <label><span>Antwort der KI hier einfügen</span><textarea rows={5} value={antwort} onChange={(e) => setAntwort(e.target.value)} data-brief-antwort-roh/></label>
    <div className="button-row"><button type="button" className="button secondary" disabled={!antwort.trim() || !fuerKi} onClick={() => uebernehmen()} data-brief-uebernehmen>Echte Angaben einsetzen</button>{busy && abbruch.current && <button type="button" className="button secondary" onClick={() => abbruch.current?.abort()}>Abbrechen</button>}</div>
    {meldung && <p className="sync-message" role="status" data-brief-meldung>{meldung}</p>}
    {ergebnis && <div className="brief-ergebnis" data-brief-ergebnis>
      {ergebnis.betreff && <p><strong>{ergebnis.betreff}</strong></p>}
      <pre className="platzhalter-text">{ergebnis.text}</pre>
      <label><span>Zu einem Vorgang, optional</span><select value={caseId} onChange={(e) => setCaseId(e.target.value)}><option value="">Ohne Vorgang</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
      <div className="button-row"><button type="button" className="button primary" disabled={busy} onClick={() => void speichern()} data-brief-speichern>Als Entwurf speichern</button><button type="button" className="button secondary" onClick={alsPdf} data-brief-pdf><FileText size={16}/> In Workflow PDF öffnen</button><button type="button" className="button secondary" onClick={() => { setErgebnis(vorher); setVorher(null); setMeldung("Rückgängig."); }} data-brief-rueckgaengig><Undo2 size={16}/> Rückgängig</button></div>
    </div>}
  </section>;
}
