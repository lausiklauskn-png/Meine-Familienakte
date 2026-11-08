package de.familyprojekt.familienakte;

import de.familyprojekt.tresor.Json;
import java.io.IOException;
import java.nio.file.Path;
import java.util.*;

/** Stufe F (Windows): Gastgeber-Dienst und Gast-Anfragen über die private Pipe – dieselben Aktionen wie das Android-Plugin FamilienakteNetz. */
final class FamilyNetz {
    private final NetzDienst dienst = new NetzDienst();
    private final Path daten;
    FamilyNetz(Path daten) { this.daten = daten; }
    static boolean aktion(String a) { return a.startsWith("netz"); }

    Object aufruf(Map<String, Object> m) throws IOException {
        String a = Json.text(m, "aktion");
        switch (a) {
            case "netzStart": {
                String ordner = Json.textOder(m, "ordner", "netz-laufwerk");
                if (!ordner.matches("[A-Za-z0-9_-]{1,64}")) throw new IOException("FA_PFAD_UNGUELTIG");
                return dienst.start(daten.resolve(ordner).toFile(), Json.textOder(m, "token", ""), Json.textOder(m, "kennung", ""), Json.textOder(m, "name", ""), (int) Json.zahlOder(m, "port", 0));
            }
            case "netzStop": dienst.stop(); return dienst.zustand();
            case "netzZustand": return dienst.zustand();
            case "netzSuchen": return Map.of("treffer", NetzDienst.suchen((int) Json.zahlOder(m, "ms", 2500)));
            case "netzAnfrage": {
                String data = Json.textOder(m, "data", "");
                byte[] body = data.isEmpty() ? null : Base64.getDecoder().decode(data);
                NetzDienst.Antwort r = NetzDienst.anfrage(Json.textOder(m, "adresse", ""), (int) Json.zahlOder(m, "port", 0), Json.textOder(m, "token", ""), Json.textOder(m, "methode", "GET"), Json.textOder(m, "weg", "/"), body);
                Map<String, Object> out = new LinkedHashMap<>(); out.put("status", r.status); out.put("art", r.art); out.put("data", Base64.getEncoder().encodeToString(r.body)); return out;
            }
            default: throw new IOException("FA_TRESOR_AKTION_UNGUELTIG");
        }
    }
}
