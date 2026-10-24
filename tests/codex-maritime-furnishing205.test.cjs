'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');
const M=require('../scripts/codex-maritime2026.cjs');
const F=require('../scripts/codex-world-foundations2026.cjs');
const H=require('../src/codex-furnishings2026.js');
const P=require('../src/codex-physical2026.js');
const Geometry=require('../src/frontier-geometry.js');
const Detail=require('../src/seed-detail157.js');
const Core=require('../src/core.js');
const TYPES=['EXT-MONDE-T005','EXT-MONDE-T008','EXT-MONDE-T011'];
const clone=value=>JSON.parse(JSON.stringify(value));
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('205: all150 revised ship plans place the13663 unchanged requests with physical service access',()=>{
  const programs=[],counts={};
  let requests=0,packedRooms=0,states=0;
  const references=F.refs();
  for(const type of TYPES){
    const geometries=new Set();counts[type]=0;
    for(let number=1;number<=50;number++){
      const author=M.build(type,number),before=JSON.stringify(author),furnishing=H.build(author);
      assert.equal(M.audit(author).ok,true,author.id);
      assert.equal(H.audit(author,furnishing).ok,true,author.id);
      assert.equal(furnishing.unplaced.length,0,author.id);
      assert.equal(furnishing.requests.length,furnishing.props.length,author.id);
      assert.ok(furnishing.requests.every(r=>r.placed),author.id);
      assert.equal(furnishing.summary.rooms,furnishing.summary.furnishedRooms,author.id);
      const scene=P.withProps(P.build(author),furnishing.props),physical=P.audit(scene);
      assert.equal(physical.ok,true,author.id+': '+JSON.stringify(physical.errors));
      for(const room of furnishing.rooms){
        const props=furnishing.props.filter(p=>p.roomId===room.id);
        assert.equal(H.accessibility(room,props).ok,true,room.id);
        for(const prop of props){
          const shape=H.shape(prop.kind);
          assert.deepEqual(prop.footprintM,{w:shape.w,h:shape.h});
          assert.equal(prop.heightM,shape.heightM);
          assert.equal(prop.lootAssigned,false);assert.equal(prop.utilityConnected,false);
        }
      }
      assert.equal(author.furnishingLayout205,1);
      assert.equal(author.playable,false);assert.equal(scene.playable,false);
      assert.ok(author.boarding.every(b=>b.connectedToWorld===false));
      const profile=M.PROFILES[type];
      assert.equal(author.hull.w,references.metrics.find(m=>m.id===profile.key+'.length').value);
      assert.equal(author.hull.h,references.metrics.find(m=>m.id===profile.key+'.beam').value);
      assert.equal(author.reference.realTotalHeightM,null);
      for(const room of author.rooms.filter(r=>r.kind==='circulation'))assert.equal(room.h,profile.sub?1.1:1.8);
      for(const record of furnishing.packing205){
        assert.equal(record.accepted,true);assert.equal(record.exhausted,false);
        assert.ok(record.states<=4096);
        const count=furnishing.requests.filter(r=>r.roomId===record.roomId).length;
        assert.ok(record.candidates<=count*512);
        packedRooms++;states+=record.states;
      }
      if(type==='EXT-MONDE-T005'){
        const hold=author.reservations.find(r=>r.kind==='cargo-hold');
        assert.deepEqual([hold.w,hold.h,hold.clearHeightM],[60.35,12.6,9.59]);
        assert.equal(hold.walkable,false);assert.equal(hold.connected,false);
        assert.equal(hold.origin,'source-dimensions-author-position');
        assert.ok(hold.x>17.753&&hold.x+hold.w<author.hull.w);
        assert.ok(author.rooms.every(r=>r.x+r.w<hold.x));
        // Moving the authored hold does not spend the historical stair bay.
        const shaft=author.nodes.find(n=>n.id.endsWith('deck-0:shaft'));
        const bay=5+Math.floor((number-1)/10)*.3;
        assert.equal(shaft.x,.18+bay/2);
        assert.ok(author.rooms.filter(r=>r.kind!=='circulation').every(r=>r.x>=.18+bay));
      }
      assert.equal(JSON.stringify(author),before,'inspection must not mutate its source');
      programs.push({type,n:number,rooms:author.rooms.filter(r=>r.kind!=='circulation').map(r=>[r.id,r.name,r.level]),
        requests:furnishing.requests.map(r=>[r.id,r.roomId,r.kind])});
      requests+=furnishing.requests.length;counts[type]+=furnishing.requests.length;
      geometries.add(JSON.stringify(author.rooms.map(r=>[r.x,r.y,r.w,r.h,r.z])));
    }
    assert.equal(geometries.size,50,type);
  }
  assert.deepEqual(counts,{'EXT-MONDE-T005':5958,'EXT-MONDE-T008':2103,'EXT-MONDE-T011':5602});
  assert.equal(requests,13663);
  // Captured from1.71 before correction: room identities/uses and every request
  // must remain, including the2851 requests that used to be refused.
  assert.equal(digest(programs),'8247116ca224aa67e75dc96d7caab5ea2cd311b1021ede8ed6fc6ce3440673a9');
  assert.ok(packedRooms>0&&states>packedRooms);
});

