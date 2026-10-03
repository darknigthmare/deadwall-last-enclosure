'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),B=require('../src/battlefield.js'),Q=require('../src/coordination.js');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const stable=g=>{const{timestamp,...save}=g.serialize();return save;};
function fixture(){const e=bootDocument134();e.g.startNew('standard','903147');e.g.campaignIntro132.skip();return e;}
function forecast(g,id,wave){const raw=stable(g);raw.wave=wave;raw.phase='warning';raw.phaseTime=10;raw.wavePlan={...C.wavePlan(wave,g.difficulty,g.signature),fronts:4};raw.fronts=['north','east','south','west'];raw.siege.lastWave={wave,id,bonus:0};g.restoreSave(raw);return raw;}

test('préparatifs147 : les projections tenaille et débordement suivent la même autorité que les émissions',()=>{
 const{g}=fixture();
 for(const[id,wave,expected]of [['pincer',10,[['NORD','SUD'],['EST','OUEST'],['NORD','EST','SUD','OUEST']]],['flank',13,[['NORD'],['EST','OUEST'],['SUD']]]]){
  forecast(g,id,wave);const before=stable(g),status=Q.tactical(g);
  assert.equal(g.siege.assaultPattern(),id);assert.deepEqual(status.stages.map(s=>s.fronts),expected);
  const n=C.Dayworks.beginNight(wave,g.wavePlan.total,g.fronts);
  for(let stage=0;stage<3;stage++){n.emitted=Math.ceil(n.total*stage/3);n.pauses=Math.min(2,Math.floor(n.emitted*3/n.total));const actual=B.assaultStatus(B.observedSnapshot(g),n.total-n.emitted,n.fronts,n,stage?5.2:0,g.siege.assaultPattern());assert.deepEqual(actual.nextFronts.map(f=>f.label).sort(),expected[stage].slice().sort());}
  for(let i=0;i<10;i++)Q.tactical(g);assert.deepEqual(stable(g),before,'Aucune sélection de vague, RNG, émission ni dépense en lisant la projection');
 }
});

test('appoints147 : les vrais boutons affichent le nom et la progression de leur contrôleur, puis la pause',()=>{
 const{g,doc}=fixture();const Building=g.core().constructor;let b,point;
 for(let radius=6;radius<24&&!point;radius+=2){for(const[dx,dy]of [[radius,0],[0,radius],[-radius,0],[0,-radius]]){
  const gx=g.core().gx+dx,gy=g.core().gy+dy;if(!g.world.placement(C.BUILDINGS.watchtower,gx,gy,0).valid)continue;
  const candidate=new Building(g.nextId,'watchtower',gx,gy,0,1),access=g.fieldcraft.service(g.player,candidate);
  if(access&&g.friendlyPositionClear(g.player,access.x,access.y)){b=candidate;point=access;break;}
 }}
 assert.ok(point);g.nextId++;g.world.add(b);Object.assign(g.player,point);g.selectBuilding(b);Object.assign(g.player.carry,{ammo:6,wood:3,scrap:5});
 for(const kind of ['ammo','repair']){
  const recipe=C.FortificationPackRules.fieldSupply[kind];g.expansionUI.open('fortification');
  const button=doc.getElementById('expansionAction-fortification-field-'+kind);assert.equal(button.disabled,false);button.click();assert.equal(g.fortificationPack.busy(),true);assert.equal(g.paused,false);
  g.fortificationPack.step(.1);g.updateUI();const work=doc.getElementById('expansionWork'),label=work.children[0],progress=work.children[1];
  assert.match(label.textContent,new RegExp(recipe.name));assert.equal(progress.hidden,false);assert.equal(progress.value,g.fortificationPack.job.elapsed/recipe.seconds);
  g.togglePause(true);g.updateUI();assert.match(label.textContent,/EN PAUSE/);const fraction=progress.value;for(let i=0;i<4;i++)g.loop(g.lastFrame+40);assert.equal(progress.value,fraction);
  g.fortificationPack.stop();g.togglePause(false);g.updateUI();assert.equal(work.classList.contains('hidden'),true);
 }
});

