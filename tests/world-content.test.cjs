'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const C=require('../src/core.js');
const Content=require('../src/world-content.js');
const {bootGame}=require('./helpers/browser.cjs');
const kinds=['ruinedHouse','ruinedShop','warehouseShell','guardBooth','ambulance','bus','utilityTruck','tanker','tent','container','waterTank','powerPylon','concreteBarricade','burntTree','rubble','streetLamp'];

function legacyWorld(World,seed) {
  const content=globalThis.DeadwallWorldContent;
  try { delete globalThis.DeadwallWorldContent; return new World(seed); }
  finally { globalThis.DeadwallWorldContent=content; }
}

test('quartiers : catalogue ordonné pour les seize cellules, ressources et coûts modestes',()=>{
  assert.deepEqual(Object.keys(C.SCENERY_DEFS),kinds);
  for(const [kind,def]of Object.entries(C.SCENERY_DEFS)){
    assert.ok(def.name&&C.RESOURCE_KEYS.includes(def.resource));
    assert.ok(def.radius>0&&def.renderSize>def.radius);
    assert.ok(def.amount>=35&&def.amount<=110||kind==='ambulance'&&def.amount===4);
    assert.equal(Object.hasOwn(C.BUILDINGS,kind),false,'un décor ne devient pas une structure');
  }
});

test('quartiers : génération pure déterministe, flux séparé et compositions variables',()=>{
  const first=Content.generate(17117),second=Content.generate(17117),other=Content.generate(903145);
  assert.deepEqual(first,second);assert.notDeepEqual(first.sites,other.sites);
  assert.notDeepEqual(first.props.map(prop=>prop.sceneryKind),other.props.map(prop=>prop.sceneryKind));
  first.sites[0].name='mutation';first.props[0].amount=999;assert.deepEqual(Content.generate(17117),second);
  const original=Math.random;Math.random=()=>{throw new Error('RNG global interdit');};
  try { assert.deepEqual(Content.generate(17117),second); } finally { Math.random=original; }
  for(const seed of [-1,2**32,1.5,NaN,Infinity,'17117',null])assert.throws(()=>Content.generate(seed),RangeError);
});

test('quartiers : six sites bornés, espacés et hors du centre ; huit props chacun, seize types toujours couverts',()=>{
  for(const seed of [0,1,17117,903145,0xffffffff,...Array.from({length:128},(_,i)=>(Math.imul(i+1,2654435761)>>>0))]){
    const {sites,props}=Content.generate(seed);assert.equal(sites.length,6);assert.equal(props.length,48);
    assert.equal(new Set(sites.map(site=>site.id)).size,6);assert.equal(new Set(sites.map(site=>site.name)).size,6);
    assert.deepEqual([...new Set(props.map(prop=>prop.sceneryKind))].sort(),[...kinds].sort());
    for(const site of sites){
      assert.ok(site.x>=256&&site.x<=3840&&site.y>=256&&site.y<=3840);
      assert.equal(props.filter(prop=>prop.siteId===site.id).length,8);
      for(const other of sites)if(other!==site)assert.ok(C.dist(site,other)>450);
    }
    for(const prop of props){
      assert.ok(prop.x>=256&&prop.x<=3840&&prop.y>=256&&prop.y<=3840);
      assert.ok(Math.hypot(prop.x-C.WORLD_SIZE/2,prop.y-C.WORLD_SIZE/2)-prop.radius>=650);
      const def=C.SCENERY_DEFS[prop.sceneryKind];assert.equal(prop.amount,def.amount);assert.equal(prop.type,def.resource);
    }
  }
});

