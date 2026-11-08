import { Bell, BellOff, Check, Eye } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { workspaceStorage } from "../lib/demo-workspace.ts";
import type { FamilyRecordUnion, FamilyRelation } from "../lib/family-data-model";
import { faelligeGlocken, glockenZeiten, naechsteGlocke, type GlockenZeit } from "../lib/glocke";
import { ERINNERUNG_VORGABE, erinnerungsName, type ErinnerungsWahl } from "../lib/kalender";
import { useKalenderEinst } from "./kalender-karte";
import { kalenderEinstLesen } from "./kalender-abgleich";
import { FlachText } from "./flach-zeile";

/* ---------- App-Glocke ---------- */
const GLOCKE_KEY = "familienakte.glocke.v1";
type GlockeStand = { an: boolean; seit: number; geläutet: string[]; dauer?: Dauer };
/** Wie lange die Glocke in der App läutet (Klaus 2026-11-06): einmal, 30 s oder bis „OK“ (höchstens 2 min). */
export type Dauer = "einmal" | "30s" | "bisOk";
const DAUER_MS: Record<Dauer, number> = { einmal: 0, "30s": 30000, bisOk: 120000 };
/** Ab Werk (Entscheidung 2026-11-08): an, solange kein Kalender verbunden ist; eine eigene Wahl gilt danach immer. */
const START = Date.now();
function glockeLesen(): GlockeStand { try { const s = JSON.parse(workspaceStorage.getItem(GLOCKE_KEY) || "null"); if (s && typeof s.an === "boolean") return { an: s.an, seit: Number(s.seit) || 0, geläutet: Array.isArray(s.geläutet) ? s.geläutet.slice(-200) : [], dauer: ["einmal", "30s", "bisOk"].includes(s.dauer) ? s.dauer : "einmal" }; } catch { /* leer */ } return { an: !kalenderEinstLesen(), seit: START, geläutet: [] }; }
function glockeSchreiben(s: GlockeStand) { try { workspaceStorage.setItem(GLOCKE_KEY, JSON.stringify(s)); } catch { /* ohne Speicher geht es weiter */ } window.dispatchEvent(new Event(GLOCKE_KEY)); }
/** Android: eigener Baustein plant die Glocken als Benachrichtigung, auch bei geschlossener App (Klaus 2026-11-06). */
type GlockePlugin = { einstellungen?: () => Promise<void>; erlauben: () => Promise<{ erlaubt: boolean }>; planen: (o: { glocken: Array<{ titel: string; text: string; um: number }>; aus?: boolean }) => Promise<{ geplant: number; erlaubt: boolean }> };
function glockePlugin(): GlockePlugin | null {
  // Nur die Android-Hülle registriert den Baustein; im Browser und unter Windows fehlt er.
  return (window as unknown as { Capacitor?: { Plugins?: { FamilienakteGlocke?: GlockePlugin } } }).Capacitor?.Plugins?.FamilienakteGlocke || null;
}

/** Schaltet die Glocke ein, falls sie aus ist (z. B. beim Speichern einer Notiz mit Erinnerung). */
/** Für die Ordnung der Hilfe: ist die App-Glocke an? */
export function glockeIstAn() { return glockeLesen().an; }
function glockeGespeichert() { try { return Boolean(workspaceStorage.getItem(GLOCKE_KEY)); } catch { return false; } }
export function glockeEinschalten() {
  const s = glockeLesen();
  if (s.an && glockeGespeichert()) return;
  glockeSchreiben({ ...s, an: true, seit: Date.now() });
  void glockePlugin()?.erlauben().catch(() => undefined);
  try { if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission(); } catch { /* nicht überall */ }
}

function useGlocke() { const [s, setS] = useState(glockeLesen); useEffect(() => { const l = () => setS(glockeLesen()); window.addEventListener(GLOCKE_KEY, l); return () => window.removeEventListener(GLOCKE_KEY, l); }, []); return s; }

function ton() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext; if (!Ctx) return;
    const c = new Ctx(); const t = c.currentTime;
    [0, 0.35, 0.7].forEach((ab, i) => { const o = c.createOscillator(); const g = c.createGain(); o.frequency.value = i === 1 ? 660 : 880; g.gain.setValueAtTime(0.0001, t + ab); g.gain.exponentialRampToValueAtTime(0.25, t + ab + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + ab + 0.3); o.connect(g).connect(c.destination); o.start(t + ab); o.stop(t + ab + 0.32); });
    window.setTimeout(() => void c.close(), 1500);
  } catch { /* ohne Ton */ }
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* ohne Vibration */ }
}

