import { useEffect, useState } from "react";

/**
 * Rotes Fähnchen „Update verfügbar“ an der Versionszeile (2.28.39, Klaus 08.11.2026). Den Update-Knopf ⟳ im Kopf gibt es
 * nicht mehr: die Hülle prüft selbst (beim Start, gelegentlich, nur bei Internet an) und meldet das Ergebnis über
 * `FamilienakteApp.fahne()` → <html data-update-verfuegbar> und das Ereignis „familienakte:update“
 * (public/native/familienakte-app.js). Antippen = Update wie bisher über die Versionszeile; nach dem Update ist es weg.
 */
type AppBruecke = { aktualisieren?: () => void };
const bruecke = () => (window as unknown as { FamilienakteApp?: AppBruecke }).FamilienakteApp;
const stand = () => typeof document !== "undefined" ? document.documentElement.dataset.updateVerfuegbar || "" : "";

export function UpdateFahne() {
  const [neu, setNeu] = useState(stand);
  useEffect(() => {
    const lesen = () => setNeu(stand());
    lesen();
    window.addEventListener("familienakte:update", lesen);
    return () => window.removeEventListener("familienakte:update", lesen);
  }, []);
  if (!neu) return null;
  const titel = neu !== "ja" ? `Update verfügbar: Fassung ${neu} – antippen zum Aktualisieren` : "Update verfügbar – antippen zum Aktualisieren";
  const tippen = (event: React.SyntheticEvent) => { event.preventDefault(); event.stopPropagation(); bruecke()?.aktualisieren?.(); };
  // Liegt im Markenknopf (Startseite); darum ein Element mit Rolle statt eines verschachtelten <button>.
  return <span className="update-fahne" role="button" tabIndex={0} title={titel} aria-label={titel} data-update-fahne={neu}
    onClick={tippen} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") tippen(event); }}>Update<span className="fahne-lang"> verfügbar</span></span>;
}
