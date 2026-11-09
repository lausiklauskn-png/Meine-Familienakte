// Rückmeldung 09.11., Abschnitt B: sieben Muster über die ganze App – Schlagwort oben (B1), Info-Zeile (B2), ein Suchfeld
// (B3), Erklärsätze ins „?“ (B4), „?“-Texte mit fettem Kern und Punkten (B5), keine Doppelung beim Aufklappen (B6),
// keine internen Kennnummern (B7). Am Handy (390 px).
import { startApp, launchBrowser, HANDY, ready, step, soll, check, summary, collectErrors, footer } from "./_harness.mjs";

const KENNUNG = /\b(?:EVENT|TASK|DEADLINE|REMINDER|VORG|CASE|DOC|PERSON|ORG|OBJ|OBJECT)-\d{4,}\b/;
const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(HANDY);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);

  await step("B4: Startseite ohne feste Erklärsätze unter „Zuletzt wichtig“ und in den Tresor-Knöpfen", async () => {
    const t = await page.locator("main").innerText();
    return soll(!/Überfällige und heute fällige Punkte stehen zuerst/.test(t) && !/einzeln prüfen und speichern/.test(t) && !/Wähle den Eingangsweg/.test(t), "Erklärsatz steht noch da");
  });
  await step("B5: „?“ zeigt den Kern fett und die übrigen Sätze als Punkte", async () => {
    await page.getByRole("button", { name: "Zuletzt wichtig erklären" }).click();
    const fenster = page.locator(".start-info-panel.info-angeheftet"); await fenster.waitFor();
    const r = { kern: await fenster.locator(".hinweis-kern").count(), punkte: await fenster.locator(".hinweis-punkte li").count() };
    await page.getByRole("button", { name: "Hinweis schließen" }).click();
    return soll(r.kern === 1 && r.punkte >= 2, r);
  });
  await step("B3: Suchfeld „In der Familienakte suchen“ ohne Lupe im Feld, Mikrofon als eigener Knopf daneben", async () => {
    const r = await page.evaluate(() => { const f = document.querySelector(".search-command-bar .such-feld"); const e = f?.querySelector(".such-eingabe"); const m = f?.querySelector(":scope > .dictation-control .dictation-button"); const er = e?.getBoundingClientRect(), mr = m?.getBoundingClientRect(); return { feld: !!f, lupe: e?.querySelectorAll("svg").length ?? -1, mik: !!m, daneben: er && mr ? mr.left >= er.right - 1 : false }; });
    return soll(r.feld && r.lupe === 0 && r.mik && r.daneben, r);
  });

  await footer(page, "Dokumentenbibliothek");
  await step("B2: Bibliothek zeigt „Info · Datensparsame Dokumentvorschau“ als eine Zeile, Tipp klappt den Text auf", async () => {
    const z = page.locator('[data-info-zeile="Datensparsame Dokumentvorschau"]'); await z.waitFor();
    const h0 = (await z.boundingBox()).height; const zu = await z.locator(".info-zeile-text").count();
    await z.locator(".info-zeile-kopf").click();
    const auf = await z.locator(".info-zeile-text").innerText();
    return soll(h0 < 60 && zu === 0 && /Gesundheits/.test(auf), { h0, zu, auf: auf.slice(0, 40) });
  });
  await step("B3: Bibliothekssuche ohne Lupe im Feld (die Überschrift trägt sie), Mikrofon daneben", async () => {
    const r = await page.evaluate(() => { const f = document.querySelector(".library-search.such-feld"); return { lupe: f?.querySelectorAll(".such-eingabe svg").length ?? -1, mik: f?.querySelectorAll(":scope > .dictation-control").length ?? 0, kopf: !!f?.closest("label")?.querySelector(":scope > span svg") }; });
    return soll(r.lupe === 0 && r.mik === 1 && r.kopf, r);
  });

  await footer(page, "Fristen und Aufgaben");
  await step("B3: Fristensuche bekommt das Mikrofon", async () => soll((await page.locator(".fristen-suche.such-feld > .dictation-control").count()) === 1, "kein Mikrofon"));
  await step("B6 + B7: aufgeklappte Frist zeigt den Titel einmal und keine Kennnummer", async () => {
    const art = page.locator("article.schedule-flach").first(); await art.scrollIntoViewIfNeeded();
    const titel = await art.locator(".mk-text .flach").getAttribute("title");
    await art.locator("[data-fz-griff]").click().catch(() => {}); await art.locator("[data-termin-auge]").click();
    await art.locator("[data-termin-offen]").waitFor();
    const text = await art.innerText();
    const mal = text.split(titel).length - 1;
    return soll(mal === 1 && !KENNUNG.test(text) && (await art.locator("[data-flach-ganz]").count()) === 1, { titel, mal, kennung: text.match(KENNUNG)?.[0] });
  });

  await footer(page, "Cockpit");
  await step("B7: Cockpit ohne sichtbare Kennnummern", async () => { const t = await page.locator("main").innerText(); return soll(!KENNUNG.test(t), t.match(KENNUNG)?.[0]); });
  await step("B1: In der Vorgangsakte steht das Schlagwort über dem Text, der Text hat die volle Breite", async () => {
    await page.locator("#cockpit-cases [data-cockpit-eintrag]").first().click();
    await page.locator("[data-stamm-akte]").click(); await page.locator("#cockpit-dossier").waitFor();
    const r = await page.evaluate(() => { const b = document.querySelector(".dossier-link-group > div > button"); if (!b) return { da: false }; const k = b.querySelector(":scope > .badge").getBoundingClientRect(), t = b.querySelector(":scope > span:not(.badge)").getBoundingClientRect(), g = b.getBoundingClientRect(); return { da: true, oben: k.bottom <= t.top + 1, links: Math.abs(k.left - t.left) < 2, breite: Math.round(t.width / g.width * 100) }; });
    return soll(r.da && r.oben && r.links && r.breite >= 75, r);
  });
  await step("B7: Vorgangsakte zeigt die Quelle mit Namen statt Kennnummer", async () => { const t = await page.locator("#cockpit-dossier").innerText(); return soll(!KENNUNG.test(t), t.match(KENNUNG)?.[0]); });

  await footer(page, "Tagebuch");
  await step("B6: aufgeklappter Tagebuch-Eintrag zeigt Titel und Zeit nur einmal", async () => {
    const z = page.locator(".memory-event-zeile").first(); await z.scrollIntoViewIfNeeded();
    await z.locator("[data-fz-griff]").click().catch(() => {}); await z.locator("[data-memory-auge]").click(); await z.locator("[data-memory-offen]").waitFor();
    const titel = await z.locator(".mk-text [data-flach-ganz]").innerText();
    const text = await z.innerText();
    return soll(text.split(titel).length - 1 === 1, { titel, text: text.slice(0, 160) });
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
  await context.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Rückmeldung B"));
