# Auftrag 002: Gegenlauf – dieselbe Aufgabe mit deinen eigenen Agenten, und dein Entwurf für echtere Prüfungen

Klaus (12.11.2026): Ihn interessiert, was herauskommt, wenn du den ganzen Lauf mit deinen eigenen Agenten wiederholst, ob dein
Training besser oder schlechter ausfällt, und was du dir einfallen lässt, um die Prüfung näher an echte Unterlagen zu bringen.
Für dich gilt dieselbe Ehrlichkeitsregel wie für Claude: nichts anpassen, damit ein Ergebnis schöner aussieht; was nicht gemessen
ist, heißt „nicht gemessen“; Schwächen und eigene Fehler stehen im Bericht.

Der Auftrag ist groß. Teile ihn dir ein; Zwischenstände darfst du ablegen (Fähnchen jeweils +1). Wenn etwas unklar ist: RUECKFRAGE.md.

## Was Claude gemacht hat (nur das Muster – keine Zahlen, kein Code)

Aufgabe: Für einen Beleg eines kleinen deutschen Betriebs (Text wie nach Texterkennung) das Buchungskonto aus `KONTENLISTE.json`
vorschlagen – **ohne Sprachmodell**, mit etwas Kleinem, das auf einem Handy im Browser rechnet (Regeln und/oder ein kleines
gelerntes Modell, höchstens einige hundert KB, reines JavaScript). Lehrer waren Agenten, die erfundene Belege samt Konto schrieben;
daraus wurde gelernt; geprüft wurde an einem Stapel eines Gewerbes, das in den Lehrdaten nicht vorkam.

## Teil A – Gegenlauf (Kern des Auftrags)

1. **Eigene Lehrdaten:** Lass eigene Agenten erfundene Belege mit Konto schreiben. Gewerbe, Menge und Machart bestimmst du selbst.
   Nicht verwenden: Buchhandlung (das ist Stapel 4, siehe unten) – und nichts aus `BELEGE-STAPEL-4.txt` zum Lernen benutzen.
2. **Eigenes kleines System:** Baue daraus einen Kontovorschlag ohne Sprachmodell (Bauart frei). Beschreibe ihn so, dass man ihn
   nachbauen kann.
3. **Eigener Prüfstapel:** Lass einen Agenten, der dein System und deine Lehrdaten nicht kennt, 120 erfundene Belege eines Gewerbes
   schreiben, das in deinen Lehrdaten nicht vorkommt und keine Buchhandlung ist; Soll-Konto je Beleg dazu. Gern mit Unterlagen, die
   du für näher an echten hältst (siehe Teil B).
4. **Kreuztest – das ist der Punkt, auf den es ankommt:**
   - dein System an **deinem** Prüfstapel,
   - dein System an **Claudes** Stapel 4 (`BELEGE-STAPEL-4.txt`, 120 Belege der „Buchhandlung Lindenblatt“; du hast sie in
     Auftrag 003 eingeordnet – dein System darf daraus nichts gelernt haben). Liefere nur die Vorhersagen; Claude wertet sie gegen
     das Mehrheits-Soll aus.
   - Claude lässt umgekehrt sein System an deinem Prüfstapel laufen.
5. Wenn du magst, zusätzlich: derselbe Stapel direkt von deinem Sprachmodell eingeordnet (als Obergrenze), getrennt ausgewiesen.

**Ablegen unter `docs/fremdpruefung/ergebnisse/002-gegenlauf/`:**

- `PRUEFSTAPEL/` – deine 120 Belege als einzelne Textdateien und `ERWARTUNG.json`
  (`{"betrieb":"…","dateien":[{"datei":"…","konto":"…","richtung":"einnahme|ausgabe"}]}`).
- `VORHERSAGEN-EIGENER-STAPEL.json` und `VORHERSAGEN-STAPEL-4.json`
  (`{"system":"…","mitFirmenname":true|false,"dateien":[{"datei":"…","konto":"…"}]}`; wenn dein System den Firmennamen nutzen kann,
  je eine Datei mit und ohne).
- `BERICHT.md` – Vorgehen, Umfang der Lehrdaten, Bauart, deine eigenen Zahlen mit Fehlerspanne, was schiefging, was du anders
  machen würdest als im Muster oben, und ob du Regel 1 (nur den Briefkasten lesen) eingehalten hast.
- Lehrdaten und Systemcode nur, wenn sie klein sind (zusammen unter 5 MB); sonst beschreiben.

## Teil B – Dein Entwurf: Prüfung näher an echten Unterlagen

Die bisherigen Prüfstapel sind von KI-Agenten geschriebene Texte; drei Prüfer sind sich fast immer einig – das spricht dafür, dass
sie sauberer sind als echte Unterlagen. Entwirf, wie du die Prüfung näher an die Wirklichkeit bringen würdest, ohne echte
personenbezogene Unterlagen in ein Repo zu legen. Stichworte von Klaus: Unterlagen so echt aussehen lassen wie möglich; ein
ganzes Leben nachstellen (zwei Menschen mit eigenen Lebensläufen, Ehe mit Urkunde, Kinder, Umzug, Arbeit, Rente) mit durchgehend
stimmigen erfundenen Daten – „ein eigenes SimCity“. Außerdem soll die Gruppe der Apps (Familienakte, BookLedgerPro, Private Brain
Pro) über die **Suche** zusammenarbeiten: ein Dokument finden, ohne zu wissen, in welcher App oder Mail es liegt; auch das soll
geprüft werden (intern und über das Netz).

`ENTWURF-ECHTERE-PRUEFUNG.md`, höchstens drei Seiten: was du bauen würdest, in welcher Reihenfolge, woran man merkt, dass es der
Wirklichkeit näher ist, was es nicht leisten kann, und wie man dabei ehrlich bleibt.

## Danach

Fähnchen setzen (`ergebnisse/FAEHNCHEN-CODEX.json`: puls +1, post ["002-gegenlauf"], gelesenen Claude-Puls eintragen), pushen.
