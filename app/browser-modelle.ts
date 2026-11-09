/** Stufe G (Plan 08.11.2026): Modellablage der Bedeutungssuche in der Web-App – dieselbe Schnittstelle wie das native
 *  FamilyModels-Plugin (Android/Windows), aber im Browser-Speicher (OPFS). Bewusster Download aus den festen Quellen
 *  (meaning-models.json), fortsetzbar mit Range, jede Datei gegen ihren festen SHA-256 geprüft, Fortschritt in Bytes.
 *  Kein Laden beim Start, kein Nachladen von selbst; der Internetschalter der App gilt. */
import pins from "../public/native/meaning-models.json";
import { fileChecksum } from "./local-vault";
import type { ModelStage, NativeModelsState, ModelState } from "./private-meaning-runtime";

const ORDNER = "Familienakte-Modelle";
const STUFEN: ModelStage[] = ["klein", "mittel", "gross"];
type Datei = { pfad: string; sha256: string; groesse: number; quellen: string[]; lib: boolean };
const GEPRUEFT = (stage: ModelStage) => `familienakte-modell-geprueft-${stage}`;

function dateien(stage: ModelStage): Datei[] {
  const m = pins.models[stage] as { id: string; revision: string; files: Record<string, string>; sizes?: Record<string, number> };
  const lib = pins.library as { version: string; files: Record<string, string>; sizes: Record<string, number> };
  const q = pins.download as { model: string[]; library: string[] };
  const out: Datei[] = [];
  for (const [name, sha] of Object.entries(lib.files)) out.push({ pfad: `lib/${name}`, sha256: sha, groesse: lib.sizes[name] || 0, lib: true, quellen: q.library.map((u) => u.replace("{version}", lib.version).replace("{file}", name)) });
  for (const [name, sha] of Object.entries(m.files)) out.push({ pfad: `model/${name}`, sha256: sha, groesse: m.sizes?.[name] || 0, lib: false, quellen: q.model.map((u) => u.replace("{id}", m.id).replace("{revision}", m.revision).replace("{file}", name)) });
  return out;
}
async function ordner(stage: ModelStage, pfad: string, anlegen: boolean) {
  const root = await navigator.storage.getDirectory();
  let dir = await root.getDirectoryHandle(ORDNER, { create: anlegen });
  const teile = pfad.split("/"); const name = teile.pop()!;
  if (teile[0] === "lib") { dir = await dir.getDirectoryHandle("lib", { create: anlegen }); for (const t of teile.slice(1)) dir = await dir.getDirectoryHandle(t, { create: anlegen }); }
  else { dir = await dir.getDirectoryHandle(stage, { create: anlegen }); for (const t of teile) dir = await dir.getDirectoryHandle(t, { create: anlegen }); }
  return { dir, name };
}
async function vorhandeneGroesse(stage: ModelStage, pfad: string) {
  try { const { dir, name } = await ordner(stage, pfad, false); return (await (await dir.getFileHandle(name)).getFile()).size; }
  catch { return 0; }
}
const internetAus = () => { const b = (window as unknown as { PBNetwork?: { ready: boolean; offline: boolean } }).PBNetwork; return Boolean(b && b.ready && b.offline); };

const lauf: Partial<Record<ModelStage, { stop: boolean; done: number; error: string; source: string }>> = {};
const geprueft = (stage: ModelStage) => { try { return localStorage.getItem(GEPRUEFT(stage)) === pins.models[stage].revision; } catch { return false; } };

async function zustandVon(stage: ModelStage): Promise<ModelState> {
  const liste = dateien(stage); let present = 0; const total = liste.reduce((n, d) => n + d.groesse, 0);
  for (const d of liste) present += Math.min(await vorhandeneGroesse(stage, d.pfad), d.groesse || Number.MAX_SAFE_INTEGER);
  const l = lauf[stage];
  const m = pins.models[stage];
  return { id: m.id, revision: m.revision, dim: m.dim, installed: geprueft(stage) && present >= total && total > 0, running: Boolean(l && !l.error && l.done >= 0 && aktiv.has(stage)), present, total, done: l?.done ?? present, error: l?.error || "", source: l?.source || "" };
}
const aktiv = new Set<ModelStage>();
export async function browserModelleZustand(): Promise<NativeModelsState> {
  const models = {} as Record<ModelStage, ModelState>;
  for (const s of STUFEN) models[s] = await zustandVon(s);
  return { models, localAssets: true };
}

