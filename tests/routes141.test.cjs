'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const G=require('../src/frontier-geometry.js'),R=require('../src/frontier-routing.js'),legacy=require('./fixtures/geometry140-preserved.json');
const sum=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const place=(d,generation=7,x=1234)=>({id:'fixture:'+d.id,type:d.id,w:d.w,h:d.h,x,y:5678,a:.39,levels:d.levels,generation});
function variantPlace(d,variant){for(let x=1200;x<1300;x++){const p=place(d,7,x);if(G.layoutVariant(p)===variant)return p;}throw Error('Variante absente : '+d.id);}
function reachablePlan(p,z){
 const q=G.plan(p,z),cell=.25,r=.32,nx=Math.ceil(p.w/cell),ny=Math.ceil(p.h/cell),seen=new Uint8Array(nx*ny),queue=[];
 const point=id=>({x:(id%nx+.5)*cell,y:(Math.floor(id/nx)+.5)*cell});
 const free=id=>{const {x,y}=point(id);return x>r&&y>r&&x<p.w-r&&y<p.h-r&&!q.walls.some(b=>G.circleRect(x,y,r,b))&&!q.objects.some(b=>G.circleRect(x,y,r,b));};
 for(let y=0;y<5;y++)for(let x=0;x<nx;x++){const id=y*nx+x,a=point(id);if(Math.hypot(a.x-p.w/2,a.y-.6)<.5&&free(id)){seen[id]=1;queue.push(id);}}
 for(let k=0;k<queue.length;k++){const id=queue[k],x=id%nx,y=Math.floor(id/nx);for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,n=yy*nx+xx;if(xx<0||yy<0||xx>=nx||yy>=ny||seen[n]||!free(n))continue;seen[n]=1;queue.push(n);}}
 const reachable=(b,reach)=>queue.some(id=>{const a=point(id),closest={x:Math.max(b.x,Math.min(b.x+b.w,a.x)),y:Math.max(b.y,Math.min(b.y+b.h,a.y))};return Math.hypot(a.x-closest.x,a.y-closest.y)<=reach&&!q.walls.some(w=>G.segmentRect(a,closest,w));});
 assert.ok(queue.length,p.type+' '+z+' entrée');
 for(const o of q.objects)assert.ok(reachable(o,1.6),p.type+' '+z+' meuble '+o.id);
 for(const s of q.stairs)assert.ok(reachable(s,1),p.type+' '+z+' escalier');
 return{levels:1,objects:q.objects.length,stairs:q.stairs.length};
}
test('141 géométrie : empreintes 1.40 des 62 programmes G1–G6 conservées',()=>{
 assert.equal(G.PRESETS.length,legacy.programmes);
 for(const generation of[1,2,3,4,5,6]){const plans=[];for(const d of G.PRESETS)for(const z of d.levels){const p=place(d,generation);plans.push([d.id,z,G.plan(p,z),G.parking(p),G.outdoor(p)]);}assert.equal(plans.length,legacy.generations[generation].levels);assert.equal(sum(plans),legacy.generations[generation].sha256,'G'+generation);}
});
test('141 intérieurs : chaque programme offre les deux dispositions G7 par parcelle',()=>{
 for(const d of G.PRESETS){const original=variantPlace(d,0),mirrored=variantPlace(d,1);assert.equal(G.plan(original).layoutVariant141,'original');assert.equal(G.plan(mirrored).layoutVariant141,'mirrored');for(const z of d.levels){assert.equal(G.plan(mirrored,z).layoutVariant141,'mirrored');assert.deepEqual(G.plan(mirrored,z),G.plan({...mirrored},z));}}
});
test('141 intérieurs : meubles, ressources, budgets, issues et niveaux gardent leur identité',()=>{
 for(const d of G.PRESETS)for(const z of d.levels){const p=variantPlace(d,1),q=G.plan(p,z),before=G.plan({...p,generation:6},z),inventory=plan=>plan.objects.map(o=>[o.id,o.kind,o.resource,o.amount,o.room]);assert.deepEqual(inventory(q),inventory(before),d.id+' '+z);assert.deepEqual(q.stairs.map(s=>[s.id,s.levels]),before.stairs.map(s=>[s.id,s.levels]));assert.deepEqual(q.entry,before.entry);assert.deepEqual(q.exit,before.exit);assert.equal(q.walls.length,before.walls.length);assert.equal(q.rooms.length,before.rooms.length);assert.deepEqual(G.parking(p),G.parking({...p,generation:6}));assert.deepEqual(G.outdoor(p),G.outdoor({...p,generation:6}));}
});
test('141 intérieurs : entrée–meubles–escalier accessibles dans 182 plans G7 au rayon réel',()=>{
 let levels=0,objects=0,stairs=0;for(const d of G.PRESETS)for(const variant of[0,1])for(const z of d.levels){const n=reachablePlan(variantPlace(d,variant),z);levels+=n.levels;objects+=n.objects;stairs+=n.stairs;}assert.equal(levels,182);assert.ok(objects>1000);assert.ok(stairs>40);
});
test('141 GPS : modifier les points d’un itinéraire ne corrompt pas son graphe ni les suivants',()=>{
 const roads=[{id:'a',a:{x:0,y:0},b:{x:10,y:0}},{id:'b',a:{x:10,y:0},b:{x:10,y:10}}],w={roads,nearestRoad(p){return roads.map(road=>({...G.nearest(p,road.a,road.b),road})).sort((a,b)=>a.d-b.d)[0];}},poi={drive:{a:{x:10,y:9},b:{x:11,y:9}}},from={x:1,y:0};
 const expected=R.route(w,from,poi),original=JSON.parse(JSON.stringify(expected)),graph=JSON.stringify(R.graph(w));
 assert.equal(expected.metres,19);for(const p of expected.path){assert.equal(R.graph(w).nodes.includes(p),false);p.x+=900;p.y-=400;}
 assert.equal(JSON.stringify(R.graph(w)),graph);assert.deepEqual(R.route(w,from,poi),original);assert.deepEqual(from,{x:1,y:0});assert.deepEqual(poi.drive.b,{x:11,y:9});
});
test('141 GPS G7 : les routes contournent D-17 et le départ local devient un portail explicite',()=>{
 const home={x:4064,y:4064,size:128,minX:4000,minY:4000,maxX:4128,maxY:4128},segments=[[3900,4064,4250,4064],[4064,3900,4064,4250],[3900,3900,4250,3900],[4250,3900,4250,4250],[4250,4250,3900,4250],[3900,4250,3900,3900]],roads=segments.map(([x,y,xx,yy],i)=>({id:'r'+i,a:{x,y},b:{x:xx,y:yy},width:7})),w={generation:7,home,roads,nearestRoad(p){return roads.map(road=>({...G.nearest(p,road.a,road.b),road})).sort((a,b)=>a.d-b.d)[0];}},poi={drive:{a:{x:3910,y:4064},b:{x:3910,y:4070}}};
 const before=JSON.stringify(roads),route=R.route(w,{x:4200,y:4064},poi);assert.ok(route.metres>700);for(let i=1;i<route.path.length;i++)assert.equal(G.segmentRect(route.path[i-1],route.path[i],{x:4000.00001,y:4000.00001,w:127.99998,h:127.99998}),false);
 assert.deepEqual(R.route(R.outsideWorld(w),{x:4200,y:4064},poi),route);const local=R.route(w,home,poi);assert.equal(local.localSegmentRequired,true);assert.deepEqual(local.homeOrigin,home);assert.ok(local.path[0].x<=home.minX||local.path[0].x>=home.maxX||local.path[0].y<=home.minY||local.path[0].y>=home.maxY);assert.equal(JSON.stringify(roads),before);assert.equal(R.route(w,{x:4200,y:4064},{drive:{a:home,b:home}}),null);
});
test('141 parcours G7 : budget payé par domaine, local réellement contrôlé et diagnostic non muté',()=>{
 const {g}=require('./helpers/expansions131.cjs').boot131({generation:7}),Return=require('../src/return-routes.js');
 assert.equal(g.frontier.position().generation,7);const garage=new(g.core().constructor)(g.nextId++,'expeditionGarage',77,65,0,1);g.world.add(garage);g.refreshMetrics(true);g.fieldcraft.setup();require('./helpers/physical-fixtures.cjs').standAt(g,g.player,g.core());g.resources.wood=g.resources.scrap=300;assert.ok(g.expeditions.buildCar().ok);const w=g.frontier.world(),p=w.pois.find(p=>p.type==='grocer');g.frontier.revealSites([p.id]);assert.ok(g.frontier.pin(p.id));
 const before=g.serialize();delete before.timestamp;const selected=g.returnRoutes.snapshot(),model=g.fieldSupplies.routePlan();assert.ok(model);assert.equal(model.localSegmentVerified,true);assert.ok(model.regionalMetres>0&&model.localMetres>0);assert.ok(Math.abs(model.fuel-model.regionalMetres*.004-model.localMetres*.096)<1e-8);assert.ok(Math.abs(model.required-model.fuel*1.25-2)<1e-8);
 const search=Return.createSearch(g,'car');for(const route of[model.departureLocalPath,model.returnLocalPath])for(let i=1;i<route.length;i++)assert.ok(search.segment(route[i-1],route[i]));
 assert.deepEqual(g.returnRoutes.snapshot(),selected);const after=g.serialize();delete after.timestamp;assert.deepEqual(after,before);
 const Type=g.core().constructor;for(let x=56;x<=74;x++){g.world.add(new Type(g.nextId++,'woodWall',x,56,0,1));g.world.add(new Type(g.nextId++,'woodWall',x,74,0,1));}for(let y=57;y<74;y++){g.world.add(new Type(g.nextId++,'woodWall',56,y,0,1));g.world.add(new Type(g.nextId++,'woodWall',74,y,0,1));}g.fieldcraft.setup();assert.equal(g.fieldSupplies.routePlan(),null,'Enceinte fermée : aucun budget prétendument praticable.');
});
test('141 logistique G7 : à pied en région, le véhicule resté au dépôt ne finance pas le retour',()=>{
 const {g}=require('./helpers/expansions131.cjs').boot131({generation:7}),garage=new(g.core().constructor)(g.nextId++,'expeditionGarage',77,65,0,1);g.world.add(garage);g.refreshMetrics(true);g.fieldcraft.setup();require('./helpers/physical-fixtures.cjs').standAt(g,g.player,g.core());g.resources.wood=g.resources.scrap=300;assert.ok(g.expeditions.buildCar().ok);const v=g.expeditions.car();v.fuel=17;v.cargo.fuel=5;
 const w=g.frontier.world(),raw=g.serialize();Object.assign(raw.frontier,{active:true,x:w.home.maxX+4,y:w.home.y,z:0,inside:null,car:null,anchor:{x:g.player.x,y:g.player.y}});g.restoreSave(raw);const before=g.serialize(),budget=g.fieldSupplies.routePlan();assert.ok(budget);assert.equal(budget.vehicle,false);assert.equal(budget.available,0);assert.equal(budget.fuel,0);assert.equal(budget.required,0);assert.equal(g.expeditions.car().fuel,before.expeditions.vehicle.fuel);assert.equal(g.expeditions.car().cargo.fuel,before.expeditions.vehicle.cargo.fuel);
});
test('141 parcours G7 : escalier et vraie fouille à l’étage miroir, positions et prélèvements conservés',()=>{
 const {g}=require('./helpers/expansions131.cjs').boot131({generation:7}),w=g.frontier.world(),p=w.pois.find(p=>G.layoutVariant(p)===1&&p.levels.includes(1)),stair=w.plan(p,0).stairs[0],pos=G.global(p,stair.x+stair.w/2,stair.y+stair.h/2),raw=g.serialize();
 Object.assign(raw.frontier,{active:true,x:pos.x,y:pos.y,z:0,inside:p.id,anchor:{x:g.player.x,y:g.player.y},seen:[p.id]});g.restoreSave(raw);assert.ok(g.frontier.stairs(1));assert.equal(g.frontier.position().z,1);
 const Survey=require('../src/frontier-survey.js'),plan=w.plan(p,1);let candidate=null;
 for(const o of plan.objects){const centre={x:o.x+o.w/2,y:o.y+o.h/2};for(let i=0;i<24;i++){const a=i*Math.PI/12,point=G.global(p,centre.x+Math.cos(a)*(Math.hypot(o.w,o.h)/2+.5),centre.y+Math.sin(a)*(Math.hypot(o.w,o.h)/2+.5)),pose={x:point.x,y:point.y,z:1,inside:p.id};if(!w.blocked(pose.x,pose.y,.32,1,p.id)&&Survey.targets(w,pose,{},1.6).some(b=>b.id===o.id)){candidate={o,pose};break;}}if(candidate)break;}
 assert.ok(candidate);const staged=g.serialize();Object.assign(staged.frontier,candidate.pose);g.restoreSave(staged);g.input.keys.add('KeyE');for(let i=0;i<12;i++)g.updatePlayer(.04);g.input.keys.clear();const saved=g.serialize(),taken=saved.frontier.taken;assert.ok(Object.values(taken).some(n=>n>0));const expected=JSON.stringify(g.frontier.world().plan(p,1));g.restoreSave(saved);assert.deepEqual(g.frontier.snapshot().taken,taken);assert.equal(g.frontier.position().z,1);assert.equal(g.frontier.position().inside,p.id);assert.equal(JSON.stringify(g.frontier.world().plan(p,1)),expected);
});
