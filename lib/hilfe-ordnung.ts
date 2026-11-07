import type { SectionId } from "../app/portal-types";

/**
 * Ordnung der Hilfe (Klaus 07.11.2026, Plan Punkt 7c/7d). Jedes Thema hat eine Gruppe, im Arbeiten einen Schritt,
 * die Seiten, zu denen es passt, und Wörter, mit denen Menschen ein Problem beschreiben („Wie kann ich dir helfen?“).
 *
 * Reihenfolge beim Öffnen: 1. passend zur Seite, von der man kam · 2. Einrichten, noch offen · 3. Arbeiten Schritt für Schritt
 * · 4. Allgemeines · 5. schon eingerichtet · 6. Fachliches. Innerhalb einer Gruppe feste Reihenfolge; Umschalter A–Z.
 */
export type HilfeGruppe = "einrichten" | "arbeiten" | "allgemein" | "fachlich";
export type HilfeSchritt = 1 | 2 | 3 | 4 | 5;
export const SCHRITT_NAME: Record<HilfeSchritt, string> = { 1: "Erfassen", 2: "Einordnen", 3: "Erinnern", 4: "Finden", 5: "Sichern" };
export type HilfeEintrag = { gruppe: HilfeGruppe; schritt?: HilfeSchritt; seiten: SectionId[]; worte: string[] };

