#!/usr/bin/env node
// tools/wfpdf-app-nachziehen.mjs — die ganze App Workflow PDF byte-1:1 als Klon nach public/apps/workflow-pdf/ (Klaus 2026-11-01,
// Weg B). Vorbild: BookLedgerPro tools/apps-nachziehen.mjs. Nur index.html bekommt die kontrollierte Abweichung aus
// tools/wfpdf-app-patch.mjs. Pins (SHA-256 je Datei, Commit) in public/apps/HERKUNFT.json; scripts/run-ausfuellen-tests.mjs prüft.
// Nur in Workflow-PDF ändern, dann hier nachziehen — NIE von Hand.
//   node tools/wfpdf-app-nachziehen.mjs            # Klon unter ../Workflow-PDF (sonst WFPDF_KLON=…)
import { lstatSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { patchIndex } from "./wfpdf-app-patch.mjs";

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ZIEL = "public/apps/workflow-pdf";
// Nicht kopiert: Entwicklung, Repo-Papiere, eigener Service Worker, der Mycel-Knoten (sbkim/, Klaus: „Weglassen“).
const AUSGENOMMEN_ORDNER = new Set([".git", ".github", "node_modules", "tests", "tools", "docs", "sbkim"]);
const AUSGENOMMEN_DATEI = new Set(["package.json", "package-lock.json", "README.md", "CLAUDE.md", "AGENTS.md", "RECHTE.md", "sw.js", ".gitignore", ".gitattributes"]);
const sha = (b) => createHash("sha256").update(b).digest("hex");

function git(klon, ...args) {
  return execFileSync("git", args, { cwd: klon, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function dateien(klon) {
  // nur Dateien, die Git kennt (keine liegengebliebenen Probe-Reste im Klon)
  const liste = git(klon, "ls-files", "-z").split("\0").filter(Boolean);
  return liste.filter((rel) => { const t = rel.split("/"); return !t.slice(0, -1).some((o) => AUSGENOMMEN_ORDNER.has(o)) && !(t.length === 1 && AUSGENOMMEN_DATEI.has(t[0])); }).sort();
}

export function nachziehen(klon, wurzel = WURZEL) {
  if (!existsSync(join(klon, "index.html")) || !existsSync(join(klon, "assets", "app.js"))) throw new Error("kein Workflow-PDF-Klon: " + klon);
  // Fehlender Git-Zugriff, lokale Änderungen oder ein unpassender Index dürfen
  // weder falsche Herkunft bescheinigen noch die bisherige Kopie entfernen.
  const commit = git(klon, "rev-parse", "HEAD").trim();
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error("Quell-Commit fehlt");
  const sauber = () => {
    if (git(klon, "status", "--porcelain", "--untracked-files=no").trim()) throw new Error("Workflow-PDF-Quelle hat nicht eingecheckte Änderungen");
    if (git(klon, "rev-parse", "HEAD").trim() !== commit) throw new Error("Quell-Commit hat sich beim Lesen geändert");
  };
  sauber();
  const liste = dateien(klon);
  if (!liste.includes("index.html") || !liste.includes("assets/app.js")) throw new Error("Pflichtdateien fehlen im Quell-Commit");
  const ziel = join(wurzel, ZIEL), vorbereitet = new Map();
  const e = { repo: "lausiklauskn-png/Workflow-PDF", name: "Workflow PDF", commit, ordner: ZIEL, stand: new Date().toISOString().slice(0, 10), dateien: {}, abweichungen: {} };
  for (const rel of liste) {
    if (!lstatSync(join(klon, rel)).isFile()) throw new Error("Keine normale Quelldatei: " + rel);
    const roh = readFileSync(join(klon, rel));
    let out = roh;
    if (rel === "index.html") {
      const { html, aenderungen } = patchIndex(roh.toString("utf8"));
      out = Buffer.from(html, "utf8");
      e.abweichungen[rel] = { quelle: sha(roh), aenderungen };
    }
    vorbereitet.set(rel, out);
    e.dateien[rel] = sha(out);
  }
  sauber();
  rmSync(ziel, { recursive: true, force: true });
  for (const [rel, out] of vorbereitet) {
    mkdirSync(join(ziel, dirname(rel)), { recursive: true });
    writeFileSync(join(ziel, rel), out);
  }
  return e;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const klon = resolve(WURZEL, process.env.WFPDF_KLON || "../Workflow-PDF");
  const e = nachziehen(klon);
  const h = { hinweis: "Byte-1:1-Klon von Workflow PDF; nur index.html trägt die kontrollierte Abweichung (tools/wfpdf-app-patch.mjs). Nachziehen mit node tools/wfpdf-app-nachziehen.mjs — nie von Hand ändern. Familienakte-eigen: public/apps/fa-wfpdf-bruecke.js, public/apps/fa-wfpdf-thema.css.", apps: { "workflow-pdf": e } };
  writeFileSync(join(WURZEL, "public", "apps", "HERKUNFT.json"), JSON.stringify(h, null, 2) + "\n");
  console.log(`Workflow PDF ${e.commit.slice(0, 7)}: ${Object.keys(e.dateien).length} Dateien → ${ZIEL}/`);
}
