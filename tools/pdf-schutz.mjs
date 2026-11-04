// Compare actual protection bytes, not only version labels. Pseudonymisation is a
// separate Familienakte text adapter, not a claimed property of image-based Pro AI.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
export const SCHUTZ_DATEIEN = ['pruefer-formate.js', 'pruefer-mail.js', 'pruefer-anhang.js', 'eingang.js', 'reinigung.js', 'erkennung.js', 'uebersetzung.js', 'bildbeschreibung.js', 'schluesseltresor.js'];
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
export function schutzVergleichen(quelle, pro, familienakte) {
  const dateien = SCHUTZ_DATEIEN.map(datei => {
    const referenz = sha(join(quelle, 'assets', datei));
    const werte = { quelle: referenz, pro: sha(join(pro, 'upstream/workflow-pdf/assets', datei)), familienakte: sha(join(familienakte, 'public/apps/workflow-pdf/assets', datei)) };
    if (['reinigung.js', 'erkennung.js', 'schluesseltresor.js'].includes(datei)) werte.familienakteDialog = sha(join(familienakte, 'public/wfpdf', datei));
    if (Object.values(werte).some(v => v !== referenz)) throw new Error('Schutzkern weicht ab: ' + datei);
    return { datei, sha256: referenz };
  });
  return { gemeinsameSchutzdateienIdentisch: true, dateien,
    grenze: 'Gleiche Kerndateien beweisen keine gleichen Aufrufwege. Familienakte-Textaufträge mit Modul 25 und Pro-Seitenbilder sind unterschiedliche KI-Wege; bereinigt bedeutet nicht anonymisiert.' };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [quelle, pro] = process.argv.slice(2);
  if (!quelle || !pro) throw new Error('Aufruf: node tools/pdf-schutz.mjs Workflow-PDF Workflow-PDF-Pro');
  console.log(JSON.stringify(schutzVergleichen(resolve(quelle), resolve(pro), process.cwd()), null, 2));
}
