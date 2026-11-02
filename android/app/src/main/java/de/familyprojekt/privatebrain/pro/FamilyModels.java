package de.familyprojekt.privatebrain.pro;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

/** Family-owned adapter; SemanticModel, all sources and all hashes stay canonical.
 * No document, query or vector enters this downloader. Only an explicit install
 * starts a job; status/asset access never download or silently retry anything. */
public final class FamilyModels implements AutoCloseable {
    private static final List<String> STAGES = Arrays.asList("klein", "mittel", "gross");
    private final Map<String, Slot> models = new LinkedHashMap<>();
    private final ExecutorService worker = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "familienakte-modelle"); t.setDaemon(true); return t;
    });
    private Slot active;
    private boolean closed;

    private static final class Slot {
        final SemanticModel model;
        final JSONObject identity;
        volatile boolean running, stop;
        volatile long done;
        volatile String error = "", source = "";
        Slot(SemanticModel model, JSONObject identity) { this.model = model; this.identity = identity; }
    }

    public FamilyModels(File root, String meaningPins, String smallPins) throws Exception {
        this(root, new JSONObject(meaningPins), new JSONObject(smallPins), url -> {
            if (!"https".equals(url.getProtocol())) throw new IOException("MODEL_SOURCE_INVALID");
            return (HttpURLConnection) url.openConnection();
        });
    }

    // Package-only constructor lets JVM tests exercise real streaming, resumable
    // files and cancellation with an invented HTTP connection, without changing pins.
    FamilyModels(File root, JSONObject pins, JSONObject small, SemanticModel.Opener opener) throws Exception {
        if (!root.isDirectory() && !root.mkdirs()) throw new IOException("MODEL_STORAGE");
        JSONObject definitions = pins.getJSONObject("models");
        for (String stage : STAGES) {
            JSONObject definition = definitions.getJSONObject(stage);
            String id = definition.getString("id"), revision = definition.getString("revision");
            int dim = definition.getInt("dim");
            if (!id.matches("Xenova/multilingual-e5-(small|base|large)") || !revision.matches("[a-f0-9]{40}") ||
                dim != (stage.equals("klein") ? 384 : stage.equals("mittel") ? 768 : 1024)) throw new IOException("MODEL_PINS_INVALID");
            SemanticModel model = new SemanticModel(new File(root, stage + "-" + revision), entries(pins, small, stage), opener);
            models.put(stage, new Slot(model, new JSONObject().put("id", id).put("revision", revision).put("dim", dim)));
        }
    }

    static List<SemanticModel.Entry> entries(JSONObject pins, JSONObject small, String stage) throws Exception {
        if (!STAGES.contains(stage)) throw new IOException("MODEL_STAGE_INVALID");
        JSONObject model = pins.getJSONObject("models").getJSONObject(stage), library = pins.getJSONObject("library");
        List<SemanticModel.Entry> out = new ArrayList<>();
        for (String group : Arrays.asList("library", "model")) {
            JSONObject spec = group.equals("library") ? library : model;
            JSONObject files = spec.getJSONObject("files"), sizes = spec.optJSONObject("sizes");
            java.util.TreeSet<String> names = new java.util.TreeSet<>();
            for (java.util.Iterator<String> i = files.keys(); i.hasNext();) names.add(i.next());
            for (String name : names) {
                String path = (group.equals("library") ? "lib/" : "model/") + name;
                long size = sizes == null ? 0 : sizes.optLong(name, 0);
                if (stage.equals("klein") && size == 0) size = small.getJSONObject("sizes").optLong(path, 0);
                List<String> urls = new ArrayList<>();
                JSONArray sources = pins.getJSONObject("download").getJSONArray(group);
                for (int i = 0; i < sources.length(); i++) urls.add(sources.getString(i)
                    .replace("{id}", model.getString("id")).replace("{revision}", model.getString("revision"))
                    .replace("{version}", library.getString("version")).replace("{file}", name));
                out.add(new SemanticModel.Entry(path, files.getString(name), size, urls));
            }
        }
        if (out.size() != 7) throw new IOException("MODEL_PINS_INVALID");
        return out;
    }

    public static void setOffline(boolean offline) { AppNetwork.apply(offline); }

    private Slot slot(String stage) throws IOException {
        Slot slot = models.get(stage); if (slot == null || closed) throw new IOException("MODEL_STAGE_INVALID"); return slot;
    }

    public synchronized JSONObject state() throws Exception {
        JSONObject states = new JSONObject();
        for (Map.Entry<String, Slot> entry : models.entrySet()) {
            Slot s = entry.getValue();
            states.put(entry.getKey(), new JSONObject(s.identity.toString()).put("installed", s.model.installed())
                .put("running", s.running).put("present", s.model.present()).put("total", s.model.total())
                .put("done", s.done).put("error", s.error).put("source", s.source));
        }
        return new JSONObject().put("models", states);
    }

    public synchronized JSONObject install(String stage) throws Exception {
        Slot s = slot(stage); if (active != null) throw new IOException("MODEL_BUSY");
        final long started = AppNetwork.epoch(); AppNetwork.check(started);
        s.stop = false; s.running = true; s.error = ""; s.done = s.model.present(); active = s;
        worker.execute(() -> {
            try {
                s.model.install((done, total, file, source) -> { s.done = done; s.source = source; }, () -> s.stop || AppNetwork.epoch() != started);
                // A canonical resume stamp saves time; it is not sufficient evidence
                // for execution. Read every final file afresh before marking success.
                for (SemanticModel.Entry e : s.model.entries()) checked(s, e.path);
            } catch (Exception error) {
                s.error = error instanceof SemanticModel.Failure f ? f.code : error instanceof AppNetwork.Blocked ? "APP_OFFLINE" : "MODEL_FAILED";
            } finally { synchronized (FamilyModels.this) { s.running = false; active = null; } }
        });
        return state();
    }

    public synchronized JSONObject cancel(String stage) throws Exception {
        Slot s = slot(stage); s.stop = true; s.model.cancel(); return state();
    }

    public synchronized JSONObject remove(String stage) throws Exception {
        Slot s = slot(stage); if (active != null) throw new IOException("MODEL_BUSY");
        s.model.remove(); s.done = 0; s.error = ""; return state();
    }

    /** Native callers serve this checked file as a local stream. Paths are never
     * accepted from JavaScript; only a stage and one of the seven pinned names. */
    public synchronized File asset(String stage, String path) throws Exception {
        Slot s = slot(stage); if (s.running) throw new IOException("MODEL_BUSY");
        return checked(s, path);
    }

    private static File checked(Slot s, String path) throws Exception {
        SemanticModel.Entry expected = null;
        for (SemanticModel.Entry e : s.model.entries()) if (e.path.equals(path)) expected = e;
        if (expected == null) throw new IOException("MODEL_ASSET_INVALID");
        File file = s.model.file(path); if (file == null) throw new IOException("MODEL_NOT_INSTALLED");
        // Canonical path equality rejects links in any component, not just the last file.
        if (!file.getAbsoluteFile().equals(file.getCanonicalFile())) throw new IOException("MODEL_ASSET_INVALID");
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        try (InputStream in = new FileInputStream(file)) {
            byte[] buffer = new byte[64 * 1024]; for (int n; (n = in.read(buffer)) != -1;) sha.update(buffer, 0, n);
        }
        if (!expected.sha256.equals(SemanticModel.hex(sha.digest()))) {
            new File(s.model.dir(), SemanticModel.MARKER).delete();
            new File(file.getPath() + ".sha256").delete();
            throw new IOException("MODEL_CHECKSUM");
        }
        return file;
    }

    @Override public synchronized void close() {
        closed = true; for (Slot s : models.values()) { s.stop = true; s.model.cancel(); } worker.shutdownNow();
    }
}
