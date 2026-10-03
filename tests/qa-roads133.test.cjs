'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../src/exploration-125.js'),C=require('../src/core.js');
const{boot131}=require('./helpers/expansions131.cjs');
const legacy=require('./fixtures/terrain133-legacy132.json');
const positions=g=>g.world.nodes.map(n=>[n.id,n.x,n.y,n.amount]);

test('QA routes indépendante : 512 graines sans banc ni souche dans les rues et raccords de hameaux',()=>{
  for(let seed=0;seed<512;seed++){
    const p=E.createFeaturePlan(seed,4096,3),roads=[...p.roads,...p.settlements.flatMap(s=>[s.street,s.connector])];
    assert.equal(p.decor.length,70,'seed '+seed);
    for(const d of p.decor.filter(d=>['bench','stump','marker','grass'].includes(d.kind)))for(const r of roads)assert.equal(E.roadContains(r,d.x,d.y,d.size),false,seed+'/'+d.id);
    for(const d of p.decor.filter(d=>d.kind==='bench')){const box=p.solids.find(b=>b.prop===d.id);assert.ok(box);assert.equal(box.x,d.x-22);assert.equal(box.y,d.y-7);assert.equal(box.w,44);assert.equal(box.h,20);}
  }
});

test('QA routes indépendante : des murs sur gisements épuisés ne déplacent plus les réserves à la reprise',()=>{
  for(const seed of['0','1','4','9']){
    const{g}=boot131({seed});let count=0;
    for(const n of g.world.nodes.filter(n=>!n.sceneryKind&&!n.__exploration125Loot&&n.depleted)){
      const gx=Math.floor(n.x/32),gy=Math.floor(n.y/32);
      if(!g.world.placement(C.BUILDINGS.woodWall,gx,gy).valid)continue;
      g.world.add(new(g.core().constructor)(g.nextId++,'woodWall',gx,gy,0,1));
      if(++count===8)break;
    }
    assert.equal(count,8);g.refreshMetrics(true);
    const before=positions(g),save=g.serialize();g.restoreSave(save);
    assert.deepEqual(positions(g),before,'graines '+seed+' ; les ressources ne changent pas de lieu après construire');
    g.exploration125.syncPlan();assert.deepEqual(positions(g),before);
  }
});

test('QA routes indépendante : vraie sauvegarde 1.32 conserve son plan et chaque quantité',()=>{
  assert.equal(legacy.provenance.version,'1.32.0');assert.equal(legacy.provenance.sha256,'9a6b79a2f61331dadac40f109058ab74d3e20166ed0ee172a15e793d4cb65318');
  assert.equal(legacy.save.exploration125.layoutRevision,2);
  const{g}=boot131({seed:'4'});g.restoreSave(legacy.save);
  assert.equal(g.exploration125.layoutRevision,2);assert.deepEqual(g.exploration125.plan,legacy.plan);
  assert.deepEqual(g.serialize().nodes,legacy.save.nodes,'aucune réduction de densité sur la campagne historique');
  const oldById=new Map(legacy.nodes.map(n=>[n.id,n]));
  for(const n of g.world.nodes){const old=oldById.get(n.id);assert.ok(old);assert.equal(n.amount,old.amount);if(n.x!==old.x||n.y!==old.y)assert.equal(n.sceneryKind,'burntTree','seuls les troncs de décor sur route sont corrigés dans cette fixture');}
  const migrated=positions(g);g.restoreSave(g.serialize());assert.deepEqual(positions(g),migrated,'nettoyage des routes stable après migration');
});

test('QA routes indépendante : continuer l’ancien plan puis créer une partie reprend la variété sans héritage',()=>{
  const{g}=boot131();g.restoreSave(legacy.save);g.startNew('standard','4');
  assert.equal(g.exploration125.layoutRevision,3);assert.deepEqual(g.exploration125.plan,E.createFeaturePlan(4,4096,3));
  const first=positions(g);g.startNew('standard','9');assert.notDeepEqual(positions(g),first);g.startNew('standard','4');assert.deepEqual(positions(g),first);
});