test('quartiers runtime : IDs et réserves historiques strictement préservés ; ajout inférieur à 10 % sur 133 graines',()=>{
  const {game}=bootGame(),World=game.world.constructor;
  for(const seed of [0,1,17117,903145,0xffffffff,...Array.from({length:128},(_,i)=>(Math.imul(i+1,2654435761)>>>0))]){
    const base=legacyWorld(World,seed),world=new World(seed),extra=world.nodes.slice(base.nodes.length);
    assert.deepEqual(world.nodes.slice(0,base.nodes.length),base.nodes);
    assert.deepEqual(base.sites,[]);assert.equal(extra.length,48);assert.equal(world.sites.length,6);
    assert.deepEqual(extra.map(node=>node.id),Array.from({length:48},(_,i)=>base.nodeId+i));
    assert.equal(new Set(world.nodes.map(node=>node.id)).size,world.nodes.length);
    assert.ok(extra.reduce((sum,node)=>sum+node.amount,0)<base.nodes.reduce((sum,node)=>sum+node.amount,0)*.1,'budget ressources de la graine '+seed);
    for(const node of extra){assert.equal(node.maxAmount,node.amount);assert.equal(node.depleted,false);assert.equal(world.solidForFriendly(node.x,node.y),null);}
    assert.ok(world.occupancy.every(value=>value===0),'aucune collision de structure ajoutée');
  }
});

test('quartiers runtime : extraction partielle, IDs et cible de collecte survivent à save/load',()=>{
  const {game}=bootGame();game.startNew('standard','17117');
  const node=game.world.nodes.find(node=>node.sceneryKind==='ambulance'),worker=game.units[0],originalMaximum=node.maxAmount;
  assert.equal(node.harvest(1.5),1.5);
  worker.x=node.x;worker.y=node.y;worker.carry=1.5;worker.carryType='medicine';worker.state='gather';worker.targetNode=node.id;
  const sites=structuredClone(game.world.sites),randomState=game.random.state;
  assert.equal(game.save(false),true);assert.equal(game.load(),true);
  const restored=game.world.nodes.find(candidate=>candidate.id===node.id),restoredWorker=game.units.find(unit=>unit.id===worker.id);
  assert.equal(restored.sceneryKind,'ambulance');assert.equal(restored.amount,2.5);assert.equal(restored.maxAmount,originalMaximum);
  assert.deepEqual(game.world.sites,sites);assert.equal(game.random.state,randomState);
  assert.equal(restoredWorker.targetNode,node.id);assert.equal(restoredWorker.carry,1.5);assert.equal(restoredWorker.carryType,'medicine');assert.equal(restoredWorker.state,'gather');
  restored.harvest(999);assert.equal(game.save(false),true);assert.equal(game.load(),true);
  assert.equal(game.world.nodes.find(candidate=>candidate.id===node.id).amount,0);
});

test('quartiers runtime : ancienne sauvegarde conserve les gisements et ses bâtiments effacent les nouveaux décors superposés',()=>{
  const {game}=bootGame(),content=globalThis.DeadwallWorldContent;
  try { delete globalThis.DeadwallWorldContent;game.startNew('standard','17117'); }
  finally { globalThis.DeadwallWorldContent=content; }
  const historical=game.world.nodes[0];historical.harvest(9);
  const decor=Content.generate(17117).props[0],Building=game.core().constructor;
  const house=new Building(game.nextId++,'house',Math.floor(decor.x/C.TILE)-1,Math.floor(decor.y/C.TILE)-1,0,1);
  game.world.add(house);const legacy=game.serialize();assert.equal(legacy.nodes.length,game.world.nodes.length);
  game.restoreSave(legacy);
  assert.equal(game.world.nodes.find(node=>node.id===historical.id).amount,historical.amount);
  const overlapping=game.world.nodes.filter(node=>node.sceneryKind&&node.x+node.radius>house.left-6&&node.x-node.radius<house.right+6&&node.y+node.radius>house.top-6&&node.y-node.radius<house.bottom+6);
  assert.ok(overlapping.length>0);assert.ok(overlapping.every(node=>node.depleted&&node.amount===0));
  assert.equal(game.world.buildings.get(house.id).type,'house');
});

test('quartiers UMD : le module navigateur ne dépend ni du DOM ni du stockage',()=>{
  const sandbox={DeadwallCore:C};vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/world-content.js'),'utf8'),sandbox);
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.DeadwallWorldContent.generate(17117))),Content.generate(17117));
});
