/** 2.28.65 (Startbrief 11.11.2026): Karte „Sicherung an einem zweiten Ort“ auf der Sicherheitsseite.
 *  Gestaltung nach Klaus: je Entscheidung ein Block mit Überschrift, Zustand in einer Zeile und nur seinen Knöpfen,
 *  Wahlen als getrennte Felder, höchstens ein Hauptknopf je Block, Seltenes hinter „Mehr“, Erklärungen hinter dem „?“.
 *  Am Handy untereinander, am PC nebeneinander (CSS .entscheid-bloecke). */
import { useCallback, useEffect, useRef, useState } from "react";
import { FolderSync, HardDrive, RefreshCw, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { PASSWORT_MINDESTLAENGE, passwortPruefen } from "../lib/sicherung-krypto";
import { zustandSatz } from "../lib/zweiter-ort";
import { InfoPopover } from "./ui-controls";
import { NotfallblattDialog } from "./sicherung-dialoge";
import { geraetKann, modusAendern, ortOeffnen, ortWaehlen, zweiterOrtBeenden, zweiterOrtEinrichten, zweiterOrtLesen, zweiterOrtSichern, type LaufErgebnis, type Modus, type ZweiterOrt } from "./zweiter-ort";
import { demoActive } from "../lib/demo-workspace";

type Notice = { kind: "success" | "error" | "info"; text: string; laeuft?: boolean } | null;

export const ZWEITER_ORT_HILFE = {
  wo: "Wozu ein zweiter Ort?\n• Geht das Gerät verloren oder kaputt, liegt die Akte noch dort – z. B. im OneDrive-Ordner am PC, auf einem USB-Stick, der SD-Karte oder einem Netzordner.\n• Die App sichert von selbst, wenn sich etwas geändert hat (höchstens einmal am Tag), und mit „Jetzt sichern“.\n• **Was passiert mit älteren Sicherungen?** Am zweiten Ort bleibt genau eine (die neueste), auf dem Gerät bleiben zwei. Die neue wird erst ganz geschrieben und geprüft (Länge, SHA-256), dann wird die alte entfernt. Bricht etwas ab, bleibt die alte heil.\n• Entfernt werden nur Sicherungen, die die App selbst angelegt hat (Kennungsdatei „Zweiter_Ort.json“), nie fremde Dateien.\n• OneDrive hebt frühere Fassungen einer Datei selbst eine Zeit lang auf.\n• **Im Notfall an jedem PC:** App installieren (liegt bei Android als Datei daneben), „Sicherung einlesen“, Passwort oder Notfallblatt.",
  art: "Verschlüsselt oder lesbar?\n• **Verschlüsselt (empfohlen):** nur mit Passwort oder Notfallblatt lesbar. Richtig für Cloud-Ordner und Sticks, die mitgehen.\n• **Lesbar:** jeder, der den Ordner hat, kann alle Unterlagen öffnen – auch ohne die App. Nur für einen Speicher, der zu Hause bleibt.\n• Das Passwort wird nirgends gespeichert. Dieses Gerät merkt sich nur den Schlüssel, damit es von selbst sichern kann.\n• Notfallblatt ausdrucken und getrennt vom Gerät zu den Papieren legen.",
  modus: "Nur sichern oder synchron halten?\n• **Nur sichern:** eine Sicherung zum Zurückholen. Andere Geräte ändern daran nichts.\n• **Synchron halten:** zusätzlich die gemeinsame Festplatte im selben Ordner – andere Geräte mit demselben Passwort gleichen darüber ab, in beide Richtungen, verschlüsselt. Bei Unterschieden fragt die App.\n• Die Sicherung läuft in beiden Fällen mit, damit ein Fehler im Abgleich nie alles mitreißt.",
};

const zeit = (iso?: string | null) => { if (!iso) return "–"; const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }); };