async function laden(stage: ModelStage, d: Datei, l: { stop: boolean; done: number; error: string; source: string }, bisher: number) {
  const { dir, name } = await ordner(stage, d.pfad, true);
  const handle = await dir.getFileHandle(name, { create: true });
  let have = (await handle.getFile()).size;
  if (d.groesse && have > d.groesse) { await (await handle.createWritable()).close(); have = 0; }
  if (d.groesse && have >= d.groesse) { l.done = bisher + d.groesse; return; }
  let letzter: unknown = null;
  for (const quelle of d.quellen) {
    if (l.stop) throw Error("CANCELLED");
    try {
      const r = await fetch(quelle, { headers: have ? { Range: `bytes=${have}-` } : {}, cache: "no-store" });
      if (!r.ok && r.status !== 206) { letzter = Error(`http-${r.status}`); continue; }
      const anFang = r.status === 206 ? have : 0;
      if (anFang === 0 && have) { await (await handle.createWritable()).close(); have = 0; }
      const w = await handle.createWritable({ keepExistingData: anFang > 0 });
      if (anFang > 0) await w.seek(anFang);
      const reader = r.body!.getReader(); let geschrieben = anFang;
      l.source = new URL(quelle).host;
      try {
        for (;;) {
          if (l.stop) { await w.close(); throw Error("CANCELLED"); }
          if (internetAus()) { await w.close(); throw Error("APP_OFFLINE"); }
          const { done, value } = await reader.read(); if (done) break;
          await w.write(value as BufferSource); geschrieben += value!.length; l.done = bisher + geschrieben;
        }
        await w.close();
      } catch (e) { try { reader.cancel(); } catch { /* bereits zu */ } throw e; }
      return;
    } catch (e) { if (e instanceof Error && (e.message === "CANCELLED" || e.message === "APP_OFFLINE")) throw e; letzter = e; }
  }
  throw letzter instanceof Error ? letzter : Error("MODEL_DOWNLOAD");
}

export async function browserModelleInstall(stage: ModelStage): Promise<NativeModelsState> {
  if (aktiv.has(stage)) return browserModelleZustand();
  if (internetAus()) { lauf[stage] = { stop: false, done: 0, error: "APP_OFFLINE", source: "" }; return browserModelleZustand(); }
  const l = { stop: false, done: 0, error: "", source: "" }; lauf[stage] = l; aktiv.add(stage);
  void (async () => {
    try {
      const liste = dateien(stage); let bisher = 0;
      for (const d of liste) { await laden(stage, d, l, bisher); bisher += d.groesse || (await vorhandeneGroesse(stage, d.pfad)); }
      // Jede Datei frisch gegen ihren festen Fingerabdruck prüfen, erst dann gilt das Modell als vollständig.
      for (const d of liste) {
        if (l.stop) throw Error("CANCELLED");
        const { dir, name } = await ordner(stage, d.pfad, false);
        const f = await (await dir.getFileHandle(name)).getFile();
        if ((await fileChecksum(f)) !== d.sha256) { await dir.removeEntry(name); throw Error("MODEL_CHECKSUM"); }
      }
      try { localStorage.setItem(GEPRUEFT(stage), pins.models[stage].revision); } catch { /* dann nächstes Mal erneut prüfen */ }
    } catch (e) { l.error = e instanceof Error ? e.message : "MODEL_DOWNLOAD"; }
    finally { aktiv.delete(stage); window.dispatchEvent(new Event("familienakte:modelle")); }
  })();
  return browserModelleZustand();
}
export async function browserModelleCancel(stage: ModelStage) { const l = lauf[stage]; if (l) l.stop = true; while (aktiv.has(stage)) await new Promise((r) => setTimeout(r, 100)); return browserModelleZustand(); }
export async function browserModelleRemove(stage: ModelStage) {
  await browserModelleCancel(stage);
  try { localStorage.removeItem(GEPRUEFT(stage)); } catch { /* egal */ }
  try { const root = await navigator.storage.getDirectory(); const m = await root.getDirectoryHandle(ORDNER); await m.removeEntry(stage, { recursive: true }); } catch { /* war nicht da */ }
  // Bibliothek nur entfernen, wenn kein Modell mehr liegt.
  let andere = false; for (const s of STUFEN) if (s !== stage && (await zustandVon(s)).present > 0) andere = true;
  if (!andere) { try { const root = await navigator.storage.getDirectory(); const m = await root.getDirectoryHandle(ORDNER); await m.removeEntry("lib", { recursive: true }); } catch { /* war nicht da */ } }
  delete lauf[stage];
  return browserModelleZustand();
}
export const browserModelle = { getState: browserModelleZustand, install: (o: { stage: ModelStage }) => browserModelleInstall(o.stage), cancel: (o: { stage: ModelStage }) => browserModelleCancel(o.stage), remove: (o: { stage: ModelStage }) => browserModelleRemove(o.stage) };
export const browserModelleMoeglich = () => typeof navigator !== "undefined" && Boolean(navigator.storage?.getDirectory) && typeof Worker !== "undefined";
