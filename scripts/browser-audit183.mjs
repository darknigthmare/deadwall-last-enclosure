import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createHarness,recorder,ready,chooseCampaign} from './browser-qa-common142.mjs';
import {activate,saveReloadContinue} from './browser-qa-common144.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
// Fail if dist is missing; never silently fall back to the source server.
process.env.DEADWALL_QA_ROOT=path.resolve(process.env.DEADWALL_QA_ROOT||path.join(root,'dist'));
const entry=await readFile(path.join(process.env.DEADWALL_QA_ROOT,'index.html'));
const harness=await createHarness('audit183','Built distribution only. Native menu, new campaign, movement, pause/save/menu/reload/continue and responsive HUD. No resources, age or coordinates injected. This is not an entire campaign or physical-device benchmark.');
const {browser,base,report,output}=harness;report.root=process.env.DEADWALL_QA_ROOT;report.entrySHA256=createHash('sha256').update(entry).digest('hex');report.profiles=[];report.pass=false;
try{
 for(const viewport of [{name:'desktop',width:1366,height:768},{name:'portrait',width:390,height:844,touch:true},{name:'landscape',width:844,height:390,touch:true}]){
  const profile={viewport};report.profiles.push(profile);const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(120000);
  const rec=recorder(page,profile,output,viewport.name+'-');
  try{
   await page.goto(base,{waitUntil:'networkidle',timeout:120000});await ready(page);
   const served=Buffer.from(await (await page.request.get(base)).body());rec.check('Served index is byte-identical to the selected distribution',createHash('sha256').update(served).digest('hex')===report.entrySHA256);
   await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',viewport.touch);await page.waitForFunction(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay);
   profile.modules=await page.evaluate(()=>({hydrology:!!globalThis.DeadwallHydrology165,ecology:!!globalThis.DeadwallBiomes164,water:!!globalThis.DeadwallWaterArt165,wildlife:!!globalThis.DeadwallWildlifeArt165,vertical:!!DEADWALL.vertical175,save:DEADWALL.serialize().frontier}));
   rec.check('Bundled ecology, water, fauna and citadel are installed',profile.modules.hydrology&&profile.modules.ecology&&profile.modules.water&&profile.modules.wildlife&&profile.modules.vertical);
   rec.check('Actual new campaign uses ecology and hydrology',profile.modules.save.ecologyVersion===1&&profile.modules.save.hydrologyVersion===1);
   await rec.screenshot('new-campaign');
   if(!viewport.touch){
    const before=await page.evaluate(()=>({x:DEADWALL.player.x,y:DEADWALL.player.y}));await page.locator('#game').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');
    const after=await page.evaluate(()=>({x:DEADWALL.player.x,y:DEADWALL.player.y}));rec.check('Native movement changes player position',Math.hypot(after.x-before.x,after.y-before.y)>1);
   }
   profile.saved=await saveReloadContinue(page,!!viewport.touch);rec.check('Save/menu/reload/Continue preserves persistent state',profile.saved.pass);
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,objective:document.getElementById('objectiveTitle').checkVisibility(),short:document.getElementById('hud').dataset.short}));
   rec.check('Objective remains available without horizontal overflow',layout.objective&&!layout.overflow);
   await rec.screenshot('continue');rec.check('No browser or network errors',rec.errors()===0);
  }finally{await context.close();}
 }
 report.pass=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{await harness.finish();await harness.close();console.log(JSON.stringify({pass:report.pass,report:output,failure:report.failure}));}
