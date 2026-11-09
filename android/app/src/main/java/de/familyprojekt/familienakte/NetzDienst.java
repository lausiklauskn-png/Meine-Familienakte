package de.familyprojekt.familienakte;

import de.familyprojekt.tresor.Ablage;
import de.familyprojekt.tresor.DateiAblage;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Stufe F (Plan 08.11.2026, Entscheidung 12): Abgleich im eigenen Netz (WLAN, LAN-Kabel, USB-Kabel mit Netzfreigabe).
 * Ein Gerät ist Gastgeber: es bietet seinen Abgleich-Ordner (dasselbe Format wie die gemeinsame Festplatte: Kopf mit Kennung,
 * Stand und Originale verschlüsselt) über einen kleinen HTTP-Dienst an. Andere Geräte finden es über ein UDP-Signal im Netz
 * und greifen mit dem Kopplungs-Token zu. Nur java.base, damit Android und die Windows-Laufzeit denselben Code benutzen.
 *
 * Sicherheit: Inhalte sind durch den Abgleichsschlüssel (AES-GCM) geschützt, der nie über das Netz geht; der Token (aus dem
 * Kopplungscode abgeleitet) schützt den Zugriff; Pfade sind relativ und geprüft; gelöscht werden nur eigene Dateien dieser
 * Sitzung. Kein Internet, kein fremder Server. Eine fremde Seite ohne Token bekommt 401 und sieht nichts.
 */
public final class NetzDienst {
    public static final int PORT = 48200, SIGNAL_PORT = 48201;
    static final long MAX_DATEI = 100L * 1024 * 1024 + 8192 + 12;
    private ServerSocket server; private Thread annehmer, signal;
    private volatile boolean laeuft;
    private final Set<String> selbstAngelegt = ConcurrentHashMap.newKeySet();
    private String token = "", kennung = "", name = ""; private int port;
    private Ablage ablage;

