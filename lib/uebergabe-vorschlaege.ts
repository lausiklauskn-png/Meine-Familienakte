/** Optional sidecar metadata from another app. These are display suggestions,
 * never instructions, database IDs, permissions or a receipt. */
export type UebergabeVorschlag = {
  quelle: string; name: string; lebensbereich?: string; dokumentart?: string; vorgang?: string; hinweis?: string;
};
const MAX = 64 * 1024;
const plain = (v: unknown, max: number) => typeof v === "string" && v.length <= max && !/[\u0000-\u001f\u007f]/.test(v) ? v.trim() : "";
const sha = async (f: File) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", await f.arrayBuffer()))].map(x => x.toString(16).padStart(2, "0")).join("");

export async function uebergabeVorschlaege(files: File[]) {
  const vorschlaege = new Map<File, UebergabeVorschlag>(), hinweise = new Map<File, string>();
  const candidates = new Map<File, UebergabeVorschlag[]>();
  const companions = files.filter(f => f.name.toLowerCase() === "familienakte-uebergabe.json");
  for (const companion of companions) {
    try {
      if (companion.size > MAX) throw Error("Begleitdatei ist größer als 64 KiB.");
      const data: unknown = JSON.parse(await companion.text());
      if (!data || typeof data !== "object") throw Error("Begleitdatei enthält keinen Metadatenvertrag.");
      const m = data as Record<string, unknown>;
      if (m.vertrag !== "familienakte-uebergabe/1" || !Array.isArray(m.dateien) || m.dateien.length > 30) throw Error("Begleitdatei enthält keinen passenden Metadatenvertrag (höchstens 30 Einträge).");
      const quelle = plain(m.quelle, 100) || "Andere App"; let attached = 0, unmatched = 0;
      const pending: Array<[File, UebergabeVorschlag]> = [];
      for (const entry of m.dateien) {
        if (!entry || typeof entry !== "object") { unmatched++; continue; }
        const e = entry as Record<string, unknown>, name = plain(e.name, 255);
        const matches = files.filter(f => !companions.includes(f) && f.name === name);
        if (!name || /[\\/]/.test(name) || matches.length !== 1) { unmatched++; continue; }
        const file = matches[0];
        if (e.sha256 !== undefined && (file.size > 20 * 1024 * 1024 || typeof e.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(e.sha256) || await sha(file) !== e.sha256)) { unmatched++; continue; }
        const suggestion: UebergabeVorschlag = { quelle, name };
        for (const key of ["lebensbereich", "dokumentart", "vorgang", "hinweis"] as const) {
          const value = plain(e[key], key === "hinweis" ? 1000 : 100); if (value) suggestion[key] = value;
        }
        if (!suggestion.lebensbereich && !suggestion.dokumentart && !suggestion.vorgang && !suggestion.hinweis) continue;
        pending.push([file, suggestion]); attached++;
      }
      // Ein Lesefehler in derselben Begleitdatei darf keine halbe Auswertung hinterlassen.
      for (const [file, suggestion] of pending) {
        const existing = candidates.get(file) || []; existing.push(suggestion); candidates.set(file, existing);
      }
      hinweise.set(companion, `Begleitdatei mit ${attached} Vorschlägen aus „${quelle}“. ${unmatched ? `${unmatched} Einträge konnten keiner eindeutigen Datei dieser Auswahl zugeordnet werden. ` : ""}Die Angaben sind erst nach deiner Prüfung wirksam. Diese Original-Begleitdatei bleibt im Eingang.`);
    } catch (error) {
      hinweise.set(companion, `${error instanceof Error ? error.message : "Begleitdatei konnte nicht gelesen werden."} Keine Metadaten übernommen; die Originaldatei bleibt im Eingang.`);
    }
  }
  for (const [file, list] of candidates) {
    if (list.length === 1) vorschlaege.set(file, list[0]);
    else hinweise.set(file, "Mehrere Metadatenvorschläge für denselben Dateinamen. Bitte selbst zuordnen; kein fremder Vorschlag wurde ausgewählt.");
  }
  return { vorschlaege, hinweise };
}
