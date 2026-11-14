"use client";
// Profilseite „Profile für die Maske“ im Sicherheitscenter (Plan Pseudonymisieren, Stufe C; Vorschau
// docs/vorschau/maske-profile-stufe-c.html). Ich · Familie · Kontakte · Stellen, verknüpft mit der Akte, Schreibweisen,
// Nummern nur als Fingerabdruck, „immer verdecken“/„darf bleiben“, Übernehmen aus anderer Pro-App oder selbst anlegen.
import { useMemo, useState } from "react";
import { InfoPopover } from "./ui-controls";
import {
  ART_NAME, APP_NAMEN, PROFIL_ARTEN, ausAkteUebernehmen, eintragAendern, eintragAnlegen, eintragEntfernen, eintragName, neueProfile,
  nummerAbdruck, nummerAnzeige, platzhalter, schreibweiseDazu, vorschlaegeAusAkte, zusammenfuehren, alsEigene,
  type MaskeProfile, type ProfilArt, type ProfilEintrag, type ZusammenBericht,
} from "../lib/maske-profil";
import { profileLaden, profileSpeichern, useMaskeProfile, type FremdeProfile } from "./maske-profil-speicher";

type AkteRecord = { id?: string; type?: string; data?: Record<string, unknown> };
const QUELLE: Record<ProfilEintrag["quelle"], string> = { akte: "aus der Akte verknüpft", selbst: "selbst angelegt", korrektur: "beim Korrigieren gemerkt", uebernommen: "aus anderer Pro-App" };
const SORTEN = ["Kundennummer", "Vertragsnummer", "Versicherungsnummer", "Mitgliedsnummer", "Steuer-ID", "KVNR", "RV-Nr.", "IBAN", "Ausweis", "Nummer"];
const ERKLAERUNG = "Profile helfen der Maske beim Pseudonymisieren: Wer hier steht, wird immer erkannt – auch in anderer Schreibweise oder in Großbuchstaben. Jeder Eintrag hat einen festen Platzhalter (z. B. ⟦FAMILIE-1⟧), der in allen Texten gleich bleibt. Personen und Organisationen der Akte werden verknüpft, nicht kopiert. Nummern werden nicht gespeichert, nur ein Fingerabdruck (HMAC-SHA-256 mit einem zufälligen Schlüssel); angezeigt werden die letzten vier Zeichen. Die Profile liegen verschlüsselt im Pro-Tresor (Fach „Maske-Profile“), andere Pro-Apps können sie übernehmen. Ohne Pro-Tresor liegen sie im App-Speicher neben der Akte. Basic speichert keine Profile. Profile verlassen dieses Gerät nie: es gibt keinen Netzweg.";

