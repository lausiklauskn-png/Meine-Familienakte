import { useState } from "react";
import { RefreshCw } from "lucide-react";

// „Neue Fassung laden“ in der Kopfleiste (Klaus 2026-10-30: „Aktualisierungsbutton oben, damit ich nicht jedes Mal die
// Tastenkombi machen muss“). Vorbild Kim-sync assets/neuladen.js: eigene Vorräte des Service Workers weg (nicht den Vorrat
// geteilter Dateien), Worker abmelden, mit neuer Adresse laden. Daten (Tresor, Register, Einstellungen) bleiben unberührt.
// Nur im Browser (PWA): Android und Windows holen neue Fassungen über die Versionszeile. Bei Internet „aus“ wird nichts
// gelöscht – sonst stünde die App ohne Vorrat und ohne Netz leer da.
type Bruecke = { offline: boolean; ready: boolean };
const VORRAT = /^familienakte-/, GETEILT = "familienakte-geteilt";

function nativ() {
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean }; __TAURI__?: unknown };
  return !!w.Capacitor?.isNativePlatform?.() || !!w.__TAURI__;
}

export async function neueFassungLaden(hinweis: (text: string) => void) {
  const netz = (window as unknown as { PBNetwork?: Bruecke }).PBNetwork;
  if (!netz?.ready || netz.offline || navigator.onLine === false) {
    hinweis(netz?.offline ? "Internet für die App ist aus – zum Laden einer neuen Fassung oben einschalten." : "Gerade kein Internet – die neue Fassung kann nicht geladen werden.");
    return false;
  }
  try {
    if ("caches" in window) for (const name of await caches.keys()) if (VORRAT.test(name) && name !== GETEILT) await caches.delete(name);
  } catch { /* trotzdem neu laden */ }
  try {
    const hier = new URL("./", location.href).href;
    for (const reg of (await navigator.serviceWorker?.getRegistrations?.()) || []) if (reg.scope === hier) await reg.unregister();
  } catch { /* trotzdem neu laden */ }
  location.replace(`${location.pathname}?frisch=${Date.now()}${location.hash}`);
  return true;
}

export function NeuLadenKnopf() {
  const [busy, setBusy] = useState(false);
  if (typeof window === "undefined" || nativ()) return null;
  const text = "Neue Fassung laden (Vorrat leeren und neu laden – deine Daten bleiben)";
  const hinweis = (t: string) => {
    const app = (window as unknown as { FamilienakteApp?: { hinweis?: (t: string, d: number) => void } }).FamilienakteApp;
    if (app?.hinweis) app.hinweis(t, 8000); else window.alert(t);
  };
  return <button type="button" className="icon-button neu-laden" disabled={busy} title={text} aria-label={text} data-neu-laden
    onClick={() => { setBusy(true); void neueFassungLaden(hinweis).then((ok) => { if (!ok) setBusy(false); }); }}>
    <RefreshCw size={18} className={busy ? "dreht" : undefined}/>
  </button>;
}
