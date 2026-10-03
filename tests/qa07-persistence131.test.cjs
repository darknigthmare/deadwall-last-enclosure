'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),W=require('../src/frontier-world.js'),G=require('../src/frontier-geometry.js');
const Travel=require('../src/exploration-pack131.js'),Lore=require('../src/chronicles131-data.js');
const clone=value=>structuredClone(value);
function fresh(){const env=boot131();env.g.phaseTime=9999;standAt(env.g,env.g.player,env.g.core());return env;}
function ticks(api,seconds){for(let i=0;i<Math.ceil(seconds/.04)+1;i++)api.step(.04);}
function prepare(g,kind){const q=g.playerOps131.preview(kind);assert.ok(q.ok,q.reason);assert.ok(g.playerOps131.begin(kind).ok);ticks(g.playerOps131,q.seconds);assert.equal(g.playerOps131.busy(),false);}
function work(g,kind,id){const q=g.worldOps131.preview(kind,id);assert.ok(q.ok,q.reason);assert.ok(g.worldOps131.begin(kind,id).ok);ticks(g.worldOps131,q.seconds);assert.equal(g.worldOps131.busy(),false);}
function car(g){const b=new(g.core().constructor)(g.nextId++,'expeditionGarage',77,65,0,1);g.world.add(b);g.refreshMetrics(true);g.fieldcraft.setup();g.resources.wood=g.resources.scrap=300;assert.ok(g.expeditions.buildCar().ok);const v=g.expeditions.car();g.player.x=v.x+36;g.player.y=v.y;return v;}
function service(g){g.player.carry.scrap=8;g.player.carry.fuel=1;assert.ok(g.travel131.begin('service').ok);ticks(g.travel131,C.Travel131Rules.serviceSeconds);assert.ok(g.travel131.snapshot().tuning);}
function visit(g,p,{seen=true,clear=true}={}){const raw=g.serialize(),q=G.global(p,p.w/2,-2);Object.assign(raw.frontier,{active:true,x:q.x,y:q.y,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y},car:null});if(seen&&!raw.frontier.seen.includes(p.id))raw.frontier.seen.push(p.id);if(clear)for(let i=0;i<g.frontier.world().threatCount(p);i++){raw.frontier.enemies[p.id+':e'+i]=0;delete raw.frontier.tracks[p.id+':e'+i];}raw.frontier.kills=Object.values(raw.frontier.enemies).filter(v=>v===0).length;g.restoreSave(raw);g.releaseInputs();}
function durable(g){const raw=g.serialize();delete raw.timestamp;return raw;}
function rejectAtomically(env,raw,label){const {g,storage}=env,input=clone(raw),world=g.world,player=g.player,before=durable(g),primary=storage.get(C.SAVE_KEY),backup=storage.get(C.SAVE_BACKUP_KEY);assert.throws(()=>g.restoreSave(raw),undefined,label);assert.equal(g.world,world,label);assert.equal(g.player,player,label);assert.deepEqual(durable(g),before,label);assert.deepEqual(raw,input,'import non muté : '+label);assert.equal(storage.get(C.SAVE_KEY),primary,label);assert.equal(storage.get(C.SAVE_BACKUP_KEY),backup,label);}

test('QA07 migration : G4 explorée, butins partiels et morts persistent vers G5 puis deux reprises',()=>{
 const {g}=fresh(),raw=g.serialize(),old=W.create(raw.worldSeed,4),p=old.pois.find(p=>p.parking.length&&old.threatCount(p)>1),v=p.parking[0],obj=old.plan(p,0).objects[0];
 for(const id of ['defense131','exploration131','player131','world131','lore131'])delete raw.expansions127.modules[id];
 Object.assign(raw.frontier,{generation:4,seen:[p.id],notes:{[p.id]:'visited'},pin:p.id,enemies:{[p.id+':e0']:0,[p.id+':e1']:13},kills:1,taken:{[v.id]:v.amount,[obj.id]:Math.min(1.25,obj.amount)}});raw.nodes[0][1]=0;raw.resources.ammo=37;raw.player.health=71;raw.player.magazine.pistol=3;
 g.restoreSave(raw);assert.equal(g.frontier.position().generation,4);assert.equal(g.chronicles131.snapshot().prologue.status,'skipped');
 const before=g.serialize();g.player.x=100;g.player.y=100;assert.equal(g.worldOps131.expand().ok,false);standAt(g,g.player,g.core());
 assert.ok(g.worldOps131.expand().ok);assert.equal(g.frontier.position().generation,5);assert.equal(g.worldOps131.expand().ok,false);
 for(let i=0;i<2;i++){const after=g.serialize();for(const key of ['seen','taken','enemies','notes','pin','kills'])assert.deepEqual(after.frontier[key],before.frontier[key],key);for(const key of ['resources','nodes'])assert.deepEqual(after[key],before[key],key);assert.equal(after.player.health,71);assert.equal(after.player.magazine.pistol,3);assert.deepEqual(g.frontier.world().pois.find(q=>q.id===p.id),p);assert.ok(g.save(false));assert.ok(g.load());}
});

