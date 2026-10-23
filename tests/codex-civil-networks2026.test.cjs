'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../scripts/codex-civil-networks2026.cjs');
const Reference=require('../scripts/codex-world-foundations2026.cjs');
const Physical=require('../src/codex-physical2026.js'),Furniture=require('../src/codex-furnishings2026.js');
const clone=v=>JSON.parse(JSON.stringify(v));
const make=(type='EXT-MONDE-T029')=>clone(M.build(type,1));
const signatures=p=>JSON.stringify([p.bounds,p.buildings.map(b=>[b.role,b.x,b.y,b.w,b.h,b.entrySide]),p.transportNetwork.nodes.map(n=>[n.x,n.y,n.z]),p.civil.supports]);

test('génie civil : 400 plans distincts et déterministes sans RNG de campagne',()=>{
 const random=Math.random;Math.random=()=>{throw Error('Unexpected simulation RNG');};
 try{for(const type of M.TYPES){const geometries=new Set();for(let number=1;number<=50;number++){
  const p=M.build(type,number),a=M.audit(p);assert.equal(a.ok,true,p.id+': '+a.errors.join(','));assert.deepEqual(p,M.build(type,number));
  assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.transportNetwork.edges)&&Object.isFrozen(p.civil.supports));geometries.add(signatures(p));
  assert.equal(p.units,'m');assert.equal(p.playable,false);assert.deepEqual(p.sourceIds,[]);assert.equal(p.heightOrigin,'author-design');
  assert.ok(Object.values(p.operations).every(v=>v===0));assert.equal(p.transportNetwork.operational,false);assert.equal(p.transportNetwork.inspectionAccess,'closed');
 }assert.equal(geometries.size,50,type);}}finally{Math.random=random;}
 assert.equal(M.auditAll().variants,400);
});

test('génie civil : ponts et échangeurs conservent leurs programmes et leurs vraies dimensions',()=>{
 const samples=M.TYPES.map(type=>M.build(type,1));assert.equal(new Set(samples.map(p=>p.configuration.form)).size,8);
 for(const p of samples){assert.equal(p.buildings.length,8);assert.equal(p.buildings.reduce((n,b)=>n+b.rooms.filter(r=>r.kind!=='circulation').length,0),34);assert.equal(p.structures.length,1);}
 const rail=M.build('EXT-MONDE-T032',50);assert.ok(rail.bounds.w>=4000);assert.equal(rail.civil.deck.h,9);assert.ok(rail.civil.deck.w>500);
 const lift=M.build('EXT-MONDE-T031',1);assert.equal(lift.civil.supports.filter(s=>s.kind==='lift-tower').length,4);assert.equal(lift.civil.lift.animationDelivered,false);assert.equal(lift.civil.lift.state,'closed-and-immobilized');
 assert.equal(M.build('EXT-MONDE-T034',1).civil.routes.length,3);assert.equal(M.build('EXT-MONDE-T033',1).civil.routes.length,4);
 assert.equal(M.build('EXT-MONDE-T035',1).civil.routes.filter(r=>r.kind==='loop').length,4);assert.equal(M.build('EXT-MONDE-T036',1).civil.routes.filter(r=>r.kind==='loop').length,0);
});

test('génie civil : chaque graphe est connexe depuis une seule entrée et chaque pente reste bornée',()=>{
 for(const type of M.TYPES)for(let number=1;number<=50;number++){
  const p=M.build(type,number),T=p.transportNetwork,nodes=new Map(T.nodes.map(n=>[n.id,n])),links=new Map(T.nodes.map(n=>[n.id,[]]));
  for(const e of T.edges){const a=nodes.get(e.from),b=nodes.get(e.to);links.get(a.id).push(b.id);links.get(b.id).push(a.id);
   const grade=Math.abs(a.z-b.z)/Math.hypot(a.x-b.x,a.y-b.y);assert.ok(grade<=(e.mode==='rail'?.025:.06)+1e-8,p.id+' excessive gradient');}
  const seen=new Set([T.externalPorts[0].node]),q=[...seen];for(let i=0;i<q.length;i++)for(const n of links.get(q[i]))if(!seen.has(n)){seen.add(n);q.push(n);}assert.equal(seen.size,T.nodes.length,p.id+' disconnected branch');
  if(p.civil.gradeSeparation){const g=p.civil.gradeSeparation,a=nodes.get(g.upperNode),b=nodes.get(g.lowerNode);assert.notEqual(a.id,b.id);assert.equal(a.x,b.x);assert.equal(a.y,b.y);assert.ok(a.z-b.z-g.deckDepthM>=5);assert.ok(!links.get(a.id).includes(b.id));}
  if(p.civil.deck){const c=p.civil.clearances[0];assert.equal(c.heightM,p.civil.deck.elevationM-p.civil.deck.depthM);assert.ok(c.heightM>5);}
 }
});

