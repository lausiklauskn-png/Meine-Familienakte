/** 2.28.65 (Startbrief 11.11.2026, Punkt 1): Sicherung an einem zweiten Ort – reine Rechnung ohne Dateizugriff.
 *
 *  Jede selbsttätige Sicherung ist eine gewöhnliche Vollsicherung (Ordner „Familienakte_Vollsicherung_…“) mit einer
 *  Kennungsdatei `Zweiter_Ort.json`. Nur Ordner mit dieser Datei UND der Kennung dieser Einrichtung gelten als eigene
 *  Sicherung und dürfen beim Aufräumen entfernt werden – nie fremde Ordner oder Dateien, nie die gerade geschriebene.
 *  Aufbewahrung (Klaus): am zweiten Ort genau eine (die neueste), auf dem Gerät zwei; erst schreiben und prüfen, dann löschen. */

export const MARKE_DATEI = "Zweiter_Ort.json";
export const MARKE_FORMAT = "familienakte-zweiter-ort";
export const BEHALTEN = { zweit: 1, geraet: 2 } as const;
export type Ziel = keyof typeof BEHALTEN;
/** Höchstens einmal am Tag von selbst (Vorschlag im Startbrief), der Knopf „Jetzt sichern“ geht immer. */
export const AUTO_ABSTAND_MS = 24 * 60 * 60 * 1000;

/** Gleiches Muster wie im nativen Teil (Android `FamilienakteOrdnerPlugin.SICHERUNG_NAME`, Windows `FamilyFolders`). */
export const SICHERUNG_NAME = /^Familienakte_Vollsicherung_[0-9TZ-]{10,40}(_verschluesselt)?(_[0-9]{1,3})?$/;
export const istSicherungsName = (name: string) => SICHERUNG_NAME.test(name);

export type Marke = { format: typeof MARKE_FORMAT; kennung: string; ziel: Ziel; erstellt: string; appVersion: string; verschluesselt: boolean; hinweis: string };

export function markeBauen(a: { kennung: string; ziel: Ziel; erstellt: string; appVersion: string; verschluesselt: boolean }): Marke {
  if (!/^[A-Za-z0-9-]{8,80}$/.test(a.kennung)) throw new Error("Ungültige Kennung des zweiten Orts.");
  return { format: MARKE_FORMAT, kennung: a.kennung, ziel: a.ziel, erstellt: a.erstellt, appVersion: a.appVersion, verschluesselt: a.verschluesselt,
    hinweis: "Selbsttätige Sicherung der Familienakte. Die App räumt hier nur ihre eigenen älteren Sicherungen auf (gleiche Kennung)." };
}

/** Liest eine Kennungsdatei; null, wenn sie nicht von dieser App stammt. */
export function markeLesen(text: string): Marke | null {
  try {
    const m = JSON.parse(text) as Partial<Marke>;
    if (m?.format !== MARKE_FORMAT || typeof m.kennung !== "string" || typeof m.erstellt !== "string" || (m.ziel !== "zweit" && m.ziel !== "geraet")) return null;
    return m as Marke;
  } catch { return null; }
}

export type Vorhanden = { name: string; marke: Marke | null };

/** Welche Ordner nach einer neuen, geprüften Sicherung entfernt werden: nur eigene (Name + Marke + Kennung), die neue bleibt,
 *  dazu die jüngsten bis zur Grenze. Alles andere bleibt unberührt. */
export function aufraeumen(vorhanden: Vorhanden[], kennung: string, neu: string, behalten: number): string[] {
  const eigene = vorhanden
    .filter((v) => v.name !== neu && istSicherungsName(v.name) && v.marke?.kennung === kennung)
    .sort((a, b) => String(b.marke!.erstellt).localeCompare(String(a.marke!.erstellt)));
  // Die neue zählt mit: von den älteren bleiben behalten − 1.
  return eigene.slice(Math.max(0, behalten - 1)).map((v) => v.name);
}

export type Letzte = { zeit: string; ordner: string; ok: boolean; grund?: string; fingerabdruck: string } | null;

/** Soll jetzt von selbst gesichert werden? Nur mit Daten, nur bei Änderung seit der letzten gelungenen Sicherung,
 *  höchstens einmal je Abstand. Nach einem Fehler wird beim nächsten Anlass erneut versucht (wieder höchstens einmal am Tag). */
export function jetztFaellig(a: { letzte: Letzte; letzteGelungen: Letzte; fingerabdruck: string; hatDaten: boolean; jetzt: number; abstand?: number }): boolean {
  if (!a.hatDaten) return false;
  const abstand = a.abstand ?? AUTO_ABSTAND_MS;
  if (a.letzteGelungen && a.letzteGelungen.fingerabdruck === a.fingerabdruck) return false;
  const zuletzt = a.letzte ? Date.parse(a.letzte.zeit) : NaN;
  if (Number.isFinite(zuletzt) && a.jetzt - zuletzt < abstand) return false;
  return true;
}

/** Fingerabdruck des Akten-Stands: ändert sich bei jeder gespeicherten Änderung (Register-Zeitstempel, Anzahl). */
export const fingerabdruck = (s: { updatedAt: string; documentCount: number; recordCount?: number }) => `${s.updatedAt}|${s.documentCount}|${s.recordCount ?? ""}`;

/** Ein Satz zum Zustand (Block 1). */
export function zustandSatz(a: { eingerichtet: boolean; name?: string; letzte: Letzte; letzteGelungen: Letzte; jetzt: number }): string {
  if (!a.eingerichtet) return "Noch kein zweiter Ort gewählt.";
  if (a.letzte && !a.letzte.ok) return `Letzte Sicherung nicht gelungen: ${a.letzte.grund || "unbekannter Grund"}`;
  if (!a.letzteGelungen) return `„${a.name}“ gewählt · noch keine Sicherung dort.`;
  const tage = Math.floor((a.jetzt - Date.parse(a.letzteGelungen.zeit)) / 86400000);
  const wann = tage <= 0 ? "heute" : tage === 1 ? "gestern" : `vor ${tage} Tagen`;
  return `„${a.name}“ · zuletzt gesichert ${wann}.`;
}
