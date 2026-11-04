import { OrdnerBaum, Pfad } from "./ablaufbild";

/** „Wo liegt was?“ – gleicher Inhalt in jeder Pro-App (gemeinsamer Plan vom 2026-11-03), darunter app-spezifisch.
 *  Seit 2026-11-04 als Ordnerbaum, drei Merkpunkte und Pfadangabe (auf einen Blick statt Fließtext). */
export const PRO_TRESOR_FACH = "Familienakte";
export const PRO_TRESOR_EINGANG = "Eingang-Familienakte";
export const PRO_TRESOR_MENUEWEG = "Dokumente → Sicherheit & lokaler Tresor → Karte „Gemeinsamer Pro-Tresor“ → „Vorhandenen Pro-Tresor verbinden …“";
const VERBINDEN = "[data-pro-tresor-verbinden]";

/** @param onVerbinden Weg zum Verbinden-Knopf, wenn er nicht auf derselben Seite liegt (Hilfe → Sicherheit). */
export function ProTresorWoLiegtWas({ open = false, onVerbinden }: { open?: boolean; onVerbinden?: () => void }) {
  const verbinden = onVerbinden || VERBINDEN;
  return <details data-pro-tresor-hilfe open={open} className="wo-liegt-was">
    <summary>Wo liegt was?</summary>
    <OrdnerBaum label="Aufbau des gemeinsamen Tresors" wurzel={{
      titel: "Speicher", unter: "SD-Karte, Gerät, USB-Stick oder Laufwerk",
      kinder: [{
        titel: "Tresor-Hauptordner", unter: "Name frei, z. B. „Family-Projekt“ · erkennbar an tresorordner.json · diesen Ordner wählen", art: "hervor", ziel: verbinden,
        kinder: [
          { titel: PRO_TRESOR_FACH, unter: "Diese App: Familienakte · entsteht beim ersten Original", art: "hervor" },
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
    <p className="pfad-titel"><strong>Verbinden:</strong></p>
    <Pfad teile={[{ text: "Dokumente" }, { text: "Sicherheit & lokaler Tresor" }, { text: "Gemeinsamer Pro-Tresor" }, { text: "Verbinden …", ziel: verbinden }]}/>
    <p className="sr-only">Ein Passwort gilt für alle Pro-Apps. Weg: {PRO_TRESOR_MENUEWEG}</p>
  </details>;
}
