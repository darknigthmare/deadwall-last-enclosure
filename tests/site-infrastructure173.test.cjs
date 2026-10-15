'use strict';const test=require('node:test'),assert=require('node:assert/strict');
const I=require('../src/site-infrastructure173.js'),N=require('../src/codex-native173.js'),P=require('../src/power-network173.js'),T=require('../src/transit-network173.js');
test('173 circuits: each actual native room has one fixture, explicit vertical feeds and zero initial fuel',()=>{
 const m=N.build('DW-0501',42),e=I.electrical(m),s=P.initial(e.network);assert.equal(e.fixtures.length,m.summary.indoor);assert.equal(s.fuel.generator,0);assert.ok(Object.values(s.switches).every(v=>v===false));
 assert.equal(new Set(e.fixtures.map(f=>f.room)).size,e.fixtures.length);for(const f of e.fixtures)assert.ok(m.floors.find(x=>x.z===f.z).rooms.some(r=>r.id===f.room&&f.x>r.x&&f.x<r.x+r.w));
 assert.ok(e.network.edges.filter(e=>e.id.startsWith('riser:')&&e.to!=='breaker:0').every(e=>e.riser));
});
test('173 circuits: fuel transfer, per-floor breaker, pause and reload conserve every value',()=>{
 const m=N.build('DW-0501',42),e=I.electrical(m),n=e.network;let s=P.initial(n),bag={fuel:3,wood:4};const moved=P.transferFuel(n,s,bag,'generator',1);s=moved.state;bag=moved.inventory;
 for(const x of n.nodes)if(x.kind!=='junction')s=P.switchNode(n,s,x.id,true);
 const old=s.fuel.generator,result=P.step(n,s,10);assert.ok(result.energyWh>0&&result.state.fuel.generator<old);assert.equal(s.fuel.generator,old);assert.equal(bag.fuel,2);
 const snapshot=I.checkpoint(m,result.state,bag);assert.deepEqual(I.restore(m,JSON.parse(JSON.stringify(snapshot))),snapshot);assert.deepEqual(P.step(n,result.state,10,{paused:true}).state,result.state);
 const off=P.switchNode(n,result.state,'breaker:1',false),r=P.step(n,off,1);assert.ok(e.fixtures.filter(f=>f.z===1).every(f=>!r.loads[f.id].powered));
 assert.throws(()=>I.restore(N.build('DW-0501',43),snapshot));assert.throws(()=>P.normalize({...n,topology:n.topology+'x'},s));
});
test('173 transit: continuous movement follows real polylines and returns on the same geometry',()=>{
 const n=T.tunnel();let s=I.beginTransit(n,'west','vehicle',2.2);const a=I.advance(n,s,'east',10,10);assert.equal(a.moved,100);assert.ok(a.position.x>-180&&a.position.x<0);assert.ok(a.position.level<=0);s=a.state;
 for(let i=0;i<5;i++)s=I.advance(n,s,'east',10,10).state;assert.equal(s.node,'east');assert.equal(s.edge,null);const back=I.advance(n,s,'west',60,10);assert.ok(back.arrived);assert.equal(back.position.x,-180);
});
test('173 transit: closures halt in-place; width, mode and topology are validated',()=>{
 const n=T.tunnel(),a=I.advance(n,I.beginTransit(n,'west','vehicle',2),'east',1,10),stop=I.advance(n,a.state,'east',10,10,['descent']);assert.equal(stop.moved,0);assert.deepEqual(stop.state,a.state);
 const tooWide=I.advance(n,I.beginTransit(n,'west','vehicle',10),'east',10,10);assert.equal(tooWide.moved,0);assert.equal(tooWide.reason,'no-compatible-route');
 assert.throws(()=>I.transitState(n,{...a.state,distance:-1}));assert.throws(()=>I.transitState(n,{...a.state,topology:'other'}));assert.throws(()=>I.advance(n,a.state,'east',100,10));
});
test('173 interchange and port: crossing is not a junction and land is distinct from navigable water',()=>{
 const n=T.interchange(),closed=n.edges.filter(e=>e.kind==='ramp').map(e=>e.id);assert.equal(I.advance(n,I.beginTransit(n,'west','vehicle',2.2),'south',60,14,closed).moved,0);
 assert.ok(I.advance(n,I.beginTransit(n,'west','vehicle',2.2),'east',60,14,closed).arrived);
 const p=T.port({a:[0,0],b:[300,0],waterSide:'left'}).graph;assert.ok(I.advance(p,I.beginTransit(p,'waterWest','boat',2),'waterEast',60,4).arrived);
 assert.equal(I.advance(p,I.beginTransit(p,'gate','foot'),'waterEast',60,4).moved,0);
 const malformed={id:'bad',nodes:[{id:'a',x:0,y:0,level:0},{id:'b',x:1,y:0,level:0}],edges:[{id:'r',from:'a',to:'b',kind:'road',modes:['boat']}]};assert.throws(()=>T.compile(malformed));
});
