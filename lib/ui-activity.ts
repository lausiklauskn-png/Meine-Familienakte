import { isSensitiveHealthText } from "./family-privacy.ts";

// Presentation only: no register, chronology, file access or durable event store.
export type ActivityKind = "success" | "error" | "info" | "warning";
export type ActivityFeedback = { kind: ActivityKind; text: string };
export type ActivityEntry = { id: number; kind: "success" | "error" | "warning"; text: string };

export function activityEntry(feedback: ActivityFeedback, id: number): ActivityEntry | null {
  const message = feedback.text.trim();
  if (!message) return null;
  const kind = feedback.kind === "info" ? "warning" : feedback.kind;
  const prefix = kind === "success" ? "Erfolgreich" : kind === "error" ? "Fehlgeschlagen" : "Prüfung erforderlich";
  const safeMessage = isSensitiveHealthText(message)
    ? kind === "success"
      ? "Gesundheitsbezogene Aktion ausgeführt. Einzelheiten bleiben im geschützten Gesundheitsbereich."
      : "Gesundheitsbezogene Aktion erfordert Prüfung. Einzelheiten bleiben im geschützten Gesundheitsbereich."
    : message;
  return { id, kind, text: `${prefix}: ${safeMessage}` };
}

export function appendActivity(current: ActivityEntry[], entry: ActivityEntry | null): ActivityEntry[] {
  return entry ? [entry, ...current].slice(0, 2) : current;
}

export async function copyActivityText(text: string, writeText: (text: string) => Promise<void>) {
  await writeText(text);
}

export function inventoryScanFeedback(result: { paused: boolean; processed: number; discovered: number; unchanged: number; newFiles: number; changed: number; skippedContentAnalysis: number; excludedPaths: string[]; accessIssues: Array<{ reason: string }> }): ActivityFeedback {
  const excluded = result.excludedPaths.length ? ` Datentresor von der Analyse ausgeschlossen: ${result.excludedPaths.join(" · ")}.` : "";
  const issues = result.accessIssues.length ? ` ${result.accessIssues.length} Pfade nicht lesbar: ${result.accessIssues[0].reason}` : "";
  return { kind: result.paused || result.accessIssues.length ? "warning" : "success", text: result.paused
    ? `Analyse nach ${result.processed} von ${result.discovered} Dateien pausiert und gespeichert. Mit „Analyse fortsetzen“ weiterarbeiten.${excluded}${issues}`
    : `${result.processed} Dateien geprüft · ${result.unchanged} unverändert · ${result.newFiles} neu · ${result.changed} verändert. ${result.skippedContentAnalysis === result.processed ? "Keine erneute vollständige Inhaltsanalyse. " : `${result.skippedContentAnalysis} Dateien nicht erneut inhaltlich analysiert. `}Originaldateien unverändert.${excluded}${issues}` };
}

export function inventoryAssignmentFeedback(result: { item: { lifeArea: string }; createdRecords: number }): ActivityFeedback {
  return { kind: "success", text: `Zuordnung bestätigt · Lernsignal gespeichert · Kategorie „${result.item.lifeArea}“ · ${result.createdRecords} neue Datensätze nach Bestätigung. Vorhandene Einträge wiederverwendet; Originaldatei unverändert.` };
}

export function inventoryArchiveFeedback(result: { archived: number; alreadyArchived: number; failed: number }): ActivityFeedback {
  return { kind: result.failed ? "warning" : "success", text: `${result.archived} Datei${result.archived === 1 ? "" : "en"} mit Prüfsumme archiviert · ${result.alreadyArchived} bereits vorhanden · ${result.failed} offen. Originaldateien unverändert.${result.failed ? " Archivierung nicht vollständig; betroffene Dateien erneut prüfen." : ""}` };
}

export function inventoryReleaseFeedback(result: { released: number; reused: number }): ActivityFeedback {
  return { kind: result.released + result.reused > 0 ? "success" : "warning", text: `${result.released + result.reused} Dokument${result.released + result.reused === 1 ? "" : "e"} für die Assistenz und bestehende Ansichten freigegeben · ${result.released} neue Dokumentdatensätze · ${result.reused} vorhandene Datensätze wiederverwendet. Originaldateien unverändert.` };
}
