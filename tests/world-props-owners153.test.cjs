'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {boot127}=require('./helpers/expansions127.cjs');
const P=require('../src/world-props-art153.js'),O=require('../src/operations-art.js'),C=require('../src/core.js');
const root=path.resolve(__dirname,'..'),clone=x=>JSON.parse(JSON.stringify(x));
const imagesPromise=(async()=>Object.fromEntries(await Promise.all([...Object.entries(P.ASSETS).filter(([key])=>/Kits|Lights|Operations/.test(key)),['operations',O.ASSET]].map(async([key,s])=>[key,await loadImage(path.join(root,s.url))]))))();
function saved(g){const s=clone(g.serialize());delete s.timestamp;return s;}
async function fresh(){const g=boot127().game;g.startNew('standard','17117');require('../src/essential-art.js');require('../src/barricades134.js').install(g);const A=require('../src/art.js'),previous=globalThis.Image;globalThis.Image=class{set src(_){this.onerror();}};try{g.art=A.create();await g.art.ready;}finally{globalThis.Image=previous;}g.art.images={...await imagesPromise};g.art.renderCache153=null;return g;}
function recorder(g,ctx){const calls=[],blit=g.art.blit.bind(g.art);g.art.blit=(c,key,r,...d)=>{calls.push({key,r:[...r],d,transform:c.getTransform().toJSON(),alpha:c.globalAlpha});return blit(c,key,r,...d);};return calls;}
function context(){return createCanvas(400,400).getContext('2d');}
function unlock(raw,g,family){const t=g.essentials.targets().find(t=>t.family===family);raw.frontier.seen=[...new Set([...raw.frontier.seen,t.poi])];raw.essentials.jobs[t.id]={stage:'delivered'};return t;}

test('153 owners: seven operation painters use native atlases, stable cargo and real camp state; evacuation retains the living casualty',async()=>{
 const g=await fresh(),ctx=context(),calls=recorder(g,ctx),before=saved(g),rng=g.random.state;
 ctx.translate(3,5);ctx.globalAlpha=.45;const matrix=ctx.getTransform().toJSON(),alpha=ctx.globalAlpha;
 for(const type of Object.keys(P.OPERATIONS)){
  assert.equal(g.operationsArt.draw(ctx,type,150,160,74),true);const q=calls.at(-1);assert.equal(q.key,'worldPropsOperations153');
  const family=P.OPERATIONS[type],sprite=P.FAMILIES[family].find(s=>JSON.stringify(s.rect)===JSON.stringify(q.r));assert.ok(sprite,type);
  if(type==='bedroll')assert.equal(sprite.variant,0,'A deployed camp uses the unrolled bedding.');
  const pivot=type==='marker'?(sprite.variant===0?[.14,.98]:[.5,.98]):O.SPRITES[type].pivot;
  assert.ok(Math.abs(q.d[0]+q.d[2]*pivot[0]-150)<1e-8);assert.ok(Math.abs(q.d[1]+q.d[3]*pivot[1]-160)<1e-8);
  assert.deepEqual(ctx.getTransform().toJSON(),matrix);assert.equal(ctx.globalAlpha,alpha);
 }
 assert.equal(g.operationsArt.draw(ctx,'cargo',10,12,2),true);const cargo=calls.at(-1);
 assert.equal(g.operationsArt.draw(ctx,'cargo',320,384,64),true);const moved=calls.at(-1);assert.deepEqual(moved.r,cargo.r);moved.d.forEach((n,i)=>assert.ok(Math.abs(n-cargo.d[i]*32)<1e-8));
 assert.equal(g.operationsArt.draw(ctx,'casualty',150,160,74),true);assert.equal(calls.at(-1).key,'operations');assert.deepEqual(calls.at(-1).r,O.SPRITES.casualty.rect);
 const n=calls.length;assert.equal(g.operationsArt.draw(ctx,'unknown',150,160,74),false);assert.equal(g.operationsArt.draw(ctx,'cache',NaN,160,74),false);assert.equal(calls.length,n);
 delete g.art.images.worldPropsOperations153;assert.equal(g.operationsArt.draw(ctx,'cache',150,160,74),true);assert.equal(calls.at(-1).key,'operations');
 assert.deepEqual(saved(g),before);assert.equal(g.random.state,rng);
});

