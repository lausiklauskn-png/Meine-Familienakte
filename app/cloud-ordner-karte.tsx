/** 2.28.65: Kasten „Cloud-Ordner hereinholen“ (Block 4, getrennt von der Sicherung). Ordner, zuletzt nachgesehen,
 *  „Jetzt nachsehen“, Pakete vom Handy einlesen, „Trennen“ hinter „Mehr“. Von selbst beim Start und alle 15 Minuten. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Cloud, Package, RefreshCw } from "lucide-react";
import { CLOUD_TAKT_MS } from "../lib/cloud-ordner";
import { cloudGeraet, cloudOrdnerLesen, cloudOrdnerPruefen, cloudOrdnerTrennen, cloudOrdnerWaehlen, paketAusCloud, paketErledigt, type CloudErgebnis, type CloudOrdner, type Hereinholen } from "./cloud-ordner";
import type { LocalDocument } from "./local-vault";
import { InfoPopover } from "./ui-controls";
import { paketKopfLesen } from "./paket";
import { demoActive } from "../lib/demo-workspace";

type Notice = { kind: "success" | "error" | "info"; text: string; laeuft?: boolean } | null;
export const CLOUD_HILFE = "Cloud-Ordner hereinholen\n• Die App liest den gewählten Ordner mit allen Unterordnern – sie ändert, verschiebt und löscht dort nichts.\n• **Wird kopiert oder nur verwiesen?** Kopiert: jede neue Datei kommt als Kopie in die Eingangszentrale und nach dem Prüfen in die Akte. Fällt OneDrive weg, fehlt in der Akte nichts.\n• Der Unterordner steht als Herkunft dabei, z. B. „OneDrive › Auto › Versicherung“.\n• Geänderte Datei = neue Fassung; die bisherige bleibt in der Akte. Schon Bekanntes kommt nicht noch einmal.\n• **Warum fehlt eine Datei?** OneDrive hält Dateien oft nur „bei Bedarf“. Ordner im Explorer auf „Immer auf diesem Gerät behalten“ stellen. Was sich nicht lesen lässt, wird gemeldet.\n• **Vom Handy:** Paket teilen → OneDrive-App → in diesen Ordner. Der PC findet das Paket hier und führt es zusammen.\n• „Trennen“ beendet die Verbindung; die Akte behält alles.";

const zeit = (iso?: string | null) => { if (!iso) return "noch nie"; const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }); };
export function cloudErgebnisText(r: CloudErgebnis, name: string) {
  if (r.nichtErreichbar) return `„${name}“ ist gerade nicht erreichbar (Freigabe fehlt oder Laufwerk nicht da).`;
  const teile = [r.geholt ? `${r.geholt} Datei${r.geholt === 1 ? "" : "en"} als Kopie in die Eingangszentrale geholt` : "Nichts Neues im Cloud-Ordner"];
  if (r.weitere > 0) teile.push(`${r.weitere} weitere folgen Block für Block`);
  if (r.unlesbar.length) teile.push(`${r.unlesbar.length} ließen sich nicht lesen`);
  if (r.pakete.length) teile.push(`${r.pakete.length} Paket${r.pakete.length === 1 ? "" : "e"} vom Handy warten`);
  return `${teile.join(" · ")}.`;
}

/** Von selbst: beim Start, beim Zurückkehren und alle 15 Minuten, solange die App offen ist. */
export function useCloudOrdnerAuto(aktiv: boolean, dokumente: LocalDocument[], hereinholen: Hereinholen, onNotice: (n: Notice) => void) {
  const cb = useRef({ dokumente, hereinholen, onNotice }); cb.current = { dokumente, hereinholen, onNotice };
  useEffect(() => {
    if (!aktiv || demoActive()) return;
    let lebt = true;
    const lauf = async () => {
      if (!lebt || document.visibilityState !== "visible") return;
      try {
        const c = await cloudOrdnerLesen(); if (!c) return;
        const r = await cloudOrdnerPruefen({ mitTipp: false, dokumente: cb.current.dokumente, hereinholen: cb.current.hereinholen });
        if (r && lebt && (r.geholt || r.pakete.length > c.pakete.length)) cb.current.onNotice({ kind: "info", text: cloudErgebnisText(r, c.name) });
      } catch (e) { console.warn("Cloud-Ordner", e); }
    };
    const start = window.setTimeout(() => void lauf(), 25000);
    const takt = window.setInterval(() => void lauf(), CLOUD_TAKT_MS);
    const sichtbar = () => { if (document.visibilityState === "visible") void lauf(); };
    document.addEventListener("visibilitychange", sichtbar);
    return () => { lebt = false; window.clearTimeout(start); window.clearInterval(takt); document.removeEventListener("visibilitychange", sichtbar); };
  }, [aktiv]);
}

