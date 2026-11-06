package de.familyprojekt.familienakte;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

/** Zeigt zur geplanten Zeit die Benachrichtigung der App-Glocke; ein Tipp öffnet die App. */
public class GlockeEmpfaenger extends BroadcastReceiver {
    static final String KANAL = "familienakte_glocke";

    @Override public void onReceive(Context ctx, Intent intent) {
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            if (nm != null && nm.getNotificationChannel(KANAL) == null) {
                NotificationChannel k = new NotificationChannel(KANAL, "Erinnerungen (App-Glocke)", NotificationManager.IMPORTANCE_HIGH);
                k.setDescription("Erinnerungen aus der Familienakte");
                nm.createNotificationChannel(k);
            }
        }
        Intent oeffnen = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, oeffnen, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String titel = intent.getStringExtra("titel");
        String text = intent.getStringExtra("text");
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, KANAL)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle("🔔 " + (titel == null || titel.isEmpty() ? "Erinnerung" : titel))
            .setContentText(text == null ? "" : text)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(pi);
        try { NotificationManagerCompat.from(ctx).notify(4200 + intent.getIntExtra("nr", 0), b.build()); } catch (SecurityException ignoriert) { /* Recht entzogen */ }
    }
}
