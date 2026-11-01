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
            pruefe(unveraendert.equals(bestand(alt)), "Quelle am Ende verändert");
            System.out.println("Pro-Tresor: Originale, Kopie, Wiederaufnahme, Duplikate, Grenze, Abbruch, Beschädigung, Sperre, Ort und Rückweg grün");
        } finally {
            try (var files = Files.walk(root)) { for (Path p : files.sorted(Comparator.reverseOrder()).toList()) Files.delete(p); }
        }
    }
}
