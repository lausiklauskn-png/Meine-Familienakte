package de.familyprojekt.familienakte;

import de.familyprojekt.tresor.Json;
import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;

/** A save dialog chooses the destination. Page code only supplies bounded bytes.
 * Write and verify a sibling first; a failed save preserves an existing file. */
final class FamilyFileOutput {
    static final int MAX_BYTES = 20 * 1024 * 1024 + 8192 + 12;
    static Object save(Map<String,Object> input, ProTresorEngine.Dialoge dialog) throws IOException {
        String name = Json.text(input, "name"), data = Json.text(input, "data"), expected = Json.text(input, "sha256");
        if (name.isBlank() || name.length() > 200 || name.matches(".*[\\p{Cntrl}/\\\\:].*") || name.equals(".") || name.equals("..")) throw new IOException("FA_AUSGABE_NAME");
        if (data.length() > ((MAX_BYTES + 2L) / 3) * 4) throw new IOException("FA_AUSGABE_ZU_GROSS");
        byte[] bytes;
        try { bytes = Base64.getDecoder().decode(data); } catch (IllegalArgumentException e) { throw new IOException("FA_AUSGABE_DATEN"); }
        if (bytes.length > MAX_BYTES) throw new IOException("FA_AUSGABE_ZU_GROSS");
        if (!expected.matches("[a-f0-9]{64}") || !expected.equals(hash(bytes))) throw new IOException("FA_AUSGABE_PRUEFSUMME");
        Path chosen = dialog.ausgabe(name);
        if (chosen == null) return Map.of("cancelled", true);
        Path target = chosen.toAbsolutePath().normalize(), parent = target.getParent();
        if (parent == null || !Files.isDirectory(parent) || Files.isSymbolicLink(target) || Files.isDirectory(target)) throw new IOException("FA_AUSGABE_ORT");
        Path temporary = Files.createTempFile(parent, ".familienakte-ausgabe-", ".tmp");
        try {
            try (FileOutputStream out = new FileOutputStream(temporary.toFile())) { out.write(bytes); out.getFD().sync(); }
            if (Files.size(temporary) != bytes.length || !expected.equals(hash(Files.readAllBytes(temporary)))) throw new IOException("FA_AUSGABE_PRUEFSUMME");
            Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            return Map.of("saved", true);
        } finally { Files.deleteIfExists(temporary); Arrays.fill(bytes, (byte)0); }
    }
    private static String hash(byte[] bytes) throws IOException {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
        catch (Exception e) { throw new IOException("FA_AUSGABE_PRUEFSUMME"); }
    }
}
