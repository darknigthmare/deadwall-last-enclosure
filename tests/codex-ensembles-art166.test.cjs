'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../src/codex-ensembles165.js'),A=require('../src/seed-detail-art157.js'),I=require('../src/interior-art153.js'),S=require('../src/codex-dressing160.js');
function group(turn=0,profile='dining'){return E.composition({p:{id:'P0001'},z:0,groupId:'g',cx:5,cy:6,width:1.9,depth:.95,turn,seats:4,profile,room:{name:'Repas'},plane:'interior'});}
test('166 art: new dining tables use the bare atlas form, workshops their own workbench; old forms remain seed-selected',()=>{
 const old=globalThis.DeadwallInteriorArt153,painted=[];globalThis.DeadwallInteriorArt153={FURNITURE:I.FURNITURE,paint(c,art,sprite,o,options){painted.push({sprite,o,options});return true;}};
 try{
  for(const seed of [0,42,17117]){const o=group().table;assert.equal(A.paintImage({},o,{},seed),true);assert.strictEqual(painted.at(-1).sprite,I.FURNITURE.table[1]);
   const original={...o,profile165:undefined};assert.equal(A.paintImage({},original,{},seed),true);assert.strictEqual(painted.at(-1).sprite,I.FURNITURE.table[A.variantFor(original,seed,I.FURNITURE.table.length)]);
  }
  A.paintImage({},group(0,'workshop').table,{},42);assert.ok(I.FURNITURE.workbench.includes(painted.at(-1).sprite));
  const work={...group().table,kind:'worktable',profile165:undefined};A.paintImage({},work,{},42);assert.ok(I.FURNITURE.workbench.includes(painted.at(-1).sprite),'legacy worktable family preserved');
 }finally{if(old===undefined)delete globalThis.DeadwallInteriorArt153;else globalThis.DeadwallInteriorArt153=old;}
});
test('166 art: four orientations use centred support transforms and all save/restore pairs close even on failure',()=>{
 const old=globalThis.DeadwallInteriorArt153;globalThis.DeadwallInteriorArt153={FURNITURE:I.FURNITURE,paint(){return true;}};
 try{for(const turn of [0,1,2,3]){const calls=[],c=new Proxy({depth:0,save(){this.depth++;},restore(){this.depth--;},translate(...a){calls.push(['translate',...a]);},rotate(a){calls.push(['rotate',a]);}}, {get(t,k){return k in t?t[k]:()=>{};}}),o=group(turn).table,before=JSON.stringify(o);
  assert.ok(A.draw(c,o,{art:{},seed:42}));assert.equal(c.depth,0);assert.ok(calls.some(a=>a[0]==='rotate'&&a[1]===turn*Math.PI/2));assert.ok(calls.some(a=>a[0]==='translate'&&Math.abs(a[1]-5)<1e-9&&Math.abs(a[2]-6)<1e-9));assert.equal(JSON.stringify(o),before);
  globalThis.DeadwallInteriorArt153.paint=()=>{throw Error('paint failed');};assert.throws(()=>A.draw(c,o,{art:{},seed:42}),/paint failed/);assert.equal(c.depth,0);globalThis.DeadwallInteriorArt153.paint=()=>true;
  assert.equal(A.draw(c,{...o,spriteWidth165:0}),false);assert.equal(c.depth,0);
 }}finally{if(old===undefined)delete globalThis.DeadwallInteriorArt153;else globalThis.DeadwallInteriorArt153=old;}
});
test('166 art: contents follow table rotation, stay decorative and are ordered just above their own support',()=>{
 const G=require('../src/frontier-geometry.js');require('../src/frontier-art.js');
 const p={w:10,h:12,x:5,y:6,a:.63};
 for(const turn of [0,1,2,3]){const t=group(turn).table,vertical=turn%2,w=vertical?.24:.6,h=vertical?.6:.24,o={id:'content',kind:'dressing160',style:'dishes',variant:0,x:5-w/2,y:6-h/2,w,h,surfaceAngle165:turn*Math.PI/2,surfaceWidth165:.6,surfaceHeight165:.24,solid:false,dressing160:true,supportBounds:{x:t.x,y:t.y,w:t.w,h:t.h}};
  let depth=0;const rotations=[],c=new Proxy({save(){depth++;},restore(){depth--;},rotate(a){rotations.push(a);}}, {get(t,k){return t[k]||(()=>{});}});
  assert.equal(A.draw(c,o,{art:null}),true);assert.equal(depth,0);assert.ok(rotations.includes(turn*Math.PI/2));assert.equal(o.amount,undefined);
  assert.ok(Math.abs(globalThis.DeadwallFrontierArt.rectDepth(p,o)-globalThis.DeadwallFrontierArt.rectDepth(p,t)-.0001)<1e-9);
 }
});
