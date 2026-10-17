import path from 'node:path';
import {createHarness,recorder,ready,chooseCampaign} from './browser-qa-common142.mjs';
import {activate,saveReloadContinue} from './browser-qa-common144.mjs';

process.env.DEADWALL_QA_ROOT=path.resolve(process.env.DEADWALL_QA_ROOT||'dist');
const h=await createHarness('husbandry191','Built distribution with actual desktop/touch operation buttons, generated rabbit, paid enclosure/capture, slaughter/cooking and native save/menu/reload/Continue. Regional position and backpack supplies are declared fixtures. RAF is explicitly stopped after native new-game startup so advancing work is deterministic; only production-controller time is injected. This is not a naturally played campaign, an endurance measurement or an audiovisual animal-realism certification.');
const {browser,base,report,output}=h;report.root=process.env.DEADWALL_QA_ROOT;report.profiles=[];report.pass=false;
try{
 for(const viewport of [{width:1366,height:768,touch:false},{width:390,height:844,touch:true}]){
  const profile={viewport};report.profiles.push(profile);
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:viewport.touch,isMobile:viewport.touch,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(120000);const r=recorder(page,profile,output,viewport.width+'-');
  try{
   await page.goto(base,{waitUntil:'networkidle',timeout:120000});await ready(page);await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',viewport.touch);
   // Allow the already queued frame to finish; no re-scheduling after this boundary.
   await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});await page.waitForTimeout(150);
   const fixture=await page.evaluate(()=>{
    const g=DEADWALL,C=DeadwallCore,P=DeadwallBiomePopulation165,w=g.frontier.world(),R=C.Husbandry191Rules;let chosen=null;
    for(let cy=0;cy<96&&!chosen;cy++)for(let cx=0;cx<96&&!chosen;cx++)for(let i=0;i<8&&!chosen;i++){
     const a=P.animal(w,cx,cy,i);if(!a||a.species!=='rabbit'||!P.admitted(w,a))continue;
     const centre={x:a.x,y:a.y-3},point={x:a.x,y:a.y+.4},road=w.nearestRoad(centre);
     if(P.around(w,a.x,a.y,8).animals.some(n=>n.id!==a.id&&Math.abs(n.x-centre.x)<1.5+n.radius+.6&&Math.abs(n.y-centre.y)<1.5+n.radius+.6))continue;
     if(road&&road.d<road.road.width/2+R.penSize||w.nearPOI(a.x,a.y,30).some(p=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(p.w,p.h)+20))continue;
     if([-1.5,-1,-.5,0,.5,1,1.5].some(dx=>[-1.5,-1,-.5,0,.5,1,1.5].some(dy=>w.blocked(centre.x+dx,centre.y+dy,.4,0,null)||w.hydrology.sample(centre.x+dx,centre.y+dy).water)))continue;
     chosen={id:a.id,point,species:a.species};
    }
    if(!chosen)throw Error('No actual dry generated rabbit checkpoint');
    const q=g.arsenal134.begin('craft','knife');if(!q.ok)throw Error(q.reason);for(let i=0;i<200&&g.arsenal134.busy();i++)g.arsenal134.step(.1);
    const knife=g.arsenal134.snapshot().locker.find(i=>i.id==='knife');if(!knife)throw Error('Paid knife absent');
    for(const q of[g.arsenal134.transfer(knife.uid,'carried'),g.arsenal134.equip(knife.uid)])if(!q.ok)throw Error(q.reason);
    const saved=g.serialize();saved.player.carry={...saved.player.carry,wood:15,scrap:10,food:10,fuel:4};
    Object.assign(saved.frontier,{active:true,...chosen.point,z:0,inside:null,a:0,quiet:true,anchor:{x:saved.player.x,y:saved.player.y}});
    if(!g.restoreSave(saved))throw Error('Declared setup refused');g.paused=false;g.activeOverlay=null;g.dayClock=.4;g.update(.01);g.updateUI();g.render();
    if(!g.frontier.wildlife165().some(a=>a.id===chosen.id))throw Error('Generated rabbit not streamed');
    return{...chosen,bag:{...g.player.carry},preparedSupplies:true,preparedCheckpoint:true};
   });profile.fixture=fixture;
   async function action(kind,id=null,target=null){
    await page.evaluate(()=>DEADWALL.expansionUI.open('husbandry191'));
    const selector='[id="expansionAction-husbandry191-'+kind+':'+id+':'+target+'"]',button=page.locator(selector);
    await button.scrollIntoViewIfNeeded();r.check(kind+' is reachable and enabled',await button.isVisible()&&await button.isEnabled());
    await r.screenshot(kind+'-offer');await activate(page,selector,viewport.touch);
    // Real input chose the action. Explicit deterministic production-controller time follows.
    await page.evaluate(()=>{
     const g=DEADWALL;g.showCommand(false);g.paused=false;g.activeOverlay=null;
     for(let i=0;i<150&&g.husbandry191.busy();i++)g.husbandry191.step(.1);
     if(g.husbandry191.busy())throw Error('Work did not finish');g.updateUI();g.render();
    });
   }
   await action('build');const built=await page.evaluate(()=>({pen:DEADWALL.husbandry191.view().pens[0],bag:{...DEADWALL.player.carry}}));
   r.check('Paid physical enclosure consumes wood and scrap',!!built.pen&&built.bag.wood===fixture.bag.wood-10&&built.bag.scrap===fixture.bag.scrap-6);
   await action('capture',built.pen.id,fixture.id);
   const captive=await page.evaluate(id=>({state:DEADWALL.husbandry191.view(),bag:{...DEADWALL.player.carry},free:DEADWALL.frontier.wildlife165().some(a=>a.id===id),hp:DEADWALL.frontier.wildlifeStatus165(id).hp}),fixture.id);
   r.check('Original remains alive but cannot duplicate as a wild target',!captive.free&&captive.hp>0&&captive.state.animals.length===1&&captive.state.animals[0].source===fixture.id);
   r.check('Capture spends its real backpack inputs',captive.bag.food===built.bag.food-1&&captive.bag.scrap===built.bag.scrap-1);
   await r.screenshot('live-captive');await action('feed',built.pen.id);
   const fed=await page.evaluate(()=>({pen:DEADWALL.husbandry191.view().pens[0],bag:{...DEADWALL.player.carry}}));
   r.check('Feed enters the local trough from the bag',fed.pen.food===4&&fed.bag.food===captive.bag.food-4);
   await action('slaughter',built.pen.id,captive.state.animals[0].id);
   const raw=await page.evaluate(()=>({pen:DEADWALL.husbandry191.view().pens[0],bag:{...DEADWALL.player.carry}}));
   r.check('Raw meat and hides remain finite and on site',raw.pen.meat===2&&raw.pen.hides===1&&raw.bag.food===fed.bag.food);
   await action('cook',built.pen.id);
   const cooked=await page.evaluate(id=>({pen:DEADWALL.husbandry191.view().pens[0],bag:{...DEADWALL.player.carry},claimed:DEADWALL.husbandry191.claimed(id),harvest:DEADWALL.wildHarvest190.quote('harvest',id).ok}),fixture.id);
   r.check('Cooking consumes raw meat and fuel and fills only the bag',cooked.pen.meat===0&&cooked.bag.food===raw.bag.food+2&&cooked.bag.fuel===raw.bag.fuel-.5);
   r.check('The original cannot be harvested a second time',cooked.claimed&&!cooked.harvest);await r.screenshot('cooked-products');
   // Reload restores ordinary RAF. The helper captures data at the actual restore boundary.
   const recovery=await saveReloadContinue(page,viewport.touch);r.check('Native save/menu/reload/Continue preserves persistent owners',recovery.pass);
   r.check('Custody remains terminal after reload',await page.evaluate(id=>DEADWALL.husbandry191.claimed(id)&&DEADWALL.husbandry191.view().animals.some(a=>a.source===id&&a.status==='processed'),fixture.id));
   profile.recovery=recovery;r.check('No collected JavaScript, console or network error',r.errors()===0);
  }finally{await context.close();}
 }
 report.pass=true;
}catch(error){report.failure=String(error.stack||error);process.exitCode=1;}
finally{await h.finish();await h.close();console.log(JSON.stringify({pass:report.pass,output,failure:report.failure}));}
