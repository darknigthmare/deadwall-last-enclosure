import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHarness,recorder,ready,chooseCampaign} from './browser-qa-common142.mjs';
import {activate,holdInput,observePersistentRestore,persistentRestoreComparison,saveReloadContinue,visibleInPanel} from './browser-qa-common144.mjs';

const require=createRequire(import.meta.url),Sources=require('./campaign-sources205.cjs');
const repository=fileURLToPath(new URL('..',import.meta.url));
process.env.DEADWALL_QA_ROOT ||= path.join(repository,'dist');
const servedRoot=path.resolve(process.env.DEADWALL_QA_ROOT),hash=b=>createHash('sha256').update(b).digest('hex');
const views=[{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844,touch:true}];
const chosen=process.env.DEADWALL_QA_PROFILES?.split(',');
if(chosen&&(new Set(chosen).size!==chosen.length||chosen.some(name=>!views.some(view=>view.name===name))))throw Error('Unknown or repeated campaign205 QA profile');
const profiles=chosen?views.filter(view=>chosen.includes(view.name)):views;
assert.ok(profiles.length);
const harness=await createHarness('campaign205','Ordinary visible New Game on seed17117, then separately labelled prepared G10-at-depot and G11-at-parcel saves. After each preparation, only native keyboard/touch controls move or harvest. No clock advance, free materials, health edits, enemy neutralisation or repeated pose assignments. Automated desktop/mobile viewport evidence, not a human campaign or physical-device performance claim.');
const {browser,report,output}=harness;
const ordinary=new URL(harness.base);ordinary.searchParams.delete('tools');ordinary.searchParams.delete('fixture');
report.surface='Ordinary player URL without author or legacy-fixture parameters; prepared saved positions are explicitly recorded below.';
report.base=ordinary.href;report.servedRoot=servedRoot;report.profiles=[];
report.sourceBefore=Sources.capture(repository);
report.distribution=[];
let ordinarySites;

async function pause(page,touch){if(!await page.locator('#pauseMenu').isVisible())await activate(page,'#pauseButton',touch);}
async function resume(page,touch){if(await page.locator('#pauseMenu').isVisible())await activate(page,'#resumeButton',touch);await page.waitForFunction(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay);}
async function nativeZoom(page,touch,target){
 const read=()=>page.evaluate(()=>DEADWALL.frontier.scale()),before=await read();let steps=0;
 if(touch&&!await page.locator('#touchCommandDrawer').evaluate(n=>n.open))await activate(page,'#touchCommandDrawer > summary',true);
 if(!touch){const r=await page.locator('#game').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);}
 while(Math.abs(await read()-target)>.000001&&steps<20){const up=(await read())<target;if(touch)await activate(page,'[data-game-command="'+(up?'zoomIn':'zoomOut')+'"]',true);else await page.mouse.wheel(0,up?-100:100);steps++;await page.waitForTimeout(35);}
 if(touch&&await page.locator('#touchCommandDrawer').evaluate(n=>n.open))await activate(page,'#touchCommandDrawer > summary',true);
 return{before,after:await read(),nativeInputs:steps,target};
}
const state=page=>page.evaluate(()=>({elapsed:DEADWALL.elapsed,pose:DEADWALL.frontier.position(),carry:{...DEADWALL.player.carry},resources:{...DEADWALL.resources},health:DEADWALL.player.health,focus:DEADWALL.frontier.overview().focus,choices:DEADWALL.frontier.overview().choices}));

