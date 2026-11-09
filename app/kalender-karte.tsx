// Bedienung des Kalenders (Klaus 2026-11-05, Vorschau freigegeben): Teil im Frist-Formular (Uhrzeit frei, Haken „In den
// Kalender eintragen“, Erinnerungs-Chips), Karte „Kalender verbinden“ (Anbieter → Kalender → Erinnerung → vorhandene
// übernehmen → fertig) und der automatische Abgleich, solange ein Kalender verbunden ist.
import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarCheck, CalendarClock, CalendarCog, CalendarPlus, Download, Link2Off, LogIn, RefreshCw } from "lucide-react";
import { abgleichPlan, ALLE_ERINNERUNGEN, KURZ_ERINNERUNGEN, ERINNERUNG_VORGABE, erinnerungenOrdnen, erinnerungsName, MAX_ERINNERUNGEN, MAX_TAGE_VORHER, istTermin, kalenderAnbieterNamen, kalenderFelder, type ErinnerungsWahl, type KalenderAnbieter } from "../lib/kalender";
import type { FamilyRecordUnion, FamilyRelation } from "../lib/family-data-model";
import { ANBIETER, kalenderNeuAnmelden, plattform, type KalenderInfo } from "./kalender-anbieter";
import { kalenderAbgleichen, kalenderDateiAusgeben, kalenderEinstLesen, kalenderEinstSchreiben, type KalenderEinst } from "./kalender-abgleich";
import { einlesenAusfuehren, einlesenVorbereiten, einleseText, exklusiv, type EinleseVorschau } from "./kalender-einlesen";
import { X } from "lucide-react";
import { readLocalVaultData, updateLocalScheduleKalender } from "./local-vault";
import { Ablaufbild, zurStelle } from "./ablaufbild";
import { InfoPopover } from "./ui-controls";
import { DatumFeld } from "./datum-feld";
import { askConfirm } from "./page-dialogs";

type Notice = { kind: "success" | "error" | "info"; text: string };

export function useKalenderEinst() {
  const [einst, setEinst] = useState<KalenderEinst | null>(() => kalenderEinstLesen());
  useEffect(() => {
    const lesen = () => setEinst(kalenderEinstLesen());
    window.addEventListener("familienakte-kalender", lesen);
    return () => window.removeEventListener("familienakte-kalender", lesen);
  }, []);
  return einst;
}

export function kalenderZiel(einst: KalenderEinst | null) {
  return einst ? `${kalenderAnbieterNamen[einst.anbieter]}${einst.kalenderName && einst.anbieter !== "ics" ? ` · ${einst.kalenderName}` : ""}` : "";
}

// ---------- Vorschlag aus dem Eingang ----------

export type FristVorschlag = { titel: string; datum: string | null; hinweis: string; quelle?: string; dokumentId?: string };
let vorschlag: FristVorschlag | null = null;
/** Eingang → Fristen: Vorschlag ablegen; das Formular übernimmt ihn vorausgefüllt, gespeichert wird erst nach Bestätigung. */
export function fristVorschlagSetzen(v: FristVorschlag) { vorschlag = v; }
export function fristVorschlagNehmen() { const v = vorschlag; vorschlag = null; return v; }
export function fristAusHinweis(hinweis: string) {
  const iso = hinweis.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1];
  if (iso) return iso;
  const de = hinweis.match(/\b(\d{1,2})\.(\d{1,2})\.(20\d{2})\b/);
  return de ? `${de[3]}-${de[2].padStart(2, "0")}-${de[1].padStart(2, "0")}` : null;
}

// ---------- Erinnerungs-Chips ----------

export function ErinnerungsChips({ wert, onChange, name = "Erinnern", schnell = ALLE_ERINNERUNGEN }: { wert: ErinnerungsWahl[]; onChange: (w: ErinnerungsWahl[]) => void; name?: string; schnell?: ErinnerungsWahl[] }) {
  // Schnellwahl als Chips; dazu jede gewählte eigene Wahl als eigener Chip und die Auswahl „weitere …“ (Minuten, Tage, eigene Zeit).
  const chips = erinnerungenOrdnen([...schnell, ...wert]);
  const weitere: ErinnerungsWahl[] = [...KURZ_ERINNERUNGEN.slice().reverse(), ...Array.from({ length: MAX_TAGE_VORHER }, (_, i) => `${i + 1}d` as ErinnerungsWahl)].filter((w) => !wert.includes(w) && !schnell.includes(w));
  const umschalten = (w: ErinnerungsWahl) => onChange(wert.includes(w) ? wert.filter((x) => x !== w) : erinnerungenOrdnen([...wert, w]));
  // Eigene Zeit (Klaus 2026-11-05): Tag und Uhrzeit frei, z. B. mittags statt während der Arbeit.
  const [eigen, setEigen] = useState(false);
  const [eDatum, setEDatum] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
  const [eZeit, setEZeit] = useState("12:30");
  return <div className="kalender-chips" role="group" aria-label={name}>
    {chips.map((w) => { const an = wert.includes(w); return <button key={w} type="button" className={`kalender-chip${an ? " an" : ""}`} aria-pressed={an} data-erinnerung={w} onClick={() => umschalten(w)}>{erinnerungsName(w)}</button>; })}
    <select className="kalender-tage" aria-label="Weitere Erinnerungen" data-erinnerung-tage value="" onChange={(e) => { if (e.target.value === "eigen") { setEigen(true); return; } const w = /^\d+$/.test(e.target.value) ? `${e.target.value}d` : e.target.value; if (w) onChange(erinnerungenOrdnen([...wert, w])); }}>
      <option value="">weitere …</option>
      <option value="eigen">eigene Zeit …</option>
      {weitere.map((w) => <option key={w} value={w}>{erinnerungsName(w)}</option>)}
    </select>
    {eigen && <span className="kalender-eigen" data-erinnerung-eigen>
      <DatumFeld value={eDatum} onChange={(e) => setEDatum(e.target.value)} aria-label="Tag der Erinnerung" data-erinnerung-eigen-tag/>
      <DatumFeld art="time" value={eZeit} onChange={(e) => setEZeit(e.target.value)} aria-label="Uhrzeit der Erinnerung" data-erinnerung-eigen-zeit/>
      <button type="button" className="button secondary" disabled={!eDatum || !eZeit} onClick={() => { onChange(erinnerungenOrdnen([...wert, `@${eDatum}T${eZeit}`])); setEigen(false); }} data-erinnerung-eigen-ok>Übernehmen</button>
    </span>}
    {wert.length > MAX_ERINNERUNGEN && <small className="fine-print" data-erinnerung-grenze>Kalender nehmen höchstens {MAX_ERINNERUNGEN} Erinnerungen; es gelten die {MAX_ERINNERUNGEN} nächsten am Termin.</small>}
  </div>;
}

