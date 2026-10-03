'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),Kit=require('../src/expansion-kit.js'),Pack=require('../src/fortification-pack.js');
const Survival=require('../src/survival-pack.js'),Loadout=require('../src/loadout129.js');
const copy=value=>JSON.parse(JSON.stringify(value));
// These are explicit model fixtures: completed supports and cleared props,
// never a claim that a native campaign constructed or travelled to them.
function fresh(){const {game:g}=bootGame();Kit.install(g);Pack.install(g);Survival.install(g);Loadout.install(g);g.startNew('standard','17117');g.units=[];g.world.nodes.forEach(n=>n.depleted=true);return g;}
function structure(g,type='watchtower',x=72,y=72){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,1);g.world.add(b);g.refreshMetrics(true);g.selectBuilding(b);standAt(g,g.player,b);return b;}
function packBag(g,cost){standAt(g,g.player,g.core());for(const[key,n]of Object.entries(cost)){const r=g.loadout.transfer('depot','sac',key,n);assert.equal(r.ok,true,key);assert.equal(r.amount,n);} }
const fit=(g,b)=>g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id);
function reserve(g,b,values){const s=g.fortificationPack.snapshot(),f=s.fittings.find(f=>f.id===b.id);if(f)Object.assign(f,values);else s.fittings.push({id:b.id,ammo:0,repair:0,net:0,regulator:false,...values});g.expansions.get('fortification').restore(s);}
function work(g,seconds){for(let left=seconds;left>1e-8;left-=C.FortificationPackRules.maxStep)g.fortificationPack.step(Math.min(left,C.FortificationPackRules.maxStep));}
function state(g){const s=copy(g.serialize());delete s.timestamp;return JSON.stringify(s);}
function infected(g,b,distance=220){g.spawnZombie('walker');const z=g.zombies.at(-1);z.x=b.x+distance;z.y=b.y;g.rebuildBuckets();return z;}

test('147 appoint : vraie sortie du dépôt vers le sac, paiement uniquement après six secondes',()=>{
 const g=fresh(),r=C.FortificationPackRules.fieldSupply.ammo;packBag(g,r.cost);const b=structure(g),stock={...g.resources},bag={...g.player.carry},deposited=g.depositedResources;
 const before=state(g);for(let i=0;i<20;i++){const q=g.fortificationPack.previewFieldSupply('ammo',b.id);assert.equal(q.ok,true);assert.equal(q.amount,6);g.fortificationPack.actions();}assert.equal(state(g),before,'le devis ne consomme ni stock ni RNG');
 const action=g.fortificationPack.actions().find(a=>a.id==='field-ammo');assert.equal(action.disabled,false);assert.match(action.description,/dans le sac/);assert.match(action.description,/6 s/);assert.equal(action.close,true);assert.equal(action.run().ok,true);
 work(g,r.seconds-.25);assert.deepEqual(g.player.carry,bag);assert.equal(fit(g,b),undefined);assert.match(g.fortificationPack.overview().rows.find(r=>r.label==='Travail').value,/95 %/);
 work(g,.25);assert.equal(fit(g,b).ammo,6);for(const[key,n]of Object.entries(r.cost))assert.equal(bag[key]-g.player.carry[key],n);assert.deepEqual(g.resources,stock);assert.equal(g.depositedResources,deposited);assert.equal(g.fortificationPack.busy(),false);
 work(g,10);assert.equal(fit(g,b).ammo,6,'aucun second paiement ou crédit');
});

test('147 appoint : absence de ressources dans le sac refuse même avec un dépôt approvisionné',()=>{
 const g=fresh(),b=structure(g),before=state(g);for(const kind of ['ammo','repair','unknown',['ammo'],null])assert.equal(g.fortificationPack.startFieldSupply(kind,b.id).ok,false);assert.equal(state(g),before);
 const a=g.fortificationPack.actions().find(a=>a.id==='field-ammo');assert.equal(a.disabled,true);assert.match(a.reason,/sac/);assert.match(a.description,/6 s/);
});

test('147 appoint : place partielle payée au plafond, cassette finie sans soin direct',()=>{
 const g=fresh();packBag(g,{ammo:2,wood:2,scrap:3});const b=structure(g);reserve(g,b,{ammo:22,repair:170});b.health-=100;const hp=b.health;
 const q=g.fortificationPack.previewFieldSupply('ammo',b.id);assert.equal(q.amount,2);assert.deepEqual(q.cost,{ammo:2,wood:1,scrap:1});assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,true);work(g,6);assert.equal(fit(g,b).ammo,24);
 const repair=g.fortificationPack.previewFieldSupply('repair',b.id);assert.equal(repair.amount,30);assert.deepEqual(repair.cost,{scrap:2,wood:1});assert.equal(g.fortificationPack.startFieldSupply('repair',b.id).ok,true);work(g,8);assert.equal(fit(g,b).repair,200);assert.equal(b.health,hp);assert.equal(C.bagTotal(g.player.carry),0);
 assert.equal(g.fortificationPack.previewFieldSupply('ammo',b.id).ok,false);assert.equal(g.fortificationPack.previewFieldSupply('repair',b.id).ok,false);assert.equal(g.fortificationPack.startRepair(b.id).ok,true);g.fortificationPack.step(.25);assert.equal(b.health,hp+2);assert.equal(fit(g,b).repair,198);
});

