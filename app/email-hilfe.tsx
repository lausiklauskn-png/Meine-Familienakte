import { Mail } from "lucide-react";
import { useMemo } from "react";
import { KartenLegende, Landkarte, type KartenGruppe, type KartenKante, type KartenKnoten } from "./landkarte";

/**
 * Hilfe „E-Mail in die Familienakte“ (Klaus 07.11.2026, Sitzung 3) im Stil der Landkarte (Vorbild Sage-Modul-Topologie):
 * links die Wege hinein als kleine Knöpfe im Container „Mail einfügen“, in der Mitte Eingangszentrale und Prüfung, rechts Akte
 * und Antworten. Was noch nicht gebaut ist, steht gestrichelt mit „geplant“ – der E-Mail-Plan wird erst besprochen.
 * Die Prüfung soll den Prüfkern aus Workflow PDF nutzen (dateiPruefen in app/wfpdf-kern.ts), keine zweite Fassung.
 */
export function EmailHilfe({ onEingang, onSchreiben }: { onEingang: () => void; onSchreiben: () => void }) {
  const { gruppen, knoten, kanten } = useMemo(() => {
    const gruppen: KartenGruppe[] = [
      { id: "mail", titel: "Mail einfügen", wo: "aus der Mail-App oder dem Postfach", spalte: 0, chips: [
        { id: "mail-text", titel: "Mail teilen", wo: "Mail-App › Teilen", nach: "eingang", mehr: "Gmail- und Outlook-App teilen nur den Text; Anhänge gehen so nicht mit." },
        { id: "mail-anhang", titel: "Anhang teilen", wo: "Anhang antippen › Teilen", nach: "eingang", mehr: "Der übliche Weg für Briefe als PDF." },
        { id: "mail-pdf", titel: "Mail als PDF", wo: "Drucken › Als PDF › Teilen", nach: "eingang", mehr: "Geht mit jeder Mail-App." },
        { id: "mail-eml", titel: "Mail als Datei (.eml)", wo: "am Rechner hineinziehen", nach: "eingang", mehr: "Gmail oder Outlook im Browser: „Herunterladen“; Thunderbird: „Speichern unter“. Outlook-Dateien (.msg) werden angenommen, ihre Anhänge noch nicht herausgelöst." },
        { id: "mail-ms", titel: "Microsoft-Postfach", wo: "abholen und senden", nach: "eingang", beide: true, stand: "geplant", mehr: "Gleiche Anmeldung wie beim Kalender. Abholen nur auf Tipp; im Postfach wird nichts gelöscht oder verschoben." },
        { id: "mail-imap", titel: "GMX · WEB.DE · T-Online", wo: "mit App-Passwort", nach: "eingang", stand: "geplant", mehr: "Die Technik liegt in Private Brain Pro. Das Passwort bliebe verschlüsselt auf dem Gerät." },
        { id: "mail-gmail", titel: "Gmail direkt", wo: "Google-Prüfung kostet jährlich", nach: "eingang", stand: "geplant", mehr: "Bis zu einer Entscheidung: Anhang teilen oder Mail als PDF." },
      ] },
      { id: "antwort", titel: "Antworten", wo: "Assistenz › Schreiben / E-Mail", spalte: 5, chips: [
        { id: "antwort-entwurf", titel: "Entwurf schreiben und prüfen", wo: "Korrespondenzzentrale", ziel: onSchreiben, zielText: "Zur Korrespondenzzentrale", mehr: "Heute: Entwurf, Prüf-Haken, „Als versendet speichern“. Die App verschickt nie still." },
      ] },
    ];
    const knoten: KartenKnoten[] = [
      { id: "eingang", titel: "Eingangszentrale", wo: "Dokumente › Eingangszentrale", unter: "alles kommt zuerst hier an · Anhänge einzeln", spalte: 1, mitte: true, ziel: onEingang, zielText: "Zur Eingangszentrale",
        mehr: "Das Original bleibt unverändert. Doppelte Dateien werden erkannt. Die Mail selbst wird nur als Text gezeigt: kein Skript, keine Bilder aus dem Netz, kein Link öffnet sich von selbst." },
      { id: "pruefung", titel: "Prüfung jeder Anlage", wo: "in der Eingangszentrale", unter: "Prüfer aus Workflow PDF", spalte: 2, stand: "geplant",
        mehr: "Sucht Skripte und Startaktionen im PDF, eingebettete Dateien, Makros, getarnte Endungen (z. B. „rechnung.pdf.exe“) und Programme. Kein Virenscanner: die App öffnet nichts von selbst und sagt, was sie findet." },
      { id: "echt", titel: "Echtes PDF, ohne Befund", wo: "Eingangszentrale › Zuordnung", unter: "Text direkt lesen · ohne Workflow PDF", spalte: 3, stand: "geplant", mehr: "Ein PDF mit Textebene (Amt, Kasse, Praxis) braucht keinen Umweg über Workflow PDF." },
      { id: "scan", titel: "Scan oder Foto", wo: "Eingangszentrale › Zuordnung", unter: "Texterkennung wie heute", spalte: 3, mehr: "Auf Wunsch vorher in Workflow PDF gerade ziehen." },
      { id: "befund", titel: "Befund gefunden", wo: "in der Eingangszentrale", unter: "nicht geöffnet · du entscheidest", spalte: 3, stand: "geplant", warn: true, mehr: "Der Grund steht dabei. Als Datei ablegen (ohne Vorschau) oder weglassen." },
      { id: "programm", titel: "Programm (.exe, .apk …)", wo: "in der Eingangszentrale", unter: "wird nicht übernommen", spalte: 3, stand: "geplant", warn: true },
      { id: "akte", titel: "In der Akte", wo: "Gesundheit, Familie, Wohnen …", unter: "Vorschlag, dann ein Tipp · Mail und Anhänge verknüpft", spalte: 4, mitte: true, mehr: "Person, Vorgang, Dokumentart und mögliche Frist werden vorgeschlagen. Eine Frist wird nur nach deinem Ja zur Erinnerung. Speicher wie gewählt." },
      { id: "mail-app", titel: "Mail-App des Geräts", wo: "öffnet sich vorbereitet", unter: "abschicken tust du dort", spalte: 6, stand: "geplant", mehr: "Empfänger, Betreff, Text und Anlagen werden vorbereitet. Danach fragt die App, ob du abgeschickt hast." },
      { id: "ms-senden", titel: "Microsoft-Postfach", wo: "nach „Jetzt senden?“", unter: "liegt dann in „Gesendete Elemente“", spalte: 6, stand: "geplant" },
    ];
    const kanten: KartenKante[] = [
      { von: "eingang", nach: "pruefung" }, { von: "pruefung", nach: "echt" }, { von: "pruefung", nach: "scan" }, { von: "pruefung", nach: "befund" }, { von: "pruefung", nach: "programm" },
      { von: "echt", nach: "akte" }, { von: "scan", nach: "akte" }, { von: "akte", nach: "antwort-entwurf" },
      { von: "antwort-entwurf", nach: "mail-app" }, { von: "antwort-entwurf", nach: "ms-senden" },
    ];
    return { gruppen, knoten, kanten };
  }, [onEingang, onSchreiben]);

  return <details data-email-hilfe className="wo-liegt-was email-hilfe">
    <summary><Mail/> E-Mail in die Familienakte</summary>
    <div>
      <p>Links die Wege hinein, dann Eingangszentrale und Prüfung, rechts Akte und Antworten. Grüner Rahmen: fertig. Grau gestrichelt: geplant, wird vor dem Bau besprochen.</p>
      <KartenLegende/>
      <Landkarte id="email" label="Wie E-Mails und Anhänge in die Akte kommen und wie man antwortet" gruppen={gruppen} knoten={knoten} kanten={kanten}
        breiten={[236, 176, 176, 176, 176, 236, 176]}/>
      <ul className="merkpunkte">
        <li><strong>Nichts geht still hinaus.</strong> Gesendet wird nur auf deinen Befehl.</li>
        <li><strong>Keine Virenprüfung.</strong> Die App öffnet keine Anlage von selbst und warnt bei Auffälligem.</li>
        <li><strong>Gesundheit im Betreff</strong> lieber neutral halten; E-Mails sind unterwegs nicht verschlüsselt.</li>
      </ul>
    </div>
  </details>;
}
