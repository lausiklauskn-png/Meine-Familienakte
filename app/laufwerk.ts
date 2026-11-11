/** Stufe C (Plan 08.11.2026, Entscheidungen 2, 3, 4, 6, 8): gemeinsame Festplatte (SD-Karte, USB-Platte, Netzordner).
 *
 *  Auf der Platte liegt ein Ordner `Familienakte-Abgleich/`:
 *  - `Familienakte-Laufwerk.json`  Kopf mit fester Kennung und eingepacktem Datenschlüssel (Passwort und Notfallschlüssel wie bei
 *                                   der verschlüsselten Vollsicherung). Daran erkennt jedes Gerät die Platte, egal unter welchem Namen.
 *  - `Stand/aktuell.json`           zeigt auf `stand-a.fav` oder `stand-b.fav` (zwei Plätze im Wechsel, nie halb überschrieben).
 *  - `Stand/stand-?.fav`            der gemeinsame Stand der Akte, verschlüsselt.
 *  - `Dateien/<Prüfsumme>.fav`      Originale, verschlüsselt, stückweise; dieselbe Datei liegt nur einmal.
 *
 *  Jedes Gerät merkt sich je Platte (im eigenen App-Speicher): Kennung, Ort, auf Wunsch den Datenschlüssel und den Stand beim
 *  letzten Abgleich (Fingerabdrücke). Der Abgleich selbst ist der Kern aus lib/abgleich.ts: nur eine Seite geändert → still,
 *  beide → fragen, nichts löschen. */
import { abgleichAnwenden, abgleichPlanen, basisAus, type AbgleichPlan, type Akte, type Basis, type Seite } from "../lib/abgleich";
import { dateiEntschluesseln, dateiVerschluesseln, schluesselExportieren, schluesselImportieren, textEntschluesseln, textVerschluesseln, tresorAnlegen, tresorOeffnen, type SicherungsKopf } from "../lib/sicherung-krypto";
import { workspaceStorage } from "../lib/demo-workspace";
import { akteFuerAbgleich, akteNachAbgleichSchreiben, dokumentDateiAblegen, dokumentDateiOderNull, fileChecksum, folderPickerSupported, type LocalDocument } from "./local-vault";
import { NativerOrdner, nativePlattform, ordnerPlugin } from "./nativer-ordner";
import { gastgeberPruefen, netzOrdner, netzPlugin, tokenAusCode, type NetzZustand } from "./netz-laufwerk";

export const LAUFWERK_ORDNER = "Familienakte-Abgleich";
export const LAUFWERK_KOPF = "Familienakte-Laufwerk.json";
export const LAUFWERK_KOPF_PFAD = `${LAUFWERK_ORDNER}/${LAUFWERK_KOPF}`;
const FORMAT_LAUFWERK = "familienakte-laufwerk";
export type LaufwerkKopf = SicherungsKopf & { laufwerk: { format: typeof FORMAT_LAUFWERK; kennung: string; name: string; angelegt: string } };

export type Geraet = { id: string; name: string };
export type Stand = { zeit: string; geraet: Geraet; fassung: string; akte: Akte; geraete: Record<string, { name: string; zuletzt: string }> };
type Zeiger = { datei: "stand-a.fav" | "stand-b.fav"; zeit: string; geraet: Geraet };

/** Was dieses Gerät sich je Platte merkt (eigener App-Speicher, nie auf der Platte). */
export type GemerktesLaufwerk = { kennung: string; name: string; ort: string | null; schluessel: string | null; basis: Basis; letzterAbgleich: string | null; angelegt: string;
  /** Stufe F: Abgleich im eigenen Netz. Gastgeber bietet seinen Abgleich-Ordner an (Code für weitere Geräte gemerkt), Gast kennt Token und zuletzt gesehene Adresse. */
  netz?: { rolle: "gastgeber" | "gast"; token: string; code?: string | null; adresse?: string | null; port?: number | null } };
export const NETZ_ORDNER = "netz-laufwerk";
/** Passwort des Netz-Abgleichs aus dem Kopplungscode (so bleibt die Technik der Festplatte unverändert). */
export const netzPasswort = (code: string) => `netz-${code.replace(/\D/g, "")}`;

