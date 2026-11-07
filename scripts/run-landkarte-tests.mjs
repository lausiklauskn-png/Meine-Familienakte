// Landkarte der App (Sitzung 4): Stand-Liste und Karten passen zusammen; Vollbild- und Dreh-Einstellungen stehen.
import { readFileSync } from "node:fs";
const k = await import("../lib/app-landkarte.ts");
const s = await import("../lib/app-stand.ts");
let fehler = 0;
const pruefe = (ok, text) => { console.log(`${ok ? "✓" : "✗"} ${text}`); if (!ok) fehler++; };

const ids = k.appKartenIds();
const email = readFileSync(new URL("../app/email-hilfe.tsx", import.meta.url), "utf8");
const emailIds = [...email.matchAll(/id: "([a-z0-9-]+)"/g)].map((m) => m[1]);
const alle = new Set([...ids, ...emailIds]);
pruefe(new Set(ids).size === ids.length, `Karte: jede Kennung nur einmal (${ids.length})`);
const ohne = Object.keys(s.APP_STAND).filter((id) => !alle.has(id));
pruefe(ohne.length === 0, `Stand-Liste: jeder Eintrag hat einen Kasten${ohne.length ? ` – fehlt: ${ohne.join(", ")}` : ""}`);
const kanten = k.APP_KANTEN.flatMap((e) => [e.von, e.nach]).filter((id) => !ids.includes(id));
pruefe(kanten.length === 0, `Äste: jedes Ende ist ein Kasten${kanten.length ? ` – fehlt: ${kanten.join(", ")}` : ""}`);
const ziele = [...k.APP_GRUPPEN.flatMap((g) => g.chips), ...k.APP_KNOTEN].map((p) => p.nach).filter(Boolean).filter((id) => !ids.includes(id));
pruefe(ziele.length === 0, "Wege-Knöpfe: jedes „nach“ ist ein Kasten");
pruefe(k.APP_SPALTEN.length === k.APP_BREITEN.length, "Spaltennamen und Breiten gleich viele");
pruefe(s.standVon("kalender", new Set()) === "aktivieren" && s.standVon("kalender", new Set(["fristen-kalender"])) === "fertig", "Kalender: rot, eingerichtet grün");
pruefe(s.standVon("eingang", new Set()) === "fertig" && s.standVon("pruefung", new Set()) === "geplant", "ohne Eintrag fertig, Prüfung geplant");
pruefe(k.MAIL_WEGE === k.APP_GRUPPEN.find((g) => g.id === "g-mail").chips && /MAIL_WEGE/.test(email), "E-Mail-Hilfe und Gesamtkarte teilen die Mail-Wege");

const manifest = readFileSync(new URL("../android/app/src/main/AndroidManifest.xml", import.meta.url), "utf8");
pruefe(/android:screenOrientation="fullUser"/.test(manifest), "Android dreht in alle Lagen und achtet die Drehsperre (fullUser)");
const main = readFileSync(new URL("../android/app/src/main/java/de/familyprojekt/familienakte/MainActivity.java", import.meta.url), "utf8");
pruefe(/hide\(WindowInsetsCompat\.Type\.systemBars\(\)\)/.test(main) && /BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE/.test(main) && /onWindowFocusChanged/.test(main), "Android: Vollbild, Leisten per Wischen, nach Fokus wieder");
const tauri = JSON.parse(readFileSync(new URL("../windows/src-tauri/tauri.conf.json", import.meta.url), "utf8"));
pruefe(tauri.app.windows[0].maximized === true, "Windows startet maximiert");
const cap = JSON.parse(readFileSync(new URL("../windows/src-tauri/capabilities/default.json", import.meta.url), "utf8"));
pruefe(cap.permissions.includes("core:window:allow-set-fullscreen") && cap.permissions.includes("core:window:allow-is-fullscreen"), "Windows darf F11-Vollbild schalten");
const web = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
pruefe(web.orientation === "any" && web.display === "standalone", "Web-App dreht frei, bleibt „standalone“ (installieren.js erkennt nur das)");

console.log(fehler ? `\n${fehler} Landkarten-Prüfung(en) rot` : "\nLandkarte und Vollbild: alles grün");
process.exit(fehler ? 1 : 0);
