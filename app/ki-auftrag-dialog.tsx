import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, FileText, Sparkles, Undo2, Upload, X } from "lucide-react";
import { DictationButton, InfoPopover } from "./ui-controls";
import { pdfText } from "./file-viewer";
import { inventoryTextHint, type LocalDocument } from "./local-vault";
import { auftragAnonym, KI_ZIELE, oeffnenAdresse, sitzungGueltig, zurueckSetzen, type Anonymisiert, type KiArt, type KiZiel, type Pseudonymisierer } from "../lib/ki-auftrag";

type Notice = { kind: "success" | "error" | "info"; text: string } | null;
type ActionState = "pending" | "success" | "failed";
type Gewaehlt = { key: string; titel: string; text: string; lesbar: boolean };

const SITZUNGEN_KEY = "familienakte_ki_sitzungen_v1";
const WAHL_KEY = "familienakte_ki_wahl_v1";
const MAX_DOKUMENTE = 5;

function lesen<T>(key: string, vorgabe: T): T { try { return { ...vorgabe, ...JSON.parse(localStorage.getItem(key) || "{}") }; } catch { return vorgabe; } }
function schreiben(key: string, wert: unknown) { try { localStorage.setItem(key, JSON.stringify(wert)); } catch { /* ohne Speicher geht es weiter */ } }
const pseudo = () => (window as unknown as { SbkimPseudonym?: Pseudonymisierer }).SbkimPseudonym;

export async function dokumentText(file: File): Promise<string> {
  if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
    try { const t = await pdfText(file); if (t.trim()) return t; } catch { /* unten der einfache Weg */ }
  }
  return (await inventoryTextHint(file)).textHint;
}

/** Fenster „Mit KI arbeiten“ (Klaus 2026-10-31): App ändern ohne Unterlagen, oder ausgewählte Unterlagen bearbeiten.
 *  Hinaus geht nur, was in „Das sieht die KI“ steht — unkenntlich gemacht über Modul 25; der Rückweg setzt die Klartexte
 *  auf dem Gerät wieder ein. */
