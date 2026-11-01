export type ProTresorZustand = { status: "getrennt" | "offen" | "gesperrt" | "nicht_erreichbar"; id?: string; ort?: string; code?: string };
interface ProTresorPlugin {
  zustand(): Promise<ProTresorZustand>;
  verbinden(): Promise<ProTresorZustand>;
  entsperren(): Promise<ProTresorZustand>;
  sperren(): Promise<void>;
  speichern(args: { vaultId: string; documentId: string; name: string; mime: string; date: number; data: string }): Promise<{ vaultId: string; entryId: string; sha256: string; size: number }>;
  lesen(args: { vaultId: string; entryId: string }): Promise<{ data: string }>;
}
type NativeWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string; Plugins?: { FamilienakteTresor?: ProTresorPlugin } } };
const cap = () => (window as NativeWindow).Capacitor;
export const proTresorVerfuegbar = () => Boolean(cap()?.isNativePlatform?.() && ["android", "windows"].includes(cap()?.getPlatform?.() || "") && cap()?.Plugins?.FamilienakteTresor);
function plugin() {
  const p = cap()?.Plugins?.FamilienakteTresor;
  if (!p) throw new Error("Für diesen Pro-Tresor bitte die zugehörige Android- oder Windows-App öffnen.");
  return p;
}
async function aufrufen<K extends "zustand" | "verbinden" | "entsperren" | "sperren">(name: K): Promise<Awaited<ReturnType<ProTresorPlugin[K]>>> {
  const plugin = cap()?.Plugins?.FamilienakteTresor;
  if (!plugin) throw new Error("Pro-Tresor ist auf diesem Gerät nicht verfügbar.");
  return await plugin[name]() as Awaited<ReturnType<ProTresorPlugin[K]>>;
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
