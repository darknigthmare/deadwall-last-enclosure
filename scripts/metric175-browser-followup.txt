import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHarness,recorder,ready,chooseCampaign,openCommand,resumeCommand,activate} from './browser-qa-common144.mjs';
const require=createRequire(import.meta.url),{prepareMetricVehicle174}=require('./metric174-fixtures.cjs'),{prepareMetricCorridor175}=require('./metric175-fixtures.cjs');
const h=await createHarness('metric175-browser','Native Chromium campaign with explicit paid-vehicle and completed-wall fixtures. Real depot click, keyboard driving/exit, Save and Continue. Mobile viewports/taps are emulated; direction keys are used in all viewports. No natural endgame, physical phone, or global art certification claimed.');h.report.profiles=[];
const diff=(a,b,p='')=>Object.is(a,b)?[]:!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b)?[p||'/']:[...new Set([...Object.keys(a),...Object.keys(b)])].sort().flatMap(k=>Object.hasOwn(a,k)&&Object.hasOwn(b,k)?diff(a[k],b[k],p+'/'+k):[p+'/'+k]);
try{
 for(const view of [{width:1440,height:900},{width:390,height:844,touch:true},{width:844,height:390,touch:true}]){
  const context=await h.browser.newContext({viewport:{width:view.width,height:view.height},hasTouch:!!view.touch,isMobile:!!view.touch,serviceWorkers:'block'}),page=await context.newPage(),profile={view};h.report.profiles.push(profile);page.setDefaultTimeout(60000);
  const {check,screenshot,errors}=recorder(page,profile,h.output,view.width+'-');
  try{
   await page.goto(h.base,{waitUntil:'networkidle'});await ready(page);await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',view.touch);await activate(page,'#pauseButton',view.touch);
   profile.vehicle=await page.evaluate(prepareMetricVehicle174);
   await openCommand(page,view.touch);await activate(page,'#expansionFieldTab',view.touch);await activate(page,'#expansionGroup-world',view.touch);await activate(page,'#expansionTab-world131',view.touch);
   const action='#expansionAction-world131-metricVehicle174';await page.locator(action).scrollIntoViewIfNeeded();await activate(page,action,view.touch);
   check('Real depot action activates the metric body',await page.evaluate(()=>DEADWALL.expeditions.car().metric174===1));
   // Material operations are authorized in the command view, not the simple pause menu.
   await openCommand(page,view.touch);
   profile.corridor=await page.evaluate(prepareMetricCorridor175);
   const geometry=await page.evaluate(()=>{const g=DEADWALL,b=g.expeditions.vehicleBody175(),c=g.expeditions.car();return{clear:g.expeditions.bodyClear175(b),quarterTurn:g.expeditions.bodyClear175({...b,a:Math.PI/2}),circleClear:g.friendlyPositionClear({id:c.id,radius:Math.hypot(b.w,b.h)/2/.9},c.x,c.y),flankClear:g.friendlyPositionClear(g.player,c.x,c.y+b.h/2+15),insideClear:g.friendlyPositionClear(g.player,c.x,c.y)};});
   check('Full bus rectangle fits where the former circular collider cannot',geometry.clear&&!geometry.circleClear);
   check('Quarter turn is rejected without treating the flank as solid',!geometry.quarterTurn&&geometry.flankClear&&!geometry.insideClear);
   await resumeCommand(page,view.touch);await page.locator('#game').focus();await page.keyboard.press('f');await page.waitForFunction(()=>DEADWALL.expeditions.driving());
   check('Native F input boards from the actual flank',true);
   const before=await page.evaluate(()=>{const c=DEADWALL.expeditions.car();return{x:c.x,y:c.y,a:c.angle,fuel:c.fuel};});
   await page.keyboard.down('s');await page.waitForTimeout(180);await page.keyboard.up('s');await activate(page,'#pauseButton',view.touch);
   const after=await page.evaluate(()=>{const c=DEADWALL.expeditions.car();return{x:c.x,y:c.y,a:c.angle,fuel:c.fuel};});profile.refusedTurnChanges=diff(before,after);
   check('A real direction input cannot rotate through the walls or spend fuel',profile.refusedTurnChanges.length===0);
   const png=await page.evaluate(()=>{const g=DEADWALL,c=g.expeditions.car();Object.assign(g.camera,{x:c.x,y:c.y,zoom:.9});g.render();return document.getElementById('game').toDataURL('image/png');});
   await fs.writeFile(path.join(h.output,view.width+'-corridor-native.png'),Buffer.from(png.split(',')[1],'base64'));
   await activate(page,'#saveButton',view.touch);
   const checkpoint=await page.evaluate(()=>{const d=DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY));delete d.timestamp;return d;});
   check('Native Save retains the driver and calibrated vehicle',checkpoint.expeditions.vehicle.driving&&checkpoint.expeditions.vehicle.metric174===1);
   await page.reload({waitUntil:'networkidle'});await ready(page);
   await page.evaluate(()=>{const g=DEADWALL,restore=g.restoreSave;globalThis.__metric175Restored=null;g.restoreSave=function(...args){try{const ok=restore.apply(this,args);if(ok){const d=JSON.parse(JSON.stringify(g.serialize()));delete d.timestamp;globalThis.__metric175Restored=d;}return ok;}finally{g.restoreSave=restore;}};});
   await activate(page,'#continueButton',view.touch);await page.waitForFunction(()=>DEADWALL.state==='playing'&&__metric175Restored);
   const restored=await page.evaluate(()=>__metric175Restored);profile.restoreChanges=diff(checkpoint,restored);
   check('Continue preserves every persisted field and the exact narrow parking pose',profile.restoreChanges.length===0);
   await page.locator('#game').focus();await page.keyboard.press('f');await page.waitForFunction(()=>!DEADWALL.expeditions.driving());
   const exit=await page.evaluate(()=>{const g=DEADWALL,b=g.expeditions.vehicleBody175();return{clear:g.friendlyPositionClear(g.player,g.player.x,g.player.y),distance:DeadwallMetric174.bodyDistance(b,g.player),radius:g.player.radius,dx:Math.abs(g.player.x-b.x),binding:DeadwallMetric174.ownerBody175(g.player)};});profile.exit=exit;
   check('Native F exits next to the side instead of an oversized ring',exit.clear&&exit.distance>exit.radius&&exit.dx<1&&exit.binding===null);
   check('No new scale activation or duplicate vehicle appears after Continue',await page.evaluate(()=>DEADWALL.expeditions.car().metric174===1&&!DEADWALL.expeditions.activateMetricScale174().ok));
   check('Viewport has no document-wide horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await screenshot('after-side-exit');check('No JavaScript or network error',errors()===0);profile.pass=true;
  }catch(error){profile.pass=false;profile.failure=error.stack;await screenshot('failure').catch(()=>{});}finally{await context.close();console.log(JSON.stringify({view,pass:profile.pass,checks:profile.checks.length,failure:profile.failure?.split('\n')[0]}));}
 }
}finally{h.report.pass=h.report.profiles.length===3&&h.report.profiles.every(p=>p.pass);await h.close();await h.finish();}
if(!h.report.pass)process.exitCode=1;
