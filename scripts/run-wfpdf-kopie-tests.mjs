import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { nachziehen, ZIEL } from "../tools/wfpdf-app-nachziehen.mjs";

const tmp = mkdtempSync(join(tmpdir(), "fa-wfpdf-kopie-"));
try {
  const quelle = join(tmp, "quelle"), ziel = join(tmp, "ziel");
  mkdirSync(join(quelle, "assets"), { recursive: true });
  const git = (...args) => execFileSync("git", args, { cwd: quelle, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const index = '<html><head><meta charset="utf-8"><script defer src="assets/sbkim-init.js?v=1"></script></head><body><script>if(\'serviceWorker\' in navigator&&location.protocol===\'https:\')navigator.serviceWorker.register(\'sw.js\').catch(function(){});</script></body></html>';
  writeFileSync(join(quelle, "index.html"), index);
  writeFileSync(join(quelle, "assets/app.js"), "// erfundener Kern\n");
  mkdirSync(join(ziel, ZIEL), { recursive: true });
  writeFileSync(join(ziel, ZIEL, "alt"), "bisherige Kopie");
  assert.throws(() => nachziehen(quelle, ziel), /git/);
  assert.equal(readFileSync(join(ziel, ZIEL, "alt"), "utf8"), "bisherige Kopie");
  git("init"); git("config", "user.name", "Kopierprobe"); git("config", "user.email", "probe@example.invalid");
  git("add", "."); git("commit", "-m", "Erfundene Quelle");
  writeFileSync(join(quelle, "nicht-eingecheckt.txt"), "nicht übernehmen");
  const e = nachziehen(quelle, ziel);
  assert.equal(e.commit, git("rev-parse", "HEAD"));
  assert.deepEqual(Object.keys(e.dateien), ["assets/app.js", "index.html"]);
  assert.equal(readFileSync(join(ziel, ZIEL, "assets/app.js"), "utf8"), "// erfundener Kern\n");
  const vorher = readFileSync(join(ziel, ZIEL, "index.html"));
  writeFileSync(join(quelle, "assets/app.js"), "// nicht eingecheckte Änderung\n");
  assert.throws(() => nachziehen(quelle, ziel), /nicht eingecheckte/);
  assert.deepEqual(readFileSync(join(ziel, ZIEL, "index.html")), vorher);
  assert.equal(readFileSync(join(ziel, ZIEL, "assets/app.js"), "utf8"), "// erfundener Kern\n");
  git("add", "."); git("commit", "-m", "Geänderter Kern");
  writeFileSync(join(quelle, "index.html"), "kein passender Einstieg");
  git("add", "."); git("commit", "-m", "Unpassender Einstieg");
  assert.throws(() => nachziehen(quelle, ziel), /charset/);
  assert.deepEqual(readFileSync(join(ziel, ZIEL, "index.html")), vorher);
  assert.equal(readFileSync(join(ziel, ZIEL, "assets/app.js"), "utf8"), "// erfundener Kern\n");
  console.log("🟢 Workflow-Kopie: Quell-Commit, keine ungetrackten Dateien, Abbruch ohne Verlust bei fehlendem Git, lokalen Änderungen und unpassendem Einstieg");
} finally { rmSync(tmp, { recursive: true, force: true }); }
