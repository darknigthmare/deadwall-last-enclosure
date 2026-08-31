'use strict';

const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),B=require('../src/battlefield.js');
const {bootGame}=require('./helpers/browser.cjs');
const origin=()=>({x:2000,y:1800,dead:false});
const zombie=(core,dx,dy,extra={})=>({x:core.x+dx,y:core.y+dy,health:60,dead:false,...extra});
const wall=(core,dx,dy,extra={})=>({x:core.x+dx,y:core.y+dy,completed:true,def:{wall:true},health:100,maxHealth:100,dead:false,...extra});
const stats=(extra={})=>({wavesSurvived:2,kills:19,peakPopulation:8,peakBuildings:12,unitsLost:0,buildingsLost:3,playSeconds:125,...extra});
const resources=(extra={})=>({ammo:30,food:20,fuel:10,...extra});
const bySector=snapshot=>Object.fromEntries(snapshot.sectors.map(sector=>[sector.id,sector]));
function frozen(value){if(value&&typeof value==='object'){for(const child of Object.values(value))frozen(child);Object.freeze(value);}return value;}
function withoutRandom(action){
  const previous=Math.random;Math.random=()=>{throw new Error('Battlefield presentation must not consume RNG');};
  try{return action();}finally{Math.random=previous;}
}

test('situation : directions cardinales et égalités diagonales stables depuis le centre',()=>{
  const core=origin();
  const cases=[[0,-1,'north'],[1,0,'east'],[0,1,'south'],[-1,0,'west'],
    [3,-2,'east'],[-3,2,'west'],[2,-3,'north'],[-2,3,'south'],
    [1,-1,'north'],[-1,-1,'north'],[1,1,'south'],[-1,1,'south'],[0,0,'south']];
  for(const [dx,dy,expected]of cases)assert.equal(B.direction(core,zombie(core,dx,dy)),expected,dx+','+dy);
  assert.deepEqual(B.DIRECTIONS.map(item=>[item.id,item.label]),[['north','NORD'],['east','EST'],['south','SUD'],['west','OUEST']]);
  assert.equal(Object.isFrozen(B.DIRECTIONS),true);
  assert.ok(B.DIRECTIONS.every(Object.isFrozen));
});

test('situation : rayon proche de 320 inclusif, euclidien et indépendant de la direction',()=>{
  assert.equal(C.BATTLEFIELD_RULES.innerRadius,320);
  const core=origin(),actors=[
    zombie(core,320,0),zombie(core,320.0001,0),
    zombie(core,0,-320),zombie(core,0,-320.0001),
    zombie(core,192,256),zombie(core,192.0001,256),
    zombie(core,-320,0),zombie(core,-320.0001,0)
  ],snapshot=B.inspect(core,actors,[]),sectors=bySector(snapshot);
  assert.equal(snapshot.contacts,8);assert.equal(snapshot.innerContacts,4);
  for(const id of ['north','east','south','west']){
    assert.equal(sectors[id].contacts,2,id);assert.equal(sectors[id].innerContacts,1,id);
  }
});

test('situation : morts et santé nulle exclus ; contacts lointains comptés sans signal de proximité',()=>{
  const core=origin(),snapshot=B.inspect(core,[
    zombie(core,12,0,{dead:true}),zombie(core,0,12,{health:0}),zombie(core,-12,0,{health:-1}),
    zombie(core,800,0),zombie(core,0,-800)
  ],[]);
  assert.equal(snapshot.contacts,2);assert.equal(snapshot.innerContacts,0);
  assert.equal(bySector(snapshot).east.contacts,1);assert.equal(bySector(snapshot).north.contacts,1);
});

test('situation : remparts achevés et portes comptés, fragilité au plus 30 pour cent',()=>{
  assert.equal(C.BATTLEFIELD_RULES.fragileWallRatio,.3);
  const core=origin(),buildings=[
    wall(core,0,-350,{health:30}),wall(core,350,0,{health:30.0001}),
    wall(core,0,350,{health:300,maxHealth:1000,def:{wall:true,gate:true}}),
    wall(core,-350,0,{health:1}),wall(core,0,-400,{completed:false,health:5}),
    wall(core,0,-410,{dead:true,health:5}),wall(core,0,-420,{health:0}),
    wall(core,0,-430,{health:-1}),wall(core,0,-440,{def:{wall:false},health:5}),
    wall(core,0,-450,{def:null,health:5})
  ],snapshot=B.inspect(core,[],new Map(buildings.map((b,index)=>[index,b])).values()),sectors=bySector(snapshot);
  assert.equal(snapshot.fragileWalls,3);
  for(const id of ['north','east','south','west'])assert.equal(sectors[id].walls,1,id);
  assert.equal(sectors.east.fragileWalls,0);
  assert.equal(sectors.north.fragileWalls,1);assert.equal(sectors.south.fragileWalls,1);assert.equal(sectors.west.fragileWalls,1);
});

