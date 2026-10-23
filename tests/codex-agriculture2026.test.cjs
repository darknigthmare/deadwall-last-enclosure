'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const A=require('../scripts/codex-agriculture2026.cjs');
const P=require('../src/codex-physical2026.js');
const F=require('../src/codex-furnishings2026.js');
const Reference=require('../scripts/codex-world-foundations2026.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const make=()=>copy(A.build('EXT-MONDE-T021',1));

test('agriculture : les 400 variantes ont des géométries distinctes et reproductibles',()=>{
  const originalRandom=Math.random;Math.random=()=>{throw Error('Hasard de simulation consommé.');};
  try {
    const all=A.auditAll();assert.equal(all.typologies,8);assert.equal(all.variants,400);assert.equal(all.playable,0);
    assert.equal(new Set(all.records.map(p=>p.id)).size,400);
    for(const type of A.TYPES) {
      const shapes=new Set();
      for(let n=1;n<=50;n++) {
        const p=A.build(type,n);assert.deepEqual(p,A.build(type,n));
        assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.buildings)&&Object.isFrozen(p.buildings[0].rooms));
        shapes.add(hash([p.bounds,p.buildings.map(b=>[b.role,b.x,b.y,b.w,b.h,b.entrySide]),
          p.structures.map(s=>[s.kind,s.x,s.y,s.w,s.h]),p.reservedAreas.map(r=>[r.kind,r.x,r.y,r.w,r.h])]));
      }
      assert.equal(shapes.size,50,type+' : les noms et identifiants ne suffisent pas à varier un plan.');
    }
  } finally {Math.random=originalRandom;}
});

test('agriculture : murs, portes, jardins et clôtures laissent passer le personnage sur les 400 plans',()=>{
  for(const type of A.TYPES)for(let n=1;n<=50;n++) {
    const p=A.build(type,n),scene=P.build(p),checked=P.audit(scene);
    assert.equal(checked.ok,true,p.id+': '+JSON.stringify(checked.errors));
    assert.equal(P.blocked(scene,scene.entry.x,scene.entry.y,0),false);
    for(const g of p.accessGates) {
      const from=scene.nodes.find(q=>q.id===g.approachNode),threshold=scene.nodes.find(q=>q.id===g.node),inside=scene.nodes.find(q=>q.id===g.insideNode);
      assert.ok(P.segmentClear(scene,from,threshold,0),g.id+' : approche');
      assert.ok(P.segmentClear(scene,threshold,inside,0),g.id+' : passage intérieur');
    }
    assert.equal(scene.rooms.filter(r=>r.kind!=='circulation').length,p.buildings.reduce((n,b)=>n+b.rooms.length-1,0));
  }
});

test('agriculture : habitation, activité, préparation, atelier, équipe et réserves sont réellement séparés',()=>{
  const signatures=new Set();
  for(const type of A.TYPES) {
    const p=A.build(type,1),house=p.buildings.find(b=>b.role==='housing');
    assert.equal(new Set(p.buildings.map(b=>b.role)).size,6);
    assert.ok(house.rooms.some(r=>/cuisine/.test(r.name)));
    assert.ok(house.rooms.some(r=>/sanitaires/.test(r.name)));
    assert.ok(house.rooms.some(r=>/chambre/.test(r.name)));
    assert.ok(p.outdoorAreas.some(a=>a.kind==='kitchen-garden'));
    assert.ok(p.buildings.some(b=>b.rooms.some(r=>/local pompes/.test(r.name))));
    signatures.add(hash(p.buildings.filter(b=>['production','processing'].includes(b.role)).map(b=>[b.kind,b.w,b.h,b.rooms.map(r=>r.name)])));
  }
  assert.equal(signatures.size,8,'Les activités ne partagent pas un hangar seulement renommé.');
});

