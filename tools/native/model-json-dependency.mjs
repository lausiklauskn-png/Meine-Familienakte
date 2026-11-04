// Same public-domain JSON dependency and immutable hash as Private Brain Pro.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { setTimeout as pause } from "node:timers/promises";
export const JSON_SHA = "3ea61b2a06e31edf1c91134fe9106b0ebb16628be169f3db75bc7a2b06b45796";
export const JSON_NAME = "json-20250517.jar";
export async function jsonDependency() {
  const dir = fileURLToPath(new URL("../../work/model-deps/", import.meta.url)); await mkdir(dir, { recursive: true });
  const target = dir + JSON_NAME;
  let bytes = await readFile(target).catch(() => null);
  const checked = b => b && createHash("sha256").update(b).digest("hex") === JSON_SHA;
  if (!checked(bytes)) {
    // Dieselbe fest gepinnte Maven-Central-Datei; keine ungeprüfte Ersatzabhängigkeit.
    const hosts = ["repo.maven.apache.org", "repo1.maven.org", "repo.maven.apache.org"];
    for (const [attempt, host] of hosts.entries()) {
      let response;
      try { response = await fetch(`https://${host}/maven2/org/json/json/20250517/${JSON_NAME}`, { signal: AbortSignal.timeout(60000) }); }
      catch (error) { if (attempt === hosts.length - 1) throw error; await pause(1000 * (attempt + 1)); continue; }
      if (!response.ok) {
        const transient = response.status === 429 || response.status >= 500;
        if (!transient || attempt === hosts.length - 1) throw Error("JSON dependency download: HTTP " + response.status);
        await response.body?.cancel(); await pause(1000 * (attempt + 1)); continue;
      }
      bytes = Buffer.from(await response.arrayBuffer());
      if (!checked(bytes)) throw Error("JSON dependency fingerprint mismatch");
      break;
    }
    if (!checked(bytes)) throw Error("JSON dependency unavailable with required fingerprint");
    await writeFile(target, bytes);
  }
  return target;
}
