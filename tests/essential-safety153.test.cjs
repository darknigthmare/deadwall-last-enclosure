'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js');
const clone=value=>JSON.parse(JSON.stringify(value));

function fresh(){const {game:g}=boot127();g.startNew('standard','17117');g.units=[];g.phaseTime=999;return g;}
function supplies(g){const data=clone(g.serialize());delete data.timestamp;return data;}
function unlock(g,families){const data=clone(g.serialize());for(const family of families){const t=g.essentials.targets().find(t=>t.family===family);data.frontier.seen.push(t.poi);data.essentials.jobs[t.id]={stage:'delivered'};data.essentials.stock[family]=2;}data.frontier.seen=[...new Set(data.frontier.seen)];g.restoreSave(data);standAt(g,g.player,g.core());}
function prepareCar(g){for(const n of g.world.nodes)n.depleted=true;const b=new(g.core().constructor)(g.nextId++,'expeditionGarage',77,65,0,1);g.world.add(b);g.refreshMetrics(true);g.fieldcraft.setup();standAt(g,g.player,g.core());g.resources.wood=g.resources.scrap=300;assert.equal(g.expeditions.buildCar().ok,true);const v=g.expeditions.car();Object.assign(g.player,{x:v.x+40,y:v.y});assert.equal(g.expeditions.board().ok,true);assert.equal(g.expeditions.driving(),true);assert.equal(g.workerCanWorkAt(g.player,g.core(),100),true);return v;}
function mountUI(g){const original=document.getElementById.bind(document);document.getElementById=id=>document.body.querySelectorAll('#'+id)[0]||original(id);const recon=original('reconPanel'),host=original('frontierDossier');document.body.appendChild(recon);recon.appendChild(host);g.frontierUI={open(){recon.classList.remove('hidden');},refresh(){}};Object.getPrototypeOf(host).scrollIntoView=function(){};document.readyState='complete';delete require.cache[require.resolve('../src/essential-ui.js')];require('../src/essential-ui.js');g.essentialUI.open();return id=>document.getElementById(id);}

test('153 matériel : monter réellement au volant interdit transfert, livraison et ramassage sans changer un stock',()=>{
 const g=fresh();unlock(g,['light']);assert.equal(g.essentials.transferKit('light','equip').ok,true);
 const delivered=g.essentials.targets().find(t=>t.family==='brace'),ground=g.essentials.targets().find(t=>t.family==='decoy');
 const data=clone(g.serialize());data.frontier.seen.push(delivered.poi,ground.poi);data.essentials.jobs[delivered.id]={stage:'player'};g.restoreSave(data);
 const v=prepareCar(g),atWheel=clone(g.serialize());atWheel.essentials.jobs[ground.id]={stage:'ground',point:{domain:'local',x:v.x,y:v.y,z:0,inside:null}};g.restoreSave(atWheel);
 const before=supplies(g);assert.match(g.essentials.status().handlingReason,/Descendez/);
 for(const action of [()=>g.essentials.transferKit('light','equip'),()=>g.essentials.transferKit('light','store'),()=>g.essentials.deliver(),()=>g.essentials.takeGround(ground.id),()=>g.essentials.use('light')]){const q=action();assert.equal(q.ok,false);assert.match(q.reason,/Descendez/);assert.deepEqual(supplies(g),before);}
 assert.equal(g.expeditions.board().ok,true);standAt(g,g.player,g.core());assert.equal(g.essentials.transferKit('light','store').ok,true);assert.equal(g.essentials.deliver().ok,true);assert.equal(g.essentials.deliver().ok,false);
 assert.equal(g.essentials.snapshot().stock.light,2);assert.equal(g.essentials.snapshot().stock.brace,2);
 Object.assign(g.player,{x:v.x+40,y:v.y});assert.equal(g.essentials.takeGround(ground.id).ok,true);assert.equal(g.essentials.takeGround(ground.id).ok,false);
 const completed=g.essentials.snapshot(),resources=clone(g.resources);assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.essentials.snapshot(),completed);assert.deepEqual(g.resources,resources);assert.equal(g.serialize().version,20);
});

