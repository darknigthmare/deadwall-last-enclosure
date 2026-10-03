'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const O=require('./deadwall-ops/operations.js');
const bag=(value=0)=>Object.fromEntries(O.KEYS.map(k=>[k,value]));
const context=(changes={})=>({resources:bag(1000),storage:10000,insight:0,insightMax:1e12,morale:50,tier:6,wave:10,dead:false,canCommand:true,running:true,atBase:true,siteAvailable:true,atSite:true,accessible:true,secure:true,hasBuilding:()=>true,capacity:36,normalCarry:0,action:true,...changes});
function prepare(e,id,ctx){assert.equal(e.start(id,ctx).ok,true);for(let i=0;i<O.get(id).seconds*4;i++)assert.equal(e.work(.25,ctx).ok,true);assert.equal(e.state.active.phase,'returning');}
function complete(e,id,ctx){prepare(e,id,ctx);const r=e.deliver(ctx);assert.equal(r.ok,true);return r;}
const copy=o=>structuredClone(o);

test('catalogue: twelve unique contracts on six existing themes',()=>{assert.equal(O.CONTRACTS.length,12);assert.equal(new Set(O.CONTRACTS.map(d=>d.id)).size,12);for(const theme of ['housing','market','aid','industry','transit','checkpoint'])assert.equal(O.CONTRACTS.filter(d=>d.theme===theme).length,2);});
test('catalogue: four unique, fully linked building plans',()=>{assert.equal(Object.keys(O.BUILDINGS).length,4);for(const [type,id]of Object.entries(O.BLUEPRINTS)){assert.equal(O.get(id).unlock,type);assert.ok(O.BUILDINGS[type].powerUse>0);assert.ok(O.BUILDINGS[type].requires);}});
test('catalogue: all costs/cargo are finite positive existing resources',()=>{for(const d of O.CONTRACTS){for(const field of ['cost','cargo'])for(const [k,n]of Object.entries(d[field])){assert.ok(O.KEYS.includes(k));assert.ok(n>0&&Number.isFinite(n));}assert.ok(O.sum(d.cargo)<=36);assert.ok(d.seconds<d.timeLimit);assert.ok(d.insight>=0);}});
test('catalogue: all dependencies resolve without cycles',()=>{for(const d of O.CONTRACTS){const seen=new Set();let n=d;while(n){assert.ok(!seen.has(n.id));seen.add(n.id);n=n.prerequisite?O.get(n.prerequisite):null;}assert.ok(!d.requires||typeof d.requires==='string');}});
test('catalogue cannot be mutated by UI code',()=>{assert.throws(()=>O.CONTRACTS[0].cost.food=0,TypeError);assert.throws(()=>O.BUILDINGS.fieldKitchen.powerUse=0,TypeError);});
test('fresh state and snapshots are detached',()=>{const e=new O.Engine(),s=e.snapshot();s.completed.push('aid-cache');assert.deepEqual(e.state.completed,[]);assert.deepEqual(O.normalize(),O.create());});

