package de.familyprojekt.familienakte;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Drucken der angezeigten Seite (Nutzerbefund 2026-11-04: der Drucker-Knopf tat in der App nichts, weil die
 * Android-WebView window.print() nicht ausführt). Gibt die Seite an Androids Druckdienst; dort wählt man Drucker
 * oder „Als PDF speichern“. Es wird nichts gespeichert oder gesendet, bevor der Nutzer im Druckdialog bestätigt.
 */
@CapacitorPlugin(name = "FamilienakteDruck")
public class FamilienakteDruckPlugin extends Plugin {
    @PluginMethod public void seite(PluginCall call) {
        String titel = call.getString("titel", "Familienakte");
        getActivity().runOnUiThread(() -> {
            try {
                PrintManager manager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                if (manager == null) { call.reject("FA_DRUCK_NICHT_VERFUEGBAR"); return; }
                PrintDocumentAdapter adapter = getBridge().getWebView().createPrintDocumentAdapter(titel);
                manager.print(titel, adapter, new PrintAttributes.Builder().build());
                call.resolve(new JSObject().put("geoeffnet", true));
            } catch (Exception fehler) {
                call.reject("FA_DRUCK_NICHT_VERFUEGBAR");
            }
        });
    }
}
