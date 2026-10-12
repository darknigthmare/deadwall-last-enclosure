'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const C=require('../src/core.js'),A=require('../src/d17-art149.js'),V=require('../src/building-variants157.js');
const stable=g=>{const {timestamp,...data}=g.serialize();return data;};

test('163: delivery version is an exact single menu token, never an obsolete range or substring',async()=>{
 const {matchesDeliveryVersion163:match}=await import('../scripts/browser-proof163.mjs');
 assert.ok(match('1.57.0','VERSION 1.57.0 · LIEUX ET VARIANTES'));
 assert.ok(match('1.58.0-candidate.1','VERSION 1.58.0-candidate.1 · TEST'));
 for(const text of ['VERSION 1.53.0','VERSION 1.57.00','VERSION 11.57.0','VERSION 1.57.0-next','BUILD 1.57.0','VERSION 1.57.0 VERSION 1.57.0'])assert.equal(match('1.57.0',text),false,text);
 assert.equal(match('','VERSION '),false);assert.equal(match(null,'VERSION 1.57.0'),false);
});

test('163: exact core probe accepts seeded base/alternate and rejects wrong crop, destination, atlas and unrelated draws',async()=>{
 const {observeCoreFrame163}=await import('../scripts/browser-proof163.mjs');
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();g.togglePause(true);
 const core=g.core(),images={},seed=g.world.seed,originalTier=g.tier,originalRender=g.render,originalArt=g.art;
 for(const name of Object.keys(globalThis.DeadwallArt.ASSETS))images[name]={};
 const calls=[],art={images,diagnostics:{ready:new Set(Object.keys(images)),failed:new Set()},blit(c,atlas,source,...destination){calls.push({atlas,source,destination});return true;}};
 const context={drawImage(){}};
 let corrupt=null;
 art.drawBuilding=function(c,b){
  if(corrupt){const spec=V.alternateFor(A.coreSprite(g.tier.id),b.id,seed,images)||A.SPRITES[A.coreSprite(g.tier.id)],f=A.measure(A.coreSprite(g.tier.id),b,{rise:56,sprite:spec});
   if(corrupt==='atlas')f.atlas='d17Housing149';if(corrupt==='crop')f.source=f.source.map((n,i)=>i===0?n+1:n);if(corrupt==='destination')f.destination=f.destination.map((n,i)=>i===0?n+1:n);
   return this.blit(c,f.atlas,f.source,...f.destination);
  }
  return A.drawCore(c,this,b,g.tier.id,{seed});
 };
 g.art=art;g.render=()=>art.drawBuilding(context,core);const painter=art.drawBuilding,blit=art.blit;
 try{
  for(const age of [0,2,4,10]){
   g.tier=C.CITY_TIERS[age];const before=stable(g);const result=observeCoreFrame163();assert.ok(result.exactDraw&&result.savedUnchanged);assert.equal(result.age,age);assert.deepEqual(stable(g),before);
   assert.equal(art.drawBuilding,painter);assert.equal(art.blit,blit);
  }
  for(const error of ['atlas','crop','destination']){corrupt=error;assert.equal(observeCoreFrame163().exactDraw,false,error);}
  corrupt=null;g.render=()=>art.drawBuilding(context,{...core,id:core.id+1});assert.equal(observeCoreFrame163().exactDraw,false,'another core-shaped support is not the real core');
  g.render=()=>{throw Error('render fault');};assert.throws(()=>observeCoreFrame163(),/render fault/);assert.equal(art.drawBuilding,painter);assert.equal(art.blit,blit);
 }finally{g.art=originalArt;g.render=originalRender;g.tier=originalTier;}
});

async function depletedScene(){
 const fixtures=await import('../scripts/browser-defenses-fixtures148.mjs');const {g}=bootDocument134();g.startNew('standard','903148');g.campaignIntro132.skip();g.togglePause(true);
 fixtures.defenseCampFixture();fixtures.defenseServiceFixture({type:'spikes',bag:C.FortificationPackRules.mechanisms.ankle.cost});g.showCommand(true);const id=globalThis.__DEFENSE148_CAMP__.spikes;
 assert.ok(g.fortificationPack.startMechanism('ankle',id).ok);g.showCommand(false);g.togglePause(false);for(let i=0;i<81;i++)g.fortificationPack.step(.1);
 g.togglePause(true);fixtures.defenseServiceFixture({type:'core'});const contact=fixtures.defenseContactFixture({kind:'armored',trap:true,count:6});
 g.togglePause(false);for(let i=0;i<400;i++){g.updateZombies(.04);g.rebuildBuckets();const m=g.fortificationPack.snapshot().fittings.find(f=>f.id===id)?.mechanism;assert.ok(m,'paid support survives depletion');if(m.charges===0)break;}
 g.togglePause(true);const mechanism=g.fortificationPack.snapshot().fittings.find(f=>f.id===id)?.mechanism;assert.equal(mechanism.charges,0);assert.ok(mechanism.caught.length>0&&mechanism.caught.length<contact.ids.length,'the group contains both held and free contacts');
 return {g,fixtures,contact,id};
}

test('163: full explicit group departure preserves every non-position saved field and lets ordinary holds expire',async()=>{
 const {g,fixtures,contact,id}=await depletedScene(),before=stable(g),support=g.world.buildings.get(id),health=support.health;
 const result=fixtures.defenseHeldContactDepartureFixture({ids:contact.ids}),after=stable(g);
 assert.equal(result.moves.length,6);assert.ok(result.moves.some(m=>m.holdRemaining===null));
 for(const move of result.moves){assert.ok(g.hostilePositionClear(g.zombies.find(z=>z.id===move.id),move.to.x,move.to.y));assert.ok(Math.hypot(move.to.x-support.x,move.to.y-support.y)>=400-1e-8);const z=after.zombies.find(z=>z.id===move.id);z.x=move.from.x;z.y=move.from.y;}
 assert.deepEqual(after,before,'only declared actor coordinates change');
 for(let i=0;i<g.zombies.length;i++)for(const b of g.zombies.slice(i+1))assert.ok(Math.hypot(g.zombies[i].x-b.x,g.zombies[i].y-b.y)>g.zombies[i].radius+b.radius+2);
 g.togglePause(false);for(let i=0;i<80;i++){g.updateZombies(.04);g.rebuildBuckets();}g.togglePause(true);
 const m=g.fortificationPack.snapshot().fittings.find(f=>f.id===id)?.mechanism;assert.ok(m);assert.equal(m.charges,0);assert.deepEqual(m.caught,[]);assert.equal(support.health,health);assert.equal(g.zombies.length,6);
 assert.doesNotThrow(()=>globalThis.DeadwallSave.validate(g.serialize()));
});

test('163: departure rejects incomplete, duplicate, absent or blocked contacts before any position changes',async()=>{
 const {g,fixtures,contact}=await depletedScene();
 for(const ids of [[],[contact.ids[0],contact.ids[0]],[...contact.ids,999999],[...contact.ids,'bad']]){const before=stable(g);assert.throws(()=>fixtures.defenseHeldContactDepartureFixture({ids}));assert.deepEqual(stable(g),before);}
 const before=stable(g),clear=g.hostilePositionClear;let queries=0;g.hostilePositionClear=()=>++queries===1;
 try{assert.throws(()=>fixtures.defenseHeldContactDepartureFixture({ids:contact.ids}),/No physical departure/);assert.deepEqual(stable(g),before,'even a later placement failure cannot leave a partial move');}finally{g.hostilePositionClear=clear;}
});
