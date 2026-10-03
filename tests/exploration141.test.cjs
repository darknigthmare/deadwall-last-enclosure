'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
function fresh(seed='17117'){const {g}=bootDocument134();g.startNew('standard',seed);g.campaignIntro132.skip();return g;}
function stable(g){const s=g.serialize();delete s.timestamp;return s;}
function know(g,sites){const s=g.serialize();s.frontier.seen=sites.map(p=>p.id);g.restoreSave(s);}
function richBiome(g){const groups=new Map();for(const p of g.frontier.world().pois){if(!groups.has(p.biome))groups.set(p.biome,[]);groups.get(p.biome).push(p);}const [id,sites]=[...groups].sort((a,b)=>b[1].length-a[1].length)[0];assert.ok(id&&sites.length>6,'A real biome contains several reachable destinations.');return{id,sites:sites.slice(0,9)};}
function outsideOnFoot(g){const w=g.frontier.world(),P=globalThis.DeadwallAtlasProjection,gate=P.gatesFor(g).find(p=>p.id==='east');const road=w.roads.find(r=>Math.hypot(r.a.x-gate.x,r.a.y-gate.y)>300&&Math.hypot(r.a.x-gate.x,r.a.y-gate.y)<1500);assert.ok(road);const s=g.serialize();Object.assign(s.frontier,{active:true,x:(road.a.x+road.b.x)/2,y:(road.a.y+road.b.y)/2,z:0,inside:null,car:null,anchor:{x:s.player.x,y:s.player.y}});g.restoreSave(s);return{x:s.frontier.x,y:s.frontier.y};}

test('exploration 1.41 : l’interaction conserve l’essence de l’arbre et les noms des réserves finies',()=>{
 const Survey=require('../src/frontier-survey.js'),tree={id:'T0_0_0',kind:'tree',x:1,y:0,r:.25,label:'Chêne pédonculé',amount:20,resource:'wood'},crate={id:'P0000:out:0',kind:'crate',x:1,y:0,r:.3,label:'Réserve scellée de soins',amount:8,resource:'medicine'},old={id:'T0_0_1',kind:'tree',x:1,y:0,r:.2,amount:7,resource:'wood'};const world={containers:()=>[tree,crate,old],line:()=>true},state={x:0,y:0,z:0,inside:null},targets=Survey.targets(world,state,{[tree.id]:5});assert.equal(targets.find(p=>p.id===tree.id).label,tree.label);assert.equal(targets.find(p=>p.id===tree.id).left,15);assert.equal(targets.find(p=>p.id===crate.id).label,crate.label);assert.equal(targets.find(p=>p.id===old.id).label,'Arbre');assert.equal(tree.amount,20);
});