test('agriculture : la composition du mobilier reconnaît tous les usages sans inventer leur fonction',()=>{
  for(const type of A.TYPES)for(const b of A.build(type,1).buildings)for(const r of b.rooms) {
    if(r.kind==='circulation')continue;
    assert.ok(F.classify(r.name),r.name);
  }
  assert.equal(F.classify('boxes de repos'),'livestock');
  assert.equal(F.classify('infirmerie vétérinaire'),'veterinary');
  assert.equal(F.classify('stockage réfrigéré fruits'),'coldStores');
  assert.equal(F.classify('serre semis'),'greenhouse');
  assert.equal(F.classify('chambre parentale'),'bedroom');
});

test('agriculture : le mobilier des deux orientations et tailles extrêmes respecte les vraies collisions',()=>{
  for(const type of A.TYPES)for(const n of [1,6,45,50]) {
    const p=A.build(type,n),before=hash(p),furnishing=F.build(p);
    assert.equal(F.audit(p,furnishing).ok,true,p.id);
    assert.equal(furnishing.summary.unknownUses,0,p.id);
    assert.ok(furnishing.props.length>60,p.id);
    assert.equal(furnishing.summary.lootContainersCreated,0);assert.equal(furnishing.summary.connectedServices,0);
    assert.ok(furnishing.props.every(o=>o.lootAssigned===false&&o.utilityConnected===false));
    const scene=P.withProps(P.build(p),furnishing.props),audit=P.audit(scene);
    assert.equal(audit.ok,true,p.id+': '+JSON.stringify(audit.errors));
    assert.equal(hash(p),before,'La composition ne modifie pas le plan auteur.');
  }
});

test('agriculture : les mauvaises typologies et les variantes hors contrat sont refusées',()=>{
  for(const type of ['EXT-MONDE-T020','EXT-MONDE-T029','T021',null,'__proto__'])assert.throws(()=>A.build(type,1));
  for(const n of [0,51,-1,NaN,Infinity,1.5,'1',undefined])assert.throws(()=>A.build(A.TYPES[0],n));
});

test('agriculture : refermer une clôture sur son ouverture est détecté et bloque réellement le passage',()=>{
  for(const which of ['garden','field:0']) {
    const p=make(),g=p.accessGates.find(g=>g.id.endsWith(':'+which));
    const barrier={...p.structures[0],id:p.id+':unexpected-barrier',x:g.x-g.widthM/2,y:g.y-.1,w:g.widthM,h:.2};
    p.structures.push(barrier);const checked=A.audit(p);
    assert.equal(checked.ok,false);assert.ok(checked.errors.includes('gate-obstructed'));
    const scene=P.build(p),from=scene.nodes.find(n=>n.id===g.approachNode),to=scene.nodes.find(n=>n.id===g.insideNode);
    assert.equal(P.segmentClear(scene,from,to,0),false,'Une clôture ne devient pas passable à cause de son libellé.');
  }
});

test('agriculture : chemins traversant un bâtiment ou une culture et largeurs excessives sont refusés',()=>{
  for(const selector of [p=>p.buildings.find(b=>b.role==='production'),p=>p.reservedAreas[0]]) {
    const p=make(),obstacle=selector(p),y=obstacle.y+obstacle.h/2;
    p.network.nodes.push({id:'bad-left',x:obstacle.x-1,y,z:0},{id:'bad-right',x:obstacle.x+obstacle.w+1,y,z:0});
    p.network.edges.push({id:'bad-edge',from:'bad-left',to:'bad-right',widthM:1.2,mode:'pedestrian',level:0});
    const checked=A.audit(p);assert.equal(checked.ok,false);
    assert.ok(checked.errors.some(e=>e==='road-crosses-structure'||e==='road-crosses-protected-area'));
  }
  const p=make(),gate=p.accessGates.find(g=>g.id.endsWith(':field:0'));
  p.network.edges.find(e=>e.from===gate.node&&e.to===gate.insideNode).widthM=20;
  assert.ok(A.audit(p).errors.includes('road-crosses-protected-area'));
});