export function KiAuftragDialog({ seiteId, seite, initialRequest, documents, namen, readDocument, onSaveAnswer, onClose, onNotice, onStateChange }: {
  seiteId: string; seite: string; initialRequest?: string;
  documents: LocalDocument[]; namen: string[];
  readDocument: (id: string) => Promise<File>;
  onSaveAnswer: (file: File) => void;
  onClose: () => void; onNotice: (n: Notice) => void; onStateChange: (s: ActionState) => void;
}) {
  const start = lesen(WAHL_KEY, { ziel: "chatgpt" as KiZiel });
  const [ziel, setZiel] = useState<KiZiel>(KI_ZIELE[start.ziel] ? start.ziel : "chatgpt");
  const [art, setArt] = useState<KiArt>("app");
  const [wunsch, setWunsch] = useState(initialRequest || "");
  const [suche, setSuche] = useState("");
  const [gewaehlt, setGewaehlt] = useState<Gewaehlt[]>([]);
  const [lade, setLade] = useState(false);
  const [sitzungen, setSitzungen] = useState<Record<string, string>>(() => lesen(SITZUNGEN_KEY, {} as Record<string, string>));
  const [sitzungNeu, setSitzungNeu] = useState("");
  const [gemerkteNehmen, setGemerkteNehmen] = useState(true);
  const [antwort, setAntwort] = useState("");
  const [zurueck, setZurueck] = useState("");
  const [map, setMap] = useState<Record<string, string>>({});
  const sitzKey = `${ziel}:${seiteId}`;
  const gemerkt = sitzungen[sitzKey] || "";
  const p = pseudo();

  useEffect(() => { schreiben(WAHL_KEY, { ziel }); }, [ziel]);

  const namenAlle = namen;
  const anon: Anonymisiert | null = useMemo(() => (p ? auftragAnonym(p, art, seite, wunsch, gewaehlt.filter((g) => g.lesbar).map((g) => ({ titel: g.titel, text: g.text })), namenAlle) : null), [p, art, seite, wunsch, gewaehlt, namenAlle]);

  const treffer = useMemo(() => {
    const q = suche.trim().toLocaleLowerCase("de");
    const liste = [...documents].sort((a, b) => (b.documentDate || b.addedAt || "").localeCompare(a.documentDate || a.addedAt || ""));
    return (q ? liste.filter((d) => `${d.originalName} ${d.category} ${d.documentDate || ""}`.toLocaleLowerCase("de").includes(q)) : liste).slice(0, 30);
  }, [documents, suche]);

  const hinzu = async (key: string, titel: string, file: () => Promise<File>) => {
    if (gewaehlt.some((g) => g.key === key)) { setGewaehlt((alt) => alt.filter((g) => g.key !== key)); return; }
    if (gewaehlt.length >= MAX_DOKUMENTE) { onNotice({ kind: "info", text: `Höchstens ${MAX_DOKUMENTE} Unterlagen auf einmal.` }); return; }
    setLade(true);
    try {
      const text = (await dokumentText(await file())).slice(0, 40000);
      setGewaehlt((alt) => [...alt, { key, titel, text, lesbar: Boolean(text.trim()) }]);
    } catch (e) {
      onNotice({ kind: "error", text: `„${titel}“ konnte nicht gelesen werden: ${(e as Error).message}` });
    } finally { setLade(false); }
  };

  const kopieren = async (text: string, meldung: string) => {
    try { await navigator.clipboard.writeText(text); onStateChange("success"); onNotice({ kind: "success", text: meldung }); return true; }
    catch { onStateChange("failed"); onNotice({ kind: "error", text: "Der Auftrag konnte nicht automatisch kopiert werden. Bitte markiere den Text und kopiere ihn von Hand." }); return false; }
  };

  const bereit = Boolean(anon) && !anon?.leck && wunsch.trim().length > 0 && (art === "app" || gewaehlt.some((g) => g.lesbar));

  const oeffnen = async () => {
    if (!anon || !bereit) return;
    const sitzung = gemerkteNehmen && gemerkt ? gemerkt : undefined;
    const { url, textInAdresse } = oeffnenAdresse(ziel, anon.text, sitzung);
    if (art === "dokument") { setMap(anon.map); try { sessionStorage.setItem("familienakte_ki_map", JSON.stringify(anon.map)); } catch { /* nur im Fenster */ } }
    if (!textInAdresse) await kopieren(anon.text, `Auftrag kopiert. In ${KI_ZIELE[ziel].name} ins Eingabefeld einfügen.`);
    const fenster = window.open(url, "_blank", "noopener");
    if (!fenster && textInAdresse) onNotice({ kind: "info", text: "Das Fenster wurde nicht geöffnet (Internet aus oder vom Browser blockiert). Der Auftrag kann kopiert werden." });
    else onStateChange("success");
  };

  const sitzungMerken = () => {
    if (!sitzungGueltig(sitzungNeu, ziel)) { onNotice({ kind: "error", text: `Das ist kein Link zu ${KI_ZIELE[ziel].name}. Erwartet: ${KI_ZIELE[ziel].hosts.map((h) => `https://${h}/…`).join(" oder ")}` }); return; }
    const neu = { ...sitzungen, [sitzKey]: sitzungNeu.trim() };
    setSitzungen(neu); schreiben(SITZUNGEN_KEY, neu); setSitzungNeu(""); setGemerkteNehmen(true);
    onNotice({ kind: "success", text: `Sitzung für „${seite}“ gemerkt.` });
  };
  const sitzungVergessen = () => { const neu = { ...sitzungen }; delete neu[sitzKey]; setSitzungen(neu); schreiben(SITZUNGEN_KEY, neu); };

  const zuordnung = Object.keys(map).length ? map : (() => { try { return JSON.parse(sessionStorage.getItem("familienakte_ki_map") || "{}"); } catch { return {}; } })();
  const rueckweg = () => { if (p) setZurueck(zurueckSetzen(p, antwort, zuordnung)); };
  const ablegen = () => {
    const titel = `KI-Ergebnis ${seite} ${new Date().toISOString().slice(0, 10)}.txt`;
    onSaveAnswer(new File([zurueck], titel, { type: "text/plain" }));
    onClose();
  };

  const funde = anon ? Object.entries(anon.funde.reduce<Record<string, number>>((acc, f) => { acc[f.type] = (acc[f.type] || 0) + 1; return acc; }, {})) : [];

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal edit-dialog ki-dialog" role="dialog" aria-modal="true" aria-labelledby="ki-title">
    <div className="modal-head"><div><span className="badge success">Ohne kostenpflichtige API</span><span className="ui-heading-help"><h2 id="ki-title">Mit KI arbeiten</h2><InfoPopover label="Mit KI arbeiten erklären" text="Du beschreibst deinen Wunsch. Die Familienakte baut daraus einen Auftrag, macht Namen, Anschriften, Geburtsdaten, IBAN, Telefon, E-Mail, Vertrags- und Versichertennummern unkenntlich und öffnet die gewählte KI. Die Zuordnung der Platzhalter bleibt auf diesem Gerät."/></span></div><button className="icon-button" onClick={onClose} aria-label="Fenster schließen"><X/></button></div>

    <div className="ki-zeile" role="radiogroup" aria-label="KI wählen">{(Object.keys(KI_ZIELE) as KiZiel[]).map((z) => <button key={z} type="button" role="radio" aria-checked={ziel === z} className={`ki-wahl ${ziel === z ? "aktiv" : ""}`} onClick={() => setZiel(z)} title={KI_ZIELE[z].hinweis}>{KI_ZIELE[z].name}</button>)}</div>
    <div className="ki-zeile" role="radiogroup" aria-label="Art des Auftrags">
      <button type="button" role="radio" aria-checked={art === "app"} className={`ki-wahl ${art === "app" ? "aktiv" : ""}`} onClick={() => setArt("app")}><Sparkles size={15}/> App ändern</button>
      <button type="button" role="radio" aria-checked={art === "dokument"} className={`ki-wahl ${art === "dokument" ? "aktiv" : ""}`} onClick={() => setArt("dokument")}><FileText size={15}/> Unterlage bearbeiten</button>
      <span className="ki-seite">Seite: <strong>{seite}</strong></span>
    </div>
    <p className="fine-print">{art === "app" ? "Es gehen keine Unterlagen mit. Die KI baut nur an der App." : "Nur die gewählten Unterlagen gehen mit, unkenntlich gemacht. Alle anderen bleiben auf dem Gerät."}</p>

    <label><span>{art === "app" ? "Was soll an der App geändert werden?" : "Was soll mit der Unterlage passieren?"}</span><div className="dictation-field"><textarea rows={4} value={wunsch} onChange={(event) => setWunsch(event.target.value)} placeholder={art === "app" ? "Zum Beispiel: Ergänze im Bereich Fahrzeuge einen Unterpunkt für TÜV-Termine." : "Zum Beispiel: Schreibe eine höfliche Antwort auf dieses Schreiben und bitte um Fristverlängerung."}/><DictationButton value={wunsch} onChange={setWunsch} label="Wunsch"/></div></label>

    {art === "dokument" && <div className="ki-dokumente">
      <div className="ki-zeile"><input className="ki-suche" value={suche} onChange={(event) => setSuche(event.target.value)} placeholder="Unterlage suchen …" aria-label="Unterlage suchen"/>
        <label className="button secondary ki-datei"><Upload size={16}/> Datei wählen<input type="file" hidden accept=".pdf,.txt,.eml,.docx,.doc,.msg,text/*" onChange={(event) => { const f = event.target.files?.[0]; if (f) void hinzu(`datei:${f.name}:${f.size}`, f.name, async () => f); event.target.value = ""; }}/></label></div>
      <ul className="ki-liste" aria-label="Unterlagen der Akte">{treffer.map((d) => { const an = gewaehlt.some((g) => g.key === d.id); return <li key={d.id}><label><input type="checkbox" checked={an} disabled={lade} onChange={() => void hinzu(d.id, d.originalName, () => readDocument(d.id))}/> <span>{d.originalName}</span><small>{d.category}{d.documentDate ? ` · ${d.documentDate}` : ""}</small></label></li>; })}
        {!treffer.length && <li className="fine-print">Keine Unterlage gefunden.</li>}</ul>
      {gewaehlt.length > 0 && <p className="fine-print">Gewählt: {gewaehlt.map((g) => `${g.titel}${g.lesbar ? "" : " (kein lesbarer Text, geht nicht mit)"}`).join(" · ")}</p>}
      <p className="fine-print">Gelesen wird der Text von PDF (Textebene), Word, E-Mail und Textdateien. Fotos und gescannte Seiten ohne Text gehen nicht mit.</p>
    </div>}

    <div className="ki-sitzung"><strong>Sitzung</strong>
      {gemerkt ? <><label><input type="radio" checked={gemerkteNehmen} onChange={() => setGemerkteNehmen(true)}/> Gemerkte Sitzung für „{seite}“</label><label><input type="radio" checked={!gemerkteNehmen} onChange={() => setGemerkteNehmen(false)}/> Neue Sitzung</label><button type="button" className="text-link" onClick={sitzungVergessen}>vergessen</button></>
        : <span className="fine-print">Neue Sitzung. Einen Sitzungs-Link für diese Seite kannst du unten merken.</span>}
      <div className="ki-zeile"><input value={sitzungNeu} onChange={(event) => setSitzungNeu(event.target.value)} placeholder={`Link einer ${KI_ZIELE[ziel].name}-Sitzung einfügen`} aria-label="Sitzungs-Link"/><button type="button" className="button secondary" onClick={sitzungMerken} disabled={!sitzungNeu.trim()}>Merken</button></div>
    </div>

    <div className="edit-prompt-preview"><strong>Das sieht die KI</strong>
      {anon ? <textarea readOnly rows={6} value={anon.text} onFocus={(event) => event.currentTarget.select()}/> : <p className="fine-print">Der Baustein zum Unkenntlichmachen ist nicht geladen. Ohne ihn geht nichts hinaus.</p>}
      {anon && <p className="fine-print" data-ki-funde>{funde.length ? `Unkenntlich gemacht: ${funde.map(([t, n]) => `${n} × ${t}`).join(", ")}` : "Nichts zum Unkenntlichmachen gefunden."}{anon.leck ? ` · Achtung: „${anon.leck}“ steht noch im Klartext, so geht nichts hinaus.` : ""}</p>}
    </div>
    <p className="fine-print">Hier wird keine API verwendet. Erst in {KI_ZIELE[ziel].name} entscheidest du, ob du den Auftrag absendest. Was ein Name ist, erkennt die Familienakte aus den Personen, Firmen und Objekten der Akte und nach Mustern — prüfe die Vorschau.</p>
    <div className="modal-actions"><button type="button" className="button secondary" disabled={!anon || Boolean(anon.leck)} onClick={() => anon && void kopieren(anon.text, `Auftrag kopiert. Öffne jetzt ${KI_ZIELE[ziel].name} und füge ihn dort ein.`)}><Copy size={17}/> Auftrag kopieren</button><button type="button" className="button primary" disabled={!bereit} onClick={() => void oeffnen()}><ExternalLink size={17}/> In {KI_ZIELE[ziel].name} öffnen</button></div>

    {art === "dokument" && <div className="ki-rueckweg"><strong><Undo2 size={16}/> Rückweg</strong>
      <p className="fine-print">Antwort der KI hier einfügen. Die Platzhalter werden auf diesem Gerät wieder durch die echten Angaben ersetzt.</p>
      <textarea rows={4} value={antwort} onChange={(event) => setAntwort(event.target.value)} placeholder="Antwort aus der KI-Sitzung einfügen …" aria-label="Antwort der KI"/>
      <div className="modal-actions"><button type="button" className="button secondary" disabled={!antwort.trim() || !p || !Object.keys(zuordnung).length} onClick={rueckweg}>Echte Angaben einsetzen</button></div>
      {zurueck && <><textarea readOnly rows={5} value={zurueck} aria-label="Ergebnis mit echten Angaben"/>
        <div className="modal-actions"><button type="button" className="button secondary" onClick={() => void kopieren(zurueck, "Ergebnis kopiert.")}><Copy size={17}/> Kopieren</button><button type="button" className="button primary" onClick={ablegen}><FileText size={17}/> In die Eingangszentrale</button></div></>}
    </div>}
  </div></div>;
}
