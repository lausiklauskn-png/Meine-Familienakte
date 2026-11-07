// Sitzung 4 (Klaus 07.11.2026): „Landkarte der App“ ganz oben in der Hilfe, Stand aus der Liste, Geändertes golden bis zum
// Antippen (höchstens 14 Tage), am Handy als Liste; Welle 1 der Hilfe als Bild mit höchstens drei Merkpunkten und „Ausführlich“.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, footer, collectErrors } from "./_harness.mjs";
// step() wertet einen zurückgegebenen Text als grün; darum scheitert soll() mit einer Ausnahme.
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };
const app = await startApp();
const browser = await launchBrowser();
const WELLE1 = ["eingangszentrale", "fotografieren", "zu-gross", "vollsicherung", "export", "umzug", "fristen-verwalten", "mein-kalender", "app-glocke", "assistenz"];
try {
  for (const [name, geraet] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const context = await browser.newContext(geraet);
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await footer(page, "Hilfe");
    const karte = page.locator("details[data-app-landkarte]");
    check(await karte.count() === 1, `${name}: „Landkarte der App“ ist da`);
    check(await page.evaluate(() => { const k = document.querySelector("[data-app-landkarte]"), f = document.querySelector("[data-hilfe-frage]");
      return Boolean(k && f && k.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING); }), `${name}: steht über „Wie kann ich dir helfen?“`);
    check(await karte.evaluate((d) => !d.open), `${name}: ist zugeklappt`);
    await karte.locator("summary").click(); await page.waitForTimeout(500);
    const ansicht = await karte.locator("[data-landkarte]").getAttribute("data-ansicht");
    check(ansicht === (name === "Handy" ? "liste" : "karte"), `${name}: beginnt als ${name === "Handy" ? "Liste" : "Karte"} (${ansicht})`);
    if (name === "Handy") {
      check(await karte.locator("[data-lk-spalte]").count() === 8, `${name}: Liste mit acht Schritten`);
      await karte.locator('[data-lk-ansicht="karte"]').click(); await page.waitForTimeout(500);
    }
    const lage = await karte.evaluate((d) => ({ kaesten: d.querySelectorAll("[data-karte-id]").length, aeste: d.querySelectorAll("path[data-ast]").length,
      quer: document.documentElement.scrollWidth <= innerWidth + 1,
      trifft: (() => { const p = d.querySelector('path[data-ast="eingang>pruefung"]'), e = d.querySelector('[data-karte-knoten="pruefung"]'); if (!p || !e) return false;
        const z = p.getAttribute("d").trim().split(/[ CM]+/).filter(Boolean).map(Number); return Math.abs(z[z.length - 2] - e.offsetLeft) < 4; })(),
      geplant: d.querySelector('[data-karte-id="pruefung"]')?.classList.contains("s-geplant") }));
    check(lage.kaesten >= 43 && lage.aeste >= 40, `${name}: ganze Karte (${lage.kaesten} Kästen, ${lage.aeste} Äste)`);
    check(lage.trifft, `${name}: Ast endet am Kasten, auch nach dem Aufklappen`);
    check(lage.geplant, `${name}: Stand aus der Liste – Prüfung der Anlagen „geplant“`);
    check(lage.quer, `${name}: die Seite läuft nicht quer`);
    await step(`${name}: Tipp auf Eingangszentrale nennt Wege, „Hingehen ›“ führt hin`, async () => {
      await karte.locator('[data-karte-id="eingang"]').click();
      const text = await karte.locator(".lk-info").textContent();
      await karte.locator(".lk-info button", { hasText: "Hingehen" }).click(); await page.waitForTimeout(600);
      const da = await page.evaluate(() => /Eingangszentrale/.test(document.querySelector("main")?.innerText || ""));
      return soll(/geht zu: Prüfung der Anlagen/.test(text) && da, text);
    });
    await step(`${name}: Geändertes golden bis zum Antippen, nach 14 Tagen weg`, async () => {
      await page.evaluate(() => { const g = JSON.parse(localStorage.getItem("fa_landkarte_app_v2")); g.stand.pruefung = "imbau"; g.stand.wfpdf = "geplant"; g.gold = {}; localStorage.setItem("fa_landkarte_app_v2", JSON.stringify(g)); });
      await page.reload({ waitUntil: "networkidle" }); await ready(page); await footer(page, "Hilfe");
      const k = page.locator("details[data-app-landkarte]");
      const zahl = await k.locator("[data-lk-gold]").getAttribute("data-lk-gold");
      await k.locator("summary").click(); await page.waitForTimeout(400);
      if (name === "Handy") { await k.locator('[data-lk-ansicht="karte"]').click(); await page.waitForTimeout(400); }
      const vorher = await k.locator('[data-karte-id="pruefung"]').evaluate((e) => e.classList.contains("frisch"));
      await k.locator('[data-karte-id="pruefung"]').click();
      const nachher = await k.locator('[data-karte-id="pruefung"]').evaluate((e) => e.classList.contains("frisch"));
      // wfpdf: Gold 15 Tage alt → weg
      await page.evaluate(() => { const g = JSON.parse(localStorage.getItem("fa_landkarte_app_v2")); g.gold.wfpdf = Date.now() - 15 * 86400000; localStorage.setItem("fa_landkarte_app_v2", JSON.stringify(g)); });
      await page.reload({ waitUntil: "networkidle" }); await ready(page); await footer(page, "Hilfe");
      const rest = await page.evaluate(() => JSON.parse(localStorage.getItem("fa_landkarte_app_v2")).gold);
      return soll(zahl === "2" && vorher && !nachher && !("pruefung" in rest) && !("wfpdf" in rest), JSON.stringify({ zahl, vorher, nachher, rest }));
    });
    for (const id of WELLE1) {
      const r = await page.locator(`[data-hilfe-id="${id}"]`).evaluate((e) => ({
        bild: Boolean(e.querySelector("[data-ablaufbild], [data-landkarte]")), merk: e.querySelectorAll(".hilfe-merk > li").length,
        ausf: Boolean(e.querySelector("[data-hilfe-ausfuehrlich]")) })).catch(() => null);
      check(r && r.bild && r.merk >= 1 && r.merk <= 3 && r.ausf, `${name}: „${id}“ als Bild, ${r?.merk} Merkpunkte, Ausführlich eingeklappt`);
    }
    await step(`${name}: die Suche findet den eingeklappten Text weiter („Message-ID“ → Eingangszentrale)`, async () => {
      await page.locator("#hilfe-frage-feld").fill("eml Message-ID Anlagen"); await page.waitForTimeout(350);
      const ids = await page.locator("[data-hilfe-treffer]").evaluateAll((l) => l.map((e) => e.dataset.hilfeTreffer));
      return soll(ids.includes("eingangszentrale"), ids.join(","));
    });
    check(errors.length === 0, `${name}: keine Fehler in der Konsole`, errors.join(" | "));
    await context.close();
  }
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Landkarte der App"));
