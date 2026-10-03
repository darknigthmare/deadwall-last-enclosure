'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');

function boot(){const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();return g;}
function parts(){return{C:globalThis.DeadwallCore,G:globalThis.DeadwallFrontierGeometry,I:globalThis.DeadwallInterventions134,B:globalThis.DeadwallBarricades134,S:globalThis.DeadwallFrontierSurvey};}
function approachObject(g,o){const {C,S}=parts(),w=g.frontier.world();for(let d=.4;d<3.6;d+=.2)for(let i=0;i<48;i++){const p={x:o.x+Math.cos(i*Math.PI/24)*d,y:o.y+Math.sin(i*Math.PI/24)*d,z:o.z,inside:o.poi};if(!w.blocked(p.x,p.y,.32,p.z,p.inside)&&S.targets(w,p,{},C.InterventionRules134.reach).some(t=>t.id===o.id))return p;}throw Error('Aucun accès réel à '+o.id);}
function visit(g,site,point){const d=g.serialize(),w=g.frontier.world();Object.assign(d.frontier,{active:true,...point,anchor:{x:g.player.x,y:g.player.y},car:null});if(!d.frontier.seen.includes(site.id))d.frontier.seen.push(site.id);for(let i=0;i<w.threatCount(site);i++)d.frontier.enemies[site.id+':e'+i]=0;d.frontier.kills=Object.values(d.frontier.enemies).filter(v=>v===0).length;assert.equal(g.restoreSave(d),true);assert.equal(g.frontier.world().blocked(point.x,point.y,.32,point.z,point.inside),false,'Fixture physiquement libre');}
function generator(g,multilevel=false){const {I}=parts(),w=g.frontier.world(),site=w.pois.find(p=>(!multilevel||p.levels.length>1)&&p.levels.some(z=>w.plan(p,z).objects.some(o=>o.kind==='generator'))),z=site.levels.find(z=>w.plan(site,z).objects.some(o=>o.kind==='generator')),o=I.objectIn(w,w.plan(site,z).objects.find(o=>o.kind==='generator').id);return{site,o};}
function solve(g){let count=0;while(g.interventions134.busy()&&count++<8){const s=g.interventions134.view().session;if(s.type==='panel'){for(let i=0;i<s.switches.length;i++)if(s.switches[i]!==s.desired[i])assert.ok(g.interventions134.act('toggle',i).ok);}else if(s.type==='generator')assert.ok(g.interventions134.act('adjust',s.target-s.dial).ok);else{for(let i=0;i<s.notches&&g.interventions134.view().session.feedback!=='souple';i++)g.interventions134.act('adjust',1);}assert.ok(g.interventions134.act('confirm').ok);}assert.equal(g.interventions134.busy(),false);}
function panelPoint(g,site,z){const {G,C}=parts(),w=g.frontier.world(),q=G.global(site,site.w/2+1.05,1.1);for(let d=.35;d<=C.InterventionRules134.reach;d+=.15)for(let i=0;i<32;i++){const p={x:q.x+Math.cos(i*Math.PI/16)*d,y:q.y+Math.sin(i*Math.PI/16)*d,z,inside:site.id},l=G.local(site,p.x,p.y);if(l.x<.32||l.y<.32||l.x>site.w-.32||l.y>site.h-.32)continue;if(!w.blocked(p.x,p.y,.32,z,site.id)&&w.line(p,q,z,site.id,null,.025))return p;}throw Error('Tableau sans accès : '+site.id+':'+z);}
function localOpening(g){const {B}=parts();for(const t of B.localTargets(g.exploration125.plan))for(const side of[1,-1]){const p={x:t.x-Math.sin(t.angle)*32*side,y:t.y+Math.cos(t.angle)*32*side};if(!g.friendlyPositionClear(g.player,p.x,p.y))continue;Object.assign(g.player,p);if(g.barricades134.eligibility('build',t.id,'planks').ok)return t;}throw Error('Aucune ouverture libre');}
function work(g){for(let i=0;i<80&&g.barricades134.busy();i++)g.barricades134.step(.25);}