test('situation : aucun centre vivant ne produit aucun faux contact ni rempart fragile',()=>{
  const core=origin(),actors=[zombie(core,0,0)],buildings=[wall(core,1,0,{health:1})];
  for(const missing of [null,undefined,{...core,dead:true}]){
    const snapshot=B.inspect(missing,actors,buildings);
    assert.deepEqual(snapshot,{sectors:B.DIRECTIONS.map(item=>({...item,contacts:0,innerContacts:0,walls:0,fragileWalls:0})),contacts:0,innerContacts:0,fragileWalls:0});
  }
});

test('situation : inspection et débrief purs, entrées gelées, résultats indépendants, aucun RNG',()=>{
  const core=frozen(origin()),actors=frozen([zombie(core,1,2)]),buildings=frozen([wall(core,3,4,{health:20})]);
  const record=frozen(stats({unitsLost:1})),stock=frozen(resources({ammo:0}));
  const before=JSON.stringify({core,actors,buildings,record,stock});
  const first=withoutRandom(()=>{B.direction(core,actors[0]);B.debrief(record,stock);return B.inspect(core,actors,buildings);});
  first.sectors[0].contacts=99;first.sectors[0].label='MODIFIÉ';
  const second=withoutRandom(()=>B.inspect(core,actors,buildings));
  assert.equal(second.sectors[0].contacts,0);assert.equal(second.sectors[0].label,'NORD');
  assert.equal(JSON.stringify({core,actors,buildings,record,stock}),before);
});

test('débrief : vagues réellement repoussées, pics et pertes ; aucun score de vague inventé',()=>{
  const summary=B.debrief(stats({wave:99,unitsLost:1}),resources());
  assert.deepEqual(summary.values,[
    {label:'VAGUES REPOUSSÉES',value:2},{label:'INFECTÉS ÉLIMINÉS',value:19},
    {label:'PIC DE POPULATION',value:8},{label:'PIC DE STRUCTURES',value:12},
    {label:'ÉQUIPIERS PERDUS',value:1},{label:'STRUCTURES PERDUES',value:3}
  ]);
  assert.ok(summary.lessons.some(text=>text.includes('Des équipiers ont été perdus')));
  assert.ok(summary.lessons.every(text=>!/cause de la défaite|défaite causée|vous avez perdu parce que/i.test(text)));
});

test('débrief : stocks épuisés observés, trois conseils maximum, pas de pénurie inventée',()=>{
  const empty=B.debrief(stats({unitsLost:2}),resources({ammo:0,food:0,fuel:0}));
  assert.equal(empty.lessons.length,3);
  assert.ok(empty.lessons.some(text=>text.includes('munitions')));
  assert.ok(empty.lessons.some(text=>text.includes('rations')));
  assert.ok(empty.lessons.some(text=>text.includes('carburant')));
  const stocked=B.debrief(stats(),resources());
  assert.equal(stocked.lessons.length,1);assert.match(stocked.lessons[0],/seconde enceinte/);
  assert.ok(!stocked.lessons.some(text=>/vide|épuisées|perdus/.test(text)));
});

test('débrief : les fractions de nourriture et carburant encore utilisables ne sont pas dites épuisées',()=>{
  for(const [food,fuel]of [[.5,.5],[.010001,.000001],[1,1]]){
    const summary=B.debrief(stats(),resources({food,fuel}));
    assert.ok(!summary.lessons.some(text=>text.includes('rations étaient épuisées')),'food '+food);
    assert.ok(!summary.lessons.some(text=>text.includes('générateurs ne pouvaient plus')),'fuel '+fuel);
  }
  for(const food of [0,.009,.01])assert.ok(B.debrief(stats(),resources({food})).lessons.some(text=>text.includes('rations étaient épuisées')),'food '+food);
  assert.ok(B.debrief(stats(),resources({fuel:0})).lessons.some(text=>text.includes('générateurs ne pouvaient plus')));
  assert.ok(B.debrief(stats(),resources({ammo:.999})).lessons.some(text=>text.includes('munitions')));
  assert.ok(!B.debrief(stats(),resources({ammo:1})).lessons.some(text=>text.includes('munitions')));
});

function uiFixture({playing=true}={}){
  const env=bootGame(),g=env.game,get=id=>document.getElementById(id),signals=[];
  if(playing)g.startNew('standard','17117');
  let inspections=0;
  globalThis.DeadwallBattlefield={...B,inspect(...args){inspections++;return B.inspect(...args);}};
  g.audio.tone=(...args)=>signals.push(args);
  get('innerRingAlert').classList.add('hidden');
  const filename=require.resolve('../src/battlefield-ui.js');delete require.cache[filename];require(filename);
  const enemy=(dx=100,dy=0)=>{const z=zombie(g.core(),dx,dy);g.zombies.push(z);return z;};
  return{...env,get,signals,enemy,inspections:()=>inspections};
}

