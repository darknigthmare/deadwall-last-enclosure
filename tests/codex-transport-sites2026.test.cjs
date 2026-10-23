'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const M=require('../scripts/codex-transport-sites2026.cjs');
const Reference=require('../scripts/codex-world-foundations2026.cjs');
const Physical=require('../src/codex-physical2026.js');
const Furniture=require('../src/codex-furnishings2026.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const make=(type='EXT-MONDE-T070',number=1)=>clone(M.build(type,number));

test('transport : 400 plans déterministes, distincts et sans hasard ou état de campagne',()=>{
  const random=Math.random;Math.random=()=>{throw Error('RNG de simulation interdit');};
  try {
    for(const type of M.TYPES) {
      const signatures=new Set();
      for(let n=1;n<=50;n++) {
        const p=M.build(type,n),a=M.audit(p);assert.equal(a.ok,true,p.id+': '+a.errors.join(','));
        assert.deepEqual(p,M.build(type,n));
        signatures.add(JSON.stringify([p.bounds,p.buildings.map(b=>[b.kind,b.x,b.y,b.w,b.h,b.entrySide]),p.transportNetwork.nodes.map(n=>[n.x,n.y,n.kind]),p.structures.map(s=>[s.kind,s.x,s.y,s.w,s.h])]));
        assert.equal(p.scope,'author-metric-layout-not-live-world');assert.equal(p.playable,false);
        assert.equal(p.heightOrigin,'author-design');assert.deepEqual(p.sourceIds,[]);
        assert.equal(p.transportNetwork.operational,false);assert.equal(p.transportNetwork.inspectionAccess,'closed');
        assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.buildings[0].rooms)&&Object.isFrozen(p.transportNetwork.edges));
        assert.ok([...p.network.externalPorts,...p.transportNetwork.externalPorts].every(e=>e.connectedToWorld===false));
        assert.ok(Object.values(p.operations).every(n=>n===0));
      }
      assert.equal(signatures.size,50,type);
    }
  } finally {Math.random=random;}
  assert.equal(M.auditAll().variants,400);
});

test('transport : les 400 variantes meublées gardent toutes leurs pièces et trajets physiques accessibles',()=>{
  let rooms=0,props=0,refused=0,railCrossings=0;
  for(const type of M.TYPES)for(let n=1;n<=50;n++) {
    const p=M.build(type,n),f=Furniture.build(p),fa=Furniture.audit(p,f);
    assert.equal(fa.ok,true,p.id+': '+fa.errors.join(','));
    assert.equal(f.summary.unknownUses,0,p.id+' usage inconnu');
    assert.equal(f.summary.furnishedRooms,f.summary.rooms,p.id+' pièce vide');
    assert.equal(f.summary.requested,f.props.length+f.unplaced.length,p.id+' demande perdue');
    assert.equal(f.summary.lootContainersCreated,0);assert.equal(f.summary.connectedServices,0);
    const s=Physical.withProps(Physical.build(p),f.props),a=Physical.audit(s);
    assert.equal(a.ok,true,p.id+': '+a.errors.join(','));assert.equal(s.levels.length,1);
    for(const asset of p.structures)assert.equal(Physical.blocked(s,asset.x+asset.w/2,asset.y+asset.h/2,0,.32),true,p.id+' volume fermé sans collision '+asset.kind);
    if(p.railway)for(const crossing of p.railway.crossings) {
      const node=p.network.nodes.find(v=>v.id===crossing.walkNode);
      assert.equal(Physical.segmentClear(s,{x:node.x,y:node.y-3},{x:node.x,y:node.y+3},0,.32),true,p.id+' traversée physique fermée');
      assert.equal(crossing.barriersOperational,false);railCrossings++;
    }
    rooms+=f.summary.rooms;props+=f.props.length;refused+=f.unplaced.length;
  }
  assert.equal(rooms,14400);assert.ok(props>40000);assert.equal(railCrossings,850);assert.ok(refused>=0);
});

