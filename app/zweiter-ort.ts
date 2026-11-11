/** 2.28.65 (Startbrief 11.11.2026, Punkte 1 und 2): Sicherung an einem zweiten Ort.
 *
 *  Einmal einrichten: Ordner wählen (OneDrive-Ordner am PC, USB-Stick, SD-Karte, Netzordner …), verschlüsselt (Vorgabe) oder
 *  lesbar, „Nur sichern“ (Vorgabe) oder „Synchron halten“ (gemeinsame Festplatte im selben Ordner, Sicherung läuft trotzdem mit).
 *  Danach von selbst, wenn sich etwas geändert hat (höchstens einmal am Tag), und auf Knopf. Jede Sicherung ist eine gewöhnliche
 *  Vollsicherung mit Kennungsdatei. Reihenfolge immer: neu schreiben → zurücklesen und prüfen → erst dann alte eigene entfernen.
 *  Am zweiten Ort bleibt eine, auf dem Gerät (App-Speicher) bleiben zwei. Schlüssel und Ort merkt sich nur dieses Gerät. */
import { BEHALTEN, MARKE_DATEI, aufraeumen, fingerabdruck, istSicherungsName, jetztFaellig, markeBauen, markeLesen, type Letzte, type Vorhanden, type Ziel } from "../lib/zweiter-ort";
import { schluesselExportieren, schluesselImportieren, tresorAnlegen, tresorOeffnen, type SicherungsKopf } from "../lib/sicherung-krypto";
import { folderPickerSupported, getVaultSummary, readLocalVaultData, sicherungNachpruefen, writeFullFamilyBackup } from "./local-vault";
import { NativerOrdner, istNativerOrdner, ordnerFehlerText, ordnerPlugin } from "./nativer-ordner";
import { laufwerkKopfLesen, laufwerkMerken, laufwerkOeffnen, laufwerkTx, laufwerkVergessen, laufwerkVorbereiten, ortMerken, type GemerktesLaufwerk } from "./laufwerk";
import { programmBeilegen } from "./sicherung-programm";
import { idbRootDirectory, idbStorageSupported } from "./idb-directory";
import { demoActive, workspaceName } from "../lib/demo-workspace";

export type Modus = "sichern" | "synchron";
export type ZweiterOrt = {
  kennung: string; name: string; ort: string | null; angelegt: string;
  verschluesselt: boolean; modus: Modus;
  /** Kopf der Sicherungen (Passwort + Notfallschlüssel eingepackt) und der gemerkte Datenschlüssel – wie bei der Festplatte. */
  kopf: SicherungsKopf | null; schluessel: string | null;
  laufwerkKennung: string | null;
  letzte: Letzte; letzteGelungen: Letzte;
  geraet: { letzte: Letzte } | null;
};
const SCHLUESSEL = "zweiter-ort-einstellung";
let sitzungsHandle: FileSystemDirectoryHandle | null = null;
const HANDLE = "zweiter-ort";

export const zweiterOrtLesen = async (): Promise<ZweiterOrt | null> => (await laufwerkTx<ZweiterOrt | undefined>("handles", "readonly", (s) => s.get(SCHLUESSEL)).catch(() => undefined)) || null;
const merken = (z: ZweiterOrt) => laufwerkTx("handles", "readwrite", (s) => s.put(z, SCHLUESSEL));

/** Was dieses Gerät kann – ein Satz statt eines toten Knopfs (Punkt 2). */
export function geraetKann(): { ordner: boolean; satz: string } {
  const p = ordnerPlugin();
  if (p) return { ordner: true, satz: "" };
  if (folderPickerSupported()) return { ordner: true, satz: "" };
  return { ordner: false, satz: "Diese Web-App kann hier keinen Ordner wählen. Die zweite Sicherung geht in der Pro-App (Android, Windows) oder am PC in Chrome oder Edge." };
}