export function ergebnisText(r: LaufErgebnis, name: string) {
  const teile: string[] = [];
  teile.push(r.zweit.ok ? `Sicherung in „${name}“ erstellt und geprüft${r.zweit.entfernt ? `, ${r.zweit.entfernt} ältere entfernt` : ""}.` : `Zweiter Ort: ${r.zweit.grund}`);
  teile.push(r.geraet.ok ? "Auf dem Gerät: neu geschrieben und geprüft." : `Auf dem Gerät: ${r.geraet.grund}`);
  return teile.join(" ");
}

/** Läuft im Hintergrund der ganzen App: beim Start, beim Zurückkehren und alle 30 Minuten nachsehen, ob eine Sicherung fällig ist. */
export function useZweiterOrtAuto(akte: FileSystemDirectoryHandle | null, appVersion: string, onNotice: (n: Notice) => void, ohne?: () => Promise<ReadonlySet<string> | undefined>) {
  const cb = useRef({ onNotice, ohne }); cb.current = { onNotice, ohne };
  useEffect(() => {
    if (!akte || demoActive()) return;
    let lebt = true;
    const lauf = async () => {
      if (!lebt || document.visibilityState !== "visible") return;
      try {
        const z = await zweiterOrtLesen(); if (!z) return;
        const r = await zweiterOrtSichern(akte, appVersion, { auto: true, ohne: await cb.current.ohne?.() });
        if (r && lebt) cb.current.onNotice({ kind: r.zweit.ok ? "info" : "error", text: `Selbsttätige Sicherung: ${ergebnisText(r, z.name)}` });
      } catch (e) { console.warn("Zweiter Ort", e); }
    };
    const start = window.setTimeout(() => void lauf(), 20000);
    const takt = window.setInterval(() => void lauf(), 30 * 60 * 1000);
    const sichtbar = () => { if (document.visibilityState === "visible") void lauf(); };
    document.addEventListener("visibilitychange", sichtbar);
    return () => { lebt = false; window.clearTimeout(start); window.clearInterval(takt); document.removeEventListener("visibilitychange", sichtbar); };
  }, [akte, appVersion]);
}

function Wahl<T extends string>({ name, wert, optionen, onWahl, gesperrt }: { name: string; wert: T; optionen: Array<{ wert: T; titel: string; satz: string; icon: React.ReactNode }>; onWahl: (w: T) => void; gesperrt?: boolean }) {
  return <div className="sicherung-arten wahl-felder" role="radiogroup">{optionen.map((o) =>
    <label key={o.wert} className={`sicherung-art${wert === o.wert ? " gewaehlt" : ""}`} data-wahl={`${name}-${o.wert}`}>
      <input type="radio" name={name} checked={wert === o.wert} disabled={gesperrt} onChange={() => onWahl(o.wert)}/>{o.icon}<span><strong>{o.titel}</strong><small>{o.satz}</small></span>
    </label>)}</div>;
}

