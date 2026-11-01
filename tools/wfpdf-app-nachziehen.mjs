#!/usr/bin/env node
// tools/wfpdf-app-nachziehen.mjs — die ganze App Workflow PDF byte-1:1 als Klon nach public/apps/workflow-pdf/ (Klaus 2026-11-01,
// Weg B). Vorbild: BookLedgerPro tools/apps-nachziehen.mjs. Nur index.html bekommt die kontrollierte Abweichung aus
// tools/wfpdf-app-patch.mjs. Pins (SHA-256 je Datei, Commit) in public/apps/HERKUNFT.json; scripts/run-ausfuellen-tests.mjs prüft.
// Nur in Workflow-PDF ändern, dann hier nachziehen — NIE von Hand.
//   node tools/wfpdf-app-nachziehen.mjs            # Klon unter ../Workflow-PDF (sonst WFPDF_KLON=…)
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { patchIndex } from "./wfpdf-app-patch.mjs";

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ZIEL = "public/apps/workflow-pdf";
// Nicht kopiert: Entwicklung, Repo-Papiere, eigener Service Worker, der Mycel-Knoten (sbkim/, Klaus: „Weglassen“).
const AUSGENOMMEN_ORDNER = new Set([".git", ".github", "node_modules", "tests", "tools", "docs", "sbkim"]);
const AUSGENOMMEN_DATEI = new Set(["package.json", "package-lock.json", "README.md", "CLAUDE.md", "AGENTS.md", "RECHTE.md", "sw.js", ".gitignore", ".gitattributes"]);
const sha = (b) => createHash("sha256").update(b).digest("hex");

function dateien(klon) {
  // nur Dateien, die Git kennt (keine liegengebliebenen Probe-Reste im Klon)
  let liste;
  try { liste = execSync("git ls-files", { cwd: klon, encoding: "utf8" }).split("\n").filter(Boolean); }
  catch { liste = null; }
  if (!liste) {
    liste = [];
    const lauf = (d) => { for (const n of readdirSync(d).sort()) { const p = join(d, n); if (statSync(p).isDirectory()) lauf(p); else liste.push(relative(klon, p).split("\\").join("/")); } };
    lauf(klon);
  }
  return liste.filter((rel) => { const t = rel.split("/"); return !t.slice(0, -1).some((o) => AUSGENOMMEN_ORDNER.has(o)) && !(t.length === 1 && AUSGENOMMEN_DATEI.has(t[0])); }).sort();
}

export function nachziehen(klon) {
  if (!existsSync(join(klon, "index.html")) || !existsSync(join(klon, "assets", "app.js"))) throw new Error("kein Workflow-PDF-Klon: " + klon);
  let commit = ""; try { commit = execSync("git rev-parse HEAD", { cwd: klon, encoding: "utf8" }).trim(); } catch { commit = ""; }
  const ziel = join(WURZEL, ZIEL);
  rmSync(ziel, { recursive: true, force: true });
  const e = { repo: "lausiklauskn-png/Workflow-PDF", name: "Workflow PDF", commit, ordner: ZIEL, stand: new Date().toISOString().slice(0, 10), dateien: {}, abweichungen: {} };
  for (const rel of dateien(klon)) {
    const roh = readFileSync(join(klon, rel));
    let out = roh;
    if (rel === "index.html") {
      const { html, aenderungen } = patchIndex(roh.toString("utf8"));
      out = Buffer.from(html, "utf8");
      e.abweichungen[rel] = { quelle: sha(roh), aenderungen };
    }
    mkdirSync(join(ziel, dirname(rel)), { recursive: true });
    writeFileSync(join(ziel, rel), out);
    e.dateien[rel] = sha(out);
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
