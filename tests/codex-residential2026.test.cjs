'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const M=require('../scripts/codex-residential2026.cjs');
const Reference=require('../scripts/codex-world-foundations2026.cjs');
const Physical=require('../src/codex-physical2026.js');
const Furniture=require('../src/codex-furnishings2026.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const make=(type=M.TYPES[0],number=1)=>clone(M.build(type,number));

function geometry(plan) {
  return JSON.stringify([plan.bounds,plan.buildings.map(b=>[b.kind,b.x,b.y,b.w,b.h,b.rooms.map(r=>[r.name,r.x,r.y,r.w,r.h])]),
    plan.structures.map(s=>[s.kind,s.x,s.y,s.w,s.h]),plan.reservedAreas.map(a=>[a.kind,a.x,a.y,a.w,a.h])]);
}

test('200 residential plans have distinct geometry, immutable output and no campaign claim',()=>{
  const report=M.auditAll();assert.equal(report.variants,200);assert.equal(report.typologies,4);assert.equal(report.playable,0);
  for(const type of M.TYPES) {
    const signatures=new Set();
    for(let number=1;number<=50;number++) {
      const a=M.build(type,number),b=M.build(type,number);
      assert.deepEqual(a,b);assert.equal(M.audit(a).ok,true,a.id);signatures.add(geometry(a));
      assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.composition.parcels)&&Object.isFrozen(a.outdoorAreas));
      assert.equal(a.playable,false);assert.equal(a.sourceIds.length,0);assert.equal(a.heightOrigin,'author-design');
      assert.ok(a.structures.every(s=>s.lootAssigned===false&&s.utilityConnected===false));
      assert.ok(a.network.externalPorts.every(p=>p.connectedToWorld===false));
    }
    assert.equal(signatures.size,50,type+' must vary geometry, not only names');
  }
});

test('all 200 layouts preserve pedestrian paths through fences, common facilities and rooms',()=>{
  for(const type of M.TYPES)for(let number=1;number<=50;number++) {
    const plan=M.build(type,number),scene=Physical.build(plan),check=Physical.audit(scene);
    assert.equal(check.ok,true,plan.id+': '+JSON.stringify(check.errors.slice(0,3)));
    assert.equal(scene.levels.length,1);assert.equal(scene.transitions.length,0);
    assert.equal(scene.rooms.length,plan.buildings.reduce((sum,b)=>sum+b.rooms.length,0));
    for(const port of plan.network.externalPorts) {
      const node=scene.nodes.find(n=>n.id===port.node);assert.ok(node,port.node);
      assert.equal(Physical.blocked(scene,node.x,node.y,node.level),false,port.node);
    }
  }
});

test('functions keep real room names and furniture keeps accesses open without free stock',()=>{
  for(const type of M.TYPES)for(const number of [1,21,50]) {
    const plan=M.build(type,number),furniture=Furniture.build(plan),check=Furniture.audit(plan,furniture);
    assert.equal(check.ok,true,plan.id+': '+check.errors.join(','));assert.equal(furniture.summary.unknownUses,0,plan.id);
    assert.equal(furniture.summary.lootContainersCreated,0);assert.equal(furniture.summary.connectedServices,0);
    assert.ok(furniture.props.some(p=>p.usage==='sleeping'),plan.id+' sleeping furniture');
    assert.ok(furniture.props.some(p=>p.usage==='kitchen'),plan.id+' kitchen furniture');
    assert.ok(furniture.props.some(p=>p.usage==='sanitary'),plan.id+' sanitary furniture');
    const scene=Physical.withProps(Physical.build(plan),furniture.props);assert.equal(Physical.audit(scene).ok,true,plan.id);
  }
});

test('towable caravans retain narrow closed shells; visitable homes have all required rooms',()=>{
  for(const type of M.TYPES)for(const number of [1,50]) {
    const p=M.build(type,number),shells=p.structures.filter(s=>/caravan$/.test(s.kind));
    assert.equal(shells.length>0,[M.TYPES[1],M.TYPES[3]].includes(type));
    for(const shell of shells) {
      assert.ok(shell.w>=2.4&&shell.w<=2.6);assert.match(shell.interiorStatus,/closed/);
      assert.ok(!p.buildings.some(b=>b.id===shell.id));
    }
    for(const parcel of p.composition.parcels.filter(v=>v.interiorVisit)) {
      const home=p.buildings.find(b=>b.id===parcel.unit),names=home.rooms.map(r=>r.name).join(' ');
      assert.match(names,/cabine/);assert.match(names,/sanitaires/);
      if(type!==M.TYPES[2])assert.match(names,/cuisine/);
    }
  }
});

test('each parcel has a garden, terrace, parking, shed and a two-metre fence opening',()=>{
  const p=M.build(M.TYPES[0],17);
  for(const parcel of p.composition.parcels) {
    assert.equal(parcel.gate.widthM,2);assert.equal(parcel.utilitiesConnected,false);
    assert.ok(p.reservedAreas.some(r=>r.id===parcel.garden));
    assert.ok(p.outdoorAreas.some(r=>r.id===parcel.id+':terrace'&&r.walkable));
    assert.ok(p.outdoorAreas.some(r=>r.id===parcel.id+':parking'));
    assert.ok(p.structures.some(r=>r.id===parcel.id+':shed'));
    const gateRect={x:parcel.gate.x-.5,y:parcel.gate.y-.5,w:1,h:1};
    assert.ok(p.network.nodes.some(n=>Math.abs(n.x-parcel.gate.x)<1e-8&&Math.abs(n.y-parcel.gate.y)<1e-8));
    const scene=Physical.build(p);
    assert.equal(Physical.segmentClear(scene,{x:parcel.gate.x,y:gateRect.y},{x:parcel.gate.x,y:gateRect.y+gateRect.h},0),true);
  }
});

