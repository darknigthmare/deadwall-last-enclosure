import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {createGameServer} from './server.mjs';
import {ready} from './browser-qa-common142.mjs';
import {activate,saveReloadContinue} from './browser-qa-common144.mjs';
const output=path.resolve(process.env.QUALITY199_QA_OUT||'artifacts/qa/quality199');await mkdir(output,{recursive:true});
const root=path.resolve(process.env.DEADWALL_QA_ROOT||'dist');
const report={root,scope:'Native unconfigured player entry and notebook controls on dist. Explicit storage and audio-device fault injection while paused; no physical quota claim or listening test. No seed, world, inventory, health or game-time injection. Failed writes log the marked expected fault. No author-mode URL.',profiles:[],pass:false};
const server=createGameServer({rootDirectory:root});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 for(const view of [{name:'desktop',width:1366,height:900},{name:'portrait',width:390,height:844,touch:true}]){
  const p={viewport:view,checks:[],errors:[],expectedStorageErrors:[]};report.profiles.push(p);
  const context=await browser.newContext({viewport:{width:view.width,height:view.height},hasTouch:!!view.touch,isMobile:!!view.touch,serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(90000);
  page.on('pageerror',e=>p.errors.push(String(e)));page.on('requestfailed',r=>p.errors.push(r.url()+' '+r.failure()?.errorText));page.on('response',r=>{if(r.status()>=400)p.errors.push(r.status()+' '+r.url());});
  page.on('console',m=>{if(m.type()==='error'){if(m.text().includes('STORAGE_FAULT_199'))p.expectedStorageErrors.push(m.text());else p.errors.push(m.text());}});
  const check=(label,value)=>{p.checks.push({label,pass:!!value});assert.ok(value,label);};const click=s=>activate(page,s,!!view.touch);
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'networkidle',timeout:120000});await ready(page);
   await click('#newGameButton');await page.waitForFunction(()=>DEADWALL.campaignIntro132.isOpen());await click('#campaignIntro132Skip');await page.waitForFunction(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay);
   await click('#pauseButton');check('Normal entry retains the current campaign defaults',await page.evaluate(()=>{const p=DEADWALL.frontier.position();return p.generation===10&&p.detailVersion===13&&p.landscape189==='balanced';}));
   const fault=await page.evaluate(()=>{
    const g=DEADWALL,C=DeadwallCore,stable=()=>{const{timestamp,...s}=g.serialize();return JSON.stringify(s);};
    if(!g.save(false))throw Error('Initial real save failed before injection');
    const before=stable(),primary=localStorage.getItem(C.SAVE_KEY),backup=localStorage.getItem(C.SAVE_BACKUP_KEY),id=g.notificationId;
    window.__quality199StoragePut=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){if(this===localStorage&&[C.SAVE_KEY,C.SAVE_BACKUP_KEY].includes(key))throw Error('STORAGE_FAULT_199');return __quality199StoragePut.call(this,key,value);};
    try{const first=g.save(false),second=g.save(false),notices=g.notifications.filter(n=>n.id>=id);return{first,second,notices:structuredClone(notices),before,primary,backup,sameState:stable()===before,copiesPreserved:primary===localStorage.getItem(C.SAVE_KEY)&&backup===localStorage.getItem(C.SAVE_BACKUP_KEY)};}
    finally{Storage.prototype.setItem=__quality199StoragePut;delete window.__quality199StoragePut;}
   });
   check('Repeated failed autosaves alert once without changing either saved copy or campaign',!fault.first&&!fault.second&&fault.notices.length===1&&fault.notices[0].tone==='danger'&&fault.copiesPreserved&&fault.sameState);
   const recovery=await page.evaluate(()=>{const g=DEADWALL,id=g.notificationId,ok=g.save(false),again=g.save(false);return{ok,again,notices:structuredClone(g.notifications.filter(n=>n.id>=id))};});
   check('Restored storage saves normally and announces recovery once',recovery.ok&&recovery.again&&recovery.notices.length===1&&recovery.notices[0].tone==='good'&&recovery.notices[0].text.includes('rétablie'));
   await click('#pauseSettingsButton');await page.screenshot({path:path.join(output,view.name+'-storage-recovery.png')});await click('#settingsClose');
   await click('#pauseCommandButton');await click('#commandTab-workers');
   const audio=await page.evaluate(()=>{const a=DEADWALL.audio;if(!a.unlock()||!a.ctx)throw Error('A real browser AudioContext is required');window.__quality199AudioOriginal=a.ctx.createOscillator;window.__quality199AudioFaults=0;a.ctx.createOscillator=()=>{__quality199AudioFaults++;throw Error('AUDIO_FAULT_199');};return{voices:a.voices,state:a.ctx.state};});
   try{await click('[data-worker-order="harvest"]');check('A real notebook order survives an injected WebAudio allocation failure',await page.evaluate(()=>DEADWALL.workerOrder==='harvest'&&__quality199AudioFaults>0));}
   finally{await page.evaluate(()=>{DEADWALL.audio.ctx.createOscillator=__quality199AudioOriginal;delete window.__quality199AudioOriginal;});}
   check('Failed audio allocation cannot strand the voice budget',await page.evaluate(n=>DEADWALL.audio.voices<=n,audio.voices));
   await page.evaluate(()=>DEADWALL.expansionUI.open('husbandry191'));
   const blank=await page.evaluate(()=>{const g=DEADWALL,stable=()=>{const{timestamp,...s}=g.serialize();return JSON.stringify(s);},before=stable(),rows=g.husbandry191.reports();return{rows,unchanged:before===stable()};});
   check('Consulting an empty farm registry creates no animal, resource or enclosure',blank.rows.length===0&&blank.unchanged);
   await page.screenshot({path:path.join(output,view.name+'-registry.png')});await click('#commandClose');if(await page.locator('#pauseMenu').isVisible())await click('#resumeButton');
   p.recovery=await saveReloadContinue(page,!!view.touch);check('Native save, menu, reload and Continue preserve all persistent owners',p.recovery.pass);
   check('Only the two deliberately failed storage attempts produce error logs',p.expectedStorageErrors.length===2&&p.errors.length===0);
  }catch(e){p.failure=String(e.stack||e);await page.screenshot({path:path.join(output,view.name+'-failure.png')}).catch(()=>{});}
  finally{await context.close();}
 }
 assert.ok(report.profiles.every(p=>!p.failure),'Every profile must pass');report.pass=true;
}catch(e){report.failure=String(e.stack||e);process.exitCode=1;}
finally{await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));console.log(JSON.stringify({pass:report.pass,output,failure:report.failure}));}
