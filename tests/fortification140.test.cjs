'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require(process.env.DEADWALL_COMBAT_REFERENCE?require('node:path').join(process.env.DEADWALL_COMBAT_REFERENCE,'scripts/qa-startup134.cjs'):'../scripts/qa-startup134.cjs');
let g,doc,C;
test.before(()=>{({g,doc}=bootDocument134());C=globalThis.DeadwallCore;});
function start(){g.startNew('standard','17117');g.campaignIntro132.skip();g.phaseTime=999;g.player.invulnerable=0;assert.equal(g.loadout.transfer('depot','sac','ammo',1).ok,true);}
function button(id){const b=doc.getElementById('expansionAction-fortification-'+id);assert.ok(b&&doc.body.contains(b),'Action Fortifications montée : '+id);return b;}
function tower(){
 const core=g.core();
 for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){
  if(!g.world.placement(C.BUILDINGS.watchtower,core.gx+dx,core.gy+dy,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,'watchtower',core.gx+dx,core.gy+dy,0,1);g.world.add(b);const p=g.fieldcraft.service(g.player,b);
  if(p){Object.assign(g.player,p);if(g.fortificationPack.eligibility('ammo',b).ok){g.refreshMetrics(true);g.selectedBuilding=b;return b;}}
  g.world.remove(b);
 }
 throw Error('Aucun mirador avec un point de service réel.');
}
function debrisBeside(b){
 const start={x:g.player.x,y:g.player.y};
 for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
  if(!g.world.placement(C.BUILDINGS.steelWall,b.gx+dx,b.gy+dy,0).valid)continue;
  const wall=new(b.constructor)(g.nextId++,'steelWall',b.gx+dx,b.gy+dy,0,1);g.world.add(wall);const p=g.fieldcraft.service(g.player,wall);
  if(p){Object.assign(g.player,p);if(g.fortificationPack.eligibility('ammo',b).ok&&g.fieldcraft.control(b)){assert.ok(g.fieldcraft.control());g.destroyBuilding(wall);const d=g.fortificationPack.snapshot().debris.find(d=>d.id===wall.id);assert.ok(d);assert.ok(g.fortificationPack.actions().find(a=>a.id==='recover-debris'&&!a.disabled));return d;}}
  g.world.remove(wall);Object.assign(g.player,start);
 }
 throw Error('Aucun débris partageant un accès libre avec le mirador.');
}
function lock(mode,b){
 if(mode==='mounted'){assert.ok(g.fieldcraft.control(b));return;}
 g.player.shootCooldown=0;g.shootPlayer();const reload=doc.body.querySelectorAll('button').find(b=>b.dataset.gameCommand==='reload');assert.ok(reload);reload.click();assert.ok(g.player.reload>0);
}
function unlock(mode){
 if(mode==='mounted')assert.ok(g.fieldcraft.control());
 else{for(let i=0;i<200&&g.player.reload>0;i++)g.updatePlayer(.04);assert.equal(g.player.reload,0);assert.equal(g.player.carry.ammo,0);}
}
function finish(){for(let i=0;i<1000&&g.fortificationPack.busy();i++)g.fortificationPack.step(.04);assert.equal(g.fortificationPack.busy(),false);}
for(const mode of ['mounted','reload'])for(const operation of ['ammo','recover-ammo','start-repair','recover-debris'])test('140 : '+operation+' attend '+mode+' puis conserve ses réserves physiques',()=>{
 start();const b=tower(),api=g.fortificationPack;let d;
 if(operation==='recover-ammo')assert.ok(api.equip('ammo',b.id).ok);
 if(operation==='start-repair'){assert.ok(api.equip('repair',b.id).ok);b.health-=24;}
 if(operation==='recover-debris')d=debrisBeside(b);
 lock(mode,b);const stock={...g.resources},bag={...g.player.carry},state=api.snapshot(),health=b.health,arsenal=g.arsenal134.snapshot(),magazine={...g.player.magazine};
 const run=()=>operation==='ammo'?api.equip('ammo',b.id):operation==='recover-ammo'?api.recoverAmmo(b.id):operation==='start-repair'?api.startRepair(b.id):api.startRecovery(d.id);
 assert.ok(g.expansionUI.open('fortification'));assert.equal(button(operation).disabled,true,'Manipulation physique indisponible avec les mains occupées.');button(operation).click();assert.equal(run().ok,false);
 assert.deepEqual(api.snapshot(),state);assert.deepEqual(g.resources,stock);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.arsenal134.snapshot(),arsenal);assert.deepEqual(g.player.magazine,magazine);assert.equal(b.health,health);assert.equal(api.busy(),false);
 if(mode==='mounted')assert.equal(g.fieldcraft.context().mounted,b.id);else assert.ok(g.player.reload>0);
 g.expansionUI.close();unlock(mode);const released={...g.resources},releasedBag={...g.player.carry};assert.ok(g.expansionUI.open('fortification'));assert.equal(button(operation).disabled,false);button(operation).click();if(g.activeOverlay)g.expansionUI.close();
 if(operation==='ammo'){assert.equal(api.snapshot().fittings.find(f=>f.id===b.id).ammo,C.FortificationPackRules.ammoCapacity);for(const[k,n]of Object.entries(C.FortificationPackRules.ammoCost))assert.equal(g.resources[k],released[k]-n);assert.equal(run().ok,false);}
 if(operation==='recover-ammo'){assert.equal(g.resources.ammo,released.ammo+C.FortificationPackRules.ammoCapacity);assert.equal(run().ok,false);}
 if(operation==='start-repair'){assert.ok(api.busy());g.togglePause(true);api.step(.04);assert.equal(b.health,health);g.togglePause(false);finish();assert.equal(b.health,b.maxHealth);assert.ok(Math.abs(api.snapshot().fittings.find(f=>f.id===b.id).repair-(C.FortificationPackRules.repairCapacity-24))<1e-7);assert.equal(run().ok,false);assert.deepEqual(g.resources,released);}
 if(operation==='recover-debris'){assert.ok(api.busy());finish();assert.equal(api.snapshot().debris.some(r=>r.id===d.id),false);for(const k of C.FortificationPackRules.debrisResources)assert.ok(Math.abs(g.player.carry[k]-(releasedBag[k]+d.remaining[k]))<1e-7);assert.deepEqual(g.resources,released);assert.equal(run().ok,false);}
 const after=api.snapshot(),paid={...g.resources},carried={...g.player.carry};assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(api.snapshot(),after);assert.deepEqual(g.resources,paid);assert.deepEqual(g.player.carry,carried);assert.equal(api.busy(),false);
});
