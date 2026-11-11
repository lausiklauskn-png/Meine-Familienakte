/** 2.28.65 (Startbrief 11.11.2026, Punkte 3 und 4): Cloud-Ordner hereinholen (Weg B, baut auf dem Eingangsordner auf).
 *  Befund vor dem Bau: der Eingangsordner (Stufe E) verweist bis zur Bestätigung nur auf die Datei im Ordner (`ordnerDatei`),
 *  erst „Übernehmen“ kopiert sie in die Akte. Für den Cloud-Ordner reicht das nicht – fällt OneDrive weg, darf nichts fehlen.
 *  Darum wird hier jede neue oder geänderte Datei sofort als Kopie in die Eingangszentrale gelegt (Arbeitsspeicher der App),
 *  beim Übernehmen dann wie jede Unterlage in den Speicher der Akte. Im Cloud-Ordner wird nichts geändert. */
import { CLOUD_BLOCK, MAX_DATEIEN, MAX_TIEFE, bekanntMerken, einordnen, geraetSatz, hinweisFuer, uebergehen, type Bekannt, type Gefunden } from "../lib/cloud-ordner";
import { folderPickerSupported, type LocalDocument } from "./local-vault";
import { NativerOrdner, istNativerOrdner, nativePlattform, nativenOrdnerWaehlen, ordnerPlugin } from "./nativer-ordner";
import { laufwerkTx, ortMerken } from "./laufwerk";
import { demoActive } from "../lib/demo-workspace";
import type { UebergabeVorschlag } from "../lib/uebergabe-vorschlaege";

export type CloudOrdner = { name: string; ort: string | null; verbunden: string; letzteSuche: string | null; bekannt: Bekannt; unlesbar: string[]; pakete: Gefunden[]; wartend: number };
const SCHLUESSEL = "cloud-ordner-einstellung";
let sitzungsHandle: FileSystemDirectoryHandle | null = null;
const HANDLE = "cloud-ordner";

export const cloudOrdnerLesen = async (): Promise<CloudOrdner | null> => (await laufwerkTx<CloudOrdner | undefined>("handles", "readonly", (s) => s.get(SCHLUESSEL)).catch(() => undefined)) || null;
const merken = (c: CloudOrdner) => laufwerkTx("handles", "readwrite", (s) => s.put(c, SCHLUESSEL));

export function cloudGeraet() {
  const p = nativePlattform();
  return geraetSatz({ plattform: ordnerPlugin() ? (p === "windows" ? "windows" : "android") : folderPickerSupported() ? "browser-ordner" : "browser-ohne" });
}

