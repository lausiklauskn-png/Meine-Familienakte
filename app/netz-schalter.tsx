import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

// Internetschalter der App (Brief Teil 2, Grundsatz „wie in Private Brain Pro“): Standard aus, Zustand überlebt den
// Neustart, Lampe in der Kopfleiste. Die Technik dahinter ist public/native/native-network.js (byte-gleich aus
// Private Brain Pro) und familienakte-netz.js (Speicher für Browser/Windows); hier nur die Anzeige im vorhandenen
// Muster der Symbolknöpfe der Kopfleiste.
type NetzBruecke = { offline: boolean; ready: boolean; initialized: Promise<void>; setOffline: (value: boolean) => Promise<void> };
const bruecke = () => (window as unknown as { PBNetwork?: NetzBruecke }).PBNetwork;

export function NetzSchalter() {
  const [offline, setOffline] = useState(true);
  const [bereit, setBereit] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const lesen = () => { const b = bruecke(); setOffline(!b || !b.ready || b.offline); setBereit(!!b?.ready); };
    lesen();
    bruecke()?.initialized.then(lesen).catch(lesen);
    window.addEventListener("pb:network", lesen);
    return () => window.removeEventListener("pb:network", lesen);
  }, []);
  const umschalten = async () => {
    const b = bruecke(); if (!b || busy) return;
    setBusy(true);
    try { await b.setOffline(!b.offline); } catch { /* Zustand wird aus dem Ereignis gelesen */ }
    finally { setBusy(false); }
  };
  const text = !bereit ? "Internet für die App: wird geprüft …" : offline ? "Internet für die App: aus – antippen zum Einschalten" : "Internet für die App: an – antippen zum Ausschalten";
  return <button type="button" className={`icon-button netz-schalter ${offline ? "netz-aus" : "netz-an"}`} onClick={() => void umschalten()} disabled={!bereit || busy} title={text} aria-label={text} aria-pressed={!offline} data-netz={offline ? "aus" : "an"}>
    {offline ? <WifiOff size={18}/> : <Wifi size={18}/>}<span className="netz-lampe" aria-hidden="true"/>
  </button>;
}
