import { Bell, BellOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { workspaceStorage } from "../lib/demo-workspace.ts";
import type { FamilyRecordUnion, FamilyRelation } from "../lib/family-data-model";
import { faelligeGlocken, glockenZeiten, naechsteGlocke, type GlockenZeit } from "../lib/glocke";
import { ERINNERUNG_VORGABE, erinnerungsName, type ErinnerungsWahl } from "../lib/kalender";
import { useKalenderEinst } from "./kalender-karte";

/* ---------- App-Glocke ---------- */
const GLOCKE_KEY = "familienakte.glocke.v1";
type GlockeStand = { an: boolean; seit: number; geläutet: string[] };
function glockeLesen(): GlockeStand { try { const s = JSON.parse(workspaceStorage.getItem(GLOCKE_KEY) || "null"); if (s && typeof s.an === "boolean") return { an: s.an, seit: Number(s.seit) || 0, geläutet: Array.isArray(s.geläutet) ? s.geläutet.slice(-200) : [] }; } catch { /* leer */ } return { an: false, seit: 0, geläutet: [] }; }
function glockeSchreiben(s: GlockeStand) { try { workspaceStorage.setItem(GLOCKE_KEY, JSON.stringify(s)); } catch { /* ohne Speicher geht es weiter */ } window.dispatchEvent(new Event(GLOCKE_KEY)); }
/** Android: eigener Baustein plant die Glocken als Benachrichtigung, auch bei geschlossener App (Klaus 2026-11-06). */
type GlockePlugin = { erlauben: () => Promise<{ erlaubt: boolean }>; planen: (o: { glocken: Array<{ titel: string; text: string; um: number }> }) => Promise<{ geplant: number; erlaubt: boolean }> };
function glockePlugin(): GlockePlugin | null {
  // Nur die Android-Hülle registriert den Baustein; im Browser und unter Windows fehlt er.
  return (window as unknown as { Capacitor?: { Plugins?: { FamilienakteGlocke?: GlockePlugin } } }).Capacitor?.Plugins?.FamilienakteGlocke || null;
}

/** Schaltet die Glocke ein, falls sie aus ist (z. B. beim Speichern einer Notiz mit Erinnerung). */
export function glockeEinschalten() {
  const s = glockeLesen();
  if (s.an) return;
  glockeSchreiben({ an: true, seit: Date.now(), geläutet: s.geläutet });
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

/** Schalter „App-Glocke“ (ab Werk aus: der Kalender des Geräts erinnert schon; Klaus 2026-11-05: „wenn ich das will“). */
export function GlockenSchalter({ records = [], relations = [], kurz = false }: { records?: FamilyRecordUnion[]; relations?: FamilyRelation[]; kurz?: boolean }) {
  const s = useGlocke();
  const kalender = useKalenderEinst();
  const naechste = useMemo(() => s.an ? naechsteGlocke(glockenZeiten(records, relations, kalender?.erinnerungen || ERINNERUNG_VORGABE), new Date()) : null, [s.an, records, relations, kalender?.erinnerungen?.join()]);
  const schalten = () => {
    const an = !s.an;
    glockeSchreiben({ an, seit: Date.now(), geläutet: s.geläutet });
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
export function AppGlocke({ records, relations, onOeffnen }: { records: FamilyRecordUnion[]; relations: FamilyRelation[]; onOeffnen: (z: GlockenZeit) => void }) {
  const s = useGlocke();
  const kalender = useKalenderEinst();
  const [klingelt, setKlingelt] = useState<GlockenZeit[]>([]);
  const zeiten = useMemo(() => glockenZeiten(records, relations, kalender?.erinnerungen || ERINNERUNG_VORGABE), [records, relations, kalender?.erinnerungen?.join()]);
  // Android: alle kommenden Glocken (höchstens 50, 60 Tage) als Benachrichtigung einplanen; aus = alle löschen.
  useEffect(() => {
    const plugin = glockePlugin(); if (!plugin) return;
    const jetzt = Date.now();
    const glocken = s.an ? zeiten.filter((z) => { const um = Date.parse(z.um); return um > jetzt && um < jetzt + 60 * 86400000; }).slice(0, 50).map((z) => ({ titel: z.titel, text: wannText(z), um: Date.parse(z.um) })) : [];
    void plugin.planen({ glocken }).catch(() => undefined);
  }, [s.an, zeiten]);
  useEffect(() => {
    if (!s.an) return;
    const pruefen = () => {
      const stand = glockeLesen(); if (!stand.an) return;
      const f = faelligeGlocken(zeiten, new Date(), new Set(stand.geläutet), stand.seit);
      if (!f.length) return;
      glockeSchreiben({ ...stand, geläutet: [...stand.geläutet, ...f.map((z) => z.schluessel)].slice(-200) });
      setKlingelt((k) => [...k, ...f]); ton();
      try { if ("Notification" in window && Notification.permission === "granted") for (const z of f) new Notification(`🔔 ${z.titel}`, { body: wannText(z), tag: z.schluessel }); } catch { /* nicht überall */ }
    };
    pruefen(); const t = window.setInterval(pruefen, 15000);
    const sicht = () => { if (document.visibilityState === "visible") pruefen(); };
    document.addEventListener("visibilitychange", sicht);
    return () => { window.clearInterval(t); document.removeEventListener("visibilitychange", sicht); };
  }, [s.an, zeiten]);
  if (!klingelt.length) return null;
  const z = klingelt[0];
  return <div className="app-glocke" role="alertdialog" aria-live="assertive" aria-label="Erinnerung" data-app-glocke={z.recordId}>
    <Bell size={22}/><span><strong>{z.titel}</strong><small>{wannText(z)}</small></span>
    <button type="button" className="button secondary" onClick={() => { setKlingelt((k) => k.slice(1)); onOeffnen(z); }} data-app-glocke-ansehen>Ansehen</button>
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