test('exploration 1.41 : choisir un biome ne révèle ni lieu inconnu, ni indice approximatif',()=>{
 const g=fresh(),{id,sites}=richBiome(g),C=globalThis.DeadwallCore;assert.deepEqual(g.fieldAtlas.biomeChoices(),[]);const before=stable(g);assert.equal(g.fieldAtlas.prepareBiome(id).ok,false);assert.deepEqual(stable(g),before);
 const s=g.serialize();s.fieldAtlas.reports=[{id:sites[0].id,town:C.FieldAtlas.district(sites[0],g.frontier.world()).id,at:0}];g.restoreSave(s);assert.deepEqual(g.fieldAtlas.biomeChoices(),[]);const report=g.fieldAtlas.mapView().reports[0];assert.equal(report.confirmed,false);assert.equal(report.biome,undefined);assert.equal(report.biomeName,undefined);
});
test('exploration 1.41 : préparation de six vraies étapes par biome, sans doublon ni ressource créée',()=>{
 const g=fresh(),{id,sites}=richBiome(g);know(g,sites);const before=stable(g),choices=g.fieldAtlas.biomeChoices();assert.equal(choices.find(d=>d.id===id).known,9);assert.deepEqual(stable(g),before,'Listing ecological destinations is read-only.');
 const result=g.fieldAtlas.prepareBiome(id);assert.equal(result.ok,true);assert.equal(result.added.length,6);const s=g.fieldAtlas.snapshot();assert.equal(s.tour.active,false);assert.equal(s.tour.stops.length,6);assert.equal(new Set(s.tour.stops).size,6);assert.ok(s.tour.stops.every(key=>sites.some(p=>p.id===key&&p.biome===id)));assert.deepEqual(g.resources,before.resources);assert.deepEqual(g.player.carry,before.player.carry);assert.deepEqual(g.frontier.snapshot().taken,before.frontier.taken);assert.deepEqual(g.frontier.snapshot().seen,before.frontier.seen);
 assert.equal(g.fieldAtlas.biomeChoices().find(d=>d.id===id).available,3);const full=stable(g);assert.equal(g.fieldAtlas.prepareBiome(id).ok,false);assert.deepEqual(stable(g),full);
 const plan=g.fieldAtlas.planning();assert.equal(plan.failed,false);assert.equal(plan.legs.length,6);for(const leg of plan.legs){const p=sites.find(p=>p.id===leg.target.id);assert.deepEqual(leg.path.at(-1),p.drive.b);assert.equal(leg.target.biome,id);assert.equal(typeof leg.target.biomeName,'string');}assert.ok(plan.back&&plan.loopMetres>=plan.metres);
});
test('exploration 1.41 : compléter un carnet préserve les étapes préparées et refuse une tournée active',()=>{
 const g=fresh(),{id,sites}=richBiome(g);know(g,sites);g.fieldAtlas.add(sites[1].id);g.fieldAtlas.add(sites[0].id);const first=g.fieldAtlas.snapshot().tour.stops;assert.equal(g.fieldAtlas.prepareBiome(id).ok,true);assert.deepEqual(g.fieldAtlas.snapshot().tour.stops.slice(0,2),first);assert.equal(g.fieldAtlas.snapshot().tour.stops.length,6);
 g.fieldAtlas.start();const active=stable(g);assert.equal(g.fieldAtlas.prepareBiome(id).ok,false);assert.deepEqual(stable(g),active);g.fieldAtlas.stop();g.fieldAtlas.remove(sites[0].id);g.paused=true;g.activeOverlay=g.ui.pauseMenu;const paused=stable(g);assert.equal(g.fieldAtlas.prepareBiome(id).ok,false);assert.deepEqual(stable(g),paused);
});
test('exploration 1.41 : l’ordre proposé choisit la distance routière et rejoint le vrai accès',()=>{
 const g=fresh(),{id,sites}=richBiome(g);know(g,sites);const w=g.frontier.world(),P=globalThis.DeadwallAtlasProjection,Router=globalThis.DeadwallFrontierRouting,Return=globalThis.DeadwallReturnRoutes,origin=P.gatesFor(g).find(p=>p.id==='east'),outside=Return.outsideWorld(w);const expected=sites.map(p=>({p,route:Router.route(outside,origin,p)})).filter(v=>v.route).sort((a,b)=>a.route.metres-b.route.metres||a.p.id.localeCompare(b.p.id));assert.ok(expected.length);
 assert.equal(g.fieldAtlas.prepareBiome(id).added[0],expected[0].p.id);const plan=g.fieldAtlas.planning();assert.deepEqual(plan.legs[0].path[0],{x:origin.x,y:origin.y});assert.deepEqual(plan.legs[0].path.at(-1),expected[0].p.drive.b);
});
test('exploration 1.41 : une sortie à pied conserve sa vraie origine même avec le mode véhicule',()=>{
 const g=fresh(),{id,sites}=richBiome(g);know(g,sites);const position=outsideOnFoot(g);g.fieldAtlas.configure('car','east');g.fieldAtlas.add(sites[0].id);g.fieldAtlas.start();const before=stable(g),plan=g.fieldAtlas.planning();assert.deepEqual(plan.legs[0].path[0],position);assert.equal(plan.originKind,'commandant');assert.equal(plan.vehicleUsable,false);assert.equal(plan.available,0);assert.deepEqual(stable(g),before);
 assert.equal(g.fieldAtlas.guidance().id,sites[0].id);g.fieldAtlas.stop();g.fieldAtlas.remove(sites[0].id);const prepared=g.fieldAtlas.prepareBiome(id);assert.equal(prepared.ok,true);assert.deepEqual(g.fieldAtlas.planning().legs[0].path[0],position);
});
test('exploration 1.41 : un retour introuvable ne valide pas une boucle et ne garantit pas son budget',()=>{
 const g=fresh(),{sites}=richBiome(g);know(g,sites);g.fieldAtlas.add(sites[0].id);g.fieldAtlas.configure('foot','west');const Router=globalThis.DeadwallFrontierRouting,route=Router.route;Router.route=(w,from,p)=>p.id?route(w,from,p):null;
 try{const plan=g.fieldAtlas.planning();assert.equal(plan.legs.length,1);assert.equal(plan.back,null);assert.equal(plan.failed,true);}finally{Router.route=route;}
});
test('exploration 1.41 : tournée écologique et découvertes survivent à la reprise, nouvelle graine vide',()=>{
 const g=fresh(),{id,sites}=richBiome(g);know(g,sites);g.fieldAtlas.prepareBiome(id);g.fieldAtlas.start();g.fieldAtlas.next();const tour=g.fieldAtlas.snapshot(),seen=g.frontier.discoveries(),resources={...g.resources};assert.ok(g.save(false));assert.ok(g.load());assert.deepEqual(g.fieldAtlas.snapshot(),tour);assert.deepEqual(g.frontier.discoveries(),seen);assert.deepEqual(g.resources,resources);assert.equal(g.fieldAtlas.planning().legs[0].target.id,tour.tour.stops[1]);
 g.startNew('standard','84329');g.campaignIntro132.skip();assert.deepEqual(g.fieldAtlas.biomeChoices(),[]);assert.deepEqual(g.fieldAtlas.snapshot(),globalThis.DeadwallCore.FieldAtlas.initial());
});
test('exploration 1.41 : les générations historiques sans biomes ne reçoivent pas une fausse écologie',()=>{
 const g=fresh(),s=g.serialize();Object.assign(s.frontier,{generation:3,x:4162,y:4096});g.restoreSave(s);const w=g.frontier.world();know(g,w.pois.slice(0,6));const before=stable(g);assert.deepEqual(g.fieldAtlas.biomeChoices(),[]);assert.equal(g.fieldAtlas.prepareBiome('meadow').ok,false);assert.deepEqual(stable(g),before);g.fieldAtlas.add(w.pois[0].id);assert.ok(g.fieldAtlas.planning().legs.length);
});