// ---------- Gerät ----------
const GERAET_SCHLUESSEL = "familienakte-geraet-v1";
export function geraetKennung(): Geraet {
  try { const g = JSON.parse(workspaceStorage.getItem(GERAET_SCHLUESSEL) || "null"); if (g?.id && g?.name) return g; } catch { /* neu anlegen */ }
  const plattform = nativePlattform();
  const name = plattform === "android" ? "Android-Gerät" : plattform === "windows" ? "Windows-PC" : "Browser";
  const g = { id: crypto.randomUUID(), name };
  try { workspaceStorage.setItem(GERAET_SCHLUESSEL, JSON.stringify(g)); } catch { /* dann bei jedem Start neu */ }
  return g;
}
export function geraetUmbenennen(name: string) { const g = { ...geraetKennung(), name: name.trim().slice(0, 60) || geraetKennung().name }; workspaceStorage.setItem(GERAET_SCHLUESSEL, JSON.stringify(g)); return g; }

// ---------- Merken (IndexedDB) ----------
const DB = "FamilienakteLaufwerk1";
function db(): Promise<IDBDatabase> {
  return new Promise((ok, nein) => {
    // Version 2 (Stufe I): Store „pakete“ für die Partner des Pakets per Teilen.
    const r = indexedDB.open(DB, 2);
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains("laufwerke")) d.createObjectStore("laufwerke", { keyPath: "kennung" }); if (!d.objectStoreNames.contains("handles")) d.createObjectStore("handles"); if (!d.objectStoreNames.contains("pakete")) d.createObjectStore("pakete", { keyPath: "geraetId" }); };
    r.onsuccess = () => ok(r.result); r.onerror = () => nein(r.error);
  });
}
export async function laufwerkTx<T>(store: string, modus: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) { return tx(store, modus, f); }
async function tx<T>(store: string, modus: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) {
  const d = await db();
  return new Promise<T>((ok, nein) => { const r = f(d.transaction(store, modus).objectStore(store)); r.onsuccess = () => ok(r.result); r.onerror = () => nein(r.error); });
}
export const gemerkteLaufwerke = () => tx<GemerktesLaufwerk[]>("laufwerke", "readonly", (s) => s.getAll());
export const laufwerkMerken = (l: GemerktesLaufwerk) => tx("laufwerke", "readwrite", (s) => s.put(l));
export async function laufwerkVergessen(kennung: string) { await tx("laufwerke", "readwrite", (s) => s.delete(kennung)); await tx("handles", "readwrite", (s) => s.delete(kennung)); }
const handleMerken = (kennung: string, h: FileSystemDirectoryHandle) => tx("handles", "readwrite", (s) => s.put(h, kennung));
const handleLesen = (kennung: string) => tx<FileSystemDirectoryHandle | undefined>("handles", "readonly", (s) => s.get(kennung));

// ---------- Kopf ----------
async function dateiLesenOderNull(ordner: FileSystemDirectoryHandle, name: string) {
  try { return await (await ordner.getFileHandle(name)).getFile(); }
  catch (error) { if ((error as DOMException)?.name === "NotFoundError" || (error as DOMException)?.name === "TypeMismatchError") return null; throw error; }
}
async function unterordner(handle: FileSystemDirectoryHandle, name: string, anlegen: boolean) {
  try { return await handle.getDirectoryHandle(name, { create: anlegen }); }
  catch (error) { if (!anlegen && (error as DOMException)?.name === "NotFoundError") return null; throw error; }
}
export function kopfPruefen(text: string): LaufwerkKopf {
  const k = JSON.parse(text) as LaufwerkKopf;
  if (k?.laufwerk?.format !== FORMAT_LAUFWERK || typeof k.laufwerk.kennung !== "string" || !k.schluessel?.passwort || !k.schluessel?.notfall) throw new Error("Die Kennungsdatei der Festplatte ist unvollständig.");
  return k;
}
/** Liest den Kopf, wenn der gewählte Ordner (oder sein Unterordner Familienakte-Abgleich) eine vorbereitete Platte ist. */
export async function laufwerkKopfLesen(handle: FileSystemDirectoryHandle): Promise<{ kopf: LaufwerkKopf; ordner: FileSystemDirectoryHandle } | null> {
  const direkt = await dateiLesenOderNull(handle, LAUFWERK_KOPF);
  if (direkt) return { kopf: kopfPruefen(await direkt.text()), ordner: handle };
  const unten = await unterordner(handle, LAUFWERK_ORDNER, false);
  if (!unten) return null;
  const datei = await dateiLesenOderNull(unten, LAUFWERK_KOPF);
  return datei ? { kopf: kopfPruefen(await datei.text()), ordner: unten } : null;
}
async function textSchreiben(ordner: FileSystemDirectoryHandle, name: string, inhalt: string | Blob) {
  const h = await ordner.getFileHandle(name, { create: true }); const w = await h.createWritable(); await w.write(inhalt); await w.close();
}

