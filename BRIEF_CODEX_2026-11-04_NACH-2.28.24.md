# Brief an Codex: Stand nach Familienakte 2.28.24 (Claude Code, 04.11.2026)

Damit keine Fassung die andere überschreibt: Was Claude seit #81 gebaut hat, welche Dateien es betrifft und wie
du darauf aufbaust.

## Was Claude gemacht hat (alles auf `main`)

| PR | Inhalt | Fassung |
|---|---|---|
| Meine-Familienakte #84 | Erklärungen hinter Fragezeichen, „Wo liegt was?“ als Ordnerbaum, Geräteübergabe als 6 Schritte, Hinweisfenster am Fragezeichen (Portal), Handy-Kopfleiste, Demo-Schalter oben, Drucken (Android-Druckdienst), Aus-/Einloggen sperrt/entsperrt den Pro-Tresor | 2.28.23 (veröffentlicht) |
| Meine-Familienakte #85 | „Wo liegt was?“ mit Zahlen und grün/rot, Bedeutungssuche-Texte hinter ?, „Bestand prüfen“ wieder sichtbar (Schritte lagen seit #11 im Expertenbereich), Kurzhinweise mit Haken in der Hilfe (langer Druck am Tablet), frühere Empfänger als Vorschlag; enthält deinen #86 per Merge, ohne Konflikt | 2.28.24 (veröffentlicht) |
| Workflow-PDF-Pro #65 | `Hauptordner.java`, `UnterAblage.java` im Paket `de.familyprojekt.tresor` | Entwurf, in keiner App verdrahtet |

## Dateien, die Claude besitzt – bitte nicht ersetzen, nur ergänzen

`app/ablaufbild.tsx`, `app/pro-tresor-hilfe.tsx`, `app/anmelde-knopf.tsx`, `app/kurzhinweise.ts`,
`app/kurzhinweise-schalter.tsx`, `app/ui-controls.tsx` (`InfoPopover`), `app/pro-geraetetransport-panel.tsx`,
`app/private-meaning-panel.tsx`, Kopfleiste und Menü in `app/health-portal.tsx`, die zugehörigen Blöcke in
`app/globals.css`, `android/.../FamilienakteDruckPlugin.java`, Proben `tests/ui/kurzhinweise.test.mjs`,
`tests/ui/bestand-sichtbar.test.mjs`, `tests/ui/pro-tresor.test.mjs`.

## Regeln für die nächste Codex-Arbeit

1. Frisch von `origin/main` abzweigen (enthält 2.28.24). Vor dem PR `git diff --stat origin/main` lesen: keine
   Zeilen aus den Dateien oben löschen, die du nicht selbst geändert hast.
2. Wenn du an `health-portal.tsx` oder `globals.css` musst: kleine, abgegrenzte Änderungen, vorher im PR-Text nennen.
3. Nächste freie Fassung ist **2.28.25**. 2.28.23 und 2.28.24 sind veröffentlicht, nie erneut ausgeben.
4. Dein PDF-Updateweg (#86) bleibt deiner; Claude fasst `tools/pdf-*`, `.github/workflows/pdf-abgleich.yml` und
   `docs/PDF-*` nicht an.
5. Als Nächstes plant Claude (Startauftrag im Abschlussbrief): Demo-Knopf „DEMO ▾“ mit Menü, Demo-Kasten am großen
   Bildschirm weg; Hauptordner aus #65 verdrahten; Geräteliste für die Übergabe. Bitte dort nicht parallel bauen;
   wenn doch nötig, vorher im Brief abstimmen.
6. Forschung und Zeiten nur in Kimhub. Für #86 fehlt dort noch dein Eintrag.
