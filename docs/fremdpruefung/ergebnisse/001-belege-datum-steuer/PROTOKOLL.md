# Auftrag 001: Prüfprotokoll

Modell: Codex (GPT-6)

Datum und Uhrzeit (UTC): 2026-11-12 21:01:08 UTC

Quellstand: `9847240d5d8c2592bc3930b9315947370cc01c10` auf `claude/familienakte-bildintegration-il59yw`; gelesener Claude-Puls: 2.

## Lesegrenze und Vorgehen

Regel 1 eingehalten: Als Repo-Inhalte habe ich ausschließlich `docs/fremdpruefung/` gelesen. Keine anderen Repo-Dateien, keine anderen Repos und keine externe Recherche. GitHub-Abruf, Git-Metadaten und Veröffentlichung erfolgten im erlaubten Umfang.

Alle 120 Belege wurden einzeln gelesen und nach eigenem Urteil erfasst. Die Zuordnung erfolgte nicht durch ein Stichwort-Skript. Programmgesteuert wurden nur Belegkopf/Dateiname übernommen, das Ergebnis serialisiert und die Form geprüft. Zusammenhänge innerhalb des bereitgestellten Stapels wurden berücksichtigt, etwa der Arbeitnehmerstatus einer reisenden Person.

## Auslegungen für nicht vollständig geregelte Fälle

- Maßgeblich ist das Datum des jeweiligen Dokuments, nicht das Datum im Dateinamen. Beim Bankabschluss zählt das Erstellungsdatum; wo nur ein Ausführungsdatum vorliegt, wurde die ersatzweise Wahl als unsicher gekennzeichnet.
- Ausgewiesene Zahlbeträge wurden nicht still korrigiert. Bei Schluss- und Jahresrechnungen wurde der nach bereits gezahlten Beträgen verbleibende Zahlbetrag erfasst. Rechnerisch widersprüchliche Tankbeträge stehen unverändert mit `sicher: false` im Ergebnis.
- Bei den beiden Lohnabrechnungen wurde wegen des verlangten Bruttobetrags das Gesamtbrutto gewählt. Die abweichenden Auszahlungsbeträge machen die Formulierung „zu zahlender Bruttobetrag“ hier mehrdeutig; beide Fälle sind unsicher. Bei den Händlerabrechnungen wurden die Gebühren als Aufwand erfasst, nicht die weitergereichten Kartenumsätze beziehungsweise Auszahlungen; auch diese Betragswahl ist als unsicher erläutert.
- `ust` beschreibt den Ausweis im Beleg. Reverse-Charge-Rechnungen ohne berechnete Umsatzsteuer und Versicherungsbeiträge erhalten 0; Versicherungsteuer ist keine Umsatzsteuer. Lohnabrechnungen, Privatvorgänge und die Reisekostenabrechnung ohne Rechnung erhalten null.
- Gemischte Steuersätze wurden anhand der Bruttobeträge gewichtet. Bei einem Bewirtungsbeleg führt eine Nettogewichtung zu einem anderen Satz; dieser Fall nennt den Zweifel ausdrücklich. Bei gemischtem steuerfreiem Porto und steuerpflichtigem Versand wurde der überwiegende steuerfreie Anteil gewählt und die nicht ausdrücklich geregelte Anwendung auf 0 Prozent als unsicher markiert.
- Jeder Beleg hat genau ein erlaubtes Konto. Wo mehrere Sachkonten beziehungsweise unterschiedliche Steuerkonten nötig wären, steht der überwiegende Kandidat mit `sicher: false`. Fehlende passende Spezialkonten wurden ebenso kenntlich gemacht; kein zusätzliches Konto wurde erfunden.
- Die Lieferantenretoure wurde mit dem positiv gedruckten Gutschriftsbetrag als Einnahme auf dem ursprünglichen Einkaufskonto erfasst. Da der Auftrag dafür keine ausdrückliche Vorzeichenregel enthält, sind Betrag/Richtung als unsicher gekennzeichnet. Provisionserlöse aus fremd ausgestellten Abrechnungen wurden nach der tatsächlichen Leistungs- und Zahlungsrichtung erfasst.

## Formale Prüfung

120 Einträge, jeder Originaldateiname genau einmal und in Originalreihenfolge; alle Datumswerte gültig, alle Konten aus KONTENLISTE.json. `ust` enthält nur 0, 7, 19 oder null. Jeder Betrag ist deutsch formatiert und steht wörtlich im zugehörigen Beleg. Jede Unsicherheitsbegründung benennt das betroffene Feld und hat höchstens 15 Wörter. 37 Einträge sind als unsicher gekennzeichnet; sichere Einträge haben einen leeren Grund.

Veröffentlichung ausschließlich unter `docs/fremdpruefung/ergebnisse/` auf dem bestehenden Zweig `codex/fremdpruefung`, ohne Merge. Das Codex-Fähnchen wird auf Puls 2 gesetzt und quittiert Claude-Puls 2.