/** Festplatte vorbereiten: Kennung, Passwort, Notfallschlüssel. Lehnt eine schon vorbereitete Platte ab. */
export async function laufwerkVorbereiten(handle: FileSystemDirectoryHandle, name: string, passwort: string, appVersion: string, kennung = crypto.randomUUID(), kopfVorhanden?: SicherungsKopf) {
  if (await laufwerkKopfLesen(handle)) throw new Error("Diese Festplatte ist schon für die Familienakte vorbereitet. Bitte „Vorhandene Festplatte verbinden“ wählen.");
  const angelegt = new Date().toISOString();
  // 2.28.65 („Synchron halten“ am zweiten Ort): derselbe Kopf wie die Sicherung dort – ein Passwort, ein Notfallblatt.
  const tresor = kopfVorhanden ? { kopf: kopfVorhanden, notfall: "" } : await tresorAnlegen(passwort, { appVersion, createdAt: angelegt });
  const kopf: LaufwerkKopf = { ...tresor.kopf, hinweis: "Gemeinsame Festplatte der Familienakte. Ordner und Dateien darunter nicht von Hand ändern; zum Lesen braucht es die Familienakte und das Passwort oder das Notfallblatt.", laufwerk: { format: FORMAT_LAUFWERK, kennung, name: name.trim().slice(0, 60) || "Familienakte-Platte", angelegt } };
  const ordner = (await unterordner(handle, LAUFWERK_ORDNER, true))!;
  await unterordner(ordner, "Stand", true); await unterordner(ordner, "Dateien", true);
  await textSchreiben(ordner, LAUFWERK_KOPF, JSON.stringify(kopf, null, 2));
  const probe = await laufwerkKopfLesen(handle);
  if (probe?.kopf.laufwerk.kennung !== kopf.laufwerk.kennung) throw new Error("Die Kennungsdatei konnte nach dem Schreiben nicht wieder gelesen werden.");
  return { kopf, ordner, daten: await tresorOeffnen(kopf, { passwort }, true), notfall: tresor.notfall };
}
/** Vorhandene Platte öffnen – mit Passwort, Notfallschlüssel oder dem auf diesem Gerät gemerkten Schlüssel. */
export async function laufwerkOeffnen(handle: FileSystemDirectoryHandle, zugang: { passwort?: string; notfall?: string; schluessel?: string }) {
  const fund = await laufwerkKopfLesen(handle);
  if (!fund) throw new Error("In diesem Ordner liegt keine vorbereitete Familienakte-Festplatte (Familienakte-Abgleich/Familienakte-Laufwerk.json fehlt).");
  const daten = zugang.schluessel ? await schluesselImportieren(zugang.schluessel) : await tresorOeffnen(fund.kopf, zugang, true);
  if (zugang.schluessel) { try { await tresorOeffnen(fund.kopf, {}); } catch (e) { if (!(e instanceof Error && e.message === "PASSWORT_FEHLT")) throw e; } }
  return { ...fund, daten };
}
export const schluesselMerkbar = (daten: CryptoKey) => schluesselExportieren(daten);

