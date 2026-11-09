import type { ReactNode } from "react";
import { Ablaufbild, type AblaufKnoten } from "./ablaufbild";
import { useHilfeVorschau, type Vorschau } from "./hilfe-vorschau";
import { ablaufGlocke, ablaufMeinKalender, ablaufUmzug, ablaufZuGross } from "./hilfe-bilder";
import { Bell, CalendarDays, ChevronsDownUp, Eye, FileStack, FlaskConical, Minimize2, Printer, RefreshCw, Share2, Smartphone, StickyNote, Trash2, Wifi } from "lucide-react";

/**
 * Hilfe zu den Funktionen seit 2.28.20 (Plan 07.11.2026, Paket P1: erst der Inhalt).
 * Kurz, in Punkten, je mit dem Weg in der App. Die Gestaltung (Baum, Sprung mit Rahmen) folgt in P2;
 * darum liegen die Themen als Daten vor.
 */
export type HilfeThema = { id: string; titel: string; symbol: ReactNode; weg: string; punkte: ReactNode[];
  /** Hilfe als Baum (Sitzung 4): Bild und höchstens drei Merkpunkte; die Punkte stehen dann unter „Ausführlich“. */
  ablauf?: AblaufKnoten[]; merk?: ReactNode[] };

export const NEUE_HILFE_THEMEN: HilfeThema[] = [
  { id: "mein-kalender", titel: "Mein Kalender", symbol: <CalendarDays/>, weg: "Kopf › Kalender-Knopf", ablauf: ablaufMeinKalender, merk: [<><b>Alle offenen Fristen</b> nach Tag, je eine Zeile.</>, <><b>Verbundener Kalender</b> zieht Änderungen nach.</>], punkte: [
    "Alle offenen Fristen und Aufgaben nach Tag, mit Uhrzeit und Erinnerung, je als eine Zeile.",
    "Tag antippen, „+ Eintrag“: Titel eintippen oder einsprechen, Uhrzeit, Erinnerung.",
    "Auge öffnet einen Eintrag; dort ändern (Tag, Uhrzeit, Erinnerung, Kalender) oder löschen.",
    "Ist ein Kalender verbunden, zieht er Änderungen nach.",
  ] },
  { id: "app-glocke", titel: "App-Glocke", symbol: <Bell/>, weg: "Mein Kalender › App-Glocke", ablauf: ablaufGlocke, merk: [<><b>Grün = an.</b> Läutet in der App; Android meldet sich auch, wenn sie zu ist.</>, <><b>Aus</b> = keine Meldung mehr, auch nicht oben in der Leiste.</>, <><b>Dauer und Ton</b> wählbar; Ruhemodus kann um Minuten verschieben.</>], punkte: [
    "Ab Werk an, solange kein Kalender verbunden ist; mit Kalender erinnert dieser. Beim Speichern einer Erinnerung geht sie von selbst an.",
    "Sie läutet für jede offene Frist und Aufgabe zu deren Erinnerungen, ohne eigene Wahl zur Vorgabe (1 Woche und 1 Tag vorher). Im Hinweis: 👁 ansehen, ✓ erledigt, OK.",
    "Läutet in der App. Die Android-App meldet sich zusätzlich, auch wenn sie zu ist.",
    "Dauer und Ton sind wählbar; in Android auch über die Einstellung des Geräts.",
    "Android kann eine Meldung im Ruhemodus um einige Minuten verschieben. Nach einem Neustart des Handys wird erst beim Öffnen der App neu geplant.",
    "Ausschalten: Knopf „App-Glocke an“ antippen.",
  ] },
  { id: "notiz", titel: "Knopf „Notiz“", symbol: <StickyNote/>, weg: "Kopf › Notiz", ablauf: [{ titel: "Kopf › Notiz" }, { titel: "Schreiben, sprechen, Foto" }, { titel: "Datum erkannt?", unter: "Vorschlag zur Erinnerung", art: "hervor" }, { titel: "Speichern", art: "gut" }], merk: [<><b>Mikrofon nur auf Tipp.</b></>, <><b>Erinnerung</b> erst nach deinem Ja.</>, <><b>Notizen gehen nie</b> in einen Kalender.</>], punkte: [
    "Schreiben oder das Mikrofon antippen und sprechen. Das Mikrofon startet nie von selbst.",
    "Kamera: Fotos zur Notiz aufnehmen.",
    "Steht ein Datum darin, schlägt die App eine Erinnerung vor. Gespeichert wird erst nach deinem Ja.",
    "Notizen gehen nie in einen Kalender.",
  ] },
  { id: "auge", titel: "Listen mit Leiste", symbol: <Eye/>, weg: "Mein Kalender · Fristenliste · Tagebuch · Notizen", ablauf: [{ titel: "Zeile „Anfang … Hauptwort“" }, { titel: "Pfeil ‹ öffnet", art: "hervor" }, { titel: "✓ ✎ 🗑 👁" }], merk: [<><b>Datum und Uhrzeit</b> links, dann der Text, darunter Art und Glocke.</>, <><b>Am Handy</b> öffnet der Pfeil ‹ die Leiste mit Haken, Stift, Mülleimer und Auge; › schließt sie.</>, <><b>Mülleimer</b> löscht erst beim zweiten Tipp.</>], punkte: [
    "Jeder Eintrag steht als eine Zeile: Datum und Uhrzeit, die ersten Worte … das Hauptwort, darunter Art und Glocke.",
    "Am Handy stecken Haken, Stift, Mülleimer und Auge in einer Leiste am rechten Rand: Pfeil ‹ (oder nach links wischen) öffnet, Pfeil › schließt. Ist genug Platz, stehen die Knöpfe direkt in der Zeile.",
    "Der Stift öffnet sofort das Fenster zum Ändern, auch für reine Erinnerungen (Titel, Tag, Uhrzeit).",
    "Der Mülleimer wird beim ersten Tipp rot („Löschen?“) und löscht beim zweiten.",
    "Der Haken ✓ heißt überall dasselbe: erledigt – in der Fristenliste, in Mein Kalender, in der Notiz-Liste, an der App-Glocke und in der Detailansicht. Danach steht kurz „Rückgängig“ an derselben Stelle.",
    "Eine Erinnerung gehört zu ihrer Aufgabe oder Frist: eine Zeile je Aufgabe, darunter alle 🔔-Zeiten.",
    "Das Auge zeigt den ganzen Text und weitere Angaben, in der Fristenliste auch Zurückstellen und Wieder öffnen.",
  ] },
  { id: "loeschen", titel: "Löschen mit dem Mülleimer", symbol: <Trash2/>, weg: "an Erinnerungen und Notizen", ablauf: [{ titel: "Mülleimer" }, { titel: "Archiviert", unter: "aus den Listen, bleibt im Register", art: "gut" }, { titel: "Kalender-Eintrag", unter: "wird mit entfernt" }], merk: [<><b>Löschen heißt archivieren:</b> der Eintrag verschwindet aus den Listen, bleibt aber im Register und in der Sicherung.</>, <><b>Zurückholen</b> in der App geht noch nicht.</>], punkte: [
    "Gilt für Erinnerungen und Notizen mit Mülleimer: Der Eintrag verschwindet aus den Listen, bleibt aber als „archiviert“ im Register und kommt mit der Vollsicherung mit.",
    "Eine Ansicht zum Ansehen oder Zurückholen archivierter Einträge gibt es noch nicht.",
    "Aussortierte Dokumente: Bibliothek › „Aussortiert“ › Haken › „Zurückholen“ oder „Endgültig löschen …“ (Papierkorb leeren, nur nach Rückfrage; nicht rückgängig).",
    "Ein verbundener Kalender-Eintrag wird dabei entfernt.",
    "Dokumente haben keinen Mülleimer; ihre Originale werden nie gelöscht.",
  ] },
  { id: "einklappen", titel: "Einklappen und Knopf „alle“", symbol: <ChevronsDownUp/>, weg: "Fristen und Aufgaben › Seitenkopf", ablauf: [{ titel: "Tipp auf Überschrift", unter: "auf oder zu" }, { titel: "Knopf „alle“", unter: "Pfeile zeigen die Wirkung", art: "hervor" }, { titel: "Drei Kästchen", unter: "Überfällig · Bald · Offen" }], merk: [<><b>Die Pfeile</b> zeigen, was ein Tipp bewirkt: alle auf oder alle zu.</>, <><b>Die Kästchen</b> filtern die Liste und springen dorthin.</>], punkte: [
    "Tipp auf eine Überschrift klappt den Abschnitt auf oder zu.",
    "Die Pfeile im Knopf „alle“ zeigen, was ein Tipp bewirkt: alle auf oder alle zu.",
    "Die drei Kästchen Überfällig, Bald fällig und Offen filtern die Liste und springen dorthin.",
  ] },
  { id: "neu", titel: "Knopf „Neu“", symbol: <span className="neu-nachbild" aria-hidden="true" data-neu-nachbild><span className="neu-punkt"/>Neu</span>, weg: "Kopf › Neu", ablauf: [{ titel: "Roter Punkt", unter: "es gibt Neues" }, { titel: "Neu öffnen" }, { titel: "×", unter: "blendet aus" }], merk: [<><b>Das Gerät merkt sich</b>, was ausgeblendet ist.</>], punkte: [
    "Ein roter Punkt zeigt: Es gibt etwas Neues zu lesen.",
    "× blendet einen Eintrag aus; das Gerät merkt es sich.",
  ] },
  { id: "demo", titel: "Demo ausprobieren", symbol: <FlaskConical/>, weg: "Hilfe › oben: Demo starten", ablauf: [{ titel: "Hilfe › Demo starten" }, { titel: "Kopie deiner Daten", unter: "sonst Beispielfamilie", art: "hervor" }, { titel: "DEMO ▾", unter: "verlassen · zurücksetzen · löschen" }, { titel: "Übernehmen …", unter: "erst „Was ändert sich?“" }], merk: [<><b>Dein Original bleibt unverändert.</b></>, <><b>Nichts geht nach außen:</b> kein Kalender, keine Glocke, kein Pro-Tresor.</>, <><b>Übernehmen</b> sichert vorher das bisherige Register.</>], punkte: [
    "Hast du eigene Daten, arbeitet die Demo an einer Kopie davon; das Original bleibt unverändert. Ohne eigene Daten zeigt sie eine erfundene Familie.",
    "In der Demo geht nichts nach außen: kein Kalender-Abgleich, keine Glocke, kein Pro-Tresor.",
    "Bei der Kopie gibt es im Menü „Übernehmen …“: erst die Liste „Was ändert sich?“, dann ersetzt die Demo deine Akte; das bisherige Register wird vorher gesichert.",
    "Solange sie läuft, steht hinter dem Namen ein roter Knopf „DEMO ▾“: verlassen · zurücksetzen · löschen.",
    "Die Demo gehört nicht in deine Sicherung.",
  ] },
  { id: "update", titel: "Update und Basic oder Pro", symbol: <RefreshCw/>, weg: "Kopf › rotes Fähnchen „Update verfügbar“ an der Versionszeile", ablauf: [{ titel: "Internet für die App an", unter: "WLAN-Symbol im Kopf" }, { titel: "App prüft selbst", unter: "beim Start und gelegentlich" }, { titel: "Rotes Fähnchen", unter: "an der Versionszeile", art: "hervor" }, { titel: "Antippen: Laden und installieren", art: "gut" }], merk: [<><b>Die App prüft selbst</b> beim Start und gelegentlich, nur bei eingeschaltetem Internet.</>, <><b>Rotes Fähnchen „Update verfügbar“</b> an der Versionszeile antippen; nach dem Update ist es weg.</>, <><b>Die Web-App „Basic“</b> aktualisiert sich über das Fähnchen; die Apps heißen „Pro“.</>], punkte: [
    "Die App prüft selbst, ob es eine neue Fassung gibt: beim Start und gelegentlich, nur wenn das Internet für die App an ist (WLAN-Symbol im Kopf). Einen eigenen Update-Knopf gibt es nicht mehr.",
    "Gibt es eine, steht an der Versionszeile oben unter dem Namen ein rotes Fähnchen „Update verfügbar“ (am Handy „Update“). Antippen bietet die neue Fassung zum Laden und Installieren an; danach ist das Fähnchen weg.",
    "In der Android- und der Windows-App prüft auch ein Tipp auf die Versionszeile selbst, wie bisher. Ist das Internet aus, sagt die App das.",
    "Die Web-App heißt „Basic“; eine neue Fassung lädt sie mit einem Tipp auf das Fähnchen neu. Die Apps heißen „Pro“.",
  ] },
  { id: "teilen", titel: "Teilen an die Familienakte", symbol: <Share2/>, weg: "andere App › Teilen › Familienakte", ablauf: [{ titel: "Andere App › Teilen" }, { titel: "Familienakte wählen" }, { titel: "Eingangszentrale", unter: "zur Prüfung", art: "gut" }], merk: [<><b>Keine Anmeldung nötig</b>; geht mit jedem Mail-Anbieter.</>, <><b>PDF, Fotos, Word, Excel, .eml</b> werden angenommen; .msg (Outlook) am Rechner hineinziehen.</>], punkte: [
    "Aus Mail-App, Galerie, Kamera oder Scanner-App: PDF, Fotos, Word, Excel, E-Mails als .eml. In der Web-App auch .msg; in der Android-App eine .msg-Datei am Rechner in die Eingangszentrale ziehen.",
    "Alles landet zuerst in der Eingangszentrale zur Prüfung.",
    "Keine Anmeldung nötig; geht mit jedem Mail-Anbieter.",
    "Auch andersherum: „Teilen“ an einer Unterlage in der Bibliothek gibt die Datei an eine App deiner Wahl (Mail, Messenger, Dateien). Die Akte verschickt nie von selbst; geschützte Gesundheitsunterlagen haben keinen Teilen-Knopf.",
  ] },
  { id: "workflow-pdf", titel: "Workflow PDF und Stapel", symbol: <FileStack/>, weg: "Dokumente › Workflow PDF · Dokumente › Stapel", ablauf: [{ titel: "Workflow PDF öffnen", unter: "Dokumente" }, { titel: "Ansehen, ordnen, zusammenfügen" }, { titel: "Durchsuchbar machen" }, { titel: "Zurück an denselben Eintrag", art: "gut" }], merk: [<><b>Keine zweite Ablage.</b></>, <><b>Stapel:</b> viele Blätter auf einmal, später einordnen.</>], punkte: [
    "PDF ansehen und bearbeiten, Seiten ordnen, mehrere PDF zusammenfügen.",
    "Gescannte Seiten werden durchsuchbar.",
    "Das Ergebnis geht an denselben Akteneintrag zurück; es entsteht keine zweite Ablage.",
    "Stapel: viele Fotos oder Scans auf einmal aufnehmen, gerade gezogen, und erst später einordnen.",
  ] },
  { id: "drucken", titel: "Drucken", symbol: <Printer/>, weg: "Menü › Seite drucken · am PC Strg+P", ablauf: [{ titel: "Seite öffnen" }, { titel: "Menü › Seite drucken", unter: "am PC: Strg+P", art: "hervor" }, { titel: "Druckdienst des Geräts" }], merk: [<><b>Gedruckt wird die Seite, die gerade offen ist.</b></>, <><b>Im Kopf</b> steht kein Drucker mehr.</>], punkte: [
    "Druckt die Seite, die gerade offen ist.",
    "Am Handy und Tablet: Menü (☰) › „Seite drucken“. Am PC im Browser: Strg+P. Im Kopf steht kein Drucker-Knopf mehr.",
    "Android druckt über den Druckdienst des Geräts.",
  ] },
  { id: "zu-gross", titel: "Datei zu groß für dieses Gerät", symbol: <Minimize2/>, weg: "Eingangszentrale › Zuordnung prüfen", ablauf: ablaufZuGross, merk: [<><b>Sichere Größe:</b> 15, 20 oder 40 MB je nach Gerät; Pro-Tresor 20 MB.</>, <><b>Nur „Verkleinern“ oder „Abbrechen“</b>; das große Original wird nicht aufbewahrt.</>, <><b>PDF mit Textebene</b> lässt sich nicht verkleinern: am Rechner ablegen.</>], punkte: [
    "Jedes Gerät hat eine sichere Größe je Datei, aus der Geräteprüfung: unter 3 GB Arbeitsspeicher 15 MB, 3–6 GB 20 MB, ab 6 GB 40 MB. Im Pro-Tresor höchstens 20 MB.",
    "Ist eine Datei größer, erscheint „Die Datei hat X MB. Dieses Gerät schafft sicher Y MB.“ mit zwei Knöpfen: Verkleinern · Abbrechen.",
    "Verkleinern geht bei Fotos und bei PDF, die nur aus Fotos bestehen: erst Qualität, dann Auflösung, nie unter 300 dpi.",
    "Danach liest die Texterkennung beide Fassungen. Erkennt die kleine weniger als 98 % der Wörter, wird sie verworfen.",
    "Am Eintrag steht „verkleinert von X MB, Text geprüft“. Das große Original wird nicht aufbewahrt.",
    "Ein PDF mit eigener Textebene lässt sich nicht verkleinern: bitte am Rechner ablegen.",
  ] },
  { id: "umzug", titel: "Auf ein neues Gerät umziehen", symbol: <Smartphone/>, weg: "Sicherheit › Familienakte vollständig sichern und testen › Sicherung einlesen", ablauf: ablaufUmzug, merk: [<><b>Ganze Akte:</b> Vollsicherung, dann auf dem neuen Gerät „Sicherung einlesen“. Ist die Akte schon benutzt, wird zusammengeführt.</>, <><b>Weg frei wählbar:</b> USB-Stick, SD-Karte oder Ordner.</>, <><b>Zwei benutzte Geräte:</b> gemeinsame Festplatte (erkennt die Platte an ihrer Kennung) oder Sicherung einlesen; gelöscht wird nichts.</>], punkte: [
    "Die ganze Akte von einem Gerät auf ein anderes bringen: auf dem alten Gerät „Vollständige Sicherung erstellen“, den Sicherungsordner über einen frei gewählten Weg (USB-Stick, SD-Karte, Ordner) mitnehmen, auf dem neuen Gerät „Sicherung einlesen“.",
    "In eine leere Akte wird alles eingelesen. In eine benutzte Akte wird zusammengeführt: Neues kommt dazu, bei Unterschieden wählst du die Fassung (vorgewählt die jüngere), gelöscht wird nichts.",
    "Verschlüsselt (empfohlen): Passwort mit mindestens 10 Zeichen; danach ein Notfallblatt mit einem Schlüssel, der die Sicherung auch ohne Passwort öffnet – ausdrucken, zu den Papieren legen, nie auf dieselbe Festplatte. Ohne Passwort und Blatt sind die Daten unlesbar.",
    "Lesbar bleibt wählbar: dann kann jeder mit dem Ordner alle Unterlagen öffnen – nur für einen Speicher, der zu Hause bleibt.",
    "Nach 7 Tagen ohne Vollsicherung erinnert die App auf der Startseite und im Sicherheitscenter.",
    "Sichern und Einlesen brauchen eine Ordnerwahl: in der Android- oder Windows-App oder am PC in Chrome oder Edge. Die Web-App am Handy oder Tablet kann das nicht.",
    "Nur eine einzelne Unterlage? Sicherheit › „Eine Unterlage an ein anderes Gerät geben“. Einträge, Fristen und Erinnerungen gehen dort nicht mit.",
    "Zwei benutzte Geräte abgleichen – am einfachsten über eine gemeinsame Festplatte: Sicherheit › „Gemeinsame Festplatte“ › einmal „Festplatte vorbereiten“ (Passwort, Notfallblatt), an jedem anderen Gerät „Vorhandene Festplatte verbinden“. Danach erkennt jedes Gerät die Platte an ihrer Kennung und gleicht beim Anstecken ab; bei Unterschieden fragt die App, gelöscht wird nichts.",
    "Ohne Platte im eigenen Netz (WLAN, LAN-Kabel, USB-Kabel mit Netzfreigabe): in der Android- oder Windows-App unter Sicherheit › „Gemeinsame Festplatte“ ein Gerät als Gastgeber einrichten (zeigt einen Code mit 9 Ziffern), am anderen „Mit Gastgeber koppeln“ und den Code eingeben. Danach gleichen die Geräte von selbst ab, sobald sie sich im Netz sehen. Kein Internet, kein fremder Server. Die Web-App im Browser kann im Heimnetz keine anderen Geräte ansprechen – dort bleibt die Festplatte oder die Sicherung.",
    "Ganz ohne Platte und Netz – Paket per Teilen: Sicherheit › „Paket per Teilen“ › „Paket erstellen“ packt die Änderungen seit dem letzten Paket an dieses Gerät (Einträge, Notizen, auf Wunsch Originale bis 100 MB) in eine verschlüsselte Datei und gibt sie an Mail, Messenger oder einen Stick. Am anderen Gerät „Paket einlesen“. Beim ersten Mal ein Passwort und ein Notfallblatt, danach kennen beide Geräte den Schlüssel. Geht auch in der Web-App am Handy.",
    "Oder: auf dem einen Gerät sichern, auf dem anderen „Sicherung einlesen“ – das führt zusammen.",
    "Vorher den Plan durchgehen: Hilfe › Akten sichern – Plan zum Abhaken.",
  ] },
  { id: "internet", titel: "Internet für die App", symbol: <Wifi/>, weg: "Kopf › WLAN-Symbol", ablauf: [{ titel: "WLAN-Symbol im Kopf", unter: "durchgestrichen = aus" }, { titel: "Antippen", unter: "an oder aus", art: "hervor" }, { titel: "Gerät merkt es sich", art: "gut" }], merk: [<><b>Ab Werk aus:</b> die Akte arbeitet ohne Internet.</>, <><b>Braucht Internet:</b> neue Fassung prüfen, Kalender verbinden und abgleichen, Diktat im Browser, Netz (Mycel), Suchmodell laden.</>, <><b>Ausschalten</b> geht jederzeit; nichts geht verloren.</>], punkte: [
    "Das WLAN-Symbol oben im Kopf schaltet das Internet nur für diese App an oder aus. Ab Werk ist es aus; das Gerät merkt sich die Wahl.",
    "Ohne Internet arbeitet die Akte ganz normal: ablegen, suchen, Fristen, Sicherung.",
    "Internet brauchen: auf eine neue Fassung prüfen (Fähnchen „Update verfügbar“ an der Versionszeile), Kalender verbinden und abgleichen (Google, Microsoft), Diktat mit dem Mikrofon im Browser, Netz (Mycel) und das Laden des Suchmodells.",
    "Ist es aus, sagt die App an diesen Stellen: „Internet für die App ist aus“, mit dem Hinweis, wo man es einschaltet.",
  ] },
];

export function HilfeThemaEintrag({ thema: t, vorschau }: { thema: HilfeThema; vorschau?: Vorschau }) {
  const { knopf, schweben, fenster } = useHilfeVorschau(vorschau);
  return <details className="hilfe-thema" data-hilfe-thema={t.id} data-hilfe-bild={t.ablauf ? "" : undefined}>
    <summary {...schweben}>{t.symbol} {t.titel}{knopf}</summary>
    {fenster}
    <div>
      <p className="hilfe-weg">{t.weg}</p>
      {t.ablauf && <Ablaufbild label={t.titel} knoten={t.ablauf}/>}
      {t.merk
        ? <><ul className="kalender-hilfe-punkte hilfe-merk">{t.merk.slice(0, 3).map((p, i) => <li key={i}>{p}</li>)}</ul>
          <details className="hilfe-ausfuehrlich" data-hilfe-ausfuehrlich><summary>Ausführlich</summary><ul className="kalender-hilfe-punkte">{t.punkte.map((p, i) => <li key={i}>{p}</li>)}</ul></details></>
        : <ul className="kalender-hilfe-punkte">{t.punkte.map((p, i) => <li key={i}>{p}</li>)}</ul>}
    </div>
  </details>;
}
