'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs');
const C=require('../src/core.js');
const W=require('../src/frontier-world.js');
const {standAt}=require('./helpers/physical-fixtures.cjs');
function fresh(){const {game:g}=boot127();g.startNew('standard','17117');return g;}
function observe(fn){let geometry=0,normalized=0;const create=W.create,normalize=C.Frontier.normalize;W.create=(...args)=>{geometry++;return create(...args);};C.Frontier.normalize=(...args)=>{normalized++;return normalize(...args);};try{return{value:fn(),counts:()=>({geometry,normalized})};}finally{W.create=create;C.Frontier.normalize=normalize;}}
function car(g){const b=new(g.core().constructor)(g.nextId++,'expeditionGarage',77,65,0,1);g.world.add(b);g.refreshMetrics(true);g.fieldcraft.setup();standAt(g,g.player,g.core());g.resources.wood=g.resources.scrap=300;assert.ok(g.expeditions.buildCar().ok);const v=g.expeditions.car();Object.assign(v,{x:4058,y:2048,driving:true});Object.assign(g.player,{x:4058,y:2048,radius:C.Expeditions.RULES.carRadius});assert.ok(g.frontier.enter());return v;}

test('position régionale : consultation répétée sans génération ni normalisation des historiques',()=>{
 const g=fresh();const measurement=observe(()=>{for(let i=0;i<500;i++){const p=g.frontier.position();assert.equal(p.active,false);assert.equal(p.generation,4);assert.equal(p.car,null);assert.equal('taken' in p,false);assert.equal('world' in p,false);}});
 assert.deepEqual(measurement.counts(),{geometry:0,normalized:0});
});
test('position régionale : coordonnées et véhicule copiés correspondent à la simulation après déplacement et reprise',()=>{
 const g=fresh(),v=car(g);g.input.keys.add('KeyD');g.update(.04);g.input.keys.clear();const before=g.frontier.snapshot();const view=g.frontier.position();for(const key of Object.keys(view))assert.deepEqual(view[key],before[key]);view.x=-500;view.car.x=-500;assert.notEqual(g.frontier.position().x,-500);assert.notEqual(g.frontier.position().car.x,-500);assert.ok(g.save(false));assert.ok(g.load());assert.deepEqual(g.frontier.position().car,before.car);
 // ensure() must still detect removal of the physical vehicle without consulting a full overview.
 v.health=0;const current=g.expeditions.car();current.id+=1;assert.equal(g.frontier.position().car,null);assert.equal(current.regionAway,false);assert.equal(g.player.regionAbsent,true);
});
test('position régionale : nouvelle campagne réinitialisée et aperçu complet toujours disponible',()=>{
 const g=fresh();g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());const first=g.frontier.world();g.startNew('standard','42');const p=g.frontier.position();assert.equal(p.active,false);assert.equal(p.car,null);assert.equal(g.player.regionAbsent,false);const full=g.frontier.overview();assert.equal(full.world.seed,42);assert.notEqual(full.world,first);assert.ok(full.world.pois.length>0);assert.equal(full.x,p.x);
});
test('services essentiels : HUD léger indépendant du dossier et copies sans mutation de la ceinture',()=>{
 const g=fresh(),before=g.essentials.snapshot();const measurement=observe(()=>{for(let i=0;i<100;i++){const s=g.essentials.status();assert.equal(s.carrying,null);assert.equal(s.task,null);assert.deepEqual(s.belt,before.belt);s.belt.light=99;}});
 assert.deepEqual(measurement.counts(),{geometry:0,normalized:0});assert.deepEqual(g.essentials.snapshot(),before);
});
test('D-17 à froid : mises à jour et rendu local ne construisent pas une région inutilisée',()=>{
 const g=fresh();g.phaseTime=9999;g.exploration125.wildNext=1e8;
 const measurement=observe(()=>{for(let i=0;i<40;i++){g.update(.04);g.render();}assert.equal(g.frontier.active(),false);assert.ok(g.elapsed>1.5);assert.equal(g.gameOver,false);});
 assert.equal(measurement.counts().geometry,0);
 const opening=observe(()=>g.frontier.world());assert.equal(opening.counts().geometry,1);assert.ok(opening.value.pois.length>0);assert.equal(g.frontier.world(),opening.value);
});