// ---------- Stand ----------
async function zeigerLesen(stand: FileSystemDirectoryHandle): Promise<Zeiger | null> {
  const z = await dateiLesenOderNull(stand, "aktuell.json");
  if (!z) return null;
  try { const p = JSON.parse(await z.text()) as Zeiger; return p.datei === "stand-a.fav" || p.datei === "stand-b.fav" ? p : null; } catch { return null; }
}
async function standLesen(ordner: FileSystemDirectoryHandle, daten: CryptoKey): Promise<{ stand: Stand; zeiger: Zeiger | null } | null> {
  const standOrdner = await unterordner(ordner, "Stand", false);
  if (!standOrdner) return null;
  const zeiger = await zeigerLesen(standOrdner);
  const reihenfolge: Array<"stand-a.fav" | "stand-b.fav"> = zeiger ? [zeiger.datei, zeiger.datei === "stand-a.fav" ? "stand-b.fav" : "stand-a.fav"] : ["stand-a.fav", "stand-b.fav"];
  let letzterFehler: unknown = null;
  for (const name of reihenfolge) {
    const f = await dateiLesenOderNull(standOrdner, name); if (!f) continue;
    try { const stand = JSON.parse(await textEntschluesseln(daten, f)) as Stand; if (stand?.akte?.documents) return { stand, zeiger }; }
    catch (error) { letzterFehler = error; }
  }
  if (letzterFehler) throw new Error("Der Stand auf der Festplatte ist nicht lesbar (falscher Schlüssel oder beschädigt). Es wurde nichts geändert.");
  return null;
}
async function standSchreiben(ordner: FileSystemDirectoryHandle, daten: CryptoKey, stand: Stand, vorher: Zeiger | null) {
  const standOrdner = (await unterordner(ordner, "Stand", true))!;
  const datei: Zeiger["datei"] = vorher?.datei === "stand-a.fav" ? "stand-b.fav" : "stand-a.fav";
  const text = JSON.stringify(stand);
  await textSchreiben(standOrdner, datei, await textVerschluesseln(daten, text));
  const zurueck = await textEntschluesseln(daten, (await (await standOrdner.getFileHandle(datei)).getFile()));
  if (zurueck !== text) throw new Error("Der geschriebene Stand ließ sich nicht unverändert zurücklesen. Der bisherige Stand bleibt gültig.");
  await textSchreiben(standOrdner, "aktuell.json", JSON.stringify({ datei, zeit: stand.zeit, geraet: stand.geraet } satisfies Zeiger, null, 2));
}

// ---------- Abgleich ----------
export type AbgleichVorschau = {
  plan: AbgleichPlan; revision: number; erstesMal: boolean;
  standVon: { geraet: Geraet; zeit: string } | null;
  geraete: Record<string, { name: string; zuletzt: string }>;
  holen: number; geben: number; fehlen: string[];
  zeiger: Zeiger | null;
};
async function geheimDatei(dateien: FileSystemDirectoryHandle, summe: string) { return dateiLesenOderNull(dateien, `${summe}.fav`); }

/** Plant den Abgleich: Register vergleichen, zählen, welche Originale zu holen und zu geben sind. Schreibt nichts. */
export async function abgleichVorbereiten(aktiv: FileSystemDirectoryHandle, ordner: FileSystemDirectoryHandle, daten: CryptoKey, gemerkt: GemerktesLaufwerk | null): Promise<AbgleichVorschau> {
  const { akte: hier, revision } = await akteFuerAbgleich(aktiv);
  const gelesen = await standLesen(ordner, daten);
  const dort: Akte = gelesen?.stand.akte || { documents: [], records: [], relations: [], memoryDrafts: [], linkDecisions: [], sequences: {}, auditLog: [] };
  const basis = gemerkt?.basis && Object.keys(gemerkt.basis).length ? gemerkt.basis : null;
  const plan = abgleichPlanen(hier, dort, basis);
  const ergebnis = abgleichAnwenden(plan, Object.fromEntries(plan.konflikte.map((k) => [k.schluessel, k.vorschlag])), basis).akte;
  const dateien = await unterordner(ordner, "Dateien", false);
  const geben = new Set<string>(), holen = new Set<string>(); const fehlen: string[] = [];
  for (const d of ergebnis.documents as unknown as LocalDocument[]) {
    const lokal = await dokumentDateiOderNull(aktiv, d);
    const summe = d.checksum || (lokal ? await fileChecksum(lokal) : null);
    const dortDa = summe && dateien ? Boolean(await geheimDatei(dateien, summe)) : false;
    if (lokal && summe && !dortDa) geben.add(summe);          // dieselbe Datei zählt nur einmal
    else if (!lokal && dortDa && summe) holen.add(summe);
    else if (!lokal && !dortDa) fehlen.push(d.titel || d.originalName);
  }
  return { plan, revision, erstesMal: !gelesen, standVon: gelesen ? { geraet: gelesen.stand.geraet, zeit: gelesen.stand.zeit } : null, geraete: gelesen?.stand.geraete || {}, holen: holen.size, geben: geben.size, fehlen, zeiger: gelesen?.zeiger || null };
}

