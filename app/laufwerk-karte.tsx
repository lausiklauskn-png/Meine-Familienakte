/** Stufe C (Plan 08.11.2026): Karte „Gemeinsame Festplatte“ im Sicherheitscenter.
 *  Vorbereiten (Name, Passwort → Kennung + Notfallblatt), vorhandene Platte verbinden (Passwort oder Notfallschlüssel),
 *  Abgleich mit Vorschau (was kommt dazu, Unterschiede wählen, Originale holen/geben), automatisch beim Start und beim
 *  Zurückkehren in die App, wenn der Schlüssel gemerkt ist und es keine Frage gibt. */
import { useCallback, useEffect, useRef, useState } from "react";
import { HardDrive, RefreshCw, X } from "lucide-react";
import type { Seite } from "../lib/abgleich";
import { PASSWORT_MINDESTLAENGE, passwortPruefen } from "../lib/sicherung-krypto";
import { chooseExportDestination } from "./local-vault";
import { abgleichAusfuehren, abgleichVorbereiten, angeschlosseneLaufwerke, gastKoppeln, gastgeberEinrichten, gemerkteLaufwerke, gemerktenOrdnerOeffnen, geraetKennung, laufwerkKopfLesen, laufwerkMerken, laufwerkMoeglich, laufwerkOeffnen, laufwerkVergessen, laufwerkVorbereiten, netzMoeglich, netzSuchen, ortMerken, schluesselMerkbar, type AbgleichVorschau, type Fund, type GemerktesLaufwerk } from "./laufwerk";
import { codeAnzeige, neuerCode, netzPlugin as netzPluginDa } from "./netz-laufwerk";
import { Wifi } from "lucide-react";
import { NotfallblattDialog, SicherungPasswortDialog } from "./sicherung-dialoge";

const zeit = (z: string | null | undefined) => { if (!z) return "–"; const d = new Date(z); return Number.isNaN(d.getTime()) ? z : d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }); };
const AUTO_ABSTAND = 5 * 60 * 1000;

type Offen = { fund: Fund; daten: CryptoKey; vorschau: AbgleichVorschau; auto: boolean };

