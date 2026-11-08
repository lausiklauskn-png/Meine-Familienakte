package de.familyprojekt.familienakte;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

/** Vordergrunddienst mit Dauer-Meldung (Stufe E). Zeigt nur Text und Fortschritt; die Daten bleiben in der App. */
public class ArbeitDienst extends Service {
    static final String KANAL = "familienakte_arbeit";
    static final int ID = 4711;
    private static String titel = "Familienakte arbeitet", text = "";
    private static int fortschritt = -1, gesamt = -1;

    static void kanal(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;   // Kanäle gibt es erst ab Android 8
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm != null && nm.getNotificationChannel(KANAL) == null) {
            NotificationChannel k = new NotificationChannel(KANAL, "Arbeit im Hintergrund (Eingangsordner)", NotificationManager.IMPORTANCE_LOW);
            k.setDescription("Zeigt, solange die Familienakte Dateien aus dem Eingangsordner verarbeitet.");
            nm.createNotificationChannel(k);
        }
    }
    static Notification meldung(Context ctx) {
        kanal(ctx);
        Intent offen = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        PendingIntent tipp = offen == null ? null : PendingIntent.getActivity(ctx, 0, offen, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, KANAL)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle(titel).setContentText(text).setOngoing(true).setOnlyAlertOnce(true).setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW);
        if (tipp != null) b.setContentIntent(tipp);
        if (gesamt > 0 && fortschritt >= 0) b.setProgress(gesamt, Math.min(fortschritt, gesamt), false);
        return b.build();
    }
    static void aktualisieren(Context ctx, String neuerText, int f, int g) {
        text = neuerText == null ? "" : neuerText; fortschritt = f; gesamt = g;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm != null) { try { nm.notify(ID, meldung(ctx)); } catch (Exception ignoriert) { /* ohne Erlaubnis keine Leiste */ } }
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) { titel = intent.getStringExtra("titel") == null ? titel : intent.getStringExtra("titel"); text = intent.getStringExtra("text") == null ? "" : intent.getStringExtra("text"); }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) startForeground(ID, meldung(this), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            else startForeground(ID, meldung(this));
        } catch (Exception e) { stopSelf(); return START_NOT_STICKY; }
        return START_NOT_STICKY;
    }
    @Override public void onDestroy() { fortschritt = -1; gesamt = -1; super.onDestroy(); }
    @Override public IBinder onBind(Intent intent) { return null; }
}