export type AbgleichErgebnis = { neu: number; uebernommen: number; konflikteDort: number; geholt: number; gegeben: number; fehlen: string[]; zeit: string };
/** Führt den Abgleich aus: Register zusammenführen, Originale holen und geben (verschlüsselt, stückweise, mit Prüfsumme),
 *  eigenes Register schreiben, Stand auf die Platte, Fingerabdrücke merken. */
export async function abgleichAusfuehren(aktiv: FileSystemDirectoryHandle, ordner: FileSystemDirectoryHandle, daten: CryptoKey, gemerkt: GemerktesLaufwerk, vorschau: AbgleichVorschau, wahl: Record<string, Seite>, appVersion: string, fortschritt?: (text: string) => void): Promise<AbgleichErgebnis> {
  const basis = gemerkt.basis && Object.keys(gemerkt.basis).length ? gemerkt.basis : null;
  const { akte } = abgleichAnwenden(vorschau.plan, wahl, basis);
  const dateien = (await unterordner(ordner, "Dateien", true))!;
  let geholt = 0, gegeben = 0; const fehlen: string[] = [];
  const dokumente = akte.documents as unknown as LocalDocument[];
  for (let i = 0; i < dokumente.length; i++) {
    const d = dokumente[i];
    const lokal = await dokumentDateiOderNull(aktiv, d);
    let summe = d.checksum || null;
    if (!summe && lokal) { summe = await fileChecksum(lokal); dokumente[i] = { ...d, checksum: summe }; }
    if (!summe) { fehlen.push(d.titel || d.originalName); continue; }
    const geheim = await geheimDatei(dateien, summe);
    if (lokal && !geheim) {
      fortschritt?.(`Gebe „${d.titel || d.originalName}“ auf die Festplatte …`);
      const h = await dateien.getFileHandle(`${summe}.fav`, { create: true }); const w = await h.createWritable();
      try { await dateiVerschluesseln(daten, lokal, (teil) => w.write(teil as unknown as ArrayBuffer)); await w.close(); }
      catch (error) { await w.abort?.().catch(() => undefined); throw error; }
      const teile: Uint8Array[] = []; await dateiEntschluesseln(daten, await h.getFile(), async (t) => { teile.push(t); });
      const klar = new Blob(teile as BlobPart[]);
      if (klar.size !== lokal.size || await fileChecksum(klar) !== summe) throw new Error(`„${d.originalName}“ wurde auf der Festplatte nicht richtig abgelegt. Abgleich abgebrochen, nichts am Register geändert.`);
      gegeben++;
    } else if (!lokal && geheim) {
      fortschritt?.(`Hole „${d.titel || d.originalName}“ von der Festplatte …`);
      const teile: Uint8Array[] = []; await dateiEntschluesseln(daten, geheim, async (t) => { teile.push(t); });
      const datei = new File(teile as BlobPart[], d.originalName, { type: d.mimeType || "application/octet-stream" });
      dokumente[i] = await dokumentDateiAblegen(aktiv, d, datei); geholt++;
    } else if (!lokal && !geheim) fehlen.push(d.titel || d.originalName);
  }
  const zeit = new Date().toISOString(); const geraet = geraetKennung();
  const konflikteDort = vorschau.plan.konflikte.filter((k) => wahl[k.schluessel] === "dort").length;
  fortschritt?.("Schreibe das eigene Register …");
  await akteNachAbgleichSchreiben(aktiv, akte, vorschau.revision, "Abgleich mit der Festplatte", `„${gemerkt.name}“: ${vorschau.plan.zaehlung.neu} neu, ${vorschau.plan.zaehlung.uebernommen} übernommen, ${vorschau.plan.konflikte.length} Unterschiede (${konflikteDort} von der Festplatte gewählt), ${geholt} Originale geholt, ${gegeben} gegeben. Nichts wurde gelöscht.`);
  fortschritt?.("Schreibe den Stand auf die Festplatte …");
  const { akte: frisch } = await akteFuerAbgleich(aktiv);
  const geraete = { ...vorschau.geraete, [geraet.id]: { name: geraet.name, zuletzt: zeit } };
  await standSchreiben(ordner, daten, { zeit, geraet, fassung: appVersion, akte: frisch, geraete }, vorschau.zeiger);
  await laufwerkMerken({ ...gemerkt, basis: basisAus(frisch), letzterAbgleich: zeit });
  return { neu: vorschau.plan.zaehlung.neu, uebernommen: vorschau.plan.zaehlung.uebernommen, konflikteDort, geholt, gegeben, fehlen, zeit };
}