test('situation UI : quatre fronts et échantillonnage limité à une fois par demi-seconde',()=>{
  const {game:g,get,enemy,inspections}=uiFixture(),panel=get('battlefieldSectors'),before=inspections();
  assert.equal(C.BATTLEFIELD_RULES.refreshSeconds,.5);assert.equal(panel.children.length,4);
  assert.deepEqual(panel.children.map(card=>card.children[0].textContent),['NORD','EST','SUD','OUEST']);
  enemy();g.elapsed=.499;g.battlefieldUI.refresh();assert.equal(inspections(),before);assert.equal(get('innerRingAlert').classList.contains('hidden'),true);
  g.elapsed=.5;g.battlefieldUI.refresh();assert.equal(inspections(),before+1);
  assert.match(panel.children[1].children[1].textContent,/1 contacts actifs/);
  assert.equal(panel.children[1].dataset.alert,'true');assert.match(get('innerRingAlert').textContent,/EST/);
  for(let i=0;i<10;i++)g.battlefieldUI.refresh();
  assert.equal(inspections(),before+1);
  g.battlefieldUI.refresh(true);assert.equal(inspections(),before+2,'rafraîchissement forcé explicite');
});

test('situation UI : alarme sur entrée, pas de boucle et délai de quinze secondes respecté',()=>{
  const {game:g,enemy,signals}=uiFixture(),z=enemy();
  assert.equal(C.BATTLEFIELD_RULES.alarmCooldownSeconds,15);
  const refresh=(time,alive=true)=>{g.elapsed=time;z.dead=!alive;g.battlefieldUI.refresh(true);};
  refresh(.5);assert.equal(signals.length,1);
  assert.deepEqual(signals[0],[520,.18,'triangle',.055,-120]);
  for(const time of [1,10,20,30])refresh(time);
  assert.equal(signals.length,1,'proximité continue sans alarme répétée');
  refresh(31,false);refresh(31.5);assert.equal(signals.length,2);
  refresh(32,false);refresh(33);assert.equal(signals.length,2,'nouvelle entrée pendant le délai');
  refresh(34,false);refresh(46.499);assert.equal(signals.length,2,'borne inférieure du délai');
  refresh(46.5,false);refresh(46.5);assert.equal(signals.length,3,'délai exact écoulé et nouvelle entrée');
});

test('situation UI : pause, menu et défaite restent silencieux ; nouvelle carte réinitialise le délai',()=>{
  const {game:g,get,enemy,signals,inspections}=uiFixture();enemy();g.paused=true;g.elapsed=1;g.battlefieldUI.refresh(true);
  assert.equal(signals.length,0);assert.equal(get('innerRingAlert').classList.contains('hidden'),false,'information tactique visible en pause');
  const before=inspections();g.state='menu';g.battlefieldUI.refresh(true);
  assert.equal(inspections(),before);assert.equal(get('innerRingAlert').classList.contains('hidden'),true);assert.equal(signals.length,0);
  g.state='playing';g.gameOver=true;g.battlefieldUI.refresh(true);assert.equal(inspections(),before);assert.equal(signals.length,0);
  g.startNew('standard','17117');enemy();g.battlefieldUI.refresh(true);
  assert.equal(signals.filter(signal=>signal[0]===520&&signal[1]===.18).length,1,'signal de proximité autorisé dans la nouvelle carte');
});

test('situation UI : texte stable sans réannonce, présentation sans RNG ni mutation de la simulation',()=>{
  const {game:g,get,enemy}=uiFixture(),z=enemy();g.elapsed=1;
  const alert=get('innerRingAlert');let text=alert.textContent,writes=0;
  Object.defineProperty(alert,'textContent',{configurable:true,get(){return text;},set(value){text=value;writes++;}});
  const before=JSON.stringify({random:g.random.state,resources:g.resources,stats:g.stats,player:g.player,zombies:g.zombies});
  withoutRandom(()=>{g.battlefieldUI.refresh(true);for(let i=0;i<8;i++)g.battlefieldUI.refresh(true);});
  assert.equal(writes,1);assert.equal(JSON.stringify({random:g.random.state,resources:g.resources,stats:g.stats,player:g.player,zombies:g.zombies}),before);
  z.x=g.core().x;z.y=g.core().y-100;g.battlefieldUI.refresh(true);
  assert.equal(writes,2);assert.match(text,/NORD/);
});

test('débrief UI : six mesures remplacées sans doublons, contexte de campagne et durée observée',()=>{
  const {game:g,get}=uiFixture();Object.assign(g.stats,stats({unitsLost:1}));g.resources=resources();g.wave=99;
  const before=JSON.stringify({stats:g.stats,resources:g.resources,random:g.random.state});
  withoutRandom(()=>{g.battlefieldUI.refreshDefeat();g.battlefieldUI.refreshDefeat();});
  assert.equal(get('debriefMetrics').children.length,6);
  assert.equal(get('debriefMetrics').children[0].children[0].textContent,C.formatNumber(2));
  assert.equal(get('debriefMetrics').children[0].children[1].textContent,'VAGUES REPOUSSÉES');
  assert.ok(get('debriefLessons').children.length>=1&&get('debriefLessons').children.length<=3);
  assert.ok(get('debriefCampaign').textContent.includes(g.difficulty.label));assert.match(get('debriefCampaign').textContent,/CARTE 17117/);
  assert.ok(get('debriefDuration').textContent.startsWith(C.formatTime(125)));
  assert.equal(JSON.stringify({stats:g.stats,resources:g.resources,random:g.random.state}),before);
});
