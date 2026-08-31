'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),N=require('../src/narrative.js'),Save=require('../src/save.js');
const {bootGame}=require('./helpers/browser.cjs');
const clone=value=>JSON.parse(JSON.stringify(value));
function start(){const env=bootGame();env.game.startNew('standard','17117');return env;}
function observe(game,theme){
  const site=game.world.sites.find(site=>site.theme===theme);
  game.player.x=site.x;game.player.y=site.y;game.input.keys.add('KeyE');
  for(let i=0;i<200;i++)game.updateNarrativeSurvey(.04);
  game.input.keys.delete('KeyE');return site;
}
function returnToCore(game){game.player.x=game.core().x;game.player.y=game.core().y;game.paused=true;game.activeOverlay=game.ui.commandModal;}

test('récit : six traces originales, deux choix bornés, quatre chapitres et aucun gain de simple visite',()=>{
  assert.equal(N.SECTORS.length,6);assert.equal(N.CHAPTERS.length,4);
  assert.equal(new Set(N.SECTORS.map(item=>item.id)).size,6);
  for(const item of N.SECTORS){
    assert.ok(item.source&&item.excerpt&&item.discovery);
    assert.equal(item.choices.A.reward.insight,1);assert.equal(item.choices.B.reward.morale,4);
    for(const choice of Object.values(item.choices)){assert.deepEqual(choice.reward.resources,{});assert.ok(choice.label&&choice.outcome);assert.ok(C.bagTotal(choice.cost)>0);}
  }
  const {game}=start(),before={resources:clone(game.resources),insight:game.research.insight,morale:game.morale,rng:game.random.state};
  observe(game,'housing');
  assert.deepEqual({resources:game.resources,insight:game.research.insight,morale:game.morale,rng:game.random.state},before);
  assert.equal(N.status(game.narrative).observed,1);assert.equal(N.status(game.narrative).resolved,0);
});

test('récit : huit secondes actives sur place et maintien E sont requis, pas une visite passive',()=>{
  const {game}=start(),site=game.world.sites[0],record=game.narrative.sectors[site.theme];
  game.player.x=site.x;game.player.y=site.y;
  for(let i=0;i<200;i++)game.updateNarrativeSurvey(.04);
  assert.equal(record.survey,0);assert.match(game.interactionText,/Relever les traces/);
  game.input.keys.add('KeyE');for(let i=0;i<50;i++)game.updateNarrativeSurvey(.04);
  assert.ok(record.survey>1.99&&record.survey<2.01);
  game.player.x+=300;game.updateNarrativeSurvey(.25);assert.ok(record.survey<2.01);
  game.player.x=site.x;for(let i=0;i<150;i++)game.updateNarrativeSurvey(.04);
  assert.equal(record.survey,8);assert.equal(game.narrative.unread.filter(id=>id==='sector:'+site.theme).length,1);
  for(let i=0;i<100;i++)game.updateNarrativeSurvey(.04);
  assert.equal(record.survey,8);assert.equal(game.narrative.unread.filter(id=>id==='sector:'+site.theme).length,1);
});

test('récit : menu, pause, mort, fin et pas invalides ne progressent jamais',()=>{
  const {game}=start(),site=game.world.sites[0];Object.assign(game.player,{x:site.x,y:site.y});game.input.keys.add('KeyE');
  for(const condition of [{state:'menu'},{paused:true},{gameOver:true},{dead:true},{health:0}]){
    game.state='playing';game.paused=false;game.gameOver=false;game.player.dead=false;game.player.health=100;
    if('dead'in condition||'health'in condition)Object.assign(game.player,condition);else Object.assign(game,condition);
    game.updateNarrativeSurvey(.25);assert.equal(game.narrative.sectors[site.theme].survey,0);
  }
  game.state='playing';game.paused=false;game.gameOver=false;game.player.dead=false;game.player.health=100;
  for(const dt of [NaN,Infinity,-1,0,'1',null])game.updateNarrativeSurvey(dt);
  assert.equal(game.narrative.sectors[site.theme].survey,0);
  game.updateNarrativeSurvey(99);assert.equal(game.narrative.sectors[site.theme].survey,C.NARRATIVE_RULES.maxStep);
});

