package de.familyprojekt.familienakte;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Dateien, die eine andere App an die Familienakte geteilt hat: einmal in einen privaten Ordner kopiert,
 * von der Seite in Stücken gelesen und danach gelöscht. Kein Netz, keine Pfade von außen.
 * Abgeleitet aus Private Brain Pro ShareInbox (b0a28dd).
 */
final class ShareInbox {
    static final long MAX_FILE = 200L * 1024 * 1024;
    static final int MAX_FILES = 30;
    static final int CHUNK = 256 * 1024;
    static final class Item { final String id, name, mime; final long size; Item(String id, String name, String mime, long size) { this.id = id; this.name = name; this.mime = mime; this.size = size; } }
    private final File dir;
    private final Map<String, Item> items = new LinkedHashMap<>();
    ShareInbox(File dir) { this.dir = dir; }
    static String safeName(String raw, String fallback) {
        String name = raw == null ? "" : raw;
        int slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (slash >= 0) name = name.substring(slash + 1);
        name = name.replaceAll("[\\p{Cntrl}<>:\"|?*]", "").trim();
        while (name.startsWith(".")) name = name.substring(1);
        if (name.isEmpty()) name = fallback;
        return name.length() > 120 ? name.substring(0, 120) : name;
    }
    static String safeMime(String raw) {
        if (raw == null || !raw.matches("[a-zA-Z0-9.+-]{1,60}/[a-zA-Z0-9.+*-]{1,80}")) return "application/octet-stream";
        return raw.toLowerCase(java.util.Locale.ROOT);
    }
    synchronized int count() { return items.size(); }
    Item add(InputStream in, String name, String mime) throws IOException {
        synchronized (this) { if (items.size() >= MAX_FILES) throw new IOException("too many"); }
        if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("no folder");
        String id = UUID.randomUUID().toString();
        File target = new File(dir, id);
        long total = 0;
        try (InputStream source = in; OutputStream out = new FileOutputStream(target)) {
            byte[] buffer = new byte[64 * 1024];
            for (int n; (n = source.read(buffer)) > 0; ) { total += n; if (total > MAX_FILE) throw new IOException("too large"); out.write(buffer, 0, n); }
        } catch (IOException error) { target.delete(); throw error; }
        Item item = new Item(id, safeName(name, "Geteilte Datei"), safeMime(mime), total);
        synchronized (this) { items.put(id, item); }
        return item;
    }
    synchronized List<Item> list() { return new ArrayList<>(items.values()); }
    byte[] read(String id, long offset) throws IOException {
        synchronized (this) { if (!items.containsKey(id)) throw new IOException("unknown"); }
        if (offset < 0) throw new IOException("offset");
        try (RandomAccessFile file = new RandomAccessFile(new File(dir, id), "r")) {
            if (offset >= file.length()) return new byte[0];
            byte[] out = new byte[(int) Math.min(CHUNK, file.length() - offset)];
            file.seek(offset); file.readFully(out); return out;
        }
    }
    synchronized void remove(String id) { if (items.remove(id) != null) new File(dir, id).delete(); }
    synchronized void clear() { items.clear(); File[] old = dir.listFiles(); if (old != null) for (File f : old) f.delete(); }
}
