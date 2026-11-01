// Bytegleiche Übernahme des kanonischen Java-Pakets, ausschließlich aus einem lokalen Quellcheckout.
// Aufruf: node tools/tresor-nachziehen.mjs /pfad/Workflow-PDF-Pro
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const quelle = path.resolve(process.argv[2] || "../Workflow-PDF-Pro");
const dateien = ["Ablage", "DateiAblage", "Eintrag", "Ersatzschluessel", "Fach", "Json", "SafAblage", "TresorOrdner", "Umzug", "VaultCrypto"];
const basis = "android/app/src/main/java/de/familyprojekt/tresor";
const probe = "android/app/src/test/java/de/familyprojekt/tresor/TresorOrdnerTest.java";
const commit = execFileSync("git", ["-C", quelle, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const herkunft = JSON.parse(readFileSync(path.join(root, "native/HERKUNFT.json"), "utf8"));
// git show statt Arbeitskopie: ungesicherte Änderungen niemals als kanonischen Stand ausgeben.
const inhalte = [...dateien.map((n) => `${basis}/${n}.java`), probe].map((pfad) => ({
  pfad, bytes: execFileSync("git", ["-C", quelle, "show", `${commit}:${pfad}`], { maxBuffer: 2 * 1024 * 1024 }),
}));
for (const { pfad, bytes } of inhalte) {
  const ziel = path.join(root, pfad);
  mkdirSync(path.dirname(ziel), { recursive: true });
  writeFileSync(ziel, bytes);
  herkunft.dateien[pfad] = { repo: "lausiklauskn-png/Workflow-PDF-Pro", pfad, commit,
    sha256: createHash("sha256").update(bytes).digest("hex"), zweck: "Gemeinsamer Pro-Tresor, kanonisches Java-Paket und Originalprobe" };
}
writeFileSync(path.join(root, "native/HERKUNFT.json"), JSON.stringify(herkunft, null, 2) + "\n");
console.log(`${inhalte.length} Dateien bytegleich übernommen @ ${commit}`);
