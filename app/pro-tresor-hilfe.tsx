import { FolderOpen } from "lucide-react";
import { OrdnerBaum, Pfad } from "./ablaufbild";
import type { ProTresorZustand } from "./pro-tresor";
import { TresorLeserKnopf } from "./tresor-leser-knopf";

/** „Wo liegt was?“ – gleicher Inhalt in jeder Pro-App (gemeinsamer Plan vom 2026-11-03), darunter app-spezifisch.
 *  Seit 2026-11-04 als Ordnerbaum, drei Merkpunkte und Pfadangabe (auf einen Blick statt Fließtext). */
export const PRO_TRESOR_FACH = "Familienakte";
export const PRO_TRESOR_EINGANG = "Eingang-Familienakte";
export const PRO_TRESOR_MENUEWEG = "Dokumente → Sicherheit & lokaler Tresor → Karte „Gemeinsamer Pro-Tresor“ → „Vorhandenen Pro-Tresor verbinden …“";
const VERBINDEN = "[data-pro-tresor-einrichten], [data-pro-tresor-verbinden]";

/** Lage des Tresors für die Anzeige: grün = entsperrt, rot = gesperrt / nicht verbunden / nicht erreichbar. */
const LAGE: Record<ProTresorZustand["status"], string> = { offen: "entsperrt", gesperrt: "gesperrt", getrennt: "noch nicht verbunden", nicht_erreichbar: "nicht erreichbar" };

/**
 * @param onVerbinden Weg zum Verbinden-Knopf, wenn er nicht auf derselben Seite liegt (Hilfe → Sicherheit).
 * @param stand       Zustand des Pro-Tresors (nur in der App); ohne ihn bleibt der Baum neutral.
 * @param zahlen      Unterlagen der geöffneten Akte: gesamt und davon im Pro-Tresor.
 */
export function ProTresorWoLiegtWas({ open = false, onVerbinden, onDokumente, stand, zahlen }: { open?: boolean; onVerbinden?: () => void; onDokumente?: () => void; stand?: ProTresorZustand; zahlen?: { gesamt: number; imTresor: number } }) {
  const verbinden = onVerbinden || VERBINDEN;
  const lage = stand ? LAGE[stand.status] : null;
  // Klaus 09.11. (l2, l5): nie eingerichtet = grau (freiwillig), gesperrt = gelb, nicht erreichbar = rot, entsperrt = grün.
  const hauptArt = !stand ? "hervor" : stand.status === "offen" ? "gut" : stand.status === "gesperrt" ? "gelb" : stand.status === "getrennt" ? "aus" : "warnung";
  const unterlagen = zahlen ? `${zahlen.imTresor} von ${zahlen.gesamt} Unterlage${zahlen.gesamt === 1 ? "" : "n"} im Tresor` : "Diese App: Familienakte · entsteht beim ersten Original";
  return <details data-pro-tresor-hilfe open={open} className="wo-liegt-was">
    <summary><FolderOpen/> Wo liegt was?</summary>
    <OrdnerBaum label="Aufbau des gemeinsamen Tresors" wurzel={{
      titel: "Speicher", unter: stand?.ort ? `Gewählt: ${stand.ort.replace(/^content:\/\/[^/]+\/(tree\/)?/, "")}` : "SD-Karte, Gerät, USB-Stick, Laufwerk – oder ein eigener Ordner im Gerät",
      kinder: [{
        titel: lage ? `Tresor-Hauptordner · ${lage}` : "Tresor-Hauptordner", unter: "Name frei, z. B. „Family-Projekt“ · erkennbar an tresorordner.json · diesen Ordner wählen", art: hauptArt, ziel: verbinden,
        kinder: [
          { titel: PRO_TRESOR_FACH, unter: zahlen ? `Diese App: Familienakte · ${unterlagen}` : unterlagen, art: "hervor", ...(onDokumente ? { ziel: onDokumente } : {}) },
          { titel: "Workflow PDF Pro · Private Brain · BookLedgerPro", unter: "Ordner der anderen Pro-Apps" },
          { titel: "Eingang-…", unter: `Briefkästen · Eingang: ${PRO_TRESOR_EINGANG}` },
          { titel: "Tresorordner", unter: "Verwaltung · Nie den Unterordner „Tresorordner“ wählen", art: "warnung" },
        ],
      }],
    }}/>
    <ul className="merkpunkte">
      <li><strong>Ein Passwort</strong> gilt für alle Pro-Apps.</li>
      <li><strong>Nichts von Hand</strong> in den Tresor legen – die Dateien dort sind verschlüsselt und heißen nach Nummern.</li>
      <li><strong>Ersatzschlüssel</strong> ausdrucken oder getrennt aufbewahren, nie in den Tresor.</li>
    </ul>
    <p className="pfad-titel"><strong>Verbinden</strong> (nur in der Android- und der Windows-App; die Web-App „Basic“ zeigt keinen Pro-Tresor):</p>
    <Pfad teile={[{ text: "Dokumente" }, { text: "Sicherheit & lokaler Tresor" }, { text: "Gemeinsamer Pro-Tresor" }, { text: "Verbinden …", ziel: verbinden }]}/>
    <TresorLeserKnopf/>
    <p className="sr-only">Ein Passwort gilt für alle Pro-Apps. Weg: {PRO_TRESOR_MENUEWEG}</p>
  </details>;
}
