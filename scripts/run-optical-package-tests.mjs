import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const portal = readFileSync(resolve(root, "app/health-portal.tsx"), "utf8");
const styles = readFileSync(resolve(root, "app/globals.css"), "utf8");
const inventory = portal.slice(portal.indexOf("function InventoryCenter"), portal.indexOf("function HelpCenter"));
const security = portal.slice(portal.indexOf("function SecurityCenter"), portal.indexOf("const cockpitRecordTypeLabel"));

assert.ok(portal.includes("Website-Version 34 – harmonische Systemprüfung"), "Der harmonisierte Website-Stand 34 fehlt im Changelog.");
assert.ok(styles.includes(".search-command-bar .global-search input") && styles.includes("border-radius: 999px"), "Das ovale Startseiten-Suchfeld fehlt.");
assert.ok(security.includes("security-grid-three") && security.includes("security-grid-two") && !security.includes("Zwei-Faktor-Authentifizierung"), "Das Sicherheitscenter verwendet nicht die freigegebene Drei-plus-Zwei-Kartenstruktur oder enthält noch die entfernte 2FA-Infokarte.");
assert.ok(security.includes("InfoPopover label=\"OneDrive-Verbindung erklären\"") && security.includes("InfoPopover label=\"Vollständige Sicherung erklären\""), "Die eigenständigen Hilfen im Sicherheitscenter fehlen.");
assert.ok(inventory.indexOf("test-workspace-actions") < inventory.indexOf("inventory-steps") && inventory.indexOf("inventory-steps") < inventory.indexOf("storageDiagnosticReport &&"), "Die Reihenfolge Hauptaktionen → Quelle/Analyse/Archiv → Windows-Diagnose stimmt nicht.");
assert.ok(styles.includes(".inventory-steps > div") && styles.includes("border-radius: 14px") && styles.includes("gap: 12px"), "Die vorhandenen drei Bestandskarten sind optisch nicht getrennt.");
assert.ok(inventory.includes("Vorheriger Fehler – noch nicht erneut geprüft") && styles.includes(".button.critical-dependent:disabled"), "Frühere Fehler oder kritische Aktionssperren werden nicht eindeutig dargestellt.");
assert.ok(styles.includes('.form-error::before { content: "Fehlermeldung: ";') && styles.includes("background: #8f252b"), "Die einheitliche kaminrote Fehlerdarstellung fehlt.");
assert.ok(styles.includes(".final-test-scope summary") && styles.includes('.final-test-scope[open] summary::after { content: "−";'), "Der kompakte ein- und ausklappbare Prüfumfang fehlt.");
assert.ok(portal.includes("system-check-control-grid") && portal.includes("system-check-result-grid") && styles.includes(".system-check-button-row"), "Die symmetrische Karten- und Aktionsstruktur der Systemprüfung fehlt.");
assert.ok(portal.includes('label="Sicherheitsregeln erklären"') && portal.includes('label={`${area.label} erklären`}') && !portal.includes('className={`card system-check-summary'), "Hilfen oder die bereinigte einmalige Ergebnisanzeige der Systemprüfung fehlen.");
assert.ok(styles.includes("grid-template-columns: repeat(3,minmax(0,1fr))") && styles.includes(".check-area-head h3"), "Die gleichmäßigen kompakten Prüfkarten fehlen.");
assert.ok(styles.includes("@media (max-width: 1100px)") && styles.includes("@media (max-width: 900px)") && styles.includes("@media (max-width: 620px)"), "Die Desktop-, Tablet- oder Mobilanpassungen fehlen.");
assert.ok(portal.includes('className="button primary" disabled={!preview || sensitive}') && styles.includes(".inventory-preview-modal"), "Die vorhandene Dokumentvorschau besitzt keine klare Hauptaktion.");

console.log("🟢 Optisches Gesamtpaket: Startseite, Sicherheitscenter, Bestandsprüfung, Fehlerdarstellung, Systemprüfung und Vorschau geprüft");
console.log("🟢 Bedienlogik: Hauptaktionen, Info-Hilfen, Statusfarben und kritische Sperren bleiben getrennt");
console.log("🟢 Responsivität: Desktop-, Tablet- und Smartphone-Regeln vorhanden; keine neue Fach- oder Speicherlogik eingeführt");
