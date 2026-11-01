package de.familyprojekt.familienakte;

import de.familyprojekt.tresor.*;
import java.awt.GraphicsEnvironment;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import javax.swing.*;

/** Lokale Windows-Brücke zum unveränderten Java-Kanon. Keine installierte Java-Laufzeit nötig:
 * Installer bündelt eine eigene Laufzeit. Ein Prozess je App; Schlüssel leben nur bis Sperren/Ende.
 * JSON-Zeilen über private stdin/stdout-Pipes, keine TCP-Ports, keine Kennwörter im WebView. */
public final class ProTresorEngine implements Closeable {
    public interface Dialoge { Path ordner() throws IOException; char[] kennwort() throws IOException; }
    private final Path einstellungen;
    private final Dialoge dialoge;
    private Path ort;
    private String id;
    private ProTresorAdapter adapter;

    public ProTresorEngine(Path einstellungen, Dialoge dialoge) throws IOException {
        this.einstellungen = einstellungen; this.dialoge = dialoge;
        if (Files.exists(einstellungen)) {
            try {
                Map<String, Object> m = Json.objekt(Files.readString(einstellungen));
                ort = Path.of(Json.text(m, "ort")); id = Json.text(m, "id");
                if (!ort.isAbsolute() || id.isEmpty()) throw new IOException();
            } catch (Exception e) { throw new IOException("FA_TRESOR_ZUSTAND_BESCHAEDIGT"); }
        }
    }
    private static Map<String, Object> antwort(String status, String id, Path ort) {
        Map<String, Object> m = new LinkedHashMap<>(); m.put("status", status);
        if (id != null) m.put("id", id);
        if (ort != null) m.put("ort", ort.toString());
        return m;
    }
    private DateiAblage ablage(Path p, String erwartet) throws IOException {
        if (p == null || !Files.isDirectory(p)) throw new IOException("FA_TRESOR_NICHT_ERREICHBAR");
        DateiAblage a = new DateiAblage(p.toFile());
        if (!TresorOrdner.vorhanden(a)) throw new IOException("FA_TRESOR_NICHT_VORHANDEN");
        if (erwartet != null && !erwartet.equals(TresorOrdner.kennung(a))) throw new IOException("FA_TRESOR_FREMDE_KENNUNG");
        if (a.gibtEs(Umzug.VERMERK)) throw new IOException("FA_TRESOR_UMGEZOGEN");
        return a;
    }
    private Map<String, Object> zustand() {
        if (ort == null) return antwort("getrennt", null, null);
        try { ablage(ort, id); return antwort(adapter == null ? "gesperrt" : "offen", id, ort); }
        catch (IOException e) { close(); return antwort("nicht_erreichbar", id, ort); }
    }
    private Map<String, Object> verbinden(boolean waehlen) throws IOException {
        Path neu = waehlen ? dialoge.ordner() : ort;
        if (neu == null) throw new IOException("FA_TRESOR_ABGEBROCHEN");
        neu = neu.toAbsolutePath().normalize();
        DateiAblage a = ablage(neu, waehlen ? null : id);
        String neuId = TresorOrdner.kennung(a);
        char[] geheim = dialoge.kennwort();
        if (geheim == null) throw new IOException("FA_TRESOR_ABGEBROCHEN");
        ProTresorAdapter offen;
        try { offen = ProTresorAdapter.oeffnen(a, neuId, java.nio.CharBuffer.wrap(geheim)); }
        finally { Arrays.fill(geheim, '\0'); }
        try {
            Files.createDirectories(einstellungen.getParent());
            Path vorlaeufig = Files.createTempFile(einstellungen.getParent(), "pro-tresor-", ".json");
            try {
                Map<String, Object> m = new LinkedHashMap<>(); m.put("ort", neu.toString()); m.put("id", neuId);
                Files.writeString(vorlaeufig, Json.schreiben(m), StandardCharsets.UTF_8);
                Files.move(vorlaeufig, einstellungen, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            } finally { Files.deleteIfExists(vorlaeufig); }
        } catch (IOException e) { offen.close(); throw new IOException("FA_TRESOR_ORT_NICHT_GESPEICHERT"); }
        close(); ort = neu; id = neuId; adapter = offen;
        return zustand();
    }
    private ProTresorAdapter offen(Map<String, Object> m) throws IOException {
        if (adapter == null) throw new IOException("FA_TRESOR_GESPERRT");
        if (!adapter.kennung().equals(Json.text(m, "vaultId"))) throw new IOException("FA_TRESOR_FREMDE_KENNUNG");
        ablage(ort, id);
        return adapter;
    }
    public synchronized Object aufruf(Map<String, Object> m) throws IOException {
        String aktion = Json.text(m, "aktion");
        switch (aktion) {
            case "zustand": return zustand();
            case "verbinden": return verbinden(true);
            case "entsperren": return verbinden(false);
            case "sperren": close(); return zustand();
            case "speichern": {
                ProTresorAdapter p = offen(m);
                String data = Json.text(m, "data");
                if (data.length() > ((ProTresorAdapter.MAX_BYTES + 2L) / 3) * 4) throw new IOException("FA_DOKUMENT_ZU_GROSS");
                byte[] bytes;
                try { bytes = Base64.getDecoder().decode(data); } catch (IllegalArgumentException e) { throw new IOException("FA_DOKUMENT_UNGUELTIG"); }
                Eintrag e = p.ablegen(Json.text(m, "documentId"), Json.text(m, "name"), Json.text(m, "mime"), Json.zahl(m, "date"), new ByteArrayInputStream(bytes));
                Map<String, Object> out = new LinkedHashMap<>(); out.put("entryId", e.id); out.put("vaultId", p.kennung()); out.put("sha256", e.sha256); out.put("size", e.groesse);
                return out;
            }
            case "lesen": {
                byte[] bytes = offen(m).lesen(Json.text(m, "entryId"));
                Map<String, Object> out = new LinkedHashMap<>(); out.put("data", Base64.getEncoder().encodeToString(bytes)); return out;
            }
            default: throw new IOException("FA_TRESOR_AKTION_UNGUELTIG");
        }
    }
    @Override public synchronized void close() { if (adapter != null) adapter.close(); adapter = null; }

    private static final class WindowsDialoge implements Dialoge {
        private void fenster(Runnable aktion) throws IOException {
            if (GraphicsEnvironment.isHeadless()) throw new IOException("FA_TRESOR_DIALOG_NICHT_VERFUEGBAR");
            try { SwingUtilities.invokeAndWait(aktion); }
            catch (Exception e) { throw new IOException("FA_TRESOR_DIALOG_NICHT_VERFUEGBAR"); }
        }
        public Path ordner() throws IOException {
            Path[] gewaehlt = new Path[1];
            fenster(() -> {
                JFileChooser chooser = new JFileChooser(); chooser.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);
                chooser.setDialogTitle("Vorhandenen gemeinsamen Pro-Tresor wählen");
                if (chooser.showOpenDialog(null) == JFileChooser.APPROVE_OPTION) gewaehlt[0] = chooser.getSelectedFile().toPath();
            });
            return gewaehlt[0];
        }
        public char[] kennwort() throws IOException {
            char[][] geheim = new char[1][];
            fenster(() -> {
                JPasswordField feld = new JPasswordField(24);
                int wahl = JOptionPane.showConfirmDialog(null, feld, "Pro-Tresor entsperren", JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
                if (wahl == JOptionPane.OK_OPTION) geheim[0] = feld.getPassword();
                feld.setText("");
            });
            return geheim[0];
        }
    }
    private static String zeile(Reader reader) throws IOException {
        StringBuilder s = new StringBuilder(); int c;
        while ((c = reader.read()) != -1 && c != '\n') {
            if (s.length() >= 30 * 1024 * 1024) throw new IOException("FA_DOKUMENT_ZU_GROSS");
            s.append((char)c);
        }
        return c == -1 && s.length() == 0 ? null : s.toString();
    }
    public static void main(String[] args) throws Exception {
        if (args.length != 1) return;
        System.setProperty("apple.awt.application.name", "Familienakte Pro");
        if (!GraphicsEnvironment.isHeadless()) {
            try { UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName()); }
            catch (Exception optionalesAussehen) { /* Standard-Swing bleibt benutzbar. */ }
        }
        try (ProTresorEngine engine = new ProTresorEngine(Path.of(args[0]), new WindowsDialoge());
             Reader in = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
             PrintWriter out = new PrintWriter(new OutputStreamWriter(System.out, StandardCharsets.UTF_8), true)) {
            String line;
            while ((line = zeile(in)) != null) {
                Map<String, Object> response = new LinkedHashMap<>();
                try { response.put("ok", engine.aufruf(Json.objekt(line))); }
                catch (Exception e) {
                    String code = e.getMessage();
                    response.put("error", code != null && code.matches("[A-Z0-9_]+") ? code : "FA_TRESOR_NICHT_ERREICHBAR");
                }
                out.println(Json.schreiben(response));
            }
        }
        // Swing bleibt sonst auch nach dem Schließen der privaten Pipe als eigener Prozess stehen.
        System.exit(0);
    }
}
