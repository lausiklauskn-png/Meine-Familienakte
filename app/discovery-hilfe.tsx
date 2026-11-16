import { Telescope, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { KastenReihe } from "./hilfe-bilder";

/**
 * Hilfe-Thema „Discovery“ (Klaus 15.11.2026: „Da wo der Sortierkern drin ist, Discovery nachziehen“ – in der Hilfe bei den Landkarten).
 * Die Seite ist eine eigenständige Seite aus dem Datei-Organizer (src/public/discovery.html samt three.js, Filmen und Tonspuren), hier
 * byte-gleich unter public/discovery/ (Pin HERKUNFT.json, nur über tools/discovery-nachziehen.mjs, geprüft von npm run check:herkunft).
 * Nie hier abwandeln. Sie öffnet sich wie die Karte des Pro-App-Verbunds in einem Vollbild-Rahmen über der App (kein neues Fenster);
 * Schließen, Esc und Android-Zurück schließen ihn. Im Rahmen zeigt die Seite selbst keinen Rückweg-Knopf.
 * Derselbe Rahmen öffnet sich über das Fernrohr in der Kopfleiste (DiscoveryKnopf; bis 900 px in der Aufklappleiste hinter „‹“).
 */
export const DISCOVERY_ADRESSE = "discovery/discovery.html";

export function DiscoveryHilfe() {
  const [offen, setOffen] = useState(false);
  return <details data-discovery-hilfe className="wo-liegt-was">
    <summary><Telescope/> Discovery</summary>
    <div>
      <p>So lernte der Sortier-Kern: erfundene Städte, Lern-Kreislauf, Kurzfilme mit Sprecher.</p>
      <KastenReihe label="Was Discovery zeigt" knoten={[{ titel: "Erfundene Städte", unter: "die Test-Welten" }, { titel: "Lern-Kreislauf", unter: "sechs Schritte", art: "hervor" }, { titel: "Kurzfilme", unter: "mit Sprecher" }]}/>
      <button type="button" className="button primary" data-discovery-oeffnen onClick={() => setOffen(true)}><Telescope size={16}/> Discovery öffnen</button>
      <ul className="merkpunkte">
        <li><strong>Ohne Internet.</strong> Die Seite liegt in der App, mit Filmen und Tonspuren.</li>
        <li><strong>Nur zum Ansehen.</strong> Sie liest und ändert nichts in der Akte.</li>
      </ul>
    </div>
    {offen && <DiscoveryRahmen onClose={() => setOffen(false)}/>}
  </details>;
}

/** Fernrohr in der Kopfleiste (Klaus 15.11.2026: „sichtbar als Button oben in der Navi-Leiste … mit dem Fernrohr“). */
export function DiscoveryKnopf() {
  const [offen, setOffen] = useState(false);
  return <>
    <button type="button" className="icon-button discovery-knopf" onClick={() => setOffen(true)} title="Discovery: so lernte der Sortier-Kern" aria-label="Discovery" data-discovery-knopf><Telescope size={18}/><span className="kopf-wort" aria-hidden="true">Discovery</span></button>
    {offen && <DiscoveryRahmen onClose={() => setOffen(false)}/>}
  </>;
}

function DiscoveryRahmen({ onClose }: { onClose: () => void }) {
  const knopf = useRef<HTMLButtonElement>(null);
  const [src] = useState(() => new URL(DISCOVERY_ADRESSE, document.baseURI).href);
  useEffect(() => {
    knopf.current?.focus();
    const taste = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    // Android-Zurück (und Maus-Zurück) schließt erst den Rahmen, die Hilfe darunter bleibt stehen.
    const zurueck = (event: Event) => { event.preventDefault(); onClose(); };
    window.addEventListener("keydown", taste);
    window.addEventListener("familienakte:zurueck", zurueck);
    const vorher = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", taste); window.removeEventListener("familienakte:zurueck", zurueck); document.body.style.overflow = vorher; };
  }, [onClose]);
  // Gleicher Rahmen wie die Verbund-Karte (Klassen pro-verbund-rahmen/-kopf); Ton und Vollbild des Films sind im Rahmen erlaubt.
  return createPortal(<div className="pro-verbund-rahmen" data-discovery-rahmen role="dialog" aria-modal="true" aria-label="Discovery">
    <div className="pro-verbund-kopf">
      <strong>Discovery <small>so lernte der Sortier-Kern</small></strong>
      <button ref={knopf} type="button" className="button secondary" data-discovery-schliessen onClick={onClose} aria-label="Discovery schließen"><X size={16}/> Schließen</button>
    </div>
    <iframe title="Discovery" src={src} allow="autoplay; fullscreen" allowFullScreen data-discovery-frame/>
  </div>, document.body);
}
