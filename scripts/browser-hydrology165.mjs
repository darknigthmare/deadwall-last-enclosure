import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {createHarness,recorder,ready,chooseCampaign,activate,openCommand,persistedSnapshot,comparePersistentRestore} from './browser-qa-common144.mjs';

const views=[{name:'desktop',width:1366,height:768},{name:'mobile',width:390,height:844,touch:true},{name:'mobile-landscape',width:844,height:390,touch:true}];
const selected=process.env.DEADWALL_QA_PROFILES?.split(',');
assert.ok(!selected||selected.length&&new Set(selected).size===selected.length&&selected.every(name=>views.some(v=>v.name===name)),'Distinct known hydrology165 profiles required');
const profiles=selected?views.filter(v=>selected.includes(v.name)):views;
const scope='Actual Standard seed17117 new campaign, ten Guide entries through native search/expand controls, native metric water and fauna painters, real Save/menu/reload/Continue. EXPLICIT ADVANCED SPATIAL FIXTURE: validated restoration places only the regional actor on a real dry bank or bridge of the same generated world; this is not naturally earned travel. The exact assigned saved fields and native restoration normalizations are reported. No resources, age, inventory, RNG or combat achievement is supplied. Offscreen painter time samples inspect real animation at declared times and are not measured gameplay FPS or proof of continuous fluid simulation. Browser desktop/portrait/landscape are emulated viewports, not physical-device certification.';
const harness=await createHarness('hydrology165',scope),{browser,base,report,output}=harness;
report.profiles=[];report.pass=false;
const sha=value=>createHash('sha256').update(value).digest('hex');
report.scriptSHA256=sha(await readFile(new URL(import.meta.url)));
const material=page=>page.evaluate(()=>{const{timestamp,...s}=DEADWALL.serialize();return JSON.stringify(s);});
const cardIds=['hydrology165-lake','hydrology165-pond','hydrology165-pool','hydrology165-stream','hydrology165-river','hydrology165-sea','hydrology165-ocean','hydrology165-banks','hydrology165-wildlife','hydrology165-infected'];

async function guide(page,touch){
 if(await page.locator('#commandModal').isVisible())await activate(page,'#commandTab-field',touch);else await openCommand(page,touch,'field');
 await activate(page,'#commandPanel-field [data-field-view="world-codex"]',touch);
 await page.locator('#field-world-codex').waitFor({state:'visible'});
}
async function cards(page,touch){
 await guide(page,touch);
 for(const selector of ['#worldCodexAvailability159','#worldCodexFamily','#worldCodexStatus'])await page.locator(selector).selectOption('all');
 const found=[];
 for(const id of cardIds){
  await page.locator('#worldCodexSearch').fill(id);const selector='#worldCodexResults [data-codex-id="'+id+'"]',summary=selector+' [data-codex-source159] > summary';
  await page.locator(summary).scrollIntoViewIfNeeded();await activate(page,summary,touch);
  found.push(await page.locator(selector).evaluate(node=>{
   const heading=node.querySelector('h4'),r=heading.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(heading);
   const lines=[...range.getClientRects()];return{id:node.dataset.codexId,title:heading.textContent,detailsOpen:node.querySelector('details').open,
    readable:heading.checkVisibility()&&lines.length>0&&lines.every(q=>q.left>=r.left-1&&q.right<=r.right+1)&&r.left>=-1&&r.right<=innerWidth+1,text:node.textContent};
  }));
 }
 return{cards:found,pass:found.length===cardIds.length&&found.every((card,i)=>card.id===cardIds[i]&&card.detailsOpen&&card.readable&&card.title.length>5)};
}
async function checkpoint(page,touch){
 if(await page.locator('#commandModal').isVisible())await activate(page,'#commandReturn129',touch);
 if(!await page.locator('#pauseMenu').isVisible())await activate(page,'#pauseButton',touch);
 await activate(page,'#saveButton',touch);const saved=await persistedSnapshot(page);assert.ok(saved.ok,'Actual save button succeeded');
 await activate(page,'#quitButton',touch);await page.reload({waitUntil:'networkidle'});await ready(page);
 await page.evaluate(()=>{
  const g=DEADWALL,original=g.restoreSave,descriptor=Object.getOwnPropertyDescriptor(g,'restoreSave');globalThis.__HYDROLOGY165_RESTORE__={g,original,descriptor};
  g.restoreSave=function(...args){const result=original.apply(this,args),{timestamp,...s}=DeadwallSave.validate(g.serialize());globalThis.__DEADWALL_QA_RESTORED_144__=structuredClone(s);g.togglePause(true);return result;};
 });
 try{await activate(page,'#continueButton',touch);await page.waitForFunction(()=>DEADWALL.state==='playing'&&DEADWALL.paused);saved.comparison=await comparePersistentRestore(page,saved);}
 finally{saved.wrapperRestored=await page.evaluate(()=>{const s=__HYDROLOGY165_RESTORE__;if(s.descriptor)Object.defineProperty(s.g,'restoreSave',s.descriptor);else delete s.g.restoreSave;const ok=s.g.restoreSave===s.original;delete globalThis.__HYDROLOGY165_RESTORE__;return ok;});}
 return saved;
}

