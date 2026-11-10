import { useEffect, useState } from "react";
import { aufKurzhinweise, kurzhinweiseAn, setKurzhinweise } from "./kurzhinweise";
import { InfoPopover } from "./ui-controls";

/** Haken in der Hilfe: Tooltips (Kurzhinweise) an Knöpfen ein- und ausschalten (Nutzerwunsch 2026-11-04, Name Klaus 10.11.). */
export function KurzhinweiseSchalter() {
  const [an, setAn] = useState(kurzhinweiseAn);
  useEffect(() => aufKurzhinweise(setAn), []);
  return <section className="card kurzhinweise-schalter">
    <span className="ui-heading-help"><label><input type="checkbox" checked={an} onChange={(e) => setKurzhinweise(e.target.checked)}/> <strong>Tooltips an Knöpfen anzeigen</strong></label>
      <InfoPopover label="Tooltips erklären" text={"• Lassen sich hier jederzeit ein- und ausschalten.\n• Gilt für dieses Gerät."}/></span>
  </section>;
}
