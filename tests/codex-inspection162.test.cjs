'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/codex-coverage167.js'),P=require('../src/codex-plan165.js'),X=require('../src/codex-context160.js');

test('162 inspection: G10 source metrics use the physical context while keeping partial authored references explicit',()=>{
 for(const id of ['DW-0266','DW-0268','DW-0294','DW-0300','DW-1204']){
  const c=X.get(id),s=C.source(id),p=P.inspect(id,42,0,10);
  assert.equal(s.recipeAvailable,true);assert.equal(s.contextCompatible,true);assert.equal(s.generation,10);
  assert.deepEqual([s.model.w,s.model.h],[c.w,c.h]);assert.deepEqual(s.model.levels,c.levels);
  assert.deepEqual([p.p.w,p.p.h],[c.w,c.h]);assert.equal(p.p.programme160,id);
  assert.equal(C.compare(p).scope,'isolated-recipe-not-live-world');
  assert.equal(p.summary.solidDetails,0,'old G10 revisions remain unchanged');
 }
 const viaduct=P.inspect('DW-0266',42,0,10);
 assert.equal(viaduct.p.w,100);assert.equal(viaduct.implementation160.fullyImplementedReference,false);
 assert.match(viaduct.implementation160.text,/fermées/);assert.ok(viaduct.implementation160.closedDomains.length);
});

test('162 dimensional evidence: wrong-sized surplus never satisfies an exact footprint minimum',()=>{
 const previous=globalThis.DeadwallCodex3000Runtime;
 const room={id:'r',name:'Réserve',kit:{id:'storage'},exterior:false,levels:[0],authoredProps:[
  {nom:'Rayonnage',asset:'shelf',quantite_par_espace:[2,3],gabarit_m:{longueur:1,largeur:.5,hauteur:2}}
 ]};
 globalThis.DeadwallCodex3000Runtime={get:()=>({id:'DW-0001',parent:'DW-0001',name:'Test',family:'habitat'}),describe:()=>({rooms:[room],access:[],gardenOptions:[],exteriorOptions:[]}),template:()=>({w:10,h:10,levels:[0],reference:{},adapted:false}),preset:()=>({}),enabled:()=>true};
 C.clear();try{
  const p={id:'DW-0001',supported:true,z:0,seed:42,p:{levels:[0],outdoor:[]},plan:{rooms:[{name:'Réserve',x:0,y:0,w:10,h:10}],objects:[
   {id:'a',kind:'shelf',x:1,y:1,w:1,h:.5},{id:'b',kind:'shelf',x:3,y:1,w:2,h:.5},{id:'c',kind:'shelf',x:5,y:1,w:2,h:.5}
  ]},details:{interior:[],outdoor:[]}};
  const out=C.compare(p),spec=out.rooms[0].props[0];
  assert.equal(spec.represented,3);assert.equal(spec.belowMinimum,0);assert.equal(spec.exactFootprintMatches,1);
  assert.equal(spec.belowExactFootprintMinimum,1);assert.equal(out.totals.furnitureBelowExactFootprintMinimum,1);
  assert.equal(out.totals.footprintMismatches,2,'two adapted objects are not two missing minimum objects');
  assert.deepEqual(spec.actualFootprints,[{w:1,h:.5,count:1},{w:2,h:.5,count:2}]);
 }finally{globalThis.DeadwallCodex3000Runtime=previous;C.clear();}
});