async function nativeEvidence(page){
 return page.evaluate(()=>{
  const g=DEADWALL,w=g.frontier.world();
  if(w.hydrologyVersion!==1||!w.hydrology)throw Error('The actual new campaign has no authoritative hydrology provider');
  return{seed:w.seed,generation:w.generation,ecology:w.ecologyVersion,hydrology:w.hydrologyVersion,home:w.home,
   hydrologyAPI:Object.keys(w.hydrology),newSaveHydrology:g.frontier.snapshot().hydrologyVersion};
 });
}

async function landscapePoints(page){
 return page.evaluate(()=>{
  const w=DEADWALL.frontier.world(),h=w.hydrology;let bank=null,bridge=null,animal=null;
  for(const f of h.features.filter(f=>f.kind==='stream'||f.kind==='river')){
   for(let i=2;i<f.points.length-2&&!bank;i++){
    const q=f.points[i],a=f.points[i-1],b=f.points[i+1],angle=Math.atan2(b.y-a.y,b.x-a.x),nx=-Math.sin(angle),ny=Math.cos(angle),distance=f.width/2+1.5;
    const left={x:q.x+nx*distance,y:q.y+ny*distance},right={x:q.x-nx*distance,y:q.y-ny*distance};
    if(h.sample(q.x,q.y).bodyId!==f.id||!h.sample(q.x,q.y).movementBlocked||w.blocked(left.x,left.y,.32)||w.blocked(right.x,right.y,.32)||!w.line(left,right,0,null,null,.015))continue;
    bank={id:f.id,kind:f.kind,width:f.width,water:{x:q.x,y:q.y},position:left,opposite:right,angle:Math.atan2(q.y-left.y,q.x-left.x),
     waterBlocksMovement:w.blocked(q.x,q.y,.32),waterIsTransparent:!w.opticalBlocked(q.x,q.y,.015),sightAcross:w.line(left,right,0,null,null,.015),movementAcross:w.movementLine(left,right,0,null,null,.32)};
   }if(bank)break;
  }
  for(const q of h.crossings){
   const distance=Math.max(.1,q.length/2-.7),a={x:q.x-Math.cos(q.a)*distance,y:q.y-Math.sin(q.a)*distance},b={x:q.x+Math.cos(q.a)*distance,y:q.y+Math.sin(q.a)*distance};
   if(!h.sample(q.x,q.y).water||w.blocked(q.x,q.y,.32)||!w.movementLine(a,b,0,null,null,.32))continue;
   bridge={id:q.id,road:q.roadId,water:q.waterId,position:{x:q.x,y:q.y},angle:q.a,width:q.width,length:q.length,passable:true};break;
  }
  const candidates=bank?DeadwallBiomePopulation165.around(w,bank.position.x,bank.position.y,1000).animals:[];
  const findPosition=a=>{for(let i=0;i<24;i++){const angle=i*Math.PI/12,q={x:a.x+Math.cos(angle)*2.2,y:a.y+Math.sin(angle)*2.2};if(!w.blocked(q.x,q.y,.32)&&w.line(q,a,0,null,null,.015))return q;}return null;};
  const choose=a=>{if(!DeadwallBiomePopulation165.admitted(w,a))return;const p=findPosition(a);if(p)animal={id:a.id,species:a.species,source:{x:a.x,y:a.y},position:p,angle:Math.atan2(a.y-p.y,a.x-p.x)};};
  for(const a of candidates){choose(a);if(animal)break;}
  if(!animal)for(let cy=0;cy<w.size/256&&!animal;cy++)for(let cx=0;cx<w.size/256&&!animal;cx++){const a=DeadwallBiomePopulation165.animal(w,cx,cy,0);if(a)choose(a);}
  if(!bank||!bridge||!animal)throw Error('The actual seed must provide a transparent blocking river, a passable bridge and an admitted animal');
  return{bank,bridge,animal};
 });
}
async function spatialFixture(page,location){
 return page.evaluate(location=>{
  const g=DEADWALL;if(!g.paused)throw Error('A spatial fixture requires Pause');
  const before=g.serialize(),raw=structuredClone(before),assigned={active:true,x:location.position.x,y:location.position.y,z:0,inside:null,a:location.angle,anchor:{x:g.player.x,y:g.player.y}};
  Object.assign(raw.frontier,assigned);g.restoreSave(DeadwallSave.validate(raw));g.togglePause(true);
  const after=g.serialize(),copy=structuredClone(after);delete before.timestamp;delete copy.timestamp;
  for(const key of Object.keys(assigned))copy.frontier[key]=before.frontier[key];
  const normalizations=[];if(before.wavePlan===null){before.wavePlan=DeadwallCore.wavePlan(before.wave,DeadwallCore.DIFFICULTIES[before.difficulty],0);normalizations.push({field:'wavePlan',reason:'Native restoreSave reconstruction of an absent calm-phase plan'});}
  if(JSON.stringify(before)!==JSON.stringify(copy))throw Error('Spatial fixture changed an undeclared saved owner');
  return{kind:'explicit-validated-same-seed-regional-actor-placement',target:location.id,assignedFields:Object.keys(assigned).map(k=>'frontier.'+k),assigned,normalizations,noInventoryResourceAgeRngGift:true,noCombatLedgerAssigned:true};
 },location);
}
async function observeScene(page,touch,kind,target){
 await page.evaluate(()=>{
  const water=DeadwallWaterArt165,fauna=DeadwallWildlifeArt165,waterDescriptor=Object.getOwnPropertyDescriptor(globalThis,'DeadwallWaterArt165'),faunaDescriptor=Object.getOwnPropertyDescriptor(globalThis,'DeadwallWildlifeArt165'),hits={water:[],crossings:[],animals:[]};
  globalThis.DeadwallWaterArt165={...water,draw(c,w,view,options){const result=water.draw(c,w,view,options);if(c.canvas===DEADWALL.canvas&&result){const x=view.l??view.left,y=view.t??view.top,r=view.r??view.right,b=view.b??view.bottom;hits.water.push({provider:w===DEADWALL.frontier.world(),features:w.hydrology.featuresIn({x,y,w:r-x,h:b-y}).map(f=>({id:f.id,kind:f.kind})),time:options.time});}return result;},drawCrossings(c,w,v,options){const count=water.drawCrossings(c,w,v,options);if(c.canvas===DEADWALL.canvas&&count)hits.crossings.push(count);return count;}};
  globalThis.DeadwallWildlifeArt165={...fauna,drawAnimal(c,a,options){const result=fauna.drawAnimal(c,a,options);if(c.canvas===DEADWALL.canvas&&result)hits.animals.push({id:a.id,species:a.species,moving:a.moving,stride:a.stride165});return result;},depthEntries(g,v,view){return fauna.depthEntries(g,v,view).map(entry=>({...entry,draw(c){const result=entry.draw(c);if(c.canvas===g.canvas)hits.animals.push({id:entry.id,nativeDepthEntry:true,painted:result});return result;}}));}};
  globalThis.__HYDROLOGY165_SCENE__={hits,restore(){Object.defineProperty(globalThis,'DeadwallWaterArt165',waterDescriptor);Object.defineProperty(globalThis,'DeadwallWildlifeArt165',faunaDescriptor);return DeadwallWaterArt165===water&&DeadwallWildlifeArt165===fauna;}};
 });
 try{
  await activate(page,'#resumeButton',touch);await page.waitForFunction(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay);
  await page.waitForFunction(({kind,target})=>{const h=__HYDROLOGY165_SCENE__.hits;return kind==='animal'?h.animals.some(a=>a.id===target)&&DEADWALL.frontier.wildlife165().some(a=>a.id===target&&a.moving&&a.stride165>0):kind==='bridge'?h.crossings.length>0:h.water.some(h=>h.provider&&h.features.length>0);},{kind,target});
  return await page.evaluate(()=>({hits:__HYDROLOGY165_SCENE__.hits,liveAnimals:DEADWALL.frontier.wildlife165().map(a=>({id:a.id,species:a.species,x:a.x,y:a.y,hp:a.hp,moving:a.moving,stride:a.stride165})),contacts:DEADWALL.frontier.contacts().filter(e=>e.id.startsWith('N165_')).map(e=>({id:e.id,hp:e.hp,x:e.x,y:e.y})),simulationStepsInjected:0}));
 }catch(error){await page.evaluate(()=>{__HYDROLOGY165_SCENE__.restore();delete globalThis.__HYDROLOGY165_SCENE__;});throw error;}
}
async function finishScene(page,touch){
 await activate(page,'#pauseButton',touch);await page.waitForFunction(()=>DEADWALL.paused);
 return page.evaluate(()=>{const observer=__HYDROLOGY165_SCENE__,result={hits:observer.hits,restored:observer.restore()};delete globalThis.__HYDROLOGY165_SCENE__;return result;});
}
async function waterPixels(page,point){
 return page.evaluate(point=>{
  const g=DEADWALL,w=g.frontier.world(),material=()=>{const{timestamp,...s}=g.serialize();return JSON.stringify(s);},before=material(),canvas=document.createElement('canvas');canvas.width=canvas.height=192;const c=canvas.getContext('2d');
  const paint=(time,reducedMotion)=>{c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,192,192);c.setTransform(16,0,0,16,96-point.x*16,96-point.y*16);const painted=DeadwallWaterArt165.draw(c,w,{l:point.x-6,r:point.x+6,t:point.y-6,b:point.y+6},{scale:16,time,reducedMotion});const data=c.getImageData(0,0,192,192).data;return{painted,image:canvas.toDataURL(),nonzero:data.filter((v,i)=>i%4===3&&v>0).length};};
  const still=paint(0,false),moving=paint(.73,false),repeat=paint(0,false),reduced0=paint(0,true),reduced1=paint(.73,true);
  return{sameTimeStable:still.image===repeat.image,animated:moving.image!==still.image,reducedMotionStable:reduced0.image===reduced1.image,meaningfulPixels:still.nonzero>100,unchanged:before===material(),timeSamples:[0,.73],simulationStepsInjected:0,images:{still:still.image,moving:moving.image},pass:still.painted&&moving.painted&&still.nonzero>100&&still.image===repeat.image&&moving.image!==still.image&&reduced0.image===reduced1.image&&before===material()};
 },point);
}