export function LaufwerkKarte({ aktiv, appVersion, busy, onBusy, onNotice, onRefresh, onDrucken }: {
  aktiv: FileSystemDirectoryHandle | null; appVersion: string; busy: boolean; onBusy: (b: boolean) => void;
  onNotice: (n: { kind: "success" | "error" | "info"; text: string } | null) => void; onRefresh: () => Promise<void>; onDrucken: () => void;
}) {
  const [gemerkt, setGemerkt] = useState<GemerktesLaufwerk[]>([]);
  const [daOrte, setDaOrte] = useState<Record<string, Fund>>({});
  const [vorbereiten, setVorbereiten] = useState(false);
  const [notfall, setNotfall] = useState<{ notfall: string; ordner: string; erstellt: string; danach?: { fund: Fund; daten: CryptoKey } } | null>(null);
  const [passwort, setPasswort] = useState<{ handle: FileSystemDirectoryHandle; name: string; kennung: string; fehler: string; laeuft: boolean; merken: boolean; nachher: "verbinden" | "abgleichen" } | null>(null);
  const [offen, setOffen] = useState<Offen | null>(null);
  const [laeuft, setLaeuft] = useState("");
  // Stufe F: Abgleich im eigenen Netz
  const [gastgeber, setGastgeber] = useState(false);
  const [gast, setGast] = useState(false);
  const [codeZeigen, setCodeZeigen] = useState<string | null>(null);
  const zuletztAuto = useRef<Record<string, number>>({});
  // Rückrufe des Elternteils ändern bei jedem Neuzeichnen ihre Identität; über einen Ref bleiben die eigenen Abläufe stabil.
  const cb = useRef({ onBusy, onNotice, onRefresh }); cb.current = { onBusy, onNotice, onRefresh };
  // Nie zwei Abgleiche zugleich (automatisch und von Hand); ein offenes Fenster hält den automatischen Lauf an.
  const sperre = useRef(false);
  const fensterOffen = useRef(false); fensterOffen.current = Boolean(offen || passwort || vorbereiten || notfall);

  const laden = useCallback(async () => {
    const liste = await gemerkteLaufwerke().catch(() => []); setGemerkt(liste);
    const funde = await angeschlosseneLaufwerke().catch(() => []);
    setDaOrte(Object.fromEntries(funde.map((f) => [f.gemerkt.kennung, f])));
    return { liste, funde };
  }, []);

  const abgleichStarten = useCallback(async (fund: Fund, daten: CryptoKey, auto: boolean) => {
    const { onBusy, onNotice, onRefresh } = cb.current;
    if (!aktiv) { onNotice({ kind: "error", text: "Bitte zuerst den Datentresor verbinden." }); return; }
    if (sperre.current || (auto && fensterOffen.current)) return;
    sperre.current = true; onBusy(true);
    try {
      const vorschau = await abgleichVorbereiten(aktiv, fund.ordner, daten, fund.gemerkt);
      const nichts = !vorschau.plan.zaehlung.neu && !vorschau.plan.zaehlung.uebernommen && !vorschau.plan.konflikte.length && !vorschau.holen && !vorschau.geben && !vorschau.plan.zaehlung.hierGeaendert;
      if (auto && nichts) { zuletztAuto.current[fund.gemerkt.kennung] = Date.now(); return; }
      if (auto && !vorschau.plan.konflikte.length) {
        setLaeuft("Abgleich läuft …");
        const r = await abgleichAusfuehren(aktiv, fund.ordner, daten, fund.gemerkt, vorschau, {}, appVersion, setLaeuft);
        zuletztAuto.current[fund.gemerkt.kennung] = Date.now();
        try { await onRefresh(); await laden(); } catch (error) { console.warn("Auffrischen nach dem Abgleich", error); }
        onNotice({ kind: "success", text: `Festplatte „${fund.gemerkt.name}“ abgeglichen: ${r.neu} neu, ${r.uebernommen} übernommen, ${r.geholt} Originale geholt, ${r.gegeben} gegeben.${r.fehlen.length ? ` ${r.fehlen.length} Originale liegen noch auf keinem angeschlossenen Gerät.` : ""}` });
        return;
      }
      setOffen({ fund, daten, vorschau, auto });
    } catch (error) { onNotice({ kind: "error", text: error instanceof Error ? error.message : "Der Abgleich konnte nicht vorbereitet werden." }); }
    finally { setLaeuft(""); onBusy(false); sperre.current = false; }
  }, [aktiv, appVersion, laden]);

  // Automatisch: beim Start und beim Zurückkehren in die App, höchstens alle 5 Minuten je Platte, nur mit gemerktem Schlüssel.
  useEffect(() => {
    if (!laufwerkMoeglich()) return;
    let aktivSchalter = true;
    const pruefen = async () => {
      const { funde } = await laden();
      if (!aktivSchalter || !aktiv) return;
      for (const f of funde) {
        if (!f.gemerkt.schluessel || Date.now() - (zuletztAuto.current[f.gemerkt.kennung] || 0) < AUTO_ABSTAND) continue;
        const daten = (await laufwerkOeffnen(f.handle, { schluessel: f.gemerkt.schluessel }).catch(() => null))?.daten; if (!daten) continue;
        await abgleichStarten(f, daten, true); break;
      }
    };
    void pruefen();
    const sichtbar = () => { if (document.visibilityState === "visible") void pruefen(); };
    document.addEventListener("visibilitychange", sichtbar);
    // „Beim Anstecken“: solange die Karte offen ist, alle 30 Sekunden nachsehen, ob eine gemerkte Platte da ist.
    const takt = window.setInterval(() => { if (document.visibilityState === "visible") void pruefen(); }, 30000);
    window.addEventListener("familienakte:laufwerk-pruefen", sichtbar);
    return () => { aktivSchalter = false; document.removeEventListener("visibilitychange", sichtbar); window.removeEventListener("familienakte:laufwerk-pruefen", sichtbar); window.clearInterval(takt); };
  }, [aktiv, laden, abgleichStarten]);

  const vorbereitenLos = async (name: string, pw: string) => {
    setVorbereiten(false); onBusy(true);
    try {
      const handle = await chooseExportDestination("Festplatte oder Ordner für den Abgleich wählen");
      const r = await laufwerkVorbereiten(handle, name, pw, appVersion);
      const ort = await ortMerken(handle, r.kopf.laufwerk.kennung);
      const g: GemerktesLaufwerk = { kennung: r.kopf.laufwerk.kennung, name: r.kopf.laufwerk.name, ort, schluessel: await schluesselMerkbar(r.daten), basis: {}, letzterAbgleich: null, angelegt: r.kopf.laufwerk.angelegt };
      await laufwerkMerken(g);
      await laden();
      onNotice({ kind: "success", text: `Festplatte „${r.kopf.laufwerk.name}“ vorbereitet. Jedes Gerät erkennt sie jetzt an ihrer Kennung.` });
      // Erst das Notfallblatt, danach gleich der erste Abgleich (deine Akte wird der erste Stand auf der Platte).
      setNotfall({ notfall: r.notfall, ordner: r.kopf.laufwerk.name, erstellt: r.kopf.laufwerk.angelegt, danach: { fund: { gemerkt: g, handle, ordner: r.ordner, kopf: r.kopf }, daten: r.daten } });
    } catch (error) { if ((error as DOMException)?.name !== "AbortError") onNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Festplatte konnte nicht vorbereitet werden." }); }
    finally { onBusy(false); }
  };
  const verbinden = async () => {
    onBusy(true);
    try {
      const handle = await chooseExportDestination("Vorbereitete Festplatte wählen");
      const fund = await laufwerkKopfLesen(handle);
      if (!fund) throw new Error("In diesem Ordner liegt keine vorbereitete Familienakte-Festplatte. Zuerst „Festplatte vorbereiten“ an einem Gerät.");
      setPasswort({ handle, name: fund.kopf.laufwerk.name, kennung: fund.kopf.laufwerk.kennung, fehler: "", laeuft: false, merken: true, nachher: "verbinden" });
    } catch (error) { if ((error as DOMException)?.name !== "AbortError") onNotice({ kind: "error", text: error instanceof Error ? error.message : "Die Festplatte konnte nicht gelesen werden." }); }
    finally { onBusy(false); }
  };
  const zugang = async (z: { passwort?: string; notfall?: string }) => {
    if (!passwort) return;
    setPasswort({ ...passwort, laeuft: true, fehler: "" });
    try {
      const r = await laufwerkOeffnen(passwort.handle, z);
      const ort = await ortMerken(passwort.handle, r.kopf.laufwerk.kennung);
      const alt = gemerkt.find((g) => g.kennung === r.kopf.laufwerk.kennung);
      const g: GemerktesLaufwerk = { kennung: r.kopf.laufwerk.kennung, name: r.kopf.laufwerk.name, ort, schluessel: passwort.merken ? await schluesselMerkbar(r.daten) : null, basis: alt?.basis || {}, letzterAbgleich: alt?.letzterAbgleich || null, angelegt: r.kopf.laufwerk.angelegt };
      await laufwerkMerken(g); setPasswort(null); await laden();
      await abgleichStarten({ gemerkt: g, handle: passwort.handle, ordner: r.ordner, kopf: r.kopf }, r.daten, false);
    } catch (error) {
      const text = error instanceof Error ? error.message : "";
      setPasswort({ ...passwort, laeuft: false, fehler: text === "PASSWORT_FALSCH" ? (z.notfall ? "Der Notfallschlüssel passt nicht zu dieser Festplatte." : "Das Passwort ist falsch.") : text || "Die Festplatte konnte nicht geöffnet werden." });
    }
  };
  const jetztAbgleichen = async (g: GemerktesLaufwerk) => {
    let fund = daOrte[g.kennung];
    if (!fund) {
      const handle = await gemerktenOrdnerOeffnen(g.kennung).catch(() => null);
      const kopf = handle ? await laufwerkKopfLesen(handle).catch(() => null) : null;
      if (!handle || !kopf) { onNotice({ kind: "error", text: `„${g.name}“ ist nicht angeschlossen oder nicht freigegeben. Bitte anstecken und erneut versuchen.` }); return; }
      fund = { gemerkt: g, handle, ordner: kopf.ordner, kopf: kopf.kopf };
    }
    if (g.schluessel) { const r = await laufwerkOeffnen(fund.handle, { schluessel: g.schluessel }).catch(() => null); if (r) { await abgleichStarten(fund, r.daten, false); return; } }
    setPasswort({ handle: fund.handle, name: g.name, kennung: g.kennung, fehler: "", laeuft: false, merken: Boolean(g.schluessel), nachher: "abgleichen" });
  };
  const ausfuehren = async (wahl: Record<string, Seite>) => {
    if (!offen || !aktiv || sperre.current) return;
    sperre.current = true; onBusy(true); setLaeuft("Abgleich läuft …");
    try {
      const r = await abgleichAusfuehren(aktiv, offen.fund.ordner, offen.daten, offen.fund.gemerkt, offen.vorschau, wahl, appVersion, setLaeuft);
      zuletztAuto.current[offen.fund.gemerkt.kennung] = Date.now();
      setOffen(null);
      cb.current.onNotice({ kind: "success", text: `Festplatte „${offen.fund.gemerkt.name}“ abgeglichen: ${r.neu} neu, ${r.uebernommen} übernommen${r.konflikteDort ? `, ${r.konflikteDort} Fassungen von der Festplatte gewählt` : ""}, ${r.geholt} Originale geholt, ${r.gegeben} gegeben. Nichts wurde gelöscht.${r.fehlen.length ? ` ${r.fehlen.length} Originale liegen noch auf keinem angeschlossenen Gerät.` : ""}` });
      // Auffrischen darf den Erfolg nicht verschlucken: der Abgleich selbst ist geschrieben.
      try { await cb.current.onRefresh(); await laden(); } catch (error) { console.warn("Auffrischen nach dem Abgleich", error); }
    } finally { setLaeuft(""); onBusy(false); sperre.current = false; }
  };
  const vergessen = async (g: GemerktesLaufwerk) => {
    if (g.netz?.rolle === "gastgeber") await netzPluginDa()?.stop().catch(() => undefined);
    await laufwerkVergessen(g.kennung); await laden();
    onNotice({ kind: "info", text: g.netz ? `„${g.name}“ (Netz) wird auf diesem Gerät nicht mehr gemerkt.${g.netz.rolle === "gastgeber" ? " Der Dienst ist aus; der Abgleich-Ordner bleibt in der App." : ""}` : `„${g.name}“ wird auf diesem Gerät nicht mehr gemerkt. Die Daten auf der Festplatte bleiben.` });
  };
  const gastgeberLos = async (name: string, code: string) => {
    setGastgeber(false); onBusy(true);
    try {
      const r = await gastgeberEinrichten(name, code, appVersion);
      await laden();
      onNotice({ kind: "success", text: `Dieses Gerät ist jetzt Gastgeber „${r.gemerkt.name}“ (Port ${r.zustand.port}${r.zustand.adressen.length ? `, ${r.zustand.adressen.join(", ")}` : ""}). Am anderen Gerät „Mit Gastgeber koppeln“ und den Code eingeben.` });
      setNotfall({ notfall: r.notfall, ordner: r.gemerkt.name, erstellt: r.gemerkt.angelegt, danach: { fund: r.fund, daten: r.daten } });
    } catch (error) { onNotice({ kind: "error", text: error instanceof Error ? error.message : "Der Gastgeber konnte nicht eingerichtet werden." }); }
    finally { onBusy(false); }
  };
  const gastLos = async (treffer: { kennung: string; name: string; port: number; adresse: string }, code: string) => {
    onBusy(true);
    try {
      const r = await gastKoppeln(treffer, code);
      setGast(false); await laden();
      await abgleichStarten(r.fund, r.daten, false);
    } catch (error) { onBusy(false); throw error; }
    finally { onBusy(false); }
  };

  if (!laufwerkMoeglich()) return <article className="card security-action-card" data-laufwerk-karte="nicht-moeglich"><div className="security-card-heading"><h2><HardDrive size={18}/> Gemeinsame Festplatte</h2></div><p className="sync-message warning">Hier nicht möglich: Die Web-App kann auf diesem Gerät keinen Ordner wählen. Der Abgleich über eine Festplatte geht in der Android- oder Windows-App oder am PC in Chrome oder Edge.</p></article>;
  const geraet = geraetKennung();
  return <>
    <article className="card security-action-card" data-hilfe-ziel="laufwerk" data-laufwerk-karte={gemerkt.length}>
      <div className="security-card-heading"><h2><HardDrive size={18}/> Gemeinsame Festplatte</h2></div>
      <p className="fine-print">Eine SD-Karte, USB-Platte oder ein Netzordner, den Handy, Tablet und PC abwechselnd bekommen. Jedes Gerät erkennt die Platte an ihrer Kennung und gleicht ab: Neues kommt dazu, bei Unterschieden fragt die App, gelöscht wird nichts. Dieses Gerät heißt „{geraet.name}“.</p>
      {gemerkt.length > 0 && <ul className="laufwerk-liste">{gemerkt.map((g) => { const da = Boolean(daOrte[g.kennung]); return <li key={g.kennung} data-laufwerk={g.kennung} data-laufwerk-da={da ? "ja" : "nein"}>
        <span className={`badge ${da ? "success" : ""}`}>{da ? "angeschlossen" : "nicht angeschlossen"}</span>
        <strong>{g.netz ? <Wifi size={15}/> : null} {g.name}{g.netz ? ` · ${g.netz.rolle === "gastgeber" ? "dieses Gerät ist Gastgeber" : `Gast${g.netz.adresse ? ` bei ${g.netz.adresse}` : ""}`}` : ""}</strong>
        <small>zuletzt abgeglichen: {zeit(g.letzterAbgleich)}{g.schluessel ? " · Schlüssel gemerkt" : " · fragt nach dem Passwort"}</small>
        <span className="button-row"><button className="button primary" disabled={busy} onClick={() => void jetztAbgleichen(g)} data-laufwerk-abgleichen><RefreshCw size={15}/> Jetzt abgleichen</button>{g.netz?.rolle === "gastgeber" && g.netz.code && <button className="button secondary" disabled={busy} onClick={() => setCodeZeigen(codeZeigen === g.kennung ? null : g.kennung)} data-laufwerk-code-zeigen>{codeZeigen === g.kennung ? "Code verbergen" : "Kopplungscode zeigen"}</button>}<button className="button secondary" disabled={busy} onClick={() => void vergessen(g)} data-laufwerk-vergessen>Vergessen</button></span>
        {codeZeigen === g.kennung && g.netz?.code && <p className="notfall-schluessel" data-laufwerk-code>{codeAnzeige(g.netz.code)}</p>}
      </li>; })}</ul>}
      {laeuft && <p className="notiz-gespeichert" role="status" data-laufwerk-laeuft>{laeuft}</p>}
      <div className="button-row"><button className="button secondary" disabled={busy || !aktiv} onClick={() => setVorbereiten(true)} data-laufwerk-vorbereiten>Festplatte vorbereiten …</button><button className="button secondary" disabled={busy || !aktiv} onClick={() => void verbinden()} data-laufwerk-verbinden>Vorhandene Festplatte verbinden …</button></div>
      {netzMoeglich() ? <>
        <p className="fine-print" data-laufwerk-netz="ja"><Wifi size={14}/> <strong>Ohne Platte, im eigenen Netz</strong> (WLAN, LAN-Kabel oder USB-Kabel mit Netzfreigabe): Ein Gerät ist Gastgeber, die anderen koppeln einmal mit einem Code und gleichen danach von selbst ab, sobald sie den Gastgeber im Netz sehen. Kein Internet, kein fremder Server.</p>
        <div className="button-row"><button className="button secondary" disabled={busy || !aktiv} onClick={() => setGastgeber(true)} data-laufwerk-gastgeber>Dieses Gerät als Gastgeber …</button><button className="button secondary" disabled={busy || !aktiv} onClick={() => setGast(true)} data-laufwerk-gast>Mit Gastgeber koppeln …</button></div>
      </> : <p className="fine-print" data-laufwerk-netz="nein">Der Abgleich im eigenen Netz (WLAN, Kabel) geht in der Android- und der Windows-App – die Web-App im Browser darf im Heimnetz keine andere Geräte ansprechen.</p>}
      <p className="fine-print">Gemerkt wird der Schlüssel nur im eigenen Speicher dieser App auf diesem Gerät, nie auf der Festplatte. Wer das entsperrte Gerät hat, kann abgleichen; sonst hilft „Vergessen“.</p>
    </article>
    {vorbereiten && <VorbereitenDialog onStart={(name, pw) => void vorbereitenLos(name, pw)} onClose={() => setVorbereiten(false)}/>}
    {gastgeber && <GastgeberDialog onStart={(name, code) => void gastgeberLos(name, code)} onClose={() => setGastgeber(false)}/>}
    {gast && <GastDialog onKoppeln={gastLos} onClose={() => setGast(false)}/>}
    {notfall && <NotfallblattDialog notfall={notfall.notfall} ordner={notfall.ordner} erstellt={notfall.erstellt} appVersion={appVersion} onDrucken={onDrucken} onClose={() => { const d = notfall.danach; setNotfall(null); if (d) void abgleichStarten(d.fund, d.daten, false); }}/>}
    {passwort && <SicherungPasswortDialog ordner={passwort.name} fehler={passwort.fehler} laeuft={passwort.laeuft} onZugang={(z) => void zugang(z)} onClose={() => setPasswort(null)}
      extra={<label className="checkbox-row" data-laufwerk-merken><input type="checkbox" checked={passwort.merken} onChange={(e) => setPasswort({ ...passwort, merken: e.target.checked })}/> Schlüssel auf diesem Gerät merken (dann gleicht die App beim Anstecken von selbst ab)</label>}/>}
    {offen && <AbgleichDialog offen={offen} laeuft={laeuft} onAbgleichen={ausfuehren} onClose={() => setOffen(null)}/>}
  </>;
}

function VorbereitenDialog({ onStart, onClose }: { onStart: (name: string, passwort: string) => void; onClose: () => void }) {
  const [name, setName] = useState("Familienakte-Platte"); const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [zeigen, setZeigen] = useState(false); const [fehler, setFehler] = useState("");
  const los = () => { const f = passwortPruefen(pw); if (f) { setFehler(f); return; } if (pw !== pw2) { setFehler("Die beiden Eingaben stimmen nicht überein."); return; } onStart(name, pw); };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="laufwerk-vorbereiten-titel" data-laufwerk-vorbereiten-dialog>
      <div className="modal-head"><div><span className="badge">Gemeinsame Festplatte</span><h2 id="laufwerk-vorbereiten-titel">Festplatte vorbereiten</h2></div><button className="icon-button" onClick={onClose} aria-label="Fenster schließen"><X/></button></div>
      <ul className="fine-print"><li>Auf der Platte entsteht der Ordner „Familienakte-Abgleich“ mit einer festen Kennung. Vorhandene Dateien bleiben unberührt.</li><li>Alles darin ist verschlüsselt. Das Passwort wird nirgends gespeichert; danach kommt ein Notfallblatt.</li><li>Andere Geräte: „Vorhandene Festplatte verbinden“ und einmal das Passwort eingeben.</li></ul>
      <div className="form-grid">
        <label>Name der Platte<input value={name} onChange={(e) => setName(e.target.value)} data-laufwerk-name/></label>
        <label>Passwort (mindestens {PASSWORT_MINDESTLAENGE} Zeichen)<input type={zeigen ? "text" : "password"} value={pw} autoComplete="new-password" onChange={(e) => { setPw(e.target.value); setFehler(""); }} data-passwort/></label>
        <label>Passwort wiederholen<input type={zeigen ? "text" : "password"} value={pw2} autoComplete="new-password" onChange={(e) => { setPw2(e.target.value); setFehler(""); }} data-passwort-wieder/></label>
        <label className="checkbox-row"><input type="checkbox" checked={zeigen} onChange={(e) => setZeigen(e.target.checked)}/> Passwort anzeigen</label>
      </div>
      {fehler && <p className="form-error" data-laufwerk-fehler>{fehler}</p>}
      <div className="modal-actions"><button className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary" onClick={los} data-laufwerk-los>Ordner wählen und vorbereiten</button></div>
    </div>
  </div>;
}

function AbgleichDialog({ offen, laeuft, onAbgleichen, onClose }: { offen: Offen; laeuft: string; onAbgleichen: (wahl: Record<string, Seite>) => Promise<void>; onClose: () => void }) {
  const v = offen.vorschau, z = v.plan.zaehlung;
  const [wahl, setWahl] = useState<Record<string, Seite>>(() => Object.fromEntries(v.plan.konflikte.map((k) => [k.schluessel, k.vorschlag])));
  const [fehler, setFehler] = useState("");
  const nichts = !z.neu && !z.uebernommen && !v.plan.konflikte.length && !v.holen && !v.geben && !z.hierGeaendert;
  const alle = (s: Seite) => setWahl(Object.fromEntries(v.plan.konflikte.map((k) => [k.schluessel, s])));
  const los = async () => { setFehler(""); try { await onAbgleichen(wahl); } catch (e) { setFehler(e instanceof Error ? e.message : "Abgleich nicht möglich."); } };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !laeuft && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="laufwerk-abgleich-titel" data-laufwerk-abgleich>
      <div className="modal-head"><div><span className="badge">{offen.fund.gemerkt.name}</span><h2 id="laufwerk-abgleich-titel">Abgleich mit der Festplatte</h2></div><button className="icon-button" onClick={onClose} disabled={Boolean(laeuft)} aria-label="Fenster schließen"><X/></button></div>
      <p className="fine-print">{v.erstesMal ? "Auf der Festplatte liegt noch kein Stand – deine Akte wird der erste." : `Stand auf der Festplatte von „${v.standVon?.geraet.name}“, ${zeit(v.standVon?.zeit)}.`}</p>
      <ul data-laufwerk-zaehlung>
        <li>{z.neu} Einträge kommen von der Festplatte dazu</li>
        <li>{z.uebernommen} Änderungen werden still übernommen</li>
        <li>{v.erstesMal ? `${z.nurHier} Einträge gehen auf die Festplatte` : `${z.hierGeaendert} eigene Änderungen gehen auf die Festplatte`}</li>
        <li>{v.holen} Originale werden geholt, {v.geben} gegeben</li>
        {v.plan.konflikte.length > 0 && <li><strong>{v.plan.konflikte.length} unterscheiden sich</strong> – unten wählen</li>}
        {v.fehlen.length > 0 && <li>{v.fehlen.length} Originale liegen weder hier noch auf der Festplatte (kommen vom Gerät, das sie hat)</li>}
      </ul>
      {v.plan.konflikte.length > 0 && <div className="einlesen-konflikte" data-laufwerk-konflikte>
        <div className="button-row"><strong>Welche Fassung behalten?</strong><button type="button" className="button secondary" onClick={() => alle("hier")} data-laufwerk-alle-hier>Alle: meine</button><button type="button" className="button secondary" onClick={() => alle("dort")} data-laufwerk-alle-dort>Alle: von der Festplatte</button></div>
        <ul>{v.plan.konflikte.map((k) => <li key={k.schluessel} data-laufwerk-konflikt={k.schluessel}><span>{k.titel}</span>
          <label><input type="radio" name={k.schluessel} checked={wahl[k.schluessel] === "hier"} onChange={() => setWahl({ ...wahl, [k.schluessel]: "hier" })}/> meine ({zeit(k.hierZeit)})</label>
          <label><input type="radio" name={k.schluessel} checked={wahl[k.schluessel] === "dort"} onChange={() => setWahl({ ...wahl, [k.schluessel]: "dort" })}/> von der Festplatte ({zeit(k.dortZeit)})</label>
        </li>)}</ul>
      </div>}
      {laeuft && <p className="notiz-gespeichert" role="status">{laeuft}</p>}
      {fehler && <p className="form-error">{fehler}</p>}
      <p className="fine-print">Gelöscht wird nichts. Das bisherige Register wird vorher gesichert.</p>
      <div className="modal-actions"><button className="button secondary" onClick={onClose} disabled={Boolean(laeuft)}>{nichts ? "Schließen" : "Abbrechen"}</button>{!nichts && <button className="button primary" disabled={Boolean(laeuft)} onClick={() => void los()} data-laufwerk-los-abgleich>{laeuft ? "Läuft …" : "Abgleichen"}</button>}</div>
    </div>
  </div>;
}

/** Stufe F: Gastgeber – Name und ein frischer Kopplungscode (9 Ziffern), den man am anderen Gerät eintippt. */
function GastgeberDialog({ onStart, onClose }: { onStart: (name: string, code: string) => void; onClose: () => void }) {
  const [name, setName] = useState(`Netz-Abgleich ${geraetKennung().name}`); const [code] = useState(neuerCode);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="gastgeber-titel" data-laufwerk-gastgeber-dialog>
      <div className="modal-head"><div><span className="badge">Im eigenen Netz</span><h2 id="gastgeber-titel">Dieses Gerät als Gastgeber</h2></div><button className="icon-button" onClick={onClose} aria-label="Fenster schließen"><X/></button></div>
      <ul className="fine-print"><li>Der Gastgeber hält den gemeinsamen Stand in seinem eigenen App-Speicher (verschlüsselt) und bietet ihn im Netz an, solange die App offen ist.</li><li>Andere Geräte koppeln einmal mit diesem Code; danach gleichen sie von selbst ab, wenn sie den Gastgeber sehen.</li><li>Der Code ist zugleich das Passwort; dazu kommt ein Notfallblatt.</li></ul>
      <div className="form-grid">
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} data-gastgeber-name/></label>
        <div><span className="fine-print">Kopplungscode (am anderen Gerät eingeben)</span><p className="notfall-schluessel" data-gastgeber-code>{codeAnzeige(code)}</p></div>
      </div>
      <div className="modal-actions"><button className="button secondary" onClick={onClose}>Abbrechen</button><button className="button primary" onClick={() => onStart(name, code)} data-gastgeber-los>Gastgeber werden</button></div>
    </div>
  </div>;
}

