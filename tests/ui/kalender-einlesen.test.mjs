// Stufe D (Plan 08.11.2026): Termine aus dem Google-Kalender in die Akte holen (Google gestellt). Eigene Einträge werden
// übersprungen, fremde als Fristen angelegt; Merker (syncToken) wird benutzt; Änderung im Kalender → übernommen; Änderung hier
// und dort → Frage; im Kalender gelöscht → archiviert; eine Änderung hier geht nur mit Titel und Zeit zurück.
import { startApp, launchBrowser, DESKTOP, ready, step, summary, footer, collectErrors, internetAn, fail } from "./_harness.mjs";
import { vaultFixture } from "./_vault-fixture.mjs";
const soll = (ok, info) => { if (!ok) throw new Error(typeof info === "string" ? info : JSON.stringify(info)); return true; };

const anmeldung = `
  window.FamilienakteKalenderKonten = { googleWeb: "probe-web.apps.googleusercontent.com", microsoft: "" };
  window.open = (url) => {
    const u = new URL(url); const state = u.searchParams.get("state");
    setTimeout(() => { const k = new BroadcastChannel("familienakte-kalender-anmeldung"); k.postMessage({ state, accessToken: "probe-zugang", expiresIn: "3600", code: null, error: null }); k.close(); }, 50);
    return { close() {} };
  };
`;
const app = await startApp();
const browser = await launchBrowser();
const aufklappen = async (d) => { if (!(await d.evaluate((e) => e.open))) await d.locator("summary").first().click(); };
/** Wartet auf eine Meldung; zeigt ein Fehler in der Karte, wird der genannt statt eines stummen Timeouts. */
const warteMeldung = (page, re) => page.waitForFunction((q) => new RegExp(q).test([...document.querySelectorAll("[aria-live]")].map((e) => e.textContent).join(" ")), re.source, { timeout: 30000 })
  .catch(async () => { const f = await page.locator("[data-kalender-fehler]").allInnerTexts().catch(() => []); throw new Error(`Meldung ${re} fehlt; Karte: ${f.join(" | ").slice(0, 300) || "kein Fehler"}; Leiste: ${(await page.locator("[aria-live]").allInnerTexts()).join(" | ").slice(0, 300)}`); });
