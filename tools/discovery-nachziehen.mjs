// Zieht die Seite „Discovery“ des Datei-Organizers (so wurde der Sortier-Kern trainiert) byte-gleich nach public/discovery/.
// Nie von Hand ändern – nur über dieses Werkzeug. Pins: public/discovery/HERKUNFT.json (geprüft von tools/herkunft-pruefen.mjs).
// Aufruf: node tools/discovery-nachziehen.mjs [--quelle ../Datei-Organizer] [--commit <Stand>]   – kopiert und schreibt die Pins
//         (ohne --commit pinnt es den letzten Stand der Quelle, der die Discovery-Dateien geändert hat)
//         node tools/discovery-nachziehen.mjs --pruefen                       – vergleicht public/discovery/ mit den Pins (Rückgabe 1 bei Abweichung)
import { createHash } from "node:crypto"; import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), ziel = path.join(root, "public/discovery"), pinDatei = path.join(ziel, "HERKUNFT.json");
const sha = (datei) => createHash("sha256").update(readFileSync(datei)).digest("hex");
const alle = (dir, vor = "") => readdirSync(dir).flatMap((n) => statSync(path.join(dir, n)).isDirectory() ? alle(path.join(dir, n), `${vor}${n}/`) : [`${vor}${n}`]).sort();

if (process.argv.includes("--pruefen")) {
  const pin = JSON.parse(readFileSync(pinDatei, "utf8")); let rot = 0;
  for (const [datei, soll] of Object.entries(pin.dateien)) {
    const voll = path.join(ziel, datei), ist = existsSync(voll) ? sha(voll) : "fehlt";
    if (ist !== soll) { rot++; console.log(`🔴 public/discovery/${datei} weicht ab: ${ist} statt ${soll}`); }
  }
  for (const datei of alle(ziel)) if (datei !== "HERKUNFT.json" && !(datei in pin.dateien)) { rot++; console.log(`🔴 public/discovery/${datei} steht nicht in den Pins`); }
  if (!rot) console.log(`🟢 public/discovery/ byte-gleich mit ${pin.quelle}/${pin.pfad} @ ${pin.commit.slice(0, 7)} (${Object.keys(pin.dateien).length} Dateien)`);
  process.exit(rot ? 1 : 0);
}

const i = process.argv.indexOf("--quelle"), quelle = path.resolve(root, i > 0 ? process.argv[i + 1] : "../Datei-Organizer"), von = path.join(quelle, "src/public");
// Alles, was die Seite neben sich braucht: jede Datei der Quelle, deren Name mit „discovery“ beginnt (Seite, three.js r128 (MIT),
// Filme, Standbilder), samt dem Ordner discovery-ton (Tonspuren). Keine feste Liste – neue Filme der Quelle kommen von selbst mit.
const DATEIEN = readdirSync(von).filter((n) => n.startsWith("discovery")).flatMap((n) => statSync(path.join(von, n)).isDirectory() ? alle(path.join(von, n), `${n}/`) : [n]).sort();
if (!DATEIEN.includes("discovery.html")) { console.error(`In ${von} liegt keine discovery.html.`); process.exit(1); }
const git = (...a) => execFileSync("git", ["-C", quelle, ...a], { encoding: "utf8" }).trim();
const pfade = DATEIEN.map((d) => `src/public/${d}`);
if (git("status", "--porcelain", "--", ...pfade)) { console.error("Quelle hat ungesicherte Änderungen an der Discovery-Seite – erst dort einchecken."); process.exit(1); }
// Auch Dateien, die noch nicht eingecheckt sind, zählen als ungesichert (git status meldet sie mit „??“).
const k = process.argv.indexOf("--commit"), commit = k > 0 ? git("rev-parse", process.argv[k + 1]) : git("log", "-1", "--format=%H", "--", ...pfade);
// Der genannte Stand muss genau diese Dateien tragen (sonst passte der Pin nicht zur Kopie).
if (git("diff", "--name-only", commit, "HEAD", "--", ...pfade)) { console.error(`Stand ${commit.slice(0, 7)} trägt andere Discovery-Dateien als der Arbeitsstand der Quelle.`); process.exit(1); }
// Was die Quelle nicht mehr hat, verschwindet auch hier (sonst meldete --pruefen fremde Dateien).
if (existsSync(ziel)) for (const d of alle(ziel)) if (d !== "HERKUNFT.json" && !DATEIEN.includes(d)) rmSync(path.join(ziel, d));
const dateien = {};
for (const d of DATEIEN) { mkdirSync(path.dirname(path.join(ziel, d)), { recursive: true }); copyFileSync(path.join(von, d), path.join(ziel, d)); dateien[d] = sha(path.join(ziel, d)); }
writeFileSync(pinDatei, JSON.stringify({ quelle: "lausiklauskn-png/Datei-Organizer", pfad: "src/public/", commit, stand: new Date().toISOString().slice(0, 10), hinweis: "byte-gleich; nie von Hand ändern, nur über tools/discovery-nachziehen.mjs", dateien }, null, 1) + "\n");
console.log(`${DATEIEN.length} Dateien aus Datei-Organizer @ ${commit.slice(0, 7)} nach public/discovery/`);
