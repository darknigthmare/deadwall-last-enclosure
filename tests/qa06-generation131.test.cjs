'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),W=require('../src/frontier-world.js'),G=require('../src/frontier-geometry.js'),Route=require('../src/frontier-routing.js'),Spawn=require('../src/world-spawns131.js');
const {boot131}=require('./helpers/expansions131.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const SEEDS=[0,1,42,17117,903145,4294967295],BIOMES=['forest','industrial','rural','suburban'];
const copy=o=>JSON.parse(JSON.stringify(o));
function sample(outer){return[...new Map([...outer.filter((_,i)=>i%41===0),...['x','y'].flatMap(k=>[outer.reduce((a,b)=>a[k]<b[k]?a:b),outer.reduce((a,b)=>a[k]>b[k]?a:b)])].map(p=>[p.id,p])).values()];}
function touches(p,a,b,pad){return G.segmentRect(G.local(p,a.x,a.y),G.local(p,b.x,b.y),{x:-pad,y:-pad,w:p.w+2*pad,h:p.h+2*pad});}
function visit(g,p,z=0,point){const raw=g.serialize(),q=point||G.global(p,p.w/2,z?1.2:-4);Object.assign(raw.frontier,{active:true,anchor:{x:g.player.x,y:g.player.y},...q,z,inside:z?p.id:null,car:null});g.restoreSave(raw);g.input.keys.clear();g.input.pressed.clear();g.paused=false;g.phaseTime=9999;g.player.invulnerable=1;}
function walk(g,target){const from=g.frontier.position(),vx=target.x-from.x,vy=target.y-from.y,length=Math.hypot(vx,vy);for(let i=0;i<1000;i++){const p=g.frontier.position();if(Math.hypot(target.x-p.x,target.y-p.y)<.2){g.input.keys.clear();return;}const progress=Math.max(0,Math.min(1,((p.x-from.x)*vx+(p.y-from.y)*vy)/length**2+.7/length)),dx=from.x+vx*progress-p.x,dy=from.y+vy*progress-p.y;g.input.keys.clear();if(Math.abs(dx)>.09)g.input.keys.add(dx>0?'KeyD':'KeyA');if(Math.abs(dy)>.09)g.input.keys.add(dy>0?'KeyS':'KeyW');g.updatePlayer(.04);}assert.fail('Accès infranchissable '+JSON.stringify({target,pose:g.frontier.position()}));}
for(const seed of SEEDS)test('QA06 G5 : géométrie, réseau, accès réels et noyau historique — graine '+seed,t=>{
 const old=W.create(seed,4),w=W.create(seed,5),outer=w.pois.filter(p=>p.generation===5),roads=w.roads.slice(old.roads.length);
 assert.equal(w.size,24576);assert.deepEqual(w.bounds,{x:0,y:0,w:24576,h:24576});assert.equal(w.sectors.length,512);
 assert.deepEqual(w.pois.slice(0,old.pois.length),old.pois);assert.deepEqual(w.roads.slice(0,old.roads.length),old.roads);
 let plans=0;for(const p of old.pois)for(const z of p.levels){assert.deepEqual(w.plan(p,z),old.plan(p,z));plans++;}
 assert.equal(new Set(w.roads.map(r=>r.id)).size,w.roads.length,'IDs distincts après suppression des rues G4');
 assert.equal(new Set(w.pois.map(p=>p.id)).size,w.pois.length);assert.deepEqual([...new Set(w.sectors.map(s=>s.biome))].sort(),BIOMES);
 const graph=Route.graph(w),start=graph.tracks[w.roads.indexOf(w.nearestRoad({x:4160,y:4096}).road)][0].id,queue=[start],seen=new Set(queue);
 for(let i=0;i<queue.length;i++)for(const[n]of graph.edges[queue[i]])if(!seen.has(n)){seen.add(n);queue.push(n);}
 for(const r of roads){assert.ok(Math.hypot(r.a.x-r.b.x,r.a.y-r.b.y)>1);assert.ok(graph.tracks[w.roads.indexOf(r)].some(n=>seen.has(n.id)),r.id+' isolée');}
 // Check the full pavement width, every neighbour, and the historic buildings at both seams.
 for(const p of w.pois){for(const r of p.generation===5?w.roads:roads)assert.equal(touches(p,r.a,r.b,r.width/2),false,p.id+' chaussée '+r.id);}
 let preservedNatural=0,clearedNatural=0;
 for(const[cx,cy]of[[0,0],[15,15],[31,15],[31,16],[15,31],[16,31],[31,31]]){const before=old.chunk(cx,cy),after=w.chunk(cx,cy),cleared=[...(before.cleared||[])];for(const[kind,margin]of[['trees',5],['rocks',6]]){const kept=before[kind].filter(item=>{const visual=item.kind==='tree'?item.canopy+.8:item.r+.6,remove=roads.some(r=>G.nearest(item,r.a,r.b).d<r.width/2+Math.max(margin,visual))||w.pois.some(p=>G.nearest(item,p.drive.a,p.drive.b).d<p.drive.width/2+visual);if(remove)cleared.push(item);return!remove;});assert.deepEqual(after[kind],kept,'RNG/IDs/quantités historiques '+seed+' '+cx+','+cy+' '+kind);preservedNatural+=kept.length;}assert.deepEqual((after.cleared||[]).slice().sort((a,b)=>a.id.localeCompare(b.id)),cleared.sort((a,b)=>a.id.localeCompare(b.id)));clearedNatural+=cleared.length;}
 const occupation={empty:0,infected:0,allied:0,hostile:0};
 for(const p of outer){
  assert.ok(p.x>8192||p.y>8192);assert.ok(p.reserve.l>=40&&p.reserve.t>=40&&p.reserve.r<=w.size-40&&p.reserve.b<=w.size-40);
  const near=w.nearestRoad(p.drive.a);assert.ok(near.d<1e-6,p.id+' accès sans route');assert.ok(graph.tracks[w.roads.indexOf(near.road)].some(n=>seen.has(n.id)));
  assert.ok(w.roads.some(r=>r.id===p.road&&G.nearest(p.drive.a,r.a,r.b).d<1e-6),p.id+' référence une voie réelle');
  for(const q of w.pois)if(p!==q){assert.equal(G.overlap(p.reserve,q.reserve),false,p.id+' voisin '+q.id);assert.equal(touches(q,p.drive.a,p.drive.b,.32),false,p.id+' accès coupe '+q.id);}
  const rolled=Spawn.roll({seed,id:p.id,biome:p.biome,distance:Math.hypot(p.x-4096,p.y-4096)});assert.equal(p.occupation,rolled.kind);assert.equal(p.distanceBand,rolled.band);assert.equal(w.threatCount(p)>0,rolled.kind==='infected');occupation[p.occupation]++;
 }
 const selected=sample(outer);let carProbes=0;
 for(const p of selected){const a=p.drive.a,b=G.global(p,p.w/2,-3.5),entry=G.global(p,p.w/2,1.4),length=Math.hypot(b.x-a.x,b.y-a.y),n=Math.ceil(length),angle=Math.atan2(b.y-a.y,b.x-a.x);
  assert.ok(w.line(a,entry,0,null,null,.32),p.id+' passage piéton continu');assert.ok(w.line(entry,a,0,null,null,.32),p.id+' retour piéton');
  for(let i=0;i<=n;i++){const x=a.x+(b.x-a.x)*i/n,y=a.y+(b.y-a.y)*i/n;assert.ok(w.vehicleClear(x,y,angle),p.id+' véhicule '+i+'/'+n);carProbes++;}
 }
 for(const[a,b]of[[{x:8160,y:4170},roads.at(-2).b],[{x:4096,y:8160},roads.at(-1).b]]){assert.ok(w.line(a,b,0,null,null,.32),'liaison historique à pied');const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/2),angle=Math.atan2(b.y-a.y,b.x-a.x);for(let i=0;i<=n;i++){assert.ok(w.vehicleClear(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,angle),'liaison historique véhicule');carProbes++;}}
 t.diagnostic(JSON.stringify({seed,historic:old.pois.length,outer:outer.length,roads:w.roads.length,historicPlans:plans,physicalAccesses:selected.length,carProbes,preservedNatural,clearedNatural,occupation}));
});
test('QA06 G5 : pas de doubles chaussées ni de croisement aveugle dans le réseau ajouté',()=>{
 const w=W.create(17117,5),roads=w.roads.filter(r=>r.id.startsWith('r131_'));
 for(let i=0;i<roads.length;i++)for(let j=i+1;j<roads.length;j++){
  const a=roads[i],b=roads[j],ax=a.b.x-a.a.x,ay=a.b.y-a.a.y,bx=b.b.x-b.a.x,by=b.b.y-b.a.y,den=ax*by-ay*bx,dx=b.a.x-a.a.x,dy=b.a.y-a.a.y;
  if(Math.abs(den)>1e-8){const t=(dx*by-dy*bx)/den,u=(dx*ay-dy*ax)/den;if(t>1e-6&&t<1-1e-6&&u>1e-6&&u<1-1e-6)assert.fail('Croisement hors carrefour '+a.id+' '+b.id);}
  else if(G.nearest(a.a,b.a,b.b).d<.01&&G.nearest(a.b,b.a,b.b).d<.01)assert.fail('Chaussée dupliquée '+a.id+' '+b.id);
 }
});
test('QA06 G5 : bornes, coins, étages et caches refusent les coordonnées hors domaine',()=>{
 for(const generation of[1,2,3,4,5])assert.equal(W.sizeForGeneration(generation),generation===5?24576:8192);
 for(const seed of[-1,1.5,4294967296,NaN])assert.throws(()=>W.create(seed,5));for(const generation of[0,8,NaN])assert.throws(()=>W.create(17117,generation));
 const w=W.create(17117,5);for(const[x,y]of[[-1,100],[100,-1],[24576,100],[100,24576],[NaN,1],[Infinity,1]])assert.equal(w.blocked(x,y),true);
 for(const[cx,cy]of[[-1,0],[96,0],[0,96],[.5,2]])assert.deepEqual(w.chunk(cx,cy),{cx,cy,trees:[],rocks:[]});
 for(const[cx,cy]of[[0,95],[95,0],[95,95]]){const first=copy(w.chunk(cx,cy));assert.ok(first.trees.length);for(let n=0;n<40;n++)w.chunk(n,80);assert.deepEqual(w.chunk(cx,cy),first);}
 const p=w.pois.find(p=>p.generation===5&&p.levels.includes(1)),q=G.global(p,p.w/2,1.2);assert.equal(w.blocked(q.x,q.y,.32,1,p.id),false);assert.equal(w.blocked(q.x,q.y,.32,1,null),true);assert.equal(w.blocked(p.x+p.w*2,p.y,.32,1,p.id),true);assert.ok(w.cacheSize()<=25);assert.ok(w.planCacheSize()<=48);
});
test('QA06 G5 : les 24 profils sont déterministes, 4 biomes générés, aucun humain hostile activé',()=>{
 assert.equal(Object.keys(Spawn.RULES.weights).length,24);const observed={};const random=Math.random;Math.random=()=>{throw Error('Simulation RNG utilisée');};
 try{for(const biome of Object.keys(Spawn.RULES.weights)){observed[biome]={empty:0,infected:0,allied:0,hostile:0};const p=Spawn.profile(biome,8000);for(let i=0;i<4096;i++){const options={seed:4294967295,id:'QA06-'+i,biome,distance:8000},r=Spawn.roll(options);assert.deepEqual(Spawn.roll(options),r);observed[biome][r.kind]++;}assert.equal(observed[biome].hostile,0);for(const kind of Spawn.KINDS)assert.ok(Math.abs(observed[biome][kind]/4096*100-p.weights[kind])<3,biome+' '+kind);}}
 finally{Math.random=random;}
});
test('QA06 boot131 : génération G6 explicitement choisie, ancre historique et reprise conservées',()=>{
 const {g}=boot131({generation:6}),home=globalThis.DeadwallGeography135.home(17117,6);
 assert.equal(g.frontier.position().generation,6);assert.deepEqual(g.frontier.world().home,home);
 assert.equal(g.frontier.position().x,home.maxX+2);assert.equal(g.frontier.position().y,home.y);
 const raw=g.serialize(),stock=copy(g.resources);assert.equal(raw.frontier.generation,6);
 assert.equal(g.restoreSave(raw),true);assert.equal(g.frontier.world().generation,6);assert.deepEqual(g.resources,stock);
});
test('QA06 boot131 : marche physique aller-retour dans huit lieux G5, quatre biomes et bord lointain',()=>{
 const {g}=boot131(),w=g.frontier.world(),places=[];assert.equal(g.frontier.position().generation,5);
 for(const biome of BIOMES)places.push(...w.pois.filter(p=>p.generation===5&&p.biome===biome&&p.occupation==='empty').slice(-2));
 for(const p of places){visit(g,p,0,p.drive.a);g.update(.001);const before=g.frontier.snapshot().distance;walk(g,G.global(p,p.w/2,1.4));assert.equal(g.frontier.position().inside,p.id);walk(g,p.drive.a);assert.equal(g.frontier.position().inside,null);assert.ok(g.frontier.snapshot().distance-before>20,p.id+' distance réelle');}
});
test('QA06 boot131 : résidents G5 physiques, étages, visibilité, mort et reprise après éviction',()=>{
 const {g}=boot131(),w=g.frontier.world(),places=[];for(const biome of BIOMES){const options=w.pois.filter(p=>p.generation===5&&p.biome===biome&&p.occupation==='infected');places.push(options.find(p=>p.levels.length===1),options.find(p=>p.levels.length>1)||options[1]);}
 let visible=0,actors=0,killed;
 for(const p of places){const ids=new Set();for(const z of p.levels){visit(g,p,z,z?undefined:G.global(p,p.w/2,p.h+4));g.update(.001);const enemies=g.frontier.contacts().filter(e=>e.poi===p.id);for(const e of enemies){ids.add(e.id);actors++;assert.equal(e.z,z);assert.equal(w.blocked(e.x,e.y,C.FrontierTacticsRules.enemyRadius,z,z?p.id:null),false);if(g.frontier.visibleEnemy(e))visible++;if(!killed&&g.frontier.visibleEnemy(e)){assert.ok(g.frontier.companionShot({x:e.x,y:e.y,z},.1,65));killed={id:e.id,poi:p,z};}}}assert.equal(ids.size,w.threatCount(p));}
 assert.ok(actors>8&&visible>=4);assert.ok(killed);for(let n=0;n<40;n++)w.chunk(n,90);const saved=g.serialize();g.restoreSave(saved);visit(g,killed.poi,killed.z);g.update(.001);assert.equal(g.frontier.enemyHealth(killed.id),0);assert.equal(g.frontier.contacts().some(e=>e.id===killed.id),false);
 const allied=w.pois.find(p=>p.occupation==='allied');visit(g,allied);g.update(.001);assert.equal(g.frontier.contacts().filter(e=>e.poi===allied.id).length,0);
});

