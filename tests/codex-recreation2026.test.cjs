'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const M=require('../scripts/codex-recreation2026.cjs');
const Reference=require('../scripts/codex-world-foundations2026.cjs');
const Physical=require('../src/codex-physical2026.js');
const Furniture=require('../src/codex-furnishings2026.js');
const copy=value=>JSON.parse(JSON.stringify(value));
const make=(type=M.TYPES[0],number=1)=>copy(M.build(type,number));

test('loisirs : 300 plans déterministes, six programmes distincts et 50 vraies géométries par type',()=>{
  const saved=Math.random;Math.random=()=>{throw Error('Hasard de campagne consommé.');};
  try{
    assert.deepEqual(M.TYPES,['EXT-MONDE-T049','EXT-MONDE-T050','EXT-MONDE-T051','EXT-MONDE-T052','EXT-MONDE-T067','EXT-MONDE-T068']);
    for(const type of M.TYPES){
      const shapes=new Set();
      for(let n=1;n<=50;n++){
        const p=M.build(type,n),check=M.audit(p);assert.equal(check.ok,true,p.id+': '+check.errors.join(','));
        assert.deepEqual(p,M.build(type,n));assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.circulation.activityStops)&&Object.isFrozen(p.buildings[0].rooms));
        assert.ok(p.buildings.find(b=>b.role==='welcome').rooms.some(r=>r.name==='salle de soins'));
        shapes.add(JSON.stringify([p.bounds,p.buildings.map(b=>[b.role,b.x,b.y,b.entrySide]),
          p.structures.map(s=>[s.role,s.x,s.y,s.w,s.h]),p.outdoorAreas.map(s=>[s.role,s.x,s.y,s.w,s.h])]));
        assert.equal(p.playable,false);assert.equal(p.scope,'author-metric-layout-not-live-world');
        for(const a of [...p.structures,...p.outdoorAreas]){
          const source=M.PROFILES[type].assets.find(s=>s.role===a.role);
          assert.deepEqual([a.w,a.h,a.maxHeightM],[source.w,source.h,source.height],'Les parcelles ne miniaturisent pas les équipements.');
        }
      }
      assert.equal(shapes.size,50,type);
    }
  }finally{Math.random=saved;}
  assert.equal(new Set(M.TYPES.map(type=>JSON.stringify(M.build(type,1).structures.map(s=>[s.kind,s.w,s.h])))).size,6);
});

test('loisirs : les 300 plans restent physiquement parcourables et leurs 9 600 pièces sont meublées',()=>{
  let rooms=0,props=0;
  for(const type of M.TYPES)for(let n=1;n<=50;n++){
    const p=M.build(type,n),before=JSON.stringify(p),f=Furniture.build(p),fa=Furniture.audit(p,f);
    assert.equal(fa.ok,true,p.id+': '+fa.errors.join(','));assert.equal(f.summary.rooms,32,p.id);
    assert.equal(f.summary.furnishedRooms,32,p.id);assert.equal(f.summary.unknownUses,0,p.id);assert.equal(f.summary.unplaced,0,p.id);
    assert.equal(f.summary.lootContainersCreated,0);assert.equal(f.summary.connectedServices,0);
    const scene=Physical.withProps(Physical.build(p),f.props),checked=Physical.audit(scene);
    assert.equal(checked.ok,true,p.id+': '+checked.errors.join(','));
    assert.equal(Physical.blocked(scene,scene.entry.x,scene.entry.y,0),false,p.id);
    assert.equal(JSON.stringify(p),before,'La génération de mobilier et le parcours ne mutent pas la source.');
    rooms+=f.summary.furnishedRooms;props+=f.props.length;
  }
  assert.deepEqual({rooms,props},{rooms:9600,props:35750});
});