test('agriculture : parcelles, cultures et portails conservent leurs propriétaires physiques',()=>{
  for(const mutate of [
    p=>p.reservedAreas[0].areaId='absent',
    p=>p.reservedAreas[0].x=1,
    p=>p.outdoorAreas[1].x=p.outdoorAreas[2].x,
    p=>p.outdoorAreas[0].id=p.buildings[0].id,
    p=>p.accessGates[0].areaId='absent',
    p=>p.accessGates[0].node=p.accessGates[1].node,
    p=>p.accessGates[0].fenceSegments[0]='absent',
    p=>p.accessGates[0].x+=1,
    p=>p.accessGates[0].open=false,
    p=>p.accessGates.pop()
  ]) {const p=make();mutate(p);assert.equal(A.audit(p).ok,false);}
});

test('agriculture : aucun animal, courant, récolte ou stock ne naît du plan auteur',()=>{
  for(const mutate of [
    p=>p.playable=true,p=>p.operations.animalsSpawned=1,p=>p.operations.harvestablePlots=1,
    p=>p.operations.lootContainersCreated=1,p=>p.operations.connectedServices=1,
    p=>p.structures[0].utilityConnected=true,p=>p.structures[0].lootAssigned=true,
    p=>p.structures[0].amount=40,p=>p.reservedAreas[0].resource='food',
    p=>p.network.externalPorts[0].connectedToWorld=true,p=>p.sourceIds.push('unverified-manufacturer')
  ]) {const p=make();mutate(p);assert.equal(A.audit(p).ok,false);}
});

test('agriculture : emprises, hauteurs, identités et schémas invalides donnent un verdict structuré',()=>{
  for(const mutate of [
    p=>p.bounds.w=NaN,p=>p.maxHeightM=Infinity,p=>p.structures[0].maxHeightM=-1,
    p=>p.buildings[0].rooms[0].clearHeightM=0,p=>p.buildings[0].rooms[1].x=-2,
    p=>p.network.nodes[0].x=-1000,p=>p.buildings[0].role='other',p=>p.type='EXT-MONDE-T060',
    p=>p.number=100,p=>p.id='OTHER',p=>delete p.buildings[0].portals,
    p=>p.buildings=[null],p=>p.buildings={},p=>p.outdoorAreas=null,p=>p.accessGates=null
  ]) {const p=make();mutate(p);assert.doesNotThrow(()=>A.audit(p));assert.equal(A.audit(p).ok,false);}
  for(const p of [undefined,null,{},[],1,'plan']){assert.doesNotThrow(()=>A.audit(p));assert.equal(A.audit(p).ok,false);}
});

test('agriculture : le cœur navigateur est identique au module Node et ne demande aucun I/O',()=>{
  const text=fs.readFileSync(path.join(__dirname,'../scripts/codex-agriculture2026.cjs'),'utf8');
  const source=text.split('// BEGIN AUTHOR CORE\n')[1].split('// END AUTHOR CORE')[0];
  assert.ok(source);assert.doesNotMatch(source,/\brequire\s*\(|\bprocess\.|\bfs\./);
  const context={Reference};vm.createContext(context);
  vm.runInContext(source+'\nthis.Author={TYPES,build,audit,auditAll};',context);
  for(const type of A.TYPES)for(const n of [1,6,50]) {
    assert.equal(JSON.stringify(context.Author.build(type,n)),JSON.stringify(A.build(type,n)));
    assert.equal(context.Author.audit(context.Author.build(type,n)).ok,true);
  }
});

test('agriculture : audits purs et cotes auteur sans prétention de relevé extérieur',()=>{
  const p=make(),before=hash(p);A.audit(p);assert.equal(hash(p),before);
  assert.equal(p.heightOrigin,'author-design');assert.equal(p.sourceIds.length,0);
  assert.ok(p.designAssumptions.some(t=>t.includes('aucun relevé réel')));
  assert.ok(p.buildings.every(b=>b.heightOrigin==='author-design'&&b.footprintOrigin==='author-design'));
});
