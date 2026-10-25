import path from 'node:path';
import {createHarness,recorder,ready,chooseCampaign} from './browser-qa-common142.mjs';
import {activate,saveReloadContinue} from './browser-qa-common144.mjs';

process.env.DEADWALL_QA_ROOT=path.resolve(process.env.DEADWALL_QA_ROOT||'dist');
const scope='Real player URL and native operation buttons on dist; same generated natural region as the campaign. Backpack supplies, dry construction point, damaged fence and two position changes to/from a real river bank are explicit fixtures. No water is injected. RAF is stopped and only production-controller time advances during work. This qualifies finite transfers and controls, not a natural expedition, live frame rate or physical mobile device.';
const h=await createHarness('undercovered199',scope),{browser,report,output}=h;
const url=new URL(h.base);url.search='';report.base=url.href;report.surface='Player notebook without author/legacy query; declared advanced spatial/logistics fixtures.';report.root=process.env.DEADWALL_QA_ROOT;report.profiles=[];report.pass=false;
try{
 for(const viewport of [{width:1366,height:900,touch:false},{width:390,height:844,touch:true},{width:844,height:390,touch:true}]){
  const profile={viewport};report.profiles.push(profile);
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:viewport.touch,isMobile:viewport.touch,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(120000);const r=recorder(page,profile,output,viewport.width+'-');
  const checkpoint=()=>page.evaluate(()=>({water:DEADWALL.siege.carriedWater199(),pen:DEADWALL.husbandry191.view().pens[0],bag:{...DEADWALL.player.carry},depot:{...DEADWALL.resources},siege:DEADWALL.siege.snapshot()}));
  try{
   await page.goto(url.href,{waitUntil:'networkidle',timeout:120000});await ready(page);await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',viewport.touch);
   await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});await page.waitForTimeout(150);
   const fixture=await page.evaluate(()=>{
    const g=DEADWALL,w=g.frontier.world(),P=DeadwallBiomePopulation165,R=DeadwallCore.Husbandry191Rules;let point=null,bank=null;
    for(let cy=0;cy<96&&!point;cy++)for(let cx=0;cx<96&&!point;cx++)for(let i=0;i<8&&!point;i++){
     const a=P.animal(w,cx,cy,i);if(!a||a.species!=='rabbit'||!P.admitted(w,a))continue;
     const q={x:a.x,y:a.y-3},road=w.nearestRoad(q);
     if(P.around(w,a.x,a.y,8).animals.some(n=>n.id!==a.id&&Math.abs(n.x-q.x)<1.5+n.radius+.6&&Math.abs(n.y-q.y)<1.5+n.radius+.6))continue;
     if(road&&road.d<road.road.width/2+R.penSize||w.nearPOI(a.x,a.y,30).some(p=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(p.w,p.h)+20))continue;
     if([-1.5,-1,-.5,0,.5,1,1.5].some(dx=>[-1.5,-1,-.5,0,.5,1,1.5].some(dy=>w.blocked(q.x+dx,q.y+dy,.4,0,null)||w.hydrology.sample(q.x+dx,q.y+dy).water)))continue;
     point={x:a.x,y:a.y+.4};
    }
    for(const f of w.hydrology.features.filter(f=>f.kind==='stream'||f.kind==='river')){
     for(let i=2;i<f.points.length-2&&!bank;i++){
      const q=f.points[i],a=f.points[i-1],b=f.points[i+1],angle=Math.atan2(b.y-a.y,b.x-a.x);
      for(const side of [-1,1]){
       const p={x:q.x-Math.sin(angle)*(f.width/2+1)*side,y:q.y+Math.cos(angle)*(f.width/2+1)*side};
       if(w.hydrology.sample(p.x,p.y).water||w.blocked(p.x,p.y,.4,0,null)||Math.hypot(p.x-w.home.x,p.y-w.home.y)<80)continue;
       const targets=Array.from({length:24},(_,j)=>({x:p.x+Math.cos(j*Math.PI/12)*R.reach,y:p.y+Math.sin(j*Math.PI/12)*R.reach}));
       const water=targets.find(t=>{const sample=w.hydrology.sample(t.x,t.y);return sample.water&&!sample.crossing&&sample.salinity==='fresh'&&w.wildlifeWaterLine(p,t,.05);});
       if(water){bank={position:p,water,feature:f.id};break;}
      }
     }if(bank)break;
    }
    if(!point||!bank)throw Error('Generated natural region must provide a dry enclosure and real accessible fresh-water bank');
    const saved=g.serialize();saved.player.carry={...saved.player.carry,wood:15,scrap:10,food:4,fuel:1};
    Object.assign(saved.frontier,{active:true,...point,z:0,inside:null,a:-Math.PI/2,quiet:true,anchor:{x:saved.player.x,y:saved.player.y}});
    if(!g.restoreSave(saved))throw Error('Declared regional setup refused');g.paused=false;g.activeOverlay=null;g.dayClock=.4;g.update(.01);g.updateUI();g.render();
    if(g.siege.carriedWater199()!==0)throw Error('Fixture must not inject water');return{point,bank,bag:{...g.player.carry}};
   });profile.fixture=fixture;
   r.check('Normal player notebook and generated G11 region are used',await page.evaluate(()=>DEADWALL.playerMenus194.mode==='player'&&DEADWALL.frontier.position().generation===11));
   async function openAction(kind,id=null){
    await page.evaluate(()=>DEADWALL.expansionUI.open('husbandry191'));
    const selector='[id="expansionAction-husbandry191-'+kind+':'+id+':null"]',button=page.locator(selector);await button.scrollIntoViewIfNeeded();
    r.check(kind+' action is visible, reachable and enabled',await button.evaluate(n=>{const q=n.getBoundingClientRect(),hit=document.elementFromPoint(q.x+q.width/2,q.y+q.height/2);return n.checkVisibility()&&!n.disabled&&q.height>=43&&q.left>=-1&&q.right<=innerWidth+1&&q.top>=-1&&q.bottom<=innerHeight+1&&!!hit&&(hit===n||n.contains(hit));}));
    return selector;
   }
   async function finish(){await page.evaluate(()=>{const g=DEADWALL;g.showCommand(false);g.paused=false;g.activeOverlay=null;for(let i=0;i<150&&g.husbandry191.busy();i++)g.husbandry191.step(.1);if(g.husbandry191.busy())throw Error('Native work remained unfinished');g.updateUI();g.render();});}
   async function action(kind,id=null){const selector=await openAction(kind,id);await activate(page,selector,viewport.touch);await finish();}
   async function relocate(point,health){await page.evaluate(({point,health})=>{const g=DEADWALL,s=g.serialize();Object.assign(s.frontier,point);if(health!==undefined)s.expansions127.modules.husbandry191.pens[0].health=health;if(!g.restoreSave(s))throw Error('Declared checkpoint refused');g.paused=false;g.activeOverlay=null;g.releaseInputs();g.update(.01);g.updateUI();g.render();},{point,health});}
   await action('build');let state=await checkpoint();const id=state.pen?.id;
   r.check('Construction pays from the carried materials',!!id&&state.bag.wood===fixture.bag.wood-10&&state.bag.scrap===fixture.bag.scrap-6);
   await relocate(fixture.bank.position);const prefill=await checkpoint();const selector=await openAction('fill-bucket');await r.screenshot('real-bank-offer');await activate(page,selector,viewport.touch);
   await page.evaluate(()=>{DEADWALL.showCommand(false);DEADWALL.paused=true;DEADWALL.activeOverlay=null;for(let i=0;i<100;i++)DEADWALL.husbandry191.step(.1);});
   r.check('Paused work cannot extract water',await page.evaluate(()=>DEADWALL.siege.carriedWater199()===0&&DEADWALL.husbandry191.view().task.progress===0));await finish();
   state=await checkpoint();r.check('Actual bank fills six shared units without changing bag or depot',state.water===6&&JSON.stringify(state.bag)===JSON.stringify(prefill.bag)&&JSON.stringify(state.depot)===JSON.stringify(prefill.depot));
   r.check('Collected water is in the existing fire-control reserve',state.siege.playerWater===6&&state.siege.stats.waterProduced===prefill.siege.stats.waterProduced+6);
   // Spatial relocation is declared; the bucket itself is never altered by the fixture.
   await relocate(fixture.point);const pour=await openAction('water-carried',id);await r.screenshot('carried-water-offer');await activate(page,pour,viewport.touch);
   await page.evaluate(()=>DEADWALL.husbandry191.cancel());await finish();state=await checkpoint();r.check('Cancellation neither loses nor duplicates carried water',state.water===6&&state.pen.water===0);
   await action('water-carried',id);state=await checkpoint();r.check('Dry inland enclosure receives exactly the carried water',state.water===0&&state.pen.water===6);await r.screenshot('water-delivered');
   await relocate(fixture.point,60);const beforeRepair=await checkpoint();const repair=await openAction('repair',id);await r.screenshot('repair-offer');await activate(page,repair,viewport.touch);await finish();state=await checkpoint();
   r.check('Repair works without leather and consumes the exact material kit',state.pen.health===85&&state.pen.leather===0&&state.bag.wood===beforeRepair.bag.wood-3&&state.bag.scrap===beforeRepair.bag.scrap-2&&state.pen.water===6);
   r.check('Repair does not change the distant depot',JSON.stringify(state.depot)===JSON.stringify(beforeRepair.depot));
   await action('breeding-off',id);r.check('Births can be stopped explicitly',await page.evaluate(()=>DEADWALL.husbandry191.view().pens[0].breeding199===false));
   await action('behaviors');await action('behaviors-off');r.check('Natural combat behavior can be switched off again',await page.evaluate(()=>DEADWALL.husbandry191.view().behaviors===false));
   const beforeReading=await page.evaluate(()=>{const{timestamp,...s}=DEADWALL.serialize();return JSON.stringify(s);});await page.evaluate(()=>DEADWALL.expansionUI.open('husbandry191'));await r.screenshot('maintenance-notebook');
   r.check('Reading maintenance leaves every persistent owner unchanged',await page.evaluate(()=>{const{timestamp,...s}=DEADWALL.serialize();return JSON.stringify(s);})===beforeReading);
   r.check('The player page keeps a single dossier and no author banner',!await page.locator('#authorMode194').isVisible());
   await finish();profile.recovery=await saveReloadContinue(page,viewport.touch);r.check('Native save/menu/reload/Continue preserves all persistent owners',profile.recovery.pass);
   r.check('Water, repaired fence and suspended births persist',await page.evaluate(()=>{const p=DEADWALL.husbandry191.view().pens[0];return p.water===6&&p.health===85&&p.breeding199===false&&DEADWALL.siege.carriedWater199()===0;}));
   r.check('No collected JavaScript, console or network error',r.errors()===0);
  }catch(error){profile.failure=String(error.stack||error);await r.screenshot('failure').catch(()=>{});}finally{await context.close();}
 }
 report.pass=report.profiles.length===3&&report.profiles.every(p=>!p.failure&&p.checks.every(c=>c.pass));if(!report.pass)process.exitCode=1;
}catch(error){report.failure=String(error.stack||error);process.exitCode=1;}
finally{await h.finish();await h.close();console.log(JSON.stringify({pass:report.pass,output,failure:report.failure}));}
