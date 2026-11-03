import { execFileSync } from "node:child_process";
import path from "node:path";
// Nur Testvorbereitung: derselbe öffentliche Speicherweg, echte Browserdateien.
// Kein Produktionsschalter und keine simulierte Dateisystem-API.
import { build } from "esbuild";
let source;
export async function vaultFixture(page) {
  if (!source) {
    const result = await build({ stdin: { contents: 'export * from "./app/local-vault.ts"; export * from "./app/sample-family.ts";', resolveDir: process.cwd() }, bundle: true, write: false, format: "esm", platform: "browser", target: "es2022", tsconfig: "tsconfig.json", plugins: process.env.DEMO_SAMPLE_BASELINE ? [{ name: "historischer-demo-code", setup(build) { build.onLoad({ filter: /[\\/]sample-family\.ts$/ }, () => ({ contents: execFileSync("git", ["show", `${process.env.DEMO_SAMPLE_BASELINE}:app/sample-family.ts`], { encoding: "utf8" }), loader: "ts", resolveDir: path.resolve("app") })); } }] : [] });
    source = result.outputFiles[0].text;
  }
  await page.evaluate(async (source) => {
    const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    try { window.__vaultFixture = await import(url); } finally { URL.revokeObjectURL(url); }
  }, source);
}
