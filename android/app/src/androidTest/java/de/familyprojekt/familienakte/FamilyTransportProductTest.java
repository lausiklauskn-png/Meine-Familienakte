package de.familyprojekt.familienakte;

import android.app.*;
import android.content.*;
import androidx.core.content.FileProvider;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.*;
import java.nio.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import org.json.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

/** Real packaged UI, native output plugin, original bytes and local database.
 * Only the system picker's return URI/cancellation is supplied by a test monitor. */
@RunWith(AndroidJUnit4.class)
public final class FamilyTransportProductTest {
    private String eval(ActivityScenario<MainActivity> app, String js) throws Exception {
        CountDownLatch done=new CountDownLatch(1);AtomicReference<String> result=new AtomicReference<>();
        app.onActivity(a->a.getBridge().getWebView().evaluateJavascript(js,v->{result.set(v);done.countDown();}));
        assertTrue(done.await(10,TimeUnit.SECONDS));return result.get();
    }
    private void until(ActivityScenario<MainActivity> app,String js) throws Exception {
        long end=System.nanoTime()+TimeUnit.SECONDS.toNanos(120);
        while(System.nanoTime()<end){if("true".equals(eval(app,js)))return;Thread.sleep(150);}
        fail(js+" / "+eval(app,"document.querySelector('.pro-geraetetransport')?.textContent"));
    }
    private void panel(ActivityScenario<MainActivity> app) throws Exception {
        until(app,"Boolean(document.querySelector('.sample-data-notice strong'))");
        eval(app,"[...document.querySelectorAll('.footer-directory button')].find(b=>b.textContent.includes('Sicherheitscenter')).click();true");
        until(app,"document.querySelectorAll('.pro-geraetetransport select option').length>1");
    }
    private void click(ActivityScenario<MainActivity> app,String title) throws Exception {
        eval(app,"[...document.querySelectorAll('.pro-geraetetransport button')].find(b=>b.textContent==="+JSONObject.quote(title)+").click();true");
    }
    @Test public void cancelledNativePacketSaveCanResumeAfterRecreationWithIdenticalContract() throws Exception {
        Instrumentation ins=InstrumentationRegistry.getInstrumentation();Context context=ins.getTargetContext();
        File target=new File(context.getCacheDir(),"synthetic-family-transport.bin");AtomicInteger hits=new AtomicInteger();
        Instrumentation.ActivityMonitor monitor=new Instrumentation.ActivityMonitor(){
            @Override public Instrumentation.ActivityResult onStartActivity(Intent intent){
                if(!Intent.ACTION_CREATE_DOCUMENT.equals(intent.getAction()))return null;
                if(hits.incrementAndGet()==1)return new Instrumentation.ActivityResult(Activity.RESULT_CANCELED,null);
                try{if(!target.exists())target.createNewFile();}catch(IOException e){throw new AssertionError(e);}
                return new Instrumentation.ActivityResult(Activity.RESULT_OK,new Intent().setData(FileProvider.getUriForFile(context,context.getPackageName()+".fileprovider",target)));
            }
        };ins.addMonitor(monitor);
        try(ActivityScenario<MainActivity> app=ActivityScenario.launch(MainActivity.class)){
            panel(app);
            eval(app,"const root=document.querySelector('.pro-geraetetransport'),s=root.querySelector('select'),i=root.querySelector('input:not([type=file])');s.value=s.options[1].value;s.dispatchEvent(new Event('change',{bubbles:true}));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'Erfundenes Zielgerät');i.dispatchEvent(new Event('input',{bubbles:true}));true");
            until(app,"[...document.querySelectorAll('.pro-geraetetransport button')].some(b=>b.textContent==='Übergabepaket speichern'&&!b.disabled)");click(app,"Übergabepaket speichern");
            until(app,"document.querySelector('.pro-geraetetransport [role=status]')?.textContent.includes('abgebrochen')");
            assertFalse(target.exists());assertEquals(1,hits.get());
            app.recreate();panel(app);click(app,"Dasselbe Paket erneut speichern");
            until(app,"document.querySelector('.pro-geraetetransport [role=status]')?.textContent.includes('Datei gespeichert')");assertEquals(2,hits.get());
            byte[] packet=Files.readAllBytes(target.toPath());assertTrue(packet.length>12);
            assertArrayEquals(new byte[]{70,65,80,82,79,49,10,0},java.util.Arrays.copyOf(packet,8));
            int length=ByteBuffer.wrap(packet).getInt(8);JSONObject header=new JSONObject(new String(packet,12,length,StandardCharsets.UTF_8));
            byte[] original=java.util.Arrays.copyOfRange(packet,12+length,packet.length);
            StringBuilder hex=new StringBuilder();for(byte b:MessageDigest.getInstance("SHA-256").digest(original))hex.append(String.format("%02x",b&255));
            assertEquals(header.getJSONObject("vertrag").getString("sha256"),hex.toString());assertEquals(original.length,header.getJSONObject("vertrag").getInt("groesse"));
            click(app,"Dasselbe Paket erneut speichern");until(app,"document.querySelector('.pro-geraetetransport [role=status]')?.textContent.includes('Datei gespeichert')");assertEquals(3,hits.get());assertArrayEquals(packet,Files.readAllBytes(target.toPath()));
            File[] leftovers=new File(context.getCacheDir(),"workflow-exports").listFiles();assertTrue(leftovers==null||leftovers.length==0);
            assertEquals("true",eval(app,"document.querySelector('.pro-geraetetransport').textContent.includes('Empfang offen')"));
        }finally{ins.removeMonitor(monitor);target.delete();}
    }
}