test('génie civil : inspection périphérique équipée, chaussées et dessous d’ouvrages réellement fermés',()=>{
 for(const type of M.TYPES)for(const number of [1,25,50]){
  const p=M.build(type,number),f=Furniture.build(p),fa=Furniture.audit(p,f);assert.equal(fa.ok,true,p.id+': '+fa.errors.join(','));
  assert.equal(f.summary.rooms,34);assert.equal(f.summary.furnishedRooms,34);assert.equal(f.summary.unknownUses,0);assert.equal(f.summary.lootContainersCreated,0);assert.equal(f.summary.connectedServices,0);
  assert.equal(f.summary.requested,f.props.length+f.unplaced.length);
  const firstAid=f.rooms.find(r=>r.name==='salle de soins du personnel');assert.ok(firstAid,p.id+' missing staff first-aid room');
  const medicalProps=f.props.filter(item=>item.roomId===firstAid.id);for(const kind of ['medical','dentalChair','sink'])assert.ok(medicalProps.some(item=>item.kind===kind),p.id+' missing actual medical fixture '+kind);
  const dressingStore=f.rooms.find(r=>r.name==='réserve de pansements');assert.ok(dressingStore);assert.ok(f.props.some(item=>item.roomId===dressingStore.id&&item.kind==='shelf'));
  assert.ok(!f.unplaced.some(item=>item.roomId===firstAid.id||item.roomId===dressingStore.id),p.id+' first-aid prescription refused');
  const s=Physical.withProps(Physical.build(p),f.props),a=Physical.audit(s);assert.equal(a.ok,true,p.id+': '+a.errors.join(','));assert.equal(s.levels.length,1);assert.equal(s.transitions.length,0);
  assert.equal(Physical.blocked(s,p.bounds.w/2,p.bounds.h/2,0,.32),true,p.id+' central civil reservation is accessible');
  assert.ok(s.reservations.some(r=>r.id===p.civil.closedDomainId&&r.walkable===false));
  const nodes=new Map(s.nodes.map(n=>[n.id,n]));for(const e of p.network.edges){assert.equal(Physical.segmentClear(s,nodes.get(e.from),nodes.get(e.to),0,.32),true,p.id+' maintenance road blocked');}
 }
});

test('génie civil : route dans les locaux ou traversée piétonne du domaine fermé refusées',()=>{
 const p=make(),building=p.buildings[0],n=p.network.nodes[1];n.x=building.x+building.w/2;n.y=building.y+building.h/2;assert.equal(M.audit(p).ok,false);assert.equal(Physical.audit(Physical.build(p)).ok,false);
 const q=make();q.network.nodes[1].x=q.bounds.w/2;q.network.nodes[1].y=q.bounds.h/2;assert.equal(M.audit(q).ok,false);assert.equal(Physical.audit(Physical.build(q)).ok,false);
});

test('génie civil : nœud fictif entre chaussées superposées et niveaux implicites refusés',()=>{
 const p=make('EXT-MONDE-T035'),g=p.civil.gradeSeparation;p.transportNetwork.edges.push({id:'invented-crossing',from:g.upperNode,to:g.lowerNode,widthM:6,mode:'ramp',level:null,kind:'ramp'});assert.equal(M.audit(p).ok,false);
 const q=make('EXT-MONDE-T033'),lower=q.transportNetwork.nodes.find(n=>n.id===q.civil.gradeSeparation.lowerNode);lower.z=8;lower.level=1;assert.equal(M.audit(q).ok,false);
 const r=make();r.transportNetwork.edges[0].kind='instant-stairs';assert.equal(M.audit(r).ok,false);
 const duplicate=make('EXT-MONDE-T033');duplicate.transportNetwork.nodes.push({...duplicate.transportNetwork.nodes[0],id:'same-position-without-junction'});duplicate.transportNetwork.edges.push({id:'false-nearby-branch',from:duplicate.transportNetwork.nodes[1].id,to:'same-position-without-junction',widthM:6,mode:'road',kind:'axis',level:1});assert.equal(M.audit(duplicate).ok,false);
});

