package de.familyprojekt.familienakte;

import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** The inherited measurement is byte-for-byte Private Brain Pro. Family does
 * not inherit its mail capability claim. */
@CapacitorPlugin(name = "ProDevice")
public class FamilienakteDevicePlugin extends de.familyprojekt.privatebrain.pro.ProDevicePlugin {
    @Override @PluginMethod public void getInfo(PluginCall call) {
        call.resolve(new JSObject().put("platform", "android").put("nativeMail", false));
    }
}
