import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDownAZ, ListOrdered, Search } from "lucide-react";
import { workspaceStorage } from "../lib/demo-workspace.ts";
import { HILFE_ORDNUNG, SCHRITT_NAME, hilfeSuchen, type HilfeSchritt } from "../lib/hilfe-ordnung";
import type { SectionId } from "./portal-types";
import { kalenderEinstLesen } from "./kalender-abgleich";
import { glockeIstAn } from "./app-glocke";
import { vollsicherungAbgehakt } from "./aktensicherung-hilfe";
import { zurStelle } from "./ablaufbild";
import { VoiceInput } from "./ui-controls";

/**
 * Hilfe geordnet (Klaus 07.11.2026, Plan 7c/7d): oben „Wie kann ich dir helfen?“, dann die Themen in Gruppen –
 * passend zur Seite, von der man kam · Einrichten (noch offen) · Arbeiten Schritt für Schritt · Allgemeines ·
 * schon eingerichtet · Fachliches. Umschalter „A–Z“ zeigt alles alphabetisch. Die Wahl merkt sich das Gerät.
 */
export type HilfeThemaEl = { id: string; titel: string; el: ReactNode };
const SORT_KEY = "familienakte.hilfe.sortierung.v1";
const SEITENNAME: Partial<Record<SectionId, string>> = {
  reminders: "Fristen und Aufgaben", security: "Sicherheit", inbox: "Eingangszentrale", documents: "Dokumente", memory: "Tagebuch",
  cockpit: "Cockpit", inventory: "Bestand prüfen", overview: "Startseite", systemcheck: "Systemprüfung", assistant: "Assistenz",
  workflowpdf: "Workflow PDF", stapel: "Stapel", health: "Gesundheit", medical: "Gesundheit", sources: "Unterlagen", directory: "Alle Bereiche",
  changelog: "Was gibt’s Neues?", versions: "Versionshistorie", correspondence: "Korrespondenz",
};

/** Welche Einrichtungs-Themen schon erledigt sind; liest nur vorhandene Zustände dieses Geräts. */
export function hilfeEingerichtet(datentresor?: string): Set<string> {
  const fertig = new Set<string>();
  try {
    if (datentresor) { fertig.add("wo-liegt-was"); fertig.add("datentresor"); }
    if (kalenderEinstLesen()) fertig.add("fristen-kalender");
    if (glockeIstAn()) fertig.add("app-glocke");
    if (vollsicherungAbgehakt()) fertig.add("akten-sichern");
  } catch { /* ohne Speicher gilt nichts als eingerichtet */ }
  return fertig;
}

function sortLesen(): "ordnung" | "az" { try { return workspaceStorage.getItem(SORT_KEY) === "az" ? "az" : "ordnung"; } catch { return "ordnung"; } }

type Gruppe = { id: string; titel: string; unter?: string; themen: HilfeThemaEl[] };
export function hilfeGruppen(themen: HilfeThemaEl[], herkunft: SectionId | undefined, eingerichtet: Set<string>): Gruppe[] {
  const meta = (t: HilfeThemaEl) => HILFE_ORDNUNG[t.id] || { gruppe: "allgemein" as const, seiten: [], worte: [] };
  const vergeben = new Set<string>();
  const nimm = (liste: HilfeThemaEl[]) => { const frei = liste.filter((t) => !vergeben.has(t.id)); frei.forEach((t) => vergeben.add(t.id)); return frei; };
  const gruppen: Gruppe[] = [];
  if (herkunft && herkunft !== "help") {
    const passend = nimm(themen.filter((t) => meta(t).seiten.includes(herkunft)).slice(0, 6));
    if (passend.length) gruppen.push({ id: "passend", titel: `Passend zu „${SEITENNAME[herkunft] || "der letzten Seite"}“`, themen: passend });
  }
  gruppen.push({ id: "einrichten", titel: "Einrichten", unter: "noch offen auf diesem Gerät", themen: nimm(themen.filter((t) => meta(t).gruppe === "einrichten" && !eingerichtet.has(t.id))) });
  const schritte = ([1, 2, 3, 4, 5] as HilfeSchritt[]);
  const arbeiten = themen.filter((t) => meta(t).gruppe === "arbeiten").sort((a, b) => (meta(a).schritt || 9) - (meta(b).schritt || 9));
  gruppen.push({ id: "arbeiten", titel: "Arbeiten, Schritt für Schritt", unter: schritte.map((n) => SCHRITT_NAME[n]).join(" → "), themen: nimm(arbeiten) });
  gruppen.push({ id: "allgemein", titel: "Allgemeines", themen: nimm(themen.filter((t) => meta(t).gruppe === "allgemein")) });
  gruppen.push({ id: "eingerichtet", titel: "Schon eingerichtet", themen: nimm(themen.filter((t) => meta(t).gruppe === "einrichten")) });
  gruppen.push({ id: "fachlich", titel: "Fachliches", unter: "für Prüfung und Weiterentwicklung", themen: nimm(themen) });
  return gruppen.filter((g) => g.themen.length);
}

