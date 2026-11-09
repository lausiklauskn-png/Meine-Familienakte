package de.familyprojekt.familienakte;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import de.familyprojekt.tresor.Ablage;
import de.familyprojekt.tresor.SafAblage;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** P5 (Plan 07.11.): Vollsicherung in einen frei gewählten Ordner (Gerät, SD-Karte, USB), getrennt vom Pro-Tresor.
 * Ordnerwahl über Androids Speicherzugriff; die Seite bekommt nur eine Kennung, nie eine URI. Relative Pfade prüft
 * SafAblage (gemeinsamer Tresor-Baustein, unverändert genutzt). Stücke höchstens 1 MiB. Dieselben Aktionen bietet
 * die Windows-Engine (FamilyFolders.java). Die Freigabe gilt nur, solange die App läuft (keine dauerhafte Freigabe). */
@CapacitorPlugin(name = "FamilyFolders")
public final class FamilienakteOrdnerPlugin extends Plugin {
    static final int STUECK = 1024 * 1024;
    static final long MAX_DATEI = 100L * 1024 * 1024 + 8192 + 12;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Map<String, Ablage> ordner = new HashMap<>();
    /** Stufe C: Baum-Uri je Kennung, damit eine Freigabe dauerhaft gemerkt werden kann (gemeinsame Festplatte). */
    private final Map<String, Uri> baeume = new HashMap<>();
    private final Map<String, Schreiben> offen = new HashMap<>();
    private final java.util.Set<String> selbstAngelegt = new java.util.HashSet<>();
    private static final class Schreiben { Ablage ablage; String token; String pfad; OutputStream out; long groesse; MessageDigest sha; }
    private interface Arbeit { JSObject run() throws Exception; }

    private void arbeit(PluginCall call, Arbeit a) {
        worker.execute(() -> {
            try { call.resolve(a.run()); }
            catch (Exception e) {
                String code = e.getMessage();
                call.reject("Ordnerzugriff fehlgeschlagen", code != null && code.matches("[A-Z0-9_]+") ? code : "FA_ORDNER_NICHT_ERREICHBAR");
            }
        });
    }
    private Ablage ablage(PluginCall call) throws IOException {
        Ablage a = ordner.get(call.getString("token", ""));
        if (a == null) throw new IOException("FA_ORDNER_NICHT_ERREICHBAR");
        return a;
    }
    private static String pfad(PluginCall call) { return call.getString("pfad", ""); }

