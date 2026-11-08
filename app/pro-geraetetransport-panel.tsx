import type React from "react";
import { useEffect, useRef, useState } from "react";
import { getVaultSummary, readLocalDocumentFile, readLocalVaultData, type LocalDocument } from "./local-vault";
import { dateiAusgeben } from "./dateiausgabe";
import { InfoPopover } from "./ui-controls";
import { isSensitiveHealthText } from "../lib/family-privacy";

const ERKLAERUNG = "Gibt genau eine Datei weiter. Einträge, Fristen, Erinnerungen und Notizen gehen nicht mit; ein Abgleich zwischen deinen Geräten ist geplant, aber noch nicht gebaut. Die ganze Akte bringst du mit der Vollsicherung und „Sicherung einlesen“ auf ein neues Gerät. Gesundheitsunterlagen stehen hier nicht zur Wahl, weil das Paket nicht verschlüsselt ist. Speichere ein Paket und schicke es auf einem Weg deiner Wahl zum anderen Gerät, zum Beispiel über Datei-Post, Mail oder USB-Stick. Die empfangende Familienakte öffnet das Paket hier und gibt eine Empfangsdatei zurück. Das Paket enthält die lesbare Originaldatei und ist selbst nicht verschlüsselt: Datei-Post verschlüsselt beim Senden, Mail und USB-Stick nicht. Wähle für jedes Paket genau einen Empfänger; für weitere Empfänger ein eigenes Paket. Die Empfangsdatei bestätigt dieses Paket, keine geprüfte Identität.";
import { geraeteAusgaenge, geraeteAusgangVorbereiten, geraeteEingaenge, geraetePaket, geraetePaketAnnehmen, geraetePaketLesen, geraeteQuittung, geraeteQuittungAnnehmen, type GeraeteAusgang, type GeraeteEingang } from "./pro-geraetetransport";

type State = { handle: FileSystemDirectoryHandle | null; vaultId: string; documents: LocalDocument[]; outgoing: GeraeteAusgang[]; incoming: GeraeteEingang[] };
/** Gesundheitsunterlagen gehen nicht unverschlüsselt hinaus (U3), wie bei „An Pro-App geben“; erst mit dem Passwort-Paket (Plan 10b). */
export const fuerUebergabe = (d: LocalDocument) => !isSensitiveHealthText(d.category, d.originalName, d.notes);

