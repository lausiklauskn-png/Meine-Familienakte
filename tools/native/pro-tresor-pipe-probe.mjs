// Prüft dasselbe Produktionsprotokoll mit gestellter nativer Dialoggrenze.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { once } from "node:events";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import path from "node:path";
export async function grossePipe(java, jar, classes) {
  const gross = spawn(java, ["-Xmx256m", "-Djava.awt.headless=true", "-cp", jar + path.delimiter + classes, "de.familyprojekt.familienakte.ProTresorEngineProbe", "--pipe"], { stdio: ["pipe", "pipe", "pipe"] });
  const lines = createInterface({ input: gross.stdout })[Symbol.asyncIterator]();
  let stderr = ""; gross.stderr.on("data", b => { stderr += b.toString(); });
  const beendet = once(gross, "exit");
  const timeout = setTimeout(() => gross.kill(), 60000);
  try {
    const antwort = async () => { const next = await lines.next(); assert.equal(next.done, false, stderr || "Engine endete vor der Antwort"); return JSON.parse(next.value); };
    const start = await antwort(); const vaultId = start.bereit.id;
    const original = Buffer.alloc(20 * 1024 * 1024); for(let i=0;i<original.length;i++) original[i]=i%251;
    const sha = createHash("sha256").update(original).digest("hex");
    gross.stdin.write(JSON.stringify({ aktion:"speichern", vaultId, documentId:"grosse-pipe", name:"Grenzdatei.bin", mime:"application/octet-stream", date:0, data:original.toString("base64") }) + "\n");
    const receipt = await antwort(); assert.equal(receipt.ok?.sha256, sha, JSON.stringify(receipt));
    gross.stdin.write(JSON.stringify({ aktion:"lesen", vaultId, entryId:receipt.ok.entryId }) + "\n");
    const gelesen = await antwort(); assert.ok(gelesen.ok?.data, "Keine Originalbytes in der Antwort");
    assert.equal(createHash("sha256").update(Buffer.from(gelesen.ok.data,"base64")).digest("hex"),sha);
    gross.stdin.end(); const [code] = await beendet; assert.equal(code,0,stderr);
    console.log("Windows-Engine: 20 MiB durch Produktions-JSON/Pipe mit 256 MiB Heap grün");
  } finally { clearTimeout(timeout); gross.kill(); }
}
