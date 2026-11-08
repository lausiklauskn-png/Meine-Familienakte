package de.familyprojekt.familienakte;

import android.content.ClipData;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * „Teilen → Familienakte“ und „Öffnen mit“ (ACTION_SEND, ACTION_SEND_MULTIPLE, ACTION_VIEW). Nur content://-Adressen
 * der sendenden App werden gelesen; eigener Provider und file:// werden abgewiesen. Geteilter Text ohne Datei wird eine
 * Textdatei. Die Seite holt die Dateien mit pending/read/done und legt sie in die Eingangszentrale.
 * Abgeleitet aus Private Brain Pro ProSharePlugin (b0a28dd).
 */
@CapacitorPlugin(name = "FamilienakteShare")
public class FamilienakteSharePlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private ShareInbox inbox;
    private volatile int refused;

    @Override public void load() {
        inbox = new ShareInbox(new File(getContext().getCacheDir(), "geteilt-eingang"));
        inbox.clear();
        Intent first = getActivity() == null ? null : getActivity().getIntent();
        if (first != null) take(first);
    }
    @Override protected void handleOnNewIntent(Intent intent) { super.handleOnNewIntent(intent); take(intent); }

    private void take(Intent intent) {
        String action = intent.getAction();
        if (!Intent.ACTION_SEND.equals(action) && !Intent.ACTION_SEND_MULTIPLE.equals(action) && !Intent.ACTION_VIEW.equals(action)) return;
        List<Uri> uris = new ArrayList<>();
        ClipData clip = intent.getClipData();
        if (clip != null) for (int i = 0; i < clip.getItemCount(); i++) if (clip.getItemAt(i).getUri() != null) uris.add(clip.getItemAt(i).getUri());
        if (uris.isEmpty()) {
            try {
                if (Intent.ACTION_VIEW.equals(action)) { if (intent.getData() != null) uris.add(intent.getData()); }
                else if (Intent.ACTION_SEND.equals(action)) { Uri one = intent.getParcelableExtra(Intent.EXTRA_STREAM); if (one != null) uris.add(one); }
                else { ArrayList<Uri> many = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM); if (many != null) uris.addAll(many); }
            } catch (Exception ignored) { /* ein kaputtes Extra zählt wie keine Datei */ }
        }
        String text = intent.getStringExtra(Intent.EXTRA_TEXT), subject = intent.getStringExtra(Intent.EXTRA_SUBJECT), type = intent.getType();
        intent.setAction(Intent.ACTION_MAIN);
        worker.execute(() -> {
            int before = inbox.count();
            ContentResolver resolver = getContext().getContentResolver();
            for (Uri uri : uris) {
                if (!allowed(uri)) { refused++; continue; }
                try (InputStream in = resolver.openInputStream(uri)) {
                    if (in == null) { refused++; continue; }
                    inbox.add(in, displayName(resolver, uri), resolver.getType(uri) != null ? resolver.getType(uri) : type);
                } catch (Exception error) { refused++; }
            }
            if (uris.isEmpty() && text != null && !text.trim().isEmpty() && text.length() <= 200_000) {
                String name = ShareInbox.safeName(subject == null || subject.trim().isEmpty() ? "Geteilter Text" : subject.trim(), "Geteilter Text");
                if (!name.toLowerCase(java.util.Locale.ROOT).endsWith(".txt")) name += ".txt";
                try { inbox.add(new java.io.ByteArrayInputStream(text.getBytes(StandardCharsets.UTF_8)), name, "text/plain"); } catch (Exception error) { refused++; }
            }
            notifyListeners("shared", new JSObject().put("added", inbox.count() - before).put("refused", refused), true);
        });
    }
    private boolean allowed(Uri uri) {
        if (uri == null || !ContentResolver.SCHEME_CONTENT.equals(uri.getScheme())) return false;
        String authority = uri.getAuthority();
        return authority != null && !authority.startsWith(getContext().getPackageName());
    }
    private static String displayName(ContentResolver resolver, Uri uri) {
        try (Cursor cursor = resolver.query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (cursor != null && cursor.moveToFirst() && !cursor.isNull(0)) return cursor.getString(0);
        } catch (Exception ignored) { /* letzter Pfadteil */ }
        return uri.getLastPathSegment();
    }
    @PluginMethod public void pending(PluginCall call) {
        worker.execute(() -> {
            JSArray list = new JSArray();
            for (ShareInbox.Item item : inbox.list()) list.put(new JSObject().put("id", item.id).put("name", item.name).put("mime", item.mime).put("size", item.size));
            int gone = refused; refused = 0;
            call.resolve(new JSObject().put("items", list).put("refused", gone));
        });
    }
    @PluginMethod public void read(PluginCall call) {
        String id = call.getString("id", ""); long offset = call.getData().optLong("offset", -1);
        worker.execute(() -> { try { call.resolve(new JSObject().put("data", Base64.encodeToString(inbox.read(id, offset), Base64.NO_WRAP))); } catch (Exception error) { call.reject("Shared file unavailable", "SHARE_UNAVAILABLE"); } });
    }
    @PluginMethod public void done(PluginCall call) { String id = call.getString("id", ""); worker.execute(() -> { inbox.remove(id); call.resolve(); }); }

    // ---- Stufe H (Plan 08.11.2026): Teilen AUS der Akte heraus – Datei in Stücken in den Cache, dann Androids Teilen-Fenster.
    private File ausgang() { File d = new File(getContext().getCacheDir(), "geteilt-ausgang"); if (!d.isDirectory()) d.mkdirs(); return d; }
    private static boolean kennungOk(String id) { return id != null && id.matches("[A-Za-z0-9-]{8,64}"); }
    @PluginMethod public void teilenStueck(PluginCall call) {
        String id = call.getString("id", ""); String data = call.getString("data", "");
        if (!kennungOk(id)) { call.reject("FA_TEILEN_KENNUNG"); return; }
        worker.execute(() -> {
            try (java.io.FileOutputStream out = new java.io.FileOutputStream(new File(ausgang(), id), true)) { out.write(Base64.decode(data, Base64.DEFAULT)); call.resolve(); }
            catch (Exception fehler) { call.reject("FA_TEILEN_SCHREIBEN"); }
        });
    }
    @PluginMethod public void teilenFertig(PluginCall call) {
        String id = call.getString("id", ""); String name = ShareInbox.safeName(call.getString("name", ""), "Unterlage"); String mime = ShareInbox.safeMime(call.getString("mime", ""));
        if (!kennungOk(id)) { call.reject("FA_TEILEN_KENNUNG"); return; }
        File quelle = new File(ausgang(), id);
        if (!quelle.isFile()) { call.reject("FA_TEILEN_LEER"); return; }
        try {
            // Unter dem sichtbaren Namen ablegen, damit die Ziel-App ihn anzeigt; alte Ausgänge räumen.
            File ordner = new File(ausgang(), id + ".d"); ordner.mkdirs();
            File ziel = new File(ordner, name); if (ziel.exists()) ziel.delete(); if (!quelle.renameTo(ziel)) throw new java.io.IOException("rename");
            aufraeumen(ordner);
            Uri uri = androidx.core.content.FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", ziel);
            Intent send = new Intent(Intent.ACTION_SEND).setType(mime).putExtra(Intent.EXTRA_STREAM, uri).putExtra(Intent.EXTRA_SUBJECT, name).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            send.setClipData(ClipData.newRawUri(name, uri));
            Intent chooser = Intent.createChooser(send, "Teilen: " + name).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);
            call.resolve(new JSObject().put("geteilt", true));
        } catch (Exception fehler) { quelle.delete(); call.reject("FA_TEILEN_FENSTER"); }
    }
    /** Ältere Ausgänge (über eine Stunde) entfernen – die Ziel-App hat die Datei längst gelesen. */
    private void aufraeumen(File behalten) {
        File[] alle = ausgang().listFiles(); if (alle == null) return;
        long grenze = System.currentTimeMillis() - 3600_000L;
        for (File f : alle) { if (f.equals(behalten) || f.lastModified() > grenze) continue; if (f.isDirectory()) { File[] k = f.listFiles(); if (k != null) for (File x : k) x.delete(); } f.delete(); }
    }
    @Override protected void handleOnDestroy() { worker.shutdownNow(); }
}
