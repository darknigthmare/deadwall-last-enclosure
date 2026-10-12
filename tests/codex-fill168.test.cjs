'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const F=require('../src/codex-fill168.js'),R=require('../src/codex3000-runtime.js'),G=require('../src/frontier-geometry.js'),Q=require('../src/codex3000-recipes159.js'),A=require('../src/codex-anchors160.js'),D=require('../src/seed-detail157.js'),W=require('../src/frontier-world.js'),S=require('../src/frontier-state.js'),P=require('../src/codex-plan165.js'),Coverage=require('../src/codex-coverage167.js');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),copy=x=>JSON.parse(JSON.stringify(x));
const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
function fixture(kind='shelf',minimum=3){
 const room={name:'Réserve',x:.4,y:.4,w:19.2,h:13.2};
 const p={id:'P0707',type:'warehouse',codex:'DW-0221',w:20,h:14,x:500,y:600,a:.43,levels:[0,1],generation:8,outdoor:[],parking:[]};
 const plan={rooms:[room],objects:[],stairs:[],walls:[{x:0,y:0,w:8.6,h:.24},{x:11.4,y:0,w:8.6,h:.24},{x:0,y:13.76,w:8.6,h:.24},{x:11.4,y:13.76,w:8.6,h:.24},{x:0,y:0,w:.24,h:14},{x:19.76,y:0,w:.24,h:14}]};
 const spec={nom:kind,asset:kind,quantite_par_espace:[minimum,minimum],gabarit_m:{longueur:1.2,largeur:.6,hauteur:1.8},degagement_min_m:1};
 const description={id:'DW-0221',rooms:[{...room,id:'storage',levels:[0,1],kit:Q.KITS.storage,exterior:false,authoredProps:[spec]}]};
 return {seed:42,p,z:0,plan,detail:{interior:[],outdoor:[]},description,geometry:G,recipes:Q,anchors:A};
}
test('168 minima: exact source furniture is placed, budgeted and deterministic without modifying existing objects',()=>{
 const a=fixture(),before=hash(a),b=F.enrich(a);assert.equal(hash(a),before);assert.equal(b.fill168.added,3);assert.equal(b.fill168.requests[0].unplaced,0);assert.ok(b.fill168.navigationChecked);assert.deepEqual(b,F.enrich(a));assert.strictEqual(F.enrich({...a,detail:b}),b);
 for(const o of b.interior){assert.equal(o.spriteWidth160,1.2);assert.equal(o.spriteHeight160,.6);assert.ok(o.anchored160&&o.fill168&&o.solid);assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.equal(o.utilityConnected168,false);assert.ok(b.interior.filter(x=>x!==o).every(x=>!hit(x,o,.02)&&!hit(x,o.front160,.02)));}
 assert.equal(new Set(b.interior.map(o=>o.id)).size,3);
});
test('168 equipment: each of the fifteen supported kinds has a real painter and a source-sized physical placement',()=>{
 const Art=require('../src/seed-detail-art157.js');assert.equal(F.TYPES.length,15);
 for(const kind of F.TYPES){assert.ok(Art.presentationFor(kind),kind);const b=F.enrich(fixture(kind,1));assert.equal(b.fill168.added,1,kind);assert.equal(b.interior[0].kind,kind);}
});
test('168 refusals: exterior, ambiguous rooms, wrong levels, invalid dimensions and unsupported supports never invent replacements',()=>{
 const cases=[a=>a.description.rooms[0].exterior=true,a=>a.description.rooms.push(copy(a.description.rooms[0])),a=>a.description.rooms[0].levels=[1],a=>a.description.rooms[0].authoredProps[0].gabarit_m.longueur=50,a=>a.description.rooms[0].authoredProps[0].degagement_min_m=3,a=>a.description.rooms[0].authoredProps[0].ancrage='îlot central',a=>a.description.rooms[0].authoredProps[0].quantite_par_espace=[3,1],a=>a.description.rooms[0].authoredProps[0].asset='imaginaryMachine'];
 for(const modify of cases){const a=fixture();modify(a);assert.equal(F.enrich(a).fill168.added,0);}
 for(const seed of [-1,1.1,4294967296,NaN,'42'])assert.throws(()=>F.enrich({...fixture(),seed}));
 const a=fixture();a.plan.walls.push({x:8.6,y:-1.5,w:2.8,h:2});const b=F.enrich(a);assert.equal(b.fill168.added,0);assert.equal(b.fill168.navigationChecked,false);
});
test('168 counting: scarce existing furniture satisfies mandatory minima, not optional duplicate rows',()=>{
 const a=fixture(),required=a.description.rooms[0].authoredProps[0];a.description.rooms[0].authoredProps.unshift({...copy(required),nom:'Optional',quantite_par_espace:[0,5]});
 a.plan.objects=[0,1,2].map(i=>({id:'old'+i,kind:'shelf',x:1+i*2,y:1,w:1.2,h:.6,amount:9,resource:'wood'}));
 const b=F.enrich(a);assert.equal(b.fill168.added,0);assert.equal(b.fill168.requests[0].existing,0);assert.equal(b.fill168.requests[1].existing,3);assert.ok(a.plan.objects.every(o=>o.amount===9));
 const capped=F.enrich(fixture('shelf',100));assert.ok(capped.fill168.added<=8);assert.ok(capped.fill168.requests[0].sourceCapped);assert.equal(capped.fill168.requests[0].unplaced,100-capped.fill168.added);
});
test('168 seats: preserve prior wall service fronts and composed-seat access zones',()=>{
 const a=fixture();a.detail.interior=[{id:'oldSeat',kind:'chair',x:5,y:5,w:.6,h:.6,solid:true,access165:{x:5,y:5.8,w:.8,h:1}},{id:'oldFridge',kind:'fridge',x:1,y:.28,w:.8,h:.8,solid:true,front160:{x:1,y:1.08,w:.8,h:1}}];
 const old=hash(a.detail),b=F.enrich(a);assert.equal(hash(a.detail),old);assert.deepEqual(b.interior.slice(0,2),a.detail.interior);
 for(const o of b.interior.filter(o=>o.fill168))assert.ok(a.detail.interior.every(x=>!hit(o,x.access165||x.front160,.025)));
});
test('168 source models: actual missing counts decrease without changing historical floors, stocks or exterior objects',()=>{
 let before=0,after=0,added=0,models=0;const kinds=new Set();
 for(const id of ['DW-0001','DW-0003','DW-0061','DW-0069','DW-0123','DW-0142','DW-0161','DW-0201','DW-0221','DW-0241','DW-0501'])for(const z of R.template(id).levels){
  const a=P.inspect(id,17117,z,5),b=P.inspect(id,17117,z,6);assert.deepEqual(a.p,b.p);assert.deepEqual(a.plan,b.plan);assert.deepEqual(a.details.outdoor,b.details.outdoor);assert.deepEqual(b.details.interior.filter(o=>!o.fill168),a.details.interior);
  const x=Coverage.compare(a),y=Coverage.compare(b);assert.ok(y.totals.furnitureBelowMinimum<=x.totals.furnitureBelowMinimum,id);before+=x.totals.furnitureBelowMinimum;after+=y.totals.furnitureBelowMinimum;added+=b.details.fill168.added;models++;
  for(const o of b.details.interior.filter(o=>o.fill168))kinds.add(o.kind);
 }
 assert.ok(added>5&&after<before,JSON.stringify({before,after,added}));console.log('FILL168_MODELS '+JSON.stringify({models,before,after,added,kinds:[...kinds]}));
});
test('168 native floor contracts: two seeds, all 62 native types and levels retain exact saved geometry and accessible anchors',()=>{
 let added=0,levels=0;for(const seed of [42,17117])for(const d of G.PRESETS){const p={...d,id:'P0510',type:d.id,x:600,y:700,a:.4,generation:7};p.parking=G.parking(p);p.outdoor=G.outdoor(p);
  for(const z of p.levels){levels++;const plan=G.plan(p,z),args={seed,p,z,plan,programme:p.codex,shapes:D.objects};let a=R.enrich({...args,detail:D.make(seed,p,z,plan)});a=R.dress({...args,detail:a});a=R.anchored({...args,detail:a});a=R.quantities({...args,detail:a});a=R.ensembles({...args,detail:a});
   const before=hash([p,plan,a]),b=R.fill({...args,detail:a});assert.equal(hash([p,plan,a]),before);assert.deepEqual(b.interior.filter(o=>!o.fill168),a.interior);assert.deepEqual(b.outdoor,a.outdoor);assert.deepEqual(b,R.fill({...args,detail:a}));
   const extras=b.interior.filter(o=>o.fill168),all=[...plan.walls,...plan.stairs,...plan.objects,...b.interior.filter(o=>o.solid!==false&&!o.dressing160)];assert.ok(extras.length<=24);
   for(const o of extras){added++;assert.ok(all.filter(x=>x!==o).every(x=>!hit(o,x,.02)&&!hit(o.front160,x,.02)),d.id);assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);}
   const base=Q.accessGrid(p,z,plan,a),next=Q.accessGrid(p,z,plan,b);if(base?.baseline){assert.ok(next.baseline);assert.ok(Q.anchorCells(p,z,plan,base).every(i=>next.reachable[i]));}
  }
 }
 assert.ok(added>0);console.log('FILL168_NATIVE '+JSON.stringify({nativeTypes:G.PRESETS.length,seeds:2,levels,added}));
});
test('168 real world: opt-in objects belong to the existing collision/visibility pipeline and replay after eviction',()=>{
 const a=W.create(17117,8,{detailVersion:5}),b=W.create(17117,8,{detailVersion:6});assert.equal(hash(a.pois),hash(b.pois));assert.equal(hash(a.roads),hash(b.roads));let added=0,sites=0;
 for(const p of b.pois.filter(p=>p.generation===8).slice(0,45)){const old=a.pois.find(o=>o.id===p.id),base=a.detailAt(old,0),next=b.detailAt(p,0);assert.deepEqual(a.plan(old,0),b.plan(p,0));assert.deepEqual(next.interior.filter(o=>!o.fill168),base.interior);assert.deepEqual(next.outdoor,base.outdoor);sites++;
  for(const o of next.interior.filter(o=>o.fill168)){const c=G.global(p,o.x+o.w/2,o.y+o.h/2);assert.equal(b.blocked(c.x,c.y,.05,0,p.id),true);const f=o.front160,start=G.global(p,f.x+f.w/2,f.y+f.h/2);assert.equal(b.line(start,c,0,p.id),false);added++;}
 }
 assert.ok(added>0);const p=b.pois.find(p=>p.generation===8),expected=hash(b.detailAt(p,0));for(const q of b.pois.slice(0,80))b.detailAt(q,0);assert.equal(hash(b.detailAt(p,0)),expected);console.log('FILL168_WORLD '+JSON.stringify({sites,added}));
});
test('168 activation: strict version, failed restore, occupied hands and repeat preserve the campaign',()=>{
 assert.equal(S.normalize({...S.initial(),detailVersion:6}).detailVersion,6);for(const v of [8,-1,1.5,'6',null,true])assert.throws(()=>S.normalize({...S.initial(),detailVersion:v}));
 const Ops=require('../src/world-pack131.js'),{boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
 const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 const snap=()=>{const s=g.serialize();delete s.timestamp;return s;},before=snap(),restore=g.restoreSave;
 g.restoreSave=()=>false;try{assert.equal(g.worldOps131.upgradeDetails159(6).ok,false);assert.deepEqual(snap(),before);}finally{g.restoreSave=restore;}
 g.player.reload=1;assert.equal(g.worldOps131.upgradeDetails159(6).ok,false);g.player.reload=0;
 const action=g.worldOps131.actions().find(a=>a.id==='fillDetails168');assert.ok(action&&!action.disabled);const result=action.run();assert.ok(result.ok,result.reason);const after=snap();assert.equal(after.frontier.detailVersion,6);after.frontier.detailVersion=before.frontier.detailVersion;assert.deepEqual(after,before);assert.equal(g.worldOps131.upgradeDetails159(6).ok,false);
});
