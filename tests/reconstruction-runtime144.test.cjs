'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),Kit=require('../src/expansion-kit.js'),Fort=require('../src/fortification-pack.js');
const stable=g=>{const data=g.serialize();delete data.timestamp;return JSON.stringify(data);};
function fresh(){const env=bootGame(),g=env.game;Kit.install(g);Fort.install(g);g.startNew('standard','17117');g.world.nodes.forEach(n=>{n.amount=0;n.depleted=true;});g.units=[];g.resources.wood=g.resources.scrap=g.resources.stone=400;return env;}
function add(g,type='house',gx=74,gy=70,rotation=0){const b=new(g.core().constructor)(g.nextId++,type,gx,gy,rotation,1);g.world.add(b);g.refreshMetrics(true);return b;}
function ruin(g,type='house',rotation=0){const b=add(g,type,74,70,rotation);const point=standAt(g,g.player,b);g.destroyBuilding(b);g.refreshMetrics(true);g.player.x=point.x;g.player.y=point.y;return b;}
function prepare(g,b){const q=g.infrastructure.rebuild(b.id);assert.equal(q.ok,true,q.reason);assert.equal(q.confirm,true);return q;}

test('reconstruction : phase d’alerte et rechargement refusés sans débit',()=>{
 const{game:g}=fresh(),b=ruin(g);for(const phase of ['warning','assault']){g.phase=phase;const before=stable(g);assert.equal(g.infrastructure.reconstructionStatus(b.id).ok,false);assert.equal(g.infrastructure.rebuild(b.id).ok,false);assert.equal(stable(g),before);}
 g.phase='calm';g.player.reload=1;const before=stable(g);assert.equal(g.infrastructure.rebuild(b.id).ok,false);assert.equal(stable(g),before);assert.equal(g.player.reload,1);
});
test('reconstruction : devis et annulation ne changent ni campagne, ni matériaux, ni débris',()=>{
 const{game:g}=fresh(),b=ruin(g),before=stable(g),q=prepare(g,b);assert.deepEqual(q.cost,C.BUILDINGS.house.cost);assert.match(q.reason,/coût intégral|Coût intégral/);assert.match(q.reason,/débris/);assert.equal(stable(g),before);assert.equal(g.world.atCell(b.gx,b.gy),null);
 assert.equal(g.infrastructure.cancelRebuild(),true);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,false);assert.equal(stable(g),before);
});
test('reconstruction : coût entier unique, nouvel ID, priorité haute et vrai travail avant logements',()=>{
 const{game:g}=fresh(),b=ruin(g),housing=g.housing,stock={...g.resources},debris=g.fortificationPack.snapshot().debris;prepare(g,b);
 const result=g.infrastructure.confirmRebuild(b.id);assert.equal(result.ok,true,result.reason);const next=g.world.atCell(b.gx,b.gy);assert.notEqual(next.id,b.id);assert.equal(next.type,b.type);assert.equal(next.progress,0);assert.equal(next.priority,3);assert.equal(g.housing,housing);assert.equal(g.infrastructure.snapshot().stats.reconstructed,1);
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],stock[key]-(C.BUILDINGS.house.cost[key]||0));assert.deepEqual(g.fortificationPack.snapshot().debris,debris);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,false);
 standAt(g,g.player,next);g.input.keys.add('KeyE');for(let n=0;n<500&&!next.completed;n++)g.updateInteraction(.1);g.input.keys.clear();assert.equal(next.completed,true);assert.equal(g.housing,housing+C.BUILDINGS.house.housing);assert.equal(g.infrastructure.snapshot().stats.reconstructed,1);
});
test('reconstruction : stockage et énergie n’arrivent pas au financement du chantier',()=>{
 for(const [type,metric]of [['warehouse','storage'],['generator','powerGenerated']]){const{game:g}=fresh(),b=ruin(g,type),before=g[metric];prepare(g,b);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,true);const next=g.world.atCell(b.gx,b.gy);assert.equal(g[metric],before);standAt(g,g.player,next);g.input.keys.add('KeyE');for(let n=0;n<700&&!next.completed;n++)g.updateInteraction(.1);g.input.keys.clear();assert.equal(next.completed,true);assert.ok(g[metric]>before);}
});
test('reconstruction : accès physique et sécurité sont revérifiés à la confirmation',()=>{
 const{game:g}=fresh(),b=ruin(g);prepare(g,b);g.player.x=100;g.player.y=100;let before=stable(g);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,false);assert.equal(stable(g),before);
 standAt(g,g.player,b);prepare(g,b);g.spawnZombie('walker');const z=g.zombies.at(-1);z.x=g.player.x+25;z.y=g.player.y;g.rebuildBuckets();before=stable(g);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,false);assert.equal(stable(g),before);
});
test('reconstruction : obstacle et stocks changés refusent sans chantier ni débit partiel',()=>{
 const{game:g}=fresh(),b=ruin(g);prepare(g,b);g.resources.wood=C.BUILDINGS.house.cost.wood-1;let before=stable(g);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,false);assert.equal(stable(g),before);assert.equal(g.world.atCell(b.gx,b.gy),null);
 g.resources.wood=400;prepare(g,b);const obstacle=add(g,'woodWall',b.gx,b.gy);before=stable(g);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,false);assert.equal(stable(g),before);assert.equal(g.world.atCell(b.gx,b.gy),obstacle);
});
test('reconstruction : un travail concurrent et un poste manuel bloquent l’ordre',()=>{
 const{game:g}=fresh(),b=ruin(g),debris=g.fortificationPack.snapshot().debris[0];assert.equal(g.fortificationPack.startRecovery(debris.id).ok,true);let before=stable(g);assert.equal(g.infrastructure.rebuild(b.id).ok,false);assert.equal(stable(g),before);g.fortificationPack.stop();
 const post=add(g,'watchtower',b.gx-2,b.gy);standAt(g,g.player,post);assert.equal(g.fieldcraft.control(post),true);before=stable(g);assert.equal(g.infrastructure.rebuild(b.id).ok,false);assert.equal(stable(g),before);assert.equal(g.fieldcraft.context().mounted,post.id);
});
test('reconstruction : rotation, débris et chantier reprennent exactement, devis jamais sauvegardé',()=>{
 const{game:g}=fresh(),b=ruin(g,'gate',3);prepare(g,b);const pending=g.serialize(),stock={...g.resources};assert.equal(g.restoreSave(pending),true);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,false);assert.deepEqual(g.resources,stock);assert.equal(g.infrastructure.snapshot().ruins[0].rotation,3);
 prepare(g,b);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,true);const next=g.world.atCell(b.gx,b.gy);assert.equal(next.rotation,3);next.work(.5);const data=g.serialize(),before=stable(g);assert.equal(g.restoreSave(data),true);assert.equal(stable(g),before);assert.equal(g.world.atCell(b.gx,b.gy).priority,3);assert.equal(g.infrastructure.snapshot().stats.reconstructed,1);assert.equal(g.infrastructure.rebuild(b.id).ok,false);
});
test('reconstruction : occupants empêchent la mise en service selon les collisions ordinaires',()=>{
 const{game:g}=fresh(),b=ruin(g);prepare(g,b);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,true);const next=g.world.atCell(b.gx,b.gy),housing=g.housing;g.player.x=next.x;g.player.y=next.y;next.work(next.def.buildTime);assert.equal(g.completeBuilding(next),false);assert.equal(next.completed,false);assert.equal(g.housing,housing);standAt(g,g.player,next);next.work(1);assert.equal(g.completeBuilding(next),true);assert.equal(g.housing,housing+C.BUILDINGS.house.housing);
});
test('reconstruction : un refus final du placement conserve stocks, empreinte et débris',()=>{
 const{game:g}=fresh(),b=ruin(g);prepare(g,b);const before=stable(g),place=g.placeOne;try{g.placeOne=()=>false;assert.equal(g.infrastructure.confirmRebuild(b.id).ok,false);assert.equal(stable(g),before);}finally{g.placeOne=place;}
});
test('reconstruction : une porte verrouillée entre le contour et le joueur refuse l’accès',()=>{
 const{game:g}=fresh(),b=ruin(g);add(g,'woodWall',b.gx-1,b.gy);add(g,'woodWall',b.gx-1,b.gy+1);g.player.x=(b.gx-1)*C.TILE-g.player.radius-1;g.player.y=b.y;assert.equal(g.friendlyPositionClear(g.player,g.player.x,g.player.y),true);const before=stable(g),q=g.infrastructure.rebuild(b.id);assert.equal(q.ok,false);assert.match(q.reason,/accès libre/);assert.equal(stable(g),before);
});
test('reconstruction : la sécurisation est autorisée mais une absence régionale ne l’est pas',()=>{
 const{game:g}=fresh(),b=ruin(g);g.phase='aftermath';prepare(g,b);const local=g.serialize();g.player.x=2048;g.player.y=20;assert.equal(g.frontier.enter('north'),true);assert.equal(g.frontier.active(),true);const before=stable(g);assert.equal(g.infrastructure.reconstructionStatus(b.id).ok,false);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,false);assert.equal(stable(g),before);assert.equal(g.restoreSave(local),true);prepare(g,b);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,true);
});
test('reconstruction : aucune confirmation étrangère, empreinte absente ou centre détruit ne finance de chantier',()=>{
 const{game:g}=fresh(),b=ruin(g);prepare(g,b);let before=stable(g);assert.equal(g.infrastructure.confirmRebuild(b.id+1).ok,false);assert.equal(stable(g),before);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,false);assert.equal(g.infrastructure.rebuild(-1).ok,false);g.destroyBuilding(g.core());before=stable(g);assert.equal(g.gameOver,true);assert.equal(g.infrastructure.rebuild(b.id).ok,false);assert.equal(stable(g),before);assert.equal(g.infrastructure.snapshot().ruins.some(r=>r.type==='core'),false);
});
test('reconstruction : les restes récupérés après le financement restent finis et ne remboursent pas le chantier',()=>{
 const{game:g}=fresh(),b=ruin(g),debris=g.fortificationPack.snapshot().debris[0],total=C.bagTotal(debris.remaining);prepare(g,b);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,true);const stock={...g.resources};assert.equal(g.fortificationPack.startRecovery(debris.id).ok,true);for(let n=0;n<200&&g.fortificationPack.busy();n++)g.fortificationPack.step(.25);assert.ok(Math.abs(C.bagTotal(g.player.carry)-total)<1e-7);assert.deepEqual(g.resources,stock);assert.equal(g.fortificationPack.snapshot().debris.length,0);assert.equal(g.fortificationPack.startRecovery(debris.id).ok,false);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,false);
});
test('reconstruction : un croquis historique est exigé puis reconnu depuis le registre existant',()=>{
 const{game:g}=fresh();add(g,'workshop',30,30);g.urban.attain(1000);g.refreshMetrics(true);const b=ruin(g,'prefabYard'),before=stable(g);let q=g.infrastructure.rebuild(b.id);assert.equal(q.ok,false);assert.match(q.reason,/Croquis/);assert.equal(stable(g),before);
 const data=g.serialize(),site=data.dayworks.sites.find(s=>s.id==='industry-1');assert.ok(site);site.seen=true;site.survey=C.DAYWORKS_RULES.surveySeconds;data.dayworks.stats.surveyed++;assert.equal(g.restoreSave(data),true);q=prepare(g,b);assert.equal(g.infrastructure.confirmRebuild(b.id).ok,true);assert.equal(g.world.atCell(b.gx,b.gy).progress,0);
});