test('loisirs : public et service ont deux accès physiques et une seule liaison de contrôle déclarée',()=>{
  for(const type of M.TYPES)for(const n of [1,26,50]){
    const p=M.build(type,n),c=p.circulation,nodes=new Map(p.network.nodes.map(n=>[n.id,n]));
    assert.notEqual(c.visitorEntry,c.serviceEntry);assert.notEqual(nodes.get(c.visitorEntry).x,nodes.get(c.serviceEntry).x);
    assert.ok(c.serviceSpine.every(id=>!c.publicSpines.includes(id)));
    assert.equal(c.controlledGate.scope,'inspection-link-not-live-access-control');
    for(const port of p.network.externalPorts)assert.equal(port.connectedToWorld,false);
    assert.equal(p.network.externalPorts.length,4);assert.equal(c.activityStops.length,6);
  }
  const isolated=make();isolated.network.nodes.push({id:isolated.id+':orphan',x:5,y:5,z:0});
  isolated.network.externalPorts.push({node:isolated.id+':orphan',requires:'fake-second-access',connectedToWorld:false});
  assert.equal(M.audit(isolated).ok,false,'Une seconde entrée ne masque pas un réseau coupé.');
  const shared=make();shared.circulation.serviceSpine.push(shared.circulation.publicSpines[0]);assert.equal(M.audit(shared).ok,false);
  const fake=make();fake.circulation.controlledGate.scope='live-automatic-gate';assert.equal(M.audit(fake).ok,false);
});

test('loisirs : bassins et attractions fermées bloquent réellement la marche, terrains secs accessibles',()=>{
  for(const type of M.TYPES)for(const n of [1,26,50]){
    const p=M.build(type,n),scene=Physical.build(p);
    for(const a of p.structures){
      assert.equal(Physical.blocked(scene,a.x+a.w/2,a.y+a.h/2,0),true,p.id+' '+a.role);
      if(a.water){
        const y=a.y+a.h/2,pose={x:a.x-1,y,level:0};
        assert.equal(Physical.segmentClear(scene,pose,{x:a.x+1,y},0),false);
        assert.ok(Physical.move(scene,pose,5,0).pose.x<=a.x-.32+1e-6);
      }
    }
    for(const a of p.outdoorAreas){
      const stop=p.circulation.activityStops.find(v=>v.area===a.id),nodes=new Map(scene.nodes.map(n=>[n.id,n]));
      assert.equal(Physical.blocked(scene,a.x+a.w/2,a.y+a.h/2,0),false,p.id+' '+a.role);
      assert.equal(Physical.segmentClear(scene,nodes.get(stop.viewNode),nodes.get(stop.fieldNode),0),true);
    }
    assert.equal(scene.transitions.length,0,'Aucun accès imaginaire aux gradins, tours ou toboggans.');
  }
});

test('loisirs : un chemin sur bassin, un manège redimensionné ou une porte obstruée sont refusés',()=>{
  const p=make('EXT-MONDE-T051'),water=p.structures[0],entry=p.network.nodes[0];
  p.network.nodes.push({id:p.id+':water-shortcut',x:water.x+water.w/2,y:water.y+water.h/2,z:0});
  p.network.edges.push({id:p.id+':water-edge',from:entry.id,to:p.id+':water-shortcut',widthM:2,mode:'pedestrian',level:0});
  assert.equal(M.audit(p).ok,false);
  const scaled=make('EXT-MONDE-T050');scaled.structures.find(s=>s.role==='coaster').w/=2;assert.equal(M.audit(scaled).ok,false);
  const blocked=make(),b=blocked.buildings[0];blocked.structures.push({id:blocked.id+':door-block',role:'door-block',kind:'closed-door',
    x:b.x+b.entry.x-1,y:b.y+b.entry.y-.2,w:2,h:.4,maxHeightM:2.5,heightOrigin:'author-design',walkable:false});
  assert.equal(M.audit(blocked).ok,false);assert.equal(Physical.audit(Physical.build(blocked)).ok,false);
});

