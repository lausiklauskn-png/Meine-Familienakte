/** Stufe A (Plan 08.11.2026): Zusammenführen zweier Akten-Stände. Reine Rechnung ohne Dateizugriff, für alle Wege gleich
 *  (Sicherung einlesen, gemeinsame Festplatte, WLAN, Paket).
 *
 *  Regeln (Klaus 08.11.):
 *  - Ein Eintrag ist derselbe, wenn die Kennung gleich ist. Einträge mit laufender Nummer (PER-000001 …) gelten nur dann als
 *    derselbe, wenn auch die Anlagezeit gleich ist; sonst bekommt der hinzukommende die nächste freie Nummer, Verweise wandern mit.
 *  - Dokumente mit gleicher Prüfsumme sind dieselbe Datei, auch unter anderer Kennung (zweimal abgelegt).
 *  - Mit gemerktem Stand vom letzten Abgleich: nur eine Seite geändert → still übernehmen; beide geändert → fragen.
 *    Ohne gemerkten Stand ist jeder Unterschied eine Frage; vorgeschlagen ist die jüngere Änderung.
 *  - Nichts wird über den Abgleich gelöscht. Was nur hier liegt, bleibt; was nur dort liegt, kommt dazu.
 *  - Die Uhrzeit entscheidet nie, sie wird nur angezeigt und für den Vorschlag genutzt. */

export type Bereich = "documents" | "records" | "relations" | "memoryDrafts" | "linkDecisions";
export const BEREICHE: Bereich[] = ["documents", "records", "relations", "memoryDrafts", "linkDecisions"];
type Item = { id: string } & Record<string, unknown>;
export type Akte = { [B in Bereich]: Item[] } & { sequences?: Record<string, number>; auditLog?: Item[] };
/** Fingerabdruck je Eintrag beim letzten Abgleich mit diesem Partner, Schlüssel `bereich:id`. */
export type Basis = Record<string, string>;
export type Seite = "hier" | "dort";

export type Konflikt = {
  schluessel: string; bereich: Bereich; id: string; titel: string;
  hier: Item; dort: Item; hierZeit: string | null; dortZeit: string | null;
  /** Vorschlag: die jüngere Änderung; bei gleicher oder fehlender Zeit „hier“ (nichts ändert sich still). */
  vorschlag: Seite;
};
export type Zeile = { art: "neu" | "übernommen" | "gleich-datei" | "neu-nummeriert"; bereich: Bereich; titel: string };
export type AbgleichPlan = {
  hier: Akte; dort: Akte;
  /** dort, nachdem kollidierende Nummern umbenannt und doppelte Dateien auf die vorhandene Kennung gelegt wurden */
  dortAngepasst: Akte;
  umbenannt: Record<string, string>;
  liste: Zeile[];
  konflikte: Konflikt[];
  zaehlung: { neu: number; uebernommen: number; konflikte: number; gleich: number; nurHier: number };
};

/** Feste Reihenfolge der Schlüssel, damit gleicher Inhalt den gleichen Fingerabdruck gibt. */
export function stabil(wert: unknown): string {
  if (wert === null || typeof wert !== "object") return JSON.stringify(wert) ?? "null";
  if (Array.isArray(wert)) return `[${wert.map(stabil).join(",")}]`;
  const o = wert as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${stabil(o[k])}`).join(",")}}`;
}
/** FNV-1a über den stabilen Text, zweimal mit verschiedenem Anfang (64 Bit als Hex). Reicht zum Wiedererkennen, ist kein Schutz. */
export function fingerabdruck(wert: unknown): string {
  const text = stabil(wert);
  const lauf = (start: number) => { let h = start >>> 0; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, "0"); };
  return lauf(2166136261) + lauf(0x811c9dc5 ^ 0x5bd1e995);
}
export const schluessel = (bereich: Bereich, id: string) => `${bereich}:${id}`;
/** Stand nach einem Abgleich, zum Merken je Partner. */
export function basisAus(akte: Akte): Basis {
  const b: Basis = {};
  for (const bereich of BEREICHE) for (const x of akte[bereich] || []) b[schluessel(bereich, x.id)] = fingerabdruck(x);
  return b;
}