test('QA07 atomicité : contradictions réalistes des cinq modules préservent monde, équipement et deux sauvegardes',()=>{
 const env=fresh(),{g}=env;prepare(g,'ammo');prepare(g,'vest');const v=car(g);service(g);assert.ok(g.save(false));const base=g.serialize(),w=g.frontier.world(),allied=w.pois.find(p=>p.occupation==='allied'),infected=w.pois.find(p=>p.occupation==='infected'),reserve=w.pois.find(p=>p.frontier131?.reserve),wreck=w.pois.flatMap(p=>p.parking).find(v=>!['bike','skate'].includes(v.type));
 const cases=[
  ['porte sur centre',x=>x.expansions127.modules.defense131.posts.push({id:g.core().id,gate:{enabled:true,manualPhase:null,delay:0},maintenance:null,work:0,arc:null})],
  ['travail sur bâtiment achevé',x=>x.expansions127.modules.defense131.posts.push({id:g.core().id,gate:null,maintenance:null,work:1,arc:null})],
  ['entretien arme fractionnaire',x=>x.expansions127.modules.player131.care.pistol=.5],
  ['cartouchière infinie',x=>x.expansions127.modules.player131.reserve=Infinity],
  ['révision véhicule remplacé',x=>x.expansions127.modules.exploration131.tuning.id=v.id+1],
  ['révision véhicule détruit',x=>x.expeditions.vehicle.health=0],
  ['épave coffre non vidé',x=>{x.frontier.seen.push(wreck.id.split(':')[0]);x.expansions127.modules.exploration131.wrecks=[{id:wreck.id,recovered:1}];}],
  ['épave non découverte',x=>{x.frontier.taken[wreck.id]=wreck.amount;x.expansions127.modules.exploration131.wrecks=[{id:wreck.id,recovered:1}];}],
  ['relais infesté non certifié',x=>{x.frontier.seen.push(infected.id);x.expansions127.modules.world131.relays[infected.id]=C.makeBag({ammo:1});}],
  ['relais jamais découvert',x=>x.expansions127.modules.world131.relays[allied.id]=C.makeBag({ammo:40})],
  ['certification avec occupant vivant',x=>{x.frontier.seen.push(infected.id);x.expansions127.modules.world131.secured.push(infected.id);}],
  ['réserve ouverte jamais découverte',x=>x.expansions127.modules.world131.opened.push(reserve.id)],
  ['réserve prélevée sans ouverture',x=>{x.frontier.seen.push(reserve.id);x.frontier.taken[reserve.frontier131.reserve]=1;}],
  ['secteur relevé sans ses découvertes',x=>x.expansions127.modules.world131.surveyed.push(w.sectors.find(s=>s.sites.length).id)],
  ['document lu non relevé',x=>x.expansions127.modules.lore131.read.push('doors-0')],
  ['trace suivante sans précédente',x=>x.expansions127.modules.lore131.collected.push('doors-2')],
  ['décision sans dossier complet',x=>x.expansions127.modules.lore131.choices.doors='public'],
  ['témoignage sans premier relevé',x=>x.expansions127.modules.lore131.voices.push(Lore.voices[0].id)],
 ];
 for(const [label,edit]of cases){const bad=clone(base);edit(bad);rejectAtomically(env,bad,label);}
});