// ---------- Eigener Kalender je Eintrag ----------

export type KalenderWahl = { anbieter: KalenderAnbieter; kalenderId: string; name?: string };
let kalenderListeVorrat: { anbieter: KalenderAnbieter; liste: KalenderInfo[] } | null = null;

/**
 * Kalender nur für diesen Eintrag (Klaus 2026-11-05): Vorauswahl ist immer der aus „Kalender verbinden“; wählbar sind die
 * Kalender desselben Kontos. Ohne Anmeldung (Browser nach Neuladen) bleibt es beim eingestellten – keine leere Auswahl.
 */
export function KalenderAuswahl({ einst, wert, onChange }: { einst: KalenderEinst | null; wert: KalenderWahl | null; onChange: (w: KalenderWahl | null) => void }) {
  const [liste, setListe] = useState<KalenderInfo[] | null>(kalenderListeVorrat && einst && kalenderListeVorrat.anbieter === einst.anbieter ? kalenderListeVorrat.liste : null);
  useEffect(() => {
    if (!einst || einst.anbieter === "ics" || liste) return;
    const a = ANBIETER[einst.anbieter];
    if (!a.verbunden()) return;
    let aus = false;
    void a.kalender().then((l) => { if (aus) return; kalenderListeVorrat = { anbieter: einst.anbieter, liste: l }; setListe(l); }).catch(() => undefined);
    return () => { aus = true; };
  }, [einst?.anbieter, liste]);
  if (!einst || einst.anbieter === "ics" || !liste || liste.length < 2) return null;
  const aktuell = wert && wert.anbieter === einst.anbieter ? wert.kalenderId : einst.kalenderId;
  return <label className="kalender-auswahl" data-kalender-auswahl><span>Kalender für diesen Eintrag</span>
    <select value={aktuell} onChange={(e) => { const k = liste.find((x) => x.id === e.target.value); onChange(!k || k.id === einst.kalenderId ? null : { anbieter: einst.anbieter, kalenderId: k.id, name: k.name }); }}>
      {liste.map((k) => <option key={k.id} value={k.id}>{k.name}{k.id === einst.kalenderId ? " (Einstellung)" : ""}</option>)}
    </select></label>;
}

/** Teil im Formular „Frist oder Aufgabe anlegen“. */
export function KalenderFormTeil({ einst, eintragen, setEintragen, erinnerungen, setErinnerungen, kalenderWahl = null, setKalenderWahl }: { einst: KalenderEinst | null; eintragen: boolean; setEintragen: (v: boolean) => void; erinnerungen: ErinnerungsWahl[]; setErinnerungen: (w: ErinnerungsWahl[]) => void; kalenderWahl?: KalenderWahl | null; setKalenderWahl?: (w: KalenderWahl | null) => void }) {
  return <div className="kalender-formteil" data-kalender-formteil>
    <label className="check-row"><input type="checkbox" checked={eintragen} onChange={(e) => setEintragen(e.target.checked)} data-kalender-haken/><span><strong>In den Kalender eintragen</strong><small>{einst ? `Kalender: ${kalenderZiel(einst)} (gewählt unter „Kalender verbinden“)` : <>Kein Kalender verbunden <button type="button" className="kalender-sprung" aria-label="Zu „Kalender verbinden“" title="Zu „Kalender verbinden“" data-kalender-sprung onClick={(e) => { e.preventDefault(); zurStelle("#kalender-verbinden"); }}>▽</button></>}</small></span></label>
    {eintragen && setKalenderWahl && <KalenderAuswahl einst={einst} wert={kalenderWahl} onChange={setKalenderWahl}/>}
    {/* U16: die Erinnerungszeiten gelten auch für die App-Glocke – immer sichtbar, nicht nur mit Kalender-Haken. */}
    {<details className="kalender-erinnerung" data-kalender-erinnerung>
      <summary><span className="kalender-etikett">Erinnern:</span> <strong>{erinnerungen.map((w) => erinnerungsName(w)).join(", ") || "keine"}</strong> <span className="kalender-aendern">ändern ▾</span></summary>
      <ErinnerungsChips wert={erinnerungen} onChange={setErinnerungen}/>{einst?.anbieter === "microsoft" && erinnerungen.length > 1 && <small className="fine-print">Microsoft kennt eine Erinnerung je Termin: es gilt die früheste.</small>}
    </details>}
  </div>;
}

