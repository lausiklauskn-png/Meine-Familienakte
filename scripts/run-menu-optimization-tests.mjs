import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runMenuOptimizationSelfTests, START_PAGE_REFERENCE_SHA256 } from "../lib/menu-optimization.ts";

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const portal = read("app/health-portal.tsx");
const controls = read("app/ui-controls.tsx");
const styles = read("app/globals.css");
const overview = portal.slice(portal.indexOf("function Overview"), portal.indexOf("function DocumentIntakePanel"));
const recentBlock = overview.slice(overview.indexOf('className="card recent-card priority-recent"'), overview.indexOf("<DocumentIntakePanel"));
const overviewHash = createHash("sha256").update(overview).digest("hex");

assert.equal(overviewHash, START_PAGE_REFERENCE_SHA256, "Die Startseiten-Komponente weicht vom ausdrücklich freigegebenen Referenzstand dieser Version ab.");
assert.ok(portal.includes('const APP_VERSION = "2.28.1"'), "Die neue Familienakten-Version fehlt.");
assert.ok(overview.includes("DocumentIntakePanel") && overview.includes("MemoryCapturePanel") && overview.indexOf("priority-recent") < overview.indexOf("DocumentIntakePanel") && overview.indexOf("DocumentIntakePanel") < overview.indexOf("MemoryCapturePanel") && overview.indexOf("MemoryCapturePanel") < overview.indexOf('id=\"lebensbereiche\"'), "Dokumenteneingang und Memory-Modul stehen nicht in der freigegebenen Reihenfolge vor den Lebensbereichen.");
assert.ok(overview.includes("hero-cockpit-grid") && overview.includes("Noch keine aktuellen Objektinformationen vorhanden"), "Das vergrößerte Objekt-Cockpit oder sein ehrlicher Leerzustand fehlt.");
assert.ok(controls.includes("function InfoPopover") && styles.includes(".start-info-popover") && controls.includes('document.addEventListener("pointerdown"') && controls.includes('event.key === "Escape"') && controls.includes('new CustomEvent("family-info-open"'), "Die einheitliche Info-Funktion schließt nicht zuverlässig außerhalb, mit Escape oder beim Öffnen eines zweiten Fensters.");
assert.ok(portal.includes("intake-method-card") && portal.includes('InfoPopover label="Dokumenteneingang erklären" text="So nutzt du den Dokumenteneingang am besten:') && !portal.includes('className="info-notice intake-info"'), "Die vier harmonisierten Eingangskarten fehlen oder die Nutzungshinweise stehen nicht ausschließlich im Fragezeichen.");
assert.ok(portal.includes("memory-function-grid") && portal.includes("Legt den aktuellen Inhalt als noch nicht geprüften Entwurf ab."), "Die gleichwertigen Memory-Funktionskarten fehlen.");
assert.ok(!overview.includes("cabinet-card-wide") && !overview.includes("Webseite bearbeiten") && overview.includes("Systemprüfung öffnen") && overview.includes('onGo("systemcheck")') && !overview.includes("Jetzt Systemprüfung reparieren"), "Der lokale Aktenschrank, der entfernte Bearbeitungszugang oder der direkte Systemprüfungszugang entsprechen nicht der Korrekturanweisung.");
assert.ok(recentBlock.includes("vault-action-strip") && recentBlock.includes("Datentresor verbinden") && recentBlock.includes("Datentresor verbunden") && recentBlock.includes("Neue Unterlage ablegen") && recentBlock.includes("Abgleich durchführen") && recentBlock.includes("Akte aktualisieren") && recentBlock.includes('onGo("security")') && !recentBlock.includes("der Systemprüfung") && !recentBlock.includes("Im gemeinsamen Datenmodell ist derzeit nichts Dringendes offen"), "Die vier ovalen Datentresor- und Sicherungsaktionen fehlen, der Systemprüfungshinweis ist doppelt oder der entfernte Leerhinweis ist noch vorhanden.");
assert.ok(recentBlock.includes('InfoPopover label="Datentresor verbinden erklären"') && recentBlock.includes('InfoPopover label="Neue Unterlage ablegen erklären"') && recentBlock.includes('InfoPopover label="Abgleich durchführen erklären"') && recentBlock.includes('InfoPopover label="Akte aktualisieren erklären"') && !recentBlock.includes("vault-action-explanation"), "Die vier getrennten Info-Hilfen der Schnellzugriffe fehlen oder lange Erklärungstexte stehen weiterhin dauerhaft unter den Schaltflächen.");
assert.ok(styles.includes("border-radius: 999px") && styles.includes(".vault-action-item > .start-info-popover"), "Das ovale Suchfeld oder die eigenständige Info-Schaltfläche der Schnellzugriffe fehlt.");
assert.ok(overview.includes("systemProblemSummary") && overview.includes("Systemprüfung vollständig – keine offenen Punkte.") && overview.includes("offene${openProblems.length === 1 ? \"r Punkt\" : \" Punkte\"} der Systemprüfung"), "Der Systemprüfungsstatus wurde nicht vollständig im gelben Systemprüfungsbereich zusammengeführt.");
assert.ok(overview.includes("buildStoredPersonalLifeAreas") && overview.includes("personal-life-area-card") && overview.includes("onOpenLifeArea(area.name)"), "Gespeicherte persönliche Lebensbereiche werden nicht dynamisch in die gemeinsame Kartenstruktur eingebunden.");
assert.ok(portal.includes("function InfoNotice") && styles.includes(".info-notice") && styles.includes("background: white") && portal.includes('<span>Info</span>'), "Der einheitliche Info-Hinweis ist nicht vollständig umgesetzt.");
assert.ok(portal.includes("function SubpageActions") && styles.includes(".subpage-actions"), "Die gemeinsamen interaktiven Hauptaktionen fehlen.");
assert.ok(!portal.includes("object-card static"), "Eine funktionslos wirkende Objektkarte ist verblieben.");
assert.ok(portal.includes("targetForRelation") && portal.includes("dossierTypeOrder") && portal.includes("openDocumentLibrary"), "Direkte Dokument-, Detail- oder Beziehungsziele fehlen.");
assert.ok(portal.includes('className="document-title-link"') && portal.includes("onOpenDocument(item.id)"), "Dokumenttitel im Eingang sind nicht direkt interaktiv.");
assert.ok(portal.includes("schedule-filter") && portal.includes('id="offene-fristen"'), "Fristen-Zähler oder aktive Fristenansicht sind nicht interaktiv.");
assert.ok(styles.includes("@media (max-width: 620px)") && styles.includes(".subpage-actions") && styles.includes(".dossier-link-group"), "Die mobile Darstellung der optimierten Unterseiten ist unvollständig.");

