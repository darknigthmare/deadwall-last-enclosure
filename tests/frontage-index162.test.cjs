'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../src/frontage174.js');

function fixture({oblique=false,foreign=false}={}){
 const p={id:'P0001',x:200,y:140,w:12,h:10,a:0,parking:[],outdoor:[],reserve:{l:185,r:215,t:135,b:155},drive:{a:{x:200,y:100},b:{x:200,y:130},width:4}};
 const roads=[{id:'main',a:{x:100,y:100},b:{x:300,y:100},width:6},
  {id:'blocked',a:{x:203,y:100},b:{x:203,y:124},width:4},
  oblique?{id:'right',a:{x:240,y:0},b:{x:280,y:200},width:6}:{id:'right',a:{x:260,y:30},b:{x:260,y:230},width:6}];
 if(foreign)roads.push({id:'foreign',a:{x:256,y:110},b:{x:256,y:140},width:4});
 return{p,roads};
}
const clear=result=>result.roadId==='right';

test('162 frontage index includes a permitted lateral alternative across a spatial-bin boundary',()=>{
 const {p,roads}=fixture(),before=JSON.stringify({p,roads});
 assert.equal(F.resolve(p,roads).reason,'foreign-road-corridor');
 const expected=F.alternative(p,roads,[],clear);
 assert.equal(expected?.roadId,'right');assert.equal(expected?.alternative175,true);
 const index=F.createIndex(roads,[p],{clearAlternative:clear});
 assert.deepEqual(index.forSite(p),expected);
 assert.equal(index.forSite(p),index.forSite(p));
 assert.equal(index.surface(p),index.forSite(p).surface);
 assert.equal(JSON.stringify({p,roads}),before);
});

test('162 frontage alternatives cannot cross an intervening route omitted by the historical-drive bins',()=>{
 const {p,roads}=fixture({oblique:true,foreign:true}),before=JSON.stringify({p,roads});
 // The long oblique candidate intersects the old query rectangle, but its
 // nearest join is outside it. The intervening road must still participate.
 assert.equal(F.alternative(p,roads,[],clear),null);
 const actual=F.createIndex(roads,[p],{clearAlternative:clear}).forSite(p);
 assert.equal(actual.ok,false);assert.equal(actual.reason,'foreign-road-corridor');
 assert.equal(JSON.stringify({p,roads}),before);
});

test('162 alternative queries include a foreign capsule whose centreline lies beyond the allowed join radius',()=>{
 const {p}=fixture();p.x=177.9;p.drive={a:{x:177.9,y:100},b:{x:177.9,y:130},width:4};
 const roads=[{id:'main',a:{x:77.9,y:100},b:{x:277.9,y:100},width:6},
  {id:'blocked',a:{x:180.9,y:100},b:{x:180.9,y:124},width:4},
  {id:'right',a:{x:255.9,y:30},b:{x:255.9,y:230},width:2},
  {id:'outside',a:{x:256.2,y:125},b:{x:256.2,y:140},width:3}];
 // The permitted right-hand join ends in bin0. The foreign centreline is
 // beyond the 78m join radius in bin1, but its capsule clips the paved end.
 assert.equal(F.alternative(p,roads,[],clear),null);
 assert.equal(F.createIndex(roads,[p],{clearAlternative:clear}).forSite(p).ok,false);
});

test('162 indexed alternatives agree with an exhaustive road oracle across translated and rotated bins',()=>{
 for(const variant of [{},{oblique:true},{oblique:true,foreign:true}]){
  const source=fixture(variant);
  for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI])for(const offset of [0,.001,256]){
   const transform=q=>({x:Math.cos(angle)*q.x-Math.sin(angle)*q.y+offset,y:Math.sin(angle)*q.x+Math.cos(angle)*q.y+offset});
   const p={...source.p,drive:{...source.p.drive,a:transform(source.p.drive.a),b:transform(source.p.drive.b)}},roads=source.roads.map(r=>({...r,a:transform(r.a),b:transform(r.b)}));
   const initial=F.resolve(p,roads);assert.equal(initial.ok,false);
   const expected=F.alternative(p,roads,[],clear)||initial;
   const forward=F.createIndex(roads,[p],{clearAlternative:clear}).forSite(p),reverse=F.createIndex([...roads].reverse(),[p],{clearAlternative:clear}).forSite(p);
   assert.deepEqual(forward,expected,JSON.stringify({variant,angle,offset}));assert.deepEqual(reverse,expected);
  }
 }
});

test('162 accepted frontage remains cached without invoking alternative physical checks',()=>{
 const {p,roads}=fixture(),base=[roads[0]],expected=F.resolve(p,base);
 assert.equal(expected.ok,true);
 const index=F.createIndex(base,[p],{clearAlternative(){throw Error('Accepted access must not search alternatives');}});
 assert.deepEqual(index.forSite(p),expected);assert.equal(index.forSite(p),index.forSite(p));
});
