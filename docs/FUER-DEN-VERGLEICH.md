# Zum Vergleich: diese Fassung der Familienakte (Stand 2026-10-29)

Für den Abgleich mit der eigenen Fassung V40/M1. Die Oberfläche (Aufbau, Farben, Menü, Startseite, Hilfen) ist die von V40;
im Programm steht weiter „Version 2.28.1“. Die technische Paketfassung ist 2.28.3 (nur für Installation und Updates).

## Drei Fassungen, ein Stand

| Fassung | Wie öffnen | Diktat | Dateien hinein |
| --- | --- | --- | --- |
| **Browser (PWA)** | Webadresse öffnen, oben „Installieren“ | Browser-Erkennung, nur bei Internet an | Dateiauswahl, Kamera, Teilen |
| **Einzeldatei** | `Familienakte-Einzeldatei-2.28.3.html` per Doppelklick in Chrome oder Edge, auch von einer externen Platte, ohne Internet | wie Browser | Dateiauswahl, Ordnerwahl |
| **Android (APK)** | APK installieren (ab dieser Fassung fester Schlüssel: spätere Updates ohne Deinstallieren) | Android-Sprachfenster, auch ohne Internet | Dateiauswahl, Kamera, „Teilen → Familienakte“ |
| **Windows** | Setup ausführen (unsigniert: einmal „Weitere Informationen → Trotzdem ausführen“) | Windows-Spracherkennung auf dem PC | Dateiauswahl, „Öffnen mit“ |

Alle Beispieldaten sind erfunden. Updates bei APK und Windows: Tipp auf die Versionszeile oben links.

## Was gleich geblieben ist

- Register `00_Register/Familienakte_Register.json`, Fassung V5, und die Ordnerstruktur des Tresors.
- Systemprüfung mit den drei Fünferblöcken (Ja / Nein / Nicht geprüft); nichts wurde auf „bestanden“ gesetzt.
- Sperren: OneDrive, produktive Ordner und Assistenzfreigabe bleiben gesperrt.

## Was anders ist (bitte prüfen)

1. **Technik darunter:** statt Next.js/Cloudflare eine reine Browser-App (Vite); daraus entstehen auch APK und Windows.
2. **Menüwörter verallgemeinert:** „Krankenkasse & Leistungen“, „Arbeit & Arbeitgeber“, „Anträge & Bescheide“ statt der Namen
   aus V40 (weil die Fassung öffentlich erreichbar ist).
3. **Kopfzeile:** zusätzlich ein Internetschalter (Standard aus: nichts geht ins Netz) und im Browser „Installieren“.
4. **Breite:** der Inhalt nutzt die volle Bildschirmbreite statt einer mittigen Spalte.
5. **Datensicherheit:** Register mit Revision gegen gleichzeitiges Überschreiben, gemerkter Stammordner, Aufräumen bei Fehlern,
   Prüfsummen auch für große Dateien (eigene Arbeit; mit B1–B15 aus M1 noch nicht abgeglichen).
6. Die M1-Korrekturen (B1–B15, 276 Dateien) liegen hier **nicht** vor; diese Fassung baut auf V40 auf.

## Fragen

1. Passt die Breite, oder lieber wieder mittig?
2. Sollen die eigenen Menüwörter zurück (dann nur als private Fassung)?
3. Gibt es den M1-Stand zum Abgleich (Manifest, Patch, Prüfnachweis)?
4. Was fehlt, was stört, was ist zu viel verändert?

## Als Nächstes geplant (noch nicht gebaut)

Eine Platte für unterwegs: verschlüsselter Tresor (Format wie die Pro-Apps, eigenes Passwort, Ersatzschlüssel), dazu die
Einzeldatei, die APK und der Quellcode auf derselben Platte – zu öffnen mit der App, mit der Einzeldatei in jedem Chrome/Edge
und mit einem kleinen Öffner ohne App. Erst nach der Rückmeldung zu dieser Fassung.