for(const d of O.CONTRACTS)test('campaign: full trip and exactly-once delivery — '+d.id,()=>{
 const e=new O.Engine(),c=context();if(d.prerequisite)complete(e,d.prerequisite,c);
 const before=copy(c.resources),beforeI=c.insight;prepare(e,d.id,c);
 for(const k of O.KEYS)assert.equal(c.resources[k],before[k]-(d.cost[k]||0),'no remote reward '+k);
 assert.equal(e.cargoMass(),O.sum(d.cargo));
 const loaded=O.normalize(e.snapshot());assert.equal(loaded.active.phase,'returning');
 const restored=new O.Engine(loaded),r=restored.deliver(c);assert.equal(r.ok,true);assert.equal(c.insight,beforeI+d.insight);
 for(const k of O.KEYS)assert.equal(c.resources[k],before[k]-(d.cost[k]||0)+(d.cargo[k]||0));
 const final=copy(c.resources);assert.equal(restored.deliver(c).ok,false);assert.equal(restored.start(d.id,c).ok,false);assert.deepEqual(c.resources,final);assert.equal(restored.cargoMass(),0);
 assert.deepEqual(O.normalize(restored.snapshot()),restored.snapshot());
});
for(const [label,patch]of [
 ['away from depot',{atBase:false}],['dead commander',{dead:true}],['no command permission',{canCommand:false}],['missing site',{siteAvailable:false}],['wave gate',{wave:0}],['tier gate',{tier:0}],['missing stock',{resources:bag(0)}]
])test('departure rejects '+label+' without consuming anything',()=>{const e=new O.Engine(),c=context(patch),before=copy(c.resources);assert.equal(e.start('industry-fuel',c).ok,false);assert.deepEqual(c.resources,before);assert.equal(e.state.active,null);});
test('only one active contract can charge preparation',()=>{const e=new O.Engine(),c=context();assert.equal(e.start('aid-cache',c).ok,true);const stock=copy(c.resources);assert.equal(e.start('market-cache',c).ok,false);assert.deepEqual(c.resources,stock);});
test('unknown/prototype contract names cannot start',()=>{for(const id of ['__proto__','constructor','toString',null,{},'made-up']){const e=new O.Engine(),c=context();assert.equal(e.start(id,c).ok,false);}});
test('parent mission must be delivered, not merely loaded',()=>{const e=new O.Engine(),c=context();prepare(e,'aid-cache',c);e.fail('abandoned');assert.equal(e.start('aid-sterile',c).ok,false);});
test('missing prerequisite building prevents departure',()=>{const e=new O.Engine(),c=context();complete(e,'aid-cache',c);c.hasBuilding=()=>false;const stock=copy(c.resources);assert.equal(e.start('aid-sterile',c).ok,false);assert.deepEqual(c.resources,stock);});