test('récit : le relevé réel passe par ACTION libre, sans détourner la récolte ni le dépôt',()=>{
  const {game}=start(),site=game.world.sites[0];
  game.player.x=site.x;game.player.y=site.y;game.input.keys.add('KeyE');
  // Clear only a test fixture's existing random node at the centre, not production resources.
  for(const node of game.world.nodes)if(C.dist(node,site)<100)node.depleted=true;
  game.updateInteraction(.1);assert.equal(game.narrative.sectors[site.theme].survey,.1);
  const node=game.world.nodes.find(item=>item.siteId===site.id);
  node.x=site.x;node.y=site.y;node.depleted=false;node.amount=20;
  game.updateInteraction(.1);assert.ok(C.bagTotal(game.player.carry)>0);assert.equal(game.narrative.sectors[site.theme].survey,.1);
});

test('récit : choisir exige relevé, retour accessible au dépôt, réserves et bon contexte de commande',()=>{
  const {game}=start(),before=clone(game.resources);
  assert.equal(game.resolveNarrative('housing','A'),false);
  observe(game,'housing');assert.equal(game.resolveNarrative('housing','A'),false);
  returnToCore(game);
  game.activeOverlay=game.ui.pauseMenu;assert.equal(game.resolveNarrative('housing','A'),false);
  game.activeOverlay=game.ui.commandModal;game.player.dead=true;assert.equal(game.resolveNarrative('housing','A'),false);game.player.dead=false;
  for(const theme of ['__proto__','constructor',null,{},42])assert.equal(game.resolveNarrative(theme,'A'),false);
  for(const choice of ['__proto__','constructor','C',null,{},42])assert.equal(game.resolveNarrative('housing',choice),false);
  assert.deepEqual(game.resources,before);
  game.resources.scrap=0;const snapshot=clone(game.resources);
  assert.equal(game.resolveNarrative('housing','A'),false);assert.deepEqual(game.resources,snapshot);assert.equal(game.research.insight,0);
});

test('récit : choix A atomique, coût exact, une seule récompense même après sauvegarde/reprise',()=>{
  const {game,storage}=start();observe(game,'housing');returnToCore(game);
  const before=clone(game.resources),option=N.SECTORS.find(s=>s.id==='housing').choices.A;
  assert.equal(game.resolveNarrative('housing','A'),true);
  for(const key of C.RESOURCE_KEYS)assert.equal(game.resources[key],before[key]-(option.cost[key]||0));
  assert.equal(game.research.insight,1);assert.equal(game.narrative.sectors.housing.choice,'A');
  const payload=storage.get(C.SAVE_KEY),after=clone(game.resources);
  for(let i=0;i<5;i++){game.restoreSave(Save.parse(payload));assert.equal(game.resolveNarrative('housing','A'),false);assert.equal(game.resolveNarrative('housing','B'),false);}
  assert.deepEqual(game.resources,after);assert.equal(game.research.insight,1);
});

test('récit : choix B affiche un vrai arbitrage, plafonne le moral et ne crée aucune ressource',()=>{
  const {game}=start();observe(game,'market');returnToCore(game);game.morale=98;
  const before=clone(game.resources);assert.equal(game.resolveNarrative('market','B'),true);
  assert.equal(game.morale,100);assert.equal(game.resources.food,before.food-8);assert.equal(game.research.insight,0);
  for(const key of C.RESOURCE_KEYS.filter(k=>k!=='food'))assert.equal(game.resources[key],before[key]);
});

test('récit : progression partielle, lecture et choix survivent à la sauvegarde sans toucher la simulation',()=>{
  const {game}=start(),site=game.world.sites.find(s=>s.theme==='aid');
  Object.assign(game.player,{x:site.x,y:site.y});game.input.keys.add('KeyE');game.updateNarrativeSurvey(.2);
  const data=clone(game.serialize());game.restoreSave(data);assert.equal(game.narrative.sectors.aid.survey,.2);
  const before=clone(game.resources);game.markNarrativeRead();assert.deepEqual(game.narrative.unread,[]);
  const read=Save.validate(game.serialize());assert.deepEqual(read.narrative.unread,[]);assert.deepEqual(game.resources,before);
  game.startNew('standard','17117');assert.deepEqual(game.narrative,N.create());
});

test('récit : migration v1/v2 sans registre ne donne ni visites ni décisions rétroactives',()=>{
  const {game}=start(),data=clone(game.serialize());delete data.narrative;
  for(const version of [1,2]){data.version=version;const normalized=Save.validate(data);assert.deepEqual(normalized.narrative,N.create());assert.deepEqual(normalized.resources,data.resources);}
});

