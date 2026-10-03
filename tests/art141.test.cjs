'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Assets=require('../src/assets136.js'),B=require('../src/biomes135.js'),P=require('../src/atlas-projection.js'),Art=require('../src/art.js'),root=path.resolve(__dirname,'..');
global.Image=class{set src(v){this.onerror?.();}};const paintNode=Art.create().drawNode;delete global.Image;
const ctx=()=>({globalAlpha:1,save(){},restore(){},translate(){},rotate(){},scale(){}});
test('141 : deux sprites individuels natifs, dimensions et hashes de provenance, chargeur et cache PWA',()=>{
 const data=JSON.parse(fs.readFileSync(path.join(root,'assets/PROVENANCE_1_41.json'),'utf8'));assert.equal(data.images.length,2);assert.equal(Object.keys(Art.ASSETS).length,59);
 for(const item of data.images){const buf=fs.readFileSync(path.join(root,item.runtime)),spec=Assets.ASSETS141[item.id];assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(buf.readUInt32BE(16),spec.width);assert.equal(buf.readUInt32BE(20),spec.height);assert.equal(buf[25],6,'RGBA PNG');assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),item.sha256);assert.equal(item.alpha_extrema[0],0);assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes(item.runtime));}
});
test('141 G7 : D17 peint les mêmes espèces dérivées du biome régional, sans modifier les ressources',()=>{
 for(const type of['wood','stone']){const node={id:51,type,x:715,y:1380,radius:28,variant:0,amount:30,maxAmount:60},before={...node},game={world:{seed:17117},frontier:{position:()=>({generation:7})}},q=P.toRegion(node.x,node.y,game),profile=B[type==='wood'?'pickTree':'pickRock'](17117,q.x,q.y,'local:'+node.id,{generation:7}),key=Assets[type==='wood'?'TREE_SPRITES':'ROCK_SPRITES'][profile.species],draws=[],art={images:{[key]:{width:1254,height:1254}},rects:{},blit:(_c,id,...rest)=>draws.push({id,rest})};
  assert.equal(paintNode.call(art,ctx(),node,game),true);assert.equal(draws.length,1);assert.equal(draws[0].id,key);assert.deepEqual(node,before);
 }
});
test('141 : une ancienne ressource G6 et les grumes G7 conservent leur représentation historique',()=>{
 for(const [generation,variant,key]of [[6,0,'tree'],[7,2,'logs']]){const draws=[],art={images:{},rects:{['props:'+key]:[0,0,100,100]},blit:(_c,id)=>draws.push(id)},node={id:9,type:'wood',x:10,y:20,radius:30,amount:20,maxAmount:30,variant};assert.equal(paintNode.call(art,ctx(),node,{world:{seed:17117},frontier:{position:()=>({generation})}}),true);assert.deepEqual(draws,['props']);}
});
