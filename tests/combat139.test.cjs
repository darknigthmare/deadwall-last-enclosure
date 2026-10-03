'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
let g,doc,C;
test.before(()=>{({g,doc}=bootDocument134());C=globalThis.DeadwallCore;});
function start(){g.startNew('standard','17117');g.campaignIntro132.skip();g.phaseTime=999;g.player.invulnerable=0;}
function command(name){const button=doc.body.querySelectorAll('button').find(b=>b.dataset.gameCommand===name);assert.ok(button&&doc.body.contains(button),'Commande du HTML livré : '+name);button.click();}
function armoryAction(name){const button=g.arsenalUI134.element.querySelectorAll('button').find(b=>b.dataset.action===name);assert.ok(button,'Action d’armurerie montée : '+name);return button;}
function finishWork(){for(let i=0;i<1000&&g.arsenal134.busy();i++)g.arsenal134.step(.04);assert.equal(g.arsenal134.busy(),false);}
function craft(id){const q=g.arsenal134.preview('craft',id);assert.ok(q.ok,q.reason);assert.ok(g.arsenal134.begin('craft',id).ok);finishWork();const item=g.arsenal134.snapshot().locker.find(i=>i.id===id);assert.ok(item);assert.ok(g.arsenal134.transfer(item.uid,'carried').ok);return item;}
function towerAtDepot(){
 const core=g.core();
 for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){
  if(!g.world.placement(C.BUILDINGS.watchtower,core.gx+dx,core.gy+dy,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,'watchtower',core.gx+dx,core.gy+dy,0,1);g.world.add(b);
  const p=g.fieldcraft.service(g.player,b);
  if(p){Object.assign(g.player,p);if(g.arsenal134.preview('craft','plank').ok){g.refreshMetrics(true);assert.ok(g.fieldcraft.control(b));return b;}}
  g.world.remove(b);
 }
 throw Error('Aucun mirador préparé avec un accès commun au dépôt.');
}
function enemyInReach(){
 for(let i=0;i<48;i++){
  const angle=i*Math.PI/24,q={x:g.player.x+Math.cos(angle)*42,y:g.player.y+Math.sin(angle)*42};
  if(!g.hostilePositionClear({radius:12},q.x,q.y)||!g.hostileLineClear(g.player,q))continue;
  g.spawnZombie('walker');const z=g.zombies.at(-1);Object.assign(z,q);g.player.facing=angle;g.rebuildBuckets();return z;
 }
 throw Error('Pas de cible préparée sur un sol et une ligne libres.');
}

test('139 : la commande de crosse ne frappe pas pendant le contrôle manuel d’un mirador',()=>{
 start();const b=towerAtDepot(),z=enemyInReach(),health=z.health,rounds=g.player.magazine.pistol,condition=g.arsenal134.snapshot().carried.find(i=>i.id==='pistol').condition;
 command('melee');assert.equal(g.player.meleeCooldown,0,'Les mains servent déjà le poste manuel.');assert.equal(z.health,health);assert.equal(g.fieldcraft.context().mounted,b.id);
 g.player.shootCooldown=0;const shots=g.stats.shots;g.shootPlayer();assert.equal(g.stats.shots,shots,'Pas de second tir personnel à travers le contrôle du poste.');assert.equal(g.player.magazine.pistol,rounds);assert.equal(g.arsenal134.snapshot().carried.find(i=>i.id==='pistol').condition,condition);
 const stock=g.resources.ammo,count=g.projectiles.length;g.input.mouseDown=true;g.input.mouseWorldX=z.x;g.input.mouseWorldY=z.y;b.fireCooldown=0;g.updatePlayer(.04);g.releaseInputs();
 assert.equal(g.resources.ammo,stock-b.def.ammoPerShot,'Le vrai mirador conserve sa réserve commune.');assert.equal(g.projectiles.length,count+1);assert.equal(g.fieldcraft.context().mounted,b.id);
 assert.ok(g.fieldcraft.control());g.player.facing=Math.atan2(z.y-g.player.y,z.x-g.player.x);command('melee');assert.ok(g.player.meleeCooldown>0);assert.equal(z.health,health-C.SuccessionRules.armedMeleeDamage);
 assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.fieldcraft.context().mounted,null);assert.equal(g.player.magazine.pistol,rounds);assert.equal(g.arsenal134.snapshot().carried.find(i=>i.id==='pistol').condition,condition);
});

