'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const M=require('../scripts/codex-world-foundations2026.cjs');
const clone=v=>JSON.parse(JSON.stringify(v)),hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const make=()=>clone(M.build('EXT-MONDE-T065',1));
test('référentiel primaire : unités, origine et portée pour chaque cote',()=>{const r=M.refs();assert.equal(M.validateReferences(r),true);assert.equal(r.sources.length,7);assert.ok(r.metrics.length>=30);assert.ok(r.sources.every(s=>s.scope.length>30));});
test('mauvaises unités, NaN, cote sans source, doublons et cote requise absente sont refusés',()=>{
 for(const mutate of [r=>r.metrics[0].unit='ft',r=>r.metrics[0].value=NaN,r=>r.metrics[0].value=-1,r=>r.metrics[0].source='inconnue',r=>r.metrics.push({...r.metrics[0]}),r=>r.sources.push({...r.sources[0]}),r=>r.metrics.splice(0,1)]){const r=M.refs();mutate(r);assert.throws(()=>M.validateReferences(r));}
});
test('150 plans distincts, reproductibles, bornés et sans génération de stock',()=>{
 const refs=M.refs(),before=hash(refs),all=M.auditAll(refs);assert.equal(all.variants,150);assert.equal(all.playable,0);assert.equal(new Set(all.records.map(r=>r.id)).size,150);
 for(const type of M.TYPES){const layouts=new Set();for(let i=1;i<=50;i++){const p=M.build(type,i,refs),q=M.build(type,i,refs);assert.deepEqual(p,q);assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.buildings));assert.equal(M.audit(p).ok,true);assert.equal(p.playable,false);assert.ok(p.network.externalPorts.every(x=>x.connectedToWorld===false));const geometry=clone(p);delete geometry.id;delete geometry.number;layouts.add(JSON.stringify([geometry.bounds,geometry.maxHeightM,geometry.buildings.map(b=>[b.kind,b.x,b.y]),geometry.structures.map(s=>[s.x,s.y,s.hubHeightM])]));}assert.equal(layouts.size,50,type);}
 assert.equal(hash(refs),before);assert.ok(all.records.every(r=>r.rooms>0&&r.buildings>0));
});
test('seules les trois typologies et variantes 1 à 50 sont acceptées',()=>{for(const type of ['EXT-MONDE-T005','T060',null])assert.throws(()=>M.build(type,1));for(const n of [0,51,-1,1.5,'1',NaN])assert.throws(()=>M.build(M.TYPES[0],n));});
test('terrain 105×68 constant ; marges distinctes et hors gradins',()=>{
 for(const type of M.TYPES.slice(1))for(const n of [1,50]){const p=M.build(type,n),field=p.reservedAreas.find(r=>r.kind==='field-of-play'),safe=p.reservedAreas.find(r=>r.kind==='clear-pitch');assert.equal(field.w,105);assert.equal(field.h,68);assert.equal(safe.w,type.endsWith('066')?115:113);assert.equal(safe.h,type.endsWith('066')?76:74);assert.equal(p.structures.length,4);assert.ok(p.structures.every(r=>r.interiorStatus==='not-built'));assert.equal(p.heightOrigin,'author-design');}
});
test('vent : rotor, moyeu et pointe ne sont pas une emprise de collision au sol',()=>{
 for(let i=1;i<=50;i++){const p=M.build(M.TYPES[0],i);assert.ok(p.bounds.w>1000);for(const t of p.structures){assert.equal(t.rotorDiameterM,150);assert.equal(t.maxHeightM,t.hubHeightM+75);assert.equal(t.sweptEnvelopeIsGroundCollider,false);assert.equal(t.w,16);assert.equal(t.footprintOrigin,'author-design');}assert.ok(p.maxHeightM>=180&&p.maxHeightM<=241);}
});
test('plan de service : toutes les salles et entrées ont une liaison explicite',()=>{const p=make();for(const b of p.buildings){assert.equal(b.rooms.length,5);assert.equal(b.portals.length,4);assert.equal(b.rotationRad,0);assert.ok(b.rooms.slice(1).every(r=>b.portals.some(d=>d.to===r.id)));}assert.equal(M.audit(p).ok,true);});
test('portes, niveaux ou pièces inventées sans raccord sont refusés',()=>{for(const mutate of [p=>p.buildings[0].portals.pop(),p=>p.buildings[0].portals[0].x+=1,p=>p.buildings[0].levels.push(1),p=>p.buildings[0].entry.y=3,p=>p.buildings[0].entry.widthM=.4,p=>p.buildings[0].rooms[1].x=-2]){const p=make();mutate(p);assert.equal(M.audit(p).ok,false);}});
test('un chemin ne passe ni à travers le terrain ni sous un bâtiment au même niveau',()=>{
 const p=make(),field=p.reservedAreas[0];p.network.nodes.push({id:'left',x:field.x-5,y:field.y+field.h/2,z:0},{id:'right',x:field.x+field.w+5,y:field.y+field.h/2,z:0});p.network.edges.push({id:'bad',from:'left',to:'right',widthM:4.5,level:0,mode:'service'});assert.ok(M.audit(p).errors.includes('road-crosses-protected-area'));
 const q=make(),b=q.buildings[0];q.network.nodes.push({id:'left',x:b.x-5,y:b.y+b.h/2,z:0},{id:'right',x:b.x+b.w+5,y:b.y+b.h/2,z:0});q.network.edges.push({id:'bad',from:'left',to:'right',widthM:4.5,level:0,mode:'service'});assert.ok(M.audit(q).errors.includes('road-crosses-structure'));
});
test('la largeur complète du corridor est contrôlée, pas uniquement sa ligne centrale',()=>{assert.equal(M.corridorOverlaps({x:0,y:0},{x:10,y:0},4,{x:3,y:1.5,w:2,h:1}),true);assert.equal(M.corridorOverlaps({x:0,y:0},{x:10,y:0},2,{x:3,y:1.5,w:2,h:1}),false);assert.equal(M.corridorOverlaps({x:0,y:0},{x:10,y:10},2,{x:4,y:4,w:1,h:1}),true);assert.equal(M.corridorOverlaps({x:0,y:0},{x:0,y:10},2,{x:-1,y:10,w:2,h:2}),false,'contact de face permis');});
test('la desserte longitudinale du parc éolien évite les fondations',()=>{const p=clone(M.build(M.TYPES[0],9));const nodes=p.network.nodes,first=nodes.find(n=>n.id.endsWith(':lane:0:0')),next=nodes.find(n=>n.id.endsWith(':lane:1:0'));p.network.edges.push({id:'regression',from:first.id,to:next.id,widthM:4.5,level:0,mode:'service'});assert.ok(M.audit(p).errors.includes('road-crosses-structure'));});
test('les graphes déconnectés, extrémités absentes et fausse connexion au seed sont refusés',()=>{for(const mutate of [p=>p.network.nodes.push({id:'isolated',x:1,y:1,z:0}),p=>p.network.edges[0].to='absent',p=>p.network.externalPorts[0].connectedToWorld=true,p=>p.network.edges.push({...p.network.edges[0]}),p=>p.network.nodes[0].z=1]){const p=make();mutate(p);assert.equal(M.audit(p).ok,false);}});
test('les doublons, collisions, sorties de réserve et faux butins sont détectés',()=>{for(const mutate of [p=>p.buildings[0].id=p.structures[0].id,p=>p.buildings[0].x=p.buildings[1].x,p=>p.buildings[0].x=-10,p=>p.buildings[0].rooms[1].slots[0].lootAssigned=true,p=>p.playable=true,p=>p.units='px']){const p=make();mutate(p);assert.equal(M.audit(p).ok,false);}});
test('les contrôles ne mutent aucun plan et rejettent les entrées non structurées',()=>{const p=make(),before=hash(p);M.audit(p);assert.equal(hash(p),before);for(const bad of [undefined,null,{},[]])assert.equal(M.audit(bad).ok,false);});
test('tirant d’eau, creux moulé et longueur ne deviennent jamais une hauteur totale',()=>{const r=M.refs();const ids=['tanker.mouldedDepth','psv.mouldedDepth','submarine.draft','cruiser.draft'];for(const id of ids){const m=r.metrics.find(m=>m.id===id);assert.ok(m&&m.datum);assert.doesNotMatch(m.id,/totalHeight/);}assert.equal(r.metrics.find(m=>m.id==='cruiser.length').value,185.928);assert.equal(r.metrics.find(m=>m.id==='submarine.length').value,94.996);assert.ok(r.sources.find(s=>s.id==='TORSK').scope.includes('Notice indexée'));});
test('suivi : clôturer uniquement trois gabarits, conserver architecture et jouabilité ouvertes',()=>{
 const {patch}=require('../scripts/codex-progress2026.cjs'),types=[...M.TYPES,'EXT-MONDE-T005','EXT-MONDE-T006','EXT-MONDE-T007','EXT-MONDE-T008','EXT-MONDE-T011'];
 const d={typologies:types.map(id=>({id})),variants:M.TYPES.flatMap(type=>Array.from({length:50},(_,i)=>({id:type+'-V'+String(i+1).padStart(2,'0'),number:i+1,status:'À concevoir',playable:false}))),tasks:types.flatMap(typologyId=>['dimensions','architecture','loot'].map(stage=>({id:typologyId+'/'+stage,typologyId,stage,status:'À faire',evidence:''})))};
 const before=hash(d),p=patch(d);assert.equal(hash(d),before);assert.equal(p.changes.closed.length,3);assert.equal(p.changes.inProgress.length,8);assert.equal(p.changes.metricVariants.length,150);assert.ok(p.data.variants.every(v=>v.playable===false&&v.architecture===null&&v.spawnWeight===null));assert.deepEqual(patch(p.data),p);
 const conflict=clone(d);conflict.tasks[0].status='Validé';conflict.tasks[0].evidence='autre auteur';assert.throws(()=>patch(conflict),/concurrente/);
});

