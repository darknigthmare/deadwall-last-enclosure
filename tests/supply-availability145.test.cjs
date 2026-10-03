'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
let g,doc,C;
test.before(()=>{({g,doc}=bootDocument134());C=globalThis.DeadwallCore;});
function fresh(){g.startNew('standard','903145');g.campaignIntro132.skip();standAt(g,g.player,g.core());}
function supplies(){g.fieldSuppliesUI.open();doc.getElementById('supplyEndpoint').value='depot';doc.getElementById('supplyQuantity').value='max';g.fieldSuppliesUI.refresh(true);}
function wood(){assert.equal(g.fieldSupplies.transfer('depot','wood','withdraw',1).amount,1);}
function dressing(){assert.equal(g.fieldSupplies.transfer('depot','medicine','withdraw',2).amount,2);g.player.invulnerable=0;g.damagePlayer(20);assert.equal(g.survivalPack.begin('dressing').ok,true);g.survivalPack.step(.1);assert.equal(g.survivalPack.busy(),true);}
function bags(){return{bag:{...g.player.carry},depot:{...g.resources},deposited:g.depositedResources,prologue:g.chronicles131.snapshot().prologue.deposited};}
function stable(){const s=g.serialize();delete s.timestamp;return s;}

test('145 Sac & Relais : le pansement réel désactive le transfert, avec la raison du propriétaire',()=>{
 fresh();wood();dressing();supplies();const b=doc.getElementById('supplyDeposit-wood'),before=bags();
 assert.equal(b.disabled,true,'Le bouton ne doit pas proposer un transfert refusé.');
 const q=g.fieldSupplies.previewTransfer('depot','wood','deposit','max');assert.equal(q.ok,false);assert.equal(b.title,q.reason);
 assert.equal(b.getAttribute('aria-description'),q.reason);assert.match(doc.getElementById('fieldSupplyPanel').querySelector('.supplies-status').textContent,/rechargement|action de terrain/);
 b.click();assert.deepEqual(bags(),before);assert.equal(g.survivalPack.busy(),true);
 g.survivalPack.cancel();g.fieldSuppliesUI.refresh(true);assert.equal(b.disabled,false);b.click();assert.equal(g.player.carry.wood,0);assert.equal(g.resources.wood,before.depot.wood+1);assert.equal(g.depositedResources,before.deposited+1);
});

test('145 Sac & Relais : consulter les aperçus ne dépense ni ne modifie le message ou la préparation',()=>{
 fresh();wood();dressing();const before=stable(),message=g.fieldSupplies.overview().message,task=g.survivalPack.overview().task;
 for(let i=0;i<3;i++){g.fieldSupplies.previewTransfer('depot','wood','deposit',5);const view=g.fieldSupplies.overview('depot',5);assert.equal(view.transfers.rows.wood.deposit.ok,false);assert.equal(view.transfers.reason,view.transfers.rows.wood.deposit.reason);}
 assert.deepEqual(stable(),before);assert.equal(g.fieldSupplies.overview().message,message);assert.deepEqual(g.survivalPack.overview().task,task);
});

test('145 Sac & Relais : un devis ancien ne permet pas un débit pendant une nouvelle intervention',()=>{
 fresh();wood();supplies();const b=doc.getElementById('supplyDeposit-wood'),oldQuote=g.fieldSupplies.previewTransfer('depot','wood','deposit',1);assert.equal(b.disabled,false);assert.equal(oldQuote.ok,true);g.showCommand(false);dressing();
 const before=bags(),result=g.fieldSupplies.transfer('depot','wood','deposit',oldQuote.amount);assert.equal(result.ok,false);assert.deepEqual(bags(),before);assert.equal(g.survivalPack.busy(),true);
 supplies();assert.equal(b.disabled,true);assert.equal(b.title,result.reason);
});

test('145 Sac & Relais : recharge, décès, pause et éloignement ont le même refus en aperçu et transaction',()=>{
 for(const setup of [()=>{g.player.reload=1;},()=>{g.player.dead=true;g.player.health=0;},()=>{g.togglePause(true);},()=>{g.player.x=32;g.player.y=32;}]){
  fresh();wood();setup();const before=bags(),q=g.fieldSupplies.previewTransfer('depot','wood','deposit',1),r=g.fieldSupplies.transfer('depot','wood','deposit',1);
  assert.equal(q.ok,false);assert.deepEqual(r,{ok:false,reason:q.reason});assert.deepEqual(bags(),before);
 }
});

