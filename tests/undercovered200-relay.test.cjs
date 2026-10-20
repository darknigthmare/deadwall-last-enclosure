'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{once}=require('node:events'),{WebSocket}=require('ws');
const scope=(extra={})=>({seed:17117,generation:10,detail:13,ecology:1,hydrology:1,landscape:'balanced',region:true,z:0,inside:null,...extra});
function next(c,predicate){return new Promise((resolve,reject)=>{const t=setTimeout(()=>{c.off('message',read);reject(Error('No expected relay reply'));},2500);function read(d){const m=JSON.parse(String(d));if(predicate(m)){clearTimeout(t);c.off('message',read);resolve(m);}}c.on('message',read);});}
async function setup(t){const{createCoopRelay}=await import('../scripts/coop-server.mjs');const r=createCoopRelay({port:0,host:'127.0.0.1'});await once(r,'listening');const sockets=[];t.after(async()=>{for(const c of sockets)c.terminate();for(const c of r.clients)c.terminate();await new Promise(a=>r.close(a));});
 async function join(c,space){const q=next(c,m=>m.type==='joined');c.send(JSON.stringify({type:'join',room:'audit',name:'Survivant',...(space?{protocol:200,space}:{})}));return q;}
 async function connect(space){const c=new WebSocket('ws://127.0.0.1:'+r.address().port);sockets.push(c);await once(c,'open');c.messages=[];c.on('message',d=>c.messages.push(JSON.parse(String(d))));await join(c,space);return c;}
 return{connect,join};}
const ping=(c,space,x=1)=>c.send(JSON.stringify({type:'ping',room:'audit',x,y:2,...(space?{space}:{})}));
test('200 real relay isolates worlds, floors and legacy clients while forwarding compatible presence',async t=>{
 const f=await setup(t),a=await f.connect(scope()),b=await f.connect(scope()),foreign=await f.connect(scope({seed:7})),legacy=await f.connect();
 const incoming=next(b,m=>m.type==='ping');ping(a,scope());assert.equal((await incoming).space.seed,17117);
 // Join replies on each independent stream are barriers for prior server broadcasts.
 await f.join(foreign,scope({seed:7}));await f.join(legacy);assert.equal(foreign.messages.some(m=>m.type==='ping'),false);assert.equal(legacy.messages.some(m=>m.type==='ping'),false);
 const leave=next(a,m=>m.type==='leave');await f.join(b,scope({z:1}));await leave;
 const again=next(a,m=>m.type==='joined');a.send(JSON.stringify({type:'join',room:'audit',protocol:200,space:scope()}));await again;ping(a,scope(),3);await f.join(b,scope({z:1}));assert.equal(b.messages.filter(m=>m.type==='ping').length,1);
});
test('200 old or forged envelopes cannot cross the registered namespace',async t=>{
 const f=await setup(t),a=await f.connect(scope()),b=await f.connect(scope());
 ping(a,null);ping(a,scope({seed:3}));a.send(JSON.stringify({type:'state',room:'audit',space:scope(),state:{active:true,x:1,y:2,z:1}}));
 const expected=next(b,m=>m.type==='ping');ping(a,scope(),99);await expected;assert.deepEqual(b.messages.filter(m=>m.type==='ping').map(m=>m.x),[99]);assert.equal(b.messages.some(m=>m.type==='peer'),false);
});
test('200 invalid rejoin retains original membership instead of silently downgrading',async t=>{
 const f=await setup(t),a=await f.connect(scope()),b=await f.connect(scope());a.send(JSON.stringify({type:'join',room:'audit',protocol:200,space:{...scope(),seed:null}}));const incoming=next(b,m=>m.type==='ping');ping(a,scope());assert.equal((await incoming).space.seed,17117);
});