test('153 matériel : les vrais boutons reconnaissent conduite, recharge et les kits sans effet utile',()=>{
 const g=fresh();unlock(g,['light','aid','brace','decoy']);for(const k of C.Essentials.keys)assert.equal(g.essentials.transferKit(k,'equip').ok,true);const get=mountUI(g);
 assert.equal(get('essentialUse-light').disabled,false);for(const k of ['aid','brace','decoy'])assert.equal(get('essentialUse-'+k).disabled,true,k+' refuse un effet indisponible');assert.match(get('essentialUse-aid').title,/Personne à soigner/);
 g.player.health=50;g.essentialUI.refresh(true);assert.equal(get('essentialUse-aid').disabled,false);const before=supplies(g);
 g.player.reload=1;g.player.reloadTotal=1;g.essentialUI.refresh(true);assert.equal(get('essentialUse-aid').disabled,true);assert.match(get('essentialUse-aid').title,/recharge/);assert.equal(get('essentialEquip-light').disabled,true);assert.equal(get('essentialStore-light').disabled,true);
 assert.equal(g.essentials.use('aid').ok,false);assert.equal(g.player.health,50);assert.equal(g.essentials.snapshot().belt.aid,1);g.player.reload=0;g.player.reloadTotal=0;assert.deepEqual(supplies(g),before);
 prepareCar(g);g.essentialUI.refresh(true);for(const id of ['essentialUse-light','essentialUse-aid','essentialEquip-light','essentialStore-light']){assert.equal(get(id).disabled,true,id);assert.match(get(id).title,/Descendez/);}
 assert.equal(g.expeditions.board().ok,true);standAt(g,g.player,g.core());g.essentialUI.refresh(true);get('essentialUse-aid').click();assert.equal(g.player.health,90);assert.equal(g.essentials.snapshot().belt.aid,0);get('essentialUse-aid').click();assert.equal(g.player.health,90);
});

test('153 matériel : devis d’utilisation purs, soins régionaux uniques et changement de domaine immédiat',()=>{
 const g=fresh();unlock(g,['aid','brace','decoy']);for(const k of ['aid','brace','decoy'])assert.equal(g.essentials.transferKit(k,'equip').ok,true);
 g.player.x=4058;g.player.y=2048;assert.equal(g.frontier.enter(),true);g.player.health=20;assert.equal(g.player.regionAbsent,true);
 const before=supplies(g),rng=g.random.state;for(let i=0;i<25;i++){assert.equal(g.essentials.previewUse('aid').ok,true);assert.equal(g.essentials.previewUse('brace').ok,false);assert.equal(g.essentials.previewUse('decoy').ok,true);g.essentials.status();}
 assert.deepEqual(supplies(g),before);assert.equal(g.random.state,rng);const q=g.essentials.use('aid');assert.equal(q.ok,true);assert.equal(q.amount,C.Essentials.RULES.kits.aid.heal);assert.equal(g.player.health,60);assert.equal(g.essentials.snapshot().belt.aid,0);assert.deepEqual(g.resources,before.resources);assert.equal(g.essentials.use('aid').ok,false);
 assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.frontier.active(),true);assert.equal(g.player.health,60);assert.equal(g.essentials.snapshot().belt.aid,0);assert.equal(g.essentials.previewUse('brace').ok,false);assert.equal(g.essentials.previewUse('decoy').ok,true);
});

test('153 matériel : soin partagé conserve le budget entier et plafond de dispositifs refuse sans consommer',()=>{
 const g=fresh();unlock(g,['aid','light']);g.refreshMetrics(true);for(let i=0;i<3;i++)g.recruit('worker');assert.equal(g.units.length,3);
 for(const u of [g.player,...g.units]){u.health=10;u.x=g.player.x;u.y=g.player.y;}assert.equal(g.essentials.transferKit('aid','equip').ok,true);
 const before=[g.player,...g.units].reduce((sum,u)=>sum+u.health,0),stock=clone(g.resources),q=g.essentials.use('aid');assert.equal(q.ok,true);assert.equal(q.amount,C.Essentials.RULES.kits.aid.totalHeal);assert.equal([g.player,...g.units].reduce((sum,u)=>sum+u.health,0)-before,C.Essentials.RULES.kits.aid.totalHeal);assert.ok([g.player,...g.units].every(u=>u.health<=50));assert.deepEqual(g.resources,stock);assert.equal(g.essentials.snapshot().belt.aid,0);
 assert.equal(g.essentials.transferKit('light','equip').ok,true);const data=clone(g.serialize()),R=C.Essentials.RULES;data.essentials.serial=R.maxEffects+1;data.essentials.effects=Array.from({length:R.maxEffects},(_,i)=>({id:i+1,kind:'light',domain:'local',x:g.player.x,y:g.player.y,z:0,inside:null,left:R.kits.light.duration,pulse:0}));g.restoreSave(data);
 const full=supplies(g);assert.equal(g.essentials.previewUse('light').ok,false);assert.match(g.essentials.previewUse('light').reason,/Trop de dispositifs/);assert.equal(g.essentials.use('light').ok,false);assert.deepEqual(supplies(g),full);assert.equal(g.essentials.snapshot().belt.light,1);assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.essentials.snapshot().effects.length,R.maxEffects);assert.equal(g.essentials.snapshot().belt.light,1);
});
