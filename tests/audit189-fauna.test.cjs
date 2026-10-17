'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core.js'),F=require('../src/wildlife189.js'),R=C.Landscape189Rules;
const water=(kind='land',salinity='fresh')=>({water:kind!=='land',kind,salinity,depth:2,distanceToWater:kind==='land'?100:0,distanceToShore:10,movementBlocked:kind!=='land',crossing:null});
test('189 all sixteen biomes have distinct explicit guilds and the full 26-species roster',()=>{
 const ids=[...C.BiomeRules135.defs,...C.EcologyRules164.defs].map(d=>d.id);assert.deepEqual(Object.keys(R.guilds).sort(),ids.sort());assert.equal(Object.keys(F.species()).length,26);
 for(const guild of Object.values(R.guilds)){assert.ok(Object.keys(guild).length>=6);for(const[id,n]of Object.entries(guild)){assert.ok(F.species()[id]);assert.ok(n>0);}}
 for(const d of Object.values(F.species())){assert.ok(d.health<=80&&d.health>0);assert.ok(d.length>0&&d.width>0&&d.radius>0);assert.ok(d.group>=1&&d.group<=4);}
 assert.ok(F.pool({id:'brownfield'},water()).crow);assert.equal(F.pool({id:'rockyHighland'},water()).pigeon,undefined);
});
test('189 freshwater fish, coastal fish and shore animals use real water and salinity',()=>{
 const s=F.species();assert.equal(F.habitat(s.trout,water('river')),true);assert.equal(F.habitat(s.trout,water('sea','salt')),false);assert.equal(F.habitat(s.trout,water()),false);
 assert.equal(F.habitat(s.carp,water('pond')),true);assert.equal(F.habitat(s.carp,water('stream')),false);assert.equal(F.habitat(s.mullet,water('sea','salt')),true);assert.equal(F.habitat(s.mullet,water('lake')),false);
 assert.equal(F.habitat(s.duck,water('lake')),true);assert.equal(F.habitat(s.duck,water('sea','salt')),false);assert.equal(F.habitat(s.duck,{...water(),distanceToWater:10}),true);
 for(const d of Object.values(s))assert.equal(F.habitat(d,{...water('river'),crossing:'bridge'}),false);
});
test('189 swimmer clearance never confuses transparent water with permission to enter solids',()=>{
 const q={x:100,y:100,radius:.1,profile:F.species().trout},w={landscape189:'balanced',size:1000,hydrology:{sample:()=>water('river')},wildlifeWaterClear:()=>true};assert.equal(F.clear(w,q),true);
 w.wildlifeWaterClear=()=>false;assert.equal(F.clear(w,q),false);w.wildlifeWaterClear=()=>true;w.hydrology.sample=(x)=>x>100?water():water('river');assert.equal(F.clear(w,q),false,'whole collision disc must remain in water');
});
test('189 non-land routes inspect intermediate dry land, salinity and bank reach',()=>{
 const s=F.species(),q={radius:s.trout.radius,profile:s.trout},a={x:99.5,y:100},b={x:100.5,y:100};
 const w={landscape189:'balanced',size:1000,wildlifeWaterClear:()=>true,wildlifeWaterLine:()=>true,hydrology:{crossings:[],sample:x=>{
  const dry=Math.abs(x-100)<=.1;return{...water('river'),water:!dry,movementBlocked:!dry,kind:dry?'land':'river',distanceToWater:dry?.1-Math.abs(x-100):0,distanceToShore:Math.abs(x-100)-.1};
 }}};
 assert.equal(F.clear(w,q,a.x,a.y),true);assert.equal(F.clear(w,q,b.x,b.y),true);assert.equal(F.line(w,q,a,b),false,'legal endpoints do not permit crossing dry ground');
 w.hydrology.sample=x=>water(Math.abs(x-100)<.1?'sea':'river',Math.abs(x-100)<.1?'salt':'fresh');
 assert.equal(F.clear(w,q,a.x,a.y),true);assert.equal(F.clear(w,q,b.x,b.y),true);assert.equal(F.line(w,q,a,b),false,'freshwater fish cannot cross a salt-water interval');
 const otter={radius:s.otter.radius,profile:s.otter},from={x:100,y:100},to={x:160,y:100};
 w.hydrology.sample=x=>({...water(),distanceToWater:10+30*Math.sin((x-100)/60*Math.PI)});
 assert.equal(F.clear(w,otter,from.x,from.y),true);assert.equal(F.clear(w,otter,to.x,to.y),true);assert.equal(F.line(w,otter,from,to),false,'amphibious animals keep a nearby bank throughout the route');
 w.hydrology.sample=()=>water('river');assert.equal(F.line(w,q,a,b),true);
 w.wildlifeWaterLine=()=>false;assert.equal(F.line(w,q,a,b),false,'solid obstacles remain authoritative');
 assert.equal(F.line(w,q,{x:NaN,y:100},b),false);
});
test('189 a sub-step route cannot clip the real corner of a bridge deck',()=>{
 const H=require('../src/hydrology165.js'),Geo=require('../src/geography135.js'),hydro=H.create({seed:0,size:C.GeographyRules135.size,home:Geo.home(0,9)}),river=hydro.features.find(f=>f.kind==='river'),p=river.points[80],next=river.points[81],x=(p.x+next.x)/2,y=(p.y+next.y)/2,angle=Math.atan2(next.y-p.y,next.x-p.x)+Math.PI/2;
 const h=hydro.withRoads([{id:'audit189-corner',a:{x:x-Math.cos(angle)*30,y:y-Math.sin(angle)*30},b:{x:x+Math.cos(angle)*30,y:y+Math.sin(angle)*30},width:6}]),bridge=h.crossings[0];assert.ok(bridge);
 const along=bridge.length/2,across=bridge.width/2-C.Hydrology165Rules.crossings.edgeClearance,at=(u,v)=>({x:bridge.x+u*Math.cos(bridge.a)-v*Math.sin(bridge.a),y:bridge.y+u*Math.sin(bridge.a)+v*Math.cos(bridge.a)}),a=at(along-.04,across+.01),b=at(along+.01,across-.04);
 const q={radius:F.species().crow.radius,profile:F.species().crow},w={landscape189:'balanced',size:hydro.size,hydrology:h,wildlifeWaterClear:()=>true,wildlifeWaterLine:()=>true};
 assert.ok(Math.hypot(b.x-a.x,b.y-a.y)<C.BiomePopulation165Rules.maxStep);
 assert.equal(F.clear(w,q,a.x,a.y),true);assert.equal(F.clear(w,q,b.x,b.y),true);assert.equal(h.sample((a.x+b.x)/2,(a.y+b.y)/2).crossing,bridge.id);
 assert.equal(F.line(w,q,a,b),false,'endpoint checks alone miss a tablier corner');
 assert.equal(F.line(w,q,at(along-.04,across+.02),at(along+.04,across+.02)),true,'a nearby route outside the deck stays legal');
});
test('189 terrestrial routes retain the movement owner without probing aquatic habitats',()=>{
 const q={radius:F.species().fox.radius,profile:F.species().fox},a={x:100,y:100},b={x:101,y:101};let calls=0;
 const w={movementLine(...args){calls++;assert.deepEqual(args,[a,b,0,null,null,q.radius]);return true;},hydrology:{sample(){throw Error('Terrestrial routes retain their existing owner');}}};
 assert.equal(F.line(w,q,a,b),true);assert.equal(calls,1);
});
test('189 rest/day/night rhythms do not ignore an alarm and use no random state',()=>{
 const s=F.species(),w={seed:42};assert.equal(F.awake(s.owl,.5),false);assert.equal(F.awake(s.owl,.02),true);assert.equal(F.awake(s.pigeon,.5),true);assert.equal(F.awake(s.pigeon,.02),false);
 assert.equal(F.speed(w,{id:'a',profile:s.owl,alarm:0},123,.5),0);assert.equal(F.speed(w,{id:'a',profile:s.owl,alarm:1},123,.5),s.owl.speed);
});
test('189 original silhouettes render all species without changing actors or context balance',()=>{
 globalThis.DeadwallCore=C;require('../src/wildlife-art165.js');const A=require('../src/wildlife-art189.js');let depth=0,draws=0;const ctx=new Proxy({save(){depth++;},restore(){depth--;}},{get(o,k){return k in o?o[k]:(...a)=>{assert.ok(a.every(v=>typeof v!=='number'||Number.isFinite(v)));draws++;};},set(o,k,v){o[k]=v;return true;}});
 for(const d of Object.values(F.species()))for(let variant=0;variant<4;variant++){const a={id:'A189_1_1_0',species:d.id,x:100,y:100,a:1,variant,hp:d.health,moving:true,stride165:1},before=JSON.stringify(a);assert.equal(A.draw(ctx,a),true);assert.equal(A.draw(ctx,a,{reducedMotion:true}),true);assert.equal(JSON.stringify(a),before);assert.equal(depth,0);}assert.ok(draws>1000);
});
