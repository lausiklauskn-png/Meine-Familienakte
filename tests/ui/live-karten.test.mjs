// Klaus 09.11.2026 (Vorschau live-zustand-2.28.50, l1–l5 Ja): Landkarte und „Akten sichern“ zeigen den Zustand dieses Geräts –
// grün eingerichtet · rot fehlt · gelb gesperrt oder veraltet · grau freiwillig. Immer als Karte mit Wegen, auch am Handy und Tablet.
// Rot und gelb führen mit „Beheben ›“ an den Knopf. Demo an: rotes Band über den Karten.
import { startApp, launchBrowser, HANDY, ready, check, step, soll, summary, footer, collectErrors } from "./_harness.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
import { demoUmschalten } from "./_demo.mjs";
const TABLET = { viewport: { width: 800, height: 1280 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: "de-DE" };
const app = await startApp();
const browser = await launchBrowser();
const oeffnen = async (page) => {
  await footer(page, "Hilfe");
  const karte = page.locator("[data-app-landkarte]");
  if (await karte.getAttribute("data-app-landkarte") !== "offen") await karte.locator("[data-app-landkarte-knopf]").click();
  await page.locator('[data-landkarte="app"] [data-karte-id="protresor"]').waitFor();
  return karte;
};
try {
  for (const [name, geraet] of [["Handy", HANDY], ["Tablet", TABLET]]) {
    const context = await browser.newContext(geraet);
    await context.addInitScript(capacitorStub + `
      window.Capacitor.Plugins.FamilienakteTresor = { zustand: async () => ({ status: 'gesperrt', id: 'erfundener-tresor', ort: 'Gerät/Familienakte/Family-Projekt' }),
        verbinden: async () => ({}), einrichten: async () => ({}), entsperren: async () => ({ status: 'offen' }), sperren: async () => ({}) };`);
    const page = await context.newPage(); const errors = collectErrors(page);
    await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
    const karte = await oeffnen(page);
    await step(`${name}: Landkarte bleibt Karte mit Wegen, Legende nennt den Zustand dieses Geräts`, async () => {
      const r = await karte.evaluate((k) => ({ ansicht: k.querySelector("[data-landkarte]")?.getAttribute("data-ansicht"), aeste: k.querySelectorAll("path[data-ast]").length,
        legende: k.querySelector("[data-live-legende]")?.textContent || "" }));
      return soll(r.ansicht === "karte" && r.aeste >= 40 && /eingerichtet/.test(r.legende) && /fehlt/.test(r.legende) && /gesperrt/.test(r.legende) && /freiwillig/.test(r.legende), r);
    });
    await step(`${name}: Pro-Tresor gesperrt = gelb, Datentresor (gesperrt bzw. nur im App-Speicher) = gelb statt rot, Kalender = grau, Demo aus = grau`, async () => {
      const farbe = (id) => karte.locator(`[data-karte-id="${id}"]`).first().getAttribute("data-live");
      const r = { pro: await farbe("protresor"), daten: await farbe("datentresor"), kalender: await farbe("kalender"), demo: await farbe("aus-demo") };
      // 2.28.63 (rote Kästen Fall 1/2): eingerichtet, aber gesperrt bzw. nur in der App – nichts fehlt, darum gelb mit einem Weg.
      await karte.locator('[data-karte-id="datentresor"]').first().click();
      const marke = await karte.locator("[data-live-marke]").innerText();
      const los = await karte.locator("[data-live-los]").getAttribute("data-live-los");
      r.marke = marke; r.los = los;
      return soll(r.pro === "gelb" && r.daten === "gelb" && /gesperrt|Speicher der App/.test(marke) && /Entsperren|Tresor einrichten/.test(los || "") && r.kalender === "grau" && r.demo === "grau", r);
    });
    await step(`${name}: Weg zum gelben Pro-Tresor ist gestrichelt`, async () =>
      soll(await karte.locator('path[data-ast="akte>protresor"]').evaluate((p) => p.classList.contains("geplant")), "Ast nicht gestrichelt"));
    await step(`${name}: Tipp auf den gelben Kasten zeigt „Dieses Gerät: gesperrt …“ und „Entsperren ›“; der Knopf springt zur Pro-Tresor-Karte`, async () => {
      await karte.locator('[data-karte-id="protresor"]').first().click();
      const marke = await karte.locator("[data-live-marke]").innerText();
      soll(/gesperrt/.test(marke), marke);
      await karte.locator('[data-live-los="Entsperren"]').click();
      await page.locator("[data-pro-tresor]").waitFor();
      await page.waitForTimeout(400);
      return soll(await page.locator("[data-pro-tresor].hilfe-ziel-rahmen, [data-pro-tresor].zurueck-hier").count() === 1, "Pro-Tresor-Karte nicht markiert");
    });
    await step(`${name}: „Akten sichern“ färbt die Orte live (Pro-Tresor gelb, Sicherungsordner rot ohne Sicherung)`, async () => {
      await footer(page, "Hilfe");
      const ak = page.locator("[data-aktensicherung]");
      await ak.evaluate((d) => { d.open = true; });
      const pro = await ak.locator('[data-sicherung-ziel="pro-tresor"]').getAttribute("data-live");
      const sich = await ak.locator('button[data-live]', { hasText: "Sicherungsordner" }).getAttribute("data-live");
      return soll(pro === "gelb" && sich === "rot" && /freiwillig/.test(await ak.locator("[data-live-legende]").innerText()), { pro, sich });
    });
    await step(`${name}: Hilfe oben – Symbol „Akten sichern“ neben der Landkarte springt zum Plan und klappt ihn auf`, async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.locator("[data-akten-sichern-knopf]").click();
      const ok = await page.waitForFunction(() => { const d = document.querySelector("[data-aktensicherung]"); if (!d) return false; const r = d.getBoundingClientRect(); return d.open && r.top >= 0 && r.top < innerHeight; }, null, { timeout: 5000 }).then(() => true, () => false);
      return soll(ok, await page.locator("[data-aktensicherung]").evaluate((d) => ({ open: d.open, top: Math.round(d.getBoundingClientRect().top), h: innerHeight })));
    });
    await step(`${name}: „Neu“ › „Zustand deines Geräts auf einen Blick“ › „Landkarte öffnen“ öffnet die Hilfe mit aufgeklappter Karte`, async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.locator(".neu-knopf-schalter").click();
      await page.locator('[data-neu="live-karten-2026-11-09"]').getByRole("button", { name: "Landkarte öffnen", exact: true }).click();
      await page.locator('[data-app-landkarte="offen"]').waitFor({ timeout: 5000 });
      return soll(await page.locator('[data-app-landkarte="offen"] [data-karte-id="protresor"]').first().isVisible(), "Karte nicht offen");
    });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: kein seitliches Scrollen der Seite`);
    check(errors.length === 0, `${name}: keine Seitenfehler`, errors.join(" | "));
    await context.close();
  }
  // Demo: rotes Band über den Karten, Demo-Kasten rot, „Demo verlassen ›“ beendet sie.
  const context = await browser.newContext(HANDY);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await demoUmschalten(page, true);
  const karte = await oeffnen(page);
  await step("Demo an: rotes Band über der Landkarte, Kasten „Demo als Kopie“ rot", async () =>
    soll(await karte.locator("[data-demo-band]").isVisible() && await karte.locator('[data-karte-id="aus-demo"]').first().getAttribute("data-live") === "rot", "Band oder Farbe fehlt"));
  await step("Demo an: Tipp auf den roten Demo-Kasten zeigt „Demo verlassen ›“ (2.28.63, vorher ohne Knopf)", async () => {
    await karte.locator('[data-karte-id="aus-demo"]').first().click();
    return soll(await karte.locator('[data-live-los="Demo verlassen"]').count() === 1, "Knopf fehlt am Demo-Kasten");
  });
  await step("Demo an: „Demo verlassen ›“ am Kasten beendet die Demo", async () => {
    await Promise.all([page.waitForURL((u) => !u.searchParams.has("demo")), karte.locator('[data-live-los="Demo verlassen"]').click()]);
    return soll(!new URL(page.url()).searchParams.has("demo"), page.url());
  });
  await demoUmschalten(page, true);
  const karte2 = await oeffnen(page);
  await step("Demo an: „Demo verlassen ›“ im Band beendet die Demo", async () => {
    await Promise.all([page.waitForURL((u) => !u.searchParams.has("demo")), karte2.locator("[data-demo-band-verlassen]").click()]);
    return soll(!new URL(page.url()).searchParams.has("demo"), page.url());
  });
  check(errors.length === 0, "Demo: keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Live-Karten"));
