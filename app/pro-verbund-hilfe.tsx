import { Network, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { KastenReihe } from "./hilfe-bilder";

/**
 * Hilfe-Thema „Pro-App-Verbund (Vorschau)“ (Klaus 09.11.2026: „Jetzt die Karte in die Apps einbauen“, in Pro und Basic als Vorschau).
 * Die Karte ist eine eigenständige Seite aus BookLedgerPro (assets/pro-verbund.html), hier byte-gleich unter
 * public/pro-verbund/ (Pin pro-verbund.herkunft.json, geprüft von npm run check:herkunft). Nie hier abwandeln.
 * Sie öffnet sich in einem Vollbild-Rahmen über der App (kein neues Fenster); Schließen, Esc und Android-Zurück schließen ihn.
 */
export const PRO_VERBUND_ADRESSE = "pro-verbund/pro-verbund.html";

export function ProVerbundHilfe() {
  const [offen, setOffen] = useState(false);
  return <details data-pro-verbund-hilfe className="wo-liegt-was">
    <summary><Network/> Pro-App-Verbund (Vorschau)</summary>
    <div>
      <p>Wie die Familienakte mit BookLedgerPro, Workflow PDF Pro und Private Brain Pro zusammenarbeitet – Stand der Wege in Farben.</p>
      <KastenReihe label="Die vier Pro-Apps im Verbund" knoten={[{ titel: "Familienakte", unter: "diese App", art: "hervor" }, { titel: "BookLedgerPro", unter: "Belege, Buchhaltung" }, { titel: "Workflow PDF Pro", unter: "Scannen, PDF" }, { titel: "Private Brain Pro", unter: "Mails, Suche" }]}/>
      <button type="button" className="button primary" data-pro-verbund-oeffnen onClick={() => setOffen(true)}><Network size={16}/> Karte öffnen</button>
      <ul className="merkpunkte">
        <li><strong>Vorschau.</strong> Die Karte zeigt den Stand der Wege, sie verbindet selbst nichts.</li>
        <li><strong>Ohne Internet.</strong> Die Karte liegt in der App; ein Tipp auf einen Kasten oder Weg zeigt Einzelheiten.</li>
      </ul>
    </div>
    {offen && <ProVerbundRahmen onClose={() => setOffen(false)}/>}
  </details>;
}

function ProVerbundRahmen({ onClose }: { onClose: () => void }) {
  const knopf = useRef<HTMLButtonElement>(null);
  const [src] = useState(() => new URL(PRO_VERBUND_ADRESSE, document.baseURI).href);
  useEffect(() => {
    knopf.current?.focus();
    const taste = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    // Android-Zurück (und Maus-Zurück) schließt erst den Rahmen, die Seite darunter bleibt stehen.
    const zurueck = (event: Event) => { event.preventDefault(); onClose(); };
    window.addEventListener("keydown", taste);
    window.addEventListener("familienakte:zurueck", zurueck);
    const vorher = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", taste); window.removeEventListener("familienakte:zurueck", zurueck); document.body.style.overflow = vorher; };
  }, [onClose]);
  return createPortal(<div className="pro-verbund-rahmen" data-pro-verbund-rahmen role="dialog" aria-modal="true" aria-label="Pro-App-Verbund (Vorschau)">
    <div className="pro-verbund-kopf">
      <strong>Pro-App-Verbund <small>Vorschau</small></strong>
      <button ref={knopf} type="button" className="button secondary" data-pro-verbund-schliessen onClick={onClose} aria-label="Karte schließen"><X size={16}/> Schließen</button>
    </div>
    <iframe title="Pro-App-Verbund" src={src} data-pro-verbund-frame/>
  </div>, document.body);
}
