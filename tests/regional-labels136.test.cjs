'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
require('../src/core.js');require('../src/frontier-geometry.js');require('../src/frontier-art.js');const Art=globalThis.DeadwallFrontierArt;
function context(){const labels=[],transforms=[];return{labels,transforms,save(){},restore(){},setTransform(...a){transforms.push(a);},measureText(s){return{width:String(s).length*6};},fillRect(){},fillText(text,x,y){labels.push({text,x,y,font:this.font});}};}
const place=(id,x=0,y=24,name=id)=>({id,x,y,w:10,h:10,a:0,name});
test('étiquettes régionales 1.36 : texte de 12 pixels écran aux zooms 6, 12 et 32, sans mutation du lieu',()=>{
 const places=[place('P0',0,24,'Atelier des Verrières')],before=JSON.stringify(places);for(const scale of[6,12,32]){const c=context(),boxes=Art.lotLabels(c,places,{x:0,y:0,scale},{width:640,height:480,dpr:2});assert.equal(boxes.length,1);assert.equal(c.labels[0].font,'12px sans-serif');assert.deepEqual(c.transforms[0],[2,0,0,2,0,0]);assert.equal(boxes[0].h,18);}assert.equal(JSON.stringify(places),before);
});
test('étiquettes régionales 1.36 : le lieu intérieur puis le repère priment, aucun rectangle ne se superpose',()=>{
 const places=[place('near',0,24,'Maison voisine'),place('inside',.1,24,'Lieu actuel'),place('pin',.2,24,'Destination'),place('other',-23,12,'Abri')];
 const draw=extra=>Art.lotLabels(context(),places,{x:0,y:0,scale:12,...extra},{width:800,height:500});
 assert.equal(draw({inside:'inside',pin:'pin'})[0].id,'inside');assert.equal(draw({pin:'pin'})[0].id,'pin');assert.equal(draw({})[0].id,'near');
 for(const boxes of[draw({inside:'inside'}),draw({pin:'pin'}),draw({})])for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.equal(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y,false);}
});
test('étiquettes régionales 1.36 : culling aux bords, nom long borné et retour D17 lisible',()=>{
 const c=context(),boxes=Art.lotLabels(c,[place('long',0,24,'Très longue enseigne '.repeat(20)),place('outside',1000,1000,'Hors écran')],{x:0,y:0,scale:12},{width:400,height:300,gates:[{id:'west',x:-10,y:-1}]});assert.ok(boxes.some(b=>b.id==='long'&&b.text.endsWith('…')));assert.ok(!boxes.some(b=>b.id==='outside'));assert.ok(boxes.some(b=>b.id==='gate:west'));for(const b of boxes){assert.ok(b.x>=6&&b.x+b.w<=394);assert.ok(b.y>=1&&b.y+b.h<=299);}assert.ok(c.labels.every(l=>l.font==='12px sans-serif'));
});
