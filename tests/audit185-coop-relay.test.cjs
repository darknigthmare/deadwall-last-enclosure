'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{once}=require('node:events'),{WebSocket}=require('ws');
async function fixture(t){
 const {createCoopRelay}=await import('../scripts/coop-server.mjs');const relay=createCoopRelay({port:0,host:'127.0.0.1'});await once(relay,'listening');const clients=[];
 t.after(async()=>{for(const c of clients)c.terminate();for(const s of relay.clients)s.terminate();await new Promise(r=>relay.close(r));});
 async function connect(){const c=new WebSocket('ws://127.0.0.1:'+relay.address().port);clients.push(c);await once(c,'open');const joined=next(c,m=>m.type==='joined');c.send(JSON.stringify({type:'join',room:'audit',name:'Survivant'}));await joined;return c;}
 return{connect,relay};
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
