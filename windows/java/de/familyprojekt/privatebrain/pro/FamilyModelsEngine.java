package de.familyprojekt.privatebrain.pro;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.json.JSONObject;

/** Private stdin/stdout worker, sharing the bundled JRE. No listening port,
 * user password or document access. All model inputs come from pinned resources. */
public final class FamilyModelsEngine {
    public static void main(String[] args) throws Exception {
        if (args.length != 1) throw new IllegalArgumentException("MODEL_STORAGE");
        Path root = Path.of(args[0]).toAbsolutePath().normalize(); Files.createDirectories(root); root = root.toRealPath();
        try (FamilyModels models = new FamilyModels(root.toFile(), Files.readString(Path.of("meaning-models.json")), Files.readString(Path.of("semantic-model.json")));
             BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
             PrintWriter output = new PrintWriter(System.out, true, StandardCharsets.UTF_8)) {
            for (String line; (line = input.readLine()) != null;) {
                JSONObject response;
                try {
                    if (line.length() > 8192) throw new IllegalArgumentException("MODEL_INPUT_INVALID");
                    JSONObject request = new JSONObject(line); String stage = request.optString("stage");
                    JSONObject value = switch (request.getString("method")) {
                        case "getState" -> models.state();
                        case "install" -> models.install(stage);
                        case "cancel" -> models.cancel(stage);
                        case "remove" -> models.remove(stage);
                        case "measure" -> DesktopGeraet.measure(root);
                        case "network" -> {
                            boolean offline = request.getBoolean("offline"); FamilyModels.setOffline(offline);
                            yield new JSONObject().put("offline", offline);
                        }
                        case "asset" -> new JSONObject().put("path", models.asset(stage, request.getString("path")).toString());
                        default -> throw new IllegalArgumentException("MODEL_METHOD_INVALID");
                    };
                    response = new JSONObject().put("ok", value);
                } catch (Exception error) {
                    String code = error.getMessage();
                    response = new JSONObject().put("error", code != null && code.matches("[A-Z_]{1,60}") ? code : "MODEL_ACTION_FAILED");
                }
                output.println(response);
            }
        }
    }
}
