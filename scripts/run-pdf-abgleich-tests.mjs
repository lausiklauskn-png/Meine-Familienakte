import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
const temp = mkdtempSync(join(tmpdir(), 'pdf-abgleich-'));
const tool = resolve('tools/pdf-abgleich.mjs');
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const init = cwd => {
  git(cwd, 'init'); git(cwd, 'config', 'user.name', 'Probe'); git(cwd, 'config', 'user.email', 'probe@example.invalid');
};
const commit = cwd => { git(cwd, 'add', '.'); git(cwd, 'commit', '-m', 'Erfundener Stand'); };
try {
  const quelle = join(temp, 'quelle'), pro = join(temp, 'pro'), fa = join(temp, 'fa');
  mkdirSync(quelle); mkdirSync(join(pro, 'upstream'), { recursive: true });
  writeFileSync(join(quelle, 'kern.js'), '// Beispiel');
  cpSync(quelle, join(pro, 'upstream/workflow-pdf'), { recursive: true });
  init(quelle); commit(quelle); init(pro); commit(pro);
  mkdirSync(join(fa, 'public/wfpdf'), { recursive: true });
  mkdirSync(join(fa, 'public/apps'), { recursive: true });
  const pin = git(quelle, 'rev-parse', 'HEAD');
  writeFileSync(join(fa, 'public/wfpdf/HERKUNFT.json'), JSON.stringify({ commit: pin }));
  const appPin = commit => writeFileSync(join(fa, 'public/apps/HERKUNFT.json'), JSON.stringify({ apps: { 'workflow-pdf': { commit } } }));
  appPin(pin);
  const run = () => spawnSync(process.execPath, [tool, quelle, pro], { cwd: fa, encoding: 'utf8' });
  let r = run(); assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse(r.stdout).updateVorhanden, false);
  appPin('anderer Stand'); r = run(); assert.notEqual(r.status, 0); assert.match(r.stderr, /unterschiedliche Quellstände/);
  appPin(pin); writeFileSync(join(quelle, 'kern.js'), '// neuer Stand');
  r = run(); assert.notEqual(r.status, 0); assert.match(r.stderr, /lokale Änderungen/);
  commit(quelle); r = run(); assert.notEqual(r.status, 0); assert.match(r.stderr, /weichen ab/);
  assert.equal(JSON.parse(r.stdout).updateVorhanden, true);
  cpSync(join(quelle, 'kern.js'), join(pro, 'upstream/workflow-pdf/kern.js')); commit(pro);
  r = run(); assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse(r.stdout).updateVorhanden, true);
  console.log('PDF-Abgleich: Gleichstand, Update, widersprüchliche Pins, lokale Änderungen und abweichender Pro-Kern geprüft.');
} finally { rmSync(temp, { recursive: true, force: true }); }
