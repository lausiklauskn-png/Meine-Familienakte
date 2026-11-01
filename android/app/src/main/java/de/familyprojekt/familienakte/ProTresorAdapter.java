package de.familyprojekt.familienakte;

import de.familyprojekt.tresor.Ablage;
import de.familyprojekt.tresor.Eintrag;
import de.familyprojekt.tresor.Fach;
import de.familyprojekt.tresor.TresorOrdner;
import de.familyprojekt.tresor.Umzug;
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
 * keine Hintergrundmigration. Ein Adapter gehört genau zu einem freigegebenen Ort und einer Kennung.
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
