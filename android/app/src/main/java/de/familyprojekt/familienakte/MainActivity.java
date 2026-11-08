package de.familyprojekt.familienakte;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.view.View;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
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
        FamilyOutputCache.start(this);
        registerPlugin(de.familyprojekt.workflowpdf.pro.ProFilesPlugin.class);
        registerPlugin(FamilienakteNetworkPlugin.class);
        registerPlugin(FamilienakteSpeechPlugin.class);
        registerPlugin(FamilienakteSharePlugin.class);
        registerPlugin(FamilienakteUpdatesPlugin.class);
        registerPlugin(FamilienakteTresorPlugin.class);
        registerPlugin(FamilienakteDevicePlugin.class);
        registerPlugin(FamilienakteModelsPlugin.class);
        registerPlugin(FamilienakteDruckPlugin.class);
        registerPlugin(FamilienakteKalenderPlugin.class);
        registerPlugin(FamilienakteGlockePlugin.class);
        registerPlugin(FamilienakteOrdnerPlugin.class);
        registerPlugin(FamilienakteArbeitPlugin.class);
        registerPlugin(FamilienakteNetzPlugin.class);
        super.onCreate(state);
        vollbild();
        if (bridge == null) return;
        freiVonLeisten((View) bridge.getWebView().getParent());
        // Internetschalter (Standard aus): auch Bilder, Schriften und der Service Worker bleiben im Gerät.
        // Textzoom fest 100 %: die WebView vergrößert sonst nur den Text nach der System-Schriftgröße (Chrome zoomt die
        // ganze Seite). Folge war eine 1,5-fach große, zerschossene Darstellung gegenüber der PWA (Klaus 2026-10-28).
        bridge.getWebView().getSettings().setTextZoom(100);
        bridge.getWebView().getSettings().setBlockNetworkLoads(AppNetwork.isOffline());
        bridge.getWebView().setNetworkAvailable(!AppNetwork.isOffline());
        bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                var local = FamilienakteModelsPlugin.asset(MainActivity.this, request.getUrl());
                return local != null ? local : super.shouldInterceptRequest(view, request);
            }
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
                if (bridge == null) return;
                WebView web = bridge.getWebView();
                // Back belongs to the document/view history. Reaching its beginning
                // never closes or backgrounds the app (also for a mouse Back key).
                web.evaluateJavascript("window.familienakteZurueck?.() === true", handled -> {
                    if (!"true".equals(handled) && web.canGoBack()) web.goBack();
                });
            }
        });
    }

    /**
     * Immer Vollbild (Klaus 07.11.2026): Status- und Navigationsleiste ausblenden; ein Wischen vom Rand holt sie kurz zurück.
     * Drehen: android:screenOrientation="fullUser" im Manifest (alle vier Lagen, die Drehsperre des Geräts gilt).
     */
    private void vollbild() {
        WindowInsetsControllerCompat leisten = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        leisten.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        leisten.hide(WindowInsetsCompat.Type.systemBars());
    }

    /**
     * Geteilter Bildschirm und Fenster (Klaus 08.11.2026, Galaxy Tab S6): dort blendet Android die Navigationsleiste ein und
     * lässt sich nicht ausblenden; die randlose App lag dann darunter. Die Hülle hält so viel Rand, wie die gerade sichtbaren
     * Systemleisten brauchen – im Vollbild sind sie ausgeblendet, der Rand ist 0 und nichts verschiebt sich.
     */
    private static void freiVonLeisten(View huelle) {
        if (huelle == null) return;
        ViewCompat.setOnApplyWindowInsetsListener(huelle, (v, insets) -> {
            Insets rand = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(rand.left, rand.top, rand.right, rand.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(huelle);
    }

    @Override public void onMultiWindowModeChanged(boolean geteilt, android.content.res.Configuration neu) {
        super.onMultiWindowModeChanged(geteilt, neu);
        vollbild();
        if (bridge != null) ViewCompat.requestApplyInsets((View) bridge.getWebView().getParent());
    }

    @Override public void onWindowFocusChanged(boolean fokus) {
        super.onWindowFocusChanged(fokus);
        // Nach Dialogen, Teilen-Fenstern oder dem Wechsel aus einer anderen App wieder ausblenden.
        if (fokus) vollbild();
    }
}
