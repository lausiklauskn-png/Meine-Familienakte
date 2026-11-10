import { ProVerbundAnschluss } from "./pro-verbund-anschluss";
import { useEffect, useState } from "react";
import { proTresor, proTresorCode, proTresorEinrichtenVerfuegbar, proTresorMeldung, proTresorVerfuegbar, type ProTresorZustand } from "./pro-tresor";
import { ProTresorWoLiegtWas, PRO_TRESOR_FACH } from "./pro-tresor-hilfe";
import { readLocalVaultData, readProDocumentVault, setProDocumentVault } from "./local-vault";
import { istProOriginal } from "./pro-tresor";
import { useResolveActivity } from "./ui-activity";
import { InfoPopover } from "./ui-controls";

const ERKLAERUNG = "Verbindet einen vorhandenen Tresor von Workflow PDF Pro, Private Brain Pro oder BookLedgerPro. Der Ordner kann im Gerät, auf SD-Karte, USB oder in einem freigegebenen Laufwerk liegen, soweit das Betriebssystem ihn freigibt. Aktenregister und kleine Arbeitsstände bleiben im bisherigen Aktenordner. Vorhandene Dateien werden nicht automatisch verschoben. Vollsicherung und Export enthalten lesbare Originale im ausdrücklich gewählten Sicherungsordner.";