test('145 Sac & Relais : le poste manuel conserve son verrou et la disponibilité revient après restitution',()=>{
 fresh();wood();let tower;
 // Declared completed-structure fixture; the player still needs a real shared approach.
 search:for(let r=3;r<7;r++)for(const[dx,dy]of[[r,0],[-r,0],[0,r],[0,-r]]){
  const core=g.core(),x=core.gx+dx,y=core.gy+dy;if(!g.world.placement(C.BUILDINGS.watchtower,x,y,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,'watchtower',x,y,0,1);g.world.add(b);
  for(let i=0;i<32;i++){Object.assign(g.player,{x:b.x+Math.cos(i*Math.PI/16)*55,y:b.y+Math.sin(i*Math.PI/16)*55});if(g.workerCanWorkAt(g.player,core,125)&&g.fieldcraft.control(b)){tower=b;break search;}}
  g.world.remove(b);
 }
 assert.ok(tower);supplies();const b=doc.getElementById('supplyDeposit-wood'),before=bags(),q=g.fieldSupplies.previewTransfer('depot','wood','deposit',1);
 assert.equal(q.ok,false);assert.match(q.reason,/poste de tir/);assert.equal(b.disabled,true);assert.equal(b.title,q.reason);assert.equal(g.fieldSupplies.transfer('depot','wood','deposit',1).reason,q.reason);assert.deepEqual(bags(),before);assert.equal(g.fieldcraft.context().mounted,tower.id);
 assert.equal(g.fieldcraft.control(),true);g.fieldSuppliesUI.refresh(true);assert.equal(b.disabled,false);
});

test('145 Sac & Relais : capacité fractionnaire, reliquat, source vide et dépôt personnel restent exacts après reprise',()=>{
 fresh();wood();g.resources.wood=g.storage-.125;const total=g.resources.wood+g.player.carry.wood,q=g.fieldSupplies.previewTransfer('depot','wood','deposit',5);assert.equal(q.ok,true);assert.equal(q.amount,.125);
 const n=g.depositedResources;assert.equal(g.fieldSupplies.transfer('depot','wood','deposit',5).amount,q.amount);assert.equal(g.resources.wood,g.storage);assert.equal(g.player.carry.wood,.875);assert.equal(g.resources.wood+g.player.carry.wood,total);assert.equal(g.depositedResources,n+.125);
 assert.equal(g.fieldSupplies.previewTransfer('depot','wood','deposit',1).reason,'Destination pleine.');supplies();assert.equal(doc.getElementById('supplyDeposit-wood').disabled,true);assert.equal(doc.getElementById('supplyDeposit-wood').title,'Destination pleine.');
 const saved=stable();assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(stable(),saved);assert.equal(g.depositedResources,n+.125);
 assert.equal(g.fieldSupplies.previewTransfer('depot','fuel','deposit',1).reason,'Aucune ressource disponible.');
});

test('145 Sac & Relais : quantités invalides et clés forgées sont refusées sans changer les réserves',()=>{
 fresh();wood();const before=bags();for(const args of [['depot','wood','deposit',0],['depot','wood','deposit',NaN],['depot','wood','deposit','5'],['depot','__proto__','deposit',1],['depot','wood','take',1]]){
  const q=g.fieldSupplies.previewTransfer(...args);assert.equal(q.ok,false);assert.equal(g.fieldSupplies.transfer(...args).reason,q.reason);assert.deepEqual(bags(),before);
 }
});

test('145 Sac & Relais : le devis de table lit le contexte régional une seule fois et retourne des copies',()=>{
 fresh();wood();const frontier=g.frontier,original=frontier.overview;let reads=0;g.frontier={...frontier,overview(){reads++;return original();}};
 try{const before=bags(),v=g.fieldSupplies.overview('depot',1);assert.equal(reads,1);assert.equal(v.transfers.rows.wood.deposit.amount,1);v.transfers.rows.wood.deposit.amount=999;v.bag.wood=999;assert.deepEqual(bags(),before);assert.equal(g.fieldSupplies.previewTransfer('depot','wood','deposit',1).amount,1);}finally{g.frontier=frontier;}
});
