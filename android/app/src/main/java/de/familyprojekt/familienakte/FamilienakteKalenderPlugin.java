package de.familyprojekt.familienakte;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
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

/**
 * Fristen in einen Kalender auf dem Gerät (Klaus 2026-11-05): Samsung-Kalender, Google-Konten und Outlook-Konten, die das
 * Gerät führt. Schreibt über CalendarContract Termin und Erinnerungen; den Abgleich mit Google oder Samsung macht das Gerät
 * selbst. Die Rechte „Kalender“ werden erst beim Verbinden erfragt. Gelesen werden die Liste der Kalender, eigene Einträge
 * (über ihre Nummer) und – seit Stufe D, nur auf ausdrücklichen Wunsch je Kalender – die Termine des gewählten Kalenders,
 * damit sie als Fristen in der Akte stehen. Fremde Termine werden dabei nie verändert oder gelöscht.
 */
@CapacitorPlugin(name = "FamilienakteKalender", permissions = {
    @Permission(alias = "kalender", strings = { Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR })
})
public class FamilienakteKalenderPlugin extends Plugin {
    private static final int MAX_ERINNERUNGEN = 5;

    private boolean erlaubt() { return getPermissionState("kalender") == PermissionState.GRANTED; }

    @PluginMethod public void zustand(PluginCall call) { call.resolve(new JSObject().put("erlaubt", erlaubt())); }

    @PluginMethod public void erlauben(PluginCall call) {
        if (erlaubt()) { call.resolve(new JSObject().put("erlaubt", true)); return; }
        requestPermissionForAlias("kalender", call, "erlaubenZurueck");
    }

    @PermissionCallback private void erlaubenZurueck(PluginCall call) { call.resolve(new JSObject().put("erlaubt", erlaubt())); }

    /** Kalender, in die man schreiben darf (mindestens „Mitwirkender“), sichtbar. */
    @PluginMethod public void kalender(PluginCall call) {
        if (!erlaubt()) { call.reject("FA_KALENDER_KEIN_RECHT"); return; }
        String[] spalten = { CalendarContract.Calendars._ID, CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, CalendarContract.Calendars.ACCOUNT_NAME,
            CalendarContract.Calendars.ACCOUNT_TYPE, CalendarContract.Calendars.CALENDAR_COLOR, CalendarContract.Calendars.IS_PRIMARY };
        String wo = CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL + " >= ? AND " + CalendarContract.Calendars.VISIBLE + " = 1";
        JSArray liste = new JSArray();
        try (Cursor c = getContext().getContentResolver().query(CalendarContract.Calendars.CONTENT_URI, spalten, wo,
                new String[] { String.valueOf(CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR) }, null)) {
            while (c != null && c.moveToNext()) {
                liste.put(new JSObject().put("id", String.valueOf(c.getLong(0))).put("name", text(c, 1)).put("konto", text(c, 2))
                    .put("kontoTyp", text(c, 3)).put("farbe", String.format("#%06X", 0xFFFFFF & c.getInt(4))).put("haupt", c.getInt(5) == 1));
            }
            call.resolve(new JSObject().put("kalender", liste));
        } catch (Exception fehler) { call.reject("FA_KALENDER_LESEN"); }
    }