/** Kleines eigenes Modul: bestehender Aktenbestand und nativer Pro-Anschluss bleiben unterscheidbar. */
export function ProTresorAnschluss({ aktenHandle = null, onChange, onDokumente }: { aktenHandle?: FileSystemDirectoryHandle | null; onChange?: () => void; onDokumente?: () => void }) {
  const resolveActivity = useResolveActivity();
  const [stand, setStand] = useState<ProTresorZustand>({ status: "getrennt" });
  const [busy, setBusy] = useState(false);
  const [meldung, setMeldung] = useState("");
  const [abgebrochen, setAbgebrochen] = useState(false);
  const [bestaetigung, setBestaetigung] = useState("");
  const [zuordnung, setZuordnung] = useState<{ handle: FileSystemDirectoryHandle | null; id: string | null }>({ handle: null, id: null });
  const ziel = zuordnung.handle === aktenHandle ? zuordnung.id : null;
  // Zahlen für „Wo liegt was?“: Unterlagen der geöffneten Akte und davon im Pro-Tresor; neu gelesen bei jeder Änderung.
  const [zahlen, setZahlen] = useState<{ gesamt: number; imTresor: number } | undefined>(undefined);
  useEffect(() => {
    if (!aktenHandle) { setZahlen(undefined); return; }
    let lebt = true;
    const lesen = () => { void readLocalVaultData(aktenHandle).then((d) => { if (lebt) setZahlen({ gesamt: d.documents.length, imTresor: d.documents.filter((x) => istProOriginal(x.storedPath)).length }); }).catch(() => { if (lebt) setZahlen(undefined); }); };
    lesen();
    for (const n of ["familienakte:pro-tresor", "familienakte:dateien", "familienakte:pro-eingang"]) window.addEventListener(n, lesen);
    return () => { lebt = false; for (const n of ["familienakte:pro-tresor", "familienakte:dateien", "familienakte:pro-eingang"]) window.removeEventListener(n, lesen); };
  }, [aktenHandle]);
  const verfuegbar = proTresorVerfuegbar();
  const einrichtenMoeglich = proTresorEinrichtenVerfuegbar();
  useEffect(() => {
    if (stand.status === "offen" && stand.id) resolveActivity("pro-tresor-anschluss");
  }, [stand.status, stand.id, resolveActivity]);
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
    finally { setBusy(false); onChange?.(); }
  }
  async function ausfuehren(aktion: "verbinden" | "einrichten" | "entsperren" | "sperren") {
    setBusy(true); setMeldung(""); setBestaetigung(""); setAbgebrochen(false);
    try {
      const antwort = await proTresor[aktion]() as ProTresorZustand | void;
      // Bestätigung erst nach erneutem Lesen des GEMERKTEN Zustands: gewählt, gespeichert, erreichbar, offen/gesperrt.
      const neu = await proTresor.zustand(); setStand(neu);
      if (aktion === "verbinden" || aktion === "einrichten") {
        const erwartet = antwort && typeof antwort === "object" ? antwort.id : undefined;
        const neuAngelegt = Boolean(antwort && typeof antwort === "object" && antwort.angelegt);
        if (neu.id && (!erwartet || neu.id === erwartet) && (neu.status === "offen" || neu.status === "gesperrt"))
          setBestaetigung(`${neuAngelegt ? "Neuer Tresor angelegt" : "Gewählt"} und gespeichert: ${neu.ort || "gewählter Ordner"} · erreichbar · ${neu.status === "offen" ? "entsperrt" : "gesperrt"} · Tresorkennung ${neu.id}. Die App merkt sich diesen Ort; nach einem Neustart wird höchstens das Passwort erneut gefragt.${neuAngelegt ? " Im Hauptordner liegt jetzt LIES-MICH.txt." : ""}`);
        else setMeldung(`Die Auswahl wurde nicht bestätigt: ${proTresorMeldung(neu.code || "") || "Der gemerkte Zustand passt nicht zur Auswahl."} Bitte den Ordner erneut wählen.`);
      }
    }
    catch (e) {
      const code = proTresorCode(e); setAbgebrochen(code === "FA_TRESOR_ABGEBROCHEN");
      const grund = proTresorMeldung(code);
      setMeldung(grund || "Der Pro-Tresor wurde nicht verbunden. Vorhandene Dateien bleiben erhalten. Bitte Ordnerfreigabe und Passwort prüfen.");
    }
    finally { setBusy(false); onChange?.(); window.dispatchEvent(new Event("familienakte:pro-tresor")); }
  }
  const text = { getrennt: "Noch nicht verbunden", offen: "Entsperrt", gesperrt: "Gesperrt", nicht_erreichbar: "Nicht erreichbar – gewählten Speicher und Ordnerfreigabe prüfen" };
  const statusText = stand.status === "nicht_erreichbar" && stand.code === "FA_TRESOR_FREMDE_KENNUNG" ? proTresorMeldung(stand.code)
    : stand.status === "nicht_erreichbar" && stand.code === "FA_TRESOR_UMGEZOGEN" ? proTresorMeldung(stand.code) : text[stand.status];
  const empfehlen = Boolean(aktenHandle && stand.status === "offen" && stand.id && ziel !== stand.id);
  return <section className="card" data-pro-tresor>
    <span className="ui-heading-help"><h3>Gemeinsamer Pro-Tresor</h3><InfoPopover label="Gemeinsamer Pro-Tresor erklären" text={ERKLAERUNG} mehr={<ProTresorWoLiegtWas open stand={verfuegbar ? stand : undefined} zahlen={zahlen} onDokumente={onDokumente}/>}/></span>
    <p role="status" data-pro-tresor-status>{statusText}</p>
    {/* Gerätetest 10.11.: ein Abbruch ist kein Fehler – nicht rot, sondern ein ruhiger Hinweis. */}
    {meldung && (abgebrochen
      ? <p role="status" className="pro-tresor-hinweis" data-pro-tresor-meldung data-abgebrochen>{meldung}</p>
      : <p role="alert" className="pro-tresor-meldung" data-pro-tresor-meldung>{meldung}</p>)}
    {stand.status === "nicht_erreichbar" && stand.ort && <p>Der gemerkte Ort bleibt gespeichert. Es wird kein anderer Speicher verwendet, bis du selbst einen anderen Tresor wählst.</p>}
    {bestaetigung && <p role="status" data-pro-tresor-bestaetigung>{bestaetigung}</p>}
    {stand.code === "FA_TRESOR_ZUSTAND_BESCHAEDIGT" && <p>Die gemerkte Verbindung ist beschädigt. Bitte den vorhandenen Pro-Tresor neu wählen. Die Tresordateien wurden nicht verändert.</p>}
    {stand.ort && <p style={{ overflowWrap: "anywhere" }}>Gewählter Ort: {stand.ort}</p>}
    {stand.id && <p>Tresorkennung: {stand.id}</p>}
    <p data-pro-ablage>{ziel ? `Neue Originale: verschlüsselt im Pro-Tresor ${ziel}.` : "Neue Originale: im bisherigen Aktenordner."}</p>
    {ziel && (!verfuegbar || stand.id !== ziel || stand.status !== "offen") && <p>Für neue Originale und vorhandene Pro-Dateien bitte den zugeordneten Pro-Tresor in der Android- oder Windows-App verbinden und entsperren. Ohne ihn wird kein Ersatzbestand angelegt.</p>}
    {verfuegbar && <div className="button-row">
      {einrichtenMoeglich
        ? <button className={stand.id ? "button secondary" : "button primary"} type="button" data-pro-tresor-einrichten disabled={busy} onClick={() => void ausfuehren("einrichten")}>{stand.id ? "Anderen Speicher wählen …" : "Tresor einrichten – nur Speicher wählen …"}</button>
        : <button className="button secondary" type="button" data-pro-tresor-verbinden disabled={busy} onClick={() => void ausfuehren("verbinden")}>{stand.id ? "Anderen Pro-Tresor wählen …" : "Vorhandenen Pro-Tresor verbinden …"}</button>}
      {stand.status === "gesperrt" && <button className="button primary" type="button" disabled={busy} onClick={() => void ausfuehren("entsperren")}>Pro-Tresor entsperren …</button>}
      {stand.status === "offen" && <button className="button secondary" type="button" disabled={busy} onClick={() => void ausfuehren("sperren")}>Pro-Tresor sperren</button>}
      {empfehlen && <button className="button primary" type="button" disabled={busy} onClick={() => void zielAendern(stand.id!)}>Neue Originale in diesem Pro-Tresor ablegen</button>}
    </div>}
    {empfehlen && <p data-pro-ablage-empfehlung><strong>Empfohlen:</strong> Neue Originale verschlüsselt im Ordner „{PRO_TRESOR_FACH}“ dieses Pro-Tresors ablegen. Vorhandene Akten bleiben, wo sie sind; du kannst jederzeit zurückwechseln.</p>}
    {aktenHandle && ziel && <button className="button secondary" type="button" disabled={busy} onClick={() => void zielAendern(null)}>Neue Originale wieder im bisherigen Aktenordner ablegen</button>}
    <ProVerbundAnschluss stand={stand}/>
    {einrichtenMoeglich && !stand.id && <p data-pro-tresor-einrichten-hinweis>Nur SD-Karte oder Gerätespeicher antippen. Die App findet einen vorhandenen Tresor selbst oder legt den Ordner „Family-Projekt“ an.</p>}
  </section>;
}
