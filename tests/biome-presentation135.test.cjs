'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Art=require('../src/world-evolution-art.js');
test('G6 encounters render their real infected profiles through both regional painter entry points',()=>{
 const c=new Proxy({},{get:()=>()=>{},set:()=>true}),draws=[],g={world:{},player:{},elapsed:0,state:'playing',paused:false,settings:{},frontier:{visibleEnemy:()=>true},art:{drawActor(ctx,entity,kind){draws.push({kind,type:entity.type,maxHealth:entity.maxHealth});return true;}}};
 const kinds=['walker','runner','armored','crawler','breacher','stalker'],v={z:0,inside:null,world:{nearPOI:()=>[]},enemies:kinds.map((kind,i)=>({id:'enemy-'+i,x:i,y:0,z:0,kind,hp:42,maxHealth:65+i}))},view={l:-10,r:10,t:-10,b:10};
 Art.drawEnemies(c,g,v,view);assert.deepEqual(draws.map(d=>d.kind),['walkerAlt',...kinds.slice(1)]);assert.deepEqual(draws.map(d=>d.maxHealth),[65,66,67,68,69,70]);draws.length=0;
 for(const entry of Art.depthEntries(g,v,view,{companions:[],districts:[]}))entry.draw(c);assert.deepEqual(draws.map(d=>d.kind),['walkerAlt',...kinds.slice(1)]);assert.ok(draws.every(d=>d.type===d.kind));
});