    /** Legt einen Termin an oder ändert den eigenen (eintragId). Erinnerungen werden jedes Mal neu gesetzt. */
    @PluginMethod public void schreiben(PluginCall call) {
        if (!erlaubt()) { call.reject("FA_KALENDER_KEIN_RECHT"); return; }
        String kalenderId = call.getString("kalenderId", "");
        String titel = call.getString("titel", "");
        Long beginn = call.getLong("beginn"), ende = call.getLong("ende");
        if (!kalenderId.matches("\\d{1,18}") || titel.isEmpty() || titel.length() > 300 || beginn == null || ende == null || ende <= beginn) { call.reject("INVALID_INPUT"); return; }
        ContentResolver cr = getContext().getContentResolver();
        ContentValues werte = new ContentValues();
        werte.put(CalendarContract.Events.CALENDAR_ID, Long.parseLong(kalenderId));
        werte.put(CalendarContract.Events.TITLE, titel);
        werte.put(CalendarContract.Events.DTSTART, beginn);
        werte.put(CalendarContract.Events.DTEND, ende);
        werte.put(CalendarContract.Events.EVENT_TIMEZONE, call.getString("zeitzone", java.util.TimeZone.getDefault().getID()));
        // Stufe D: ein eingelesener Termin des Nutzers (ohne „beschreibung“ im Aufruf) bekommt nur Titel und Zeit; Beschreibung,
        // Sichtbarkeit, Erinnerungen und UID bleiben seine eigenen.
        boolean eigener = call.getData().has("beschreibung");
        JSONArray erinnerungen = call.getArray("erinnerungen", new JSArray());
        if (eigener) {
            werte.put(CalendarContract.Events.DESCRIPTION, call.getString("beschreibung", ""));
            werte.put(CalendarContract.Events.ACCESS_LEVEL, CalendarContract.Events.ACCESS_PRIVATE);
            werte.put(CalendarContract.Events.AVAILABILITY, CalendarContract.Events.AVAILABILITY_FREE);
            String uid = call.getString("uid", "");
            if (!uid.isEmpty() && uid.length() <= 200) werte.put(CalendarContract.Events.UID_2445, uid);
            werte.put(CalendarContract.Events.HAS_ALARM, erinnerungen.length() > 0 ? 1 : 0);
        }
        try {
            long id = -1;
            String alt = call.getString("eintragId", "");
            if (alt.matches("\\d{1,18}") && vorhanden(cr, Long.parseLong(alt))) {
                id = Long.parseLong(alt);
                cr.update(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id), werte, null, null);
                if (eigener) cr.delete(CalendarContract.Reminders.CONTENT_URI, CalendarContract.Reminders.EVENT_ID + " = ?", new String[] { String.valueOf(id) });
            } else {
                Uri neu = cr.insert(CalendarContract.Events.CONTENT_URI, werte);
                if (neu == null) { call.reject("FA_KALENDER_SCHREIBEN"); return; }
                id = ContentUris.parseId(neu);
            }
            for (int i = 0; eigener && i < Math.min(erinnerungen.length(), MAX_ERINNERUNGEN); i++) {
                int minuten = erinnerungen.optInt(i, -1);
                if (minuten < 0 || minuten > 40320) continue;
                ContentValues r = new ContentValues();
                r.put(CalendarContract.Reminders.EVENT_ID, id);
                r.put(CalendarContract.Reminders.MINUTES, minuten);
                r.put(CalendarContract.Reminders.METHOD, CalendarContract.Reminders.METHOD_ALERT);
                cr.insert(CalendarContract.Reminders.CONTENT_URI, r);
            }
            call.resolve(new JSObject().put("eintragId", String.valueOf(id)));
        } catch (Exception fehler) { call.reject("FA_KALENDER_SCHREIBEN"); }
    }

    /** Stufe D: Termine eines Kalenders im Zeitfenster lesen (Instanzen, also auch Wiederholungen aufgelöst). Nur dieser Kalender. */
    @PluginMethod public void lesen(PluginCall call) {
        if (!erlaubt()) { call.reject("FA_KALENDER_KEIN_RECHT"); return; }
        String kalenderId = call.getString("kalenderId", "");
        Long von = call.getLong("von"), bis = call.getLong("bis");
        if (!kalenderId.matches("\\d{1,18}") || von == null || bis == null || bis <= von) { call.reject("INVALID_INPUT"); return; }
        Uri.Builder b = CalendarContract.Instances.CONTENT_URI.buildUpon();
        ContentUris.appendId(b, von); ContentUris.appendId(b, bis);
        String[] spalten = { CalendarContract.Instances.EVENT_ID, CalendarContract.Instances.TITLE, CalendarContract.Instances.BEGIN, CalendarContract.Instances.END,
            CalendarContract.Instances.ALL_DAY, CalendarContract.Instances.DESCRIPTION, CalendarContract.Instances.UID_2445, CalendarContract.Instances.DIRTY };
        JSArray termine = new JSArray();
        try (Cursor c = getContext().getContentResolver().query(b.build(), spalten, CalendarContract.Instances.CALENDAR_ID + " = ?", new String[] { kalenderId }, CalendarContract.Instances.BEGIN + " ASC")) {
            int n = 0;
            while (c != null && c.moveToNext() && n++ < 2000) {
                JSObject t = new JSObject();
                t.put("eintragId", String.valueOf(c.getLong(0))).put("titel", text(c, 1)).put("beginn", c.getLong(2)).put("ende", c.getLong(3))
                    .put("ganztags", c.getInt(4) == 1).put("beschreibung", text(c, 5)).put("uid", text(c, 6));
                termine.put(t);
            }
            call.resolve(new JSObject().put("termine", termine));
        } catch (Exception fehler) { call.reject("FA_KALENDER_LESEN"); }
    }

    @PluginMethod public void entfernen(PluginCall call) {
        if (!erlaubt()) { call.reject("FA_KALENDER_KEIN_RECHT"); return; }
        String id = call.getString("eintragId", "");
        if (!id.matches("\\d{1,18}")) { call.reject("INVALID_INPUT"); return; }
        try {
            getContext().getContentResolver().delete(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, Long.parseLong(id)), null, null);
            call.resolve(new JSObject().put("entfernt", true));
        } catch (Exception fehler) { call.reject("FA_KALENDER_SCHREIBEN"); }
    }

    private static boolean vorhanden(ContentResolver cr, long id) {
        try (Cursor c = cr.query(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id), new String[] { CalendarContract.Events._ID, CalendarContract.Events.DELETED }, null, null, null)) {
            return c != null && c.moveToFirst() && c.getInt(1) == 0;
        }
    }

    private static String text(Cursor c, int i) { String s = c.getString(i); return s == null ? "" : s; }
}
