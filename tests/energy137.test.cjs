'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
let g,C,G,I,S;
test.before(()=>{({g}=bootDocument134());C=globalThis.DeadwallCore;G=globalThis.DeadwallFrontierGeometry;I=globalThis.DeadwallInterventions134;S=globalThis.DeadwallFrontierSurvey;});
function start(generation=6,seed='17117'){
 g.startNew('standard',seed);g.campaignIntro132.skip();g.phaseTime=999;
 // The 137 fixtures describe G6 places. New campaigns now use G7, whose IDs
 // intentionally describe a different population; pin only this untouched save.
 if(g.frontier.position().generation!==generation){const d=g.serialize(),h=globalThis.DeadwallGeography135.home(g.world.seed,generation);assert.equal(d.frontier.active,false);assert.deepEqual(d.frontier.seen,[]);assert.deepEqual(d.frontier.taken,{});Object.assign(d.frontier,{generation,x:h.maxX+2,y:h.y,z:0,inside:null,anchor:null,car:null});assert.equal(g.restoreSave(d),true);}
 assert.equal(g.frontier.position().generation,generation);
}
function visit(p,q,z=0){const d=g.serialize(),w=g.frontier.world();Object.assign(d.frontier,{active:true,x:q.x,y:q.y,z,inside:p.id,anchor:{x:g.player.x,y:g.player.y},car:null});if(!d.frontier.seen.includes(p.id))d.frontier.seen.push(p.id);for(const site of w.nearPOI(q.x,q.y,220))for(let i=0;i<w.threatCount(site);i++){d.frontier.enemies[site.id+':e'+i]=0;delete d.frontier.tracks[site.id+':e'+i];}d.frontier.kills=Object.values(d.frontier.enemies).filter(v=>v===0).length;g.restoreSave(d);}
function approach(w,p,o){for(let d=.4;d<3;d+=.2)for(let i=0;i<32;i++){const q={x:o.x+Math.cos(i*Math.PI/16)*d,y:o.y+Math.sin(i*Math.PI/16)*d,z:o.z,inside:p.id};if(!w.blocked(q.x,q.y,.32,o.z,p.id)&&S.targets(w,q,{},C.InterventionRules134.reach).some(t=>t.id===o.id))return q;}throw Error('Objet sans accès physique '+o.id);}
function panelApproach(w,p,z){const o=G.global(p,p.w/2+1.05,1.1);for(let d=.4;d<C.InterventionRules134.reach;d+=.2)for(let i=0;i<32;i++){const q={x:o.x+Math.cos(i*Math.PI/16)*d,y:o.y+Math.sin(i*Math.PI/16)*d,z,inside:p.id};if(!w.blocked(q.x,q.y,.32,z,p.id)&&w.line(q,o,z,p.id,null,.025))return q;}throw Error('Tableau sans approche physique '+p.id+':'+z);}
function solve(){for(let guard=0;g.interventions134.busy()&&guard<8;guard++){const s=g.interventions134.view().session;if(s.type==='panel'){for(let i=0;i<s.switches.length;i++)if(s.switches[i]!==s.desired[i])assert.equal(g.interventions134.act('toggle',i).ok,true);}else assert.equal(g.interventions134.act('adjust',s.target-s.dial).ok,true);assert.equal(g.interventions134.act('confirm').ok,true);}assert.equal(g.interventions134.busy(),false);}
function supplies(scrap=5,fuel=4){assert.equal(g.loadout.transfer('depot','sac','scrap',scrap).ok,true);assert.equal(g.loadout.transfer('depot','sac','fuel',fuel).ok,true);}
function repairBasement(place=null){const w=g.frontier.world(),p=place||w.pois.find(p=>p.id==='P0479'),raw=w.plan(p,-1).objects.find(o=>o.kind==='generator'),o=I.objectIn(w,raw.id),q=approach(w,p,o);visit(p,q,-1);assert.equal(g.interventions134.begin(o.id).ok,true);solve();assert.equal(g.interventions134.refuel(o.id).ok,true);assert.equal(g.interventions134.toggle(o.id).ok,true);return{w,p,o,q};}
test('137 : un groupe révisé en cave attire le contact généré au même étage et conserve son autonomie à la reprise',()=>{
 start();supplies();const {w,p,o,q}=repairBasement();let player;
 for(let y=.7;y<p.h-.5&&!player;y+=.5)for(let x=.7;x<p.w-.5;x+=.5){const point=G.global(p,x,y);if(Math.hypot(point.x-q.x,point.y-q.y)>6&&!w.blocked(point.x,point.y,.32,-1,p.id)){player=point;break;}}
 assert.ok(player,'Point libre éloigné du moteur et du contact');
 const d=g.serialize(),id=p.id+':e2';assert.equal(p.levels[G.hash(p.id,2)%p.levels.length],-1);Object.assign(d.frontier,{...player,z:-1,inside:p.id});delete d.frontier.enemies[id];d.frontier.kills=Object.values(d.frontier.enemies).filter(v=>v===0).length;
 d.frontier.tracks[id]={x:q.x,y:q.y,z:-1,a:Math.atan2(player.y-q.y,player.x-q.x)+Math.PI,mode:'idle',ttl:0,gx:q.x,gy:q.y,cool:0};g.restoreSave(d);g.update(.04);
 const e=g.frontier.contacts().find(e=>e.id===id);assert.ok(e);assert.equal(e.mode,'investigate','Le moteur doit être audible par le contact réel placé à 1 m');assert.equal(e.gx,o.x);assert.equal(e.gy,o.y);
 const spent=g.interventions134.snapshot().plants[o.id].fuel;assert.ok(spent<4);assert.equal(g.player.carry.scrap,0);assert.equal(g.player.carry.fuel,0);
 const lower=g.serialize();assert.equal(g.restoreSave(lower),true);assert.equal(g.interventions134.snapshot().plants[o.id].fuel,spent);
 const upper={...G.global(p,p.w/2,1.1),z:0};visit(p,upper,0);g.update(.04);assert.ok(g.frontier.contacts().every(e=>e.z===0));assert.equal(g.interventions134.powered(p.id,0),false,'Le moteur seul ne rétablit pas le tableau');
});
test('137 : demander la fouille pendant une pose annule la barricade avant dépense, puis récolte le vrai contenant',()=>{
 start();assert.equal(g.loadout.transfer('depot','sac','wood',6).ok,true);assert.equal(g.loadout.transfer('depot','sac','scrap',1).ok,true);
 const w=g.frontier.world(),p=w.pois.find(p=>p.id==='P0002'),t=globalThis.DeadwallBarricades134.regionTargets(w,p,0).find(t=>t.kind==='door'),q={x:t.x-Math.sin(t.angle),y:t.y+Math.cos(t.angle),z:0,inside:p.id};
 assert.equal(w.blocked(q.x,q.y,.32,0,p.id),false);visit(p,q);const o=S.targets(w,q,{},C.Frontier.RULES.lootReach)[0];assert.equal(o.kind,'sofa');assert.equal(g.interventions134.blocksLoot(o),false);
 assert.equal(g.barricades134.begin('build',t.id,'planks').ok,true);g.input.keys.add('KeyE');g.update(.04);g.input.keys.delete('KeyE');
 assert.equal(g.barricades134.busy(),false,'Une seule tâche manuelle doit rester active');assert.equal(g.barricades134.snapshot().records.length,0);assert.equal(g.player.carry.scrap,1);assert.ok(g.frontier.takenAmount(o.id)>0);assert.ok(g.player.carry.wood>6);
 assert.equal(g.barricades134.begin('build',t.id,'planks').ok,true);for(let i=0;i<160&&g.barricades134.busy();i++)g.update(.04);
 assert.equal(g.barricades134.busy(),false);assert.equal(g.barricades134.snapshot().records.length,1);assert.equal(g.player.carry.scrap,0);assert.equal(g.frontier.world().blocked(t.x,t.y,.2,0,p.id),true);
 assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.barricades134.snapshot().records.length,1);
});
test('137 : moteur et tableau alimentent réellement le lave-linge, les lumières et la collecte E, avec arrêt immédiat',()=>{
 start();supplies(8,4);const {w,p,o,q}=repairBasement(),panel=G.global(p,p.w/2+1.05,1.1);
 assert.equal(w.blocked(panel.x,panel.y,.32,-1,p.id),false);visit(p,panel,-1);assert.equal(g.interventions134.begin(p.id+':panel:-1').ok,true);solve();
 assert.equal(g.interventions134.powered(p.id,-1),true);assert.equal(g.interventions134.powered(p.id,0),false);assert.ok(g.interventions134.lights().some(l=>l.inside===p.id&&l.z===-1));
 const machine=I.objectIn(w,w.plan(p,-1).objects.find(o=>o.kind==='washer').id),machinePoint=approach(w,p,machine);
 function collect(){visit(p,machinePoint,-1);g.update(.04);for(let i=0;i<16&&g.frontier.overview().focus?.id!==machine.id;i++)g.frontier.cycle();assert.equal(g.frontier.overview().focus.id,machine.id);const before=g.frontier.takenAmount(machine.id);g.input.keys.add('KeyE');g.update(.04);g.input.keys.delete('KeyE');return g.frontier.takenAmount(machine.id)-before;}
 const powered=collect();assert.ok(powered>0);visit(p,q,-1);assert.equal(g.interventions134.toggle(o.id).ok,true);assert.equal(g.interventions134.powered(p.id,-1),false);assert.equal(g.interventions134.lights().length,0);
 const fuel=g.interventions134.snapshot().plants[o.id].fuel,manual=collect();assert.ok(Math.abs(powered/manual-C.InterventionRules134.powerHarvestFactor)<1e-9,'Le bonus agit sur le prélèvement réel, pas uniquement sur le texte');assert.equal(g.interventions134.snapshot().plants[o.id].fuel,fuel);
 assert.equal(g.player.carry.scrap,powered+manual);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.interventions134.powered(p.id,-1),false);assert.equal(g.frontier.takenAmount(machine.id),powered+manual);
});
test('141 G7 : une cave miroir réelle conserve moteur, tableau, bonus de collecte et arrêt après sauvegarde',()=>{
 start(7,'84329');supplies(8,4);const world=g.frontier.world(),place=world.pois.find(p=>G.layoutVariant(p)===1&&p.levels.includes(-1)&&world.plan(p,-1).objects.some(o=>o.kind==='generator')&&world.plan(p,-1).objects.some(o=>o.kind==='washer'));
 assert.ok(place,'La graine doit contenir une cave miroir avec groupe et lave-linge réels');assert.equal(place.generation,7);
 const {w,p,o,q}=repairBasement(place),panel=panelApproach(w,p,-1);
 assert.equal(w.blocked(panel.x,panel.y,.32,-1,p.id),false);visit(p,panel,-1);assert.equal(g.interventions134.begin(p.id+':panel:-1').ok,true);solve();
 assert.equal(g.interventions134.powered(p.id,-1),true);assert.equal(g.interventions134.powered(p.id,0),false);assert.ok(g.interventions134.lights().some(l=>l.inside===p.id&&l.z===-1));
 const machine=I.objectIn(w,w.plan(p,-1).objects.find(o=>o.kind==='washer').id),machinePoint=approach(w,p,machine);
 function collect(){visit(p,machinePoint,-1);g.update(.04);for(let i=0;i<16&&g.frontier.overview().focus?.id!==machine.id;i++)g.frontier.cycle();assert.equal(g.frontier.overview().focus.id,machine.id);const before=g.frontier.takenAmount(machine.id);g.input.keys.add('KeyE');g.update(.04);g.input.keys.delete('KeyE');return g.frontier.takenAmount(machine.id)-before;}
 const powered=collect();assert.ok(powered>0);const running=g.serialize(),fuel=g.interventions134.snapshot().plants[o.id].fuel;assert.equal(g.restoreSave(running),true);assert.equal(g.frontier.position().generation,7);assert.equal(g.frontier.position().inside,p.id);assert.equal(g.frontier.position().z,-1);assert.equal(g.interventions134.powered(p.id,-1),true);assert.equal(g.interventions134.snapshot().plants[o.id].fuel,fuel);assert.equal(g.frontier.takenAmount(machine.id),powered);
 visit(p,q,-1);assert.equal(g.interventions134.toggle(o.id).ok,true);assert.equal(g.interventions134.powered(p.id,-1),false);assert.equal(g.interventions134.lights().length,0);
 const stopped=g.interventions134.snapshot().plants[o.id].fuel,manual=collect();assert.ok(manual>0);assert.ok(Math.abs(powered/manual-C.InterventionRules134.powerHarvestFactor)<1e-9);assert.equal(g.interventions134.snapshot().plants[o.id].fuel,stopped);assert.equal(g.player.carry.scrap,powered+manual);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.interventions134.powered(p.id,-1),false);assert.equal(g.frontier.takenAmount(machine.id),powered+manual);
});
test('141 G7 : une porte miroir accessible interrompt la pose pour une vraie fouille puis conserve sa collision payée',()=>{
 start(7);assert.equal(g.loadout.transfer('depot','sac','wood',6).ok,true);assert.equal(g.loadout.transfer('depot','sac','scrap',1).ok,true);const w=g.frontier.world(),B=globalThis.DeadwallBarricades134;let fixture;
 for(const p of w.pois){if(G.layoutVariant(p)!==1)continue;for(const t of B.regionTargets(w,p,0).filter(t=>t.kind==='door')){for(const sign of[1,-1]){const q={x:t.x-Math.sin(t.angle)*sign,y:t.y+Math.cos(t.angle)*sign,z:0,inside:p.id};if(w.blocked(q.x,q.y,.32,0,p.id)||!w.line(q,t,0,p.id,null,.025))continue;const o=S.targets(w,q,{},C.Frontier.RULES.lootReach)[0];if(o?.resource==='wood'&&!g.interventions134.blocksLoot(o)){fixture={p,t,q,o};break;}}if(fixture)break;}if(fixture)break;}
 assert.ok(fixture,'Une porte réelle et un contenant libre doivent partager une approche physique');const {p,t,q,o}=fixture;assert.equal(p.generation,7);assert.equal(G.layoutVariant(p),1);assert.equal(w.blocked(t.x,t.y,.2,0,p.id),false);visit(p,q);g.update(.04);assert.equal(g.frontier.overview().focus.id,o.id);
 assert.equal(g.barricades134.begin('build',t.id,'planks').ok,true);g.input.keys.add('KeyE');g.update(.04);g.input.keys.delete('KeyE');assert.equal(g.barricades134.busy(),false);assert.equal(g.barricades134.snapshot().records.length,0);assert.equal(g.player.carry.scrap,1);const harvested=g.frontier.takenAmount(o.id);assert.ok(harvested>0);assert.ok(g.player.carry.wood>6);
 assert.equal(g.barricades134.begin('build',t.id,'planks').ok,true);for(let i=0;i<160&&g.barricades134.busy();i++)g.update(.04);assert.equal(g.barricades134.busy(),false);assert.equal(g.barricades134.snapshot().records.length,1);assert.equal(g.player.carry.scrap,0);assert.equal(g.frontier.world().blocked(t.x,t.y,.2,0,p.id),true);
 const record=g.barricades134.snapshot().records[0];assert.equal(record.target,t.id);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.frontier.position().generation,7);assert.deepEqual(g.barricades134.snapshot().records,[record]);assert.equal(g.frontier.world().blocked(t.x,t.y,.2,0,p.id),true);assert.equal(g.frontier.takenAmount(o.id),harvested);
});