/** Ordner wählen und merken (nativ: dauerhafte Freigabe; Browser: Handle). */
export async function ortWaehlen(): Promise<FileSystemDirectoryHandle> {
  const p = ordnerPlugin();
  if (p) {
    const { nativenOrdnerWaehlen } = await import("./nativer-ordner");
    return nativenOrdnerWaehlen("Zweiten Ort für die Sicherung wählen (z. B. OneDrive-Ordner, USB-Stick, SD-Karte)");
  }
  const picker = (window as Window & { showDirectoryPicker?: (o: { mode: string }) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
  if (!picker) throw new Error(geraetKann().satz);
  return picker({ mode: "readwrite" });
}

/** Einrichten: ein Passwort (verschlüsselt) → Kopf und Notfallschlüssel; ohne Passwort lesbar. Gibt den Notfallschlüssel zurück. */
export async function zweiterOrtEinrichten(a: { handle: FileSystemDirectoryHandle; verschluesselt: boolean; passwort: string | null; modus: Modus; appVersion: string }): Promise<{ ort: ZweiterOrt; notfall: string | null; synchronHinweis: string }> {
  if (demoActive()) throw new Error("In der Demo gibt es keinen zweiten Ort. Bitte zuerst die Demo verlassen.");
  if ((a.verschluesselt || a.modus === "synchron") && !a.passwort) throw new Error("Für eine verschlüsselte Sicherung braucht es ein Passwort.");
  const alt = await zweiterOrtLesen();
  const kennung = alt?.kennung || crypto.randomUUID();
  let kopf: SicherungsKopf | null = null, schluessel: string | null = null, notfall: string | null = null;
  const verschluesselt = a.verschluesselt || a.modus === "synchron";
  if (verschluesselt) {
    const t = await tresorAnlegen(a.passwort!, { appVersion: a.appVersion, createdAt: new Date().toISOString() });
    kopf = t.kopf; notfall = t.notfall;
    schluessel = await schluesselExportieren(await tresorOeffnen(t.kopf, { passwort: a.passwort! }, true));
  }
  const ort = await ortMerken(a.handle, HANDLE); sitzungsHandle = istNativerOrdner(a.handle) ? null : a.handle;
  const z: ZweiterOrt = { kennung, name: a.handle.name, ort, angelegt: new Date().toISOString(), verschluesselt, modus: a.modus, kopf, schluessel,
    laufwerkKennung: null, letzte: null, letzteGelungen: null, geraet: alt?.geraet || null };
  let synchronHinweis = "";
  if (a.modus === "synchron") synchronHinweis = await synchronAnschliessen(z, a.handle, a.passwort!, a.appVersion);
  if (alt?.laufwerkKennung && alt.laufwerkKennung !== z.laufwerkKennung) await laufwerkVergessen(alt.laufwerkKennung).catch(() => undefined);
  await merken(z);
  return { ort: z, notfall, synchronHinweis };
}

/** „Synchron halten“: gemeinsame Festplatte im gewählten Ordner. Ist dort schon eine (anderes Gerät), wird sie mit demselben
 *  Passwort verbunden; sonst mit dem Kopf der Sicherung vorbereitet (ein Passwort, ein Notfallblatt). */
async function synchronAnschliessen(z: ZweiterOrt, handle: FileSystemDirectoryHandle, passwort: string, appVersion: string): Promise<string> {
  const da = await laufwerkKopfLesen(handle);
  let g: GemerktesLaufwerk;
  if (da) {
    let r;
    try { r = await laufwerkOeffnen(handle, { passwort }); }
    catch (e) { if (e instanceof Error && e.message === "PASSWORT_FALSCH") throw new Error("Im Ordner liegt schon ein Abgleich eines anderen Geräts mit einem anderen Passwort. Bitte dort dasselbe Passwort verwenden oder „Nur sichern“ wählen."); throw e; }
    g = { kennung: r.kopf.laufwerk.kennung, name: r.kopf.laufwerk.name, ort: await ortMerken(handle, r.kopf.laufwerk.kennung), schluessel: await schluesselExportieren(r.daten), basis: {}, letzterAbgleich: null, angelegt: r.kopf.laufwerk.angelegt };
  } else {
    const r = await laufwerkVorbereiten(handle, `Synchron ${handle.name}`.slice(0, 60), passwort, appVersion, undefined, z.kopf!);
    g = { kennung: r.kopf.laufwerk.kennung, name: r.kopf.laufwerk.name, ort: await ortMerken(handle, r.kopf.laufwerk.kennung), schluessel: await schluesselExportieren(r.daten), basis: {}, letzterAbgleich: null, angelegt: r.kopf.laufwerk.angelegt };
  }
  await laufwerkMerken(g);
  z.laufwerkKennung = g.kennung;
  window.dispatchEvent(new Event("familienakte:laufwerk-pruefen"));
  return da ? "Mit dem vorhandenen Abgleich im Ordner verbunden." : "Abgleich im Ordner angelegt; andere Geräte verbinden ihn mit demselben Passwort.";
}

/** Nur die Wahl „Nur sichern“/„Synchron halten“ ändern (ohne neuen Ordner). Synchron braucht das Passwort. */
export async function modusAendern(modus: Modus, passwort: string | null, appVersion: string): Promise<{ ort: ZweiterOrt; hinweis: string }> {
  const z = await zweiterOrtLesen(); if (!z) throw new Error("Bitte zuerst einen zweiten Ort wählen.");
  if (modus === z.modus) return { ort: z, hinweis: "" };
  if (modus === "sichern") {
    if (z.laufwerkKennung) await laufwerkVergessen(z.laufwerkKennung).catch(() => undefined);
    const neu = { ...z, modus, laufwerkKennung: null }; await merken(neu);
    return { ort: neu, hinweis: "Nur sichern: der Abgleich ist auf diesem Gerät beendet, der Ordner bleibt unverändert." };
  }
  if (!z.kopf || !passwort) throw new Error("„Synchron halten“ ist immer verschlüsselt. Bitte den zweiten Ort mit Passwort neu einrichten.");
  await tresorOeffnen(z.kopf, { passwort }).catch(() => { throw new Error("Das Passwort passt nicht zur Sicherung am zweiten Ort."); });
  const handle = await ortOeffnen(z, true); if (!handle) throw new Error("Der zweite Ort ist gerade nicht erreichbar.");
  const neu = { ...z, modus };
  const hinweis = await synchronAnschliessen(neu, handle, passwort, appVersion);
  await merken(neu);
  return { ort: neu, hinweis };
}

/** Gemerkten Ort öffnen. `mitTipp` darf im Browser nach der Erlaubnis fragen; von selbst nur, wenn sie noch gilt. */
export async function ortOeffnen(z: ZweiterOrt, mitTipp: boolean): Promise<FileSystemDirectoryHandle | null> {
  const p = ordnerPlugin() as (ReturnType<typeof ordnerPlugin> & { ordnerOeffnen?: (a: { ort: string }) => Promise<{ erreichbar: boolean; token?: string; name?: string }> }) | null;
  if (p) {
    if (!z.ort || !p.ordnerOeffnen) return null;
    const r = await p.ordnerOeffnen({ ort: z.ort }).catch(() => ({ erreichbar: false } as { erreichbar: boolean; token?: string; name?: string }));
    return r.erreichbar && r.token ? new NativerOrdner(p, r.token, "", r.name || z.name) as unknown as FileSystemDirectoryHandle : null;
  }
  // In dieser Sitzung gewählt: direkt nutzen (die Erlaubnis gilt noch). Sonst den gemerkten Handle aus dem App-Speicher.
  if (sitzungsHandle) return sitzungsHandle;
  const h = await laufwerkTx<FileSystemDirectoryHandle | undefined>("handles", "readonly", (s) => s.get(HANDLE)).catch(() => undefined);
  if (!h) return null;
  const ph = h as FileSystemDirectoryHandle & { queryPermission?: (o: { mode: string }) => Promise<string>; requestPermission?: (o: { mode: string }) => Promise<string> };
  if (!ph.queryPermission) return h;
  if (await ph.queryPermission({ mode: "readwrite" }) === "granted") return h;
  if (mitTipp && ph.requestPermission && await ph.requestPermission({ mode: "readwrite" }) === "granted") return h;
  return null;
}

/** Sicherungen auf dem Gerät: nativ im App-Ordner „sicherungen“, im Browser im eigenen Dateispeicher. */
export async function geraeteOrdner(): Promise<FileSystemDirectoryHandle | null> {
  const p = ordnerPlugin() as (ReturnType<typeof ordnerPlugin> & { ordnerIntern?: (a: { name: string }) => Promise<{ token: string; name: string }> }) | null;
  if (p) { if (!p.ordnerIntern) return null; const r = await p.ordnerIntern({ name: "sicherungen" }); return new NativerOrdner(p, r.token, "", r.name) as unknown as FileSystemDirectoryHandle; }
  try {
    if (typeof navigator !== "undefined" && typeof navigator.storage?.getDirectory === "function") return await (await navigator.storage.getDirectory()).getDirectoryHandle(workspaceName("Familienakte-Sicherungen"), { create: true });
  } catch { /* weiter mit IndexedDB */ }
  return idbStorageSupported() ? idbRootDirectory(workspaceName("Familienakte-Sicherungen")) : null;
}

type DirIter = FileSystemDirectoryHandle & { values: () => AsyncIterableIterator<FileSystemHandle> };
/** Eigene Sicherungen in einem Ordner (Name + Kennungsdatei). */
export async function vorhandeneSicherungen(ordner: FileSystemDirectoryHandle): Promise<Vorhanden[]> {
  const out: Vorhanden[] = [];
  for await (const e of (ordner as DirIter).values()) {
    if (e.kind !== "directory" || !istSicherungsName(e.name)) continue;
    let marke = null;
    try { marke = markeLesen(await (await (await (e as FileSystemDirectoryHandle).getFileHandle(MARKE_DATEI)).getFile()).text()); } catch { marke = null; }
    out.push({ name: e.name, marke });
  }
  return out;
}

/** Ältere eigene Sicherung entfernen: nativ nur über den eng begrenzten Befehl (prüft Name und Kennung selbst). */
async function entfernen(ordner: FileSystemDirectoryHandle, name: string, kennung: string) {
  if (istNativerOrdner(ordner)) {
    const p = ordnerPlugin() as (ReturnType<typeof ordnerPlugin> & { sicherungEntfernen?: (a: { token: string; pfad: string; kennung: string }) => Promise<unknown> }) | null;
    if (!p?.sicherungEntfernen) throw new Error("Diese App-Fassung kann ältere Sicherungen noch nicht aufräumen (bitte aktualisieren).");
    await p.sicherungEntfernen({ token: (ordner as unknown as NativerOrdner).token, pfad: name, kennung });
    return;
  }
  await (ordner as FileSystemDirectoryHandle & { removeEntry: (n: string, o?: { recursive?: boolean }) => Promise<void> }).removeEntry(name, { recursive: true });
}

export type LaufErgebnis = { zweit: { ok: boolean; ordner?: string; entfernt: number; grund?: string; nichtErreichbar?: boolean }; geraet: { ok: boolean; ordner?: string; entfernt: number; grund?: string } };

/** Eine Sicherung an ein Ziel: schreiben, prüfen, aufräumen. Wirft nie; das Ergebnis sagt, was geschah. */
async function sicherungAn(ziel: Ziel, ordner: FileSystemDirectoryHandle, z: ZweiterOrt, akte: FileSystemDirectoryHandle, appVersion: string, daten: CryptoKey | null, ohne?: ReadonlySet<string>) {
  const erstellt = new Date().toISOString();
  const marke = markeBauen({ kennung: z.kennung, ziel, erstellt, appVersion, verschluesselt: Boolean(daten) });
  try {
    const r = await writeFullFamilyBackup({ destination: ordner, source: akte, appVersion, createdAt: erstellt, passwort: null, ohne,
      tresorFest: daten && z.kopf ? { kopf: z.kopf, daten } : null,
      marke: { name: MARKE_DATEI, anfang: JSON.stringify({ ...marke, fertig: false }, null, 2), fertig: JSON.stringify({ ...marke, fertig: true }, null, 2) } });
    await sicherungNachpruefen(ordner, r.folderName, daten);
    if (ziel === "zweit") { try { await programmBeilegen(ordner, r.folderName, appVersion); } catch { /* Programm ist Beigabe, die Sicherung ist fertig */ } }
    // Erst jetzt aufräumen – und nur eigene Sicherungen dieser Einrichtung.
    let entfernt = 0;
    for (const name of aufraeumen(await vorhandeneSicherungen(ordner), z.kennung, r.folderName, BEHALTEN[ziel])) {
      try { await entfernen(ordner, name, z.kennung); entfernt++; } catch (e) { console.warn("Ältere Sicherung nicht entfernt", name, e); }
    }
    return { ok: true, ordner: r.folderName, entfernt };
  } catch (e) { return { ok: false, entfernt: 0, grund: ordnerFehlerText(e) }; }
}

let laeuft = false;
/** Jetzt sichern (Knopf) oder von selbst (`auto`: nur wenn fällig, Browser ohne Erlaubnisfrage). */
export async function zweiterOrtSichern(akte: FileSystemDirectoryHandle, appVersion: string, o: { auto: boolean; ohne?: ReadonlySet<string> }): Promise<LaufErgebnis | null> {
  if (laeuft || demoActive()) return null;
  const z = await zweiterOrtLesen(); if (!z) return null;
  const summary = await getVaultSummary(akte);
  const daten = await readLocalVaultData(akte);
  const fp = fingerabdruck({ ...summary, recordCount: daten.records.length });
  if (o.auto && !jetztFaellig({ letzte: z.letzte, letzteGelungen: z.letzteGelungen, fingerabdruck: fp, hatDaten: daten.documents.length + daten.records.length > 0, jetzt: Date.now() })) return null;
  laeuft = true;
  try {
    const schluessel = z.verschluesselt && z.schluessel ? await schluesselImportieren(z.schluessel) : null;
    if (z.verschluesselt && !schluessel) throw new Error("Der Schlüssel der Sicherung fehlt auf diesem Gerät. Bitte den zweiten Ort neu einrichten.");
    const handle = await ortOeffnen(z, !o.auto);
    const zweit: LaufErgebnis["zweit"] = handle ? await sicherungAn("zweit", handle, z, akte, appVersion, schluessel, o.ohne)
      : { ok: false, entfernt: 0, nichtErreichbar: true, grund: `„${z.name}“ ist gerade nicht erreichbar (Stick, SD-Karte oder Netz nicht da, oder die Freigabe fehlt). Die Sicherung auf dem Gerät läuft trotzdem.` };
    const go = await geraeteOrdner().catch(() => null);
    const geraet: LaufErgebnis["geraet"] = go ? await sicherungAn("geraet", go, z, akte, appVersion, schluessel, o.ohne) : { ok: false, entfernt: 0, grund: "Kein App-Speicher für Sicherungen auf diesem Gerät." };
    const jetzt = new Date().toISOString();
    const aktuell = (await zweiterOrtLesen()) || z;
    const letzte: Letzte = { zeit: jetzt, ordner: zweit.ordner || "", ok: zweit.ok, grund: zweit.grund, fingerabdruck: fp };
    await merken({ ...aktuell, letzte, letzteGelungen: zweit.ok ? letzte : aktuell.letzteGelungen, geraet: { letzte: { zeit: jetzt, ordner: geraet.ordner || "", ok: geraet.ok, grund: geraet.grund, fingerabdruck: fp } } });
    window.dispatchEvent(new Event("familienakte:zweiter-ort"));
    return { zweit, geraet };
  } finally { laeuft = false; }
}

/** Zweiten Ort beenden: die Sicherungen dort bleiben liegen; nur dieses Gerät vergisst Ort und Schlüssel. */
export async function zweiterOrtBeenden() {
  sitzungsHandle = null;
  const z = await zweiterOrtLesen();
  if (z?.laufwerkKennung) await laufwerkVergessen(z.laufwerkKennung).catch(() => undefined);
  await laufwerkTx("handles", "readwrite", (s) => s.delete(SCHLUESSEL));
  await laufwerkTx("handles", "readwrite", (s) => s.delete(HANDLE)).catch(() => undefined);
  window.dispatchEvent(new Event("familienakte:zweiter-ort"));
}
