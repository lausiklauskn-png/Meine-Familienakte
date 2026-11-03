package de.familyprojekt.familienakte;

import android.view.KeyEvent;
import androidx.lifecycle.Lifecycle;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

/** Actual installed APK and Android Back events, including Back beyond the first view. */
@RunWith(AndroidJUnit4.class)
public final class FamilyNavigationProductTest {
    private String eval(ActivityScenario<MainActivity> app,String js)throws Exception{
        CountDownLatch done=new CountDownLatch(1);AtomicReference<String> result=new AtomicReference<>();
        app.onActivity(a->a.getBridge().getWebView().evaluateJavascript(js,r->{result.set(r);done.countDown();}));
        assertTrue(done.await(10,TimeUnit.SECONDS));return result.get();
    }
    private void until(ActivityScenario<MainActivity> app,String js)throws Exception{
        long end=System.nanoTime()+TimeUnit.SECONDS.toNanos(90);
        while(!"true".equals(eval(app,js))){assertTrue(js,System.nanoTime()<end);Thread.sleep(100);}
    }
    private void back(){InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);}
    @Test public void backReturnsThroughViewsAndStaysOpenAtBeginning()throws Exception{
        try(ActivityScenario<MainActivity> app=ActivityScenario.launch(MainActivity.class)){
            until(app,"typeof window.familienakteZurueck==='function'&&!!document.querySelector('.footer-directory')");
            String initial=eval(app,"location.href");
            eval(app,"window.__backMemory='ERFUNDENE-PROBE-017';[...document.querySelectorAll('.footer-directory button')].find(b=>b.textContent.trim()==='Dokumentenbibliothek').click();true");
            until(app,"location.hash==='#documents'");
            eval(app,"[...document.querySelectorAll('.footer-directory button')].find(b=>b.textContent.trim()==='Hilfe').click();true");
            until(app,"location.hash==='#help'");back();until(app,"location.hash==='#documents'");
            back();until(app,"location.href==="+initial);
            for(int i=0;i<10;i++)back();
            InstrumentationRegistry.getInstrumentation().waitForIdleSync();
            assertEquals("Back at the beginning must not background the APK",Lifecycle.State.RESUMED,app.getState());
            assertEquals(initial,eval(app,"location.href"));
            assertEquals("\"ERFUNDENE-PROBE-017\"",eval(app,"__backMemory"));
            app.onActivity(a->{assertFalse(a.isFinishing());assertFalse(a.isDestroyed());});
        }
    }
}
