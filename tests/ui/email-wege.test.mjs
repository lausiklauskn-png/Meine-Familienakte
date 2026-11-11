// 2.28.65: E-Mail-Wege. Kasten in der Eingangszentrale mit zwei Blöcken; Wahl bleibt gemerkt; „Eigenes Mail-Programm“ geplant;
// Private Brain Pro übergibt eine Mail (.eml) über das Tresor-Fach – die Familienakte holt sie von selbst ab (Pro-Tresor gestellt).
// Versand in der Korrespondenzzentrale: Gesundheitswort-Hinweis, „In der Mail-App öffnen“, Frage „abgeschickt?“. Adressen erfunden.
import { capacitorStub } from "./_capacitor-stub.mjs";
import { startApp, launchBrowser, DESKTOP, ready, step, soll, summary, collectErrors, fail, openMenu } from "./_harness.mjs";

const app = await startApp();
const browser = await launchBrowser();
try {
  const context = await browser.newContext({ ...DESKTOP, serviceWorkers: "block" });
  await context.addInitScript(capacitorStub);
  await context.addInitScript(() => {
    const eml = "From: praxis@beispiel.invalid\r\nTo: nutzer@beispiel.invalid\r\nSubject: Rechnung Oktober\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nErfundene Rechnung zur Probe.\r\n";
    const bytes = new TextEncoder().encode(eml);
    const S = window.__brain = { geholt: 0, quittiert: 0, offen: true, mailto: [] };
    const b64 = btoa(String.fromCharCode(...bytes));
    const vertrag = async () => ({ vertrag: "familienakte-uebergabe/1", id: "brain-mail-1", quelle: "private-brain", ziel: "familienakte", dokumentId: "mail-1", name: "Rechnung Oktober.eml", mime: "message/rfc822", groesse: bytes.length,
      sha256: [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((x) => x.toString(16).padStart(2, "0")).join("") });
    window.Capacitor.Plugins.FamilienakteTresor = {
      zustand: async () => S.offen ? { status: "offen", id: "tresor-a", uebergaben: true } : { status: "getrennt", uebergaben: true },
      uebergabeEingang: async () => ({ items: S.quittiert ? [] : [{ entryId: "r-1", vertrag: await vertrag() }] }),
      uebergabeLesen: async () => { S.geholt++; return { vertrag: await vertrag(), data: b64 }; },
      uebergabeQuittieren: async () => { S.quittiert++; return { stand: "im-eingang" }; },
      uebergabeStand: async () => ({ bestaetigt: false }),
    };
    const klick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (String(this.href).startsWith("mailto:")) { S.mailto.push(this.href); return; } return klick.call(this); };
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = collectErrors(page);
  await page.goto(app.base, { waitUntil: "networkidle" }); await ready(page);
  const eingang = () => page.evaluate(() => new Promise((ok) => { const r = indexedDB.open("FamilienakteStapel1"); r.onsuccess = () => { const db = r.result; const t = db.transaction("eingang"); const a = t.objectStore("eingang").getAll(); t.oncomplete = () => { db.close(); ok(a.result.map((e) => ({ name: e.file?.name, quelle: e.proUebergabe?.quelle || null }))); }; }; r.onerror = () => ok([]); }));

  await step("Private Brain → Familienakte: die Mail aus dem Tresor-Fach kommt von selbst in die Eingangszentrale (einmal, quittiert)", async () => {
    await page.waitForFunction(() => window.__brain.quittiert >= 1, null, { timeout: 30000 });
    const e = await eingang();
    return soll(e.some((x) => x.name === "Rechnung Oktober.eml" && x.quelle === "private-brain") && e.filter((x) => x.name === "Rechnung Oktober.eml").length === 1, e) && "Rechnung Oktober.eml aus Private Brain";
  });
  await page.evaluate(() => { location.hash = "inbox"; });
  const karte = page.locator("[data-email-wege]");
  await step("Eingangszentrale: Kasten „E-Mail“ mit zwei Blöcken; sechs Wahlfelder; „Eigenes Mail-Programm“ geplant und nicht wählbar", async () => {
    await karte.waitFor();
    const r = { bloecke: await karte.locator(".entscheid-block").count(), felder: await karte.locator("[data-wahl]").count(), eigen: await karte.locator('[data-wahl="mail-rein-eigen"] input').isDisabled(), brain: await karte.locator('[data-wahl="mail-rein-brain"] input').isChecked() };
    return soll(r.bloecke === 2 && r.felder === 6 && r.eigen && r.brain, r);
  });
  await step("Wahl „Microsoft-Postfach“ und „Über Microsoft senden“ bleibt nach dem Neuladen", async () => {
    await karte.locator('[data-wahl="mail-rein-microsoft"] input').check(); await karte.locator('[data-wahl="mail-raus-microsoft"] input').check();
    await page.reload({ waitUntil: "networkidle" }); await ready(page); await page.evaluate(() => { location.hash = "inbox"; }); await karte.waitFor();
    const ok = await karte.locator('[data-wahl="mail-rein-microsoft"] input').isChecked() && await karte.locator('[data-wahl="mail-raus-microsoft"] input').isChecked() && await karte.locator("[data-mail-microsoft-holen]").count() === 1;
    await karte.locator('[data-wahl="mail-rein-brain"] input').check(); await karte.locator('[data-wahl="mail-raus-mailapp"] input').check();
    return soll(ok, "Wahl nicht gemerkt");
  });
  await step("Gegenprobe: Pro-Tresor zu → „Jetzt abholen“ sagt ehrlich, dass er erst offen sein muss", async () => {
    await page.evaluate(() => { window.__brain.offen = false; });
    await karte.locator("[data-mail-brain-jetzt]").click();
    await page.waitForFunction(() => /Pro-Tresor ist nicht offen/.test(document.body.innerText));
    await page.evaluate(() => { window.__brain.offen = true; });
    return true;
  });
  await step("Korrespondenz: Gesundheitswort im Betreff → nur Hinweis; „In der Mail-App öffnen“ erst nach dem Haken; danach „abgeschickt?“ → als versendet gespeichert", async () => {
    await openMenu(page, 0, "Assistenzzentrale");
    await page.locator("button.assistant-mode-action", { hasText: "Vorgang oder Termin vorbereiten" }).click();
    await page.locator("textarea").first().fill("Bitte um Kopie des Befunds.");
    await page.locator("button", { hasText: "Familienakte prüfen und Vorschlag vorbereiten" }).click(); await page.waitForTimeout(600);
    await page.locator("button", { hasText: "Schreiben vorbereiten" }).click();
    const entwurf = page.locator("#assistant-draft");
    await entwurf.locator("select").first().selectOption("E-Mail");
    await entwurf.locator('input[placeholder="Person oder Organisation"]').fill("praxis@beispiel.invalid");
    const betreff = entwurf.locator("label", { hasText: "Betreff" }).locator("input"); await betreff.fill("Befund vom Oktober");
    await entwurf.locator("[data-mail-gesundheit]").waitFor();
    const gesperrt = await entwurf.locator("[data-mail-senden]").isDisabled();
    await entwurf.locator("label.check-row input").check();
    await entwurf.locator("[data-mail-senden]").click();
    await entwurf.locator("[data-mail-frage]").waitFor();
    const mailto = await page.evaluate(() => window.__brain.mailto.at(-1) || "");
    await entwurf.locator("[data-mail-frage-ja]").click();
    await page.waitForFunction(() => /Versendet/.test(document.querySelector(".assistant-history")?.textContent || ""), null, { timeout: 10000 });
    return soll(gesperrt && /^mailto:praxis@beispiel\.invalid\?subject=Befund/.test(mailto), { gesperrt, mailto }) && mailto.slice(0, 60);
  });
  await step("Keine Seitenfehler", async () => { const e = errors.filter((x) => !/cdnjs|ERR_TUNNEL|Failed to load resource/.test(x)); return soll(!e.length, e.join(" | ")); });
} catch (error) { fail("Abbruch", String(error?.message || error)); }
finally { await browser.close(); await app.stop(); }
process.exit(summary("E-Mail-Wege"));