/** Stufe F: Gast – Gastgeber im Netz suchen, einen wählen, Code eingeben. */
function GastDialog({ onKoppeln, onClose }: { onKoppeln: (t: { kennung: string; name: string; port: number; adresse: string }, code: string) => Promise<void>; onClose: () => void }) {
  const [treffer, setTreffer] = useState<Array<{ kennung: string; name: string; port: number; adresse: string }> | null>(null);
  const [wahl, setWahl] = useState<string>(""); const [code, setCode] = useState(""); const [fehler, setFehler] = useState(""); const [laeuft, setLaeuft] = useState(false);
  const [adresse, setAdresse] = useState(""); const [port, setPort] = useState("48200");
  const suchen = useCallback(async () => { setLaeuft(true); try { const t = await netzSuchen(2500); setTreffer(t); if (t.length === 1) setWahl(t[0].kennung); } finally { setLaeuft(false); } }, []);
  useEffect(() => { void suchen(); }, [suchen]);
  const los = async () => {
    setFehler("");
    const t = treffer?.find((x) => x.kennung === wahl) || (adresse.trim() ? { kennung: "", name: adresse.trim(), port: Number(port) || 48200, adresse: adresse.trim() } : null);
    if (!t) { setFehler("Bitte einen Gastgeber wählen oder seine Adresse eingeben."); return; }
    if (code.replace(/\D/g, "").length !== 9) { setFehler("Der Kopplungscode hat 9 Ziffern."); return; }
    setLaeuft(true);
    try {
      // Ohne Kennung (Adresse von Hand): der Gastgeber nennt sie im Kopf – Token braucht die Kennung, darum erst anfragen.
      if (!t.kennung) { const gefunden = (await netzSuchen(1500)).find((x) => x.adresse === t.adresse); if (!gefunden) throw new Error("Unter dieser Adresse meldet sich kein Gastgeber. Ist dort die Familienakte offen und Gastgeber?"); await onKoppeln(gefunden, code); }
      else await onKoppeln(t, code);
    } catch (e) { const text = e instanceof Error ? e.message : ""; setFehler(text === "PASSWORT_FALSCH" ? "Der Code passt nicht zu diesem Gastgeber." : text || "Koppeln nicht möglich."); setLaeuft(false); }
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !laeuft && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="gast-titel" data-laufwerk-gast-dialog>
      <div className="modal-head"><div><span className="badge">Im eigenen Netz</span><h2 id="gast-titel">Mit Gastgeber koppeln</h2></div><button className="icon-button" onClick={onClose} disabled={laeuft} aria-label="Fenster schließen"><X/></button></div>
      <p className="fine-print">Am Gastgeber muss die Familienakte offen sein. Beide Geräte im selben Netz (WLAN, LAN- oder USB-Kabel).</p>
      {treffer === null ? <p data-gast-suche>Suche im Netz …</p> : treffer.length ? <ul className="kalender-hol-liste" data-gast-treffer>{treffer.map((t) => <li key={`${t.kennung}|${t.adresse}`}><label className="checkbox-row"><input type="radio" name="gast-wahl" checked={wahl === t.kennung} onChange={() => setWahl(t.kennung)} data-gast-wahl={t.kennung}/> {t.name} <small>· {t.adresse}:{t.port}</small></label></li>)}</ul>
        : <p className="sync-message warning" data-gast-keiner>Kein Gastgeber gefunden. <button type="button" className="text-link" onClick={() => void suchen()} disabled={laeuft}>Noch einmal suchen</button> – oder die Adresse eingeben, die der Gastgeber anzeigt.</p>}
      {treffer !== null && !treffer.length && <div className="form-grid"><label>Adresse des Gastgebers<input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="192.168.…" data-gast-adresse/></label><label>Port<input value={port} onChange={(e) => setPort(e.target.value)} data-gast-port/></label></div>}
      <label>Kopplungscode (9 Ziffern)<input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} data-gast-code/></label>
      {fehler && <p className="form-error" data-gast-fehler>{fehler}</p>}
      <div className="modal-actions"><button className="button secondary" onClick={onClose} disabled={laeuft}>Abbrechen</button><button className="button primary" disabled={laeuft} onClick={() => void los()} data-gast-los>{laeuft ? "Wird gekoppelt …" : "Koppeln und abgleichen"}</button></div>
    </div>
  </div>;
}
