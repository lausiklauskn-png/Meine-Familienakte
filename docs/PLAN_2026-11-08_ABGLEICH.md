# Plan 08.11.2026: Abgleich, Festplatte, Kalender beidseitig, große Mengen, Suche

Grundlage: Prüfbericht vom 08.11.2026 (Sitzung „Was fehlt, damit die App arbeitet?“) und Klaus' Antworten im Chat.
Ersetzt Punkt 10 in `docs/PLAN_2026-11-07.md` und die offenen Fragen u–z in `docs/vorschau/daten-2.28.34.html`.

**Freibrief (Klaus 08.11.2026):** Der Plan wird ohne weitere Rückfrage umgesetzt, Sitzung für Sitzung. Auftauchende Fragen
entscheidet die Sitzung selbst, nach Logik und Benutzerfreundlichkeit. Vorschauen dienen der Nachvollziehbarkeit, der Bau wartet
nicht darauf. **Ausgabe (Klaus 08.11., später am Tag):** Die Sitzungen folgen selbstständig aufeinander; APK, Windows und PWA werden
erst **am Ende der letzten Stufe** ausgegeben. Die PWA geht ohne Mehraufwand mit jedem Zusammenführen auf `main` über Pages hinaus.
Jede Stufe landet als eigener PR auf `main`, damit bei einem Abbruch nichts verloren ist.

## Entscheidungen

| # | Frage | Entscheidung |
|---|---|---|
| 1 (u) | Reihenfolge | Zusammenführen → Festplatte → Eingangsordner → WLAN → Bedeutungssuche in der PWA → Paket per Teilen |
| 2 (v) | Konflikt | Nur eine Seite geändert: still übernehmen. Beide geändert: fragen „Welches behalten?“ |
| 3 (w) | Originale | Festplatte und WLAN: immer alle Originale, stückweise. Paket per Mail: Einträge und Notizen, Originale auf Wunsch |
| 4 | Verschlüsselung | Abgleich-Ordner auf der Festplatte verschlüsselt wie der Pro-Tresor. **Vollsicherung ebenfalls verschlüsselt** (4a) mit **Notfallblatt** zum Ausdrucken. Zusätzlich bleibt die **lesbare Vollsicherung wählbar**, an jedem Ort (der Speicher zu Hause ist nicht immer erreichbar), mit deutlichem Hinweis |
| 5 (x) | Passwort | mindestens 10 Zeichen (wie Private Brain Pro) |
| 6 (y) | Löschen | Löschen geht als „archiviert“ an die anderen Geräte, nie endgültig über den Abgleich. Dazu „Papierkorb leeren“: archivierte Dokumente endgültig löschen, nur von Hand, mit Rückfrage |
| 7 (z) | Erinnerung | „Lange nicht gesichert“ nach 7 Tagen |
| 8 | Festplatte | Einmal „Festplatte für die Familienakte vorbereiten“: feste Kennung auf der Platte; jedes Gerät erkennt sie daran, egal unter welchem Namen oder Laufwerksbuchstaben. Android: je Platte einmal Freigabe, danach dauerhaft gemerkt |
| 9 | Eingangsordner | PDFs nur hineinkopieren; die App holt Blöcke zu 20 Dateien, prüft vorher den freien Speicher, macht nach Abbruch weiter; Android im Hintergrund mit Dauer-Meldung, Windows solange die App offen ist |
| 10 | Gesundheit in der Bedeutungssuche | ja, Text nur für den Index auf dem Gerät, verlässt es nie |
| 11 | Scan-Original | Original-Foto immer behalten (wie BookLedgerPro „Scan + Original behalten“), bearbeitete Fassung als solche vermerkt (GoBD) |
| 12 | Wege | WLAN zwischen allen Geräten (Handy ⟷ PC, Handy ⟷ Tablet, ein Gerät ist Gastgeber); zusätzlich **LAN-Kabel und USB-Kabel** (USB-Tethering = Netz über Kabel, gleicher Weg wie WLAN). **Nicht:** Bluetooth, NFC, Quick Share, fremde Server |
| – | Kalender | **Beidseitiger Abgleich** mit Google, Microsoft und Android-Gerätekalender (Klaus: „das möchte ich umgesetzt haben“): Termine werden eingelesen, Kalender je Konto wählbar, gleiche Regeln wie beim Geräte-Abgleich |
| – | Bedeutungssuche | auch in der PWA; **Ladebalken** in Prozent beim Modell-Download und beim Index; erkannter Text gescannter Seiten wird mitgelesen |

## Wie der Abgleich arbeitet (Kern, für alle Wege gleich)

- **Feste Kennung je Eintrag.** Dokumente haben eine zufällige Kennung. Einträge (Personen, Fristen, Notizen …) tragen heute eine
  laufende Nummer (`PER-000001`); zwei Geräte können dieselbe Nummer für Verschiedenes vergeben. Beim Zusammenführen gilt ein
  Eintrag nur dann als derselbe, wenn Kennung **und** Anlagezeit übereinstimmen; sonst bekommt der hinzukommende die nächste
  freie Nummer und alle Verknüpfungen werden mitgeführt.
