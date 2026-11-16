// Hilfe-Thema „Discovery“ (Klaus 15.11.2026): die Seite aus dem Datei-Organizer (public/discovery/, byte-gleich) im Vollbild-Rahmen
// über der App. Geprüft: Thema da (direkt hinter dem Pro-App-Verbund), Tipp öffnet den Rahmen, im Rahmen läuft die Seite (15 Sprechtexte,
// three.js, kein eigener Rückweg-Knopf), Tonspuren und alle Filme der Pins sind abrufbar (auch als Ausschnitt), Schließen/Esc/Zurück,
// Fernrohr in der Kopfleiste (am Handy hinter „‹“) öffnet denselben Rahmen, Installations-Vorrat ohne Film und Ton.
import { readFileSync, statSync } from "node:fs";
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, soll, summary, footer, collectErrors } from "./_harness.mjs";
const PIN = JSON.parse(readFileSync(new URL("../../public/discovery/HERKUNFT.json", import.meta.url), "utf8"));
const FILME = Object.keys(PIN.dateien).filter((d) => d.endsWith(".mp4")), BILDER = Object.keys(PIN.dateien).filter((d) => d.endsWith(".jpg"));
const KREISLAUF = statSync(new URL("../../public/discovery/discovery-kreislauf.mp4", import.meta.url)).size;
const app = await startApp();
const browser = await launchBrowser();
try {
  for (const [name, geraet] of [["Desktop", DESKTOP], ["Handy", HANDY]]) {
    const context = await browser.newContext(geraet);
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    await footer(page, "Hilfe");
    const thema = page.locator("details[data-discovery-hilfe]");
    check(await thema.count() === 1, `${name}: Thema „Discovery“ steht in der Hilfe`);
    await step(`${name}: das Thema steht bei den Landkarten, direkt hinter dem Pro-App-Verbund`, async () => {
      const ids = await page.locator("[data-hilfe-id]").evaluateAll((l) => l.map((e) => e.dataset.hilfeId));
      const i = ids.indexOf("pro-verbund");
      return soll(i >= 0 && ids[i + 1] === "discovery", ids.slice(Math.max(0, i - 1), i + 3).join(","));
    });
    await step(`${name}: Tipp auf „Discovery öffnen“ öffnet den Vollbild-Rahmen mit der Seite`, async () => {
      await thema.locator("summary").click();
      soll((await thema.innerText()).includes("So lernte der Sortier-Kern: erfundene Städte, Lern-Kreislauf, Kurzfilme mit Sprecher."), "Kurztext fehlt");
      await thema.locator("[data-discovery-oeffnen]").click();
      const rahmen = page.locator("[data-discovery-rahmen]");
      await rahmen.waitFor({ state: "visible", timeout: 5000 });
      const mass = await rahmen.evaluate((r) => { const b = r.getBoundingClientRect(); return { b: b.width, h: b.height, w: innerWidth, H: innerHeight }; });
      soll(mass.b >= mass.w - 1 && mass.h >= mass.H - 1, JSON.stringify(mass));
      await page.frameLocator("iframe[data-discovery-frame]").locator("h1").first().waitFor({ state: "attached", timeout: 15000 });
      return true;
    });
    const frame = () => page.frames().find((f) => /\/discovery\/discovery\.html$/.test(new URL(f.url()).pathname));
    await step(`${name}: im Rahmen läuft die Seite – 15 Sprechtexte, three.js geladen, kein eigener Rückweg-Knopf`, async () => {
      const f = frame(); soll(Boolean(f), "Rahmen zeigt nicht discovery/discovery.html");
      const stand = await f.evaluate("({ texte: Object.keys(SPRECHTEXTE).length, drei: typeof THREE, zurueck: document.querySelectorAll('[data-zurueck]').length, titel: document.title })");
      return soll(stand.texte === 15 && stand.drei === "object" && stand.zurueck === 0, JSON.stringify(stand));
    });
    await step(`${name}: jede der 15 Tonspuren ist neben der Seite abrufbar; ein Ausschnitt (Range) kommt als 206`, async () => {
      const f = frame();
      const ton = await f.evaluate(`(async () => {
        const fehlt = [];
        for (const k of Object.keys(SPRECHTEXTE)) { const r = await fetch(TON_ORDNER + k + TON_ENDUNG); const n = (await r.arrayBuffer()).byteLength; if (!r.ok || n < 20000) fehlt.push(k + ":" + r.status + ":" + n); }
        const teil = await fetch(TON_ORDNER + "begruessung" + TON_ENDUNG, { headers: { range: "bytes=0-99" } });
        return { fehlt, teil: teil.status, laenge: (await teil.arrayBuffer()).byteLength, art: teil.headers.get("content-type") };
      })()`);
      return soll(ton.fehlt.length === 0 && ton.teil === 206 && ton.laenge === 100 && /audio/.test(ton.art || ""), JSON.stringify(ton));
    });
    await step(`${name}: alle ${FILME.length} Filme und ${BILDER.length} Standbilder der Pins liegen neben der Seite`, async () => {
      const f = frame();
      const fehlt = await f.evaluate(`(async () => {
        const fehlt = [];
        for (const d of ${JSON.stringify(FILME)}) { const r = await fetch(d, { headers: { range: "bytes=0-1023" } }); const n = (await r.arrayBuffer()).byteLength; if (r.status !== 206 || n !== 1024 || !/video/.test(r.headers.get("content-type") || "")) fehlt.push(d + ":" + r.status + ":" + n); }
        for (const d of ${JSON.stringify(BILDER)}) { const r = await fetch(d); if (!r.ok) fehlt.push(d + ":" + r.status); }
        return fehlt;
      })()`);
      return soll(FILME.length >= 15 && BILDER.length >= 9 && fehlt.length === 0, JSON.stringify({ filme: FILME.length, bilder: BILDER.length, fehlt }));
    });
    await step(`${name}: Film und Standbild des Kreislaufs liegen neben der Seite`, async () => {
      const f = frame();
      const film = await f.evaluate(`(async () => {
        const kopf = await fetch("discovery-kreislauf.mp4", { headers: { range: "bytes=0-1023" } }), bild = await fetch("discovery-kreislauf.jpg");
        return { film: kopf.status, n: (await kopf.arrayBuffer()).byteLength, bereich: kopf.headers.get("content-range"), bild: bild.status };
      })()`);
      return soll(film.film === 206 && film.n === 1024 && (film.bereich || "").endsWith("/" + KREISLAUF) && film.bild === 200, JSON.stringify(film));
    });
    await step(`${name}: Schließen nimmt den Rahmen weg, die Hilfe bleibt stehen`, async () => {
      await page.locator("[data-discovery-schliessen]").click();
      await page.locator("[data-discovery-rahmen]").waitFor({ state: "detached", timeout: 3000 });
      return soll(await thema.isVisible(), "Hilfe-Thema nicht mehr sichtbar");
    });
    await step(`${name}: Zurück (wie Android-Zurück) und Esc schließen den Rahmen`, async () => {
      await thema.locator("[data-discovery-oeffnen]").click();
      await page.locator("[data-discovery-rahmen]").waitFor({ state: "visible", timeout: 3000 });
      const verbraucht = await page.evaluate(() => window.familienakteZurueck?.());
      await page.locator("[data-discovery-rahmen]").waitFor({ state: "detached", timeout: 3000 });
      soll(verbraucht === true && await thema.isVisible(), "Zurück verließ die Hilfe");
      await thema.locator("[data-discovery-oeffnen]").click();
      await page.locator("[data-discovery-rahmen]").waitFor({ state: "visible", timeout: 3000 });
      await page.keyboard.press("Escape");
      await page.locator("[data-discovery-rahmen]").waitFor({ state: "detached", timeout: 3000 });
      return true;
    });
    await step(`${name}: Fernrohr „Discovery“ in der Kopfleiste (${name === "Handy" ? "hinter „‹“" : "direkt sichtbar"}) öffnet denselben Rahmen; Zurück und Esc schließen ihn`, async () => {
      const knopf = page.locator(".header-actions > [data-discovery-knopf]");
      soll(await knopf.count() === 1 && await knopf.getAttribute("aria-label") === "Discovery" && await knopf.locator("svg").count() === 1, "Knopf fehlt oder ohne Strichsymbol/aria-label");
      soll(!/\p{Extended_Pictographic}/u.test(await knopf.innerText()), "Emoji im Knopf");
      const auf = async () => {
        if (await page.locator("[data-kopf-auf]").isVisible()) { soll(!(await knopf.isVisible()), "am Handy schon vor „‹“ sichtbar"); await page.locator("[data-kopf-auf]").click(); await page.waitForTimeout(300); }
        soll(await knopf.isVisible(), "Knopf nicht sichtbar");
        await knopf.click();
        await page.locator("[data-discovery-rahmen]").waitFor({ state: "visible", timeout: 5000 });
      };
      await auf();
      await page.frameLocator("iframe[data-discovery-frame]").locator("h1").first().waitFor({ state: "attached", timeout: 15000 });
      const mass = await page.locator("[data-discovery-rahmen]").evaluate((r) => { const b = r.getBoundingClientRect(); return { b: b.width, h: b.height, w: innerWidth, H: innerHeight }; });
      soll(Boolean(frame()) && mass.b >= mass.w - 1 && mass.h >= mass.H - 1, JSON.stringify(mass));
      const verbraucht = await page.evaluate(() => window.familienakteZurueck?.());
      await page.locator("[data-discovery-rahmen]").waitFor({ state: "detached", timeout: 3000 });
      soll(verbraucht === true && await thema.isVisible(), "Zurück verließ die Seite");
      if (await page.locator("[data-kopf-zu]").isVisible()) { await page.locator("[data-kopf-zu]").click(); await page.waitForTimeout(300); }
      await auf();
      await page.keyboard.press("Escape");
      await page.locator("[data-discovery-rahmen]").waitFor({ state: "detached", timeout: 3000 });
      if (await page.locator("[data-kopf-zu]").isVisible()) { await page.locator("[data-kopf-zu]").click(); await page.waitForTimeout(300); }
      return soll(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Seite läuft quer");
    });
    await step(`${name}: „Wie kann ich dir helfen?“ findet das Thema über „Sortier-Kern“`, async () => {
      await page.locator("#hilfe-frage-feld").fill("Wie hat der Sortier-Kern gelernt"); await page.waitForTimeout(350);
      const ids = await page.locator("[data-hilfe-treffer]").evaluateAll((l) => l.map((e) => e.dataset.hilfeTreffer));
      return soll(ids.slice(0, 3).includes("discovery"), ids.join(","));
    });
    check(errors.length === 0, `${name}: keine Fehler in der Konsole`, errors.join(" | "));
    await context.close();
  }
  // Der Installations-Vorrat des Workers nimmt Seite, three.js und Standbilder, aber weder Filme noch Tonspuren (kommen beim Gebrauch).
  const sw = await (await fetch(new URL("sw.js", app.base))).text();
  const liste = JSON.parse(/const DATEIEN = (\[.*?\]);/s.exec(sw)[1]).filter((f) => f.startsWith("./discovery/"));
  check(liste.includes("./discovery/discovery.html") && liste.includes("./discovery/discovery-three.min.js") && liste.includes("./discovery/discovery-kreislauf.jpg"), "Vorrat: Seite, three.js und Standbild liegen vorab bereit", liste.join(","));
  check(!liste.some((f) => /\.(mp4|mp3)$/.test(f)), "Vorrat: kein Film und keine Tonspur wird vorab geladen", liste.join(","));
  const gross = liste.reduce((n, f) => n + statSync(new URL("../../dist/" + f.slice(2), import.meta.url)).size, 0);
  check(gross < 4_000_000, "Vorrat: Discovery belegt vorab unter 4 MB (Seite, three.js, Standbilder)", String(gross));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Discovery"));
