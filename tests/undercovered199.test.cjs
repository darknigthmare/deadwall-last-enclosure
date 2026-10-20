'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),{fixture,stock}=require('./helpers/husbandry199.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
for(const species of ['constructor','toString','__proto__'])test('199 malformed captive species '+species+' is rejected without a full world',()=>{
 const f=fixture(),s=stock();s.animals[0].species=species;s.animals.pop();assert.throws(()=>f.api.validate(s),/invalide/);
});
test('199 shortage damage is proportional to time without provisions rather than the full final tick',()=>{
 const f=fixture(),s=stock(),dt=.1;s.animals.pop();s.pens[0].food=C.Husbandry191Rules.foodPerSecond*dt/2;
 f.restore(s);f.g.husbandry191.step(dt);
 assert.ok(Math.abs(f.read().animals[0].health-(100-C.Husbandry191Rules.starveDamage*dt/2))<1e-10);
 assert.equal(f.read().pens[0].food,0);
});
for(const owner of ['fieldcraft','siege'])test('199 '+owner+' held equipment prevents enclosure work before payment',()=>{
 const f=fixture();f.g[owner]=owner==='fieldcraft'?{context:()=>({mounted:true})}:{toolActive:()=>true};const before=clone(f.g.player.carry);
 assert.equal(f.g.husbandry191.begin('build').ok,false);assert.deepEqual(f.g.player.carry,before);assert.equal(f.g.husbandry191.busy(),false);
});
function watered(){
 const f=fixture(),engine=new C.Siege.Engine();
 f.g.siege={carriedWater199:()=>engine.state.playerWater,toolActive:()=>false,
  transferFieldWater199:(d,n)=>engine.fieldWater(d,n,{running:!f.g.paused&&!f.g.activeOverlay,accessible:true,secure:true,dead:false})};
 return{...f,engine};
}
function finish(f){for(let i=0;i<160&&f.g.husbandry191.busy();i++)f.g.husbandry191.step(.1);assert.equal(f.g.husbandry191.busy(),false,f.g.husbandry191.overview().summary);}
const context={running:true,accessible:true,secure:true,dead:false};
test('199 surface collection and pouring share the existing bucket and finite counters',()=>{
 const e=new C.Siege.Engine();assert.equal(e.fieldWater('fill',6,context),6);assert.equal(e.fieldWater('fill',6,context),2);assert.equal(e.fieldWater('fill',1,context),0);
 assert.equal(e.fieldWater('pour',6,context),6);assert.equal(e.fieldWater('pour',3,context),0);assert.equal(e.state.playerWater,2);
 assert.equal(e.state.stats.waterProduced,8);assert.equal(e.state.stats.waterUsed,6);e.playerDown();assert.equal(e.state.playerWater,0);assert.equal(e.state.stats.waterLost,2);
 assert.deepEqual(C.Siege.normalize(e.snapshot()),e.snapshot());
});
test('199 invalid or unavailable bucket transfers have no partial mutation',()=>{
 const e=new C.Siege.Engine();e.fieldWater('fill',4,context);const before=e.snapshot();
 for(const n of [-1,0,NaN,Infinity,'1',9])for(const dir of ['fill','pour'])assert.equal(e.fieldWater(dir,n,context),0);
 for(const ctx of [null,{...context,running:false},{...context,secure:false},{...context,accessible:false},{...context,dead:true}])for(const dir of ['fill','pour'])assert.equal(e.fieldWater(dir,1,ctx),0);
 assert.equal(e.fieldWater('invalid',1,context),0);assert.deepEqual(e.snapshot(),before);
});
test('199 a real bank source is checked throughout filling; pause cannot fill the bucket',()=>{
 const f=watered(),waterAt=(x,y)=>({water:x>f.position.x+.4,salinity:'fresh'});f.world.hydrology.sample=waterAt;const bag=clone(f.g.player.carry);
 assert.ok(f.g.husbandry191.begin('fill-bucket').ok);f.g.paused=true;for(let i=0;i<100;i++)f.g.husbandry191.step(.1);
 assert.equal(f.engine.state.playerWater,0);assert.equal(f.g.husbandry191.view().task.progress,0);f.g.paused=false;finish(f);
 assert.equal(f.engine.state.playerWater,6);assert.deepEqual(f.g.player.carry,bag);
 assert.ok(f.g.husbandry191.begin('fill-bucket').ok);finish(f);assert.equal(f.engine.state.playerWater,8);assert.equal(f.g.husbandry191.begin('fill-bucket').ok,false);
});
for(const fault of ['salt','blocked','moved','cancel','restored'])test('199 '+fault+' prevents a pending fill from granting water',()=>{
 const f=watered();f.world.hydrology.sample=(x,y)=>({water:x>12.4,salinity:'fresh'});assert.ok(f.g.husbandry191.begin('fill-bucket').ok);
 if(fault==='salt')f.world.hydrology.sample=(x,y)=>({water:x>12.4,salinity:'salt'});
 if(fault==='blocked')f.world.wildlifeWaterLine=()=>false;
 if(fault==='moved')f.position.y+=1;
 if(fault==='cancel')f.g.husbandry191.cancel();
 if(fault==='restored')f.restore(f.read());
 finish(f);assert.equal(f.engine.state.playerWater,0);assert.equal(f.engine.state.stats.waterProduced,0);
});
test('199 carrying water to a dry enclosure transfers only its actual remaining capacity',()=>{
 const f=watered(),s=stock();s.animals=[];s.pens[0].water=39;f.restore(s);f.engine.fieldWater('fill',6,context);
 assert.equal(f.g.husbandry191.quote('water',1).ok,false);assert.ok(f.g.husbandry191.begin('water-carried',1).ok);finish(f);
 assert.equal(f.read().pens[0].water,40);assert.equal(f.engine.state.playerWater,5);assert.equal(f.engine.state.stats.waterUsed,1);
 const before=f.engine.snapshot();assert.equal(f.g.husbandry191.begin('water-carried',1).ok,false);assert.deepEqual(f.engine.snapshot(),before);
});
test('199 losing carried water during an intervention does not create water in its destination',()=>{
 const f=watered(),s=stock();s.animals=[];s.pens[0].water=0;f.restore(s);f.engine.fieldWater('fill',6,context);
 assert.ok(f.g.husbandry191.begin('water-carried',1).ok);f.engine.playerDown();finish(f);assert.equal(f.read().pens[0].water,0);
});
test('199 repair with carried materials preserves all finite products and does not require slaughter',()=>{
 const f=fixture(),s=stock();s.animals=[];Object.assign(s.pens[0],{health:90,meat:2,hides:1,leather:0});f.restore(s);const bag=clone(f.g.player.carry);
 assert.ok(f.g.husbandry191.begin('repair',1).ok);finish(f);const p=f.read().pens[0];assert.equal(p.health,100);assert.equal(p.meat,2);assert.equal(p.hides,1);assert.equal(p.leather,0);assert.ok(p.meatAge>0);
 assert.equal(f.g.player.carry.wood,bag.wood-C.Husbandry191Rules.repairCost.wood);assert.equal(f.g.player.carry.scrap,bag.scrap-C.Husbandry191Rules.repairCost.scrap);
 const paid=clone(f.g.player.carry);assert.equal(f.g.husbandry191.begin('repair',1).ok,false);assert.deepEqual(f.g.player.carry,paid);
});
test('199 paid repairs cannot resurrect a fence destroyed during work',()=>{
 const f=fixture(),s=stock();s.animals=[];s.pens[0].health=.1;f.restore(s);assert.ok(f.g.husbandry191.begin('repair',1).ok);const paid=clone(f.g.player.carry);
 f.g.worldEvolution={groupMembers:()=>[{x:13.8,y:12,z:0,hp:40}]};finish(f);assert.equal(f.read().pens[0].health,0);assert.deepEqual(f.g.player.carry,paid);assert.equal(f.g.husbandry191.quote('repair',1).ok,false);
});
test('199 local reproduction can be paused, persists, and still requires upkeep',()=>{
 const f=fixture(),s=stock();s.pens[0].breed=899.95;f.restore(s);assert.ok(f.g.husbandry191.begin('breeding-off',1).ok);
 const disabled=f.read();assert.equal(disabled.pens[0].breeding199,false);assert.equal(disabled.pens[0].breed,0);f.restore(disabled);f.g.husbandry191.step(.1);
 assert.equal(f.read().animals.length,2);assert.equal(f.read().pens[0].breed,0);assert.ok(f.read().pens[0].food<disabled.pens[0].food);assert.ok(f.read().animals[0].age>disabled.animals[0].age);
 assert.ok(f.g.husbandry191.begin('breeding-on',1).ok);f.g.husbandry191.step(.1);assert.equal(f.read().animals.length,2);assert.ok(f.read().pens[0].breed>0);
});
test('199 optional reproduction preference preserves old saves and rejects invalid combinations',()=>{
 const f=fixture(),s=stock();assert.deepEqual(clone(f.api.validate(s)),s);
 for(const value of ['false',0,null,{}]){const bad=clone(s);bad.pens[0].breeding199=value;assert.throws(()=>f.api.validate(bad));}
 const pending=clone(s);pending.pens[0].breeding199=false;pending.pens[0].breed=1;assert.throws(()=>f.api.validate(pending));
});
test('199 switching natural behaviors off and on cannot reset an attack cooldown',()=>{
 const f=fixture();let damage=0;f.g.frontier.damage=n=>damage+=n;assert.ok(f.g.husbandry191.begin('behaviors').ok);
 const boar={id:'A189_0_0_3',species:'boar',x:12,y:15,z:0,hp:1,alarm:2,profile:{health:20}};
 f.g.husbandry191.naturalIntent(boar);assert.equal(damage,C.Husbandry191Rules.boarDamage);assert.ok(f.g.husbandry191.begin('behaviors-off').ok);assert.equal(f.read().behaviors,false);
 f.g.husbandry191.naturalIntent(boar);assert.ok(f.g.husbandry191.begin('behaviors').ok);f.g.husbandry191.naturalIntent(boar);assert.equal(damage,C.Husbandry191Rules.boarDamage);
 f.g.elapsed+=C.Husbandry191Rules.boarCooldown;f.g.husbandry191.naturalIntent(boar);assert.equal(damage,2*C.Husbandry191Rules.boarDamage);
});
test('199 querying logistics actions never advances stocks, water, birth timers or the random owner',()=>{
 const f=watered();f.restore(stock());const state=clone(f.read()),water=f.engine.snapshot(),bag=clone(f.g.player.carry);
 for(let i=0;i<30;i++){f.g.husbandry191.overview();f.g.husbandry191.actions();f.g.husbandry191.view();}
 assert.deepEqual(clone(f.read()),state);assert.deepEqual(f.engine.snapshot(),water);assert.deepEqual(f.g.player.carry,bag);
});
test('199 a field-filled bucket is the same finite reserve consumed by fire suppression',()=>{
 const e=new C.Siege.Engine(),house={id:3,type:'house',x:500,y:500,w:2,h:2,health:1000,maxHealth:1000,progress:1,completed:true,powered:true,dead:false,def:{health:1000,size:[2,2]}};
 assert.ok(e.ignite(house,'blast'));assert.equal(e.fieldWater('fill',6,context),6);
 const used=e.suppress(3,0,.25,context);assert.ok(used>0);assert.equal(e.state.playerWater,6-used);assert.equal(e.state.stats.waterUsed,used);
 const poured=e.fieldWater('pour',2,context);assert.equal(poured,2);assert.equal(e.state.playerWater,6-used-2);assert.equal(e.state.stats.waterUsed,used+2);
 const restored=new C.Siege.Engine(e.snapshot());assert.deepEqual(restored.snapshot(),e.snapshot());assert.equal(restored.fieldWater('pour',6,context),0);
});
test('199 a failed local save warns without claiming persistence, retrying the action or discarding its state',()=>{
 const f=fixture(),s=stock(),notices=[];f.restore(s);f.g.save=()=>false;f.g.notify=(message,kind)=>notices.push({message,kind});
 assert.ok(f.g.husbandry191.begin('breeding-off',1).ok);assert.equal(f.read().pens[0].breeding199,false);
 assert.equal(notices.length,1);assert.equal(notices[0].kind,'danger');assert.match(notices[0].message,/Stockage indisponible/);assert.doesNotMatch(notices[0].message,/stocks et captivité sauvegardés/);
 const before=clone(f.read());assert.equal(f.g.husbandry191.begin('breeding-off',1).ok,false);assert.deepEqual(clone(f.read()),before);
});
test('199 malformed enclosure objects keep the clear validation error instead of failing optional-field inspection',()=>{
 const f=fixture();for(const value of [null,undefined,[],42,'pen']){const s=stock();s.pens[0]=value;assert.throws(()=>f.api.validate(s),/Registre des enclos/);}
});