export function CloudOrdnerKarte({ aktiv, dokumente, hereinholen, busy, onNotice, onEingang }: {
  aktiv: boolean; dokumente: LocalDocument[]; hereinholen: Hereinholen; busy: boolean; onNotice: (n: Notice) => void; onEingang: () => void;
}) {
  const [c, setC] = useState<CloudOrdner | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const geraet = cloudGeraet();
  const laden = useCallback(async () => setC(await cloudOrdnerLesen()), []);
  useEffect(() => { void laden(); const f = () => void laden(); window.addEventListener("familienakte:cloud-ordner", f); return () => window.removeEventListener("familienakte:cloud-ordner", f); }, [laden]);
  if (demoActive()) return null;
  const nachsehen = async () => {
    setLaeuft(true);
    try {
      const r = await cloudOrdnerPruefen({ mitTipp: true, dokumente, hereinholen });
      const name = (await cloudOrdnerLesen())?.name || "Cloud-Ordner";
      if (r) onNotice({ kind: r.nichtErreichbar ? "error" : r.geholt ? "success" : "info", text: cloudErgebnisText(r, name) });
    } catch (e) { onNotice({ kind: "error", text: e instanceof Error ? e.message : "Der Cloud-Ordner konnte nicht gelesen werden." }); }
    finally { setLaeuft(false); await laden(); }
  };
  const waehlen = async () => {
    try { await cloudOrdnerWaehlen(); await laden(); await nachsehen(); }
    catch (e) { if ((e as DOMException)?.name !== "AbortError") onNotice({ kind: "error", text: e instanceof Error ? e.message : "Der Ordner konnte nicht gewählt werden." }); }
  };
  const trennen = async () => {
    if (!window.confirm("Cloud-Ordner trennen? Die Akte behält alles, was schon hereingeholt wurde. Im Ordner ändert sich nichts.")) return;
    await cloudOrdnerTrennen(); await laden(); onNotice({ kind: "info", text: "Cloud-Ordner getrennt. Die Akte behält alles." });
  };
  const paketEinlesen = async (i: number) => {
    const g = c?.pakete[i]; if (!g) return;
    try {
      const file = await paketAusCloud(g.pfad);
      // Erst das Format prüfen; ein kaputtes Paket bleibt in der Liste und wird gemeldet.
      await paketKopfLesen(file);
      window.dispatchEvent(new CustomEvent("familienakte:paket-datei", { detail: { file } }));
      await paketErledigt(g); await laden();
    } catch (e) { onNotice({ kind: "error", text: e instanceof Error ? e.message : "Das Paket konnte nicht gelesen werden." }); }
  };
  const sperre = busy || laeuft || !aktiv;
  return <article className="card security-action-card cloud-ordner-karte" data-cloud-ordner data-hilfe-ziel="cloud-ordner">
    <div className="security-card-heading"><h2>Cloud-Ordner hereinholen</h2><InfoPopover label="Cloud-Ordner hereinholen erklären" text={CLOUD_HILFE}/></div>
    <p className="fine-print">Neue Dateien aus einem Ordner (z. B. OneDrive) kommen als Kopie in die Eingangszentrale.</p>
    {!geraet.geht ? <p className="sync-message warning" data-cloud-nicht-hier>{geraet.satz}</p> : <section className="entscheid-block" data-block="cloud">
      <h3><Cloud size={17}/> {c ? `„${c.name}“` : "Welcher Ordner?"}</h3>
      <p className="entscheid-zustand" data-cloud-zustand>{c ? `Zuletzt nachgesehen: ${zeit(c.letzteSuche)}${c.wartend ? ` · ${c.wartend} warten noch` : ""}.` : "Noch kein Cloud-Ordner gewählt."}</p>
      {c && c.unlesbar.length > 0 && <p className="sync-message warning" data-cloud-unlesbar>{c.unlesbar.length} Datei{c.unlesbar.length === 1 ? "" : "en"} ließ{c.unlesbar.length === 1 ? "" : "en"} sich nicht lesen – bei OneDrive den Ordner auf „Immer auf diesem Gerät behalten“ stellen.</p>}
      {c && c.pakete.length > 0 && <div className="cloud-pakete" data-cloud-pakete>{c.pakete.map((p, i) => <p key={p.pfad} className="button-row"><Package size={16}/> <span>Paket vom Handy: {p.name}</span><button className="button secondary compact-button" disabled={sperre} onClick={() => void paketEinlesen(i)} data-cloud-paket-einlesen>Einlesen</button></p>)}</div>}
      <div className="button-row">{c
        ? <button className="button primary" disabled={sperre} onClick={() => void nachsehen()} data-cloud-nachsehen><RefreshCw size={16}/> {laeuft ? "Sieht nach …" : "Jetzt nachsehen"}</button>
        : <button className="button primary" disabled={sperre} onClick={() => void waehlen()} data-cloud-waehlen><Cloud size={16}/> Ordner wählen …</button>}
        {c && <button className="button secondary" onClick={onEingang} data-cloud-eingang>Zur Eingangszentrale</button>}</div>
      <details className="pro-tresor-mehr" data-cloud-mehr><summary>Mehr</summary>
        <p className="fine-print">{geraet.satz}</p>
        {c && <><p className="fine-print">Verbunden seit {zeit(c.verbunden)} · {Object.keys(c.bekannt).length} Dateien bekannt.</p>
          <div className="button-row"><button className="button secondary" disabled={sperre} onClick={() => void waehlen()} data-cloud-anderer>Anderen Ordner wählen …</button><button className="button secondary" disabled={sperre} onClick={() => void trennen()} data-cloud-trennen>Trennen</button></div></>}
      </details>
    </section>}
  </article>;
}
