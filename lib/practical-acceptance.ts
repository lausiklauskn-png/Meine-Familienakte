import type { SystemCheckReport } from "./system-check";

export const USER_RESULTS = ["Ja", "Nein", "Nicht geprüft"] as const;
export type UserResult = typeof USER_RESULTS[number];
export type UserTest = { id: string; number: number; title: string; question: string; instruction: string; minutes: number };
export type UserTestBlock = { id: string; title: string; tests: readonly UserTest[] };

// Stable IDs refer to practical questions, never to automatically fabricated evidence.
export const USER_TEST_BLOCKS: readonly UserTestBlock[] = [
  { id: "voice-help-activity", title: "Spracheingabe, Hilfe und Aktivitätsanzeige", tests: [
    { id: "user-microphone", number: 1, title: "Mikrofonstatus", question: "Ist das Mikrofon aus schwarz und beim Diktieren rot mit „Aufnahme läuft“?", instruction: "STARTSEITE → Assistenz → Assistenzzentrale: Beim Feld „Frage oder gewünschtes Ergebnis“ das Mikrofon einschalten und wieder ausschalten.", minutes: 1 },
    { id: "user-dictation", number: 2, title: "Spracheingabe", question: "Erscheint dein gesprochener Testsatz im richtigen Feld?", instruction: "Im selben Feld kurz diktieren und das Mikrofon danach ausschalten. Noch nichts speichern.", minutes: 1 },
    { id: "user-edit-dictation", number: 3, title: "Bearbeitung des erkannten Textes", question: "Kannst du den erkannten Text normal ändern und die Fragezeichen-Hilfe wieder schließen?", instruction: "Ein Wort im erkannten Text ändern. Ein Fragezeichen öffnen und außerhalb anklicken; bei geöffneter Hilfe zusätzlich Esc ausprobieren.", minutes: 1 },
    { id: "user-activity", number: 4, title: "Aktivitätszeilen", question: "Zeigen genau zwei Zeilen unter der Suche die letzten tatsächlichen Rückmeldungen, die neueste oben?", instruction: "In der Assistenz „Familienakte prüfen und Vorschlag vorbereiten“ mit einem Testsatz ausführen. Nach zwei gemeldeten Aktionen die beiden Zeilen unter der Suche kontrollieren.", minutes: 2 },
    { id: "user-copy", number: 5, title: "Copy-Funktion", question: "Kopiert jeder Copy-Button nur seine Zeile und zeigt danach „Kopiert“?", instruction: "Beide Copy-Buttons einzeln ausprobieren und jeweils in ein leeres Textfeld einfügen. Danach STARTSEITE → Hilfe → Systemprüfung öffnen.", minutes: 1 },
  ] },
  { id: "documents-assignment-assistant", title: "Dokumente, Zuordnung und Assistenz", tests: [
    { id: "user-intake", number: 6, title: "Dokumenteingang", question: "Wird deine Testdatei erkannt und lässt sie sich geprüft lokal speichern?", instruction: "STARTSEITE → Dokumente → Eingangszentrale: Eine künstliche Testdatei auswählen, „Eingänge prüfen“ öffnen, Angaben prüfen und „Geprüft lokal speichern“ verwenden. Ein Test-Datentresor muss verbunden sein.", minutes: 3 },
    { id: "user-assignment", number: 7, title: "Zuordnung bestätigen", question: "Bleibt die mit „Zuordnung bestätigen“ gespeicherte Testzuordnung nach erneutem Öffnen erhalten?", instruction: "STARTSEITE → Dokumente → Bestand prüfen: Eine Testdatei mit „Quelle analysiert“ über „Ansehen“ öffnen, Kategorie und Dokumentart prüfen, „Zuordnung bestätigen“ wählen und erneut öffnen.", minutes: 3 },
    { id: "user-archive", number: 8, title: "Archivierung", question: "Wird die Testdatei per Prüfsumme archiviert, während das Original unverändert bleibt?", instruction: "Unter „Bestand prüfen“ ein Testarchiv verbinden, die Testdatei auswählen und „[Anzahl] Dateien archivieren“ wählen. Die tatsächliche Archivmeldung abwarten.", minutes: 2 },
    { id: "user-release", number: 9, title: "Assistenzfreigabe", question: "Erhält ausschließlich deine ausgewählte, archivierte Testdatei den Status „Assistenz freigegeben“?", instruction: "Nach erfolgreicher Archivierung die Testdatei auswählen und „Assistenzfreigabe“ verwenden. Falls der Button noch nicht aktiv ist, die Archivierung zuerst abschließen lassen.", minutes: 2 },
    { id: "user-assistant-use", number: 10, title: "Freigegebene Dokumente verwenden", question: "Verwendet die Assistenz die freigegebene Testdatei nachvollziehbar und lässt nicht freigegebene Dateien außen vor?", instruction: "STARTSEITE → Assistenz → Assistenzzentrale: Nach dem freigegebenen Testdokument fragen. Grundlage und Anzeige nicht freigegebener Dokumente kontrollieren.", minutes: 3 },
  ] },
  { id: "backup-restore-finish", title: "Sicherung, Wiederherstellung und Abschluss", tests: [
    { id: "user-full-backup", number: 11, title: "Vollständige Sicherung", question: "Wird eine vollständige Sicherung des Test-Datentresors erfolgreich erstellt?", instruction: "STARTSEITE → Dokumente → Sicherheit & lokaler Tresor: „Vollständige Sicherung erstellen“ wählen und den Sicherungsbericht prüfen. Nur den vorhandenen Testbestand verwenden.", minutes: 3 },
    { id: "user-restore", number: 12, title: "Wiederherstellungstest", question: "Wird die Sicherung in einer getrennten Testumgebung erfolgreich wiederhergestellt und geprüft?", instruction: "Auf derselben Seite „Wiederherstellung testen“ wählen. Ausschließlich einen leeren Test-Zielordner verwenden. Bei einem Schreibfehler „Nein“ mit der tatsächlichen Meldung wählen; die bekannte Windows-Störung gilt nicht als behoben.", minutes: 5 },
    { id: "user-mobile", number: 13, title: "Mobil-/Mobilgerät-Darstellung", question: "Sind Texte, Auswahlfelder, Mikrofone, Fragezeichen und Copy am Mobilgerät vollständig bedienbar?", instruction: "Die private Testseite am Mobilgerät geschlossen und aufgeklappt ansehen. Auch größere Schrift ausprobieren. Falls du gerade nur am PC prüfst, „Nicht geprüft“ wählen.", minutes: 3 },
    { id: "user-system-check", number: 14, title: "Systemprüfung", question: "Läuft die technische Abschlussprüfung durch und zeigt sie offene Punkte wahrheitsgemäß an?", instruction: "STARTSEITE → Hilfe → Systemprüfung → „Abschlussprüfung 2.28.1 starten“. Den tatsächlichen Prüfbericht kontrollieren; fehlende Nachweise nicht als bestanden beantworten.", minutes: 2 },
    { id: "user-final-status", number: 15, title: "Abschlussstatus", question: "Sind Benutzerergebnisse, Fehler und noch offene Prüfungen vollständig und korrekt gespeichert?", instruction: "Die gespeicherten Blöcke unter „Praktische Benutzerabnahme“ und „Gespeicherte Ergebnisse“ vergleichen. Offene Punkte müssen offen bleiben. Diese Benutzerabnahme erteilt keine Produktivfreigabe.", minutes: 1 },
  ] },
];

