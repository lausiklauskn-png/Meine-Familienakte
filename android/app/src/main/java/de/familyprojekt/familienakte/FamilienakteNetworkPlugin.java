package de.familyprojekt.familienakte;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Heißt „ProNetwork“, damit native-network.js (byte-gleich aus Private Brain Pro) es unverändert findet. */
@CapacitorPlugin(name = "ProNetwork")
public class FamilienakteNetworkPlugin extends Plugin {
    private void result(PluginCall call) { call.resolve(new JSObject().put("offline", AppNetwork.isOffline())); }
    @PluginMethod public void getState(PluginCall call) { result(call); }
    @PluginMethod public void setOffline(PluginCall call) {
        Boolean value = call.getBoolean("offline");
        if (value == null) { call.reject("Boolean offline required", "INVALID_INPUT"); return; }
        try {
            AppNetwork.setOffline(getContext(), value);
            getActivity().runOnUiThread(() -> {
                if (value) getBridge().getWebView().stopLoading();
                getBridge().getWebView().getSettings().setBlockNetworkLoads(value);
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N)
                    android.webkit.ServiceWorkerController.getInstance().getServiceWorkerWebSettings().setBlockNetworkLoads(value);
                getBridge().getWebView().setNetworkAvailable(!value);
                result(call);
            });
        } catch (Exception error) { call.reject("Network setting unavailable", "NETWORK_SETTING_FAILED"); }
    }
}
