import { Mail } from "lucide-react";
import { useMemo } from "react";
import { MAIL_WEGE } from "../lib/app-landkarte";
import { standVon } from "../lib/app-stand";
import { KartenLegende, Landkarte, type KartenGruppe, type KartenKante, type KartenKnoten, type KartenPunkt } from "./landkarte";

/**
 * Hilfe „E-Mail in die Familienakte“ (Klaus 07.11.2026, Sitzung 3) im Stil der Landkarte (Vorbild Sage-Modul-Topologie):
 * links die Wege hinein als kleine Knöpfe im Container „Mail einfügen“, in der Mitte Eingangszentrale und Prüfung, rechts Akte
 * und Antworten. Was noch nicht gebaut ist, steht gestrichelt mit „geplant“ (2.28.65: Private Brain, Mail-App und Microsoft gebaut).
 * Wege hinein und Stand kommen aus lib/app-landkarte.ts und lib/app-stand.ts (eine Liste für alle Karten).
 * Die Prüfung soll den Prüfkern aus Workflow PDF nutzen (dateiPruefen in app/wfpdf-kern.ts), keine zweite Fassung.
 */
export function EmailHilfe({ onEingang, onSchreiben }: { onEingang: () => void; onSchreiben: () => void }) {
  const { gruppen, knoten, kanten } = useMemo(() => {
    const gruppen: KartenGruppe[] = [
      { id: "mail", titel: "Mail einfügen", wo: "aus der Mail-App oder dem Postfach", spalte: 0, chips: MAIL_WEGE },
      { id: "antwort", titel: "Antworten", wo: "Assistenz › Schreiben / E-Mail", spalte: 5, chips: [
        { id: "antwort-entwurf", titel: "Entwurf schreiben und prüfen", wo: "Korrespondenzzentrale", ziel: onSchreiben, zielText: "Zur Korrespondenzzentrale", mehr: "Entwurf, Prüf-Haken, dann „In der Mail-App öffnen“ oder „Über Microsoft senden“ (Wahl unter Eingangszentrale › E-Mail). Die App verschickt nie still." },
      ] },
    ];
    const knoten: KartenKnoten[] = [
      { id: "eingang", titel: "Eingangszentrale", wo: "Dokumente › Eingangszentrale", unter: "alles kommt zuerst hier an · Anhänge einzeln", spalte: 1, mitte: true, ziel: onEingang, zielText: "Zur Eingangszentrale",
        mehr: "Das Original bleibt unverändert. Doppelte Dateien werden erkannt. Die Mail selbst wird nur als Text gezeigt: kein Skript, keine Bilder aus dem Netz, kein Link öffnet sich von selbst." },
      { id: "pruefung", titel: "Prüfung jeder Anlage", wo: "in der Eingangszentrale", unter: "Prüfer aus Workflow PDF", spalte: 2,
        mehr: "Sucht Skripte und Startaktionen im PDF, eingebettete Dateien, Makros, getarnte Endungen (z. B. „rechnung.pdf.exe“) und Programme. Kein Virenscanner: die App öffnet nichts von selbst und sagt, was sie findet." },
      { id: "echt", titel: "Echtes PDF, ohne Befund", wo: "Eingangszentrale › Zuordnung", unter: "Text direkt lesen · ohne Workflow PDF", spalte: 3, mehr: "Ein PDF mit Textebene (Amt, Kasse, Praxis) braucht keinen Umweg über Workflow PDF." },
      { id: "scan", titel: "Scan oder Foto", wo: "Eingangszentrale › Zuordnung", unter: "Texterkennung wie heute", spalte: 3, mehr: "Auf Wunsch vorher in Workflow PDF gerade ziehen." },
      { id: "befund", titel: "Befund gefunden", wo: "in der Eingangszentrale", unter: "nicht geöffnet · du entscheidest", spalte: 3, warn: true, mehr: "Der Grund steht dabei. Als Datei ablegen (ohne Vorschau) oder weglassen." },
      { id: "programm", titel: "Programm (.exe, .apk …)", wo: "in der Eingangszentrale", unter: "wird nicht übernommen", spalte: 3, warn: true },
      { id: "akte", titel: "In der Akte", wo: "Gesundheit, Familie, Wohnen …", unter: "Vorschlag, dann ein Tipp · Mail und Anhänge verknüpft", spalte: 4, mitte: true, mehr: "Person, Vorgang, Dokumentart und mögliche Frist werden vorgeschlagen. Eine Frist wird nur nach deinem Ja zur Erinnerung. Speicher wie gewählt." },
      { id: "mailapp", titel: "Mail-App des Geräts", wo: "öffnet sich vorbereitet", unter: "abschicken tust du dort", spalte: 6, mehr: "Empfänger, Betreff, Text und Anlagen werden vorbereitet. Danach fragt die App, ob du abgeschickt hast." },
      { id: "mssend", titel: "Microsoft-Postfach", wo: "nach „Jetzt senden?“", unter: "liegt dann in „Gesendete Elemente“", spalte: 6 },
    ];
    const kanten: KartenKante[] = [
      { von: "eingang", nach: "pruefung" }, { von: "pruefung", nach: "echt" }, { von: "pruefung", nach: "scan" }, { von: "pruefung", nach: "befund" }, { von: "pruefung", nach: "programm" },
      { von: "echt", nach: "akte" }, { von: "scan", nach: "akte" },
      // Heutiger Weg, solange die Prüfung jeder Anlage geplant ist (U13): direkt zu „Scan oder Foto“ (Texterkennung wie heute).
      { von: "eingang", nach: "scan", unten: true }, { von: "akte", nach: "antwort-entwurf" },
      { von: "antwort-entwurf", nach: "mailapp" }, { von: "antwort-entwurf", nach: "mssend" },
    ];
    const mitStand = <T extends KartenPunkt>(p: T): T => ({ ...p, stand: standVon(p.id, new Set()) });
    return { gruppen: gruppen.map((g) => ({ ...g, chips: g.chips.map(mitStand) })), knoten: knoten.map(mitStand), kanten };
  }, [onEingang, onSchreiben]);

  return <details data-email-hilfe className="wo-liegt-was email-hilfe">
    <summary><Mail/> E-Mail in die Familienakte</summary>
    <div>
      <p>Links die Wege hinein, rechts Akte und Antworten.</p>
      <KartenLegende fuer="email"/>
      <Landkarte id="email" label="Wie E-Mails und Anhänge in die Akte kommen und wie man antwortet" gruppen={gruppen} knoten={knoten} kanten={kanten}
        breiten={[236, 176, 176, 176, 176, 236, 176]}/>
      <ul className="merkpunkte">
        <li><strong>Nichts geht still hinaus.</strong> Gesendet wird nur auf deinen Befehl.</li>
        <li><strong>Keine Virenprüfung.</strong> Die App öffnet keine Anlage von selbst. Prüfen kann der Stapel auf Wahl.</li>
        <li><strong>Gesundheit im Betreff</strong> lieber neutral halten; E-Mails sind unterwegs nicht verschlüsselt – die App meldet solche Wörter.</li>
        <li><strong>Wege wählen</strong> unter Eingangszentrale › E-Mail: Private Brain Pro (empfohlen), Teilen, Microsoft; hinaus über die Mail-App oder Microsoft.</li>
      </ul>
    </div>
  </details>;
}
