#!/usr/bin/env node
// tools/wfpdf-nachziehen.mjs — den Kern von Workflow PDF byte-1:1 in die Familienakte holen (Klaus 2026-10-31, Sitzung F:
// „das komplette Programm von Workflow PDF … Felder erkennen mit oder ohne KI … beschriften … zurücksenden mit Unterschrift“).
// Vorbild: BookLedgerPro tools/wfpdf-nachziehen.mjs. Ziel ist public/wfpdf/ (Vite liefert public/ unverändert aus).
// Pins (SHA-256 je Datei, Commit) in public/wfpdf/HERKUNFT.json; scripts/run-ausfuellen-tests.mjs prüft sie.
// Nur in Workflow-PDF ändern, dann hier nachziehen — NIE von Hand. Der Klebstoff für React steht in app/ausfuellen-*.
//   node tools/wfpdf-nachziehen.mjs            # Klon unter ../Workflow-PDF (sonst WFPDF_KLON=…)
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// [Ziel in der Familienakte, Quelle im Workflow-PDF-Klon]
export const DATEIEN = [
  ["public/wfpdf/scanner.js", "assets/scanner.js"],
  ["public/wfpdf/scan-bild.js", "assets/scan-bild.js"],
  ["public/wfpdf/blatt.js", "assets/blatt.js"],
  ["public/wfpdf/zip.js", "assets/zip.js"],
  ["public/wfpdf/erkennung.js", "assets/erkennung.js"],
  ["public/wfpdf/export.js", "assets/export.js"],
  ["public/wfpdf/reinigung.js", "assets/reinigung.js"],
  ["public/wfpdf/schluesseltresor.js", "assets/schluesseltresor.js"],
  ["public/wfpdf/pdf-lib.min.js", "vendor/pdf-lib.min.js"],
  ["public/wfpdf/fontkit.umd.min.js", "vendor/fontkit.umd.min.js"],
  ["public/wfpdf/fontkit-LICENSE.txt", "vendor/fontkit-LICENSE.txt"],
  ["public/wfpdf/fonts/NotoSans-Regular.ttf", "vendor/fonts/NotoSans-Regular.ttf"],
  ["public/wfpdf/fonts/OFL.txt", "vendor/fonts/OFL.txt"],
];
// ganze Ordner: Blatterkennung (Modell, ONNX-Laufzeit, Lizenz) und Texterkennung (Tesseract samt Sprachen DE/EN/RU)
export const ORDNER = [
  ["public/wfpdf/vendor/scanic", "vendor/scanic"],
  ["public/wfpdf/vendor/tesseract", "vendor/tesseract"],
  ["public/wfpdf/vendor/tesseract/lang", "vendor/tesseract/lang"],
];
export const HINWEIS = "Byte-1:1 aus Workflow-PDF (tools/wfpdf-nachziehen.mjs). Nie von Hand ändern. Der Klebstoff (app/ausfuellen-*.tsx, app/wfpdf-kern.ts, public/wfpdf-fa/scanner.css) ist Familienakte-eigen.";
const sha = (b) => createHash("sha256").update(b).digest("hex");

export function nachziehen(klon) {
  if (!existsSync(join(klon, "assets", "scanner.js"))) throw new Error("kein Workflow-PDF-Klon: " + klon);
  let commit = ""; try { commit = execSync("git rev-parse HEAD", { cwd: klon, encoding: "utf8" }).trim(); } catch { commit = ""; }
  const dateien = {};
  const kopiere = (ziel, quelle) => {
    const b = readFileSync(join(klon, quelle));
    mkdirSync(join(WURZEL, dirname(ziel)), { recursive: true });
    writeFileSync(join(WURZEL, ziel), b);
    dateien[ziel] = { quelle, sha256: sha(b) };
  };
  for (const [z, q] of DATEIEN) kopiere(z, q);
  for (const [z, q] of ORDNER) for (const n of readdirSync(join(klon, q)).sort()) if (statSync(join(klon, q, n)).isFile()) kopiere(z + "/" + n, q + "/" + n);
  return { repo: "lausiklauskn-png/Workflow-PDF", commit, stand: new Date().toISOString().slice(0, 10), dateien, hinweis: HINWEIS };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const klon = resolve(WURZEL, process.env.WFPDF_KLON || "../Workflow-PDF");
  const h = nachziehen(klon);
  writeFileSync(join(WURZEL, "public", "wfpdf", "HERKUNFT.json"), JSON.stringify(h, null, 2) + "\n");
  console.log(`Workflow PDF ${h.commit.slice(0, 7)}: ${Object.keys(h.dateien).length} Dateien nachgezogen.`);
}
