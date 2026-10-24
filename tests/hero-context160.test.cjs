'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),H=require('../src/hero-actions133.js'),Ops=require('../src/context-operations160.js');

// A small physical controller fixture uses the native maintenance owner. It
// does not claim seeded placement, travel or organic campaign progression.
function fixture(kind='restoreAccess',heroFirst=false,generation=10){
 const registrations=new Map(),point={active:true,generation,x:9,y:20,z:0,inside:null,a:1.24,car:{driving:false}},
  site={id:'P0001',generation:10,x:10,y:20,a:0,w:10,h:10,context160:{operations:[{key:'work',kind,anchor:{x:5,y:5,z:0}}]}},
  world={pois:[site],line:()=>true,plan:()=>({objects:[],visuals160:[],gates160:[]})},rule=C.ContextRules160.operations[kind];
 const g={state:'playing',paused:false,gameOver:false,activeOverlay:null,world:{},elapsed:0,stats:{shots:0},
  player:{x:9*32,y:20*32,health:50,maxHealth:100,dead:false,facing:.63,reload:0,shootCooldown:0,meleeCooldown:0,carry:C.makeBag()},
  resources:C.makeBag({wood:99,scrap:99,fuel:99,medicine:99}),input:{keys:new Set()},ui:{commandModal:{}},audio:{ui(){}},saveCount:0,
  frontier:{position:()=>({...point,car:{...point.car}}),discoveries:()=>[site.id],world:()=>world,contacts:()=>[],signalWork(){}},
  worldEvolution:{posture:()=>({key:'stand'}),structureDestroyed:()=>false,groupMembers:()=>[]},
  expansions:{canAct:()=>g.state==='playing'&&!g.paused&&!g.gameOver&&!g.activeOverlay,busy:()=>false,register:d=>registrations.set(d.id,d)},
  releaseInputs(){},showCommand(){},save(){g.saveCount++;return true;},
  update(dt){if(!g.paused&&!g.activeOverlay)g.elapsed+=dt;},
  serialize(){return{elapsed:g.elapsed,carry:{...g.player.carry},operations:g.contextOperations160.snapshot()};},
  restoreSave(data){g.world={};g.elapsed=data.elapsed;g.player.carry={...data.carry};registrations.get('context160').restore(data.operations);return true;},
  startNew(){g.world={};registrations.get('context160').reset();return true;},returnToMenu(){g.state='menu';return true;}};
 for(const[key,n]of Object.entries(rule.cost))g.player.carry[key]=n*2;
 if(heroFirst)H.install(g);Ops.install(g);if(!heroFirst)H.install(g);
 return{g,point,site,world,rule,key:site.id+':160:work',anchor:{x:10,y:20,z:0},begin:()=>g.contextOperations160.begin(site.id,'work')};
}

for(const[kind,pose]of [['restoreAccess','build'],['pumpBasin','handle'],['switchTrack','pry'],['medicalCare','dressing']])
 test('héros G10 : '+kind+' sélectionne '+pose+' après la progression du vrai propriétaire',()=>{
  const{g,begin,anchor,key}=fixture(kind),before=g.serialize();assert.equal(begin().ok,true);
  assert.equal(g.heroActions133.observeContextWork160(kind,.04,anchor),false,'Le début sans progression reste immobile');
  assert.equal(g.heroActions133.pose(),null);g.contextOperations160.step(.04);
  assert.equal(g.heroActions133.pose()?.kind,pose);assert.equal(g.heroActions133.pose().elapsed,g.contextOperations160.presentation(key).elapsed);
  assert.equal(g.heroActions133.pose().facing,0,'L’ancre en mètres dirige le rig en pixels');
  g.contextOperations160.step(.04);assert.equal(g.heroActions133.pose().elapsed,.08);
  assert.deepEqual(g.serialize(),before,'Les lectures et le travail partiel ne paient pas et ne soignent pas');
  assert.equal(g.saveCount,0);assert.equal(g.heroActions133.observeContextWork160(kind,.04,anchor),false,'Un même progrès ne peut rejouer un geste');
 });