const NUMMER = /^([A-Z]{2,5})-(\d{6})$/;
const zeitVon = (x: Item) => (typeof x.updatedAt === "string" && x.updatedAt) || (typeof x.createdAt === "string" && x.createdAt) || (typeof x.addedAt === "string" && x.addedAt) || null;
export function titelVon(bereich: Bereich, x: Item): string {
  if (bereich === "documents") return `Dokument: ${String(x.titel || x.originalName || x.id)}`;
  if (bereich === "relations") return "Verknüpfung";
  if (bereich === "memoryDrafts") return `Memory-Entwurf: ${String(x.originalText || x.id).slice(0, 60)}`;
  if (bereich === "linkDecisions") return "Verknüpfungs-Entscheidung";
  const d = (x.data || {}) as Record<string, unknown>;
  const name = [d.title, d.name, d.fullName, d.displayName, d.label, d.text].find((v) => typeof v === "string" && v.trim()) as string | undefined;
  return `${String(x.recordType || "Eintrag")}: ${(name || x.id).slice(0, 80)}`;
}

/** Ersetzt in allen Zeichenketten eines Werts genau gleiche Kennungen (keine Teilwörter). */
function kennungenErsetzen<T>(wert: T, tabelle: Record<string, string>): T {
  if (typeof wert === "string") return (tabelle[wert] ?? wert) as T;
  if (Array.isArray(wert)) return wert.map((v) => kennungenErsetzen(v, tabelle)) as T;
  if (wert && typeof wert === "object") { const o: Record<string, unknown> = {}; for (const [k, v] of Object.entries(wert)) o[k] = kennungenErsetzen(v, tabelle); return o as T; }
  return wert;
}

function naechsteNummer(praefix: string, belegt: Set<string>, seq: Record<string, number>) {
  let n = seq[praefix] || 0, id = "";
  do { n++; id = `${praefix}-${String(n).padStart(6, "0")}`; } while (belegt.has(id));
  seq[praefix] = n; belegt.add(id); return id;
}

/** Plant das Zusammenführen von `dort` in `hier`. Schreibt nichts. */
export function abgleichPlanen(hier: Akte, dort: Akte, basis: Basis | null = null): AbgleichPlan {
  const umbenannt: Record<string, string> = {}, liste: Zeile[] = [];
  // 1. Dokumente: gleiche Prüfsumme unter anderer Kennung = dieselbe Datei.
  const hierDoc = new Map(hier.documents.map((d) => [d.id, d]));
  const nachSumme = new Map(hier.documents.filter((d) => typeof d.checksum === "string" && d.checksum).map((d) => [d.checksum as string, d]));
  for (const d of dort.documents) {
    if (hierDoc.has(d.id) || typeof d.checksum !== "string" || !d.checksum) continue;
    const gleich = nachSumme.get(d.checksum);
    if (gleich) { umbenannt[d.id] = gleich.id; liste.push({ art: "gleich-datei", bereich: "documents", titel: titelVon("documents", d) }); }
  }
  // 2. Einträge mit laufender Nummer: gleiche Nummer, andere Anlagezeit → neue Nummer für den hinzukommenden.
  const belegt = new Set<string>([...hier.records, ...dort.records].map((r) => r.id));
  const seq: Record<string, number> = {};
  for (const r of [...hier.records, ...dort.records]) { const m = NUMMER.exec(r.id); if (m) seq[m[1]] = Math.max(seq[m[1]] || 0, Number(m[2])); }
  const hierRec = new Map(hier.records.map((r) => [r.id, r]));
  // Früher umbenannte Einträge findet ein späterer Abgleich an Art und Anlagezeit wieder.
  const nachAnlage = new Map(hier.records.filter((r) => typeof r.createdAt === "string").map((r) => [`${String(r.recordType)}|${String(r.createdAt)}`, r]));
  for (const r of dort.records) {
    const da = hierRec.get(r.id), m = NUMMER.exec(r.id);
    if (!m || (da && da.createdAt === r.createdAt)) continue;
    const frueher = nachAnlage.get(`${String(r.recordType)}|${String(r.createdAt)}`);
    if (frueher && frueher.id !== r.id && typeof r.createdAt === "string") { umbenannt[r.id] = frueher.id; continue; }
    if (!da) continue;
    umbenannt[r.id] = naechsteNummer(m[1], belegt, seq);
    liste.push({ art: "neu-nummeriert", bereich: "records", titel: titelVon("records", r) });
  }
  // Doppelte Dateien fallen weg, umbenannte Einträge tragen ihre neue Nummer; Verweise überall mitgeführt.
  const doppelt = new Set(Object.keys(umbenannt).filter((alt) => dort.documents.some((d) => d.id === alt)));
  const dortAngepasst = kennungenErsetzen({ ...dort, documents: dort.documents.filter((d) => !doppelt.has(d.id)) }, umbenannt) as Akte;
  for (const r of dortAngepasst.records) { const m = NUMMER.exec(r.id); if (m) seq[m[1]] = Math.max(seq[m[1]] || 0, Number(m[2])); }
  dortAngepasst.sequences = { ...(hier.sequences || {}), ...Object.fromEntries(Object.entries(seq).map(([p, n]) => [p, Math.max(n, hier.sequences?.[p] || 0, dort.sequences?.[p] || 0)])) };

  // 3. Drei-Wege-Vergleich je Bereich.
  const konflikte: Konflikt[] = [];
  let neu = 0, uebernommen = 0, gleich = 0, nurHier = 0;
  for (const bereich of BEREICHE) {
    const a = new Map((hier[bereich] || []).map((x) => [x.id, x])), b = new Map((dortAngepasst[bereich] || []).map((x) => [x.id, x]));
    for (const [id, x] of b) {
      const y = a.get(id);
      if (!y) { neu++; if (bereich !== "relations" && bereich !== "linkDecisions") liste.push({ art: "neu", bereich, titel: titelVon(bereich, x) }); continue; }
      const fa = fingerabdruck(y), fb = fingerabdruck(x);
      if (fa === fb) { gleich++; continue; }
      const alt = basis?.[schluessel(bereich, id)];
      if (alt && alt === fb) continue;                                   // nur hier geändert → hier bleibt
      if (alt && alt === fa) { uebernommen++; liste.push({ art: "übernommen", bereich, titel: titelVon(bereich, x) }); continue; } // nur dort geändert
      const hz = zeitVon(y), dz = zeitVon(x);
      konflikte.push({ schluessel: schluessel(bereich, id), bereich, id, titel: titelVon(bereich, y), hier: y, dort: x, hierZeit: hz, dortZeit: dz, vorschlag: hz && dz && dz > hz ? "dort" : "hier" });
    }
    for (const id of a.keys()) if (!b.has(id)) nurHier++;
  }
  const reihenfolge = { "übernommen": 0, "neu": 1, "neu-nummeriert": 2, "gleich-datei": 3 } as const;
  liste.sort((x, y) => reihenfolge[x.art] - reihenfolge[y.art] || x.titel.localeCompare(y.titel, "de"));
  return { hier, dort, dortAngepasst, umbenannt, liste, konflikte, zaehlung: { neu, uebernommen, konflikte: konflikte.length, gleich, nurHier } };
}

