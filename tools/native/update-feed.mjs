// Baut die Feed-Datei für Klaus' Update-Server (https://family-projekt.de/updates/familienakte/), Format 1 wie BookLedgerPro
// (docs/UPDATES-EIGENER-SERVER.md dort). Unterschrieben wird danach im Release-Lauf (Geheimnis UPDATE_SIGNING_KEY, Ed25519);
// die App glaubt nur der Unterschrift und prüft Dateiname, Größe und SHA-256 selbst.
//   node tools/native/update-feed.mjs windows <Familienakte-Windows-X.Y.Z-x64-setup.exe> <aus/aktuell-windows.json>
//   node tools/native/update-feed.mjs android <Familienakte-android-vX.Y.Z.apk> <versionCode> <aus/aktuell-android.json>
import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function feed({ plattform, version, datei, groesse, sha256, versionCode, quelle = '', datum = new Date().toISOString().slice(0, 10) }) {
  if (!/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(version)) throw new Error('Version X.Y.Z erwartet: ' + version);
  if (!/^[0-9a-f]{64}$/.test(sha256) || !(groesse > 0)) throw new Error('SHA-256 oder Größe ungültig');
  if (plattform === 'windows') {
    if (datei !== `Familienakte-Windows-${version}-x64-setup.exe`) throw new Error('Dateiname passt nicht zur Fassung: ' + datei);
    return { format: 1, app: 'familienakte', version, datum, quelle, windows: { datei, groesse, sha256 } };
  }
  if (plattform === 'android') {
    if (datei !== `Familienakte-android-v${version}.apk`) throw new Error('Dateiname passt nicht zur Fassung: ' + datei);
    if (!Number.isSafeInteger(versionCode) || versionCode < 1) throw new Error('versionCode fehlt');
    return { format: 1, app: 'familienakte', version, datum, quelle, android: { datei, groesse, sha256, versionCode } };
  }
  throw new Error('Plattform windows oder android');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [plattform, datei, ...rest] = process.argv.slice(2);
    const aus = rest.pop(); const versionCode = rest.length ? Number(rest[0]) : undefined;
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const version = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version;
    const bytes = readFileSync(datei);
    const f = feed({ plattform, version, datei: path.basename(datei), groesse: statSync(datei).size, sha256: createHash('sha256').update(bytes).digest('hex'), versionCode, quelle: process.env.GITHUB_SHA || '' });
    writeFileSync(aus, JSON.stringify(f, null, 2) + '\n');
    console.log(`${path.basename(aus)}: ${version} · ${f[plattform].datei} · ${f[plattform].groesse} B`);
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