export type UserTestResult = {
  block: string; testId: string; testNumber: number; testLabel: string;
  result: UserResult; observation: string; checkedAt: string;
  websiteVersion: string; familyVersion: string;
};
export type UserTestAnswer = {
  result: UserResult | null; observation: string; answeredAt: string;
  websiteVersion: string; familyVersion: string; submittedAt: string | null;
  history: UserTestResult[];
};
export type UserAcceptanceRun = {
  schema: 1; id: string; familyVersion: string; createdAt: string; updatedAt: string;
  currentBlock: number; paused: boolean; answers: Record<string, UserTestAnswer>;
};
const allTests = USER_TEST_BLOCKS.flatMap((block) => block.tests);
export const latestUserResult = (answer?: UserTestAnswer) => answer?.history.at(-1);
const validResult = (value: unknown): value is UserResult => USER_RESULTS.includes(value as UserResult);
export function isUserAcceptanceRun(value: unknown): value is UserAcceptanceRun {
  if (!value || typeof value !== "object") return false;
  const run = value as UserAcceptanceRun;
  if (run.schema !== 1 || typeof run.id !== "string" || !run.id.startsWith("acceptance-") || typeof run.familyVersion !== "string" || !Number.isInteger(run.currentBlock) || run.currentBlock < 0 || run.currentBlock >= 3 || typeof run.paused !== "boolean" || !run.answers || typeof run.answers !== "object" || Array.isArray(run.answers) || !Number.isFinite(Date.parse(run.createdAt)) || !Number.isFinite(Date.parse(run.updatedAt))) return false;
  return Object.entries(run.answers).every(([id, answer]) => allTests.some((test) => test.id === id) && !!answer && (answer.result === null || validResult(answer.result)) && typeof answer.observation === "string" && typeof answer.websiteVersion === "string" && typeof answer.familyVersion === "string" && typeof answer.answeredAt === "string" && (answer.submittedAt === null || typeof answer.submittedAt === "string") && Array.isArray(answer.history) && answer.history.every((entry) => entry.testId === id && validResult(entry.result) && typeof entry.observation === "string" && Number.isFinite(Date.parse(entry.checkedAt)) && typeof entry.websiteVersion === "string" && typeof entry.familyVersion === "string"));
}
export function newUserAcceptanceRun(id: string, familyVersion: string, now: string): UserAcceptanceRun {
  return { schema: 1, id, familyVersion, createdAt: now, updatedAt: now, currentBlock: 0, paused: false, answers: {} };
}
export function latestUserAcceptance(reports: readonly SystemCheckReport[], version: string) {
  return reports.filter((report) => report.kind === "acceptance" && isUserAcceptanceRun(report.userAcceptance) && report.userAcceptance.familyVersion === version).sort((a,b) => Date.parse(b.checkedAt) - Date.parse(a.checkedAt))[0]?.userAcceptance;
}
export function chooseUserResult(run: UserAcceptanceRun, testId: string, result: UserResult, websiteVersion: string, now: string): UserAcceptanceRun {
  if (!allTests.some((test) => test.id === testId) || !validResult(result)) throw Error("Unbekannter Test oder ungültiges Ergebnis.");
  const previous = run.answers[testId];
  if (previous?.submittedAt) throw Error("Ein gespeichertes Ergebnis muss gezielt zur erneuten Prüfung geöffnet werden.");
  return { ...run, updatedAt: now, paused: false, answers: { ...run.answers, [testId]: { result, observation: result === "Nein" && previous?.result === "Nein" ? previous.observation : "", answeredAt: now, websiteVersion, familyVersion: run.familyVersion, submittedAt: null, history: previous?.history || [] } } };
}
export function noteUserFailure(run: UserAcceptanceRun, id: string, observation: string, now: string): UserAcceptanceRun {
  const answer = run.answers[id];
  if (!answer || answer.result !== "Nein" || answer.submittedAt) throw Error("Beobachtungen können nur zu einem offenen Nein-Ergebnis bearbeitet werden.");
  return { ...run, updatedAt: now, answers: { ...run.answers, [id]: { ...answer, observation: observation.slice(0, 2000), answeredAt: now } } };
}
export function reopenUserTest(run: UserAcceptanceRun, id: string, now: string): UserAcceptanceRun {
  const answer = run.answers[id];
  if (!answer?.submittedAt || latestUserResult(answer)?.result === "Ja") throw Error("Bestandene Tests bleiben erledigt.");
  return { ...run, paused: false, updatedAt: now, answers: { ...run.answers, [id]: { ...answer, result: null, observation: "", answeredAt: now, submittedAt: null } } };
}
export function canSubmitUserBlock(run: UserAcceptanceRun, blockIndex = run.currentBlock) {
  const block = USER_TEST_BLOCKS[blockIndex];
  return !!block && block.tests.every((test) => validResult(run.answers[test.id]?.result)) && block.tests.some((test) => !run.answers[test.id]?.submittedAt);
}
export function submitUserBlock(run: UserAcceptanceRun, pause: boolean, now: string): UserAcceptanceRun {
  if (!canSubmitUserBlock(run)) throw Error("Bitte für alle fünf Tests Ja, Nein oder Nicht geprüft auswählen.");
  const answers = { ...run.answers };
  for (const test of USER_TEST_BLOCKS[run.currentBlock].tests) {
    const answer = answers[test.id]; if (answer.submittedAt) continue;
    const entry: UserTestResult = { block: USER_TEST_BLOCKS[run.currentBlock].id, testId: test.id, testNumber: test.number, testLabel: test.title, result: answer.result!, observation: answer.result === "Nein" ? answer.observation : "", checkedAt: now, websiteVersion: answer.websiteVersion, familyVersion: answer.familyVersion };
    answers[test.id] = { ...answer, submittedAt: now, history: [...answer.history, entry] };
  }
  const next = USER_TEST_BLOCKS.findIndex((block, index) => index > run.currentBlock && block.tests.some((test) => !answers[test.id]?.submittedAt));
  return { ...run, answers, paused: pause, updatedAt: now, currentBlock: !pause && next >= 0 ? next : run.currentBlock };
}
export function userAcceptanceProgress(run: UserAcceptanceRun) {
  const passed = allTests.filter((test) => latestUserResult(run.answers[test.id])?.result === "Ja").length;
  const failed = allTests.filter((test) => latestUserResult(run.answers[test.id])?.result === "Nein").length;
  const notChecked = allTests.length - passed - failed;
  const remainingMinutes = allTests.filter((test) => latestUserResult(run.answers[test.id])?.result !== "Ja").reduce((sum, test) => sum + test.minutes, 0);
  return { passed, failed, notChecked, remainingMinutes, complete: passed === allTests.length };
}
export function buildUserAcceptanceReport(run: UserAcceptanceRun): SystemCheckReport {
  const progress = userAcceptanceProgress(run);
  const level = progress.failed ? "red" : progress.complete ? "green" : "yellow";
  const summary = `${progress.passed} bestanden · ${progress.failed} fehlgeschlagen · ${progress.notChecked} nicht geprüft`;
  return { id: run.id, version: run.familyVersion, checkedAt: run.updatedAt, mode: "full", kind: "acceptance", overall: level, areas: [{ id: "reports", label: "Praktische Benutzerabnahme", level, summary, details: ["Benutzerantworten; keine automatische technische Prüfung und keine Produktivfreigabe."] }], repairs: [], greenPoints: [], testCases: [], openProblems: [], releaseStatus: "nicht_freigegeben", userAcceptance: run };
}
