import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { jsonDependency } from "./model-json-dependency.mjs";
const root = fileURLToPath(new URL("../../", import.meta.url)), classes = mkdtempSync(join(tmpdir(), "fa-model-classes-"));
try {
  const jar = await jsonDependency(), base = "android/app/src/main/java/de/familyprojekt/privatebrain/pro/";
  execFileSync("java", ["-m", "jdk.compiler/com.sun.tools.javac.Main", "-encoding", "UTF-8", "-cp", jar, "-d", classes,
    ...["AppNetwork.java", "SemanticModel.java", "FamilyModels.java"].map(name => base + name), "tools/native/FamilyModelsTest.java"], { cwd: root, stdio: "inherit" });
  execFileSync("java", ["-Xmx256m", "-cp", classes + delimiter + jar, "de.familyprojekt.privatebrain.pro.FamilyModelsTest"], { cwd: root, stdio: "inherit", timeout: 60000 });
} finally { rmSync(classes, { recursive: true, force: true }); }
