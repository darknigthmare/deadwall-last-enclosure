'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
let g,C;
test.before(()=>{({g}=bootDocument134());C=globalThis.DeadwallCore;});
function start(){g.startNew('standard','17117');g.campaignIntro132.skip();g.phaseTime=999;g.player.invulnerable=0;}
function pressMelee(){g.input.pressed.add('Space');g.handlePressed();g.input.pressed.clear();}
function advanceUntil(done,limit=1000){for(let i=0;i<limit&&!done();i++)g.update(.04);assert.equal(done(),true,'La simulation termine l’action engagée.');}
function finishWork(){for(let i=0;i<1000&&g.arsenal134.busy();i++)g.arsenal134.step(.04);assert.equal(g.arsenal134.busy(),false);}
function craft(id){const q=g.arsenal134.preview('craft',id);assert.ok(q.ok,q.reason);const stock={...g.resources};assert.equal(g.arsenal134.begin('craft',id).ok,true);finishWork();for(const[k,v]of Object.entries(q.cost))assert.equal(g.resources[k],stock[k]-v);const item=g.arsenal134.snapshot().locker.find(i=>i.id===id);assert.ok(item);assert.equal(item.rounds,0);assert.equal(g.arsenal134.transfer(item.uid,'carried').ok,true);return item;}
function fire(){g.player.shootCooldown=0;g.shootPlayer();}
function freeDeployment(){const R=C.Arsenal134Rules;for(let y=1800;y<2500;y+=35)for(let x=1750;x<2750;x+=35){const p={x:x+R.deployDistance,y};if(!g.friendlyPositionClear(g.player,x,y)||!g.friendlyPositionClear({radius:R.postRadius},p.x,p.y)||!g.nightGear.localLineClear({x,y},p))continue;Object.assign(g.player,{x,y,facing:0});return;}throw Error('Aucun emplacement libre.');}

test('137 : la crosse locale attend la fin du rechargement, y compris après sauvegarde',()=>{
 start();fire();const rounds=g.player.magazine.pistol,ammo=g.resources.ammo;g.startReload();assert.ok(g.player.reload>0);const saved=g.serialize();assert.equal(g.restoreSave(saved),true);
 pressMelee();assert.equal(g.player.meleeCooldown,0,'Pas de frappe pendant la recharge.');assert.equal(g.player.magazine.pistol,rounds);assert.equal(g.resources.ammo,ammo);
 advanceUntil(()=>g.player.reload===0);assert.equal(g.player.magazine.pistol,12);assert.equal(g.resources.ammo,ammo-1);pressMelee();assert.ok(g.player.meleeCooldown>0,'La crosse reste disponible après la recharge.');
});

test('137 : crosse et mains libres ne frappent pas pendant un assemblage payé à son terme',()=>{
 for(const unarmed of [false,true]){start();if(unarmed)for(const i of g.arsenal134.snapshot().carried)assert.equal(g.arsenal134.transfer(i.uid,'locker').ok,true);
  const stock=g.resources.wood,rounds={...g.player.magazine};assert.equal(g.arsenal134.begin('craft','plank').ok,true);pressMelee();assert.equal(g.player.meleeCooldown,0);assert.deepEqual(g.player.magazine,rounds);assert.equal(g.resources.wood,stock);assert.equal(g.arsenal134.busy(),true);
  finishWork();assert.equal(g.resources.wood,stock-C.Arsenal134Rules.catalog.plank.cost.wood);assert.equal(g.arsenal134.snapshot().locker.filter(i=>i.id==='plank').length,1);assert.equal(g.save(false),true);
 }
});

test('137 : poser et reprendre un poste attendent la recharge sans perdre objet ni munitions',()=>{
 start();const post=craft('spikeFrame');assert.equal(g.loadout.transfer('depot','sac','ammo',3).ok,true);freeDeployment();fire();g.startReload();assert.ok(g.player.reload>0);const before=g.arsenal134.snapshot(),bag={...g.player.carry};
 assert.equal(g.arsenal134.deploy(post.uid).ok,false);assert.deepEqual(g.arsenal134.snapshot(),before);assert.deepEqual(g.player.carry,bag);
 advanceUntil(()=>g.player.reload===0);assert.equal(g.arsenal134.deploy(post.uid).ok,true);assert.equal(g.arsenal134.snapshot().posts.length,1);
 fire();g.startReload();assert.ok(g.player.reload>0);const placed=g.arsenal134.snapshot();assert.equal(g.arsenal134.servicePost(post.uid,'pickup').ok,false);assert.deepEqual(g.arsenal134.snapshot(),placed);
 assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.arsenal134.servicePost(post.uid,'pickup').ok,false);advanceUntil(()=>g.player.reload===0);assert.equal(g.arsenal134.servicePost(post.uid,'pickup').ok,true);assert.equal(g.arsenal134.snapshot().posts.length,0);assert.equal(g.arsenal134.snapshot().carried.filter(i=>i.uid===post.uid).length,1);assert.equal(g.player.carry.ammo,1);assert.equal(g.save(false),true);
});

test('137 : une frappe multicible blesse chacun des infectés sélectionnés dans une horde serrée',()=>{
 start();const item=craft('plank');assert.equal(g.arsenal134.equip(item.uid).ok,true);
 g.player.x=4058;g.player.y=2048;assert.equal(g.frontier.enter(),true);g.update(.04);
 const w=g.frontier.world(),home=w.home;let point;
 for(const r of w.roads){const p={x:(r.a.x+r.b.x)/2,y:(r.a.y+r.b.y)/2};if(Math.hypot(p.x-home.x,p.y-home.y)<800||w.nearPOI(p.x,p.y,120).length)continue;if([0,1,1.25].every(dx=>!w.blocked(p.x+dx,p.y,.4,0,null))&&w.line(p,{x:p.x+1.25,y:p.y},0,null,null,.015)){point=p;break;}}
 assert.ok(point,'La rencontre préparée respecte un sol ouvert du vrai monde G6.');
 const prepared=g.serialize(),h=prepared.worldEvolution.groups[0];assert.ok(h,'Horde créée par le système existant.');
 Object.assign(prepared.frontier,{x:point.x,y:point.y,a:0,z:0,inside:null});Object.assign(h,{x:point.x+1,y:point.y,kind:'resting',contacts:{},injuries:{},fallen:[],lost:0,wound:0});
 for(const[index,dx]of [[0,1],[1,1.25]])h.contacts[index]={x:point.x+dx,y:point.y,z:0,a:Math.PI,mode:'idle',ttl:0,gx:point.x+dx,gy:point.y,cool:0};
 assert.equal(g.restoreSave(prepared),true);assert.equal(g.worldEvolution.groupMembers().filter(e=>e.group.id===h.id).length,2);const condition=g.arsenal134.snapshot().carried.find(i=>i.uid===item.uid).condition,stamina=g.player.stamina;
 pressMelee();const after=g.worldEvolution.snapshot().groups.find(group=>group.id===h.id),damage=C.Arsenal134Rules.catalog.plank.damage;
 assert.deepEqual(after.injuries,{'0':damage,'1':damage},'Deux victimes distinctes, sans doubler le coup sur la première.');assert.equal(g.player.stamina,stamina-C.Arsenal134Rules.catalog.plank.stamina);assert.equal(g.arsenal134.snapshot().carried.find(i=>i.uid===item.uid).condition,condition-C.Arsenal134Rules.catalog.plank.wear);
 assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(g.worldEvolution.snapshot().groups.find(group=>group.id===h.id).injuries,after.injuries);
});
