import { useEffect, useState } from "react";
import { proTresor, proTresorVerfuegbar, type ProTresorZustand } from "./pro-tresor";

/** Kleines eigenes Modul: bestehender Aktenbestand und nativer Pro-Anschluss bleiben unterscheidbar. */
export function ProTresorAnschluss() {
  const [stand, setStand] = useState<ProTresorZustand>({ status: "getrennt" });
  const [busy, setBusy] = useState(false);
  const [meldung, setMeldung] = useState("");
  const verfuegbar = proTresorVerfuegbar();
  useEffect(() => {
    if (!verfuegbar) return;
    let lebt = true;
    const lesen = () => { void proTresor.zustand().then((s) => { if (lebt) setStand(s); }).catch(() => { if (lebt) setMeldung("Pro-Tresor derzeit nicht erreichbar."); }); };
    lesen();
    const sichtbar = () => { if (document.visibilityState === "visible") lesen(); };
    document.addEventListener("visibilitychange", sichtbar);
    return () => { lebt = false; document.removeEventListener("visibilitychange", sichtbar); };
  }, [verfuegbar]);
  if (!verfuegbar) return null;
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
    {stand.ort && <p style={{ overflowWrap: "anywhere" }}>Gewählter Ort: {stand.ort}</p>}
    {stand.id && <p>Tresorkennung: {stand.id}</p>}
    <p>Dieser erste Anschluss prüft Ort und Entsperren. Die bisherige Dokumentablage wird noch nicht umgestellt; es werden keine bestehenden Dateien verschoben.</p>
    <div className="button-row">
      <button className="button secondary" type="button" disabled={busy} onClick={() => void ausfuehren("verbinden")}>{stand.id ? "Anderen Pro-Tresor wählen …" : "Vorhandenen Pro-Tresor verbinden …"}</button>
      {stand.status === "gesperrt" && <button className="button primary" type="button" disabled={busy} onClick={() => void ausfuehren("entsperren")}>Pro-Tresor entsperren …</button>}
      {stand.status === "offen" && <button className="button secondary" type="button" disabled={busy} onClick={() => void ausfuehren("sperren")}>Pro-Tresor sperren</button>}
    </div>
    {meldung && <p role="alert">{meldung}</p>}
  </section>;
}
