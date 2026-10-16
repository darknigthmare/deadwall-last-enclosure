'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{once}=require('node:events'),{WebSocket}=require('ws');
async function fixture(t, options={}){
 const {createCoopRelay}=await import('../scripts/coop-server.mjs');const relay=createCoopRelay({port:0,host:'127.0.0.1',...options});await once(relay,'listening');const clients=[];
 t.after(async()=>{for(const c of clients)c.terminate();for(const s of relay.clients)s.terminate();await new Promise(r=>relay.close(r));});
 async function raw(){const c=new WebSocket('ws://127.0.0.1:'+relay.address().port);clients.push(c);await once(c,'open');return c;}
 async function connect(){const c=await raw(),joined=next(c,m=>m.type==='joined');c.send(JSON.stringify({type:'join',room:'audit',name:'Survivant'}));await joined;return c;}
 return{connect,raw,relay};
}
function next(c,predicate){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{c.off('message',read);reject(Error('Relay response absent'));},2000);function read(data){const m=JSON.parse(String(data));if(predicate(m)){clearTimeout(timer);c.off('message',read);resolve(m);}}c.on('message',read);});}
async function ping(from,to){const received=next(to,m=>m.type==='ping');from.send(JSON.stringify({type:'ping',room:'audit',x:10,y:20}));const m=await received;assert.equal(m.x,10);assert.equal(m.y,20);}
test('185 oversized relay payload closes the offender, not other clients',async t=>{
 const {connect}=await fixture(t),a=await connect(),bad=await connect(),b=await connect();const closed=once(bad,'close');bad.send('x'.repeat(32769));const [code]=await closed;
 assert.equal(code,1009);await ping(a,b);assert.equal(a.readyState,1);assert.equal(b.readyState,1);
});
test('185 relay flood is rate-limited while ordinary presence remains usable',async t=>{
 const {connect}=await fixture(t),a=await connect(),bad=await connect(),b=await connect();const closed=once(bad,'close');for(let i=0;i<100;i++)bad.send('{}');const [code]=await closed;
 assert.equal(code,1008);await ping(a,b);
});
test('185 relay forwards only validated presence fields and never an arbitrary nested state',async t=>{
 const {connect}=await fixture(t),a=await connect(),b=await connect();const states=[];b.on('message',data=>{const m=JSON.parse(String(data));if(m.type==='peer')states.push(m.state);});
 a.send(JSON.stringify({type:'state',room:'audit',state:{x:1,y:2,z:null}}));
 const received=next(b,m=>m.type==='peer');a.send(JSON.stringify({type:'state',room:'audit',state:{x:1,y:2,z:0,a:0,active:true,posture:'crouch',inventory:{ammo:10000},secret:'untrusted'}}));
 const m=await received;assert.deepEqual(m.state,{active:true,x:1,y:2,z:0,a:0,posture:'crouch'});assert.equal(states.length,1);
});

async function closedWithin(socket, milliseconds=2000){
 return once(socket,'close',{signal:AbortSignal.timeout(milliseconds)});
}
test('186 a silent unjoined socket expires while joined peers remain usable',async t=>{
 const {connect,raw,relay}=await fixture(t,{joinTimeoutMs:300});
 const a=await connect(),b=await connect(),idle=await raw();await closedWithin(idle);
 assert.equal(idle.readyState,WebSocket.CLOSED);await ping(a,b);
 assert.equal(a.readyState,WebSocket.OPEN);assert.equal(b.readyState,WebSocket.OPEN);
 assert.equal(relay.clients.size,2);const later=await connect();await ping(a,later);
});
test('186 invalid join attempts never extend the admission deadline',async t=>{
 const {raw}=await fixture(t,{joinTimeoutMs:250}),idle=await raw();
 const interval=setInterval(()=>{if(idle.readyState===WebSocket.OPEN)idle.send(JSON.stringify({type:'join',room:'invalid room'}));},40);
 t.after(()=>clearInterval(interval));await closedWithin(idle);assert.equal(idle.readyState,WebSocket.CLOSED);
});
test('186 the actual 128-slot relay recovers its capacity after unjoined sockets expire',async t=>{
 const {raw,connect,relay}=await fixture(t,{joinTimeoutMs:1500});
 const idle=await Promise.all(Array.from({length:128},()=>raw()));assert.equal(relay.clients.size,128);
 const released=[...idle,...relay.clients].map(c=>closedWithin(c,4000));await Promise.all(released);assert.equal(relay.clients.size,0);
 const a=await connect(),b=await connect();await ping(a,b);
});
test('186 admission timeout configuration fails closed before opening a listening server',async()=>{
 const {createCoopRelay}=await import('../scripts/coop-server.mjs');
 for(const value of [0,-1,NaN,Infinity,1.5,'300',30001])assert.throws(()=>createCoopRelay({port:0,joinTimeoutMs:value}),/joinTimeoutMs/);
});