/** Schalter „App-Glocke“ (ab Werk an, solange kein Kalender verbunden ist; mit Kalender erinnert dieser). */
export function GlockenSchalter({ records = [], relations = [], kurz = false }: { records?: FamilyRecordUnion[]; relations?: FamilyRelation[]; kurz?: boolean }) {
  const s = useGlocke();
  const kalender = useKalenderEinst();
  const naechste = useMemo(() => s.an ? naechsteGlocke(glockenZeiten(records, relations, kalender?.erinnerungen || ERINNERUNG_VORGABE), new Date()) : null, [s.an, records, relations, kalender?.erinnerungen?.join()]);
  const schalten = () => {
    const an = !s.an;
    glockeSchreiben({ ...s, an, seit: Date.now() });
    if (an) { ton(); void glockePlugin()?.erlauben().catch(() => undefined); try { if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission(); } catch { /* nicht überall */ } }
  };
  return <button type="button" className={`button ${s.an ? "primary" : "secondary"} glocken-schalter`} onClick={schalten} aria-pressed={s.an} data-glocke={s.an ? "an" : "aus"} title={s.an ? "App-Glocke ausschalten" : "App-Glocke einschalten: läutet in der App zu den Erinnerungszeiten"}>
    {s.an ? <Bell size={16}/> : <BellOff size={16}/>}<span>{kurz ? (s.an ? "App-Glocke an: läutet in der App" : "Auch in der App läuten") : `App-Glocke ${s.an ? "an" : "aus"}`}{!kurz && naechste && <small> · nächste {new Date(naechste.um).toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</small>}</span>
  </button>;
}

/**
 * Läutet, solange die App offen ist (auch im Hintergrund-Tab, soweit der Browser Zeitgeber laufen lässt): Ton, Vibration,
 * Hinweis oben; mit Erlaubnis auch eine Systemmeldung. Bei geschlossener App erinnert der verbundene Kalender.
 */
export function AppGlocke({ records, relations, onOeffnen, onErledigt }: { records: FamilyRecordUnion[]; relations: FamilyRelation[]; onOeffnen: (z: GlockenZeit) => void; onErledigt?: (z: GlockenZeit) => Promise<void> | void }) {
  const s = useGlocke();
  const kalender = useKalenderEinst();
  const [klingelt, setKlingelt] = useState<GlockenZeit[]>([]);
  const klingelnBis = useRef(0);
  const zeiten = useMemo(() => glockenZeiten(records, relations, kalender?.erinnerungen || ERINNERUNG_VORGABE), [records, relations, kalender?.erinnerungen?.join()]);
  // Ab Werk an (ohne Kalender): beim ersten Start festhalten; unter Android je Start die Erlaubnis für Meldungen sichern
  // (fragt nur, solange sie fehlt).
  useEffect(() => { if (!s.an) return; if (!glockeGespeichert()) glockeSchreiben(glockeLesen()); void glockePlugin()?.erlauben().catch(() => undefined); }, [s.an]);
  // Android: alle kommenden Glocken (höchstens 50, 60 Tage) als Benachrichtigung einplanen; aus = alle löschen.
  useEffect(() => {
    const plugin = glockePlugin(); if (!plugin) return;
    const jetzt = Date.now();
    const glocken = s.an ? zeiten.filter((z) => { const um = Date.parse(z.um); return um > jetzt && um < jetzt + 60 * 86400000; }).slice(0, 50).map((z) => ({ titel: z.titel, text: wannText(z), um: Date.parse(z.um) })) : [];
    // aus: auch schon angezeigte Meldungen aus der Leiste nehmen (Nutzer 08.11.2026).
    void plugin.planen({ glocken, aus: !s.an }).catch(() => undefined);
  }, [s.an, zeiten]);
  useEffect(() => {
    if (!s.an) return;
    const pruefen = () => {
      const stand = glockeLesen(); if (!stand.an) return;
      const f = faelligeGlocken(zeiten, new Date(), new Set(stand.geläutet), stand.seit);
      if (!f.length) return;
      glockeSchreiben({ ...stand, geläutet: [...stand.geläutet, ...f.map((z) => z.schluessel)].slice(-200) });
      setKlingelt((k) => [...k, ...f]); ton(); klingelnBis.current = Date.now() + DAUER_MS[stand.dauer || "einmal"];
      try { if ("Notification" in window && Notification.permission === "granted") for (const z of f) new Notification(`🔔 ${z.titel}`, { body: wannText(z), tag: z.schluessel }); } catch { /* nicht überall */ }
    };
    pruefen(); const t = window.setInterval(pruefen, 15000);
    const sicht = () => { if (document.visibilityState === "visible") pruefen(); };
    document.addEventListener("visibilitychange", sicht);
    return () => { window.clearInterval(t); document.removeEventListener("visibilitychange", sicht); };
  }, [s.an, zeiten]);
  // Wiederholt läuten, bis „OK“ oder die gewählte Dauer vorbei ist.
  useEffect(() => {
    if (!klingelt.length) { klingelnBis.current = 0; return; }
    const t = window.setInterval(() => { if (Date.now() < klingelnBis.current) ton(); else window.clearInterval(t); }, 3000);
    return () => window.clearInterval(t);
  }, [klingelt.length]);
  if (!klingelt.length) return null;
  const z = klingelt[0];
  return <div className="app-glocke" role="alertdialog" aria-live="assertive" aria-label="Erinnerung" data-app-glocke={z.recordId}>
    <Bell size={22}/><span><strong><FlachText text={z.titel}/></strong><small>{wannText(z)}</small></span>
    <button type="button" className="icon-button" onClick={() => { setKlingelt((k) => k.slice(1)); onOeffnen(z); }} aria-label={`„${z.titel}“ ansehen`} title="Ansehen" data-app-glocke-ansehen><Eye size={20}/></button>
    {/* U9: derselbe ✓ wie in den Listen – erledigt, ohne erst hinzugehen. */}
    {onErledigt && <button type="button" className="icon-button" onClick={() => { setKlingelt((k) => k.filter((x) => x.recordId !== z.recordId)); void onErledigt(z); }} aria-label={`„${z.titel}“ als erledigt markieren`} title="Als erledigt markieren" data-app-glocke-erledigt><Check size={20}/></button>}
    <button type="button" className="button primary" onClick={() => setKlingelt((k) => k.slice(1))} data-app-glocke-ok>OK{klingelt.length > 1 ? ` (${klingelt.length})` : ""}</button>
  </div>;
}

function wannText(z: GlockenZeit) {
  const b = new Date(z.beginn);
  const am = b.toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return z.vorherMinuten === 0 ? `Jetzt: ${am} Uhr` : `${am} Uhr · ${vorherText(z.vorherMinuten)}`;
}

function vorherText(min: number) {
  if (min < 1440) return erinnerungsName(`${min}m` as ErinnerungsWahl);
  if (min % 1440 === 0) return erinnerungsName(`${min / 1440}d` as ErinnerungsWahl);
  return `${Math.round(min / 60)} Std. vorher`;
}

/** Ton und Dauer (Klaus 2026-11-06): Dauer in der App wählbar; Ton und Vibration der Handy-Benachrichtigung legt Android fest. */
export function GlockenEinstellung() {
  const s = useGlocke();
  const plugin = glockePlugin();
  const setDauer = (dauer: Dauer) => glockeSchreiben({ ...glockeLesen(), dauer });
  return <details className="glocken-einstellung" data-glocken-einstellung>
    <summary>Ton und Dauer</summary>
    <label><span>Läuten in der App</span><select value={s.dauer || "einmal"} onChange={(e) => setDauer(e.target.value as Dauer)} data-glocke-dauer>
      <option value="einmal">einmal</option><option value="30s">30 Sekunden</option><option value="bisOk">bis „OK“ (höchstens 2 Minuten)</option>
    </select></label>
    <button type="button" className="button secondary" onClick={() => ton()} data-glocke-probe>Probe hören</button>
    {plugin?.einstellungen && <button type="button" className="button secondary" onClick={() => void plugin.einstellungen?.().catch(() => undefined)} data-glocke-handy>Ton am Handy einstellen</button>}
    <small className="muted">{plugin ? "Ton, Vibration und Lautstärke der Benachrichtigung stellt Android ein (Kanal „Erinnerungen“)." : "Die Lautstärke folgt dem Gerät."}</small>
  </details>;
}
