// „Mein Kalender“ und App-Glocke (Klaus 2026-11-05): Monat und Tagesliste in der App, Eintrag an einem Tag anlegen und ändern,
// Notiz mit Erinnerung springt in den Kalender, Fristenliste zeigt Uhrzeit und „Ändern“ ohne Seitenwechsel, die Glocke läutet
// (abschaltbar, ab Werk aus). Die Uhr ist gestellt.
import { startApp, launchBrowser, DESKTOP, HANDY, ready, check, step, summary, collectErrors, internetAn, footer } from "./_harness.mjs";
import { speechStub } from "./_stubs.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";

const app = await startApp();
const browser = await launchBrowser();
const register = async (page) => { await vaultFixture(page); return page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records; }); };
try {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.clock.install({ time: new Date(2026, 10, 10, 14, 0) });
  await page.addInitScript(speechStub("Erinnere mich morgen um 9 Uhr Jens anzurufen"));
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await internetAn(page);
  const kal = page.locator("[data-mein-kalender]");

  await step("Kopf: Kalender-Knopf öffnet „Mein Kalender“ mit Monat und heutigem Tag; App-Glocke ab Werk aus", async () => {
    await page.locator("[data-mein-kalender-knopf]").click(); await kal.waitFor();
    const monat = await kal.locator("[data-mk-monat]").innerText();
    const heute = await kal.locator('[data-mk-tag="2026-11-10"]').getAttribute("aria-pressed");
    const glocke = await kal.locator("[data-glocke]").getAttribute("data-glocke");
    return /November 2026/i.test(monat) && heute === "true" && glocke === "aus" ? true : (console.log("   ↳", monat, heute, glocke), false);
  });
  await step("Eintrag am Tag: Titel, 14:30, Erinnerung 15 Min. vorher – steht im Register und in der Tagesliste", async () => {
    await kal.locator("[data-mk-neu]").click();
    await kal.locator("[data-mk-titel]").fill("Zahnarzt anrufen");
    await kal.locator("[data-mk-uhr]").fill("14:30");
    await kal.locator("[data-mk-speichern]").click();
    await kal.locator("[data-mk-eintrag]", { hasText: "Zahnarzt anrufen" }).first().waitFor({ timeout: 8000 });
    const t = (await register(page)).find((r) => r.recordType === "task" && r.data.title === "Zahnarzt anrufen");
    const zeile = await kal.locator("[data-mk-eintrag]", { hasText: "Zahnarzt anrufen" }).first().innerText();
    return t?.data.dueAt === "2026-11-10" && t?.data.dueTime === "14:30" && JSON.stringify(t?.data.erinnerungen) === '["15m"]' && /14:30/.test(zeile) && /15 Min\. vorher/.test(zeile) ? true : (console.log("   ↳", JSON.stringify(t?.data), zeile), false);
  });
  await step("App-Glocke an: nach dem Eintrag von selbst an; 15 Minuten vorher läutet sie mit Hinweis oben; „OK“ schließt, kein zweites Läuten", async () => {
    if ((await kal.locator("[data-glocke]").getAttribute("data-glocke")) !== "an") return false;
    await page.clock.fastForward("16:00");
    const hinweis = page.locator("[data-app-glocke]");
    await hinweis.waitFor({ timeout: 5000 });
    const text = await hinweis.innerText();
    await hinweis.locator("[data-app-glocke-ok]").click();
    await page.clock.fastForward("01:00");
    await page.waitForTimeout(300);
    return /Zahnarzt anrufen/.test(text) && /15 Min\. vorher/.test(text) && (await page.locator("[data-app-glocke]").count()) === 0 ? true : (console.log("   ↳", text), false);
  });
  await step("Ändern im Kalender: Uhrzeit 18:45 im Termin-Fenster – Register und Liste zeigen sie", async () => {
    await kal.locator("[data-mk-eintrag]", { hasText: "Zahnarzt anrufen" }).first().locator("[data-mk-auge]").click(); // 2.28.30: Stift hinter dem Auge
    await kal.locator("[data-mk-eintrag]", { hasText: "Zahnarzt anrufen" }).first().locator("[data-mk-aendern]").click();
    const d = page.locator("[data-termin-bearbeiten]"); await d.waitFor();
    await d.locator("[data-tb-uhr]").fill("18:45");
    await d.locator("[data-tb-speichern]").click(); await d.waitFor({ state: "detached", timeout: 8000 });
    const t = (await register(page)).find((r) => r.recordType === "task" && r.data.title === "Zahnarzt anrufen");
    await page.waitForFunction(() => /18:45/.test(document.querySelector("[data-mein-kalender] .mk-liste")?.textContent || ""), null, { timeout: 5000 });
    return t?.data.dueTime === "18:45";
  });
  await step("Fristenliste: Uhrzeit, Erinnerung und „Ändern“ am Eintrag, ohne Seitenwechsel", async () => {
    const id = (await register(page)).find((r) => r.recordType === "task" && r.data.title === "Zahnarzt anrufen").id;
    const art = page.locator(`#termin-${id}`);
    const flach = await art.locator(".fz-kopf").innerText(); // 2.28.30: flache Zeile, Rest hinter dem Auge
    await art.locator("[data-termin-auge]").click();
    const text = await art.innerText();
    await art.locator("[data-termin-aendern]").click();
    const d = page.locator("[data-termin-bearbeiten]"); await d.waitFor();
    await d.locator("button", { hasText: "Abbrechen" }).click();
    return /18:45 Uhr/.test(text) && /15 Min\. vorher/.test(text) && /18:45/.test(flach) && !/Kennung/.test(flach) ? true : (console.log("   ↳", flach, "|", text), false);
  });
  await step("Löschen (Klaus 2026-11-06): Mülleimer – erster Tipp „Löschen?“, zweiter löscht; weg aus Kalender und Fristenliste", async () => {
    const zeile = kal.locator("[data-mk-eintrag]", { hasText: "Zahnarzt anrufen" }).first();
    const id = await zeile.getAttribute("data-mk-eintrag");
    if ((await zeile.locator("[data-mk-offen]").count()) === 0) await zeile.locator("[data-mk-auge]").click();
    const knopf = zeile.locator("[data-erinnerung-loeschen]");
    await knopf.click();
    const sicher = await knopf.getAttribute("data-erinnerung-loeschen");
    await knopf.click();
    await page.waitForFunction(() => !Array.from(document.querySelectorAll("[data-mk-eintrag]")).some((e) => /Zahnarzt anrufen/.test(e.textContent || "")), null, { timeout: 8000 });
    const t = (await register(page)).find((r) => r.id === id);
    const inListe = await page.locator(`#termin-${id}`).count();
    return sicher === "sicher" && t?.status === "archiviert" && inListe === 0 ? true : (console.log("   ↳", sicher, t?.status, inListe), false);
  });
  await step("Notiz mit Erinnerung: in der Liste steht, wohin sie ging; Kalender-Knopf springt zu „Mein Kalender“ am Tag", async () => {
    await page.locator("[data-notiz-knopf]").click();
    const f = page.locator("[data-notiz-fenster]"); await f.waitFor();
    await page.locator("[data-notiz-fenster] .dictation-button").click(); // 2.28.32: Mikrofon nur auf Tipp
    await page.waitForFunction(() => (document.querySelector("[data-notiz-eingabe]") || {}).value?.includes("morgen um 9 Uhr"), null, { timeout: 5000 });
    await f.locator(".dictation-button.listening").click().catch(() => {});
    await f.locator("[data-notiz-speichern]").click(); await f.locator("[data-notiz-liste] li").first().waitFor();
    const zeile = await f.locator("[data-notiz-liste] li").first().innerText();
    await f.locator("[data-notiz-liste] [data-notiz-auge]").first().click(); // 2.28.30: hinter dem Auge
    await f.locator("[data-notiz-im-kalender]").first().click();
    await page.waitForFunction(() => document.querySelector('[data-mk-tag="2026-11-11"]')?.getAttribute("aria-pressed") === "true", null, { timeout: 5000 });
    const liste = await kal.locator(".mk-tagesliste").innerText();
    return /in Mein Kalender/.test(zeile) && /09:00/.test(liste) && /Jens anzurufen/i.test(liste) ? true : (console.log("   ↳", zeile, "|", liste), false);
  });
  await step("Tagebuch: „Gehört dazu“ öffnet die Aufgabe im selben Fenster, die Seite bleibt das Tagebuch", async () => {
    await footer(page, "Tagebuch & Erinnerungen");
    await page.locator("button", { hasText: "Jens anzurufen" }).first().click();
    await page.locator(".related-context-list button", { hasText: "Jens" }).first().click();
    const d = page.locator("[data-termin-bearbeiten]"); await d.waitFor({ timeout: 5000 });
    const zeit = await d.locator("[data-tb-uhr]").inputValue();
    await d.locator("button", { hasText: "Abbrechen" }).click();
    const nochDa = await page.locator(".memory-detail").count();
    return zeit === "09:00" && nochDa === 1 ? true : (console.log("   ↳", zeit, nochDa), false);
  });
  await step("Abschnitte einklappen (Klaus 2026-11-06): Tipp auf „Mein Kalender“ schließt/öffnet; „Alle zu“/„Alle auf“; Kalender-Knopf öffnet wieder", async () => {
    await page.locator("[data-mein-kalender-knopf]").click(); await kal.waitFor(); // vorher war das Tagebuch offen
    const titel = kal.locator(".card-heading h2").first();
    await titel.click();
    const zu1 = await kal.evaluate((el) => el.classList.contains("klapp-zu") && getComputedStyle(el.querySelector(".mk-monat")).display === "none");
    await titel.click();
    const auf1 = await kal.evaluate((el) => !el.classList.contains("klapp-zu"));
    // Ein Knopf (Klaus 2026-11-06): ist etwas zu („Erledigte“ ab Werk), zeigt er „auf“ und öffnet alle; dann zeigt er „zu“.
    const anfang = await page.locator("[data-klapp-alle]").getAttribute("data-klapp-alle");
    await page.locator("[data-klapp-alle]").click();
    const erstAuf = await page.evaluate(() => Array.from(document.querySelectorAll("[data-klapp]")).every((el) => el instanceof HTMLDetailsElement ? el.open : !el.classList.contains("klapp-zu")));
    const vorher = await page.locator("[data-klapp-alle]").getAttribute("data-klapp-alle"); // alles offen → zeigt „zu“
    const imKopf = await page.locator(".page-title [data-klapp-alle]").count();
    await page.locator("[data-klapp-alle]").click();
    const alleZu = await page.evaluate(() => Array.from(document.querySelectorAll("[data-klapp]")).every((el) => el instanceof HTMLDetailsElement ? !el.open : el.classList.contains("klapp-zu")));
    const anzahl = await page.locator("[data-klapp]").count();
    await page.locator("[data-mein-kalender-knopf]").click();
    await page.waitForFunction(() => !document.querySelector("[data-klapp='kalender']").classList.contains("klapp-zu"), null, { timeout: 3000 });
    const offenZu = await page.evaluate(() => document.querySelector("[data-klapp='offen']").classList.contains("klapp-zu"));
    const dannAuf = await page.locator("[data-klapp-alle]").getAttribute("data-klapp-alle"); // etwas zu → zeigt „auf“
    await page.locator("[data-klapp-alle]").click();
    const zuletzt = await page.locator("[data-klapp-alle]").getAttribute("data-klapp-alle");
    const alleAuf = await page.evaluate(() => Array.from(document.querySelectorAll("[data-klapp]")).every((el) => el instanceof HTMLDetailsElement ? el.open : !el.classList.contains("klapp-zu")));
    return zu1 && auf1 && alleZu && anzahl >= 5 && offenZu && alleAuf && anfang === "auf" && erstAuf && vorher === "zu" && dannAuf === "auf" && zuletzt === "zu" && imKopf === 1 ? true : (console.log("   ↳", zu1, auf1, alleZu, anzahl, offenZu, alleAuf, anfang, erstAuf, vorher, dannAuf, zuletzt, imKopf), false);
  });
  await step("Ton und Dauer: Läuten „30 Sekunden“ wird gemerkt", async () => {
    await kal.locator("[data-glocken-einstellung] summary").click();
    await kal.locator("[data-glocke-dauer]").selectOption("30s");
    await page.reload({ waitUntil: "networkidle" }); await ready(page);
    await page.locator("[data-mein-kalender-knopf]").click(); await kal.waitFor();
    await kal.locator("[data-glocken-einstellung] summary").click();
    return (await kal.locator("[data-glocke-dauer]").inputValue()) === "30s";
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
  await context.close();

  // Klaus 2026-11-06: in der Notiz die Uhrzeit eingeben und gleich die App-Glocke einschalten – ohne Google.
  const ctx3 = await browser.newContext(DESKTOP);
  const p3 = await ctx3.newPage(); const err3 = collectErrors(p3);
  await p3.clock.install({ time: new Date(2026, 10, 10, 14, 0) });
  await p3.addInitScript(speechStub("Erinnere mich heute um 14:30 Uhr den Zahnarzt anzurufen"));
  // Gestellter Android-Baustein: nur die Glocke (Klaus 2026-11-06: Benachrichtigung auch bei geschlossener App).
  await p3.addInitScript(() => { window.__glocke = { erlauben: 0, plaene: [] }; window.Capacitor = { isNativePlatform: () => false, Plugins: { FamilienakteGlocke: {
    erlauben: async () => { window.__glocke.erlauben++; return { erlaubt: true }; },
    planen: async ({ glocken }) => { window.__glocke.plaene.push(glocken); return { geplant: glocken.length, erlaubt: true }; } } } }; });
  await p3.goto(app.base, { waitUntil: "networkidle" }); await ready(p3); await internetAn(p3);
  await step("Notiz: Uhrzeit aus dem Text, „Auch in der App läuten“ schaltet die Glocke ein; sie läutet ohne verbundenen Kalender", async () => {
    await p3.locator("[data-notiz-knopf]").click();
    const f = p3.locator("[data-notiz-fenster]"); await f.waitFor();
    await p3.locator("[data-notiz-fenster] .dictation-button").click(); // 2.28.32: Mikrofon nur auf Tipp
    await p3.waitForFunction(() => (document.querySelector("[data-notiz-eingabe]") || {}).value?.includes("14:30"), null, { timeout: 5000 });
    await f.locator(".dictation-button.listening").click().catch(() => {});
    const schalter = f.locator("[data-memory-erinnern] [data-glocke]");
    const vorher = await schalter.getAttribute("data-glocke");
    await schalter.click();
    const nachher = await schalter.getAttribute("data-glocke");
    const zeit = await f.locator("[data-memory-erinnern-zeit]").inputValue();
    await f.locator("[data-notiz-speichern]").click(); await f.locator("[data-notiz-liste] li").first().waitFor();
    await f.locator("[data-notiz-fertig]").click(); await f.waitFor({ state: "detached" });
    await p3.clock.fastForward("16:00");
    const h = p3.locator("[data-app-glocke]"); await h.waitFor({ timeout: 5000 });
    const text = await h.innerText();
    const g = await p3.evaluate(() => window.__glocke);
    const plan = g.plaene.find((l) => l.some((x) => /Zahnarzt/i.test(x.titel)));
    const zeitpunkt = plan && plan.find((x) => /Zahnarzt/i.test(x.titel)).um;
    const androidOk = g.erlauben >= 1 && zeitpunkt === new Date(2026, 10, 10, 14, 15).getTime();
    return vorher === "aus" && nachher === "an" && zeit === "14:30" && /Zahnarzt/i.test(text) && androidOk ? true : (console.log("   ↳", vorher, nachher, zeit, text, JSON.stringify(g)), false);
  });
  check(err3.length === 0, "Notiz mit Glocke: keine Seitenfehler", err3.join(" | "));
  await ctx3.close();

  const handy = await browser.newContext(HANDY);
  const p2 = await handy.newPage();
  await p2.goto(app.base, { waitUntil: "networkidle" }); await ready(p2);
  await step("Handy: Kalender-Knopf im Kopf sichtbar, Monat passt in die Breite", async () => {
    await p2.locator("[data-mein-kalender-knopf]").click(); await p2.locator("[data-mein-kalender]").waitFor();
    const breit = await p2.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    return breit;
  });
  await handy.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Mein Kalender"));
