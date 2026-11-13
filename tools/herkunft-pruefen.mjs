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
// Pro-App-Verbund (Karte aus BookLedgerPro, Hilfe-Thema „Pro-App-Verbund (Vorschau)“): Pin steht neben der Datei.
for (const pinDatei of ["public/pro-verbund/pro-verbund.herkunft.json", "public/tresor-leser/tresor-leser.herkunft.json"]) {
  const pin = JSON.parse(readFileSync(path.join(root, pinDatei), "utf8"));
  const datei = path.join(path.dirname(pinDatei), path.basename(pin.datei));
  const ist = createHash("sha256").update(readFileSync(path.join(root, datei))).digest("hex");
  if (ist === pin.sha256) console.log(`🟢 ${datei} byte-gleich mit ${pin.quelle}/${pin.datei}${pin.commit ? ` @ ${pin.commit.slice(0, 7)}` : ""} (Stand ${pin.stand})`);
  else { rot++; console.log(`🔴 ${datei} weicht ab: ${ist} statt ${pin.sha256}`); }
}
// Sortier-Kern des Datei-Organizers (lib/sortierkern/, nachgezogen mit tools/sortierkern-nachziehen.mjs)
{
  const pin = JSON.parse(readFileSync(path.join(root, "lib/sortierkern/HERKUNFT.json"), "utf8"));
  for (const [datei, sha] of Object.entries(pin.dateien)) {
    const ist = createHash("sha256").update(readFileSync(path.join(root, "lib/sortierkern", datei))).digest("hex");
    if (ist === sha) console.log(`🟢 lib/sortierkern/${datei} byte-gleich mit ${pin.quelle}/${pin.pfad}${datei} @ ${pin.commit.slice(0, 7)}`);
    else { rot++; console.log(`🔴 lib/sortierkern/${datei} weicht ab: ${ist} statt ${sha}`); }
  }
}
process.exit(rot ? 1 : 0);
