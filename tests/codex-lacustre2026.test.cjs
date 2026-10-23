'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const M=require('../scripts/codex-lacustre2026.cjs');
const Reference=require('../scripts/codex-world-foundations2026.cjs');
const Physical=require('../src/codex-physical2026.js');
const Furniture=require('../src/codex-furnishings2026.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const sample=()=>clone(M.build(M.TYPES[0],1));

test('lacustre : les 200 compositions sont distinctes, déterministes, meublées et accessibles sans traverser le lac',()=>{
  const original=Math.random;
  Math.random=()=>{throw Error('Le générateur auteur ne consomme pas le hasard de campagne.');};
  let rooms=0,props=0;
  try {
    for (const type of M.TYPES) {
      const signatures=new Set();
      for (let number=1;number<=50;number++) {
        const plan=M.build(type,number),authorJson=JSON.stringify(plan);
        assert.deepEqual(plan,M.build(type,number));
        assert.equal(M.audit(plan).ok,true,plan.id);
        assert.ok(Object.isFrozen(plan)&&Object.isFrozen(plan.network)&&Object.isFrozen(plan.shoreline));
        signatures.add(JSON.stringify([plan.bounds,plan.buildings.map(b=>[b.role,b.x,b.y,b.w,b.h,b.entrySide])]));
        const scene=Physical.build(plan),furniture=Furniture.build(plan),furnitureAudit=Furniture.audit(plan,furniture);
        assert.equal(furnitureAudit.ok,true,plan.id+': '+JSON.stringify(furnitureAudit.errors));
        const furnished=Physical.withProps(scene,furniture.props),audit=Physical.audit(furnished);
        assert.equal(audit.ok,true,plan.id+': '+JSON.stringify(audit.errors));
        assert.equal(furniture.summary.unknownUses,0,plan.id);
        assert.equal(furniture.summary.unplaced,0,plan.id);
        assert.equal(furniture.summary.furnishedRooms,furniture.summary.rooms,plan.id);
        assert.equal(furniture.summary.lootContainersCreated,0);assert.equal(furniture.summary.connectedServices,0);
        assert.equal(JSON.stringify(plan),authorJson,'Les inspecteurs ne modifient pas le plan auteur.');
        assert.equal(scene.playable,false);assert.equal(plan.playable,false);
        const shore=scene.nodes.find(n=>n.id===plan.id+':shore:stop');
        assert.ok(shore);assert.equal(Physical.blocked(furnished,shore.x,shore.y,0,.32),false);
        // A direct attempt from the genuine shore stop cannot use the site's
        // underlying ground to pass through the closed lake reservation.
        const move=Physical.move(furnished,{x:shore.x,y:shore.y,level:0},0,20,.32);
        assert.ok(move.pose.y<plan.shoreline.waterY);assert.equal(move.blocked,true);
        assert.equal(Physical.blocked(furnished,plan.bounds.w/2,plan.shoreline.waterY+10,0,.32),true);
        assert.ok(plan.network.nodes.every(n=>n.y<=plan.shoreline.waterY-M.RULES.shoreClearanceM));
        assert.ok(plan.network.externalPorts.every(p=>p.connectedToWorld===false));
        rooms+=furniture.summary.rooms;props+=furniture.props.length;
      }
      assert.equal(signatures.size,50,type);
    }
  } finally {Math.random=original;}
  assert.equal(rooms,5000);assert.equal(props,18100);
});

test('lacustre : programmes nautique, pêche, recherche et camping conservent leurs usages propres',()=>{
  const plans=M.TYPES.map(type=>M.build(type,1));
  assert.equal(new Set(plans.map(p=>p.configuration.activity)).size,4);
  const names=plans.map(p=>p.buildings.flatMap(b=>b.rooms.map(r=>r.name)).join(' | '));
  assert.match(names[0],/stockage embarcations légères/);assert.match(names[0],/atelier réparation embarcations/);
  assert.match(names[1],/stockage réfrigéré prises/);assert.match(names[1],/chambre parentale/);
  assert.match(names[2],/contrôle échantillons/);assert.match(names[2],/observation limnologique/);
  assert.match(names[3],/consignes/);assert.match(names[3],/buanderie/);
  for (const p of plans) {
    assert.equal(p.shoreline.depthM,null);assert.equal(p.shoreline.swimming,false);assert.equal(p.shoreline.boatNavigation,false);
    assert.ok(p.unresolved.some(v=>v.includes('pontons')));assert.ok(p.unresolved.some(v=>v.includes('seed')));
    assert.ok(Object.values(p.operations).every(v=>v===0));assert.deepEqual(p.sourceIds,[]);
  }
});

test('lacustre : l’audit rejette les routes sur l’eau et les façades, portes ou berges obstruées',()=>{
  const mutations=[
    p=>p.network.nodes[0].y=p.shoreline.waterY+4,
    p=>{const b=p.buildings[0];b.y=p.shoreline.waterY-2;},
    p=>p.buildings[0].portals.splice(0,1),
    p=>p.buildings[0].entry.widthM=.4,
    p=>p.structures[0].y-=1,
    p=>p.outdoorAreas[0].y=p.shoreline.waterY,
    p=>p.network.edges.push({id:p.id+':false-shortcut',from:p.network.nodes[0].id,to:p.network.nodes.find(n=>n.id.endsWith('shore:stop')).id,widthM:4.5,mode:'service',level:0})
  ];
  for (const mutate of mutations) {const p=sample();mutate(p);assert.equal(M.audit(p).ok,false);}
});

test('lacustre : aucune déclaration d’eau praticable, service, stock ou production n’est acceptée',()=>{
  const mutations=[p=>p.playable=true,p=>p.sourceIds.push('RELEVE_NON_VERIFIE'),p=>p.operations.outputCreated=1,p=>p.operations.newCounter=0,
    p=>p.shoreline.connectedToSeed=true,p=>p.shoreline.walkableWater=true,p=>p.shoreline.boatNavigation=true,
    p=>p.shoreline.swimming=true,p=>p.shoreline.depthM=8,p=>p.structures[0].walkable=true];
  for (const field of ['structures','outdoorAreas','reservedAreas']) for (const [key,value] of [['lootAssigned',true],['utilityConnected',true],['amount',0],['resource','food']]) {
    mutations.push(p=>p[field][0][key]=value);
  }
  for (const mutate of mutations) {const p=sample();mutate(p);assert.equal(M.audit(p).ok,false);}
});

test('lacustre : un document malformé ou une identité hors plage est refusé',()=>{
  for (const type of [null,undefined,'T001','EXT-MONDE-T005','__proto__']) assert.throws(()=>M.build(type,1));
  for (const n of [0,51,-1,NaN,Infinity,1.5,'1']) assert.throws(()=>M.build(M.TYPES[0],n));
  for (const value of [null,undefined,{},[],{type:M.TYPES[0]}]) assert.equal(M.audit(value).ok,false);
});

test('lacustre : le cœur auteur embarquable ne dépend ni de Node ni des propriétaires de campagne',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../scripts/codex-lacustre2026.cjs'),'utf8');
  const core=source.split('// BEGIN AUTHOR CORE')[1].split('// END AUTHOR CORE')[0];
  assert.doesNotMatch(core,/\brequire\s*\(|\bprocess\.|\bfs\.|\bpath\.|\bDEADWALL\b|localStorage/);
  const context=vm.createContext({Reference});
  vm.runInContext('(function(Reference){'+core+';globalThis.Lacustre={TYPES,build,audit};})(Reference);',context);
  for (const type of M.TYPES) for (const n of [1,26,50]) {
    assert.deepEqual(clone(context.Lacustre.build(type,n)),clone(M.build(type,n)));
    assert.equal(context.Lacustre.audit(context.Lacustre.build(type,n)).ok,true);
  }
});
