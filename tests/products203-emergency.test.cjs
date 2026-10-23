'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,pen}=require('./helpers/husbandry199.cjs');
const clone=value=>JSON.parse(JSON.stringify(value));
function setup(){
 const f=fixture(),p=pen();p.leather=4;p.meat=4;
 f.restore({version:1,next:2,behaviors:false,pens:[p],animals:[]});
 Object.assign(f.position,f.g.husbandry191.access(p));
 const h=f.g.husbandry191;assert.equal(h.begin('pack-leather',p.id).ok,true);
 for(let i=0;i<50&&h.busy();i++)h.step(.1);
 assert.equal(h.carryingProducts(),true);return {...f,h};
}
for(const reason of ['threat','reload','mounted','fire-tool','other-intervention'])test('203 emergency drop is allowed during '+reason+' without a new payment or a transfer',()=>{
 const f=setup(),{g,h}=f,bag=clone(g.player.carry),before=h.snapshot();
 const notifications=[];g.notify=text=>notifications.push(text);
 if(reason==='threat')g.frontier.contacts=()=>[{x:f.position.x+.5,y:f.position.y,z:0,hp:100}];
 if(reason==='reload')g.player.reload=2;
 if(reason==='mounted')g.fieldcraft={context:()=>({mounted:true})};
 if(reason==='fire-tool')g.siege={toolActive:()=>true};
 if(reason==='other-intervention')g.expansions.busy=()=>true;
 const q=h.quote('drop-products');assert.equal(q.ok,true,q.reason);
 assert.equal(h.begin('drop-products').ok,true);assert.equal(h.carryingProducts(),false);
 assert.equal(h.overview().summary,'Colis posé au sol.','a drop without a husbandry task must not claim an interruption');
 assert.equal(notifications.at(-1),h.overview().summary);
 const after=h.snapshot();assert.deepEqual(after.pens,before.pens);
 assert.deepEqual(clone(after.cargo203),{...clone(before.cargo203),stage:'ground',point:{x:f.position.x,y:f.position.y}});
 assert.deepEqual(g.player.carry,bag);assert.equal(h.begin('drop-products').ok,false);
 if(reason==='threat')assert.equal(h.begin('pickup-products').ok,false,'emergency release must not waive safe pickup');
});
test('203 emergency drop cancels an in-progress delivery without crediting the destination',()=>{
 const {g,h,position}=setup(),before=h.snapshot(),bag=clone(g.player.carry);
 const notifications=[];g.notify=text=>notifications.push(text);
 assert.equal(h.begin('unpack-products',1).ok,true);h.step(.1);
 const action=h.actions().find(a=>a.id==='drop-products:null:null');assert.ok(action,'the real dossier must expose the emergency action while working');assert.equal(action.disabled,false);
 const interrupted=clone(h.snapshot());
 assert.equal(action.run().ok,true);assert.equal(h.busy(),false);
 assert.deepEqual(clone(h.snapshot().pens),interrupted.pens,'putting down the parcel cannot credit or debit any enclosure');
 assert.match(h.overview().summary,/Colis posé ; intervention interrompue, fournitures engagées non remboursées/);
 assert.equal(notifications.at(-1),h.overview().summary,'the player notification must preserve the interruption guidance');
 for(let i=0;i<100;i++)h.step(.1);
 const after=h.snapshot();assert.equal(after.pens[0].leather,before.pens[0].leather);assert.equal(after.cargo203.amount,before.cargo203.amount);assert.equal(after.cargo203.stage,'ground');
 assert.deepEqual(clone(after.cargo203.point),{x:position.x,y:position.y});assert.deepEqual(g.player.carry,bag);
});
for(const reason of ['dead','zero-health','game-over','menu','unavailable-controls','local','storey','driving'])test('203 emergency drop still refuses '+reason+' without mutation',()=>{
 const {g,h,position}=setup();
 if(reason==='dead')g.player.dead=true;if(reason==='zero-health')g.player.health=0;if(reason==='game-over')g.gameOver=true;
 if(reason==='menu')g.state='menu';if(reason==='unavailable-controls')g.expansions.canAct=()=>false;
 if(reason==='local')position.active=false;if(reason==='storey')position.z=1;if(reason==='driving')position.car={driving:true};
 const before=JSON.stringify(h.snapshot()),bag=clone(g.player.carry);
 assert.equal(h.begin('drop-products').ok,false);assert.equal(JSON.stringify(h.snapshot()),before);assert.deepEqual(g.player.carry,bag);
});
