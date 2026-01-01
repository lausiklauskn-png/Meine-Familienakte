import { readFileSync } from "node:fs";
import { runAutomatedTestFailureModeTests } from "../app/local-vault.ts";

const localVault = readFileSync("app/local-vault.ts", "utf8");
const portal = readFileSync("app/health-portal.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");
const manifest = JSON.parse(readFileSync("lib/system-check-manifest.json", "utf8"));

const tests = [
  ["eindeutiger Arbeitsbereich", localVault.includes('AUTOMATED_TEST_WORKSPACE = "Familienakte_Automatische_Testumgebung_2.28.1"')],
  ["sechs getrennte Unterordner", ["01_Analysequelle", "02_Testdatentresor", "03_Sicherungen", "04_R", "05_Pruefberichte", "06_Diagnose"].every((name) => localVault.includes(name))],
  ["gespeicherte Entwicklungsbasis", localVault.includes("chooseDevelopmentBaseFolder") && localVault.includes("rememberedDevelopmentBaseFolder") && localVault.includes('DEVELOPMENT_BASE_KEY = "family-development-base"')],
  ["Berechtigungsprüfung", localVault.includes("verifiedDirectoryPermission(base, \"readwrite\",")],
  ["synthetische Testdaten", localVault.includes("syntheticTestDocuments") && localVault.includes("SYNTHETISCHE TESTDATEI")],
  ["bestehende Bestandslogik", localVault.includes("scanInventoryFolder({ source, register: vault")],
  ["bestehende Sicherungslogik", localVault.includes("writeFullFamilyBackup({ destination: backups, source: vault") && localVault.includes("restoreFullFamilyBackup({") && localVault.includes("refreshBackup:") && localVault.includes("refreshTarget:")],
  ["Änderungs- und Fehlend-Test", localVault.includes("Aenderungserkennung_Synthetisch") && localVault.includes("Fehlende_Datei_Synthetisch")],
  ["isolierter Reparaturweg", localVault.includes("Beschaedigtes_Testregister") && localVault.includes("ensureAutomatedTestVault")],
  ["kontrolliertes Zurücksetzen", localVault.includes("resetAutomatedTestEnvironment") && localVault.includes("removeEntry(AUTOMATED_TEST_WORKSPACE, { recursive: true })")],
  ["Prüfbericht im Testbereich", localVault.includes("Automatische_Testumgebung_Letzter_Bericht.json")],
  ["keine externe Übertragung", localVault.includes("externalTransfer: false") && localVault.includes("outsideFilesChanged: false")],
  ["Hauptaktion sichtbar", portal.includes("Testumgebung automatisch einrichten und prüfen")],
  ["Ergebnis und Prüfpunkte sichtbar", portal.includes("automaticTestReport.checks.map") && portal.includes("Automatische Testumgebung eingerichtet und geprüft")],
  ["erneute Freigabe verständlich", localVault.includes("Browserfreigabe bestätigen") && portal.includes("Berechtigung bei jeder Verwendung erneut")],
  ["Reset nur nach Bestätigung", portal.includes("Nur der eindeutig gekennzeichnete Ordner") && portal.includes("window.confirm")],
  ["responsive Darstellung", styles.includes(".automatic-test-checks") && styles.includes(".automatic-test-action")],
  ["Systemprüfung registriert", manifest.completedCapabilities?.includes("Automatische wiederverwendbare Testumgebung 2.28.1")],
  ["Commit und TEMP-Aufräumen getrennt", localVault.includes("Eine solche Sperre darf den gültigen Commit nicht") && localVault.includes("options?.diagnostics?.push(diagnostic)")],
  ["alte TEMP-Dateien nur verzögert bereinigt", localVault.includes("10 * 60 * 1000") && localVault.includes("cleanupStaleRegisterTemporaryFiles")],
  ["begrenzter Wiederholungsversuch", localVault.includes("attempt <= maxAttempts") && localVault.includes("retryableRegisterWriteError") && localVault.includes("maxAttempts = 3")],
  ["deutsche Fehlerursachen", ["NotAllowedError", "NotFoundError", "InvalidStateError", "NoModificationAllowedError", "QuotaExceededError"].every((name) => localVault.includes(name))],
  ["Arbeitsschritt in Fehlermeldung", localVault.includes("Automatische Testumgebung – Arbeitsschritt")],
  ["geschriebene Testdatei wieder eingelesen", localVault.includes("konnte aber nicht identisch wieder eingelesen werden")],
  ["Prüfbericht wieder eingelesen", localVault.includes("Prüfbericht schreiben und wieder einlesen") && localVault.includes("JSON.parse(written)")],
  ["Laufzeit-Selbsttests ohne veraltete starre Sollzahl", portal.includes("automatedTestEnvironmentTests.length > 0") && !portal.includes("automatedTestEnvironmentTests.length === 32")],
  ["stabile Zielpfadauflösung", localVault.includes("resolveRestoredRegisterDirectory") && localVault.includes("writeIndexToRegisterDirectory(resolveRestoredRegisterDirectory")],
  ["Schreibprobe vor Wiederherstellung", localVault.includes('verifyWritableDirectory(resolveTarget, "Wiederherstellungsziel")')],
  ["Sicherungsquelle erneut aufgelöst", localVault.includes("const resolveBackup = input.refreshBackup") && localVault.includes("await resolveBackup()")],
  ["NotFound kontrolliert wiederholt", localVault.includes('"NotFoundError", "InvalidStateError"') && localVault.includes("retryFileSystemOperation")],
  ["konkurrierende Registerschreibvorgänge gesperrt", localVault.includes("withRegisterWriteLock") && localVault.includes("registerWriteLock")],
  ["kritischer Fehlerstatus", portal.includes("Kritische Pflichtprüfung fehlgeschlagen") && portal.includes("automaticTestBlocked")],
  ["abhängige Aktionen gesperrt", portal.includes("critical-dependent") && portal.includes("Durch kritischen Fehler gesperrt")],
  ["allgemeiner Fehlerbericht kopierbar", portal.includes("Allgemeinen technischen Fehlerbericht kopieren") && portal.includes("navigator.clipboard.writeText")],
  ["Hilfe und Systemprüfung bleiben erreichbar", portal.includes('onGo("help")') && portal.includes('onGo("systemcheck")')],
  ["kritischer Status bleibt sichtbar", portal.includes("family-auto-test-critical-v32") && portal.includes("localStorage.setItem")],
  ["sichtbar graue Sperre", styles.includes(".button.critical-dependent:disabled") && styles.includes("cursor: not-allowed")],
  ["Windows-Diagnose bleibt trotz Sperre erreichbar", portal.includes("Windows-Dateisystem diagnostizieren") && portal.includes("runStorageDiagnostic") && !portal.includes('diagnostic-test-action critical-dependent')],
  ["Diagnose protokolliert technische Pfade ohne Dokumentinhalte", localVault.includes('reportType: "DATEISYSTEM_DIAGNOSE"') && localVault.includes("relativePath") && localVault.includes("fullPath") && localVault.includes("personalDocumentContentsIncluded: false")],
  ["sieben getrennte Diagnosephasen", ["permission", "target", "small_file", "temporary_register", "short_path", "long_path", "backup_restore"].every((id) => localVault.includes(`id: "${id}"`)) && localVault.includes("phases")],
  ["Diagnose läuft nach Einzelfehler weiter", localVault.includes("Diagnosephase fehlgeschlagen") && localVault.includes("return null") && localVault.includes("skipPhase")],
  ["Direktschreiben ohne Wiederherstellung geprüft", localVault.includes("Kleine_Schreibprobe.txt") && localVault.includes("directWriteWithoutRestore")],
  ["Zielzustand unmittelbar vor Registerschreiben erfasst", localVault.includes("Ziel unmittelbar vor dem Schreiben prüfen") && localVault.includes("parentExists") && localVault.includes("targetExists") && localVault.includes("queriedDirectoryPermission")],
  ["erneuter Leseversuch nach Fehler protokolliert", localVault.includes("Erneuter Leseversuch nach Schreibfehler") && localVault.includes("reread_failure")],
  ["Windows-Diagnosebericht eindeutig kopierbar", portal.includes("Windows-Diagnosebericht kopieren") && portal.includes("copyStorageDiagnostic")],
  ["Diagnosebericht bleibt nach Neuladen verfügbar", portal.includes("family-storage-diagnostic-v32") && portal.includes("localStorage.setItem(storageDiagnosticStorageKey") && portal.includes("localStorage.getItem(storageDiagnosticStorageKey")],
  ["beide Berichte bleiben bei Fehlersperre erreichbar", portal.includes("Windows-Diagnosebericht kopieren") && portal.includes("Allgemeinen technischen Fehlerbericht kopieren") && !portal.includes("diagnostic-test-action critical-dependent")],
  ["Diagnosebericht im Testbereich", localVault.includes("Dateisystem_Diagnosebericht.json") && localVault.includes("06_Diagnose")],
  ["vollständige Pfade und Längen protokolliert", localVault.includes("fullPath") && localVault.includes("pathLength") && portal.includes("Pfadvergleich")],
  ["langer Vergleichspfad reproduzierbar", localVault.includes("Testwiederherstellung_2026-10-14T20-00-00-000Z") && localVault.includes("PFADLÄNGE_BESTÄTIGT")],
  ["verkürzter Wiederherstellungspfad", localVault.includes('restore: "04_R"') && localVault.includes("FA_TEMP_") && localVault.includes("shortTemporaryName")],
  ["Pfadlängenprüfung registriert", manifest.completedCapabilities?.includes("Windows-Pfadlängenprüfung und verkürzte Testpfade 2.28.1")],
];

const failureModeTests = await runAutomatedTestFailureModeTests();
for (const test of failureModeTests) tests.push([test.summary, test.passed]);

const failed = tests.filter(([, passed]) => !passed);
for (const [label, passed] of tests) console.log(`${passed ? "🟢" : "🔴"} ${label}`);
if (failed.length) {
  console.error(`\n${failed.length} Prüfungen fehlgeschlagen.`);
  process.exit(1);
}

console.log(`\nAutomatische Testumgebung: ${tests.length}/${tests.length} Tests bestanden.`);
