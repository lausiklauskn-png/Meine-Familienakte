import { CalendarDays, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FamilyRecordUnion, FamilyRelation } from "../lib/family-data-model";
import { GlockenEinstellung, GlockenSchalter, glockeEinschalten } from "./app-glocke";
export { AppGlocke } from "./app-glocke";
import { KURZ_ERINNERUNGEN, erinnerungsName, istTermin, kalenderFelder, type ErinnerungsWahl } from "../lib/kalender";
import { DatumFeld } from "./datum-feld";
import { AugeKnopf, StiftKnopf } from "./flach-zeile";
import { ErinnerungsChips, kalenderZiel, useKalenderEinst } from "./kalender-karte";
import { createLocalScheduleBundle } from "./local-vault";
import { klappOeffnen } from "./klapp";
import { ErinnerungLoeschen } from "./loesch-knopf";
import { TerminBearbeiten } from "./termin-bearbeiten";
import { InfoPopover, VoiceInput } from "./ui-controls";

/** Öffnet „Mein Kalender“ an einem Tag (z. B. nach dem Speichern einer Notiz mit Erinnerung). */
export const MEIN_KALENDER_OEFFNEN = "familienakte:mein-kalender";
export function meinKalenderOeffnen(tag?: string) { window.dispatchEvent(new CustomEvent(MEIN_KALENDER_OEFFNEN, { detail: { tag } })); }

const HILFE = "• Alle offenen Fristen und Aufgaben nach Tag, mit Uhrzeit und Erinnerung.\n• Tag antippen, „+ Eintrag“: Titel einsprechen oder tippen, Uhrzeit, Erinnerung.\n• Stift: Tag, Uhrzeit, Erinnerung oder Kalender ändern.\n• Ist ein Kalender verbunden, stehen die Einträge auch dort und erinnern über das Handy.\n• App-Glocke: geht beim Speichern einer Erinnerung von selbst an. Läutet in der App; in der Android-App kommt zusätzlich eine Benachrichtigung, auch wenn die App zu ist (Android kann sie um einige Minuten verschieben).\n• Ausschalten: Knopf „App-Glocke an“ antippen.";
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
  const [offen, setOffen] = useState<string | null>(null); // Auge: ganzer Eintrag
  const box = useRef<HTMLElement>(null);
  const alle = useMemo(() => eintraege(records), [records]);
  const proTag = useMemo(() => { const m = new Map<string, Eintrag[]>(); for (const e of alle) m.set(e.tag, [...(m.get(e.tag) || []), e]); return m; }, [alle]);
  useEffect(() => {
    const auf = (ev: Event) => { klappOeffnen("kalender"); const t = (ev as CustomEvent<{ tag?: string }>).detail?.tag; if (t && /^\d{4}-\d{2}-\d{2}$/.test(t)) { setTag(t); setMonat(new Date(Number(t.slice(0, 4)), Number(t.slice(5, 7)) - 1, 1)); } window.setTimeout(() => box.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80); };
    window.addEventListener(MEIN_KALENDER_OEFFNEN, auf); return () => window.removeEventListener(MEIN_KALENDER_OEFFNEN, auf);
  }, []);
  const ersterTag = (monat.getDay() + 6) % 7;
  const tageImMonat = new Date(monat.getFullYear(), monat.getMonth() + 1, 0).getDate();
  const zellen: Array<string | null> = [...Array(ersterTag).fill(null), ...Array.from({ length: tageImMonat }, (_, i) => tagSchluessel(new Date(monat.getFullYear(), monat.getMonth(), i + 1)))];
  const amTag = proTag.get(tag) || [];
  const kommend = alle.filter((e) => e.tag >= heute && e.tag !== tag).slice(0, 5); // Klaus 2026-11-06: nicht doppelt zur Tagesliste
  const tagName = new Date(`${tag}T00:00`).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
  const bearbeitet = bearbeiten ? records.find((r) => r.id === bearbeiten) || null : null;
  // Zeile (Klaus 2026-11-08): Zeit, ganzer Text, Zusatzzeile; Stift, Mülleimer und Auge direkt (breit eine Reihe, schmal darunter).
  const zeile = (e: Eintrag, mitTag = false) => { const auf = offen === e.record.id; const art = e.record.recordType === "deadline" ? "Frist" : "Aufgabe";
    const glocke = e.erinnerungen?.length ? `🔔 ${e.erinnerungen.map(erinnerungsName).join(", ")}` : "";
    const kal = e.imKalender ? (e.eingetragen ? "im Kalender" : "geht in den Kalender") : "";
    return <li key={e.record.id} data-mk-eintrag={e.record.id} className={auf ? "offen" : undefined}>
    <div className="fz-kopf fz-voll">
      <span className="mk-zeit">{mitTag && <small>{new Date(`${e.tag}T00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}</small>}{e.zeit || "–"}</span>
      <span className="mk-text"><strong className="fz-titel">{e.titel}</strong><small>{[art, glocke, kal].filter(Boolean).join(" · ")}</small></span>
      <span className="fz-knoepfe">
        {vaultHandle && <StiftKnopf titel={e.titel} onClick={() => setBearbeiten(e.record.id)} data-mk-aendern/>}
        {vaultHandle && <ErinnerungLoeschen id={e.record.id} titel={e.titel} vaultHandle={vaultHandle} onGeloescht={async (t) => { setOffen(null); await onRefresh(); onNotice({ kind: "success", text: t }); }}/>}
        <AugeKnopf offen={auf} titel={e.titel} onClick={() => setOffen(auf ? null : e.record.id)} data-mk-auge/>
      </span>
    </div>
    {auf && <div className="fz-offen" data-mk-offen>
      <p><strong>{e.titel}</strong></p>
      <small>{new Date(`${e.tag}T00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}{e.zeit ? `, ${e.zeit} Uhr` : ""} · {[art, glocke, kal].filter(Boolean).join(" · ")}</small>
    </div>}
  </li>; };
  return <section ref={box} className="card mein-kalender" id="mein-kalender" data-mein-kalender data-klapp="kalender">
    <div className="card-heading"><div><span className="ui-heading-help"><h2><CalendarDays size={20}/> Mein Kalender</h2><InfoPopover label="Mein Kalender erklären" text={HILFE}/></span></div><GlockenSchalter records={records} relations={relations}/></div>
    <GlockenEinstellung/>
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
      glockeEinschalten();
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