function prepareG10(){
 const g=DEADWALL,raw=g.serialize(),before=JSON.stringify({resources:raw.resources,carry:raw.player.carry,randomState:raw.randomState,elapsed:raw.elapsed,enemies:raw.frontier.enemies,tracks:raw.frontier.tracks,groups:raw.worldEvolution.groups});
 if(raw.frontier.active||raw.frontier.generation!==11)throw Error('Prepared activation requires the untouched G11 campaign at D17');
 const newIds=new Set(g.frontier.world().pois.filter(p=>p.campaign205).map(p=>p.id));
 if(raw.frontier.seen.some(id=>newIds.has(id))||Object.keys(raw.frontier.taken).some(id=>newIds.has(id.split(':')[0])))throw Error('Prepared G10 must not discard any G11 discovery or collected resource');
 const point=g.fieldcraft.service(g.player,g.core());if(!point)throw Error('No actual depot work face');
 raw.frontier.generation=10;raw.player.x=point.x;raw.player.y=point.y;
 const validated=DeadwallSave.validate(raw);if(g.restoreSave(validated)!==true)throw Error('The complete prepared G10 save was refused');
 const after=g.serialize();if(JSON.stringify({resources:after.resources,carry:after.player.carry,randomState:after.randomState,elapsed:after.elapsed,enemies:after.frontier.enemies,tracks:after.frontier.tracks,groups:after.worldEvolution.groups})!==before)throw Error('Preparation changed an unassigned resource, clock, RNG or encounter owner');
 return {kind:'prepared-G10-at-depot',assignedFields:['frontier.generation:10','player.x/y at actual depot service face'],generation:g.frontier.position().generation,validCompleteSave:true,resourcesClockRngAndEncountersPreserved:true,point};
}

