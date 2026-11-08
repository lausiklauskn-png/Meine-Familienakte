import type { ReactNode } from "react";
import { standVon } from "../lib/app-stand";
import { Ablaufbild, zurKarte, zurStelle, type AblaufKnoten } from "./ablaufbild";
import { useHilfeVorschau, type Vorschau } from "./hilfe-vorschau";
import { Landkarte, type KartenGruppe, type KartenKante, type KartenKnoten, type KartenPunkt } from "./landkarte";
import type { SectionId } from "./portal-types";

/**
 * Hilfe als Baum, Welle 1 (Klaus 07.11.2026, Sitzung 4, Fragen D und E): ein Bild je Thema (Ablauf bei Schritten, Karte bei
 * Verbindungen), höchstens drei Merkpunkte, der bisherige Text eingeklappt unter „Ausführlich“ – die Suche findet ihn weiter.
 */
export function BildThema({ id, symbol, titel, weg, bild, merk, ausfuehrlich, ziel, vorschau }: { id: string; symbol: ReactNode; titel: string; weg?: ReactNode;
  bild: ReactNode; merk: ReactNode[]; ausfuehrlich?: ReactNode; ziel?: { text: string; los: () => void }; vorschau?: Vorschau }) {
  const { knopf, schweben, fenster } = useHilfeVorschau(vorschau);
  return <details className="hilfe-thema hilfe-bild" data-hilfe-thema={id} data-hilfe-bild>
    <summary {...schweben}>{symbol} {titel}{knopf}</summary>
    {fenster}
    <div>
      {weg && <p className="hilfe-weg">{weg}</p>}
      {bild}
      <ul className="kalender-hilfe-punkte hilfe-merk">{merk.slice(0, 3).map((m, i) => <li key={i}>{m}</li>)}</ul>
      {ausfuehrlich && <details className="hilfe-ausfuehrlich" data-hilfe-ausfuehrlich><summary>Ausführlich</summary><div>{ausfuehrlich}</div></details>}
      {ziel && <button type="button" className="button secondary hilfe-bild-ziel" onClick={ziel.los}>{ziel.text} ›</button>}
    </div>
  </details>;
}

/** Kästen nebeneinander ohne Pfeile: Gegenüberstellungen (Farben, erlaubt/nicht erlaubt). Kästen mit Ziel springen. */
export function KastenReihe({ knoten, label }: { knoten: AblaufKnoten[]; label: string }) {
  return <ul className="kastenreihe" aria-label={label} data-kastenreihe>
    {knoten.map((k) => <li key={k.titel}>{k.ziel
      ? <button type="button" className={`ablauf-knoten art-${k.art || "normal"} ablauf-link`} onClick={() => zurStelle(k.ziel!)} title={`${k.titel} – hierhin springen`}><span className="ablauf-text"><strong>{k.titel}</strong>{k.unter && <small>{k.unter}</small>}</span><span className="ablauf-pfeil" aria-hidden="true">›</span></button>
      : <div className={`ablauf-knoten art-${k.art || "normal"}`}><span className="ablauf-text"><strong>{k.titel}</strong>{k.unter && <small>{k.unter}</small>}</span></div>}</li>)}
  </ul>;
}

/** Sprung zu einer Seite und, wenn genannt, zur Karte mit diesem Titel (roter Rahmen). */
export const sprung = (onGo: (id: SectionId) => void, seite: SectionId, karte?: string) => () => {
  onGo(seite);
  if (karte) window.setTimeout(() => zurKarte(karte), 500);
};

type Geh = (id: SectionId) => void;
const zu = (onGo: Geh, id: SectionId) => () => onGo(id);