test('optional communal pools are unique, fenced, impassable and reserved for leisure profiles',()=>{
  const counts={};
  for(const type of M.TYPES) {
    counts[type]=0;
    for(let n=1;n<=50;n++) {
      const p=M.build(type,n),pool=p.structures.find(s=>s.kind==='closed-pool');
      if(!pool)continue;counts[type]++;
      assert.ok([M.TYPES[0],M.TYPES[1]].includes(type));assert.equal(pool.waterPotable,false);assert.equal(pool.walkable,false);
      assert.ok(p.structures.some(s=>s.id.includes(':pool-fence:')));
      const scene=Physical.build(p);assert.equal(Physical.blocked(scene,pool.x+pool.w/2,pool.y+pool.h/2,0),true);
    }
  }
  assert.deepEqual(Object.values(counts),[15,15,0,0]);
});

test('fence collision stops a body while the declared parcel opening remains traversable',()=>{
  const p=M.build(M.TYPES[0],1),scene=Physical.build(p),lot=p.composition.parcels[0];
  const blockedX=lot.bounds.x+2,startY=lot.bounds.y-1;
  const stopped=Physical.move(scene,{x:blockedX,y:startY,level:0},0,2);
  assert.equal(stopped.blocked,true);assert.ok(stopped.pose.y<lot.bounds.y);
  const open=Physical.move(scene,{x:lot.gate.x,y:startY,level:0},0,2);
  assert.equal(open.blocked,false);assert.ok(Math.abs(open.pose.y-lot.bounds.y-1)<1e-8);
});

test('only the four intended typologies and integer variants 1..50 are accepted',()=>{
  for(const type of [undefined,null,'T045','EXT-MONDE-T041','__proto__'])assert.throws(()=>M.build(type,1));
  for(const number of [0,51,-1,NaN,Infinity,1.5,'1'])assert.throws(()=>M.build(M.TYPES[0],number));
});

test('closed gates and paths crossing a home or a garden are rejected',()=>{
  const blocked=make(),lot=blocked.composition.parcels[0];
  blocked.structures.push({id:blocked.id+':bad-gate',kind:'fence',x:lot.gate.x-1,y:lot.gate.y,w:2,h:.15,maxHeightM:1.2,
    heightOrigin:'author-design',lootAssigned:false,utilityConnected:false});
  assert.ok(M.audit(blocked).errors.includes('residential-gate-obstructed'));
  const crossing=make(),a=crossing.network.nodes.find(n=>n.id.endsWith(':parcel:0:front')),b=crossing.network.nodes.find(n=>n.id.endsWith(':parcel:0:back'));
  crossing.network.edges.push({id:crossing.id+':bad-shortcut',from:a.id,to:b.id,widthM:1.2,level:0,mode:'pedestrian'});
  assert.ok(M.audit(crossing).errors.includes('road-crosses-structure'));
  const garden=make(),g=garden.reservedAreas[0],n=garden.network.nodes.find(n=>n.id.endsWith(':parcel:0:garden-access'));
  n.y=g.y+g.h/2;assert.ok(M.audit(garden).errors.includes('road-crosses-protected-area'));
});

for(const[label,mutate]of [
  ['invented camp installation',p=>p.playable=true],
  ['invented water connection',p=>p.structures[0].utilityConnected=true],
  ['free garden loot',p=>p.reservedAreas[0].lootAssigned=true],
  ['invented caravan interior',p=>p.composition.parcels[0].interiorVisit=false],
  ['terrace through the reception',p=>Object.assign(p.outdoorAreas[0],{x:p.buildings[0].x,y:p.buildings[0].y,w:2,h:2})],
  ['outdoor terrain outside the site',p=>p.outdoorAreas[0].x=-1],
  ['fake source attribution',p=>p.sourceIds.push('UNVERIFIED_STANDARD')],
  ['duplicate parcel claims',p=>p.composition.parcels.push(clone(p.composition.parcels[0]))],
  ['renamed identity',p=>p.number=51],
  ['malformed parcel',p=>delete p.composition.parcels[0].bounds]
])test('audit rejects '+label,()=>{const p=make();mutate(p);assert.equal(M.audit(p).ok,false,label);});

test('no global randomness, save access or mutation is needed to rebuild a layout',()=>{
  const random=Math.random;Math.random=()=>{throw Error('Unexpected RNG');};
  try {
    const p=M.build(M.TYPES[2],39),before=JSON.stringify(p);assert.equal(M.audit(p).ok,true);assert.equal(JSON.stringify(p),before);
    assert.deepEqual(M.build(M.TYPES[2],39),p);
  }finally{Math.random=random;}
  for(const value of [undefined,null,{},[],{type:M.TYPES[0]}])assert.equal(M.audit(value).ok,false);
});

test('browser core is pure and matches authoritative authoring without Node APIs',()=>{
  const text=fs.readFileSync(path.join(__dirname,'../scripts/codex-residential2026.cjs'),'utf8');
  const core=text.split('// BEGIN AUTHOR CORE')[1].split('// END AUTHOR CORE')[0];
  assert.doesNotMatch(core,/\brequire\s*\(|\bprocess\.|\bfs\.|\bpath\./);
  const context=vm.createContext({Reference});
  vm.runInContext('(function(Reference){'+core+';globalThis.Residential={TYPES,build,audit,auditAll};})(Reference);',context);
  for(const type of M.TYPES)for(const n of [1,26,50]) {
    assert.deepEqual(clone(context.Residential.build(type,n)),clone(M.build(type,n)));
    assert.equal(context.Residential.audit(context.Residential.build(type,n)).ok,true);
  }
});
