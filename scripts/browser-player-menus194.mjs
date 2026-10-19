import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {createGameServer} from './server.mjs';
import {ready} from './browser-qa-common142.mjs';
import {saveReloadContinue} from './browser-qa-common144.mjs';

const root=path.resolve(process.env.DEADWALL_QA_ROOT||'dist');
const output=path.resolve(process.env.MENU194_QA_OUT||'artifacts/qa/player-menus194');await mkdir(output,{recursive:true});
const report={root,scope:'Untouched native title on the built distribution. No seed, stock, position, age or clock injection in player profiles. Menus pause normally. Save/reload observation records the restore synchronously, without modifying it. A separate explicit author URL checks availability, not the normal player experience.',profiles:[],errors:[],checks:[],pass:false};
const hash=b=>createHash('sha256').update(b).digest('hex');report.entrySHA256=hash(await readFile(path.join(root,'index.html')));
const server=createGameServer({rootDirectory:root});await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});
const base='http://127.0.0.1:'+server.address().port+'/';let browser;
const snapshot=page=>page.evaluate(()=>{const{timestamp,...s}=DEADWALL.serialize();return JSON.stringify(s);});
const panels=page=>page.evaluate(()=>[...document.querySelector('#commandPanel-field').children].filter(n=>n.tagName==='SECTION'&&n.checkVisibility()).map(n=>n.id));
const errors=page=>{page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('requestfailed',r=>report.errors.push(r.url()+' '+r.failure()?.errorText));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});};
try{
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 for(const viewport of [{name:'desktop',width:1366,height:900},{name:'portrait',width:390,height:844,touch:true},{name:'landscape',width:844,height:390,touch:true}]){
  const profile={viewport,checks:[]};report.profiles.push(profile);const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(120000);errors(page);
  const click=async selector=>{const c=page.locator(selector);if(viewport.touch)await c.tap();else await c.click();};
  const check=(label,value)=>{profile.checks.push({label,pass:!!value});assert.ok(value,label);};
  const shot=async name=>{await page.screenshot({path:path.join(output,viewport.name+'-'+name+'.png')});};
  async function within(selector){await page.locator(selector).scrollIntoViewIfNeeded();return page.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return n.checkVisibility()&&r.height>=43&&r.x>=-1&&r.right<=innerWidth+1&&r.y>=-1&&r.bottom<=innerHeight+1&&!!hit&&(hit===n||n.contains(hit));});}
  try{
   await page.goto(base,{waitUntil:'networkidle',timeout:120000});await ready(page);await page.waitForFunction(()=>DEADWALL.playerMenus194?.mode==='player');
   check('The untouched native title has no fixture or author URL',new URL(page.url()).search==='');
   check('Current-content promise is associated with New game',await page.locator('#newGameButton').getAttribute('aria-describedby')==='newCampaignContent194');
   check('Advanced map choices stay folded before first start',!await page.locator('#campaignMap132').evaluate(n=>n.open));await shot('title');
   // Intentionally do not change any selector or even open its settings.
   await click('#newGameButton');await page.waitForFunction(()=>DEADWALL.campaignIntro132?.isOpen());
   profile.start=await page.evaluate(()=>({seed:DEADWALL.world.seed,run:DEADWALL.runId,frontier:DEADWALL.frontier.position()}));
   const f=profile.start.frontier;check('Default campaign is G10/detail13 with ecology, water and natural biomes',f.generation===10&&f.detailVersion===13&&f.ecologyVersion===1&&f.hydrologyVersion===1&&f.landscape189==='balanced');
   await click('#campaignIntro132Skip');await page.waitForFunction(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay);await shot('first-field');
   await click('#pauseButton');await click('#pauseCommandButton');await page.locator('#commandModal').waitFor({state:'visible'});const before=await snapshot(page);
   check('Notebook begins with the actual next gameplay objective',await page.evaluate(()=>document.getElementById('playerObjectiveTitle194').textContent===DEADWALL.ui.objectiveTitle.textContent&&!!DEADWALL.ui.objectiveTitle.textContent));
   check('System records are not a default tactical tab',!await page.locator('#commandTab-records').isVisible());
   check('Situation and notebook return controls are reachable',await within('#playerObjectiveReturn194'));await page.locator('.command-body').evaluate(n=>n.scrollTop=0);await shot('situation');
   await click('#commandTab-field');check('Field opens exactly one dossier',JSON.stringify(await panels(page))===JSON.stringify(['field-expansions']));
   await page.locator('#expansionGroup-world').click();
   const cards=await page.locator('#field-expansions .expansion-action button').evaluateAll(ns=>ns.map(n=>n.id));
   check('Player operations exclude compatibility conversions',cards.length>0&&cards.every(id=>!/(metricVehicle174|expandTerritories160|sanitationMedical164|packing173|expandCodex4000)$/.test(id)));
   const disclosure=page.locator('#unavailableActions194');check('Unavailable actions are grouped, not lost',await disclosure.count()===1&&await disclosure.locator('button').count()>0&&await disclosure.locator('button').evaluateAll(ns=>ns.every(n=>n.disabled)));
   await page.locator('.command-body').evaluate(n=>n.scrollTop=0);await shot('field-dossiers');
   for(const [folder,key,expected]of [['city','logistics','field-logistics'],['reference','world-codex','field-world-codex'],['terrain','operations','field-operations']]){
    await click('#notebookDomain-'+folder);await click('.field-nav [data-field-view="'+key+'"]');check('Folder '+folder+' exposes only its selected dossier',JSON.stringify(await panels(page))===JSON.stringify([expected]));
   }
   await click('#notebookDomain-reference');await click('.field-nav [data-field-view="world-codex"]');
   check('Player Guide exposes neither author programmes nor recipe labs',await page.evaluate(()=>!document.querySelector('#worldCodexStatus option[value="programme"]')&&!document.querySelector('#worldCodexFamily option[value="programmes"]')&&![...document.querySelectorAll('#worldCodexResults details')].some(n=>n.dataset.codexSource159)));
   const guideDetails=page.locator('#worldCodexResults details').first();if(await guideDetails.count()){await guideDetails.locator('summary').click();check('Opening a player guide entry does not mount an author inspector',await guideDetails.locator('.codex-plan165,.codex-lab173').count()===0);}
   await page.locator('.command-body').evaluate(n=>n.scrollTop=0);await shot('survival-guide');
   await click('#commandTab-workers');const oldOrder=await page.evaluate(()=>DEADWALL.workerOrder);await click('[data-worker-order="harvest"]');check('Existing paid/simulation owner receives a real worker order',await page.evaluate(()=>DEADWALL.workerOrder)==='harvest');await click('[data-worker-order="'+oldOrder+'"]');
   check('Reading dossiers and returning the existing order preserves all saved owners',await snapshot(page)===before);
   check('Notebook does not overflow the viewport',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.getElementById('commandModal').getBoundingClientRect().right<=innerWidth+1));
   await click('#commandClose');check('Notebook opened from Pause returns to Pause',await page.evaluate(()=>DEADWALL.paused&&DEADWALL.activeOverlay===DEADWALL.ui.pauseMenu));
   await click('#pauseRecords194');check('Campaign records remain reachable through Pause',await page.locator('#commandTab-records').getAttribute('aria-selected')==='true');await click('#commandClose');
   await click('#pauseSettingsButton');await click('#campaignMaintenance194 > summary');await shot('settings-compatibility');await click('#openCampaignMaintenance194');
   check('Compatibility is explicitly marked as system maintenance',await page.locator('#maintenanceBanner194').isVisible());
   check('Compatibility does not mix player relay orders',await page.locator('#field-expansions .expansion-action button').evaluateAll(ns=>ns.length>0&&ns.every(n=>DeadwallPlayerMenus194.isMaintenance('world131',n.id.replace('expansionAction-world131-','')))));
   check('Inspecting compatibility applies no migration or stock change',await snapshot(page)===before);
   await click('#maintenanceReturn194');await click('#settingsClose');check('Nested settings retain the deliberate pause',await page.evaluate(()=>DEADWALL.paused&&DEADWALL.activeOverlay===DEADWALL.ui.pauseMenu));await click('#resumeButton');
   profile.recovery=await saveReloadContinue(page,!!viewport.touch);check('Native save/menu/reload/Continue restores every persistent owner',profile.recovery.pass);
   check('Continue keeps G10/detail13 without a second introduction',await page.evaluate(()=>DEADWALL.frontier.position().generation===10&&DEADWALL.frontier.position().detailVersion===13&&!DEADWALL.campaignIntro132.isOpen()));
   await click('#pauseButton');await click('#quitButton');const menuSnapshot=await snapshot(page);page.once('dialog',d=>d.dismiss());await click('#newGameButton');check('Cancelling replacement preserves the current campaign',await snapshot(page)===menuSnapshot);
   await shot('returned-title');
  }catch(e){await shot('failure').catch(()=>{});throw e;}finally{await context.close();}
 }
 // A separate, explicit source-tool session, not a loophole in the player checks.
 const author=await browser.newPage({viewport:{width:1366,height:900}});errors(author);await author.goto(base+'?tools=1&fixture=legacy',{waitUntil:'networkidle',timeout:120000});await ready(author);await author.waitForFunction(()=>DEADWALL.playerMenus194?.mode==='author');
 assert.ok(await author.locator('#authorMode194').isVisible());assert.equal(await author.evaluate(()=>DeadwallPlayerMenus194.currentStart()),false);report.checks.push({label:'Author mode is explicitly labelled; historical fixtures are a separate opt-in',pass:true});await author.screenshot({path:path.join(output,'author-explicit.png')});await author.close();
 assert.deepEqual(report.errors,[]);report.pass=true;
}catch(e){report.failure=String(e.stack||e);process.exitCode=1;}
finally{await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r));console.log(JSON.stringify({pass:report.pass,output,failure:report.failure}));}
