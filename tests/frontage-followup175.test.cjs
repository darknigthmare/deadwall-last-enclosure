'use strict';
const test=require('node:test'),assert=require('node:assert/strict');const F=require('../src/frontage174.js');
const road=(id,x,y,w=6)=>({id,a:{x:x-100,y},b:{x:x+100,y},width:w});
const p={id:'P0001',road:'main',x:0,y:40,w:12,h:10,a:0,parking:[],outdoor:[],reserve:{l:-15,r:15,t:15,b:55},drive:{a:{x:0,y:0},b:{x:0,y:30},width:4}};
test('175 rejected frontage searches local alternatives only with explicit physical validation',()=>{
 const roads=[road('main',0,0),{id:'side',a:{x:3,y:0},b:{x:3,y:24},width:4}],before=JSON.stringify([p,roads]);
 assert.equal(F.resolve(p,roads).ok,false);assert.equal(F.alternative(p,roads),null);assert.equal(F.alternative(p,roads,[],()=>false),null);
 const result=F.alternative(p,roads,[],()=>true);assert.ok(result?.ok);assert.equal(result.alternative175,true);assert.equal(result.surface.b.x,p.drive.b.x);assert.equal(JSON.stringify([p,roads]),before);
 assert.equal(F.groupConflicts(result,p).length,0);
});
test('175 accepted source access remains unchanged and options cannot open a controlled motorway',()=>{
 const roads=[road('main',0,0)],before=F.resolve(p,roads),index=F.createIndex(roads,[p],{clearAlternative(){throw Error('Unnecessary reroute');}});
 assert.deepEqual(index.forSite(p),before);assert.equal(index.surface(p),index.forSite(p).surface);
 assert.equal(F.alternative(p,[{...roads[0],roadClass:'motorway'}],[],()=>true),null);
});
test('175 alternate access is deterministic, respects obstacle groups and preserves end caps and levels',()=>{
 const roads=[road('main',0,0),{id:'side',a:{x:3,y:0},b:{x:3,y:24},width:4}];
 const a=F.alternative(p,roads,[],()=>true),b=F.alternative(p,[...roads].reverse(),[],()=>true);assert.deepEqual(a,b);
 const block={id:'P0002',reserve:{l:-100,r:100,t:-5,b:35}};assert.equal(F.alternative(p,roads,[block],()=>true),null);
 assert.equal(F.alternative(p,roads.map(r=>({...r,z:1})),[],()=>true),null);
});
