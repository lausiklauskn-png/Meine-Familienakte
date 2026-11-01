import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { grossePipe } from "./pro-tresor-pipe-probe.mjs";
execFileSync(process.execPath, ["windows/tools/build-pro-tresor.mjs", "--nur-jar"], { stdio: "inherit" });
const ziel = mkdtempSync(path.join(tmpdir(), "fa-engine-probe-"));
const jar = path.resolve("windows/src-tauri/pro-tresor/familienakte-tresor.jar");
try {
  execFileSync("java", ["com.sun.tools.javac.Main", "-encoding", "UTF-8", "-cp", jar, "-d", ziel,
    "windows/java-test/de/familyprojekt/familienakte/ProTresorEngineProbe.java"], { stdio: "inherit" });
  execFileSync("java", ["-Xmx256m", "-Djava.awt.headless=true", "-cp", jar + path.delimiter + ziel, "de.familyprojekt.familienakte.ProTresorEngineProbe"], { stdio: "inherit" });
  const pipe = spawnSync("java", ["-Xmx256m", "-Djava.awt.headless=true", "-cp", jar, "de.familyprojekt.familienakte.ProTresorEngine", path.join(ziel, "config.json")], {
    input: '{"aktion":"zustand"}\n{"aktion":"shell"}\n', encoding: "utf8", timeout: 15000,
  });
  assert.equal(pipe.status, 0, pipe.stderr);
  const zeilen = pipe.stdout.trim().split("\n").map((s) => JSON.parse(s));
  assert.deepEqual(zeilen, [{ ok: { status: "getrennt" } }, { error: "FA_TRESOR_AKTION_UNGUELTIG" }]);
  console.log("Windows-Engine: echte Prozess-Pipe, Antwortformat und Ende bei EOF grün");
  await grossePipe("java", jar, ziel);

} finally { rmSync(ziel, { recursive: true, force: true }); }
