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
Er liefert Prüfartefakte und übernimmt oder veröffentlicht nichts automatisch.
Ein weiteres Repo ist dafür derzeit nicht erforderlich. Einzelheiten:
`docs/PDF-FUNKTIONSABGLEICH.md`.

Nachweise: Funktionsprüfung samt Gegenprobe, Abgleichprüfung mit temporären
Git-Repositories, bestehende Kopier- und Ausfüllprüfungen, Herkunft, Typprüfung,
Lint ohne Fehler (bestehende Warnungen), vollständiger Build erfolgreich.
Browserprüfstand siehe Pull Request; keine echte Geräteabnahme und kein Release.
Favoritenkategorien und native Pro-Funktionen sind nicht neu eingebaut.

Nächster Auftrag: Den Workflow auf GitHub prüfen, neue PDF-Funktionen jeweils mit
Vertrag und Geräteprüfung anbinden. Gestaltung und Wortlaut unverändert erhalten.