for(const [label,patch]of [
 ['release action',{action:false}],['paused simulation',{running:false}],['outside site',{atSite:false}],['wall blocks access',{accessible:false}],['nearby infected',{secure:false}],['insufficient bag room',{normalCarry:35}],['commander down',{dead:true}]
])test('work pauses for '+label+' without progress or cargo',()=>{const e=new O.Engine(),c=context();e.start('aid-cache',c);Object.assign(c,patch);const before=e.snapshot();assert.equal(e.work(.1,c).ok,false);assert.deepEqual(e.snapshot(),before);assert.equal(e.cargoMass(),0);});
test('building loss during survey pauses mission without recreating infrastructure',()=>{const e=new O.Engine(),c=context();complete(e,'aid-cache',c);e.start('aid-sterile',c);c.hasBuilding=()=>false;assert.equal(e.work(.25,c).ok,false);assert.equal(e.state.active.work,0);});
test('work preserves progress when contacts enter, then resumes',()=>{const e=new O.Engine(),c=context();e.start('aid-cache',c);e.work(.25,c);c.secure=false;for(let i=0;i<20;i++)e.work(.25,c);assert.equal(e.state.active.work,.25);c.secure=true;e.work(.25,c);assert.equal(e.state.active.work,.5);});
test('gameplay dt validation prevents NaN, negative time and frame skipping',()=>{for(const dt of [NaN,Infinity,-1,0,1,300,'0.1']){const e=new O.Engine(),c=context();e.start('aid-cache',c);const state=e.snapshot();e.tick(dt,c);e.work(dt,c);assert.deepEqual(e.snapshot(),state);}});
test('pause stops mission deadline',()=>{const e=new O.Engine(),c=context();e.start('aid-cache',c);const t=e.state.active.remaining;c.running=false;for(let i=0;i<500;i++)e.tick(.25,c);assert.equal(e.state.active.remaining,t);});
test('time expiry removes cargo and keeps preparation spent',()=>{const e=new O.Engine(),c=context();prepare(e,'aid-cache',c);const stock=copy(c.resources);for(let i=0;i<1000;i++)e.tick(.25,c);assert.equal(e.state.active,null);assert.equal(e.state.failures['aid-cache'],1);assert.equal(e.state.last.result,'timeout');assert.deepEqual(c.resources,stock);});
test('downed commander loses mission before any return can pay',()=>{const e=new O.Engine(),c=context();prepare(e,'aid-cache',c);c.dead=true;const stock=copy(c.resources);assert.equal(e.tick(.04,c).event,'failed');assert.equal(e.deliver(c).ok,false);assert.deepEqual(c.resources,stock);});
test('abort is stale-safe and provides no refund or reward',()=>{const e=new O.Engine(),c=context();e.start('aid-cache',c);const stock=copy(c.resources);assert.equal(e.abort('market-cache',c).ok,false);assert.equal(e.abort('aid-cache',c).ok,true);assert.deepEqual(c.resources,stock);assert.equal(e.abort('aid-cache',c).ok,false);});
test('retry pays again and eventually unlocks its single reward',()=>{const e=new O.Engine(),c=context();e.start('aid-cache',c);e.abort('aid-cache',c);const stock=copy(c.resources);complete(e,'aid-cache',c);assert.equal(c.resources.food,stock.food-O.get('aid-cache').cost.food+12);assert.equal(e.state.failures['aid-cache'],1);});
test('full storage refuses the entire package; no partial reward exploit',()=>{const e=new O.Engine(),c=context();prepare(e,'aid-cache',c);c.resources.medicine=c.storage;const before=copy(c.resources),state=e.snapshot();assert.equal(e.deliver(c).ok,false);assert.deepEqual(c.resources,before);assert.deepEqual(e.snapshot(),state);c.resources.medicine-=8;assert.equal(e.deliver(c).ok,true);assert.equal(c.resources.medicine,c.storage);});
test('insight at its cap refuses delivery atomically',()=>{const e=new O.Engine(),c=context();prepare(e,'aid-cache',c);c.insight=c.insightMax;const before=copy(c.resources);assert.equal(e.deliver(c).ok,false);assert.deepEqual(c.resources,before);});
test('morale clamps at 100 only on delivery',()=>{const e=new O.Engine(),c=context({morale:99});prepare(e,'aid-cache',c);assert.equal(c.morale,99);e.deliver(c);assert.equal(c.morale,100);});
test('return through a closed route is refused',()=>{const e=new O.Engine(),c=context();prepare(e,'aid-cache',c);c.atBase=false;assert.equal(e.deliver(c).ok,false);});
test('unlock requires completed return, not survey',()=>{const e=new O.Engine(),c=context();complete(e,'market-cache',c);prepare(e,'market-kitchen',c);assert.equal(e.canBuild('fieldKitchen'),false);assert.equal(e.canBuild('woodWall'),true);e.deliver(c);assert.equal(e.canBuild('fieldKitchen'),true);});
test('resource corruption cannot be converted into rewards or purchases',()=>{for(const n of [NaN,Infinity,-1,'10']){const c=context(),e=new O.Engine();c.resources.food=n;assert.equal(e.start('aid-cache',c).ok,false);}});