try{
 for(const viewport of profiles){
  const profile={viewport};report.profiles.push(profile);let context,page,rec;
  try{
   context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'});
   page=await context.newPage();page.setDefaultTimeout(60000);rec=recorder(page,profile,output,viewport.name+'-');
   await page.goto(base,{waitUntil:'networkidle'});await ready(page);await rec.screenshot('menu');await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',viewport.touch);await guide(page,viewport.touch);
   profile.native=await nativeEvidence(page);rec.check('Actual menu creates Standard seed17117 G8 ecology1 hydrology1',profile.native.seed===17117&&profile.native.generation===8&&profile.native.ecology===1&&profile.native.hydrology===1&&profile.native.newSaveHydrology===1&&await page.evaluate(()=>DEADWALL.difficulty.id==='standard'));
   const beforeReads=await material(page);profile.guide=await cards(page,viewport.touch);rec.check('All ten hydrology and population cards are readable through actual Guide controls',profile.guide.pass);await rec.screenshot('hydrology-guide');
   rec.check('Guide browsing preserves every saved owner and RNG',beforeReads===await material(page));
   profile.locations=await landscapePoints(page);rec.check('The actual seeded river blocks movement while remaining visible across both dry banks',profile.locations.bank.waterBlocksMovement&&profile.locations.bank.waterIsTransparent&&profile.locations.bank.sightAcross&&!profile.locations.bank.movementAcross);
   profile.waterPixels=await waterPixels(page,profile.locations.bank.water);for(const[name,data]of Object.entries(profile.waterPixels.images)){const filename=viewport.name+'-water-'+name+'.png';await writeFile(path.join(output,filename),Buffer.from(data.split(',')[1],'base64'));profile.screenshots.push(filename);}delete profile.waterPixels.images;
   rec.check('The native water painter animates deterministically and honors reduced motion without changing saved state',profile.waterPixels.pass);
   await activate(page,'#commandReturn129',viewport.touch);profile.scenes=[];
   for(const[kind,location]of [['bank',profile.locations.bank],['bridge',profile.locations.bridge],['animal',profile.locations.animal]]){
    const fixture=await spatialFixture(page,location),scene={kind,fixture};profile.scenes.push(scene);
    scene.observation=await observeScene(page,viewport.touch,kind,location.id);await rec.screenshot(kind==='animal'?'wildlife':'water-'+kind);scene.completed=await finishScene(page,viewport.touch);
    rec.check('Declared '+kind+' spatial fixture preserves inventory, resources, age and RNG and restores painter observers',fixture.noInventoryResourceAgeRngGift&&fixture.noCombatLedgerAssigned&&scene.completed.restored);
    if(kind==='bank')rec.check('Actual regional render uses the current hydrology provider and paints its seeded channel',scene.observation.hits.water.some(hit=>hit.provider&&hit.features.some(f=>f.id===location.id)));
    if(kind==='bridge')rec.check('A real passable road bridge is rendered over the authoritative water',location.passable&&scene.observation.hits.crossings.some(n=>n>0));
    if(kind==='animal')rec.check('An admitted animal moves, advances its pose and is drawn through the native depth queue under ordinary RAF updates',scene.observation.liveAnimals.some(a=>a.id===location.id&&a.moving&&a.stride>0)&&scene.observation.hits.animals.some(a=>a.id===location.id&&a.nativeDepthEntry&&a.painted)&&scene.observation.simulationStepsInjected===0);
   }
   profile.checkpoint=await checkpoint(page,viewport.touch);rec.check('Actual Save/menu/reload/Continue restores every saved field and removes its observer',profile.checkpoint.comparison&&profile.checkpoint.wrapperRestored);
   profile.continued=await nativeEvidence(page);rec.check('Continue retains seed, G8, ecology1 and hydrology1',profile.continued.seed===17117&&profile.continued.generation===8&&profile.continued.ecology===1&&profile.continued.hydrology===1);
   await rec.screenshot('continued-region');rec.check('No page overflow or browser/console/HTTP/request errors',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)&&rec.errors()===0);
   profile.pass=true;console.log(JSON.stringify({profile:viewport.name,pass:true,checks:profile.checks.length}));
  }catch(error){profile.pass=false;profile.failure=error.stack;if(page)profile.failureState=await page.evaluate(()=>({state:globalThis.DEADWALL?.state,paused:globalThis.DEADWALL?.paused,overlay:globalThis.DEADWALL?.activeOverlay?.id,position:globalThis.DEADWALL?.frontier?.position?.(),messages:document.querySelector('#notifications')?.textContent})).catch(()=>null);if(rec)await rec.screenshot('failure').catch(()=>{});throw error;}
  finally{await context?.close();}
 }
 report.pass=report.profiles.length===profiles.length&&report.profiles.every(profile=>profile.pass);
}finally{await harness.finish();await harness.close();}
