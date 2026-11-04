import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
mkdirSync('work', { recursive: true });
const temp = mkdtempSync(resolve('work/pdf-rueckgabe-gegenprobe-'));
try {
  cpSync('app', join(temp, 'app'), { recursive: true });
  cpSync('lib', join(temp, 'lib'), { recursive: true });
  mkdirSync(join(temp, 'scripts'));
  cpSync('scripts/run-pdf-rueckgabe-tests.mjs', join(temp, 'scripts/run-pdf-rueckgabe-tests.mjs'));
  const p = join(temp, 'app/local-vault.ts'), s = readFileSync(p, 'utf8');
  const anker = s.split('\n').filter(l => l.includes('if (dokument.storedPath !== quelle.storedPath'));
  assert.equal(anker.length, 1, 'Gegenprobe muss genau den aktiven Konfliktschutz treffen');
  writeFileSync(p, s.replace(anker[0], '// Gegenprobe: Quellkonflikt wird absichtlich nicht geprüft.'));
  const r = spawnSync(process.execPath, [join(temp, 'scripts/run-pdf-rueckgabe-tests.mjs')], { encoding: 'utf8', timeout: 30000 });
  assert.notEqual(r.status, 0, 'Entfernter Konfliktschutz darf nicht grün werden');
  assert.match(r.stdout, /Unveränderte Rückgabe erzeugt weder Datei/);
  assert.match(r.stderr, /Missing expected rejection/, 'Die Gegenprobe muss am verlorenen Konfliktschutz scheitern, nicht am Start');
  console.log('PDF-Rückgabe-Gegenprobe: absichtlich entfernter Konfliktschutz wird von der echten Speicherprüfung gefangen.');
} finally { rmSync(temp, { recursive: true, force: true }); }
