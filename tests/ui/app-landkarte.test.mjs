// Sitzung 4 (Klaus 07.11.2026): Landkarte ganz oben in der Hilfe, Stand aus der Liste, Geändertes golden bis zum Antippen
// (höchstens 14 Tage); Welle 1 der Hilfe als Bild mit höchstens drei Merkpunkten und „Ausführlich“.
// 2.28.38 (Klaus 08.11.2026): ein Kasten mit blauem „Demo starten“, Landkarten-Symbol und „?“ oben rechts; das Symbol klappt die
// „Interaktive Landkarte der App“ auf – immer als Karte, auch am Handy (keine Listenansicht mehr).
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
    const karte = page.locator("[data-app-landkarte]");
    check(await karte.count() === 1, `${name}: Kasten mit Demo und Landkarte ist da`);
    await step(`${name}: ein Kasten – blauer Knopf „Demo starten“, Landkarten-Symbol, „?“ oben rechts, kein Wort „Demo“ als Überschrift`, async () => {
      const r = await karte.evaluate((k) => { const b = k.getBoundingClientRect(), f = k.querySelector(".hilfe-oben-frage")?.getBoundingClientRect(), d = k.querySelector("[data-demo-start]");
        return { demo: Boolean(d), blau: d ? getComputedStyle(d).backgroundColor : "", symbol: Boolean(k.querySelector("[data-app-landkarte-knopf] svg")), h2: k.querySelectorAll("h2").length,
          obenRechts: Boolean(f && f.top - b.top < 24 && b.right - f.right < 24) }; });
      return soll(r.demo && r.blau === "rgb(29, 91, 148)" && r.symbol && r.h2 === 0 && r.obenRechts, r);
    });
    check(await page.evaluate(() => { const k = document.querySelector("[data-app-landkarte]"), f = document.querySelector("[data-hilfe-frage]");
      return Boolean(k && f && k.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING); }), `${name}: steht über „Wie kann ich dir helfen?“`);
    check(await karte.getAttribute("data-app-landkarte") === "zu" && !(await karte.locator("[data-app-landkarte-inhalt]").isVisible()), `${name}: Landkarte ist zugeklappt`);
    await karte.locator("[data-app-landkarte-knopf]").click(); await page.waitForTimeout(500);
    const ansicht = await karte.locator("[data-landkarte]").getAttribute("data-ansicht");
    const kopf = await karte.locator(".hilfe-oben-karte-kopf h3").innerText();
    check(ansicht === "karte" && (await karte.locator("[data-lk-ansicht], .lk-umschalter").count()) === 0, `${name}: immer als Karte, kein Umschalter (${ansicht})`);
    check(kopf === "Interaktive Landkarte der App" && !/Woher etwas kommt/.test(await karte.innerText()), `${name}: Überschrift „Interaktive Landkarte der App“, ohne Satz darunter (${kopf})`);
    const lage = await karte.evaluate((d) => ({ kaesten: d.querySelectorAll("[data-karte-id]").length, aeste: d.querySelectorAll("path[data-ast]").length,
      quer: document.documentElement.scrollWidth <= innerWidth + 1,
      trifft: (() => { const p = d.querySelector('path[data-ast="eingang>pruefung"]'), e = d.querySelector('[data-karte-knoten="pruefung"]'); if (!p || !e) return false;
        const z = p.getAttribute("d").trim().split(/[ CM]+/).filter(Boolean).map(Number); return Math.abs(z[z.length - 2] - e.offsetLeft) < 4; })(),
      geplant: d.querySelector('[data-karte-id="pruefung"]')?.classList.contains("s-geplant") }));
    check(lage.kaesten >= 43 && lage.aeste >= 40, `${name}: ganze Karte (${lage.kaesten} Kästen, ${lage.aeste} Äste)`);
    check(lage.trifft, `${name}: Ast endet am Kasten, auch nach dem Aufklappen`);
    check(lage.geplant, `${name}: Stand aus der Liste – Prüfung der Anlagen „geplant“`);
    check(lage.quer, `${name}: die Seite läuft nicht quer`);
    // Gerätetest 10.11. (Tablet, große Schrift): Fäden saßen 50–90 px über ihren Kästen, weil nur die Breite des ersten Kastens
    // beobachtet wurde. Kästen werden später höher → jeder Faden muss danach noch an seinem Kasten beginnen.
    await step(`${name}: Fäden beginnen an ihrem Kasten, auch wenn Kästen später höher werden`, async () => {
      await page.addStyleTag({ content: ".lk-chip small, .lk-kasten small { font-size: 1.15rem !important; line-height: 1.6 !important; }" });
      await page.waitForTimeout(600);
      const r = await karte.evaluate((k) => { const d = k.querySelector(".lk-buehne"), svg = d?.querySelector("svg.lk-aeste")?.getBoundingClientRect(); const falsch = []; let geprueft = 0;
        d.querySelectorAll("path[data-ast]").forEach((p) => { const [von] = p.getAttribute("data-ast").split(">"); const e = d.querySelector(`[data-karte-id="${von}"]`); if (!e || !svg) return;
          const m = p.getAttribute("d").trim().match(/^M\s*([\d.-]+)[ ,]+([\d.-]+)/); if (!m) return; const b = e.getBoundingClientRect(), y = Number(m[2]) + svg.top; geprueft++;
          if (y < b.top - 2 || y > b.bottom + 2) falsch.push(`${von}: ${Math.round(y - b.top)} von ${Math.round(b.height)}`);
          const nach = p.getAttribute("data-ast").split(">")[1], z = d.querySelector(`[data-karte-id="${nach}"]`) || d.querySelector(`[data-karte-gruppe="${nach}"]`);
          const zahlen = p.getAttribute("d").trim().split(/[ CM,]+/).filter(Boolean).map(Number), ye = zahlen[zahlen.length - 1] + svg.top;
          if (z) { const zb = z.getBoundingClientRect(); if (ye < zb.top - 4 || ye > zb.bottom + 4) falsch.push(`→${nach}: ${Math.round(ye - zb.top)} von ${Math.round(zb.height)}`); } });
        return { geprueft, falsch }; });
      return soll(r.geprueft >= 30 && r.falsch.length === 0, r);
    });
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
      const k = page.locator("[data-app-landkarte]");
      const zahl = await k.locator("[data-lk-gold]").getAttribute("data-lk-gold");
      await k.locator("[data-app-landkarte-knopf]").click(); await page.waitForTimeout(400);
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
