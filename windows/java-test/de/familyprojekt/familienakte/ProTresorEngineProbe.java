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
        Path ordner, ausgabe; String zugang; int outputCalls;
        public Path ordner() { return ordner; }
        public char[] kennwort() { return zugang == null ? null : zugang.toCharArray(); }
        public Path ausgabe(String name) { outputCalls++; return ausgabe; }
    }
    static void pipeProbe() throws Exception {
        Path root = Files.createTempDirectory("fa-windows-pipe-");
        try {
            Dialoge dialog = new Dialoge(); dialog.ordner = root.resolve("tresor"); dialog.zugang = UUID.randomUUID().toString(); dialog.ausgabe = root.resolve("Paket.familienakte-paket");
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
            byte[] outputBytes = "Erfundene Ausgabedatei".getBytes(java.nio.charset.StandardCharsets.UTF_8);
            String outputHash = HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(outputBytes));
            Map<String,Object> output = Map.of("aktion", "dateiExportieren", "name", "Empfang.familienakte-quittung", "data", Base64.getEncoder().encodeToString(outputBytes), "sha256", outputHash);
            try (ProTresorEngine engine = new ProTresorEngine(config, dialog)) {
                pruefe(Boolean.TRUE.equals(((Map<?,?>)engine.aufruf(output)).get("cancelled")), "Abbruch der Ausgabe als Erfolg");
                dialog.ausgabe = root.resolve("Empfang.familienakte-quittung");
                Files.writeString(dialog.ausgabe, "Vorhandene erfundene Datei");
                Map<String,Object> bad = new HashMap<>(output); bad.put("sha256", "0".repeat(64));
                int count = dialog.outputCalls;
                final Map<String,Object> hashInput = bad;
                fehler("FA_AUSGABE_PRUEFSUMME", () -> engine.aufruf(hashInput));
                pruefe(dialog.outputCalls == count && Files.readString(dialog.ausgabe).equals("Vorhandene erfundene Datei"), "Fehlerhafte Ausgabe verändert vorhandene Datei");
                bad = new HashMap<>(output); bad.put("name", "../Pfad"); final Map<String,Object> pathInput = bad;
                fehler("FA_AUSGABE_NAME", () -> engine.aufruf(pathInput));
                pruefe(Boolean.TRUE.equals(((Map<?,?>)engine.aufruf(output)).get("saved")) && Arrays.equals(outputBytes, Files.readAllBytes(dialog.ausgabe)), "Native Ausgabe verändert Bytes");
                dialog.ausgabe = root.resolve("entfernt/Paket.bin");
                fehler("FA_AUSGABE_ORT", () -> engine.aufruf(output));
                byte[] tooBig = new byte[FamilyFileOutput.MAX_BYTES + 1];
                Map<String,Object> large = new HashMap<>(output); large.put("data", Base64.getEncoder().encodeToString(tooBig));
                fehler("FA_AUSGABE_ZU_GROSS", () -> engine.aufruf(large));
                pruefe(!Files.exists(config), "Dateiausgabe legt ungefragt Tresor an");
            }
            System.out.println("Windows-Ausgabe: Abbruch, Hash, Pfad, Originalerhalt, Systemdialoggrenze und Größenlimit grün");
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
                for(String ziel:List.of(Fach.WORKFLOW_PDF_APP,Fach.PRIVATE_BRAIN_APP,Fach.BOOKLEDGER_APP)) {
                    @SuppressWarnings("unchecked") Map<String,Object> hin=(Map<String,Object>)e.aufruf(Map.of("aktion","uebergabeSenden","vaultId",id,"ziel",ziel,"transferId","hin-"+ziel,"documentId","dokument-1","name","Erfunden.bin","mime","application/octet-stream","data",Base64.getEncoder().encodeToString(original)));
                    String hinId=(String)hin.get("entryId");
                    pruefe("weitergegeben".equals(hin.get("stand")),"Weitergabe als Empfang behauptet");
                    @SuppressWarnings("unchecked") Map<String,Object> ohne=(Map<String,Object>)e.aufruf(Map.of("aktion","uebergabeStand","vaultId",id,"ziel",ziel,"entryId",hinId));
                    pruefe(Boolean.FALSE.equals(ohne.get("bestaetigt")),"Vor Zielaufnahme bestätigt");
                    String rueckId;
                    try(TresorOrdner gegenstelle=TresorOrdner.oeffnen(new DateiAblage(tresor.toFile()),ziel,dialog.zugang)) {
                        Uebergaben u=new Uebergaben(gegenstelle);
                        pruefe(Arrays.equals(original,u.lesen(hinId)),"Ziel liest andere Originalbytes");
                        u.quittieren(hinId,(String)u.beschreibung(hinId).get("sha256"));
                        rueckId=u.senden(Fach.FAMILIENAKTE_APP,"rueck-"+ziel,"dok-1","hin-"+ziel,"Antwort.bin","application/octet-stream",new ByteArrayInputStream(original)).id;
                    }
                    @SuppressWarnings("unchecked") Map<String,Object> ja=(Map<String,Object>)e.aufruf(Map.of("aktion","uebergabeStand","vaultId",id,"ziel",ziel,"entryId",hinId));
                    pruefe(Boolean.TRUE.equals(ja.get("bestaetigt")),"Empfängermarke nicht zurückgemeldet");
                    @SuppressWarnings("unchecked") Map<String,Object> rueck=(Map<String,Object>)e.aufruf(Map.of("aktion","uebergabeLesen","vaultId",id,"entryId",rueckId));
                    pruefe(Arrays.equals(original,Base64.getDecoder().decode((String)rueck.get("data"))),"Rückweg verändert Bytes");
                    @SuppressWarnings("unchecked") Map<String,Object> vertrag=(Map<String,Object>)rueck.get("vertrag");
                    pruefe(ziel.equals(vertrag.get("quelle")),"Falsche Rückwegquelle");
                    fehler("TRESOR_UEBERGABE_PRUEFSUMME",()->e.aufruf(Map.of("aktion","uebergabeQuittieren","vaultId",id,"entryId",rueckId,"sha256","0".repeat(64))));
                    e.aufruf(Map.of("aktion","uebergabeQuittieren","vaultId",id,"entryId",rueckId,"sha256",vertrag.get("sha256")));
                }
                fehler("FA_TRESOR_FREMDE_KENNUNG", () -> e.aufruf(Map.of("aktion", "lesen", "vaultId", "fremd", "entryId", eintrag)));
                fehler("FA_TRESOR_AKTION_UNGUELTIG", () -> aufruf(e, "shell"));
                Path falsch = root.resolve("falsch"); Files.createDirectories(falsch); dialog.ordner = falsch;
                byte[] vorher = Files.readAllBytes(config);
                fehler("FA_TRESOR_NICHT_VORHANDEN", () -> aufruf(e, "verbinden"));
                pruefe(Arrays.equals(vorher, Files.readAllBytes(config)), "Fehlwechsel überschreibt Ort");
                pruefe(!Files.exists(falsch.resolve(TresorOrdner.KOPF)), "Falscher Ordner wird zum neuen Tresor");
                for (String unter : List.of(TresorOrdner.VERWALTUNG, Fach.FAMILIENAKTE.ordner)) {
                    dialog.ordner = tresor.resolve(unter);
                    fehler("FA_TRESOR_UNTERORDNER", () -> aufruf(e, "verbinden"));
                    pruefe(Arrays.equals(vorher, Files.readAllBytes(config)), "Unterordner überschreibt Ort");
                }
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
                pruefe("FA_TRESOR_NICHT_ERREICHBAR".equals(fehlt.get("code")), "Entfernter Tresor ohne Grund");
                pruefe(!Files.exists(tresor), "Windows erzeugt stillen Ersatzordner");
                try (TresorOrdner anderer = TresorOrdner.anlegen(new DateiAblage(tresor.toFile()), Fach.WORKFLOW_PDF_APP, dialog.zugang)) { }
                Map<String, Object> fremd = aufruf(e, "zustand");
                pruefe("nicht_erreichbar".equals(fremd.get("status")) && "FA_TRESOR_FREMDE_KENNUNG".equals(fremd.get("code")) && id.equals(fremd.get("id")), "Anderer Tresor am gemerkten Ort nicht benannt");
                try (var files = Files.walk(tresor)) { for (Path p : files.sorted(Comparator.reverseOrder()).toList()) Files.delete(p); }
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
