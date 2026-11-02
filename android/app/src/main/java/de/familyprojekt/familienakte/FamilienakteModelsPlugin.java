package de.familyprojekt.familienakte;

import android.content.Context;
import android.net.Uri;
import android.webkit.WebResourceResponse;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import de.familyprojekt.privatebrain.pro.FamilyModels;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FamilyModels")
public class FamilienakteModelsPlugin extends Plugin {
    private static FamilyModels instance;
    private static String pins(Context context, String name) throws Exception {
        try (var in = context.getAssets().open("public/native/" + name); var out = new java.io.ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            for (int n; (n = in.read(buffer)) != -1;) { if (out.size() + n > 100000) throw new java.io.IOException("MODEL_PINS_INVALID"); out.write(buffer, 0, n); }
            return new String(out.toByteArray(), StandardCharsets.UTF_8);
        }
    }
    private static synchronized FamilyModels models(Context context) throws Exception {
        if (instance == null) {
            instance = new FamilyModels(new File(context.getFilesDir(), "private-modelle").getCanonicalFile(), pins(context, "meaning-models.json"), pins(context, "semantic-model.json"));
        }
        return instance;
    }
    private void call(PluginCall call, String method) {
        try {
            FamilyModels m = models(getContext()); String stage = call.getString("stage", "");
            var result = switch (method) {
                case "getState" -> m.state();
                case "install" -> m.install(stage);
                case "cancel" -> m.cancel(stage);
                case "remove" -> m.remove(stage);
                default -> throw new IllegalArgumentException("MODEL_METHOD_INVALID");
            };
            call.resolve(new JSObject(result.put("localAssets", true).toString()));
        } catch (Exception error) { call.reject(error.getMessage(), "MODEL_ACTION_FAILED"); }
    }
    @PluginMethod public void getState(PluginCall call) { call(call, "getState"); }
    @PluginMethod public void install(PluginCall call) { call(call, "install"); }
    @PluginMethod public void cancel(PluginCall call) { call(call, "cancel"); }
    @PluginMethod public void remove(PluginCall call) { call(call, "remove"); }

    /** Same-origin assets stay usable with the app internet switch off. Missing
     * or corrupt assets return locally; they never fall through to the network. */
    static WebResourceResponse asset(Context context, Uri uri) {
        if (!"https".equals(uri.getScheme()) || !"localhost".equals(uri.getHost()) || uri.getPort() != -1 ||
            uri.getPath() == null || !uri.getPath().startsWith("/_fa_models/")) return null;
        try {
            if (uri.getQuery() != null || uri.getFragment() != null) throw new IllegalArgumentException();
            String[] parts = uri.getPath().substring("/_fa_models/".length()).split("/", 2);
            if (parts.length != 2) throw new IllegalArgumentException();
            File file = models(context).asset(parts[0], parts[1]);
            String mime = file.getName().endsWith(".js") ? "text/javascript" : file.getName().endsWith(".json") ? "application/json" : file.getName().endsWith(".wasm") ? "application/wasm" : "application/octet-stream";
            return new WebResourceResponse(mime, "UTF-8", 200, "OK", java.util.Collections.singletonMap("Cache-Control", "no-store"), new FileInputStream(file));
        } catch (Exception error) {
            return new WebResourceResponse("text/plain", "UTF-8", 404, "Local model unavailable", java.util.Collections.singletonMap("Cache-Control", "no-store"), new ByteArrayInputStream(new byte[0]));
        }
    }
}