// ---------- Automatischer Abgleich ----------

/** Plan ohne Netz: wie viele Fristen warten auf den Kalender? */
export function offeneSchritte(records: FamilyRecordUnion[], relations: FamilyRelation[], einst: KalenderEinst | null) {
  if (!einst || einst.anbieter === "ics") return 0;
  return abgleichPlan(records, { anbieter: einst.anbieter, kalenderId: einst.kalenderId }, { vorgabe: einst.erinnerungen, relations }).filter((s) => s.art !== "gleich").length;
}

/**
 * Hält den verbundenen Kalender aktuell: nach jeder Änderung an Fristen (anlegen, erledigt, zurückgestellt, Haken) läuft
 * der Abgleich, solange der Zugang gilt. Ohne Zugang (Browser nach Neuladen) wartet er sichtbar auf „Neu anmelden“.
 */
export function useKalenderAutoAbgleich(vaultHandle: FileSystemDirectoryHandle | null, records: FamilyRecordUnion[], relations: FamilyRelation[], aktualisieren: () => Promise<void>, melden: (n: Notice) => void) {
  const einst = useKalenderEinst();
  const laeuft = useRef(false);
  const [bereit, setBereit] = useState(0);
  useEffect(() => { if (einst?.anbieter === "geraet") void ANBIETER.geraet.wiederaufnehmen?.().then(() => setBereit((x) => x + 1)); }, [einst?.anbieter]);
  useEffect(() => {
    if (!vaultHandle || !einst || einst.anbieter === "ics" || laeuft.current) return;
    const anbieter = ANBIETER[einst.anbieter];
    if (!anbieter.zustand().bereit || !anbieter.verbunden()) return;
    if (!offeneSchritte(records, relations, einst)) return;
    laeuft.current = true;
    void exklusiv(() => kalenderAbgleichen(vaultHandle, records, relations, einst))
      .then(async (r) => { if (r.angelegt + r.geaendert + r.entfernt) await aktualisieren(); if (r.fehler.length) melden({ kind: "error", text: `Kalender: ${r.fehler[0]}` }); })
      .catch((g) => melden({ kind: "error", text: `Kalender: ${g instanceof Error ? g.message : String(g)}` }))
      .finally(() => { laeuft.current = false; });
    // Bewusst ohne letzterFehler/letzterAbgleich: ein Fehler wiederholt sich nicht von selbst, erst nach einer Änderung.
  }, [vaultHandle, records, relations, einst?.anbieter, einst?.kalenderId, einst?.erinnerungen?.join(), bereit]);
  // Stufe D: Termine aus dem Kalender holen – beim Start und alle 15 Minuten, nur ohne Frage; Fragen wartet die Karte ab.
  const zuletztGeholt = useRef(0);
  const aktuell = useRef({ records, aktualisieren, melden }); aktuell.current = { records, aktualisieren, melden };
  useEffect(() => {
    if (!vaultHandle || !einst?.einlesen?.an || einst.anbieter === "ics") return;
    const holen = async () => {
      const a = ANBIETER[einst.anbieter];
      if (laeuft.current || !a.zustand().bereit || !a.verbunden() || Date.now() - zuletztGeholt.current < 15 * 60000) return;
      laeuft.current = true; zuletztGeholt.current = Date.now();
      try {
        await exklusiv(async () => {
          const v = await einlesenVorbereiten((await readLocalVaultData(vaultHandle)).records, einst);
          if (v.zaehlung.konflikte) { aktuell.current.melden({ kind: "info", text: `Kalender: ${v.zaehlung.konflikte} Termine wurden hier und im Kalender geändert – in „Kalender verbinden“ › „Termine holen“ entscheiden.` }); return; }
          if (v.zaehlung.anlegen + v.zaehlung.aendern + v.zaehlung.archivieren) { const z = await einlesenAusfuehren(vaultHandle, einst, v); await aktuell.current.aktualisieren(); aktuell.current.melden({ kind: "success", text: `Kalender geholt: ${einleseText(z)}` }); }
          else if (v.fehler.length) aktuell.current.melden({ kind: "error", text: `Kalender holen: ${v.fehler[0]}` });
        });
      } catch (g) { aktuell.current.melden({ kind: "error", text: `Kalender holen: ${g instanceof Error ? g.message : String(g)}` }); }
      finally { laeuft.current = false; }
    };
    void holen();
    const takt = window.setInterval(() => { if (document.visibilityState === "visible") void holen(); }, 60000);
    return () => window.clearInterval(takt);
  }, [vaultHandle, einst?.anbieter, einst?.einlesen?.an, einst?.einlesen?.kalender?.map((k) => k.id).join(), bereit]);
}

// ---------- Hinweis „neu anmelden“ ----------

/**
 * Im Browser gilt die Kalender-Anmeldung nur bis zum Neuladen (etwa eine Stunde). Warten dann Termine, steht oben ein
 * deutlicher Hinweis (Klaus 2026-11-05): ein Tipp meldet ohne Kontoauswahl neu an und trägt die wartenden Termine ein.
 */
