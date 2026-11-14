import type { KartenStand } from "../app/landkarte";

/**
 * Stand je Kasten der Landkarte (Klaus 07.11.2026, Sitzung 4; wie status.json im Sage-Protokoll).
 * Was hier nicht steht, ist fertig. Jede Bausitzung trägt hier ein, was sich mit ihrer Fassung ändert; die Hilfe umrahmt
 * Geändertes mit blauem Punkt „neu“, bis man den Kasten antippt (höchstens 14 Tage; bis 09.11. golden).
 * „selbst“: rot (einschalten) wird grün, sobald es auf diesem Gerät eingerichtet ist (Kennung wie in hilfeEingerichtet).
 */
export type StandEintrag = { stand: KartenStand; seit?: string; selbst?: "datentresor" | "fristen-kalender" | "app-glocke" };

export const APP_STAND: Readonly<Record<string, StandEintrag>> = {
  // Gerätetest 09.11. (2.28.51): Tresor in eigenem Ordner im Gerät; Karten live (Gerätezustand als Fläche).
  "tresor-einschritt": { stand: "fertig", seit: "2.28.51" },
  // Brücken 09.11. (2.28.50): Kurzfassung im Pro-Tresor, E-Mail-Anlagen beliebig tief, Antworten im eigenen Netz.
  // Rückmeldung 09.11. (2.28.49): Tagebuch mit Buch-Knopf, „Erinnerung“ statt „Notiz“, Brief beantworten verdeckt.
  "tagebuch": { stand: "fertig", seit: "2.28.49" },
  "notiz": { stand: "fertig", seit: "2.28.49" },
  "aus-antwort": { stand: "fertig", seit: "2.28.49" },
  // 2.28.68: Knopf „Pseudo“ mit verbesserter Maske (lib/maske.ts auf Modul 25).
  "aus-pseudo": { stand: "fertig", seit: "2.28.68" },
  // 2.28.67: Eingang – Absender und Titel aus dem Sortier-Kern.
  // 2.28.65: Sicherung an einem zweiten Ort, Cloud-Ordner hereinholen, E-Mail-Wege (Private Brain als Empfang, Mail-App, Microsoft).
  "aus-zweiter-ort": { stand: "fertig", seit: "2.28.65" },
  "cloud-ordner": { stand: "fertig", seit: "2.28.65" },
  "mail-brain": { stand: "fertig", seit: "2.28.65" },
  // Microsoft: gebaut; braucht die Rechte Mail.Read/Mail.Send in Entra (e10) – bis dahin „einrichten“.
  "mail-ms": { stand: "aktivieren", seit: "2.28.65" },
  "mssend": { stand: "aktivieren", seit: "2.28.65" },
  "mailapp": { stand: "fertig", seit: "2.28.65" },
  // Eigenes Mail-Programm (Weg H): nur vorbereitet.
  "mail-imap": { stand: "geplant", seit: "2.28.65" },
  // E-Mail (Plan Sitzung 3, nicht gebaut)
  "mail-gmail": { stand: "geplant", seit: "2.28.35" },
  "pruefung": { stand: "geplant", seit: "2.28.35" },
  "befund": { stand: "geplant", seit: "2.28.35" },
  "echt": { stand: "geplant", seit: "2.28.35" },
  "programm": { stand: "geplant", seit: "2.28.35" },
  // Einrichten
  "datei-pro": { stand: "aktivieren" },
  "datentresor": { stand: "aktivieren", selbst: "datentresor" },
  // 2.28.52: Tresor-Leser in „Wo liegt was?“ (Pro-Verbund-Karte t-leser).
  "protresor": { stand: "aktivieren", seit: "2.28.52" },
  // Stufe D: Termine aus dem Kalender holen (beidseitig).
  "kalender": { stand: "aktivieren", selbst: "fristen-kalender", seit: "2.28.43" },
  // Stufe H: Glocken überstehen den Neustart des Geräts (Android plant sie von selbst neu).
  "glocke": { stand: "aktivieren", selbst: "app-glocke", seit: "2.28.53" },
  // Abgleich zwischen Geräten (Plan Punkt 10): die Übergabe einer Unterlage ist fertig, der Abgleich steht im Kastentext als geplant.
  // Stufe C: gemeinsame Festplatte – vorbereiten, verbinden, abgleichen; erkannt an der Kennung.
  // Stufe I: Paket per Teilen (verschlüsselte Datei mit den Änderungen seit dem letzten Paket).
  // 2.28.61: „Meine Geräte“ – dieses Gerät per Knopf benennen, andere erscheinen von selbst; alte Einzelübergabe ausgeblendet.
  "anderes-geraet": { stand: "fertig", seit: "2.28.61" },
  // Stufe A (Plan 08.11.): Sicherung einlesen führt in eine benutzte Akte zusammen.
  // Stufe B: verschlüsselte Vollsicherung mit Notfallblatt, Erinnerung nach 7 Tagen, Papierkorb leeren.
  "sicherungsordner": { stand: "fertig", seit: "2.28.65" },
  "aus-sicherung": { stand: "fertig", seit: "2.28.41" },
  // Neugestaltung 2.28.39 (Punkt 2): ein Einstieg zum Ablegen im Kopf; Drucken nur noch über das Menü.
  "kopf-ablegen": { stand: "fertig", seit: "2.28.39" },
  // Ablaufprüfung 2.28.39: geänderte Wege golden markieren (Eingang mit Titel/Text/Sammelbestätigung, Frist mit Erinnerung
  // als Teil der Aufgabe, Suche nach Inhalt und Alltagswörtern, Personen anlegen, Glocke grün).
  // Stufe E: Eingangsordner in Blöcken zu 20, von selbst, ohne Zweitkopie, Speicherprüfung.
  "eingang": { stand: "fertig", seit: "2.28.67" },
  "vorschlag": { stand: "fertig", seit: "2.28.39" },
  // Stufe H: Original-Foto bleibt im Stapel erhalten; „Teilen“ an der Unterlage.
  "scan-stapel": { stand: "fertig", seit: "2.28.47" },
  "akte": { stand: "fertig", seit: "2.28.39" },
  "eintrag": { stand: "fertig", seit: "2.28.39" },
  "frist-neu": { stand: "fertig", seit: "2.28.39" },
  "aus-fristen": { stand: "fertig", seit: "2.28.39" },
  "aus-drucken": { stand: "fertig", seit: "2.28.39" },
};

/** Stand eines Kastens auf diesem Gerät. */
export function standVon(id: string, eingerichtet: ReadonlySet<string>): KartenStand {
  const e = APP_STAND[id];
  if (!e) return "fertig";
  if (e.stand === "aktivieren" && e.selbst && eingerichtet.has(e.selbst)) return "fertig";
  return e.stand;
}
