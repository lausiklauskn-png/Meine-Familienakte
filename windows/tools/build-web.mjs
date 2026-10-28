// Baut den gemeinsamen Vite-Build (dist/) im Repo-Wurzelverzeichnis; Tauri bündelt genau diesen Ordner.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = fileURLToPath(new URL("../../", import.meta.url));
execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
console.log("Windows: dist/ aus dem gemeinsamen Quellstand gebaut:", join(root, "dist"));
