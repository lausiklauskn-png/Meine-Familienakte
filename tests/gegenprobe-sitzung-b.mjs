// Gegenprobe zu Stück 1 und 1b (Sitzung B, 2026-10-31): baut je eine Stelle absichtlich kaputt, prüft, dass die zugehörige Probe
// ROT wird (und zwar an der erwarteten Zeile), und legt die Datei danach zurück. Während des Laufs NICHT committen.
// Aufruf: node tests/gegenprobe-sitzung-b.mjs [Filter]
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const HP = "app/health-portal.tsx";
const faelle = [
  { name: "Suche: Memory und Vorgänge fehlen", datei: HP, alt: "  records.forEach((record) => {\n    const title = cockpitRecordLabel(record);", neu: "  [].forEach((record: FamilyRecordUnion) => {\n    const title = cockpitRecordLabel(record);", probe: "suche", rot: /Memory|Vorgang/ },
  { name: "Suche: Dokumente fehlen", datei: HP, alt: "  [...localDocuments, ...documents].forEach((item) => add(", neu: "  ([] as typeof documents).forEach((item) => add(", probe: "suche", rot: /Dokument/ },
  { name: "Suche: Diagnose zeigt ihren Inhalt", datei: HP, alt: 'title: "Geschützte Diagnose", detail: "Einzelheiten im geschützten Gesundheitsbereich"', neu: 'title: item.diagnosis, detail: "Einzelheiten im geschützten Gesundheitsbereich"', probe: "suche", rot: /Gesundheit datensparsam/ },
  { name: "Gesundheit: Knopf wieder gesperrt", datei: HP, alt: "fuellbar: (/^application", neu: "fuellbar: !isSensitiveHealthText(item.originalName, item.category, item.notes) && (/^application", probe: "ausfuellen-gesundheit", rot: /hat jetzt „Ausfüllen“/ },
  { name: "Gesundheit: KI-Knopf trotzdem da", datei: HP, alt: "geschuetzt={isSensitiveHealthText(fillDocument.originalName, fillDocument.category, fillDocument.notes)}", neu: "geschuetzt={false}", probe: "ausfuellen-gesundheit", rot: /kein „Mit KI benennen“/ },
  { name: "Kontakt: Speichern schreibt nichts", datei: "app/local-vault.ts", alt: "  record.data = kontaktUebernehmen((record.data || {}) as Record<string, unknown>, sauber) as typeof record.data;\n", neu: "", probe: "person-kontakt", rot: /Angaben speichern|Neuladen/ },
  { name: "Kontakt: falsche E-Mail geht durch", datei: "lib/person-kontakt.ts", alt: 'if (k === "email" && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(w))', neu: "if (false)", probe: "person-kontakt", rot: /Falsche E-Mail/ },
  { name: "Formular scannen: Ausfüllen öffnet nicht", datei: HP, alt: "        setFillDocId(neu.id);\n", neu: "", probe: "formular-scannen", rot: /Ausfüllen öffnet sich/ },
  { name: "Einzeldatei: Kern nicht eingebettet", datei: "scripts/build-single-file.mjs", alt: "<script>\n${kern}\n</script>", neu: "", probe: "einzeldatei", rot: /byte-gleich in der Einzeldatei|rechnet/, einzel: true },
];
const filter = process.argv[2] || "";
const bauen = (einzel) => {
  for (const [cmd, args] of [["npx", ["vite", "build"]], [process.execPath, ["scripts/build-pwa.mjs"]], ...(einzel ? [[process.execPath, ["scripts/build-single-file.mjs"]]] : [])]) {
    const r = spawnSync(cmd, args, { stdio: "ignore" }); if (r.status !== 0) return false;
  }
  return true;
};
let gefangen = 0, durch = 0;
for (const f of faelle.filter((x) => x.name.includes(filter))) {
  const original = readFileSync(f.datei, "utf8");
  if (!original.includes(f.alt)) { console.log(`⚠ toter Anker: ${f.name}`); durch++; continue; }
  try {
    writeFileSync(f.datei, original.replace(f.alt, f.neu));
    if (readFileSync(f.datei, "utf8") === original) { console.log(`⚠ nichts geändert: ${f.name}`); durch++; continue; }
    const gebaut = bauen(f.einzel);
    const r = gebaut ? spawnSync(process.execPath, [`tests/ui/${f.probe}.test.mjs`], { encoding: "utf8" }) : { status: 1, stdout: "🔴 Bau scheiterte" };
    const rote = (r.stdout || "").split("\n").filter((z) => z.startsWith("🔴"));
    const ok = gebaut && r.status !== 0 && rote.some((z) => f.rot.test(z));
    if (ok) gefangen++; else durch++;
    console.log(`${ok ? "✔ gefangen" : "✗ DURCHGERUTSCHT"}: ${f.name}${rote.length ? ` – ${rote.map((z) => z.slice(2, 60)).join(" | ")}` : ""}`);
  } finally { writeFileSync(f.datei, original); }
}
bauen(true);
console.log(`Gegenprobe Sitzung B: ${gefangen} gefangen · ${durch} durchgerutscht`);
process.exit(durch ? 1 : 0);
