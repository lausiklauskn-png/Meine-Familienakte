package de.familyprojekt.familienakte;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Ausloggen = App schließen (Klaus 09.11.2026: „Türchen auf, raus, App schließen“ – vorher lud „Ausloggen“ nur neu und die App
 * flackerte). Der Pro-Tresor wird vorher in der Seite gesperrt; hier endet die Aktivität und die App verschwindet aus den
 * zuletzt benutzten Apps. Es wird nichts gelöscht.
 */
@CapacitorPlugin(name = "FamilienakteApp")
public class FamilienakteAppPlugin extends Plugin {
    @PluginMethod public void beenden(PluginCall call) {
        call.resolve(new JSObject().put("beendet", true));
        getActivity().runOnUiThread(() -> getActivity().finishAndRemoveTask());
    }
}
