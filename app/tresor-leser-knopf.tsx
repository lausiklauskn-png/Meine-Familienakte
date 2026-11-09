import { BookOpen } from "lucide-react";
import { useState } from "react";
import { nativenOrdnerWaehlen, ordnerPlugin } from "./nativer-ordner";

/**
 * Tresor-Leser (Pro-Verbund-Karte, orange „t-leser“: „Braucht nur Einbauen und einen Test“; Klaus 09.11.2026).
 * Die Datei kommt byte-gleich aus Workflow PDF Pro (public/tresor-leser/, Pin tresor-leser.herkunft.json). Sie öffnet den
 * gemeinsamen Tresor in jedem Browser, ohne Installation und ohne Internet, nur lesend.
 * App (Android/Windows): in einen frei gewählten Ordner legen, am besten neben den Tresor. Browser: herunterladen.
 * Die App schreibt dabei nichts in den Tresor selbst.
 */
export const TRESOR_LESER_ADRESSE = "tresor-leser/tresor-leser.html";
export const TRESOR_LESER_NAME = "Tresor-Leser.html";

async function leserLaden(): Promise<Blob> {
  const antwort = await fetch(new URL(TRESOR_LESER_ADRESSE, document.baseURI).href, { cache: "no-store" });
  if (!antwort.ok) throw new Error("Der Tresor-Leser ist in dieser Fassung nicht enthalten.");
  return new Blob([await antwort.arrayBuffer()], { type: "text/html" });
}

export function TresorLeserKnopf() {
  const [meldung, setMeldung] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const nativ = Boolean(ordnerPlugin());
  const speichern = async () => {
    setLaeuft(true); setMeldung("");
    try {
      const datei = await leserLaden();
      if (nativ) {
        const ordner = await nativenOrdnerWaehlen("Ordner für den Tresor-Leser – am besten der Ordner, in dem der Tresor liegt");
        const ziel = await ordner.getFileHandle(TRESOR_LESER_NAME, { create: true });
        const w = await ziel.createWritable(); await w.write(datei); await w.close();
        setMeldung(`Gespeichert: „${TRESOR_LESER_NAME}“ im Ordner „${ordner.name}“.`);
      } else {
        const url = URL.createObjectURL(datei);
        const a = document.createElement("a"); a.href = url; a.download = TRESOR_LESER_NAME; document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setMeldung(`„${TRESOR_LESER_NAME}“ wird heruntergeladen. Leg die Datei neben den Tresor.`);
      }
    } catch (e) {
      setMeldung((e as DOMException)?.name === "AbortError" ? "Abgebrochen." : `Nicht gespeichert: ${(e as Error)?.message || e}`);
    } finally { setLaeuft(false); }
  };
  return <div className="tresor-leser" data-tresor-leser>
    <p className="pfad-titel"><strong>Tresor-Leser</strong> – den Tresor ohne App lesen:</p>
    <ul className="merkpunkte">
      <li><strong>Eine Datei</strong> neben den Tresor legen. Sie öffnet ihn in jedem Browser, ohne Installation und ohne Internet.</li>
      <li><strong>Nur lesen:</strong> Passwort eingeben, Dokumente ansehen oder einzeln herunterladen. Am Tresor ändert sich nichts.</li>
    </ul>
    <button type="button" className="button secondary" data-tresor-leser-speichern disabled={laeuft} onClick={speichern}>
      <BookOpen size={16}/> {nativ ? "Tresor-Leser in Ordner legen …" : "Tresor-Leser herunterladen"}
    </button>
    {meldung && <p className="muted" role="status" data-tresor-leser-meldung>{meldung}</p>}
  </div>;
}