// ---------- Platte finden ----------
export type Fund = { gemerkt: GemerktesLaufwerk; handle: FileSystemDirectoryHandle; ordner: FileSystemDirectoryHandle; kopf: LaufwerkKopf };
/** Sucht gemerkte Platten, die gerade angeschlossen sind: Android über die dauerhaften Freigaben, Windows über alle Laufwerke
 *  (anderer Buchstabe egal), Browser über den gemerkten Ordner (nur wenn die Erlaubnis noch gilt). */
export async function angeschlosseneLaufwerke(): Promise<Fund[]> {
  const gemerkt = await gemerkteLaufwerke();
  if (!gemerkt.length) return [];
  const funde: Fund[] = [];
  // Stufe F: Netz-Einträge – Gastgeber hält seinen Dienst am Laufen und arbeitet auf dem eigenen Ordner, Gäste suchen den Gastgeber im Netz.
  const netzEintraege = gemerkt.filter((g) => g.netz);
  if (netzEintraege.length) {
    const treffer = netzEintraege.some((g) => g.netz!.rolle === "gast") ? await netzSuchen() : [];
    for (const g of netzEintraege) { const f = await netzFund(g, treffer).catch(() => null); if (f) funde.push(f); }
  }
  const nurPlatten = gemerkt.filter((g) => !g.netz);
  if (!nurPlatten.length) return funde;
  const p = ordnerPlugin() as (ReturnType<typeof ordnerPlugin> & { ordnerOeffnen?: (a: { ort: string }) => Promise<{ erreichbar: boolean; token?: string; name?: string }>; laufwerkeSuchen?: (a: { datei: string }) => Promise<{ treffer: Array<{ ort: string; name: string; inhalt: string }> }> }) | null;
  if (p?.ordnerOeffnen) {
    const treffer = p.laufwerkeSuchen ? (await p.laufwerkeSuchen({ datei: LAUFWERK_KOPF_PFAD }).catch(() => ({ treffer: [] }))).treffer : [];
    for (const g of nurPlatten) {
      const orte = [g.ort, ...treffer.filter((t) => { try { return kopfPruefen(t.inhalt).laufwerk.kennung === g.kennung; } catch { return false; } }).map((t) => t.ort)].filter((o): o is string => Boolean(o));
      for (const ort of [...new Set(orte)]) {
        const r: { erreichbar: boolean; token?: string; name?: string } = await p.ordnerOeffnen({ ort }).catch(() => ({ erreichbar: false }));
        if (!r.erreichbar || !r.token) continue;
        const handle = new NativerOrdner(p, r.token, "", r.name || g.name) as unknown as FileSystemDirectoryHandle;
        const fund = await laufwerkKopfLesen(handle).catch(() => null);
        if (fund && fund.kopf.laufwerk.kennung === g.kennung) { if (ort !== g.ort) await laufwerkMerken({ ...g, ort }); funde.push({ gemerkt: { ...g, ort }, handle, ordner: fund.ordner, kopf: fund.kopf }); break; }
      }
    }
    return funde;
  }
  if (folderPickerSupported()) {
    for (const g of nurPlatten) {
      const handle = await handleLesen(g.kennung); if (!handle) continue;
      const erlaubnis = await (handle as FileSystemDirectoryHandle & { queryPermission?: (o: { mode: string }) => Promise<string> }).queryPermission?.({ mode: "readwrite" });
      if (erlaubnis !== "granted") continue;
      const fund = await laufwerkKopfLesen(handle).catch(() => null);
      if (fund && fund.kopf.laufwerk.kennung === g.kennung) funde.push({ gemerkt: g, handle, ordner: fund.ordner, kopf: fund.kopf });
    }
  }
  return funde;
}
/** Nach dem Wählen eines Ordners: Ort dauerhaft merken (Android-Freigabe, Windows-Pfad, Browser-Handle). */
export async function ortMerken(handle: FileSystemDirectoryHandle, kennung: string): Promise<string | null> {
  const p = ordnerPlugin() as (ReturnType<typeof ordnerPlugin> & { ordnerMerken?: (a: { token: string }) => Promise<{ ort: string }> }) | null;
  if (p?.ordnerMerken && handle instanceof NativerOrdner) return (await p.ordnerMerken({ token: handle.token })).ort;
  if (folderPickerSupported()) { await handleMerken(kennung, handle); return null; }
  return null;
}
/** Browser: Erlaubnis für den gemerkten Ordner erneut holen (braucht einen Tipp des Nutzers). */
export async function gemerktenOrdnerOeffnen(kennung: string): Promise<FileSystemDirectoryHandle | null> {
  const handle = await handleLesen(kennung); if (!handle) return null;
  const h = handle as FileSystemDirectoryHandle & { requestPermission?: (o: { mode: string }) => Promise<string> };
  if (h.requestPermission && (await h.requestPermission({ mode: "readwrite" })) !== "granted") return null;
  return handle;
}
export const laufwerkMoeglich = () => Boolean(ordnerPlugin()) || folderPickerSupported();

