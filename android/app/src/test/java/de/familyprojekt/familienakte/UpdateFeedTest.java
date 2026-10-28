package de.familyprojekt.familienakte;

import static org.junit.Assert.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.junit.Test;

/** Updates vom eigenen Server unter Android (Vorbild BookLedgerPro UpdateFeedTest). Unterschriften wie im Release-Lauf
 *  (openssl pkeyutl -sign -rawin, Base64), erzeugt mit Wegwerf-Schlüsseln, nicht mit Klaus' Schlüssel. */
public class UpdateFeedTest {
    static final String PUB = "MCowBQYDK2VwAyEA1mWBlunRUEqf0vVtoUaPyp+/sh4nCwL2faRBSQArcOw=";
    static final String SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    static byte[] feed(String datei, int code) {
        return ("{\"format\":1,\"app\":\"familienakte\",\"version\":\"2.28.3\",\"android\":{\"datei\":\"" + datei + "\",\"groesse\":1234,\"sha256\":\"" + SHA + "\",\"versionCode\":" + code + "}}").getBytes(StandardCharsets.UTF_8);
    }
    static final byte[] NEU = feed("Familienakte-android-v2.28.3.apk", 30), BOESE = feed("../evil.apk", 30), CODE = feed("Familienakte-android-v2.28.3.apk", 20);
    static final byte[] NEU_SIG = "eB1fkvWkRwV4YeCDT5pHlEbSeOeIt1M7oNonfm4OL2f/l0ONd+mCrZW4CCQgyEIZPAFk00+XhX0Ih0zRFBE5AQ==\n".getBytes(StandardCharsets.US_ASCII);
    static final byte[] BOESE_SIG = "s6SM8cJJtGbBE49CBS08lo/3Rc4Lp/IKRJCcd9rY5msYfHMqXRNhoE/3vifqFPM2b6fJNcPg/A2gziaMxVf2AA==".getBytes(StandardCharsets.US_ASCII);
    static final byte[] CODE_SIG = "3G+K5ogPPFkNRpLiDIv9P95gCmUadE7pEsVmFC6IJAmeRTIO4CwrnNArcg/ycRu1ajc0c4GyvFwh41VRzh+jCA==".getBytes(StandardCharsets.US_ASCII);
    static final byte[] FREMD_SIG = "RTlFOG/yFBHuApQmFg/O2ZhArdbjuvnjcSA8XRawDzScywX/EALSEsESgxOX2ySpaH02go37I92n9fyLA5gOAQ==".getBytes(StandardCharsets.US_ASCII);
    static String fehler(byte[] f, byte[] s, String v, long c) {
        try { UpdateFeed.auswerten(f, s, v, c, PUB); return ""; } catch (IOException e) { return e.getMessage(); }
    }

    @Test public void neuereVersionMitEchterUnterschrift() throws Exception {
        UpdateFeed.Angebot a = UpdateFeed.auswerten(NEU, NEU_SIG, "2.28.2", 29, PUB);
        assertNotNull(a);
        assertEquals("2.28.3", a.version); assertEquals("Familienakte-android-v2.28.3.apk", a.datei); assertEquals(1234, a.groesse); assertEquals(30, a.versionCode);
    }
    @Test public void zusatzImVersionsnamenWirdIgnoriert() throws Exception { assertNotNull(UpdateFeed.auswerten(NEU, NEU_SIG, "2.28.2-test", 29, PUB)); }
    @Test public void gleicheOderAeltereVersionIstAktuell() throws Exception {
        assertNull(UpdateFeed.auswerten(NEU, NEU_SIG, "2.28.3", 30, PUB));
        assertNull(UpdateFeed.auswerten(NEU, NEU_SIG, "2.29.0", 99, PUB));
    }
    @Test public void versionCodeMussSteigen() throws Exception { assertNull(UpdateFeed.auswerten(CODE, CODE_SIG, "2.28.2", 20, PUB)); }
    @Test public void fremdeUnterschrift() { assertEquals("UPDATE_UNTERSCHRIFT_FALSCH", fehler(NEU, FREMD_SIG, "2.28.2", 29)); }
    @Test public void veraenderteAngaben() {
        byte[] f = NEU.clone(); f[f.length - 3] = '9';
        assertEquals("UPDATE_UNTERSCHRIFT_FALSCH", fehler(f, NEU_SIG, "2.28.2", 29));
    }
    @Test public void kaputteUnterschrift() { assertEquals("UPDATE_UNTERSCHRIFT_FALSCH", fehler(NEU, "@@@".getBytes(StandardCharsets.US_ASCII), "2.28.2", 29)); }
    @Test public void fremderDateinameAuchUnterschrieben() { assertEquals("UPDATE_UNGUELTIG", fehler(BOESE, BOESE_SIG, "2.28.2", 29)); }
    @Test public void eingebauterSchluesselIstKlausSchluessel() {
        assertEquals(44, UpdateFeed.b64(UpdateFeed.SCHLUESSEL).length);
        assertEquals("MCowBQYDK2VwAyEAVPL7YyoS3LRmr3pgJcjXOPIH1puFG7wAwPIRSKMA5uc=", UpdateFeed.SCHLUESSEL);
        assertEquals("https://family-projekt.de/updates/familienakte/", UpdateFeed.BASIS);
    }
    @Test public void base64() {
        assertArrayEquals("ab".getBytes(StandardCharsets.US_ASCII), UpdateFeed.b64("YWI="));
        assertArrayEquals("abcd".getBytes(StandardCharsets.US_ASCII), UpdateFeed.b64("YWJjZA"));
    }
    @Test public void versionsvergleich() {
        assertTrue(UpdateFeed.neuer("2.28.10", "2.28.9")); assertFalse(UpdateFeed.neuer("2.28.2", "2.28.2")); assertFalse(UpdateFeed.neuer("3.0.0-x", "2.0.0"));
    }
}
