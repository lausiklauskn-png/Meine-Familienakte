// Landkarte der App als eigene Datei (Klaus 10.11.2026, Geschenkbox): docs/landkarte/Familienakte-Landkarte.html öffnet von der
// Platte ohne Netz, ein Tipp auf einen Kasten zeigt die Wege, die Legende hebt hervor, kein Rot (ohne Gerätezustand).
// Baut die Datei neu (tools/landkarte-datei.mjs), damit sie zum Stand von lib/app-landkarte.ts und lib/app-stand.ts passt.
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { launchBrowser, DESKTOP, HANDY, ROOT, step, soll, summary, collectErrors } from "./_harness.mjs";

const datei = path.join(ROOT, "docs/landkarte/Familienakte-Landkarte.html");
const bau = spawnSync(process.execPath, [path.join(ROOT, "tools/landkarte-datei.mjs")], { cwd: ROOT, stdio: "inherit" });
if (bau.status !== 0) throw new Error("Bau der Landkarten-Datei fehlgeschlagen.");
const browser = await launchBrowser();
try {
  await step("Datei bettet alles ein (kein src= oder href= auf fremde Teile)", async () => {
    const html = readFileSync(datei, "utf8");
    return soll(!/<script[^>]+src=/.test(html) && !/<link[^>]+stylesheet/.test(html), "Datei lädt noch Teile nach");
  });
  for (const [name, geraet] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const page = await (await browser.newContext({ ...geraet, offline: true })).newPage();
    const errors = collectErrors(page);
    await page.goto("file://" + datei);
    await page.waitForFunction(() => document.querySelectorAll("path.lk-ast").length > 10, null, { timeout: 15000 });
    await step(`${name}: von der Platte ohne Netz – alle Kästen da, kein Rot, kein „Hingehen“`, async () => {
      const r = await page.evaluate(() => ({ kaesten: document.querySelectorAll("[data-karte-id]").length, rot: document.querySelectorAll(".s-aktivieren, [data-live]").length }));
      return soll(r.kaesten >= 40 && r.rot === 0, r);
    });
    // Klaus 10.11.: die Zahl steht immer im Kästchen der Legende, ohne Tippen.
    await step(`${name}: Legende zeigt ohne Tippen je Feld die Zahl, sie stimmt mit den Kästen überein`, async () => {
      const r = await page.evaluate(() => {
        const zahl = (f) => document.querySelector(`[data-lk-filter="${f}"] [data-lk-treffer]`)?.getAttribute("data-lk-treffer");
        return { geplant: zahl("s-geplant"), geplantKaesten: String(document.querySelectorAll(".s-geplant[data-karte-id]").length),
          fertig: zahl("s-fertig"), fertigKaesten: String(document.querySelectorAll(".s-fertig[data-karte-id]").length),
          beide: zahl("beide"), beideWege: String(document.querySelectorAll('path.lk-ast[data-richtung="beide"]').length) };
      });
      return soll(r.geplant === r.geplantKaesten && Number(r.geplant) > 0 && r.fertig === r.fertigKaesten && r.beide === r.beideWege, r);
    });
    await step(`${name}: Tipp auf Eingangszentrale hebt ihre Wege hervor und nennt sie`, async () => {
      await page.locator('[data-karte-id="eingang"]').click();
      const r = await page.evaluate(() => ({ an: document.querySelectorAll("path.lk-ast.an").length, info: document.querySelector("[data-karte-info]")?.getAttribute("data-karte-info"),
        text: document.querySelector(".lk-info")?.textContent || "", knopf: document.querySelectorAll(".lk-info button").length }));
      return soll(r.an >= 10 && r.info === "eingang" && /kommt von/.test(r.text) && /geht zu/.test(r.text) && r.knopf === 0, r);
    });
    await step(`${name}: Legende „geplant“ hebt hervor, Zahl am Knopf, keine Liste; nochmal tippen hebt auf`, async () => {
      await page.locator('[data-karte-id="eingang"]').click();
      await page.locator('[data-lk-filter="s-geplant"]').click();
      await page.waitForSelector('[data-lk-filter="s-geplant"] [data-lk-treffer]', { timeout: 3000 }).catch(() => {});
      const an = await page.evaluate(() => ({ f: document.querySelector("[data-landkarte]").getAttribute("data-lk-gefiltert"), t: document.querySelectorAll(".treffer[data-karte-id]").length,
        zahl: document.querySelector('[data-lk-filter="s-geplant"] [data-lk-treffer]')?.getAttribute("data-lk-treffer"), info: document.querySelector(".lk-info")?.textContent || "" }));
      await page.locator('[data-lk-filter="s-geplant"]').click();
      await page.waitForFunction(() => !document.querySelector("[data-landkarte]").hasAttribute("data-lk-gefiltert"), null, { timeout: 3000 }).catch(() => {});
      const aus = await page.evaluate(() => document.querySelector("[data-landkarte]").hasAttribute("data-lk-gefiltert"));
      return soll(an.f === "s-geplant" && an.t > 0 && an.zahl === String(an.t) && !/hervorgehoben/.test(an.info) && !aus, { an, aus });
    });
    await step(`${name}: keine Fehler auf der Seite`, async () => soll(errors.length === 0, errors));
  }
} finally { await browser.close(); }
summary("Landkarte als Datei");