const invalidStates=[
 s=>{s.version=2;},s=>{s.completed=['aid-cache','aid-cache'];},s=>{s.completed=['aid-sterile'];},s=>{s.completed=['__proto__'];},
 s=>{s.failures=null;},s=>{s.failures['aid-cache']=-1;},s=>{s.failures['aid-cache']=.5;},s=>{s.failures['aid-cache']=Infinity;},
 s=>{s.active={id:'aid-cache',phase:'returning',work:0,remaining:100};},s=>{s.active={id:'aid-cache',phase:'outbound',work:1,remaining:100};},
 s=>{s.active={id:'aid-cache',phase:'working',work:12,remaining:100};},s=>{s.active={id:'aid-cache',phase:'working',work:0,remaining:0};},
 s=>{s.active={id:'aid-cache',phase:'working',work:0,remaining:NaN};},s=>{s.active={id:'aid-cache',phase:'working',work:0,remaining:999};},
 s=>{s.active={id:'aid-sterile',phase:'outbound',work:0,remaining:50};},s=>{s.completed=['aid-cache'];s.active={id:'aid-cache',phase:'working',work:0,remaining:50};},
 s=>{s.last={id:'aid-cache',result:'delivered'};},s=>{s.last={id:'aid-cache',result:'timeout'};}
];
test('strict save state rejects malformed, duplicated and impossible transitions',()=>{for(const mutate of invalidStates){const state=O.create();mutate(state);assert.throws(()=>O.normalize(state));}});
test('normalizer drops unknown fields and untrusted cargo values',()=>{const e=new O.Engine(),c=context();prepare(e,'aid-cache',c);const state=e.snapshot();state.active.cargo={ammo:1e9};state.evil='discard';assert.deepEqual(O.normalize(state),e.snapshot());});
test('core integration upgrades save keys while preserving old keys as readable legacy',()=>{
 const base={BUILDINGS:{core:{id:'core'}},migrateSaveData:raw=>[1,2].includes(raw.version)?{...raw,version:2}:null,LEGACY_SAVE_KEYS:['deadwall-save-v1']};O.installCatalogue(base);
 assert.equal(base.SAVE_VERSION,3);assert.equal(base.SAVE_KEY,'deadwall-save-v3');assert.ok(base.LEGACY_SAVE_KEYS.includes('deadwall-save-v2'));assert.ok(base.LEGACY_SAVE_KEYS.includes('deadwall-save-backup-v2'));
 const old={version:2,worldSeed:123,resources:{food:14},nodes:[[1,2]]},fresh=base.migrateSaveData(old);assert.equal(fresh.version,3);assert.deepEqual(fresh.fieldOps,O.create());assert.equal(old.version,2);assert.equal(fresh.resources.food,14);assert.deepEqual(fresh.nodes,old.nodes);
 assert.equal(base.migrateSaveData({version:4}),null);assert.throws(()=>base.migrateSaveData({version:3}));assert.equal(base.migrateSaveData({version:3,fieldOps:O.create()}).version,3);
 const count=Object.keys(base.BUILDINGS).length;O.installCatalogue(base);assert.equal(Object.keys(base.BUILDINGS).length,count);
});
test('save adapter preserves the base validator and carries v3 operations transactionally',()=>{
 let called=0;const box={DeadwallCore:{},DeadwallOperations:O,DeadwallSave:{MAX_FILE_BYTES:8*1024*1024,validate:input=>{called++;if(input.bad)throw new Error('base failure');return {version:3,resources:input.resources};}},TextEncoder};vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(__dirname,'./deadwall-ops/operations-save.js'),'utf8'),box);
 const input={version:3,fieldOps:O.create(),resources:{food:8}};assert.equal(box.DeadwallSave.validate(input).fieldOps.version,1);assert.equal(called,1);assert.throws(()=>box.DeadwallSave.validate({...input,bad:true}),/base failure/);assert.throws(()=>box.DeadwallSave.parse('{broken'));assert.throws(()=>box.DeadwallSave.parse('é'.repeat(5*1024*1024)),/volumineuse/);assert.throws(()=>box.DeadwallSave.validate({version:3}));
 const legacy=box.DeadwallSave.validate({version:2,fieldOps:{forged:true}});assert.deepEqual(legacy.fieldOps,O.create());
});

