'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {historicalPOI,historicalDetail}=require('../scripts/metric-compat185.cjs');
function detail(){return {interior:[{id:'old',x:1,solid:true,amount:12},{id:'p:dress160:1',kind:'dressing160',dressing160:true,solid:false,surface:false,decor157:true,plane:'furniture',x:1,y:2,z:0,w:1,h:1,supportBounds:{x:0,y:0,w:2,h:2}}],outdoor:[],dressing160:{interior:1,outdoor:0,wallMounted:0,collisionAdded:0,lootAdded:0},colliders160:{interior:[{id:'old',x:1,solid:true,amount:12}],outdoor:[]},programme3000:'DW-0001'};}
test('185 compatibility strips only reviewed visual additions and never mutates source data',()=>{
 const source=detail(),before=JSON.stringify(source),out=historicalDetail(source);
 assert.equal(JSON.stringify(source),before);assert.deepEqual(out,{interior:[source.interior[0]],outdoor:[],programme3000:'DW-0001'});
 const changed=detail();changed.interior[0].x=9;changed.interior[0].amount=11;changed.colliders160.interior=[{...changed.interior[0]}];assert.notDeepEqual(historicalDetail(changed),out,'moved source objects and finite quantities remain in the fingerprint');
});
for(const mutate of [d=>d.interior[1].solid=true,d=>d.interior[1].loot={ammo:1},d=>d.colliders160.interior.push({x:1}),d=>d.dressing160.lootAdded=1,d=>d.dressing160.interior=0])test('185 compatibility refuses a physical, resource or unreviewed addition '+String(mutate),()=>assert.throws(()=>historicalDetail((d=>{mutate(d);return d;})(detail()))));
test('185 compatibility retains every original implementation field and its serialization order',()=>{
 const original={fullyImplementedReference:false,scope:'single-ground-plane-visitable-route',closedDomains:[{id:'P1:closed',kind:'unavailable-upper-or-lower-reference-route'}]};
 const current={scope:original.scope,fullyImplementedReference:false,text:'Le parcours visitable reste au sol. Les parties hautes ou basses de la référence auteur sont fermées et ne donnent aucun passage supplémentaire.',closedDomain:'unavailable-upper-or-lower-reference-route',closedDomains:original.closedDomains};
 const poi={id:'P1',context160:{implementation160:current}},before=JSON.stringify(poi);
 assert.equal(JSON.stringify(historicalPOI(poi)),JSON.stringify({id:'P1',context160:{implementation160:original}}));assert.equal(JSON.stringify(poi),before);
 current.closedDomain='new route';assert.equal(historicalPOI(poi),poi,'unreviewed text or domain stays in the fingerprint');
});