export const HILFE_ORDNUNG: Record<string, HilfeEintrag> = {
  // Einrichten
  "wo-liegt-was": { gruppe: "einrichten", seiten: ["security", "documents"], worte: ["tresor", "speicher", "sd-karte", "ordner", "wo liegt", "pro-tresor", "einrichten", "verbinden"] },
  "datentresor": { gruppe: "einrichten", seiten: ["security"], worte: ["tresor", "speicher", "onedrive", "usb", "ordner wählen"] },
  "fristen-kalender": { gruppe: "einrichten", seiten: ["reminders"], worte: ["kalender verbinden", "google", "outlook", "microsoft", "samsung", "ics", "termin im kalender"] },
  "app-glocke": { gruppe: "einrichten", seiten: ["reminders"], worte: ["glocke", "klingelt nicht", "läutet", "ton", "benachrichtigung", "wecker", "erinnerung kommt nicht"] },
  "akten-sichern": { gruppe: "einrichten", seiten: ["security"], worte: ["sichern", "sicherung", "backup", "datenverlust", "handy kaputt", "neu installieren"] },
  // Arbeiten: Erfassen
  "fotografieren": { gruppe: "arbeiten", schritt: 1, seiten: ["inbox", "overview"], worte: ["foto", "kamera", "scannen", "brief fotografieren", "zu groß", "pdf erstellen"] },
  "eingangszentrale": { gruppe: "arbeiten", schritt: 1, seiten: ["inbox"], worte: ["datei", "hochladen", "einfügen", "pdf", "word", "eingang", "e-mail datei", "eml", "msg"] },
  "teilen": { gruppe: "arbeiten", schritt: 1, seiten: ["inbox"], worte: ["teilen", "e-mail", "mail", "galerie", "aus anderer app", "weiterleiten"] },
  "notiz": { gruppe: "arbeiten", schritt: 1, seiten: ["overview", "reminders", "memory"], worte: ["notiz", "aufschreiben", "schnell merken", "kamera notiz"] },
  "mikrofon": { gruppe: "arbeiten", schritt: 1, seiten: ["overview"], worte: ["mikrofon", "diktieren", "sprechen", "sprache", "spracheingabe", "mikrofon geht nicht"] },
  "workflow-pdf": { gruppe: "arbeiten", schritt: 1, seiten: ["workflowpdf", "stapel", "documents"], worte: ["pdf bearbeiten", "zusammenfügen", "seiten ordnen", "stapel", "viele fotos", "durchsuchbar"] },
  "tagebuch": { gruppe: "arbeiten", schritt: 1, seiten: ["memory"], worte: ["tagebuch", "erinnerung aufschreiben", "ereignis", "memory", "fotos zum erlebnis"] },
  "mehrere-erinnerungen": { gruppe: "arbeiten", schritt: 1, seiten: ["memory"], worte: ["nächste eingabe", "mehrere", "warteschlange", "entwurf"] },
  // Einordnen
  "zuordnung": { gruppe: "arbeiten", schritt: 2, seiten: ["inventory", "inbox"], worte: ["zuordnen", "einordnen", "kategorie", "bereich", "vorschlag"] },
  "verbinden": { gruppe: "arbeiten", schritt: 2, seiten: ["cockpit", "memory"], worte: ["vorgang", "verknüpfen", "gehört zusammen", "zusammenhang"] },
  "kategorien": { gruppe: "arbeiten", schritt: 2, seiten: ["documents"], worte: ["kategorie", "lebensbereich", "einordnen"] },
  "memories-bearbeiten": { gruppe: "arbeiten", schritt: 2, seiten: ["memory"], worte: ["memory ändern", "erinnerung löschen", "bearbeiten"] },
  "bestand-pruefen": { gruppe: "arbeiten", schritt: 2, seiten: ["inventory"], worte: ["bestand", "ordner prüfen", "dubletten", "doppelt", "aufräumen"] },
  // Erinnern
  "fristen-verwalten": { gruppe: "arbeiten", schritt: 3, seiten: ["reminders"], worte: ["frist", "aufgabe", "erledigt", "haken", "termin anlegen", "to-do"] },
  "mein-kalender": { gruppe: "arbeiten", schritt: 3, seiten: ["reminders"], worte: ["kalender", "termine", "tag", "termin ändern", "verschieben"] },
  "auge": { gruppe: "arbeiten", schritt: 3, seiten: ["reminders", "memory"], worte: ["auge", "öffnen", "ändern", "liste", "zeile"] },
  "loeschen": { gruppe: "arbeiten", schritt: 3, seiten: ["reminders", "memory"], worte: ["löschen", "mülleimer", "weg", "entfernen", "versehentlich gelöscht", "archiv"] },
  "einklappen": { gruppe: "arbeiten", schritt: 3, seiten: ["reminders"], worte: ["einklappen", "zuklappen", "aufklappen", "alle", "zu viel auf der seite", "pfeile"] },
  // Finden
  "nicht-finden": { gruppe: "arbeiten", schritt: 4, seiten: ["documents", "overview"], worte: ["finde nicht", "suche", "verschwunden", "weg", "wo ist"] },
  "suche-arbeitsaktionen": { gruppe: "arbeiten", schritt: 4, seiten: ["overview"], worte: ["suche", "suchleiste", "knöpfe", "farben"] },
  "bibliothek": { gruppe: "arbeiten", schritt: 4, seiten: ["documents", "sources"], worte: ["dokumente", "bibliothek", "filtern", "sortieren", "alle ansehen"] },
  "cockpit": { gruppe: "arbeiten", schritt: 4, seiten: ["cockpit"], worte: ["cockpit", "übersicht", "was ist wichtig", "überfällig"] },
  "startseite": { gruppe: "arbeiten", schritt: 4, seiten: ["overview"], worte: ["startseite", "kopf", "oben", "unten", "drucken"] },
  "menue": { gruppe: "arbeiten", schritt: 4, seiten: ["directory"], worte: ["menü", "seite", "fragezeichen", "aufbau", "navigation"] },
  "was-gibts-neues": { gruppe: "arbeiten", schritt: 4, seiten: ["changelog", "versions"], worte: ["neu", "neuigkeiten", "version", "änderungen"] },
  "neu": { gruppe: "arbeiten", schritt: 4, seiten: ["overview"], worte: ["neu", "roter punkt", "was ist neu"] },
  "drucken": { gruppe: "arbeiten", schritt: 4, seiten: ["overview"], worte: ["drucken", "drucker", "ausdrucken", "papier"] },
  "assistenz": { gruppe: "arbeiten", schritt: 4, seiten: ["assistant", "correspondence"], worte: ["assistenz", "brief schreiben", "e-mail schreiben", "korrespondenz", "antwort", "ki"] },
  // Sichern
  "vollsicherung": { gruppe: "arbeiten", schritt: 5, seiten: ["security"], worte: ["sicherung", "wiederherstellen", "backup", "zurückholen"] },
  "export": { gruppe: "arbeiten", schritt: 5, seiten: ["security"], worte: ["export", "exportieren", "ausgeben", "weitergeben"] },
  "umzug": { gruppe: "arbeiten", schritt: 5, seiten: ["security"], worte: ["neues handy", "gerät wechseln", "umziehen", "übertragen", "anderes gerät"] },
  "mehrere-orte": { gruppe: "arbeiten", schritt: 5, seiten: ["security"], worte: ["doppelt", "kopie", "mehrere orte", "usb"] },
  // Allgemeines
  "update": { gruppe: "allgemein", seiten: ["overview"], worte: ["update", "aktualisieren", "neue version", "basic", "pro", "versionsnummer"] },
  "demo": { gruppe: "allgemein", seiten: ["help"], worte: ["demo", "ausprobieren", "beispiel", "testen"] },
  "persoenliche-daten": { gruppe: "allgemein", seiten: ["security"], worte: ["datenschutz", "privat", "sicher", "wer sieht", "daten geschützt"] },
  "gesundheit-schutz": { gruppe: "allgemein", seiten: ["health", "medical"], worte: ["gesundheit", "diagnose", "geschützt", "arzt"] },
  "datenschutz-register": { gruppe: "allgemein", seiten: ["security"], worte: ["beschädigt", "register", "kaputt", "daten verloren", "schutz"] },
  "noch-nicht": { gruppe: "allgemein", seiten: ["help"], worte: ["geht nicht", "fehlt", "noch nicht", "kommt noch", "e-mail postfach"] },
  "aktivitaet": { gruppe: "allgemein", seiten: ["overview"], worte: ["zeilen", "meldung", "rückmeldung", "copy", "kopieren"] },
  "ampel": { gruppe: "allgemein", seiten: ["systemcheck"], worte: ["grün", "gelb", "rot", "farben", "ampel"] },
  "knopf-farben": { gruppe: "allgemein", seiten: ["overview"], worte: ["farben", "knöpfe", "gelb", "grau", "grün"] },
  "verbinden-loeschen": { gruppe: "allgemein", seiten: ["security"], worte: ["gelöscht", "verbinden", "sperren", "tresor sperren"] },
  "kartenhilfe": { gruppe: "allgemein", seiten: [], worte: ["karte", "fragezeichen", "erklärung", "was bedeutet"] },
  // Fachliches
  "benutzerabnahme": { gruppe: "fachlich", seiten: ["systemcheck"], worte: ["abnahme", "prüfen", "test", "prüfzettel"] },
  "familienakte-pruefen": { gruppe: "fachlich", seiten: ["systemcheck"], worte: ["systemprüfung", "prüfbericht", "reparatur"] },
  "testakte": { gruppe: "fachlich", seiten: ["inventory"], worte: ["testakte", "testordner", "weiterentwicklung"] },
  "fawoga-onedrive": { gruppe: "fachlich", seiten: ["inventory"], worte: ["fawoga", "onedrive", "hauptordner"] },
  "fawoga-lernt": { gruppe: "fachlich", seiten: ["inventory"], worte: ["fawoga", "lernen", "zuordnung lernen"] },
  "datenmodell": { gruppe: "fachlich", seiten: [], worte: ["datenmodell", "technik"] },
  "fuehrend": { gruppe: "fachlich", seiten: [], worte: ["system", "führend"] },
  "entwicklungsregel": { gruppe: "fachlich", seiten: ["systemcheck"], worte: ["entwicklung", "regel", "freigabe"] },
  "onedrive-usb": { gruppe: "fachlich", seiten: ["security"], worte: ["onedrive", "usb", "abgleich"] },
};