export function ZweiterOrtKarte({ akte, appVersion, busy, onBusy, onNotice, onDrucken, ohne }: {
  akte: FileSystemDirectoryHandle | null; appVersion: string; busy: boolean; onBusy: (b: boolean) => void; onNotice: (n: Notice) => void; onDrucken: () => void;
  ohne?: () => Promise<ReadonlySet<string> | undefined>;
}) {
  const [z, setZ] = useState<ZweiterOrt | null>(null);
  const [geladen, setGeladen] = useState(false);
  const [art, setArt] = useState<"verschluesselt" | "lesbar">("verschluesselt");
  const [modus, setModus] = useState<Modus>("sichern");
  const [pw, setPw] = useState<{ zweck: "einrichten" | "synchron"; handle?: FileSystemDirectoryHandle } | null>(null);
  const [notfall, setNotfall] = useState<{ notfall: string; ordner: string; erstellt: string } | null>(null);
  const kann = geraetKann();
  const laden = useCallback(async () => { const w = await zweiterOrtLesen(); setZ(w); if (w) { setArt(w.verschluesselt ? "verschluesselt" : "lesbar"); setModus(w.modus); } setGeladen(true); }, []);
  useEffect(() => { void laden(); const f = () => void laden(); window.addEventListener("familienakte:zweiter-ort", f); return () => window.removeEventListener("familienakte:zweiter-ort", f); }, [laden]);
  if (demoActive()) return null;

  const fehler = (e: unknown, text: string) => { if ((e as DOMException)?.name !== "AbortError") onNotice({ kind: "error", text: e instanceof Error ? e.message : text }); };
  const sichern = async (zz: ZweiterOrt) => {
    if (!akte) { onNotice({ kind: "error", text: "Bitte zuerst den Datentresor verbinden." }); return; }
    onBusy(true); onNotice({ kind: "info", laeuft: true, text: "Sicherung läuft: jede Datei wird geschrieben, zurückgelesen und per Prüfsumme bestätigt." });
    try { const r = await zweiterOrtSichern(akte, appVersion, { auto: false, ohne: await ohne?.() }); if (r) onNotice({ kind: r.zweit.ok ? "success" : "error", text: ergebnisText(r, zz.name) }); else onNotice({ kind: "info", text: "Es läuft schon eine Sicherung." }); }
    catch (e) { fehler(e, "Die Sicherung ist nicht gelungen."); }
    finally { onBusy(false); await laden(); }
  };
  const einrichtenLos = async (handle: FileSystemDirectoryHandle, passwort: string | null) => {
    onBusy(true);
    try {
      const r = await zweiterOrtEinrichten({ handle, verschluesselt: art === "verschluesselt", passwort, modus, appVersion });
      await laden();
      onNotice({ kind: "success", text: `Zweiter Ort „${r.ort.name}“ eingerichtet.${r.synchronHinweis ? ` ${r.synchronHinweis}` : ""} Die erste Sicherung startet jetzt.` });
      if (r.notfall) setNotfall({ notfall: r.notfall, ordner: r.ort.name, erstellt: r.ort.angelegt });
      onBusy(false);
      await sichern(r.ort);
    } catch (e) { fehler(e, "Der zweite Ort konnte nicht eingerichtet werden."); }
    finally { onBusy(false); }
  };
  const ortNeu = async () => {
    try {
      const handle = await ortWaehlen();
      if (art === "verschluesselt" || modus === "synchron") setPw({ zweck: "einrichten", handle });
      else await einrichtenLos(handle, null);
    } catch (e) { fehler(e, "Der Ordner konnte nicht gewählt werden."); }
  };
  // Wahl ändern, wenn schon eingerichtet: Art braucht eine neue Einrichtung am selben Ort, Modus nur das Passwort für „Synchron“.
  const artWaehlen = async (neu: "verschluesselt" | "lesbar") => {
    setArt(neu); if (!z || (neu === "verschluesselt") === z.verschluesselt) return;
    if (neu === "lesbar" && z.modus === "synchron") { setArt("verschluesselt"); onNotice({ kind: "info", text: "„Synchron halten“ ist immer verschlüsselt. Erst „Nur sichern“ wählen." }); return; }
    const handle = await ortOeffnen(z, true); if (!handle) { setArt(z.verschluesselt ? "verschluesselt" : "lesbar"); onNotice({ kind: "error", text: `„${z.name}“ ist gerade nicht erreichbar.` }); return; }
    if (neu === "verschluesselt") setPw({ zweck: "einrichten", handle }); else await einrichtenLos(handle, null);
  };
  const modusWaehlen = async (neu: Modus) => {
    setModus(neu); if (!z || neu === z.modus) return;
    if (neu === "synchron") { if (!z.verschluesselt) { setArt("verschluesselt"); const handle = await ortOeffnen(z, true); if (handle) setPw({ zweck: "einrichten", handle }); else { setModus(z.modus); onNotice({ kind: "error", text: `„${z.name}“ ist gerade nicht erreichbar.` }); } return; } setPw({ zweck: "synchron" }); return; }
    onBusy(true);
    try { const r = await modusAendern("sichern", null, appVersion); await laden(); onNotice({ kind: "success", text: r.hinweis }); } catch (e) { fehler(e, "Die Wahl konnte nicht geändert werden."); setModus(z.modus); } finally { onBusy(false); }
  };
  const pwLos = async (passwort: string) => {
    const p = pw; setPw(null); if (!p) return;
    if (p.zweck === "einrichten" && p.handle) { await einrichtenLos(p.handle, passwort); return; }
    onBusy(true);
    try { const r = await modusAendern("synchron", passwort, appVersion); await laden(); onNotice({ kind: "success", text: r.hinweis }); }
    catch (e) { fehler(e, "„Synchron halten“ konnte nicht eingerichtet werden."); if (z) setModus(z.modus); }
    finally { onBusy(false); }
  };
  const beenden = async () => {
    if (!window.confirm("Zweiten Ort beenden? Die Sicherungen dort bleiben liegen; dieses Gerät sichert nur nicht mehr dorthin.")) return;
    await zweiterOrtBeenden(); await laden(); onNotice({ kind: "info", text: "Zweiter Ort beendet. Die Sicherungen dort bleiben erhalten." });
  };

  const satz = zustandSatz({ eingerichtet: Boolean(z), name: z?.name, letzte: z?.letzte || null, letzteGelungen: z?.letzteGelungen || null, jetzt: Date.now() });
  const fehlerZustand = Boolean(z?.letzte && !z.letzte.ok);
  return <article className="card security-action-card zweiter-ort-karte" data-zweiter-ort data-hilfe-ziel="zweiter-ort">
    <div className="security-card-heading"><h2>Sicherung an einem zweiten Ort</h2><InfoPopover label="Sicherung an einem zweiten Ort erklären" text={ZWEITER_ORT_HILFE.wo}/></div>
    <p className="fine-print">Von selbst, wenn sich etwas geändert hat – und auf Knopf.</p>
    {!kann.ordner ? <p className="sync-message warning" data-zweiter-ort-nicht-hier>{kann.satz}</p> : <div className="entscheid-bloecke">
      <section className="entscheid-block" data-block="wo">
        <h3><HardDrive size={17}/> Wo liegt die zweite Sicherung?</h3>
        <p className={`entscheid-zustand${fehlerZustand ? " warnung" : z?.letzteGelungen ? " gut" : ""}`} data-zweiter-ort-zustand>{geladen ? satz : "…"}</p>
        {z?.geraet?.letzte && <p className="fine-print" data-zweiter-ort-geraet>Auf dem Gerät: {z.geraet.letzte.ok ? `zuletzt ${zeit(z.geraet.letzte.zeit)} (zwei werden aufbewahrt)` : z.geraet.letzte.grund}</p>}
        <div className="button-row">{z
          ? <button className="button primary" disabled={busy || !akte} onClick={() => void sichern(z)} data-zweiter-ort-jetzt><RefreshCw size={16}/> Jetzt sichern</button>
          : <button className="button primary" disabled={busy || !akte} onClick={() => void ortNeu()} data-zweiter-ort-waehlen><HardDrive size={16}/> Ort wählen …</button>}</div>
        {z && <details className="pro-tresor-mehr" data-zweiter-ort-mehr><summary>Mehr</summary>
          <p className="fine-print">Eingerichtet {zeit(z.angelegt)}{z.letzteGelungen ? ` · letzte Sicherung „${z.letzteGelungen.ordner}“` : ""}.</p>
          <div className="button-row"><button className="button secondary" disabled={busy} onClick={() => void ortNeu()} data-zweiter-ort-anderer>Anderen Ort wählen …</button><button className="button secondary" disabled={busy} onClick={() => void beenden()} data-zweiter-ort-beenden>Zweiten Ort beenden</button></div>
        </details>}
      </section>
      <section className="entscheid-block" data-block="art">
        <span className="ui-heading-help"><h3><ShieldCheck size={17}/> Verschlüsselt oder lesbar?</h3><InfoPopover label="Verschlüsselt oder lesbar erklären" text={ZWEITER_ORT_HILFE.art}/></span>
        <Wahl name="zweiter-ort-art" wert={art} gesperrt={busy} onWahl={(w) => void artWaehlen(w)} optionen={[
          { wert: "verschluesselt", titel: "Verschlüsselt (empfohlen)", satz: "Nur mit Passwort oder Notfallblatt lesbar.", icon: <ShieldCheck size={18}/> },
          { wert: "lesbar", titel: "Lesbar", satz: "Unterlagen liegen offen beim Speicherort.", icon: <TriangleAlert size={18}/> },
        ]}/>
      </section>
      <section className="entscheid-block" data-block="modus">
        <span className="ui-heading-help"><h3><FolderSync size={17}/> Nur sichern oder synchron halten?</h3><InfoPopover label="Nur sichern oder synchron halten erklären" text={ZWEITER_ORT_HILFE.modus}/></span>
        <Wahl name="zweiter-ort-modus" wert={modus} gesperrt={busy} onWahl={(w) => void modusWaehlen(w)} optionen={[
          { wert: "sichern", titel: "Nur sichern", satz: "Eine Sicherung zum Zurückholen.", icon: <HardDrive size={18}/> },
          { wert: "synchron", titel: "Synchron halten", satz: "Andere Geräte gleichen über den Ordner ab.", icon: <FolderSync size={18}/> },
        ]}/>
        {modus === "synchron" && z?.modus === "synchron" && <p className="fine-print" data-zweiter-ort-synchron>Abgleich unter „Gemeinsame Festplatte“ – die Sicherung läuft trotzdem mit.</p>}
      </section>
    </div>}
    {pw && <PasswortNeuDialog synchron={pw.zweck === "synchron"} onLos={(p) => void pwLos(p)} onClose={() => { setPw(null); if (z) { setArt(z.verschluesselt ? "verschluesselt" : "lesbar"); setModus(z.modus); } }}/>}
    {notfall && <NotfallblattDialog notfall={notfall.notfall} ordner={notfall.ordner} erstellt={notfall.erstellt} appVersion={appVersion} onDrucken={onDrucken} onClose={() => setNotfall(null)}/>}
  </article>;
}

