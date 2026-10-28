// Fährt alle Oberflächenproben unter tests/ui/*.test.mjs nacheinander. Rückgabe 1, wenn eine rot ist.
// Aufruf: node tests/run-ui.mjs [Filter]   – Filter = Teil des Dateinamens.
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "ui");
const filter = process.argv[2] || "";
const files = readdirSync(dir).filter((f) => f.endsWith(".test.mjs") && f.includes(filter)).sort();
if (!files.length) { console.error("Keine Proben gefunden."); process.exit(2); }
let failed = 0;
for (const file of files) {
  console.log(`\n=== ${file} ===`);
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(dir, file)], { stdio: "inherit", env: process.env });
    child.on("exit", (c) => resolve(c ?? 1));
  });
  if (code !== 0) { failed++; console.log(`✗ ${file} → Rückgabe ${code}`); }
}
console.log(`\n${files.length - failed}/${files.length} Proben grün`);
process.exit(failed ? 1 : 0);
