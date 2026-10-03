'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),D=C.Infrastructure;
const cell={x:10,y:10},stock=()=>({wood:100,stone:100,scrap:100,fuel:10});
const conditions=(surface,mode='new',tier=10,has=()=>true)=>({surface,mode,tier,has});
function finish(e){for(let i=0;i<100&&D.unfinished(e.road(cell.x,cell.y));i++)e.work(cell.x,cell.y,.25);assert.equal(D.unfinished(e.road(cell.x,cell.y)),false);}

test('voirie150 : anciens tronçons et chantiers gardent exactement leur forme sans gain à la reprise',()=>{
 const old={...D.create(),roads:[{x:10,y:10,progress:1},{x:11,y:10,progress:.37}]};
 let e=new D.Engine(old);for(let i=0;i<100;i++)e=new D.Engine(e.snapshot());
 assert.deepEqual(e.snapshot(),old);assert.equal(e.multiplier(336,336),1.18);assert.equal(e.multiplier(368,336),1);
});
test('voirie150 : quatre débloquages distincts, avec contrepartie pour les infectés',()=>{
 assert.deepEqual(Object.values(D.SURFACES).map(s=>s.unlockTier),[1,4,7,10]);
 for(const s of Object.values(D.SURFACES)){assert.ok(s.friendlySpeed>1&&s.truckSpeed>s.friendlySpeed&&s.hostileSpeed>1);assert.ok(s.workSeconds>0);assert.equal(Object.isFrozen(s.cost),true);}
 assert.equal(D.surfaceStatus('toString',10,()=>true).ok,false);
});
for(const s of Object.values(D.SURFACES)){
 test('voirie150 : '+s.name+' refuse le palier précédent et son support absent sans paiement',()=>{
  const e=new D.Engine(),resources=stock(),before={...resources};
  assert.equal(e.commit([cell],resources,()=>false,conditions(s.id,'new',s.unlockTier-1)).ok,false);
  assert.equal(e.commit([cell],resources,()=>false,conditions(s.id,'new',s.unlockTier,()=>false)).ok,false);
  if(s.workshop)assert.equal(e.commit([cell],resources,()=>false,conditions(s.id,'new',s.unlockTier,type=>type!=='workshop')).ok,false);
  assert.deepEqual(resources,before);assert.deepEqual(e.snapshot(),D.create());
 });
 test('voirie150 : '+s.name+' finance un chantier fini sur place puis accélère les trois profils',()=>{
  let e=new D.Engine();const resources=stock(),before={...resources};
  assert.equal(e.commit([cell],resources,()=>false,conditions(s.id,'new',s.unlockTier)).ok,true);
  for(const [key,n]of Object.entries(s.cost))assert.equal(resources[key],before[key]-n);
  assert.equal(e.multiplier(336,336,'truck'),1);e.work(10,10,.25);
  const active=e.snapshot();e=new D.Engine(active);assert.deepEqual(e.snapshot(),active);assert.equal(e.multiplier(336,336,'hostile'),1);
  finish(e);assert.equal(e.multiplier(336,336),s.friendlySpeed);assert.equal(e.multiplier(336,336,'truck'),s.truckSpeed);assert.equal(e.multiplier(336,336,'hostile'),s.hostileSpeed);
  const finished=e.snapshot(),paid={...resources};assert.equal(e.commit([cell],resources,()=>false,conditions(s.id)).ok,false);assert.deepEqual(resources,paid);assert.deepEqual(e.snapshot(),finished);
 });
}
test('voirie150 : trois rénovations financent les différences une seule fois et conservent les anciens bonus pendant les travaux',()=>{
 let e=new D.Engine();const resources=stock(),initial={...resources};e.commit([cell],resources);finish(e);
 for(const id of ['paving','concrete','logistics']){
  const previous=D.surface(e.road(10,10)),target=D.SURFACES[id],before={...resources};
  const q=D.quote(e.state,[cell],resources,()=>false,conditions(id,'upgrade'));assert.equal(q.ok,true);assert.deepEqual(resources,before,'preview has no debit');
  assert.equal(e.commit([cell],resources,()=>false,conditions(id,'upgrade')).ok,true);
  for(const [key,n]of Object.entries(target.cost))assert.equal(resources[key],before[key]-n+(previous.cost[key]||0));
  assert.equal(e.multiplier(336,336),previous.friendlySpeed);assert.equal(e.multiplier(336,336,'hostile'),previous.hostileSpeed);
  assert.equal(e.commit([cell],resources,()=>false,conditions(id,'upgrade')).ok,false);const paid={...resources};e.work(10,10,.25);
  const active=e.snapshot();e=new D.Engine(active);assert.deepEqual(e.snapshot(),active);assert.equal(e.multiplier(336,336,'truck'),previous.truckSpeed);
  finish(e);assert.equal(e.road(10,10).surface,id);assert.equal(Object.hasOwn(e.road(10,10),'upgrade'),false);assert.equal(e.multiplier(336,336,'truck'),target.truckSpeed);
  assert.equal(e.commit([cell],resources,()=>false,conditions(id,'upgrade')).ok,false);assert.deepEqual(resources,paid);
 }
 for(const [key,n]of Object.entries(D.SURFACES.logistics.cost))assert.equal(resources[key],initial[key]-n,'sequential upgrades equal one complete final surface');
 assert.equal(e.state.stats.laid,1,'an upgrade does not invent another road cell');
});
test('voirie150 : une rénovation directe conserve la piste payée et exige seulement la différence',()=>{
 const e=new D.Engine();e.commit([cell],stock());finish(e);const resources=stock();
 const q=e.commit([cell],resources,()=>false,conditions('logistics','upgrade'));assert.deepEqual(q.cost,{stone:12,scrap:7,fuel:1});
 assert.equal(e.road(10,10).progress,1);assert.equal(D.surface(e.road(10,10)).id,'gravel');finish(e);assert.equal(D.surface(e.road(10,10)).id,'logistics');
});
test('voirie150 : rénovation manquante, chantier existant, obstacle, manque de stock et rétrogradation sont atomiques',()=>{
 const e=new D.Engine(),resources=stock();e.commit([cell],resources);finish(e);
 const before=e.snapshot(),paid={...resources};
 assert.equal(e.commit([cell,{x:11,y:10}],resources,()=>false,conditions('paving','upgrade')).ok,false);
 assert.equal(e.commit([cell],resources,()=>true,conditions('paving','upgrade')).ok,false);
 assert.equal(e.commit([cell],{...resources,stone:0},()=>false,conditions('paving','upgrade')).ok,false);
 assert.deepEqual(e.snapshot(),before);assert.deepEqual(resources,paid);
 e.commit([cell],resources,()=>false,conditions('paving','upgrade'));finish(e);const upgraded=e.snapshot(),stockAfter={...resources};
 assert.equal(e.commit([cell],resources,()=>false,conditions('gravel','upgrade')).ok,false);assert.deepEqual(e.snapshot(),upgraded);assert.deepEqual(resources,stockAfter);
 const pending=new D.Engine();pending.commit([cell],stock());assert.equal(pending.commit([cell],stock(),()=>false,conditions('paving','upgrade')).ok,false);
});
for(const invalid of [
 {surface:'unknown'},{surface:null},{surface:'toString'},
 {upgrade:{surface:'paving',progress:0}},
 {progress:1,upgrade:{surface:'gravel',progress:0}},
 {progress:1,upgrade:{surface:'concrete',progress:1}},
 {progress:1,upgrade:{surface:'concrete',progress:NaN}},
 {progress:1,upgrade:{surface:'concrete',progress:.5,extra:true}},
 {progress:1,upgrade:null}
])test('voirie150 : sauvegarde de revêtement ou rénovation mal formée refusée '+JSON.stringify(invalid),()=>{
 const raw={...D.create(),roads:[{...cell,progress:.5,...invalid}]};assert.throws(()=>D.normalize(raw),/Réseau de cité invalide/);
});
test('voirie150 : suppression de chantier de rénovation ne rembourse et ne duplique rien',()=>{
 const e=new D.Engine(),resources=stock();e.commit([cell],resources);finish(e);e.commit([cell],resources,()=>false,conditions('paving','upgrade'));const paid={...resources};
 assert.equal(e.remove(10,10),true);assert.equal(e.multiplier(336,336),1);assert.equal(e.remove(10,10),false);assert.deepEqual(resources,paid);assert.deepEqual(e.state.roads,[]);
});
