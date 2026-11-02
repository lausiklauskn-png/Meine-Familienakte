package de.familyprojekt.familienakte;

import android.content.Context;
import java.io.File;
import java.util.concurrent.atomic.AtomicBoolean;

/** Family uses only save (not asynchronous sharing) from the canonical plugin.
 * A killed save may leave a ticket; discard those private copies once per process,
 * never when an Activity is merely recreated during a live system picker. */
final class FamilyOutputCache {
    private static final AtomicBoolean started = new AtomicBoolean();
    static void start(Context context) {
        if (!started.compareAndSet(false, true)) return;
        File root = new File(context.getCacheDir(), "workflow-exports");
        File[] tickets = root.listFiles();
        if (tickets == null) return;
        for (File ticket : tickets) {
            if (!ticket.getName().matches("[a-f0-9-]{36}")) continue;
            File[] files = ticket.listFiles();
            if (files != null) for (File file : files) file.delete();
            ticket.delete();
        }
    }
}