test('153 owners: four essential packages, carried equipment and deployed light render without changing jobs, save or RNG',async()=>{
 const g=await fresh(),raw=clone(g.serialize()),targets=g.essentials.targets(),selected=[];
 for(const family of C.Essentials.keys){const t=targets.find(t=>t.family===family);selected.push(t);raw.frontier.seen.push(t.poi);raw.essentials.jobs[t.id]={stage:'ground',point:{domain:'local',x:120+selected.length*25,y:140,z:0,inside:null}};}
 const light=targets.find(t=>t.family==='light'&&t.id!==selected[0].id);raw.frontier.seen.push(light.poi);raw.essentials.jobs[light.id]={stage:'delivered'};
 raw.essentials.serial=2;raw.essentials.effects=[{id:1,kind:'light',domain:'local',x:160,y:180,z:0,inside:null,left:C.Essentials.RULES.kits.light.duration,pulse:0}];raw.frontier.seen=[...new Set(raw.frontier.seen)];g.restoreSave(raw);
 const ctx=context(),calls=recorder(g,ctx),before=saved(g),rng=g.random.state,A=globalThis.DeadwallEssentialArt;
 A.local(ctx,{});A.local(ctx,{essentials:{snapshot:()=>null}});assert.equal(calls.length,0,'An absent services controller keeps the original silent fallback before a player exists.');
 const entries=A.depthEntries(g,'local',null,{left:100,top:100,right:260,bottom:260});assert.equal(entries.length,5);for(const e of entries)e.draw(ctx);
 assert.equal(calls.filter(q=>q.key==='worldPropsKits153').length,4);assert.equal(calls.filter(q=>q.key==='worldPropsLights153').length,1);
 assert.equal(A.depthEntries(g,'local',null,{left:1000,top:1000,right:1100,bottom:1100}).length,0);
 assert.deepEqual(saved(g),before);assert.equal(g.random.state,rng);
 const carried=clone(g.serialize());carried.essentials.jobs[selected[1].id]={stage:'player'};g.restoreSave(carried);const carriedBefore=saved(g),n=calls.length;A.carried(ctx,g,200,220,32);assert.equal(calls.length,n+1);assert.equal(calls.at(-1).key,'worldPropsKits153');assert.deepEqual(saved(g),carriedBefore);
 const t=targets.find(t=>t.family==='brace'&&t.id!==selected[2].id),v={...g.frontier.position(),x:t.x,y:t.y,z:0,inside:t.poi,seen:[t.poi]};
 assert.ok(A.depthEntries(g,'region',v).some(e=>e.id==='essential:'+t.id));assert.equal(A.depthEntries(g,'region',{...v,z:1}).some(e=>e.id==='essential:'+t.id),false);assert.equal(A.depthEntries(g,'region',{...v,inside:null}).some(e=>e.id==='essential:'+t.id),false);
 delete g.art.images.worldPropsKits153;const nFallback=calls.length;A.symbol(ctx,200,220,'aid',30,g,'fallback');assert.equal(calls.length,nFallback,'Procedural package remains when its atlas is absent.');
});

