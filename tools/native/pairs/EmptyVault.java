import de.familyprojekt.tresor.*;
import java.io.File;
/** Only creates an empty invented vault. Never sends a file or acknowledges an app. */
public final class EmptyVault {
 public static void main(String[] args) throws Exception {
  try (TresorOrdner vault = TresorOrdner.anlegen(new DateiAblage(new File(args[0])), "familienakte", "Pair-Probe-2026-only")) {
   System.out.println(vault.id());
  }
 }
}
