// Signiert eine unsignierte (zipalign-te) Release-APK mit der dauerhaften Identität und prüft danach Zertifikat,
// App-Kennung, Version und dass es keine Debug-APK ist. Bei jedem Fehler bleibt keine halbe Ausgabe liegen.
import { readFile, access, open, rm } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { APP_ID, verifyPinnedIdentity, checked } from './identity.mjs';

export const releaseTag = /^android-v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[A-Za-z0-9.]+)?$/;

export async function signApk({ input, output, signer, aapt, tag, commit, directory, key }) {
  const match = releaseTag.exec(tag || '');
  if (!match || !/^[a-f0-9]{40}$/.test(commit || '')) throw new Error('Release-Tag android-vX.Y.Z[-…] und vollständiger Quellcommit sind erforderlich.');
  if (!input || !output || !signer || !aapt || path.resolve(input) === path.resolve(output)) throw new Error('Eingabe, neue Ausgabe, apksigner und aapt sind erforderlich.');
  await access(input);
  const handle = await open(output, 'wx', 0o644); await handle.close();
  let complete = false;
  try {
    const receipt = await verifyPinnedIdentity(directory, key, async identity => {
      checked(signer, ['sign', '--ks', identity.file, '--ks-key-alias', identity.alias,
        '--ks-pass', 'env:FA_STORE_PASSWORD', '--key-pass', 'env:FA_STORE_PASSWORD',
        '--v4-signing-enabled', 'false', '--out', output, input], { FA_STORE_PASSWORD: identity.password });
      const verified = checked(signer, ['verify', '--verbose', '--print-certs', output], {}).toString('utf8');
      const fingerprints = [...verified.matchAll(/^Signer #\d+ certificate SHA-256 digest:\s*([a-f0-9]+)\s*$/gmi)].map(m => m[1].toLowerCase());
      if (fingerprints.length !== 1 || fingerprints[0] !== identity.fingerprint) throw new Error('APK-Zertifikat stimmt nicht mit der dauerhaften Identität überein.');
      const badging = checked(aapt, ['dump', 'badging', output], {}).toString('utf8');
      if (!badging.startsWith("package: name='" + APP_ID + "' ")) throw new Error('APK gehört nicht zur Familienakte.');
      const versionName = badging.match(/^package: .*?versionName='([^']+)'/m)?.[1];
      const versionCode = Number(badging.match(/^package: .*?versionCode='(\d+)'/m)?.[1]);
      if (versionName !== `${match[1]}.${match[2]}.${match[3]}` || !Number.isSafeInteger(versionCode) || versionCode < 1) throw new Error('APK-Version passt nicht zum Release-Tag.');
      if (/^application-debuggable$/m.test(badging)) throw new Error('Debug-APK darf nicht veröffentlicht werden.');
      return { applicationId: APP_ID, versionName, versionCode, commit, tag, certificateSha256: identity.fingerprint,
        apkSha256: createHash('sha256').update(await readFile(output)).digest('hex'), filename: path.basename(output) };
    });
    complete = true;
    return receipt;
  } finally {
    if (!complete) await rm(output, { force: true });
  }
}
