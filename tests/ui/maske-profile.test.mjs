// Stufe C (Plan Pseudonymisieren): Profile für die Maske im Pro-Tresor (gestellt). Profilseite im Sicherheitscenter: selbst
// anlegen, Schreibweise, Nummer nur als Fingerabdruck (gespeicherter Text ohne die Nummer), Regel umschalten, aus einer anderen
// Pro-App übernehmen. Pseudo-Fenster: Profil wirkt (fester Platzhalter, Großschreibung, Nummer ohne Feldwort), „Korrigieren“
// merkt ins Profil und rechnet neu, kein Netzaufruf. Alle Namen und Nummern erfunden.
import { capacitorStub } from "./_capacitor-stub.mjs";
import { startApp, launchBrowser, DESKTOP, ready, step, soll, check, summary, collectErrors } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext({ ...DESKTOP, serviceWorkers: "block" });
  await context.addInitScript(capacitorStub);
  await context.addInitScript(() => {
    // Profil einer anderen Pro-App im Tresor (Format wie lib/maske-profil.ts, erfundener Schlüssel und Fingerabdruck).
    const fremd = { format: "familyprojekt-maske-profil", version: 1, schreiber: "private-brain", geaendert: 1763100000000,
      schluessel: { "0a1b2c3d": "11".repeat(32) }, eigenerSchluessel: "0a1b2c3d", nieVerdecken: ["Stadtwerke Musterstadt"],
      eintraege: [{ id: "pb-1", art: "kontakt", anzeige: "Paul Ginster", schreibweisen: ["P. Ginster"], nummern: [], regel: "verdecken", nr: 1, quelle: "selbst", geaendert: 1 }] };
    const S = window.__profil = { geschrieben: [], fremd: JSON.stringify(fremd) };
    window.Capacitor.Plugins.FamilienakteTresor = {
      zustand: async () => ({ status: "offen", id: "tresor-a", uebergaben: true }),
      uebergabeEingang: async () => ({ items: [] }),
      profilLesen: async ({ vaultId }) => ({ items: [
        ...(S.geschrieben.length ? [{ schreiber: "familienakte", datum: 2, sha256: "a".repeat(64), text: S.geschrieben[S.geschrieben.length - 1] }] : []),
        { schreiber: "private-brain", datum: 1763100000000, sha256: "b".repeat(64), text: S.fremd },
      ].filter(() => vaultId === "tresor-a") }),
      profilSchreiben: async ({ vaultId, text }) => { S.geschrieben.push(text); return { vaultId, entryId: "e" + S.geschrieben.length, sha256: "c".repeat(64), size: text.length }; },
    };
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = collectErrors(page);
  const netz = [];
  page.on("request", (r) => { const u = r.url(); if (!u.startsWith(app.base) && !u.startsWith("data:") && !u.startsWith("blob:")) netz.push(u); });
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  await page.evaluate(() => { location.hash = "security"; });
  const karte = page.locator("[data-maske-profile]");
  const letzter = () => page.evaluate(() => { const g = window.__profil.geschrieben; return g[g.length - 1] || ""; });

  await step("Profilseite im Sicherheitscenter: Pro-Tresor, Schloss-Zeile, drei Wege", async () => {
    await karte.waitFor();
    const r = { ort: await karte.getAttribute("data-maske-profile"), text: await karte.innerText() };
    return soll(r.ort === "tresor" && /verlassen dieses Gerät nie/.test(r.text) && /Selbst anlegen/.test(r.text) && /Aus meiner Akte vorschlagen/.test(r.text) && /anderen Pro-App übernehmen \(1\)/.test(r.text), r);
  });
  await step("Selbst anlegen: Kontakt „Henrike Aster“ mit ⟦KONTAKT-1⟧, im Tresor gespeichert", async () => {
    await page.locator("[data-maske-anlegen]").click();
    await page.locator("[data-maske-neu-art]").selectOption("kontakt");
    await page.locator("[data-maske-neu-name]").fill("Henrike Aster");
    await page.locator("[data-maske-neu-los]").click();
    await page.locator('[data-maske-eintrag="Henrike Aster"]').waitFor();
    const t = await page.locator('[data-maske-eintrag="Henrike Aster"]').innerText();
    return soll(t.includes("⟦KONTAKT-1⟧") && (await letzter()).includes("Henrike Aster"), t);
  });
  await step("Schreibweise und Nummer: nur Fingerabdruck gespeichert, angezeigt „··· 8833“", async () => {
    await page.locator("[data-maske-schreibweise]").fill("Praxis Aster");
    await page.locator("[data-maske-schreibweise-los]").click();
    await page.locator("[data-maske-nummer-feld]").fill("KD-2024-118833");
    await page.locator("[data-maske-nummer-los]").click();
    await page.locator("[data-maske-nummer]").first().waitFor();
    const gespeichert = await letzter();
    const chip = await page.locator("[data-maske-nummer]").first().innerText();
    return soll(gespeichert.includes("Praxis Aster") && !/118833|2024118833/.test(gespeichert) && /···\s*8833/.test(chip) && (await page.locator("[data-maske-nummer-feld]").inputValue()) === "", { chip, ohneNummer: !/118833/.test(gespeichert) });
  });
  await step("Aus einer anderen Pro-App übernehmen: Vorschau, dann „Paul Ginster“ neu als ⟦KONTAKT-2⟧", async () => {
    await page.locator("[data-maske-uebernehmen]").click();
    const vorschau = await page.locator("[data-maske-uebernahme]").innerText();
    await page.locator("[data-maske-uebernehmen-los]").click();
    await page.locator('[data-maske-eintrag="Paul Ginster"]').waitFor();
    const t = await page.locator('[data-maske-eintrag="Paul Ginster"]').innerText();
    return soll(/Private Brain Pro/.test(vorschau) && /Neu: Paul Ginster/.test(vorschau) && t.includes("⟦KONTAKT-2⟧") && /Stadtwerke Musterstadt/.test(await karte.innerText()), { vorschau, t });
  });

  await step("Pseudo-Fenster nutzt die Profile: feste Platzhalter, Großschreibung, Nummer ohne Feldwort, kein Netzaufruf", async () => {
    await page.locator("[data-pseudo-knopf]").click();
    await page.locator("[data-pseudo-fenster]").waitFor();
    await page.locator("[data-pseudo-text]").fill("Termin bei PRAXIS ASTER, Zeichen KD 2024 118833. Gruß P. Ginster, Stadtwerke Musterstadt. Hallo Ilse Krumm.");
    await page.locator("[data-pseudo-los]").click();
    const t = await page.locator("[data-pseudo-ergebnis]").first().innerText();
    return soll(t.includes("⟦KONTAKT-1⟧") && t.includes("⟦KONTAKT-2⟧") && !/ASTER|Aster|118833|Ginster|Krumm/.test(t) && t.includes("Stadtwerke Musterstadt") && netz.length === 0, { t, netz });
  });
  await step("Korrigieren merkt ins Profil: „Ilse Krumm“ immer verdecken → neuer Kontakt ⟦KONTAKT-3⟧, Fassung neu gerechnet", async () => {
    await page.locator("[data-pseudo-korrektur] summary").click();
    await page.locator("[data-pseudo-korr-wort]").fill("Ilse Krumm");
    await page.locator("[data-pseudo-korr-verdecken]").click();
    await page.waitForFunction(() => /Ilse Krumm/.test(window.__profil.geschrieben.at(-1) || ""));
    await page.waitForFunction(() => /⟦KONTAKT-3⟧/.test(document.querySelector("[data-pseudo-ergebnis]")?.textContent || ""));
    const t = await page.locator("[data-pseudo-ergebnis]").first().innerText();
    const meldung = await page.locator("[data-pseudo-meldung]").innerText();
    return soll(t.includes("⟦KONTAKT-3⟧") && !t.includes("Krumm") && /ins Profil gemerkt/.test(meldung), { t, meldung });
  });
  await step("Zurückführen setzt die Namen aus dem Profil ein", async () => {
    await page.locator("[data-pseudo-antwort]").fill("Bitte ⟦KONTAKT-1⟧ und ⟦KONTAKT-3⟧ anrufen.");
    await page.locator("[data-pseudo-zurueckfuehren]").click();
    const klar = await page.locator("[data-pseudo-klar]").innerText();
    return soll(klar === "Bitte Henrike Aster und Ilse Krumm anrufen.", klar);
  });
  await step("Regel umschalten: „Paul Ginster“ darf bleiben → bleibt im nächsten Text stehen", async () => {
    await page.locator('[data-maske-eintrag="Paul Ginster"] [data-maske-regel="bleibt"]').click();
    await page.waitForFunction(() => /"anzeige":"Paul Ginster"[^}]*"regel":"bleibt"/.test(window.__profil.geschrieben.at(-1) || ""));
    await page.locator("[data-pseudo-text]").fill("Gruß Paul Ginster");
    await page.locator("[data-pseudo-los]").click();
    const t = await page.locator("[data-pseudo-ergebnis]").first().innerText();
    return soll(t.includes("Paul Ginster") && netz.length === 0, { t, netz });
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
  await context.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Maske-Profile"));