// Choose a real, already admitted site and one of its unlocked finite stores.
// No threat is removed: the fixture only skips the long regional approach.
function prepareParcel(){
 const g=DEADWALL,w=g.frontier.world(),G=DeadwallFrontierGeometry,A=DeadwallCodexCampaign205;
 if(w.generation!==11||g.frontier.position().active)throw Error('Prepared parcel requires an idle G11 depot save');
 let selected;
 for(const site of w.pois.filter(p=>p.campaign205).sort((a,b)=>w.threatCount(a)-w.threatCount(b)||a.id.localeCompare(b.id))){
  const template=A.template(site.type),plan=w.plan(site,0);
  for(const parcel of template.author.composition.parcels.filter(p=>p.interiorVisit)){
   const home=template.author.buildings.find(b=>b.id===parcel.unit);
   for(const object of plan.objects.filter(o=>o.authorObjectId.startsWith(home.id+':')&&!g.interventions134.blocksLoot({...o,poi:site.id,z:0}))){
    const room=template.furnishing.rooms.find(r=>r.id===object.roomId),start={x:parcel.gate.x,y:parcel.gate.y-1},worldStart=G.global(site,start.x,start.y);
    const nearbyThreats=w.nearPOI(worldStart.x,worldStart.y,75).filter(p=>w.threatCount(p)>0&&Math.hypot(p.x-worldStart.x,p.y-worldStart.y)<Math.hypot(p.w,p.h)/2+28);
    if(!room||nearbyThreats.length||w.blocked(worldStart.x,worldStart.y,.32))continue;
    selected={site,template,plan,parcel,home,object,room,start,worldStart};break;
   }
   if(selected)break;
  }
  if(selected)break;
 }
 if(!selected)throw Error('No unlocked residential store with a clear short native route away from a native hostile focus');
 const {site,template,plan,parcel,home,object,room,start,worldStart}=selected,raw=g.serialize();
 const protectedBefore=JSON.stringify({resources:raw.resources,carry:raw.player.carry,randomState:raw.randomState,elapsed:raw.elapsed,health:raw.player.health,enemies:raw.frontier.enemies,tracks:raw.frontier.tracks,groups:raw.worldEvolution.groups});
 Object.assign(raw.frontier,{active:true,...worldStart,z:0,inside:null,a:site.a+Math.PI/2,anchor:{x:g.player.x,y:g.player.y}});
 if(!raw.frontier.seen.includes(site.id))raw.frontier.seen.push(site.id);
 if(g.restoreSave(DeadwallSave.validate(raw))!==true)throw Error('The complete parcel save was refused');
 const after=g.serialize();if(JSON.stringify({resources:after.resources,carry:after.player.carry,randomState:after.randomState,elapsed:after.elapsed,health:after.player.health,enemies:after.frontier.enemies,tracks:after.frontier.tracks,groups:after.worldEvolution.groups})!==protectedBefore)throw Error('Parcel preparation changed a protected gameplay owner');
 const door=room.doors[0],service={x:object.access.x+object.access.w/2,y:object.access.y+object.access.h/2};
 const local=[start,{x:parcel.gate.x,y:parcel.gate.y+1},{x:parcel.gate.x,y:parcel.gate.y+2},{x:home.x+home.entry.x,y:home.y-.8},{x:home.x+home.entry.x,y:home.y+.8},{x:home.x+home.entry.x,y:door.y},room.center];
 const worldPoint=q=>G.global(site,q.x,q.y),clear=(a,b)=>w.movementLine(worldPoint(a),worldPoint(b),0,site.id,null,.32);
 // A continuous Cartesian visibility graph only inside the destination room.
 // Its vertices derive from the actual obstacles; no movement state is written.
 if(clear(room.center,service))local.push(service);
 else{
  const r=.32,e=.0001,items=template.furnishing.props.filter(p=>p.roomId===room.id),xs=[room.x+r+e,room.x+room.w-r-e,room.center.x,service.x,...items.flatMap(o=>[o.x-r-e,o.x+o.w+r+e])],ys=[room.y+r+e,room.y+room.h-r-e,room.center.y,service.y,...items.flatMap(o=>[o.y-r-e,o.y+o.h+r+e])];
  const X=[...new Set(xs.filter(x=>x>room.x+r&&x<room.x+room.w-r))].sort((a,b)=>a-b),Y=[...new Set(ys.filter(y=>y>room.y+r&&y<room.y+room.h-r))].sort((a,b)=>a-b),index=q=>Y.indexOf(q.y)*X.length+X.indexOf(q.x),point=i=>({x:X[i%X.length],y:Y[Math.floor(i/X.length)]}),from=index(room.center),to=index(service),parents=new Map([[from,null]]),queue=[from];
  for(let i=0;i<queue.length&&!parents.has(to);i++)for(const d of[-1,1,-X.length,X.length]){const at=queue[i],n=at+d;if(n<0||n>=X.length*Y.length||Math.abs(n%X.length-at%X.length)>1||parents.has(n)||!clear(point(at),point(n)))continue;parents.set(n,at);queue.push(n);}
  if(!parents.has(to))throw Error('No continuous route from real room door to store service face');
  const tail=[];for(let at=to;at!==from;at=parents.get(at))tail.push(point(at));local.push(...tail.reverse());
 }
 const route=[];for(const q of local)if(!route.length||Math.hypot(q.x-route.at(-1).local.x,q.y-route.at(-1).local.y)>.001)route.push({local:{x:q.x,y:q.y},...worldPoint(q)});
 for(let i=1;i<route.length;i++)if(!w.movementLine(route[i-1],route[i],0,site.id,null,.32))throw Error('Prepared path is blocked before native input: segment'+i);
 return {kind:'prepared-short-parcel-walk',site:{id:site.id,type:site.type,typology:site.campaign205.typology,variant:site.campaign205.variant,a:site.a,w:site.w,h:site.h,occupation:site.occupation,nativeThreats:w.threatCount(site)},parcel:parcel.id,home:{id:home.id,x:home.x,y:home.y,w:home.w,h:home.h,doorWidthM:home.entry.widthM},room:{id:room.id,name:room.name,x:room.x,y:room.y,w:room.w,h:room.h},target:{id:object.id,kind:object.kind,resource:object.resource,amount:object.amount,w:object.w,h:object.h,access:object.access},route,assignedFields:['one frontier initial pose/angle','frontier.active/anchor','one prepared site discovery'],resourcesClockRngHealthAndEncountersPreserved:true,enemyNeutralisations:[],coordinateAssignmentsAfterPreparation:0};
}