/** Kleinbuchstaben, Umlaute vereinfacht, nur Buchstaben/Ziffern. */
export function suchNorm(text: string) {
  return text.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();
}
const FUELL = new Set(["ich", "du", "die", "der", "das", "den", "dem", "ein", "eine", "einen", "und", "oder", "wie", "was", "wo", "wann", "warum", "kann", "nicht", "mein", "meine", "mir", "mich", "ist", "sind", "geht", "habe", "hat", "mit", "auf", "in", "im", "zu", "zum", "zur", "von", "fuer", "es", "man", "bitte", "will", "moechte", "soll"]);

/**
 * „Wie kann ich dir helfen?“, Stufe 1 ohne Modell: Wörter des Satzes gegen Titel, Problem-Wörter und Text der Themen.
 * Problem-Wörter zählen am meisten, dann der Titel, dann der Text. Wortanfänge ab 4 Buchstaben zählen mit („klingel“ → „klingelt“).
 * Ausnahme: „nicht“ zählt mit, wenn es in einem Problem-Wort steht („klingelt nicht“).
 */
export function hilfeSuchen(frage: string, themen: Array<{ id: string; titel: string; text: string }>, max = 5) {
  const q = suchNorm(frage); if (!q) return [];
  const woerter = q.split(" ").filter((w) => w.length >= 3 && !FUELL.has(w));
  const treffer = themen.map((t) => {
    const titel = suchNorm(t.titel), text = suchNorm(t.text), worte = (HILFE_ORDNUNG[t.id]?.worte || []).map(suchNorm);
    let punkte = 0;
    for (const w of worte) if (w && q.includes(w)) punkte += 6 + w.split(" ").length * 2;
    const passt = (feld: string, w: string) => feld.split(" ").some((x) => x === w || (w.length >= 4 && (x.startsWith(w) || w.startsWith(x) && x.length >= 4)));
    for (const w of woerter) {
      if (worte.some((x) => passt(x, w))) punkte += 4;
      if (passt(titel, w)) punkte += 3;
      if (passt(text, w)) punkte += 1;
    }
    return { id: t.id, titel: t.titel, punkte };
  }).filter((t) => t.punkte > 0);
  return treffer.sort((a, b) => b.punkte - a.punkte || a.titel.localeCompare(b.titel, "de")).slice(0, max);
}
