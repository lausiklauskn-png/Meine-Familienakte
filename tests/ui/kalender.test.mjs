// Kalender (Klaus 2026-11-05): Verbinden, Eintragen mit Erinnerung, Gesundheit mit echtem Titel, Erledigt entfernt, Fehler sichtbar,
// Trennen, Kalenderdatei, Android-Gerätekalender. Google, Microsoft und das Android-Plugin sind gestellt (keine echte
// Anmeldung, kein echter Kalender); geprüft wird, was die App schickt und was sie im Register festhält.
import { startApp, launchBrowser, DESKTOP, ready, check, step, summary, footer, collectErrors, internetAn } from "./_harness.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";

const anmeldung = `
  window.FamilienakteKalenderKonten = { googleWeb: "probe-web.apps.googleusercontent.com", microsoft: "" }; // Fall „noch nicht eingerichtet“ bleibt geprüft
  window.__anmeldungen = [];
  window.open = (url) => {
    const u = new URL(url); window.__anmeldungen.push(u.origin + u.pathname + "|" + u.searchParams.get("scope") + "|" + u.searchParams.get("redirect_uri"));
    const state = u.searchParams.get("state");
    setTimeout(() => { const k = new BroadcastChannel("familienakte-kalender-anmeldung"); k.postMessage({ state, accessToken: "probe-zugang", expiresIn: "3600", code: null, error: null }); k.close(); }, 50);
    return { close() {} };
  };
`;
const geraetStub = `
  window.__geraet = { geschrieben: [], entfernt: [], erlaubt: false };
  window.Capacitor.Plugins.FamilienakteKalender = {
    zustand: async () => ({ erlaubt: window.__geraet.erlaubt }),
    erlauben: async () => { window.__geraet.erlaubt = true; return { erlaubt: true }; },
    kalender: async () => ({ kalender: [{ id: "4", name: "Samsung Kalender", konto: "Mein Gerät", haupt: false }, { id: "7", name: "familie@beispiel.de", konto: "familie@beispiel.de", haupt: true }] }),
    schreiben: async (a) => { window.__geraet.geschrieben.push(a); return { eintragId: a.eintragId || String(100 + window.__geraet.geschrieben.length) }; },
    entfernen: async (a) => { window.__geraet.entfernt.push(a.eintragId); return { entfernt: true }; },
  };
`;

const app = await startApp();
const browser = await launchBrowser();
const neueFrist = async (page, titel, datum = "2026-11-20") => {
  const form = page.locator(".schedule-create form");
  await form.locator('input[placeholder="Zum Beispiel: Antwort an Krankenkasse"]').fill(titel);
  await form.locator('input[type="date"]').first().fill(datum);
  await form.locator(".schedule-confirm input").check();
  await form.locator("button", { hasText: "Frist oder Aufgabe bestätigt anlegen" }).click();
};
const register = async (page) => { if (!(await page.evaluate(() => Boolean(window.__vaultFixture)))) await vaultFixture(page); return page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records; }); };