export function KalenderAnmeldeHinweis({ vaultHandle, records, relations, onRefresh, onNotice }: { vaultHandle: FileSystemDirectoryHandle | null; records: FamilyRecordUnion[]; relations: FamilyRelation[]; onRefresh: () => Promise<void>; onNotice: (n: Notice) => void }) {
  const einst = useKalenderEinst();
  const [busy, setBusy] = useState(false);
  const [, setTakt] = useState(0);
  useEffect(() => { const neu = () => setTakt((x) => x + 1); window.addEventListener("pb:network", neu); return () => window.removeEventListener("pb:network", neu); }, []);
  if (!einst || !vaultHandle || (einst.anbieter !== "google" && einst.anbieter !== "microsoft")) return null;
  const a = ANBIETER[einst.anbieter];
  const warten = offeneSchritte(records, relations, einst);
  if (!warten || a.verbunden() || !a.zustand().bereit) return null;
  const los = async () => {
    setBusy(true);
    try {
      await kalenderNeuAnmelden(einst.anbieter as "google" | "microsoft");
      const r = await kalenderAbgleichen(vaultHandle, records, relations, einst);
      await onRefresh();
      onNotice(r.fehler.length ? { kind: "error", text: `Kalender: ${r.fehler[0]}` } : { kind: "success", text: `Kalender: ${r.angelegt} neu, ${r.geaendert} geändert, ${r.entfernt} entfernt.` });
    } catch (g) { onNotice({ kind: "error", text: `Kalender: ${g instanceof Error ? g.message : String(g)}` }); }
    finally { setBusy(false); setTakt((x) => x + 1); }
  };
  return <div className="kalender-anmelde-hinweis" role="status" data-kalender-anmelde-hinweis>
    <CalendarClock size={18}/><span><strong>{warten} Termin{warten === 1 ? "" : "e"} warte{warten === 1 ? "t" : "n"} auf den {kalenderAnbieterNamen[einst.anbieter]}</strong><small>Die Anmeldung ist abgelaufen.</small></span>
    <button type="button" className="button primary" onClick={() => void los()} disabled={busy} data-kalender-neu-anmelden>{busy ? "…" : "Neu anmelden"}</button>
  </div>;
}

// ---------- Karte „Kalender verbinden“ ----------

const anbieterKurz: Record<KalenderAnbieter, string> = { geraet: "Kalender auf diesem Gerät", google: "Google Kalender", microsoft: "Microsoft Kalender", ics: "Kalenderdatei (.ics)" };
/** Android schreibt über den Gerätekalender; Windows und Browser über die Konten. Die Datei geht überall. */
const anbieterFuer = (pl: string): KalenderAnbieter[] => pl === "android" ? ["geraet", "ics"] : ["google", "microsoft", "ics"];

