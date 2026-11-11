package de.familyprojekt.familienakte;

import static org.junit.Assert.*;

import org.junit.Test;

/** 2.28.65: Die App entfernt am zweiten Ort nur eigene Sicherungsordner – erkannt am Namen (und an der Kennungsdatei). */
public class SicherungEntfernenTest {
    @Test public void eigeneNamen() {
        assertTrue(FamilienakteOrdnerPlugin.SICHERUNG_NAME.matcher("Familienakte_Vollsicherung_2026-11-11T20-30-00-000Z").matches());
        assertTrue(FamilienakteOrdnerPlugin.SICHERUNG_NAME.matcher("Familienakte_Vollsicherung_2026-11-11T20-30-00-000Z_verschluesselt").matches());
        assertTrue(FamilienakteOrdnerPlugin.SICHERUNG_NAME.matcher("Familienakte_Vollsicherung_2026-11-11T20-30-00-000Z_verschluesselt_2").matches());
    }
    @Test public void fremdeNamenNie() {
        for (String fremd : new String[] { "", "Fotos", "Familienakte_Vollsicherung_", "Familienakte_Vollsicherung_2026/../x",
                "Familienakte_Vollsicherung_2026-11-11T20-30-00-000Z/Dateien", "Familienakte-Abgleich", "Familienakte_Vollsicherung_abc_def_ghi" })
            assertFalse(fremd, FamilienakteOrdnerPlugin.SICHERUNG_NAME.matcher(fremd).matches());
    }
}
