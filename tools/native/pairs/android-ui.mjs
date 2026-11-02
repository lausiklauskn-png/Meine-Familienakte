// Drives Android's actual DocumentsUI and password dialogs, with no granted URI fixture.
import {execFileSync} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
export const adb=(...args)=>execFileSync('adb',args,{encoding:'utf8',timeout:20000});
const unescape=s=>s.replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>');
function nodes(){
 adb('shell','uiautomator','dump','/sdcard/pair-ui.xml');const xml=adb('exec-out','cat','/sdcard/pair-ui.xml');
 return [...xml.matchAll(/<node\s+([^>]+)>/g)].map(m=>Object.fromEntries([...m[1].matchAll(/([a-z-]+)="([^"]*)"/g)].map(a=>[a[1],unescape(a[2])])));
}
async function waitNode(test,label){let last=[];for(let i=0;i<25;i++){try{last=nodes();
 // The emulator launcher sometimes stalls during boot. Dismiss only that
 // unrelated process; any tested app ANR remains a visible failure.
 if(last.some(n=>n.text==="Pixel Launcher isn't responding")){const close=last.find(n=>n['resource-id']==='android:id/aerr_close');if(close){console.warn('Emulator: closing unresponsive Pixel Launcher');tap(close);continue;}}
 const node=last.find(test);if(node)return node;}catch{/* activity transition */}await pause(300);}throw Error('Android UI missing '+label+'; '+JSON.stringify(last.map(n=>({text:n.text,desc:n['content-desc'],id:n['resource-id'],class:n.class}))).slice(0,5000));}
function tap(n){const p=[...n.bounds.matchAll(/\d+/g)].map(x=>Number(x[0]));if(p.length!==4)throw Error('Android bounds missing');adb('shell','input','tap',String(Math.floor((p[0]+p[2])/2)),String(Math.floor((p[1]+p[3])/2)));}
export async function chooseFolder(){
 const roots=await waitNode(n=>/Show roots|Open navigation drawer|Wurzeln anzeigen|Navigation öffnen/.test(n['content-desc']||''),'DocumentsUI navigation');tap(roots);
 tap(await waitNode(n=>n.text==='Pro-Paarprüfung','test provider root'));
 tap(await waitNode(n=>/^(USE THIS FOLDER|Use this folder|DIESEN ORDNER VERWENDEN|Diesen Ordner verwenden)$/i.test(n.text),'explicit folder choice'));
 tap(await waitNode(n=>/^(ALLOW|Allow|ZULASSEN|Zulassen)$/i.test(n.text),'persistent access confirmation'));
}
export async function password(value){
 const field=await waitNode(n=>n.class==='android.widget.EditText','native password');tap(field);adb('shell','input','text',value);
 const current=nodes();for(const checkbox of current.filter(n=>n.class==='android.widget.CheckBox'&&n.checked==='false'))tap(checkbox);
 tap(await waitNode(n=>n['resource-id']==='android:id/button1','native positive button'));
}
export async function saveFile(){
 tap(await waitNode(n=>/Show roots|Open navigation drawer|Wurzeln anzeigen|Navigation öffnen/.test(n['content-desc']||''),'save destination navigation'));
 tap(await waitNode(n=>n.text==='Pro-Paarprüfung','save destination root'));
 tap(await waitNode(n=>/^(SAVE|SPEICHERN)$/i.test(n.text),'actual document save'));
}
