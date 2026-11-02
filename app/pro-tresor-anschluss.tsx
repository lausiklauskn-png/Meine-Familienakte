import { useEffect, useState } from "react";
import { proTresor, proTresorVerfuegbar, type ProTresorZustand } from "./pro-tresor";
import { readProDocumentVault, setProDocumentVault } from "./local-vault";

/** Kleines eigenes Modul: bestehender Aktenbestand und nativer Pro-Anschluss bleiben unterscheidbar. */
export function ProTresorAnschluss({ aktenHandle = null }: { aktenHandle?: FileSystemDirectoryHandle | null }) {
  const [stand, setStand] = useState<ProTresorZustand>({ status: "getrennt" });
  const [busy, setBusy] = useState(false);
  const [meldung, setMeldung] = useState("");
  const [zuordnung, setZuordnung] = useState<{ handle: FileSystemDirectoryHandle | null; id: string | null }>({ handle: null, id: null });
  const ziel = zuordnung.handle === aktenHandle ? zuordnung.id : null;
  const verfuegbar = proTresorVerfuegbar();
  useEffect(() => {
    let lebt = true;
    if (aktenHandle) void readProDocumentVault(aktenHandle).then((id) => { if (lebt) setZuordnung({ handle: aktenHandle, id }); }).catch(() => { if (lebt) setMeldung("Die gespeicherte Dokumentablage konnte nicht gelesen werden."); });
    return () => { lebt = false; };
  }, [aktenHandle]);
  useEffect(() => {
    if (!verfuegbar) return;
    let lebt = true;
    const lesen = () => { void proTresor.zustand().then((s) => { if (lebt) setStand(s); }).catch(() => { if (lebt) setMeldung("Pro-Tresor derzeit nicht erreichbar."); }); };
    lesen();
    const sichtbar = () => { if (document.visibilityState === "visible") lesen(); };
    document.addEventListener("visibilitychange", sichtbar);
    return () => { lebt = false; document.removeEventListener("visibilitychange", sichtbar); };
  }, [verfuegbar]);
  if (!verfuegbar && !ziel) return null;
  async function zielAendern(id: string | null) {
    if (!aktenHandle) return;
    setBusy(true); setMeldung("");
    try { await setProDocumentVault(aktenHandle, id); setZuordnung({ handle: aktenHandle, id: await readProDocumentVault(aktenHandle) }); }
    catch (e) { setMeldung(e instanceof Error ? e.message : "Die neue Dokumentablage wurde nicht gespeichert."); }
    finally { setBusy(false); }
  }
  async function ausfuehren(aktion: "verbinden" | "entsperren" | "sperren") {
    setBusy(true); setMeldung("");
    try { await proTresor[aktion](); setStand(await proTresor.zustand()); }
    catch { setMeldung("Der Pro-Tresor wurde nicht verbunden. Vorhandene Dateien bleiben erhalten. Bitte Ordnerfreigabe und Passwort prüfen."); }
    finally { setBusy(false); }
  }
  const text = { getrennt: "Noch nicht verbunden", offen: "Entsperrt", gesperrt: "Gesperrt", nicht_erreichbar: "Nicht erreichbar – gewählten Speicher und Ordnerfreigabe prüfen" };
  return <section className="card" data-pro-tresor>
    <h3>Gemeinsamer Pro-Tresor</h3>
    <p>Vorhandenen Tresor von Workflow PDF Pro, Private Brain Pro oder BookLedgerPro verbinden. Der Ordner kann im Gerät, auf SD-Karte, USB oder in einem freigegebenen Laufwerk liegen, soweit das Betriebssystem ihn freigibt.</p>
    <p role="status">{text[stand.status]}</p>
    {stand.code === "FA_TRESOR_ZUSTAND_BESCHAEDIGT" && <p>Die gemerkte Verbindung ist beschädigt. Bitte den vorhandenen Pro-Tresor neu wählen. Die Tresordateien wurden nicht verändert.</p>}
    {stand.ort && <p style={{ overflowWrap: "anywhere" }}>Gewählter Ort: {stand.ort}</p>}
    {stand.id && <p>Tresorkennung: {stand.id}</p>}
    <p data-pro-ablage>{ziel ? `Neue Originale dieses Akten-Arbeitsstands liegen verschlüsselt im Pro-Tresor ${ziel}.` : "Neue Originale werden weiterhin im bisherigen Aktenordner abgelegt."}</p>
    <p>Aktenregister und kleine Arbeitsstände bleiben im bisherigen Aktenordner. Vorhandene Dateien werden nicht automatisch verschoben. Vollsicherung und Export enthalten lesbare Originale im ausdrücklich gewählten Sicherungsordner.</p>
    {ziel && (!verfuegbar || stand.id !== ziel || stand.status !== "offen") && <p>Für neue Originale und vorhandene Pro-Dateien bitte den zugeordneten Pro-Tresor in der Android- oder Windows-App verbinden und entsperren. Ohne ihn wird kein Ersatzbestand angelegt.</p>}
    {verfuegbar && <div className="button-row">
      <button className="button secondary" type="button" disabled={busy} onClick={() => void ausfuehren("verbinden")}>{stand.id ? "Anderen Pro-Tresor wählen …" : "Vorhandenen Pro-Tresor verbinden …"}</button>
      {stand.status === "gesperrt" && <button className="button primary" type="button" disabled={busy} onClick={() => void ausfuehren("entsperren")}>Pro-Tresor entsperren …</button>}
      {stand.status === "offen" && <button className="button secondary" type="button" disabled={busy} onClick={() => void ausfuehren("sperren")}>Pro-Tresor sperren</button>}
      {aktenHandle && stand.status === "offen" && stand.id && ziel !== stand.id && <button className="button primary" type="button" disabled={busy} onClick={() => void zielAendern(stand.id!)}>Neue Originale in diesem Pro-Tresor ablegen</button>}
    </div>}
    {aktenHandle && ziel && <button className="button secondary" type="button" disabled={busy} onClick={() => void zielAendern(null)}>Neue Originale wieder im bisherigen Aktenordner ablegen</button>}
    {meldung && <p role="alert">{meldung}</p>}
  </section>;
}