- **Stand beim letzten Abgleich.** Jedes Gerät merkt sich je Partner (Festplatte, Gerät) den Fingerabdruck jedes Eintrags beim
  letzten Abgleich. Daraus folgt: nur hier geändert → behalten; nur dort geändert → übernehmen; beide geändert → fragen.
  Ohne gemerkten Stand (erstes Mal, Sicherung einlesen) ist jeder Unterschied eine Frage, gleiche Einträge werden still erkannt.
- **Uhrzeit nur zur Anzeige** („geändert am Handy, 14:32“), nie als Entscheidung.
- **Nichts halb.** Erst alles holen und prüfen (SHA-256 je Datei), dann in einem Schritt schreiben; vorher sichert die App das
  bisherige Register. Abbruch → nichts geändert, beim nächsten Mal weiter.
- **Archiv statt Löschen** (Entscheidung 6). Archivierte Dokumente bleiben archiviert, auch wenn die andere Seite sie noch hat.

## Stufen (je Stufe eine Sitzung, ein PR, eine Fassung)

| Stufe | Inhalt | Fassung | Ausgabe |
|---|---|---|---|
| A | Zusammenführen-Kern (`lib/abgleich.ts`) mit Proben; „Sicherung einlesen“ auch in eine volle Akte: Liste „Was kommt dazu?“, Konflikte mit Wahl, Kennungs-Kollision | 2.28.40 | PWA |
| B | Verschlüsselte Vollsicherung (AES-GCM, PBKDF2, Passwort ≥ 10 Zeichen) mit Notfallblatt; lesbare Sicherung wählbar mit Hinweis; Erinnerung nach 7 Tagen; Papierkorb leeren | 2.28.41 | PWA, APK, Windows |
| C | Gemeinsame Festplatte: „Festplatte vorbereiten“ (Kennung `Familienakte-Laufwerk.json`), dauerhaft gemerkte Freigabe (Android `takePersistableUriPermission`, Windows Suche über alle Laufwerke nach der Kennung), Abgleich-Ordner verschlüsselt, Änderungsliste je Gerät, Abgleich beim Anstecken bzw. App-Start, Originale stückweise | 2.28.42 | PWA, APK, Windows |
| D | Kalender beidseitig: Einlesen aus Google (`syncToken`), Microsoft (`delta`), Android-Gerätekalender; Auswahl der Kalender je Konto; Konflikte wie im Kern | 2.28.43 | PWA, APK, Windows |
| E | Eingangsordner mit Blöcken zu 20, gespeicherte Warteschlange, Speicherprüfung (`navigator.storage.estimate/persist`), Analyse nacheinander statt alle zugleich; Android-Hintergrunddienst mit Meldung | 2.28.44 | PWA, APK, Windows |
| F | WLAN/LAN/USB-Kabel: Koppeln per Code mit 9 Ziffern (statt QR – keine QR-Bibliothek im Repo, der Code ist auf jedem Gerät tippbar), kleiner Dienst in der Windows-App und in der Android-App (Gastgeber), Suche im Netz per UDP-Signal, Übertragung im Festplatten-Format (verschlüsselt, stückweise) über HTTP mit Token, automatischer Abgleich im selben Netz. **Grenze:** die Web-App im Browser darf im Heimnetz keine anderen Geräte ansprechen (gemischte Inhalte) – dort nur Festplatte oder Sicherung | 2.28.45 | PWA, APK, Windows |
| G | Bedeutungssuche in der PWA (Modell im Browser-Speicher), Ladebalken in Prozent, OCR-Text und Gesundheitstext (nur Index, auf dem Gerät) | 2.28.46 | PWA, APK, Windows |
| H | Scan: Original-Foto im Stapel behalten, Vermerk „bearbeitet“; Teilen-Knopf an Dokumenten; Glocke nach Geräte-Neustart (Boot-Empfänger) | 2.28.47 | PWA, APK, Windows |
| I | Paket per Teilen (10b): nur Änderungen seit dem letzten Abgleich mit diesem Gerät, immer verschlüsselt | 2.28.48 | PWA, APK, Windows |

Fassungsnummern sind Richtwerte; vor jeder Ausgabe die tatsächlichen Releases prüfen und die nächste freie nehmen.

## Was jede Sitzung tut

1. CLAUDE.md, diesen Plan und den jüngsten Abschlussbrief lesen; Releases prüfen.
2. Die nächste offene Stufe bauen, Proben dazu, `npm run build`, Lint, UI-Proben der berührten Bereiche.
3. PR, CI grün, zusammenführen, ausgeben wie in der Tabelle, Nachweis `docs/VEROEFFENTLICHUNG-<fassung>.json`.
4. Abschlussbrief mit Stundennachweis und Startauftrag für die nächste Stufe; in dieser Tabelle die Stufe als erledigt markieren.

## Stand

- [x] A (2.28.40, #131) · [x] B (2.28.41) · [x] C (2.28.42) · [x] D (2.28.43) · [x] E (2.28.44) · [x] F (2.28.45) · [x] G (2.28.46) · [ ] H · [ ] I
