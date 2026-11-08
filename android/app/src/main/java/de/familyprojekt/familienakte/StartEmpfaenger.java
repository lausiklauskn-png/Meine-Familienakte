package de.familyprojekt.familienakte;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Stufe H (Plan 08.11.2026): Android verwirft alle Wecker beim Ausschalten. Nach dem Neustart des Geräts (und nach einem
 * Update der App) plant dieser Empfänger die zuletzt von der App übergebene Glocken-Liste erneut ein – ohne die App zu öffnen,
 * ohne Netz, ohne Inhalte zu lesen: im Vorrat liegen nur Titel, Kurztext und Uhrzeit.
 */
public class StartEmpfaenger extends BroadcastReceiver {
    @Override public void onReceive(Context ctx, Intent intent) {
        String a = intent == null ? null : intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(a) && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(a) && !"android.intent.action.LOCKED_BOOT_COMPLETED".equals(a)) return;
        try { FamilienakteGlockePlugin.einplanen(ctx, FamilienakteGlockePlugin.gemerkteListe(ctx)); } catch (Exception ignoriert) { /* beim nächsten Öffnen plant die App neu */ }
    }
}
