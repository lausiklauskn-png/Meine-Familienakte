import { useEffect, useState } from "react";
import { aufKurzhinweise, kurzhinweiseAn, setKurzhinweise } from "./kurzhinweise";

/** Haken in der Hilfe: Kurzhinweise an Knöpfen ein- und ausschalten (Nutzerwunsch 2026-11-04). */
export function KurzhinweiseSchalter() {
  const [an, setAn] = useState(kurzhinweiseAn);
  useEffect(() => aufKurzhinweise(setAn), []);
  return <section className="card kurzhinweise-schalter">
    <label><input type="checkbox" checked={an} onChange={(e) => setKurzhinweise(e.target.checked)}/> <strong>Kurzhinweise an Knöpfen anzeigen</strong></label>
    <small>Am PC: Maus kurz über einem Knopf halten. Am Tablet oder Handy: Finger kurz auf dem Knopf halten.</small>
  </section>;
}
