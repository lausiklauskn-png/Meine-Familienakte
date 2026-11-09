import { CalendarClock } from "lucide-react";
import { Ablaufbild } from "./ablaufbild";

/** Hilfe → „Fristen im Kalender“ (Klaus 2026-11-05): kurz, in Punkten, mit Ablaufbild. Kästen springen zur Karte. */
export function KalenderHilfe({ zurKarte }: { zurKarte: () => void }) {
  return <details className="kalender-hilfe" data-kalender-hilfe>
    <summary><CalendarClock/> Fristen im Kalender</summary>
    <div>
      <Ablaufbild label="Fristen in den Kalender" knoten={[
        { titel: "Kalender verbinden", unter: "Fristen und Aufgaben → Kalender verbinden", ziel: zurKarte, art: "hervor" },
        { titel: "Frist anlegen", unter: "Haken „In den Kalender eintragen“, Erinnerung wählen" },
        { titel: "Im Kalender", unter: "mit Erinnerung; erledigte werden entfernt", art: "gut" },
        { titel: "Termine holen (Schritt 5)", unter: "Termine des Kalenders werden Fristen; Gelöschtes wird archiviert, bei Unterschieden fragt die App" },
      ]}/>
      <ul className="kalender-hilfe-punkte">
        <li><strong>Android-App:</strong> „Kalender auf diesem Gerät“ – Samsung-, Google- und Outlook-Kalender des Geräts. Einmal „Kalender“ erlauben. Den Abgleich mit Google oder Samsung macht das Gerät.</li>
        <li><strong>Windows und Browser:</strong> Google- oder Microsoft-Konto anmelden. Die Anmeldung gilt bis zum Schließen und wird nicht gespeichert. Internet für die App muss an sein.</li>
        <li><strong>Kalenderdatei (.ics):</strong> überall; die Datei mit allen gewählten Fristen in Outlook, der Kalender-App oder Google öffnen. Nach Änderungen neu ausgeben.</li>
        <li><strong>Ohne Uhrzeit</strong> steht eine Frist um 9 Uhr im Kalender. Erinnern wählbar: 1 Woche, 2 Tage oder 1 Tag vorher, auch mehrere; dazu „am Tag, 9 Uhr“.</li>
        <li><strong>Microsoft</strong> kennt eine Erinnerung je Termin: es gilt die früheste. <strong>Samsung-Kalender</strong> nur über die Android-App.</li>
        <li><strong>Was hinausgeht:</strong> Titel, Datum, Uhrzeit und Erinnerung – auch bei Arzt- und Gesundheitsterminen. Notizen gehen nie in den Kalender.</li>
        <li><strong>Nichts geht still hinaus:</strong> nur angehakte Fristen. „Trennen“ fragt, ob die Termine im Kalender bleiben.</li>
      </ul>
    </div>
  </details>;
}
