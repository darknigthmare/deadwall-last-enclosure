'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
let env,g,C,G,B,I,S;
test.before(()=>{env=bootDocument134();g=env.g;C=globalThis.DeadwallCore;G=globalThis.DeadwallFrontierGeometry;B=globalThis.DeadwallBiomes135;I=globalThis.DeadwallInterventions134;S=globalThis.DeadwallFrontierSurvey;});
function begin(){g.startNew('standard','17117');g.campaignIntro132.skip();require('./helpers/generation141.cjs').legacy(g);assert.equal(g.frontier.world().generation,6);}
// Prepared encounter/workshop fixtures: real generated geometry and IDs, with
// nearby threats explicitly cleared to isolate the interaction being verified.
function visit(p,point,z=0,keep=null){
 const d=g.serialize(),w=g.frontier.world();Object.assign(d.frontier,{active:true,x:point.x,y:point.y,z,inside:p.id,anchor:{x:g.player.x,y:g.player.y},car:null});
 if(!d.frontier.seen.includes(p.id))d.frontier.seen.push(p.id);
 for(const site of w.nearPOI(point.x,point.y,220))for(let i=0;i<w.threatCount(site);i++){const id=site.id+':e'+i;if(id!==keep){d.frontier.enemies[id]=0;delete d.frontier.tracks[id];}}
 d.frontier.kills=Object.values(d.frontier.enemies).filter(v=>v===0).length;g.restoreSave(d);
}
function nearObject(w,p,o,z){
 for(let d=.4;d<3;d+=.25)for(let i=0;i<32;i++){
  const q={x:o.x+Math.cos(i*Math.PI/16)*d,y:o.y+Math.sin(i*Math.PI/16)*d,z,inside:p.id},lp=G.local(p,q.x,q.y);
  if(lp.x<.35||lp.y<.35||lp.x>p.w-.35||lp.y>p.h-.35||w.blocked(q.x,q.y,.32,z,p.id))continue;
  if(S.targets(w,q,{},1.7).some(t=>t.id===o.id))return q;
 }
 return null;
}
function click(id){const n=env.doc.getElementById(id);assert.ok(env.doc.body.contains(n),'Contrôle monté '+id);assert.equal(n.disabled,false,id);n.click();}
function solve(id){
 assert.equal(g.interventionsUI134.open(),true);click('interventions134Action-work-'+id);assert.equal(g.interventions134.busy(),true);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);
 for(let n=0;n<8&&g.interventions134.busy();n++){
  let s=g.interventions134.view().session;
  if(s.type==='panel'){for(let i=0;i<4;i++)if(s.switches[i]!==s.desired[i])click('interventions134Switch-'+i);}
  else for(let i=0;i<7;i++){s=g.interventions134.view().session;if(s.type==='lock'?s.feedback==='souple':s.dial===s.target)break;click('interventions134Right');}
  click('interventions134Confirm');
 }
 assert.equal(g.interventions134.busy(),false);
}
test('135 G6 : infecté profilé, tir réel, blessure persistante, limites de vie et attaque de contact',()=>{
 begin();const w=g.frontier.world();let site,id,profile;
 for(const p of w.pois){for(let i=0;i<w.threatCount(p);i++){
  if(p.levels[G.hash(p.id,i)%p.levels.length]!==0)continue;const key=p.id+':e'+i,q=B.enemyProfile(w.seed,p.x,p.y,key);
  if(q.kind==='runner'){site=p;id=key;profile=q;break;}
 }if(site)break;}
 assert.ok(site,'Un infecté récent réellement généré');visit(site,G.global(site,site.w/2,-3),0,id);g.update(.04);
 let e=g.frontier.contacts().find(e=>e.id===id);assert.ok(e,'Contact apparu depuis le site G6');
 assert.equal(e.kind,profile.kind);assert.equal(e.maxHealth,profile.health);assert.equal(e.hp,profile.health);assert.equal(e.biomeProfile.speed,profile.speed);assert.equal(e.biomeProfile.damage,profile.damage);assert.equal(e.biomeProfile.interval,profile.interval);
 let firing;
 for(let i=0;i<48;i++){const q={x:e.x+Math.cos(i*Math.PI/24)*2,y:e.y+Math.sin(i*Math.PI/24)*2};if(!w.blocked(q.x,q.y,.32,0,site.id)&&w.line(q,e,0,site.id,null,.04)){firing=q;break;}}
 assert.ok(firing,'Ligne de tir dégagée');visit(site,firing,0,id);g.update(.04);e=g.frontier.contacts().find(e=>e.id===id);
 const d=g.serialize();d.frontier.a=Math.atan2(e.y-d.frontier.y,e.x-d.frontier.x);g.restoreSave(d);
 const rounds=g.player.magazine[g.player.weapon],damage=g.arsenal134.weaponSpec().damage;assert.ok(rounds>0);assert.equal(g.frontier.shoot(),true);
 for(let i=0;i<5;i++)g.update(.04);
 assert.equal(g.frontier.enemyHealth(id),profile.health-damage,'Le projectile touche le contact');assert.equal(g.player.magazine[g.player.weapon],rounds-1);
 assert.equal(g.save(false),true);assert.equal(g.load(),true);g.update(.04);e=g.frontier.contacts().find(e=>e.id===id);assert.equal(e.hp,profile.health-damage);assert.equal(e.kind,profile.kind);
 const valid=g.serialize(),world=g.world;valid.frontier.enemies[id]=profile.health+1;assert.throws(()=>g.restoreSave(valid),/profil/i);assert.equal(g.world,world);
 let contact;for(let i=0;i<48;i++){const q={x:e.x+Math.cos(i*Math.PI/24)*.72,y:e.y+Math.sin(i*Math.PI/24)*.72};if(!w.blocked(q.x,q.y,.32,0,site.id)&&w.line(q,e,0,site.id,null,.04)){contact=q;break;}}
 assert.ok(contact);visit(site,contact,0,id);const close=g.serialize();close.player.invulnerable=0;close.frontier.tracks[id].cool=0;g.restoreSave(close);
 const hp=g.player.health;g.update(.04);assert.equal(hp-g.player.health,profile.damage,'Dégât du profil appliqué au commandant');assert.equal(g.frontier.contacts().find(e=>e.id===id).cool,profile.interval);
});
test('135 G6 : verrous, générateur, tableau et barricade travaillent sur un vrai plan, avec reprise',()=>{
 begin();assert.equal(g.loadout.transfer('depot','sac','wood',6).ok,true);assert.equal(g.loadout.transfer('depot','sac','scrap',18).ok,true);assert.equal(g.loadout.transfer('depot','sac','fuel',4).ok,true);
 const w=g.frontier.world(),Bar=globalThis.DeadwallBarricades134;let chosen;
 const pool=w.pois.filter(p=>p.type==='basementHouse'||p.type==='generatorRoom');
 for(const p of pool){for(const z of p.levels){const objects=w.plan(p,z).objects,raw=objects.find(o=>o.kind==='generator');if(!raw)continue;const generator=I.objectIn(w,raw.id),genPoint=nearObject(w,p,generator,z);if(!genPoint)continue;
  const lock=objects.map(o=>I.objectIn(w,o.id)).find(o=>g.interventions134.blocksLoot(o)&&nearObject(w,p,o,z));if(!lock)continue;
  const panel=G.global(p,p.w/2+1.05,1.1);if(w.blocked(panel.x,panel.y,.32,z,p.id))continue;
  const aperture=Bar.regionTargets(w,p,z).map(t=>({t,q:{x:t.x-Math.sin(t.angle),y:t.y+Math.cos(t.angle)}})).find(({q})=>{const lp=G.local(p,q.x,q.y);return lp.x>.35&&lp.y>.35&&lp.x<p.w-.35&&lp.y<p.h-.35&&!w.blocked(q.x,q.y,.32,z,p.id);});
  if(aperture){chosen={p,z,generator,genPoint,lock,lockPoint:nearObject(w,p,lock,z),panel,...aperture};break;}
 }if(chosen)break;}
 assert.ok(chosen,'Site technique G6 avec objets et passage accessibles');const {p,z,generator,genPoint,lock,lockPoint,panel,t,q}=chosen;
 visit(p,lockPoint,z);let scrap=g.player.carry.scrap;solve(lock.id);assert.equal(g.interventions134.blocksLoot(lock),false);assert.equal(g.player.carry.scrap,scrap-1);assert.equal(g.frontier.takenAmount(lock.id),0);
 visit(p,genPoint,z);scrap=g.player.carry.scrap;solve(generator.id);assert.equal(g.player.carry.scrap,scrap-C.InterventionRules134.generator.cost.scrap);assert.equal(g.interventions134.snapshot().plants[generator.id].condition,100);
 assert.equal(g.interventions134.refuel(generator.id).ok,true);assert.equal(g.player.carry.fuel,0);assert.equal(g.interventions134.toggle(generator.id).ok,true);assert.equal(g.interventions134.powered(p.id,z),false);
 visit(p,panel,z);solve(p.id+':panel:'+z);assert.equal(g.interventions134.powered(p.id,z),true);assert.equal(g.interventions134.powered(p.id,z===0?1:0),false);assert.ok(g.interventions134.lights().length>0);
 const fuel=g.interventions134.snapshot().plants[generator.id].fuel;g.update(.04);assert.ok(g.interventions134.snapshot().plants[generator.id].fuel<fuel);
 visit(p,q,z);const wood=g.player.carry.wood;assert.equal(g.barricades134.begin('build',t.id,'planks').ok,true);for(let i=0;i<180&&g.barricades134.busy();i++)g.update(.04);
 assert.equal(g.barricades134.busy(),false);assert.equal(g.player.carry.wood,wood-6);assert.equal(g.frontier.world().blocked(t.x,t.y,.15,z,p.id),true);assert.equal(g.barricades134.collision('region',t.x,t.y,.15,z===0?1:0,p.id),false);
 assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.frontier.position().z,z);assert.equal(g.frontier.position().inside,p.id);assert.equal(g.interventions134.blocksLoot(lock),false);assert.equal(g.interventions134.powered(p.id,z),true);assert.equal(g.barricades134.collision('region',t.x,t.y,.15,z,p.id),true);
 const Geo=globalThis.DeadwallGeography135,annexes=Geo.annexes(w.seed,6),districts=g.worldEvolution.overview().districts;
 for(const a of annexes){const actual=districts.find(d=>d.id===a.id).pos;assert.deepEqual(actual,{id:a.id,x:a.x,y:a.y,a:a.a});const local=q=>({x:(q.x-a.x)*Math.cos(a.a)+(q.y-a.y)*Math.sin(a.a),y:-(q.x-a.x)*Math.sin(a.a)+(q.y-a.y)*Math.cos(a.a)});for(let slot=0;slot<8;slot++)for(const road of w.roads){const pad=road.width/2;assert.equal(G.segmentRect(local(road.a),local(road.b),{x:-22+(slot%2)*28-pad,y:-22+Math.floor(slot/2)*13-pad,w:20+2*pad,h:9+2*pad}),false,'Voirie hors bâtiment annexe '+a.id+' / '+slot);}}
});
