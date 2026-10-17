import path from 'node:path';
import {createHarness,recorder,ready,chooseCampaign} from './browser-qa-common142.mjs';
import {activate,saveReloadContinue,visibleInPanel} from './browser-qa-common144.mjs';

process.env.DEADWALL_QA_ROOT=path.resolve(process.env.DEADWALL_QA_ROOT||'dist');
const h=await createHarness('wildlife190','Native operation controls on the built distribution, finite backpack transactions and save/menu/Continue. Equipment is crafted against actual depot stocks with explicit simulated preparation time. Regional positions are declared generated checkpoints. The carcass is prepared by a declared damage call, not a claim of human hunting. Harvest and fishing run on ordinary RAF time.');
const {browser,base,report,output}=h;report.profiles=[];report.pass=false;report.root=process.env.DEADWALL_QA_ROOT;
try{
 for(const viewport of [{width:1366,height:768,touch:false},{width:390,height:844,touch:true},{width:844,height:390,touch:true}]){
  const profile={viewport};report.profiles.push(profile);
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:viewport.touch,isMobile:viewport.touch,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(120000);const r=recorder(page,profile,output,viewport.width+'-');
  try{
   await page.goto(base,{waitUntil:'networkidle',timeout:120000});await ready(page);await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',viewport.touch);
   const equipment=await page.evaluate(()=>{
    const g=DEADWALL,C=DeadwallCore,before={...g.resources};
    const quote=g.arsenal134.preview('craft','knife');if(!quote.ok)throw Error(quote.reason);
    const begun=g.arsenal134.begin('craft','knife');if(!begun.ok)throw Error(begun.reason);
    for(let i=0;i<200&&g.arsenal134.busy();i++)g.arsenal134.step(.1);
    const knife=g.arsenal134.snapshot().locker.find(i=>i.id==='knife');if(!knife)throw Error('Paid knife unavailable');
    const paid=g.resources.scrap===before.scrap-C.Arsenal134Rules.catalog.knife.cost.scrap;
    for(const action of [()=>g.arsenal134.transfer(knife.uid,'carried'),()=>g.arsenal134.equip(knife.uid),...['wood','scrap','food'].map(k=>()=>g.loadout.transfer('depot','sac',k,3))]){const q=action();if(!q.ok)throw Error(q.reason);}
    return {paid,uid:knife.uid};
   });r.check('Knife uses the real crafting cost and the carried armory',equipment.paid);
   for(const kind of ['land','fish']){
    const encounter=await page.evaluate(kind=>{
     const g=DEADWALL,w=g.frontier.world(),P=DeadwallBiomePopulation165,R=DeadwallCore.WildlifeHarvest190Rules;let selected=null;
     for(let cy=0;cy<96&&!selected;cy++)for(let cx=0;cx<96&&!selected;cx++)for(let i=0;i<8&&!selected;i++){
      const q=P.animal(w,cx,cy,i);if(!q||!P.admitted(w,q)||kind==='land'&&(q.profile.mode!=='land'||R.yields[q.species]<8)||kind==='fish'&&q.profile.mode!=='swim')continue;
      for(const distance of kind==='fish'?[1,2,3,4,5,6]:[1.4])for(let n=0;n<24&&!selected;n++){
       const point={x:q.x+Math.cos(n/24*Math.PI*2)*distance,y:q.y+Math.sin(n/24*Math.PI*2)*distance};
       if(w.blocked(point.x,point.y,.32,0,null)||w.hydrology.sample(point.x,point.y).water)continue;
       if(!(kind==='fish'?w.wildlifeWaterLine(point,q,.04):w.movementLine(point,q,0,null,null,.05)))continue;
       selected={id:q.id,point,species:q.species};
      }
     }
     if(!selected)throw Error('No actual habitat for '+kind);
     const saved=g.serialize();Object.assign(saved.frontier,{active:true,...selected.point,z:0,inside:null,a:0,anchor:{x:saved.player.x,y:saved.player.y}});
     g.restoreSave(saved);g.campaignIntro132.skip();g.paused=false;g.activeOverlay=null;g.dayClock=.4;g.update(.1);
     const animal=g.frontier.wildlife165().find(a=>a.id===selected.id);if(!animal)throw Error('Actual animal not streamed');
     if(kind==='land'&&!g.frontier.hitWildlife165(selected.id,animal.profile.health))throw Error('Declared corpse preparation refused');
     g.updateUI();g.render();return {...selected,preparedCheckpoint:true,preparedDamage:kind==='land',bag:{...g.player.carry},stocks:{...g.resources},taken:g.wildHarvest190.taken(selected.id)};
    },kind);
    if(!await page.locator('#fieldDockTerrain').evaluate(n=>n.open))await activate(page,'#fieldDockTerrainToggle',viewport.touch);
    r.check('Harvest shortcut belongs to the visible regional terrain drawer',await page.locator('#fieldDockTerrain #wildHarvest190Open').isVisible());
    const shortcut=page.locator('#wildHarvest190Open');await shortcut.scrollIntoViewIfNeeded({timeout:10000});
    const shortcutGeometry=await visibleInPanel(page,'#wildHarvest190Open','#fieldDockTerrain .field-dock-terrain-body');
    (profile.shortcutGeometry??=[]).push({kind,...shortcutGeometry});
    r.check('Harvest shortcut is inside its drawer and viewport with an unobstructed pointer target',shortcutGeometry.pass);
    if(viewport.touch)await shortcut.tap({timeout:10000});else await shortcut.click({timeout:10000});
    const actionId='expansionAction-wildlife190-'+(kind==='fish'?'fish:':'harvest:')+encounter.id;
    const action=page.locator('[id="'+actionId+'"]');await action.scrollIntoViewIfNeeded();r.check(kind+' operation is reachable and enabled',await action.isVisible()&&await action.isEnabled());
    await r.screenshot(kind+'-offer');await activate(page,'[id="'+actionId+'"]',viewport.touch);
    await page.waitForFunction(()=>!DEADWALL.wildHarvest190.busy(),null,{timeout:20000,polling:100});
    const result=await page.evaluate(id=>({bag:{...DEADWALL.player.carry},stocks:{...DEADWALL.resources},taken:DEADWALL.wildHarvest190.taken(id),hp:DEADWALL.frontier.wildlifeStatus165(id).hp,hooked:DEADWALL.wildHarvest190.hooked(id),message:DEADWALL.wildHarvest190.overview().summary}),encounter.id);
    const gained=result.taken-encounter.taken;r.check(kind+' grants only the recorded finite portion',gained>0&&Math.abs(result.bag.food-encounter.bag.food-gained+(kind==='fish'?.5:0))<1e-6);
    r.check(kind+' does not send food directly to the remote depot',result.stocks.food<=encounter.stocks.food+1e-6);
    if(kind==='fish')r.check('Fishing consumes the declared supplies and releases its finished hook',result.bag.wood===encounter.bag.wood-1&&result.bag.scrap===encounter.bag.scrap-1&&result.hp===0&&!result.hooked);
    await r.screenshot(kind+'-finished');const recovery=await saveReloadContinue(page,viewport.touch);r.check(kind+' native recovery preserves all persistent owners',recovery.pass);
    r.check(kind+' persisted counter and corpse survive the reload',await page.evaluate(({id,taken})=>DEADWALL.wildHarvest190.taken(id)===taken&&DEADWALL.frontier.wildlifeStatus165(id).hp===0,{id:encounter.id,taken:result.taken}));
    profile[kind]={encounter,result,recovery};
   }
   r.check('No collected JavaScript, console or network error',r.errors()===0);
  }finally{await context.close();}
 }
 report.pass=true;
}catch(error){report.failure=String(error.stack||error);process.exitCode=1;}
finally{await h.finish();await h.close();console.log(JSON.stringify({pass:report.pass,output,failure:report.failure}));}
