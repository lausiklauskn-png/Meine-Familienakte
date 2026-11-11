package de.familyprojekt.familienakte;

import static org.junit.Assert.*;

import org.junit.Test;

/** Gerätetest 11.11.2026: kleine Zahlen kommen aus dem JSON der Brücke als Integer; Capacitors getLong gab dafür den
 *  Ersatzwert zurück („Größe -1 statt 0“). FamilienakteOrdnerPlugin.zahl nimmt jede Zahl an. */
public class OrdnerZahlTest {
    @Test public void integerWirdAngenommen() {
        assertEquals(0L, FamilienakteOrdnerPlugin.zahl(Integer.valueOf(0), -1L));
        assertEquals(1048576L, FamilienakteOrdnerPlugin.zahl(Integer.valueOf(1048576), -1L));
    }
    @Test public void longUndKommazahl() {
        assertEquals(5_000_000_000L, FamilienakteOrdnerPlugin.zahl(Long.valueOf(5_000_000_000L), -1L));
        assertEquals(3L, FamilienakteOrdnerPlugin.zahl(Double.valueOf(3.0), -1L));
    }
    @Test public void fehltOderFalschGibtErsatz() {
        assertEquals(-1L, FamilienakteOrdnerPlugin.zahl(null, -1L));
        assertEquals(-1L, FamilienakteOrdnerPlugin.zahl("12", -1L));
    }
}