export function MaskeProfileKarte({ records, basic }: { records: AkteRecord[]; basic: boolean }) {
  const s = useMaskeProfile(basic);
  const [gruppe, setGruppe] = useState<ProfilArt | "alle">("alle");
  const [offen, setOffen] = useState<string | null>(null);
  const [meldung, setMeldung] = useState("");
  const [busy, setBusy] = useState(false);
  const [neuArt, setNeuArt] = useState<ProfilArt>("kontakt");
  const [neuName, setNeuName] = useState("");
  const [anlegen, setAnlegen] = useState(false);
  const [vorschlag, setVorschlag] = useState<Array<{ akteId: string; art: ProfilArt; name: string; an: boolean }> | null>(null);
  const [uebernahme, setUebernahme] = useState<{ quelle: FremdeProfile; ergebnis: MaskeProfile; bericht: ZusammenBericht } | null>(null);
  const p = s.eigene;
  const zahl = useMemo(() => Object.fromEntries(PROFIL_ARTEN.map((a) => [a, p?.eintraege.filter((e) => e.art === a).length || 0])) as Record<ProfilArt, number>, [p]);

  if (s.ort === "basic" || s.ort === "demo") return <section className="card maske-profile" data-maske-profile={s.ort}>
    <div className="card-heading"><span className="ui-heading-help"><h2>Profile für die Maske</h2><InfoPopover label="Profile erklären" text={ERKLAERUNG}/></span></div>
    <p>{s.ort === "demo" ? "In der Demo werden keine Profile gespeichert." : "Basic speichert keine Profile. Die Maske verdeckt nach Mustern und mit den Namen deiner Akte. Für eigene Nummern, Schreibweisen und Gesundheitsdaten die Pro-App nehmen."}</p>
  </section>;

  const speichern = async (neu: MaskeProfile, text: string) => {
    setBusy(true);
    try { await profileSpeichern(neu); setMeldung(text); }
    catch (e) { setMeldung(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const basisProfile = async () => p || await neueProfile();
  const aendern = (id: string, f: (e: ProfilEintrag) => ProfilEintrag, text: string) => p && void speichern(eintragAendern(p, id, f), text);

  const sichtbar = (p?.eintraege || []).filter((e) => gruppe === "alle" || e.art === gruppe);
  const andere = s.andere.filter((a) => a.profile && a.profile.eintraege.length);

  return <section className="card maske-profile" data-maske-profile={s.ort}>
    <div className="card-heading"><span className="ui-heading-help"><h2>Profile für die Maske</h2><InfoPopover label="Profile erklären" text={ERKLAERUNG}/></span>
      <span className="badge">{s.ort === "tresor" ? "Pro-Tresor · Maske-Profile" : s.ort === "geraet" ? "App-Speicher" : s.ort === "gesperrt" ? "Tresor gesperrt" : "…"}</span></div>
    <p className="maske-schloss">🔒 Profile verlassen dieses Gerät nie. Nummern sind nur als Fingerabdruck gespeichert.</p>
    {s.fehler && <p className="form-error">{s.fehler}</p>}
    {s.ort === "gesperrt" && <p className="sync-message">Der Pro-Tresor ist gesperrt oder nicht erreichbar. Nach dem Entsperren sind die Profile wieder da; sie werden nicht woanders gespeichert. <button type="button" className="button secondary" onClick={() => void profileLaden(basic)}>Neu lesen</button></p>}
    {s.ort === "geraet" && !s.fehler && <p className="pseudo-hinweis">Ohne Pro-Tresor liegen die Profile im App-Speicher neben der Akte. Mit „Tresor einrichten“ oben liegen sie verschlüsselt und auch für die anderen Pro-Apps bereit.</p>}

    {s.ort !== "gesperrt" && s.ort !== "laedt" && <>
      {!p?.eintraege.length && <p>Die Maske verdeckt Namen und Nummern schon nach Mustern. Mit Profilen erkennt sie deine Leute und Nummern immer, auch in anderen Schreibweisen.</p>}
      {!!p?.eintraege.length && <div className="maske-reiter" role="group" aria-label="Gruppe">
        <button type="button" aria-pressed={gruppe === "alle"} onClick={() => setGruppe("alle")}>Alle {p.eintraege.length}</button>
        {PROFIL_ARTEN.map((a) => <button key={a} type="button" aria-pressed={gruppe === a} onClick={() => setGruppe(a)} data-maske-reiter={a}>{ART_NAME[a]} {zahl[a]}</button>)}
      </div>}
      <div className="maske-liste">
        {sichtbar.map((e) => <EintragZeile key={e.id} e={e} p={p!} records={records} offen={offen === e.id} busy={busy} onOffen={() => setOffen(offen === e.id ? null : e.id)} onAendern={aendern}
          onEntfernen={() => { setOffen(null); void speichern(eintragEntfernen(p!, e.id), `„${eintragName(e, records)}“ aus den Profilen genommen.`); }}
          onMeldung={setMeldung}/>)}
      </div>
      {!!p?.nieVerdecken.length && <p className="leise" data-maske-nie>Darf immer bleiben: {p.nieVerdecken.map((w) => <span key={w} className="maske-chip">{w} <button type="button" aria-label={`„${w}“ wieder verdecken lassen`} onClick={() => void speichern({ ...p, nieVerdecken: p.nieVerdecken.filter((x) => x !== w) }, `„${w}“ darf nicht mehr von selbst bleiben.`)}>×</button></span>)}</p>}

      <div className="button-row">
        <button type="button" className="button primary" disabled={busy} onClick={() => setAnlegen(!anlegen)} data-maske-anlegen>+ Selbst anlegen</button>
        <button type="button" className="button secondary" disabled={busy} onClick={async () => { const v = vorschlaegeAusAkte(await basisProfile(), records); setVorschlag(v.map((x) => ({ ...x, an: true }))); if (!v.length) setMeldung("Alle Personen und Organisationen der Akte sind schon verknüpft."); }} data-maske-akte>Aus meiner Akte vorschlagen</button>
        {s.ort === "tresor" && <button type="button" className="button secondary" disabled={busy || !andere.length} title={andere.length ? "" : "Im Tresor liegen keine Profile anderer Pro-Apps."} onClick={async () => { const q = andere[0]; const eigen = await basisProfile(); const r = p?.eintraege.length ? zusammenfuehren(eigen, q.profile!) : { profile: alsEigene(q.profile!), bericht: { zusammengefuehrt: [], neu: q.profile!.eintraege.map((e) => e.anzeige) } }; setUebernahme({ quelle: q, ergebnis: r.profile, bericht: r.bericht }); }} data-maske-uebernehmen>Aus einer anderen Pro-App übernehmen{andere.length ? ` (${andere.length})` : ""}</button>}
      </div>

      {anlegen && <form className="form-grid maske-neu" onSubmit={async (ev) => { ev.preventDefault(); try { const neu = eintragAnlegen(await basisProfile(), neuArt, neuName); setNeuName(""); setAnlegen(false); await speichern(neu, `„${neuName.trim()}“ angelegt.`); setOffen(neu.eintraege[neu.eintraege.length - 1].id); } catch (e) { setMeldung(e instanceof Error ? e.message : String(e)); } }}>
        <label><span>Gruppe</span><select value={neuArt} onChange={(e) => setNeuArt(e.target.value as ProfilArt)} data-maske-neu-art>{PROFIL_ARTEN.map((a) => <option key={a} value={a}>{ART_NAME[a]}</option>)}</select></label>
        <label><span>Name</span><input value={neuName} onChange={(e) => setNeuName(e.target.value)} placeholder="z. B. Praxis Dr. Aster" data-maske-neu-name/></label>
        <div className="button-row"><button type="submit" className="button primary" disabled={busy || neuName.trim().length < 2} data-maske-neu-los>Anlegen</button><button type="button" className="button secondary" onClick={() => setAnlegen(false)}>Abbrechen</button></div>
      </form>}

      {vorschlag && vorschlag.length > 0 && <div className="maske-vorschlag" data-maske-vorschlag>
        <strong>Aus der Akte</strong>
        {vorschlag.map((v, i) => <label key={v.akteId} className="checkbox-row"><input type="checkbox" checked={v.an} onChange={() => setVorschlag(vorschlag.map((x, j) => (j === i ? { ...x, an: !x.an } : x)))}/>
          {v.name} <select value={v.art} onChange={(e) => setVorschlag(vorschlag.map((x, j) => (j === i ? { ...x, art: e.target.value as ProfilArt } : x)))} aria-label={`Gruppe für ${v.name}`}>{PROFIL_ARTEN.map((a) => <option key={a} value={a}>{ART_NAME[a]}</option>)}</select></label>)}
        <div className="button-row"><button type="button" className="button primary" disabled={busy || !vorschlag.some((v) => v.an)} onClick={async () => { const wahl = vorschlag.filter((v) => v.an); setVorschlag(null); await speichern(ausAkteUebernehmen(await basisProfile(), wahl), `${wahl.length} aus der Akte verknüpft.`); }} data-maske-akte-los>Übernehmen</button><button type="button" className="button secondary" onClick={() => setVorschlag(null)}>Abbrechen</button></div>
      </div>}

      {uebernahme && <div className="maske-vorschlag" data-maske-uebernahme>
        <strong>{APP_NAMEN[uebernahme.quelle.schreiber] || uebernahme.quelle.schreiber} · {new Date(uebernahme.quelle.datum).toLocaleDateString("de-DE")} · {uebernahme.quelle.profile?.eintraege.length} Einträge</strong>
        {uebernahme.bericht.zusammengefuehrt.length > 0 && <p>Zusammengeführt (gleicher Name oder gleiche Nummer): {uebernahme.bericht.zusammengefuehrt.join(" · ")}</p>}
        {uebernahme.bericht.neu.length > 0 && <p>Neu: {uebernahme.bericht.neu.join(" · ")}</p>}
        <small>Nichts wird überschrieben; bei „immer verdecken“ gegen „darf bleiben“ gewinnt „immer verdecken“.</small>
        <div className="button-row"><button type="button" className="button primary" disabled={busy} onClick={async () => { const u = uebernahme; setUebernahme(null); await speichern(u.ergebnis, `Übernommen: ${u.bericht.neu.length} neu, ${u.bericht.zusammengefuehrt.length} zusammengeführt.`); }} data-maske-uebernehmen-los>Übernehmen</button><button type="button" className="button secondary" onClick={() => setUebernahme(null)}>Abbrechen</button></div>
      </div>}
    </>}
    {meldung && <p className="sync-message" role="status" data-maske-meldung>{meldung}</p>}
  </section>;
}

function EintragZeile({ e, p, records, offen, busy, onOffen, onAendern, onEntfernen, onMeldung }: {
  e: ProfilEintrag; p: MaskeProfile; records: AkteRecord[]; offen: boolean; busy: boolean; onOffen: () => void;
  onAendern: (id: string, f: (e: ProfilEintrag) => ProfilEintrag, text: string) => void; onEntfernen: () => void; onMeldung: (t: string) => void;
}) {
  const [schreib, setSchreib] = useState("");
  const [sorte, setSorte] = useState(SORTEN[0]);
  const [nummer, setNummer] = useState("");
  const name = eintragName(e, records);
  const verdeckt = e.regel === "verdecken";
  return <div className={`maske-zeile${offen ? " offen" : ""}`} data-maske-eintrag={name}>
    <button type="button" className="maske-name" onClick={onOffen} aria-expanded={offen}><strong>{name}</strong> {verdeckt && <span className="platzhalter-text maske-platz">{platzhalter(e)}</span>}</button>
    <span className="maske-schalter" role="group" aria-label={`Regel für ${name}`}>
      <button type="button" aria-pressed={verdeckt} className={verdeckt ? "an verdecken" : ""} disabled={busy} onClick={() => !verdeckt && onAendern(e.id, (x) => ({ ...x, regel: "verdecken" }), `„${name}“ wird immer verdeckt.`)} data-maske-regel="verdecken">immer verdecken</button>
      <button type="button" aria-pressed={!verdeckt} className={!verdeckt ? "an bleibt" : ""} disabled={busy} onClick={() => verdeckt && onAendern(e.id, (x) => ({ ...x, regel: "bleibt" }), `„${name}“ darf stehen bleiben.`)} data-maske-regel="bleibt">darf bleiben</button>
    </span>
    <div className="maske-chips">
      <span className={`maske-chip${e.akteId ? " akte" : ""}`}>{QUELLE[e.quelle]}</span>
      {e.schreibweisen.map((w) => <span key={w} className="maske-chip">{w}{offen && <button type="button" aria-label={`Schreibweise „${w}“ entfernen`} onClick={() => onAendern(e.id, (x) => ({ ...x, schreibweisen: x.schreibweisen.filter((y) => y !== w) }), `Schreibweise „${w}“ entfernt.`)}>×</button>}</span>)}
      {e.nummern.map((a) => <span key={`${a.k}${a.hmac}`} className="maske-chip nummer" data-maske-nummer>{nummerAnzeige(a)}{offen && <button type="button" aria-label={`${a.sorte} entfernen`} onClick={() => onAendern(e.id, (x) => ({ ...x, nummern: x.nummern.filter((y) => y.hmac !== a.hmac) }), `${a.sorte} entfernt.`)}>×</button>}</span>)}
    </div>
    {offen && <div className="maske-bearbeiten">
      <form className="form-grid" onSubmit={(ev) => { ev.preventDefault(); const w = schreib.trim(); if (w.length < 2) return; setSchreib(""); onAendern(e.id, (x) => schreibweiseDazu(x, w), `Schreibweise „${w}“ gemerkt.`); }}>
        <label><span>Schreibweise hinzufügen</span><input value={schreib} onChange={(ev) => setSchreib(ev.target.value)} placeholder="z. B. Nachname allein, Spitzname" data-maske-schreibweise/></label>
        <div className="button-row"><button type="submit" className="button secondary" disabled={busy || schreib.trim().length < 2} data-maske-schreibweise-los>Hinzufügen</button></div>
      </form>
      <form className="form-grid" onSubmit={async (ev) => { ev.preventDefault(); try { const a = await nummerAbdruck(p, sorte, nummer); setNummer(""); onAendern(e.id, (x) => ({ ...x, nummern: x.nummern.some((y) => y.hmac === a.hmac) ? x.nummern : [...x.nummern, a] }), `${a.sorte} ··· ${a.ende} gemerkt (nur der Fingerabdruck).`); } catch (err) { onMeldung(err instanceof Error ? err.message : String(err)); } }}>
        <label><span>Art der Nummer</span><select value={sorte} onChange={(ev) => setSorte(ev.target.value)}>{SORTEN.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label><span>Nummer (wird nicht gespeichert, nur ihr Fingerabdruck)</span><input value={nummer} onChange={(ev) => setNummer(ev.target.value)} autoComplete="off" inputMode="text" data-maske-nummer-feld/></label>
        <div className="button-row"><button type="submit" className="button secondary" disabled={busy || nummer.trim().length < 5} data-maske-nummer-los>Nummer merken</button></div>
      </form>
      <div className="button-row"><button type="button" className="button secondary" onClick={onOffen}>Fertig</button><button type="button" className="button secondary" disabled={busy} onClick={onEntfernen} data-maske-entfernen>Aus Profil nehmen</button></div>
    </div>}
  </div>;
}