test('préparatifs147 : un contact non observé ne donne aucune direction, même dans le commandement en pause',()=>{
 const{g,doc}=fixture(),worker=g.units[0],home={x:worker.x,y:worker.y};
 const z={id:g.nextId++,kind:'walker',x:g.core().x,y:g.core().y-1100,health:72,dead:false,radius:C.ENEMIES.walker.radius,attackCooldown:0};
 // Physical fixture, not a perception stub: find an unobstructed observer/contact pair.
 let found=false;for(let distance=900;distance<=1300&&!found;distance+=32){z.y=g.core().y-distance;Object.assign(worker,{x:z.x+48,y:z.y});found=g.visibility.canSeeLocal(z)&&!g.world.solidForFriendly(worker.x,worker.y);}
 assert.ok(found,'Un observateur vivant a réellement une ligne de vue');g.zombies=[z];g.phase='assault';g.showCommand(true,'field');
 const before=stable(g);g.coordinationUI.open();let s=g.battlefieldUI.snapshot();assert.equal(s.contacts,1);assert.equal(s.observedContacts,1);assert.equal(s.sectors[0].contacts,1);
 assert.match(doc.getElementById('coordinationBriefing143').textContent,/Contacts observés : NORD 1/);assert.deepEqual(stable(g),before);
 Object.assign(worker,home);assert.equal(g.visibility.canSeeLocal(z),false);const after=stable(g);g.coordinationUI.refresh(true);s=g.battlefieldUI.snapshot();
 assert.equal(s.contacts,1,'Le total global du directeur reste distinct');assert.equal(s.observedContacts,0);assert.ok(s.sectors.every(v=>v.contacts===0));assert.equal(doc.getElementById('innerRingAlert').classList.contains('hidden'),true);
 assert.doesNotMatch(doc.getElementById('coordinationBriefing143').textContent,/NORD/);assert.match(doc.getElementById('coordinationBriefing143').textContent,/Aucun contact actuellement observé/);assert.deepEqual(stable(g),after,'Aucun contact mémorisé ou stock modifié');
});

test('préparatifs147 : entretien, portes et sections conservent les vrais contrôleurs, la pause et le focus',()=>{
 const{g,doc}=fixture();forecast(g,'pincer',10);g.setBuildCollapsed(true);g.updateUI();const button=doc.getElementById('hud143Prepare');button.focus();button.click();
 const before=stable(g);assert.equal(g.paused,true);assert.equal(doc.activeElement.id,'coordinationHeading143');
 assert.equal(doc.getElementById('coordination147Schedule').children.length,3);assert.match(doc.getElementById('coordination147DirectorTitle').textContent,/Prise en tenaille/);
 doc.getElementById('coordination147Maintenance').click();assert.equal(doc.getElementById('linecarePanel').classList.contains('hidden'),false);assert.equal(g.paused,true);
 g.coordinationUI.open();doc.getElementById('coordination143Enclosure').click();assert.equal(doc.getElementById('commandTab-enclosure').getAttribute('aria-selected'),'true');
 g.coordinationUI.open();doc.getElementById('coordination143Squads').click();assert.equal(doc.getElementById('commandTab-workers').getAttribute('aria-selected'),'true');
 assert.deepEqual(stable(g),before);g.showCommand(false);assert.equal(g.paused,false);assert.equal(doc.activeElement,button);assert.deepEqual(stable(g),before);
 let frames=0;const vision=g.visibility,frame=vision.frame.bind(vision);g.visibility={...vision,frame(){frames++;return frame();}};
 g.coordinationUI.refresh(true);assert.equal(frames,0,'Un panneau masqué par la fermeture du commandement ne calcule aucune visibilité');
 g.coordinationUI.open();const visibleFrames=frames;assert.ok(visibleFrames>0);g.showCommand(true,'workers');const hiddenFrames=frames;
 g.coordinationUI.refresh(true);assert.equal(frames,hiddenFrames,'Un panneau masqué par le changement d’onglet ne calcule aucune visibilité');
});
