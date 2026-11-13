// Zieht den Sortier-Kern des Datei-Organizers byte-gleich nach lib/sortierkern/ (Gruppenregel 8: ein Kern, keine zweite Fassung).
// Nie von Hand ändern – nur über dieses Werkzeug. Pins: lib/sortierkern/HERKUNFT.json (geprüft von tools/herkunft-pruefen.mjs).
// Aufruf: node tools/sortierkern-nachziehen.mjs [--quelle ../datei-organizer]
import { createHash } from "node:crypto"; import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), i = process.argv.indexOf("--quelle");
const quelle = path.resolve(root, i > 0 ? process.argv[i + 1] : "../datei-organizer"), ziel = path.join(root, "lib/sortierkern");
// nur, was die Siebe brauchen (kein Einlesen von Dateien, kein PDF, kein ZIP – das macht die Familienakte selbst)
const DATEIEN = ["typen.ts", "kategorien.ts", "erkennen.ts", "gehalt.ts", "eml.ts", "lernen.ts", "wortmodell.ts", "wortmodell-daten.ts", "siebe.ts"];
const git = (...a) => execFileSync("git", ["-C", quelle, ...a], { encoding: "utf8" }).trim();
if (git("status", "--porcelain", "--", "lib")) { console.error("Quelle hat ungesicherte Änderungen in lib/ – erst dort einchecken."); process.exit(1); }
const commit = git("log", "-1", "--format=%H", "--", "lib"); mkdirSync(ziel, { recursive: true });
const dateien = {};
for (const d of DATEIEN) { copyFileSync(path.join(quelle, "lib", d), path.join(ziel, d)); dateien[d] = createHash("sha256").update(readFileSync(path.join(ziel, d))).digest("hex"); }
writeFileSync(path.join(ziel, "HERKUNFT.json"), JSON.stringify({ quelle: "lausiklauskn-png/Datei-Organizer", pfad: "lib/", commit, stand: new Date().toISOString().slice(0, 10), hinweis: "byte-gleich; nie von Hand ändern, nur über tools/sortierkern-nachziehen.mjs", dateien }, null, 1) + "\n");
console.log(`${DATEIEN.length} Dateien aus Datei-Organizer @ ${commit.slice(0, 7)} nach lib/sortierkern/`);
