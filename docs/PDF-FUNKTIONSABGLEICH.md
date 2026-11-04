# PDF-Funktionen aktuell halten

Die Familienakte hat zwei Zugänge: den eingebetteten Workflow-PDF-Klon und den eigenen
React-Ausfülldialog. Beide verwenden denselben Workflow-PDF-Kern. Pro enthält diesen
Kern unter `upstream/workflow-pdf` und ergänzt native Gerätefunktionen. Ein weiterer
Klon oder ein neues Repo würde derzeit eine weitere Synchronisationsstelle schaffen.

Der tägliche GitHub-Workflow `PDF-Funktionen abgleichen` (auch manuell startbar)
vergleicht den echten Git-Baum von Workflow-PDF mit dem eingebetteten Kern von Pro.
Abweichende Quellen oder unterschiedliche Pins der beiden Familienakte-Kopien stoppen
den Lauf. Er bereitet mit den vorhandenen Kopierwerkzeugen beide Kopien gemeinsam vor
und prüft Herkunft, Ausfüllen, Typen und den Funktionsvertrag.

Das Artefakt `pdf-update-zur-pruefung` enthält Quellstände und einen Update-Patch
(einschließlich neuer Dateien). Es wird auch bei einer fehlgeschlagenen Prüfung
hochgeladen: Ein Artefakt ist deshalb keine Freigabe. Bei gleichem Quellstand bleibt
der Patch leer. Keine automatische Veröffentlichung und kein Zugriff auf Nutzerdokumente.
Der Workflow wird nach Übernahme auf den Standardzweig aktiv.

Vor Übernahme sind HTML, CSS, Texte und in JavaScript erzeugte Oberflächen zu prüfen.
Gestaltung, Inhalte, Brücke, Datenbanktrennung und bestehende Bedienwege der Familienakte
bleiben erhalten. Ein reiner Dateiabgleich kann diese fachliche Prüfung nicht ersetzen.
Neue APIs müssen zusätzlich im React-Dialog angebunden werden; der Funktionsvertrag
prüft jetzt insbesondere `schonBelegt`. Der Dialog filtert damit bedruckte Flächen und
Bilder anhand desselben Seitenbilds wie die Linienerkennung. Vorhandene Felder werden
nicht gelöscht, Kästchen und KI-Kandidaten behalten die Ausnahmen des Quellkerns.

Favoritenkategorien sind damit noch nicht nachgerüstet. Dafür zuerst den tatsächlichen
Implementierungsstand und die Datenablage im Quellprojekt bestimmen, dann die vorhandene
Familienakte-Bedienung erweitern. Native Pro-Adapter werden nicht pauschal kopiert.
