import { useState } from "react";
import { HardDrive } from "lucide-react";
import { workspaceStorage } from "../lib/demo-workspace.ts";
import { Ablaufbild, Pfad, zurStelle } from "./ablaufbild";

/**
 * Hilfe „Akten sichern“ (Nutzerwunsch 2026-11-05): Ordnerbaum wie „Wo liegt was?“, je Ort die Schritte zum Abhaken.
 * Rot = zu tun · Grün = erledigt · Grau = nicht nötig. Ein Tipp schaltet weiter; gemerkt nur auf diesem Gerät
 * (die Demo hat ihren eigenen Speicher). Graue Kästen mit ⊘ sind Hinweise und lassen sich nicht umschalten.
 * Beruht auf „Vollständige Sicherung erstellen“ und „Wiederherstellung testen“ im Sicherheitscenter.
 */
type Stand = "offen" | "erledigt" | "unnoetig";
const KEY = "familienakte_aktensicherung_v1";
const FOLGE: Record<Stand, Stand> = { offen: "erledigt", erledigt: "unnoetig", unnoetig: "offen" };
const WORT: Record<Stand, string> = { offen: "zu tun", erledigt: "erledigt", unnoetig: "nicht nötig" };
const ART: Record<Stand, string> = { offen: "art-warnung", erledigt: "art-gut", unnoetig: "art-aus" };

/** Ziel in der App: Akte (Dokumente) oder eine Karte im Sicherheitscenter. */
type Ziel = "akte" | "datentresor" | "pro-tresor" | "vollsicherung";
type Punkt = { id?: string; titel: string; unter?: string; ziel?: Ziel; kinder?: Punkt[] };
type Ort = { titel: string; unter: string; ziel: Ziel; punkte: Punkt[] };

const ORTE: Ort[] = [
  { titel: "Datentresor", unter: "Aktenordner auf Gerät, SD-Karte oder Laufwerk", ziel: "datentresor", punkte: [
    { titel: "Me_Myself_and_I_Familienakte", unter: "die laufende Akte · nie von Hand ändern", ziel: "akte", kinder: [
      { titel: "00_Register", unter: "Einträge, Fristen, Verknüpfungen" },
      { titel: "01_Dokumente", unter: "Originale" },
      { titel: "03_Erinnerungsmedien", unter: "Fotos, Videos" },
    ] },
    { id: "ort", titel: "Ort des Datentresors notiert", unter: "welches Gerät, welcher Speicher" },
  ] },
  { titel: "Pro-Tresor", unter: "nur in der Android- und Windows-App, wenn verbunden", ziel: "pro-tresor", punkte: [
    { titel: "Tresor-Hauptordner", unter: "verschlüsselte Originale · nichts von Hand" },
    { id: "passwort", titel: "Tresor-Passwort auf Papier", unter: "gilt für alle Pro-Apps" },
    { id: "ersatz", titel: "Ersatzschlüssel ausgedruckt", unter: "getrennt aufbewahren, nie in den Tresor" },
  ] },
  { titel: "Sicherungsordner", unter: "frei gewählt: Gerät, SD-Karte, USB, Laufwerk – getrennt vom Datentresor", ziel: "vollsicherung", punkte: [
    { id: "vollsicherung", titel: "Vollsicherung erstellt", unter: "„Vollständige Sicherung erstellen“", kinder: [
      { titel: "Familienakte_Vollsicherung_‹Zeit›", unter: "ein neuer Ordner je Sicherung" },
      { titel: "Dateien", unter: "Originale, auch aus dem Pro-Tresor als Kopie" },
      { titel: "Register und Manifest", unter: "mit Prüfsumme jeder Datei" },
      { titel: "Programm daneben", unter: "Android: APK · Windows: Lies-mich mit Download und SHA-256" },
    ] },
    { titel: "Lesbar, nicht verschlüsselt", unter: "nur auf eigenen Speicher legen" },
  ] },
  { titel: "Testordner", unter: "leer, nur für die Probe · holt nichts in die Akte", ziel: "vollsicherung", punkte: [
    { id: "test", titel: "Wiederherstellung getestet", unter: "„Wiederherstellung testen“" },
    { id: "bericht", titel: "Bericht ohne Fehler", unter: "Register und Prüfsummen stimmen" },
    { titel: "Laufende Akte", unter: "wird beim Test nicht verändert", ziel: "akte" },
  ] },
  { titel: "Zurückholen", unter: "„Sicherung einlesen“ im Sicherheitscenter", ziel: "vollsicherung", punkte: [
    { titel: "Erst die Probe", unter: "liest jede Datei per Prüfsumme, schreibt nichts" },
    { titel: "Nur in eine leere Akte", unter: "z. B. nach Neuinstallation; nichts wird zusammengeführt" },
  ] },
  { titel: "Zweiter Ort", unter: "USB-Stick, Rechner, zweites Laufwerk", ziel: "vollsicherung", punkte: [
    { id: "kopie", titel: "Vollsicherung kopiert", unter: "ganzer Ordner, nichts umbenennen" },
    { id: "app", titel: "App-Installationsdatei dabei", unter: "APK oder Windows-Setup" },
    { id: "rhythmus", titel: "Rhythmus festgelegt", unter: "z. B. monatlich und nach großen Ablagen" },
  ] },
  { titel: "Grenzen", unter: "vorher wissen", ziel: "vollsicherung", punkte: [
    { titel: "Größe je Datei nach Gerät", unter: "15–40 MB; Fotos lassen sich verkleinern (≥ 300 dpi)" },
    { titel: "Dokumentensicherung", unter: "nur ausgewählte Dateien, keine Vollsicherung" },
    { titel: "Demo", unter: "eigener Bestand, gehört nicht in die Sicherung" },
  ] },
];

