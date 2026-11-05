import { Bell, BellOff, CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { workspaceStorage } from "../lib/demo-workspace.ts";
import type { FamilyRecordUnion, FamilyRelation } from "../lib/family-data-model";
import { faelligeGlocken, glockenZeiten, naechsteGlocke, type GlockenZeit } from "../lib/glocke";
import { ERINNERUNG_VORGABE, KURZ_ERINNERUNGEN, erinnerungsName, istTermin, kalenderFelder, type ErinnerungsWahl } from "../lib/kalender";
import { DatumFeld } from "./datum-feld";
import { ErinnerungsChips, kalenderZiel, useKalenderEinst } from "./kalender-karte";
import { createLocalScheduleBundle } from "./local-vault";
import { TerminBearbeiten } from "./termin-bearbeiten";
import { InfoPopover, VoiceInput } from "./ui-controls";

/** Öffnet „Mein Kalender“ an einem Tag (z. B. nach dem Speichern einer Notiz mit Erinnerung). */
export const MEIN_KALENDER_OEFFNEN = "familienakte:mein-kalender";
export function meinKalenderOeffnen(tag?: string) { window.dispatchEvent(new CustomEvent(MEIN_KALENDER_OEFFNEN, { detail: { tag } })); }

const HILFE = "• Alle offenen Fristen und Aufgaben nach Tag, mit Uhrzeit und Erinnerung.\n• Tag antippen, „+ Eintrag“: Titel einsprechen oder tippen, Uhrzeit, Erinnerung.\n• Stift: Tag, Uhrzeit, Erinnerung oder Kalender ändern.\n• Ist ein Kalender verbunden, stehen die Einträge auch dort und erinnern über das Handy.\n• App-Glocke: läutet zusätzlich in der App, solange sie offen ist. Ab Werk aus, damit es nicht doppelt klingelt.";
const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const tagSchluessel = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const offen = (r: FamilyRecordUnion) => !["erledigt", "zurückgestellt", "archiviert"].includes(r.status);

type Eintrag = { record: FamilyRecordUnion; tag: string; zeit: string; titel: string; erinnerungen: ErinnerungsWahl[] | null; imKalender: boolean; eingetragen: boolean };

function eintraege(records: FamilyRecordUnion[]): Eintrag[] {
  return records.filter((r) => istTermin(r) && offen(r) && /^\d{4}-\d{2}-\d{2}/.test(String((r.data as { dueAt?: string }).dueAt || "")))
    .map((r) => {
      const k = kalenderFelder(r);
      return { record: r, tag: String((r.data as { dueAt: string }).dueAt).slice(0, 10), zeit: k.dueTime || "", titel: (r.data as { title: string }).title, erinnerungen: Array.isArray(k.erinnerungen) ? k.erinnerungen : null, imKalender: k.kalenderEintragen === true, eingetragen: (k.kalender || []).length > 0 };
    })
    .sort((a, b) => `${a.tag}${a.zeit || "99"}`.localeCompare(`${b.tag}${b.zeit || "99"}`));
}

/**
 * „Mein Kalender“ (Klaus 2026-11-05): alle offenen Fristen und Aufgaben als Monat und Tagesliste, mit Uhrzeit und Erinnerung,
 * direkt änderbar; neue Einträge an einem Tag, auf Wunsch eingesprochen. Mit verbundenem Kalender gehen sie dorthin
 * (gleiche Daten, gleicher Abgleich); die App-Glocke läutet zu denselben Zeiten.
 */
export function MeinKalender({ vaultHandle, records, relations, onRefresh, onNotice }: {
  vaultHandle: FileSystemDirectoryHandle | null; records: FamilyRecordUnion[]; relations: FamilyRelation[];
  onRefresh: () => Promise<void>; onNotice: (n: { kind: "success" | "error"; text: string }) => void;
}) {
  const heute = tagSchluessel(new Date());
  const [tag, setTag] = useState(heute);
  const [monat, setMonat] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [bearbeiten, setBearbeiten] = useState<string | null>(null);
  const [neu, setNeu] = useState(false);
  const box = useRef<HTMLElement>(null);
  const alle = useMemo(() => eintraege(records), [records]);
  const proTag = useMemo(() => { const m = new Map<string, Eintrag[]>(); for (const e of alle) m.set(e.tag, [...(m.get(e.tag) || []), e]); return m; }, [alle]);
  useEffect(() => {
    const auf = (ev: Event) => { const t = (ev as CustomEvent<{ tag?: string }>).detail?.tag; if (t && /^\d{4}-\d{2}-\d{2}$/.test(t)) { setTag(t); setMonat(new Date(Number(t.slice(0, 4)), Number(t.slice(5, 7)) - 1, 1)); } window.setTimeout(() => box.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80); };
    window.addEventListener(MEIN_KALENDER_OEFFNEN, auf); return () => window.removeEventListener(MEIN_KALENDER_OEFFNEN, auf);
  }, []);
  const ersterTag = (monat.getDay() + 6) % 7;
  const tageImMonat = new Date(monat.getFullYear(), monat.getMonth() + 1, 0).getDate();
  const zellen: Array<string | null> = [...Array(ersterTag).fill(null), ...Array.from({ length: tageImMonat }, (_, i) => tagSchluessel(new Date(monat.getFullYear(), monat.getMonth(), i + 1)))];
  const amTag = proTag.get(tag) || [];
  const kommend = alle.filter((e) => e.tag >= heute).slice(0, 5);
  const tagName = new Date(`${tag}T00:00`).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
  const bearbeitet = bearbeiten ? records.find((r) => r.id === bearbeiten) || null : null;
  const zeile = (e: Eintrag, mitTag = false) => <li key={e.record.id} data-mk-eintrag={e.record.id}>
    <span className="mk-zeit">{mitTag && <small>{new Date(`${e.tag}T00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}</small>}{e.zeit || "–"}</span>
    <span className="mk-text"><strong>{e.titel}</strong><small>{e.record.recordType === "deadline" ? "Frist" : "Aufgabe"}{e.erinnerungen?.length ? ` · 🔔 ${e.erinnerungen.map(erinnerungsName).join(", ")}` : ""}{e.imKalender ? (e.eingetragen ? " · im Kalender" : " · geht in den Kalender") : ""}</small></span>
    {e.imKalender && <CalendarCheck size={16} aria-label="Kalender"/>}
    <button type="button" className="icon-button" onClick={() => setBearbeiten(e.record.id)} aria-label={`„${e.titel}“ ändern`} title="Ändern" data-mk-aendern><Pencil size={16}/></button>
  </li>;
  return <section ref={box} className="card mein-kalender" id="mein-kalender" data-mein-kalender>
    <div className="card-heading"><div><span className="ui-heading-help"><h2><CalendarDays size={20}/> Mein Kalender</h2><InfoPopover label="Mein Kalender erklären" text={HILFE}/></span></div><GlockenSchalter records={records} relations={relations}/></div>
    <div className="mk-monat">
      <div className="mk-kopf"><button type="button" className="icon-button" onClick={() => setMonat(new Date(monat.getFullYear(), monat.getMonth() - 1, 1))} aria-label="Voriger Monat"><ChevronLeft size={18}/></button><strong data-mk-monat>{monat.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</strong><button type="button" className="icon-button" onClick={() => setMonat(new Date(monat.getFullYear(), monat.getMonth() + 1, 1))} aria-label="Nächster Monat"><ChevronRight size={18}/></button></div>
      <div className="mk-raster" role="grid">{WOCHENTAGE.map((w) => <span key={w} className="mk-wt">{w}</span>)}
        {zellen.map((z, i) => z ? <button type="button" key={z} className={`mk-tag ${z === tag ? "gewaehlt" : ""} ${z === heute ? "heute" : ""}`} onClick={() => setTag(z)} data-mk-tag={z} aria-pressed={z === tag}>{Number(z.slice(8))}{proTag.has(z) && <i className="mk-punkt" aria-label={`${proTag.get(z)!.length} Einträge`}>{proTag.get(z)!.length}</i>}</button> : <span key={`l${i}`}/>)}
      </div>
    </div>
    <div className="mk-tagesliste">
      <div className="mk-tag-kopf"><strong>{tagName}</strong><button type="button" className="button secondary" onClick={() => setNeu(true)} disabled={!vaultHandle} data-mk-neu><Plus size={16}/> Eintrag</button></div>
      {neu && vaultHandle && <NeuerEintrag tag={tag} vaultHandle={vaultHandle} onZu={() => setNeu(false)} onGespeichert={async (t) => { await onRefresh(); onNotice({ kind: "success", text: t }); }}/>}
      {amTag.length ? <ul className="mk-liste">{amTag.map((e) => zeile(e))}</ul> : !neu && <p className="muted">Nichts an diesem Tag.</p>}
      {kommend.length > 0 && <details className="mk-kommend"><summary>Als Nächstes ({kommend.length})</summary><ul className="mk-liste">{kommend.map((e) => zeile(e, true))}</ul></details>}
    </div>
    {bearbeitet && vaultHandle && <TerminBearbeiten record={bearbeitet} vaultHandle={vaultHandle} onZu={() => setBearbeiten(null)} onGespeichert={async (t) => { await onRefresh(); onNotice({ kind: "success", text: t }); }}/>}
  </section>;
}

function NeuerEintrag({ tag, vaultHandle, onZu, onGespeichert }: { tag: string; vaultHandle: FileSystemDirectoryHandle; onZu: () => void; onGespeichert: (t: string) => Promise<void> }) {
  const kalender = useKalenderEinst();
  const [titel, setTitel] = useState("");
  const [zeit, setZeit] = useState("");
  const [wahl, setWahl] = useState<ErinnerungsWahl[]>(["15m"]);
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState("");
  const speichern = async () => {
    if (!titel.trim()) return setFehler("Bitte eintragen, woran erinnert werden soll.");
    setBusy(true); setFehler("");
    try {
      await createLocalScheduleBundle(vaultHandle, { recordType: "task", title: titel.trim(), dueAt: tag, dueTime: zeit || null, erinnerungen: wahl, kalenderEintragen: Boolean(kalender), source: "Mein Kalender", references: [] });
      await onGespeichert(`Eingetragen: ${titel.trim()} – ${new Date(`${tag}T00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}${zeit ? `, ${zeit} Uhr` : ""}${kalender ? ` · ${kalenderZiel(kalender)}` : ""}.`);
      onZu();
    } catch (g) { setFehler(g instanceof Error ? g.message : String(g)); } finally { setBusy(false); }
  };
  return <div className="mk-neu" data-mk-formular>
    <label><span>Woran erinnern</span><VoiceInput value={titel} onValueChange={setTitel} speechLabel="Eintrag" placeholder="z. B. Arzt anrufen" data-mk-titel/></label>
    <label><span>Uhrzeit</span><DatumFeld art="time" value={zeit} onChange={(e) => setZeit(e.target.value)} data-mk-uhr/></label>
    <ErinnerungsChips wert={wahl} onChange={setWahl} schnell={[...KURZ_ERINNERUNGEN, "1d"]} name="Erinnern"/>
    <small className="muted">{kalender ? `Geht auch in: ${kalenderZiel(kalender)}` : "Nur in der App (kein Kalender verbunden)"}</small>
    {fehler && <p className="form-error" role="alert">{fehler}</p>}
    <div className="button-row"><button type="button" className="button secondary" onClick={onZu} disabled={busy}><X size={16}/> Abbrechen</button><button type="button" className="button primary" onClick={() => void speichern()} disabled={busy || !titel.trim()} data-mk-speichern>{busy ? "Wird gespeichert …" : "Eintragen"}</button></div>
  </div>;
}

/* ---------- App-Glocke ---------- */
const GLOCKE_KEY = "familienakte.glocke.v1";
type GlockeStand = { an: boolean; seit: number; geläutet: string[] };
function glockeLesen(): GlockeStand { try { const s = JSON.parse(workspaceStorage.getItem(GLOCKE_KEY) || "null"); if (s && typeof s.an === "boolean") return { an: s.an, seit: Number(s.seit) || 0, geläutet: Array.isArray(s.geläutet) ? s.geläutet.slice(-200) : [] }; } catch { /* leer */ } return { an: false, seit: 0, geläutet: [] }; }
function glockeSchreiben(s: GlockeStand) { try { workspaceStorage.setItem(GLOCKE_KEY, JSON.stringify(s)); } catch { /* ohne Speicher geht es weiter */ } window.dispatchEvent(new Event(GLOCKE_KEY)); }
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
export function GlockenSchalter({ records, relations }: { records: FamilyRecordUnion[]; relations: FamilyRelation[] }) {
  const s = useGlocke();
  const kalender = useKalenderEinst();
  const naechste = useMemo(() => s.an ? naechsteGlocke(glockenZeiten(records, relations, kalender?.erinnerungen || ERINNERUNG_VORGABE), new Date()) : null, [s.an, records, relations, kalender?.erinnerungen?.join()]);
  const schalten = () => {
    const an = !s.an;
    glockeSchreiben({ an, seit: Date.now(), geläutet: s.geläutet });
    if (an) { ton(); try { if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission(); } catch { /* nicht überall */ } }
  };
  return <button type="button" className={`button ${s.an ? "primary" : "secondary"} glocken-schalter`} onClick={schalten} aria-pressed={s.an} data-glocke={s.an ? "an" : "aus"} title={s.an ? "App-Glocke ausschalten" : "App-Glocke einschalten: läutet in der App zu den Erinnerungszeiten"}>
    {s.an ? <Bell size={16}/> : <BellOff size={16}/>}<span>App-Glocke {s.an ? "an" : "aus"}{naechste && <small> · nächste {new Date(naechste.um).toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</small>}</span>
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
