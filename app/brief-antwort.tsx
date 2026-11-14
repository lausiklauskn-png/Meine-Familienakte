// Briefweg der Assistenz (Klaus 14.11.: „ein Weg zur KI, keine zweite Bedienung“): Die Karte füllt nur das Pseudo-Fenster oben
// (app/pseudo-knopf.tsx) mit Aufgabe „Antwortbrief“ – mit der gewählten Unterlage (Original aus der Akte, sonst ihr Textauszug)
// oder leer mit Textfeld. Kopieren, Direktlink, Mistral mit eigenem Schlüssel, Zurückführen, „Als Entwurf“ und „PDF“ macht das
// Fenster. Der Briefumschlag im Kopf bleibt der schnelle Einstieg. (Bis 2.28.68 hatte die Karte eigene Felder und Knöpfe.)
import { useState } from "react";
import { Mail } from "lucide-react";
import { InfoPopover } from "./ui-controls";
import { anKi } from "./pseudo-knopf";
import type { AssistantDocument } from "@/lib/family-assistant";

type Notice = { kind: "success" | "error" | "info"; text: string } | null;

export function BriefAntwort({ documents, onDateiLaden, onNotice }: {
  documents: AssistantDocument[];
  onDateiLaden?: (id: string) => Promise<File>;
  onNotice: (notice: Notice) => void;
}) {
  const [quelle, setQuelle] = useState("");
  const [busy, setBusy] = useState(false);
  const oeffnen = async () => {
    const d = documents.find((x) => x.id === quelle);
    if (!d) { anKi({ aufgabe: "Antwortbrief schreiben" }); return; }
    setBusy(true);
    try {
      let datei: File | null = null;
      if (onDateiLaden) { try { datei = await onDateiLaden(d.id); } catch { datei = null; } }
      if (datei) anKi({ dateien: [datei], aufgabe: "Antwortbrief schreiben" });
      else if ((d.textauszug || "").trim()) anKi({ texte: [{ name: d.title, text: d.textauszug || "" }], aufgabe: "Antwortbrief schreiben" });
      else onNotice({ kind: "info", text: "Von dieser Unterlage ist kein Text da. Bitte den Brief im Fenster einfügen." });
    } finally { setBusy(false); }
  };
  return <section className="card brief-antwort brief-kurz" data-brief-antwort>
    <div className="card-heading"><div><span className="ui-heading-help"><h2>Brief oder E-Mail beantworten</h2><InfoPopover label="Brief oder E-Mail beantworten erklären" text="Das Schreiben öffnet sich im Pseudo-Fenster oben: Namen, Anschriften und Nummern werden zu Platzhaltern wie ⟦NAME-1⟧, bevor etwas das Gerät verlässt. Dort wählst du die KI (ChatGPT, Claude, Gemini oder Mistral mit eigenem Schlüssel), fügst die Antwort unter „2 Zurück“ ein und speicherst sie als Entwurf oder PDF. Schneller Weg: der Briefumschlag oben im Kopf."/></span></div></div>
    <div className="brief-kurz-reihe">
      <select value={quelle} onChange={(e) => setQuelle(e.target.value)} aria-label="Aus einer Unterlage, optional" data-brief-quelle><option value="">Aus einer Unterlage (optional) …</option>{documents.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select>
      <button type="button" className="button primary compact-button" disabled={busy} onClick={() => void oeffnen()} data-brief-oeffnen-fenster><Mail size={15}/> Im Pseudo-Fenster schreiben</button>
    </div>
  </section>;
}