test('205 G11 conserve les vrais travaux G10, leurs gestes et leur paiement unique dans le sac',()=>{
 for(const[kind,pose]of [['restoreAccess','build'],['pumpBasin','handle'],['switchTrack','pry'],['medicalCare','dressing']]){
  const{g,site,begin,key,rule}=fixture(kind,false,11),before=g.serialize(),depot={...g.resources},health=g.player.health;
  assert.equal(site.generation,10);assert.equal(begin().ok,true);assert.equal(g.heroActions133.pose(),null);
  g.contextOperations160.step(.04);assert.equal(g.heroActions133.pose()?.kind,pose);
  assert.equal(g.heroActions133.pose().elapsed,g.contextOperations160.presentation(key).elapsed);
  assert.deepEqual(g.serialize(),before);assert.deepEqual(g.resources,depot);
  g.paused=true;g.contextOperations160.step(1);assert.equal(g.heroActions133.pose()?.elapsed,.04);g.paused=false;
  for(let seconds=.04;seconds<rule.seconds;seconds+=.25)g.contextOperations160.step(Math.min(.25,rule.seconds-seconds));
  assert.equal(g.contextOperations160.busy(),false);assert.equal(g.heroActions133.pose(),null);assert.equal(g.saveCount,1);
  for(const resource of C.RESOURCE_KEYS)assert.equal(g.player.carry[resource],before.carry[resource]-(rule.cost[resource]||0));
  assert.equal(g.player.health,Math.min(g.player.maxHealth,health+(rule.heal||0)));assert.deepEqual(g.resources,depot);
  if(!rule.repeat){const paid={...g.player.carry};assert.equal(begin().ok,false);assert.deepEqual(g.player.carry,paid);}
 }
 const unknown=fixture('restoreAccess',false,12),before=unknown.g.serialize();
 assert.equal(unknown.begin().ok,false);assert.equal(unknown.g.heroActions133.pose(),null);assert.deepEqual(unknown.g.serialize(),before);
});

test('héros G10 : événement absent, mauvais outil, point étranger et pas de temps incohérent sont refusés',()=>{
 const{g,begin,anchor}=fixture(),observe=g.heroActions133.observeContextWork160,before=g.serialize();
 assert.equal(observe('restoreAccess',.04,anchor),false);assert.equal(begin().ok,true);
 assert.equal(observe('restoreAccess',.04,anchor),false,'Le job doit d’abord progresser');
 // Withhold only the presentation callback so every malformed request below
 // is tested against a native job that has really advanced by exactly .04 s.
 const hero=g.heroActions133;g.heroActions133={observeContextWork160:()=>false};g.contextOperations160.step(.04);g.heroActions133=hero;
 for(const dt of [0,-1,NaN,Infinity,.5])assert.equal(observe('restoreAccess',dt,anchor),false);
 for(const kind of ['repair','medicalCare','idle'])assert.equal(observe(kind,.04,anchor),false);
 for(const point of [undefined,{x:10,y:20},{...anchor,x:11},{...anchor,z:1}])assert.equal(observe('restoreAccess',.04,point),false);
 assert.equal(g.heroActions133.pose(),null);assert.deepEqual(g.serialize(),before);
 const world=g.frontier.world;g.frontier.world=()=>{throw Error('La présentation ne doit jamais générer ou chercher le monde');};
 try{assert.equal(observe('restoreAccess',.04,anchor),true);assert.equal(g.heroActions133.pose()?.kind,'build');}finally{g.frontier.world=world;}
 const pose=g.heroActions133.pose();assert.equal(observe('restoreAccess',.04,anchor),false);assert.deepEqual(g.heroActions133.pose(),pose);
 g.contextOperations160.cancel();assert.equal(observe('restoreAccess',.04,anchor),false);assert.equal(g.heroActions133.pose(),null);
});

for(const heroFirst of [false,true])test('héros G10 : phase native continue quel que soit l’ordre des wrappers ('+heroFirst+')',()=>{
 const{g,begin,key}=fixture('pumpBasin',heroFirst);assert.equal(begin().ok,true);
 for(const dt of [.04,.04,.3,.04]){
  g.update(dt);const elapsed=g.contextOperations160.presentation(key).elapsed;
  assert.equal(g.heroActions133.pose()?.elapsed,elapsed);assert.equal(g.heroActions133.pose()?.kind,'handle');
 }
 assert.ok(Math.abs(g.heroActions133.pose().elapsed-.37)<1e-9,'Le plafond natif de .25 s remplace le plafond visuel historique de .1 s');
});