async function nativeWalk(page,context,touch,route){
 const keys={left:'a',right:'d',up:'w',down:'s'},stats={segments:[],inputChanges:0,sampledMoves:0,coordinateAssignments:0};
 let held=[],session;const boxes={};
 if(touch){session=await context.newCDPSession(page);for(const direction of Object.keys(keys)){const box=await page.locator('#touchControls [data-dir="'+direction+'"]').boundingBox();assert.ok(box,'Visible '+direction+' control');boxes[direction]={x:box.x+box.width/2,y:box.y+box.height/2};}}
 else await page.locator('#game').focus();
 const set=async wanted=>{if(wanted.join(',')===held.join(','))return;stats.inputChanges++;
  if(touch){if(held.length)await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});if(wanted.length)await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:wanted.map((key,i)=>({...boxes[key],id:i+1}))});}
  else{for(const key of held.filter(key=>!wanted.includes(key)))await page.keyboard.up(keys[key]);for(const key of wanted.filter(key=>!held.includes(key)))await page.keyboard.down(keys[key]);}held=wanted;
 };
 try{
  for(let i=1;i<route.length;i++){
   const origin=await page.evaluate(()=>DEADWALL.frontier.position()),target=route[i],vx=target.x-origin.x,vy=target.y-origin.y,length=Math.hypot(vx,vy),began=Date.now();let previous=origin,stall=0;
   assert.ok(await page.evaluate(({a,b})=>DEADWALL.frontier.world().movementLine(a,b,0,null,null,.32),{a:origin,b:target}),'Live movement disc admits segment'+i);
   while(true){const p=await page.evaluate(()=>DEADWALL.frontier.position()),left=Math.hypot(target.x-p.x,target.y-p.y);if(left<.09)break;
    if(Date.now()-began>30000)throw Error('Native walking timed out on segment'+i+' '+JSON.stringify({p,target,left,held}));
    const progress=Math.max(0,Math.min(length,((p.x-origin.x)*vx+(p.y-origin.y)*vy)/length)),ahead=Math.min(length,progress+.22),aim={x:origin.x+vx/length*ahead,y:origin.y+vy/length*ahead},angle=Math.atan2(aim.y-p.y,aim.x-p.x),octant=Math.round(angle/(Math.PI/4)),dx=Math.round(Math.cos(octant*Math.PI/4)),dy=Math.round(Math.sin(octant*Math.PI/4)),wanted=[];
    if(dx)wanted.push(dx>0?'right':'left');if(dy)wanted.push(dy>0?'down':'up');await set(wanted);await page.waitForTimeout(25);stats.sampledMoves++;
    const next=await page.evaluate(()=>{const p=DEADWALL.frontier.position();return{...p,clear:!DEADWALL.frontier.world().blocked(p.x,p.y,.32,0,p.inside),health:DEADWALL.player.health};});
    assert.ok(next.clear,'The real actor remains outside physical solids');assert.ok(next.health>0,'The prepared walk retains native danger and must survive it');
    stall=Math.hypot(next.x-previous.x,next.y-previous.y)<.001?stall+1:0;if(stall>70)throw Error('Native walking stalled on segment'+i);previous=next;
   }
   await set([]);stats.segments.push({index:i,target,arrival:await page.evaluate(()=>DEADWALL.frontier.position()),realMilliseconds:Date.now()-began});
  }
 }finally{await set([]);await session?.detach();}
 return stats;
}

