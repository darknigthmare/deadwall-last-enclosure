'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const G=require('../src/frontier-geometry.js'),R=require('../src/codex3000-runtime.js'),Q=require('../src/codex3000-recipes159.js');
const E=require('../src/codex-ensembles165.js'),D=require('../src/seed-detail157.js'),W=require('../src/frontier-world.js'),S=require('../src/frontier-state.js');
const digest=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
function fixture(){
 const p={id:'P0777',type:'diner',w:22,h:16,x:500,y:500,a:.43,levels:[0],generation:8,outdoor:[],parking:[]};
 const walls=[{x:0,y:0,w:9.5,h:.24},{x:12.5,y:0,w:9.5,h:.24},{x:0,y:15.76,w:9.5,h:.24},{x:12.5,y:15.76,w:9.5,h:.24},{x:0,y:0,w:.24,h:16},{x:21.76,y:0,w:.24,h:16}];
 const room={name:'Salle à manger',x:.4,y:.4,w:21.2,h:15.2};
 const plan={rooms:[room],walls,objects:[],stairs:[]},detail={interior:[],outdoor:[]};
 const description={id:'DW-0101',family:'Restauration',rooms:[{name:room.name,exterior:false,kit:Q.KITS.dining,authoredProps:[{asset:'table',nom:'Table source',quantite_par_espace:[2,2],gabarit_m:{longueur:1.9,largeur:.95,hauteur:.75},degagement_min_m:.9}]}]};
 return {seed:42,p,z:0,plan,detail,description,geometry:G,recipes:Q};
}
function validateGroups(a,b){
 const all=[...b.interior,...b.outdoor],by=new Map(all.map(o=>[o.id,o]));
 assert.equal(by.size,all.length,'all detail IDs unique');
 for(const g of b.ensembles165.groups){
  const parts=g.itemIds.map(id=>by.get(id));assert.equal(parts.length,g.seats+1);assert.ok([2,4].includes(g.seats));
  assert.equal(parts.filter(o=>o.kind==='table').length,1);assert.equal(parts.filter(o=>o.kind==='chair').length,g.seats);
  for(let i=0;i<parts.length;i++)for(const other of parts.slice(i+1))assert.ok(!hit(parts[i],other,.01),'siblings overlap');
  for(const o of parts){assert.ok(o.solid&&o.ensemble165);assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.equal(o.z,a.z);}
  const table=by.get(g.tableId),content=by.get(g.id+':contents');assert.ok(content&&!content.solid);assert.equal(content.supportId,table.id);
  assert.ok(content.x>=table.x&&content.x+content.w<=table.x+table.w&&content.y>=table.y&&content.y+content.h<=table.y+table.h);
  for(const zone of g.access)assert.ok([...a.plan.walls,...a.plan.objects,...all.filter(o=>o.solid)].every(o=>!hit(zone,o,.02)),'occupied seat access');
 }
 const before=Q.accessGrid(a.p,a.z,a.plan,a.detail),after=Q.accessGrid(a.p,a.z,a.plan,b);
 assert.ok(after.baseline);assert.ok(Q.anchorCells(a.p,a.z,a.plan,before).every(i=>after.reachable[i]));
 for(const g of b.ensembles165.groups)for(const z of g.access)assert.ok(after.reachable[after.at(z.x+z.w/2,z.y+z.h/2)]);
}
test('166 ensembles: complete table/seat compositions are deterministic, accessible, finite and append-only',()=>{
 const a=fixture(),before=digest(a),b=E.enrich(a);assert.equal(b.ensembles165.groups.length,2);assert.equal(digest(a),before);
 validateGroups(a,b);assert.deepEqual(E.enrich(a),b);assert.strictEqual(E.enrich({...a,detail:b}),b);
 assert.equal(b.ensembles165.requests[0].origin,'source');assert.equal(b.ensembles165.requests[0].unplaced,0);
});
test('166 ensembles: existing pictured tables are counted, not replaced or given duplicate seats',()=>{
 const a=fixture();a.plan.objects=[{id:'old-a',kind:'table',x:2,y:2,w:2,h:1,resource:'wood',amount:7},{id:'old-b',kind:'desk',x:16,y:2,w:2,h:1,resource:'scrap',amount:3}];
 const before=digest(a),b=E.enrich(a);assert.equal(b.ensembles165.groups.length,0);assert.equal(b.ensembles165.requests[0].reason,'already-present');assert.equal(digest(a),before);
});
test('166 ensembles: external source spaces, archive stores and corridors are not dining rooms',()=>{
 for(const name of ['Archives de stockage','Couloir','Chambre','Cuisine','Réserve']){const a=fixture();a.plan.rooms[0].name=name;a.description.rooms[0].name=name;a.description.rooms[0].kit=Q.kitFor(name);assert.equal(E.enrich(a).ensembles165.groups.length,0,name);}
 const a=fixture();a.description.rooms[0].exterior=true;assert.equal(E.enrich(a).ensembles165.groups.length,0);
});
test('166 ensembles: malformed or unsupported authored quantities and clearances fail closed',()=>{
 for(const value of [null,[],[3,2],[-1,2],[0,1.5],[0,Infinity]]){const a=fixture();a.description.rooms[0].authoredProps[0].quantite_par_espace=value;const b=E.enrich(a);assert.equal(b.ensembles165.groups.length,0);assert.equal(b.ensembles165.requests[0].reason,'invalid-source-quantity');}
 for(const value of [2.2,-1,NaN]){const a=fixture();a.description.rooms[0].authoredProps[0].degagement_min_m=value;assert.equal(E.enrich(a).ensembles165.requests[0].reason,'unsupported-source-clearance');}
 const a=fixture();a.description.rooms[0].authoredProps[0].quantite_par_espace=[0,0];assert.equal(E.enrich(a).ensembles165.groups.length,0);
 const b=fixture();b.description.rooms[0].authoredProps[0].quantite_par_espace=[20,40];const r=E.enrich(b);assert.equal(r.ensembles165.requests[0].sourceCapped,true);assert.ok(r.ensembles165.groups.length<=2);
});
test('166 ensembles: blocked entrances and old furniture service faces are never silently closed',()=>{
 const a=fixture();a.plan.walls.push({x:9.5,y:-1.5,w:3,h:2});const b=E.enrich(a);assert.equal(b.ensembles165.groups.length,0);assert.equal(b.ensembles165.navigationChecked,false);
 const c=fixture();c.detail.interior=[{id:'service',kind:'shelf',x:1,y:3,w:2,h:.7,solid:true,front160:{x:1,y:3.7,w:2,h:1.4}}];const rich=E.enrich(c);assert.ok(rich.ensembles165.groups.length>0);assert.strictEqual(rich.interior[0],c.detail.interior[0]);
 assert.ok(rich.interior.slice(1).filter(o=>o.solid).every(o=>!hit(o,c.detail.interior[0].front160,.02)));validateGroups(c,rich);
});
test('166 ensembles: terrace placement requires a real patio, respects cars and adds nothing upstairs',()=>{
 const a=fixture();a.plan.rooms=[];a.description.rooms=[];assert.equal(E.enrich(a).ensembles165.groups.length,0);
 a.detail.outdoor=[{id:'patio',kind:'patio',x:1,y:a.p.h+4,w:5,h:3,solid:false,surface:true}];const b=E.enrich(a);assert.ok(b.ensembles165.groups.length>0);assert.ok(b.ensembles165.groups.every(g=>g.plane==='outdoor'));
 const center=G.global(a.p,3.5,a.p.h+5.5);a.p.parking=[{id:'car',...center,w:8,h:5,a:a.p.a+.2}];assert.equal(E.enrich(a).ensembles165.groups.length,0);
 a.p.parking=[];a.z=1;assert.equal(E.enrich(a).ensembles165.groups.length,0);
});
test('166 ensembles: all 62 native types and levels across two seeds retain old navigation and source stocks',()=>{
 let places=0,floors=0,groups=0,seats=0,refused=0;const profiles=new Set();
 for(const seed of [42,17117])for(const d of G.PRESETS){
  const p={...d,type:d.id,id:'P0510',x:500,y:500,a:.27,generation:7};p.outdoor=G.outdoor(p);p.parking=G.parking(p);places++;
  for(const z of p.levels){
   const plan=G.plan(p,z);let prior=D.make(seed,p,z,plan);prior=R.enrich({seed,p,z,plan,detail:prior,programme:p.codex,shapes:D.objects});prior=R.dress({seed,p,z,plan,detail:prior});prior=R.anchored({seed,p,z,plan,detail:prior,programme:p.codex});prior=R.quantities({seed,p,z,plan,detail:prior,programme:p.codex});
   const before=digest([p,plan,prior]),rich=R.ensembles({seed,p,z,plan,detail:prior,programme:p.codex});assert.equal(digest([p,plan,prior]),before);
   assert.deepEqual(rich.interior.slice(0,prior.interior.length),prior.interior);assert.deepEqual(rich.outdoor.slice(0,prior.outdoor.length),prior.outdoor);
   assert.ok(rich.ensembles165.groups.length<=6&&rich.ensembles165.added<=30);
   if(rich.ensembles165.navigationChecked)validateGroups({p,z,plan,detail:prior},rich);
   for(const g of rich.ensembles165.groups){groups++;seats+=g.seats;profiles.add(g.profile);}
   refused+=rich.ensembles165.requests.reduce((n,r)=>n+r.unplaced,0);floors++;
  }
 }
 assert.ok(groups>20&&seats>40);console.log('ENSEMBLES166 '+JSON.stringify({places,floors,groups,seats,unplacedRequests:refused,profiles:[...profiles].sort()}));
});
test('166 ensembles: actual G8 revision 5 keeps G7/G8 plans and stocks and exposes physical new furniture',()=>{
 const a=W.create(17117,8,{detailVersion:4}),b=W.create(17117,8,{detailVersion:5});assert.equal(digest(a.pois),digest(b.pois));assert.equal(digest(a.roads),digest(b.roads));
 let count=0;const sites=b.pois.filter((p,i)=>i<20||p.generation===8).slice(0,40);
 for(const p of sites){const old=a.pois.find(x=>x.id===p.id),plan=b.plan(p,0),base=a.detailAt(old,0),rich=b.detailAt(p,0);assert.deepEqual(plan,a.plan(old,0));assert.deepEqual(rich.interior.filter(o=>!o.ensemble165),base.interior);assert.deepEqual(rich.outdoor.filter(o=>!o.ensemble165),base.outdoor);
  for(const o of [...rich.interior,...rich.outdoor].filter(o=>o.ensemble165&&o.solid)){
   const c=G.global(p,o.x+o.w/2,o.y+o.h/2);assert.ok(b.blocked(c.x,c.y,.05,0,p.id));assert.equal(b.line(G.global(p,o.x-.05,o.y+o.h/2),G.global(p,o.x+o.w+.05,o.y+o.h/2),0,p.id,null,.025),false);
   if(o.access165){const f=o.access165,point=G.global(p,f.x+f.w/2,f.y+f.h/2);assert.equal(b.blocked(point.x,point.y,.32,0,p.id),false,'real-world seat access');}
   assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);count++;
  }
 }
 assert.ok(count>0);console.log('PHYSICAL166 '+JSON.stringify({sites:sites.length,newSolidObjects:count}));
 const p=b.pois[0],before=digest(b.detailAt(p,0));for(const q of b.pois.slice(1,80))b.detailAt(q,0);assert.equal(digest(b.detailAt(p,0)),before);
 for(const v of [0,1,2,3,4,5])assert.equal(S.normalize({...S.initial(),detailVersion:v}).detailVersion,v);assert.throws(()=>S.normalize({...S.initial(),detailVersion:13}));
});
test('166 ensembles: revision-five activation is transactional, explicit and refuses repeat, reload and failed restore',()=>{
 const Ops=require('../src/world-pack131.js'),{boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
 const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 const snapshot=()=>{const d=g.serialize();delete d.timestamp;return d;},before=snapshot(),restore=g.restoreSave;
 const action=()=>g.worldOps131.actions().find(a=>a.id==='ensembleDetails165');assert.ok(action()&&!action().disabled);
 g.restoreSave=()=>false;try{assert.equal(action().run().ok,false);assert.deepEqual(snapshot(),before);}finally{g.restoreSave=restore;}
 g.player.reload=1;assert.ok(action().disabled);assert.equal(action().run().ok,false);g.player.reload=0;
 const r=action().run();assert.ok(r.ok,r.reason);const after=snapshot();assert.equal(after.frontier.detailVersion,5);after.frontier.detailVersion=before.frontier.detailVersion;assert.deepEqual(after,before);
 assert.ok(action().disabled);assert.equal(action().run().ok,false);assert.equal(g.worldOps131.upgradeDetails159(12).ok,false);
});