test('les nœuds hors parcelle sont refusés, tandis que les ports sur son bord restent valides',()=>{
 const original=make();
 assert.equal(original.network.nodes[0].y,original.bounds.y);
 assert.equal(M.audit(original).ok,true);
 for(const [axis,value] of [['x',-1],['y',-1000],['x',original.bounds.w+1],['y',original.bounds.h+1]]){
  const p=make();p.network.nodes[0][axis]=value;
  const result=M.audit(p);
  assert.equal(result.ok,false,axis+'='+value);
  assert.ok(result.errors.includes('node-outside-site'));
 }
});

test('les hauteurs nulles, négatives, non finies ou textuelles ne valident jamais un plan',()=>{
 for(const field of ['site','building','room'])for(const value of [0,-1,NaN,Infinity,'3',null,undefined]){
  const p=make();
  if(field==='site')p.maxHeightM=value;
  else if(field==='building')p.buildings[0].heightM=value;
  else p.buildings[0].rooms[1].clearHeightM=value;
  assert.equal(M.audit(p).ok,false,field+'/'+String(value));
 }
 const tooLow=make();tooLow.maxHeightM=tooLow.buildings[0].heightM-.1;
 assert.equal(M.audit(tooLow).ok,false,'la hauteur du site doit contenir ses annexes');
});