/** Für die Ordnung der Hilfe: ist die Vollsicherung als erledigt abgehakt? */
export function vollsicherungAbgehakt() { return lesen().vollsicherung === "erledigt"; }
function lesen(): Record<string, Stand> { try { return JSON.parse(workspaceStorage.getItem(KEY) || "{}") || {}; } catch { return {}; } }
function schreiben(wert: Record<string, Stand>) { try { workspaceStorage.setItem(KEY, JSON.stringify(wert)); } catch { /* ohne Speicher geht es weiter */ } }
const alleIds = ORTE.flatMap((o) => o.punkte.flatMap((p) => [p, ...(p.kinder || [])])).map((p) => p.id).filter(Boolean) as string[];

const SELEKTOR: Record<Exclude<Ziel, "akte">, string> = { datentresor: '[data-hilfe-ziel="datentresor"]', "pro-tresor": "[data-pro-tresor]", vollsicherung: '[data-hilfe-ziel="vollsicherung"]' };

/**
 * @param datentresor Name des verbundenen Datentresors; dann führt der Kasten direkt zur Akte und steht grün.
 */
export function AktensicherungHilfe({ onSicherheit, onDokumente, datentresor }: { onSicherheit: () => void; onDokumente: () => void; datentresor?: string }) {
  const hin = (z: Ziel) => { if (z === "akte") { onDokumente(); return; } onSicherheit(); window.setTimeout(() => zurStelle(SELEKTOR[z]), 350); };
  const zielWort: Record<Ziel, string> = { akte: "zur Akte", datentresor: "Datentresor im Sicherheitscenter", "pro-tresor": "Pro-Tresor im Sicherheitscenter", vollsicherung: "Sicherung im Sicherheitscenter" };
  const [stand, setStand] = useState<Record<string, Stand>>(lesen);
  const wechseln = (id: string) => setStand((alt) => { const neu = { ...alt, [id]: FOLGE[alt[id] || "offen"] }; schreiben(neu); return neu; });
  const offen = alleIds.filter((id) => (stand[id] || "offen") === "offen").length;
  const erledigt = alleIds.filter((id) => stand[id] === "erledigt").length;
  const knoten = (p: Punkt) => {
    const text = <span className="ablauf-text"><strong>{p.id ? (stand[p.id] === "erledigt" ? "✓ " : "") : "⊘ "}{p.titel}</strong>{p.unter && <small>{p.unter}</small>}</span>;
    if (!p.id && p.ziel) { const z = p.ziel; return <button type="button" className="ablauf-knoten ablauf-link art-aus" data-sicherung-ziel={z} title={`${p.titel} – ${zielWort[z]}`} onClick={() => hin(z)}>{text}<span className="ablauf-pfeil" aria-hidden="true">›</span></button>; }
    if (!p.id) return <div className="ablauf-knoten art-aus">{text}</div>;
    const s = stand[p.id] || "offen"; const id = p.id;
    return <button type="button" className={`ablauf-knoten ablauf-link ${ART[s]}`} data-sicherung-punkt={id} data-stand={s}
      aria-label={`${p.titel}: ${WORT[s]} – tippen zum Weiterschalten`} onClick={() => wechseln(id)}>{text}</button>;
  };
  const zweig = (p: Punkt) => <li key={p.titel}>{knoten(p)}{p.kinder?.length ? <ul>{p.kinder.map(zweig)}</ul> : null}</li>;
  return <details data-aktensicherung className="wo-liegt-was aktensicherung">
    <summary><HardDrive/> Akten sichern – Plan zum Abhaken</summary>
    <div>
      <p>Kästen mit › führen an die Stelle in der App. Wiederherstellbar ist die Akte erst, wenn eine Vollsicherung an einem zweiten Ort liegt und einmal in einen leeren Ordner zurückgeholt wurde.</p>
      <p className="aktensicherung-legende"><span className="chip-rot">zu tun</span><span className="chip-gruen">✓ erledigt</span><span className="chip-grau">nicht nötig</span><span data-sicherung-stand>{offen} zu tun · {erledigt} erledigt</span></p>
      <div className="aktensicherung-orte">
        {ORTE.map((o) => <section key={o.titel} className="aktensicherung-ort">
          {(() => {
            const verbunden = o.ziel === "datentresor" && datentresor;
            const z: Ziel = verbunden ? "akte" : o.ziel;
            return <button type="button" className={`ablauf-knoten ablauf-link ${verbunden ? "art-gut" : "art-hervor"}`} data-sicherung-ziel={z} title={`${o.titel} – ${zielWort[z]}`} onClick={() => hin(z)}>
              <span className="ablauf-text"><strong>{o.titel}</strong><small>{verbunden ? `Verbunden: ${datentresor} · zur Akte` : o.unter}</small></span><span className="ablauf-pfeil" aria-hidden="true">›</span></button>;
          })()}
          <ul className="ordnerbaum aktensicherung-baum"><li className="baum-wurzel-leer"><ul>{o.punkte.map(zweig)}</ul></li></ul>
        </section>)}
      </div>
      <p className="pfad-titel"><strong>Neues Gerät oder App neu installiert</strong> (am Gerät noch nicht durchgespielt):</p>
      <Ablaufbild label="Akte aus der Vollsicherung wiederherstellen" knoten={[
        { titel: "App installieren" },
        { titel: "Speicher wählen", unter: "falls gewünscht eigener Datentresor; die Akte bleibt leer" },
        { titel: "Sicherung einlesen", unter: "Sicherheit › erst Probe, dann „Jetzt einlesen“", art: "hervor" },
        { titel: "Pro-Tresor verbinden", unter: "falls genutzt, gleiches Passwort" },
        { titel: "Nachsehen", unter: "Unterlagen, Fristen, Fotos da?", art: "gut" },
      ]}/>
      <p><strong>Zwei Knöpfe, zwei Aufgaben:</strong> „Wiederherstellung testen“ prüft die Sicherung nur in einem leeren Testordner und holt nichts in die Akte. „Sicherung einlesen“ holt sie in die Akte zurück – nur in eine leere Akte.</p>
      <ul className="merkpunkte">
        <li><strong>Nicht</strong> in den Datentresor sichern – immer ein getrennter Ordner.</li>
        <li><strong>Nichts umbenennen</strong> in der Sicherung – sonst passen die Prüfsummen nicht.</li>
        <li><strong>Eine Kopie ist keine Sicherung</strong> – immer ein zweiter Ort.</li>
      </ul>
      <p className="pfad-titel"><strong>Sichern und testen:</strong></p>
      <Pfad teile={[{ text: "Dokumente" }, { text: "Sicherheit & lokaler Tresor" }, { text: "Vollständig sichern und testen", ziel: () => hin("vollsicherung") }]}/>
    </div>
  </details>;
}
