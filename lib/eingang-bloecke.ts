/** Stufe E (Plan 08.11.2026, Entscheidung 9): große Mengen in Blöcken. PDFs liegen in einem Eingangsordner, die App holt
 *  sie in Blöcken zu 20, prüft vorher den freien Speicher, arbeitet Block für Block und merkt sich, was sie schon hatte.
 *  Reine Rechnung; die Oberfläche und der Speicher hängen an app/health-portal.tsx. */

export const BLOCK = 20;
/** Sicherheitsabstand: ein Block braucht Platz für die Analyse (Textebene, Prüfsumme) und die spätere Ablage. */
export const SPEICHER_RESERVE = 50 * 1024 * 1024;

export function inBloecke<T>(liste: T[], groesse = BLOCK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < liste.length; i += Math.max(1, groesse)) out.push(liste.slice(i, i + Math.max(1, groesse)));
  return out;
}

export type SpeicherStand = { usage?: number; quota?: number } | null | undefined;
/** Reicht der freie Speicher für diesen Block? Ohne Messung (Android-WebView ohne Angabe) gilt „ja“ – ehrlich gemeldet als „nicht gemessen“. */
export function speicherReicht(stand: SpeicherStand, bytes: number): { ok: boolean; frei: number | null; noetig: number } {
  const noetig = bytes * 2 + SPEICHER_RESERVE;
  if (!stand || typeof stand.quota !== "number" || typeof stand.usage !== "number") return { ok: true, frei: null, noetig };
  const frei = Math.max(0, stand.quota - stand.usage);
  return { ok: frei >= noetig, frei, noetig };
}
export const mbText = (bytes: number) => `${(bytes / 1048576).toLocaleString("de-DE", { maximumFractionDigits: bytes < 10 * 1048576 ? 1 : 0 })} MB`;

/** Schlüssel einer Datei im Eingangsordner: Name, Größe, Änderungszeit – was die Dateisystem-Schnittstelle sicher liefert. */
export const dateiSchluessel = (f: { name: string; size: number; lastModified: number }) => `${f.name.toLocaleLowerCase("de")}|${f.size}|${f.lastModified}`;

/** Was im Ordner neu ist: weder schon gesehen noch in der Akte (Name|Größe) noch in der Warteschlange. Höchstens ein Block. */
export function neueImOrdner<T extends { name: string; size: number; lastModified: number }>(
  gefunden: T[], gesehen: Set<string>, inWarteschlange: Set<string>, hoechstens = BLOCK,
): T[] {
  const out: T[] = [];
  for (const f of gefunden) {
    const k = dateiSchluessel(f);
    if (gesehen.has(k) || inWarteschlange.has(k)) continue;
    out.push(f); if (out.length >= hoechstens) break;
  }
  return out;
}

/** Gemerkte Schlüssel: höchstens 5000, die ältesten fallen weg (JSON-Liste). */
export function gesehenMerken(bisher: string[], neu: string[], max = 5000): string[] {
  const alle = [...bisher.filter((k) => !neu.includes(k)), ...neu];
  return alle.length > max ? alle.slice(alle.length - max) : alle;
}

export function blockText(block: number, bloecke: number, dateien: number) {
  return bloecke > 1 ? `Block ${block} von ${bloecke} (${dateien} Datei${dateien === 1 ? "" : "en"})` : `${dateien} Datei${dateien === 1 ? "" : "en"}`;
}
