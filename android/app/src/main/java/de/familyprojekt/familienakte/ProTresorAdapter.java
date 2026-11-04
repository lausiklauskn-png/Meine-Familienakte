package de.familyprojekt.familienakte;

import de.familyprojekt.tresor.Ablage;
import de.familyprojekt.tresor.Eintrag;
import de.familyprojekt.tresor.Fach;
import de.familyprojekt.tresor.Hauptordner;
import de.familyprojekt.tresor.TresorOrdner;
import de.familyprojekt.tresor.Umzug;
import de.familyprojekt.tresor.Uebergaben;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;

/** Familienakte-Anschluss an den unveränderten Pro-Kanon. Keine Ordnerwahl, kein Ersatzspeicher,
 * keine Hintergrundmigration. Einen neuen Tresor legt nur der ausdrücklich gewählte Ein-Schritt-Weg
 * {@link #einrichten} an (Klaus 2026-11-04: Familienakte darf einen neuen Tresor anlegen). Ein Adapter gehört genau zu einem freigegebenen Ort und einer Kennung.
 * Aufruf auf dem nativen Arbeits-Thread; Schlüssel bleiben nativ und werden beim Sperren verworfen. */
public final class ProTresorAdapter implements Closeable {
    public static final int MAX_BYTES = 20 * 1024 * 1024;
    private static final String FACH = Fach.FAMILIENAKTE.slug;
    private final Ablage ablage;
    private final String kennung;
    private final TresorOrdner tresor;
    private boolean geschlossen;

    private ProTresorAdapter(Ablage ablage, TresorOrdner tresor) {
        this.ablage = ablage; this.tresor = tresor; this.kennung = tresor.id();
    }

    /** Öffnet ausschließlich einen vorhandenen Tresor. Auch ein leeres Ziel wird nie angelegt. */
    public static ProTresorAdapter oeffnen(Ablage ablage, String erwartet, CharSequence passwort) throws IOException {
        pruefeOrt(ablage, erwartet);
        return new ProTresorAdapter(ablage, TresorOrdner.oeffnen(ablage, Fach.FAMILIENAKTE_APP, passwort));
    }

    /** Gewählter Ordner VOR der Passwortfrage: nur der Ordner mit tresorordner.json ist ein Tresor.
     * Ein Unterordner (Verwaltung „Tresorordner“, ein Fach wie „Familienakte“ oder „Eingang-…“) wird
     * eigens benannt. Es wird nichts angelegt und nichts geschrieben. */
    public static void tresorOrdnerPruefen(Ablage ablage, String ordnerName, boolean elternIstTresor) throws IOException {
        if (TresorOrdner.vorhanden(ablage)) return;
        if (elternIstTresor || istTresorUnterordner(ordnerName)) throw new IOException("FA_TRESOR_UNTERORDNER");
        throw new IOException("FA_TRESOR_NICHT_VORHANDEN");
    }

    /** Ergebnis des Ein-Schritt-Wegs „Tresor einrichten – nur Speicher wählen“. */
    public static final class Einrichtung {
        public final ProTresorAdapter adapter;
        /** Hauptordner relativ zum gewählten Speicher ("" = der gewählte Ordner selbst). */
        public final String pfad;
        public final boolean angelegt;
        Einrichtung(ProTresorAdapter adapter, String pfad, boolean angelegt) { this.adapter = adapter; this.pfad = pfad; this.angelegt = angelegt; }
    }

    /** Vor jeder Passwortfrage, nur lesend: was liegt im gewählten Speicher? Ein Ordner IM Tresor (Fach, Eingang,
     * Verwaltung) und mehrere Tresore nebeneinander werden abgewiesen, bevor irgendetwas entsteht. */
    public static Hauptordner.Ergebnis einrichtenPruefen(Ablage gewaehlt, String ordnerName) throws IOException {
        Hauptordner.Ergebnis e = Hauptordner.suchen(gewaehlt, letzterTeil(ordnerName));
        if (e.gefunden()) return e;
        if (Hauptordner.UNTERORDNER.equals(e.art) || istTresorUnterordner(ordnerName)) throw new IOException("FA_TRESOR_UNTERORDNER");
        if (Hauptordner.MEHRERE.equals(e.art)) throw new IOException("FA_TRESOR_MEHRERE");
        if (!e.anlegen()) throw new IOException("FA_TRESOR_ORDNER_" + e.art);
        return e;
    }

