'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require(process.env.DEADWALL_COMBAT_REFERENCE?require('node:path').join(process.env.DEADWALL_COMBAT_REFERENCE,'scripts/qa-startup134.cjs'):'../scripts/qa-startup134.cjs');
let g,doc,C;
test.before(()=>{({g,doc}=bootDocument134());C=globalThis.DeadwallCore;});
function start(){g.startNew('standard','17117');g.campaignIntro132.skip();g.phaseTime=999;g.player.invulnerable=0;}
function finish(){for(let i=0;i<1000&&g.playerOps131.busy();i++)g.playerOps131.step(.04);assert.equal(g.playerOps131.busy(),false);}
function action(kind){const b=doc.getElementById('expansionAction-player131-'+kind);assert.ok(b&&doc.body.contains(b),'Action Commandant montée : '+kind);return b;}
function towerAtDepot(){
 const core=g.core();
 for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){
  if(!g.world.placement(C.BUILDINGS.watchtower,core.gx+dx,core.gy+dy,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,'watchtower',core.gx+dx,core.gy+dy,0,1);g.world.add(b);
  const p=g.fieldcraft.service(g.player,b);
  if(p){Object.assign(g.player,p);if(g.playerOps131.preview('tools').ok){g.refreshMetrics(true);assert.ok(g.fieldcraft.control(b));return b;}}
  g.world.remove(b);
 }
 throw Error('Aucun mirador avec accès physique commun au dépôt.');
}
for(const kind of ['vest','service','ammo','tools'])test('140 : la préparation '+kind+' attend la sortie du mirador puis conserve son coût et sa reprise',()=>{
 start();const b=towerAtDepot(),stock={...g.resources},before=g.playerOps131.snapshot(),arsenal=g.arsenal134.snapshot();
 assert.ok(g.expansionUI.open('player131'));assert.equal(action(kind).disabled,true,'Les mains servent déjà le poste.');action(kind).click();
 assert.equal(g.playerOps131.begin(kind).ok,false);assert.equal(g.playerOps131.busy(),false);assert.deepEqual(g.playerOps131.snapshot(),before);assert.deepEqual(g.arsenal134.snapshot(),arsenal);assert.deepEqual(g.resources,stock);assert.equal(g.fieldcraft.context().mounted,b.id);
 g.expansionUI.close();assert.ok(g.fieldcraft.control());const q=g.playerOps131.preview(kind);assert.ok(q.ok,q.reason);
 assert.ok(g.expansionUI.open('player131'));assert.equal(action(kind).disabled,false);action(kind).click();assert.equal(g.activeOverlay,null);assert.equal(g.paused,false);assert.equal(g.playerOps131.busy(),true);
 g.togglePause(true);const progress=g.playerOps131.overview().task.progress;g.playerOps131.step(.04);assert.equal(g.playerOps131.overview().task.progress,progress);assert.deepEqual(g.resources,stock);g.togglePause(false);finish();
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],stock[key]-(q.cost[key]||0),'Une dépense au terme : '+key);
 const after=g.playerOps131.snapshot(),paid={...g.resources};assert.notDeepEqual(after,before);assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(g.playerOps131.snapshot(),after);assert.deepEqual(g.resources,paid);assert.deepEqual(g.arsenal134.snapshot(),arsenal);assert.equal(g.fieldcraft.context().mounted,null);
});
test('140 : la cartouchière ne rejoint pas le dépôt pendant le contrôle manuel et rend ensuite son reliquat une fois',()=>{
 start();assert.ok(g.playerOps131.begin('ammo').ok);finish();const b=towerAtDepot(),before=g.playerOps131.snapshot(),stock={...g.resources};assert.equal(before.reserve,C.Player131Rules.ammo.capacity);
 assert.ok(g.expansionUI.open('player131'));assert.equal(action('storeAmmo').disabled,true);action('storeAmmo').click();assert.equal(g.playerOps131.storeAmmo().ok,false);assert.deepEqual(g.playerOps131.snapshot(),before);assert.deepEqual(g.resources,stock);assert.equal(g.fieldcraft.context().mounted,b.id);
 g.expansionUI.close();assert.ok(g.fieldcraft.control());assert.ok(g.expansionUI.open('player131'));assert.equal(action('storeAmmo').disabled,false);action('storeAmmo').click();assert.equal(g.playerOps131.snapshot().reserve,0);assert.equal(g.resources.ammo,stock.ammo+before.reserve);
 g.expansionUI.close();const paid={...g.resources};assert.equal(g.playerOps131.storeAmmo().ok,false);assert.deepEqual(g.resources,paid);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.playerOps131.snapshot().reserve,0);assert.deepEqual(g.resources,paid);
});