test('loisirs : le vélodrome conserve son tracé analytique et les gradins ne traversent pas la piste',()=>{
  for(let number=1;number<=50;number++){
    const p=M.build('EXT-MONDE-T067',number),t=p.trackGeometry,bowl=p.structures.find(s=>s.id===t.enclosureId);
    assert.equal(t.nominalLengthM,250);assert.ok(Math.abs(2*t.straightM+2*Math.PI*t.turnRadiusM-250)<1e-9);
    assert.equal(t.laneWidthM,7.5);assert.equal(t.centerline.length,34);assert.equal(t.bankingSimulated,false);
    assert.equal(t.walkable,false);assert.ok(bowl.w>=130&&bowl.h>=92);
    assert.equal(Physical.blocked(Physical.build(p),bowl.x+bowl.w/2,bowl.y+bowl.h/2,0),true);
  }
  for(const mutate of [p=>p.trackGeometry.nominalLengthM=125,p=>p.trackGeometry.turnRadiusM=12,
    p=>p.trackGeometry.centerline[0].x+=1,p=>p.trackGeometry.walkable=true,
    p=>p.trackGeometry.grandstands[0].y=p.structures.find(s=>s.role==='velodrome').y+35]){
    const p=make('EXT-MONDE-T067');mutate(p);assert.equal(M.audit(p).ok,false);
  }
});

test('loisirs : les services, le butin et les contenus de campagne ne sont jamais inventés',()=>{
  const mutations=[p=>p.playable=true,p=>p.sourceIds.push('UNVERIFIED'),p=>p.operations.outputCreated=1,
    p=>p.operations.otherSystem=0,p=>p.unresolved=[],p=>p.circulation.activityStops.pop(),p=>p.configuration.sizeTier=4,
    p=>p.buildings.find(b=>b.role==='workshop').rooms[1].name='chambre double',
    p=>p.buildings.find(b=>b.role==='welcome').rooms.find(r=>r.name==='salle de soins').name='archives accueil',
    p=>p.structures[0].operational=true,p=>p.structures[0].walkable=true,p=>p.structures[0].lootAssigned=true,
    p=>p.structures[0].utilityConnected=true,p=>p.structures[0].amount=0,p=>p.structures[0].resource='food'];
  for(const mutate of mutations){const p=make();mutate(p);assert.equal(M.audit(p).ok,false);}
  for(const type of M.TYPES){const p=M.build(type,1);assert.deepEqual(p.sourceIds,[]);assert.ok(Object.values(p.operations).every(v=>v===0));}
});

test('loisirs : mauvais documents et identités hors limites sont refusés sans interrompre un audit de lot',()=>{
  for(const type of [null,undefined,'T049','EXT-MONDE-T048','__proto__'])assert.throws(()=>M.build(type,1));
  for(const n of [0,-1,51,1.5,NaN,Infinity,'1',undefined])assert.throws(()=>M.build(M.TYPES[0],n));
  for(const p of [null,undefined,[],{}, {type:M.TYPES[0]}])assert.equal(M.audit(p).ok,false);
});

test('loisirs : le même cœur pur navigateur reproduit exactement les plans Node',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../scripts/codex-recreation2026.cjs'),'utf8');
  const core=source.split('// BEGIN AUTHOR CORE')[1].split('// END AUTHOR CORE')[0];
  assert.doesNotMatch(core,/\brequire\s*\(|\bprocess\.|\bfs\.|\bpath\./);
  const context=vm.createContext({Reference});vm.runInContext('(function(Reference){'+core+';globalThis.Recreation={TYPES,build,audit};})(Reference);',context);
  for(const type of M.TYPES)for(const number of [1,26,50]){
    const plan=context.Recreation.build(type,number);assert.deepEqual(copy(plan),copy(M.build(type,number)));
    assert.equal(context.Recreation.audit(plan).ok,true);
  }
});
