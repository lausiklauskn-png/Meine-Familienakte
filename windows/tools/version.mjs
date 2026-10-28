// Prüft, dass package.json, windows/package.json, tauri.conf.json und Cargo.toml dieselbe Fassung tragen. Rückgabe 1 sonst.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (p) => readFileSync(root + p, "utf8");
const pkg = JSON.parse(read("package.json")).version;
const win = JSON.parse(read("windows/package.json")).version;
const conf = JSON.parse(read("windows/src-tauri/tauri.conf.json")).version;
const cargo = /^version = "([^"]+)"/m.exec(read("windows/src-tauri/Cargo.toml"))?.[1];
const ok = [win, conf, cargo].every((v) => v === pkg);
console.log(`${ok ? "🟢" : "🔴"} Fassung ${pkg}: windows/package.json ${win}, tauri.conf.json ${conf}, Cargo.toml ${cargo}`);
process.exit(ok ? 0 : 1);
