package de.familyprojekt.familienakte;

import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Stufe F: Gastgeber-Dienst und Gast-Anfragen im eigenen Netz (NetzDienst). Alles abseits des Hauptfadens. */
@CapacitorPlugin(name = "FamilienakteNetz")
public final class FamilienakteNetzPlugin extends Plugin {
    private final NetzDienst dienst = new NetzDienst();
    private final ExecutorService worker = Executors.newCachedThreadPool();
    private interface Arbeit { JSObject run() throws Exception; }
    private void arbeit(PluginCall call, Arbeit a) {
        worker.execute(() -> { try { call.resolve(a.run()); } catch (Exception e) { call.reject("Netz", NetzDienst.code(e)); } });
    }
    private static JSObject js(Map<String, Object> m) { JSObject o = new JSObject(); for (Map.Entry<String, Object> e : m.entrySet()) { Object v = e.getValue(); if (v instanceof List) { JSArray a = new JSArray(); for (Object x : (List<?>) v) a.put(x instanceof Map ? js(castMap(x)) : x); o.put(e.getKey(), a); } else o.put(e.getKey(), v); } return o; }
    @SuppressWarnings("unchecked") private static Map<String, Object> castMap(Object x) { return (Map<String, Object>) x; }

    @PluginMethod public void start(PluginCall call) {
        arbeit(call, () -> {
            String ordner = call.getString("ordner", "netz-laufwerk");
            if (!ordner.matches("[A-Za-z0-9_-]{1,64}")) throw new Exception("FA_PFAD_UNGUELTIG");
            return js(dienst.start(new File(getContext().getFilesDir(), ordner), call.getString("token", ""), call.getString("kennung", ""), call.getString("name", ""), call.getInt("port", 0)));
        });
    }
    @PluginMethod public void stop(PluginCall call) { arbeit(call, () -> { dienst.stop(); return js(dienst.zustand()); }); }
    @PluginMethod public void zustand(PluginCall call) { arbeit(call, () -> js(dienst.zustand())); }
    @PluginMethod public void suchen(PluginCall call) {
        arbeit(call, () -> { JSArray a = new JSArray(); for (Map<String, Object> t : NetzDienst.suchen(call.getInt("ms", 2500))) a.put(js(t)); return new JSObject().put("treffer", a); });
    }
    /** Gast: eine Anfrage an den Gastgeber; Antwort als Base64 (höchstens 1 MiB + Kopf). */
    @PluginMethod public void anfrage(PluginCall call) {
        arbeit(call, () -> {
            String data = call.getString("data", "");
            byte[] body = data.isEmpty() ? null : Base64.decode(data, Base64.NO_WRAP);
            NetzDienst.Antwort a = NetzDienst.anfrage(call.getString("adresse", ""), call.getInt("port", 0), call.getString("token", ""), call.getString("methode", "GET"), call.getString("weg", "/"), body);
            return new JSObject().put("status", a.status).put("art", a.art).put("data", Base64.encodeToString(a.body, Base64.NO_WRAP));
        });
    }
}
