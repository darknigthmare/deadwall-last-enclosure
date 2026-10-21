import path from 'node:path';
import {createHarness,recorder,ready,chooseCampaign} from './browser-qa-common142.mjs';
import {activate,saveReloadContinue} from './browser-qa-common144.mjs';
import {prepareProductsTool203} from './products203-fixtures.mjs';

process.env.DEADWALL_QA_ROOT=path.resolve(process.env.DEADWALL_QA_ROOT||'dist');
const h=await createHarness('products203','Built distribution with actual desktop/touch buttons, a generated rabbit, paid construction/capture/processing, paid packing, physical ground package, finite delivery to a second built enclosure and save/menu/reload/Continue. Regional position and backpack supplies are declared fixtures. RAF is explicitly stopped after native new-game startup so advancing work is deterministic; only production-controller time is injected. This is not a naturally played campaign, an endurance measurement or an audiovisual animal-realism certification.');
const {browser,report,output}=h;const playerURL=new URL(h.base);playerURL.search='';const base=playerURL.href;report.root=process.env.DEADWALL_QA_ROOT;report.base=base;report.surface='Player notebook without author or historical URL flags; seed and regional fixture are explicit.';report.profiles=[];report.pass=false;
try{
 for(const viewport of [{width:1366,height:768,touch:false},{width:390,height:844,touch:true},{width:844,height:390,touch:true}]){
  const profile={viewport};report.profiles.push(profile);
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:viewport.touch,isMobile:viewport.touch,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(120000);const r=recorder(page,profile,output,viewport.width+'-');
  try{
   await page.goto(base,{waitUntil:'networkidle',timeout:120000});await ready(page);
   profile.entryURL=page.url();r.check('Normal player URL and notebook mode, without author or historical flags',await page.evaluate(()=>location.search===''&&DEADWALL.playerMenus194?.mode==='player'));
   await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',viewport.touch);
   // Allow the already queued frame to finish; no re-scheduling after this boundary.
   await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});await page.waitForTimeout(150);
   profile.toolPreparation=await page.evaluate(prepareProductsTool203);
   r.check('A real paid knife is carried and equipped before regional preparation',profile.toolPreparation.crafted&&profile.toolPreparation.condition>0);
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
    const saved=g.serialize();saved.player.carry={...saved.player.carry,wood:15,scrap:10,food:6,fuel:2,medicine:0};
    Object.assign(saved.frontier,{active:true,...chosen.point,z:0,inside:null,a:0,quiet:true,anchor:{x:saved.player.x,y:saved.player.y}});
    if(!g.restoreSave(saved))throw Error('Declared setup refused');g.paused=false;g.activeOverlay=null;g.dayClock=.4;g.update(.01);g.updateUI();g.render();
    if(!g.frontier.wildlife165().some(a=>a.id===chosen.id))throw Error('Generated rabbit not streamed');
    const animal=g.frontier.wildlifeStatus165(chosen.id);if(!g.frontier.hitWildlife165(chosen.id,animal.profile.health*.5))throw Error('Native injury fixture refused');
    return{...chosen,injury:'native hitWildlife165 at half species health; explicit injury fixture',bag:{...g.player.carry},preparedSupplies:true,preparedCheckpoint:true};
   });profile.fixture=fixture;
   async function action(kind,id=null,target=null){
    await page.evaluate(()=>DEADWALL.expansionUI.open('husbandry191'));
    const selector='[id="expansionAction-husbandry191-'+kind+':'+id+':'+target+'"]',button=page.locator(selector);
    await button.scrollIntoViewIfNeeded();
    const enabled=await button.isVisible()&&await button.isEnabled();
    if(!enabled){profile.refusedAction=await page.evaluate(({kind,id,target})=>({kind,id,target,quote:DEADWALL.husbandry191.quote(kind,id,target),equipment:DEADWALL.arsenal134.snapshot(),task:DEADWALL.husbandry191.view().task}),{kind,id,target});await r.screenshot(kind+'-refused');}
    r.check(kind+' is reachable and enabled',enabled);
    await r.screenshot(kind+'-offer');await activate(page,selector,viewport.touch);
    // Real input chose the action. Explicit deterministic production-controller time follows.
    await page.evaluate(()=>{
     const g=DEADWALL;g.showCommand(false);g.paused=false;g.activeOverlay=null;
     for(let i=0;i<150&&g.husbandry191.busy();i++)g.husbandry191.step(.1);
     if(g.husbandry191.busy())throw Error('Work did not finish');g.updateUI();g.render();
    });
   }
   await action('build');const origin=await page.evaluate(()=>DEADWALL.husbandry191.view().pens[0]);
   await action('capture',origin.id,fixture.id);const animal=await page.evaluate(()=>DEADWALL.husbandry191.view().animals[0]);
   await action('slaughter',origin.id,animal.id);
   const stock=await page.evaluate(()=>DEADWALL.husbandry191.view().pens[0].meat);r.check('Finite meat comes from the generated captive, not injected products',stock>0);
   // A second declared checkpoint supplies construction inputs only; products are untouched.
   const destination=await page.evaluate(origin=>{
    const g=DEADWALL,seed=g.serialize();seed.player.carry={...seed.player.carry,wood:15,scrap:10,food:6,fuel:2,medicine:0};
    for(const dx of [24,-24,36,-36])for(const dy of [0,18,-18]){
     const d=JSON.parse(JSON.stringify(seed));d.frontier.x=origin.x+dx;d.frontier.y=origin.y+dy+3.4;
     try{if(!g.restoreSave(d))continue;}catch{continue;}
     g.paused=false;g.activeOverlay=null;g.update(.01);
     const q=g.husbandry191.quote('build');if(q.ok)return {point:g.frontier.position(),supplies:{...g.player.carry}};
    }
    throw Error('No second physically buildable checkpoint');
   },origin);profile.secondCheckpoint=destination;
   await action('build');const second=await page.evaluate(()=>DEADWALL.husbandry191.view().pens[1]);r.check('Second enclosure is physically constructed, not injected',!!second&&second.id!==origin.id);
   async function checkpoint(point){await page.evaluate(point=>{const g=DEADWALL,s=g.serialize();Object.assign(s.frontier,point);if(!g.restoreSave(s))throw Error('Travel checkpoint refused');g.paused=false;g.activeOverlay=null;g.updateUI();g.render();},point);}
   await checkpoint({x:origin.x,y:origin.y+2.2});
   const before=await page.evaluate(()=>({bag:{...DEADWALL.player.carry},stock:DEADWALL.husbandry191.view().pens[0].meat,age:DEADWALL.husbandry191.view().pens[0].meatAge,depot:{...DEADWALL.resources}}));
   await action('pack-meat',origin.id);
   const packed=await page.evaluate(()=>({state:DEADWALL.husbandry191.view(),bag:{...DEADWALL.player.carry}}));
   const parcel=packed.state.cargo203;r.check('Packing creates only the debited finite quantity',parcel.amount===Math.min(6,before.stock)&&packed.state.pens[0].meat===before.stock-parcel.amount);
   r.check('Packaging wood and scrap were paid; no food was minted',packed.bag.wood===before.bag.wood-2&&packed.bag.scrap===before.bag.scrap-1&&packed.bag.food===before.bag.food);
   r.check('Source expiry is preserved in the parcel',parcel.age>=before.age);
   const paused=await page.evaluate(()=>{const g=DEADWALL;g.paused=true;const a=JSON.stringify(g.husbandry191.snapshot());for(let i=0;i<100;i++)g.husbandry191.step(.1);const b=JSON.stringify(g.husbandry191.snapshot());g.paused=false;return a===b;});r.check('Pause does not age the transported products',paused);
   await action('drop-products');const dropped=await page.evaluate(()=>DEADWALL.husbandry191.view().cargo203);r.check('Dropping keeps quantity and the actual regional position',dropped.stage==='ground'&&dropped.amount===parcel.amount&&Math.abs(dropped.point.x-origin.x)<1e-7);
   await r.screenshot('physical-package-ground');
   const groundRecovery=await saveReloadContinue(page,viewport.touch);r.check('Native save/menu/reload/Continue preserves a ground package exactly',groundRecovery.pass);profile.groundRecovery=groundRecovery;
   await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});await page.waitForTimeout(150);await page.evaluate(()=>{const g=DEADWALL;if(!g.paused)g.togglePause(true);g.togglePause(false);g.activeOverlay=null;});
   await action('pickup-products');r.check('Picking up restores one load, not two',await page.evaluate(()=>DEADWALL.husbandry191.carryingProducts()));
   r.check('Region/vehicle/storey exits refuse a carried package',await page.evaluate(()=>!DEADWALL.frontier.leave()&&!DEADWALL.frontier.board()&&DEADWALL.frontier.stairsStatus(1).code==='cargo'));
   const read=await page.evaluate(()=>{const g=DEADWALL,{timestamp,...a}=g.serialize();g.husbandry191.overview();g.husbandry191.actions();const{timestamp:other,...b}=g.serialize();return JSON.stringify(a)===JSON.stringify(b);});r.check('Package consultation does not move or credit any stock',read);
   // This is a declared travel checkpoint, not a claim of a naturally walked expedition.
   await checkpoint({x:second.x,y:second.y+2.2});
   const incoming=await page.evaluate(()=>DEADWALL.husbandry191.view().cargo203);
   // Start a real unload, then put down the load from the still-active dossier.
   // No controller time is advanced before the interruption, so nothing may be delivered.
   await page.evaluate(()=>DEADWALL.expansionUI.open('husbandry191'));
   const unload='[id="expansionAction-husbandry191-unpack-products:'+second.id+':null"]';
   await page.locator(unload).scrollIntoViewIfNeeded();await activate(page,unload,viewport.touch);
   r.check('Native unload starts before emergency release',await page.evaluate(()=>DEADWALL.husbandry191.view().task?.kind==='unpack-products'));
   await action('drop-products');
   r.check('Emergency release cancels delivery without crediting either site',await page.evaluate(amount=>{const h=DEADWALL.husbandry191,s=h.view();return !h.busy()&&s.cargo203.stage==='ground'&&s.cargo203.amount===amount&&s.pens[1].meat===0;},incoming.amount));
   await action('pickup-products');
   await action('unpack-products',second.id);
   const delivered=await page.evaluate(()=>({state:DEADWALL.husbandry191.view(),bag:{...DEADWALL.player.carry},depot:{...DEADWALL.resources}}));
   r.check('Delivery credits only the second site and clears the empty parcel',delivered.state.pens[1].meat===parcel.amount&&delivered.state.cargo203===undefined);
   r.check('Delivery retains expiry and cannot create bag/depot provisions',delivered.state.pens[1].meatAge>=incoming.age&&delivered.bag.food===before.bag.food&&JSON.stringify(delivered.depot)===JSON.stringify(before.depot));
   await page.evaluate(()=>DEADWALL.expansionUI.open('husbandry191'));await r.screenshot('delivered-products-register');await page.evaluate(()=>{DEADWALL.showCommand(false);DEADWALL.paused=false;DEADWALL.activeOverlay=null;});
   const recovery=await saveReloadContinue(page,viewport.touch);r.check('Native recovery preserves both sites and delivered products',recovery.pass);profile.deliveryRecovery=recovery;
   r.check('No collected JavaScript, console or network errors',r.errors()===0);
  }finally{await context.close();}
 }
 report.pass=true;
}catch(error){report.failure=String(error.stack||error);process.exitCode=1;}
finally{await h.finish();await h.close();console.log(JSON.stringify({pass:report.pass,output,failure:report.failure}));}
