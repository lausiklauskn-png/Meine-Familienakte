package de.familyprojekt.familienakte;

import android.content.Context;
import java.io.IOException;

/** Internetschalter der App (nur diese App, kein WLAN-Eingriff). Abgeleitet aus Private Brain Pro AppNetwork (b0a28dd). */
final class AppNetwork {
    private static volatile boolean offline = true;
    static synchronized void initialize(Context context) {
        // Standard AUS (Brief Teil 2); der Zustand überlebt den Neustart.
        offline = context.getSharedPreferences("app-network", Context.MODE_PRIVATE).getBoolean("offline", true);
    }
    static boolean isOffline() { return offline; }
    static synchronized void setOffline(Context context, boolean value) throws IOException {
        if (!context.getSharedPreferences("app-network", Context.MODE_PRIVATE).edit().putBoolean("offline", value).commit())
            throw new IOException("Network setting unavailable");
        offline = value;
    }
}
