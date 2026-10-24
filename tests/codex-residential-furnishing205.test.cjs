'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const Residential=require('../scripts/codex-residential2026.cjs');
const Furniture=require('../src/codex-furnishings2026.js');
const Physical=require('../src/codex-physical2026.js');

test('205 residential: all 200 plans place the complete unchanged equipment programme',()=>{
  const requestsByType=[];
  for(const type of Residential.TYPES) {
    let requested=0;
    for(let number=1;number<=50;number++) {
      const plan=Residential.build(type,number),before=JSON.stringify(plan),furnishing=Furniture.build(plan);
      assert.equal(Residential.audit(plan).ok,true,plan.id);
      assert.equal(furnishing.summary.unknownUses,0,plan.id);
      assert.deepEqual(furnishing.unplaced,[],plan.id+' must place equipment instead of removing its prescription');
      assert.equal(furnishing.props.length,furnishing.requests.length,plan.id);
      requested+=furnishing.requests.length;
      for(const room of furnishing.rooms) {
        const items=furnishing.props.filter(p=>p.roomId===room.id);
        assert.deepEqual(items.map(p=>p.kind).sort(),[...Furniture.PROFILES[room.usage]].sort(),room.id);
        assert.equal(Furniture.accessibility(room,items).ok,true,room.id+' service faces and door must remain reachable');
        for(const item of items) {
          const expected=Furniture.shape(item.kind),vertical=item.rotationRad/(Math.PI/2)%2===1;
          assert.equal(item.w,vertical?expected.h:expected.w,item.id);
          assert.equal(item.h,vertical?expected.w:expected.h,item.id);
          assert.equal(item.lootAssigned,false);assert.equal(item.utilityConnected,false);
        }
      }
      assert.equal(Furniture.audit(plan,furnishing).ok,true,plan.id);
      assert.equal(furnishing.summary.lootContainersCreated,0);assert.equal(furnishing.summary.connectedServices,0);
      assert.equal(JSON.stringify(plan),before,plan.id+' author input must remain immutable');
    }
    requestsByType.push(requested);
  }
  // These are the complete pre-repair programmes, including every formerly
  // refused object. Their counts must not fall merely to make placement pass.
  assert.deepEqual(requestsByType,[8970,3300,8440,4730]);
});

test('205 residential: full-size equipment preserves entry-to-room and return paths in every plan',()=>{
  for(const type of Residential.TYPES)for(let number=1;number<=50;number++) {
    const plan=Residential.build(type,number),furnishing=Furniture.build(plan);
    const scene=Physical.withProps(Physical.build(plan),furnishing.props),audit=Physical.audit(scene);
    assert.equal(audit.ok,true,plan.id+': '+JSON.stringify(audit.errors.slice(0,3)));
    assert.equal(scene.levels.length,1);assert.equal(scene.transitions.length,0);
    for(const parcel of plan.composition.parcels) {
      assert.equal(Physical.blocked(scene,parcel.gate.x,parcel.gate.y,0),false,parcel.id+' parcel gate');
      if(!parcel.interiorVisit)continue;
      const home=plan.buildings.find(b=>b.id===parcel.unit);
      assert.ok(home,parcel.id);
      assert.equal(Physical.blocked(scene,home.x+home.entry.x,home.y+.5,0),false,home.id+' actual entrance');
    }
  }
});

test('205 residential: all 50 worker-camp author plans retain their exact prior geometry and identities',()=>{
  const plans=Array.from({length:50},(_,index)=>Residential.build('EXT-MONDE-T047',index+1));
  const digest=crypto.createHash('sha256').update(JSON.stringify(plans)).digest('hex');
  assert.equal(digest,'dbae9b2a17784b1125b386fddb5f2630c65b727748242d42488bbba17f8871d9');
});