    /**
     * Gefundener Tresor: nur mit dem Passwort öffnen (falsch → TRESOR_PASSWORT_FALSCH, nichts geschrieben).
     * Kein Tresor: Name und Passwortlänge zuerst prüfen, dann Hauptordner und Tresor anlegen (Fach „Familienakte“
     * entsteht beim ersten Ablegen). In beiden Fällen die Lies-mich-Datei, wenn sie fehlt.
     */
    public static Einrichtung einrichten(Ablage gewaehlt, Hauptordner.Ergebnis e, String neuerName, CharSequence passwort) throws IOException {
        if (e.gefunden()) {
            Ablage haupt = Hauptordner.ablage(gewaehlt, e, null);
            ProTresorAdapter p = oeffnen(haupt, TresorOrdner.kennung(haupt), passwort);
            liesMich(haupt);
            return new Einrichtung(p, e.pfad, false);
        }
        if (!e.anlegen()) throw new IOException("FA_TRESOR_ORDNER_" + e.art);
        if (passwort == null || Character.codePointCount(passwort, 0, passwort.length()) < TresorOrdner.MIN_PASSWORT)
            throw new IOException("TRESOR_PASSWORT_KURZ");
        String name = Hauptordner.ANLEGEN_DARIN.equals(e.art) ? Hauptordner.name(neuerName) : "";
        Ablage haupt = Hauptordner.ablage(gewaehlt, e, name);
        String id;
        try (TresorOrdner t = TresorOrdner.anlegen(haupt, Fach.FAMILIENAKTE_APP, passwort)) { id = t.id(); }
        ProTresorAdapter p = oeffnen(haupt, id, passwort);
        liesMich(haupt);
        return new Einrichtung(p, name, true);
    }

    private static void liesMich(Ablage haupt) {
        try { Hauptordner.liesMichAnlegen(haupt); } catch (IOException zusatz) { /* Lies-mich ist ein Zusatz, kein Grund zum Abbruch */ }
    }

    static String letzterTeil(String ordnerName) {
        if (ordnerName == null) return "";
        String n = ordnerName.replace('\\', '/');
        while (n.endsWith("/")) n = n.substring(0, n.length() - 1);
        return n.substring(n.lastIndexOf('/') + 1).trim();
    }

    /** Letzter Pfadteil eines Anzeigenamens wie „SD/USB (1234-5678)/Hauptablage/Familienakte“. */
    public static boolean istTresorUnterordner(String ordnerName) {
        if (ordnerName == null) return false;
        String n = ordnerName.replace('\\', '/');
        while (n.endsWith("/")) n = n.substring(0, n.length() - 1);
        n = n.substring(n.lastIndexOf('/') + 1).trim();
        if (n.isEmpty()) return false;
        if (n.equalsIgnoreCase(TresorOrdner.VERWALTUNG) || n.equalsIgnoreCase("verzeichnis") || n.equalsIgnoreCase("Uebergaben")) return true;
        for (Fach f : Fach.ALLE) if (n.equalsIgnoreCase(f.ordner)) return true;
        return n.regionMatches(true, 0, "Eingang-", 0, 8);
    }

    private static void pruefeOrt(Ablage ablage, String erwartet) throws IOException {
        if (erwartet == null || erwartet.isEmpty() || !erwartet.equals(TresorOrdner.kennung(ablage)))
            throw new IOException("FA_TRESOR_FREMDE_KENNUNG");
        if (ablage.gibtEs(Umzug.VERMERK)) throw new IOException("FA_TRESOR_UMGEZOGEN");
    }

    private void bereit() throws IOException {
        if (geschlossen) throw new IOException("FA_TRESOR_GESPERRT");
        // Auch nach dem Öffnen: entfernte Karte, ausgetauschter Kopf oder Umzugsvermerk nicht übergehen.
        pruefeOrt(ablage, kennung);
    }

    public String kennung() { return kennung; }

    public synchronized List<Eintrag> dokumente() throws IOException {
        bereit();
        return new ArrayList<>(tresor.verzeichnis(FACH));
    }

    private static String dokumentPfad(String dokumentId) throws IOException {
        if (dokumentId == null || !dokumentId.matches("[A-Za-z0-9_-]{1,80}"))
            throw new IOException("FA_DOKUMENT_KENNUNG_UNGUELTIG");
        return "Dokumente/" + dokumentId + "/";
    }