async function artReadout(page,fixture){return page.evaluate(async f=>{
 const material=()=>{const{timestamp,...owners}=DEADWALL.serialize();return JSON.stringify(owners);};
 const g=DEADWALL,w=g.frontier.world(),p=w.pois.find(p=>p.id===f.site.id),v=g.frontier.overview(),plan=w.plan(p,0),detail=w.detailAt(p,0),entries=DeadwallFrontierArt.lotEntries(g,p,v),before=material(),a=g.art,original=a.drawActor,descriptor=Object.getOwnPropertyDescriptor(a,'drawActor'),frames=[];
 a.drawActor=function(c,e,kind,...args){if(kind!=='player')return original.call(this,c,e,kind,...args);const m=c.getTransform();frames.push({scaleX:Math.hypot(m.a,m.b)*32/g.dpr,scaleY:Math.hypot(m.c,m.d)*32/g.dpr});return original.call(this,c,e,kind,...args);};
 try{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}finally{if(descriptor)Object.defineProperty(a,'drawActor',descriptor);else delete a.drawActor;}
 const props=[...plan.objects,...detail.interior],known=props.every(o=>DeadwallCampaignSiteArt205.routeFor(o.kind)&&DeadwallCampaignSiteArt205.frameFor(o));
 return{sourceUnchanged:before===material(),instrumentationRestored:a.drawActor===original,scale:v.scale,actorFrames:frames,actorFootDiameterM:DeadwallFrontierWorld.RULES.footRadius*2,humanReferenceHeightM:1.7,humanReferenceIsNotSimulatedStandingHeight:true,humanReferencePixels:1.7*v.scale,doorWidthM:f.home.doorWidthM,doorPixels:f.home.doorWidthM*v.scale,props:props.length,kinds:[...new Set(props.map(o=>o.kind))],known,individualVolumes:plan.volumes160.map(o=>({id:o.id,w:o.w,h:o.h})),roofEntries:entries.filter(e=>e.kind==='context-roof160').map(e=>e.id),parcelRoofEntries:entries.filter(e=>e.kind==='roof').map(e=>e.id),inside:v.inside,covered:w.coveredAt205(v.x,v.y,0,v.inside),finiteContainers:plan.objects.map(o=>({id:o.id,kind:o.kind,resource:o.resource,amount:o.amount})),allDimensionsCanonical:props.every(o=>{const s=DeadwallCodexFurnishings2026.shape(o.kind),vertical=Math.round(o.rotationRad/(Math.PI/2))%2;return Math.abs(o.w-(vertical?s.h:s.w))<1e-8&&Math.abs(o.h-(vertical?s.w:s.h))<1e-8;})};
},fixture);}

