package de.familyprojekt.privatebrain.pro;

import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.*;
import org.json.*;

/** Invented bytes + HTTP connection; the actual shared downloader writes and
 * reopens real temporary files. This is not an actual e5 quality/device test. */
public final class FamilyModelsTest {
    static int checks;
    static void check(boolean ok, String label) { if (!ok) throw new AssertionError(label); checks++; System.out.println("PASS " + label); }
    interface Work { void run() throws Exception; }
    static void rejects(Work run, String message) throws Exception {
        try { run.run(); throw new AssertionError("not rejected: " + message); }
        catch (IOException expected) { check(true, message); }
    }
    static final class Source implements SemanticModel.Opener {
        final Map<String, byte[]> content = new HashMap<>();
        final List<String> ranges = new CopyOnWriteArrayList<>();
        volatile String mode = "ok";
        volatile boolean cut;
        volatile CountDownLatch started = new CountDownLatch(1);
        public HttpURLConnection open(URL url) {
            String name = url.getPath().substring(url.getPath().lastIndexOf('/') + 1);
            byte[] bytes = content.get(name); if (bytes == null) throw new AssertionError("unknown pinned source " + url);
            return new HttpURLConnection(url) {
                volatile boolean disconnected;
                @Override public void disconnect() { disconnected = true; }
                @Override public boolean usingProxy() { return false; }
                @Override public void connect() {}
                int offset() { String r = getRequestProperty("Range"); return r == null ? 0 : Integer.parseInt(r.substring(6, r.length() - 1)); }
                @Override public int getResponseCode() { ranges.add(getRequestProperty("Range") == null ? "full" : getRequestProperty("Range")); return offset() > 0 ? 206 : 200; }
                @Override public InputStream getInputStream() {
                    return new InputStream() {
                        int position = offset();
                        @Override public int read() throws IOException { byte[] one = new byte[1]; return read(one, 0, 1) < 0 ? -1 : one[0] & 255; }
                        @Override public int read(byte[] target, int off, int len) throws IOException {
                            if (mode.equals("block")) {
                                started.countDown(); long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
                                while (!disconnected && mode.equals("block") && System.nanoTime() < end) {
                                    try { Thread.sleep(5); } catch (InterruptedException ex) { throw new IOException(ex); }
                                }
                            }
                            if (disconnected) throw new IOException("closed");
                            if (mode.equals("interrupt") && (cut || position >= 65536)) { cut = true; throw new IOException("invented connection interruption"); }
                            if (position == bytes.length) return -1;
                            int n = Math.min(Math.min(len, 65536), bytes.length - position);
                            System.arraycopy(bytes, position, target, off, n); position += n; return n;
                        }
                    };
                }
            };
        }
    }
    static JSONObject[] fixture(Source source) throws Exception {
        JSONObject pins = new JSONObject(Files.readString(Path.of("public/native/meaning-models.json")));
        JSONObject small = new JSONObject(Files.readString(Path.of("public/native/semantic-model.json")));
        for (String stage : List.of("klein", "mittel", "gross")) {
            JSONObject model = pins.getJSONObject("models").getJSONObject(stage);
            for (JSONObject spec : List.of(pins.getJSONObject("library"), model)) {
                JSONObject sizes = new JSONObject(); spec.put("sizes", sizes);
                for (String name : spec.getJSONObject("files").keySet()) {
                    String leaf = name.substring(name.lastIndexOf('/') + 1);
                    byte[] bytes = source.content.computeIfAbsent(leaf, key -> {
                        byte[] data = new byte[131072]; new Random(key.hashCode()).nextBytes(data); return data;
                    });
                    spec.getJSONObject("files").put(name, SemanticModel.hex(MessageDigest.getInstance("SHA-256").digest(bytes)));
                    sizes.put(name, bytes.length);
                }
            }
        }
        return new JSONObject[] { pins, small };
    }
    static JSONObject stage(FamilyModels models, String stage) throws Exception { return models.state().getJSONObject("models").getJSONObject(stage); }
    static void done(FamilyModels models, String stage) throws Exception {
        long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while (stage(models, stage).getBoolean("running") && System.nanoTime() < end) Thread.sleep(10);
        check(!stage(models, stage).getBoolean("running"), "download job completes: " + stage);
    }
    static void erase(Path dir) throws Exception {
        try (var paths = Files.walk(dir)) { for (Path p : paths.sorted(Comparator.reverseOrder()).toList()) Files.delete(p); }
    }
    public static void main(String[] args) throws Exception {
        Path root = Files.createTempDirectory("familienakte-model-probe-").toRealPath();
        Source source = new Source(); JSONObject[] pins = fixture(source);
        try {
            FamilyModels.setOffline(true);
            try (FamilyModels models = new FamilyModels(root.toFile(), pins[0], pins[1], source)) {
                check(source.ranges.isEmpty(), "status and construction cause no download");
                rejects(() -> models.install("klein"), "existing offline switch blocks native download");
                FamilyModels.setOffline(false); source.mode = "interrupt";
                models.install("klein"); done(models, "klein");
                check(!stage(models, "klein").getBoolean("installed"), "partial download never becomes installed");
                check(stage(models, "klein").getLong("present") == 65536, "interrupted bytes remain for restart");
            }
            source.mode = "ok";
            try (FamilyModels models = new FamilyModels(root.toFile(), pins[0], pins[1], source)) {
                models.install("klein"); done(models, "klein");
                check(source.ranges.contains("bytes=65536-"), "restart requests the stored range");
                check(stage(models, "klein").getBoolean("installed"), "all fixed files accepted after complete install");
                File asset = models.asset("klein", "model/config.json");
                check(Arrays.equals(Files.readAllBytes(asset.toPath()), source.content.get("config.json")), "local route reopens exact checked model bytes");
                rejects(() -> models.asset("klein", "../../outside"), "no arbitrary path through model asset boundary");
                byte[] corrupt = Files.readAllBytes(asset.toPath()); corrupt[0] ^= 1; Files.write(asset.toPath(), corrupt);
                rejects(() -> models.asset("klein", "model/config.json"), "same-size corruption rejected despite original checksum stamp");
                check(!stage(models, "klein").getBoolean("installed"), "corrupt model loses installed marker");
                models.install("klein"); done(models, "klein");
                check(Arrays.equals(Files.readAllBytes(models.asset("klein", "model/config.json").toPath()), source.content.get("config.json")), "explicit retry repairs changed bytes from fixed sources");
                source.mode = "block"; source.started = new CountDownLatch(1);
                models.install("mittel"); check(source.started.await(3, TimeUnit.SECONDS), "new model starts separate native download");
                rejects(() -> models.remove("klein"), "active job prevents removal race");
                check(models.asset("klein", "model/config.json").isFile(), "previous model remains usable during model change");
                FamilyModels.setOffline(true); done(models, "mittel");
                check(!stage(models, "mittel").getBoolean("installed"), "offline toggle disconnects in-flight download");
                check(stage(models, "klein").getBoolean("installed"), "offline interruption preserves previous complete model");
                FamilyModels.setOffline(false); source.mode = "block"; source.started = new CountDownLatch(1);
                models.install("gross"); check(source.started.await(3, TimeUnit.SECONDS), "explicit download can start after re-enabling internet");
                models.cancel("gross"); source.mode = "ok"; done(models, "gross");
                check(!stage(models, "gross").getBoolean("installed"), "cancel never installs partial model");
                models.remove("klein"); check(!stage(models, "klein").getBoolean("installed"), "explicit removal clears only requested model");
                check(stage(models, "mittel").getInt("dim") == 768, "other model identity remains intact");
            }
        } finally { FamilyModels.setOffline(true); erase(root); }
        System.out.println(checks + " model adapter checks passed (invented HTTP and files)");
    }
}