test('récit : état borné, sans identifiants inconnus, valeurs non finies ni textes injectables',()=>{
  const variants=[
    raw=>{raw.version=2;},raw=>{raw.sectors={};},raw=>{raw.sectors.housing.survey=Infinity;},
    raw=>{raw.sectors.housing.survey=-1;},raw=>{raw.sectors.housing.survey=8.1;},
    raw=>{raw.sectors.housing.choice='A';},raw=>{raw.sectors.housing.choice='constructor';},
    raw=>{raw.sectors.bad={survey:0,choice:null};},raw=>{raw.chapters=['<script>'];},
    raw=>{raw.chapters=['departure','departure'];},raw=>{raw.chapters=[];},
    raw=>{raw.unread=['sector:housing'];},raw=>{raw.unread=['chapter:network'];},
    raw=>{raw.unread=['chapter:departure','chapter:departure'];}
  ];
  for(const mutate of variants){const raw=N.create();mutate(raw);assert.throws(()=>N.normalize(raw),/registre narratif/);}
  for(const raw of [null,[],{},'story',2])assert.throws(()=>N.normalize(raw),/registre narratif/);
  assert.deepEqual(N.normalize(undefined),N.create());
});

test('récit : import corrompu transactionnel et copie de secours restent intacts',()=>{
  const {game,storage}=start(),world=game.world,before=storage.get(C.SAVE_KEY),data=clone(game.serialize());
  data.narrative.sectors.housing.survey='8';assert.throws(()=>game.restoreSave(data),/registre narratif/);
  assert.equal(game.world,world);assert.equal(storage.get(C.SAVE_KEY),before);
});

test('récit : chapitres mémorisés, fin conditionnelle, monde et hordes restent infinis',()=>{
  const {game}=start();game.objectiveIndex=3;game.updateNarrative();assert.ok(game.narrative.chapters.includes('shelter'));
  game.objectiveIndex=0;game.updateNarrative();assert.ok(game.narrative.chapters.includes('shelter'));
  for(const item of N.SECTORS){game.paused=false;observe(game,item.id);returnToCore(game);assert.equal(game.resolveNarrative(item.id,'B'),true);}
  assert.ok(game.narrative.chapters.includes('initiative'));assert.ok(!game.narrative.chapters.includes('network'));
  game.stats.wavesSurvived=3;game.updateNarrative();assert.ok(game.narrative.chapters.includes('network'));assert.equal(game.gameOver,false);
  const entries=game.narrative.chapters.length;game.updateNarrative();assert.equal(game.narrative.chapters.length,entries);
  game.paused=false;game.phase='aftermath';game.phaseTime=0;const wave=game.wave;game.updateDirector(.1);assert.equal(game.wave,wave+1);
});

test('récit : identité des opérations stable malgré l’ordre géographique et la graine',()=>{
  const {game}=start();const initialSite=observe(game,'transit');returnToCore(game);game.resolveNarrative('transit','A');
  const payload=clone(game.serialize());game.restoreSave(payload);
  assert.equal(game.narrative.sectors.transit.choice,'A');
  assert.equal(game.world.sites.find(s=>s.theme==='transit').id,initialSite.id);
  game.startNew('brutal','4294967295');assert.equal(game.narrative.sectors.transit.choice,null);assert.deepEqual(Object.keys(game.narrative.sectors).sort(),N.SECTORS.map(s=>s.id).sort());
});

test('campagne : Nouvelle partie demande confirmation et annuler conserve monde, stocks et sauvegarde',()=>{
  const {game,storage}=start();game.returnToMenu();
  const world=game.world,before=storage.get(C.SAVE_KEY),resources=clone(game.resources);
  const original=globalThis.confirm;let calls=0;
  try{
    globalThis.confirm=()=>{calls++;return false;};
    assert.equal(game.requestNewGame(),false);assert.equal(calls,1);
    assert.equal(game.world,world);assert.equal(storage.get(C.SAVE_KEY),before);assert.deepEqual(game.resources,resources);
    globalThis.confirm=()=>true;assert.equal(game.requestNewGame(),true);assert.notEqual(game.world,world);
    assert.notEqual(storage.get(C.SAVE_KEY),before);assert.deepEqual(game.narrative,N.create());
    assert.equal(game.requestNewGame(),false,'pas de nouvelle partie derrière le HUD');
  }finally{if(original===undefined)delete globalThis.confirm;else globalThis.confirm=original;}
});

test('campagne : premier lancement sans sauvegarde ne réclame aucune confirmation',()=>{
  const {game}=bootGame(),original=globalThis.confirm;
  try{globalThis.confirm=()=>{throw new Error('confirmation inattendue');};assert.equal(game.requestNewGame(),true);assert.equal(game.state,'playing');}
  finally{if(original===undefined)delete globalThis.confirm;else globalThis.confirm=original;}
});

