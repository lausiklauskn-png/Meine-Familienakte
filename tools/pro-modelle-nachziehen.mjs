#!/usr/bin/env node
// Geräteprüfung und Modellpins aus Private Brain Pro. Bytegleich aus einem
// festgelegten Git-Commit lesen; Family-spezifische Brücken bleiben daneben.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const root = fileURLToPath(new URL("../", import.meta.url));
const source = resolve(process.argv[2] || resolve(root, "../Privat-Brain-Pro"));
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: source, encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/.test(commit)) throw Error("Quell-Commit fehlt");
const java = "android/app/src/main/java/de/familyprojekt/privatebrain/pro/";
const mapping = {
  "native/pro-geraet.js": "public/native/pro-geraet.js",
  "tools/native/meaning-models.json": "public/native/meaning-models.json",
  "tools/native/semantic-model.json": "public/native/semantic-model.json",
  [java + "SemanticModel.java"]: java + "SemanticModel.java",
  [java + "ProDevicePlugin.java"]: java + "ProDevicePlugin.java",
  "windows/engine/src/DesktopGeraet.java": "windows/java/de/familyprojekt/privatebrain/pro/DesktopGeraet.java",
};
const prepared = Object.entries(mapping).map(([from, to]) => ({ from, to,
  bytes: execFileSync("git", ["show", commit + ":" + from], { cwd: source, maxBuffer: 4 * 1024 * 1024 }) }));
const manifestPath = resolve(root, "native/HERKUNFT.json"), manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
for (const { from, to, bytes } of prepared) {
  const target = resolve(root, to); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, bytes);
  manifest.dateien[to] = { repo: "lausiklauskn-png/Privat-Brain-Pro", pfad: from, commit,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    zweck: "Vorhandene Geräteprüfung, fortsetzbarer Modell-Download und feste Modellquellen; eigene Adapter getrennt" };
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log("Private Brain Pro " + commit.slice(0, 7) + ": " + prepared.length + " Dateien bytegleich übernommen");