/** Wendet den Plan an. `wahl` je Konflikt-Schlüssel; fehlt sie, bleibt „hier“. Gibt die neue Akte und die neue Basis zurück. */
export function abgleichAnwenden(plan: AbgleichPlan, wahl: Record<string, Seite> = {}, basis: Basis | null = null) {
  const konfliktWahl = new Map(plan.konflikte.map((k) => [k.schluessel, wahl[k.schluessel] || "hier"]));
  const ergebnis = { ...plan.hier } as Akte;
  for (const bereich of BEREICHE) {
    const dort = new Map((plan.dortAngepasst[bereich] || []).map((x) => [x.id, x]));
    const liste: Item[] = [];
    for (const y of plan.hier[bereich] || []) {
      const x = dort.get(y.id); dort.delete(y.id);
      if (!x) { liste.push(y); continue; }
      const k = schluessel(bereich, y.id), w = konfliktWahl.get(k);
      if (w) { liste.push(w === "dort" ? x : y); continue; }
      const alt = basis?.[k];
      liste.push(alt && alt === fingerabdruck(y) && alt !== fingerabdruck(x) ? x : y);
    }
    for (const x of dort.values()) liste.push(x);
    ergebnis[bereich] = liste;
  }
  ergebnis.sequences = plan.dortAngepasst.sequences;
  if (plan.hier.auditLog || plan.dortAngepasst.auditLog) {
    const ids = new Set<string>(), log: Item[] = [];
    for (const e of [...(plan.hier.auditLog || []), ...(plan.dortAngepasst.auditLog || [])]) if (!ids.has(e.id)) { ids.add(e.id); log.push(e); }
    log.sort((x, y) => String(y.at || "").localeCompare(String(x.at || "")));
    ergebnis.auditLog = log;
  }
  return { akte: ergebnis, basis: basisAus(ergebnis) };
}