test('QA07 découverte : intervention physique avant le premier tick produit un registre croisé valide',()=>{
 const {g}=fresh(),w=g.frontier.world(),p=w.pois.find(p=>p.occupation==='allied');visit(g,p,{seen:false});assert.equal(g.frontier.discoveries().includes(p.id),false);g.player.carry=C.makeBag({wood:16,scrap:16,food:8,medicine:4});work(g,'relay',p.id);assert.ok(g.frontier.discoveries().includes(p.id));assert.ok(g.save(false));assert.ok(g.load());assert.ok(g.worldOps131.snapshot().relays[p.id]);work(g,'survey',p.id);const sector=g.frontier.world().sectors.find(s=>s.id===p.sector);assert.ok(sector.sites.every(id=>g.frontier.discoveries().includes(id)));assert.ok(g.save(false));assert.ok(g.load());
});

test('QA07 import refusé : une préparation déjà en cours garde sa progression et ne paie qu’une fois',()=>{
 const env=fresh(),{g}=env;assert.ok(g.travel131.begin('pack','motor').ok);ticks(g.travel131,1);const progress=g.travel131.overview().task.progress,stock=clone(g.resources),carry=clone(g.player.carry),transfer=g.travel131.manifest('motor').transfer,bad=g.serialize();bad.expansions127.modules.player131.tools=C.Player131Rules.tools.budget+1;rejectAtomically(env,bad,'import pendant préparation');assert.equal(g.travel131.busy(),true);assert.equal(g.travel131.overview().task.progress,progress);ticks(g.travel131,C.Travel131Rules.packingSeconds);assert.equal(g.travel131.busy(),false);for(const [key,n]of Object.entries(transfer)){assert.equal(g.resources[key],stock[key]-n);assert.equal(g.player.carry[key],carry[key]+n);}const after=durable(g);assert.ok(g.save(false));assert.ok(g.load());assert.deepEqual(g.resources,after.resources);assert.deepEqual(g.player.carry,after.player.carry);
});

test('QA07 relais : soins et transferts restent finis après une reprise et les réserves vides ne soignent plus',()=>{
 const {g}=fresh(),p=g.frontier.world().pois.find(p=>p.occupation==='allied');visit(g,p);g.player.carry=C.makeBag({wood:8,scrap:4,food:4,medicine:2});work(g,'relay',p.id);assert.ok(g.worldOps131.transfer(p.id,'store').ok);g.player.health=40;const home=clone(g.resources);work(g,'rest',p.id);assert.equal(g.player.health,56);assert.equal(g.worldOps131.snapshot().relays[p.id].food,2);assert.equal(g.worldOps131.snapshot().relays[p.id].medicine,1);assert.ok(g.save(false));assert.ok(g.load());assert.equal(g.player.health,56);work(g,'rest',p.id);assert.equal(g.player.health,72);assert.equal(C.bagTotal(g.worldOps131.snapshot().relays[p.id]),0);assert.equal(g.worldOps131.preview('rest',p.id).ok,false);assert.equal(g.worldOps131.transfer(p.id,'take').ok,false);assert.ok(g.save(false));assert.ok(g.load());assert.equal(g.player.health,72);assert.equal(g.worldOps131.preview('rest',p.id).ok,false);assert.deepEqual(g.resources,home);
});

test('QA07 bornes : registres volumineux et numériques non finis sont rejetés avant mutation',()=>{
 const env=fresh(),base=env.g.serialize(),cases=[
  x=>x.expansions127.modules.defense131.posts=Array(C.Defense131Rules.maxPosts+1).fill({}),
  x=>x.expansions127.modules.exploration131.wrecks=Array(C.Travel131Rules.maxWrecks+1).fill({}),
  x=>x.expansions127.modules.world131.opened=Array(C.WorldOpsRules131.maxRecords+1).fill('P0001'),
  x=>x.expansions127.modules.world131.relays=Object.fromEntries(Array.from({length:C.WorldOpsRules131.maxRecords+1},(_,i)=>['P'+String(i).padStart(4,'0'),{}])),
  x=>x.expansions127.modules.lore131.prologue.completed=Array(C.Chronicles131Rules.maxBaselineBuildings+1).fill(1),
  x=>x.expansions127.modules.lore131.prologue.gathered=NaN,
  x=>x.expansions127.modules.player131.armor=-Infinity,
 ];
 for(const edit of cases){const raw=clone(base);edit(raw);rejectAtomically(env,raw,'registre hors borne');}
 assert.throws(()=>global.DeadwallSave.parse('é'.repeat(global.DeadwallSave.MAX_FILE_BYTES/2+1)),/volumineus/);
});