export const ablaufEingang = (onGo: Geh): AblaufKnoten[] => [
  { titel: "Hinein", unter: "Datei wählen · hineinziehen · teilen · fotografieren", ziel: zu(onGo, "inbox") },
  { titel: "Eingänge prüfen", unter: "Typ, Text, Doppeltes", art: "hervor" },
  { titel: "Zuordnung prüfen", unter: "Person, Vorgang, mögliche Frist" },
  { titel: "In der Akte", unter: "erst nach deinem Tipp", art: "gut" },
];
export const ablaufFoto = (onGo: Geh): AblaufKnoten[] => [
  { titel: "Dokument fotografieren", unter: "Neue Unterlagen erfassen", ziel: zu(onGo, "inbox") },
  { titel: "Seiten prüfen", unter: "drehen · zuschneiden · ordnen · neu aufnehmen" },
  { titel: "Fertig – PDF erstellen", unter: "alle Seiten in einer PDF", art: "hervor" },
  { titel: "Dokumentenprüfung", unter: "Bereich, Vorgang, Doppeltes", art: "gut" },
];
export const ablaufZuGross: AblaufKnoten[] = [
  { titel: "Datei kommt an", unter: "Eingangszentrale" },
  { titel: "Größer als sicher?", unter: "Gerät schafft 15, 20 oder 40 MB", art: "warnung" },
  { titel: "Verkleinern", unter: "nie unter 300 dpi" },
  { titel: "Text gegenprüfen", unter: "mindestens 98 % gleich", art: "gut" },
];
export const ablaufExport = (onGo: Geh): AblaufKnoten[] => [
  { titel: "Familienakte exportieren", unter: "Sicherheit und lokaler Tresor", ziel: zu(onGo, "security") },
  { titel: "Bereiche und Zielordner wählen" },
  { titel: "Neuer Ordner", unter: "Übersicht · Datendatei · Bericht", art: "gut" },
];
export const ablaufUmzug: AblaufKnoten[] = [
  { titel: "Altes Gerät: Vollsicherung", unter: "Sicherheit › Vollständige Sicherung erstellen" },
  { titel: "USB-Stick, SD-Karte oder Ordner", unter: "frei gewählter Weg" },
  { titel: "Neues Gerät: App installieren", unter: "Akte bleibt leer" },
  { titel: "Sicherung einlesen", unter: "Sicherheit › erst Probe, dann einlesen", art: "gut" },
];
export const ablaufMeinKalender: AblaufKnoten[] = [
  { titel: "Kalender-Knopf", unter: "oben im Kopf" },
  { titel: "Tag antippen" },
  { titel: "+ Eintrag", unter: "Titel, Uhrzeit, Erinnerung", art: "hervor" },
  { titel: "Auge", unter: "ändern oder löschen" },
];
export const ablaufGlocke: AblaufKnoten[] = [
  { titel: "Erinnerung speichern" },
  { titel: "Glocke geht an", unter: "ab Werk aus", art: "hervor" },
  { titel: "Läutet", unter: "in der App · Android auch geschlossen", art: "gut" },
  { titel: "Ausschalten", unter: "Knopf „App-Glocke an“" },
];
export const ablaufAssistenz = (onGo: Geh): AblaufKnoten[] => [
  { titel: "Frage oder Vorgang", unter: "Assistenz", ziel: zu(onGo, "assistant") },
  { titel: "Antwort in drei Teilen", unter: "aus der Akte · recherchiert · Vorschlag" },
  { titel: "Entwurf prüfen", unter: "Empfänger, Inhalt, Anlagen", art: "hervor" },
  { titel: "Selbst versenden", unter: "dann „Als versendet speichern“", art: "gut" },
];

const mitStand = (eingerichtet: ReadonlySet<string>) => <T extends KartenPunkt>(p: T): T => ({ ...p, stand: p.stand || standVon(p.id, eingerichtet) });

/** Karte „Sichern“: Vollsicherung, Export und Umzug auf einen Blick. */
export function SichernKarte({ onGo }: { onGo: Geh }) {
  const s = () => onGo("security");
  const knoten: KartenKnoten[] = [
    { id: "s-akte", titel: "Deine Akte", wo: "Register, Einträge, Dateien", spalte: 0, mitte: true },
    { id: "s-voll", titel: "Vollsicherung", wo: "Sicherheit › sichern und testen", unter: "alles, mit Prüfsummen", spalte: 1, ziel: s, zielText: "Hingehen" },
    { id: "s-export", titel: "Export", wo: "Sicherheit › exportieren", unter: "lesbare Übersicht", spalte: 1, ziel: s, zielText: "Hingehen" },
    { id: "s-ordner", titel: "Sicherungsordner", wo: "Gerät, SD-Karte, USB, Laufwerk", unter: "getrennt vom Tresor · Android mit APK", spalte: 2 },
    { id: "s-exportordner", titel: "Exportordner", wo: "frei gewählt", unter: "keine eigene Verschlüsselung", spalte: 2, warn: true },
    { id: "s-einlesen", titel: "Sicherung einlesen", wo: "Sicherheit › Sicherung einlesen", unter: "nur in eine leere Akte · auch auf neuem Gerät", spalte: 3, ziel: s, zielText: "Hingehen" },
  ];
  const kanten: KartenKante[] = [{ von: "s-akte", nach: "s-voll" }, { von: "s-akte", nach: "s-export" }, { von: "s-voll", nach: "s-ordner" },
    { von: "s-export", nach: "s-exportordner" }, { von: "s-ordner", nach: "s-einlesen" }];
  return <Landkarte id="sichern" label="Sichern: Vollsicherung, Export und Zurückholen" gruppen={[]} knoten={knoten} kanten={kanten} breiten={[150, 176, 196, 196]} spalten={["Deine Akte", "Sichern", "Wohin", "Zurückholen"]}/>;
}

