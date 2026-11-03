import { demoActive } from "../lib/demo-workspace.ts";
import type { ProApp, ProUebergabe } from "./pro-uebergabe";
export type ProTresorZustand = { status: "getrennt" | "offen" | "gesperrt" | "nicht_erreichbar"; id?: string; ort?: string; code?: string; uebergaben?: boolean };
interface ProTresorPlugin {
  zustand(): Promise<ProTresorZustand>;
  verbinden(): Promise<ProTresorZustand>;
  entsperren(): Promise<ProTresorZustand>;
  sperren(): Promise<void>;
  speichern(args: { vaultId: string; documentId: string; name: string; mime: string; date: number; data: string }): Promise<{ vaultId: string; entryId: string; sha256: string; size: number }>;
  lesen(args: { vaultId: string; entryId: string }): Promise<{ data: string }>;
  uebergabeSenden(args: { vaultId: string; ziel: ProApp; transferId: string; documentId: string; bezug?: string; name: string; mime: string; data: string }): Promise<{ vaultId: string; entryId: string; sha256: string; size: number; stand: string }>;
  uebergabeEingang(args: { vaultId: string }): Promise<{ items: Array<{ entryId: string; vertrag?: ProUebergabe; fehler?: string }> }>;
  uebergabeLesen(args: { vaultId: string; entryId: string }): Promise<{ vertrag: ProUebergabe; data: string }>;
  uebergabeQuittieren(args: { vaultId: string; entryId: string; sha256: string }): Promise<{ stand: string }>;
  uebergabeStand(args: { vaultId: string; ziel: ProApp; entryId: string }): Promise<{ bestaetigt: boolean }>;

}
type NativeWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string; Plugins?: { FamilienakteTresor?: ProTresorPlugin } } };
const cap = () => (window as NativeWindow).Capacitor;
export const proTresorVerfuegbar = () => Boolean(!demoActive() && cap()?.isNativePlatform?.() && ["android", "windows"].includes(cap()?.getPlatform?.() || "") && cap()?.Plugins?.FamilienakteTresor);
function plugin() {
  if (demoActive()) throw new Error("Der gemeinsame Pro-Tresor bleibt in der Demo getrennt.");
  const p = cap()?.Plugins?.FamilienakteTresor;
  if (!p) throw new Error("Für diesen Pro-Tresor bitte die zugehörige Android- oder Windows-App öffnen.");
  return p;
}
async function aufrufen<K extends "zustand" | "verbinden" | "entsperren" | "sperren">(name: K): Promise<Awaited<ReturnType<ProTresorPlugin[K]>>> {
  if (demoActive()) throw new Error("Der gemeinsame Pro-Tresor bleibt in der Demo getrennt.");
  const plugin = cap()?.Plugins?.FamilienakteTresor;
  if (!plugin) throw new Error("Pro-Tresor ist auf diesem Gerät nicht verfügbar.");
  return await plugin[name]() as Awaited<ReturnType<ProTresorPlugin[K]>>;
}
/** Code aus einer Capacitor-Ablehnung ({ code }), einer Tauri-Ablehnung (Zeichenkette) oder einem Zustand. */
export function proTresorCode(fehler: unknown): string {
  const wert = typeof fehler === "string" ? fehler
    : fehler && typeof fehler === "object" ? String((fehler as { code?: unknown }).code || (fehler as { message?: unknown }).message || "") : "";
  return /^[A-Z0-9_]+$/.test(wert) ? wert : (wert.match(/\b(?:FA_)?TRESOR_[A-Z0-9_]+/)?.[0] || "");
}
const ORDNER_HINWEIS = "Bitte den Ordner wählen, in dem tresorordner.json liegt (z. B. SD-Karte › Privat Brain Pro Hauptablageordner).";
/** Verständliche Meldung je Grund. Leere Zeichenkette = kein besonderer Grund bekannt. */
export function proTresorMeldung(code: string): string {
  switch (code) {
    case "FA_TRESOR_FREMDE_KENNUNG": return "Anderer Tresor verbunden – bitte den Ordner wählen, in dem tresorordner.json liegt.";
    case "FA_TRESOR_NICHT_VORHANDEN": return `In diesem Ordner liegt keine tresorordner.json. ${ORDNER_HINWEIS} Es wurde kein neuer Tresor angelegt.`;
    case "FA_TRESOR_UNTERORDNER": return `Du hast einen Unterordner des Tresors gewählt (z. B. „Tresorordner“, „Familienakte“ oder „Eingang-…“). Bitte eine Ebene höher den Ordner wählen, in dem tresorordner.json liegt. Es wurde nichts verändert.`;
    case "FA_TRESOR_ABGEBROCHEN": return "Ordnerwahl oder Passwort abgebrochen. Es wurde nichts geändert; die bisherige Verbindung bleibt.";
    case "FA_TRESOR_FREIGABE_FEHLT": return "Das Gerät hat keine dauerhafte Lese- und Schreibfreigabe für diesen Ordner erteilt. Bitte den Ordner erneut wählen und den Zugriff erlauben.";
    case "TRESOR_PASSWORT_FALSCH": return "Das Passwort passt nicht zu diesem Tresor. Es wurde nichts verändert.";
    case "FA_TRESOR_UMGEZOGEN": return "Dieser Tresor wurde an einen neuen Ort umgezogen. Bitte den neuen Ort wählen.";
    case "FA_TRESOR_ORT_NICHT_GESPEICHERT": return "Der gewählte Ort konnte nicht dauerhaft gemerkt werden. Bitte erneut versuchen.";
    case "FA_TRESOR_ZUSTAND_BESCHAEDIGT": return "Die gemerkte Verbindung ist beschädigt. Bitte den vorhandenen Pro-Tresor neu wählen. Die Tresordateien wurden nicht verändert.";
    case "TRESOR_BESCHAEDIGT": return "Die Datei tresorordner.json in diesem Ordner ist nicht lesbar oder beschädigt. Es wurde nichts verändert.";
    case "FA_TRESOR_NICHT_ERREICHBAR": case "TRESOR_ORDNER_NICHT_ERREICHBAR": case "TRESOR_DATEI_FEHLT":
      return "Der gemerkte Speicher ist gerade nicht erreichbar (z. B. SD-Karte entnommen oder Freigabe entzogen). Der Ort bleibt gemerkt; es wird kein anderer Speicher verwendet.";
    default: return "";
  }
}

