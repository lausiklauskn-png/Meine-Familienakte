package de.familyprojekt.familienakte;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

/** Installed debug APK, real native device/model plugins, actual pinned small
 * model, production Worker and IndexedDB. All documents are the invented sample
 * family. This is an emulator probe, not a physical SD-card or tablet test. */
@RunWith(AndroidJUnit4.class)
public final class FamilyModelProductTest {
    private String eval(ActivityScenario<MainActivity> app, String js) throws Exception {
        CountDownLatch done = new CountDownLatch(1); AtomicReference<String> result = new AtomicReference<>();
        app.onActivity(a -> a.getBridge().getWebView().evaluateJavascript(js, value -> { result.set(value); done.countDown(); }));
        assertTrue("WebView evaluation completed", done.await(10, TimeUnit.SECONDS)); return result.get();
    }
    private void until(ActivityScenario<MainActivity> app, String condition, int seconds) throws Exception {
        long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(seconds);
        while (System.nanoTime() < end) { if ("true".equals(eval(app, condition))) return; Thread.sleep(200); }
        fail("Condition did not become true: " + condition + " " + eval(app, "JSON.stringify({error:window.__modelError,status:document.querySelector('.private-meaning')?.textContent?.slice(-1800)})"));
    }
    private String object(ActivityScenario<MainActivity> app, String expression) throws Exception {
        return (String) new JSONTokener(eval(app, "JSON.stringify(" + expression + ")")).nextValue();
    }
    private void ready(ActivityScenario<MainActivity> app) throws Exception {
        FamilyDemoFixture.open(app);
        until(app, "Boolean(window.PBNetwork?.ready&&window.Capacitor?.Plugins?.FamilyModels)", 120);
    }
    private void panel(ActivityScenario<MainActivity> app) throws Exception {
        eval(app, "[...document.querySelectorAll('.footer-directory button')].find(b=>b.textContent.includes('Sicherheitscenter')).click();true");
        until(app, "Boolean(document.querySelector('.private-meaning button.button[aria-expanded]'))", 15);
        eval(app, "document.querySelector('.private-meaning button.button[aria-expanded]').click();true");
    }
    private void click(ActivityScenario<MainActivity> app, String text) throws Exception {
        eval(app, "[...document.querySelectorAll('.private-meaning button')].find(b=>b.textContent===" + JSONObject.quote(text) + ").click();true");
    }
    @Test public void actualNativeModelAndPrivateSearchSurviveActivityRestart() throws Exception {
        try (ActivityScenario<MainActivity> app = ActivityScenario.launch(MainActivity.class)) {
            ready(app);
            eval(app, "window.__modelError=null;window.__modelProof=null;(async()=>{const p=Capacitor.Plugins;await PBNetwork.setOffline(true);const s=await p.FamilyModels.getState();let blocked=false;try{await p.FamilyModels.install({stage:'klein'});}catch{blocked=true;}window.__modelProof={blocked,state:s,device:await p.ProDevice.measure()};})().catch(e=>window.__modelError=String(e));true");
            until(app, "Boolean(window.__modelProof||window.__modelError)", 30);
            JSONObject proof = new JSONObject(object(app, "window.__modelProof"));
            assertTrue(proof.getBoolean("blocked")); assertTrue(proof.getJSONObject("state").getBoolean("localAssets"));
            assertEquals("android", proof.getJSONObject("device").getString("platform"));
            assertFalse(proof.getJSONObject("state").getJSONObject("models").getJSONObject("klein").getBoolean("installed"));
            panel(app); click(app, "Dieses Gerät prüfen");
            until(app, "document.querySelector('.private-meaning')?.textContent.includes('Quelle: android')", 30);
            eval(app, "window.__modelDownload=null;(async()=>{await PBNetwork.setOffline(false);await Capacitor.Plugins.FamilyModels.install({stage:'klein'});let s;do{await new Promise(r=>setTimeout(r,1000));s=(await Capacitor.Plugins.FamilyModels.getState()).models.klein;}while(s.running);await PBNetwork.setOffline(true);window.__modelDownload=s;})().catch(e=>window.__modelError=String(e));true");
            until(app, "Boolean(window.__modelDownload||window.__modelError)", 720);
            JSONObject downloaded = new JSONObject(object(app, "window.__modelDownload"));
            assertEquals("", downloaded.getString("error")); assertTrue(downloaded.getBoolean("installed"));
            until(app, "[...document.querySelectorAll('.private-meaning button')].some(b=>b.textContent==='Index aufbauen / fortsetzen'&&!b.disabled)", 15);
            click(app, "Index aufbauen / fortsetzen");
            until(app, "document.querySelector('.private-meaning')?.textContent.includes('Suchindex bereit:')", 240);
            app.recreate(); ready(app); panel(app);
            eval(app, "const q=document.querySelector('.private-meaning input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(q,'Waschautomat');q.dispatchEvent(new Event('input',{bubbles:true}));true");
            until(app, "[...document.querySelectorAll('.private-meaning button')].some(b=>b.textContent==='Nach Bedeutung suchen'&&!b.disabled)", 15);
            click(app, "Nach Bedeutung suchen");
            until(app, "Boolean(document.querySelector('.private-meaning .search-results button'))", 120);
            assertEquals("true", eval(app, "PBNetwork.offline===true"));
            eval(app, "window.__missingModel=null;fetch('/_fa_models/klein/model/not-pinned.json').then(r=>window.__missingModel=r.status);true");
            until(app, "window.__missingModel!==null", 15); assertEquals("404", eval(app, "window.__missingModel"));
            eval(app, "document.querySelector('.private-meaning .search-results button').click();true");
            until(app, "!document.querySelector('.private-meaning')", 15);
        }
    }
}