test('aéroports : longues pistes et liaison piste–taxiway–apron sans compression ou fausse jonction',()=>{
  const widths=new Set(),lengths=[];
  for(const type of M.TYPES.filter(t=>M.PROFILES[t].mode==='air'))for(const n of [1,26,50]) {
    const p=M.build(type,n),nodes=new Map(p.transportNetwork.nodes.map(v=>[v.id,v]));
    widths.add(p.bounds.w);
    for(const r of p.airfield.runways) {
      const a=nodes.get(r.runwayNodes[0]),b=nodes.get(r.runwayNodes.at(-1));
      assert.equal(Math.hypot(b.x-a.x,b.y-a.y),r.lengthM);assert.ok(r.lengthM>=900);lengths.push(r.lengthM);
      assert.equal(p.transportNetwork.edges.filter(e=>e.kind==='runway-exit'&&r.runwayNodes.includes(e.from)).length,3);
    }
    assert.ok(p.transportNetwork.edges.some(e=>e.kind==='apron-connector'));
    assert.equal(p.transportNetwork.nodes.filter(n=>n.kind==='apron-stand').length,p.airfield.stands);
    assert.equal(p.airfield.inspectionAccess,'landside-only');assert.equal(p.airfield.flightSimulation,false);
    if(type==='EXT-MONDE-T070') {
      assert.equal(p.airfield.runways.length,2);
      const bypass=p.transportNetwork.edges.find(e=>e.kind==='bypass'&&nodes.get(e.from).y!==nodes.get(e.to).y);
      assert.ok(bypass);assert.equal(nodes.get(bypass.from).x,50);assert.equal(nodes.get(bypass.to).x,50);
    }
  }
  assert.ok(widths.size>5);assert.equal(Math.max(...lengths),3400);
});

test('ferroviaire : chaque voie a une destination ou un butoir et les traversées sont explicitement de plain-pied',()=>{
  for(const type of M.TYPES.filter(t=>M.PROFILES[t].mode==='rail'))for(const n of [1,26,50]) {
    const p=M.build(type,n),nodes=new Map(p.transportNetwork.nodes.map(v=>[v.id,v]));
    assert.equal(p.railway.trainSimulation,false);assert.equal(p.railway.signalSimulation,false);
    assert.equal(p.transportNetwork.edges.filter(e=>e.kind==='switch-connection').length,M.PROFILES[type].tracks-1);
    for(const end of p.railway.ends)assert.equal(nodes.get(end.to).kind,M.PROFILES[type].through?'destination':'buffer-stop');
    for(const crossing of p.railway.crossings) {
      const a=p.network.nodes.find(v=>v.id===crossing.walkNode),b=nodes.get(crossing.railNode);
      assert.equal(a.x,b.x);assert.equal(a.y,b.y);assert.equal(a.z,b.z);assert.equal(crossing.level,0);
    }
    assert.equal(p.railway.platforms.length,p.railway.tracks);
  }
});

test('transport : réserves de piste, graphes discontinus et intersections implicites sont refusés',()=>{
  const mutations=[
    p=>p.airfield.runways[0].lengthM/=2,
    p=>p.reservedAreas.find(a=>a.kind==='runway').w/=2,
    p=>p.transportNetwork.edges.splice(p.transportNetwork.edges.findIndex(e=>e.kind==='runway-exit'),1),
    p=>p.transportNetwork.edges.splice(p.transportNetwork.edges.findIndex(e=>e.mode==='runway'),1),
    p=>p.transportNetwork.edges.splice(p.transportNetwork.edges.findIndex(e=>e.kind==='taxiway'),1),
    p=>p.transportNetwork.nodes.push({...p.transportNetwork.nodes[0],id:'isolated'}),
    p=>p.transportNetwork.nodes[0].x=-2,
    p=>p.transportNetwork.edges[0].level=1,
    p=>p.transportNetwork.edges[0].widthM=0,
    p=>p.transportNetwork.edges[0].widthM*=2,
    p=>p.transportNetwork.inspectionAccess='open',
    p=>p.structures.find(s=>s.kind==='airside-fence').w-=40
  ];
  for(const change of mutations){const p=make();change(p);assert.equal(M.audit(p).ok,false);}
  const road=make();const r=road.reservedAreas.find(a=>a.kind==='runway');road.buildings[0].x=r.x;road.buildings[0].y=r.y;
  assert.ok(M.audit(road).errors.includes('blocked-pitch'));
  const crossing=make('EXT-MONDE-T074');
  const ends=crossing.railway.ends.map(e=>e.to);
  crossing.transportNetwork.edges.push({id:'implicit-crossing',from:ends[0],to:ends.at(-1),widthM:4.5,mode:'rail',kind:'unregistered-crossing',level:0});
  assert.ok(M.audit(crossing).errors.includes('transport-undeclared-crossing'));
});