export const proTresor = {
  zustand: () => aufrufen("zustand"), verbinden: () => aufrufen("verbinden"),
  entsperren: () => aufrufen("entsperren"), sperren: () => aufrufen("sperren"),
};

const MAX_BYTES = 20 * 1024 * 1024;
export const istProOriginal = (pfad: string) => pfad.startsWith("pro-tresor:");
const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
function originalInfo(pfad: string) {
  const u = new URL(pfad);
  const vaultId = u.hostname, entryId = u.pathname.slice(1), sha256 = u.searchParams.get("sha256") || "";
  const size = Number(u.searchParams.get("size")), name = u.searchParams.get("name") || "", mime = u.searchParams.get("mime") || "application/octet-stream";
  const date = Number(u.searchParams.get("date"));
  if (u.protocol !== "pro-tresor:" || !/^[a-z0-9-]{1,80}$/.test(vaultId) || !/^[a-z0-9-]{1,80}$/.test(entryId)
    || !/^[a-f0-9]{64}$/.test(sha256) || !Number.isSafeInteger(size) || size < 0 || size > MAX_BYTES || !name || name.length > 255 || mime.length > 200
    || !["name", "mime", "date", "size", "sha256"].every((k) => u.searchParams.getAll(k).length === 1)
    || !Number.isSafeInteger(date) || date < 0 || u.username || u.password || u.port || u.hash)
    throw new Error("Der Pro-Tresor-Verweis ist unvollständig oder beschädigt.");
  return { vaultId, entryId, sha256, size, name, mime, date };
}
export const proOriginalMerkmale = (pfad: string) => originalInfo(pfad);
export function proOriginalName(pfad: string) { return originalInfo(pfad).name; }
export function proOriginalVaultId(pfad: string) { return originalInfo(pfad).vaultId; }
async function alsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Die Quelldatei konnte nicht gelesen werden."));
    reader.onabort = () => reject(new Error("Das Lesen der Quelldatei wurde abgebrochen."));
    reader.onload = () => { const text = String(reader.result); resolve(text.slice(text.indexOf(",") + 1)); };
    reader.readAsDataURL(file);
  });
}
export async function proOriginalSpeichern(vaultId: string, file: File, checksum: string, datum = 0): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error("Die Datei ist größer als 20 MB.");
  if (!file.name || file.name.length > 255 || file.type.length > 200 || !/^[a-f0-9]{64}$/.test(checksum)) throw new Error("Name, Dateityp oder Prüfsumme der Quelldatei sind unzulässig.");
  const stand = await proTresor.zustand();
  if (stand.id !== vaultId || stand.status !== "offen") throw new Error("Bitte den zu diesem Akten-Arbeitsstand gehörenden Pro-Tresor verbinden und entsperren. Die Quelle bleibt erhalten.");
  // Stabile Kennung auch dann, wenn das Aktenregister nach nativer Ablage nicht geschrieben werden konnte.
  const date = Number.isFinite(datum) ? Math.max(0, Math.trunc(datum)) : 0;
  const r = await plugin().speichern({ vaultId, documentId: `d-${checksum}`, name: file.name,
    mime: file.type || "application/octet-stream", date, data: await alsBase64(file) });
  if (r.vaultId !== vaultId || r.size !== file.size || r.sha256 !== checksum || !/^[a-z0-9-]{1,80}$/.test(r.entryId))
    throw new Error("Der Pro-Tresor hat die Originaldatei nicht passend bestätigt. Die Quelle bleibt erhalten.");
  const u = new URL(`pro-tresor://${vaultId}/${r.entryId}`);
  for (const [k, v] of Object.entries({ name: file.name, mime: file.type || "application/octet-stream", date, size: r.size, sha256: checksum })) u.searchParams.set(k, String(v));
  return u.href;
}
export async function proOriginalLesen(pfad: string): Promise<File> {
  const m = originalInfo(pfad);
  const { data } = await plugin().lesen({ vaultId: m.vaultId, entryId: m.entryId });
  if (typeof data !== "string" || data.length > Math.ceil(MAX_BYTES / 3) * 4) throw new Error("Die Pro-Tresor-Datei überschreitet die zulässige Größe.");
  const bin = atob(data), bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  if (bytes.length !== m.size || hex(await crypto.subtle.digest("SHA-256", bytes)) !== m.sha256)
    throw new Error("Die Originaldatei stimmt nicht mit ihrem Pro-Tresor-Verweis überein.");
  return new File([bytes], m.name, { type: m.mime, lastModified: m.date });
}

