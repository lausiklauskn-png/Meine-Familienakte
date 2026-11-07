package de.familyprojekt.familienakte;

import de.familyprojekt.tresor.Json;
import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.security.MessageDigest;
import java.util.*;

/** P4/P5 (Plan 07.11.): frei gewählter Ordner für die Vollsicherung und stückweise Dateiausgabe bis 100 MB.
 * Die Seite bekommt nie einen Pfad, nur eine Kennung je gewähltem Ordner; Unterpfade sind relativ und geprüft.
 * Stücke höchstens 1 MiB, damit eine Zeile der privaten Pipe klein bleibt. Dieselben Aktionen bietet Android (FamilyFolders). */
final class FamilyFolders {
    static final int STUECK = 1024 * 1024;
    static final long MAX_DATEI = 100L * 1024 * 1024 + 8192 + 12;
    private final Map<String, Path> ordner = new HashMap<>();
    private final Map<String, Schreiben> offen = new HashMap<>();
    private static final class Schreiben { Path ziel, teil; long groesse; MessageDigest sha; boolean ausgabe; boolean fertig; String name; }

    static boolean aktion(String a) {
        return a.startsWith("ordner") || a.startsWith("datei") && !a.equals("dateiExportieren") || a.startsWith("ausgabe");
    }

    Object aufruf(Map<String, Object> m, ProTresorEngine.Dialoge dialoge) throws IOException {
        String a = Json.text(m, "aktion");
        switch (a) {
            case "ordnerWaehlen": {
                Path p = dialoge.sicherungsordner(Json.textOder(m, "titel", "Ordner wählen"));
                if (p == null) return Map.of("cancelled", true);
                p = p.toAbsolutePath().normalize();
                if (!Files.isDirectory(p) || Files.isSymbolicLink(p)) throw new IOException("FA_ORDNER_UNGUELTIG");
                String token = UUID.randomUUID().toString(); ordner.put(token, p);
                return Map.of("token", token, "name", p.getFileName() == null ? p.toString() : p.getFileName().toString());
            }
            case "ordnerListe": {
                Path p = pfad(m, true);
                if (!Files.isDirectory(p)) throw new IOException("FA_NICHT_GEFUNDEN");
                List<Object> liste = new ArrayList<>();
                try (var s = Files.list(p)) {
                    for (Path e : s.sorted().toList()) {
                        if (Files.isSymbolicLink(e)) continue;
                        BasicFileAttributes at = Files.readAttributes(e, BasicFileAttributes.class);
                        Map<String, Object> x = new LinkedHashMap<>();
                        x.put("name", e.getFileName().toString()); x.put("art", at.isDirectory() ? "ordner" : "datei");
                        x.put("groesse", at.isDirectory() ? 0L : at.size()); x.put("geaendert", at.lastModifiedTime().toMillis());
                        liste.add(x);
                    }
                }
                return Map.of("eintraege", liste);
            }
            case "ordnerAnlegen": {
                Path p = pfad(m, false);
                if (Files.exists(p) && !Files.isDirectory(p)) throw new IOException("FA_ART_FALSCH");
                Files.createDirectories(p); return Map.of("ok", true);
            }
            case "dateiInfo": {
                Path p = pfad(m, true);
                if (!Files.exists(p, LinkOption.NOFOLLOW_LINKS)) throw new IOException("FA_NICHT_GEFUNDEN");
                BasicFileAttributes at = Files.readAttributes(p, BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS);
                return Map.of("art", at.isDirectory() ? "ordner" : "datei", "groesse", at.isDirectory() ? 0L : at.size(), "geaendert", at.lastModifiedTime().toMillis());
            }
            case "dateiLesen": {
                Path p = pfad(m, true);
                long von = Json.zahl(m, "offset"); int laenge = (int) Math.min(STUECK, Math.max(0, Json.zahl(m, "laenge")));
                if (!Files.isRegularFile(p, LinkOption.NOFOLLOW_LINKS)) throw new IOException("FA_NICHT_GEFUNDEN");
                byte[] puffer = new byte[laenge]; int n = 0;
                try (RandomAccessFile f = new RandomAccessFile(p.toFile(), "r")) {
                    f.seek(von);
                    while (n < laenge) { int r = f.read(puffer, n, laenge - n); if (r < 0) break; n += r; }
                }
                return Map.of("data", Base64.getEncoder().encodeToString(Arrays.copyOf(puffer, n)));
            }
            case "dateiLoeschen": {
                Path p = pfad(m, true);
                if (Files.isDirectory(p, LinkOption.NOFOLLOW_LINKS)) {
                    if (!Json.textOder(m, "rekursiv", "nein").equals("ja")) { try (var s = Files.list(p)) { if (s.findAny().isPresent()) throw new IOException("FA_NICHT_LEER"); } }
                    try (var s = Files.walk(p)) { for (Path x : s.sorted(Comparator.reverseOrder()).toList()) Files.delete(x); }
                } else if (!Files.deleteIfExists(p)) throw new IOException("FA_NICHT_GEFUNDEN");
                return Map.of("ok", true);
            }
            case "dateiBeginn": {
                Path ziel = pfad(m, false), eltern = ziel.getParent();
                if (eltern == null || !Files.isDirectory(eltern) || Files.isDirectory(ziel)) throw new IOException("FA_ORDNER_UNGUELTIG");
                return beginnen(ziel, Files.createTempFile(eltern, ".familienakte-", ".teil"), false, ziel.getFileName().toString());
            }
            case "ausgabeBeginn": {
                String name = Json.text(m, "name");
                if (name.isBlank() || name.length() > 200 || name.matches(".*[\\p{Cntrl}/\\\\:].*") || name.equals(".") || name.equals("..")) throw new IOException("FA_AUSGABE_NAME");
                return beginnen(null, Files.createTempFile("familienakte-ausgabe-", ".teil"), true, name);
            }
            case "dateiAnhaengen": case "ausgabeAnhaengen": {
                Schreiben s = schreiben(m, false);
                long offset = Json.zahl(m, "offset");
                String data = Json.text(m, "data");
                if (offset != s.groesse || data.length() > ((STUECK + 2) / 3) * 4) throw new IOException("FA_STUECK_UNGUELTIG");
                byte[] b;
                try { b = Base64.getDecoder().decode(data); } catch (IllegalArgumentException e) { throw new IOException("FA_STUECK_UNGUELTIG"); }
                if (s.groesse + b.length > MAX_DATEI) throw new IOException("FA_AUSGABE_ZU_GROSS");
                Files.write(s.teil, b, StandardOpenOption.APPEND);
                s.sha.update(b); s.groesse += b.length;
                return Map.of("size", s.groesse);
            }
            case "dateiFertig": case "ausgabeFertig": {
                Schreiben s = schreiben(m, false);
                if (Json.zahl(m, "size") != s.groesse || Files.size(s.teil) != s.groesse) throw new IOException("FA_STUECK_UNGUELTIG");
                String sha = HexFormat.of().formatHex(s.sha.digest());
                if (!s.ausgabe) {
                    try (var in = Files.newInputStream(s.teil)) { if (!sha.equals(hash(in))) throw new IOException("FA_AUSGABE_PRUEFSUMME"); }
                    Files.move(s.teil, s.ziel, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
                    offen.remove(Json.text(m, "id"));
                } else s.fertig = true;
                return Map.of("size", s.groesse, "sha256", sha);
            }
            case "ausgabeSpeichern": {
                Schreiben s = schreiben(m, true);
                Path gewaehlt = dialoge.ausgabe(s.name);
                if (gewaehlt == null) return Map.of("cancelled", true);
                Path ziel = gewaehlt.toAbsolutePath().normalize(), eltern = ziel.getParent();
                if (eltern == null || !Files.isDirectory(eltern) || Files.isSymbolicLink(ziel) || Files.isDirectory(ziel)) throw new IOException("FA_AUSGABE_ORT");
                Path neben = Files.createTempFile(eltern, ".familienakte-ausgabe-", ".tmp");
                try {
                    Files.copy(s.teil, neben, StandardCopyOption.REPLACE_EXISTING);
                    String a1, a2;
                    try (var in = Files.newInputStream(s.teil)) { a1 = hash(in); }
                    try (var in = Files.newInputStream(neben)) { a2 = hash(in); }
                    if (!a1.equals(a2) || Files.size(neben) != s.groesse) throw new IOException("FA_AUSGABE_PRUEFSUMME");
                    Files.move(neben, ziel, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
                } finally { Files.deleteIfExists(neben); }
                return Map.of("saved", true);
            }
            case "dateiVerwerfen": case "ausgabeVerwerfen": {
                Schreiben s = offen.remove(Json.text(m, "id"));
                if (s != null) Files.deleteIfExists(s.teil);
                return Map.of("ok", true);
            }
            default: throw new IOException("FA_TRESOR_AKTION_UNGUELTIG");
        }
    }

    private Map<String, Object> beginnen(Path ziel, Path teil, boolean ausgabe, String name) throws IOException {
        Schreiben s = new Schreiben(); s.ziel = ziel; s.teil = teil; s.ausgabe = ausgabe; s.name = name;
        try { s.sha = MessageDigest.getInstance("SHA-256"); } catch (Exception e) { throw new IOException("FA_AUSGABE_PRUEFSUMME"); }
        String id = UUID.randomUUID().toString(); offen.put(id, s);
        return Map.of("id", id);
    }
    private Schreiben schreiben(Map<String, Object> m, boolean fertig) throws IOException {
        Schreiben s = offen.get(Json.text(m, "id"));
        if (s == null || s.fertig != fertig) throw new IOException("FA_STUECK_UNGUELTIG");
        return s;
    }
    /** Relativer Pfad unter dem gewählten Ordner; ohne „..“, Steuerzeichen, Laufwerks- oder Rückstrichanteile. */
    private Path pfad(Map<String, Object> m, boolean leerErlaubt) throws IOException {
        Path basis = ordner.get(Json.text(m, "token"));
        if (basis == null || !Files.isDirectory(basis)) throw new IOException("FA_ORDNER_NICHT_ERREICHBAR");
        String rel = Json.textOder(m, "pfad", "");
        if (rel.isEmpty()) { if (leerErlaubt) return basis; throw new IOException("FA_PFAD_UNGUELTIG"); }
        if (rel.length() > 1024) throw new IOException("FA_PFAD_UNGUELTIG");
        Path p = basis;
        for (String teil : rel.split("/", -1)) {
            if (teil.isEmpty() || teil.equals(".") || teil.equals("..") || teil.length() > 255 || teil.matches(".*[\\p{Cntrl}\\\\:*?\"<>|].*")) throw new IOException("FA_PFAD_UNGUELTIG");
            p = p.resolve(teil);
        }
        p = p.normalize();
        if (!p.startsWith(basis)) throw new IOException("FA_PFAD_UNGUELTIG");
        return p;
    }
    static String hash(InputStream in) throws IOException {
        try {
            MessageDigest d = MessageDigest.getInstance("SHA-256"); byte[] b = new byte[65536]; int n;
            while ((n = in.read(b)) > 0) d.update(b, 0, n);
            return HexFormat.of().formatHex(d.digest());
        } catch (java.security.NoSuchAlgorithmException e) { throw new IOException("FA_AUSGABE_PRUEFSUMME"); }
    }
    void schliessen() {
        for (Schreiben s : offen.values()) { try { Files.deleteIfExists(s.teil); } catch (IOException ignoriert) { /* Temp wird beim nächsten Start nicht gebraucht */ } }
        offen.clear(); ordner.clear();
    }
}
