// Punkt 8 der Neugestaltung 2.28.39: In der Familienübersicht Personen, Organisationen, Objekte (Auto, Gerät …) und
// Vorgänge selbst anlegen und ändern. „+ Neu“ → Art wählen → Name, Art, Notiz → „✓ Speichern“ → „Gespeichert ✓“ an derselben
// Stelle. Danach stehen die Einträge in allen Auswahllisten (Fristformular, Zuordnung im Prüfdialog). Die Kennnummer bleibt intern.
import { useMemo, useState } from "react";
import { Check, ChevronRight, Pencil, Plus, X } from "lucide-react";
import type { FamilyRecordUnion } from "../lib/family-data-model";
import type { PersonKontakt } from "../lib/person-kontakt";
import { STAMM_ARTEN, STAMM_BESCHRIFTUNG, stammLesen, stammPruefen, type StammAngaben, type StammArt } from "../lib/familie-stamm";
import { saveLocalStammRecord } from "./local-vault";
import { PersonKontaktKasten } from "./person-kontakt";
import { VoiceInput, VoiceTextarea } from "./ui-controls";

type Bearbeitung = { typ: StammArt; id?: string };
const GRUPPE: Record<StammArt, string> = { person: "Personen", organisation: "Organisationen", object: "Objekte", case: "Vorgänge" };

