import type { SectionId } from "../app/portal-types";

/**
 * Live-Zustand dieses Geräts für die Hilfekarten (Klaus 09.11.2026, Vorschau live-zustand-2.28.50, l1–l5 Ja):
 * grün = eingerichtet, verbunden, aktuell · rot = nötig und fehlt · gelb = eingerichtet, aber gesperrt, nicht erreichbar
 * oder veraltet · grau = freiwillig und nicht eingerichtet, oder gibt es hier nicht. Liest nur vorhandene Zustände.
 * Kennungen wie in der Landkarte (lib/app-landkarte.ts); „Akten sichern“ und „Wo liegt was?“ nutzen dieselben Werte.
 */
export type LiveFarbe = "gruen" | "rot" | "gelb" | "grau";
export type Live = { farbe: LiveFarbe; text: string; los?: string; seite?: SectionId; ziel?: string };
export type LiveZustand = Readonly<Record<string, Live>>;

/** Tage, nach denen eine Vollsicherung als veraltet gilt (gleich der Erinnerung auf der Startseite). */
export const SICHERUNG_TAGE = 7;
const TAG = 86400000;

export type LiveEingaben = { datentresor?: string; letzteSicherung?: string | null; pro: { status: "getrennt" | "offen" | "gesperrt" | "nicht_erreichbar"; ort?: string } | null; nativ: boolean;
  kalender: boolean; glocke: boolean; laufwerke: number; demo: boolean; jetzt?: number };

const SICHERHEIT: SectionId = "security";
const PRO_ZIEL = "[data-pro-tresor]";

/** Reine Zuordnung (ohne Speicherzugriff), damit die Fachprüfung sie mit erfundenen Eingaben prüfen kann. */
export function liveBerechnen(e: LiveEingaben): LiveZustand {
  const z: Record<string, Live> = {};
  z.datentresor = e.datentresor
    ? { farbe: "gruen", text: `verbunden · ${e.datentresor}` }
    : e.demo ? { farbe: "grau", text: "in der Demo: eigener Bestand" }
    : { farbe: "rot", text: "noch kein Speicher gewählt", los: "Wählen", seite: SICHERHEIT, ziel: '[data-hilfe-ziel="datentresor"]' };

  const pro: Live = e.demo ? { farbe: "grau", text: "in der Demo nicht verbunden" }
    : !e.nativ ? { farbe: "grau", text: "nur in der Android- und Windows-App" }
    : !e.pro || e.pro.status === "getrennt" ? { farbe: "grau", text: "freiwillig · nicht eingerichtet", los: "Einrichten", seite: SICHERHEIT, ziel: PRO_ZIEL }
    : e.pro.status === "offen" ? { farbe: "gruen", text: `entsperrt${e.pro.ort ? ` · ${e.pro.ort}` : ""}` }
    : e.pro.status === "gesperrt" ? { farbe: "gelb", text: "gesperrt · Passwort eingeben", los: "Entsperren", seite: SICHERHEIT, ziel: PRO_ZIEL }
    : { farbe: "rot", text: "nicht erreichbar · Speicher einstecken oder neu wählen", los: "Prüfen", seite: SICHERHEIT, ziel: PRO_ZIEL };
  z.protresor = pro; z["tresor-einschritt"] = pro; z["datei-pro"] = pro;

  const jetzt = e.jetzt ?? Date.now();
  const zeit = e.letzteSicherung ? Date.parse(e.letzteSicherung) : NaN;
  const tage = Number.isFinite(zeit) ? Math.max(0, Math.floor((jetzt - zeit) / TAG)) : null;
  const sicherung: Live = tage === null ? { farbe: "rot", text: "noch nie gesichert", los: "Sichern", seite: SICHERHEIT, ziel: '[data-hilfe-ziel="vollsicherung"]' }
    : tage <= SICHERUNG_TAGE ? { farbe: "gruen", text: tage === 0 ? "heute gesichert" : `letzte vor ${tage} Tag${tage === 1 ? "" : "en"}` }
    : { farbe: "gelb", text: `letzte vor ${tage} Tagen · älter als ${SICHERUNG_TAGE} Tage`, los: "Jetzt sichern", seite: SICHERHEIT, ziel: '[data-hilfe-ziel="vollsicherung"]' };
  z["aus-sicherung"] = sicherung; z.sicherungsordner = sicherung;

  z.kalender = e.kalender ? { farbe: "gruen", text: "verbunden" }
    : { farbe: "grau", text: "freiwillig · nicht verbunden", los: "Verbinden", seite: "reminders", ziel: "#kalender-verbinden" };
  z.glocke = e.glocke ? { farbe: "gruen", text: "an" } : { farbe: "grau", text: "aus", los: "Einschalten", seite: "reminders", ziel: "#mein-kalender" };
  z["anderes-geraet"] = e.laufwerke > 0 ? { farbe: "gruen", text: `${e.laufwerke} ${e.laufwerke === 1 ? "Weg" : "Wege"} eingerichtet` }
    : { farbe: "grau", text: "freiwillig · noch kein Weg eingerichtet", los: "Einrichten", seite: SICHERHEIT, ziel: '[data-hilfe-ziel="laufwerk"]' };
  z["aus-demo"] = e.demo ? { farbe: "rot", text: "an · du arbeitest an einer Kopie" } : { farbe: "grau", text: "aus" };
  return z;
}