test('ferroviaire : absence de butoir, traversée décalée ou signalisation prétendument active sont refusées',()=>{
  const mutations=[
    p=>p.structures.splice(p.structures.findIndex(s=>s.kind==='rail-buffer-stop'),1),
    p=>p.railway.ends[0].endKind='destination',
    p=>p.railway.crossings[0].barriersOperational=true,
    p=>p.network.nodes.find(n=>n.id===p.railway.crossings[0].walkNode).x+=1,
    p=>p.railway.trainSimulation=true,
    p=>p.railway.signalSimulation=true,
    p=>p.railway.gaugeM=.5
  ];
  for(const change of mutations){const p=make('EXT-MONDE-T074');change(p);assert.equal(M.audit(p).ok,false);}
});

test('transport : ni stock, service, véhicule, provenance réelle ou disponibilité de campagne inventés',()=>{
  const changes=[p=>p.playable=true,p=>p.sourceIds.push('UNVERIFIED'),p=>p.transportNetwork.operational=true,
    p=>p.transportNetwork.externalPorts[0].connectedToWorld=true,p=>p.operations.vehiclesCreated=1,p=>p.operations.newOutput=0,
    p=>p.structures[0].walkable=true,p=>p.structures[0].lootAssigned=true,p=>p.structures[0].utilityConnected=true,
    p=>p.outdoorAreas[0].amount=0,p=>p.reservedAreas[0].resource='fuel'];
  for(const change of changes){const p=make();change(p);assert.equal(M.audit(p).ok,false);}
});

test('transport : schémas, identités et variantes invalides échouent sans interrompre le lot',()=>{
  for(const type of [null,undefined,'T069','EXT-MONDE-T068','__proto__'])assert.throws(()=>M.build(type,1));
  for(const n of [-1,0,51,NaN,Infinity,1.5,'1'])assert.throws(()=>M.build(M.TYPES[0],n));
  for(const value of [null,undefined,{},[],{type:M.TYPES[0]}])assert.equal(M.audit(value).ok,false);
  const p=make();p.id='wrong';assert.equal(M.audit(p).ok,false);
  p.transportNetwork=null;assert.equal(M.audit(p).ok,false);
});

test('transport : le cœur navigateur est autonome et identique aux sorties Node',()=>{
  const source=fs.readFileSync(require.resolve('../scripts/codex-transport-sites2026.cjs'),'utf8');
  const body=source.split('// BEGIN AUTHOR CORE')[1].split('// END AUTHOR CORE')[0];
  assert.doesNotMatch(body,/\brequire\s*\(|\bprocess\.|\bfs\.|\bpath\./);
  const context=vm.createContext({Reference});
  vm.runInContext('(function(Reference){'+body+';globalThis.Transport={TYPES,build,audit};})(Reference);',context);
  for(const type of M.TYPES)for(const n of [1,26,50]) {
    assert.deepEqual(clone(context.Transport.build(type,n)),clone(M.build(type,n)));
    assert.equal(context.Transport.audit(context.Transport.build(type,n)).ok,true);
  }
});