export function FamilieStamm({ records, vaultHandle, onRefresh, onOpen, onSaveContact, onVerbinden }: {
  records: FamilyRecordUnion[];
  vaultHandle: FileSystemDirectoryHandle | null;
  onRefresh: () => Promise<void>;
  onOpen: (id: string) => void;
  onSaveContact?: (id: string, kontakt: PersonKontakt) => Promise<boolean>;
  onVerbinden: () => void;
}) {
  const [neu, setNeu] = useState(false);
  const [bearbeitung, setBearbeitung] = useState<Bearbeitung | null>(null);
  const [werte, setWerte] = useState<StammAngaben>({ name: "", art: "", notiz: "" });
  const [fehler, setFehler] = useState<string[]>([]);
  const [arbeit, setArbeit] = useState(false);
  const [gespeichert, setGespeichert] = useState<{ id: string; text: string } | null>(null);
  const gruppen = useMemo(() => STAMM_ARTEN.map((typ) => ({ typ, items: records.filter((r) => r.recordType === typ && r.status !== "archiviert").map((r) => ({ record: r, ...stammLesen(r) })).sort((a, b) => (a.name || a.record.id).localeCompare(b.name || b.record.id, "de")) })), [records]);
  const anzahl = gruppen.reduce((n, g) => n + g.items.length, 0);

  const starten = (typ: StammArt, record?: FamilyRecordUnion) => {
    setBearbeitung({ typ, id: record?.id }); setWerte(record ? stammLesen(record) : { name: "", art: "", notiz: "" }); setFehler([]); setGespeichert(null); setNeu(false);
  };
  const schliessen = () => { setBearbeitung(null); setFehler([]); };
  const speichern = async () => {
    if (!bearbeitung) return;
    if (!vaultHandle) { setFehler(["Bitte zuerst einen Speicherort für die Akte verbinden."]); return; }
    const pruef = stammPruefen(bearbeitung.typ, werte, records, bearbeitung.id); setFehler(pruef); if (pruef.length) return;
    setArbeit(true);
    try {
      const record = await saveLocalStammRecord(vaultHandle, { recordType: bearbeitung.typ, id: bearbeitung.id, angaben: werte });
      await onRefresh();
      setGespeichert({ id: record.id, text: `Gespeichert ✓ ${STAMM_BESCHRIFTUNG[bearbeitung.typ].einzahl} „${werte.name.trim()}“ – steht jetzt in allen Auswahllisten.` });
      setBearbeitung(null);
    } catch (reason) { setFehler([reason instanceof Error ? reason.message : "Der Eintrag konnte nicht gespeichert werden."]); }
    finally { setArbeit(false); }
  };

  const formular = bearbeitung && (() => { const b = STAMM_BESCHRIFTUNG[bearbeitung.typ]; const record = bearbeitung.id ? records.find((r) => r.id === bearbeitung.id) : undefined; return <div className="stamm-formular" data-stamm-formular={bearbeitung.typ}>
    <div className="stamm-formular-kopf"><strong>{bearbeitung.id ? `${b.einzahl} ändern` : `Neu: ${b.einzahl}`}</strong><button type="button" className="icon-button" onClick={schliessen} aria-label="Abbrechen"><X size={17}/></button></div>
    <div className="form-grid">
      <label><span>Name</span><VoiceInput value={werte.name} onValueChange={(v) => setWerte({ ...werte, name: v })} placeholder={b.beispielName} speechLabel="Name" data-stamm-feld="name" autoComplete="off"/></label>
      <label><span>{b.art}, optional</span><VoiceInput value={werte.art} onValueChange={(v) => setWerte({ ...werte, art: v })} placeholder={b.beispielArt} speechLabel={b.art} data-stamm-feld="art" autoComplete="off"/></label>
    </div>
    <label><span>Notiz, optional</span><VoiceTextarea rows={2} value={werte.notiz} onValueChange={(v) => setWerte({ ...werte, notiz: v })} speechLabel="Notiz" data-stamm-feld="notiz"/></label>
    {fehler.length > 0 && <p className="form-error" role="alert" data-stamm-fehler>{fehler.join(" ")}</p>}
    <div className="button-row"><button type="button" className="button primary" disabled={arbeit} onClick={() => void speichern()} data-stamm-speichern><Check size={17}/> {arbeit ? "Wird gespeichert …" : "Speichern"}</button><button type="button" className="button secondary" disabled={arbeit} onClick={schliessen}>Abbrechen</button></div>
    {record && bearbeitung.typ === "person" && onSaveContact && <PersonKontaktKasten daten={(record.data || {}) as Record<string, unknown>} onSpeichern={(k) => onSaveContact(record.id, k)}/>}
  </div>; })();

  return <section className="card stamm-karte" id="familie-stamm" data-stamm-anzahl={anzahl}>
    <div className="card-heading"><div><h2>Personen, Organisationen, Objekte und Vorgänge</h2><p>Selbst anlegen, damit du Dokumente, Fristen und Aufgaben zuordnen kannst.</p></div>
      <button type="button" className="button primary" disabled={arbeit} onClick={() => { setNeu((n) => !n); setBearbeitung(null); setGespeichert(null); }} aria-expanded={neu} data-stamm-neu><Plus size={17}/> Neu</button></div>
    {!vaultHandle && <p className="sync-message warning">Zum Anlegen zuerst einen Speicherort verbinden. <button type="button" className="text-link" onClick={onVerbinden}>Speicherort wählen ›</button></p>}
    {neu && <div className="button-row stamm-arten" data-stamm-arten>{STAMM_ARTEN.map((typ) => <button key={typ} type="button" className="button secondary" onClick={() => starten(typ)} data-stamm-art={typ}><Plus size={16}/> {STAMM_BESCHRIFTUNG[typ].knopf}</button>)}</div>}
    {bearbeitung && !bearbeitung.id && formular}
    {gespeichert && <p className="notiz-gespeichert" role="status" data-stamm-gespeichert>{gespeichert.text}</p>}
    {anzahl === 0 ? <p className="stamm-leer">Noch keine Einträge. Mit „+ Neu“ legst du den ersten an.</p> : gruppen.filter((g) => g.items.length).map((g) => <div className="stamm-gruppe" key={g.typ} data-stamm-gruppe={g.typ}>
      <h3 className="eyebrow dark">{GRUPPE[g.typ]} · {g.items.length}</h3>
      {g.items.map((item) => <div key={item.record.id}>
        <div className={`stamm-zeile ${gespeichert?.id === item.record.id ? "hervorgehoben" : ""}`} data-stamm-zeile={item.name}>
          <button type="button" className="stamm-oeffnen" onClick={() => onOpen(item.record.id)}><strong>{item.name || "Ohne Namen"}</strong>{item.art && <small>{item.art}</small>}<ChevronRight size={16}/></button>
          {vaultHandle && <button type="button" className="icon-button" disabled={arbeit} onClick={() => starten(g.typ, item.record)} aria-label={`${item.name || "Eintrag"} ändern`} data-stamm-aendern={item.name}><Pencil size={16}/></button>}
        </div>
        {bearbeitung?.id === item.record.id && formular}
      </div>)}
    </div>)}
  </section>;
}