test('139 : l’atelier attend la libération du poste manuel puis assemble une seule fois',()=>{
 start();const b=towerAtDepot(),before={...g.resources};assert.ok(g.arsenalUI134.open());armoryAction('tab:catalog').click();
 assert.equal(armoryAction('craft:plank').disabled,true,'Une tâche d’atelier ne doit pas démarrer avec le mirador encore contrôlé.');assert.equal(g.arsenal134.begin('craft','plank').ok,false);assert.equal(g.arsenal134.busy(),false);assert.equal(g.fieldcraft.context().mounted,b.id);assert.deepEqual(g.resources,before);
 g.arsenalUI134.close();assert.ok(g.fieldcraft.control());assert.ok(g.arsenalUI134.open());armoryAction('tab:catalog').click();const button=armoryAction('craft:plank');assert.equal(button.disabled,false);button.click();assert.equal(g.arsenalUI134.isOpen(),false);assert.equal(g.arsenal134.busy(),true);
 g.togglePause(true);const progress=g.arsenal134.view().task.progress;g.update(.04);assert.equal(g.arsenal134.view().task.progress,progress);assert.deepEqual(g.resources,before);g.togglePause(false);finishWork();
 assert.equal(g.arsenal134.snapshot().locker.filter(i=>i.id==='plank').length,1);for(const[k,v]of Object.entries(C.Arsenal134Rules.catalog.plank.cost))assert.equal(g.resources[k],before[k]-v);
 assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.arsenal134.snapshot().locker.filter(i=>i.id==='plank').length,1);assert.equal(g.arsenal134.busy(),false);assert.equal(g.save(false),true);
});

test('139 : le harnais et l’entretien refusent le poste manuel sans déplacer ni réparer les objets',()=>{
 start();const tool=craft('hatchet');assert.ok(g.arsenal134.equip(tool.uid).ok);assert.ok(g.arsenal134.wearTool('wood',5));const b=towerAtDepot(),before=g.arsenal134.snapshot(),stock={...g.resources},pistol=before.carried.find(i=>i.id==='pistol');
 assert.equal(g.arsenal134.equip(pistol.uid).ok,false);assert.equal(g.arsenal134.transfer(tool.uid,'locker').ok,false);assert.equal(g.arsenal134.begin('repair','hatchet',tool.uid).ok,false);assert.deepEqual(g.arsenal134.snapshot(),before);assert.deepEqual(g.resources,stock);assert.equal(g.fieldcraft.context().mounted,b.id);
 assert.ok(g.fieldcraft.control());const q=g.arsenal134.preview('repair','hatchet');assert.ok(q.ok,q.reason);assert.ok(g.arsenal134.begin('repair','hatchet',tool.uid).ok);finishWork();assert.equal(g.resources.scrap,stock.scrap-q.cost.scrap);assert.equal(g.arsenal134.snapshot().carried.find(i=>i.uid===tool.uid).condition,100);assert.ok(g.arsenal134.equip(pistol.uid).ok);
 const after=g.arsenal134.snapshot();assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(g.arsenal134.snapshot(),after);assert.equal(g.fieldcraft.context().mounted,null);
});

test('139 : déployer et reprendre une défense libèrent d’abord le poste manuel',()=>{
 start();const item=craft('spikeFrame'),b=towerAtDepot(),R=C.Arsenal134Rules;let angle;
 for(let i=0;i<48;i++){const a=i*Math.PI/24,p={x:g.player.x+Math.cos(a)*R.deployDistance,y:g.player.y+Math.sin(a)*R.deployDistance};if(g.friendlyPositionClear({radius:R.postRadius},p.x,p.y)&&g.nightGear.localLineClear(g.player,p)){angle=a;break;}}
 assert.ok(Number.isFinite(angle),'Emplacement réellement libre devant le poste manuel.');g.player.facing=angle;const before=g.arsenal134.snapshot(),stock={...g.resources};
 assert.equal(g.arsenal134.deploy(item.uid).ok,false);assert.deepEqual(g.arsenal134.snapshot(),before);assert.deepEqual(g.resources,stock);assert.equal(g.fieldcraft.context().mounted,b.id);
 assert.ok(g.fieldcraft.control());assert.ok(g.arsenal134.deploy(item.uid).ok);assert.ok(g.fieldcraft.control(b));const placed=g.arsenal134.snapshot();assert.equal(g.arsenal134.servicePost(item.uid,'pickup').ok,false);assert.deepEqual(g.arsenal134.snapshot(),placed);
 assert.ok(g.fieldcraft.control());assert.ok(g.arsenal134.servicePost(item.uid,'pickup').ok);assert.equal(g.arsenal134.snapshot().posts.length,0);assert.equal(g.arsenal134.snapshot().carried.filter(i=>i.uid===item.uid).length,1);assert.deepEqual(g.resources,stock);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.arsenal134.snapshot().carried.filter(i=>i.uid===item.uid).length,1);
});
