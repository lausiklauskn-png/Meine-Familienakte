package de.familyprojekt.familienakte;

import de.familyprojekt.tresor.*;
import java.io.*;
import java.nio.file.*;
import java.util.*;

/** Dieselbe Engine wie im Windows-Installer, nur die beiden nativen Dialoge gestellt. */
public final class ProTresorEngineProbe {
    static void pruefe(boolean ok, String was) { if (!ok) throw new AssertionError(was); }
    interface Aktion { void run() throws Exception; }
    static void fehler(String code, Aktion aktion) throws Exception {
        try { aktion.run(); } catch (IOException e) { pruefe(e.getMessage().contains(code), code + ": " + e); return; }
        throw new AssertionError(code + " wurde übergangen");
    }
    @SuppressWarnings("unchecked") static Map<String, Object> aufruf(ProTresorEngine e, String aktion) throws Exception {
        return (Map<String, Object>) e.aufruf(Map.of("aktion", aktion));
    }
    static final class Dialoge implements ProTresorEngine.Dialoge {
        Path ordner; String zugang;
        public Path ordner() { return ordner; }
        public char[] kennwort() { return zugang == null ? null : zugang.toCharArray(); }
    }
    static void pipeProbe() throws Exception {
        Path root = Files.createTempDirectory("fa-windows-pipe-");
        try {
            Dialoge dialog = new Dialoge(); dialog.ordner = root.resolve("tresor"); dialog.zugang = UUID.randomUUID().toString();
            try (TresorOrdner t = TresorOrdner.anlegen(new DateiAblage(dialog.ordner.toFile()), Fach.WORKFLOW_PDF_APP, dialog.zugang)) { }
            try (ProTresorEngine e = new ProTresorEngine(root.resolve("config.json"), dialog);
                 Reader in = new BufferedReader(new InputStreamReader(System.in, java.nio.charset.StandardCharsets.UTF_8));
                 PrintWriter out = new PrintWriter(new OutputStreamWriter(System.out, java.nio.charset.StandardCharsets.UTF_8), true)) {
                out.println(Json.schreiben(Map.of("bereit", aufruf(e, "verbinden"))));
                ProTresorEngine.bedienen(e, in, out);
            }
        } finally { try (var files = Files.walk(root)) { for (Path p : files.sorted(Comparator.reverseOrder()).toList()) Files.delete(p); } }
        System.exit(0);
    }
    public static void main(String[] args) throws Exception {
        if (args.length == 1 && args[0].equals("--pipe")) { pipeProbe(); return; }
        Path root = Files.createTempDirectory("fa-windows-pro-");
        try {
            Path tresor = root.resolve("sd-karte"), config = root.resolve("arbeitsstand/pro-tresor.json");
            Dialoge dialog = new Dialoge(); dialog.ordner = tresor; dialog.zugang = UUID.randomUUID().toString();
            String id;
            try (TresorOrdner t = TresorOrdner.anlegen(new DateiAblage(tresor.toFile()), Fach.WORKFLOW_PDF_APP, dialog.zugang)) { id = t.id(); }
            String eintrag;
            byte[] original = new byte[] { 1, 2, 3, 4, 5 };
            try (ProTresorEngine e = new ProTresorEngine(config, dialog)) {
                pruefe("getrennt".equals(aufruf(e, "zustand").get("status")), "Windows legt Ersatzspeicher an");
                pruefe(!Files.exists(config), "Start erzeugt schon Konfiguration");
                Map<String, Object> stand = aufruf(e, "verbinden");
                pruefe("offen".equals(stand.get("status")) && id.equals(stand.get("id")), "Windows verbindet falschen Tresor");
                Map<String, Object> cfg = Json.objekt(Files.readString(config));
                pruefe(cfg.size() == 2 && cfg.containsKey("ort") && cfg.containsKey("id"), "Geheimnis im Arbeitsstand");
                @SuppressWarnings("unchecked") Map<String, Object> gespeichert = (Map<String, Object>) e.aufruf(Map.of("aktion", "speichern", "vaultId", id,
                    "documentId", "dokument-1", "name", "Erfunden.bin", "mime", "application/octet-stream", "date", 1L, "data", Base64.getEncoder().encodeToString(original)));
                eintrag = (String) gespeichert.get("entryId");
                @SuppressWarnings("unchecked") Map<String, Object> gelesen = (Map<String, Object>) e.aufruf(Map.of("aktion", "lesen", "vaultId", id, "entryId", eintrag));
                pruefe(Arrays.equals(original, Base64.getDecoder().decode((String) gelesen.get("data"))), "Windows-Brücke verändert Original");
                fehler("FA_TRESOR_FREMDE_KENNUNG", () -> e.aufruf(Map.of("aktion", "lesen", "vaultId", "fremd", "entryId", eintrag)));
                fehler("FA_TRESOR_AKTION_UNGUELTIG", () -> aufruf(e, "shell"));
                Path falsch = root.resolve("falsch"); Files.createDirectories(falsch); dialog.ordner = falsch;
                byte[] vorher = Files.readAllBytes(config);
                fehler("TRESOR", () -> aufruf(e, "verbinden"));
                pruefe(Arrays.equals(vorher, Files.readAllBytes(config)), "Fehlwechsel überschreibt Ort");
                pruefe("offen".equals(aufruf(e, "zustand").get("status")), "Fehlwechsel sperrt alten Tresor");
                dialog.ordner = null;
                fehler("FA_TRESOR_ABGEBROCHEN", () -> aufruf(e, "verbinden"));
                pruefe("gesperrt".equals(aufruf(e, "sperren").get("status")), "Windows sperrt nicht");
                fehler("FA_TRESOR_GESPERRT", () -> e.aufruf(Map.of("aktion", "lesen", "vaultId", id, "entryId", eintrag)));
            }
            try (ProTresorEngine e = new ProTresorEngine(config, dialog)) {
                pruefe("gesperrt".equals(aufruf(e, "zustand").get("status")), "Neustart entsperrt ohne Kennwort");
                pruefe("offen".equals(aufruf(e, "entsperren").get("status")), "Erneutes Entsperren scheitert");
                Path entfernt = root.resolve("entfernt"); Files.move(tresor, entfernt);
                Map<String, Object> fehlt = aufruf(e, "zustand");
                pruefe("nicht_erreichbar".equals(fehlt.get("status")) && id.equals(fehlt.get("id")), "Windows vergisst entfernten Tresor");
                pruefe(!Files.exists(tresor), "Windows erzeugt stillen Ersatzordner");
                Files.move(entfernt, tresor);
                pruefe("gesperrt".equals(aufruf(e, "zustand").get("status")), "Rückkehr entsperrt ohne Kennwort");
            }
            try (TresorOrdner fremd = TresorOrdner.oeffnen(new DateiAblage(tresor.toFile()), Fach.BOOKLEDGER_APP, dialog.zugang)) {
                Eintrag e = fremd.verzeichnis(Fach.FAMILIENAKTE.slug).get(0);
                try (InputStream in = fremd.oeffnen(Fach.FAMILIENAKTE.slug, e)) { pruefe(Arrays.equals(original, in.readAllBytes()), "Windows-Datei nicht kanonisch lesbar"); }
            }
            Files.writeString(config, "kaputt");
            try (ProTresorEngine e = new ProTresorEngine(config, dialog)) {
                Map<String, Object> defekt = aufruf(e, "zustand");
                pruefe("nicht_erreichbar".equals(defekt.get("status")) && "FA_TRESOR_ZUSTAND_BESCHAEDIGT".equals(defekt.get("code")), "Beschädigte Konfiguration als leer behandelt");
                pruefe("kaputt".equals(Files.readString(config)), "Beschädigte Konfiguration ungefragt verändert");
                dialog.ordner = tresor;
                pruefe("offen".equals(aufruf(e, "verbinden").get("status")), "Beschädigte Konfiguration verhindert bewusste Reparatur");
                try (var files = Files.list(config.getParent())) {
                    Path alt = files.filter(p -> p.getFileName().toString().startsWith("pro-tresor.json.beschaedigt-")).findFirst().orElseThrow();
                    pruefe("kaputt".equals(Files.readString(alt)), "Alter Konfigurationsstand nicht erhalten");
                }
            }
            // Die zugesagte Obergrenze muss mit demselben Heap wie in der Tauri-Hülle funktionieren.
            try (ProTresorEngine e = new ProTresorEngine(config, dialog)) {
                aufruf(e, "entsperren");
                byte[] grenze = new byte[20 * 1024 * 1024];
                new Random(71).nextBytes(grenze);
                String erwarteterHash = HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(grenze));
                @SuppressWarnings("unchecked") Map<String, Object> receipt = (Map<String, Object>) e.aufruf(Map.of("aktion", "speichern", "vaultId", id,
                    "documentId", "grenzdatei", "name", "Grenze.bin", "mime", "application/octet-stream", "date", 0L, "data", Base64.getEncoder().encodeToString(grenze)));
                pruefe(erwarteterHash.equals(receipt.get("sha256")), "20-MiB-Ablage verändert Inhalt");
                grenze = null;
                @SuppressWarnings("unchecked") Map<String, Object> read = (Map<String, Object>) e.aufruf(Map.of("aktion", "lesen", "vaultId", id, "entryId", receipt.get("entryId")));
                byte[] rueckweg = Base64.getDecoder().decode((String) read.get("data"));
                pruefe(rueckweg.length == 20 * 1024 * 1024 && erwarteterHash.equals(HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(rueckweg))), "20-MiB-Rückweg verändert Inhalt");
            }
            System.out.println("Windows-Pro-Tresor: Zustand, native Dialoggrenze, Ablage, Rückweg, Fehlwechsel, Sperre, Neustart und entfernter Speicher grün");
        } finally { try (var files = Files.walk(root)) { for (Path p : files.sorted(Comparator.reverseOrder()).toList()) Files.delete(p); } }
    }
}