test('héros G10 : pause et overlay figent la phase ; annulation et fin enlèvent immédiatement le geste',()=>{
 const{g,begin,rule,anchor}=fixture('medicalCare');assert.equal(begin().ok,true);g.contextOperations160.step(.04);
 const pose=g.heroActions133.pose(),carry={...g.player.carry},health=g.player.health;
 for(const reason of ['pause','overlay']){
  if(reason==='pause')g.paused=true;else g.activeOverlay=g.ui.commandModal;
  g.update(.1);g.contextOperations160.step(.1);assert.equal(g.heroActions133.observeContextWork160('medicalCare',.1,anchor),false);
  assert.deepEqual(g.heroActions133.pose(),pose);g.paused=false;g.activeOverlay=null;
 }
 g.contextOperations160.cancel();assert.equal(g.heroActions133.pose(),null);assert.deepEqual(g.player.carry,carry);assert.equal(g.player.health,health);
 assert.equal(begin().ok,true);for(let elapsed=0;elapsed<rule.seconds;elapsed+=.25)g.contextOperations160.step(.25);
 assert.equal(g.contextOperations160.busy(),false);assert.equal(g.heroActions133.pose(),null);
 assert.equal(g.player.carry.medicine,carry.medicine-1);assert.equal(g.player.health,health+rule.heal);assert.equal(g.saveCount,1);
});

test('héros G10 : déplacement, dégâts, tir et conduite ne conservent pas une animation de chantier',()=>{
 for(const interrupt of ['movement','damage','shot','driving']){
  const{g,point,begin}=fixture();assert.equal(begin().ok,true);g.contextOperations160.step(.04);const carry={...g.player.carry};
  if(interrupt==='movement')point.x+=1;if(interrupt==='damage')g.player.health--;if(interrupt==='shot'){g.stats.shots++;g.player.shootCooldown=.2;}if(interrupt==='driving')point.car.driving=true;
  g.contextOperations160.step(.04);assert.equal(g.heroActions133.pose(),null,interrupt);assert.deepEqual(g.player.carry,carry,interrupt);
 }
});

test('héros G10 : une ancre sous les pieds conserve la direction et les postures basses restent natives',()=>{
 const{g,point,begin}=fixture();point.x=10;assert.equal(begin().ok,true);g.contextOperations160.step(.04);
 assert.equal(g.heroActions133.pose().facing,point.a,'La direction régionale prime sur celle de D-17');g.worldEvolution.posture=()=>({key:'prone'});assert.equal(g.heroActions133.pose(),null);
 g.worldEvolution.posture=()=>({key:'stand'});assert.equal(g.heroActions133.pose()?.kind,'build');
});

test('héros G10 : le point de travail validé par le propriétaire oriente le geste vers son support réel',()=>{
 const{g,point,site,world,begin,key}=fixture('pumpBasin');point.x=10;
 site.context160.operations[0].supportId='native-pump';world.plan=()=>({objects:[],visuals160:[{id:'native-pump',x:4.5,y:7.5,w:1,h:1}],gates160:[]});
 assert.equal(begin().ok,true);g.contextOperations160.step(.04);
 assert.deepEqual(g.contextOperations160.presentation(key).workTarget,{x:10,y:23,z:0});
 assert.equal(g.heroActions133.pose()?.facing,Math.PI/2);assert.equal(g.heroActions133.pose()?.kind,'handle');
});

test('héros G10 : une cible cosmétique d’un autre niveau est ignorée au profit de l’ancre et du cap régional',()=>{
 const{g,point,begin}=fixture('pumpBasin');point.x=10;const original=g.contextOperations160;
 g.contextOperations160={...original,activity:()=>{const view=original.activity();return view?{...view,workTarget:{x:100,y:100,z:1}}:null;}};
 assert.equal(begin().ok,true);g.contextOperations160.step(.04);
 assert.equal(g.heroActions133.pose()?.kind,'handle');assert.equal(g.heroActions133.pose()?.facing,point.a);
});

test('héros G10 : la reprise et un nouveau monde retirent la phase transitoire, sans champ de pose sauvegardé',()=>{
 const{g,begin}=fixture();assert.equal(begin().ok,true);g.contextOperations160.step(.04);const saved=g.serialize();
 assert.equal(Object.hasOwn(saved,'heroActions133'),false);assert.equal(g.restoreSave(saved),true);assert.equal(g.heroActions133.pose(),null);assert.equal(g.contextOperations160.busy(),false);
 assert.equal(begin().ok,true);g.contextOperations160.step(.04);assert.equal(g.heroActions133.pose()?.elapsed,.04);
 g.startNew();assert.equal(g.heroActions133.pose(),null);assert.equal(g.contextOperations160.busy(),false);
 assert.equal(begin().ok,true);g.contextOperations160.step(.04);g.returnToMenu();assert.equal(g.heroActions133.pose(),null);
});
