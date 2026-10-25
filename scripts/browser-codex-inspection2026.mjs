import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createHarness,recorder,ready,chooseCampaign,activate,openCommand,visibleInPanel} from './browser-qa-common144.mjs';

const harness=await createHarness('codex-inspection2026','Actual author Guide controls on desktop and mobile: all eighty source selections, metric rulers, offshore water reservations, HLM stairs, underground ladders, closed transport traces, floor observation, walking, wall collision and in-memory checkpoints. Reads compare every paused campaign field before and after. No campaign position, stock, clock, RNG or inspection pose is assigned by this test. The default player title is also checked for absence of author controls.');
const {browser,base,report,output}=harness;
const host='[data-codex-inspection2026="world"]';
const control=name=>host+' [data-inspection2026="'+name+'"]';
const sha=s=>createHash('sha256').update(s).digest('hex');
const state=page=>page.locator(host).evaluate(node=>DeadwallCodexInspectionUI2026.mount(document,node.parentElement).state());
const material=page=>page.evaluate(()=>{const{timestamp,...s}=DEADWALL.serialize();return JSON.stringify(s);});
const views=[{name:'desktop',width:1366,height:900},{name:'mobile',width:390,height:844,touch:true}];
const selected=process.env.DEADWALL_QA_PROFILES?.split(',');
if(selected&&(!selected.length||new Set(selected).size!==selected.length||selected.some(name=>!views.some(v=>v.name===name))))throw Error('Distinct known inspection profiles required');
const profiles=selected?views.filter(v=>selected.includes(v.name)):views;
report.profiles=[];report.pass=false;
async function press(page,name,touch,rec){
 const selector=control(name);await page.locator(selector).scrollIntoViewIfNeeded();
 rec.check(name+' is visible and receives input',(await visibleInPanel(page,selector,'.command-body')).pass);
 await activate(page,selector,touch);
}
async function openPlan(page,type){
 await page.locator(control('type')).selectOption(type);await page.locator(control('variant')).selectOption('1');
 await page.locator(control('view')).selectOption('plan');
 assert.equal((await state(page))?.planId,type+'-V01');
}
// Read a separate immutable model to obtain measurements. Only native controls
// below can change the observer mounted in the Guide.
async function metricCanvas(page,type,rec,label,view='plan',zoomM=32){
 const measured=await page.locator(control('canvas')).evaluate((canvas,{type,view,zoomM})=>{
  const s=DeadwallCodexInspection2026.create(type,1),b=s.scene.bounds;
  const scale=view==='walk'?canvas.width/zoomM:Math.min((canvas.width-80)/b.w,(canvas.height-80)/b.h);
  const barM=scale>20?2:scale>5?10:scale>1?50:500,barPixels=barM*scale;
  const row=canvas.getContext('2d').getImageData(0,canvas.height-27,canvas.width,1).data;
  const isRuler=x=>row[x*4]===232&&row[x*4+1]===216&&row[x*4+2]===173;
  let samples=0,matched=0;for(let x=26;x<Math.floor(24+barPixels)-2;x++){samples++;if(isRuler(x))matched++;}
  return{bounds:b,scale,barM,barPixels,samples,matched,endsAtExpectedPixel:!isRuler(Math.ceil(24+barPixels)+3),props:s.furnishing.props.length,playable:s.author.playable,entryConnected:s.scene.entry.connectedToWorld};
 },{type,view,zoomM});
 const status=await page.locator(control('status')).innerText();
 rec.check(label+' preserves the metric footprint and rendered ground ruler',status.includes(measured.bounds.w.toFixed(1)+' × '+measured.bounds.h.toFixed(1)+' m')&&measured.samples>5&&measured.matched/measured.samples>.95&&measured.endsAtExpectedPixel);
 rec.check(label+' remains a furnished author inspection',measured.props>0&&measured.playable===false&&measured.entryConnected===false);
 return measured;
}
async function walkIntoRoom(page,type){
 const route=await page.evaluate(type=>{
  const scene=DeadwallCodexInspection2026.create(type,1).scene,level=scene.entry.level;
  const nodes=new Map(scene.nodes.filter(n=>n.level===level).map(n=>[n.id,n])),adj=new Map([...nodes.keys()].map(id=>[id,[]]));
  for(const edge of scene.edges)if(edge.kind==='walk'&&nodes.has(edge.from)&&nodes.has(edge.to)){adj.get(edge.from).push(edge.to);adj.get(edge.to).push(edge.from);}
  const previous=new Map([[scene.entry.node,null]]),queue=[scene.entry.node];
  for(let i=0;i<queue.length;i++)for(const next of adj.get(queue[i]))if(!previous.has(next)){previous.set(next,queue[i]);queue.push(next);}
  const room=scene.rooms.find(r=>r.kind!=='circulation'&&r.level===level&&previous.has(r.id+':center'));
  if(!room)throw Error(type+' has no connected room on its entry level');
  const path=[];for(let id=room.id+':center';id!==null;id=previous.get(id))path.unshift(nodes.get(id));
  for(let i=1;i<path.length;i++)if(!DeadwallCodexPhysical2026.segmentClear(scene,path[i-1],path[i],level,.32))throw Error(type+' room route crosses a physical obstacle');
  return{path,room:{id:room.id,x:room.x,y:room.y,w:room.w,h:room.h,level}};
 },type);
 const before=await state(page);assert.equal(before.pose.level,route.room.level);
 assert.ok(Math.hypot(before.pose.x-route.path[0].x,before.pose.y-route.path[0].y)<.01,'The real reset control must start at the measured entry');
 let inputCount=0;
 for(const waypoint of route.path.slice(1))for(const axis of ['x','y']){
  let pose=(await state(page)).pose;
  while(Math.abs(waypoint[axis]-pose[axis])>.18){
   assert.ok(++inputCount<=240,type+' room walking has a bounded input budget');
   const delta=waypoint[axis]-pose[axis],key=axis==='x'?(delta>0?'ArrowRight':'ArrowLeft'):(delta>0?'ArrowDown':'ArrowUp');
   await page.keyboard.press((Math.abs(delta)>.7?'Shift+':'')+key);
   const next=(await state(page)).pose;
   assert.ok(Math.hypot(next.x-pose.x,next.y-pose.y)>.01,type+' native room walk must advance toward '+waypoint.id);
   assert.equal(next.level,route.room.level,'A doorway walk cannot change floor');pose=next;
  }
 }
 const after=await state(page),p=after.pose,r=route.room;
 return{...route,inputCount,before,after,entered:inputCount>0&&after.visitedRooms.includes(r.id)&&p.level===r.level&&p.x>r.x&&p.x<r.x+r.w&&p.y>r.y&&p.y<r.y+r.h};
}
async function levelJourney(page,type,direction,touch,rec){
 await openPlan(page,type);
 const route=await page.evaluate(({type,direction})=>{
  const scene=DeadwallCodexInspection2026.create(type,1).scene,levels=new Map(scene.levels.map(l=>[l.index,l]));
  const target=scene.levels.reduce((a,b)=>direction==='up'?(a.elevationM>b.elevationM?a:b):(a.elevationM<b.elevationM?a:b));
  const ground=scene.entry.level,elevation=levels.get(ground).elevationM;
  const first=scene.transitions.find(t=>[t.a,t.b].some(p=>p.level===ground)&&[t.a,t.b].some(p=>direction==='up'?levels.get(p.level).elevationM>elevation:levels.get(p.level).elevationM<elevation));
  if(!first)throw Error(type+' has no '+direction+' passage from its entry level');
  const landing=first.a.level===ground?first.nodeFrom:first.nodeTo,nodes=new Map(scene.nodes.map(n=>[n.id,n])),adj=new Map(scene.nodes.map(n=>[n.id,[]]));
  for(const edge of scene.edges){if(nodes.get(edge.from).level!==ground||nodes.get(edge.to).level!==ground)continue;adj.get(edge.from).push(edge.to);adj.get(edge.to).push(edge.from);}
  const previous=new Map([[scene.entry.node,null]]),queue=[scene.entry.node];
  for(let i=0;i<queue.length;i++){if(queue[i]===landing)break;for(const next of adj.get(queue[i]))if(!previous.has(next)){previous.set(next,queue[i]);queue.push(next);}}
  if(!previous.has(landing))throw Error(type+' has no ground route to its passage');
  const path=[];for(let id=landing;id;id=previous.get(id))path.unshift(nodes.get(id));
  const origin=nodes.get(landing),stack=new Map([[ground,[]]]),pending=[ground];
  for(let i=0;i<pending.length;i++)for(const t of scene.transitions){
   if(Math.hypot(t.a.x-origin.x,t.a.y-origin.y)>.1||Math.hypot(t.b.x-origin.x,t.b.y-origin.y)>.1)continue;
   const from=pending[i],to=t.from===from?t.to:t.to===from?t.from:null;
   if(to===null||stack.has(to))continue;
   stack.set(to,[...stack.get(from),{id:t.id,kind:t.kind,from,to,fromM:levels.get(from).elevationM,toM:levels.get(to).elevationM}]);pending.push(to);
  }
  if(!stack.has(target.index))throw Error(type+' has no continuous passage to its extreme level');
  return{path,steps:stack.get(target.index),target,ground,levels:scene.levels};
 },{type,direction});
 const metric=await metricCanvas(page,type,rec,type+' surface plan');
 await page.locator(control('canvas')).scrollIntoViewIfNeeded();await rec.screenshot(type+'-metric-plan');
 const entry=await state(page);
 await page.locator(control('floor')).selectOption(String(route.target.index));
 rec.check(type+' extreme floor observation leaves the actual pedestrian at the entry',JSON.stringify(await state(page))===JSON.stringify(entry));
 rec.check(type+' floor labels expose the true elevation',await page.locator(control('floor')+' option:checked').innerText().then(text=>text.includes('altitude '+route.target.elevationM.toFixed(2)+' m')));
 await rec.screenshot(type+'-extreme-floor-observed');
 await page.locator(control('view')).selectOption('walk');
 await page.locator(control('canvas')).scrollIntoViewIfNeeded();await page.locator(control('canvas')).focus();
 let inputCount=0;
 for(const waypoint of route.path.slice(1)){
  for(const axis of ['x','y']){
   let pose=(await state(page)).pose;
   while(Math.abs(waypoint[axis]-pose[axis])>.18){
    assert.ok(++inputCount<=240,type+' ground walking has a bounded input budget');
    const delta=waypoint[axis]-pose[axis],large=Math.abs(delta)>.7;
    const key=axis==='x'?(delta>0?'ArrowRight':'ArrowLeft'):(delta>0?'ArrowDown':'ArrowUp');
    await page.keyboard.press((large?'Shift+':'')+key);
    const next=(await state(page)).pose;
    assert.ok(Math.hypot(next.x-pose.x,next.y-pose.y)>.01,type+' native walk must advance toward '+waypoint.id);
    assert.equal(next.level,route.ground,type+' walking must stay on the ground until a passage is used');pose=next;
   }
  }
 }
 rec.check(type+' entry route reaches the actual passage by keyboard walking',inputCount>0&&!await page.locator(control('use-transition')).isDisabled());
 const visited=[];
 async function use(step){
  assert.equal((await state(page)).pose.level,step.from);
  await page.locator(control('transition')).selectOption(step.id);await press(page,'use-transition',touch,rec);
  const arrived=await state(page);
  rec.check(type+' '+step.kind+' '+step.fromM+' m → '+step.toM+' m uses its adjacent landing',arrived.pose.level===step.to);
  visited.push({...step,pose:arrived.pose});
 }
 for(const step of route.steps)await use(step);
 rec.check(type+' reaches the true extreme altitude through every intermediate landing',(await state(page)).pose.level===route.target.index&&route.steps.length>=3);
 const zoom=page.locator(host+' label').filter({hasText:'Champ visible'}).locator('select');await zoom.selectOption('16');
 const closeMetric=await metricCanvas(page,type,rec,type+' close pedestrian view','walk',16);
 await page.locator(control('canvas')).scrollIntoViewIfNeeded();await rec.screenshot(type+'-extreme-walk-16m');
 for(const step of [...route.steps].reverse())await use({...step,from:step.to,to:step.from,fromM:step.toM,toM:step.fromM});
 rec.check(type+' returns to its entry elevation using the actual reverse passages',(await state(page)).pose.level===route.ground);
 return{metric,closeMetric,inputCount,levels:route.levels,visited};
}
try{
 for(const view of profiles){
  const profile={viewport:view};report.profiles.push(profile);
  const context=await browser.newContext({viewport:{width:view.width,height:view.height},hasTouch:!!view.touch,isMobile:!!view.touch,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(30000);const rec=recorder(page,profile,output,view.name+'-');
  try{
   const defaultURL=new URL(base);defaultURL.search='';
   await page.goto(defaultURL.href,{waitUntil:'networkidle'});await ready(page);
   rec.check('Default player entry contains no inspection author panel',await page.locator(host).count()===0);
   await page.goto(base,{waitUntil:'networkidle'});await ready(page);
   await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',view.touch);await openCommand(page,view.touch,'field');
   await activate(page,'#commandPanel-field [data-field-view="world-codex"]',view.touch);
   await page.locator(host+' > summary').scrollIntoViewIfNeeded();await activate(page,host+' > summary',view.touch);
   await page.waitForFunction(()=>document.querySelector('[data-inspection2026="canvas"]')?.dataset.plan==='EXT-MONDE-T065-V01');
   const before=await material(page);
   rec.check('All 80 targets have fifty inspectable author plans',await page.locator(control('type')).evaluate(n=>n.options.length===80&&[...n.options].filter(o=>o.textContent.includes('50 plans')).length===80));
   rec.check('All 50 variant identities are selectable',await page.locator(control('variant')+' option').count()===50);
   await page.locator(control('type')).selectOption('EXT-MONDE-T005');
   const start=await state(page);assert.equal(start.planId,'EXT-MONDE-T005-V01');
   await page.locator(control('floor')).selectOption('0');
   rec.check('Observing another level does not move the pedestrian',JSON.stringify(await state(page))===JSON.stringify(start));
   await page.locator(control('view')).selectOption('walk');
   await page.locator(control('canvas')).scrollIntoViewIfNeeded();
   const colors=await page.locator(control('canvas')).evaluate(n=>{const p=n.getContext('2d').getImageData(0,0,n.width,n.height).data,s=new Set();for(let i=0;i<p.length;i+=4*41)s.add(p.slice(i,i+4).join(','));return s.size;});
   rec.check('The real metric canvas renders rooms, walls and equipment',colors>10);
   await rec.screenshot('cargo-walk');
   for(let i=0;i<12;i++)await press(page,'north',view.touch,rec);
   const stopped=await state(page),physical=await page.evaluate(p=>{const scene=DeadwallCodexInspection2026.create('EXT-MONDE-T005',1).scene;return{free:!DeadwallCodexPhysical2026.blocked(scene,p.x,p.y,p.level,.32),blockedLine:!DeadwallCodexPhysical2026.segmentClear(scene,p,{...p,y:p.y-3},p.level,.32)};},stopped.pose);
   rec.check('Repeated walk input stops before a wall without crossing it',start.pose.y-stopped.pose.y<6&&physical.free&&physical.blockedLine&&/arrêté/.test(await page.locator(control('status')).innerText()));
   await press(page,'reset',view.touch,rec);
   rec.check('An adjacent stair is offered at the real entry landing',!await page.locator(control('use-transition')).isDisabled());
   const adjacent=await page.locator(control('transition')).inputValue();await press(page,'use-transition',view.touch,rec);
   const changed=await state(page);profile.transition={id:adjacent,from:start.pose.level,to:changed.pose.level};
   rec.check('Actual stair control moves to an adjacent physical level',Math.abs(changed.pose.level-start.pose.level)===1&&changed.pose.x===start.pose.x&&changed.pose.y===start.pose.y);
   await press(page,'remember',view.touch,rec);const saved=await state(page);
   await press(page,'east',view.touch,rec);rec.check('Actual walk button moves the observer',JSON.stringify((await state(page)).pose)!==JSON.stringify(saved.pose));
   await press(page,'resume',view.touch,rec);rec.check('The inspection checkpoint restores the exact observer and visits',JSON.stringify(await state(page))===JSON.stringify(saved));
   await press(page,'reset',view.touch,rec);
   await page.locator(control('canvas')).focus();
   profile.cargoJourney=await walkIntoRoom(page,'EXT-MONDE-T005');
   rec.check('Keyboard walking enters a room through its door',profile.cargoJourney.entered&&profile.cargoJourney.after.visitedRooms.length>start.visitedRooms.length);
   await page.locator(control('canvas')).scrollIntoViewIfNeeded();await rec.screenshot('cargo-room');
   const available=await page.evaluate(()=>[...DeadwallCodexLayouts2026.types]);profile.inspectedTypes=available;
   for(const type of available){
    await page.locator(control('type')).selectOption(type);await page.locator(control('variant')).selectOption('50');
    rec.check(type+' variant50 is built by the visible controls',(await state(page))?.planId===type+'-V50');
   }
   for(const type of ['EXT-MONDE-T053','EXT-MONDE-T054','EXT-MONDE-T055','EXT-MONDE-T056']){
    await page.locator(control('type')).selectOption(type);await page.locator(control('variant')).selectOption('1');await page.locator(control('view')).selectOption('plan');
    await page.locator(control('canvas')).scrollIntoViewIfNeeded();await rec.screenshot(type+'-industry');
    const layout=await page.evaluate(type=>{const s=DeadwallCodexInspection2026.create(type,1);return{stages:s.author.processFlow.stages.map(n=>n.role),links:s.author.processFlow.links.length,props:s.furnishing.props.length,ok:DeadwallCodexPhysical2026.audit(s.scene).ok,operational:s.author.processFlow.recipesActive};},type);
    rec.check(type+' has a furnished, physically reachable five-stage author layout',layout.ok&&layout.links===4&&layout.stages.join(',')==='receiving,preparation,production,finishing,dispatch'&&layout.props>100&&layout.operational===false);
   }
   for(const type of ['EXT-MONDE-T021','EXT-MONDE-T027','EXT-MONDE-T045','EXT-MONDE-T048']){
    await page.locator(control('type')).selectOption(type);await page.locator(control('variant')).selectOption('1');await page.locator(control('view')).selectOption('plan');
    await page.locator(control('canvas')).scrollIntoViewIfNeeded();await rec.screenshot(type+'-outdoors');
    const geometry=await page.evaluate(type=>{const s=DeadwallCodexInspection2026.create(type,1);return{areas:s.scene.areas.length,ports:s.author.network.externalPorts.length,ok:DeadwallCodexPhysical2026.audit(s.scene).ok};},type);
    rec.check(type+' gardens and multiple access routes use valid inspection geometry',geometry.ok&&geometry.areas>0&&geometry.ports>=1);
   }
   for(const type of ['EXT-MONDE-T001','EXT-MONDE-T003','EXT-MONDE-T017','EXT-MONDE-T019','EXT-MONDE-T058','EXT-MONDE-T061','EXT-MONDE-T064']){
    await page.locator(control('type')).selectOption(type);await page.locator(control('variant')).selectOption('1');await page.locator(control('view')).selectOption('plan');
    await page.locator(control('canvas')).scrollIntoViewIfNeeded();await rec.screenshot(type+'-extension');
    const measured=await page.evaluate(type=>{const s=DeadwallCodexInspection2026.create(type,1);return{ok:DeadwallCodexPhysical2026.audit(s.scene).ok,props:s.furnishing.props.length,unknown:s.furnishing.summary.unknownUses,playable:s.author.playable,services:s.furnishing.summary.connectedServices};},type);
    rec.check(type+' exposes a furnished author plan with physical access and no active service',measured.ok&&measured.props>0&&measured.unknown===0&&measured.playable===false&&measured.services===0);
    const closed=await page.locator(control('canvas')).evaluate((canvas,type)=>{
     const s=DeadwallCodexInspection2026.create(type,1).scene,b=s.bounds,r=s.solids.find(r=>r.accessible===false&&!r.roomId),scale=Math.min((canvas.width-80)/b.w,(canvas.height-80)/b.h),bounds=canvas.getBoundingClientRect();
     if(!r)throw Error('No closed volume in '+type);
     return{x:((canvas.width-b.w*scale)/2+(r.x+r.w/2-b.x)*scale)*bounds.width/canvas.width,y:((canvas.height-b.h*scale)/2+(r.y+r.h/2-b.y)*scale)*bounds.height/canvas.height,w:r.w.toFixed(2),h:r.h.toFixed(2)};
    },type);
    await page.locator(control('canvas')).click({position:{x:closed.x,y:closed.y}});
    const details=await page.locator(control('detail')).innerText();
    rec.check(type+' closed volume is selectable at its actual metric footprint',details.includes(closed.w+' × '+closed.h+' m')&&details.includes('fermé et infranchissable'));
   }
   await openPlan(page,'EXT-MONDE-T009');
   profile.offshore=await metricCanvas(page,'EXT-MONDE-T009',rec,'The produced offshore platform');
   rec.check('The offshore platform opens its real author plan instead of a missing-plan message',(await state(page))?.planId==='EXT-MONDE-T009-V01'&&!/PLAN NON PRODUIT/.test(await page.locator(host).innerText()));
   const water=await page.locator(control('canvas')).evaluate(canvas=>{
    const s=DeadwallCodexInspection2026.create('EXT-MONDE-T009',1),b=s.scene.bounds,r=s.scene.solids.find(r=>r.accessible===false&&/water/.test(r.kind));
    if(!r)throw Error('Offshore water reservation is missing');
    const scale=Math.min((canvas.width-80)/b.w,(canvas.height-80)/b.h),rect=canvas.getBoundingClientRect();
    return{x:((canvas.width-b.w*scale)/2+(r.x+r.w/2-b.x)*scale)*rect.width/canvas.width,y:((canvas.height-b.h*scale)/2+(r.y+r.h/2-b.y)*scale)*rect.height/canvas.height,blocked:DeadwallCodexPhysical2026.blocked(s.scene,r.x+r.w/2,r.y+r.h/2,r.level,.32),w:r.w.toFixed(2),h:r.h.toFixed(2)};
   });
   await page.locator(control('canvas')).scrollIntoViewIfNeeded();await page.locator(control('canvas')).click({position:{x:water.x,y:water.y}});
   const waterDetail=await page.locator(control('detail')).innerText();
   rec.check('Offshore water keeps its real dimensions and an explicit closed-water status',water.blocked&&waterDetail.includes(water.w+' × '+water.h+' m')&&waterDetail.includes('Eau : volume fermé et infranchissable'));
   await rec.screenshot('offshore-platform-metric-water');
   const offshoreStart=(await state(page)).pose;await press(page,'east',view.touch,rec);
   rec.check('The offshore observer walks on the real entrance jetty',(await state(page)).pose.x>offshoreStart.x&&(await state(page)).pose.level===offshoreStart.level);
   await rec.screenshot('offshore-platform-entrance-walk');
   profile.hlm=await levelJourney(page,'EXT-MONDE-T042','up',view.touch,rec);
   profile.underground=await levelJourney(page,'EXT-MONDE-T040','down',view.touch,rec);
   profile.closedTransport=[];
   for(const type of ['EXT-MONDE-T029','EXT-MONDE-T070','EXT-MONDE-T075']){
    await openPlan(page,type);
    const measured=await metricCanvas(page,type,rec,type+' closed transport plan');
    const transport=await page.evaluate(type=>{
     const s=DeadwallCodexInspection2026.create(type,1),edges=DeadwallCodexInspectionUI2026.transportEdges(s.author);
     const edge=edges.find(e=>e.mode==='runway')||edges.find(e=>e.mode==='rail')||edges[0];
     const centre={x:(edge.a.x+edge.b.x)/2,y:(edge.a.y+edge.b.y)/2,level:0};
     return{count:edges.length,scope:s.author.transportNetwork.scope,operational:s.author.transportNetwork.operational,access:s.author.transportNetwork.inspectionAccess,minWidthM:Math.min(...edges.map(e=>e.widthM)),maxSegmentM:Math.max(...edges.map(e=>Math.hypot(e.b.x-e.a.x,e.b.y-e.a.y))),pedestrianGraphSeparate:!s.scene.edges.some(e=>edges.some(t=>t.id===e.id)),directEntryCut:!DeadwallCodexPhysical2026.segmentClear(s.scene,s.scene.entry,centre,0,.32)};
    },type);
    const legend=page.locator(control('transport'));
    rec.check(type+' labels its rendered transport routes as closed',await legend.isVisible()&&(await legend.innerText()).includes(transport.count+' tronçons')&&/restent fermés.*ni conduite, ni trains, ni avions/.test(await legend.innerText()));
    rec.check(type+' retains separate pedestrian access and no active vehicle service',transport.count>0&&transport.minWidthM>0&&transport.scope==='author-transport-layout-not-operational'&&transport.operational===false&&transport.access==='closed'&&transport.pedestrianGraphSeparate&&transport.directEntryCut);
    if(type==='EXT-MONDE-T070')rec.check('The airport retains a kilometre-scale footprint and runway segments',measured.bounds.w>=3000&&transport.maxSegmentM>=1000);
    profile.closedTransport.push({type,...measured,...transport});
    await page.locator(control('transport')).scrollIntoViewIfNeeded();await rec.screenshot(type+'-closed-transport-legend');
    await page.locator(control('canvas')).scrollIntoViewIfNeeded();await rec.screenshot(type+'-closed-transport-metric-plan');
   }
   await page.locator(control('type')).selectOption('EXT-MONDE-T065');await page.locator(control('variant')).selectOption('1');await page.locator(control('view')).selectOption('plan');
   await page.locator(control('canvas')).scrollIntoViewIfNeeded();await rec.screenshot('stadium-plan');
   const after=await material(page);profile.campaignBeforeSHA256=sha(before);profile.campaignAfterSHA256=sha(after);
   rec.check('Every saved campaign field is unchanged by the inspection controls',before===after);
   rec.check('No horizontal page overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   rec.check('No browser, console, HTTP or request errors',rec.errors()===0);
   profile.pass=true;console.log(JSON.stringify({profile:view.name,pass:true,checks:profile.checks.length}));
  }catch(e){profile.pass=false;profile.failure=e.stack;await rec.screenshot('failure').catch(()=>{});throw e;}
  finally{await context.close();}
 }
 report.pass=report.profiles.length===profiles.length&&report.profiles.every(p=>p.pass);
}finally{await harness.finish();await harness.close();}
