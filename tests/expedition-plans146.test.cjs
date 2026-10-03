'use strict';
const {legacyAge}=require('./helpers/legacy-city.cjs');
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),{bootGame}=require('./helpers/browser.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const stable=g=>{const d=g.serialize();delete d.timestamp;return JSON.stringify(d);};
function fresh(){
 const {game:g}=bootGame();g.startNew('standard','903145');g.units=[];
 // Prepared infrastructure and stocks; all new ensemble purchases use the real transaction.
 const office=new(g.core().constructor)(g.nextId++,'planningOffice',70,59,0,1);
 g.world.add(office);legacyAge(g,48);g.refreshMetrics(true);
 for(const k of C.RESOURCE_KEYS)g.resources[k]=Math.min(2000,g.storage);
 g.restoreSave(g.serialize());
 return g;
}
function position(g,id){
 for(let y=15;y<106;y+=3)for(let x=15;x<106;x+=3){const q=g.dayworks.planStatus(id,x,y);if(q.ok)return{x,y,q};}
 throw Error('Aucun emplacement physique pour '+id);
}
for(const id of ['observationRelay','careCourt']){
 test('plans146 '+id+' : passages libres et portée exacte des empreintes',()=>{
  const plan=C.Dayworks.PLANS.find(p=>p.id===id),cells=new Set();
  for(const item of C.Dayworks.footprint(id,0,0)){
   const d=C.BUILDINGS[item.type];
   for(let y=item.gy;y<item.gy+d.size[1];y++)for(let x=item.gx;x<item.gx+d.size[0];x++){
    assert.ok(x>=0&&y>=0&&x<plan.w&&y<plan.h);assert.ok(!cells.has(x+':'+y));cells.add(x+':'+y);
   }
  }
  for(let y=0;y<plan.h;y++)for(let x=5;x<=7;x++)assert.ok(!cells.has(x+':'+y),'axe central libre');
 });
 test('plans146 '+id+' : devis gratuit, achat unique, fondations sans bonus et reprise exacte',()=>{
  const g=fresh(),p=position(g,id),before=stable(g),count=g.world.buildings.size,stock={...g.resources},score=g.cityScore;
  assert.equal(g.dayworks.anchorPlan(id,p.x,p.y).ok,true);assert.equal(stable(g),before);
  assert.equal(g.dayworks.commitPlan(),true);assert.equal(g.world.buildings.size,count+p.q.items.length);
  for(const k of C.RESOURCE_KEYS)assert.equal(g.resources[k],stock[k]-(p.q.cost[k]||0));
  const jobs=[...g.world.buildings.values()].filter(b=>!b.completed);
  assert.equal(jobs.length,4);assert.equal(g.cityScore,score);assert.equal(g.dayworks.commitPlan(),false);
  const paid=stable(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.equal(stable(g),paid);
  assert.equal(g.dayworks.snapshot().stats.plans,1);assert.equal([...g.world.buildings.values()].filter(b=>!b.completed).length,4);
 });
 test('plans146 '+id+' : invalidation après aperçu refuse sans paiement ni bâtiment',()=>{
  const g=fresh(),p=position(g,id);assert.equal(g.dayworks.anchorPlan(id,p.x,p.y).ok,true);
  g.resources.wood=0;const before=stable(g);assert.equal(g.dayworks.commitPlan(),false);assert.equal(stable(g),before);
 });
}
test('plans146 : un mirador financé ne révèle rien avant son achèvement physique',()=>{
 const g=fresh(),p=position(g,'observationRelay');g.dayworks.anchorPlan('observationRelay',p.x,p.y);assert.equal(g.dayworks.commitPlan(),true);
 const tower=[...g.world.buildings.values()].find(b=>b.type==='watchtower');
 g.spawnZombie('walker');const enemy=g.zombies.at(-1);Object.assign(enemy,{x:tower.x+120,y:tower.y});
 g.player.x=4000;g.player.y=4000;assert.equal(g.visibility.canSeeLocal(enemy),false);
 standAt(g,g.player,tower);g.input.keys.add('KeyE');
 for(let i=0;i<1000&&!tower.completed;i++)g.updateInteraction(.1);
 g.input.keys.clear();assert.equal(tower.completed,true);g.player.x=4000;g.player.y=4000;
 assert.equal(g.visibility.canSeeLocal(enemy),true);tower.dead=true;tower.health=0;
 assert.equal(g.visibility.canSeeLocal(enemy),false);
});