export async function cloudOrdnerWaehlen(): Promise<CloudOrdner> {
  if (demoActive()) throw new Error("In der Demo gibt es keinen Cloud-Ordner. Bitte zuerst die Demo verlassen.");
  let handle: FileSystemDirectoryHandle;
  if (ordnerPlugin()) handle = await nativenOrdnerWaehlen("Cloud-Ordner wählen (z. B. OneDrive) – die App liest nur");
  else {
    const picker = (window as Window & { showDirectoryPicker?: (o: { mode: string }) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
    if (!picker) throw new Error(cloudGeraet().satz);
    handle = await picker({ mode: "read" });
  }
  const ort = await ortMerken(handle, HANDLE); sitzungsHandle = istNativerOrdner(handle) ? null : handle;
  const c: CloudOrdner = { name: handle.name, ort, verbunden: new Date().toISOString(), letzteSuche: null, bekannt: {}, unlesbar: [], pakete: [], wartend: 0 };
  await merken(c);
  return c;
}

/** „Trennen“: die Verbindung endet, die Akte behält alles, was schon hereingeholt wurde. */
export async function cloudOrdnerTrennen() {
  sitzungsHandle = null;
  await laufwerkTx("handles", "readwrite", (s) => s.delete(SCHLUESSEL));
  await laufwerkTx("handles", "readwrite", (s) => s.delete(HANDLE)).catch(() => undefined);
  window.dispatchEvent(new Event("familienakte:cloud-ordner"));
}

export async function cloudOrdnerOeffnen(c: CloudOrdner, mitTipp: boolean): Promise<FileSystemDirectoryHandle | null> {
  const p = ordnerPlugin() as (ReturnType<typeof ordnerPlugin> & { ordnerOeffnen?: (a: { ort: string }) => Promise<{ erreichbar: boolean; token?: string; name?: string }> }) | null;
  if (p) {
    if (!c.ort || !p.ordnerOeffnen) return null;
    const r = await p.ordnerOeffnen({ ort: c.ort }).catch(() => ({ erreichbar: false } as { erreichbar: boolean; token?: string; name?: string }));
    return r.erreichbar && r.token ? new NativerOrdner(p, r.token, "", r.name || c.name) as unknown as FileSystemDirectoryHandle : null;
  }
  // In dieser Sitzung gewählt: direkt nutzen (die Erlaubnis gilt noch). Sonst den gemerkten Handle aus dem App-Speicher.
  if (sitzungsHandle) return sitzungsHandle;
  const h = await laufwerkTx<FileSystemDirectoryHandle | undefined>("handles", "readonly", (s) => s.get(HANDLE)).catch(() => undefined);
  if (!h) return null;
  const ph = h as FileSystemDirectoryHandle & { queryPermission?: (o: { mode: string }) => Promise<string>; requestPermission?: (o: { mode: string }) => Promise<string> };
  if (!ph.queryPermission || await ph.queryPermission({ mode: "read" }) === "granted") return h;
  if (mitTipp && ph.requestPermission && await ph.requestPermission({ mode: "read" }) === "granted") return h;
  return null;
}

type Eintrag = { name: string; art: "datei" | "ordner"; groesse: number; geaendert?: number };
type DirIter = FileSystemDirectoryHandle & { values: () => AsyncIterableIterator<FileSystemHandle> };
/** Alle Dateien mit Unterordnern, nur Metadaten (nativ ohne die Dateien zu lesen). */
export async function durchsehen(wurzel: FileSystemDirectoryHandle): Promise<{ gefunden: Gefunden[]; unlesbar: string[] }> {
  const gefunden: Gefunden[] = [], unlesbar: string[] = [];
  const p = ordnerPlugin() as (ReturnType<typeof ordnerPlugin> & { ordnerListe: (a: { token: string; pfad: string }) => Promise<{ eintraege: Eintrag[] }> }) | null;
  const lauf = async (ordner: FileSystemDirectoryHandle, pfad: string, tiefe: number) => {
    if (tiefe > MAX_TIEFE || gefunden.length >= MAX_DATEIEN) return;
    if (istNativerOrdner(ordner) && p) {
      let liste: Eintrag[];
      try { liste = (await p.ordnerListe({ token: (ordner as unknown as NativerOrdner).token, pfad: (ordner as unknown as NativerOrdner).pfad })).eintraege; } catch { unlesbar.push(pfad || ordner.name); return; }
      for (const e of liste) {
        if (uebergehen(e.name, e.art === "ordner")) continue;
        const rel = pfad ? `${pfad}/${e.name}` : e.name;
        if (e.art === "ordner") await lauf(await ordner.getDirectoryHandle(e.name), rel, tiefe + 1);
        else gefunden.push({ pfad: rel, name: e.name, size: e.groesse, lastModified: Number(e.geaendert) || 0 });
      }
      return;
    }
    for await (const e of (ordner as DirIter).values()) {
      if (uebergehen(e.name, e.kind === "directory")) continue;
      const rel = pfad ? `${pfad}/${e.name}` : e.name;
      if (e.kind === "directory") { await lauf(e as FileSystemDirectoryHandle, rel, tiefe + 1); continue; }
      try { const f = await (e as FileSystemFileHandle).getFile(); gefunden.push({ pfad: rel, name: e.name, size: f.size, lastModified: f.lastModified }); }
      catch { unlesbar.push(rel); }
    }
  };
  await lauf(wurzel, "", 0);
  return { gefunden, unlesbar };
}

/** Eine Datei aus dem Cloud-Ordner ganz lesen. Lässt sie sich nicht lesen (OneDrive-Platzhalter ohne Netz), kommt null. */
export async function dateiLesen(wurzel: FileSystemDirectoryHandle, pfad: string): Promise<File | null> {
  try {
    const teile = pfad.split("/"); const name = teile.pop()!; let o = wurzel;
    for (const t of teile) o = await o.getDirectoryHandle(t);
    const f = await (await o.getFileHandle(name)).getFile();
    // Ganz lesen erzwingt bei OneDrive das Herunterladen; erst danach ist es eine Kopie, die ohne OneDrive bleibt.
    const bytes = await f.arrayBuffer();
    return new File([bytes], name, { type: f.type || typFuer(name), lastModified: f.lastModified });
  } catch { return null; }
}
const typFuer = (name: string) => /\.pdf$/i.test(name) ? "application/pdf" : /\.jpe?g$/i.test(name) ? "image/jpeg" : /\.png$/i.test(name) ? "image/png" : /\.eml$/i.test(name) ? "message/rfc822" : "application/octet-stream";

export type Hereinholen = (dateien: Array<{ file: File; vorschlag: UebergabeVorschlag; hinweis: string }>) => Promise<boolean>;
export type CloudErgebnis = { geholt: number; neu: number; geaendert: number; weitere: number; unlesbar: string[]; pakete: Gefunden[]; schonInAkte: number; nichtErreichbar?: boolean };

let laeuft = false;
/** Nachsehen: neue und geänderte Dateien (höchstens ein Block zu 20) als Kopie in die Eingangszentrale, Pakete merken. */
export async function cloudOrdnerPruefen(a: { mitTipp: boolean; dokumente: LocalDocument[]; hereinholen: Hereinholen }): Promise<CloudErgebnis | null> {
  if (laeuft || demoActive()) return null;
  const c = await cloudOrdnerLesen(); if (!c) return null;
  laeuft = true;
  try {
    const wurzel = await cloudOrdnerOeffnen(c, a.mitTipp);
    if (!wurzel) return { geholt: 0, neu: 0, geaendert: 0, weitere: 0, unlesbar: [], pakete: c.pakete, schonInAkte: 0, nichtErreichbar: true };
    const { gefunden, unlesbar } = await durchsehen(wurzel);
    const inAkte = new Set(a.dokumente.map((d) => `${d.originalName.toLocaleLowerCase("de")}|${d.sizeBytes}`));
    const e = einordnen(gefunden, c.bekannt, inAkte);
    const kandidaten = [...e.geaendert.map((g) => ({ g, geaendert: true })), ...e.neu.map((g) => ({ g, geaendert: false }))];
    const block = kandidaten.slice(0, CLOUD_BLOCK);
    const dateien: Array<{ file: File; vorschlag: UebergabeVorschlag; hinweis: string }> = [], geholt = [] as Gefunden[], nichtLesbar = [...unlesbar];
    for (const { g, geaendert } of block) {
      const file = await dateiLesen(wurzel, g.pfad);
      if (!file || file.size !== g.size) { nichtLesbar.push(g.pfad); continue; }
      const hinweis = hinweisFuer(c.name, g, geaendert);
      dateien.push({ file, hinweis, vorschlag: { quelle: "Cloud-Ordner", name: g.name, hinweis } }); geholt.push(g);
    }
    if (dateien.length && !(await a.hereinholen(dateien))) throw new Error("Die Eingangszentrale hat die Dateien nicht angenommen.");
    // Bekannt erst, wenn die Kopie sicher im Eingang liegt. Schon in der Akte Vorhandenes zählt auch als bekannt.
    const schonDa = gefunden.filter((g) => !c.bekannt[g.pfad] && inAkte.has(`${g.name.toLocaleLowerCase("de")}|${g.size}`));
    const pakete = [...c.pakete.filter((p) => !e.pakete.some((g) => g.pfad === p.pfad)), ...e.pakete];
    const weitere = kandidaten.length - block.length;
    await merken({ ...c, letzteSuche: new Date().toISOString(), bekannt: bekanntMerken(c.bekannt, [...geholt, ...schonDa]), unlesbar: [...new Set(nichtLesbar)].slice(0, 50), pakete, wartend: weitere });
    window.dispatchEvent(new Event("familienakte:cloud-ordner"));
    return { geholt: geholt.length, neu: e.neu.length, geaendert: e.geaendert.length, weitere, unlesbar: nichtLesbar, pakete, schonInAkte: e.schonInAkte };
  } finally { laeuft = false; }
}

/** Handy-Schleife: ein Paket aus dem Cloud-Ordner lesen (zum Einlesen über die gemeinsame Festplatte/Paket-Karte). */
export async function paketAusCloud(pfad: string): Promise<File> {
  const c = await cloudOrdnerLesen(); if (!c) throw new Error("Kein Cloud-Ordner verbunden.");
  const w = await cloudOrdnerOeffnen(c, true); if (!w) throw new Error(`„${c.name}“ ist gerade nicht erreichbar.`);
  const f = await dateiLesen(w, pfad); if (!f) throw new Error("Das Paket ließ sich nicht lesen. Bei OneDrive: Ordner auf „Immer auf diesem Gerät behalten“ stellen.");
  return f;
}
/** Nach dem Einlesen (oder „Auslassen“): Paket als erledigt merken – im Ordner bleibt es liegen. */
export async function paketErledigt(g: Gefunden) {
  const c = await cloudOrdnerLesen(); if (!c) return;
  await merken({ ...c, pakete: c.pakete.filter((p) => p.pfad !== g.pfad), bekannt: bekanntMerken(c.bekannt, [g]) });
  window.dispatchEvent(new Event("familienakte:cloud-ordner"));
}
