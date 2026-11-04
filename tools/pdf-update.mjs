// Run from the Familienakte source folder. Download to work/, prepare off to the side,
// keep the existing bridge/theme and never install unreviewed code into a running app.
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { nachziehen as appKopieren } from './wfpdf-app-nachziehen.mjs';
import { nachziehen as kernKopieren } from './wfpdf-nachziehen.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const hash = b => createHash('sha256').update(b).digest('hex');
const dateien = (basis, prefix = '') => readdirSync(join(basis, prefix), { withFileTypes: true }).flatMap(e => {
  const p = prefix ? prefix + '/' + e.name : e.name;
  if (e.isSymbolicLink()) throw new Error('Symlink in der PDF-Kopie: ' + p);
  return e.isDirectory() ? dateien(basis, p) : [p];
});
const UI = p => /\.(?:html|css|webmanifest)$/i.test(p) || p.startsWith('icons/');
// Only technical version references may change without changing the document itself.
const htmlNormal = s => s.replace(/((?:src|href)="[^"]*)\?v=\d+(?=")/g, '$1?v=VERSION')
  .replace(/(<meta name="wfp-version" content=")[^"]+(" data-cache=")[^"]+("\s*\/?>)/g, '$1VERSION$2CACHE$3');

export function quelleLaden(name, wurzel = ROOT) {
  if (!['Workflow-PDF', 'Workflow-PDF-Pro'].includes(name)) throw new Error('Unbekannte PDF-Quelle');
  const url = `https://github.com/lausiklauskn-png/${name}.git`;
  const ziel = join(wurzel, 'work', 'pdf-quellen', name);
  mkdirSync(dirname(ziel), { recursive: true });
  if (!existsSync(ziel)) execFileSync('git', ['clone', '--depth', '1', url, ziel], { stdio: ['ignore', 'ignore', 'inherit'] });
  if (git(ziel, 'remote', 'get-url', 'origin') !== url) throw new Error('Unerwartete Quelladresse: ' + name);
  if (git(ziel, 'status', '--porcelain').trim()) throw new Error('Lokale Änderungen im Quellenordner: ' + name);
  execFileSync('git', ['fetch', '--depth', '1', 'origin', 'main'], { cwd: ziel, stdio: ['ignore', 'ignore', 'inherit'] });
  execFileSync('git', ['checkout', '--detach', 'FETCH_HEAD'], { cwd: ziel, stdio: ['ignore', 'ignore', 'inherit'] });
  return ziel;
}

export function updateVorbereiten(quelle, pro, wurzel = ROOT, anwenden = false) {
  for (const cwd of [quelle, pro]) if (git(cwd, 'status', '--porcelain').trim()) throw new Error('Quelle hat lokale Änderungen');
  const commit = git(quelle, 'rev-parse', 'HEAD');
  const proCommit = git(pro, 'rev-parse', 'HEAD');
  if (git(quelle, 'rev-parse', 'HEAD^{tree}') !== git(pro, 'rev-parse', 'HEAD:upstream/workflow-pdf')) {
    throw new Error('Pro hat einen anderen PDF-Kern. Zuerst den gemeinsamen Kern in Pro nachziehen; Familienakte bleibt unverändert.');
  }
  const kernAlt = JSON.parse(readFileSync(join(wurzel, 'public/wfpdf/HERKUNFT.json'), 'utf8'));
  const appAlt = JSON.parse(readFileSync(join(wurzel, 'public/apps/HERKUNFT.json'), 'utf8'));
  const alt = appAlt.apps['workflow-pdf'];
  if (kernAlt.commit !== alt.commit) throw new Error('Familienakte-Kopien haben unterschiedliche Quellstände');
  if (alt.ordner !== 'public/apps/workflow-pdf') throw new Error('Unerwarteter PDF-Zielordner');
  for (const p of dateien(join(wurzel, alt.ordner))) if (!Object.hasOwn(alt.dateien, p)) throw new Error('Zusätzliche lokale Datei in der PDF-Kopie: ' + p);
  for (const p of dateien(join(wurzel, 'public/wfpdf'))) if (p !== 'HERKUNFT.json' && !Object.hasOwn(kernAlt.dateien, 'public/wfpdf/' + p)) throw new Error('Zusätzliche lokale Datei im PDF-Kern: ' + p);
  // Do not overwrite hand-edited copies even if the upstream commit has not changed.
  for (const [p, sha] of Object.entries(alt.dateien)) {
    if (hash(readFileSync(join(wurzel, alt.ordner, p))) !== sha) throw new Error('Lokale Kopie geändert: ' + p);
  }
  for (const [p, eintrag] of Object.entries(kernAlt.dateien)) {
    if (hash(readFileSync(join(wurzel, p))) !== eintrag.sha256) throw new Error('Lokaler Kern geändert: ' + p);
  }
  const bericht = { quelle: commit, pro: proCommit, bisher: alt.commit, updateVorhanden: commit !== alt.commit,
    angewendet: false, sichtpruefungErforderlich: false, designAenderungen: [] };
  if (!bericht.updateVorhanden) return bericht;
  const temp = mkdtempSync(join(tmpdir(), 'fa-pdf-update-'));
  try {
    const appNeu = appKopieren(quelle, temp);
    const kernNeu = kernKopieren(quelle, temp);
    const fenster = {};
    runInNewContext(readFileSync(join(temp, 'public/wfpdf/erkennung.js'), 'utf8'), { window: fenster }, { timeout: 1000 });
    if (typeof fenster.WFP?.Erkennung?.schonBelegt !== 'function') throw new Error('Der benötigte PDF-Funktionsvertrag fehlt: schonBelegt');
    const pfade = new Set([...Object.keys(alt.dateien), ...Object.keys(appNeu.dateien)]);
    for (const p of pfade) {
      if (!UI(p)) continue;
      const vorher = join(wurzel, alt.ordner, p), nachher = join(temp, appNeu.ordner, p);
      const gleich = existsSync(vorher) && existsSync(nachher) && (p.endsWith('.html')
        ? htmlNormal(readFileSync(vorher, 'utf8')) === htmlNormal(readFileSync(nachher, 'utf8'))
        : readFileSync(vorher).equals(readFileSync(nachher)));
      if (!gleich) bericht.designAenderungen.push(p);
    }
    if (bericht.designAenderungen.length) throw new Error('Design-/Inhaltsänderung in der Quelle: ' + bericht.designAenderungen.join(', ') + '. Keine Übernahme.');
    bericht.sichtpruefungErforderlich = true; // JavaScript can also generate UI; PR review remains necessary.
    if (!anwenden) return bericht;
    // Both copies have been prepared successfully before any target is replaced.
    // Family-owned bridge, theme, React files, settings and documents are outside these paths.
    mkdirSync(join(temp, 'public/apps'), { recursive: true });
    writeFileSync(join(temp, 'public/apps/HERKUNFT.json'), JSON.stringify({ ...appAlt, apps: { ...appAlt.apps, 'workflow-pdf': appNeu } }, null, 2) + '\n');
    writeFileSync(join(temp, 'public/wfpdf/HERKUNFT.json'), JSON.stringify(kernNeu, null, 2) + '\n');
    if (git(quelle, 'rev-parse', 'HEAD') !== commit || git(pro, 'rev-parse', 'HEAD') !== proCommit) throw new Error('Quelle während des Updates gewechselt');
    const ziele = ['public/apps/workflow-pdf', 'public/apps/HERKUNFT.json', 'public/wfpdf'];
    const backup = join(temp, 'backup');
    for (const p of ziele) { mkdirSync(dirname(join(backup, p)), { recursive: true }); cpSync(join(wurzel, p), join(backup, p), { recursive: true }); }
    try {
      for (const p of ziele) { rmSync(join(wurzel, p), { recursive: true, force: true }); cpSync(join(temp, p), join(wurzel, p), { recursive: true }); }
    } catch (error) {
      for (const p of ziele) { rmSync(join(wurzel, p), { recursive: true, force: true }); cpSync(join(backup, p), join(wurzel, p), { recursive: true }); }
      throw error;
    }
    bericht.angewendet = true;
    return bericht;
  } finally { rmSync(temp, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const wert = name => { const i = args.indexOf(name); if (i < 0) return null; if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Pfad fehlt: ' + name); return resolve(args[i + 1]); };
  const erlaubte = new Set(['--quelle', '--pro', '--anwenden']);
  for (let i = 0; i < args.length; i++) { if (!erlaubte.has(args[i])) throw new Error('Unbekannte Option: ' + args[i]); if (args[i] !== '--anwenden') i++; }
  const quelle = wert('--quelle') || quelleLaden('Workflow-PDF');
  const pro = wert('--pro') || quelleLaden('Workflow-PDF-Pro');
  console.log(JSON.stringify(updateVorbereiten(quelle, pro, ROOT, args.includes('--anwenden')), null, 2));
}