test('147 appoint : quatre-vingts points restent une réserve achetée, les autres équipements intacts',()=>{
 const g=fresh();packBag(g,C.FortificationPackRules.fieldSupply.repair.cost);const b=structure(g,'woodWall');reserve(g,b,{net:7});const hp=b.health,stock={...g.resources};assert.equal(g.fortificationPack.startFieldSupply('repair',b.id).ok,true);work(g,8);
 assert.equal(fit(g,b).repair,80);assert.equal(fit(g,b).net,7);assert.equal(fit(g,b).ammo,0);assert.equal(fit(g,b).regulator,false);assert.equal(b.health,hp);assert.deepEqual(g.resources,stock);
 const ammo=g.fortificationPack.previewFieldSupply('ammo',b.id);assert.equal(ammo.ok,false);assert.match(ammo.reason,/mirador/);
});

test('147 appoint : pause et commandement suspendent réellement le travail puis reprennent',()=>{
 const g=fresh();packBag(g,C.FortificationPackRules.fieldSupply.ammo.cost);const b=structure(g),bag={...g.player.carry};assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,true);work(g,2);const elapsed=g.fortificationPack.job.elapsed;
 g.paused=true;work(g,12);assert.equal(g.fortificationPack.job.elapsed,elapsed);g.paused=false;g.activeOverlay=g.ui.commandModal;work(g,12);assert.equal(g.fortificationPack.job.elapsed,elapsed);assert.deepEqual(g.player.carry,bag);g.activeOverlay=null;work(g,4);assert.equal(fit(g,b).ammo,6);
});

test('147 appoint : mouvement et perte d’ingrédient interrompent sans paiement partiel',()=>{
 for(const mode of ['movement','ingredient','reload','build','damage','regionAbsent','fire']){
  const g=fresh();packBag(g,C.FortificationPackRules.fieldSupply.ammo.cost);const b=structure(g);assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,true);work(g,5.75);
  if(mode==='movement')g.player.y+=C.FortificationPackRules.fieldSupplyMoveTolerance+1;
  if(mode==='ingredient')g.player.carry.scrap=0;
  if(mode==='reload')g.player.reload=1;
  if(mode==='build')g.selectedBuild='woodWall';
  if(mode==='damage')g.player.health--;
  if(mode==='regionAbsent')g.player.regionAbsent=true;
  if(mode==='fire')g.input.mouseDown=true;
  const bag={...g.player.carry},stock={...g.resources};g.fortificationPack.step(.25);assert.equal(g.fortificationPack.busy(),false,mode);assert.deepEqual(g.player.carry,bag,mode);assert.deepEqual(g.resources,stock,mode);assert.equal(fit(g,b),undefined,mode);
 }
});

test('147 appoint : le poste monté refuse le départ et ne peut être pris pendant le travail',()=>{
 const g=fresh();packBag(g,C.FortificationPackRules.fieldSupply.ammo.cost);const b=structure(g),bag={...g.player.carry};assert.equal(g.fieldcraft.control(b),true);assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,false);assert.equal(g.fortificationPack.actions().find(a=>a.id==='field-ammo').disabled,true);assert.deepEqual(g.player.carry,bag);
 assert.equal(g.fieldcraft.control(b),true,'rendre le poste avant la préparation');assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,true);assert.equal(g.fieldcraft.control(b),false,'les mains sont occupées par l’appoint');assert.equal(g.fortificationPack.busy(),true);work(g,6);assert.equal(fit(g,b).ammo,6);
});

test('147 appoint : menace réelle interrompt et son départ permet un nouveau travail',()=>{
 const g=fresh();packBag(g,C.FortificationPackRules.fieldSupply.ammo.cost);const b=structure(g);assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,true);work(g,2);const bag={...g.player.carry},z=infected(g,b);z.x=g.player.x+30;z.y=g.player.y;g.rebuildBuckets();assert.equal(g.fortificationPack.previewFieldSupply('ammo',b.id).ok,false);g.fortificationPack.step(.04);assert.equal(g.fortificationPack.busy(),false);assert.deepEqual(g.player.carry,bag);assert.equal(fit(g,b),undefined);
 z.x=b.x+600;g.rebuildBuckets();assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,true);work(g,6);assert.equal(fit(g,b).ammo,6);
});