test('153 owners: eight placed lights and solar fixtures preserve OFF/ON, motion settings, visibility and source geometry',async()=>{
 const g=await fresh(),raw=clone(g.serialize());unlock(raw,g,'light');raw.nightGear={version:1,serial:9,devices:Object.keys(C.NightGearRules.types).map((kind,i)=>({id:i+1,kind,location:'placed',domain:'local',x:120+i*14,y:160,z:0,inside:null,angle:0,left:C.NightGearRules.types[kind].duration,on:false,used:false}))};g.restoreSave(raw);
 const ctx=context(),calls=recorder(g,ctx),view={left:80,top:120,right:300,bottom:220},before=saved(g),rng=g.random.state,lights=clone(g.nightGear.lights('local'));
 const entries=g.nightGear.depthEntries('local',null,view);assert.equal(entries.filter(e=>/^night:\d+$/.test(e.id)).length,8);for(const e of entries)e.draw(ctx);
 assert.equal(calls.filter(q=>q.key==='worldPropsLights153').length,8);assert.deepEqual(g.nightGear.lights('local'),lights);assert.deepEqual(saved(g),before);assert.equal(g.random.state,rng);
 assert.equal(g.nightGear.depthEntries('local',null,{left:1000,top:1000,right:1100,bottom:1100}).filter(e=>/^night:\d+$/.test(e.id)).length,0);
 const N=require('../src/night-gear.js');for(const kind of P.LIGHTS){const a=context(),b=context();N.glyph(a,200,200,kind,false,60,0,g,'state:'+kind);N.glyph(b,200,200,kind,true,60,0,g,'state:'+kind);assert.notDeepEqual(a.canvas.toBuffer('image/png'),b.canvas.toBuffer('image/png'),kind+' gains only its active marker/flame.');}
 g.settings.reducedMotion=true;const a=context(),b=context();N.glyph(a,200,200,'torch',true,60,.2,g,'stable');N.glyph(b,200,200,'torch',true,60,18,g,'stable');assert.deepEqual(a.canvas.toBuffer('image/png'),b.canvas.toBuffer('image/png'));
 const on=clone(g.serialize());for(const d of on.nightGear.devices){d.on=true;d.used=true;}g.restoreSave(on);const active=saved(g),sources=clone(g.nightGear.lights('local'));for(const e of g.nightGear.depthEntries('local',null,view))e.draw(ctx);assert.deepEqual(saved(g),active);assert.deepEqual(g.nightGear.lights('local'),sources);
});

test('153 owners: paid barricades texture the real aperture face and retain screen-north height, damage overlay and collision',async()=>{
 const g=await fresh(),B=require('../src/barricades134.js');g.paused=false;g.activeOverlay=null;g.units=[];g.zombies=[];for(const n of g.world.nodes)n.depleted=true;g.player.carry={wood:20,scrap:20,stone:0,food:0,fuel:0,ammo:0,medicine:0};
 const targets=B.localTargets(g.exploration125.plan).slice(0,3),types=['planks','sheet','braced'];
 for(let i=0;i<3;i++){const t=targets[i];g.player.x=t.x-Math.sin(t.angle)*32;g.player.y=t.y+Math.cos(t.angle)*32;const q=g.barricades134.begin('build',t.id,types[i]);assert.equal(q.ok,true,q.reason);for(let n=0;n<80&&g.barricades134.busy();n++)g.barricades134.step(.25);assert.ok(g.barricades134.snapshot().records.some(r=>r.target===t.id&&r.type===types[i]));g.barricades134.damage(t.id,17);}
 const ctx=context(),calls=recorder(g,ctx),fills=[],fill=ctx.fillRect.bind(ctx);ctx.fillRect=(...rect)=>{fills.push({color:ctx.fillStyle,rect});return fill(...rect);};
 const before=saved(g),rng=g.random.state,collision=targets.map(t=>g.barricades134.collision('local',t.x,t.y,10));
 const matrix=ctx.getTransform().toJSON(),entries=g.barricades134.depthEntries('local',null,{left:0,top:0,right:4096,bottom:4096});assert.equal(entries.length,3);for(const e of entries){e.draw(ctx);assert.deepEqual(ctx.getTransform().toJSON(),matrix);}
 assert.equal(calls.length,3);for(let i=0;i<calls.length;i++){const q=calls[i],t=targets[i];assert.equal(q.key,'worldPropsKits153');assert.equal(q.transform.c,0);assert.equal(q.transform.d,1,'Height remains toward screen north for every rotated ground edge.');assert.deepEqual(q.d.slice(0,2),[0,0]);assert.equal(q.d[3],16);assert.ok(Math.abs(q.d[2]-(Math.abs(Math.cos(t.angle))*t.width+Math.abs(Math.sin(t.angle))*C.BarricadeRules134.thickness*32))<1e-8,'Material spans the aperture face instead of becoming a small stamp.');}
 assert.equal(fills.filter(f=>f.color==='#c49d56').length,3,'The original integrity overlays remain visible.');assert.deepEqual(targets.map(t=>g.barricades134.collision('local',t.x,t.y,10)),collision);assert.ok(collision.every(Boolean));assert.deepEqual(saved(g),before);assert.equal(g.random.state,rng);
 delete g.art.images.worldPropsKits153;const count=calls.length;for(const e of entries)e.draw(ctx);assert.equal(calls.length,count);assert.equal(fills.filter(f=>f.color==='#c49d56').length,6,'The original geometry and integrity survive the fallback.');assert.deepEqual(saved(g),before);
});