test('QA06 boot131 : G4 → G5 conserve les prélèvements naturels, y compris un arbre retiré du raccord',()=>{
 const {g}=boot131(),raw=g.serialize();raw.frontier.generation=4;g.restoreSave(raw);const before=g.frontier.world(),next=W.create(17117,5),oldChunk=before.chunk(31,16),newChunk=next.chunk(31,16),removed=newChunk.cleared?.[0],kept=newChunk.trees.find(t=>t.amount>8);
 assert.ok(removed&&kept);assert.ok(oldChunk.trees.some(t=>t.id===removed.id));const saved=g.serialize();saved.frontier.taken[removed.id]=removed.amount;saved.frontier.taken[kept.id]=8;g.restoreSave(saved);standAt(g,g.player,g.core());
 const bag=copy(g.player.carry),stocks=copy(g.resources),expanded=g.worldOps131.expand();assert.equal(expanded.ok,true,expanded.reason);assert.equal(g.frontier.position().generation,5);assert.deepEqual(g.frontier.snapshot().taken,saved.frontier.taken);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,stocks);
 const w=g.frontier.world();for(let n=0;n<40;n++)w.chunk(n,90);assert.deepEqual(w.chunk(31,16).trees.find(t=>t.id===kept.id),kept);assert.equal(w.chunk(31,16).trees.some(t=>t.id===removed.id),false);assert.equal(w.containers(removed.x,removed.y,2).some(t=>t.id===removed.id),false);
 assert.ok(g.save(false));assert.ok(g.load());assert.deepEqual(g.frontier.snapshot().taken,saved.frontier.taken);const invalid=g.serialize();invalid.frontier.taken[removed.id]=removed.amount+1;assert.throws(()=>g.restoreSave(invalid),/Prélèvement/);assert.deepEqual(g.frontier.snapshot().taken,saved.frontier.taken);
});
test('QA06 G5 : chaque type réellement généré garde butin, escalier et sortie atteignables',t=>{
 const w=W.create(17117,5),types=[...new Map(w.pois.filter(p=>p.generation===5).map(p=>[p.type,p])).values()];let floors=0,containers=0;
 for(const p of types)for(const z of p.levels){floors++;const plan=w.plan(p,z),step=.5,nx=Math.ceil(p.w/step),ny=Math.ceil(p.h/step),free=new Uint8Array(nx*ny),seen=new Uint8Array(nx*ny),queue=[];
  for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++){const x=ix*step+.25,y=iy*step+.25;free[iy*nx+ix]=x>.32&&y>.32&&x<p.w-.32&&y<p.h-.32&&![...plan.walls,...plan.objects].some(o=>G.circleRect(x,y,.32,o))?1:0;}
  const start=2*nx+Math.floor(p.w/2/step);assert.ok(free[start],p.type+' entrée libre');queue.push(start);seen[start]=1;
  for(let k=0;k<queue.length;k++){const id=queue[k],x=id%nx,y=Math.floor(id/nx);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,next=yy*nx+xx;if(xx>=0&&yy>=0&&xx<nx&&yy<ny&&free[next]&&!seen[next]){seen[next]=1;queue.push(next);}}}
  const points=queue.map(id=>({x:id%nx*step+.25,y:Math.floor(id/nx)*step+.25})),reachable=(b,reach)=>points.some(a=>{const dx=a.x-Math.max(b.x,Math.min(b.x+b.w,a.x)),dy=a.y-Math.max(b.y,Math.min(b.y+b.h,a.y)),target={x:b.x+b.w/2,y:b.y+b.h/2};return Math.hypot(dx,dy)<=reach&&!plan.walls.some(wall=>G.segmentRect(a,target,wall));});
  for(const object of plan.objects){containers++;assert.ok(reachable(object,1.6),p.type+' étage '+z+' butin '+object.id);}for(const stairs of plan.stairs)assert.ok(reachable(stairs,1),p.type+' étage '+z+' escalier');assert.ok(reachable({x:p.w/2-.5,y:p.h-1.4,w:1,h:.5},1),p.type+' étage '+z+' retour');
 }
 t.diagnostic(JSON.stringify({types:types.length,floors,containers}));
});
