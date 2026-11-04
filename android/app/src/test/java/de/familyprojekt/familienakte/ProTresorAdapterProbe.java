package de.familyprojekt.familienakte;

import de.familyprojekt.tresor.*;
import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

/** Echte JVM-Dateien und echte Kanon-Kryptografie; ausschließlich erfundene Originale.
 * Ohne Testbibliothek lokal ausführbar, derselbe Lauf wird in der CI verlangt. */
public final class ProTresorAdapterProbe {
    static final class Schreibgesperrt implements Ablage {
        final Ablage basis;
        Schreibgesperrt(Ablage basis) { this.basis = basis; }
        public List<String> liste(String p) throws IOException { return basis.liste(p); }
        public boolean gibtEs(String p) throws IOException { return basis.gibtEs(p); }
        public boolean istOrdner(String p) throws IOException { return basis.istOrdner(p); }
        public void ordner(String p) throws IOException { basis.ordner(p); }
        public byte[] lesen(String p, int n) throws IOException { return basis.lesen(p, n); }
        public OutputStream neu(String p) throws IOException { throw new IOException("Probe: Speicher voll oder schreibgeschützt"); }
        public Kanal kanal(String p) throws IOException { return basis.kanal(p); }
        public long groesse(String p) throws IOException { return basis.groesse(p); }
        public void loeschen(String p) throws IOException { throw new IOException("Probe: schreibgeschützt"); }
    }
    interface Aktion { void run() throws Exception; }
    static void pruefe(boolean ok, String was) { if (!ok) throw new AssertionError(was); }
    static void fehler(String code, Aktion a) throws Exception {
        try { a.run(); } catch (IOException e) { pruefe(e.getMessage().contains(code), code + ": " + e); return; }
        throw new AssertionError(code + " wurde übergangen");
    }
    static Map<String, String> bestand(Path p) throws Exception {
        Map<String, String> out = new TreeMap<>();
        try (var files = Files.walk(p)) {
            for (Path f : files.filter(Files::isRegularFile).toList())
                out.put(p.relativize(f).toString(), HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(f))));
        }
        return out;
    }
    static Map<String, String> bestandOhne(Path p, String ordner) throws Exception {
        Map<String, String> out = bestand(p); out.keySet().removeIf(k -> k.startsWith(ordner + "/")); return out;
    }
    static ByteArrayInputStream quelle(byte[] b) { return new ByteArrayInputStream(b); }
    public static void main(String[] args) throws Exception {
        Path root = Files.createTempDirectory("fa-pro-probe-");
        // Zufälliger Wegwerfzugang; nie echte Kennwörter oder Nutzerdaten.
        String zugang = UUID.randomUUID().toString();
        try {
            Path alt = Files.createDirectory(root.resolve("original")), kopie = root.resolve("kopie");
            DateiAblage a = new DateiAblage(alt.toFile());
            byte[] original = "Erfundener Brief für die Familie Beispiel".getBytes(StandardCharsets.UTF_8);
            String id;
            try (TresorOrdner t = TresorOrdner.anlegen(a, Fach.WORKFLOW_PDF_APP, zugang)) {
                id = t.id();
                t.ablegen(Fach.WORKFLOW_PDF.slug, "", "Erfunden.txt", "text/plain", 1, quelle(original), "");
            }
            // Ordnerwahl vor der Passwortfrage: nur der Ordner mit tresorordner.json, Unterordner eigens benannt, nichts angelegt.
            ProTresorAdapter.tresorOrdnerPruefen(a, "SD/USB (1234-5678)/Privat Brain Pro Hauptablageordner", false);
            Path leer = Files.createDirectory(root.resolve("leer"));
            fehler("FA_TRESOR_NICHT_VORHANDEN", () -> ProTresorAdapter.tresorOrdnerPruefen(new DateiAblage(leer.toFile()), "SD/USB (1234-5678)/Alter Ablageordner", false));
            for (String unter : List.of("SD/USB (1234-5678)/Hauptablage/Tresorordner", "Gerät/Hauptablage/Familienakte", "Eingang-Familienakte", "Hauptablage/Workflow PDF Pro/"))
                fehler("FA_TRESOR_UNTERORDNER", () -> ProTresorAdapter.tresorOrdnerPruefen(new DateiAblage(leer.toFile()), unter, false));
            fehler("FA_TRESOR_UNTERORDNER", () -> ProTresorAdapter.tresorOrdnerPruefen(new DateiAblage(leer.toFile()), "Irgendwas", true));
            pruefe(bestand(leer).isEmpty() && !Files.exists(leer.resolve(TresorOrdner.KOPF)), "Falsche Ordnerwahl legt Dateien oder einen Tresor an");
            Map<String, String> unveraendert = bestand(alt);
            Umzug.kopieren(a, new DateiAblage(kopie.toFile()), null);
            DateiAblage k = new DateiAblage(kopie.toFile());
            Map<String, String> vorOeffnen = bestand(kopie);
            fehler("TRESOR", () -> ProTresorAdapter.oeffnen(k, id, UUID.randomUUID().toString()));
            fehler("FA_TRESOR_FREMDE_KENNUNG", () -> ProTresorAdapter.oeffnen(k, "fremd", zugang));
            pruefe(vorOeffnen.equals(bestand(kopie)), "Fehlversuch verändert vorhandene Dateien");
            Eintrag e;
            try (ProTresorAdapter p = ProTresorAdapter.oeffnen(k, id, zugang)) {
                pruefe(p.dokumente().isEmpty(), "Fremdes Fach als eigener Bestand");
                e = p.ablegen("dokument-1", "Original.txt", "text/plain", 2, quelle(original));
                pruefe(Arrays.equals(original, p.lesen(e.id)), "Originalbytes");
                Eintrag doppelt = p.ablegen("dokument-1", "Original.txt", "text/plain", 2, quelle(original));
                pruefe(e.id.equals(doppelt.id) && p.dokumente().size() == 1, "Wiederholung erzeugt Duplikat");
                Eintrag fassung = p.ablegen("dokument-1", "Original.txt", "text/plain", 2, quelle(new byte[] {7, 8}));
                pruefe(!fassung.id.equals(e.id) && Arrays.equals(original, p.lesen(e.id)), "Neue Fassung ersetzt Original");
                Map<String, String> vorGrenze = bestand(kopie);
                fehler("FA_DOKUMENT_ZU_GROSS", () -> p.ablegen("gross", "Gross.bin", "application/octet-stream", 3,
                    new ByteArrayInputStream(new byte[ProTresorAdapter.MAX_BYTES + 1])));
                fehler("FA_DOKUMENT_KENNUNG_UNGUELTIG", () -> p.ablegen("../fremd", "X", "text/plain", 3, quelle(original)));
                fehler("Abbruch", () -> p.ablegen("abbruch", "X", "text/plain", 3, new InputStream() {
                    public int read() throws IOException { throw new IOException("Abbruch"); }
                }));
                pruefe(vorGrenze.equals(bestand(kopie)), "Abgelehnte Eingaben verändern Bestand");
                pruefe(unveraendert.equals(bestand(alt)), "Migration verändert Quelle");
                for (var f : vorOeffnen.entrySet()) pruefe(f.getValue().equals(bestand(kopie).get(f.getKey())), "Fremdes Original verändert");
            }
            Map<String, String> vorSchreibfehler = bestand(kopie);
            try (ProTresorAdapter gesperrt = ProTresorAdapter.oeffnen(new Schreibgesperrt(k), id, zugang)) {
                fehler("Speicher voll", () -> gesperrt.ablegen("schreibfehler", "Neu.txt", "text/plain", 4, quelle(original)));
            }
            pruefe(vorSchreibfehler.equals(bestand(kopie)), "Schreibfehler verliert Bestand");
            try (ProTresorAdapter neu = ProTresorAdapter.oeffnen(k, id, zugang)) {
                pruefe(Arrays.equals(original, neu.lesen(e.id)), "Neustart verliert Original");
                // „Rückweg“: Original im gemeinsamen Format mit dem kanonischen Leser lesbar.
                try (TresorOrdner fremd = TresorOrdner.oeffnen(k, Fach.BOOKLEDGER_APP, zugang);
                     InputStream in = fremd.oeffnen(Fach.FAMILIENAKTE.slug, e)) {
                    pruefe(Arrays.equals(original, in.readAllBytes()), "Kanonischer Rückweg");
                }
                Path datei = kopie.resolve(Fach.FAMILIENAKTE.ordner).resolve(e.verweis);
                byte[] verschluesselt = Files.readAllBytes(datei); verschluesselt[verschluesselt.length - 1] ^= 1;
                Files.write(datei, verschluesselt);
                fehler("TRESOR", () -> neu.lesen(e.id));
                neu.close();
                fehler("FA_TRESOR_GESPERRT", () -> neu.dokumente());
            }
            try (ProTresorAdapter p = ProTresorAdapter.oeffnen(k, id, zugang)) {
                Path kopf = kopie.resolve(TresorOrdner.KOPF), weg = kopie.resolve("kopf-weg");
                Files.move(kopf, weg);
                fehler("", () -> p.dokumente());
                Files.move(weg, kopf);
                Path zweiter = root.resolve("zweiter");
                try (TresorOrdner t = TresorOrdner.anlegen(new DateiAblage(zweiter.toFile()), Fach.FAMILIENAKTE_APP, zugang)) {
                    Files.copy(zweiter.resolve(TresorOrdner.KOPF), kopf, StandardCopyOption.REPLACE_EXISTING);
                    fehler("FA_TRESOR_FREMDE_KENNUNG", () -> p.dokumente());
                }
                Files.copy(alt.resolve(TresorOrdner.KOPF), kopf, StandardCopyOption.REPLACE_EXISTING);
                Umzug.vermerken(k, id, "Erfundener neuer Ort", 1);
                fehler("FA_TRESOR_UMGEZOGEN", () -> p.dokumente());
            }
            // Ein-Schritt-Weg „Tresor einrichten – nur Speicher wählen“ (Klaus 2026-11-04).
            Path sd = Files.createDirectory(root.resolve("sd-leer"));
            DateiAblage sdA = new DateiAblage(sd.toFile());
            Hauptordner.Ergebnis hier = ProTresorAdapter.einrichtenPruefen(sdA, "SD/USB (1234-5678)");
            pruefe(Hauptordner.ANLEGEN_HIER.equals(hier.art), "Leerer Speicher: Tresor entsteht hier");
            fehler("TRESOR_PASSWORT_KURZ", () -> ProTresorAdapter.einrichten(sdA, hier, null, "kurz"));
            pruefe(bestand(sd).isEmpty() && Files.list(sd).count() == 0, "Zu kurzes Passwort legt etwas an");
            String idNeu;
            ProTresorAdapter.Einrichtung neuHier = ProTresorAdapter.einrichten(sdA, hier, null, zugang);
            try (ProTresorAdapter p = neuHier.adapter) {
                idNeu = p.kennung();
                pruefe(neuHier.angelegt && neuHier.pfad.isEmpty() && Files.exists(sd.resolve(TresorOrdner.KOPF)), "Neuer Tresor im leeren Speicher");
                pruefe(Files.exists(sd.resolve(Hauptordner.LIES_MICH)), "Lies-mich fehlt");
                Eintrag n = p.ablegen("neu-1", "Neu.txt", "text/plain", 5, quelle(original));
                pruefe(Arrays.equals(original, p.lesen(n.id)), "Neuer Tresor liest Original");
            }
            try (ProTresorAdapter p = ProTresorAdapter.oeffnen(sdA, idNeu, zugang)) { pruefe(p.dokumente().size() == 1, "Neuer Tresor nach Neustart"); }

            Path voll = Files.createDirectory(root.resolve("sd-voll"));
            Files.writeString(Files.createDirectory(voll.resolve("DCIM")).resolve("Bild.txt"), "erfunden");
            Files.writeString(voll.resolve("Urlaub.txt"), "erfunden");
            DateiAblage vollA = new DateiAblage(voll.toFile());
            Hauptordner.Ergebnis darin = ProTresorAdapter.einrichtenPruefen(vollA, "Gerät");
            pruefe(Hauptordner.ANLEGEN_DARIN.equals(darin.art), "Speicher mit Inhalt: neuer Hauptordner darin");
            Map<String, String> vorName = bestand(voll);
            fehler("TRESOR_NAME_UNGUELTIG", () -> ProTresorAdapter.einrichten(vollA, darin, "Tresorordner", zugang));
            fehler("TRESOR_NAME_UNGUELTIG", () -> ProTresorAdapter.einrichten(vollA, darin, "a/b", zugang));
            fehler("TRESOR_NAME_BELEGT", () -> ProTresorAdapter.einrichten(vollA, darin, "DCIM", zugang));
            fehler("TRESOR_PASSWORT_KURZ", () -> ProTresorAdapter.einrichten(vollA, darin, "Family-Projekt", "kurz"));
            pruefe(vorName.equals(bestand(voll)) && !Files.exists(voll.resolve("Family-Projekt")), "Abgelehnter Name oder Passwort legt etwas an");
            ProTresorAdapter.Einrichtung neuDarin = ProTresorAdapter.einrichten(vollA, darin, "", zugang);
            neuDarin.adapter.close();
            pruefe("Family-Projekt".equals(neuDarin.pfad) && Files.exists(voll.resolve("Family-Projekt").resolve(TresorOrdner.KOPF))
                && Files.exists(voll.resolve("Family-Projekt").resolve(Hauptordner.LIES_MICH)) && vorName.equals(bestandOhne(voll, "Family-Projekt")), "Neuer Hauptordner „Family-Projekt“, Rest unberührt");
            pruefe(Hauptordner.GEFUNDEN.equals(ProTresorAdapter.einrichtenPruefen(vollA, "Gerät").art), "Zweiter Lauf findet den eben angelegten Tresor");

            // Vorhandener Tresor einer anderen Pro-App in einem Ordner mit altem Namen: gefunden am Inhalt, nicht am Namen.
            Path karte = Files.createDirectory(root.resolve("sd-alt"));
            Path altHaupt = Files.createDirectory(karte.resolve("Privat Brain Pro Hauptablageordner"));
            Files.writeString(karte.resolve("Notiz.txt"), "erfunden");
            String idAlt;
            try (TresorOrdner t = TresorOrdner.anlegen(new DateiAblage(altHaupt.toFile()), Fach.PRIVATE_BRAIN_APP, zugang)) { idAlt = t.id(); }
            Files.writeString(altHaupt.resolve(Hauptordner.LIES_MICH), "selbst bearbeitet");
            DateiAblage karteA = new DateiAblage(karte.toFile());
            Hauptordner.Ergebnis gef = ProTresorAdapter.einrichtenPruefen(karteA, "SD/USB (1234-5678)");
            pruefe(gef.gefunden() && "Privat Brain Pro Hauptablageordner".equals(gef.pfad), "Vorhandener Tresor am Inhalt gefunden");
            Map<String, String> vorFalsch = bestand(karte);
            fehler("TRESOR_PASSWORT_FALSCH", () -> ProTresorAdapter.einrichten(karteA, gef, null, UUID.randomUUID().toString()));
            pruefe(vorFalsch.equals(bestand(karte)), "Falsches Passwort verändert etwas");
            ProTresorAdapter.Einrichtung offenAlt = ProTresorAdapter.einrichten(karteA, gef, null, zugang);
            try (ProTresorAdapter p = offenAlt.adapter) {
                pruefe(!offenAlt.angelegt && idAlt.equals(p.kennung()) && "Privat Brain Pro Hauptablageordner".equals(offenAlt.pfad), "Vorhandenen Tresor geöffnet, keinen neuen");
                pruefe("selbst bearbeitet".equals(Files.readString(altHaupt.resolve(Hauptordner.LIES_MICH))), "Bearbeitete Lies-mich überschrieben");
                Eintrag n = p.ablegen("alt-1", "Brief.txt", "text/plain", 6, quelle(original));
                try (TresorOrdner fremd = TresorOrdner.oeffnen(new DateiAblage(altHaupt.toFile()), Fach.WORKFLOW_PDF_APP, zugang);
                     InputStream in = fremd.oeffnen(Fach.FAMILIENAKTE.slug, n)) {
                    pruefe(Arrays.equals(original, in.readAllBytes()), "Andere Pro-App liest das Original im gemeinsamen Tresor");
                }
            }
            pruefe(Files.list(karte).count() == 2, "Kein zweiter Tresor neben dem vorhandenen");

            // Falsche Wahl: ein Ordner im Tresor oder mehrere Tresore – abgewiesen, bevor etwas entsteht.
            Path fach = Files.createDirectories(altHaupt.resolve(Fach.FAMILIENAKTE.ordner));
            fehler("FA_TRESOR_UNTERORDNER", () -> ProTresorAdapter.einrichtenPruefen(new DateiAblage(fach.toFile()), "SD/Privat Brain Pro Hauptablageordner/" + Fach.FAMILIENAKTE.ordner));
            fehler("FA_TRESOR_UNTERORDNER", () -> ProTresorAdapter.einrichtenPruefen(new DateiAblage(altHaupt.resolve(TresorOrdner.VERWALTUNG).toFile()), "Irgendwie umbenannt"));
            Path leerEingang = Files.createDirectory(root.resolve("Eingang-Familienakte"));
            fehler("FA_TRESOR_UNTERORDNER", () -> ProTresorAdapter.einrichtenPruefen(new DateiAblage(leerEingang.toFile()), "Gerät/Eingang-Familienakte"));
            pruefe(Files.list(leerEingang).count() == 0, "Eingang-Wahl legt etwas an");
            Path zwei = Files.createDirectory(root.resolve("sd-zwei"));
            for (String n : List.of("Tresor A", "Tresor B"))
                try (TresorOrdner t = TresorOrdner.anlegen(new DateiAblage(Files.createDirectory(zwei.resolve(n)).toFile()), Fach.WORKFLOW_PDF_APP, zugang)) { }
            fehler("FA_TRESOR_MEHRERE", () -> ProTresorAdapter.einrichtenPruefen(new DateiAblage(zwei.toFile()), "SD"));
            System.out.println("Ein-Schritt-Tresor: leer, mit Inhalt, Name, Passwortlänge, vorhandener Tresor, falsches Passwort, Lies-mich, Unterordner, mehrere grün");

            pruefe(unveraendert.equals(bestand(alt)), "Quelle am Ende verändert");
            System.out.println("Pro-Tresor: Originale, Kopie, Wiederaufnahme, Duplikate, Grenze, Abbruch, Beschädigung, Sperre, Ort und Rückweg grün");
        } finally {
            try (var files = Files.walk(root)) { for (Path p : files.sorted(Comparator.reverseOrder()).toList()) Files.delete(p); }
        }
    }
}
