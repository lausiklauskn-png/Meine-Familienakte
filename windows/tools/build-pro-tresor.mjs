// Gemeinsamer kanonischer Tresor für Windows: eigenes kleines JRE im Installer, kein System-Java.
import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, mkdirSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
const ziel = path.join(root, "windows/src-tauri/pro-tresor");
const klassen = path.join(root, "work/pro-tresor-klassen");
const basis = "android/app/src/main/java/de/familyprojekt/";
const quellen = readdirSync(path.join(root, basis, "tresor")).filter((f) => f.endsWith(".java") && f !== "SafAblage.java").map((f) => basis + "tresor/" + f);
mkdirSync(ziel, { recursive: true }); rmSync(klassen, { recursive: true, force: true }); mkdirSync(klassen, { recursive: true });
const java = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "java.exe" : "java") : "java";
execFileSync(java, ["com.sun.tools.javac.Main", "-encoding", "UTF-8", "-d", klassen, ...quellen,
  basis + "familienakte/ProTresorAdapter.java", "windows/java/de/familyprojekt/familienakte/ProTresorEngine.java"], { cwd: root, stdio: "inherit" });
execFileSync(java, ["sun.tools.jar.Main", "--create", "--file", path.join(ziel, "familienakte-tresor.jar"), "-C", klassen, "."], { cwd: root, stdio: "inherit" });
if (!process.argv.includes("--nur-jar")) {
  const runtime = path.join(ziel, "runtime");
  if (existsSync(runtime)) rmSync(runtime, { recursive: true, force: true });
  execFileSync(java, ["--module", "jdk.jlink/jdk.tools.jlink.internal.Main", "--add-modules", "java.base,java.desktop",
    "--strip-debug", "--no-header-files", "--no-man-pages", "--output", runtime], { cwd: root, stdio: "inherit" });
  const probe = spawnSync(path.join(runtime, "bin", process.platform === "win32" ? "java.exe" : "java"),
    ["-Djava.awt.headless=true", "-cp", path.join(ziel, "familienakte-tresor.jar"), "de.familyprojekt.familienakte.ProTresorEngine", path.join(klassen, "probe-config.json")],
    { input: '{"aktion":"zustand"}\n', encoding: "utf8", timeout: 15000 });
  if (probe.status !== 0 || probe.stdout.trim() !== '{"ok":{"status":"getrennt"}}') throw new Error("Gebündelte Pro-Tresor-Laufzeit besteht Startprobe nicht.");
}
console.log("Windows-Pro-Tresor: Kanon und Adapter im gemeinsamen lokalen Java-Kern gebaut");
