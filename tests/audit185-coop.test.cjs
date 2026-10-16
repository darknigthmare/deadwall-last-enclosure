'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function fixture(){
 let clock=1000,steps=0;
 class Socket {
  static instances=[];
  constructor(){this.readyState=0;this.bufferedAmount=0;this.listeners=new Map();this.sent=[];Socket.instances.push(this);}
  addEventListener(n,f){this.listeners.set(n,f);}
  emit(n,data){if(n==='open')this.readyState=1;this.listeners.get(n)?.({data});}
  send(data){if(this.fail)throw Error('transport failed');this.sent.push(JSON.parse(data));}
  close(){this.readyState=3;}
 }
 const context=vm.createContext({WebSocket:Socket,performance:{now:()=>clock}});vm.runInContext(fs.readFileSync('src/coop.js','utf8'),context);
 const game={state:'playing',paused:false,world:{seed:17117},resources:{ammo:17},update(){steps++;return 7;},frontier:{active:()=>true,overview:()=>({active:true,x:10,y:20,z:0,a:0})}};
 const api=context.DeadwallCoop.install(game);api.connect('ws://relay','audit','Audit');const socket=Socket.instances[0];
 const receive=message=>socket.emit('message',JSON.stringify(message));
 return{game,api,socket,receive,Socket,steps:()=>steps,tick:n=>clock+=n};
}
for(const phase of ['join','state','ping'])test('185 coop '+phase+' send failure does not escape into the game and closes only that connection',()=>{
 const f=fixture();if(phase!=='join')f.socket.emit('open');f.socket.fail=true;const before=JSON.stringify(f.game.resources);
 assert.doesNotThrow(()=>phase==='join'?f.socket.emit('open'):phase==='state'?f.game.update(.1):f.api.ping());
 assert.equal(f.api.overview().connected,false);assert.match(f.api.overview().notice,/inaccessible/);assert.equal(JSON.stringify(f.game.resources),before);
 assert.equal(f.game.update(.1),7);assert.ok(f.steps()>0);
});
test('185 saturated relay drops stale movement instead of adding to its outbound queue',()=>{
 const f=fixture();f.socket.emit('open');const n=f.socket.sent.length;f.socket.bufferedAmount=1e7;
 for(let i=0;i<100;i++)assert.equal(f.game.update(.1),7);
 assert.equal(f.api.ping(),false);assert.equal(f.socket.sent.length,n);
 f.socket.bufferedAmount=0;for(let i=0;i<3;i++)f.game.update(.1);assert.ok(f.socket.sent.length>n);assert.equal(f.api.ping(),true);
});
test('185 peer and ping floods are bounded, expire during pause and cannot mutate returned state',()=>{
 const f=fixture();f.socket.emit('open');f.game.paused=true;
 for(let i=0;i<1000;i++){f.receive({type:'peer',id:'peer'+i,name:'Allié',state:{active:true,x:i,y:1,z:0,a:0,extra:{}}});f.receive({type:'ping',x:i,y:2});}
 const state=f.api.overview();assert.ok(state.peers.length>0&&state.peers.length<=64);assert.ok(state.pings.length>0&&state.pings.length<=64);
 state.pings[0].x=-12345;state.peers[0].x=-12345;assert.ok(f.api.overview().pings.every(p=>p.x>=0));assert.ok(f.api.overview().peers.every(p=>p.x>=0));
 f.tick(9000);assert.equal(f.api.overview().peers.length,0);assert.equal(f.api.overview().pings.length,0);
 f.receive({type:'peer',id:'new',state:{x:1,y:2}});assert.equal(f.api.overview().peers.length,1);
});
test('185 invalid optional coordinates, IDs and oversized messages are rejected before peer allocation',()=>{
 const f=fixture();f.socket.emit('open');
 for(const state of [{x:1,y:2,z:null},{x:1,y:2,a:'0'},{x:1e100,y:1},{x:1,y:2,active:'yes'}])f.receive({type:'peer',id:'invalid',state});
 for(const id of [{},1,[],null])f.receive({type:'peer',id,state:{x:1,y:2}});
 f.receive({type:'peer',id:'huge',name:'x'.repeat(40000),state:{x:1,y:2}});assert.equal(f.api.overview().peers.length,0);
 f.receive({type:'peer',id:'valid',name:{object:'not a name'},state:{x:-10,y:0,z:0,a:0,active:true,extra:{untrusted:true}}});
 const p=f.api.overview().peers[0];assert.equal(p.x,-10);assert.equal(typeof p.name,'string');assert.equal(p.extra,undefined);
});
test('185 late failure from an old socket cannot close the replacement',()=>{
 const f=fixture();f.socket.emit('open');f.api.connect('ws://replacement','new-room','Next');const current=f.Socket.instances[1];current.emit('open');
 f.socket.fail=true;f.socket.emit('error');f.socket.emit('close');assert.equal(f.api.overview().connected,true);assert.equal(f.api.overview().room,'new-room');
});