const b=type=>({type,dead:false,completed:true,powered:true,powerShare:1,def:O.BUILDINGS[type]});
const logContext=changes=>({resources:bag(100),storage:500,population:10,buildings:[],hasResearch:()=>false,activeCrisis:null,...changes});
test('new industry costs are coupled to existing material and energy systems',()=>{for(const type of ['fieldKitchen','dressingWorkshop','recoveryBench']){const def=O.BUILDINGS[type];assert.ok(def.powerUse>0);assert.ok(Object.keys(def.consumes).length);assert.ok(def.score>0);}});
test('logistics accounts for food upkeep',()=>{const r=O.logistics(logContext());const food=r.rows.find(r=>r.key==='food');assert.ok(Math.abs(food.consumption-3.9)<1e-10);assert.ok(Math.abs(food.net+3.9)<1e-10);});
test('logistics includes generator fuel and grid doctrine',()=>{const gen={type:'generator',completed:true,def:{powerGen:24}},a=O.logistics(logContext({buildings:[gen]})),z=O.logistics(logContext({buildings:[gen],hasResearch:id=>id==='grid'}));assert.equal(a.generatorUse,1.0799999999999998);assert.ok(Math.abs(z.generatorUse-.81)<1e-10);});
test('saturated output does not consume workshop inputs',()=>{const c=logContext({buildings:[b('dressingWorkshop')],population:0});c.resources.medicine=500;const r=O.logistics(c);assert.equal(r.pausedIndustry,1);assert.equal(r.rows.find(x=>x.key==='scrap').consumption,0);assert.equal(r.rows.find(x=>x.key==='food').consumption,0);});
test('missing input stops production',()=>{const c=logContext({buildings:[b('recoveryBench')]});c.resources.fuel=0;assert.equal(O.logistics(c).rows.find(r=>r.key==='scrap').production,0);});
test('partial power reduces throughput, and blackout halves it again',()=>{const unit=b('dressingWorkshop');unit.powered=false;unit.powerShare=.5;const c=logContext({buildings:[unit],population:0});const a=O.logistics(c).rows.find(r=>r.key==='medicine').production;c.activeCrisis={id:'blackout',status:'resolved',choice:'B'};const reduced=O.logistics(c).rows.find(r=>r.key==='medicine').production;assert.ok(Math.abs(a-.4725)<1e-10);assert.ok(Math.abs(reduced-a/2)<1e-10);});
test('construction, ruins and empty power allocations produce nothing',()=>{const a=b('fieldKitchen'),z=b('fieldKitchen'),u=b('fieldKitchen');a.dead=true;z.completed=false;u.powered=false;u.powerShare=0;assert.equal(O.logistics(logContext({buildings:[a,z,u]})).rows.find(r=>r.key==='food').production,0);});
test('logistics is a read-only snapshot, never an economic tick',()=>{const c=logContext({buildings:[b('dressingWorkshop')]}),stock=copy(c.resources);for(let i=0;i<100;i++)O.logistics(c);assert.deepEqual(c.resources,stock);});
test('adversarial seeded event stream preserves valid states and bounded records',()=>{
 let seed=2132;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);const e=new O.Engine(),c=context();
 for(let i=0;i<6000;i++){
   c.running=random()>.1;c.canCommand=c.running;c.dead=random()<.005;c.action=random()>.2;c.secure=random()>.2;c.atSite=random()>.15;c.atBase=random()>.5;
   const action=Math.floor(random()*6);
   if(action===0)e.start(O.CONTRACTS[Math.floor(random()*12)].id,c);else if(action===1)e.work(.25,c);else if(action===2)e.tick(.25,c);else if(action===3)e.deliver(c);else if(action===4)e.abort(e.state.active?.id,c);else {const state=O.normalize(e.snapshot());assert.deepEqual(state,e.snapshot());}
   assert.ok(Object.values(c.resources).every(n=>Number.isFinite(n)&&n>=0));assert.ok(e.state.completed.length<=12);assert.equal(new Set(e.state.completed).size,e.state.completed.length);
 }
 assert.deepEqual(O.normalize(e.snapshot()),e.snapshot());
});

test('v3 migration still invokes the inherited normalizer and detaches its registry',()=>{
 let normalizations=0;
 const base={BUILDINGS:{},LEGACY_SAVE_KEYS:['deadwall-save-v1'],migrateSaveData(raw){normalizations++;return {...raw,research:{completed:[...new Set(raw.research?.completed||[])]},version:2};}};
 O.installCatalogue(base);
 const input={version:3,fieldOps:O.create(),research:{completed:['grid','grid']}},result=base.migrateSaveData(input);
 assert.equal(normalizations,1);assert.equal(result.version,3);assert.deepEqual(result.research.completed,['grid']);
 result.fieldOps.completed.push('aid-cache');assert.equal(input.fieldOps.completed.length,0);
});