test('138 HTML : ravitaillement/démarrage refusés sous menace sans débit, arrêt accessible et reprise exacte',()=>{
 const g=boot(),{C}=parts(),{site,o}=generator(g);visit(g,site,approachObject(g,o));g.player.carry=C.makeBag({scrap:18,fuel:8});
 assert.ok(g.interventions134.begin(o.id).ok);solve(g);assert.equal(g.player.carry.scrap,13);
 const original=g.succession133,p=g.frontier.position();g.succession133={...original,contacts:()=>[{hp:60,z:p.z,poi:p.inside,x:p.x+1,y:p.y}]};
 const before=g.interventions134.snapshot(),fuel=g.player.carry.fuel;assert.equal(g.interventions134.refuel(o.id).ok,false);assert.equal(g.interventions134.toggle(o.id).ok,false);assert.deepEqual(g.interventions134.snapshot(),before);assert.equal(g.player.carry.fuel,fuel);
 g.succession133=original;assert.deepEqual(g.interventions134.refuel(o.id),{ok:true,amount:4});assert.ok(g.interventions134.toggle(o.id).ok);
 g.succession133={...original,contacts:()=>[{hp:60,z:p.z,poi:p.inside,x:p.x+1,y:p.y}]};assert.ok(g.interventions134.toggle(o.id).ok,'Arrêt d’urgence sans ravitaillement');assert.equal(g.interventions134.toggle(o.id).ok,false,'Redémarrage refusé sous menace');g.succession133=original;
 const saved=g.serialize();assert.equal(g.restoreSave(saved),true);assert.deepEqual(g.interventions134.snapshot(),saved.expansions127.modules.interventions134);assert.equal(g.player.carry.fuel,4);
});

test('138 HTML : placement et rechargement refusent le début, mains occupées interrompent le diagnostic payé une fois',()=>{
 const g=boot(),{C}=parts(),{site,o}=generator(g);visit(g,site,approachObject(g,o));g.player.carry=C.makeBag({scrap:18,fuel:8});const before=g.interventions134.snapshot();
 g.selectedBuild='woodWall';assert.equal(g.interventions134.begin(o.id).ok,false);assert.equal(g.player.carry.scrap,18);assert.deepEqual(g.interventions134.snapshot(),before);g.cancelPlacement();
 assert.ok(g.interventions134.begin(o.id).ok);const cost=g.player.carry.scrap;g.player.reload=1;assert.equal(g.interventions134.act('confirm').ok,false);assert.equal(g.interventions134.busy(),false);assert.equal(g.player.carry.scrap,cost);g.player.reload=0;
 assert.ok(g.interventions134.begin(o.id).ok);const original=g.essentials;g.essentials={...original,busy:()=>true};g.interventions134.step(.04);assert.equal(g.interventions134.busy(),false);g.essentials=original;
 assert.deepEqual(g.interventions134.snapshot().plants,{});assert.equal(g.player.carry.scrap,8);assert.equal(g.interventions134.snapshot().attempts[o.id],2);g.restoreSave(g.serialize());assert.equal(g.player.carry.scrap,8);
});

test('138 HTML : réseau réel cave/RDC, coût par tableau, panne/destruction et sauvegarde sans duplication',()=>{
 const g=boot(),{C}=parts(),{site,o}=generator(g,true);visit(g,site,approachObject(g,o));g.player.carry=C.makeBag({scrap:18,fuel:8});assert.ok(g.interventions134.begin(o.id).ok);solve(g);assert.ok(g.interventions134.refuel(o.id).ok);assert.ok(g.interventions134.toggle(o.id).ok);
 const lower=site.levels[0],other=site.levels.find(z=>z!==lower);visit(g,site,panelPoint(g,site,lower));const id=site.id+':panel:'+lower;assert.ok(g.interventions134.begin(id).ok);solve(g);assert.equal(g.player.carry.scrap,10);assert.equal(g.interventions134.powered(site.id,lower),true);assert.equal(g.interventions134.powered(site.id,other),false);
 visit(g,site,panelPoint(g,site,other));assert.equal(g.interventions134.begin(id).ok,false,'Un tableau d’un autre étage reste inaccessible');assert.ok(g.interventions134.begin(site.id+':panel:'+other).ok);solve(g);assert.equal(g.player.carry.scrap,7);assert.equal(g.interventions134.powered(site.id,other),true);
 const saved=g.serialize();g.restoreSave(saved);assert.deepEqual(g.interventions134.snapshot(),saved.expansions127.modules.interventions134);g.paused=true;const before=g.interventions134.snapshot();g.interventions134.step(.1);assert.deepEqual(g.interventions134.snapshot(),before);g.paused=false;
 const original=g.worldEvolution;g.worldEvolution={...original,structureDestroyed:id=>id===site.id||original.structureDestroyed(id)};g.interventions134.step(.04);assert.equal(g.interventions134.powered(site.id,lower),false);assert.equal(g.interventions134.powered(site.id,other),false);assert.equal(g.interventions134.snapshot().plants[o.id].on,false);assert.equal(g.interventions134.snapshot().plants[o.id].fuel,4);g.worldEvolution=original;
});

