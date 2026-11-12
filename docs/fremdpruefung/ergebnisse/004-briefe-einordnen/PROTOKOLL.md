# Auftrag 004 – unabhängige Einordnung von 150 Briefen

Modell: **Codex (GPT-6)**; eine genauere Modellvariante ist mir nicht bekannt.
Ergebnisstand (UTC): **2026-11-12T22:24:51Z**.
Quellzweig: `claude/familienakte-bildintegration-il59yw`.
Gelesener Quellcommit: `bf547be4a3633a0e217c080839fbf0f3712f81f5`, Claude-Puls **5**.
Zielzweig: `codex/fremdpruefung`; geprüfter vorheriger Zielcommit: `44e004123fa179d84640d93884c6d6594f66e6c3`.

## Lesegrenze

Als Repo-Inhalte habe ich ausschließlich `docs/fremdpruefung/` gelesen: die Verbindung, den Auftragsstand, Fähnchen, Auftrag und dessen Eingaben. Keine anderen Dateien dieses Repos, keine anderen Repos, keine externe Recherche. GitHub wurde ausschließlich für diesen Briefkasten und seine Veröffentlichung einschließlich der nötigen Git-Referenzen genutzt. Alle Personen und Schriftstücke stammen aus dem als erfunden bezeichneten Prüfmaterial.

## Vorgehen und Ergebnis

Alle 150 Schriftstücke wurden einzeln nach eigenem Urteil gelesen und eingeordnet, ohne Stichwort-Skript. Die maschinelle Kontrolle dient nur der Formprüfung. `DRITTER.json` enthält 91 als sicher und 59 als unsicher markierte Einträge. Unsicherheit betrifft mindestens eines der Felder; sie ist keine gemessene Fehlerquote. 49 Einträge enthalten ein Kalenderdatum als Frist bzw. wahrzunehmenden Termin.

Die fachliche Hauptsache hat Vorrang vor dem Absender oder einem irreführenden Dateinamen: Eine Zahlungserinnerung bleibt beispielsweise eine Mahnung, Werbung trotz Betreff „Vertrag“ ein Angebot. Es gibt keine pauschale Ablage alter Schriftstücke in „Archiv“.

Bei `person` wurden ausdrücklich genannte Betroffene gegenüber bloßen Adressaten bevorzugt, insbesondere Patienten und Kinder. Gemeinsame Unterlagen bekommen keine willkürlich ausgewählte Einzelperson. Bei Verträgen und persönlichen Forderungen dient der namentlich erkennbare Vertragspartner als Bezug. Rückschlüsse aus Kennzeichen oder anderen Schriftstücken wurden nur innerhalb desselben erfundenen Haushalts gezogen und bei verbleibendem Zweifel markiert.

Fristen wurden aus Handlungsaufforderungen und konkreten Terminen entnommen, auch wenn sie bereits vergangen sind. Automatische Lastschriften, Vertragsbeginn, Laufzeitende ohne Handlungspflicht, Werbefristen und bloß optionale Rechtsbehelfe wurden grundsätzlich nicht als unbedingte Handlungsfrist behandelt. Bei fehlendem Zugangstag wird kein scheinbar genaues Datum aus einer Monatsfrist erfunden. Mehrere Fristen oder nur bedingte Handlungen sind im jeweiligen Zweifel benannt. Das Ein-Datum-Schema kann wiederkehrende oder mehrere Pflichten nicht vollständig ausdrücken.

## Am schwersten abzugrenzende Bereiche

- **Versicherungen / Auto & Mobilität / Motorrad / Haus & Wohnung:** Police und Beitragsrechnung lassen sich sachlich sowohl nach Versicherung als auch versichertem Gegenstand ablegen. Versicherungsunterlagen wurden vorwiegend unter Versicherungen eingeordnet; die plausible Gegenstandsablage wurde bei Zweifeln genannt.
- **Steuern & Behörden / Rente, Arbeit & Sozialversicherung / Gesundheit & Pflege / Familie & persönliche Dokumente:** Behördlicher Absender und Lebensbereich sind verschiedene Ordnungsprinzipien. Medizinische Befunde und konkrete Pflegeleistungen wurden dem Gesundheitsbereich, Erwerbsersatz und Arbeitsunterlagen dem Arbeits- und Sozialbereich zugeordnet. Familienleistungen bleiben besonders mehrdeutig.
- **Familie & persönliche Dokumente / Reisen & Freizeit / Steuern & Behörden:** Ein eigenes Fach für Schule, Ausbildung oder Studium fehlt. Studiennachweise und Schulpost wurden überwiegend als persönliche Unterlagen eingeordnet; Klassenfahrt und Auslandsstudium erlauben auch eine Reiseablage.
- **Einkäufe, Rechnungen & Garantien / Technik, Geräte & Reparaturen / Garten & Grundstück:** Gerätekauf und Garantienachweis überschneiden sich. Der konkrete Nutzungszweck wurde berücksichtigt; bei Gartengeräten und Elektronikkäufen ist die alternative Ablage ausdrücklich genannt.
- **Haus & Wohnung / Energie & Versorgung:** Gebäudewartung und Schornsteinfeger betreffen die Wohnung, zugleich aber die Heizungsversorgung. Direkte Versorgerabrechnungen wurden unter Energie, vermieterseitige Betriebskosten unter Wohnung abgelegt.
- **Finanzen & Konten / Verträge & Abonnements / Korrespondenz:** Eine Inkassomahnung kann am zugrunde liegenden Vertrag oder bei Schulden liegen. Geschäftspost einer Tischlerei passt zudem nur eingeschränkt in eine Familienakte ohne eigenes Unternehmensfach.

Eine hohe Übereinstimmung bei eindeutigen Befunden oder Rechnungen würde diese strukturellen Mehrdeutigkeiten nicht aufheben. Für spätere Prüfungen wären zulässige Alternativablagen sowie getrennte Fristarten sinnvoll; die vorgegebenen Listen und das Schema wurden hier unverändert verwendet.

## Formprüfung

Bestanden: genau 150 eindeutige Dateinamen, identisch zu den Kopfzeilen; alle Bereiche und Schriftstückarten wörtlich aus den Listen; Personen entweder leer oder Mitglied des jeweiligen Haushalts; Absender wörtlich im jeweiligen Text nachgewiesen; Fristen leer oder gültige ISO-Daten; Sicherheitswerte echte JSON-Booleans. Sichere Einträge haben einen leeren Grund. Alle 59 unsicheren Einträge nennen ein Feld und eine Alternative; längster Grund: 14 Wörter, Grenze: 15.

Bestehende Ergebnisse werden bewahrt. Auftrag 002 aus demselben Claude-Puls wird anschließend separat bearbeitet.