try {
  // ---------- Browser mit Google ----------
  const context = await browser.newContext({ ...DESKTOP, timezoneId: "Europe/Berlin", acceptDownloads: true });
  await context.addInitScript(anmeldung);
  const google = { neu: [], geaendert: [], geloescht: [], fehler: false, n: 0 };
  await context.route("https://www.googleapis.com/calendar/v3/**", async (route) => {
    const r = route.request(), url = new URL(r.url());
    if (r.headers().authorization !== "Bearer probe-zugang") return route.fulfill({ status: 401, body: "{}" });
    if (url.pathname.endsWith("/calendarList")) return route.fulfill({ json: { items: [{ id: "primary", summary: "Familie", primary: true }, { id: "arbeit@group", summary: "Arbeit" }] } });
    if (r.method() === "POST") { if (google.fehler) return route.fulfill({ status: 500, body: "{}" }); const body = r.postDataJSON(); google.neu.push({ kalender: url.pathname.split("/")[4], body }); return route.fulfill({ json: { id: `ev${++google.n}` } }); }
    if (r.method() === "PUT") { google.geaendert.push(url.pathname.split("/").pop()); return route.fulfill({ json: { id: url.pathname.split("/").pop() } }); }
    if (r.method() === "GET" && url.pathname.includes("/events/")) return route.fulfill(google.geloescht.includes(url.pathname.split("/").pop()) ? { status: 410, body: "{}" } : { json: { id: url.pathname.split("/").pop(), status: "confirmed" } });
    if (r.method() === "DELETE") { google.geloescht.push(url.pathname.split("/").pop()); return route.fulfill({ status: 204 }); }
    return route.fulfill({ status: 404, body: "{}" });
  });
  await context.route("https://oauth2.googleapis.com/revoke**", (route) => route.fulfill({ status: 200, body: "" }));
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await footer(page, "Fristen und Aufgaben");
  const karte = page.locator("[data-kalender-karte]");

  await step("Karte „Kalender verbinden“ mit vier Schritten; Microsoft ohne Client-ID: „Noch nicht eingerichtet.“", async () => {
    await karte.waitFor();
    const knoten = await karte.locator(".ablaufbild li").count();
    const ms = karte.locator('[data-anbieter="microsoft"]');
    return knoten === 4 && (await ms.isDisabled()) && /Noch nicht eingerichtet/.test(await ms.innerText());
  });
  await step("Ohne Kalender: „Kein Kalender verbunden“ mit ▽, ein Tipp springt zur Karte, der Haken bleibt", async () => {
    const f = page.locator("[data-kalender-formteil]");
    const text = await f.locator("small").first().innerText();
    const haken = await f.locator("[data-kalender-haken]").isChecked();
    await page.evaluate(() => window.scrollTo(0, 0));
    await f.locator("[data-kalender-sprung]").click();
    await page.waitForTimeout(900);
    const r = await page.locator("#kalender-verbinden").boundingBox();
    return /^Kein Kalender verbunden/.test(text) && !/unten unter/.test(text) && (await f.locator("[data-kalender-sprung]").innerText()) === "▽" && r && r.y < 1000 && r.y + 40 > 0 && (await f.locator("[data-kalender-haken]").isChecked()) === haken;
  });
  await step("Google bei Internet „aus“: gesperrt mit Grund", async () => /Internet für die App ist aus/.test(await karte.locator('[data-anbieter="google"]').innerText()) && (await karte.locator('[data-anbieter="google"]').isDisabled()));
  await step("Gerätekalender im Browser: gesperrt, „Nur in der Android-App“; Samsung-Hinweis steht da", async () => /Nur in der Android-App/.test(await karte.locator('[data-anbieter="geraet"]').innerText()) && /Samsung-Kalender gibt es nur in der Android-App/.test(await karte.innerText()));

  await internetAn(page);
  await footer(page, "Fristen und Aufgaben");
  await step("Google verbinden: Anmeldefenster mit Bereich calendar.events, Rücksprung in die App, Kalenderliste", async () => {
    await karte.locator('[data-anbieter="google"]').click();
    await karte.locator("[data-kalender-liste]").waitFor({ timeout: 5000 });
    const a = (await page.evaluate(() => window.__anmeldungen))[0] || "";
    const optionen = await karte.locator("[data-kalender-liste] option").allInnerTexts();
    return a.startsWith("https://accounts.google.com/o/oauth2/v2/auth|") && a.includes("auth/calendar.events") && a.endsWith(new URL(app.base).origin + "/") && optionen.join() === "Familie,Arbeit";
  });
  await step("Kalender übernehmen: Zustand sichtbar „Google Kalender · Familie“", async () => {
    await karte.locator("button", { hasText: "Diesen Kalender verwenden" }).click();
    await karte.locator("[data-kalender-status]").waitFor();
    return /Google Kalender · Familie/.test(await karte.locator("[data-kalender-status]").innerText()) && /Verbunden\./.test(await karte.locator("[data-kalender-stand]").innerText());
  });
  await step("Formular: Haken „In den Kalender eintragen“ vorbelegt, Chips 7 Tage + 1 Tag an, Uhrzeit frei", async () => {
    const f = page.locator("[data-kalender-formteil]");
    const an = await f.locator(".kalender-chip.an").allInnerTexts();
    return (await f.locator("[data-kalender-haken]").isChecked()) && an.join() === "1 Woche vorher,1 Tag vorher" && (await f.locator(".kalender-chip").allInnerTexts()).join() === "1 Woche vorher,2 Tage vorher,1 Tag vorher,am Tag, 9 Uhr" && (await page.locator("[data-frist-uhrzeit]").count()) === 1 && /Google Kalender · Familie/.test(await f.innerText());
  });
  await step("Frist speichern → Termin mit Erinnerungen 7 Tage/1 Tag, 9 Uhr Ortszeit, ohne Notizen", async () => {
    await page.locator(".schedule-create textarea").first().fill("Kundennummer 4711");
    await neueFrist(page, "Rechnung Stadtwerke bezahlen (erfunden)");
    await page.waitForFunction(() => true); for (let i = 0; i < 40 && !google.neu.length; i++) await page.waitForTimeout(150);
    const e = google.neu[0]?.body;
    if (!e) throw new Error("kein Termin geschrieben");
    return e.summary === "Rechnung Stadtwerke bezahlen (erfunden)" && e.start.dateTime === "2026-11-20T08:00:00.000Z" && JSON.stringify(e.reminders.overrides) === JSON.stringify([{ method: "popup", minutes: 10080 }, { method: "popup", minutes: 1440 }]) && !JSON.stringify(e).includes("4711") && google.neu[0].kalender === "primary";
  });
  await step("Register: Zuordnung (google, primary, ev1) und Haken stehen am Datensatz", async () => {
    for (let i = 0; i < 20; i++) { const r = (await register(page)).find((x) => x.data?.title === "Rechnung Stadtwerke bezahlen (erfunden)"); if (r?.data?.kalender?.[0]?.eintragId === "ev1") return r.data.kalenderEintragen === true && r.data.kalender[0].anbieter === "google" && r.data.kalender[0].kalenderId === "primary"; await page.waitForTimeout(150); }
    return false;
  });
  await step("Gesundheit (Klaus 2026-11-05): Arzttermin geht mit echtem Titel hinaus, Notizen nie", async () => {
    await page.locator(".schedule-create textarea").first().fill("Befund geheim 0815");
    await neueFrist(page, "Rezept Physiotherapie abholen (erfunden)", "2026-11-24");
    for (let i = 0; i < 40 && google.neu.length < 2; i++) await page.waitForTimeout(150);
    const e = google.neu[1]?.body;
    return Boolean(e) && e.summary === "Rezept Physiotherapie abholen (erfunden)" && !/Befund|0815/.test(JSON.stringify(e));
  });
  await step("Erledigt: Termin wird aus dem Kalender entfernt, Zuordnung gelöscht", async () => {
    await page.locator("button.schedule-filter", { hasText: "Offen" }).click();
    const eintrag = page.locator("article", { hasText: "Rechnung Stadtwerke bezahlen (erfunden)" }).first();
    await eintrag.locator("button", { hasText: "Als erledigt markieren" }).click();
    if (await page.locator(".page-dialog").waitFor({ timeout: 3000 }).then(() => true, () => false)) await page.locator(".page-dialog button", { hasText: "Ja, fortfahren" }).click();
    for (let i = 0; i < 40 && !google.geloescht.length; i++) await page.waitForTimeout(150);
    let r;
    for (let i = 0; i < 30; i++) { r = (await register(page)).find((x) => x.data?.title === "Rechnung Stadtwerke bezahlen (erfunden)"); if (!(r.data.kalender || []).length) break; await page.waitForTimeout(150); }
    if (!(google.geloescht[0] === "ev1" && !(r.data.kalender || []).length)) console.log("   ↳", await page.evaluate(() => Object.entries(localStorage).filter(([k]) => k.includes("kalender")).map(([, v]) => v).join(" ")));
    if (!(google.geloescht[0] === "ev1" && !(r.data.kalender || []).length)) throw new Error(`gelöscht ${JSON.stringify(google.geloescht)} · Status ${r.status} · ${JSON.stringify(r.data.kalender)} · Einst ${await page.evaluate(() => Object.entries(localStorage).filter(([k]) => k.includes("kalender")).map(([, v]) => v).join(" "))}`);
    return true;
  });
  await step("Fehler beim Anbieter: Grund sichtbar, Frist bleibt gespeichert", async () => {
    google.fehler = true;
    await neueFrist(page, "Kfz-Versicherung kündigen (erfunden)", "2026-11-28");
    await karte.locator("[data-kalender-fehler]").first().waitFor({ timeout: 8000 });
    google.fehler = false;
    const text = await karte.locator("[data-kalender-fehler]").first().innerText();
    return /abgelehnt \(500\)/.test(text) && (await register(page)).some((x) => x.data?.title === "Kfz-Versicherung kündigen (erfunden)");
  });
  await step("Jetzt abgleichen holt den fehlgeschlagenen Termin nach", async () => {
    const vorher = google.neu.length;
    await karte.locator("[data-kalender-abgleichen]").click();
    for (let i = 0; i < 40 && google.neu.length === vorher; i++) await page.waitForTimeout(150);
    return google.neu.length === vorher + 1 && google.neu.at(-1).body.summary === "Kfz-Versicherung kündigen (erfunden)";
  });
  await step("Vorhandene offene Fristen übernehmen: fragt nach, trägt danach ein", async () => {
    const knopf = karte.locator("[data-kalender-uebernehmen]");
    if (await knopf.isDisabled()) return "keine offenen ohne Wahl";
    const vorher = google.neu.length;
    await knopf.click();
    await page.locator(".page-dialog button", { hasText: "Ja, fortfahren" }).click();
    for (let i = 0; i < 60 && google.neu.length === vorher; i++) await page.waitForTimeout(150);
    return google.neu.length > vorher ? `${google.neu.length - vorher} eingetragen` : false;
  });
  await step("Trennen ohne Mitlöschen: Einträge bleiben, Anmeldung vergessen, Karte wieder offen", async () => {
    const vorher = google.geloescht.length;
    await karte.locator("[data-kalender-trennen]").click();
    await page.locator(".page-dialog button", { hasText: "Abbrechen" }).click();
    await page.waitForSelector('[data-kalender-karte][data-verbunden="nein"]');
    const gespeichert = await page.evaluate(() => Object.keys(localStorage).filter((k) => /kalender/i.test(k) && /zugang|token/i.test(localStorage.getItem(k) || "")).length);
    return google.geloescht.length === vorher && gespeichert === 0;
  });
  await step("Kein Zugang im Register oder im Speicher des Browsers", async () => {
    const reg = JSON.stringify(await register(page));
    const lokal = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
    return !reg.includes("probe-zugang") && !lokal.includes("probe-zugang");
  });
  await step("Kalenderdatei: .ics mit VEVENT und VALARM je Erinnerung", async () => {
    await karte.locator('[data-anbieter="ics"]').click();
    await page.waitForSelector('[data-kalender-karte][data-verbunden="ics"]');
    const [download] = await Promise.all([page.waitForEvent("download"), karte.locator("[data-kalender-abgleichen]").click()]);
    const pfad = await download.path(); const { readFileSync } = await import("node:fs");
    const ics = readFileSync(pfad, "utf8");
    return download.suggestedFilename().endsWith(".ics") && ics.startsWith("BEGIN:VCALENDAR") && /BEGIN:VEVENT[\s\S]*BEGIN:VALARM[\s\S]*TRIGGER:-PT10080M/.test(ics) && /SUMMARY:Kfz-Versicherung kündigen \(erfunden\)/.test(ics) && /SUMMARY:Rezept Physiotherapie abholen \(erfunden\)/.test(ics) ? `${(ics.match(/BEGIN:VEVENT/g) || []).length} Termine` : false;
  });
  check(errors.filter((e) => !/Failed to load resource/.test(e)).length === 0, "Browser: keine Seitenfehler", errors.join(" | "));
  await context.close();

  // ---------- Android-App mit Gerätekalender ----------
  const ctxA = await browser.newContext({ ...DESKTOP, timezoneId: "Europe/Berlin" });
  await ctxA.addInitScript(capacitorStub); await ctxA.addInitScript(geraetStub);
  const pa = await ctxA.newPage(); const errA = collectErrors(pa);
  await pa.goto(app.base, { waitUntil: "networkidle" }); await ready(pa);
  await footer(pa, "Fristen und Aufgaben");
  const ka = pa.locator("[data-kalender-karte]");
  await step("Android: Google/Microsoft verweisen auf den Gerätekalender, kein Samsung-Hinweis", async () => /Kalender auf diesem Gerät/.test(await ka.locator('[data-anbieter="google"]').innerText()) && (await ka.locator('[data-anbieter="google"]').isDisabled()) && !/Samsung-Kalender gibt es nur/.test(await ka.innerText()));
  await step("Android: Gerätekalender fragt das Recht, listet Samsung- und Google-Kalender", async () => {
    await ka.locator('[data-anbieter="geraet"]').click();
    await ka.locator("[data-kalender-liste]").waitFor({ timeout: 5000 });
    const o = await ka.locator("[data-kalender-liste] option").allInnerTexts();
    return (await pa.evaluate(() => window.__geraet.erlaubt)) && o.some((x) => x.startsWith("Samsung Kalender")) && (await ka.locator("[data-kalender-liste]").inputValue()) === "7";
  });
  await step("Android: Frist mit Uhrzeit 14:30, „2 Tage“, frei gewählt „5 Tage vorher“ und „am Tag, 9 Uhr“ → Plugin bekommt Beginn, Zeitzone, Erinnerungen", async () => {
    await ka.locator("button", { hasText: "Diesen Kalender verwenden" }).click();
    await ka.locator("[data-kalender-status]").waitFor();
    await pa.locator("[data-frist-uhrzeit]").fill("14:30");
    await pa.locator('[data-kalender-formteil] [data-erinnerung="tag9"]').click();
    await pa.locator('[data-kalender-formteil] [data-erinnerung="2d"]').click();
    await pa.locator('[data-kalender-formteil] [data-erinnerung-tage]').selectOption("5");
    await neueFrist(pa, "Elternabend Schule (erfunden)", "2026-11-26");
    for (let i = 0; i < 40; i++) { if (await pa.evaluate(() => window.__geraet.geschrieben.length)) break; await pa.waitForTimeout(150); }
    const g = (await pa.evaluate(() => window.__geraet.geschrieben))[0];
    return Boolean(g) && g.kalenderId === "7" && g.titel === "Elternabend Schule (erfunden)" && g.beginn === Date.parse("2026-11-26T13:30:00Z") && g.zeitzone === "Europe/Berlin" && JSON.stringify(g.erinnerungen) === "[10080,7200,2880,1440,330]";
  });
  check(errA.filter((e) => !/Failed to load resource/.test(e)).length === 0, "Android: keine Seitenfehler", errA.join(" | "));
  await ctxA.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Kalender"));