test('147 appoint : le caisson tirant peut disparaître, quantité promise et support restent fixes',()=>{
 const g=fresh();packBag(g,{ammo:2,wood:1,scrap:1});const b=structure(g);reserve(g,b,{ammo:22});const stock={...g.resources};assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,true);assert.equal(g.fortificationPack.job.amount,2);g.resources.ammo=0;g.dayClock=.5;const z=infected(g,b);assert.ok(Math.hypot(z.x-g.player.x,z.y-g.player.y)>C.FortificationPackRules.dangerRange);
 for(let i=0;i<22;i++){b.fireCooldown=0;g.updateBuildings(.04);}assert.equal(g.projectiles.length,22);assert.equal(fit(g,b),undefined,'le fitting épuisé est réellement retiré');assert.equal(g.fortificationPack.busy(),true);
 g.selectBuilding(g.core());work(g,6);assert.equal(fit(g,b).ammo,2);assert.equal(fit(g,g.core()),undefined);assert.equal(g.resources.ammo,0);assert.equal(C.bagTotal(g.player.carry),0);assert.equal(stock.wood,g.resources.wood);assert.equal(stock.scrap,g.resources.scrap);
});

test('147 appoint : destruction ou remplacement ne retargetent jamais ni ne prélèvent le sac',()=>{
 for(const mode of ['destroy','replacement']){
  const g=fresh();packBag(g,C.FortificationPackRules.fieldSupply.ammo.cost);const b=structure(g);reserve(g,b,{ammo:18});assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,true);work(g,2);
  if(mode==='destroy')g.destroyBuilding(b);
  if(mode==='replacement'){g.world.remove(b);const replacement=new(b.constructor)(b.id,b.type,b.gx,b.gy,0,1);g.world.add(replacement);}
  const bag={...g.player.carry};work(g,8);assert.equal(g.fortificationPack.busy(),false);assert.deepEqual(g.player.carry,bag);assert.equal(fit(g,b)?.ammo,mode==='replacement'?18:undefined);
 }
});

test('147 appoint : sécurité et vraie ligne physique requises avant le démarrage',()=>{
 const g=fresh();packBag(g,C.FortificationPackRules.fieldSupply.ammo.cost);const b=structure(g);const access={x:g.player.x,y:g.player.y};g.player.x=b.left-55;g.player.y=b.y;structure(g,'steelWall',71,73);g.player.x=b.left-55;g.player.y=b.y;g.selectBuilding(b);const bag={...g.player.carry};assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,false);assert.deepEqual(g.player.carry,bag);
 g.player.x=100;g.player.y=100;assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,false);g.player.x=access.x;g.player.y=access.y;g.player.dead=true;assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,false);
});

test('147 appoint : Survie, transfert et réparation UI refusent la double intervention',()=>{
 const g=fresh();packBag(g,{...C.FortificationPackRules.fieldSupply.ammo.cost,medicine:1});const b=structure(g);reserve(g,b,{repair:10});b.health-=20;g.player.health=60;assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,true);
 assert.equal(g.expansions.busy('survival'),true);assert.equal(g.survivalPack.begin('dressingLight').ok,false);assert.equal(g.fortificationPack.startRepair(b.id).ok,false);assert.equal(g.loadout.transfer('sac','depot','ammo',1).ok,false);const actions=g.fortificationPack.actions();for(const id of ['field-ammo','field-repair','start-repair','recover-debris'])assert.equal(actions.find(a=>a.id===id).disabled,true,id);assert.equal(actions.find(a=>a.id==='stop-work').run(),true);assert.equal(g.survivalPack.begin('dressingLight').ok,true);assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,false);
});

test('147 appoint : reprise garde les réserves et le sac, jamais un travail inachevé ou un cadeau',()=>{
 const g=fresh();packBag(g,C.FortificationPackRules.fieldSupply.ammo.cost);const b=structure(g);assert.equal(g.fortificationPack.startFieldSupply('ammo',b.id).ok,true);work(g,2);const unfinished=copy(g.serialize()),bag={...g.player.carry},rng=g.random.state;g.restoreSave(unfinished);assert.equal(g.fortificationPack.busy(),false);assert.equal(fit(g,b),undefined);assert.deepEqual(g.player.carry,bag);assert.equal(g.random.state,rng);assert.equal(g.serialize().version,20);
 const support=g.world.buildings.get(b.id);assert.equal(g.fortificationPack.startFieldSupply('ammo',support.id).ok,true);work(g,6);const saved=copy(g.serialize()),fittings=g.fortificationPack.snapshot();for(let i=0;i<3;i++){g.restoreSave(saved);assert.deepEqual(g.fortificationPack.snapshot(),fittings);assert.deepEqual(g.player.carry,saved.player.carry);}const old=copy(saved);delete old.expansions127;g.restoreSave(old);assert.deepEqual(g.fortificationPack.snapshot(),Pack.initial());assert.deepEqual(g.player.carry,saved.player.carry);g.startNew('standard','42');assert.deepEqual(g.fortificationPack.snapshot(),Pack.initial());assert.equal(g.fortificationPack.busy(),false);assert.equal(C.bagTotal(g.player.carry),0);
});