// ---------- Stufe F: Abgleich im eigenen Netz (WLAN, LAN-Kabel, USB-Kabel) ----------
export const netzMoeglich = () => Boolean(netzPlugin() && ordnerPlugin());
type OrdnerPluginIntern = NonNullable<ReturnType<typeof ordnerPlugin>> & { ordnerIntern?: (a: { name: string }) => Promise<{ token: string; name: string }> };
/** Der app-eigene Abgleich-Ordner des Gastgebers als Handle. */
async function internerOrdner(): Promise<FileSystemDirectoryHandle> {
  const p = ordnerPlugin() as OrdnerPluginIntern | null;
  if (!p?.ordnerIntern) throw new Error("Diese App-Fassung kann noch keinen Gastgeber-Ordner anlegen (Fassung aktualisieren).");
  const r = await p.ordnerIntern({ name: NETZ_ORDNER });
  return new NativerOrdner(p, r.token, "", "Netz-Abgleich") as unknown as FileSystemDirectoryHandle;
}
export async function netzSuchen(ms = 2500) {
  const p = netzPlugin(); if (!p) return [];
  return (await p.suchen({ ms }).catch(() => ({ treffer: [] }))).treffer;
}
export async function netzZustand(): Promise<NetzZustand | null> { const p = netzPlugin(); return p ? p.zustand().catch(() => null) : null; }
/** Gastgeber: Dienst sicherstellen, eigener Ordner öffnen. Gast: Gastgeber im Netz finden (zuletzt gesehene Adresse zuerst). */
async function netzFund(g: GemerktesLaufwerk, treffer: Array<{ kennung: string; name: string; port: number; adresse: string }>): Promise<Fund | null> {
  const p = netzPlugin(); if (!p || !g.netz) return null;
  if (g.netz.rolle === "gastgeber") {
    const z = await p.zustand().catch(() => null);
    if (!z?.laeuft) await p.start({ ordner: NETZ_ORDNER, token: g.netz.token, kennung: g.kennung, name: `${g.name} (${geraetKennung().name})`, port: g.netz.port || undefined });
    const handle = await internerOrdner();
    const fund = await laufwerkKopfLesen(handle);
    return fund && fund.kopf.laufwerk.kennung === g.kennung ? { gemerkt: g, handle, ordner: fund.ordner, kopf: fund.kopf } : null;
  }
  const kandidaten = [...treffer.filter((t) => t.kennung === g.kennung).map((t) => ({ adresse: t.adresse, port: t.port })), ...(g.netz.adresse && g.netz.port ? [{ adresse: g.netz.adresse, port: g.netz.port }] : [])];
  for (const k of kandidaten) {
    const ziel = { ...k, token: g.netz.token };
    const kopf = await gastgeberPruefen(ziel); if (!kopf || kopf.kennung !== g.kennung) continue;
    const handle = netzOrdner(ziel, g.name);
    const fund = await laufwerkKopfLesen(handle).catch(() => null);
    if (!fund || fund.kopf.laufwerk.kennung !== g.kennung) continue;
    if (k.adresse !== g.netz.adresse || k.port !== g.netz.port) await laufwerkMerken({ ...g, netz: { ...g.netz, adresse: k.adresse, port: k.port } });
    return { gemerkt: { ...g, netz: { ...g.netz, adresse: k.adresse, port: k.port } }, handle, ordner: fund.ordner, kopf: fund.kopf };
  }
  return null;
}
/** Dieses Gerät wird Gastgeber: eigener Abgleich-Ordner wie eine Festplatte vorbereitet (Passwort aus dem Code), Dienst gestartet. */
export async function gastgeberEinrichten(name: string, code: string, appVersion: string) {
  const p = netzPlugin(); if (!p) throw new Error("Der Abgleich im Netz braucht die Android- oder Windows-App.");
  const alle = await gemerkteLaufwerke();
  if (alle.some((g) => g.netz?.rolle === "gastgeber")) throw new Error("Dieses Gerät ist schon Gastgeber. Erst „Vergessen“, dann neu einrichten.");
  const handle = await internerOrdner();
  const kennung = crypto.randomUUID();
  const r = await laufwerkVorbereiten(handle, name, netzPasswort(code), appVersion, kennung);
  const token = await tokenAusCode(code, kennung);
  const zustand = await p.start({ ordner: NETZ_ORDNER, token, kennung, name: `${r.kopf.laufwerk.name} (${geraetKennung().name})` });
  const g: GemerktesLaufwerk = { kennung, name: r.kopf.laufwerk.name, ort: null, schluessel: await schluesselExportieren(r.daten), basis: {}, letzterAbgleich: null, angelegt: r.kopf.laufwerk.angelegt, netz: { rolle: "gastgeber", token, code: code.replace(/\D/g, ""), port: zustand.port } };
  await laufwerkMerken(g);
  return { gemerkt: g, fund: { gemerkt: g, handle, ordner: r.ordner, kopf: r.kopf } as Fund, daten: r.daten, notfall: r.notfall, zustand };
}
/** Gast: mit einem gefundenen Gastgeber koppeln – Code prüfen, Kopf lesen, merken. */
export async function gastKoppeln(treffer: { kennung: string; name: string; port: number; adresse: string }, code: string) {
  const token = await tokenAusCode(code, treffer.kennung);
  const ziel = { adresse: treffer.adresse, port: treffer.port, token };
  const kopf = await gastgeberPruefen(ziel);
  if (!kopf) throw new Error("PASSWORT_FALSCH");
  const handle = netzOrdner(ziel, treffer.name);
  const r = await laufwerkOeffnen(handle, { passwort: netzPasswort(code) });
  const alt = (await gemerkteLaufwerke()).find((g) => g.kennung === r.kopf.laufwerk.kennung);
  const g: GemerktesLaufwerk = { kennung: r.kopf.laufwerk.kennung, name: r.kopf.laufwerk.name, ort: null, schluessel: await schluesselExportieren(r.daten), basis: alt?.basis || {}, letzterAbgleich: alt?.letzterAbgleich || null, angelegt: r.kopf.laufwerk.angelegt, netz: { rolle: "gast", token, adresse: treffer.adresse, port: treffer.port } };
  await laufwerkMerken(g);
  return { gemerkt: g, fund: { gemerkt: g, handle, ordner: r.ordner, kopf: r.kopf } as Fund, daten: r.daten };
}
