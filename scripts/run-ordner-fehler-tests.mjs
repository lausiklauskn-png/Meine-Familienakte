// Ordnerfehler aus der App-Hülle (Gerätetest 11.11.2026, Vollsicherung auf SD-Karte): der Grund aus Java („Größe … statt …“)
// steht in der Meldung; ohne Grund bleibt der bisherige Satz. Der Java-Teil (FamilienakteOrdnerPlugin.pruefenMitGeduld) misst
// Größe und Prüfsumme beim Zurücklesen selbst und wartet bei Abweichung kurz – nur am Gerät prüfbar.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const { ordnerFehlerText } = await import("../app/nativer-ordner.ts");
const mit = Object.assign(new Error("Größe 0 statt 1234 Bytes · Sicherung/Dateien/0001.fav"), { code: "FA_AUSGABE_PRUEFSUMME" });
const ohne = Object.assign(new Error("Ordnerzugriff fehlgeschlagen"), { code: "FA_STUECK_UNGUELTIG" });
assert.match(ordnerFehlerText(mit), /nicht unverändert an \(Größe 0 statt 1234 Bytes · Sicherung\/Dateien\/0001\.fav\)\./);
assert.equal(ordnerFehlerText(ohne), "Eine Datei kam beim Zurücklesen nicht unverändert an. Es wurde nichts als fertig gemeldet; bitte erneut versuchen.");
const java = readFileSync(new URL("../android/app/src/main/java/de/familyprojekt/familienakte/FamilienakteOrdnerPlugin.java", import.meta.url), "utf8");
assert.ok(java.includes("pruefenMitGeduld(s.ablage, s.pfad, s.groesse, sha)"), "dateiFertig prüft nicht mit eigener Längenmessung");
assert.ok(!/s\.ablage\.groesse\(s\.pfad\) != s\.groesse/.test(java), "dateiFertig verlässt sich noch auf die von Android gemeldete Größe");
assert.ok(java.includes('text.indexOf(" [")'), "Grund wird nicht an die App weitergegeben");
// 11.11. (2.28.58 am Tablet: „Größe -1 statt 0“): Capacitors getLong nimmt keine Integer – Zahlen nur über zahl().
assert.ok(!/call\.getLong\(/.test(java), "FamilienakteOrdnerPlugin liest Zahlen noch mit getLong (Integer → Ersatzwert)");
assert.ok(/static long zahl\(Object wert, long ersatz\)/.test(java), "zahl() fehlt");
console.log("🟢 Ordnerfehler: Grund in der Meldung, Prüfung misst selbst (6 Prüfungen)");