test('récit : coût refusé derrière un rempart entre le commandant et le dépôt',()=>{
  const {game}=start();observe(game,'housing');
  const data=clone(game.serialize()),core=game.core(),wallId=game.nextId++;
  data.buildings.push({id:wallId,type:'woodWall',gx:67,gy:64,rotation:0,progress:1,health:360});
  data.nextId=game.nextId;game.restoreSave(data);
  Object.assign(game.player,{x:core.x+145,y:core.y+16});game.paused=true;game.activeOverlay=game.ui.commandModal;
  const before=clone(game.resources);assert.equal(game.resolveNarrative('housing','A'),false);assert.deepEqual(game.resources,before);
});

test('récit : une construction ancienne au centre du secteur ne condamne pas le relevé de ses environs',()=>{
  const {game}=start(),site=game.world.sites[0],data=clone(game.serialize());
  const gx=C.grid(site.x),gy=C.grid(site.y);
  data.buildings.push({id:game.nextId,type:'woodWall',gx,gy,rotation:0,progress:1,health:360});
  data.nextId=game.nextId+1;game.restoreSave(data);
  Object.assign(game.player,{x:gx*C.TILE-22,y:site.y});game.input.keys.add('KeyE');
  assert.equal(game.friendlyPositionClear(game.player,game.player.x,game.player.y),true);
  assert.equal(game.workerCanWorkAt(game.player,site,90),false,'le point central est réellement obstrué');
  game.updateNarrativeSurvey(.2);assert.equal(game.narrative.sectors[site.theme].survey,.2);
  Object.assign(game.player,{x:gx*C.TILE+16,y:gy*C.TILE+16});
  game.updateNarrativeSurvey(.2);assert.equal(game.narrative.sectors[site.theme].survey,.2,'pas depuis une position dans le mur');
});

test('récit : un import à la borne insight reste sauvegardable, sans débit ni décision impossible',()=>{
  const {game}=start();observe(game,'housing');returnToCore(game);
  const data=clone(game.serialize());data.research.insight=C.RESEARCH_INSIGHT_MAX;game.restoreSave(Save.validate(data));
  const before=clone(game.resources);assert.equal(game.resolveNarrative('housing','A'),false);
  assert.match(game.narrativeStatus('housing','A').reason,/maximale/);
  assert.deepEqual(game.resources,before);assert.equal(game.narrative.sectors.housing.choice,null);
  assert.equal(game.save(false),true);assert.doesNotThrow(()=>Save.validate(game.serialize()));
  assert.equal(game.resolveNarrative('housing','B'),true);assert.equal(game.save(false),true);
});

test('progression : récompense de horde bornée pour conserver l’export d’un import extrême valide',()=>{
  const {game}=start();game.research.insight=C.RESEARCH_INSIGHT_MAX;game.phase='assault';game.spawnQueue=[];game.pendingSpawns=C.normalizeSpawnCounts();game.zombies=[];
  game.updateDirector(.04);assert.equal(game.research.insight,C.RESEARCH_INSIGHT_MAX);assert.doesNotThrow(()=>Save.validate(game.serialize()));
});

test('économie : une tolérance flottante ne laisse jamais de dette non sauvegardable en pause',()=>{
  for(const action of ['narrative','research','crisis']){
    const {game}=start();returnToCore(game);
    let invoke;
    if(action==='narrative'){game.narrative.sectors.housing.survey=8;game.resources.scrap=12-5e-7;invoke=()=>game.resolveNarrative('housing','A');}
    if(action==='research'){game.resources.scrap=45-5e-7;game.research.insight=1;invoke=()=>game.launchResearch('logistics');}
    if(action==='crisis'){game.resources.scrap=8-5e-7;game.activeCrisis={id:'blackout',wave:2,status:'pending',remaining:45,targetId:0,choice:null};invoke=()=>game.resolveCrisis('A');}
    assert.equal(invoke(),true,action);assert.equal(game.resources.scrap,0);assert.equal(game.save(false),true);assert.doesNotThrow(()=>Save.validate(game.serialize()));
  }
  const stock=C.makeBag({scrap:12-2e-6}),before=clone(stock);
  assert.equal(C.spend(stock,{scrap:12}),false);assert.deepEqual(stock,before,'un vrai manque de stock reste refusé');
});

test('récit : un partage requiert une équipe réelle et ne fait pas parler un survivant mort',()=>{
  const {game}=start();observe(game,'aid');returnToCore(game);game.units=[];
  const before=clone(game.resources);assert.equal(game.resolveNarrative('aid','B'),false);
  assert.match(game.narrativeStatus('aid','B').reason,/Recrutez/);assert.deepEqual(game.resources,before);
  assert.equal(game.resolveNarrative('aid','A'),true,'l’étude solitaire reste possible');
});
