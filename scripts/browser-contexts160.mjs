import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createHarness, recorder, ready, chooseCampaign, activate, openCommand, resumeCommand, holdInput,
  visibleInPanel, persistedSnapshot, comparePersistentRestore } from './browser-qa-common144.mjs';

const views=[{name:'desktop',width:1366,height:768},{name:'mobile',width:390,height:844,touch:true},
  {name:'mobile-landscape',width:844,height:390,touch:true}];
const selected=process.env.DEADWALL_QA_PROFILES?.split(',');
if(selected&&(!selected.length||selected.some(name=>!views.some(view=>view.name===name))||new Set(selected).size!==selected.length))
  throw Error('DEADWALL_QA_PROFILES must contain distinct known contexts profiles');
const profiles=selected?views.filter(view=>selected.includes(view.name)):views;
assert.ok(profiles.length,'At least one known contexts profile required');
const repository=fileURLToPath(new URL('..',import.meta.url));
async function sourceManifest(){
  const files={};
  async function visit(relative){
    const absolute=path.join(repository,relative);let stat;try{stat=await fs.stat(absolute);}catch(error){if(error.code==='ENOENT')return;throw error;}
    if(stat.isDirectory()){for(const entry of (await fs.readdir(absolute)).sort())await visit(path.join(relative,entry));}
    else if(stat.isFile())files[relative.replaceAll(path.sep,'/')]=createHash('sha256').update(await fs.readFile(absolute)).digest('hex');
  }
  for(const entry of ['src','assets','docs','scripts','tests','.github','index.html','style.css','styles.css','package.json','package-lock.json','AGENTS.md'])await visit(entry);
  return files;
}
const sourceBefore=await sourceManifest();
const harness=await createHarness('contexts160','NATIVE: fresh Standard seed17117 G8, real introduction, keyboard/touch movement, finite personal scrap harvest and depot deposit, actual guide usage filters, real World & relays activation button with synchronous before/after ownership receipts. G10 activation is free of materials/time and grants no loot. ADVANCED EXPLICIT FIXTURES: actual generated G10 work points, finite prepared bag supplies, health deficits and previously neutralized nearby deterministic threats; validated save/restore retains seed, RNG, depot, geometry, IDs, harvested ledgers and prior completions. These fixtures do not certify natural travel or a6–10hour campaign. All paid access, pump, railway and care work begins through original UI buttons and advances through normal RAF, with actual movement/reload refusals, pause, Save/Continue cancellation, finite charges/materials, saved physical access and ordinary E/touch harvest. Artwork observations use actual production owner geometry, decoded atlas or exact raster-cache source, real game.render and visible canvas pixels. Mobile viewports are emulated; no Vercel deployment or physical-device certification.');
const {browser,base,report,output}=harness;report.profiles=[];report.requestedProfiles=profiles.map(view=>view.name);
const material=page=>page.evaluate(()=>{const{timestamp,...data}=DeadwallSave.validate(DEADWALL.serialize());return data;});
const economy=page=>page.evaluate(()=>({elapsed:DEADWALL.elapsed,resources:{...DEADWALL.resources},carry:{...DEADWALL.player.carry},
  gathered:DEADWALL.stats.gathered,player:{x:DEADWALL.player.x,y:DEADWALL.player.y},rng:DEADWALL.random.state,
  generation:DEADWALL.frontier.position().generation,completed:DEADWALL.contextOperations160.snapshot().completed}));
async function button(page,selector,touch,rec,name){
  await page.locator(selector).scrollIntoViewIfNeeded();const box=await visibleInPanel(page,selector,'.command-body');
  rec.check(name+': native control is visible, hit-testable and at least44px',box.pass&&box.box.height>=44);
  await activate(page,selector,touch);
}
async function guide(page,touch){
  if(await page.locator('#commandModal').isVisible())await activate(page,'#commandTab-field',touch);else await openCommand(page,touch,'field');
  await activate(page,'#commandPanel-field [data-field-view="world-codex"]',touch);
  await page.locator('#field-world-codex').waitFor({state:'visible'});
}
async function operations(page,touch,id='context160'){
  if(!await page.locator('#commandModal').isVisible())await openCommand(page,touch,'field');else await activate(page,'#commandTab-field',touch);
  await activate(page,'#expansionFieldTab',touch);await activate(page,'#expansionGroup-world',touch);await activate(page,'#expansionTab-'+id,touch);
}
async function saveContinue160(page,touch){
  if(!await page.locator('#pauseMenu').isVisible())await activate(page,'#pauseButton',touch);
  await activate(page,'#saveButton',touch);const checkpoint=await persistedSnapshot(page);assert.ok(checkpoint.ok,'Real Save succeeds');
  await activate(page,'#quitButton',touch);await page.reload({waitUntil:'networkidle'});await ready(page);
  await page.evaluate(()=>{const g=DEADWALL,original=g.restoreSave,descriptor=Object.getOwnPropertyDescriptor(g,'restoreSave');
    globalThis.__CONTEXT160_RESTORE_WRAPPER__={g,original,descriptor};globalThis.__DEADWALL_QA_RESTORED_144__=null;
    g.restoreSave=function(...args){const result=original.apply(this,args),{timestamp,...data}=DeadwallSave.validate(g.serialize());globalThis.__DEADWALL_QA_RESTORED_144__=structuredClone(data);return result;};
  });
  try{await activate(page,'#continueButton',touch);await page.waitForFunction(()=>DEADWALL.state==='playing');checkpoint.pass=await comparePersistentRestore(page,checkpoint);}
  finally{checkpoint.wrapperRestored=await page.evaluate(()=>{const stored=__CONTEXT160_RESTORE_WRAPPER__;if(stored.descriptor)Object.defineProperty(stored.g,'restoreSave',stored.descriptor);else delete stored.g.restoreSave;const restored=stored.g.restoreSave===stored.original;delete globalThis.__CONTEXT160_RESTORE_WRAPPER__;return restored;});}
  return checkpoint;
}

