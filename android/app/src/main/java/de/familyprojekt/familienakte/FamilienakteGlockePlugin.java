package de.familyprojekt.familienakte;

import android.Manifest;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * App-Glocke auch bei geschlossener App (Klaus 2026-11-06): die Erinnerungszeiten aus der Familienakte werden als
 * Android-Wecker eingeplant; zur Zeit zeigt GlockeEmpfaenger eine Benachrichtigung. Nur Titel und Uhrzeit, keine Notizen.
 * Geplant wird mit setAndAllowWhileIdle (kein Sonderrecht „genaue Wecker“); Android kann im Ruhemodus um einige Minuten
 * verschieben. Die geplante Liste bleibt im Vorrat; nach einem Neustart des Geräts (oder einem Update der App) plant
 * StartEmpfaenger sie erneut ein – Android verwirft alle Wecker beim Ausschalten (Stufe H, Plan 08.11.2026).
 */
@CapacitorPlugin(name = "FamilienakteGlocke", permissions = {
    @Permission(alias = "melden", strings = { Manifest.permission.POST_NOTIFICATIONS })
})
public class FamilienakteGlockePlugin extends Plugin {
    private static final String VORRAT = "familienakte_glocke";
    private static final int MAX = 50;

    private boolean erlaubt() {
        return Build.VERSION.SDK_INT < 33 || getPermissionState("melden") == PermissionState.GRANTED;
    }

    @PluginMethod public void erlauben(PluginCall call) {
        if (erlaubt()) { call.resolve(new JSObject().put("erlaubt", true)); return; }
        requestPermissionForAlias("melden", call, "erlaubenZurueck");
    }

    @PermissionCallback private void erlaubenZurueck(PluginCall call) { call.resolve(new JSObject().put("erlaubt", erlaubt())); }

    /** Öffnet Androids Einstellung für den Kanal „Erinnerungen (App-Glocke)“: Ton, Vibration, Lautstärke (Klaus 2026-11-06). */
    @PluginMethod public void einstellungen(PluginCall call) {
        Context ctx = getContext();
        GlockeEmpfaenger.kanalAnlegen(ctx);
        Intent i;
        if (Build.VERSION.SDK_INT >= 26) {
            i = new Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, ctx.getPackageName())
                .putExtra(Settings.EXTRA_CHANNEL_ID, GlockeEmpfaenger.KANAL);
        } else {
            i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, android.net.Uri.parse("package:" + ctx.getPackageName()));
        }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { ctx.startActivity(i); call.resolve(); } catch (Exception fehler) { call.reject("FA_GLOCKE_EINSTELLUNG"); }
    }

    /** Ersetzt alle geplanten Glocken durch die übergebene Liste [{ nr, titel, text, um }]; leere Liste = alle aus. */
    @PluginMethod public void planen(PluginCall call) {
        Context ctx = getContext();
        JSONArray liste = call.getArray("glocken", new JSArray());
        // Glocke aus: auch schon angezeigte Meldungen dieser App aus der Leiste nehmen (Nutzer 08.11.2026).
        if (Boolean.TRUE.equals(call.getBoolean("aus", false))) { try { androidx.core.app.NotificationManagerCompat.from(ctx).cancelAll(); } catch (Exception ignoriert) { /* nichts angezeigt */ } }
        int n = einplanen(ctx, liste);
        ctx.getSharedPreferences(VORRAT, Context.MODE_PRIVATE).edit().putString("liste", liste.toString()).apply();
        call.resolve(new JSObject().put("geplant", n).put("erlaubt", erlaubt()));
    }

    /** Plant die Liste als Wecker ein (vorher alle alten weg); nur kommende Zeiten. Auch vom StartEmpfaenger nach dem Neustart gerufen. */
    static int einplanen(Context ctx, JSONArray liste) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        SharedPreferences vorrat = ctx.getSharedPreferences(VORRAT, Context.MODE_PRIVATE);
        int alt = vorrat.getInt("anzahl", 0);
        for (int i = 0; i < alt; i++) am.cancel(absicht(ctx, i, "", ""));
        long jetzt = System.currentTimeMillis();
        int n = 0;
        for (int i = 0; i < liste.length() && n < MAX; i++) {
            JSONObject g = liste.optJSONObject(i);
            if (g == null) continue;
            long um = g.optLong("um", 0);
            String titel = g.optString("titel", "");
            if (um <= jetzt || titel.isEmpty()) continue;
            String text = g.optString("text", "");
            PendingIntent pi = absicht(ctx, n, titel.length() > 120 ? titel.substring(0, 120) : titel, text.length() > 160 ? text.substring(0, 160) : text);
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, um, pi);
            n++;
        }
        vorrat.edit().putInt("anzahl", n).apply();
        return n;
    }

    /** Die zuletzt von der App übergebene Liste (für den Neustart); leer, wenn nie geplant oder Glocke aus. */
    static JSONArray gemerkteListe(Context ctx) {
        try { return new JSONArray(ctx.getSharedPreferences(VORRAT, Context.MODE_PRIVATE).getString("liste", "[]")); } catch (Exception fehler) { return new JSONArray(); }
    }

    private static PendingIntent absicht(Context ctx, int nr, String titel, String text) {
        Intent i = new Intent(ctx, GlockeEmpfaenger.class);
        i.setAction("de.familyprojekt.familienakte.GLOCKE_" + nr);
        i.putExtra("nr", nr);
        i.putExtra("titel", titel);
        i.putExtra("text", text);
        return PendingIntent.getBroadcast(ctx, 4200 + nr, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
