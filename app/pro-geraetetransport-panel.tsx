import { useEffect, useRef, useState } from "react";
import { getVaultSummary, readLocalDocumentFile, readLocalVaultData, type LocalDocument } from "./local-vault";
import { dateiAusgeben } from "./dateiausgabe";
import { geraeteAusgaenge, geraeteAusgangVorbereiten, geraeteEingaenge, geraetePaket, geraetePaketAnnehmen, geraetePaketLesen, geraeteQuittung, geraeteQuittungAnnehmen, type GeraeteAusgang, type GeraeteEingang } from "./pro-geraetetransport";

type State = { handle: FileSystemDirectoryHandle | null; vaultId: string; documents: LocalDocument[]; outgoing: GeraeteAusgang[]; incoming: GeraeteEingang[] };
export function ProGeraetetransportPanel({ handle }: { handle: FileSystemDirectoryHandle | null }) {
  const [state, setState] = useState<State | null>(null), [selected, setSelected] = useState(""), [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [packet, setPacket] = useState<{ file: File; name: string; recipient: string; size: number } | null>(null);
  const current = useRef(handle); current.current = handle;
  const operation = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const visible = state?.handle === handle ? state : null;
  async function reload(scope = handle) {
    const summary = scope ? await getVaultSummary(scope) : null;
    const data = scope ? await readLocalVaultData(scope) : null;
    const incoming = await geraeteEingaenge(), outgoing = summary ? await geraeteAusgaenge(summary.vaultId) : [];
    if (mounted.current && current.current === scope) setState({ handle: scope, vaultId: summary?.vaultId || "", documents: data?.documents || [], incoming, outgoing });
  }
  useEffect(() => {
    setSelected(""); setMessage(""); setPacket(null);
    void reload(handle).catch(() => { if (current.current === handle) setMessage("Übergaben konnten nicht gelesen werden. Bitte den gewählten Speicher prüfen."); });
    // The handle is the storage boundary; other fields must not trigger a new load.
  }, [handle]);
  async function run(action: () => Promise<string>) {
    if (operation.current) return;
    operation.current = true; setBusy(true); setMessage(""); const scope = handle;
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
    const file = await readLocalDocumentFile(handle, id);
    const outgoing = existing || await geraeteAusgangVorbereiten(visible.vaultId, file, id, recipient, document.proUebergabe?.id || document.proBezug);
    return await output(await geraetePaket(outgoing, file)) + " Empfang noch offen: Paket als Originaldatei an genau das gewählte Gerät weitergeben.";
  }
  return <section className="card pro-geraetetransport" aria-label="Übergabe zwischen Geräten">
    <h2>Eine Unterlage an ein anderes Gerät geben</h2>
    <p>Speichere ein Paket und sende es in deinem vorhandenen Kim-sync-Raum über 📎 als Datei oder über Datei-Post. Die empfangende Familienakte öffnet das Paket hier und gibt eine Empfangsdatei zurück. Es entsteht kein neuer Raum.</p>
    <p>Das Paket enthält die lesbare Originaldatei. Kim-sync und Datei-Post verschlüsseln erst beim Senden. Wähle für jedes Paket genau einen Empfänger; für weitere Empfänger ein eigenes Paket. Die Empfangsdatei bestätigt dieses Paket, keine geprüfte Identität.</p>
    <fieldset disabled={busy || !visible?.vaultId}>
      <legend>Aus deiner geöffneten Akte</legend>
      <label>Unterlage für das andere Gerät<select value={selected} onChange={e => setSelected(e.target.value)}><option value="">Bitte wählen …</option>{visible?.documents.map(d => <option key={d.id} value={d.id}>{d.originalName}</option>)}</select></label>
      <label>Empfänger oder Zielgerät<input maxLength={80} value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="z. B. mein Windows-PC"/></label>
      <button className="button secondary" disabled={!selected || !recipient.trim()} onClick={() => void run(() => send())}>Übergabepaket speichern</button>
    </fieldset>
    {!handle && <p>Zum Senden und zum Prüfen einer Rückbestätigung bitte die zugehörige Akte öffnen.</p>}
    <fieldset disabled={busy}>
      <legend>Auf dem empfangenden Gerät</legend>
      <label>Übergabepaket öffnen<input type="file" accept=".familienakte-paket" onChange={e => {
        const file = e.target.files?.[0]; e.target.value = ""; setPacket(null);
        if (file) void run(async () => { const data = await geraetePaketLesen(file); if (mounted.current && current.current === handle) setPacket({ file, name: data.file.name, recipient: data.rueckkanal.empfaenger, size: data.file.size }); return "Paket geprüft. Bitte die Aufnahme in den Eingang bestätigen."; });
      }}/></label>
      {packet && <div><p>{packet.name} · {packet.size.toLocaleString("de-DE")} Bytes · vorgesehen für: {packet.recipient}</p><button className="button primary" onClick={() => void run(async () => {
        await geraetePaketAnnehmen(packet.file); setPacket(null); window.dispatchEvent(new Event("familienakte:pro-eingang"));
        return "Dauerhaft im Eingang abgelegt. Bitte die Empfangsdatei speichern und über denselben Weg zurückgeben. Die Einordnung in die Akte folgt getrennt.";
      })}>Dauerhaft in den Eingang übernehmen</button></div>}
    </fieldset>
    {visible?.incoming.map(entry => <div key={entry.id} className="card"><p>{entry.vertrag.name}: im Eingang bestätigt · {entry.rueckkanal.empfaenger}</p><button className="button secondary" disabled={busy} onClick={() => void run(async () => await output(geraeteQuittung(entry)) + " Bitte an die sendende Familienakte zurückgeben.")}>Empfangsdatei speichern</button></div>)}
    <fieldset disabled={busy || !visible?.vaultId}>
      <legend>Zurück auf dem sendenden Gerät</legend>
      <label>Empfangsdatei prüfen<input type="file" accept=".familienakte-quittung" onChange={e => {
        const file = e.target.files?.[0]; e.target.value = "";
        if (file && visible) void run(async () => { await geraeteQuittungAnnehmen(file, visible.vaultId); return "Passende Rückbestätigung: Die empfangende Familienakte hat die Unterlage dauerhaft im Eingang abgelegt."; });
      }}/></label>
    </fieldset>
    {visible?.outgoing.map(entry => <div key={entry.id} className="card"><p>{entry.vertrag.name} → {entry.rueckkanal.empfaenger}: {entry.stand === "im-eingang" ? "im Eingang bestätigt" : "Empfang offen"}</p>{entry.stand === "offen" && <button className="button secondary" disabled={busy} onClick={() => void run(() => send(entry))}>Dasselbe Paket erneut speichern</button>}</div>)}
    {message && <p role="status">{message}</p>}
  </section>;
}
