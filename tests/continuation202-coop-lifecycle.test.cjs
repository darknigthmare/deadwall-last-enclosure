'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Controllable wall clock, not simulation time: admission must also expire in menus.
function fixture({timers = true} = {}) {
  let now = 1000, serial = 0;
  const scheduled = new Map(), allCallbacks = new Map();
  const scope = {seed:17117,generation:10,detail:13,ecology:1,hydrology:1,landscape:'balanced',region:true,z:0,inside:null};
  class Socket {
    static instances = [];
    constructor() { this.readyState=0;this.bufferedAmount=0;this.handlers={};this.sent=[];this.closed=0;Socket.instances.push(this); }
    addEventListener(k,f) { this.handlers[k]=f; }
    send(text) { this.sent.push(JSON.parse(text)); }
    close() { this.closed++;this.readyState=3; }
    emit(k,data) { if(k==='open')this.readyState=1;if(k==='close')this.readyState=3;this.handlers[k]?.({data}); }
  }
  const game = {world:{seed:17117},state:'playing',paused:false,resources:{ammo:17},update:()=>7,
    frontier:{active:()=>scope.region,position:()=>({active:scope.region,x:12,y:18,a:0,z:scope.z,inside:scope.inside,generation:scope.generation,detailVersion:scope.detail,ecologyVersion:scope.ecology,hydrologyVersion:scope.hydrology,landscape189:scope.landscape})}};
  const context = {WebSocket:Socket,performance:{now:()=>now}};
  if(timers)Object.assign(context,{setTimeout(fn,ms){const id=++serial;scheduled.set(id,{fn,at:now+ms});allCallbacks.set(id,fn);return id;},clearTimeout(id){scheduled.delete(id);}});
  vm.runInNewContext(fs.readFileSync('src/coop.js','utf8'),context);
  const api=context.DeadwallCoop.install(game);
  api.connect('ws://relay','audit','Alice');
  const socket=Socket.instances[0];socket.emit('open');
  const receive=(m,s=socket)=>s.emit('message',JSON.stringify(m));
  const ack=(s=socket)=>receive({type:'joined',protocol:200,id:'self',space:{...scope}},s);
  function advance(ms) {
    now+=ms;
    for(const [id,entry] of [...scheduled])if(entry.at<=now&&scheduled.has(id)){scheduled.delete(id);entry.fn();}
  }
  return {api,game,scope,socket,Socket,receive,ack,advance,scheduled,allCallbacks,
    elapse:ms=>now+=ms,deadline:()=>context.DeadwallCoop.LIMITS.joinMs??10000};
}
function populate(f) {
  f.ack();f.receive({type:'peer',id:'friend',space:{...f.scope},state:{active:true,x:2,y:3,z:0}});
  f.receive({type:'ping',space:{...f.scope},x:2,y:3});
}
test('202 closed transport is never advertised as a compatible presence',()=>{
  const f=fixture();populate(f);assert.equal(f.api.overview().compatible,true);
  f.socket.emit('close');const state=f.api.overview();
  assert.equal(state.connected,false);assert.equal(state.compatible,false);
  assert.equal(state.peers.length,0);assert.equal(state.pings.length,0);assert.equal(f.scheduled.size,0);
});
test('202 a silent open relay expires during a pause without a simulation step',()=>{
  const f=fixture();f.game.paused=true;f.advance(f.deadline()-1);assert.equal(f.api.overview().connected,true);
  f.advance(1);assert.equal(f.api.overview().connected,false);assert.equal(f.api.overview().compatible,false);
  assert.match(f.api.overview().notice,/délai|confirmation/i);assert.equal(f.socket.closed,1);
  assert.deepEqual(f.game.resources,{ammo:17});assert.equal(f.scheduled.size,0);
});
test('202 acknowledgement just before its deadline cancels expiration',()=>{
  const f=fixture();f.advance(f.deadline()-1);f.ack();assert.equal(f.scheduled.size,0);
  f.advance(f.deadline()*2);assert.equal(f.api.overview().compatible,true);assert.equal(f.socket.closed,0);
});
test('202 an acknowledgement after its deadline cannot revive an unverified relay',()=>{
  const f=fixture();f.elapse(f.deadline()+1);f.ack();
  assert.equal(f.api.overview().compatible,false);assert.equal(f.api.overview().connected,false);
});
test('202 a cleared timer callback cannot close an already verified session',()=>{
  const f=fixture(),callbacks=[...f.allCallbacks.values()];assert.equal(callbacks.length,1);f.ack();
  callbacks[0]();assert.equal(f.api.overview().compatible,true);assert.equal(f.socket.closed,0);
});
test('202 callbacks and close events from an old socket cannot invalidate its replacement',()=>{
  const f=fixture(),oldCallbacks=[...f.allCallbacks.values()];
  f.api.connect('ws://replacement','new-room','Next');const replacement=f.Socket.instances[1];replacement.emit('open');f.ack(replacement);
  for(const callback of oldCallbacks)callback();f.socket.emit('close');
  assert.equal(f.api.overview().compatible,true);assert.equal(f.api.overview().room,'new-room');assert.equal(replacement.closed,0);
});
test('202 map change under backpressure then return to the original map rejoins instead of getting stuck',()=>{
  const f=fixture();populate(f);const joins=f.socket.sent.filter(m=>m.type==='join').length;
  f.scope.landscape='large';f.socket.bufferedAmount=1e7;assert.equal(f.api.ping(),false);
  f.scope.landscape='balanced';f.socket.bufferedAmount=0;assert.equal(f.api.ping(),false);
  assert.equal(f.socket.sent.filter(m=>m.type==='join').length,joins+1);
  f.ack();assert.equal(f.api.ping(),true);assert.equal(f.api.overview().peers.length,0);
});
test('202 stale admission deadlines do not interrupt a newer scope on the same socket',()=>{
  const f=fixture(),old=[...f.allCallbacks.values()][0];assert.equal(typeof old,'function');
  f.scope.z=1;assert.equal(f.api.ping(),false);f.ack();old();
  assert.equal(f.api.overview().compatible,true);assert.equal(f.socket.closed,0);
});
test('202 malformed and wrong-map replies cannot renew an admission deadline',()=>{
  const f=fixture();f.advance(f.deadline()-1);
  f.receive({type:'joined',protocol:200,space:{...f.scope,seed:9}});
  f.receive({type:'joined',id:'legacy'});f.socket.emit('message','{broken');
  f.advance(1);assert.equal(f.api.overview().connected,false);
});
test('202 reconnect starts a fresh bounded attempt, not automatic retry spam',()=>{
  const f=fixture();f.advance(f.deadline());assert.equal(f.Socket.instances.length,1);
  f.api.connect('ws://relay','audit','Alice');const next=f.Socket.instances[1];next.emit('open');
  f.advance(f.deadline()-1);f.ack(next);f.advance(1);assert.equal(f.api.overview().compatible,true);
});
test('202 manual disconnect removes admission timers and presentation state',()=>{
  const f=fixture();f.api.disconnect();assert.equal(f.scheduled.size,0);f.advance(f.deadline()*2);
  assert.equal(f.api.overview().compatible,false);assert.equal(f.api.overview().notice,'Coop déconnectée.');
});
test('202 timerless embedders expire on update and never use simulation delta as wall time',()=>{
  const f=fixture({timers:false});f.api.update(100);assert.equal(f.api.overview().connected,true);
  f.elapse(f.deadline()+1);f.api.update(0);assert.equal(f.api.overview().connected,false);
});
test('202 read-only inspection neither sends packets nor changes persisted owners',()=>{
  const f=fixture();populate(f);const count=f.socket.sent.length,resources=JSON.stringify(f.game.resources);
  for(let i=0;i<100;i++)f.api.overview();assert.equal(f.socket.sent.length,count);assert.equal(JSON.stringify(f.game.resources),resources);
});

test('202 an early rounded timer is rescheduled until the admission deadline',()=>{
  const f=fixture(),[id,entry]=[...f.scheduled][0];
  f.game.paused=true;f.elapse(f.deadline()-.4);f.scheduled.delete(id);entry.fn();
  assert.equal(f.api.overview().connected,true);assert.equal(f.scheduled.size,1);
  f.advance(1);assert.equal(f.api.overview().connected,false);assert.equal(f.scheduled.size,0);
});
