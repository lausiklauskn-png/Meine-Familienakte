package de.familyprojekt.familienakte;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.text.InputType;
import android.util.Base64;
import android.widget.EditText;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.*;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import de.familyprojekt.tresor.*;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Freiwilliger Anschluss an einen vorhandenen Pro-Tresor; keine Neuanlage und keine Migration
 * beim Start. Kennwort ausschließlich im nativen Dialog; gespeichert werden nur Ort und Kennung. */
@CapacitorPlugin(name = "FamilienakteTresor")
public class FamilienakteTresorPlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private ProTresorAdapter adapter;
    private SharedPreferences prefs() { return getContext().getSharedPreferences("familienakte-pro-tresor", 0); }
    private void ungenutztFreigeben(String uri) {
        if (uri == null || uri.isEmpty() || uri.equals(prefs().getString("uri", ""))) return;
        try { getContext().getContentResolver().releasePersistableUriPermission(Uri.parse(uri),
            Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION); }
        catch (SecurityException ignored) { /* keine ungenutzte Freigabe vorhanden */ }
    }
    private SafAblage ablage(String uri) throws IOException {
        if (uri == null || uri.isEmpty()) throw new IOException("FA_TRESOR_NICHT_VERBUNDEN");
        Uri baum = Uri.parse(uri);
        boolean erlaubt = getContext().getContentResolver().getPersistedUriPermissions().stream()
            .anyMatch(p -> p.getUri().equals(baum) && p.isReadPermission() && p.isWritePermission());
        if (!erlaubt) throw new IOException("FA_TRESOR_FREIGABE_FEHLT");
        return new SafAblage(getContext().getContentResolver(), baum);
    }
    private void fehler(PluginCall call, Exception e) {
        String code = e.getMessage();
        call.reject("Der gewählte Pro-Tresor ist nicht verfügbar. Quelle bleibt erhalten.",
            code != null && code.matches("[A-Z0-9_]+") ? code : "FA_TRESOR_NICHT_ERREICHBAR");
    }
    @PluginMethod public void zustand(PluginCall call) {
        worker.execute(() -> {
            String uri = prefs().getString("uri", ""), id = prefs().getString("id", "");
            if (uri.isEmpty()) { call.resolve(new JSObject().put("status", "getrennt")); return; }
            try {
                SafAblage a = ablage(uri);
                if (!id.equals(TresorOrdner.kennung(a))) throw new IOException("FA_TRESOR_FREMDE_KENNUNG");
                if (a.gibtEs(Umzug.VERMERK)) throw new IOException("FA_TRESOR_UMGEZOGEN");
                call.resolve(new JSObject().put("status", adapter == null ? "gesperrt" : "offen").put("id", id).put("ort", uri));
            } catch (Exception e) {
                if (adapter != null) { adapter.close(); adapter = null; }
                call.resolve(new JSObject().put("status", "nicht_erreichbar").put("id", id).put("ort", uri));
            }
        });
    }
    @PluginMethod public void verbinden(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "gewaehlt");
    }
    @ActivityCallback private void gewaehlt(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.reject("Ordnerwahl abgebrochen", "FA_TRESOR_ABGEBROCHEN"); return;
        }
        String uri = data.getData().toString();
        try {
            int benoetigt = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
            if ((data.getFlags() & benoetigt) != benoetigt) throw new IOException("FA_TRESOR_FREIGABE_FEHLT");
            getContext().getContentResolver().takePersistableUriPermission(data.getData(),
                Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            dialog(call, uri, null);
        } catch (Exception e) { ungenutztFreigeben(uri); fehler(call, e); }
    }
    @PluginMethod public void entsperren(PluginCall call) {
        dialog(call, prefs().getString("uri", ""), prefs().getString("id", ""));
    }
    private void dialog(PluginCall call, String uri, String erwartet) {
        getActivity().runOnUiThread(() -> {
            EditText feld = new EditText(getContext());
            feld.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            feld.setSaveEnabled(false);
            new AlertDialog.Builder(getActivity()).setTitle("Pro-Tresor entsperren").setView(feld)
                .setMessage("Passwort des vorhandenen gemeinsamen Tresors. Es wird kein neuer Tresor angelegt.")
                .setNegativeButton("Abbrechen", (d, w) -> { feld.setText(""); ungenutztFreigeben(uri); call.reject("Abgebrochen", "FA_TRESOR_ABGEBROCHEN"); })
                .setOnCancelListener(d -> { feld.setText(""); ungenutztFreigeben(uri); call.reject("Abgebrochen", "FA_TRESOR_ABGEBROCHEN"); })
                .setPositiveButton("Entsperren", (d, w) -> {
                    char[] geheim = new char[feld.length()];
                    feld.getText().getChars(0, feld.length(), geheim, 0); feld.setText("");
                    worker.execute(() -> {
                        try {
                            SafAblage a = ablage(uri);
                            String id = erwartet == null ? TresorOrdner.kennung(a) : erwartet;
                            ProTresorAdapter neu = ProTresorAdapter.oeffnen(a, id, java.nio.CharBuffer.wrap(geheim));
                            String vorher = prefs().getString("uri", "");
                            if (!prefs().edit().putString("uri", uri).putString("id", id).commit()) {
                                neu.close(); throw new IOException("FA_TRESOR_ORT_NICHT_GESPEICHERT");
                            }
                            if (adapter != null) adapter.close();
                            adapter = neu;
                            ungenutztFreigeben(vorher);
                            call.resolve(new JSObject().put("id", id).put("ort", uri).put("status", "offen"));
                        } catch (Exception e) { ungenutztFreigeben(uri); fehler(call, e); }
                        finally { java.util.Arrays.fill(geheim, '\0'); }
                    });
                }).show();
        });
    }
    private ProTresorAdapter offen(PluginCall call) throws IOException {
        if (adapter == null) throw new IOException("FA_TRESOR_GESPERRT");
        if (!adapter.kennung().equals(call.getString("vaultId", ""))) throw new IOException("FA_TRESOR_FREMDE_KENNUNG");
        return adapter;
    }
    @PluginMethod public void speichern(PluginCall call) {
        worker.execute(() -> {
            try {
                ProTresorAdapter p = offen(call);
                String data = call.getString("data", "");
                if (data.length() > ((ProTresorAdapter.MAX_BYTES + 2L) / 3) * 4) throw new IOException("FA_DOKUMENT_ZU_GROSS");
                byte[] bytes = Base64.decode(data, Base64.NO_WRAP);
                Eintrag e = p.ablegen(call.getString("documentId", ""), call.getString("name", ""), call.getString("mime", ""),
                    call.getData().optLong("date", 0), new ByteArrayInputStream(bytes));
                call.resolve(new JSObject().put("entryId", e.id).put("vaultId", p.kennung()).put("sha256", e.sha256).put("size", e.groesse));
            } catch (Exception e) { fehler(call, e); }
        });
    }
    @PluginMethod public void lesen(PluginCall call) {
        worker.execute(() -> {
            try { byte[] bytes = offen(call).lesen(call.getString("entryId", ""));
                call.resolve(new JSObject().put("data", Base64.encodeToString(bytes, Base64.NO_WRAP)));
            } catch (Exception e) { fehler(call, e); }
        });
    }
    @PluginMethod public void sperren(PluginCall call) {
        worker.execute(() -> { if (adapter != null) adapter.close(); adapter = null; call.resolve(); });
    }
    @Override protected void handleOnDestroy() {
        worker.execute(() -> { if (adapter != null) adapter.close(); adapter = null; });
        worker.shutdown();
    }
}
