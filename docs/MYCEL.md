# Netz (Mycel) in der Familienakte (Sitzung B, Stück 2a, 2026-10-31)

Klaus' Wahl (2026-10-31): **eigene Seite „Netz“**, kein schwebender Knopf; **Siegel und Lampen nur auf dieser Seite** (eigenes Stück 2b).

## Bedienung

Menü **Dokumente → „Netz (Mycel)“**. Die Seite zeigt Zustand (Bausteine, Internet für die App, Verbindung), den **Gerätenamen**
und den Knopf **„Verbinden …“**. Der öffnet das Verbinden-Fenster des Kanons (Modul 23 UI); erst dort wird verbunden, angemeldet
oder gefragt. Seite verlassen schließt das Fenster. Ist das Internet für die App aus, sagt die Seite das und nichts geht hinaus.

## Was geht hinaus

Nur die Visitenkarte: Name „Familienakte“ (plus Gerätename als Anzeige, nicht unterschrieben) und ein Bedeutungs-Vektor aus der
**Liste der 18 Lebensbereiche** (öffentliches Vokabular). **Keine Unterlagen, keine Namen, keine Inhalte der Akte.** Antworten auf
Fragen anderer gibt die Familienakte in diesem Stück **nicht** (kein Korpus) — das kommt mit Stück 3 (eigenes Netz, Chefcode).

## Aufbau

| Teil | Ort |
| --- | --- |
| Kanon-Module **byte-1:1** aus Sage-Protokol (01, 02, 03, 04, 05, 05b, noble-secp256k1, 23, 23-UI) | `public/sbkim/` · Pins in `native/HERKUNFT.json` · Nachziehen `node tools/sbkim-nachziehen.mjs` (Klon `../Sage-Protokol`, `origin/main`) — **nie von Hand ändern** |
| Klebstoff (lädt die Module erst auf der Seite, Schublade `familienakte`, Gerätename im Fenster, Visitenkarte) | `public/native/familienakte-mycel.js` |
| Seite | `app/netz-seite.tsx`, Menüeintrag in `app/health-portal.tsx` |
| Schwebenden Kanon-Knopf ausblenden | `app/globals.css` (`#sbkim-rdv-btn`) |

Beim Start der App wird **kein** SBKIM-Baustein geladen. Die IndexedDB heißt `sbkim_familienakte` (getrennt vom Tresor `mmi-local-vault`).

## Proben

`tests/ui/netz-mycel.test.mjs` 14 (Start ohne SBKIM und ohne Verbindung · Seite lädt die Module · keine Verbindung, keine fremde
Adresse · kein schwebender Knopf · Hinweis bei Internet aus · Gerätename gemerkt und im Fenster · Fenster nur auf Tipp, schließt beim
Verlassen · Handy 390 px). Gegenprobe `node tests/gegenprobe-sitzung-b.mjs "Netz:"` 5/5 (dabei war der Verbindungs-Zähler zuerst
blind: der Internetschalter warf vor ihm — jetzt zählt er außen herum).

## Grenzen

Echte Verbindung zum Relais nicht gemessen (im Prüf-Behälter gesperrt) · kein Tablet, kein Windows-PC · das Fenster des Kanons ist
dessen Gestaltung (Farben der App nicht übernommen) · Modul 03 lädt das Bedeutungs-Modell beim ersten „Verbinden“ aus dem Netz
(nur bei Internet an).
