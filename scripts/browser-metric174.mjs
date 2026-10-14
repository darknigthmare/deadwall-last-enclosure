import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHarness,recorder,ready,chooseCampaign,openCommand,activate} from './browser-qa-common144.mjs';
const require=createRequire(import.meta.url),{prepareMetricVehicle174}=require('./metric174-fixtures.cjs');
const h=await createHarness('metric174-browser','Trusted depot migration of a natively purchased bus. Prepared completed garage, historical knowledge, finite stocks and physically tested parking pose are explicit fixtures, not a claimed full campaign. Paint probes use production painters and actual decoded project images.');h.report.profiles=[];
const diff=(a,b,p='')=>{if(Object.is(a,b))return [];if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return[p||'/'];return [...new Set([...Object.keys(a),...Object.keys(b)])].sort().flatMap(k=>Object.hasOwn(a,k)&&Object.hasOwn(b,k)?diff(a[k],b[k],p+'/'+k):[p+'/'+k]);};
try{
 for(const view of [{width:1440,height:900},{width:390,height:844,touch:true},{width:844,height:390,touch:true}]){
  const context=await h.browser.newContext({viewport:{width:view.width,height:view.height},hasTouch:!!view.touch,isMobile:!!view.touch,serviceWorkers:'block'}),page=await context.newPage(),profile={viewport:view};h.report.profiles.push(profile);page.setDefaultTimeout(60000);
  const {check,screenshot,errors}=recorder(page,profile,h.output,view.width+'-');
  try{
   await page.goto(h.base,{waitUntil:'networkidle'});await ready(page);await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',view.touch);await activate(page,'#pauseButton',view.touch);
   profile.fixture=await page.evaluate(prepareMetricVehicle174);
   await openCommand(page,view.touch);await activate(page,'#expansionFieldTab',view.touch);await activate(page,'#expansionGroup-world',view.touch);await activate(page,'#expansionTab-world131',view.touch);
   const selector='#expansionAction-world131-metricVehicle174';await page.locator(selector).scrollIntoViewIfNeeded();check('Metric calibration is offered through the real depot menu',await page.locator(selector).isEnabled());
   await screenshot('before-calibration');
   await page.locator(selector).evaluate(button=>{
    const g=DEADWALL,restore=g.restoreSave,save=g.save,clean=value=>{const d=JSON.parse(JSON.stringify(value));delete d.timestamp;return d;};
    const audit={calls:0,trusted:false};
    button.addEventListener('click',e=>{audit.trusted=e.isTrusted;audit.before=clean(g.serialize());},{capture:true,once:true});
    g.restoreSave=function(...a){audit.calls++;audit.submitted=clean(a[0]);const result=restore.apply(this,a);audit.restored=clean(g.serialize());audit.ok=result===true;return result;};
    g.save=function(...a){const result=save.apply(this,a);if(audit.restored){audit.stored=clean(DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)));audit.saved=result===true;}return result;};
    globalThis.__metric174={audit,cleanup(){g.restoreSave=restore;g.save=save;}};
   });
   await activate(page,selector,view.touch);
   const transaction=await page.evaluate(()=>{const probe=globalThis.__metric174;probe.cleanup();delete globalThis.__metric174;return probe.audit;});
   const normalize=data=>{const d=structuredClone(data);delete d.expeditions.vehicle.metric174;return d;};
   profile.transaction={trusted:transaction.trusted,calls:transaction.calls,submitted:diff(transaction.before,normalize(transaction.submitted)),restored:diff(transaction.before,normalize(transaction.restored)),stored:diff(transaction.before,normalize(transaction.stored))};
   check('One trusted action submits and restores only the explicit scale revision',transaction.trusted&&transaction.calls===1&&transaction.ok&&profile.transaction.submitted.length===0&&profile.transaction.restored.length===0&&transaction.restored.expeditions.vehicle.metric174===1);
   check('The native save persists every other field without stock or coordinate changes',transaction.saved&&profile.transaction.stored.length===0&&transaction.stored.expeditions.vehicle.metric174===1);
   const painted=await page.evaluate(()=>{
    const g=DEADWALL,C=DeadwallCore,A=DeadwallMetric174,original=g.art.blit,draws=[],c=document.createElement('canvas');c.width=1200;c.height=900;const ctx=c.getContext('2d');
    const clean=()=>{const d=g.serialize();delete d.timestamp;return JSON.stringify(d);},before=clean();let subject=null;
    g.art.blit=function(context,key,source,...dest){const ok=original.call(this,context,key,source,...dest);if(ok&&subject&&context===ctx)draws.push({subject,key,dest});return ok;};
    ctx.fillStyle='#24362c';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#e9dfb4';ctx.font='20px sans-serif';ctx.fillText('MÊME ÉCHELLE — 32 UNITÉS / MÈTRE',24,32);
    try{let row=0;for(const [type,p] of Object.entries(C.WorldEvolution.RULES.vehicles)){
      const x=410,y=85+row*86;subject=type;ctx.save();ctx.translate(x,y);const b=A.vehicle(p,{domain:'local',metric:true});
      if(!DeadwallVehicleArt152.drawVehicle(ctx,g.art,type,b.w,b.h,{identity:'metric-audit',variant:1}))DeadwallAssets136.drawVehicle139(ctx,g.art,type,b.w,b.h,{identity:'metric-audit',variant:1});
      ctx.restore();subject=null;
      g.art.drawActor(ctx,{...g.player,x:650,y,facing:0,visualUpperFacing:0,visualMoving:false,visualMotionReset:true},'player',g.elapsed,true,false);
      ctx.fillStyle='#e9dfb4';ctx.font='16px sans-serif';ctx.fillText(type+' · '+p.w+' × '+p.h+' m',24,y+5);row++;
     }
    }finally{g.art.blit=original;}
    const valid=Object.keys(C.WorldEvolution.RULES.vehicles).every(type=>{const p=C.WorldEvolution.RULES.vehicles[type],r=draws.find(r=>r.subject===type);return r&&Math.abs(r.dest[2]-p.w*32)<.0001&&Math.abs(r.dest[3]-p.h*32)<.0001;});
    return {valid,draws,unchanged:clean()===before,png:c.toDataURL()};
   });
   check('All nine decoded vehicle silhouettes use the authoritative length and width',painted.valid);check('Sprite inspection creates no campaign mutation',painted.unchanged);
   await fs.writeFile(path.join(h.output,view.width+'-vehicle-scale.png'),Buffer.from(painted.png.split(',')[1],'base64'));delete painted.png;profile.painted=painted;
   const roads=await page.evaluate(()=>{const w=DeadwallFrontierWorld.create(17117,10),a=JSON.stringify([w.pois,w.roads]);let changed=0,refused=0;
    for(const p of w.pois){const r=w.frontageFor(p);if(!r.ok){refused++;continue;}if(r.corrected)changed++;if(w.driveFor(p)!==r.surface||w.connectionFor(p)!==r.connection)throw Error('Frontage consumers diverged');}
    return {sites:w.pois.length,changed,refused,unchanged:JSON.stringify([w.pois,w.roads])===a};});profile.frontages=roads;check('Full G10 derived frontage is consistent and preserves all source geometry',roads.changed>0&&roads.unchanged);
   check('Repeated calibration is refused',await page.evaluate(()=>!DEADWALL.expeditions.activateMetricScale174().ok));
   // The menu closes into a live simulation; use a fresh native saved checkpoint.
   if(!await page.locator('#pauseMenu').isVisible())await activate(page,'#pauseButton',view.touch);
   await activate(page,'#saveButton',view.touch);
   const checkpoint=await page.evaluate(()=>{const d=DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY));delete d.timestamp;return d;});
   check('The native paused checkpoint retains the calibrated vehicle',checkpoint.expeditions.vehicle.metric174===1);
   await page.reload({waitUntil:'networkidle'});await ready(page);
   await page.evaluate(()=>{const g=DEADWALL,restore=g.restoreSave;globalThis.__metricContinue174=null;g.restoreSave=function(...args){const ok=restore.apply(this,args);if(ok){const d=JSON.parse(JSON.stringify(g.serialize()));delete d.timestamp;globalThis.__metricContinue174=d;}g.restoreSave=restore;return ok;};});
   await activate(page,'#continueButton',view.touch);await page.waitForFunction(()=>DEADWALL.state==='playing'&&__metricContinue174);
   const restored=await page.evaluate(()=>__metricContinue174);profile.continueChanges=diff(checkpoint,restored);
   check('Real Continue restores the calibrated vehicle and the exact saved campaign',profile.continueChanges.length===0&&restored.expeditions.vehicle.metric174===1);
   check('The parked local bus now has its actual metric draw footprint and conservative collision',await page.evaluate(()=>{const g=DEADWALL,p=g.worldEvolution.vehicleProfile(),b=DeadwallAssets136.vehicleSize139(p,'local',g.expeditions.car().metric174===1);return Math.abs(b.w-332.8)<.001&&Math.abs(g.expeditions.entity().radius-Math.hypot(p.w,p.h)*16)<.001;}));
   check('No page or HTTP errors',errors()===0);profile.pass=true;
  }catch(error){profile.pass=false;profile.failure=error.stack;await screenshot('failure').catch(()=>{});}finally{await context.close();console.log(JSON.stringify({view,pass:profile.pass,checks:profile.checks.length,failure:profile.failure?.split('\n')[0]}));}
 }
}finally{h.report.pass=h.report.profiles.length===3&&h.report.profiles.every(p=>p.pass);await h.close();await h.finish();}
if(!h.report.pass)process.exitCode=1;
