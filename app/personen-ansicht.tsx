// Personen übersichtlich (2.28.75, Klaus 19.11.2026, Brief „Familienakte übersichtlich“ Punkt 5 und 9).
// Einmal „Personen“ öffnen → links alle Personen (und „Familie gemeinsam“) → Tipp auf eine Person → rechts alles zu ihr:
// Steckbrief (Kontakt, Ausweise, weitere Einträge) und ihre Akten, Unterlagen, Termine und Tagebuch aus allen Bereichen.
// Vorbild „Akten“ der Privaten Akte (vAkten: links Baum, rechts Inhalt mit Pfad). Die Logik der Familienakte bleibt:
// Bereich → Akte (Vorgang) → Person oder Familie gemeinsam → Unterlagen, Fristen, Tagebuch – hier nur sichtbar gemacht.
import { useEffect, useMemo, useState } from "react";
import { Camera, ChevronRight, Eye, EyeOff, FileText, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";
import type { FamilyRecordUnion, FamilyRelation } from "../lib/family-data-model";
import { buildCockpitDossier, cockpitRecordLabel, type CockpitReference, type FamilyCockpitDocument } from "../lib/family-cockpit";
import { stammLesen } from "../lib/familie-stamm";
import { KONTAKT_BESCHRIFTUNG, KONTAKT_FELDER, kontaktPruefen, type PersonKontakt } from "../lib/person-kontakt";
import { AUSWEIS_ARTEN, ausweisStand, nummerVerdeckt, steckbriefLesen, steckbriefPruefen, type Ausweis, type Steckbrief, type SteckbriefEintrag } from "../lib/person-steckbrief";
import { readLocalDocumentFile, saveLocalDocument, saveLocalStammRecord, updateLocalPersonSteckbrief } from "./local-vault";
import { KlappKarte, klappSetzen } from "./klapp-karte";
import { InfoPopover, VoiceInput } from "./ui-controls";
import { BspEcke } from "./bsp-ecke";

const MERKER = "fa_person_gewaehlt";
const GEMEINSAM = "__familie__";
const neueId = () => (crypto.randomUUID?.() || String(Date.now() + Math.random())).slice(0, 36);
/** Andere Stellen (Suche) wählen eine Person vor, bevor sie „Personen“ öffnen. */
export function personVorwaehlen(id: string) { try { sessionStorage.setItem(MERKER, id); } catch { /* nur jetzt */ } }

type Gruppe = { titel: string; typen: string[] };
const GRUPPEN: Gruppe[] = [
  { titel: "Akten", typen: ["case"] },
  { titel: "Unterlagen", typen: ["document"] },
  { titel: "Termine & Fristen", typen: ["task", "deadline", "reminder", "appointment"] },
  { titel: "Tagebuch", typen: ["event"] },
  { titel: "Objekte & Verträge", typen: ["object", "contract", "warranty", "insurance"] },
  { titel: "Organisationen", typen: ["organisation"] },
];

export function PersonenAnsicht({ records, relations, dokumente, vaultHandle, onRefresh, onOeffne, onSaveContact, onBearbeiten, onNotice, onBibliothek }: {
  records: FamilyRecordUnion[]; relations: FamilyRelation[]; dokumente: FamilyCockpitDocument[];
  vaultHandle: FileSystemDirectoryHandle | null; onRefresh: () => Promise<void>;
  onOeffne: (ref: CockpitReference) => void; onSaveContact: (id: string, kontakt: PersonKontakt) => Promise<boolean>;
  onBearbeiten: (record: FamilyRecordUnion) => void; onNotice: (n: { kind: "success" | "error" | "info"; text: string }) => void;
  onBibliothek: (area: string) => void;
}) {
  const personen = useMemo(() => records.filter((r) => r.recordType === "person" && r.status !== "archiviert")
    .map((r) => ({ record: r, ...stammLesen(r) })).sort((a, b) => (a.name || a.record.id).localeCompare(b.name || b.record.id, "de")), [records]);
  const [gewaehlt, setGewaehlt] = useState<string>(() => { try { const v = sessionStorage.getItem(MERKER); if (v) { sessionStorage.removeItem(MERKER); return v; } } catch { /* egal */ } return ""; });
  const [neu, setNeu] = useState(false);
  const [neuName, setNeuName] = useState(""); const [neuRolle, setNeuRolle] = useState(""); const [arbeit, setArbeit] = useState(false);
  const input = { records, relations, documents: dokumente, versions: [], now: new Date() };
  const zahl = (id: string) => buildCockpitDossier(input, id)?.related.length || 0;
  const person = personen.find((p) => p.record.id === gewaehlt);
  // Familie gemeinsam: Akten (Vorgänge), die mit keiner Person verknüpft sind.
  const personIds = new Set(personen.map((p) => p.record.id));
  const gemeinsameAkten = records.filter((r) => r.recordType === "case" && r.status !== "archiviert"
    && !relations.some((rel) => (rel.fromId === r.id && personIds.has(rel.toId)) || (rel.toId === r.id && personIds.has(rel.fromId))));
  useEffect(() => { if (gewaehlt) document.querySelector("[data-personen-rechts]")?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [gewaehlt]);

  const anlegen = async () => {
    if (!vaultHandle) { onNotice({ kind: "error", text: "Bitte zuerst einen Speicherort für die Akte verbinden." }); return; }
    setArbeit(true);
    try { const r = await saveLocalStammRecord(vaultHandle, { recordType: "person", angaben: { name: neuName, art: neuRolle, notiz: "" } }); await onRefresh(); setGewaehlt(r.id); setNeu(false); setNeuName(""); setNeuRolle(""); onNotice({ kind: "success", text: `Gespeichert ✓ Person „${neuName.trim()}“.` }); }
    catch (e) { onNotice({ kind: "error", text: e instanceof Error ? e.message : "Die Person konnte nicht angelegt werden." }); }
    finally { setArbeit(false); }
  };

  return <div className="personen-ansicht" data-personen-ansicht>
    <section className="card personen-links" aria-label="Personen">
      <div className="personen-kopf"><h2><Users size={18}/> Personen <span className="klapp-zahl">{personen.length}</span></h2>
        <button type="button" className="button secondary compact-button" onClick={() => setNeu((n) => !n)} aria-expanded={neu} data-person-neu><Plus size={16}/> Person</button></div>
      {neu && <div className="person-neu" data-person-neu-formular>
        <label><span>Name</span><VoiceInput value={neuName} onValueChange={setNeuName} speechLabel="Name" autoComplete="off" data-person-neu-name/></label>
        <label><span>Rolle, optional</span><VoiceInput value={neuRolle} onValueChange={setNeuRolle} speechLabel="Rolle" placeholder="z. B. Mutter, Kind" autoComplete="off"/></label>
        <button type="button" className="button primary compact-button" disabled={arbeit || !neuName.trim()} onClick={() => void anlegen()} data-person-neu-speichern>Speichern</button>
      </div>}
      <ul className="personen-liste">
        {personen.map((p) => <li key={p.record.id}><button type="button" className={gewaehlt === p.record.id ? "gewaehlt" : ""} onClick={() => setGewaehlt(p.record.id)} data-person-zeile={p.name}>
          <BspEcke id={p.record.id}/><UserRound size={17}/><span><strong>{p.name || "Ohne Namen"}</strong>{p.art && <small>{p.art}</small>}</span><span className="klapp-zahl">{zahl(p.record.id)}</span><ChevronRight size={15}/></button></li>)}
        <li><button type="button" className={gewaehlt === GEMEINSAM ? "gewaehlt" : ""} onClick={() => setGewaehlt(GEMEINSAM)} data-person-zeile="Familie gemeinsam">
          <Users size={17}/><span><strong>Familie gemeinsam</strong><small>Akten ohne einzelne Person</small></span><span className="klapp-zahl">{gemeinsameAkten.length}</span><ChevronRight size={15}/></button></li>
      </ul>
      {!personen.length && <p className="muted">Noch keine Person. Mit „+ Person“ legst du die erste an.</p>}
    </section>
    <section className="card personen-rechts" data-personen-rechts aria-live="polite">
      {!gewaehlt && <p className="muted personen-leer">Person wählen – dann steht hier alles zu ihr.</p>}
      {gewaehlt === GEMEINSAM && <>
        <nav className="pfad personen-pfad" aria-label="Pfad"><span>Alle Personen</span><ChevronRight size={13}/><strong>Familie gemeinsam</strong></nav>
        <ul className="person-bezug">{gemeinsameAkten.map((r) => <li key={r.id}><button type="button" onClick={() => onOeffne({ id: r.id, type: "case", label: cockpitRecordLabel(r), section: "cockpit", sensitive: false })} data-person-bezug={cockpitRecordLabel(r)}><FileText size={15}/><span>{cockpitRecordLabel(r)}</span><ChevronRight size={14}/></button></li>)}</ul>
        {!gemeinsameAkten.length && <p className="muted">Keine gemeinsamen Akten.</p>}
        <button type="button" className="text-link" onClick={() => onBibliothek("Familie & persönliche Dokumente")}>Familienunterlagen in der Bibliothek ›</button>
      </>}
      {person && <PersonSteckbrief key={person.record.id} record={person.record} name={person.name} rolle={person.art} notiz={person.notiz}
        bezug={buildCockpitDossier(input, person.record.id)?.related || []} vaultHandle={vaultHandle} onRefresh={onRefresh}
        onOeffne={onOeffne} onSaveContact={onSaveContact} onBearbeiten={() => onBearbeiten(person.record)} onNotice={onNotice}/>}
    </section>
  </div>;
}

function PersonSteckbrief({ record, name, rolle, notiz, bezug, vaultHandle, onRefresh, onOeffne, onSaveContact, onBearbeiten, onNotice }: {
  record: FamilyRecordUnion; name: string; rolle: string; notiz: string; bezug: CockpitReference[];
  vaultHandle: FileSystemDirectoryHandle | null; onRefresh: () => Promise<void>; onOeffne: (ref: CockpitReference) => void;
  onSaveContact: (id: string, kontakt: PersonKontakt) => Promise<boolean>; onBearbeiten: () => void;
  onNotice: (n: { kind: "success" | "error" | "info"; text: string }) => void;
}) {
  const daten = (record.data || {}) as Record<string, unknown>;
  const kontaktAus = () => Object.fromEntries(KONTAKT_FELDER.map((k) => [k, String(daten[k] ?? "")])) as PersonKontakt;
  const [kontakt, setKontakt] = useState<PersonKontakt>(kontaktAus);
  const [sb, setSb] = useState<Steckbrief>(() => steckbriefLesen(daten));
  const [geaendert, setGeaendert] = useState<"" | "kontakt" | "steckbrief">("");
  const [arbeit, setArbeit] = useState(false);
  const [offenNr, setOffenNr] = useState<string[]>([]);
  const kontaktZahl = KONTAKT_FELDER.filter((k) => String(daten[k] ?? "").trim()).length;
  const gespeichert = steckbriefLesen(daten);

  const kontaktSpeichern = async () => {
    const p = kontaktPruefen(kontakt); if (p.fehler.length) { onNotice({ kind: "error", text: p.fehler.join(" ") }); return; }
    setArbeit(true); try { if (await onSaveContact(record.id, p.kontakt)) setGeaendert(""); } finally { setArbeit(false); }
  };
  const sbSpeichern = async (neu: Steckbrief = sb) => {
    if (!vaultHandle) { onNotice({ kind: "error", text: "Bitte zuerst einen Speicherort für die Akte verbinden." }); return false; }
    const p = steckbriefPruefen(neu); if (p.fehler.length) { onNotice({ kind: "error", text: p.fehler.join(" ") }); return false; }
    setArbeit(true);
    try { await updateLocalPersonSteckbrief(vaultHandle, record.id, p.steckbrief); await onRefresh(); setSb(p.steckbrief); setGeaendert(""); onNotice({ kind: "success", text: "Gespeichert ✓ Steckbrief." }); return true; }
    catch (e) { onNotice({ kind: "error", text: e instanceof Error ? e.message : "Der Steckbrief konnte nicht gespeichert werden." }); return false; }
    finally { setArbeit(false); }
  };
  const ausweisSetzen = (id: string, teil: Partial<Ausweis>) => { setSb((s) => ({ ...s, ausweise: s.ausweise.map((a) => a.id === id ? { ...a, ...teil } : a) })); setGeaendert("steckbrief"); };
  const eintragSetzen = (id: string, teil: Partial<SteckbriefEintrag>) => { setSb((s) => ({ ...s, eintraege: s.eintraege.map((e) => e.id === id ? { ...e, ...teil } : e) })); setGeaendert("steckbrief"); };
  // Foto eines Ausweises: als Unterlage im Tresor („Familie & persönliche Dokumente“), mit der Person verknüpft; der Steckbrief merkt die Kennung.
  const fotoAblegen = async (a: Ausweis, file: File) => {
    if (!vaultHandle) { onNotice({ kind: "error", text: "Bitte zuerst einen Speicherort für die Akte verbinden." }); return; }
    setArbeit(true);
    try {
      const doc = await saveLocalDocument(vaultHandle, file, { category: "Familie & persönliche Dokumente", documentDate: null, notes: null, titel: `${a.art || "Ausweis"} – ${name}`, allowDuplicate: true, assignmentLinks: [{ toType: "person", toId: record.id, relationType: "betrifft" }] });
      const neu: Steckbrief = { ...sb, ausweise: sb.ausweise.map((x) => x.id === a.id ? { ...x, dokumentIds: [...(x.dokumentIds || []), doc.id] } : x) };
      await sbSpeichern(neu);
    } catch (e) { onNotice({ kind: "error", text: e instanceof Error ? e.message : "Das Foto konnte nicht abgelegt werden." }); }
    finally { setArbeit(false); }
  };
  const gruppen = GRUPPEN.map((g) => ({ ...g, items: bezug.filter((r) => g.typen.includes(r.type)) })).filter((g) => g.items.length);
  const abgelaufen = gespeichert.ausweise.filter((a) => ausweisStand(a.gueltigBis) === "abgelaufen").length;

  return <div className="person-steckbrief" data-person-steckbrief={name}>
    <nav className="pfad personen-pfad" aria-label="Pfad"><span>Alle Personen</span><ChevronRight size={13}/><strong>{name || "Ohne Namen"}</strong></nav>
    <div className="person-kopf"><UserRound size={22}/><div><h2>{name || "Ohne Namen"}</h2>{rolle && <small>{rolle}</small>}{notiz && <p className="muted">{notiz}</p>}</div>
      {vaultHandle && <button type="button" className="icon-button" onClick={onBearbeiten} aria-label={`${name} ändern: Name, Rolle, Notiz`} title="Name, Rolle, Notiz ändern" data-person-aendern><Pencil size={16}/></button>}</div>

    <KlappKarte id="person-kontakt" titel="Kontakt" zahl={kontaktZahl || null} hilfe="Anschrift, E-Mail und Telefon. Wird beim Ausfüllen eines Formulars als Vorschlag eingesetzt.">
      <div className="person-felder">{KONTAKT_FELDER.map((k) => <label key={k}><span>{KONTAKT_BESCHRIFTUNG[k]}</span>
        <VoiceInput type={k === "email" ? "email" : k === "phone" ? "tel" : "text"} value={kontakt[k] || ""} speechLabel={KONTAKT_BESCHRIFTUNG[k]} autoComplete="off" data-kontakt={k}
          onValueChange={(v) => { setKontakt((x) => ({ ...x, [k]: v })); setGeaendert("kontakt"); }}/></label>)}</div>
      {geaendert === "kontakt" && <button type="button" className="button primary compact-button" disabled={arbeit} onClick={() => void kontaktSpeichern()} data-kontakt-speichern>Speichern</button>}
    </KlappKarte>

    <KlappKarte id="person-ausweise" titel="Ausweise & Nummern" zahl={gespeichert.ausweise.length || null} unter={abgelaufen ? `${abgelaufen} abgelaufen` : undefined} unterArt="warnung"
      hilfe="Personalausweis, Führerschein, Sozialversicherung, Steuer-ID, Reisepass, Krankenkasse … je mit Nummer und „gültig bis“. Fotos der Ausweise liegen als Unterlage im Tresor bei der Person. Alles nur im verschlüsselten Tresor und im Backup.">
      {sb.ausweise.map((a) => { const stand = ausweisStand(a.gueltigBis); const zeigen = offenNr.includes(a.id); return <div className="ausweis-zeile" key={a.id} data-ausweis={a.art}>
        <label><span>Art</span><VoiceInput list="fa-ausweis-arten" value={a.art} speechLabel="Art" onValueChange={(v) => ausweisSetzen(a.id, { art: v })} autoComplete="off" data-ausweis-art/></label>
        <label><span>Nummer</span><span className="ausweis-nummer">
          {zeigen ? <VoiceInput value={a.nummer} speechLabel="Nummer" onValueChange={(v) => ausweisSetzen(a.id, { nummer: v })} autoComplete="off" data-ausweis-nummer/> : <input readOnly value={a.nummer ? nummerVerdeckt(a.nummer) : ""} placeholder="—" onFocus={() => setOffenNr((o) => [...o, a.id])} data-ausweis-nummer-verdeckt/>}
          <button type="button" className="icon-button" onClick={() => setOffenNr((o) => zeigen ? o.filter((x) => x !== a.id) : [...o, a.id])} aria-label={zeigen ? "Nummer verdecken" : "Nummer zeigen"}>{zeigen ? <EyeOff size={15}/> : <Eye size={15}/>}</button></span></label>
        <label><span>Gültig bis</span><input type="date" value={a.gueltigBis} onChange={(e) => ausweisSetzen(a.id, { gueltigBis: e.target.value })} data-ausweis-gueltig/>{stand === "abgelaufen" ? <em className="ausweis-stand rot">abgelaufen</em> : stand === "bald" ? <em className="ausweis-stand gelb">läuft bald ab</em> : null}</label>
        <div className="ausweis-fotos">{(a.dokumentIds || []).map((id) => <AusweisFoto key={id} id={id} vaultHandle={vaultHandle} onOeffne={() => onOeffne({ id, type: "document", label: a.art, section: "documents", sensitive: false })}/>)}
          <label className="button secondary compact-button ausweis-foto-knopf"><Camera size={15}/> Foto<input type="file" accept="image/*,application/pdf" className="sr-only" disabled={arbeit || !vaultHandle} onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ""; if (f) void fotoAblegen(a, f); }} data-ausweis-foto/></label>
          <button type="button" className="icon-button" onClick={() => { setSb((s) => ({ ...s, ausweise: s.ausweise.filter((x) => x.id !== a.id) })); setGeaendert("steckbrief"); }} aria-label={`${a.art || "Ausweis"} entfernen`}><Trash2 size={15}/></button></div>
      </div>; })}
      <datalist id="fa-ausweis-arten">{AUSWEIS_ARTEN.map((a) => <option key={a} value={a}/>)}</datalist>
      <div className="button-row"><button type="button" className="button secondary compact-button" onClick={() => { const id = neueId(); setSb((s) => ({ ...s, ausweise: [...s.ausweise, { id, art: "", nummer: "", gueltigBis: "" }] })); setOffenNr((o) => [...o, id]); }} data-ausweis-neu><Plus size={15}/> Ausweis</button>
        {geaendert === "steckbrief" && <button type="button" className="button primary compact-button" disabled={arbeit} onClick={() => void sbSpeichern()} data-steckbrief-speichern>Speichern</button>}</div>
    </KlappKarte>

    <KlappKarte id="person-eintraege" titel="Weitere Einträge" zahl={gespeichert.eintraege.length || null} hilfe="Eigene Angaben mit Namen und Wert, z. B. „Handy 2“ oder „Mitgliedsnummer ADAC“.">
      {sb.eintraege.map((e) => <div className="eintrag-zeile" key={e.id} data-eintrag={e.name}>
        <label><span>Name</span><VoiceInput value={e.name} speechLabel="Name des Eintrags" onValueChange={(v) => eintragSetzen(e.id, { name: v })} autoComplete="off" data-eintrag-name/></label>
        <label><span>Wert</span><VoiceInput value={e.wert} speechLabel="Wert" onValueChange={(v) => eintragSetzen(e.id, { wert: v })} autoComplete="off" data-eintrag-wert/></label>
        <button type="button" className="icon-button" onClick={() => { setSb((s) => ({ ...s, eintraege: s.eintraege.filter((x) => x.id !== e.id) })); setGeaendert("steckbrief"); }} aria-label={`${e.name || "Eintrag"} entfernen`}><Trash2 size={15}/></button>
      </div>)}
      <div className="button-row"><button type="button" className="button secondary compact-button" onClick={() => setSb((s) => ({ ...s, eintraege: [...s.eintraege, { id: neueId(), name: "", wert: "" }] }))} data-eintrag-neu><Plus size={15}/> Eintrag</button>
        {geaendert === "steckbrief" && <button type="button" className="button primary compact-button" disabled={arbeit} onClick={() => void sbSpeichern()} data-steckbrief-speichern>Speichern</button>}</div>
    </KlappKarte>

    <h3 className="person-alles">Alles zu {name || "dieser Person"} <InfoPopover label="Alles zu dieser Person erklären" text="Was in der Akte mit dieser Person verknüpft ist – aus allen Bereichen: Akten (Vorgänge), Unterlagen, Termine und Fristen, Tagebuch. Ein Tipp öffnet den Eintrag an seinem Platz."/></h3>
    {!gruppen.length && <p className="muted">Noch nichts mit dieser Person verknüpft.</p>}
    {gruppen.map((g) => <KlappKarte key={g.titel} id={`person-${g.titel}`} titel={g.titel} zahl={g.items.length} vorgabe={g.typen.includes("case")}>
      <ul className="person-bezug">{g.items.map((r) => <li key={r.id}><button type="button" onClick={() => onOeffne(r)} data-person-bezug={r.label}><FileText size={15}/><span>{r.sensitive ? "Geschützter Eintrag" : r.label}</span><ChevronRight size={14}/></button></li>)}</ul>
    </KlappKarte>)}
  </div>;
}

function AusweisFoto({ id, vaultHandle, onOeffne }: { id: string; vaultHandle: FileSystemDirectoryHandle | null; onOeffne: () => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let aus = false; let u = "";
    if (vaultHandle) void readLocalDocumentFile(vaultHandle, id).then((f) => { if (aus || !f.type.startsWith("image/")) return; u = URL.createObjectURL(f); setUrl(u); }).catch(() => undefined);
    return () => { aus = true; if (u) URL.revokeObjectURL(u); };
  }, [id, vaultHandle]);
  return <button type="button" className="ausweis-foto" onClick={onOeffne} aria-label="Foto ansehen" data-ausweis-foto-vorschau>{url ? <img src={url} alt=""/> : <FileText size={20}/>}</button>;
}

/** Für die Hilfe/Suche: Karte „Kontakt“ usw. vor dem Sprung öffnen. */
export const personKarteAuf = (titel: "Kontakt" | "Ausweise & Nummern") => klappSetzen(titel === "Kontakt" ? "person-kontakt" : "person-ausweise", true);
