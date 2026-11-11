/** 2.28.65 (Startbrief 11.11.2026, Punkte 3 und 4): Cloud-Ordner hereinholen – reine Regeln ohne Dateizugriff.
 *  Der Ordner wird nur gelesen. Was neu oder geändert ist, wird als Kopie in die Eingangszentrale gelegt; der Ordner ist
 *  danach nur noch Herkunft („OneDrive › Auto › Versicherung“). Pakete vom Handy (Familienakte-Paket_….fav) gehen nicht in
 *  den Eingang, sondern zum Paket-Einlesen (Zusammenführen, nichts wird gelöscht). */

export type Gefunden = { pfad: string; name: string; size: number; lastModified: number };
export type Bekannt = Record<string, { size: number; lastModified: number }>;
export const CLOUD_BLOCK = 20;
export const CLOUD_TAKT_MS = 15 * 60 * 1000;
export const MAX_TIEFE = 10;
export const MAX_DATEIEN = 5000;

/** Was beim Durchsehen übergangen wird: versteckte und Office-Sperrdateien, die eigenen Ordner der Familienakte. */
export function uebergehen(name: string, istOrdner: boolean): boolean {
  if (!name || name.startsWith(".") || name.startsWith("~$") || /^desktop\.ini$|^thumbs\.db$/i.test(name)) return true;
  if (istOrdner && (/^Familienakte_Vollsicherung_/.test(name) || name === "Familienakte-Abgleich")) return true;
  return !istOrdner && /\.(tmp|partial|crdownload|teil)$/i.test(name);
}
export const istPaket = (name: string) => /^Familienakte-Paket_.+\.fav$/i.test(name);

export type Einordnung = { neu: Gefunden[]; geaendert: Gefunden[]; pakete: Gefunden[]; schonInAkte: number };
/** Neu = Pfad unbekannt (und nicht schon als Name+Größe in der Akte); geändert = Pfad bekannt, Größe oder Zeit anders. */
export function einordnen(gefunden: Gefunden[], bekannt: Bekannt, inAkte: Set<string>): Einordnung {
  const out: Einordnung = { neu: [], geaendert: [], pakete: [], schonInAkte: 0 };
  for (const g of gefunden) {
    const alt = bekannt[g.pfad];
    if (alt && alt.size === g.size && alt.lastModified === g.lastModified) continue;
    if (istPaket(g.name)) { out.pakete.push(g); continue; }
    if (alt) { out.geaendert.push(g); continue; }
    if (inAkte.has(`${g.name.toLocaleLowerCase("de")}|${g.size}`)) { out.schonInAkte++; continue; }
    out.neu.push(g);
  }
  return out;
}

/** Herkunft als lesbarer Pfad: „OneDrive › Auto › Versicherung“ (ohne den Dateinamen). */
export function herkunft(ordnerName: string, pfad: string): string {
  const teile = pfad.split("/"); teile.pop();
  return [ordnerName, ...teile].join(" › ");
}

/** Hinweis an der Karte in der Eingangszentrale. */
export function hinweisFuer(ordnerName: string, g: Gefunden, geaendert: boolean): string {
  return `Aus dem Cloud-Ordner: ${herkunft(ordnerName, g.pfad)}${geaendert ? ` · neue Fassung von „${g.name}“ – die bisherige bleibt in der Akte` : ""}`;
}

/** Was dieses Gerät kann (ein Satz statt eines toten Knopfs). */
export function geraetSatz(a: { plattform: "android" | "windows" | "browser-ordner" | "browser-ohne" }): { geht: boolean; satz: string } {
  if (a.plattform === "windows") return { geht: true, satz: "Am PC: den OneDrive-Ordner im Explorer wählen." };
  if (a.plattform === "browser-ordner") return { geht: true, satz: "Am PC in Chrome oder Edge: den OneDrive-Ordner wählen. Die Erlaubnis gilt, solange der Browser sie behält." };
  if (a.plattform === "android") return { geht: true, satz: "Am Handy hält die OneDrive-App keinen Ordner. Hier geht ein Ordner auf dem Gerät (z. B. von einer Sync-App); für OneDrive am Handy „Paket teilen“ in die OneDrive-App nutzen." };
  return { geht: false, satz: "Diese Web-App kann hier keinen Ordner lesen. Der Cloud-Ordner geht in der Windows-App oder am PC in Chrome oder Edge." };
}

/** Merken: höchstens MAX_DATEIEN Pfade; neue Einträge überschreiben alte. */
export function bekanntMerken(bekannt: Bekannt, dazu: Gefunden[]): Bekannt {
  const out: Bekannt = { ...bekannt };
  for (const g of dazu) { delete out[g.pfad]; out[g.pfad] = { size: g.size, lastModified: g.lastModified }; }
  const schluessel = Object.keys(out);
  if (schluessel.length > MAX_DATEIEN) for (const k of schluessel.slice(0, schluessel.length - MAX_DATEIEN)) delete out[k];
  return out;
}