test('QA07 caches : voyage distant, éviction et reprise conservent coffre, intérieur, réserve et mécanique épuisés',()=>{
 const {g}=fresh(),w=g.frontier.world(),p=w.pois.find(p=>p.generation===5&&p.frontier131?.reserve&&p.parking.some(v=>!['bike','skate'].includes(v.type))),v=p.parking.find(v=>!['bike','skate'].includes(v.type)),obj=w.plan(p,0).objects[0];
 visit(g,p);g.player.carry=C.makeBag({scrap:12});work(g,'reserve',p.id);const raw=g.serialize(),mechanical=Travel.wreckReserve(raw.worldSeed,v.id);raw.frontier.taken[v.id]=v.amount;raw.frontier.taken[obj.id]=obj.amount;const sealed=p.outdoor.find(o=>o.id===p.frontier131.reserve);raw.frontier.taken[sealed.id]=sealed.amount;raw.expansions127.modules.exploration131.wrecks=[{id:v.id,recovered:mechanical}];g.restoreSave(raw);
 const original=clone(g.frontier.snapshot().taken),records=g.expansions.snapshot();for(let n=0;n<65;n++){g.frontier.world().chunk(30+n,80);const q=g.frontier.world().pois.at(-1-n);g.frontier.world().plan(q,0);}assert.ok(g.frontier.world().cacheSize()<=25);assert.ok(g.frontier.world().planCacheSize()<=48);
 const distant=g.frontier.world().pois.find(q=>q.generation===5&&q.x>22000&&q.occupation==='allied');assert.ok(distant);visit(g,distant);assert.ok(g.save(false));assert.ok(g.load());visit(g,p);assert.deepEqual(g.frontier.snapshot().taken,original);assert.deepEqual(g.expansions.snapshot(),records);assert.equal(g.travel131.wreckStatus(v.id).remaining,0);assert.equal(g.worldOps131.preview('reserve',p.id).ok,false);assert.equal(g.frontier.world().plan(p,0).objects.find(o=>o.id===obj.id).amount,obj.amount,'la géométrie conserve la capacité, le registre conserve le prélèvement');
});

test('QA07 ressources finies : rechargement, gilet et moteur conservent leurs consommations à travers la reprise',()=>{
 const {g}=fresh();prepare(g,'ammo');prepare(g,'vest');prepare(g,'service');const v=car(g);service(g);const totalAmmo=()=>g.resources.ammo+g.player.carry.ammo+g.playerOps131.snapshot().reserve+Object.entries(C.WEAPONS).reduce((n,[id,w])=>n+g.player.magazine[id]*w.ammoPerReload,0);
 g.player.invulnerable=0;g.damagePlayer(20);assert.equal(g.player.health,86);assert.equal(g.playerOps131.snapshot().armor,39);g.travel131.consumeDistance(123.75,v.id);g.player.magazine.pistol=0;g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());const depot=g.resources.ammo,before=totalAmmo();g.startReload();assert.equal(g.playerOps131.snapshot().care.pistol,7);const duration=g.player.reload;assert.ok(duration>0);assert.ok(g.save(false));assert.ok(g.load());assert.equal(g.player.reload,duration);assert.equal(g.playerOps131.snapshot().care.pistol,7);assert.equal(g.player.health,86);assert.equal(g.playerOps131.snapshot().armor,39);assert.equal(g.travel131.snapshot().tuning.remaining,C.Travel131Rules.serviceDistance-123.75);
 for(let i=0;i<Math.ceil(duration/.04)+1;i++)g.updatePlayer(.04);assert.equal(g.player.reload,0);assert.equal(g.resources.ammo,depot);assert.equal(totalAmmo(),before);assert.ok(g.player.magazine.pistol>0);const state=g.playerOps131.snapshot();assert.ok(g.save(false));assert.ok(g.load());assert.deepEqual(g.playerOps131.snapshot(),state);assert.equal(totalAmmo(),before);
});

