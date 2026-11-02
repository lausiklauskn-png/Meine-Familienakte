package de.familyprojekt.privatebrain.pro;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;

/** Family adapter for the unchanged SemanticModel. The existing app internet
 * switch is the only authority; the initial state is offline. No preferences or UI here. */
final class AppNetwork {
    static final class Blocked extends IOException { Blocked() { super("APP_OFFLINE"); } }
    private static boolean offline = true;
    private static long generation;
    private static final HashSet<AutoCloseable> active = new HashSet<>();
    static synchronized long epoch() { return generation; }
    static synchronized void check(long expected) throws Blocked {
        if (offline || generation != expected) throw new Blocked();
    }
    static synchronized <T extends AutoCloseable> T track(T resource) throws Blocked {
        if (offline) { close(resource); throw new Blocked(); }
        active.add(resource); return resource;
    }
    static synchronized void release(AutoCloseable resource) { active.remove(resource); }
    static void apply(boolean value) {
        ArrayList<AutoCloseable> cancel;
        synchronized (AppNetwork.class) {
            if (value == offline) return;
            offline = value; generation++;
            cancel = value ? new ArrayList<>(active) : new ArrayList<>();
            if (value) active.clear();
        }
        for (AutoCloseable resource : cancel) close(resource);
    }
    private static void close(AutoCloseable resource) {
        try { resource.close(); } catch (Exception ignored) { /* closing is best effort; epoch stays revoked */ }
    }
}
