'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Furniture=require('../src/codex-furnishings2026.js');
const InspectionAudit=require('../scripts/audit-codex-inspection2026.cjs');
const Foundations=require('../scripts/codex-world-foundations2026.cjs');
const Maritime=require('../scripts/codex-maritime2026.cjs');
const Geometry=require('../src/frontier-geometry.js');
const Detail=require('../src/seed-detail157.js');
const Core=require('../src/core.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const sample=()=>Foundations.build('EXT-MONDE-T065',1);

test('all produced variants have bounded metric furniture, truthful shortages and reachable service fronts',()=>{
  const report=InspectionAudit.auditAll({write:process.env.DEADWALL_WRITE_INSPECTION_AUDIT==='1'});
  assert.deepEqual(report.failures,[]);
  const layouts=require('../src/codex-layouts2026.js');
  assert.equal(report.summary.types,layouts.types.length);
  assert.equal(report.summary.plans,layouts.count);assert.equal(report.summary.passed,layouts.count);
  const historical=new Set([...Foundations.TYPES,...Object.keys(Maritime.PROFILES)]);
  const sum=key=>report.records.filter(r=>historical.has(r.typologyId)).reduce((n,r)=>n+r[key],0);
  assert.equal(sum('rooms'),12880);assert.equal(sum('furnishedRooms'),12850);
  assert.equal(sum('props'),41723);assert.equal(sum('refused'),4470);
  assert.equal(report.summary.campaignPlayable,0);
  assert.ok(report.summary.levels>400);assert.ok(report.summary.walls>400);assert.ok(report.summary.transitions>0);
});

test('agricultural and residential uses receive their own equipment without granting active production',()=>{
  const cases=[['chambre parentale','bedroom','bed'],['stabulation bovine','livestock','feedTrough'],
    ['salle de traite','milking','milkingUnit'],['local du lait','dairy','milkVat'],
    ['poulailler','poultry','nestBox'],['local œufs','produce','steelTable'],
    ['chais','winery','wineBarrel'],['cuverie','fermentation','wineVat'],['pressoir','pressing','grapePress'],
    ['infirmerie vétérinaire','veterinary','veterinaryTable'],['serre culture A','greenhouse','growingBed'],
    ['stockage réfrigéré fruits','coldStores','fridge']];
  for(const [name,usage,kind] of cases){
    const plan=clone(sample());plan.buildings[0].rooms[1].name=name;
    const result=Furniture.build(plan),roomId=plan.buildings[0].rooms[1].id;
    assert.equal(result.rooms.find(r=>r.id===roomId).usage,usage,name);
    assert.ok(result.props.some(p=>p.roomId===roomId&&p.kind===kind),name+' appropriate equipment');
    assert.equal(Furniture.audit(plan,result).ok,true);
    assert.equal(result.summary.lootContainersCreated,0);assert.equal(result.summary.connectedServices,0);
    assert.ok(result.props.every(p=>p.lootAssigned===false&&p.utilityConnected===false));
  }
});

test('repeated build is deterministic and does not call simulation randomness',()=>{
  const plan=Maritime.build('EXT-MONDE-T006',37), previous=Math.random;
  Math.random=()=>{throw Error('Unexpected RNG');};
  try{assert.deepEqual(Furniture.build(plan),Furniture.build(plan));}finally{Math.random=previous;}
});

test('existing dimensions remain the authority including a rotated footprint',()=>{
  const result=Furniture.build(sample());
  for(const p of result.props){
    const source=Geometry.SHAPES[p.kind]||Detail.objects[p.kind]||Core.CodexFixtures164Rules.shapes[p.kind];
    if(!source)continue;
    assert.equal(p.footprintM.w,source[0]);assert.equal(p.footprintM.h,source[1]);
    const rotated=(p.rotationRad/(Math.PI/2))%2===1;
    assert.equal(p.w,source[rotated?1:0]);assert.equal(p.h,source[rotated?0:1]);
  }
  assert.ok(result.props.some(p=>p.rotationRad===Math.PI/2||p.rotationRad===3*Math.PI/2));
});

test('boat floors use integer indices independently from waterline elevations',()=>{
  const plan=Maritime.build('EXT-MONDE-T006',4), result=Furniture.build(plan);
  for(const p of result.props){assert.ok(Number.isInteger(p.level));assert.equal(p.sourceLevel,plan.levels[p.level].id);assert.equal(p.elevationM,plan.levels[p.level].elevationM);}
  assert.ok(result.props.some(p=>p.elevationM<0));
  assert.ok(result.props.some(p=>!Number.isInteger(p.elevationM)));
});

test('narrow submarine rooms report large furniture without making miniature substitutes',()=>{
  const plan=Maritime.build('EXT-MONDE-T008',1),result=Furniture.build(plan);
  const missing=result.unplaced.find(p=>p.kind==='machine');
  assert.ok(missing);assert.equal(missing.requiredFootprintM.w,Geometry.SHAPES.machine[0]);
  assert.equal(missing.reason,'space-or-access');
  assert.ok(result.props.every(p=>p.kind!=='machine'));
});

test('different functions receive distinct equipment and halls stay empty',()=>{
  const result=Furniture.build(sample());
  const kinds=usage=>new Set(result.props.filter(p=>p.usage===usage).map(p=>p.kind));
  assert.ok(kinds('showers').has('shower'));
  assert.ok(kinds('medical').has('medical'));
  assert.ok(kinds('kitchen').has('oven'));
  assert.ok(kinds('electrical').has('electricalRack'));
  assert.ok(!result.props.some(p=>/corridor/.test(p.roomId)));
});

for(const [label,edit,code] of [
  ['scaled furniture',r=>r.props[0].w*=.5,'scaled-or-unproven-dimensions'],
  ['a fake service area',r=>r.props[0].access.x+=.12,'false-service-footprint'],
  ['duplicated furniture',r=>r.props.push(clone(r.props[0])),'duplicate-id'],
  ['wrong deck',r=>r.props[0].level+=1,'level'],
  ['claimed free loot',r=>r.props[0].amount=10,'false-service-or-stock'],
  ['claimed connected power',r=>r.props[0].utilityConnected=true,'false-service-or-stock'],
  ['negative dimension',r=>r.props[0].h=-1,'shape'],
  ['non-finite coordinate',r=>r.props[0].x=NaN,'shape'],
  ['unsupported furniture',r=>r.props[0].kind='busForLivingRoom','unknown-kind'],
  ['invented completion',r=>r.playable=true,'scope'],
  ['falsified shortage dimensions',r=>r.unplaced[0].requiredFootprintM.w=.01,'false-unplaced-dimensions'],
  ['a request assigned to the wrong furniture',r=>{const id=r.props[0].id;r.props[0].id=r.props[1].id;r.props[1].id=id;},'prop-request-mismatch'],
  ['deleted furniture without shortage',r=>{r.props.pop();r.summary.objects--;},'missing-result'],
  ['false room data',r=>r.rooms[0].w+=1,'false-room-metadata']
])test('audit rejects '+label,()=>{
  const plan=sample(),result=clone(Furniture.build(plan));edit(result);
  const audit=Furniture.audit(plan,result);assert.equal(audit.ok,false);assert.ok(audit.errors.includes(code),audit.errors.join(','));
});

test('audit rejects a doorway and centre route blocked by a prop',()=>{
  const plan=sample(),result=clone(Furniture.build(plan)),p=result.props[0],room=result.rooms.find(r=>r.id===p.roomId);
  p.x=room.center.x-p.w/2;p.y=room.center.y-p.h/2;
  const audit=Furniture.audit(plan,result);assert.equal(audit.ok,false);assert.ok(audit.errors.includes('blocked-entry-path'));
});

test('continuous access check rejects a thin barrier missed by a coarse grid',()=>{
  const room={x:0,y:0,w:6,h:6,center:{x:3,y:3},doors:[{x:0,y:3}]};
  const barrier={x:1.05,y:0,w:.02,h:6,solid:true,access:{x:1.8,y:2.5,w:.8,h:1}};
  assert.equal(Furniture.accessibility(room,[barrier]).ok,false);
});

test('author envelopes with unknown room function stay unclaimed',()=>{
  const plan=clone(sample());plan.buildings[0].rooms[1].name='Usage encore inconnu';
  const result=Furniture.build(plan);
  assert.equal(result.summary.unknownUses,1);
  assert.ok(result.unplaced.some(p=>p.kind===null&&p.reason==='room-usage-unresolved'));
});

test('missing doors, units and levels are rejected without invented defaults',()=>{
  const p=clone(sample());p.buildings[0].portals=[];
  assert.throws(()=>Furniture.build(p),/Accès/);
  assert.throws(()=>Furniture.build({...sample(),units:'D17'}),/métrique/);
  const boat=clone(Maritime.build('EXT-MONDE-T005',1));boat.rooms[0].level='missing';
  assert.throws(()=>Furniture.build(boat),/Niveau/);
});

test('browser UMD uses the same catalogue and serializable result as Node',()=>{
  const context={DeadwallFrontierGeometry:Geometry,DeadwallSeedDetail157:Detail,DeadwallCore:Core};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/codex-furnishings2026.js'),'utf8'),context);
  const plan=Maritime.build('EXT-MONDE-T011',3);
  assert.equal(JSON.stringify(context.DeadwallCodexFurnishings2026.build(plan)),JSON.stringify(Furniture.build(plan)));
});