// Same live collision readers as local player movement; no actor coordinate is
// written during the native opening harvest and deposit.
async function route(page,request){return page.evaluate(request=>{
  const g=DEADWALL,actor=g.player,target=request.kind==='node'?g.world.nodes.filter(n=>!n.depleted&&n.type==='scrap'&&n.amount>=8)
    .sort((a,b)=>Math.hypot(a.x-actor.x,a.y-actor.y)-Math.hypot(b.x-actor.x,b.y-actor.y))[0]:g.world.buildings.get(request.id);
  if(!target)throw Error('No native live route target');const spacing=16,start={x:actor.x,y:actor.y},desired=Math.min(36,request.range*.65),
    avoid=target.def?{left:target.left-actor.radius-5,right:target.right+actor.radius+5,top:target.top-actor.radius-5,bottom:target.bottom+actor.radius+5}:null;
  const goal=q=>(!avoid||q.x<avoid.left||q.x>avoid.right||q.y<avoid.top||q.y>avoid.bottom)&&g.fieldcraft.distance(q,target)<=desired&&g.workerCanWorkAt({...actor,...q},target,request.range);
  for(const margin of [128,256,512]){
    const key=(x,y)=>x+':'+y,queue=[{x:0,y:0}],parents=new Map([[key(0,0),null]]),cache=new Map(),point=c=>({x:start.x+c.x*spacing,y:start.y+c.y*spacing});let found;
    const free=c=>{const id=key(c.x,c.y);if(!cache.has(id)){const q=point(c);cache.set(id,q.x>=Math.min(start.x,target.x)-margin&&q.x<=Math.max(start.x,target.x)+margin&&q.y>=Math.min(start.y,target.y)-margin&&q.y<=Math.max(start.y,target.y)+margin&&g.friendlyPositionClear(actor,q.x,q.y));}return cache.get(id);};
    for(let head=0;head<queue.length&&head<12000;head++){
      const c=queue[head],q=point(c);if(goal(q)){found=c;break;}
      for(const[dx,dy]of [[1,0],[0,-1],[-1,0],[0,1]]){const n={x:c.x+dx,y:c.y+dy},id=key(n.x,n.y);if(parents.has(id)||!free(n))continue;const p=point(n);if(![.25,.5,.75].every(t=>g.friendlyPositionClear(actor,q.x+(p.x-q.x)*t,q.y+(p.y-q.y)*t)))continue;parents.set(id,c);queue.push(n);}
    }
    if(!found)continue;const cells=[];for(let c=found;c;c=parents.get(key(c.x,c.y)))cells.push(c);cells.reverse();const segments=[];
    for(let i=1;i<cells.length;i++){const a=cells[i-1],b=cells[i],direction=b.x>a.x?'right':b.x<a.x?'left':b.y>a.y?'down':'up';if(segments.at(-1)?.direction===direction)segments.at(-1).target=point(b);else segments.push({direction,target:point(b)});}
    return{target:{id:target.id,x:target.x,y:target.y,amount:target.amount,type:target.type},segments};
  }
  throw Error('No collision-sampled native route to '+target.id);
},request);}
async function navigate(page,context,touch,request){
  const planned=await route(page,request),keys={up:'w',down:'s',left:'a',right:'d'};
  for(const segment of planned.segments){const axis=['left','right'].includes(segment.direction)?'x':'y',sign=['left','up'].includes(segment.direction)?-1:1;
    await holdInput(page,context,touch,keys[segment.direction],'#touchControls [data-dir="'+segment.direction+'"]',()=>page.waitForFunction(({axis,sign,target})=>sign*(DEADWALL.player[axis]-target[axis])>=-2,{axis,sign,target:segment.target},{timeout:15000}));
  }
  await page.waitForFunction(()=>DEADWALL.input.keys.size===0);return planned;
}

function prepareField160({kind,multiplier=2,healthDeficit=0,reloadReady=false}){
  const g=DEADWALL,w=g.frontier.world(),C=DeadwallCore,G=DeadwallFrontierGeometry;
  if(w.generation!==10||g.contextOperations160.busy())throw Error('Prepared field fixture requires idle G10');
  let selected;for(const p of w.contextSites160()){for(const op of p.context160.operations||[]){if(op.kind!==kind||g.contextOperations160.isComplete(p.id+':160:'+op.key))continue;
    const point=G.global(p,op.anchor.x,op.anchor.y);if(!w.blocked(point.x,point.y,C.FrontierTacticsRules.enemyRadius,0,null)&&w.line(point,point,0,null,null,.05)){selected={p,op,point};break;}}if(selected)break;}
  if(!selected)throw Error('No real seeded '+kind+' work support');const{p,op,point}=selected,raw=g.serialize(),rng=raw.randomState,depot=JSON.stringify(raw.resources),taken=JSON.stringify(raw.frontier.taken),previous=JSON.stringify(raw.expansions127.modules.context160);
  Object.assign(raw.frontier,{active:true,x:point.x,y:point.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});
  raw.frontier.seen=[...new Set([...raw.frontier.seen,p.id])];raw.player.carry=C.makeBag();for(const[k,n]of Object.entries(C.ContextRules160.operations[kind].cost))raw.player.carry[k]=n*multiplier;
  if(reloadReady){
    const arsenal=raw.expansions127.modules.arsenal134,equipped=arsenal?.carried.find(item=>item.uid===arsenal.equipped),spec=C.Arsenal134Rules.catalog[equipped?.id];
    if(!arsenal?.initialized||spec?.category!=='firearm'||spec.base!=='pistol'||raw.player.weapon!=='pistol'||spec.magazine<=6)
      throw Error('Reload fixture requires the actual equipped pistol with room for a finite reload');
    // The active magazine and its physical carried owner are one possession.
    raw.player.magazine.pistol=6;equipped.rounds=6;raw.player.carry.ammo=1;
  }
  if(kind==='medicalCare')raw.player.health=g.player.maxHealth-healthDeficit;
  const preparedThreats=[];for(const near of w.nearPOI(point.x,point.y,180))for(let i=0;i<w.threatCount(near);i++){const id=near.id+':e'+i;raw.frontier.enemies[id]=0;delete raw.frontier.tracks[id];preparedThreats.push(id);}
  raw.frontier.kills=Object.values(raw.frontier.enemies).filter(h=>h===0).length;
  const preparedGroups=[];for(const h of raw.worldEvolution.groups)if(Math.hypot(h.x-point.x,h.y-point.y)<220){h.lost=h.count;h.wound=0;h.fallen=Array.from({length:h.count},(_,i)=>i);h.injuries={};h.contacts={};preparedGroups.push(h.id);}
  g.restoreSave(DeadwallSave.validate(raw));g.togglePause(true);g.updateUI();
  const after=g.serialize();if(after.randomState!==rng||JSON.stringify(after.resources)!==depot||JSON.stringify(after.frontier.taken)!==taken||JSON.stringify(after.expansions127.modules.context160)!==previous)throw Error('Prepared fixture changed an unassigned persistent owner');
  const q=g.contextOperations160.preview(p.id,op.key);
  return{type:'advanced-real-site-finite-bag',kind,id:p.id,key:op.key,fullKey:p.id+':160:'+op.key,programme:p.codex,typeId:p.type,levels:p.levels,mode:p.context160.mode,
    point,rule:C.ContextRules160.operations[kind],preview:q,preparedThreats,preparedGroups,
    assignedFields:['frontier pose/anchor/seen','finite player.carry','player.health only for care','named deterministic near contacts neutralized',...(reloadReady?['finite equipped pistol magazine6 and matching arsenal134 carried owner rounds6','finite carried ammo1']:[])],rngPreserved:true,depotPreserved:true,lootLedgerPreserved:true,completedPreserved:true};
}
async function prepared(page,touch,kind,options={}){
  if(!await page.locator('#pauseMenu').isVisible())await activate(page,'#pauseButton',touch);
  const fixture=await page.evaluate(prepareField160,{kind,...options});await activate(page,'#resumeButton',touch);
  await page.waitForFunction(()=>!DEADWALL.paused&&!DEADWALL.activeOverlay);return fixture;
}
const opSelector=f=>'[id="expansionAction-context160-'+f.fullKey+'"]';
async function beginUI(page,touch,fixture,rec){
  await operations(page,touch);const selector=opSelector(fixture);
  const quote=await page.evaluate(f=>DEADWALL.contextOperations160.preview(f.id,f.key),fixture);
  rec.check(fixture.kind+': original UI price equals actual carried cost and seconds',quote.ok&&JSON.stringify(quote.cost)===JSON.stringify(fixture.rule.cost)&&quote.seconds===fixture.rule.seconds);
  const reason=await page.locator('[id="expansionAction-context160-'+fixture.fullKey+'-reason"]').innerText();
  rec.check(fixture.kind+': the real control explains exact work and finite supplies',reason.includes(String(fixture.rule.seconds))&&reason.includes('dans le sac'));
  await button(page,selector,touch,rec,fixture.kind+' begin');await page.waitForFunction(key=>DEADWALL.contextOperations160.presentation(key)?.elapsed>0,fixture.fullKey);
  return quote;
}
async function workState(page,fixture){return page.evaluate(f=>{
  const g=DEADWALL,w=g.frontier.world(),p=w.pois.find(p=>p.id===f.id),plan=w.plan(p,0),op=p.context160.operations.find(o=>o.key===f.key),barrier=[...plan.gates160,...plan.terrain160].find(o=>o.id===op.barrierId),G=DeadwallFrontierGeometry;
  const point=barrier?G.global(p,barrier.x+barrier.w/2,barrier.y+barrier.h/2):null;
  return{elapsed:g.elapsed,carry:{...g.player.carry},resources:{...g.resources},health:g.player.health,maxHealth:g.player.maxHealth,completed:g.contextOperations160.snapshot().completed,
    busy:g.contextOperations160.busy(),presentation:g.contextOperations160.presentation(f.fullKey),barrier:barrier?{id:barrier.id,point,blocked:w.blocked(point.x,point.y,.1,0,null)}:null};
},fixture);}
function payment(before,after,cost){return Object.keys(before.carry).every(key=>Math.abs(before.carry[key]-after.carry[key]-(cost[key]||0))<.000001);}