export const proTresorUebergaben = {
  eingang: (vaultId: string) => plugin().uebergabeEingang({ vaultId }),
  stand: (vaultId: string, ziel: ProApp, entryId: string) => plugin().uebergabeStand({ vaultId, ziel, entryId }),
  async senden(vaultId: string, vertrag: ProUebergabe, file: File) {
    if (file.size > MAX_BYTES) throw new Error("Höchstens 20 MiB je Übergabe.");
    const r = await plugin().uebergabeSenden({ vaultId, ziel: vertrag.ziel, transferId: vertrag.id, documentId: vertrag.dokumentId,
      ...(vertrag.bezug ? { bezug: vertrag.bezug } : {}), name: file.name, mime: file.type, data: await alsBase64(file) });
    if (r.vaultId !== vaultId || r.size !== vertrag.groesse || r.sha256 !== vertrag.sha256 || r.stand !== "weitergegeben" || !/^[a-z0-9-]{1,80}$/.test(r.entryId)) throw new Error("Der gemeinsame Eingang hat die Weitergabe nicht passend bestätigt.");
    return r;
  },
  async lesen(vaultId: string, entryId: string) {
    const r = await plugin().uebergabeLesen({ vaultId, entryId });
    if (typeof r.data !== "string" || r.data.length > Math.ceil(MAX_BYTES / 3) * 4) throw new Error("Die Übergabe überschreitet 20 MiB.");
    const bytes = Uint8Array.from(atob(r.data), c => c.charCodeAt(0));
    return { vertrag: r.vertrag, file: new File([bytes], r.vertrag.name, { type: r.vertrag.mime, lastModified: 0 }) };
  },
  async quittieren(vaultId: string, entryId: string, sha256: string) {
    const r = await plugin().uebergabeQuittieren({ vaultId, entryId, sha256 });
    if (r.stand !== "im-eingang") throw new Error("Eingang gespeichert, Rückmeldung noch offen. Erneut aufnehmen bleibt möglich.");
  },
};
