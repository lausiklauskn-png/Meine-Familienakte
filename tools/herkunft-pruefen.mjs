// Prüft, dass die byte-gleich übernommenen Bausteine (native/HERKUNFT.json) unverändert sind. Rückgabe 1 bei Abweichung.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const herkunft = JSON.parse(readFileSync(path.join(root, "native/HERKUNFT.json"), "utf8"));
let rot = 0;
for (const [datei, pin] of Object.entries(herkunft.dateien)) {
  const ist = createHash("sha256").update(readFileSync(path.join(root, datei))).digest("hex");
  if (ist === pin.sha256) console.log(`🟢 ${datei} byte-gleich mit ${pin.repo}/${pin.pfad} @ ${pin.commit.slice(0, 7)}`);
  else { rot++; console.log(`🔴 ${datei} weicht ab: ${ist} statt ${pin.sha256}`); }
}
process.exit(rot ? 1 : 0);