// This function observes a real render and restores every instrumentation
// property in finally, including an inherited canvas drawImage method.
async function artScene160(page,fixture){return page.evaluate(async f=>{
  const g=DEADWALL,A=DeadwallContextArt160,w=g.frontier.world(),p=w.pois.find(p=>p.id===f.id),plan=w.plan(p,0),ctx=g.ctx;
  await g.art.ensureAssets(Object.keys(A.ASSETS));
  const v=g.frontier.overview(),
    persistent=()=>{const{timestamp,...data}=g.serialize();return JSON.stringify(data);},before=persistent(),scale=v.scale,expected=[];
  // Chromium Canvas transforms and DOMMatrix arithmetic round differently at
  // regional coordinates. Replay the actual production Canvas operations;
  // keep the same strict source, destination and matrix comparisons below.
  const transformCanvas=document.createElement('canvas');transformCanvas.width=1;transformCanvas.height=1;
  const transformContext=transformCanvas.getContext('2d');
  function ownerTransform(extra=[]){
    transformContext.setTransform(g.dpr,0,0,g.dpr,0,0);transformContext.translate(g.width/2,g.height/2);
    transformContext.scale(scale,scale);transformContext.translate(-v.x,-v.y);
    transformContext.translate(p.x,p.y);transformContext.rotate(p.a||0);transformContext.translate(-p.w/2,-p.h/2);
    // Replaying the full sequence avoids a lossy getTransform/setTransform round trip.
    for(const[x,y,angle]of extra){transformContext.translate(x,y);transformContext.rotate(angle);}
    return transformContext.getTransform();
  }
  const transform=ownerTransform();
  const same=(a,b)=>a.length===b.length&&a.every((value,i)=>Number.isFinite(value)&&Math.abs(value-b[i])<.000001),matrix=m=>[m.a,m.b,m.c,m.d,m.e,m.f];
  function expect(o,angle=0,extra=[]){
    const frame=A.measure(o.kind,o,{seed:w.seed,variant:o.variant,angle});if(!frame)return;
    let m=ownerTransform(extra),d=frame.destination;if(angle){const x=d[0]+d[2]*frame.sprite.pivot[0],y=d[1]+d[3]*frame.sprite.pivot[1];m=ownerTransform([...extra,[x,y,angle]]);d=[d[0]-x,d[1]-y,d[2],d[3]];}
    const corners=[[d[0],d[1]],[d[0]+d[2],d[1]],[d[0],d[1]+d[3]],[d[0]+d[2],d[1]+d[3]]].map(([x,y])=>m.transformPoint({x,y})),
      visible=Math.max(...corners.map(q=>q.x))>0&&Math.min(...corners.map(q=>q.x))<g.canvas.width&&Math.max(...corners.map(q=>q.y))>0&&Math.min(...corners.map(q=>q.y))<g.canvas.height;
    expected.push({owner:o.id,kind:o.kind,atlas:frame.sprite.atlas,source:frame.source,destination:d,matrix:matrix(m),visible});
  }
  for(const o of plan.visuals160){const state=A.pose(g,p,plan,o,{world:w});
    if(o.kind==='bridgePier'&&o.h>o.w*5){const n=Math.min(64,Math.ceil(o.h/Math.max(.7,o.w*3)));for(let i=0;i<n;i++)expect({...o,id:o.id+':'+i,y:o.y+i*o.h/n,h:o.h/n,variant:A.select(o.kind,o.id,{seed:w.seed,variant:o.variant})?.variant});continue;}
    const object=state.complete&&o.completedKey&&['lockGate','railSignal'].includes(o.kind)?{...o,w:Math.min(.4,o.w)}:o;expect(object);
    if(o.kind==='pumpBase')expect({id:o.id+':rotor',kind:'pumpRotor',x:o.x+o.w*.65,y:o.y+o.h*.3,w:o.w*.28,h:o.h*.45,variant:A.select(o.kind,o.id,{seed:w.seed,variant:o.variant})?.variant},state.active&&state.kind==='pumpBasin'?state.angle:0);
    if(o.kind==='valveBody')expect({id:o.id+':wheel',kind:'valveWheel',x:o.x+o.w*.35,y:o.y+o.h*.02,w:o.w*.42,h:o.h*.52,variant:A.select(o.kind,o.id,{seed:w.seed,variant:o.variant})?.variant},state.angle);
  }
  for(const o of plan.terrain160.filter(o=>o.kind==='rail')){const vertical=o.h>o.w,length=vertical?o.h:o.w,count=Math.max(1,Math.min(128,Math.ceil(length/3)));
    for(let i=0;i<count;i++){const at=i*length/count,size=length/count,part={id:o.id+':'+i,kind:'railTrack',x:vertical?-size/2:o.x+at,y:vertical?-o.w/2:o.y,w:vertical?size:o.w/count,h:vertical?o.w:o.h,variant:o.variant},extra=vertical?[[o.x+o.w/2,o.y+at+size/2,Math.PI/2]]:[];expect(part,0,extra);}}
  for(const o of plan.volumes160)if(!A.viewerInside(v,p,o)){
    const item={id:o.id,type:A.ROOF_TYPES[o.roofFamily]||o.roofFamily||'warehouse'},sprite=DeadwallInteriorArt153.spriteForRoof(item,{seed:w.seed});if(!sprite)continue;
    const d=[o.x,o.y,o.w,o.h],corners=[[o.x,o.y],[o.x+o.w,o.y+o.h]].map(([x,y])=>transform.transformPoint({x,y}));
    // Rotated opposite corners alone do not bound a roof; retain all four.
    corners.push(transform.transformPoint({x:o.x+o.w,y:o.y}),transform.transformPoint({x:o.x,y:o.y+o.h}));
    const visible=Math.max(...corners.map(q=>q.x))>0&&Math.min(...corners.map(q=>q.x))<g.canvas.width&&Math.max(...corners.map(q=>q.y))>0&&Math.min(...corners.map(q=>q.y))<g.canvas.height;
    expected.push({owner:o.id+':roof',kind:'roof:'+item.type,atlas:sprite.atlas,source:sprite.rect,destination:d,matrix:matrix(transform),visible});
  }
  const observedAtlases=[...new Set([...Object.keys(A.ASSETS),...expected.map(e=>e.atlas)])];
  const original=ctx.drawImage,own=Object.getOwnPropertyDescriptor(ctx,'drawImage'),calls=[];
  ctx.drawImage=function(image,...args){const matrix=this.getTransform(),atlas=observedAtlases.find(key=>g.art.images[key]===image);
    let cache=null;if(!atlas&&args.length===8){const item=[...(g.art.renderCache153?.items?.entries()||[])].find(([,value])=>value.image===image&&observedAtlases.some(key=>g.art.images[key]===value.source));if(item)cache={key:item[0],sourceAtlas:observedAtlases.find(key=>g.art.images[key]===item[1].source),width:item[1].width,height:item[1].height,level:item[1].level};}
    if(atlas||cache){const sampling=cache?[0,0,cache.width,cache.height]:args.slice(0,4),source=args.slice(0,4),destination=args.slice(4),observedMatrix=[matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f];
      const matches=expected.filter(e=>e.visible&&e.atlas===(atlas||cache.sourceAtlas)&&same(destination,e.destination)&&same(observedMatrix,e.matrix)&&
        (atlas?same(source,e.source):same(source,sampling)&&cache.key===e.atlas+':'+e.source.join(',')+':'+cache.level));
      calls.push({atlas:atlas||cache.sourceAtlas,source,destination,matrix:observedMatrix,cache,owners:matches.map(e=>e.owner),kinds:matches.map(e=>e.kind)});}
    return original.call(this,image,...args);
  };
  try{g.render();}finally{if(own)Object.defineProperty(ctx,'drawImage',own);else delete ctx.drawImage;}
  const pixels=ctx.getImageData(0,0,g.canvas.width,g.canvas.height).data,colors=new Set();let opaque=0,samples=0;const stride=Math.max(1,Math.floor(Math.min(g.canvas.width,g.canvas.height)/35));
  for(let y=0;y<g.canvas.height;y+=stride)for(let x=0;x<g.canvas.width;x+=stride){const i=(y*g.canvas.width+x)*4;samples++;if(pixels[i+3]>240)opaque++;colors.add([pixels[i]>>3,pixels[i+1]>>3,pixels[i+2]>>3].join(','));}
  return{site:p.id,programme:p.codex,mode:p.context160.mode,layout:plan.style,activity:g.contextOperations160.activity(),terrain:plan.terrain160.map(o=>({id:o.id,kind:o.kind,blocked:!!o.blocked})),volumes:plan.volumes160.length,calls,
    ready:Object.keys(A.ASSETS).every(key=>g.art.diagnostics.ready.includes(key)),failed:g.art.diagnostics.failed,expected:expected.filter(e=>e.visible),matchedOwners:[...new Set(calls.flatMap(call=>call.owners))],
    pixels:{samples,opaque,colors:colors.size},wrappersRestored:ctx.drawImage===original,persistentUnchanged:before===persistent()};
},fixture);}
function prepareArtFixture160(request){
  const g=DEADWALL,w=g.frontier.world(),G=DeadwallFrontierGeometry,A=DeadwallContextArt160;let chosen;
  for(const p of w.contextSites160()){if(request.mode&&p.context160.mode!==request.mode)continue;const plan=w.plan(p,0);
    for(const o of request.roof?plan.volumes160:plan.visuals160){if(request.kind&&o.kind!==request.kind||!request.roof&&!A.select(o.kind,o.id,{seed:w.seed,variant:o.variant}))continue;
      const target=G.global(p,o.x+o.w/2,o.y+o.h/2);let point;
      const choices=request.roof?[[o.x+o.w/2,o.y-1],[o.x+o.w/2,o.y+o.h+1],[o.x-1,o.y+o.h/2],[o.x+o.w+1,o.y+o.h/2]].map(([x,y])=>G.global(p,x,y)):
        [1,2,3,5,7].flatMap(radius=>Array.from({length:16},(_,i)=>({x:target.x+Math.cos(i*Math.PI/8)*radius,y:target.y+Math.sin(i*Math.PI/8)*radius})));
      for(const q of choices)if(!point&&!w.blocked(q.x,q.y,.32,0,null))point=q;
      if(point){chosen={p,o,point,plan};break;}
    }if(chosen)break;
  }
  if(!chosen)throw Error('No real context artwork scene '+JSON.stringify(request));const{p,o,point,plan}=chosen,raw=g.serialize(),rng=raw.randomState,bag=JSON.stringify(raw.player.carry),depot=JSON.stringify(raw.resources),taken=JSON.stringify(raw.frontier.taken),completed=JSON.stringify(raw.expansions127.modules.context160);
  Object.assign(raw.frontier,{active:true,x:point.x,y:point.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});raw.frontier.seen=[...new Set([...raw.frontier.seen,p.id])];
  for(const near of w.nearPOI(point.x,point.y,180))for(let i=0;i<w.threatCount(near);i++){raw.frontier.enemies[near.id+':e'+i]=0;delete raw.frontier.tracks[near.id+':e'+i];}raw.frontier.kills=Object.values(raw.frontier.enemies).filter(h=>h===0).length;
  g.restoreSave(DeadwallSave.validate(raw));g.togglePause(true);const after=g.serialize();
  if(after.randomState!==rng||JSON.stringify(after.player.carry)!==bag||JSON.stringify(after.resources)!==depot||JSON.stringify(after.frontier.taken)!==taken||JSON.stringify(after.expansions127.modules.context160)!==completed)throw Error('Art fixture changed an unassigned gameplay owner');
  return{type:'advanced-actual-visible-context-scene',id:p.id,programme:p.codex,mode:p.context160.mode,selected:request.roof?o.id+':roof':o.id,selectedKind:request.roof?'roof':o.kind,point,layout:plan.style,levels:p.levels,volumes:plan.volumes160.length,
    assignedFields:['frontier pose/anchor/seen','named nearby deterministic contacts neutralized'],rngPreserved:true,bagPreserved:true,depotPreserved:true,lootLedgerPreserved:true,completedPreserved:true};
}

