import type { ReactNode } from "react";
import { Ablaufbild, type AblaufKnoten } from "./ablaufbild";
import { ablaufGlocke, ablaufMeinKalender, ablaufUmzug, ablaufZuGross } from "./hilfe-bilder";
import { Bell, CalendarDays, ChevronsDownUp, Eye, FileStack, FlaskConical, Minimize2, Printer, RefreshCw, Share2, Smartphone, StickyNote, Trash2 } from "lucide-react";

/**
 * Hilfe zu den Funktionen seit 2.28.20 (Plan 07.11.2026, Paket P1: erst der Inhalt).
 * Kurz, in Punkten, je mit dem Weg in der App. Die Gestaltung (Baum, Sprung mit Rahmen) folgt in P2;
 * darum liegen die Themen als Daten vor.
 */
export type HilfeThema = { id: string; titel: string; symbol: ReactNode; weg: string; punkte: ReactNode[];
  /** Hilfe als Baum (Sitzung 4): Bild und höchstens drei Merkpunkte; die Punkte stehen dann unter „Ausführlich“. */
  ablauf?: AblaufKnoten[]; merk?: string[] };

export const NEUE_HILFE_THEMEN: HilfeThema[] = [
  { id: "mein-kalender", titel: "Mein Kalender", symbol: <CalendarDays/>, weg: "Kopf › Kalender-Knopf", ablauf: ablaufMeinKalender, merk: ["Alle offenen Fristen und Aufgaben nach Tag, je eine Zeile.", "Ist ein Kalender verbunden, zieht er Änderungen nach."], punkte: [
    "Alle offenen Fristen und Aufgaben nach Tag, mit Uhrzeit und Erinnerung, je als eine Zeile.",
    "Tag antippen, „+ Eintrag“: Titel eintippen oder einsprechen, Uhrzeit, Erinnerung.",
    "Auge öffnet einen Eintrag; dort ändern (Tag, Uhrzeit, Erinnerung, Kalender) oder löschen.",
    "Ist ein Kalender verbunden, zieht er Änderungen nach.",
  ] },
  { id: "app-glocke", titel: "App-Glocke", symbol: <Bell/>, weg: "Mein Kalender › App-Glocke", ablauf: ablaufGlocke, merk: ["Läutet in der App; die Android-App meldet sich auch, wenn sie zu ist.", "Dauer und Ton sind wählbar.", "Android kann im Ruhemodus um Minuten verschieben; nach Neustart erst beim Öffnen neu geplant."], punkte: [
    "Ab Werk aus. Beim Speichern einer Erinnerung geht sie von selbst an.",
    "Läutet in der App. Die Android-App meldet sich zusätzlich, auch wenn sie zu ist.",
    "Dauer und Ton sind wählbar; in Android auch über die Einstellung des Geräts.",
    "Android kann eine Meldung im Ruhemodus um einige Minuten verschieben. Nach einem Neustart des Handys wird erst beim Öffnen der App neu geplant.",
    "Ausschalten: Knopf „App-Glocke an“ antippen.",
  ] },
  { id: "notiz", titel: "Knopf „Notiz“", symbol: <StickyNote/>, weg: "Kopf › Notiz", punkte: [
    "Schreiben oder das Mikrofon antippen und sprechen. Das Mikrofon startet nie von selbst.",
    "Kamera: Fotos zur Notiz aufnehmen.",
    "Steht ein Datum darin, schlägt die App eine Erinnerung vor. Gespeichert wird erst nach deinem Ja.",
    "Notizen gehen nie in einen Kalender.",
  ] },
  { id: "auge", titel: "Listen mit Auge", symbol: <Eye/>, weg: "Mein Kalender · Fristenliste · Tagebuch · Notizen", punkte: [
    "Jeder Eintrag steht als eine Zeile „Anfang … Ende“.",
    "Das Auge öffnet den Eintrag; Ändern und Löschen liegen dahinter.",
    "In der Fristenliste bleibt der Haken „erledigt“ direkt in der Zeile.",
  ] },
  { id: "loeschen", titel: "Löschen mit dem Mülleimer", symbol: <Trash2/>, weg: "an Erinnerungen und Notizen", punkte: [
    "Löschen heißt archivieren. Nichts ist sofort weg.",
    "Ein verbundener Kalender-Eintrag wird dabei entfernt.",
  ] },
  { id: "einklappen", titel: "Einklappen und Knopf „alle“", symbol: <ChevronsDownUp/>, weg: "Fristen und Aufgaben › Seitenkopf", punkte: [
    "Tipp auf eine Überschrift klappt den Abschnitt auf oder zu.",
    "Die Pfeile im Knopf „alle“ zeigen, was ein Tipp bewirkt: alle auf oder alle zu.",
    "Die drei Kästchen Überfällig, Bald fällig und Offen filtern die Liste und springen dorthin.",
  ] },
  { id: "neu", titel: "Knopf „Neu“", symbol: <span className="neu-nachbild" aria-hidden="true" data-neu-nachbild><span className="neu-punkt"/>Neu</span>, weg: "Kopf › Neu", punkte: [
    "Ein roter Punkt zeigt: Es gibt etwas Neues zu lesen.",
    "× blendet einen Eintrag aus; das Gerät merkt es sich.",
  ] },
  { id: "demo", titel: "Demo ausprobieren", symbol: <FlaskConical/>, weg: "Hilfe › oben: Demo starten", punkte: [
    "Hast du eigene Daten, arbeitet die Demo an einer Kopie davon; das Original bleibt unverändert. Ohne eigene Daten zeigt sie eine erfundene Familie.",
    "In der Demo geht nichts nach außen: kein Kalender-Abgleich, keine Glocke, kein Pro-Tresor.",
    "Bei der Kopie gibt es im Menü „Übernehmen …“: erst die Liste „Was ändert sich?“, dann ersetzt die Demo deine Akte; das bisherige Register wird vorher gesichert.",
    "Solange sie läuft, steht hinter dem Namen ein roter Knopf „DEMO ▾“: verlassen · zurücksetzen · löschen.",
    "Die Demo gehört nicht in deine Sicherung.",
  ] },
  { id: "update", titel: "Update und Basic oder Pro", symbol: <RefreshCw/>, weg: "Fuß › Versionszeile antippen", punkte: [
    "In der Android- und der Windows-App prüft ein Tipp, ob es eine neue Fassung gibt, und bietet sie an.",
    "Die Web-App heißt „Basic“ und aktualisiert sich von selbst. Die Apps heißen „Pro“.",
  ] },
  { id: "teilen", titel: "Teilen an die Familienakte", symbol: <Share2/>, weg: "andere App › Teilen › Familienakte", punkte: [
    "Aus Mail-App, Galerie, Kamera oder Scanner-App: PDF, Fotos, Word, Excel, E-Mails als .eml oder .msg.",
    "Alles landet zuerst in der Eingangszentrale zur Prüfung.",
    "Keine Anmeldung nötig; geht mit jedem Mail-Anbieter.",
  ] },
  { id: "workflow-pdf", titel: "Workflow PDF und Stapel", symbol: <FileStack/>, weg: "Dokumente › Workflow PDF · Dokumente › Stapel", punkte: [
    "PDF ansehen und bearbeiten, Seiten ordnen, mehrere PDF zusammenfügen.",
    "Gescannte Seiten werden durchsuchbar.",
    "Das Ergebnis geht an denselben Akteneintrag zurück; es entsteht keine zweite Ablage.",
    "Stapel: viele Fotos oder Scans auf einmal aufnehmen, gerade gezogen, und erst später einordnen.",
  ] },
  { id: "drucken", titel: "Drucken", symbol: <Printer/>, weg: "Kopf › Drucker · am Handy: Menü › Seite drucken", punkte: [
    "Druckt die Seite, die gerade offen ist.",
    "Android druckt über den Druckdienst des Geräts.",
  ] },
  { id: "zu-gross", titel: "Datei zu groß für dieses Gerät", symbol: <Minimize2/>, weg: "Eingangszentrale › Zuordnung prüfen", ablauf: ablaufZuGross, merk: ["Sichere Größe: unter 3 GB Arbeitsspeicher 15 MB, 3–6 GB 20 MB, ab 6 GB 40 MB; Pro-Tresor 20 MB.", "Nur „Verkleinern“ oder „Abbrechen“; das große Original wird nicht aufbewahrt.", "PDF mit eigener Textebene lässt sich nicht verkleinern: am Rechner ablegen."], punkte: [
    "Jedes Gerät hat eine sichere Größe je Datei, aus der Geräteprüfung: unter 3 GB Arbeitsspeicher 15 MB, 3–6 GB 20 MB, ab 6 GB 40 MB. Im Pro-Tresor höchstens 20 MB.",
    "Ist eine Datei größer, erscheint „Die Datei hat X MB. Dieses Gerät schafft sicher Y MB.“ mit zwei Knöpfen: Verkleinern · Abbrechen.",
    "Verkleinern geht bei Fotos und bei PDF, die nur aus Fotos bestehen: erst Qualität, dann Auflösung, nie unter 300 dpi.",
    "Danach liest die Texterkennung beide Fassungen. Erkennt die kleine weniger als 98 % der Wörter, wird sie verworfen.",
    "Am Eintrag steht „verkleinert von X MB, Text geprüft“. Das große Original wird nicht aufbewahrt.",
    "Ein PDF mit eigener Textebene lässt sich nicht verkleinern: bitte am Rechner ablegen.",
  ] },
  { id: "umzug", titel: "Auf ein neues Gerät umziehen", symbol: <Smartphone/>, weg: "Sicherheit › Geräteübergabe", ablauf: ablaufUmzug, merk: ["Weg frei wählbar: USB-Stick oder Ordner.", "Vorher sichern: Hilfe › Akten sichern – Plan zum Abhaken."], punkte: [
    "Die Akte von einem Gerät auf ein anderes bringen, über einen frei gewählten Weg (USB-Stick, Ordner).",
    "Vorher eine Sicherung anlegen: Hilfe › Akten sichern – Plan zum Abhaken.",
  ] },
];

export function HilfeThemaEintrag({ thema: t }: { thema: HilfeThema }) {
  return <details className="hilfe-thema" data-hilfe-thema={t.id} data-hilfe-bild={t.ablauf ? "" : undefined}>
    <summary>{t.symbol} {t.titel}</summary>
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
