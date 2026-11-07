package de.familyprojekt.familienakte;

import androidx.test.core.app.ActivityScenario;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

/** Explicit fixture preparation through the normal Demo button. Real packaged
 * UI, real local files; no production test hook and no native/storage mock. */
final class FamilyDemoFixture {
    private static String eval(ActivityScenario<MainActivity> app, String js) throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        app.onActivity(a -> a.getBridge().getWebView().evaluateJavascript(js, value -> { result.set(value); done.countDown(); }));
        assertTrue("Fixture WebView evaluation completed", done.await(10, TimeUnit.SECONDS));
        return result.get();
    }
    private static void until(ActivityScenario<MainActivity> app, String condition) throws Exception {
        long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(120);
        while (System.nanoTime() < end) {
            if ("true".equals(eval(app, condition))) return;
            Thread.sleep(150);
        }
        fail("Demo fixture not ready: " + condition + " / " + eval(app, "location.href"));
    }
    // Since 07.11.2026 the start button reads "Demo starten" and carries data-demo-start (the box also holds a "?" button).
    static void open(ActivityScenario<MainActivity> app) throws Exception {
        until(app, "Boolean(document.querySelector('.site-header[data-demo-bereit=\\'ja\\']'))");
        if (!"true".equals(eval(app, "new URLSearchParams(location.search).get('demo')==='1'"))) {
            eval(app, "[...document.querySelectorAll('.footer-directory button')].find(b=>b.textContent.trim()==='Hilfe').click();true");
            until(app, "Boolean(document.querySelector('.demo-starten [data-demo-start]')&&!document.querySelector('.demo-starten [data-demo-start]').disabled)");
            eval(app, "document.querySelector('.demo-starten [data-demo-start]').click();true");
        }
        until(app, "Boolean(new URLSearchParams(location.search).get('demo')==='1'&&document.querySelector('.site-header[data-demo-beispiele=\\'ja\\'][data-demo-bereit=\\'ja\\']'))");
    }
}
