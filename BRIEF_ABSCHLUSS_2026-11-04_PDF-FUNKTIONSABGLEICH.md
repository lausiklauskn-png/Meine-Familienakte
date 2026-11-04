# PDF-Funktionsabgleich

Auftrag:
```
Design und Inhalt des eingebauten Workflow PDF in Familienakte erhalten.
Zusätzliche Funktionen und Aktualisierungen verbessern und den Abgleich automatisieren.
```

Der PDF-Kern und der eingebettete Klon sind auf denselben Workflow-PDF-Commit
0ed15e5 festgelegt. Der React-Ausfülldialog rief die bereits vorhandene Funktion
`schonBelegt` nicht auf. Dieser Aufruf ist jetzt eingebunden. Keine Änderung an
CSS, HTML, sichtbaren Texten, vorhandenen Eingaben oder gespeicherten Dokumenten.

Ein täglicher/manueller GitHub-Workflow vergleicht zusätzlich den Quellbaum mit
Workflow-PDF-Pro und bereitet beide Familienakte-Kopien gemeinsam als Patch vor.
Er liefert Prüfartefakte und erstellt nach erfolgreichen Prüfungen einen Entwurfs-PR.
Zusammenführen und Veröffentlichen bleiben getrennt. Der lokale Befehl `npm run
update:pdf -- --anwenden` lädt die Quellen und übernimmt mit Designschutz beide Kopien.
Ein weiteres Repo ist dafür derzeit nicht erforderlich. Einzelheiten:
`docs/PDF-FUNKTIONSABGLEICH.md`.

Nachweise: Funktionsprüfung samt Gegenprobe, Abgleichprüfung mit temporären
Git-Repositories, bestehende Kopier- und Ausfüllprüfungen, Herkunft, Typprüfung,
Lint ohne Fehler (bestehende Warnungen), vollständiger Build erfolgreich.
Alle drei bestehenden Browserproben zum Ausfüllen mit installiertem Chromium grün
(Foto/Scanner, Gesundheitsunterlagen und kompletter Ausfüllweg einschließlich Handybreite).
Keine echte Geräteabnahme und kein Release.
Eigene Feldarten sind im vollständigen Klon bereits vorhanden. Sie wurden nicht
zusätzlich in den separaten React-Dialog kopiert. Native Pro-Adapter bleiben unverändert.

Zusätzlich eingerichtet: entsprechender Pro-Quellupdateweg im Pro-Repo.
Beide Onlinebefehle erkennen den aktuellen Gleichstand korrekt. Die Klon-Browserprobe
legt eine eigene ★ Feldart mit Inhalt an, verwendet sie erneut und prüft ihren Erhalt
nach Neuladen. Update-/PR-Gegenproben bestehen; GitHub-CLI dort ausdrücklich simuliert.
Lokale Quellklone unter work/ werden als Arbeitsmaterial vom App-Lint ausgenommen.
Nächster Auftrag: neue PDF-Funktionen jeweils mit
Vertrag und Geräteprüfung anbinden. Gestaltung und Wortlaut unverändert erhalten.