test('un schéma imbriqué incomplet est un verdict structuré et ne provoque pas de TypeError',()=>{
 const malformed=[
  p=>{delete p.buildings[0].rooms;},p=>{delete p.buildings[0].levels;},
  p=>{delete p.buildings[0].portals;},p=>{p.buildings[0].entry=null;},
  p=>{p.buildings[0].rooms[1].slots={};},p=>{p.buildings[0].rooms[1].slots=[null];},
  p=>{p.buildings[0]=null;},p=>{p.buildings[0].rooms[1]=null;},
  p=>{p.buildings[0].portals[0]=null;},p=>{p.structures[0]=null;},
  p=>{p.reservedAreas[0]=null;},p=>{p.bounds=null;},
  p=>{p.network.nodes[0]=null;},p=>{p.network.edges[0]=null;},
  p=>{p.network.externalPorts[0]=null;},p=>{p.network.nodes=new Array(1);},
  p=>{p.buildings[0].rooms[1].slots=new Array(1);}
 ];
 for(const [index,mutate]of malformed.entries()){
  const p=make();mutate(p);let result;
  assert.doesNotThrow(()=>{result=M.audit(p);},'cas '+index);
  assert.equal(result.ok,false,'cas '+index);
  assert.ok(Array.isArray(result.errors)&&result.errors.length>0);
 }
});

test('les portes ont une identité propre et des coordonnées, largeurs et intervalles finis',()=>{
 const mutations=[
  p=>{p.buildings[0].portals[0].id=p.buildings[0].portals[1].id;},
  p=>{p.buildings[0].portals[0].id='';},
  p=>{p.buildings[0].portals[0].widthM=NaN;},
  p=>{p.buildings[0].portals[0].y=NaN;},
  p=>{p.buildings[0].portals[0].wallGapM=NaN;},
  p=>{p.buildings[0].portals[0].from=p.buildings[0].rooms[2].id;},
  p=>{p.buildings[0].portals[0].to=p.buildings[0].rooms[0].id;}
 ];
 for(const [index,mutate]of mutations.entries()){
  const p=make();mutate(p);assert.equal(M.audit(p).ok,false,'porte '+index);
 }
});

test('les graphes refusent identités vides, segments nuls et points non numériques',()=>{
 const mutations=[
  p=>{p.network.nodes[0].id='';},p=>{p.network.nodes[0].x='0';},
  p=>{p.network.edges[0].widthM=NaN;},p=>{p.network.edges[0].id='';},
  p=>{const edge=p.network.edges[0],a=p.network.nodes.find(n=>n.id===edge.from),b=p.network.nodes.find(n=>n.id===edge.to);b.x=a.x;b.y=a.y;}
 ];
 for(const [index,mutate]of mutations.entries()){
  const p=make();mutate(p);assert.equal(M.audit(p).ok,false,'graphe '+index);
 }
});

test('les choix de composition explicitement auteur restent auditables sans source fabricant',()=>{
 const p=make();p.type='EXT-MONDE-T021';p.sourceIds=[];p.heightOrigin='author-design';
 p.designAssumptions=['Composition de jeu en mètres ; aucune cote de fabricant revendiquée.'];
 assert.equal(M.audit(p).ok,true);
});

test('le durcissement de l’audit préserve les octets des 150 géométries historiques',()=>{
 const expected={
  'EXT-MONDE-T060':'1c3bc2bd99b9aac8de6da1082bafa7805a20b6c8c8f0ceb0d0ed8d5c6c8845de',
  'EXT-MONDE-T065':'5234e8090ff9ce70a25572c55188cf50747456dbc2193bd2e5b1c5077a8e1634',
  'EXT-MONDE-T066':'ce9ae47514140a3a3aa900c4cd6ba59633e49a3b1b03711c52c9cd0fb3e29443'
 };
 for(const type of M.TYPES)assert.equal(hash(Array.from({length:50},(_,i)=>M.build(type,i+1))),expected[type],type);
});