function prepareDanger160(fixture){
  const g=DEADWALL,w=g.frontier.world(),raw=g.serialize(),R=DeadwallCore.WorldEvolution.RULES;let point;
  for(let i=0;i<16;i++){const q={x:fixture.point.x+Math.cos(i*Math.PI/8)*3,y:fixture.point.y+Math.sin(i*Math.PI/8)*3};if(!point&&!w.blocked(q.x,q.y,DeadwallCore.FrontierTacticsRules.enemyRadius,0,null)&&w.line(fixture.point,q,0,null,null,.05))point=q;}
  if(!point||raw.worldEvolution.serial>=R.groupLimit||raw.worldEvolution.groups.length>=R.groupLimit)throw Error('No legal real visible danger fixture');
  const id='W'+String(raw.worldEvolution.serial).padStart(4,'0');raw.worldEvolution.serial++;
  raw.worldEvolution.groups.push({id,kind:'resting',count:1,lost:0,wound:0,fallen:[],injuries:{},x:point.x,y:point.y,a:0,seen:true,
    contacts:{0:{x:point.x,y:point.y,z:0,a:0,mode:'idle',ttl:0,gx:point.x,gy:point.y,cool:0}}});
  const rng=raw.randomState,bag=JSON.stringify(raw.player.carry),depot=JSON.stringify(raw.resources);g.restoreSave(DeadwallSave.validate(raw));g.togglePause(true);
  const after=g.serialize();if(after.randomState!==rng||JSON.stringify(after.player.carry)!==bag||JSON.stringify(after.resources)!==depot)throw Error('Danger fixture changed possessions or RNG');
  return{type:'advanced-real-saved-group-contact',id,point,count:1,assignedFields:['worldEvolution.serial and one legal finite resting group/contact'],rngPreserved:true,bagPreserved:true,depotPreserved:true};
}
function prepareHarvest160(){
  const g=DEADWALL,w=g.frontier.world(),G=DeadwallFrontierGeometry,Survey=DeadwallFrontierSurvey,record=g.frontier.expansionRecord160(),room=g.player.carryCapacity-DeadwallCore.bagTotal(g.player.carry);let selected;
  for(const p of w.contextSites160()){for(const o of w.plan(p,0).objects){const left=o.amount-(record.taken[o.id]||0);if(!(left>0&&left<=room)||o.sealed131)continue;
    for(let y=o.y-1;y<o.y+o.h+1&&!selected;y+=.4)for(let x=o.x-1;x<o.x+o.w+1&&!selected;x+=.4){const point=G.global(p,x,y),pose={...point,z:0,inside:p.id};if(w.blocked(point.x,point.y,.32,0,p.id))continue;
      const target=Survey.targets(w,pose,record.taken,DeadwallFrontierWorld.RULES.lootReach)[0];if(target?.id===o.id&&!g.interventions134?.blocksLoot(target))selected={p,o,point,left};}
    if(selected)break;}if(selected)break;}
  if(!selected)throw Error('No actual reachable unlocked finite G10 container');const{p,o,point,left}=selected,raw=g.serialize(),rng=raw.randomState,depot=JSON.stringify(raw.resources),bag=JSON.stringify(raw.player.carry),taken=JSON.stringify(raw.frontier.taken);
  Object.assign(raw.frontier,{active:true,x:point.x,y:point.y,z:0,inside:p.id,anchor:{x:g.player.x,y:g.player.y}});raw.frontier.seen=[...new Set([...raw.frontier.seen,p.id])];
  for(const near of w.nearPOI(point.x,point.y,180))for(let i=0;i<w.threatCount(near);i++){raw.frontier.enemies[near.id+':e'+i]=0;delete raw.frontier.tracks[near.id+':e'+i];}raw.frontier.kills=Object.values(raw.frontier.enemies).filter(h=>h===0).length;
  for(const h of raw.worldEvolution.groups)if(Math.hypot(h.x-point.x,h.y-point.y)<220){h.lost=h.count;h.wound=0;h.fallen=Array.from({length:h.count},(_,i)=>i);h.injuries={};h.contacts={};}
  g.restoreSave(DeadwallSave.validate(raw));g.togglePause(true);const after=g.serialize();if(after.randomState!==rng||JSON.stringify(after.resources)!==depot||JSON.stringify(after.player.carry)!==bag||JSON.stringify(after.frontier.taken)!==taken)throw Error('Harvest fixture prefilled inventory or ledger');
  return{type:'advanced-actual-container-free-approach',id:p.id,programme:p.codex,object:o.id,resource:o.resource,amount:o.amount,left,point,
    assignedFields:['frontier pose/anchor/seen','named nearby deterministic threats neutralized'],inventoryAssigned:false,ledgerAssigned:false,rngPreserved:true,depotPreserved:true};
}
try{
 for(const viewport of profiles){const profile={viewport,fixtures:[],nativeChecks:[],advancedChecks:[],jobs:[],artScenes:[]};report.profiles.push(profile);let context,page;
  try{
   context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:!!viewport.touch,isMobile:!!viewport.touch,serviceWorkers:'block'});page=await context.newPage();page.setDefaultTimeout(30000);const rec=recorder(page,profile,output,viewport.name+'-');
   const check=(name,condition,advanced=false)=>{(advanced?profile.advancedChecks:profile.nativeChecks).push(name);rec.check(name,condition);};
   const response=await page.goto(base,{waitUntil:'networkidle'});check('Document responds HTTP200',response?.status()===200);await ready(page);check('The genuine main menu identifies the current source version',(await page.locator('#mainMenu').innerText()).includes('VERSION '+harness.version));await chooseCampaign(page,'17117');await activate(page,'#campaignIntro132Skip',viewport.touch);
   profile.initial=await economy(page);check('Native campaign starts in G8 with no territorial completion',profile.initial.generation===8&&profile.initial.completed.length===0);
   profile.initialAssets=await page.evaluate(()=>({nonlazy:Object.entries(DeadwallArt.ASSETS).filter(([,spec])=>!spec.lazy).map(([key])=>key).sort(),ready:[...DEADWALL.art.diagnostics.ready].sort(),failed:DEADWALL.art.diagnostics.failed,lazy:Object.keys(DeadwallContextArt160.ASSETS)}));
   check('All historical startup assets decode; context atlases stay lazy before the first field visit',profile.initialAssets.failed.length===0&&profile.initialAssets.nonlazy.every(key=>profile.initialAssets.ready.includes(key))&&profile.initialAssets.lazy.every(key=>!profile.initialAssets.ready.includes(key)));
   await openCommand(page,viewport.touch,'workers');await activate(page,'[data-worker-order="retreat"]',viewport.touch);await resumeCommand(page,viewport.touch);
   profile.harvestRoute=await navigate(page,context,viewport.touch,{kind:'node',range:62});const beforeHarvest=await economy(page);
   await holdInput(page,context,viewport.touch,'e','#touchAction',()=>page.waitForFunction(()=>DEADWALL.player.carry.scrap>=4,null,{timeout:10000}));const afterHarvest=await economy(page);profile.nativeHarvest={before:beforeHarvest,after:afterHarvest};
   check('Native held input gathers finite personal scrap without depositing it remotely',afterHarvest.carry.scrap>=4&&afterHarvest.gathered>beforeHarvest.gathered&&afterHarvest.resources.scrap===beforeHarvest.resources.scrap);
   const core=await page.evaluate(()=>DEADWALL.core().id);profile.depositRoute=await navigate(page,context,viewport.touch,{kind:'building',id:core,range:100});const beforeDeposit=await economy(page);
   await holdInput(page,context,viewport.touch,'e','#touchAction',()=>page.waitForFunction(()=>DEADWALL.player.carry.scrap<.01,null,{timeout:10000}));const afterDeposit=await economy(page);profile.nativeDeposit={before:beforeDeposit,after:afterDeposit};
   check('The original depot accepts exactly the personally carried scrap',Math.abs(afterDeposit.resources.scrap-beforeDeposit.resources.scrap-beforeDeposit.carry.scrap)<.000001);
   await guide(page,viewport.touch);const beforeGuide=await material(page);
   for(const[value,count]of [['supported',4000],['context160',626],['unavailable',0],['known',0]]){await page.locator('#worldCodexAvailability159').selectOption(value);await page.locator('#worldCodexSearch').fill('');check('Real guide filter '+value+' reports '+count+' entries',new RegExp('^'+count+' fiche').test(await page.locator('#field-world-codex .world-codex-count').innerText()));}
   check('Guide reads preserve every saved field and RNG',JSON.stringify(beforeGuide)===JSON.stringify(await material(page)));
   await page.locator('#worldCodexAvailability159').selectOption('context160');await page.locator('#worldCodexSearch').fill('DW-0300');await button(page,'[data-codex-territories160="programme-DW-0300"]',viewport.touch,rec,'Guide activation navigation');
   check('A guide link only opens the actual controller without activating or offering loot',await page.evaluate(()=>DEADWALL.frontier.position().generation===8&&document.querySelector('#expansionTab-world131')?.getAttribute('aria-selected')==='true'));
   const activation='#expansionAction-world131-expandTerritories160';await page.locator(activation).scrollIntoViewIfNeeded();
   await page.locator(activation).evaluate(node=>{const snapshot=()=>{const{timestamp,...data}=DeadwallSave.validate(DEADWALL.serialize());return structuredClone(data);};globalThis.__CONTEXT160_ACTIVATION__={};node.addEventListener('click',()=>{__CONTEXT160_ACTIVATION__.before=snapshot();},{capture:true});node.addEventListener('click',()=>{__CONTEXT160_ACTIVATION__.after=snapshot();});});
   check('At the actual depot the explicit G10 button names626 programmes and costs nothing',await page.evaluate(()=>{const q=DEADWALL.worldOps131.previewTerritories160();return q.ok&&q.seconds===0&&Object.keys(q.cost).length===0&&document.getElementById('expansionAction-world131-expandTerritories160').textContent==='ACTIVER LES 626 PROGRAMMES TERRITORIAUX';}));
   await button(page,activation,viewport.touch,rec,'Explicit G10 activation');await page.waitForFunction(()=>DEADWALL.frontier.position().generation===10);
   profile.activation=await page.evaluate(()=>{const receipt=__CONTEXT160_ACTIVATION__,before=receipt.before,after=receipt.after,changed=Object.keys(before).filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key])),a={...after.frontier,generation:before.frontier.generation};return{changed,frontierPreserved:JSON.stringify(a)===JSON.stringify(before.frontier),beforeGeneration:before.frontier.generation,afterGeneration:after.frontier.generation,resourcesPreserved:JSON.stringify(before.resources)===JSON.stringify(after.resources),carryPreserved:JSON.stringify(before.player.carry)===JSON.stringify(after.player.carry),rngPreserved:before.randomState===after.randomState};});
   check('Actual activation synchronously changes only the regional generation with no gift or RNG',profile.activation.beforeGeneration===8&&profile.activation.afterGeneration===10&&JSON.stringify(profile.activation.changed)===JSON.stringify(['frontier'])&&profile.activation.frontierPreserved&&profile.activation.resourcesPreserved&&profile.activation.carryPreserved&&profile.activation.rngPreserved);
   profile.coverage=await page.evaluate(()=>{const w=DEADWALL.frontier.world();return{contracts:DeadwallCodexContext160.ids.length,sites:w.contextSites160().length,coverage:w.contextCoverage160,unique:new Set(w.contextSites160().map(p=>p.id)).size};});
   check('G10 contains actual seeded physical sites without promising626 placements on every seed',profile.coverage.contracts===626&&profile.coverage.sites>0&&profile.coverage.unique===profile.coverage.sites);await rec.screenshot('native-g10-depot');

   const empty=await prepared(page,viewport.touch,'restoreAccess',{multiplier:0});profile.fixtures.push(empty);await operations(page,viewport.touch);const beforeEmpty=await material(page);
   const deniedEmpty=await page.evaluate(f=>({preview:DEADWALL.contextOperations160.preview(f.id,f.key),begin:DEADWALL.contextOperations160.begin(f.id,f.key)}),empty);
   check('A real empty bag refuses work in UI and owner without touching depot or any saved field',await page.locator(opSelector(empty)).isDisabled()&&!deniedEmpty.begin.ok&&deniedEmpty.preview.reason.includes('Dans le sac')&&JSON.stringify(beforeEmpty)===JSON.stringify(await material(page)),true);await resumeCommand(page,viewport.touch);
   const reload=await prepared(page,viewport.touch,'restoreAccess',{reloadReady:true});profile.fixtures.push(reload);
   if(viewport.touch){await activate(page,'#touchCommandDrawer > summary',true);await activate(page,'[data-game-command="reload"]',true);await activate(page,'#touchCommandDrawer > summary',true);}else{await page.locator('#game').focus();await page.keyboard.press('r');}
   await page.waitForFunction(()=>DEADWALL.player.reload>0);await operations(page,viewport.touch);const beforeReloadRefusal=await material(page),reloadReason=await page.evaluate(f=>DEADWALL.contextOperations160.begin(f.id,f.key),reload);
   check('An actual native reload disables work and cannot pay supplies or finish an operation',await page.locator(opSelector(reload)).isDisabled()&&!reloadReason.ok&&reloadReason.reason.includes('rechargement')&&JSON.stringify(beforeReloadRefusal)===JSON.stringify(await material(page)),true);await resumeCommand(page,viewport.touch);await page.waitForFunction(()=>DEADWALL.player.reload===0);
   const danger=await prepared(page,viewport.touch,'restoreAccess');profile.fixtures.push(danger);await activate(page,'#pauseButton',viewport.touch);const dangerFixture=await page.evaluate(prepareDanger160,danger);profile.fixtures.push(dangerFixture);await activate(page,'#resumeButton',viewport.touch);
   await page.waitForFunction(id=>DEADWALL.worldEvolution.groupMembers().some(e=>e.group?.id===id&&(e.hp??e.health)>0),dangerFixture.id);await operations(page,viewport.touch);const beforeDanger=await material(page),dangerQuote=await page.evaluate(f=>DEADWALL.contextOperations160.preview(f.id,f.key),danger);
   check('A real saved visible hostile contact prevents the actual field operation',!dangerQuote.ok&&dangerQuote.reason.includes('Sécurisez')&&await page.locator(opSelector(danger)).isDisabled(),true);check('Danger refusal consumes no supply, saved completion or RNG',JSON.stringify(beforeDanger)===JSON.stringify(await material(page)),true);await resumeCommand(page,viewport.touch);

   let access=await prepared(page,viewport.touch,'restoreAccess');profile.fixtures.push(access);await beginUI(page,viewport.touch,access,rec);const partial=await workState(page,access);
   await holdInput(page,context,viewport.touch,'d','#touchControls [data-dir="right"]',()=>page.waitForFunction(()=>!DEADWALL.contextOperations160.busy()));
   const interrupted=await workState(page,access);check('Actual native movement interrupts work without material payment or completion',JSON.stringify(interrupted.carry)===JSON.stringify(partial.carry)&&!interrupted.completed.includes(access.fullKey),true);
   access=await prepared(page,viewport.touch,'restoreAccess');profile.fixtures.push(access);await beginUI(page,viewport.touch,access,rec);await page.waitForFunction(key=>DEADWALL.contextOperations160.presentation(key)?.elapsed>.25,access.fullKey);
   await activate(page,'#pauseButton',viewport.touch);const paused=await workState(page,access);await page.waitForTimeout(350);const pausedAfter=await workState(page,access);
   check('The real Pause control freezes operation progress and all carried charges',JSON.stringify(paused.presentation)===JSON.stringify(pausedAfter.presentation)&&JSON.stringify(paused.carry)===JSON.stringify(pausedAfter.carry),true);await activate(page,'#resumeButton',viewport.touch);
   profile.partialSave=await saveContinue160(page,viewport.touch);check('Real Save/Continue exactly restores a partial job snapshot and removes its temporary wrapper',profile.partialSave.pass&&profile.partialSave.wrapperRestored,true);
   const cancelled=await workState(page,access);check('Save/Continue cancels unfinished work with no free access or stock',!cancelled.busy&&!cancelled.completed.includes(access.fullKey)&&JSON.stringify(cancelled.carry)===JSON.stringify(paused.carry),true);

   for(const kind of ['restoreAccess','pumpBasin','switchTrack']){
    const fixture=await prepared(page,viewport.touch,kind);profile.fixtures.push(fixture);const before=await workState(page,fixture);check(kind+': named physical support is blocked before paid work',before.barrier?.blocked===true,true);
    await beginUI(page,viewport.touch,fixture,rec);const progress=await workState(page,fixture);check(kind+': actual progress has not prepaid supplies',JSON.stringify(progress.carry)===JSON.stringify(before.carry)&&progress.presentation?.elapsed>0,true);
    if(kind==='pumpBasin'){
      const first=await artScene160(page,fixture);await page.waitForFunction(({key,elapsed})=>DEADWALL.contextOperations160.presentation(key)?.elapsed>elapsed+.25,{key:fixture.fullKey,elapsed:first.activity.elapsed});const second=await artScene160(page,fixture);
      const baseDraw=scene=>scene.calls.find(call=>call.kinds.includes('pumpBase')),rotorDraw=scene=>scene.calls.find(call=>call.kinds.includes('pumpRotor'));
      const base1=baseDraw(first),base2=baseDraw(second),rotor1=rotorDraw(first),rotor2=rotorDraw(second);profile.pumpAnimation={first,second};
      check('The real paid pump draws separate base and rotor sprites and advances only its active rotor pose',!!base1&&!!base2&&!!rotor1&&!!rotor2&&JSON.stringify(base1.destination)===JSON.stringify(base2.destination)&&JSON.stringify(base1.matrix)===JSON.stringify(base2.matrix)&&JSON.stringify(rotor1.matrix)!==JSON.stringify(rotor2.matrix)&&first.activity.kind==='pumpBasin'&&second.activity.elapsed>first.activity.elapsed,true);
      check('Both live animation renders restore wrappers and preserve all saved owners',first.wrappersRestored&&second.wrappersRestored&&first.persistentUnchanged&&second.persistentUnchanged,true);
    }
    await page.waitForFunction(key=>DEADWALL.contextOperations160.isComplete(key),fixture.fullKey,{timeout:(fixture.rule.seconds+15)*1000});await activate(page,'#pauseButton',viewport.touch);const after=await workState(page,fixture);profile.jobs.push({fixture,before,after});
    check(kind+': normal RAF spends exact bag supplies once and actually opens the barrier',payment(before,after,fixture.rule.cost)&&after.barrier?.blocked===false&&!after.busy&&after.completed.filter(key=>key===fixture.fullKey).length===1&&after.elapsed-before.elapsed>=fixture.rule.seconds-.15,true);
    check(kind+': repeated work is refused by the original owner',await page.evaluate(f=>!DEADWALL.contextOperations160.preview(f.id,f.key).ok,fixture),true);
    await activate(page,'#resumeButton',viewport.touch);await rec.screenshot(kind+'-completed');
   }
   const care=await prepared(page,viewport.touch,'medicalCare',{healthDeficit:30});profile.fixtures.push(care);const careBefore=await workState(page,care);await beginUI(page,viewport.touch,care,rec);
   await page.waitForFunction(()=>!DEADWALL.contextOperations160.busy(),null,{timeout:25000});await activate(page,'#pauseButton',viewport.touch);const careOnce=await workState(page,care);await activate(page,'#resumeButton',viewport.touch);
   check('Real medical work consumes one carried medicine and heals exactly20 without restoring other stock',payment(careBefore,careOnce,care.rule.cost)&&careOnce.health===careBefore.health+20,true);
   await beginUI(page,viewport.touch,care,rec);await page.waitForFunction(()=>!DEADWALL.contextOperations160.busy(),null,{timeout:25000});await activate(page,'#pauseButton',viewport.touch);const careTwice=await workState(page,care);
   check('Finite two-dose prepared medicine is exhausted and bounded by maximum health',careTwice.carry.medicine===0&&careTwice.health===careTwice.maxHealth&&!careTwice.completed.includes(care.fullKey),true);
   await operations(page,viewport.touch);const healthy=await page.evaluate(f=>DEADWALL.contextOperations160.preview(f.id,f.key),care);check('Healthy owner and its native button explicitly refuse another care operation',!healthy.ok&&healthy.reason.includes('Aucun soin')&&await page.locator(opSelector(care)).isDisabled(),true);await resumeCommand(page,viewport.touch);

   for(const request of [{kind:'pumpBase'},{kind:'railSignal'},{kind:'bridgePier'},{kind:'cliffFace'},{mode:'cluster',roof:true},{mode:'building',roof:true}]){
    await activate(page,'#pauseButton',viewport.touch);const fixture=await page.evaluate(prepareArtFixture160,request);profile.fixtures.push(fixture);await activate(page,'#resumeButton',viewport.touch);const scene=await artScene160(page,fixture);profile.artScenes.push(scene);
    const selectedObserved=scene.matchedOwners.some(owner=>owner===fixture.selected||owner.startsWith(fixture.selected+':'));
    check('Actual '+fixture.selectedKind+' layout has a visible owner and exact production atlas/cache draw',scene.layout==='codex160'&&scene.expected.length>0&&selectedObserved,true);
    check('Actual '+fixture.selectedKind+' scene decodes cleanly, paints pixels and restores all wrappers without saved mutation',scene.ready&&scene.failed.length===0&&scene.pixels.opaque/scene.pixels.samples>.99&&scene.pixels.colors>20&&scene.wrappersRestored&&scene.persistentUnchanged,true);
    await rec.screenshot('actual-context-'+fixture.selectedKind+'-'+fixture.mode);
   }
   await activate(page,'#pauseButton',viewport.touch);const harvest=await page.evaluate(prepareHarvest160);profile.fixtures.push(harvest);const harvestBefore=await material(page);await activate(page,'#resumeButton',viewport.touch);
   await holdInput(page,context,viewport.touch,'e','#touchAction',()=>page.waitForFunction(f=>DEADWALL.frontier.takenAmount(f.object)>=f.amount-.000001,harvest,{timeout:45000}));await activate(page,'#pauseButton',viewport.touch);const harvestAfter=await material(page);
   const ledgerGain=Object.entries(harvestAfter.frontier.taken).reduce((sum,[id,n])=>sum+Math.max(0,n-(harvestBefore.frontier.taken[id]||0)),0),bagGain=Object.values(harvestAfter.player.carry).reduce((a,b)=>a+b,0)-Object.values(harvestBefore.player.carry).reduce((a,b)=>a+b,0);
   profile.fieldHarvest={fixture:harvest,beforeTaken:harvestBefore.frontier.taken[harvest.object]||0,afterTaken:harvestAfter.frontier.taken[harvest.object],ledgerGain,bagGain};
   check('Native field harvesting exhausts a real finite G10 container and pays only measured ledger gains into the bag',Math.abs(harvestAfter.frontier.taken[harvest.object]-harvest.amount)<.000001&&Math.abs(ledgerGain-bagGain)<.000001&&bagGain>=harvest.left-.000001,true);await rec.screenshot('actual-finite-g10-harvest');await activate(page,'#resumeButton',viewport.touch);

   profile.finalSave=await saveContinue160(page,viewport.touch);check('Real final Save/Continue retains all finite payments and completed physical accesses and removes its wrapper',profile.finalSave.pass&&profile.finalSave.wrapperRestored,true);
   check('Continue never refills the exhausted field container',await page.evaluate(f=>Math.abs(DEADWALL.frontier.takenAmount(f.object)-f.amount)<.000001,harvest),true);
   await guide(page,viewport.touch);await page.locator('#worldCodexAvailability159').selectOption('known');await page.locator('#worldCodexSearch').fill(care.programme);
   check('The actual known filter includes a visited G10 service and only saved discoveries',await page.locator('[data-codex-id="programme-'+care.programme+'"]').count()===1&&await page.evaluate(()=>DeadwallCodexActions159.knownPlaces(DEADWALL,DeadwallCodexActions159.knownProgrammes(DEADWALL).at(-1)).every(p=>DEADWALL.frontier.discoveries().includes(p.id))),true);
   const beforeKnownQueries=await material(page);profile.unknownProgramme=await page.evaluate(()=>{const known=new Set(DEADWALL.frontier.discoveries()),programmes=new Set(DeadwallCodexActions159.knownProgrammes(DEADWALL)),p=DEADWALL.frontier.world().contextSites160().find(p=>!known.has(p.id)&&!programmes.has(p.codex));if(!p)throw Error('A genuinely unknown seeded G10 programme is required');return{id:p.id,programme:p.codex,name:p.name};});
   await page.locator('#worldCodexSearch').fill(profile.unknownProgramme.programme);
   check('Searching a real unknown G10 programme cannot disclose its seeded place',await page.locator('#worldCodexResults article').count()===0&&!(await page.locator('#worldCodexResults').innerText()).includes(profile.unknownProgramme.name),true);
   check('Known and unknown guide queries cannot change any saved field or RNG',JSON.stringify(beforeKnownQueries)===JSON.stringify(await material(page)),true);await page.locator('#worldCodexSearch').fill(care.programme);
   check('The guide identifies activated G10 without claiming unknown sites',await page.locator('#worldCodexCoverage159').innerText().then(text=>text.includes('G10 est activée')),true);await rec.screenshot('known-g10-services');await resumeCommand(page,viewport.touch);
   check('All four page, console, HTTP and request error collectors are empty',rec.errors()===0);profile.pass=profile.checks.every(item=>item.pass);
  }catch(error){profile.pass=false;profile.failure=error.stack;if(page){profile.failureState=await page.evaluate(()=>({state:DEADWALL?.state,paused:DEADWALL?.paused,overlay:DEADWALL?.activeOverlay?.id,generation:DEADWALL?.frontier?.position(),activity:DEADWALL?.contextOperations160?.activity(),carry:DEADWALL?.player?.carry,focus:document.activeElement?.outerHTML?.slice(0,1500),errors:DEADWALL?.art?.diagnostics?.failed})).catch(()=>null);await page.screenshot({path:path.join(output,viewport.name+'-failure.png')}).then(()=>profile.screenshots.push(viewport.name+'-failure.png')).catch(()=>{});}}
  finally{await context?.close();}console.log(JSON.stringify({profile:viewport.name,pass:profile.pass,checks:profile.checks?.length,failure:profile.failure?.split('\n')[0]}));if(!profile.pass)break;
 }
}finally{
 report.pass=report.profiles.length===profiles.length&&report.profiles.every(profile=>profile.pass);
 try{await harness.close();}finally{
  const sourceAfter=await sourceManifest(),changed=[...new Set([...Object.keys(sourceBefore),...Object.keys(sourceAfter)])].filter(file=>sourceBefore[file]!==sourceAfter[file]);
  report.sourceProof={files:Object.keys(sourceBefore).length,changed,immutable:changed.length===0,scope:'local repository source/assets/docs/scripts/tests/CI and named root files; not remote delivery identity'};if(changed.length)report.pass=false;
  await harness.finish();const checks=report.profiles.flatMap(profile=>profile.checks||[]),errors=report.profiles.reduce((total,profile)=>total+(profile.pageErrors?.length||0)+(profile.consoleErrors?.length||0)+(profile.httpErrors?.length||0)+(profile.requestFailures?.length||0),0);
  const receipt={kind:'contexts160',version:report.version,started:report.started,completed:report.completed,pass:report.pass,report:path.join(output,'report.json'),requestedProfiles:profiles.map(view=>view.name),actualProfiles:report.profiles.map(profile=>profile.viewport.name),controls:checks.length,passed:checks.filter(check=>check.pass).length,errors,sourceProof:report.sourceProof,
    instrumentation:{allProfilesCompleted:report.profiles.length===profiles.length,allArtWrappersRestored:report.profiles.every(profile=>profile.artScenes.length>0&&profile.artScenes.every(scene=>scene.wrappersRestored)&&profile.pumpAnimation?.first?.wrappersRestored&&profile.pumpAnimation?.second?.wrappersRestored),allSaveWrappersRestored:report.profiles.every(profile=>profile.partialSave?.wrapperRestored&&profile.finalSave?.wrapperRestored)},
    limitation:'Emulated mobile and explicit prepared field inventories/poses; no proof of natural6–10hour pace, physical devices, file access or production deployment.'};
  await fs.writeFile(path.join(output,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');await fs.writeFile(path.join(output,'source-manifest.json'),JSON.stringify({before:sourceBefore,after:sourceAfter},null,2)+'\n');console.log('Receipt: '+path.join(output,'receipt.json'));
 }
}
if(!report.pass)process.exitCode=1;