export function ProGeraetetransportPanel({ handle, onEingang }: { handle: FileSystemDirectoryHandle | null; onEingang?: () => void }) {
  const [state, setState] = useState<State | null>(null), [selected, setSelected] = useState(""), [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [packet, setPacket] = useState<{ file: File; name: string; recipient: string; size: number } | null>(null);
  const [imEingang, setImEingang] = useState(false);
  const current = useRef(handle); current.current = handle;
  const operation = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const visible = state?.handle === handle ? state : null;
  const waehlbar = (visible?.documents || []).filter(fuerUebergabe), ausgeblendet = (visible?.documents.length || 0) - waehlbar.length;
  async function reload(scope = handle) {
    const summary = scope ? await getVaultSummary(scope) : null;
    const data = scope ? await readLocalVaultData(scope) : null;
    const incoming = await geraeteEingaenge(), outgoing = summary ? await geraeteAusgaenge(summary.vaultId) : [];
    if (mounted.current && current.current === scope) setState({ handle: scope, vaultId: summary?.vaultId || "", documents: data?.documents || [], incoming, outgoing });
  }
  useEffect(() => {
    setSelected(""); setMessage(""); setPacket(null); setImEingang(false);
    void reload(handle).catch(() => { if (current.current === handle) setMessage("Übergaben konnten nicht gelesen werden. Bitte den gewählten Speicher prüfen."); });
    // The handle is the storage boundary; other fields must not trigger a new load.
  }, [handle]);
  async function run(action: () => Promise<string>) {
    if (operation.current) return;
    operation.current = true; setBusy(true); setMessage(""); setImEingang(false); const scope = handle;
    try { const result = await action(); await reload(scope); if (mounted.current && current.current === scope) setMessage(result); }
    catch (error) { if (mounted.current && current.current === scope) setMessage(error instanceof Error ? error.message : "Die Übergabe ist noch offen. Bitte erneut versuchen."); }
    finally { operation.current = false; if (mounted.current) setBusy(false); }
  }
  async function output(file: File) {
    const result = await dateiAusgeben(file);
    return result === "abgebrochen" ? "Ausgabe abgebrochen. Du kannst sie wiederholen." : result === "gespeichert" ? "Datei gespeichert." : "Download gestartet. Bitte die Datei im Downloadordner prüfen.";
  }
  async function send(existing?: GeraeteAusgang) {
    if (!handle || !visible) throw Error("Bitte zuerst deine Akte öffnen.");
    const id = existing?.vertrag.dokumentId || selected, document = visible.documents.find(d => d.id === id);
    if (!document) throw Error("Bitte eine vorhandene Unterlage auswählen.");
    if (!fuerUebergabe(document)) throw Error("Gesundheitsunterlagen gehen nicht als unverschlüsseltes Paket hinaus. Sie kommen mit der Vollsicherung auf eigenen Speicher.");
    const stored = await readLocalDocumentFile(handle, id);
    // The vault's internal filename may contain a checksum/prefix. Transfer the
    // document's original name and type with exactly the same stored bytes.
    const file = new File([stored], document.originalName, { type: document.mimeType || stored.type, lastModified: stored.lastModified });
    const outgoing = existing || await geraeteAusgangVorbereiten(visible.vaultId, file, id, recipient, document.proUebergabe?.id || document.proBezug);
    return await output(await geraetePaket(outgoing, file)) + " Empfang noch offen: Paket als Originaldatei an genau das gewählte Gerät weitergeben.";
  }
  const schritt = (nr: number, titel: string, wo: "hier" | "dort", inhalt: React.ReactNode, aus = false) =>
    <li className={`uebergabe-schritt ort-${wo}`}><fieldset disabled={aus}>
      <legend><span className="ablauf-nr" aria-hidden="true">{nr}</span><strong>{titel}</strong><span className="uebergabe-ort">{wo === "hier" ? "Dieses Gerät" : "Anderes Gerät"}</span></legend>
      <div className="uebergabe-inhalt">{inhalt}</div>
    </fieldset></li>;
  return <section className="card pro-geraetetransport" aria-label="Übergabe zwischen Geräten">
    <span className="ui-heading-help"><h2>Eine Unterlage an ein anderes Gerät geben</h2><InfoPopover label="Unterlage an ein anderes Gerät geben erklären" text={ERKLAERUNG}/></span>
    <p className="uebergabe-hinweis" data-uebergabe-grenze>Nur eine Datei. Einträge, Fristen und Erinnerungen gehen nicht mit; ein Abgleich zwischen deinen Geräten ist geplant, noch nicht gebaut.{ausgeblendet > 0 && <> {ausgeblendet} Gesundheitsunterlage{ausgeblendet === 1 ? " ist" : "n sind"} ausgeblendet: das Paket ist nicht verschlüsselt.</>}</p>
    {!handle && <p>Zum Senden und zum Prüfen einer Rückbestätigung bitte die zugehörige Akte öffnen.</p>}
    <ol className="uebergabe-ablauf" aria-label="So geht die Übergabe">
      {schritt(1, "Unterlage wählen", "hier", <label className="uebergabe-feld"><span className="sr-only">Unterlage für das andere Gerät</span><select value={selected} onChange={e => setSelected(e.target.value)}><option value="">Unterlage wählen …</option>{waehlbar.map(d => <option key={d.id} value={d.id}>{d.originalName}</option>)}</select></label>, busy || !visible?.vaultId)}
      {schritt(2, "Paket speichern", "hier", <><label className="uebergabe-feld"><span className="sr-only">Empfänger oder Zielgerät</span><input maxLength={80} value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Für welches Gerät?" list="uebergabe-geraete"/></label><datalist id="uebergabe-geraete">{[...new Set((visible?.outgoing || []).map(e => e.rueckkanal.empfaenger).filter(Boolean))].map(n => <option key={n} value={n}/>)}</datalist>
        <button className="button secondary" disabled={!selected || !recipient.trim()} onClick={() => void run(() => send())}>Übergabepaket speichern</button></>, busy || !visible?.vaultId)}
      {schritt(3, "Senden", "hier", <span className="uebergabe-hinweis">Paket auf einem Weg deiner Wahl schicken (Datei-Post, Mail, USB …)</span>)}
      {schritt(4, "Paket öffnen", "dort", <><label className="datei-knopf button secondary">Übergabepaket öffnen<input type="file" accept=".familienakte-paket" onChange={e => {
        const file = e.target.files?.[0]; e.target.value = ""; setPacket(null);
        if (file) void run(async () => { const data = await geraetePaketLesen(file); if (mounted.current && current.current === handle) setPacket({ file, name: data.file.name, recipient: data.rueckkanal.empfaenger, size: data.file.size }); return "Paket geprüft. Bitte die Aufnahme in den Eingang bestätigen."; });
      }}/></label>
        {packet && <div className="uebergabe-vorschau"><p>{packet.name} · {packet.size.toLocaleString("de-DE")} Bytes · für: {packet.recipient}</p><button className="button primary" onClick={() => void run(async () => {
          await geraetePaketAnnehmen(packet.file); setPacket(null); window.dispatchEvent(new Event("familienakte:pro-eingang")); setImEingang(true);
          return "Dauerhaft im Eingang abgelegt. Einordnen (Bereich, Person, Frist) in der Eingangszentrale; die Einordnung vom anderen Gerät kommt nicht mit. Danach die Empfangsdatei speichern und über denselben Weg zurückgeben.";
        })}>Dauerhaft in den Eingang übernehmen</button></div>}</>, busy)}
      {schritt(5, "Empfangsdatei zurückschicken", "dort", visible?.incoming.length
        ? <>{visible.incoming.map(entry => <div key={entry.id} className="uebergabe-zeile"><span>{entry.vertrag.name} · {entry.rueckkanal.empfaenger}</span><button className="button secondary" disabled={busy} onClick={() => void run(async () => await output(geraeteQuittung(entry)) + " Bitte an die sendende Familienakte zurückgeben.")}>Empfangsdatei speichern</button></div>)}</>
        : <span className="uebergabe-hinweis">Erscheint nach Schritt 4</span>)}
      {schritt(6, "Empfang prüfen", "hier", <><label className="datei-knopf button secondary">Empfangsdatei prüfen<input type="file" accept=".familienakte-quittung" onChange={e => {
        const file = e.target.files?.[0]; e.target.value = "";
        if (file && visible) void run(async () => { await geraeteQuittungAnnehmen(file, visible.vaultId); return "Passende Rückbestätigung: Die empfangende Familienakte hat die Unterlage dauerhaft im Eingang abgelegt."; });
      }}/></label>
        {visible?.outgoing.map(entry => <div key={entry.id} className="uebergabe-zeile"><span>{entry.vertrag.name} → {entry.rueckkanal.empfaenger}: {entry.stand === "im-eingang" ? "im Eingang bestätigt" : "Empfang offen"}</span>{entry.stand === "offen" && <button className="button secondary" disabled={busy} onClick={() => void run(() => send(entry))}>Dasselbe Paket erneut speichern</button>}</div>)}</>, busy || !visible?.vaultId)}
    </ol>
    {message && <p role="status">{message}</p>}
    {imEingang && onEingang && <button type="button" className="button secondary" data-uebergabe-zum-eingang onClick={onEingang}>Zur Eingangszentrale ›</button>}
  </section>;
}