test('138 HTML : une barricade ne démarre pas pendant rechargement/placement, arrivée d’un occupant annule sans débit',()=>{
 const g=boot(),{C}=parts();g.player.carry=C.makeBag({wood:12,scrap:4});const t=localOpening(g),before={...g.player.carry};
 g.player.reload=1;assert.equal(g.barricades134.begin('build',t.id,'planks').ok,false);assert.equal(g.barricades134.busy(),false);g.player.reload=0;g.selectedBuild='woodWall';assert.equal(g.barricades134.begin('build',t.id,'planks').ok,false);g.cancelPlacement();
 assert.ok(g.barricades134.begin('build',t.id,'planks').ok);g.barricades134.step(.25);const u=g.units.find(u=>!u.dead&&u.health>0),point={x:u.x,y:u.y};Object.assign(u,{x:t.x,y:t.y});work(g);assert.equal(g.barricades134.busy(),false);assert.deepEqual(g.player.carry,before);assert.equal(g.barricades134.snapshot().records.length,0);Object.assign(u,point);
 assert.ok(g.barricades134.begin('build',t.id,'planks').ok);g.barricades134.step(.25);const saved=g.serialize();g.restoreSave(saved);assert.equal(g.barricades134.busy(),false);assert.deepEqual(g.player.carry,before);assert.equal(g.barricades134.snapshot().records.length,0);
 assert.ok(g.barricades134.begin('build',t.id,'planks').ok);work(g);assert.equal(g.player.carry.wood,6);assert.equal(g.player.carry.scrap,3);assert.equal(g.friendlyPositionClear(g.player,t.x,t.y),false);g.restoreSave(g.serialize());assert.equal(g.barricades134.snapshot().records.length,1);
});

test('138 HTML : occupation locale utilise le rayon du véhicule, bloque aussi les camions logistiques',()=>{
 const g=boot(),{C,B,G}=parts(),d=g.serialize();d.expeditions.vehicle={id:d.nextId++,x:g.player.x+150,y:g.player.y,health:300,fuel:0,angle:0,driving:false,cargo:C.makeBag()};d.expeditions.stats.built=1;g.restoreSave(d);g.player.carry=C.makeBag({wood:12,scrap:4});
 const car=g.expeditions.car(),profile=g.worldEvolution.vehicleProfile(),r=g.expeditions.entity().radius;let chosen;
 for(const t of B.localTargets(g.exploration125.plan)){for(const side of[1,-1]){const p={x:t.x-Math.sin(t.angle)*32*side,y:t.y+Math.cos(t.angle)*32*side};if(!g.friendlyPositionClear(g.player,p.x,p.y))continue;Object.assign(g.player,p);for(let distance=30;distance<100;distance+=5){const q={x:t.x+Math.sin(t.angle)*distance*side,y:t.y-Math.cos(t.angle)*distance*side};if(!g.expeditions.carClear(q.x,q.y))continue;Object.assign(car,q);if(!B.hitCircle(t,q.x,q.y,r)&&G.obb({x:q.x,y:q.y,a:0,w:profile.w*32,h:profile.h*32},{x:t.x,y:t.y,a:t.angle,w:t.width,h:C.BarricadeRules134.thickness*32})){chosen=t;break;}}if(chosen)break;}if(chosen)break;}
 assert.ok(chosen,'Emplacement libre que l’ancien rectangle fictif refusait');assert.equal(g.barricades134.eligibility('build',chosen.id,'planks').ok,true);
 const parked={x:car.x,y:car.y};Object.assign(car,{x:chosen.x,y:chosen.y});assert.equal(g.expeditions.carClear(car.x,car.y),true,'Véhicule réellement logeable dans cette ouverture');assert.equal(g.barricades134.eligibility('build',chosen.id,'planks').ok,false);Object.assign(car,parked);
 const territories=g.territories;g.territories={...territories,truckEntities:()=>[{id:'prepared-truck',health:100,radius:18,x:chosen.x,y:chosen.y}]};assert.equal(g.barricades134.eligibility('build',chosen.id,'planks').ok,false,'Convoi présent dans la même emprise');g.territories=territories;
 assert.ok(g.barricades134.begin('build',chosen.id,'planks').ok);work(g);assert.equal(g.player.carry.wood,6);assert.equal(g.player.carry.scrap,3);assert.equal(g.expeditions.carClear(parked.x,parked.y),true,'Le véhicule libre reste libre après la pose');g.restoreSave(g.serialize());assert.equal(g.expeditions.entity().radius,r);assert.equal(g.barricades134.snapshot().records.length,1);
});
