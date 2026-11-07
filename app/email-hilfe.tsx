import { Mail } from "lucide-react";
import { Flussbaum, type FlussAst } from "./flussbaum";

/**
 * Hilfe „E-Mail in die Familienakte“ (Klaus 07.11.2026, Sitzung 3): wie eine Mail und ihre Anhänge in die Akte kommen,
 * geprüft werden und wie man antwortet. Teile, die noch nicht gebaut sind, stehen gestrichelt mit „geplant“ – der Plan
 * wird besprochen (docs/vorschau/email-plan-2.28.35.html), erst danach gebaut. Die Prüfung nutzt den Prüfkern aus
 * Workflow PDF (dateiPruefen in app/wfpdf-kern.ts), keine eigene zweite Fassung.
 */
export function EmailHilfe({ onEingang, onSchreiben }: { onEingang: () => void; onSchreiben: () => void }) {
  const mitte: FlussAst = { id: "eingang", titel: "Eingangszentrale", unter: "alles kommt zuerst hier an · nichts ohne deinen Tipp",
    mehr: "Das Original bleibt unverändert. Doppelte Dateien werden erkannt.", ziel: onEingang, zielText: "Zur Eingangszentrale" };

  const links: FlussAst[] = [
    { id: "teilen-text", titel: "Mail-App › Teilen", unter: "der Text der Mail kommt an",
      mehr: "Gmail- und Outlook-App teilen nur den Text. Anhänge gehen so nicht mit – dafür den Anhang selbst teilen." },
    { id: "teilen-anhang", titel: "Anhang › Teilen", unter: "PDF oder Foto aus der Mail",
      mehr: "In der Mail den Anhang antippen, dann Teilen › Familienakte. Das ist der übliche Weg für Briefe als PDF." },
    { id: "als-pdf", titel: "Mail › Drucken › als PDF", unter: "die ganze Mail als PDF, dann teilen",
      mehr: "Geht mit jeder Mail-App: Drucken, „Als PDF speichern“, die Datei an die Familienakte teilen." },
    { id: "als-datei", titel: "Mail als Datei (.eml)", unter: "am Rechner herunterladen und hineinziehen",
      mehr: "Gmail und Outlook im Browser: „Herunterladen“; Thunderbird: „Speichern unter“. Die App löst die Anhänge heraus. Outlook-Dateien (.msg) werden angenommen, ihre Anhänge aber noch nicht herausgelöst." },
    { id: "microsoft", titel: "Microsoft-Postfach", unter: "Outlook, Hotmail · abholen und senden", stand: "geplant", richtung: "beide",
      mehr: "Gleiche Anmeldung wie beim Kalender. Abholen nur auf Tipp; im Postfach wird nichts gelöscht oder verschoben. Senden erst nach „Jetzt senden?“." },
    { id: "imap", titel: "GMX, WEB.DE, T-Online", unter: "abholen mit App-Passwort", stand: "spaeter",
      mehr: "Die Technik liegt in Private Brain Pro und kann übernommen werden. Das Passwort bleibt verschlüsselt auf dem Gerät." },
    { id: "gmail", titel: "Gmail direkt", unter: "Google verlangt eine jährliche, bezahlte Prüfung", stand: "nicht",
      mehr: "Bis zu einer Entscheidung: Anhang teilen oder Mail als PDF." },
  ];

  const weiter = "Vorschlag: Person, Vorgang, Dokumentart, mögliche Frist";
  const rechts: FlussAst[] = [
    { id: "herausloesen", titel: "Anhänge herauslösen", unter: "Mail und jeder Anhang einzeln",
      mehr: "Die Mail selbst wird nur als Text gezeigt: kein Skript, keine Bilder aus dem Netz, kein Link öffnet sich von selbst.", kinder: [
        { id: "pruefen", titel: "Prüfung jeder Anlage", unter: "Prüfer aus Workflow PDF", stand: "geplant",
          mehr: "Sucht Skripte und Startaktionen im PDF, eingebettete Dateien, Makros, getarnte Endungen (z. B. „rechnung.pdf.exe“) und Programme. Kein Virenscanner: die App öffnet nichts von selbst und sagt, was sie findet.", kinder: [
            { id: "echt", titel: "Echtes PDF, ohne Befund", unter: "Text direkt lesen · ohne Workflow PDF", stand: "geplant",
              mehr: "Ein PDF mit Textebene (z. B. vom Amt, der Kasse, einer Praxis) braucht keinen Umweg über Workflow PDF.", kinder: [
                { id: "ein-tipp", titel: "Übernehmen mit einem Tipp", unter: weiter, stand: "geplant", kinder: [
                  { id: "akte", titel: "In der Akte", unter: "Mail und Anhänge verknüpft · Speicher wie gewählt",
                    mehr: "Eine erkannte Frist wird nur nach deinem Ja zur Erinnerung." },
                ] },
              ] },
            { id: "scan", titel: "Scan oder Foto", unter: "Texterkennung wie heute · auf Wunsch Workflow PDF",
              mehr: "Danach derselbe Weg: Vorschlag, dein Tipp, Akte." },
            { id: "befund", titel: "Befund gefunden", unter: "nicht geöffnet · du entscheidest", stand: "geplant", warnung: true,
              mehr: "Der Grund steht dabei. Du wählst: als Datei ablegen (ohne Vorschau) oder weglassen." },
            { id: "programm", titel: "Programm (.exe, .apk …)", unter: "wird nicht übernommen", stand: "geplant", warnung: true },
          ] },
      ] },
    { id: "antworten", titel: "Antwort schreiben", unter: "Korrespondenzzentrale · Entwurf prüfen", ziel: onSchreiben, zielText: "Zur Korrespondenzzentrale",
      mehr: "Heute: Entwurf, Prüf-Haken, „Als versendet speichern“. Die App verschickt nie still.", kinder: [
        { id: "mail-app", titel: "In der Mail-App öffnen", unter: "abschicken tust du dort", stand: "geplant",
          mehr: "Empfänger, Betreff, Text und Anlagen werden vorbereitet. Danach fragt die App, ob du abgeschickt hast." },
        { id: "ms-senden", titel: "Über Microsoft senden", unter: "nach „Jetzt senden?“", stand: "geplant",
          mehr: "Die Mail liegt danach in „Gesendete Elemente“ deines Postfachs." },
      ] },
  ];

  return <details data-email-hilfe className="wo-liegt-was email-hilfe">
    <summary><Mail/> E-Mail in die Familienakte</summary>
    <div>
      <p>Links die Wege hinein, in der Mitte die Eingangszentrale, rechts was danach geschieht. Gestrichelte Kästen sind geplant und werden vor dem Bau besprochen.</p>
      <Flussbaum label="Wie E-Mails und Anhänge in die Akte kommen" mitte={mitte} links={links} rechts={rechts} legende={
        <p className="fb-legende">
          <span><i className="fb-muster" aria-hidden="true"/> geht heute</span>
          <span><i className="fb-muster fb-geplant" aria-hidden="true"/> geplant</span>
          <span><i className="fb-muster fb-spaeter" aria-hidden="true"/> später</span>
          <span><i className="fb-muster art-warnung" aria-hidden="true"/> Vorsicht</span>
          <span>→ nur eine Richtung</span><span>⇄ hin und zurück</span>
        </p>}/>
      <ul className="merkpunkte">
        <li><strong>Nichts geht still hinaus.</strong> Gesendet wird nur auf deinen Befehl.</li>
        <li><strong>Keine Virenprüfung.</strong> Die App öffnet keine Anlage von selbst und warnt bei Auffälligem.</li>
        <li><strong>Gesundheit im Betreff</strong> lieber neutral halten; E-Mails sind unterwegs nicht verschlüsselt.</li>
      </ul>
    </div>
  </details>;
}