/** Neues Passwort (zweimal) – oder bei „Synchron halten“ das vorhandene Passwort der Sicherung (einmal). */
function PasswortNeuDialog({ synchron, onLos, onClose }: { synchron: boolean; onLos: (pw: string) => void; onClose: () => void }) {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [zeigen, setZeigen] = useState(false); const [f, setF] = useState("");
  const los = () => {
    if (synchron) { if (!pw) { setF("Bitte das Passwort eingeben."); return; } onLos(pw); return; }
    const e = passwortPruefen(pw); if (e) { setF(e); return; }
    if (pw !== pw2) { setF("Die beiden Eingaben stimmen nicht überein."); return; }
    onLos(pw);
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="zweiter-ort-pw" data-zweiter-ort-passwort>
      <div className="modal-head"><div><span className="badge">Zweiter Ort</span><h2 id="zweiter-ort-pw">{synchron ? "Passwort der Sicherung" : "Passwort für die Sicherung"}</h2></div><button className="icon-button" onClick={onClose} aria-label="Fenster schließen"><X/></button></div>
      <div className="form-grid">
        <label>{synchron ? "Passwort" : `Passwort (mindestens ${PASSWORT_MINDESTLAENGE} Zeichen)`}<input type={zeigen ? "text" : "password"} value={pw} autoComplete={synchron ? "current-password" : "new-password"} onChange={(e) => { setPw(e.target.value); setF(""); }} data-passwort/></label>
        {!synchron && <label>Passwort wiederholen<input type={zeigen ? "text" : "password"} value={pw2} autoComplete="new-password" onChange={(e) => { setPw2(e.target.value); setF(""); }} data-passwort-wieder/></label>}
        <label className="checkbox-row"><input type="checkbox" checked={zeigen} onChange={(e) => setZeigen(e.target.checked)}/> Passwort anzeigen</label>
        {!synchron && <p className="fine-print">Wird nirgends gespeichert. Danach kommt das Notfallblatt.</p>}
      </div>
      {f && <p className="form-error">{f}</p>}
      <div className="modal-actions"><button className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary" onClick={los} data-zweiter-ort-pw-los>Weiter</button></div>
    </div>
  </div>;
}
