'use strict';
// The shipped HTML and input path, under the shared simulated DOM.
const assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.DEADWALL_QA_ROOT||path.resolve(__dirname,'..');
const {bootDocument134}=require(path.join(root,'scripts/qa-startup134.cjs'));
const {standAt}=require(path.join(root,'tests/helpers/physical-fixtures.cjs'));
const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.phaseTime=999;
const C=globalThis.DeadwallCore,scenario=process.argv[2];
function reload(){g.player.carry.ammo=20;g.player.magazine.pistol=0;g.startReload();assert.equal(g.player.reload,1.35);}
function action(){g.input.keys.add('KeyE');g.updatePlayer(.04);g.releaseInputs();}
function finishReload(){for(let i=0;i<100&&g.player.reload>0;i++)g.updatePlayer(.04);assert.equal(g.player.reload,0);assert.equal(g.player.magazine.pistol,C.WEAPONS.pistol.magazine);}
function persist(){const bag={...g.player.carry};assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.player.carry,bag);}
let before,after;
if(scenario==='harvest'){
 const node=g.world.nodes.find(n=>n.type==='wood'&&!n.depleted&&g.fieldcraft.service(g.player,n));assert.ok(node);standAt(g,g.player,node);reload();
 before={amount:node.amount,bag:g.player.carry.wood,gathered:g.stats.gathered};action();after={amount:node.amount,bag:g.player.carry.wood,gathered:g.stats.gathered};
 assert.ok(g.player.reload>0);assert.deepEqual(after,before,'La récolte attend la fin de la vraie recharge.');assert.match(g.interactionText,/recharg/i);
 finishReload();action();assert.ok(g.player.carry.wood>before.bag);assert.ok(node.amount<before.amount);assert.ok(g.stats.gathered>before.gathered);persist();
}else if(scenario==='deposit'){
 standAt(g,g.player,g.core());g.player.carry.wood=3.125;reload();before={stock:g.resources.wood,bag:g.player.carry.wood,deposited:g.depositedResources};action();after={stock:g.resources.wood,bag:g.player.carry.wood,deposited:g.depositedResources};
 assert.ok(g.player.reload>0);assert.deepEqual(after,before,'E ne contourne pas le verrou du dépôt pendant la recharge.');finishReload();const total=C.bagTotal(g.player.carry);action();assert.equal(g.player.carry.wood,0);assert.equal(g.resources.wood,before.stock+3.125);assert.equal(g.depositedResources,before.deposited+total);persist();
}else if(scenario==='build'){
 const core=g.core();let b;
 for(let r=10;r<22&&!b;r++)for(const[dx,dy]of[[r,0],[-r,0],[0,r],[0,-r]]){const gx=core.gx+dx,gy=core.gy+dy;if(!g.world.placement(C.BUILDINGS.house,gx,gy,0).valid)continue;const placed=new(core.constructor)(g.nextId++,'house',gx,gy,0,.2);g.world.add(placed);if(g.fieldcraft.service(g.player,placed)){b=placed;break;}g.world.remove(placed);}
 assert.ok(b);standAt(g,g.player,b);reload();before={progress:b.progress,health:b.health};action();after={progress:b.progress,health:b.health};
 assert.ok(g.player.reload>0);assert.deepEqual(after,before,'Le chantier manuel attend ; les ouvriers ne sont pas simulés dans ce pas joueur.');finishReload();action();assert.ok(b.progress>before.progress);const id=b.id,progress=b.progress;persist();assert.equal(g.world.buildings.get(id).progress,progress);
}else if(scenario==='expedition'){
 const core=g.core();let garage;
 for(let r=4;r<22&&!garage;r++)for(const[dx,dy]of[[r,0],[-r,0],[0,r],[0,-r]]){const gx=core.gx+dx,gy=core.gy+dy;if(g.world.placement(C.BUILDINGS.expeditionGarage,gx,gy,0).valid){garage=new(core.constructor)(g.nextId++,'expeditionGarage',gx,gy,0,1);g.world.add(garage);break;}}
 assert.ok(garage);g.refreshMetrics(true);standAt(g,g.player,core);g.resources.wood=g.resources.scrap=300;assert.equal(g.expeditions.buildCar().ok,true);
 const raw=g.serialize(),site=raw.expeditions.sites.find(s=>s.known),def=C.Expeditions.BY_ID[site.id];assert.ok(site&&def);
 raw.expeditions.active={id:site.id,wave:g.wave};assert.equal(g.restoreSave(raw),true);standAt(g,g.player,{...def,renderSize:86,fixture:true});reload();before=g.expeditions.snapshot().sites.find(s=>s.id===site.id).progress;action();after=g.expeditions.snapshot().sites.find(s=>s.id===site.id).progress;
 assert.ok(g.player.reload>0);assert.equal(after,before,'La sortie encore active ne doit pas prendre E avant le verrou commun.');finishReload();action();assert.ok(g.expeditions.snapshot().sites.find(s=>s.id===site.id).progress>before);const progress=g.expeditions.snapshot().sites.find(s=>s.id===site.id).progress;persist();assert.equal(g.expeditions.snapshot().sites.find(s=>s.id===site.id).progress,progress);
}else throw Error('Unknown scenario: '+scenario);
process.stdout.write(JSON.stringify({scenario,status:'passed',browser:false,before,after,reloadCompleted:true,saveRoundTrip:true},null,2)+'\n');