    /** Für Migration nur EIN ausgewähltes Original. Aufrufer behält die Quelle bis zur eigenen
     * dauerhaften Registerbestätigung. Wiederholung nach Abbruch verwendet dieselbe Fassung. */
    public synchronized Eintrag ablegen(String dokumentId, String name, String mime, long datum, InputStream quelle) throws IOException {
        bereit();
        String pfad = dokumentPfad(dokumentId);
        if (name == null || name.isEmpty() || name.length() > Eintrag.NAME_MAX || mime == null || mime.length() > 200 || datum < 0)
            throw new IOException("FA_DOKUMENT_METADATEN_UNGUELTIG");
        byte[] bytes;
        try (InputStream in = quelle) { bytes = begrenztLesen(in); }
        String summe = sha256(bytes);
        for (Eintrag e : tresor.eigenesVerzeichnis(FACH)) {
            if (e.verweis.startsWith(pfad) && e.sha256.equals(summe) && e.name.equals(name) && e.art.equals(mime) && e.datum == datum) {
                // Kein Erfolg allein aufgrund der Metadaten: bestehende Originalbytes erneut prüfen.
                lesen(e.id);
                return e;
            }
        }
        // Kanon schreibt verschlüsselt, liest zur Probe zurück und bestätigt erst sein Verzeichnis.
        return tresor.ablegen(FACH, pfad.substring(0, pfad.length() - 1), name, mime, datum,
            new ByteArrayInputStream(bytes), "");
    }

    public synchronized byte[] lesen(String eintragId) throws IOException {
        bereit();
        Eintrag gefunden = null;
        for (Eintrag e : tresor.verzeichnis(FACH)) if (e.id.equals(eintragId)) { gefunden = e; break; }
        if (gefunden == null) throw new IOException("FA_DOKUMENT_FEHLT");
        if (!"fpt1".equals(gefunden.verschluesselung)) throw new IOException("FA_DOKUMENT_FREMDES_FORMAT");
        if (gefunden.groesse > MAX_BYTES) throw new IOException("FA_DOKUMENT_ZU_GROSS");
        byte[] bytes;
        try (InputStream in = tresor.oeffnen(FACH, gefunden)) { bytes = begrenztLesen(in); }
        if (bytes.length != gefunden.groesse || !sha256(bytes).equals(gefunden.sha256))
            throw new IOException("FA_DOKUMENT_PRUEFSUMME");
        return bytes;
    }

    public synchronized Eintrag uebergabeSenden(String ziel,String id,String dokumentId,String bezug,String name,String mime,InputStream quelle) throws IOException {
        bereit(); return new Uebergaben(tresor).senden(ziel,id,dokumentId,bezug,name,mime,quelle);
    }
    public synchronized List<Map<String,Object>> uebergabeEingang() throws IOException {
        bereit(); return new Uebergaben(tresor).offen();
    }
    public synchronized Map<String,Object> uebergabeBeschreibung(String eintragId) throws IOException {
        bereit(); return new Uebergaben(tresor).beschreibung(eintragId);
    }
    public synchronized byte[] uebergabeLesen(String eintragId) throws IOException {
        bereit(); return new Uebergaben(tresor).lesen(eintragId);
    }
    public synchronized void uebergabeQuittieren(String eintragId,String sha256) throws IOException {
        bereit(); new Uebergaben(tresor).quittieren(eintragId,sha256);
    }
    public synchronized boolean uebergabeStand(String ziel,String eintragId) throws IOException {
        bereit(); return new Uebergaben(tresor).bestaetigt(ziel,eintragId);
    }

    private static byte[] begrenztLesen(InputStream in) throws IOException {
        if (in == null) throw new IOException("FA_DOKUMENT_FEHLT");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] puffer = new byte[64 * 1024];
        int n;
        while ((n = in.read(puffer)) != -1) {
            if (n > MAX_BYTES - out.size()) throw new IOException("FA_DOKUMENT_ZU_GROSS");
            out.write(puffer, 0, n);
        }
        return out.toByteArray();
    }

    private static String sha256(byte[] bytes) {
        try {
            byte[] summe = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder s = new StringBuilder();
            for (byte b : summe) s.append(String.format(java.util.Locale.ROOT, "%02x", b & 255));
            return s.toString();
        } catch (NoSuchAlgorithmException unmoeglich) { throw new IllegalStateException(unmoeglich); }
    }

    @Override public synchronized void close() { geschlossen = true; tresor.close(); }
}
