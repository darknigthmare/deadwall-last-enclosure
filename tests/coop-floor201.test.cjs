'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const H=require('./helpers/vertical177.cjs');
class Socket{
 constructor(){this.readyState=0;this.bufferedAmount=0;this.sent=[];this.handlers={};Socket.current=this;}
 addEventListener(k,f){this.handlers[k]=f;}
 send(s){this.sent.push(JSON.parse(s));}
 close(){this.readyState=3;}
 emit(k,data){if(k==='open')this.readyState=1;this.handlers[k]?.({data});}
}
const stable=g=>{const{timestamp,...s}=g.serialize();return s;};
function connect(g,t){
 const previous=globalThis.WebSocket;globalThis.WebSocket=Socket;
 t.after(()=>{g.coop.disconnect();globalThis.WebSocket=previous;});
 assert.ok(g.coop.connect('ws://fixture','audit','Alice'));const socket=Socket.current;socket.emit('open');
 const ack=()=>socket.emit('message',JSON.stringify({type:'joined',protocol:200,id:'self',space:socket.sent.findLast(m=>m.type==='join').space}));
 return{socket,ack,receive:m=>socket.emit('message',JSON.stringify(m))};
}
test('201 native D-17 stairs isolate actual decks, transmit physical local coordinates and never mutate the save',t=>{
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();
 // Declared late-age fixture: resources and age prepare access. Support payment,
 // placement and stair travel use the actual production controllers.
 const raw=g.serialize();raw.urban.peakScore=2200;raw.urban.progression151={version:1,age:4};
 raw.resources={wood:3000,scrap:3000,stone:3000,food:3000,fuel:2000,ammo:3000,medicine:50};
 assert.equal(g.restoreSave(raw),true);g.paused=false;g.activeOverlay=null;
 const first=H.build(g);H.ascend(g,first);assert.equal(g.vertical175.pose().z,6);
 assert.equal(g.frontier.position().active,false);assert.equal(g.frontier.position().z,0,'regional state remains on the ground');
 const before=stable(g),f=connect(g,t),old=f.socket.sent[0].space;
 assert.equal(old.region,false);assert.equal(old.z,6);assert.equal(old.inside,'D17:'+first.id);
 f.ack();g.coop.update(.3);const state=f.socket.sent.at(-1);
 assert.equal(state.type,'state');assert.equal(state.state.active,false);assert.equal(state.state.z,6);
 assert.equal(state.state.x,g.player.x);assert.equal(state.state.y,g.player.y);
 f.receive({type:'peer',id:'friend',space:old,state:{active:false,z:6,x:g.player.x,y:g.player.y}});
 assert.equal(g.coop.overview().peers.length,1);assert.equal(g.coop.ping(),false,'D-17 does not send a regional ping');
 assert.deepEqual(stable(g),before,'network reads and events cannot spend, advance or save anything');
 const down=g.vertical175.accessQuote(first.id,-1);assert.ok(down.ok,down.reason);assert.ok(g.vertical175.access(first.id,-1).ok);H.tick(g,down.seconds+.2);
 assert.equal(g.vertical175.pose().z,0);g.paused=true;
 assert.equal(g.coop.overview().compatible,false);assert.equal(g.coop.overview().peers.length,0,'old contacts disappear even during pause');
 g.paused=false;const second=H.build(g);H.ascend(g,second);assert.notEqual(second.id,first.id);assert.equal(g.vertical175.pose().z,6);
 const saved=stable(g);g.coop.update(.3);const join=f.socket.sent.at(-1);
 assert.equal(join.type,'join');assert.equal(join.space.z,6);assert.equal(join.space.inside,'D17:'+second.id);
 f.receive({type:'peer',id:'late',space:old,state:{active:false,z:6,x:1,y:2}});assert.equal(g.coop.overview().peers.length,0);
 f.ack();assert.equal(g.coop.overview().compatible,true);g.coop.update(.3);
 assert.equal(f.socket.sent.at(-1).state.z,6);assert.deepEqual(stable(g),saved);
});
test('201 an unavailable map clears its acknowledgement so the same recovered map can rejoin',t=>{
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();const f=connect(g,t);f.ack();
 assert.equal(g.coop.overview().compatible,true);const seed=g.world.seed,original=stable(g),count=f.socket.sent.length;
 g.world.seed=undefined;g.coop.update(.3);assert.equal(g.coop.overview().compatible,false);assert.equal(f.socket.sent.length,count);
 g.world.seed=seed;g.coop.update(.3);assert.equal(f.socket.sent.at(-1).type,'join');assert.equal(f.socket.sent.length,count+1);
 assert.equal(g.coop.overview().compatible,false);f.ack();assert.equal(g.coop.overview().compatible,true);
 g.coop.update(.3);assert.equal(f.socket.sent.at(-1).type,'state');assert.deepEqual(stable(g),original);
});
