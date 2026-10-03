'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Assets=require('../src/assets136.js'),G=require('../src/frontier-geometry.js');
globalThis.DeadwallFrontierGeometry=G;require('../src/frontier-art.js');const Frontier=globalThis.DeadwallFrontierArt;
let native;try{native=require('@napi-rs/canvas');}catch{}

test('138 matériaux : deux ajouts distincts des 27 images conservées, sélection industrielle restrictive',()=>{
 assert.equal(Object.keys(Assets.ASSETS).length,27);assert.equal(Object.keys(Assets.ASSETS138).length,2);
 for(const type of Assets.INDUSTRIAL138){assert.equal(Assets.surfaceFor138(type,'roof'),'art138RoofMetal');assert.equal(Assets.surfaceFor138(type,'floor'),'art138InteriorConcrete');}
 for(const type of ['house','cabin','cottageSmall','garden','marketgarden','clinic','school','mall','ruin'])for(const part of ['roof','floor'])assert.equal(Assets.surfaceFor138(type,part),null,type+' '+part);
 assert.equal(Assets.surfaceFor138('basementHouse','floor',{z:-1}),'art138InteriorConcrete');assert.equal(Assets.surfaceFor138('basementHouse','floor',{z:0}),null);assert.equal(Assets.surfaceFor138('basementHouse','roof',{z:-1}),null);
 assert.equal(Assets.surfaceFor138('workshop','roof',{domain:'local'}),'art138RoofMetal');assert.equal(Assets.surfaceFor138('houseWide','roof',{domain:'local'}),null);
});
test('138 ombres : voitures, murs et meubles gardent le même vecteur monde après rotation',()=>{
 for(const a of [0,.37,Math.PI/2,Math.PI,Math.PI*1.67])for(const [x,y]of [[.08,.12],[.12,.16]]){
  const q=Frontier.localShadow(a,x,y);assert.ok(Math.abs(Math.cos(a)*q.x-Math.sin(a)*q.y-x)<1e-10);assert.ok(Math.abs(Math.sin(a)*q.x+Math.cos(a)*q.y-y)<1e-10);
 }
 const p={id:'rotated',type:'house',x:10,y:20,w:8,h:6,a:Math.PI,parking:[],outdoor:[]},obj={id:'desk',kind:'desk',x:2,y:2,w:2,h:1,amount:10};
 const calls=[],c=new Proxy({fillRect(...r){calls.push(r);},globalAlpha:1},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 const v={z:0,inside:p.id,taken:{},world:{plan:()=>({objects:[obj],walls:[{x:0,y:0,w:8,h:.24}]})}},g={worldEvolution:{structureDestroyed:()=>false}},before=JSON.stringify([p,obj,v.taken]);
 const entries=Frontier.lotEntries(g,p,v);entries.find(e=>e.kind==='furniture').draw(c);assert.deepEqual(calls[0],[1.92,1.88,2,1]);calls.length=0;entries.find(e=>e.kind==='wall').draw(c);assert.ok(Math.abs(calls[0][0]+.12)<1e-12&&Math.abs(calls[0][1]+.16)<1e-12);assert.equal(JSON.stringify([p,obj,v.taken]),before);
});
test('138 motifs natifs : dimensions et alpha des originaux, échelle monde, clip et caméra stables',{skip:!native},async()=>{
 globalThis.document={createElement:()=>native.createCanvas(1,1)};
 for(const [key,spec]of Object.entries(Assets.ASSETS138)){
  const im=await native.loadImage(spec.url);assert.equal(im.width,spec.width);assert.equal(im.height,spec.height);const art={images:{[key]:im},diagnostics:{draws:{}}};
  const render=(offset=0)=>{const canvas=native.createCanvas(256,256),c=canvas.getContext('2d');c.translate(-offset*32,0);c.scale(32,32);assert.equal(Assets.drawSurface138(c,art,key,0,0,12,8,{tile:4,alpha:1}),true);return canvas;};
  const a=render(),b=render(2);assert.deepEqual(a.getContext('2d').getImageData(64,0,192,256).data,b.getContext('2d').getImageData(0,0,192,256).data,'motif ancré au monde');
  const c=native.createCanvas(128,128).getContext('2d');c.scale(32,32);Assets.drawSurface138(c,art,key,1,1,2,2,{tile:4,alpha:1});const d=c.getImageData(0,0,128,128).data;for(const[x,y]of [[0,0],[31,31],[97,97],[127,127]])assert.equal(d[(y*128+x)*4+3],0,'pas de débordement');assert.equal(d[(64*128+64)*4+3],255);
  const cc=native.createCanvas(im.width,im.height).getContext('2d');cc.drawImage(im,0,0);const rgba=cc.getImageData(0,0,im.width,im.height).data;for(let i=3;i<rgba.length;i+=4)assert.equal(rgba[i],255,'matière opaque');
 }
});
test('138 motifs : les PNG absents gardent la peinture historique sans créer de motif',()=>{
 const c={createPattern(){assert.fail('image absente');}};assert.equal(Assets.drawSurface138(c,{images:{}},'art138RoofMetal',0,0,4,4),false);
});
