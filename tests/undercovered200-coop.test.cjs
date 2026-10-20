'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Coop=require('../src/coop.js');
const space=(extra={})=>({seed:17117,generation:10,detail:13,ecology:1,hydrology:1,landscape:'balanced',region:true,z:0,inside:null,...extra});
function fixture(){
 class Socket{static current;constructor(){this.readyState=0;this.bufferedAmount=0;this.sent=[];this.handlers={};Socket.current=this;}addEventListener(k,f){this.handlers[k]=f;}send(t){this.sent.push(JSON.parse(t));}close(){this.readyState=3;}emit(k,data){if(k==='open')this.readyState=1;this.handlers[k]?.({data});}}
 const scope=space(),position={x:12,y:18,a:0},saved={ammo:17};let time=1000;
 const game={state:'playing',paused:false,world:{seed:17117},resources:saved,update(){return 5;},frontier:{active:()=>scope.region,position:()=>({...position,active:scope.region,generation:scope.generation,detailVersion:scope.detail,ecologyVersion:scope.ecology,hydrologyVersion:scope.hydrology,landscape189:scope.landscape,z:scope.z,inside:scope.inside}),overview(){throw Error('network must not generate a world or synchronize a save');}}};
 const ctx=vm.createContext({WebSocket:Socket,performance:{now:()=>time}});vm.runInContext(fs.readFileSync('src/coop.js','utf8'),ctx);const api=ctx.DeadwallCoop.install(game);assert.equal(api.connect('ws://relay','audit','Alice'),true);const socket=Socket.current;socket.emit('open');
 const receive=m=>socket.emit('message',JSON.stringify(m)),ack=()=>receive({type:'joined',protocol:200,id:'self',space:{...scope,seed:game.world.seed}});
 return{api,game,socket,scope,receive,ack,tick:dt=>time+=dt};
}
test('200 namespace normalization is canonical, bounded and does not accept inherited/extra owners',()=>{
 const s=space(),reversed=Object.fromEntries(Object.entries(s).reverse());assert.equal(Coop.spaceKey(s),Coop.spaceKey(reversed));
 for(const bad of [null,[],{...s,seed:'17117'},{...s,seed:-1},{...s,seed:2**32},{...s,z:Infinity},{...s,inside:{}},{...s,extra:1},Object.create(s),{...s,region:1}])assert.equal(Coop.normalizeSpace(bad),null);
 const normalized=Coop.normalizeSpace(s);normalized.seed=0;assert.equal(s.seed,17117);
});
test('200 current client requires a verified matching relay before position or ping transmission',()=>{
 const f=fixture();assert.equal(f.socket.sent[0].protocol,200);assert.equal(f.api.ping(),false);f.game.update(.1);assert.equal(f.socket.sent.length,1);
 f.receive({type:'joined',id:'legacy'});assert.match(f.api.overview().notice,/ancien/);assert.equal(f.api.overview().compatible,false);f.ack();assert.equal(f.api.overview().compatible,true);assert.equal(f.api.ping(),true);f.game.update(.3);f.game.update(.3);
 assert.ok(f.socket.sent.some(m=>m.type==='state'&&m.space.seed===17117));assert.deepEqual(f.game.resources,{ammo:17});
});
test('200 mismatched seed, revisions, scene, floor and interior never become a visible contact or ping',()=>{
 const f=fixture();f.ack();const variants=[{seed:9},{generation:8},{detail:1},{ecology:0},{hydrology:0},{landscape:'large'},{region:false},{z:1},{inside:'P0123'}];
 for(const delta of variants){f.receive({type:'peer',id:'other',space:space(delta),state:{x:2,y:3,active:true,z:0}});f.receive({type:'ping',space:space(delta),x:2,y:3});}
 f.receive({type:'peer',id:'old',state:{x:1,y:2}});f.receive({type:'ping',x:1,y:2});assert.equal(f.api.overview().peers.length,0);assert.equal(f.api.overview().pings.length,0);
 f.receive({type:'peer',id:'compatible',space:space(),state:{x:2,y:3,active:true,z:0}});f.receive({type:'ping',space:space(),x:2,y:3});assert.equal(f.api.overview().peers.length,1);assert.equal(f.api.overview().pings.length,1);
});
test('200 a scene change hides old peers immediately during pause and re-joins without duplicate state',()=>{
 const f=fixture();f.ack();f.receive({type:'peer',id:'friend',space:space(),state:{x:2,y:3,active:true,z:0}});f.receive({type:'ping',space:space(),x:2,y:3});f.game.paused=true;f.scope.z=2;
 const before=JSON.stringify(f.game.resources),count=f.socket.sent.length;assert.equal(f.api.overview().peers.length,0);assert.equal(f.api.overview().pings.length,0);assert.equal(f.socket.sent.length,count,'read-only inspection');
 assert.equal(f.api.ping(),false);assert.equal(f.socket.sent.at(-1).type,'join');assert.equal(f.socket.sent.at(-1).space.z,2);
 f.receive({type:'joined',protocol:200,space:space()});assert.equal(f.api.overview().compatible,false);f.ack();assert.equal(f.api.ping(),true);assert.equal(f.socket.sent.at(-1).space.z,2);assert.equal(JSON.stringify(f.game.resources),before);
});
test('200 forged position floor inside a valid envelope is refused',()=>{
 const f=fixture();f.ack();f.receive({type:'peer',id:'mismatch',space:space(),state:{x:1,y:2,active:true,z:1}});assert.equal(f.api.overview().peers.length,0);
});
test('200 scope re-join survives backpressure without using the previous map',()=>{
 const f=fixture();f.ack();f.scope.landscape='large';f.socket.bufferedAmount=1e7;assert.equal(f.api.ping(),false);assert.equal(f.api.overview().compatible,false);f.socket.bufferedAmount=0;assert.equal(f.api.ping(),false);f.ack();assert.equal(f.api.ping(),true);
});
