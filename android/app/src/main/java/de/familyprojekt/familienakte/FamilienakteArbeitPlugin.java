package de.familyprojekt.familienakte;

import android.content.Intent;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Stufe E (Plan 08.11.2026): Dauer-Meldung, solange die App im Hintergrund Blöcke aus dem Eingangsordner verarbeitet.
 * Ein Vordergrunddienst (ArbeitDienst) hält den Prozess wach und zeigt den Fortschritt; die Arbeit selbst läuft weiter
 * in der WebView. Ohne Erlaubnis für Meldungen startet der Dienst trotzdem (die Leiste zeigt dann nichts), damit
 * die Arbeit nicht abbricht.
 */
@CapacitorPlugin(name = "FamilienakteArbeit")
public class FamilienakteArbeitPlugin extends Plugin {
    @PluginMethod public void start(PluginCall call) {
        Intent i = new Intent(getContext(), ArbeitDienst.class)
            .putExtra("titel", call.getString("titel", "Familienakte arbeitet"))
            .putExtra("text", call.getString("text", ""));
        try { ContextCompat.startForegroundService(getContext(), i); call.resolve(new JSObject().put("gestartet", true)); }
        catch (Exception e) { call.reject("FA_ARBEIT_START", "FA_ARBEIT_START"); }
    }
    @PluginMethod public void update(PluginCall call) {
        Integer fortschritt = call.getInt("fortschritt"), gesamt = call.getInt("gesamt");
        ArbeitDienst.aktualisieren(getContext(), call.getString("text", ""), fortschritt == null ? -1 : fortschritt, gesamt == null ? -1 : gesamt);
        call.resolve(new JSObject().put("ok", true));
    }
    @PluginMethod public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), ArbeitDienst.class));
        call.resolve(new JSObject().put("ok", true));
    }
}