/** Karte „Fristen und Kalender“: woher Fristen kommen und wohin sie gehen. */
export function FristenKarte({ onGo, eingerichtet }: { onGo: Geh; eingerichtet: ReadonlySet<string> }) {
  const f = () => onGo("reminders");
  const st = mitStand(eingerichtet);
  const gruppen: KartenGruppe[] = [{ id: "f-hinein", titel: "Frist entsteht", spalte: 0, chips: [
    { id: "f-hand", titel: "Von Hand", wo: "+ Frist oder Aufgabe", nach: "f-liste" },
    { id: "f-notiz", titel: "Notiz mit Datum", wo: "nach deinem Ja", nach: "f-liste" },
    { id: "f-brief", titel: "Erkannt im Brief", wo: "Eingangszentrale, nach deinem Ja", nach: "f-liste" },
  ].map(st) }];
  const knoten: KartenKnoten[] = [
    { id: "f-liste", titel: "Fristen und Aufgaben", wo: "Haken = erledigt · Mülleimer = archiviert", spalte: 1, mitte: true, ziel: f, zielText: "Hingehen" },
    { id: "f-mein", titel: "Mein Kalender", wo: "Kopf › Kalender-Knopf", unter: "nach Tag", spalte: 2, ziel: f, zielText: "Hingehen" },
    st({ id: "kalender", titel: "Kalender verbunden", wo: "Google, Microsoft, Gerät, .ics", unter: "Notizen gehen nie hinaus", spalte: 2, ziel: f, zielText: "Hingehen" }),
    st({ id: "glocke", titel: "App-Glocke", wo: "Mein Kalender › App-Glocke", unter: "ab Werk aus", spalte: 2, ziel: f, zielText: "Hingehen" }),
  ];
  const kanten: KartenKante[] = [{ von: "f-liste", nach: "f-mein", beide: true }, { von: "f-liste", nach: "kalender", beide: true }, { von: "f-liste", nach: "glocke" }];
  return <Landkarte id="fristen" label="Fristen: woher sie kommen und wohin sie gehen" gruppen={gruppen} knoten={knoten} kanten={kanten} breiten={[200, 176, 196]} spalten={["Frist entsteht", "Liste", "Wohin sie geht"]}/>;
}

/** Karte „Gemeinsames Datenmodell“: was verbunden wird, was noch nicht eingeschaltet ist. */
export function DatenmodellKarte({ onGo }: { onGo: Geh }) {
  const z = (seite: SectionId) => ({ ziel: () => onGo(seite), zielText: "Hingehen" });
  const knoten: KartenKnoten[] = [
    { id: "d-personen", titel: "Personen", wo: "Familie & Personen", spalte: 0, ...z("family") },
    { id: "d-objekte", titel: "Objekte", wo: "Wohnung, Auto, Geräte", spalte: 0, ...z("home") },
    { id: "d-vorgaenge", titel: "Vorgänge", wo: "Cockpit", spalte: 0, ...z("cockpit") },
    { id: "d-modell", titel: "Gemeinsames Datenmodell", wo: "Grundlage im Hintergrund", spalte: 1, mitte: true },
    { id: "d-dokumente", titel: "Dokumente", wo: "Dokumentenbibliothek", spalte: 2, ...z("documents") },
    { id: "d-fristen", titel: "Fristen und Aufgaben", wo: "Fristen und Aufgaben", spalte: 2, ...z("reminders") },
    { id: "d-nochnicht", titel: "Noch nicht eingeschaltet", wo: "automatisch einsortieren · OneDrive-Sortierung", unter: "Frist-Vorschläge gibt es: Eingangszentrale, nach deinem Ja", spalte: 2, stand: "geplant" },
  ];
  const kanten: KartenKante[] = [
    { von: "d-personen", nach: "d-modell", beide: true }, { von: "d-objekte", nach: "d-modell", beide: true }, { von: "d-vorgaenge", nach: "d-modell", beide: true },
    { von: "d-modell", nach: "d-dokumente", beide: true }, { von: "d-modell", nach: "d-fristen", beide: true }, { von: "d-modell", nach: "d-nochnicht" },
  ];
  return <Landkarte id="datenmodell" label="Gemeinsames Datenmodell: was verbunden wird" gruppen={[]} knoten={knoten} kanten={kanten} breiten={[170, 190, 210]}
    spalten={["Wer und was", "Grundlage", "Wird verbunden"]}/>;
}

export { Ablaufbild };