    @PluginMethod public void ordnerWaehlen(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        startActivityForResult(call, intent, "ordnerGewaehlt");
    }
    @ActivityCallback private void ordnerGewaehlt(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) { call.resolve(new JSObject().put("cancelled", true)); return; }
        Uri baum = data.getData();
        arbeit(call, () -> {
            SafAblage a = new SafAblage(getContext().getContentResolver(), baum);
            a.liste(""); // Probe: lesbar
            String token = UUID.randomUUID().toString(); ordner.put(token, a); baeume.put(token, baum);
            String name = baum.getLastPathSegment() == null ? "Ordner" : baum.getLastPathSegment();
            int i = name.lastIndexOf(':'); if (i >= 0) name = name.substring(i + 1);
            return new JSObject().put("token", token).put("name", name.isEmpty() ? "Speicher" : name);
        });
    }
    /** Stufe C (Plan 08.11.): Freigabe dauerhaft merken; die Seite bekommt einen Ort-Text zurück, den ordnerOeffnen wieder öffnet. */
    @PluginMethod public void ordnerMerken(PluginCall call) {
        arbeit(call, () -> {
            Uri baum = baeume.get(call.getString("token", ""));
            if (baum == null) throw new IOException("FA_ORDNER_NICHT_ERREICHBAR");
            getContext().getContentResolver().takePersistableUriPermission(baum, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            return new JSObject().put("ort", baum.toString());
        });
    }
    private static String ortName(Uri baum) {
        String name = baum.getLastPathSegment() == null ? "Ordner" : baum.getLastPathSegment();
        int i = name.lastIndexOf(':'); if (i >= 0) name = name.substring(i + 1);
        return name.isEmpty() ? "Speicher" : name;
    }
    private boolean freigegeben(Uri baum) {
        return getContext().getContentResolver().getPersistedUriPermissions().stream()
            .anyMatch(p -> p.getUri().equals(baum) && p.isReadPermission() && p.isWritePermission());
    }
    /** Gemerkten Ort wieder öffnen; ohne Freigabe oder ohne Laufwerk kommt erreichbar=false statt eines Fehlers. */
    @PluginMethod public void ordnerOeffnen(PluginCall call) {
        arbeit(call, () -> {
            Uri baum = Uri.parse(call.getString("ort", ""));
            if (!freigegeben(baum)) return new JSObject().put("erreichbar", false).put("grund", "FA_FREIGABE_FEHLT");
            try {
                SafAblage a = new SafAblage(getContext().getContentResolver(), baum); a.liste("");
                String token = UUID.randomUUID().toString(); ordner.put(token, a); baeume.put(token, baum);
                return new JSObject().put("erreichbar", true).put("token", token).put("name", ortName(baum));
            } catch (Exception e) { return new JSObject().put("erreichbar", false).put("grund", "FA_ORDNER_NICHT_ERREICHBAR"); }
        });
    }
    /** Alle dauerhaft freigegebenen Orte nach einer Kennungsdatei absuchen (z. B. Familienakte-Abgleich/Familienakte-Laufwerk.json). */
    @PluginMethod public void laufwerkeSuchen(PluginCall call) {
        arbeit(call, () -> {
            String datei = call.getString("datei", "");
            JSArray treffer = new JSArray();
            if (datei.isEmpty()) return new JSObject().put("treffer", treffer);
            for (android.content.UriPermission p : getContext().getContentResolver().getPersistedUriPermissions()) {
                if (!p.isReadPermission() || !p.isWritePermission()) continue;
                try {
                    SafAblage a = new SafAblage(getContext().getContentResolver(), p.getUri());
                    if (!a.gibtEs(datei) || a.istOrdner(datei)) continue;
                    byte[] b = a.lesen(datei, 65536);
                    treffer.put(new JSObject().put("ort", p.getUri().toString()).put("name", ortName(p.getUri())).put("inhalt", new String(b, java.nio.charset.StandardCharsets.UTF_8)));
                } catch (Exception ignoriert) { /* dieser Ort ist gerade nicht da */ }
            }
            return new JSObject().put("treffer", treffer);
        });
    }
    /** Stufe F: app-eigener Ordner (Gastgeber des Netz-Abgleichs) als Ordner-Kennung, dieselben Aktionen wie ein gewählter Ordner. */
    @PluginMethod public void ordnerIntern(PluginCall call) {
        arbeit(call, () -> {
            String name = call.getString("name", "");
            if (!name.matches("[A-Za-z0-9_-]{1,64}")) throw new IOException("FA_PFAD_UNGUELTIG");
            java.io.File wurzel = new java.io.File(getContext().getFilesDir(), name);
            if (!wurzel.isDirectory() && !wurzel.mkdirs()) throw new IOException("FA_ORDNER_NICHT_ERREICHBAR");
            String token = UUID.randomUUID().toString(); ordner.put(token, new de.familyprojekt.tresor.DateiAblage(wurzel));
            return new JSObject().put("token", token).put("name", name).put("pfad", wurzel.getAbsolutePath());
        });
    }
    @PluginMethod public void ordnerListe(PluginCall call) {
        arbeit(call, () -> {
            Ablage a = ablage(call); String p = pfad(call);
            if (!a.istOrdner(p)) throw new IOException("FA_NICHT_GEFUNDEN");
            JSArray liste = new JSArray();
            for (String name : a.liste(p)) {
                String voll = p.isEmpty() ? name : p + "/" + name;
                boolean dir = a.istOrdner(voll);
                if (!dir && name.endsWith(".teil")) continue;
                liste.put(new JSObject().put("name", name).put("art", dir ? "ordner" : "datei").put("groesse", dir ? 0 : a.groesse(voll)));
            }
            return new JSObject().put("eintraege", liste);
        });
    }
    @PluginMethod public void ordnerAnlegen(PluginCall call) {
        arbeit(call, () -> { Ablage a = ablage(call); String p = pfad(call); if (p.isEmpty()) throw new IOException("FA_PFAD_UNGUELTIG");
            if (a.gibtEs(p) && !a.istOrdner(p)) throw new IOException("FA_ART_FALSCH"); a.ordner(p); return new JSObject().put("ok", true); });
    }
    @PluginMethod public void dateiInfo(PluginCall call) {
        arbeit(call, () -> {
            Ablage a = ablage(call); String p = pfad(call);
            if (!a.gibtEs(p)) throw new IOException("FA_NICHT_GEFUNDEN");
            boolean dir = a.istOrdner(p);
            return new JSObject().put("art", dir ? "ordner" : "datei").put("groesse", dir ? 0 : a.groesse(p));
        });
    }
    @PluginMethod public void dateiLesen(PluginCall call) {
        arbeit(call, () -> {
            Ablage a = ablage(call); String p = pfad(call);
            long von = Math.max(0, call.getLong("offset", 0L)); int laenge = (int) Math.min(STUECK, Math.max(0, call.getLong("laenge", 0L)));
            if (!a.gibtEs(p) || a.istOrdner(p)) throw new IOException("FA_NICHT_GEFUNDEN");
            Ablage.Kanal k = a.kanal(p);
            try {
                ByteBuffer b = ByteBuffer.allocate(laenge); k.kanal.position(von);
                while (b.hasRemaining()) { int r = k.kanal.read(b); if (r < 0) break; }
                byte[] aus = new byte[b.position()]; b.flip(); b.get(aus);
                return new JSObject().put("data", Base64.encodeToString(aus, Base64.NO_WRAP));
            } finally { zu(k); }
        });
    }
    /** Nur Dateien, die diese Sitzung selbst angelegt hat (z. B. die Schreibprobe); kein allgemeines Löschen. */
    @PluginMethod public void eigeneDateiEntfernen(PluginCall call) {
        arbeit(call, () -> {
            Ablage a = ablage(call); String p = pfad(call);
            String schluessel = call.getString("token", "") + "|" + p;
            if (!selbstAngelegt.contains(schluessel) || !a.gibtEs(p) || a.istOrdner(p)) throw new IOException("FA_NICHT_ERLAUBT");
            a.loeschen(p); selbstAngelegt.remove(schluessel); return new JSObject().put("ok", true);
        });
    }
    @PluginMethod public void dateiBeginn(PluginCall call) {
        arbeit(call, () -> {
            Ablage a = ablage(call); String p = pfad(call);
            if (p.isEmpty() || a.istOrdner(p)) throw new IOException("FA_ORDNER_UNGUELTIG");
            if (a.gibtEs(p)) a.loeschen(p);
            Schreiben s = new Schreiben(); s.ablage = a; s.token = call.getString("token", ""); s.pfad = p; s.out = a.neu(p); s.sha = MessageDigest.getInstance("SHA-256");
            String id = UUID.randomUUID().toString(); offen.put(id, s);
            return new JSObject().put("id", id);
        });
    }
    @PluginMethod public void dateiAnhaengen(PluginCall call) {
        arbeit(call, () -> {
            Schreiben s = offen.get(call.getString("id", ""));
            String data = call.getString("data", "");
            if (s == null || call.getLong("offset", -1L) != s.groesse || data.length() > ((STUECK + 2) / 3) * 4) throw new IOException("FA_STUECK_UNGUELTIG");
            byte[] b = Base64.decode(data, Base64.NO_WRAP);
            if (s.groesse + b.length > MAX_DATEI) throw new IOException("FA_AUSGABE_ZU_GROSS");
            s.out.write(b); s.sha.update(b); s.groesse += b.length;
            return new JSObject().put("size", s.groesse);
        });
    }
    @PluginMethod public void dateiFertig(PluginCall call) {
        arbeit(call, () -> {
            String id = call.getString("id", ""); Schreiben s = offen.get(id);
            if (s == null || call.getLong("size", -1L) != s.groesse) throw new IOException("FA_STUECK_UNGUELTIG");
            s.out.flush(); s.out.close(); offen.remove(id);
            String sha = hex(s.sha.digest());
            if (s.ablage.groesse(s.pfad) != s.groesse || !sha.equals(hash(s.ablage, s.pfad))) { s.ablage.loeschen(s.pfad); throw new IOException("FA_AUSGABE_PRUEFSUMME"); }
            selbstAngelegt.add(s.token + "|" + s.pfad);
            return new JSObject().put("size", s.groesse).put("sha256", sha);
        });
    }
    @PluginMethod public void dateiVerwerfen(PluginCall call) {
        arbeit(call, () -> {
            Schreiben s = offen.remove(call.getString("id", ""));
            if (s != null) { try { s.out.close(); } catch (IOException ignoriert) { } s.ablage.loeschen(s.pfad); }
            return new JSObject().put("ok", true);
        });
    }
    /** Frage s: die eigene Installationsdatei (APK) neben die Sicherung legen, damit sie ohne Internet neu installiert werden kann. */
    @PluginMethod public void programmBeilegen(PluginCall call) {
        arbeit(call, () -> {
            Ablage a = ablage(call); String ordnerPfad = pfad(call);
            PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            String name = "Familienakte-Pro-" + info.versionName.replaceAll("[^0-9A-Za-z.\\-]", "_") + ".apk";
            String ziel = ordnerPfad.isEmpty() ? name : ordnerPfad + "/" + name;
            if (a.gibtEs(ziel)) a.loeschen(ziel);
            MessageDigest d = MessageDigest.getInstance("SHA-256"); long n = 0;
            try (InputStream in = new FileInputStream(getContext().getApplicationInfo().sourceDir); OutputStream out = a.neu(ziel)) {
                byte[] b = new byte[65536]; int r;
                while ((r = in.read(b)) > 0) { out.write(b, 0, r); d.update(b, 0, r); n += r; }
            }
            String sha = hex(d.digest());
            if (a.groesse(ziel) != n || !sha.equals(hash(a, ziel))) { a.loeschen(ziel); throw new IOException("FA_AUSGABE_PRUEFSUMME"); }
            return new JSObject().put("name", name).put("groesse", n).put("sha256", sha).put("fassung", info.versionName);
        });
    }
    private static String hash(Ablage a, String p) throws Exception {
        MessageDigest d = MessageDigest.getInstance("SHA-256");
        Ablage.Kanal k = a.kanal(p);
        try {
            ByteBuffer b = ByteBuffer.allocate(65536);
            while (k.kanal.read(b) > 0) { b.flip(); d.update(b); b.clear(); }
        } finally { zu(k); }
        return hex(d.digest());
    }
    private static void zu(Ablage.Kanal k) {
        try { k.kanal.close(); } catch (IOException ignoriert) { }
        try { if (k.besitzer != null) k.besitzer.close(); } catch (IOException ignoriert) { }
    }
    private static String hex(byte[] b) { StringBuilder s = new StringBuilder(); for (byte x : b) s.append(String.format("%02x", x)); return s.toString(); }
    @Override protected void handleOnDestroy() {
        for (Schreiben s : offen.values()) { try { s.out.close(); s.ablage.loeschen(s.pfad); } catch (Exception ignoriert) { } }
        offen.clear(); ordner.clear(); selbstAngelegt.clear(); worker.shutdownNow();
    }
}