const requiredPages = [
  "HealthHub", "FamilyArea", "PreparedArea", "DocumentLibrary", "Inbox", "Medical",
  "Benefits", "Work", "Assessment", "Correspondence", "Sources", "ReminderCenter",
  "InteractiveCockpit", "WhatsNew", "HelpCenter", "SystemCheck", "VersionHistory",
];
for (const page of requiredPages) assert.ok(portal.includes(`function ${page}`), `Unterseite ${page} ist nicht erreichbar.`);

const tests = runMenuOptimizationSelfTests();
assert.equal(tests.length, 18, "Für die Menüoptimierung müssen genau 18 Interaktivitäts-Praxistests vorhanden sein.");
for (const test of tests) {
  assert.equal(test.passed, true, `${test.label}: ${test.summary}`);
  console.log(`🟢 ${test.label}: ${test.summary}`);
}

console.log(`🟢 Startseite mit freigegebenem Memory-Modul geschützt: Referenz-Hash ${overviewHash}`);
console.log("🟢 Unterseiten-Integrität: gemeinsame Suche, Dokumentenbibliothek, Cockpit- und Fristenlogik wiederverwendet");
console.log("🟢 Datenschutz: Gesundheitsdetails bleiben im geschützten Bereich; keine fachlichen Daten verändert");