export function HilfeOrdnungAnsicht({ themen, herkunft, eingerichtet, oben, zwischen }: { themen: HilfeThemaEl[]; herkunft?: SectionId; eingerichtet: Set<string>; oben?: ReactNode; zwischen?: ReactNode }) {
  const [sortierung, setSortierung] = useState(sortLesen);
  const [frage, setFrage] = useState("");
  const [treffer, setTreffer] = useState<Array<{ id: string; titel: string }>>([]);
  const liste = useRef<HTMLDivElement>(null);
  const gruppen = useMemo(() => sortierung === "az"
    ? [{ id: "az", titel: "Alle Themen von A bis Z", themen: [...themen].sort((a, b) => a.titel.localeCompare(b.titel, "de")) }]
    : hilfeGruppen(themen, herkunft, eingerichtet), [sortierung, themen, herkunft, eingerichtet]);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const mitText = themen.map((t) => ({ id: t.id, titel: t.titel, text: liste.current?.querySelector(`[data-hilfe-id="${t.id}"]`)?.textContent || "" }));
      setTreffer(frage.trim().length >= 3 ? hilfeSuchen(frage, mitText) : []);
    }, 150);
    return () => window.clearTimeout(id);
  }, [frage, themen]);
  const umschalten = () => { const neu = sortierung === "az" ? "ordnung" : "az"; setSortierung(neu); try { workspaceStorage.setItem(SORT_KEY, neu); } catch { /* nur für jetzt */ } };
  const hin = (id: string) => zurStelle(`[data-hilfe-id="${id}"] details, [data-hilfe-id="${id}"] > *`);
  return <>
    {oben}
    <section className="card hilfe-frage" data-hilfe-frage>
      <label htmlFor="hilfe-frage-feld"><Search size={18}/> <strong>Wie kann ich dir helfen?</strong></label>
      <VoiceInput id="hilfe-frage-feld" value={frage} onValueChange={setFrage} speechLabel="Frage an die Hilfe" placeholder="z. B. „Glocke klingelt nicht“ oder „Foto zu groß“" maxLength={200}/>
      {frage.trim().length >= 3 && (treffer.length
        ? <ul className="hilfe-treffer" aria-label="Passende Hilfe-Themen">{treffer.map((t) => <li key={t.id}><button type="button" data-hilfe-treffer={t.id} onClick={() => hin(t.id)}>{t.titel} <span aria-hidden="true">›</span></button></li>)}</ul>
        : <p className="hilfe-kein-treffer">Dazu finde ich kein Thema. Versuche andere Wörter oder sieh unten in „Arbeiten, Schritt für Schritt“ nach.</p>)}
    </section>
    {zwischen}
    <div className="hilfe-sortierung"><button type="button" className="button secondary" onClick={umschalten} data-hilfe-sortierung={sortierung}>
      {sortierung === "az" ? <><ListOrdered size={17}/> Nach Schritten ordnen</> : <><ArrowDownAZ size={17}/> A–Z</>}</button></div>
    <div ref={liste} className="hilfe-gruppen">
      {gruppen.map((g) => <section key={g.id} className="help-topics hilfe-gruppe" data-hilfe-gruppe={g.id} aria-label={g.titel}>
        <h3 className="hilfe-gruppe-titel">{g.titel}{"unter" in g && g.unter && <small>{g.unter}</small>}</h3>
        {g.themen.map((t) => <div key={t.id} className="hilfe-eintrag" data-hilfe-id={t.id}>{t.el}</div>)}
      </section>)}
    </div>
  </>;
}