try {
  const context = await browser.newContext({ ...DESKTOP, timezoneId: "Europe/Berlin" });
  await context.addInitScript(anmeldung);
  // Gestellter Google-Kalender: Liste der Termine je Lauf (voll oder mit syncToken), geänderte Einträge (PUT) mit Inhalt.
  const google = { laeufe: [], antwort: { items: [], nextSyncToken: "tok1" }, puts: [], posts: [] };
  await context.route("https://www.googleapis.com/calendar/v3/**", async (route) => {
    const r = route.request(), url = new URL(r.url());
    if (r.headers().authorization !== "Bearer probe-zugang") return route.fulfill({ status: 401, body: "{}" });
    if (url.pathname.endsWith("/calendarList")) return route.fulfill({ json: { items: [{ id: "primary", summary: "Familie", primary: true }, { id: "arbeit@group", summary: "Arbeit" }] } });
    if (r.method() === "GET" && /\/events$/.test(url.pathname)) { google.laeufe.push({ kalender: decodeURIComponent(url.pathname.split("/")[4]), sync: url.searchParams.get("syncToken"), timeMin: url.searchParams.get("timeMin") }); return route.fulfill({ json: google.antwort }); }
    if (r.method() === "PUT") { google.puts.push({ id: url.pathname.split("/").pop(), body: r.postDataJSON() }); return route.fulfill({ json: { id: url.pathname.split("/").pop() } }); }
    if (r.method() === "POST") { google.posts.push(r.postDataJSON()); return route.fulfill({ json: { id: `ev${google.posts.length}` } }); }
    if (r.method() === "GET" && url.pathname.includes("/events/")) return route.fulfill({ json: { id: url.pathname.split("/").pop(), status: "confirmed" } });
    return route.fulfill({ status: 404, body: "{}" });
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await vaultFixture(page);
  await internetAn(page);
  await footer(page, "Fristen und Aufgaben");
  const karte = page.locator("[data-kalender-karte]");
  const register = () => page.evaluate(async () => { const f = window.__vaultFixture; return (await f.readLocalVaultData(await f.browserVault())).records.filter((r) => r.recordType === "deadline"); });

  await step("Google verbinden und Kalender „Familie“ übernehmen; Schritt 5 „Termine holen“ ist aus", async () => {
    await aufklappen(karte);
    await karte.locator("[data-kalender-anbieter-wahl]").selectOption("google");
    await karte.locator("[data-kalender-liste]").waitFor({ timeout: 10000 });
    await karte.locator("button", { hasText: "Diesen Kalender verwenden" }).click();
    await karte.locator("[data-kalender-status]").waitFor();
    const h = karte.locator("[data-kalender-holen]"); await h.waitFor();
    return soll((await h.getAttribute("data-kalender-holen")) === "aus" && !(await karte.locator("[data-kalender-jetzt-holen]").count()), "Holen sollte aus sein") && "aus";
  });
  await step("Holen einschalten: Kalenderliste mit Haken, „Familie“ vorgewählt", async () => {
    await karte.locator("[data-kalender-holen-schalter]").check();
    await karte.locator("[data-kalender-hol-liste]").waitFor({ timeout: 10000 });
    const fam = await karte.locator('[data-kalender-hol="primary"]').isChecked(), arbeit = await karte.locator('[data-kalender-hol="arbeit@group"]').isChecked();
    return soll(fam && !arbeit, { fam, arbeit }) && "Familie an, Arbeit aus";
  });
  await step("Jetzt holen: zwei fremde Termine werden Fristen (Zeit in Ortszeit, ganztägig ohne Uhrzeit), der eigene Eintrag nicht; Merker gespeichert", async () => {
    google.antwort = { items: [
      { id: "g-eigen", summary: "Antwort Krankenkasse", description: "Aus der Familienakte (FRI-000001).", start: { dateTime: "2026-11-20T08:00:00Z" }, end: { dateTime: "2026-11-20T08:30:00Z" }, extendedProperties: { private: { familienakte: "fa-x@familienakte" } } },
      { id: "g-eltern", summary: "Elternabend", start: { dateTime: "2026-11-25T17:00:00Z" }, end: { dateTime: "2026-11-25T18:30:00Z" }, updated: "2026-11-08T10:00:00Z" },
      { id: "g-urlaub", summary: "Urlaub", start: { date: "2026-12-24" }, end: { date: "2026-12-27" } },
    ], nextSyncToken: "tok1" };
    await karte.locator("[data-kalender-jetzt-holen]").click();
    await warteMeldung(page, /Termine geholt/);
    const regs = await register();
    const eltern = regs.find((r) => r.data.title === "Elternabend"), urlaub = regs.find((r) => r.data.title === "Urlaub");
    soll(eltern && urlaub && !regs.some((r) => r.data.title === "Antwort Krankenkasse"), regs.map((r) => r.data.title));
    soll(eltern.data.dueAt === "2026-11-25" && eltern.data.dueTime === "18:00" && eltern.data.kalenderQuelle?.eintragId === "g-eltern" && eltern.data.kalenderEintragen === true && /Kalender: Familie/.test(eltern.source), eltern);
    soll(urlaub.data.dueAt === "2026-12-24" && !urlaub.data.dueTime, urlaub.data);
    const lauf = google.laeufe.at(-1); soll(lauf.kalender === "primary" && !lauf.sync && lauf.timeMin, lauf);
    return `${regs.length} Fristen · Elternabend 25.11. 18:00 · Urlaub ganztägig`;
  });
  await step("Zweiter Lauf nutzt den Merker; Änderung im Kalender wird übernommen", async () => {
    google.antwort = { items: [{ id: "g-eltern", summary: "Elternabend Klasse 3", start: { dateTime: "2026-11-26T17:00:00Z" }, end: { dateTime: "2026-11-26T18:30:00Z" }, updated: "2026-11-08T11:00:00Z" }], nextSyncToken: "tok2" };
    await karte.locator("[data-kalender-jetzt-holen]").click();
    await warteMeldung(page, /1 geändert/);
    const eltern = (await register()).find((r) => r.data.kalenderQuelle?.eintragId === "g-eltern");
    const lauf = google.laeufe.at(-1);
    return soll(lauf.sync === "tok1" && eltern.data.title === "Elternabend Klasse 3" && eltern.data.dueAt === "2026-11-26", { lauf, eltern: eltern.data }) && "syncToken tok1 genutzt, Titel und Tag übernommen";
  });
  await step("Hier geändert und im Kalender geändert → Frage; „aus dem Kalender“ gewinnt nach Wahl", async () => {
    const eltern = (await register()).find((r) => r.data.kalenderQuelle?.eintragId === "g-eltern");
    await page.evaluate(async (id) => { const f = window.__vaultFixture; await f.updateLocalScheduleTermin(await f.browserVault(), id, { title: "Elternabend (Aula)" }); }, eltern.id);
    google.antwort = { items: [{ id: "g-eltern", summary: "Elternabend Klasse 3b", start: { dateTime: "2026-11-26T17:00:00Z" }, end: { dateTime: "2026-11-26T18:30:00Z" }, updated: "2026-11-09T11:00:00Z" }], nextSyncToken: "tok3" };
    await karte.locator("[data-kalender-jetzt-holen]").click();
    const frage = page.locator("[data-kalender-hol-konflikte]"); await frage.waitFor({ timeout: 30000 });
    const text = (await frage.innerText()).replace(/\s+/g, " ");
    soll(/Elternabend \(Aula\)/.test(text) && /Elternabend Klasse 3b/.test(text) && (await frage.locator("[data-kalender-hol-konflikt] input").nth(1).isChecked()), text.slice(0, 300));
    await frage.locator("[data-kalender-hol-los]").click(); await frage.waitFor({ state: "detached", timeout: 30000 });
    const nach = (await register()).find((r) => r.id === eltern.id);
    return soll(nach.data.title === "Elternabend Klasse 3b", nach.data) && "Frage gestellt, jüngere (Kalender) vorgewählt und übernommen";
  });
  await step("Hier geändert: geht nur mit Titel und Zeit an Google zurück (kein Überschreiben von Beschreibung/Erinnerungen)", async () => {
    const eltern = (await register()).find((r) => r.data.kalenderQuelle?.eintragId === "g-eltern");
    google.puts = [];
    await page.evaluate(async (id) => { const f = window.__vaultFixture; await f.updateLocalScheduleTermin(await f.browserVault(), id, { title: "Elternabend Klasse 3b – 19 Uhr", dueTime: "19:00" }); }, eltern.id);
    await page.waitForFunction(() => window.__vaultFixture && true, null, { timeout: 1000 }).catch(() => {});
    await karte.locator("[data-kalender-abgleichen]").click();
    await warteMeldung(page, /Kalender abgeglichen/);
    const put = google.puts.find((p) => p.id === "g-eltern");
    return soll(put && put.body.summary === "Elternabend Klasse 3b – 19 Uhr" && !("description" in put.body) && !("reminders" in put.body) && !("extendedProperties" in put.body), google.puts) && `PUT g-eltern: ${Object.keys(put.body).join(", ")}`;
  });
  await step("Im Kalender gelöscht → in der Akte archiviert, nicht gelöscht", async () => {
    google.antwort = { items: [{ id: "g-urlaub", status: "cancelled" }], nextSyncToken: "tok4" };
    await karte.locator("[data-kalender-jetzt-holen]").click();
    await warteMeldung(page, /1 archiviert/);
    const urlaub = (await register()).find((r) => r.data.kalenderQuelle?.eintragId === "g-urlaub");
    return soll(urlaub && urlaub.status === "archiviert", urlaub) && "archiviert";
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("Kalender: Termine holen"));
