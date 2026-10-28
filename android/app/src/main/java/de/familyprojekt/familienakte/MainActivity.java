package de.familyprojekt.familienakte;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.util.Arrays;

/**
 * Hülle um den unveränderten Vite-Build (dist/). Eigene Seiten nur von https://localhost; jede andere
 * Adresse geht an den Browser bzw. die zuständige App, nie in dieses Fenster. Vorbild: BookLedgerPro
 * MainActivity (f6633c8) und Private Brain Pro (b0a28dd).
 */
public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle state) {
        AppNetwork.initialize(this);
        registerPlugin(FamilienakteNetworkPlugin.class);
        registerPlugin(FamilienakteSpeechPlugin.class);
        registerPlugin(FamilienakteSharePlugin.class);
        super.onCreate(state);
        if (bridge == null) return;
        // Internetschalter (Standard aus): auch Bilder, Schriften und der Service Worker bleiben im Gerät.
        bridge.getWebView().getSettings().setBlockNetworkLoads(AppNetwork.isOffline());
        bridge.getWebView().setNetworkAvailable(!AppNetwork.isOffline());
        bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && "localhost".equals(uri.getHost()) && uri.getPort() == -1)
                    return super.shouldOverrideUrlLoading(view, request);
                boolean erlaubt = request.isForMainFrame() && Arrays.asList("http", "https", "mailto", "tel").contains(uri.getScheme()) && request.hasGesture() && !AppNetwork.isOffline();
                if (erlaubt) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); }
                    catch (Exception none) { android.widget.Toast.makeText(MainActivity.this, "Keine App für diese Adresse", android.widget.Toast.LENGTH_SHORT).show(); }
                } else if (AppNetwork.isOffline() && request.isForMainFrame()) {
                    android.widget.Toast.makeText(MainActivity.this, "Internet für die App ist aus", android.widget.Toast.LENGTH_SHORT).show();
                }
                return true;
            }
        });
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (bridge == null) { moveTaskToBack(true); return; }
                WebView web = bridge.getWebView();
                if (web.canGoBack()) web.goBack(); else moveTaskToBack(true);
            }
        });
    }
}
