'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');

function boot(){const env=bootDocument134();env.g.startNew('standard','17117');env.g.campaignIntro132.skip();return env;}
function click(doc,id){const button=doc.getElementById(id);assert.ok(doc.body.contains(button),id+' monté dans le document');assert.equal(button.disabled,false,id+' disponible');button.click();}
function generatorLocal(g){const C=globalThis.DeadwallCore,core=g.core();for(let r=4;r<22;r+=2)for(const [dx,dy]of[[r,0],[-r,0],[0,r],[0,-r]]){
 const gx=core.gx+dx,gy=core.gy+dy;if(!g.world.placement(C.BUILDINGS.generator,gx,gy,0).valid)continue;
 const b=new(core.constructor)(g.nextId++,'generator',gx,gy,0,1);b.health=350;g.world.add(b);g.refreshMetrics(true);const point=g.fieldcraft.service(g.player,b);assert.ok(point,'Approche extérieure réelle');Object.assign(g.player,point);return b;
}throw Error('Aire de groupe local libre absente');}
function generatorRegional(g){const C=globalThis.DeadwallCore,I=globalThis.DeadwallInterventions134,S=globalThis.DeadwallFrontierSurvey,w=g.frontier.world();
 const site=w.pois.find(p=>p.levels.some(z=>w.plan(p,z).objects.some(o=>o.kind==='generator'))),z=site.levels.find(z=>w.plan(site,z).objects.some(o=>o.kind==='generator')),o=I.objectIn(w,w.plan(site,z).objects.find(o=>o.kind==='generator').id);let point;
 for(let d=.4;d<3.6&&!point;d+=.2)for(let i=0;i<48;i++){const p={x:o.x+Math.cos(i*Math.PI/24)*d,y:o.y+Math.sin(i*Math.PI/24)*d,z:o.z,inside:o.poi};if(!w.blocked(p.x,p.y,.32,p.z,p.inside)&&S.targets(w,p,{},C.InterventionRules134.reach).some(t=>t.id===o.id)){point=p;break;}}
 assert.ok(point,'Accès réel au groupe régional');const data=g.serialize();Object.assign(data.frontier,{active:true,...point,anchor:{x:g.player.x,y:g.player.y},car:null});if(!data.frontier.seen.includes(site.id))data.frontier.seen.push(site.id);
 for(let i=0;i<w.threatCount(site);i++)data.frontier.enemies[site.id+':e'+i]=0;data.frontier.kills=Object.values(data.frontier.enemies).filter(h=>h===0).length;assert.ok(g.restoreSave(data));return o;
}
function localOpening(g){const B=globalThis.DeadwallBarricades134;for(const t of B.localTargets(g.exploration125.plan))for(const side of[1,-1]){
 const point={x:t.x-Math.sin(t.angle)*32*side,y:t.y+Math.cos(t.angle)*32*side};if(!g.friendlyPositionClear(g.player,point.x,point.y))continue;Object.assign(g.player,point);if(g.barricades134.eligibility('build',t.id,'planks').ok)return t;
}throw Error('Aucune ouverture locale libre');}
function replaceCommander(g,doc){assert.equal(g.successionUI133.isOpen(),true);assert.equal(g.successionUI133.choose('porter'),true);click(doc,'succession133Confirm');assert.equal(g.player.dead,false);assert.equal(g.paused,false);assert.equal(g.succession133.pending(),false);}
function firstTransfer(g){const C=globalThis.DeadwallCore,stock=g.resources.scrap;assert.equal(C.bagTotal(g.player.carry),0,'Sac de relève vide');assert.ok(g.loadout.transfer('depot','sac','scrap',6).ok,'Première transaction avant tout nouveau tick libre');assert.equal(g.resources.scrap,stock-6);assert.equal(g.player.carry.scrap,6);}

test('139 HTML : décès local ferme immédiatement le diagnostic payé avant la relève, sans effet ni remboursement',()=>{
 const {g,doc}=boot(),C=globalThis.DeadwallCore,b=generatorLocal(g),id='local:'+b.id;g.player.carry=C.makeBag({scrap:18});
 click(doc,'interventions134Button');click(doc,'interventions134Action-work-'+id);assert.equal(g.interventions134.busy(),true);assert.equal(g.player.carry.scrap,12);
 const time=g.elapsed;g.player.invulnerable=0;g.damagePlayer(10000);
 assert.equal(g.interventions134.busy(),false,'La pause de décès ne conserve pas le diagnostic');assert.equal(g.interventionsUI134.isOpen(),false);assert.equal(b.health,350);assert.equal(g.interventions134.snapshot().attempts[id],1);assert.equal(g.succession133.remains()[0].bag.scrap,12);assert.equal(g.elapsed,time);
 replaceCommander(g,doc);firstTransfer(g);assert.equal(g.elapsed,time);assert.equal(g.interventions134.act('confirm').ok,false);assert.equal(b.health,350);
 const save=g.serialize();assert.ok(g.restoreSave(save));assert.equal(g.succession133.remains()[0].bag.scrap,12);assert.equal(g.player.carry.scrap,6);assert.equal(g.interventions134.busy(),false);
});

test('139 HTML : décès régional ferme la tentative et conserve son lieu, coût engagé et première action de relève',()=>{
 const {g,doc}=boot(),C=globalThis.DeadwallCore,o=generatorRegional(g);g.player.carry=C.makeBag({scrap:18});const point=g.frontier.position();
 click(doc,'interventions134Button');click(doc,'interventions134Action-work-'+o.id);assert.equal(g.player.carry.scrap,13);g.player.invulnerable=0;g.frontier.damage(10000);
 assert.equal(g.interventions134.busy(),false);assert.equal(g.interventionsUI134.isOpen(),false);assert.deepEqual(g.interventions134.snapshot().plants,{});assert.equal(g.interventions134.snapshot().attempts[o.id],1);
 const corpse=g.succession133.remains()[0];assert.equal(corpse.bag.scrap,13);assert.equal(corpse.point.domain,'region');for(const key of['x','y','z','inside'])assert.equal(corpse.point[key],point[key]);
 replaceCommander(g,doc);firstTransfer(g);assert.equal(g.frontier.active(),false);assert.equal(g.interventions134.act('confirm').ok,false);g.restoreSave(g.serialize());assert.equal(g.succession133.remains()[0].bag.scrap,13);assert.equal(g.player.carry.scrap,6);
});

test('139 HTML : décès annule le chantier de barricade impayé avant la pause et libère la relève sans pose gratuite',()=>{
 const {g,doc}=boot(),C=globalThis.DeadwallCore;g.player.carry=C.makeBag({wood:12,scrap:4});const t=localOpening(g);assert.ok(g.barricades134.begin('build',t.id,'planks').ok);g.barricades134.step(.25);const before={...g.player.carry},time=g.elapsed;
 g.player.invulnerable=0;g.damagePlayer(10000);assert.equal(g.barricades134.busy(),false,'Chantier transitoire annulé avant la relève');assert.equal(g.barricades134.snapshot().records.length,0);assert.deepEqual(g.succession133.remains()[0].bag,before);
 replaceCommander(g,doc);firstTransfer(g);assert.equal(g.elapsed,time);assert.equal(g.barricades134.snapshot().records.length,0);const save=g.serialize();g.restoreSave(save);assert.deepEqual(g.succession133.remains()[0].bag,before);assert.equal(g.player.carry.scrap,6);
});