test('205: all100 tanker and cruiser outputs retain their complete1.71 author/furniture bytes',()=>{
  const expected={
    'EXT-MONDE-T006':'b29986ee595d55c4055bf54ece88f87b48c04690d6efaf77b30021ec6201f76b',
    'EXT-MONDE-T007':'7a6a0d7f31049dca7f9b05db2a42da09e527211c11391e4c6db8e2c61ecff6a7'
  };
  for(const [type,wanted] of Object.entries(expected)){
    const hash=crypto.createHash('sha256');hash.update('[');
    for(let n=1;n<=50;n++){
      const author=M.build(type,n),furnishing=H.build(author);
      assert.equal(Object.hasOwn(author,'furnishingLayout205'),false);
      assert.equal(Object.hasOwn(furnishing,'packing205'),false);
      hash.update((n>1?',':'')+JSON.stringify({author,furnishing}));
    }
    hash.update(']');assert.equal(hash.digest('hex'),wanted,type);
  }
  const ordinary=F.build('EXT-MONDE-T065',1),forged={...ordinary,furnishingLayout205:1};
  assert.deepEqual(H.build(forged),H.build(ordinary),'a foreign marker cannot enable maritime packing');
});

test('205: a formerly greedy refusal receives a whole-room layout without deleting or shrinking its requests',()=>{
  const author=M.build('EXT-MONDE-T011',43),legacy=clone(author);delete legacy.furnishingLayout205;
  const direct=H.build(legacy),packed=H.build(author);
  assert.ok(direct.unplaced.length>0);assert.equal(packed.unplaced.length,0);
  assert.deepEqual(packed.requests.map(r=>[r.id,r.roomId,r.kind]),direct.requests.map(r=>[r.id,r.roomId,r.kind]));
  assert.equal(packed.props.length,direct.requests.length);
  assert.ok(packed.packing205.some(r=>r.accepted&&r.states>0));
  assert.equal(P.audit(P.withProps(P.build(author),packed.props)).ok,true);
});

test('205: an impossible room preserves its original partial layout and truthful shortage atomically',()=>{
  const plan={id:'impossible205',units:'m',scope:'author-maritime-layout-not-live-world',typologyId:TYPES[0],furnishingLayout205:1,
    rooms:[{id:'r',name:'atelier mécanique',kind:'compartment',x:1,y:1,w:2.2,h:2.2,level:'deck-0',z:0,clearHeightM:2.4}],
    levels:[{id:'deck-0',elevationM:0,clearHeightM:2.4}],
    portals:[{id:'d',from:'corridor',to:'r',x:2.1,y:1,widthM:1.2,axis:'x'}]};
  const legacy=clone(plan);delete legacy.furnishingLayout205;
  const before=JSON.stringify(plan),direct=H.build(legacy),packed=H.build(plan);
  assert.ok(direct.props.length>0&&direct.unplaced.length>0);
  assert.deepEqual(packed.props,direct.props);assert.deepEqual(packed.requests,direct.requests);
  assert.deepEqual(packed.unplaced,direct.unplaced);
  assert.equal(packed.packing205.length,1);assert.equal(packed.packing205[0].accepted,false);
  assert.ok(packed.packing205[0].states<=4096);
  assert.equal(H.audit(plan,packed).ok,true);assert.equal(JSON.stringify(plan),before);
});

test('205: fabricated completion, unbounded receipts and a foreign packing receipt are rejected',()=>{
  const author=M.build('EXT-MONDE-T011',43),baseline=H.build(author);
  for(const edit of [r=>r.packing205[0].states=4097,r=>r.packing205[0].candidates=-1,
    r=>r.packing205[0].accepted=false,r=>r.packing205.push({...r.packing205[0]}),r=>delete r.packing205]){
    const changed=clone(baseline);edit(changed);assert.equal(H.audit(author,changed).ok,false);
  }
  const ordinary=M.build('EXT-MONDE-T006',1),foreign=clone(H.build(ordinary));foreign.packing205=[];
  assert.ok(H.audit(ordinary,foreign).errors.includes('unexpected-packing-receipt'));
  for(const type of TYPES){const bad=clone(M.build(type,1));bad.furnishingLayout205=2;assert.equal(M.audit(bad).ok,false);}
});

test('205: opted-in packing is deterministic in Node and the browser without simulation randomness',()=>{
  const context={DeadwallFrontierGeometry:Geometry,DeadwallSeedDetail157:Detail,DeadwallCore:Core};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../src/codex-furnishings2026.js'),'utf8'),context);
  vm.runInContext('Math.random=()=>{throw Error("Unexpected browser RNG")}',context);
  const plan=M.build('EXT-MONDE-T011',43),before=JSON.stringify(plan),random=Math.random;
  Math.random=()=>{throw Error('Unexpected simulation RNG');};
  try{
    const first=H.build(plan),again=H.build(plan);
    assert.equal(JSON.stringify(first),JSON.stringify(again));
    assert.equal(JSON.stringify(context.DeadwallCodexFurnishings2026.build(plan)),JSON.stringify(first));
  }finally{Math.random=random;}
  assert.equal(JSON.stringify(plan),before);
});
