// Ein-Schritt-Weg „Tresor einrichten – nur Speicher wählen“ (Klaus 2026-11-04). Die native Seite ist gestellt
// (Speicherwahl, Fenster und Krypto prüft die JVM-Probe tools/native/test-pro-tresor.mjs). Hier: Knopf, Meldungen, Bestätigung.
import { startApp, launchBrowser, DESKTOP, ready, check, step, soll, summary, footer, collectErrors } from "./_harness.mjs";
import { capacitorStub } from "./_capacitor-stub.mjs";
const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext(DESKTOP);
  await context.addInitScript(capacitorStub + `
    window.__proStand = { status: 'getrennt' }; window.__proCalls = [];
    window.Capacitor.Plugins.FamilienakteTresor = {
      zustand: async () => ({ ...window.__proStand }),
      verbinden: async () => { window.__proCalls.push('verbinden'); throw new Error('nicht erwartet'); },
      einrichten: async () => { window.__proCalls.push('einrichten');
        if (window.__proFehlerCode) throw Object.assign(new Error('Der gewählte Pro-Tresor ist nicht verfügbar.'), { code: window.__proFehlerCode });
        return window.__proStand = { status: 'offen', id: 'erfundener-neuer-tresor', ort: 'SD/USB (1234-5678)/Family-Projekt', angelegt: true }; },
      entsperren: async () => ({ ...window.__proStand }), sperren: async () => { window.__proStand.status = 'gesperrt'; },
    };`);
  const page = await context.newPage(); const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page); await footer(page, "Sicherheitscenter");
  const panel = page.locator("[data-pro-tresor]"); await panel.waitFor();
  check(await page.evaluate(() => window.__proCalls.length === 0), "Einrichten: nichts startet von selbst");
  await step("Einrichten: ein Knopf „Tresor einrichten – nur Speicher wählen …“ statt „Vorhandenen Pro-Tresor verbinden“", async () => {
    const knopf = panel.getByRole("button", { name: "Tresor einrichten – nur Speicher wählen …", exact: true });
    return await knopf.isVisible() && await panel.locator("[data-pro-tresor-verbinden]").count() === 0
      && /Family-Projekt/.test(await panel.locator("[data-pro-tresor-einrichten-hinweis]").innerText());
  });
  for (const [code, erwartet] of [["FA_TRESOR_MEHRERE", /mehrere Tresore.*nichts verändert/], ["FA_TRESOR_UNTERORDNER", /wie ein Ordner im Tresor.*Ebene höher.*Family-Projekt/],
    ["TRESOR_NAME_BELEGT", /schon und hat Inhalt.*nichts angelegt/], ["FA_TRESOR_ABGEBROCHEN", /abgebrochen/]]) {
    await step(`Einrichten: ${code} wird verständlich gemeldet, nichts verbunden`, async () => {
      await page.evaluate((c) => { window.__proFehlerCode = c; }, code);
      await panel.getByRole("button", { name: "Tresor einrichten – nur Speicher wählen …", exact: true }).click();
      // Gerätetest 10.11.: ein Abbruch ist kein Fehler – er steht als ruhiger Hinweis (role=status, data-abgebrochen), nicht als Alarm.
      const alert = code === "FA_TRESOR_ABGEBROCHEN" ? panel.locator("[data-pro-tresor-meldung][data-abgebrochen]") : panel.getByRole("alert"); await alert.waitFor();
      if (code === "FA_TRESOR_ABGEBROCHEN" && await panel.getByRole("alert").count()) return false;
      const t = await alert.innerText(); await page.evaluate(() => { window.__proFehlerCode = null; });
      return erwartet.test(t) && !(await panel.locator("[data-pro-tresor-bestaetigung]").count()) ? t.slice(0, 90) : (console.log("   ↳", t), false);
    });
  }
  // Gerätetest 09.11.: die Meldung stand unter dem langen Ordnerbaum und blieb ungesehen; der Baum gehört hinter das „?“.
  await step("Gerätetest 09.11.: Fehlermeldung steht direkt unter dem Zustand, vor dem Knopf; kein Ordnerbaum in der Karte", async () => {
    await page.evaluate(() => { window.__proFehlerCode = "FA_TRESOR_UNTERORDNER"; });
    await panel.getByRole("button", { name: "Tresor einrichten – nur Speicher wählen …", exact: true }).click();
    const meldung = panel.locator("[data-pro-tresor-meldung]"); await meldung.waitFor();
    await page.evaluate(() => { window.__proFehlerCode = null; });
    const vorKnopf = await page.evaluate(() => { const m = document.querySelector("[data-pro-tresor-meldung]"), k = document.querySelector("[data-pro-tresor-einrichten]");
      return Boolean(m && k && (m.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING)); });
    soll(vorKnopf, "Meldung steht nicht vor dem Knopf");
    soll(await panel.locator("[data-pro-tresor-hilfe]").count() === 0, "Ordnerbaum steht noch in der Karte");
    return soll(await meldung.isVisible(), "Meldung nicht sichtbar");
  });
  await step("Gerätetest 09.11.: „Wo liegt was?“ öffnet sich hinter dem „?“ der Karte, Tipp auf den Hauptordner zeigt auf den Einrichten-Knopf", async () => {
    await panel.getByRole("button", { name: "Gemeinsamer Pro-Tresor erklären", exact: true }).click();
    const baum = page.locator("[data-hinweis-mehr] [data-pro-tresor-hilfe]"); await baum.waitFor();
    const t = await baum.innerText();
    soll(t.includes("tresorordner.json") && t.includes("Eingang-Familienakte"), t.slice(0, 120));
    await baum.locator(".ablauf-link", { hasText: "Tresor-Hauptordner" }).first().click();
    await page.waitForTimeout(400);
    return soll(await page.locator("[data-pro-tresor-einrichten].hilfe-ziel-rahmen").count() === 1, "Sprung erreicht den Einrichten-Knopf nicht");
  });
  await step("Einrichten: neuer Tresor – kurze Bestätigung, Ort in der Zustandszeile, Kennung und LIES-MICH hinter „Mehr“", async () => {
    await panel.getByRole("button", { name: "Tresor einrichten – nur Speicher wählen …", exact: true }).click();
    const t = await panel.locator("[data-pro-tresor-bestaetigung]").innerText();
    // Klaus 10.11.: „✓ Tresor eingerichtet“; Ort in der Zustandszeile, Kennung und LIES-MICH hinter „Mehr“.
    const zeile = await panel.locator("[data-pro-tresor-status]").innerText(), mehr = await panel.locator("[data-pro-tresor-mehr]").textContent();
    return t === "✓ Tresor eingerichtet" && zeile === "Entsperrt · SD/USB (1234-5678)/Family-Projekt" && /erfundener-neuer-tresor/.test(mehr || "") && (mehr || "").includes("LIES-MICH.txt") ? t : (console.log("   ↳", t, zeile), false);
  });
  await step("Einrichten: danach heißt der Knopf „Anderen Speicher wählen …“, Hinweis weg", async () =>
    await panel.getByRole("button", { name: "Anderen Speicher wählen …", exact: true }).isVisible() && await panel.locator("[data-pro-tresor-einrichten-hinweis]").count() === 0);
  // Klaus 10.11.: färbt sich die Hilfe nach dem Einrichten von selbst grün? Ohne Neuladen, ohne Handgriff.
  await step("Einrichten: die Landkarte in der Hilfe zeigt den Pro-Tresor danach von selbst grün (ohne Neuladen)", async () => {
    await footer(page, "Hilfe");
    const karte = page.locator("[data-app-landkarte]");
    if (await karte.getAttribute("data-app-landkarte") !== "offen") await karte.locator("[data-app-landkarte-knopf]").click();
    const kasten = page.locator('[data-landkarte="app"] [data-karte-id="protresor"]').first(); await kasten.waitFor();
    const live = await kasten.getAttribute("data-live");
    return soll(live === "gruen", { live });
  });
  check(errors.length === 0, "Einrichten: keine Seitenfehler", errors.join(" | "));
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Pro-Tresor einrichten"));