    public synchronized Map<String, Object> start(File wurzel, String token, String kennung, String name, int wunschPort) throws IOException {
        if (laeuft) return zustand();
        if (token == null || token.length() < 16 || kennung == null || kennung.isEmpty()) throw new IOException("FA_NETZ_EINGABE");
        if (!wurzel.isDirectory() && !wurzel.mkdirs()) throw new IOException("FA_NETZ_ORDNER");
        this.ablage = new DateiAblage(wurzel); this.token = token; this.kennung = kennung; this.name = name == null ? "" : name;
        ServerSocket s;
        try { s = new ServerSocket(wunschPort > 0 ? wunschPort : PORT, 8, new InetSocketAddress(0).getAddress()); }
        catch (IOException belegt) { s = new ServerSocket(0, 8, new InetSocketAddress(0).getAddress()); }
        server = s; port = s.getLocalPort(); laeuft = true;
        annehmer = new Thread(this::annehmen, "familienakte-netz"); annehmer.setDaemon(true); annehmer.start();
        signal = new Thread(this::signalisieren, "familienakte-netz-signal"); signal.setDaemon(true); signal.start();
        return zustand();
    }
    public synchronized void stop() {
        laeuft = false;
        try { if (server != null) server.close(); } catch (IOException ignoriert) { }
        server = null; selbstAngelegt.clear();
    }
    public synchronized Map<String, Object> zustand() {
        Map<String, Object> z = new LinkedHashMap<>();
        z.put("laeuft", laeuft); z.put("port", laeuft ? port : 0); z.put("adressen", adressen()); z.put("kennung", kennung); z.put("name", name);
        return z;
    }
    /** Eigene IPv4-Adressen im Heimnetz (nicht Loopback, keine Link-Local). */
    public static List<String> adressen() {
        List<String> out = new ArrayList<>();
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InetAddress a : Collections.list(ni.getInetAddresses()))
                    if (a instanceof Inet4Address && !a.isLoopbackAddress() && !a.isLinkLocalAddress()) out.add(a.getHostAddress());
            }
        } catch (SocketException ignoriert) { }
        return out;
    }

    // ---------- Signal im Netz (UDP) ----------
    private void signalisieren() {
        try (DatagramSocket s = new DatagramSocket()) {
            s.setBroadcast(true);
            while (laeuft) {
                byte[] b = ("{\"familienakte\":1,\"kennung\":" + json(kennung) + ",\"port\":" + port + ",\"name\":" + json(name) + "}").getBytes(StandardCharsets.UTF_8);
                for (InetAddress ziel : sendeZiele()) { try { s.send(new DatagramPacket(b, b.length, ziel, SIGNAL_PORT)); } catch (IOException ignoriert) { } }
                try { Thread.sleep(3000); } catch (InterruptedException e) { return; }
            }
        } catch (IOException ignoriert) { }
    }
    private static List<InetAddress> sendeZiele() {
        List<InetAddress> ziele = new ArrayList<>();
        try { ziele.add(InetAddress.getByName("255.255.255.255")); } catch (UnknownHostException ignoriert) { }
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InterfaceAddress ia : ni.getInterfaceAddresses()) if (ia.getBroadcast() != null) ziele.add(ia.getBroadcast());
            }
        } catch (SocketException ignoriert) { }
        return ziele;
    }
    /** Hört `ms` Millisekunden auf Signale; je Kennung ein Treffer mit Adresse und Port. */
    public static List<Map<String, Object>> suchen(int ms) {
        Map<String, Map<String, Object>> treffer = new LinkedHashMap<>();
        long ende = System.currentTimeMillis() + Math.max(500, Math.min(ms, 15000));
        try (DatagramSocket s = new DatagramSocket(null)) {
            s.setReuseAddress(true); s.bind(new InetSocketAddress(SIGNAL_PORT)); s.setSoTimeout(500);
            byte[] puffer = new byte[2048];
            while (System.currentTimeMillis() < ende) {
                DatagramPacket p = new DatagramPacket(puffer, puffer.length);
                try { s.receive(p); } catch (SocketTimeoutException weiter) { continue; }
                String text = new String(p.getData(), 0, p.getLength(), StandardCharsets.UTF_8);
                if (!text.contains("\"familienakte\":1")) continue;
                String kennung = feld(text, "kennung"), name = feld(text, "name"), portText = text.replaceAll(".*\"port\":(\\d+).*", "$1");
                if (kennung.isEmpty() || !portText.matches("\\d{2,5}")) continue;
                Map<String, Object> t = new LinkedHashMap<>();
                t.put("kennung", kennung); t.put("name", name); t.put("port", Integer.parseInt(portText)); t.put("adresse", p.getAddress().getHostAddress());
                treffer.put(kennung + "|" + p.getAddress().getHostAddress(), t);
            }
        } catch (IOException ignoriert) { }
        return new ArrayList<>(treffer.values());
    }
    private static String feld(String json, String name) {
        int i = json.indexOf("\"" + name + "\":\""); if (i < 0) return "";
        int a = i + name.length() + 4, e = json.indexOf('"', a);
        return e < 0 ? "" : json.substring(a, e).replace("\\\"", "\"").replace("\\\\", "\\");
    }

    // ---------- Dienst (HTTP/1.1, nur das Nötige) ----------
    private void annehmen() {
        while (laeuft) {
            try { Socket k = server.accept(); k.setSoTimeout(60000); Thread t = new Thread(() -> bedienen(k), "familienakte-netz-anfrage"); t.setDaemon(true); t.start(); }
            catch (IOException e) { if (!laeuft) return; }
        }
    }
    private void bedienen(Socket k) {
        try (k; InputStream in = new BufferedInputStream(k.getInputStream()); OutputStream out = new BufferedOutputStream(k.getOutputStream())) {
            String zeile = zeile(in); if (zeile == null) return;
            String[] teile = zeile.split(" "); if (teile.length < 2) { antwort(out, 400, "text/plain", "ungültig".getBytes(StandardCharsets.UTF_8)); return; }
            String methode = teile[0], ziel = teile[1];
            Map<String, String> kopf = new HashMap<>(); long laenge = 0;
            for (String h; (h = zeile(in)) != null && !h.isEmpty();) { int d = h.indexOf(':'); if (d > 0) { String n = h.substring(0, d).trim().toLowerCase(Locale.ROOT), w = h.substring(d + 1).trim(); kopf.put(n, w); if (n.equals("content-length")) laenge = Long.parseLong(w); } }
            if (!token.equals(kopf.getOrDefault("x-familienakte-token", ""))) { antwort(out, 401, "application/json", "{\"fehler\":\"FA_NETZ_TOKEN\"}".getBytes(StandardCharsets.UTF_8)); return; }
            String pfadTeil = ziel, abfrage = ""; int f = ziel.indexOf('?'); if (f >= 0) { pfadTeil = ziel.substring(0, f); abfrage = ziel.substring(f + 1); }
            Map<String, String> q = new HashMap<>();
            for (String p : abfrage.split("&")) { int g = p.indexOf('='); if (g > 0) q.put(dekodieren(p.substring(0, g)), dekodieren(p.substring(g + 1))); }
            String pfad = q.getOrDefault("pfad", "");
            if (!pfadOk(pfad)) { antwort(out, 400, "application/json", "{\"fehler\":\"FA_PFAD_UNGUELTIG\"}".getBytes(StandardCharsets.UTF_8)); return; }
            switch (methode + " " + pfadTeil) {
                case "GET /kopf": antwort(out, 200, "application/json", ("{\"kennung\":" + json(kennung) + ",\"name\":" + json(name) + "}").getBytes(StandardCharsets.UTF_8)); return;
                case "GET /liste": {
                    if (!ablage.istOrdner(pfad)) { antwort(out, 404, "application/json", "{\"fehler\":\"FA_NICHT_GEFUNDEN\"}".getBytes(StandardCharsets.UTF_8)); return; }
                    StringBuilder sb = new StringBuilder("{\"eintraege\":[");
                    boolean erster = true;
                    for (String n : ablage.liste(pfad)) {
                        String kind = pfad.isEmpty() ? n : pfad + "/" + n; boolean ordner = ablage.istOrdner(kind);
                        if (!erster) sb.append(','); erster = false;
                        sb.append("{\"name\":").append(json(n)).append(",\"art\":\"").append(ordner ? "ordner" : "datei").append("\",\"groesse\":").append(ordner ? 0 : ablage.groesse(kind)).append('}');
                    }
                    antwort(out, 200, "application/json", sb.append("]}").toString().getBytes(StandardCharsets.UTF_8)); return;
                }
                case "GET /info": {
                    if (!ablage.gibtEs(pfad)) { antwort(out, 404, "application/json", "{\"fehler\":\"FA_NICHT_GEFUNDEN\"}".getBytes(StandardCharsets.UTF_8)); return; }
                    boolean ordner = ablage.istOrdner(pfad);
                    antwort(out, 200, "application/json", ("{\"art\":\"" + (ordner ? "ordner" : "datei") + "\",\"groesse\":" + (ordner ? 0 : ablage.groesse(pfad)) + "}").getBytes(StandardCharsets.UTF_8)); return;
                }
                case "GET /datei": {
                    if (pfad.isEmpty() || !ablage.gibtEs(pfad) || ablage.istOrdner(pfad)) { antwort(out, 404, "application/json", "{\"fehler\":\"FA_NICHT_GEFUNDEN\"}".getBytes(StandardCharsets.UTF_8)); return; }
                    long groesse = ablage.groesse(pfad);
                    long offset = Long.parseLong(q.getOrDefault("offset", "0")), stueck = Math.min(Long.parseLong(q.getOrDefault("laenge", String.valueOf(groesse))), 1024 * 1024);
                    if (offset < 0 || offset > groesse || stueck < 0) { antwort(out, 400, "application/json", "{\"fehler\":\"FA_STUECK_UNGUELTIG\"}".getBytes(StandardCharsets.UTF_8)); return; }
                    byte[] b = new byte[(int) Math.min(stueck, groesse - offset)];
                    Ablage.Kanal kanal = ablage.kanal(pfad);
                    try { java.nio.ByteBuffer bb = java.nio.ByteBuffer.wrap(b); kanal.kanal.position(offset); while (bb.hasRemaining() && kanal.kanal.read(bb) > 0) { } }
                    finally { try { kanal.kanal.close(); } catch (IOException ignoriert) { } try { if (kanal.besitzer != null) kanal.besitzer.close(); } catch (IOException ignoriert) { } }
                    antwort(out, 200, "application/octet-stream", b); return;
                }
                case "POST /ordner": { if (pfad.isEmpty()) { antwort(out, 400, "application/json", "{\"fehler\":\"FA_PFAD_UNGUELTIG\"}".getBytes(StandardCharsets.UTF_8)); return; } ablage.ordner(pfad); antwort(out, 200, "application/json", "{\"ok\":true}".getBytes(StandardCharsets.UTF_8)); return; }
                case "PUT /datei": {
                    if (pfad.isEmpty() || laenge > MAX_DATEI || ablage.istOrdner(pfad)) { antwort(out, 400, "application/json", "{\"fehler\":\"FA_AUSGABE_ZU_GROSS\"}".getBytes(StandardCharsets.UTF_8)); return; }
                    if (ablage.gibtEs(pfad)) ablage.loeschen(pfad);
                    MessageDigest sha = MessageDigest.getInstance("SHA-256");
                    long gelesen = 0; byte[] puffer = new byte[65536];
                    try (OutputStream o = ablage.neu(pfad)) {
                        while (gelesen < laenge) { int n = in.read(puffer, 0, (int) Math.min(puffer.length, laenge - gelesen)); if (n < 0) break; o.write(puffer, 0, n); sha.update(puffer, 0, n); gelesen += n; }
                    }
                    if (gelesen != laenge) { ablage.loeschen(pfad); antwort(out, 400, "application/json", "{\"fehler\":\"FA_STUECK_UNGUELTIG\"}".getBytes(StandardCharsets.UTF_8)); return; }
                    selbstAngelegt.add(pfad);
                    antwort(out, 200, "application/json", ("{\"size\":" + gelesen + ",\"sha256\":\"" + hex(sha.digest()) + "\"}").getBytes(StandardCharsets.UTF_8)); return;
                }
                case "DELETE /datei": {
                    if (!selbstAngelegt.contains(pfad)) { antwort(out, 403, "application/json", "{\"fehler\":\"FA_NICHT_ERLAUBT\"}".getBytes(StandardCharsets.UTF_8)); return; }
                    ablage.loeschen(pfad); selbstAngelegt.remove(pfad);
                    antwort(out, 200, "application/json", "{\"ok\":true}".getBytes(StandardCharsets.UTF_8)); return;
                }
                default: antwort(out, 404, "application/json", "{\"fehler\":\"FA_NETZ_UNBEKANNT\"}".getBytes(StandardCharsets.UTF_8));
            }
        } catch (Exception e) {
            try { OutputStream out = k.getOutputStream(); antwort(out, 500, "application/json", ("{\"fehler\":" + json(code(e)) + "}").getBytes(StandardCharsets.UTF_8)); } catch (IOException ignoriert) { }
        }
    }
    /** URLDecoder mit Charset-Objekt gibt es auf Android erst ab API 33; die Zeichensatz-Namensform geht überall. */
    private static String dekodieren(String s) { try { return URLDecoder.decode(s, "UTF-8"); } catch (java.io.UnsupportedEncodingException e) { return s; } }
    private static boolean pfadOk(String pfad) {
        if (pfad.isEmpty()) return true;
        if (pfad.length() > 1024) return false;
        for (String teil : pfad.split("/", -1)) if (teil.isEmpty() || teil.equals(".") || teil.equals("..") || teil.length() > 255 || teil.indexOf('\\') >= 0 || teil.indexOf(':') >= 0) return false;
        return true;
    }
    private static String zeile(InputStream in) throws IOException {
        ByteArrayOutputStream b = new ByteArrayOutputStream(); int c;
        while ((c = in.read()) >= 0) { if (c == '\n') break; if (c != '\r') b.write(c); if (b.size() > 8192) throw new IOException("FA_NETZ_KOPF"); }
        if (c < 0 && b.size() == 0) return null;
        return new String(b.toByteArray(), StandardCharsets.UTF_8);   // toString(Charset) erst ab Android 13
    }
    private static void antwort(OutputStream out, int status, String art, byte[] body) throws IOException {
        out.write(("HTTP/1.1 " + status + " " + (status == 200 ? "OK" : status == 401 ? "Unauthorized" : status == 404 ? "Not Found" : status == 403 ? "Forbidden" : status == 400 ? "Bad Request" : "Error") + "\r\nContent-Type: " + art + "\r\nContent-Length: " + body.length + "\r\nConnection: close\r\nCache-Control: no-store\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(body); out.flush();
    }
    static String code(Exception e) { String m = e.getMessage(); return m != null && m.matches("[A-Z0-9_]+") ? m : "FA_NETZ_FEHLER"; }
    static String hex(byte[] b) { StringBuilder sb = new StringBuilder(); for (byte x : b) sb.append(String.format("%02x", x)); return sb.toString(); }
    static String json(String s) { StringBuilder sb = new StringBuilder("\""); for (char c : s.toCharArray()) { if (c == '"' || c == '\\') sb.append('\\').append(c); else if (c < 0x20) sb.append(String.format("\\u%04x", (int) c)); else sb.append(c); } return sb.append('"').toString(); }

    // ---------- Gast: Anfrage an einen Gastgeber (eigener Socket, unabhängig von den Netzregeln der WebView) ----------
    public static final class Antwort { public final int status; public final byte[] body; public final String art; Antwort(int s, String a, byte[] b) { status = s; art = a; body = b; } }
    public static Antwort anfrage(String adresse, int port, String token, String methode, String weg, byte[] body) throws IOException {
        if (adresse == null || adresse.isEmpty() || port <= 0 || port > 65535 || !adresse.matches("[0-9A-Za-z.:\\-\\[\\]%]{1,64}")) throw new IOException("FA_NETZ_ADRESSE");
        try (Socket k = new Socket()) {
            k.connect(new InetSocketAddress(adresse, port), 4000); k.setSoTimeout(60000);
            OutputStream out = new BufferedOutputStream(k.getOutputStream());
            out.write((methode + " " + weg + " HTTP/1.1\r\nHost: " + adresse + "\r\nX-Familienakte-Token: " + token + "\r\nConnection: close\r\nContent-Length: " + (body == null ? 0 : body.length) + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
            if (body != null && body.length > 0) out.write(body);
            out.flush();
            InputStream in = new BufferedInputStream(k.getInputStream());
            String status = zeile(in); if (status == null || !status.startsWith("HTTP/1.")) throw new IOException("FA_NETZ_ANTWORT");
            int code = Integer.parseInt(status.split(" ")[1]);
            String art = "application/octet-stream"; long laenge = -1;
            for (String h; (h = zeile(in)) != null && !h.isEmpty();) { int d = h.indexOf(':'); if (d > 0) { String n = h.substring(0, d).trim().toLowerCase(Locale.ROOT), w = h.substring(d + 1).trim(); if (n.equals("content-type")) art = w; if (n.equals("content-length")) laenge = Long.parseLong(w); } }
            if (laenge > 1024 * 1024 + 65536) throw new IOException("FA_NETZ_ANTWORT_GROSS");
            ByteArrayOutputStream b = new ByteArrayOutputStream(); byte[] puffer = new byte[65536]; int n;
            while ((laenge < 0 || b.size() < laenge) && (n = in.read(puffer)) >= 0) b.write(puffer, 0, n);
            return new Antwort(code, art, b.toByteArray());
        }
    }
}