export function KalenderVerbinden({ vaultHandle, records, relations, onRefresh, onNotice }: { vaultHandle: FileSystemDirectoryHandle | null; records: FamilyRecordUnion[]; relations: FamilyRelation[]; onRefresh: () => Promise<void>; onNotice: (n: Notice) => void }) {
  const einst = useKalenderEinst();
  const [wahl, setWahl] = useState<KalenderAnbieter | null>(einst?.anbieter || null);
  const [liste, setListe] = useState<KalenderInfo[] | null>(null);
  const [kalenderId, setKalenderId] = useState(einst?.kalenderId || "");
  const [erinnerungen, setErinnerungen] = useState<ErinnerungsWahl[]>(einst?.erinnerungen || ERINNERUNG_VORGABE);
  const [busy, setBusy] = useState("");
  const [fehler, setFehler] = useState("");
  const [, setTakt] = useState(0);
  // Stufe D: Termine aus dem Kalender holen
  const [holListe, setHolListe] = useState<KalenderInfo[] | null>(null);
  const [holVorschau, setHolVorschau] = useState<EinleseVorschau | null>(null);
  const pl = plattform();
  const offen = records.filter((r) => istTermin(r) && !["erledigt", "zurückgestellt", "archiviert"].includes(r.status) && r.data.dueAt);
  const ohneHaken = offen.filter((r) => kalenderFelder(r).kalenderEintragen === undefined);
  const warten = offeneSchritte(records, relations, einst);
  const verbunden = Boolean(einst);
  const zugangDa = einst ? ANBIETER[einst.anbieter].verbunden() : false;

  useEffect(() => { setErinnerungen(einst?.erinnerungen || ERINNERUNG_VORGABE); }, [einst?.erinnerungen?.join()]);
  useEffect(() => {
    const neu = () => setTakt((x) => x + 1);
    window.addEventListener("pb:network", neu);
    return () => window.removeEventListener("pb:network", neu);
  }, []);

  const tun = useCallback(async (was: string, fn: () => Promise<void>) => {
    setBusy(was); setFehler("");
    try { await fn(); } catch (g) { setFehler(g instanceof Error ? g.message : String(g)); }
    finally { setBusy(""); setTakt((x) => x + 1); }
  }, []);

  const anbieterWaehlen = (art: KalenderAnbieter) => tun("verbinden", async () => {
    setWahl(art); setListe(null); setKalenderId("");
    const a = ANBIETER[art];
    await a.verbinden();
    const k = await a.kalender();
    setListe(k);
    const vorgabe = k.find((x) => x.haupt) || k[0];
    if (vorgabe) setKalenderId(vorgabe.id);
    if (art === "ics") kalenderEinstSchreiben({ anbieter: "ics", kalenderId: "datei", kalenderName: "Kalenderdatei", erinnerungen });
  });

  const kalenderUebernehmen = () => tun("speichern", async () => {
    if (!wahl || !liste) return;
    const k = liste.find((x) => x.id === kalenderId);
    if (!k) throw new Error("Bitte einen Kalender wählen.");
    kalenderEinstSchreiben({ anbieter: wahl, kalenderId: k.id, kalenderName: k.name, konto: k.konto, erinnerungen });
    onNotice({ kind: "success", text: `Kalender verbunden: ${kalenderAnbieterNamen[wahl]} · ${k.name}.` });
  });

  const erinnerungSetzen = (w: ErinnerungsWahl[]) => { setErinnerungen(w); if (einst) kalenderEinstSchreiben({ ...einst, erinnerungen: w }); };

  const vorhandeneUebernehmen = () => tun("uebernehmen", async () => {
    if (!vaultHandle) throw new Error("Bitte zuerst einen Datentresor verbinden.");
    if (!ohneHaken.length) return;
    if (!(await askConfirm(`${ohneHaken.length} offene Frist${ohneHaken.length === 1 ? "" : "en"} und Aufgaben in den Kalender eintragen?`))) return;
    await updateLocalScheduleKalender(vaultHandle, ohneHaken.map((r) => ({ id: r.id, kalenderEintragen: true })));
    await onRefresh();
    onNotice({ kind: "success", text: `${ohneHaken.length} offene Einträge sind zum Eintragen markiert.` });
  });

  const jetztAbgleichen = () => tun("abgleich", async () => {
    if (!einst || !vaultHandle) return;
    if (einst.anbieter === "ics") {
      const r = await kalenderDateiAusgeben(vaultHandle, records, relations, einst);
      if (r.ergebnis !== "abgebrochen") onNotice({ kind: "success", text: `Kalenderdatei mit ${r.anzahl} Frist${r.anzahl === 1 ? "" : "en"} ${r.ergebnis === "gespeichert" ? "gespeichert" : "heruntergeladen"}. Öffnen, um sie in den Kalender zu übernehmen.` });
      await onRefresh();
      return;
    }
    const a = ANBIETER[einst.anbieter];
    if (!a.verbunden()) await a.verbinden();
    // Frisch aus dem Register lesen: ein Knopfdruck soll den tatsächlichen Stand hinausschreiben, nicht den zuletzt gezeigten.
    const { r, geholt } = await exklusiv(async () => {
      const frisch = await readLocalVaultData(vaultHandle);
      const r = await kalenderAbgleichen(vaultHandle, frisch.records, frisch.relations, einst);
      let geholt = "";
      if (einst.einlesen?.an && einst.einlesen.kalender.length) {
        const v = await einlesenVorbereiten((await readLocalVaultData(vaultHandle)).records, einst);
        if (v.zaehlung.konflikte) setHolVorschau(v);
        else if (v.schritte.length) { const z = await einlesenAusfuehren(vaultHandle, einst, v); geholt = ` Geholt: ${einleseText(z)}`; }
      }
      return { r, geholt };
    });
    await onRefresh();
    if (r.fehler.length) throw new Error(r.fehler[0]);
    onNotice({ kind: "success", text: `Kalender abgeglichen: ${r.angelegt} neu, ${r.geaendert} geändert, ${r.entfernt} entfernt.${geholt}` });
  });

  const holenAn = (an: boolean) => tun("holen", async () => {
    if (!einst || einst.anbieter === "ics") return;
    if (!an) { kalenderEinstSchreiben({ ...einst, einlesen: { ...(einst.einlesen || { kalender: [], staende: {} }), an: false } }); return; }
    // Erst die Einstellung (Haken springt sofort um; vorgewählt ist der verbundene Kalender), dann die Liste der Kalender holen.
    const vorher = einst.einlesen?.kalender?.length ? einst.einlesen.kalender : [{ id: einst.kalenderId, name: einst.kalenderName }];
    kalenderEinstSchreiben({ ...einst, einlesen: { an: true, kalender: vorher, staende: einst.einlesen?.staende || {} } });
    const a = ANBIETER[einst.anbieter]; if (!a.verbunden()) await a.verbinden();
    setHolListe(await a.kalender());
  });
  const holKalenderListe = () => tun("holen", async () => { if (!einst || einst.anbieter === "ics") return; const a = ANBIETER[einst.anbieter]; if (!a.verbunden()) await a.verbinden(); setHolListe(await a.kalender()); });
  const holKalenderWaehlen = (k: KalenderInfo, an: boolean) => {
    if (!einst?.einlesen) return;
    const liste = einst.einlesen.kalender.filter((x) => x.id !== k.id);
    kalenderEinstSchreiben({ ...einst, einlesen: { ...einst.einlesen, kalender: an ? [...liste, { id: k.id, name: k.name }] : liste } });
  };
  const jetztHolen = () => tun("holen", () => exklusiv(async () => {
    if (!einst || !vaultHandle || !einst.einlesen?.an) return;
    const v = await einlesenVorbereiten((await readLocalVaultData(vaultHandle)).records, einst);
    if (v.fehler.length && !v.schritte.length) throw new Error(v.fehler[0]);
    if (v.zaehlung.konflikte) { setHolVorschau(v); return; }
    const z = await einlesenAusfuehren(vaultHandle, einst, v); await onRefresh();
    onNotice({ kind: "success", text: `Termine geholt: ${einleseText(z)}${v.fehler.length ? ` ${v.fehler[0]}` : ""}` });
  }));
  const holenEntscheiden = (wahl: Record<string, "hier" | "dort">) => tun("holen", () => exklusiv(async () => {
    if (!einst || !vaultHandle || !holVorschau) return;
    const z = await einlesenAusfuehren(vaultHandle, einst, holVorschau, wahl); setHolVorschau(null); await onRefresh();
    onNotice({ kind: "success", text: `Termine geholt: ${einleseText(z)}` });
  }));

  const trennen = () => tun("trennen", async () => {
    if (!einst) return;
    const ziel = { anbieter: einst.anbieter, kalenderId: einst.kalenderId };
    const mit = records.filter((r) => (kalenderFelder(r).kalender || []).some((z) => z.anbieter === ziel.anbieter && z.kalenderId === ziel.kalenderId));
    const a = ANBIETER[einst.anbieter];
    if (einst.anbieter !== "ics" && mit.length && a.verbunden() && await askConfirm(`Auch die ${mit.length} eingetragenen Termine aus dem Kalender löschen? „Abbrechen“ lässt sie im Kalender stehen.`)) {
      for (const r of mit) { const z = kalenderFelder(r).kalender!.find((x) => x.anbieter === ziel.anbieter && x.kalenderId === ziel.kalenderId)!; await a.entfernen(einst.kalenderId, z.eintragId).catch(() => undefined); }
      if (vaultHandle) { await updateLocalScheduleKalender(vaultHandle, mit.map((r) => ({ id: r.id, ziel, zuordnung: null }))); await onRefresh(); }
    }
    await a.trennen();
    kalenderEinstSchreiben(null); setWahl(null); setListe(null); setKalenderId("");
    onNotice({ kind: "info", text: "Kalender getrennt. Die Anmeldung ist vergessen." });
  });

  const knoten = [
    { titel: "Kalender wählen", unter: verbunden ? kalenderZiel(einst) : "Gerät, Google, Microsoft oder Datei", ziel: "#kalender-schritt-wahl", art: verbunden ? "gut" as const : "normal" as const },
    { titel: "Erinnerung festlegen", unter: (einst?.erinnerungen || erinnerungen).map((w) => erinnerungsName(w)).join(", ") || "keine", ziel: "#kalender-schritt-erinnerung", art: verbunden ? "gut" as const : "normal" as const },
    { titel: "Vorhandene Fristen übernehmen", unter: ohneHaken.length ? `${ohneHaken.length} offen, noch nicht gewählt` : "alle offenen sind gewählt", ziel: "#kalender-schritt-uebernehmen", art: verbunden && !ohneHaken.length ? "gut" as const : "normal" as const },
    { titel: "Fertig", unter: einst?.anbieter === "ics" ? "Datei bei Änderungen neu ausgeben" : "neue Fristen gehen von selbst hinein, erledigte werden entfernt", art: verbunden && !ohneHaken.length && !warten ? "gut" as const : "normal" as const },
  ];

  // Klaus 2026-11-05: eingeklappt, ein Knopf geht auf – das Verbinden macht man einmal.
  return <details className="card kalender-karte" id="kalender-verbinden" aria-label="Kalender verbinden" data-klapp="kalender-verbinden" data-kalender-karte data-verbunden={verbunden ? einst!.anbieter : "nein"}>
    <summary className="kalender-karte-kopf" data-kalender-aufklapper><span className="kalender-karte-titel"><CalendarCog size={18}/> Kalender verbinden</span>{verbunden ? <span className="badge success" data-kalender-status><CalendarCheck size={14}/> {kalenderZiel(einst)}</span> : <span className="badge neutral">nicht verbunden</span>}<span className="kalender-karte-pfeil" aria-hidden="true">▾</span></summary>
    <Ablaufbild label="Kalender verbinden in vier Schritten" knoten={knoten}/>

    <div id="kalender-schritt-wahl" className="kalender-schritt" tabIndex={-1}>
      <h3>1 · Kalender wählen</h3>
      {/* Klaus 2026-11-05: eine schmale Auswahl statt Kacheln, ohne Erklärtext; Erklärung hinter dem „?“. */}
      <div className="kalender-wahl-zeile"><label className="kalender-wahl"><span className="sr-only">Kalender wählen</span><select value={wahl || ""} disabled={Boolean(busy)} onChange={(e) => { const art = e.target.value as KalenderAnbieter; if (art) void anbieterWaehlen(art); }} data-kalender-anbieter-wahl>
        <option value="" disabled>Kalender wählen ▽</option>
        {anbieterFuer(pl).map((art) => { const z = ANBIETER[art].zustand(); return <option key={art} value={art} disabled={!z.bereit} data-anbieter={art}>{anbieterKurz[art]}{z.bereit ? "" : ` – ${z.grund.replace(/\.$/, "")}`}</option>; })}
      </select></label><InfoPopover label="Welche Kalender?" text={pl === "android" ? "Kalender auf diesem Gerät: alle Kalender, die das Handy führt (Samsung, Google, Outlook). Kalenderdatei (.ics): eine Datei mit allen Fristen zum Öffnen in einer Kalender-App. Ohne Uhrzeit steht eine Frist um 9 Uhr im Kalender." : "Google und Microsoft: mit dem eigenen Konto anmelden, die Anmeldung gilt bis zum Schließen. Kalenderdatei (.ics): eine Datei mit allen Fristen zum Öffnen in Outlook, der Kalender-App oder Google. Ohne Uhrzeit steht eine Frist um 9 Uhr im Kalender."}/></div>
      {liste && wahl && wahl !== "ics" && <div className="kalender-liste"><label><span>Kalender bei {kalenderAnbieterNamen[wahl]}</span><select value={kalenderId} onChange={(e) => setKalenderId(e.target.value)} data-kalender-liste>{liste.map((k) => <option key={k.id} value={k.id}>{k.name}{k.konto ? ` (${k.konto})` : ""}</option>)}</select></label>{!liste.length && <p className="form-error">Kein beschreibbarer Kalender gefunden.</p>}{(() => { const inGebrauch = Boolean(einst && einst.anbieter === wahl && einst.kalenderId === kalenderId); return <><button type="button" className={`button primary kalender-verwenden${inGebrauch ? " step-complete" : ""}`} disabled={!kalenderId || Boolean(busy)} aria-pressed={inGebrauch} data-kalender-verwenden={inGebrauch ? "ja" : "nein"} onClick={() => void kalenderUebernehmen()}>{inGebrauch ? <><CalendarCheck size={16}/> ✓ Wird verwendet</> : <><CalendarPlus size={16}/> Diesen Kalender verwenden</>}</button>{inGebrauch && <p className="fine-print" data-kalender-verwendet>Neue Fristen mit Haken gehen in diesen Kalender.</p>}</>; })()}</div>}
    </div>

    <div id="kalender-schritt-erinnerung" className="kalender-schritt" tabIndex={-1}>
      <h3>2 · Erinnerung festlegen</h3>
      {einst?.anbieter === "microsoft" && <p className="fine-print">Microsoft kennt eine Erinnerung je Termin: es gilt die früheste.</p>}
      <ErinnerungsChips wert={erinnerungen} onChange={erinnerungSetzen} name="Erinnerung als Vorgabe"/>
    </div>

    <div id="kalender-schritt-uebernehmen" className="kalender-schritt" tabIndex={-1}>
      <h3>3 · Vorhandene offene Fristen übernehmen</h3>
      {ohneHaken.length > 0 && <p className="fine-print">{`${ohneHaken.length} offene Frist${ohneHaken.length === 1 ? "" : "en"} und Aufgaben sind noch nicht für den Kalender gewählt.`}</p>}
      <button type="button" className="button secondary" disabled={!ohneHaken.length || !vaultHandle || Boolean(busy)} onClick={() => void vorhandeneUebernehmen()} data-kalender-uebernehmen>Einmal alle offenen eintragen</button>
    </div>

    {verbunden && einst!.anbieter !== "ics" && <div id="kalender-schritt-holen" className="kalender-schritt" tabIndex={-1} data-kalender-holen={einst!.einlesen?.an ? "an" : "aus"}>
      <h3>5 · Termine aus dem Kalender holen</h3>
      <label className="checkbox-row"><input type="checkbox" checked={Boolean(einst!.einlesen?.an)} disabled={Boolean(busy)} onChange={(e) => void holenAn(e.target.checked)} data-kalender-holen-schalter/> Termine aus dem Kalender als Fristen in die Akte holen</label>
      {einst!.einlesen?.an && <>
        <p className="fine-print">Welche Kalender? Neue Termine werden angelegt, Änderungen übernommen, im Kalender Gelöschtes wird in der Akte archiviert. Wurde ein Termin hier und im Kalender geändert, fragt die App. Eigene Einträge der Akte werden nicht noch einmal geholt.</p>
        {holListe ? <ul className="kalender-hol-liste" data-kalender-hol-liste>{holListe.map((k) => <li key={k.id}><label className="checkbox-row"><input type="checkbox" checked={einst!.einlesen!.kalender.some((x) => x.id === k.id)} disabled={Boolean(busy)} onChange={(e) => holKalenderWaehlen(k, e.target.checked)} data-kalender-hol={k.id}/> {k.name}{k.konto ? <small> · {k.konto}</small> : null}</label></li>)}</ul>
          : <p className="fine-print" data-kalender-hol-gewaehlt>Gewählt: {einst!.einlesen!.kalender.map((k) => k.name).join(", ") || "keiner"}. <button type="button" className="text-link" disabled={Boolean(busy)} onClick={() => void holKalenderListe()}>Kalender wählen …</button></p>}
        <div className="button-row"><button type="button" className="button secondary" disabled={Boolean(busy) || !vaultHandle || !einst!.einlesen!.kalender.length} onClick={() => void jetztHolen()} data-kalender-jetzt-holen><Download size={16}/> Jetzt holen</button>{einst!.einlesen?.zuletzt && <small className="fine-print">zuletzt {new Date(einst!.einlesen.zuletzt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</small>}</div>
        {einst!.einlesen?.fehler && <p className="form-error">{einst!.einlesen.fehler}</p>}
      </>}
    </div>}
    {holVorschau && <HolKonflikte vorschau={holVorschau} busy={Boolean(busy)} onEntscheiden={(w) => void holenEntscheiden(w)} onClose={() => setHolVorschau(null)}/>}

    <div className="kalender-schritt">
      <h3>4 · Stand</h3>
      {!verbunden && <p className="fine-print">Noch kein Kalender verbunden.</p>}
      {verbunden && <p data-kalender-stand>{einst!.anbieter === "ics" ? "Kalenderdatei gewählt." : zugangDa ? "Verbunden." : einst!.anbieter === "geraet" ? "Recht „Kalender“ fehlt – „Jetzt abgleichen“ fragt erneut." : "Anmeldung nötig (wird nicht gespeichert)."}{einst!.letzterAbgleich ? ` Letzter Abgleich: ${new Date(einst!.letzterAbgleich).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}.` : ""}{warten ? ` ${warten} Änderung${warten === 1 ? "" : "en"} warten auf den Kalender.` : ""}</p>}
      {verbunden && einst!.letzterFehler && <p className="form-error" data-kalender-fehler>Letzter Fehler: {einst!.letzterFehler}</p>}
      {fehler && <p className="form-error" role="alert" data-kalender-fehler>{fehler}</p>}
      {verbunden && <div className="button-row">
        <button type="button" className="button primary" disabled={Boolean(busy) || !vaultHandle} onClick={() => void jetztAbgleichen()} data-kalender-abgleichen>{einst!.anbieter === "ics" ? <><Download size={16}/> Kalenderdatei ausgeben</> : !zugangDa && einst!.anbieter !== "geraet" ? <><LogIn size={16}/> Neu anmelden und abgleichen</> : <><RefreshCw size={16}/> Jetzt abgleichen</>}</button>
        <button type="button" className="button secondary" disabled={Boolean(busy)} onClick={() => void trennen()} data-kalender-trennen><Link2Off size={16}/> Trennen</button>
      </div>}
      {busy && <p className="fine-print" aria-live="polite">Bitte warten …</p>}
    </div>
  </details>;
}

/** Stufe D: Termin hier und im Kalender geändert – welche Fassung bleibt? Vorgewählt ist die jüngere Änderung. */
function HolKonflikte({ vorschau, busy, onEntscheiden, onClose }: { vorschau: EinleseVorschau; busy: boolean; onEntscheiden: (wahl: Record<string, "hier" | "dort">) => void; onClose: () => void }) {
  const konflikte = vorschau.schritte.filter((s): s is Extract<EinleseVorschau["schritte"][number], { art: "konflikt" }> => s.art === "konflikt");
  const [wahl, setWahl] = useState<Record<string, "hier" | "dort">>(() => Object.fromEntries(konflikte.map((k) => [k.recordId, k.vorschlag])));
  const zeit = (z: string | null) => { if (!z) return "ohne Zeit"; const d = new Date(z); return Number.isNaN(d.getTime()) ? z : d.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" }); };
  const alle = (s: "hier" | "dort") => setWahl(Object.fromEntries(konflikte.map((k) => [k.recordId, s])));
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="kalender-hol-titel" data-kalender-hol-konflikte>
      <div className="modal-head"><div><span className="badge warning">Kalender</span><h2 id="kalender-hol-titel">{konflikte.length === 1 ? "Ein Termin wurde" : `${konflikte.length} Termine wurden`} hier und im Kalender geändert</h2></div><button className="icon-button" onClick={onClose} disabled={busy} aria-label="Fenster schließen"><X/></button></div>
      <p className="fine-print">Dazu kommen {vorschau.zaehlung.anlegen} neue, {vorschau.zaehlung.aendern} geänderte und {vorschau.zaehlung.archivieren} archivierte Termine ohne Frage. Vorgewählt ist jeweils die jüngere Änderung.</p>
      <div className="button-row"><button type="button" className="button secondary" onClick={() => alle("hier")} data-kalender-hol-alle-hier>Alle: meine</button><button type="button" className="button secondary" onClick={() => alle("dort")} data-kalender-hol-alle-dort>Alle: aus dem Kalender</button></div>
      <ul className="einlesen-konflikte">{konflikte.map((k) => <li key={k.recordId} data-kalender-hol-konflikt={k.recordId}>
        <span>{k.hier.title} ({k.hier.dueAt}{k.hier.dueTime ? ` ${k.hier.dueTime}` : ""}) ⟷ {k.felder.title} ({k.felder.dueAt}{k.felder.dueTime ? ` ${k.felder.dueTime}` : ""})</span>
        <label><input type="radio" name={`hol-${k.recordId}`} checked={wahl[k.recordId] === "hier"} onChange={() => setWahl({ ...wahl, [k.recordId]: "hier" })}/> meine ({zeit(k.hierZeit)})</label>
        <label><input type="radio" name={`hol-${k.recordId}`} checked={wahl[k.recordId] === "dort"} onChange={() => setWahl({ ...wahl, [k.recordId]: "dort" })}/> aus dem Kalender ({zeit(k.dortZeit)})</label>
      </li>)}</ul>
      <div className="modal-actions"><button className="button secondary" onClick={onClose} disabled={busy}>Abbrechen</button><button className="button primary" disabled={busy} onClick={() => onEntscheiden(wahl)} data-kalender-hol-los>{busy ? "Läuft …" : "Übernehmen"}</button></div>
    </div>
  </div>;
}
