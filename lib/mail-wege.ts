/** 2.28.65 (Startbrief 11.11.2026, Punkt 6; E-Mail-Plan e1–e10 mit dem Vorschlag in Klammern): alle Wege offen, die
 *  entscheidenden Punkte sind eine Wahl des Nutzers. Reine Regeln ohne Netz und ohne Dateizugriff.
 *  Empfang: Private Brain Pro (Hauptweg, Weg F) · Teilen aus der Mail-App (A) · Microsoft-Postfach (C) · eigenes Mail-Programm (H, geplant).
 *  Versand: Mail-App öffnen (B) · Microsoft (C). Die Familienakte verschickt nie still; Verschlüsselung beim Mailversand gibt es nicht. */

export type Empfang = "brain" | "teilen" | "microsoft" | "eigen";
export type Versand = "mailapp" | "microsoft";
export type MailWahl = { empfang: Empfang; versand: Versand; brainAuto: boolean };
export const MAIL_VORGABE: MailWahl = { empfang: "brain", versand: "mailapp", brainAuto: true };
export const MAIL_WAHL_SCHLUESSEL = "familienakte-mail-wahl-v1";

export function wahlLesen(text: string | null | undefined): MailWahl {
  try {
    const w = JSON.parse(text || "null") as Partial<MailWahl> | null;
    return {
      empfang: (["brain", "teilen", "microsoft", "eigen"] as const).includes(w?.empfang as Empfang) && w?.empfang !== "eigen" ? w!.empfang as Empfang : MAIL_VORGABE.empfang,
      versand: w?.versand === "microsoft" ? "microsoft" : "mailapp",
      brainAuto: w?.brainAuto !== false,
    };
  } catch { return { ...MAIL_VORGABE }; }
}

/** e2: Gesundheitswort im Betreff – nur Hinweis, der Nutzer entscheidet; nie selbst ändern. */
const GESUNDHEIT = /\b(befund|diagnose|arzt|ärztin|praxis|klinik|krankenhaus|krank|therapie|rezept|labor|blut|psych\w*|medikament\w*|reha|pflege\w*|röntgen|mrt|ct|op\b|operation|schwanger\w*|impf\w*|attest|au-bescheinigung|arbeitsunfähig\w*)/i;
export const gesundheitswort = (betreff: string) => betreff.match(GESUNDHEIT)?.[0] || null;

/** e3: Anlagen zusammen über 20 MB → Ansage. Microsoft nimmt einzelne Anlagen bis 3 MB direkt. */
export const ANLAGEN_GRENZE = 20 * 1024 * 1024;
export const MICROSOFT_ANLAGE_GRENZE = 3 * 1024 * 1024;
export function anlagenPruefen(groessen: number[], weg: Versand): { ok: boolean; satz: string } {
  const summe = groessen.reduce((a, b) => a + b, 0);
  if (summe > ANLAGEN_GRENZE) return { ok: false, satz: `Die Anlagen haben zusammen ${(summe / 1048576).toFixed(1).replace(".", ",")} MB. Viele Postfächer nehmen höchstens 20 MB an – bitte weniger Anlagen wählen oder Fotos vorher verkleinern.` };
  if (weg === "microsoft" && groessen.some((g) => g > MICROSOFT_ANLAGE_GRENZE)) return { ok: false, satz: "Eine Anlage ist größer als 3 MB. Über Microsoft geht das in dieser Fassung noch nicht – bitte „In der Mail-App öffnen“ nutzen." };
  return { ok: true, satz: "" };
}

/** Empfänger prüfen: eine oder mehrere Adressen, durch Komma oder Semikolon getrennt. */
export function adressen(text: string): string[] | null {
  const teile = text.split(/\s*[,;]\s*/).map((t) => t.trim()).filter(Boolean);
  if (!teile.length || teile.length > 20) return null;
  return teile.every((t) => /^[^\s@<>()"]+@[^\s@<>()"]+\.[^\s@<>()"]{2,}$/.test(t)) ? teile : null;
}

export function mailtoAdresse(an: string, betreff: string, text: string): string {
  const q = new URLSearchParams(); if (betreff) q.set("subject", betreff); if (text) q.set("body", text);
  return `mailto:${encodeURIComponent(an).replace(/%40/g, "@").replace(/%2C/g, ",")}?${q.toString().replace(/\+/g, "%20")}`;
}

/** Microsoft Graph: Antwort in einen ehrlichen Satz übersetzen (e10: Rechte fehlen, solange sie in Entra nicht eingetragen sind). */
export function microsoftFehler(status: number, code: string): string {
  if (status === 401) return "Die Anmeldung ist abgelaufen. Bitte neu anmelden.";
  if (status === 403 || /AccessDenied|consent|ErrorAccessDenied|Authorization_RequestDenied/i.test(code)) return "Microsoft gibt der Familienakte das Postfach noch nicht frei: die Rechte Mail.Read und Mail.Send sind für die App noch nicht eingerichtet (Einrichtung in Entra offen). Bis dahin: Teilen aus der Mail-App oder „In der Mail-App öffnen“.";
  if (status === 413) return "Die Mail ist zu groß für Microsoft. Bitte weniger Anlagen wählen.";
  if (status === 429) return "Microsoft bittet um eine Pause. Bitte in ein paar Minuten erneut versuchen.";
  return `Microsoft hat abgelehnt (${status}${code ? `, ${code}` : ""}).`;
}

/** Dateiname einer abgeholten Mail: Datum und Betreff, ohne verbotene Zeichen. */
export function emlName(betreff: string, empfangen: string): string {
  const tag = /^\d{4}-\d{2}-\d{2}/.test(empfangen) ? empfangen.slice(0, 10) : "Mail";
  const b = (betreff || "Ohne Betreff").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Ohne Betreff";
  return `${tag} ${b}.eml`;
}
