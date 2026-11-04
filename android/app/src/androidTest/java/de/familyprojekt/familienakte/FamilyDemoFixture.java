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
    static void open(ActivityScenario<MainActivity> app) throws Exception {
        until(app, "Boolean(document.querySelector('.demo-workspace button')&&!document.querySelector('.demo-workspace button').disabled)");
        if (!"true".equals(eval(app, "new URLSearchParams(location.search).get('demo')==='1'"))) {
            eval(app, "[...document.querySelectorAll('.demo-workspace button')].find(b=>b.textContent==='Demo öffnen').click();true");
        }
        until(app, "Boolean(new URLSearchParams(location.search).get('demo')==='1'&&document.querySelector('.demo-workspace.sample-data-notice strong')&&!document.querySelector('.demo-workspace button').disabled)");
    }
}
