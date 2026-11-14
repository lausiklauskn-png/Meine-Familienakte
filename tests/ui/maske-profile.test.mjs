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

  // Helfer: Text ins Pseudo-Fenster, die Seite der letzten Zeile im Auge lesen.
  const textRein = async (text) => {
    if (!(await page.locator("[data-pseudo-text]").count())) await page.locator("[data-pseudo-text-auf]").click();
    const vorher = await page.locator("[data-pseudo-stueck]").count();
    await page.locator("[data-pseudo-text]").fill(text); await page.locator("[data-pseudo-los]").click();
    await page.waitForFunction((n) => document.querySelectorAll("[data-pseudo-stueck]").length > n, vorher);
  };
  const seiteVon = async (kennung) => {
    await page.locator(`[data-pseudo-stueck="${kennung}"] [data-pseudo-auge]`).click();
    const t = await page.locator("[data-pseudo-seite]").innerText();
    return t;
  };
  const zu = () => page.locator("[data-pseudo-ansicht] .pf-blatt-fuss .pf-kn").click();

  await step("Pseudo-Fenster nutzt die Profile: feste Platzhalter, Großschreibung, Nummer ohne Feldwort, kein Netzaufruf", async () => {
    await page.locator("[data-pseudo-knopf]").click();
    await page.locator("[data-pseudo-fenster]").waitFor();
    await textRein("Termin bei PRAXIS ASTER, Zeichen KD 2024 118833. Gruß P. Ginster, Stadtwerke Musterstadt. Treffpunkt am alten Steinbruch.");
    const t = await seiteVon("D01"); await zu();
    return soll(t.includes("⟦KONTAKT-1⟧") && t.includes("⟦KONTAKT-2⟧") && !/ASTER|Aster|118833|Ginster/.test(t) && t.includes("Stadtwerke Musterstadt") && t.includes("alten Steinbruch") && netz.length === 0, { t, netz });
  });
  await step("Korrigieren in der Seite: „alten Steinbruch“ markieren → Verdecken → neuer Kontakt ⟦KONTAKT-3⟧, ins Profil gemerkt", async () => {
    await page.locator('[data-pseudo-stueck="D01"] [data-pseudo-auge]').click();
    const seite = page.locator("[data-pseudo-seite]");
    await seite.evaluate((el) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const i = n.textContent.indexOf("alten Steinbruch"); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 16); const s = getSelection(); s.removeAllRanges(); s.addRange(r); const b = r.getBoundingClientRect(); el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: b.left + 5, clientY: b.top + 5 })); return; } }
    });
    await page.locator('[data-pseudo-blase="Verdecken"]').click();
    await page.waitForFunction(() => /alten Steinbruch/.test(window.__profil.geschrieben.at(-1) || ""));
    await page.waitForFunction(() => /⟦KONTAKT-3⟧/.test(document.querySelector("[data-pseudo-seite]")?.textContent || ""));
    const t = await seite.innerText(); await zu();
    return soll(t.includes("⟦KONTAKT-3⟧") && !t.includes("Steinbruch"), t);
  });
  await step("Stelle antippen → „Darf bleiben“: „Paul Ginster“ darf bleiben (ganzer Eintrag), „P. Ginster“ steht danach im Klartext", async () => {
    await page.locator('[data-pseudo-stueck="D01"] [data-pseudo-auge]').click();
    await page.locator('[data-pseudo-stelle="⟦KONTAKT-2⟧"]').first().click();
    await page.locator('[data-pseudo-blase="Darf bleiben"]').click();
    await page.waitForFunction(() => /Ginster/.test(document.querySelector("[data-pseudo-seite]")?.textContent || ""));
    const t = await page.locator("[data-pseudo-seite]").innerText(); await zu();
    const gespeichert = await page.evaluate(() => window.__profil.geschrieben.at(-1));
    return soll(/P\. Ginster/.test(t) && /"anzeige":"Paul Ginster"[^}]*"regel":"bleibt"/.test(gespeichert), t);
  });
  await step("Zurückführen setzt die Namen aus dem Profil ein", async () => {
    await page.locator('[data-pseudo-reiter="zurueck"]').click();
    await page.locator("[data-pseudo-antwort]").fill("Bitte ⟦KONTAKT-1⟧ und ⟦KONTAKT-3⟧ anrufen.");
    await page.locator("[data-pseudo-zurueckfuehren]").click();
    const klar = await page.locator("[data-pseudo-klar]").innerText();
    await page.locator('[data-pseudo-reiter="hin"]').click();
    return soll(klar === "Bitte Henrike Aster und alten Steinbruch anrufen.", klar);
  });
  await step("Regel auf der Profilseite: „Henrike Aster“ darf bleiben → bleibt im nächsten Text stehen", async () => {
    await page.locator('[data-maske-eintrag="Henrike Aster"] [data-maske-regel="bleibt"]').click();
    await page.waitForFunction(() => { try { return JSON.parse(window.__profil.geschrieben.at(-1)).eintraege.some((e) => e.anzeige === "Henrike Aster" && e.regel === "bleibt"); } catch { return false; } });
    await textRein("Gruß Henrike Aster");
    const t = await seiteVon("D02"); await zu();
    return soll(t.includes("Henrike Aster") && netz.length === 0, { t, netz });
  });
  check(errors.length === 0, "keine Seitenfehler", errors.join(" | "));
  await context.close();
} finally { await browser.close(); await app.stop(); }
process.exit(summary("Maske-Profile"));