try{
 for(const name of ['src/core.js','src/frontier-world.js','src/frontier.js','src/frontier-state.js','src/world-pack131.js','src/player-menus194.js','src/codex-campaign205.js','src/campaign-site-art205.js','src/frontier-art.js','src/codex-layouts2026.js']){
  const source=await fs.readFile(path.join(repository,name)),dist=await fs.readFile(path.join(servedRoot,name));assert.equal(hash(source),hash(dist),'Built runtime differs from source: '+name);report.distribution.push({path:name,bytes:dist.length,sha256:hash(dist)});
 }
 report.entrySha256=hash(await fs.readFile(path.join(servedRoot,'index.html')));
 for(const viewport of profiles){
  const profile={viewport,scenarios:[]};report.profiles.push(profile);
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(120000);
  const requests=new Map();page.on('request',request=>{const key=request.method()+' '+request.url(),row=requests.get(key)||{url:request.url(),method:request.method(),type:request.resourceType(),count:0,statuses:[]};row.count++;requests.set(key,row);});
  page.on('response',response=>{const request=response.request(),row=requests.get(request.method()+' '+request.url());if(row&&!row.statuses.includes(response.status()))row.statuses.push(response.status());});
  const rec=recorder(page,profile,output,viewport.name+'-'),check=(name,condition)=>{rec.check(name,condition);console.log(JSON.stringify({profile:viewport.name,check:name,pass:true}));},click=selector=>activate(page,selector,viewport.touch);
  try{
   await page.goto(ordinary.href,{waitUntil:'networkidle',timeout:120000});await ready(page);await page.waitForFunction(()=>DEADWALL.playerMenus194?.mode==='player');
   check('Ordinary title has no author or legacy fixture query',new URL(page.url()).search==='');await rec.screenshot('ordinary-title');
   check('Current campaign and dedicated art modules are loaded',await page.evaluate(()=>!!DeadwallCodexCampaign205&&!!DeadwallCampaignSiteArt205&&document.scripts.length>100));
   await chooseCampaign(page,'17117');
   profile.ordinary=await page.evaluate(()=>{const g=DEADWALL,w=g.frontier.world();return{seed:g.world.seed,generation:w.generation,sites:w.pois.filter(p=>p.campaign205).map(p=>({id:p.id,type:p.type,x:p.x,y:p.y,a:p.a,w:p.w,h:p.h})),coverage:w.campaignCoverage205,saved:g.lastSaveStatus.ok};});
   profile.scenarios.push({kind:'ordinary-visible-new-game',seed:17117,injectedFields:[]});
   check('Visible seed17117 starts a saved G11 campaign',profile.ordinary.seed===17117&&profile.ordinary.generation===11&&profile.ordinary.saved);
   check('The real seed installs eight sites across four eligible families',profile.ordinary.sites.length===8&&new Set(profile.ordinary.coverage.sites.map(p=>p.typology)).size===4);
   if(ordinarySites)check('Fresh desktop and mobile profiles reproduce the same admitted parcels',JSON.stringify(ordinarySites)===JSON.stringify(profile.ordinary.sites));else ordinarySites=profile.ordinary.sites;
   await click('#campaignIntro132Skip');await page.waitForFunction(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay);await rec.screenshot('ordinary-field');
   profile.ordinaryRecovery=await saveReloadContinue(page,viewport.touch);check('Ordinary G11 save/reload/Continue preserves every persistent owner',profile.ordinaryRecovery.pass);

   await pause(page,viewport.touch);profile.activationFixture=await page.evaluate(prepareG10);profile.scenarios.push(profile.activationFixture);
   check('Prepared G10 is a valid complete save without stock, clock, RNG or encounter edits',profile.activationFixture.validCompleteSave&&profile.activationFixture.resourcesClockRngAndEncountersPreserved);
   await pause(page,viewport.touch);await click('#pauseSettingsButton');await page.locator('#settingsModal').waitFor({state:'visible'});
   await click('#campaignMaintenance194 > summary');await rec.screenshot('settings-compatibility');await click('#openCampaignMaintenance194');
   const selector='#expansionAction-world131-expandCampaignSites205';await page.locator(selector).scrollIntoViewIfNeeded();
   check('The actual G11 activation is reachable through native settings compatibility controls',(await visibleInPanel(page,selector,'.command-body')).pass&&!await page.locator(selector).isDisabled());
   profile.activationBefore=await page.evaluate(()=>{const {timestamp,...material}=DeadwallSave.validate(DEADWALL.serialize()),w=DEADWALL.frontier.world();return{material,quote:DEADWALL.worldOps131.previewCampaignSites205(),historical:w.pois.map(p=>[p.id,p.type,p.x,p.y,p.a,p.w,p.h])};});
   check('Activation quotes actual admitted sites with zero cost and no invented services',profile.activationBefore.quote.ok&&profile.activationBefore.quote.addedSites===8&&profile.activationBefore.quote.seconds===0&&Object.keys(profile.activationBefore.quote.cost).length===0);
   await rec.screenshot('g10-activation');await observePersistentRestore(page);await click(selector);await page.waitForFunction(()=>DEADWALL.frontier.position().generation===11);
   const expected=structuredClone(profile.activationBefore.material);expected.frontier.generation=11;
   profile.activationComparison=await page.evaluate(persistentRestoreComparison,{material:JSON.stringify(expected),cp:{runId:expected.runId,seed:expected.worldSeed,generation:11}});
   if(!profile.activationComparison.pass)profile.activationOwnerDifferences=await page.evaluate(expected=>{
    const found=[],visit=(a,b,p)=>{if(found.length>=100||JSON.stringify(a)===JSON.stringify(b))return;if(a&&b&&typeof a==='object'&&typeof b==='object')for(const key of new Set([...Object.keys(a),...Object.keys(b)]))visit(a[key],b[key],p+'.'+key);else found.push({path:p,expected:a,actual:b});};visit(expected,globalThis.__DEADWALL_QA_RESTORED_144__,'save');return found;
   },expected);
   check('Native activation changes only its declared generation owner',profile.activationComparison.pass);
   profile.activationAfter=await page.evaluate(()=>{const w=DEADWALL.frontier.world();return{historical:w.pois.filter(p=>!p.campaign205).map(p=>[p.id,p.type,p.x,p.y,p.a,p.w,p.h]),sites:w.campaignCoverage205.placed,repeat:DEADWALL.worldOps131.previewCampaignSites205()};});
   check('Every historical parcel keeps its identity, dimensions and position',JSON.stringify(profile.activationAfter.historical)===JSON.stringify(profile.activationBefore.historical));
   check('The activated eight-site extension cannot activate twice',profile.activationAfter.sites===8&&!profile.activationAfter.repeat.ok);
   if(await page.locator('#pauseMenu').isVisible())await resume(page,viewport.touch);
   profile.activationRecovery=await saveReloadContinue(page,viewport.touch);check('Activated G11 native save/reload preserves all campaign owners',profile.activationRecovery.pass);

   await pause(page,viewport.touch);profile.parcelFixture=await page.evaluate(prepareParcel);profile.scenarios.push(profile.parcelFixture);
   check('Prepared short route preserves native health, stock, RNG, clock and all encounters',profile.parcelFixture.resourcesClockRngHealthAndEncountersPreserved&&profile.parcelFixture.enemyNeutralisations.length===0);
   await resume(page,viewport.touch);await page.waitForFunction(()=>DEADWALL.frontier.active());profile.parcelZoom=await nativeZoom(page,viewport.touch,12);await rec.screenshot('parcel-gate');
   check('Native overview zoom shows the parcel without changing its metric scale',profile.parcelZoom.after===12);
   await pause(page,viewport.touch);profile.exteriorArt=await artReadout(page,profile.parcelFixture);
   check('Parcel is open air with individual building roofs',profile.exteriorArt.inside===null&&profile.exteriorArt.covered===false&&profile.exteriorArt.parcelRoofEntries.length===0&&profile.exteriorArt.roofEntries.length===profile.exteriorArt.individualVolumes.length);
   check('Actual campaign furniture has named painters and its canonical metric dimensions',profile.exteriorArt.known&&profile.exteriorArt.allDimensionsCanonical);
   check('Observed natural render reads without altering saved state or keeping instrumentation',profile.exteriorArt.sourceUnchanged&&profile.exteriorArt.instrumentationRestored&&profile.exteriorArt.actorFrames.length>0);
   await resume(page,viewport.touch);const walkBefore=await state(page);profile.walk=await nativeWalk(page,context,viewport.touch,profile.parcelFixture.route);const walkAfter=await state(page);
   check('Keyboard or touch pointers perform the whole route without pose assignments',profile.walk.coordinateAssignments===0&&profile.walk.inputChanges>0&&profile.walk.segments.length===profile.parcelFixture.route.length-1);
   check('Walking advances the ordinary simulation and recorded real distance',walkAfter.elapsed>walkBefore.elapsed&&walkAfter.pose.distance>walkBefore.pose.distance);
   check('Gate, lane, real doorway and room lead to the intended building',walkAfter.pose.inside===profile.parcelFixture.site.id&&await page.evaluate(f=>{const p=DEADWALL.frontier.position(),s=DEADWALL.frontier.world().pois.find(p=>p.id===f.site.id),q=DeadwallFrontierGeometry.local(s,p.x,p.y);return q.x>f.room.x&&q.x<f.room.x+f.room.w&&q.y>f.room.y&&q.y<f.room.y+f.room.h;},profile.parcelFixture));
   profile.roomZoom=await nativeZoom(page,viewport.touch,44);check('Native close zoom exposes individual room furniture',profile.roomZoom.after===44);await rec.screenshot('room');await pause(page,viewport.touch);profile.interiorArt=await artReadout(page,profile.parcelFixture);
   check('Only the occupied building loses its roof and supplies physical cover',profile.interiorArt.covered===true&&profile.interiorArt.parcelRoofEntries.length===0&&profile.interiorArt.roofEntries.length===profile.interiorArt.individualVolumes.length-1);
   check('One metre stays the same for actor foot disc, doors, furniture and rendering',profile.interiorArt.actorFootDiameterM===.64&&profile.interiorArt.doorWidthM>.64&&profile.interiorArt.allDimensionsCanonical&&profile.interiorArt.actorFrames.every(f=>Math.abs(f.scaleX-profile.interiorArt.scale)<1e-6&&Math.abs(f.scaleY-profile.interiorArt.scale)<1e-6));
   check('Interior drawing also preserves every saved owner',profile.interiorArt.sourceUnchanged&&profile.interiorArt.instrumentationRestored);await resume(page,viewport.touch);

   await page.waitForFunction(()=>!!DEADWALL.frontier.overview().focus);let focus=await state(page);
   if(focus.choices>1){for(let n=0;n<=focus.choices;n++){if(viewport.touch)await click('#frontierTarget');else await page.keyboard.press('t');focus=await state(page);if(focus.focus?.id===profile.parcelFixture.target.id)break;}}
   check('A real reachable unlocked finite container is selected',focus.focus?.id===profile.parcelFixture.target.id&&!await page.evaluate(()=>DEADWALL.interventions134.blocksLoot(DEADWALL.frontier.overview().focus)));
   profile.lootBefore=await state(page);
   await holdInput(page,context,viewport.touch,'e','#touchAction',()=>page.waitForFunction(id=>DEADWALL.frontier.takenAmount(id)>=DEADWALL.frontier.world().pois.filter(p=>p.campaign205).flatMap(p=>DEADWALL.frontier.world().plan(p,0).objects).find(o=>o.id===id).amount-.000001,profile.parcelFixture.target.id,{timeout:15000}));
   profile.lootAfter=await state(page);profile.takenAfter=await page.evaluate(id=>DEADWALL.frontier.takenAmount(id),profile.parcelFixture.target.id);
   const resource=profile.parcelFixture.target.resource,amount=profile.parcelFixture.target.amount;
   check('Native held E transfers exactly the finite container amount into the carried bag',Math.abs(profile.lootAfter.carry[resource]-profile.lootBefore.carry[resource]-amount)<.000001&&Math.abs(profile.takenAfter-amount)<.000001);
   await rec.screenshot('finite-store-empty');profile.lootRecovery=await saveReloadContinue(page,viewport.touch);
   check('Native save/reload/Continue keeps the full depleted-container and carried-bag state',profile.lootRecovery.pass);
   check('Continue does not recreate the depleted store',Math.abs(await page.evaluate(id=>DEADWALL.frontier.takenAmount(id),profile.parcelFixture.target.id)-amount)<.000001);
   await rec.screenshot('continued-room');profile.loadedScripts=await page.evaluate(()=>[...document.scripts].map(s=>new URL(s.src,location.href).pathname).filter(Boolean));
   check('Both new public modules are delivered after Continue',profile.loadedScripts.includes('/src/codex-campaign205.js')&&profile.loadedScripts.includes('/src/campaign-site-art205.js'));
   check('No page, console, HTTP or request error',rec.errors()===0);profile.pass=true;
  }catch(error){profile.pass=false;profile.failure=error.stack;profile.failureState=await state(page).catch(()=>null);await rec.screenshot('failure').catch(()=>{});}
  finally{await context.close();profile.requests=[...requests.values()];}
  await fs.writeFile(path.join(output,'report.partial.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({profile:viewport.name,pass:profile.pass,checks:profile.checks.length,failure:profile.failure?.split('\n')[0]}));
 }
 report.sourceAfter=Sources.capture(repository);assert.deepEqual(report.sourceAfter,report.sourceBefore,'Campaign source changed during browser qualification');
 report.pass=report.profiles.length===profiles.length&&report.profiles.every(p=>p.pass);
}catch(error){report.pass=false;report.failure=error.stack;}
finally{try{await harness.close();}finally{await harness.finish();}}
if(!report.pass)process.exitCode=1;