test('génie civil : pente excessive, gabarit inventé, appui absent et branche orpheline refusés',()=>{
 const mutations=[p=>p.civil.clearances[0].heightM+=3,p=>p.civil.supports.shift(),p=>p.civil.supports[0].zToM=p.maxHeightM+1,
  p=>p.transportNetwork.nodes[1].z+=30,p=>p.transportNetwork.edges[0].to='missing',p=>p.transportNetwork.edges[0].widthM=0,
  p=>p.transportNetwork.externalPorts[0].connectedToWorld=true,p=>p.transportNetwork.nodes[0].x=-1,
  p=>p.transportNetwork.nodes.push({...p.transportNetwork.nodes[0],id:'unconnected-node'})];
 for(const mutate of mutations){const p=make();mutate(p);assert.equal(M.audit(p).ok,false);}
 const q=make('EXT-MONDE-T035');q.civil.routes[0].edgeIds.splice(2,1);assert.equal(M.audit(q).ok,false);
 const r=make('EXT-MONDE-T031');r.civil.lift.animationDelivered=true;assert.equal(M.audit(r).ok,false);
});

test('génie civil : consultation sans stock, route opérationnelle ni raccord de campagne prétendu',()=>{
 const mutations=[p=>p.playable=true,p=>p.transportNetwork.operational=true,p=>p.transportNetwork.inspectionAccess='open',p=>p.civil.inspectionAccess='open',
  p=>p.structures[0].walkable=true,p=>p.structures[0].lootAssigned=true,p=>p.structures[0].amount=0,p=>p.structures[0].resource='scrap',
  p=>p.operations.connectedServices=1,p=>p.operations.newOutput=0,p=>p.sourceIds.push('unverified'),p=>p.buildings[0].rooms[1].name='usage inventé',p=>p.buildings.find(b=>b.role==='welfare').rooms.find(r=>r.name==='salle de soins du personnel').name='local vide'];
 for(const mutate of mutations){const p=make();mutate(p);assert.equal(M.audit(p).ok,false);}
});

test('génie civil : identités, variantes et documents incomplets refusés sans arrêter le lot',()=>{
 for(const type of [null,undefined,'EXT-MONDE-T028','EXT-MONDE-T037','__proto__'])assert.throws(()=>M.build(type,1));
 for(const number of [0,51,-1,1.5,NaN,Infinity,'1'])assert.throws(()=>M.build(M.TYPES[0],number));
 for(const p of [null,undefined,{},[],{type:M.TYPES[0]}])assert.equal(M.audit(p).ok,false);
 for(const mutate of [p=>p.number=51,p=>p.configuration.form='fake',p=>p.transportNetwork=null,p=>p.civil.supports=null]){const p=make();mutate(p);assert.equal(M.audit(p).ok,false);}
});

test('génie civil : le cœur navigateur reproduit la source Node sans E/S ni dépendance réseau',()=>{
 const source=fs.readFileSync(require.resolve('../scripts/codex-civil-networks2026.cjs'),'utf8'),body=source.split('// BEGIN AUTHOR CORE')[1].split('// END AUTHOR CORE')[0];
 assert.doesNotMatch(body,/\brequire\s*\(|\bprocess\.|\bfs\.|\bpath\./);
 const context=vm.createContext({Reference});vm.runInContext('(function(Reference){'+body+';globalThis.Civil={TYPES,build,audit};})(Reference);',context);
 for(const type of M.TYPES)for(const n of [1,25,50]){const p=context.Civil.build(type,n);assert.deepEqual(clone(p),clone(M.build(type,n)));assert.equal(context.Civil.audit(p).ok,true);}
});
