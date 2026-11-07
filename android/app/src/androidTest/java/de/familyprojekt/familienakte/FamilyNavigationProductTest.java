package de.familyprojekt.familienakte;

import android.view.KeyEvent;
import android.view.MotionEvent;
import android.os.SystemClock;
import androidx.lifecycle.Lifecycle;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.*;
import java.io.File;
import java.util.concurrent.atomic.AtomicBoolean;
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
        while(!"true".equals(eval(app,js))){
            if(System.nanoTime()>=end)fail(js+" / "+eval(app,"JSON.stringify({url:location.href,activation:navigator.userActivation?.hasBeenActive,dialog:document.querySelector('[role=dialog],.modal')?.className})"));
            Thread.sleep(100);
        }
    }
    private void back(){InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);}
    private void focus(ActivityScenario<MainActivity> app)throws Exception{
        UiDevice device=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        AtomicBoolean focused=new AtomicBoolean();long end=System.nanoTime()+TimeUnit.SECONDS.toNanos(15);
        while(System.nanoTime()<end){
            // Only the known SDK launcher's ANR may be closed. An ANR of the
            // app under test remains visible and makes this probe fail.
            UiObject2 launcher=device.findObject(By.res("android:id/alertTitle").text("Pixel Launcher isn't responding"));
            if(launcher!=null){
                android.util.Log.w("FamilyNavigation","Close pre-existing SDK Pixel Launcher ANR");
                UiObject2 close=device.findObject(By.res("android:id/aerr_close"));assertNotNull(close);close.click();
                device.wait(Until.gone(By.res("android:id/alertTitle").text("Pixel Launcher isn't responding")),5000);
            }
            // The app runs full screen (Klaus 2026-11-07). On the first immersive start Android shows its own one-time
            // hint ("Viewing full screen", button android:id/ok) above the app; a user confirms it once, so does this probe.
            UiObject2 hint=device.findObject(By.pkg("android").res("android:id/ok"));
            if(hint!=null){
                android.util.Log.w("FamilyNavigation","Confirm Android full-screen hint");
                hint.click();device.wait(Until.gone(By.pkg("android").res("android:id/ok")),5000);
            }
            app.onActivity(a->focused.set(a.hasWindowFocus()&&a.getBridge().getWebView().isShown()&&a.getBridge().getWebView().getHeight()>100));
            if(focused.get())return;Thread.sleep(100);
        }
        File cache=InstrumentationRegistry.getInstrumentation().getTargetContext().getFilesDir();
        device.dumpWindowHierarchy(new File(cache,"navigation-focus.xml"));device.takeScreenshot(new File(cache,"navigation-focus.png"));
        StringBuilder system=new StringBuilder();
        for(UiObject2 o:device.findObjects(By.pkg("android"))){String t=o.getText(),r=o.getResourceName();if(t!=null||r!=null)system.append(" [").append(r).append(": ").append(t).append("]");}
        fail("Family window must own focus before real input; foreground="+device.getCurrentPackageName()+system);
    }
    @Test public void backReturnsThroughViewsAndStaysOpenAtBeginning()throws Exception{
        try(ActivityScenario<MainActivity> app=ActivityScenario.launch(MainActivity.class)){
            until(app,"typeof window.familienakteZurueck==='function'&&!!document.querySelector('.footer-directory')");
            focus(app);
            // Android/WebView guards history traversal before the first trusted
            // input. A real tap must precede a programmatically prepared route.
            int[] point=new int[2];app.onActivity(a->{a.getBridge().getWebView().getLocationOnScreen(point);point[0]+=4;point[1]+=a.getBridge().getWebView().getHeight()/2;});
            long tap=SystemClock.uptimeMillis();
            for(int action:new int[]{MotionEvent.ACTION_DOWN,MotionEvent.ACTION_UP}){
                MotionEvent event=MotionEvent.obtain(tap,SystemClock.uptimeMillis(),action,point[0],point[1],0);
                InstrumentationRegistry.getInstrumentation().sendPointerSync(event);event.recycle();
            }
            until(app,"navigator.userActivation.hasBeenActive");
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
