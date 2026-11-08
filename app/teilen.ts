/** Stufe H (Plan 08.11.2026): eine Datei aus der Akte an eine andere App geben – Mail, Messenger, Drucker-App, Dateien.
 *  Android-App: eigener Baustein (ACTION_SEND über den FileProvider, in Stücken übergeben); Browser mit Teilen-Fenster: Web Share;
 *  sonst (Windows, ältere Browser) wird die Datei heruntergeladen. Die Akte verschickt nie selbst; nur was der Nutzer wählt. */
type TeilenPlugin = { teilenStueck(a: { id: string; data: string }): Promise<void>; teilenFertig(a: { id: string; name: string; mime: string }): Promise<{ geteilt: boolean }> };
const STUECK = 768 * 1024;
const b64 = (u: Uint8Array) => { let s = ""; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };
function nativ(): TeilenPlugin | null {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { FamilienakteShare?: Partial<TeilenPlugin> } } }).Capacitor;
  const p = cap?.Plugins?.FamilienakteShare;
  return cap?.isNativePlatform?.() && p?.teilenStueck && p.teilenFertig ? (p as TeilenPlugin) : null;
}
export type TeilenErgebnis = "geteilt" | "abgebrochen" | "heruntergeladen";
export async function dateiTeilen(file: File): Promise<TeilenErgebnis> {
  const p = nativ();
  if (p) {
    const id = crypto.randomUUID(); const u = new Uint8Array(await file.arrayBuffer());
    for (let o = 0; o < u.length || o === 0; o += STUECK) { await p.teilenStueck({ id, data: b64(u.subarray(o, o + STUECK)) }); if (!u.length) break; }
    const r = await p.teilenFertig({ id, name: file.name, mime: file.type || "application/octet-stream" });
    return r.geteilt ? "geteilt" : "abgebrochen";
  }
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: file.name }); return "geteilt"; } catch (e) { if ((e as Error).name === "AbortError") return "abgebrochen"; }
  }
  const url = URL.createObjectURL(file); const a = document.createElement("a"); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  return "heruntergeladen";
}
export const teilenText = (r: TeilenErgebnis, name: string) => r === "geteilt" ? `„${name}“ wurde an die gewählte App gegeben.` : r === "heruntergeladen" ? "Teilen geht auf diesem Gerät nicht direkt — die Datei wurde heruntergeladen." : "";
