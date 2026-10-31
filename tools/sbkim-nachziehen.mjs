// Holt die SBKIM-Kanon-Module byte-1:1 aus Sage-Protokol (origin/main des Klons daneben) nach public/sbkim/ und pinnt sie in
// native/HERKUNFT.json (Prüfung: npm run check:herkunft). Nie von Hand ändern — in Sage pflegen, dann hier neu ziehen.
// Aufruf: node tools/sbkim-nachziehen.mjs [--sage ../Sage-Protokol]
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const i = process.argv.indexOf("--sage");
const sage = path.resolve(root, i > 0 ? process.argv[i + 1] : "../Sage-Protokol");
// Stück 2 der Sitzung B (Klaus 2026-10-31): was „Verbinden auf Tipp“ braucht. Siegel/Lampen folgen in einem eigenen Stück.
const MODULE = ["01_storage.js", "02_spore.js", "03_embedding.js", "04_match.js", "05_anastomose.js", "05b_nostr_relay.js", "noble-secp256k1.js", "23_rendezvous.js", "23_rendezvous_ui.js"];
const git = (...a) => execFileSync("git", ["-C", sage, ...a], { maxBuffer: 64 << 20 });
const commit = git("rev-parse", "origin/main").toString().trim();
const herkunftPfad = path.join(root, "native/HERKUNFT.json");
const herkunft = JSON.parse(readFileSync(herkunftPfad, "utf8"));
mkdirSync(path.join(root, "public/sbkim"), { recursive: true });
for (const m of MODULE) {
  const bytes = git("show", `${commit}:src/modules/${m}`);
  const ziel = `public/sbkim/${m}`;
  writeFileSync(path.join(root, ziel), bytes);
  herkunft.dateien[ziel] = { repo: "lausiklauskn-png/Sage-Protokol", pfad: `src/modules/${m}`, commit, sha256: createHash("sha256").update(bytes).digest("hex"), zweck: "SBKIM-Kanon (Mycel), Schublade familienakte" };
  console.log(`🟢 ${ziel} ← Sage ${commit.slice(0, 7)} (${bytes.length} B)`);
}
writeFileSync(herkunftPfad, JSON.stringify(herkunft, null, 2) + "\n");
