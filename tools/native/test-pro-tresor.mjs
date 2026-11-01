import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const basis = "android/app/src/main/java/de/familyprojekt/";
const ziel = mkdtempSync(path.join(tmpdir(), "fa-pro-jvm-"));
try {
  const quellen = readdirSync(basis + "tresor").filter((f) => f.endsWith(".java") && f !== "SafAblage.java").map((f) => basis + "tresor/" + f);
  execFileSync("java", ["com.sun.tools.javac.Main", "-encoding", "UTF-8", "-d", ziel, ...quellen, basis + "familienakte/ProTresorAdapter.java",
    "android/app/src/test/java/de/familyprojekt/familienakte/ProTresorAdapterProbe.java"], { stdio: "inherit" });
  execFileSync("java", ["-cp", ziel, "de.familyprojekt.familienakte.ProTresorAdapterProbe"], { stdio: "inherit" });
} finally { rmSync(ziel, { recursive: true, force: true }); }