test('QA07 fin de vie : réanimation ne réplique pas une préparation, défaite ne recrée aucune sauvegarde',()=>{
 const {g,storage}=fresh();prepare(g,'ammo');const reserve=g.playerOps131.snapshot().reserve;assert.ok(g.playerOps131.begin('vest').ok);ticks(g.playerOps131,1);const scrap=g.resources.scrap;g.player.carry.wood=10;g.damagePlayer(1000);g.player.downTimer=.001;g.update(.04);assert.equal(g.playerOps131.busy(),false);assert.equal(g.player.dead,false);assert.equal(g.player.carry.wood,5);assert.equal(g.playerOps131.snapshot().armor,0);assert.equal(g.playerOps131.snapshot().reserve,reserve);assert.equal(g.resources.scrap,scrap);assert.ok(g.save(false));assert.ok(g.load());assert.equal(g.player.carry.wood,5);
 standAt(g,g.player,g.core());assert.ok(g.playerOps131.begin('vest').ok);g.damageBuilding(g.core(),1e9);g.update(.04);assert.equal(g.gameOver,true);assert.equal(g.playerOps131.busy(),false);assert.equal(g.playerOps131.begin('vest').ok,false);assert.equal(g.save(false),false);assert.equal(storage.get(C.SAVE_KEY),undefined);assert.equal(storage.get(C.SAVE_BACKUP_KEY),undefined);assert.equal(g.load(),false);assert.equal(g.playerOps131.snapshot().reserve,reserve);g.startNew('standard','17117');assert.equal(g.playerOps131.snapshot().reserve,0);assert.equal(g.playerOps131.snapshot().armor,0);
});

test('QA07 interruptions terminales : défaite et menu annulent joueur, voyage, chronique et relais sans coût',()=>{
 const {g}=fresh();
 for(const terminal of ['defeat','menu'])for(const kind of ['player','travel','lore','world']){
  g.startNew('standard','17117');g.phaseTime=9999;standAt(g,g.player,g.core());let api;
  if(kind==='player'){api=g.playerOps131;assert.ok(api.begin('vest').ok);ticks(api,1);}
  if(kind==='travel'){api=g.travel131;assert.ok(api.begin('pack','motor').ok);ticks(api,1);}
  if(kind==='lore'){api=g.chronicles131;assert.ok(api.begin('doors-0').ok);api.tick(.1);}
  if(kind==='world'){const p=g.frontier.world().pois.find(p=>p.occupation==='allied');visit(g,p);g.player.carry=C.makeBag({wood:8,scrap:4});api=g.worldOps131;assert.ok(api.begin('relay',p.id).ok);ticks(api,1);}
  assert.equal(api.busy(),true);const resources=clone(g.resources),carry=clone(g.player.carry),state=api.snapshot();
  if(terminal==='defeat'){g.damageBuilding(g.core(),1e9);g.update(.04);}else g.returnToMenu();
  assert.equal(api.busy(),false,kind+' / '+terminal);assert.deepEqual(api.snapshot(),state,kind+' / '+terminal);assert.deepEqual(g.resources,resources);assert.deepEqual(g.player.carry,carry);
 }
});

test('QA07 nouvelle campagne : chaque autosauvegarde réinitialise les groupes avant validation, secours compris',()=>{
 const {g,storage}=fresh();g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());g.update(.04);assert.ok(g.worldEvolution.snapshot().groups.length>0);assert.ok(g.save(false));const previous=durable(g),primary=storage.get(C.SAVE_KEY),backup=storage.get(C.SAVE_BACKUP_KEY);assert.equal(g.startNew('standard','not a seed!!'),false);assert.deepEqual(durable(g),previous);assert.equal(storage.get(C.SAVE_KEY),primary);assert.equal(storage.get(C.SAVE_BACKUP_KEY),backup);
 const writes=[],save=g.save.bind(g);g.save=(...args)=>{const ok=save(...args),record={ok,status:g.lastSaveStatus,primary:global.DeadwallSave.parse(storage.get(C.SAVE_KEY)),backup:global.DeadwallSave.parse(storage.get(C.SAVE_BACKUP_KEY))};writes.push(record);return ok;};assert.notEqual(g.startNew('standard','18118'),false);assert.ok(writes.length>=3,'observer aussi les sauvegardes intermédiaires des anciens modules');assert.ok(writes.every(w=>w.ok&&w.status.ok),'aucun échec de validation intermédiaire');assert.ok(writes.every(w=>w.primary.worldSeed===18118&&w.primary.worldEvolution.groups.length===0));const last=writes.at(-1);assert.equal(last.primary.frontier.generation,5);assert.equal(last.backup.worldSeed,18118);assert.equal(last.backup.worldEvolution.groups.length,0);assert.equal(last.primary.runId,last.backup.runId);assert.ok(g.load());assert.equal(g.world.seed,18118);assert.equal(g.worldEvolution.snapshot().groups.length,0);
});
